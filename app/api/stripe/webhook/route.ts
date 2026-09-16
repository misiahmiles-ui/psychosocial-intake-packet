import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  createStripeClient,
  ensureAssessmentGenerationSubscription,
  getAssessmentGenerationMonthlyPriceId,
  getStandardAccessPriceIds,
  hasStripeWebhookConfig
} from "@/lib/stripe/server";
import {
  assertAssessmentGenerationSubscriptionAuthority,
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
import {
  createInitialAssessmentEntitlementGrant,
  createRecurringAssessmentEntitlementGrant,
  grantAssessmentGenerationEntitlement
} from "@/lib/assessmentUsage";
import { hasSharedSuiteAccessEnabled } from "@/lib/supabase/sharedSuiteAccess";

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

    if (event.type === "invoice.paid") {
      await handlePaidAssessmentGenerationInvoice(stripe, event);
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

  if (
    session.payment_status !== "paid" ||
    session.metadata?.product_code !== "psychosocial" ||
    session.metadata?.plan_code !== "psychosocial"
  ) {
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

  const organizationId = await synchronizePsychosocialPurchase(admin, {
    allowInactiveSubscriptionReplacement: true,
    checkoutSessionId: session.id,
    currentPeriodEnd: subscriptionCurrentPeriodEnd(subscription),
    stripeCustomerId: customerId as string,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
    upfrontPaidAt: accessGrantedAt,
    userId
  });

  const initialAssessmentEntitlement = createInitialAssessmentEntitlementGrant(
    hasSharedSuiteAccessEnabled()
      ? {
          kind: "organization",
          organizationId,
          purchaseReference: `stripe-checkout:${session.id}`,
          startsAt: accessGrantedAt
        }
      : {
          kind: "user",
          purchaseReference: `stripe-checkout:${session.id}`,
          startsAt: accessGrantedAt,
          userId
        }
  );
  await grantAssessmentGenerationEntitlement(initialAssessmentEntitlement);

  await ensureAssessmentGenerationSubscription(stripe, {
    customerId: customerId as string,
    initialWindowExpiresAt: initialAssessmentEntitlement.expiresAt,
    organizationId:
      initialAssessmentEntitlement.kind === "organization"
        ? initialAssessmentEntitlement.organizationId
        : undefined,
    parentCheckoutSessionId: session.id,
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

async function handlePaidAssessmentGenerationInvoice(
  stripe: Stripe,
  event: Stripe.Event
) {
  const invoice = event.data.object as Stripe.Invoice;
  const subscriptionId = stripeInvoiceSubscriptionId(invoice);

  if (!subscriptionId || !invoice.id || !isPaidAssessmentBillingCycle(invoice)) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  if (
    subscription.metadata.product_code !==
    "psychosocial_assessment_generations"
  ) {
    return;
  }

  const userId = subscription.metadata.supabase_user_id;
  const customerId = stripeObjectId(subscription.customer);
  const expectedMonthlyPriceId = getAssessmentGenerationMonthlyPriceId();

  if (!userId || stripeObjectId(invoice.customer) !== customerId) {
    throw new PsychosocialCheckoutAuthorityError(
      "Stripe assessment-generation invoice is missing its authorized customer binding."
    );
  }

  assertAssessmentGenerationSubscriptionAuthority({
    customerId,
    expectedMonthlyPriceId,
    items: subscription.items.data.map((item) => ({
      priceId: item.price.id,
      quantity: item.quantity ?? null
    })),
    metadata: subscription.metadata,
    userId
  });

  if (
    !invoice.lines.data.some(
      (line) => invoiceLinePriceId(line) === expectedMonthlyPriceId
    )
  ) {
    throw new PsychosocialCheckoutAuthorityError(
      "Stripe assessment-generation invoice does not contain the approved monthly price."
    );
  }

  const billingCycle = invoiceBillingCycle(invoice, expectedMonthlyPriceId);
  if (!billingCycle) {
    throw new PsychosocialCheckoutAuthorityError(
      "Stripe assessment-generation invoice is missing its billing-cycle window."
    );
  }

  const organizationId = subscription.metadata.organization_id;
  const recurringEntitlement = createRecurringAssessmentEntitlementGrant(
    subscription.metadata.generation_scope === "organization"
      ? {
          billingCycleEndsAt: billingCycle.endsAt,
          billingCycleStartsAt: billingCycle.startsAt,
          invoiceId: invoice.id,
          kind: "organization",
          organizationId: organizationId ?? "",
          subscriptionId
        }
      : {
          billingCycleEndsAt: billingCycle.endsAt,
          billingCycleStartsAt: billingCycle.startsAt,
          invoiceId: invoice.id,
          kind: "user",
          subscriptionId,
          userId
        }
  );

  if (
    recurringEntitlement.kind === "organization" &&
    !recurringEntitlement.organizationId
  ) {
    throw new PsychosocialCheckoutAuthorityError(
      "Stripe assessment-generation organization scope is missing."
    );
  }

  await grantAssessmentGenerationEntitlement(recurringEntitlement);
}

async function handleSubscriptionChange(
  stripe: Stripe,
  eventSubscription: Stripe.Subscription,
  refreshCurrent: boolean
) {
  const subscription = refreshCurrent
    ? await stripe.subscriptions.retrieve(eventSubscription.id)
    : eventSubscription;

  if (
    subscription.metadata?.product_code !== "psychosocial" ||
    subscription.metadata?.plan_code !== "psychosocial"
  ) {
    return;
  }
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

function stripeObjectId(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (
    value &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "string"
  ) {
    return value.id;
  }
  return null;
}

function subscriptionCurrentPeriodEnd(subscription: Stripe.Subscription) {
  const periodEnd = Math.max(
    0,
    ...subscription.items.data.map((item) => item.current_period_end ?? 0)
  );
  return periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
}

function stripeInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  const invoiceRecord = invoice as unknown as Record<string, unknown>;
  const legacySubscription = invoiceRecord.subscription;
  const parent = invoiceRecord.parent as
    | { subscription_details?: { subscription?: unknown } }
    | null
    | undefined;

  return stripeObjectId(
    legacySubscription ?? parent?.subscription_details?.subscription
  );
}

function invoiceLinePriceId(line: unknown) {
  const candidate = line as {
    price?: unknown;
    pricing?: { price_details?: { price?: unknown } };
  };
  return stripeObjectId(candidate.price ?? candidate.pricing?.price_details?.price);
}

function invoiceBillingCycle(invoice: Stripe.Invoice, expectedPriceId: string) {
  for (const line of invoice.lines.data) {
    if (invoiceLinePriceId(line) !== expectedPriceId) continue;
    const period = (line as unknown as {
      period?: { end?: unknown; start?: unknown };
    }).period;
    if (
      typeof period?.start === "number" &&
      typeof period.end === "number" &&
      period.end > period.start
    ) {
      return {
        endsAt: new Date(period.end * 1000).toISOString(),
        startsAt: new Date(period.start * 1000).toISOString()
      };
    }
  }
  return null;
}

function isPaidAssessmentBillingCycle(invoice: Stripe.Invoice) {
  const invoiceRecord = invoice as unknown as Record<string, unknown>;
  return (
    invoiceRecord.billing_reason === "subscription_cycle" &&
    typeof invoiceRecord.amount_paid === "number" &&
    invoiceRecord.amount_paid > 0
  );
}

function isSubscriptionAccessActive(status: Stripe.Subscription.Status) {
  return status === "active" || status === "trialing";
}
