import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  createStripeClient,
  getStandardAccessPriceIds,
  hasStripeWebhookConfig
} from "@/lib/stripe/server";
import {
  assertPsychosocialCheckoutAuthority,
  assertPsychosocialSubscriptionAuthority,
  PsychosocialCheckoutAuthorityError
} from "@/lib/stripe/psychosocialCheckoutAuthority";
import {
  createSupabaseAdminClient,
  hasSupabaseAdminConfig
} from "@/lib/supabase/server";
import { updateUserAppMetadata } from "@/lib/supabase/accessMetadata";
import {
  SharedAccessConflictError,
  synchronizePsychosocialPurchase
} from "@/lib/supabase/sharedAccessSync";

export async function POST(request: Request) {
  if (!hasStripeWebhookConfig() || !hasSupabaseAdminConfig()) {
    return NextResponse.json(
      { error: "Stripe webhook settings are not configured." },
      { status: 503 }
    );
  }

  const stripe = createStripeClient();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 }
    );
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid webhook signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCompletedCheckout(stripe, event);
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await handleSubscriptionChange(
        stripe,
        event.data.object as Stripe.Subscription,
        event.type === "customer.subscription.updated"
      );
    }
  } catch (error) {
    console.error("Psychosocial Stripe event processing failed.", error);

    if (
      error instanceof PsychosocialCheckoutAuthorityError ||
      error instanceof SharedAccessConflictError
    ) {
      return NextResponse.json(
        { error: "Stripe event is not authorized for this facility account." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Stripe event could not be synchronized." },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

async function handleCompletedCheckout(stripe: Stripe, event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;

  if (session.payment_status !== "paid") {
    return;
  }

  const userId = session.metadata?.supabase_user_id;
  const subscriptionId = stripeObjectId(session.subscription);
  const customerId = stripeObjectId(session.customer);

  if (!userId || !subscriptionId) {
    throw new PsychosocialCheckoutAuthorityError(
      "Stripe checkout is missing its buyer or subscription binding."
    );
  }

  const [subscription, lineItems] = await Promise.all([
    stripe.subscriptions.retrieve(subscriptionId),
    stripe.checkout.sessions.listLineItems(session.id, { limit: 100 })
  ]);
  const { monthlyPriceId, upfrontPriceId } = getStandardAccessPriceIds();

  assertPsychosocialCheckoutAuthority({
    clientReferenceId: session.client_reference_id,
    expectedMonthlyPriceId: monthlyPriceId,
    expectedUpfrontPriceId: upfrontPriceId,
    lineItems: lineItems.data.map((item) => ({
      priceId: stripeObjectId(item.price),
      quantity: item.quantity
    })),
    sessionCustomerId: customerId,
    sessionMetadata: session.metadata ?? {},
    subscriptionCustomerId: stripeObjectId(subscription.customer),
    subscriptionMetadata: subscription.metadata,
    userId
  });

  const admin = createSupabaseAdminClient();
  const accessGrantedAt = new Date(event.created * 1000).toISOString();

  await synchronizePsychosocialPurchase(admin, {
    allowInactiveSubscriptionReplacement: true,
    checkoutSessionId: session.id,
    currentPeriodEnd: subscriptionCurrentPeriodEnd(subscription),
    stripeCustomerId: customerId as string,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
    upfrontPaidAt: accessGrantedAt,
    userId
  });

  await updateUserAppMetadata(admin, userId, {
    access_granted_at: accessGrantedAt,
    access_package: "standard_agency_access",
    billing_model: "upfront_plus_monthly",
    has_access: true,
    stripe_checkout_session_id: session.id,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status
  });

  const { error: profileUpdateError } = await admin
    .from("profiles")
    .update({
      access_granted_at: accessGrantedAt,
      has_access: true,
      stripe_checkout_session_id: session.id,
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString()
    })
    .eq("id", userId);

  if (profileUpdateError) {
    throw new Error(`Buyer profile synchronization failed: ${profileUpdateError.message}`);
  }
}

async function handleSubscriptionChange(
  stripe: Stripe,
  eventSubscription: Stripe.Subscription,
  refreshCurrent: boolean
) {
  const subscription = refreshCurrent
    ? await stripe.subscriptions.retrieve(eventSubscription.id)
    : eventSubscription;
  const userId = subscription.metadata?.supabase_user_id;
  const customerId = stripeObjectId(subscription.customer);

  if (!userId) {
    throw new PsychosocialCheckoutAuthorityError(
      "Stripe subscription is missing its buyer binding."
    );
  }

  const { monthlyPriceId } = getStandardAccessPriceIds();
  assertPsychosocialSubscriptionAuthority({
    customerId,
    expectedMonthlyPriceId: monthlyPriceId,
    items: subscription.items.data.map((item) => ({
      priceId: item.price.id,
      quantity: item.quantity ?? null
    })),
    metadata: subscription.metadata,
    userId
  });

  const admin = createSupabaseAdminClient();
  const hasAccess = isSubscriptionAccessActive(subscription.status);

  await synchronizePsychosocialPurchase(admin, {
    currentPeriodEnd: subscriptionCurrentPeriodEnd(subscription),
    stripeCustomerId: customerId as string,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
    userId
  });

  await updateUserAppMetadata(admin, userId, {
    has_access: hasAccess,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status
  });

  const { error: profileUpdateError } = await admin
    .from("profiles")
    .update({
      has_access: hasAccess,
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString()
    })
    .eq("id", userId);

  if (profileUpdateError) {
    throw new Error(`Buyer profile synchronization failed: ${profileUpdateError.message}`);
  }
}

function stripeObjectId(
  value: string | { id: string } | null | undefined
): string | null {
  return typeof value === "string" ? value : value?.id ?? null;
}

function subscriptionCurrentPeriodEnd(subscription: Stripe.Subscription) {
  const periodEnd = Math.max(
    0,
    ...subscription.items.data.map((item) => item.current_period_end ?? 0)
  );
  return periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
}

function isSubscriptionAccessActive(status: Stripe.Subscription.Status) {
  return status === "active" || status === "trialing";
}
