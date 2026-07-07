import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  createStripeClient,
  hasStripeWebhookConfig
} from "@/lib/stripe/server";
import {
  createSupabaseAdminClient,
  hasSupabaseAdminConfig
} from "@/lib/supabase/server";
import { updateUserAppMetadata } from "@/lib/supabase/accessMetadata";

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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.supabase_user_id ?? session.client_reference_id;

    if (userId && session.payment_status === "paid") {
      const admin = createSupabaseAdminClient();
      const customerId =
        typeof session.customer === "string" ? session.customer : null;

      await updateUserAppMetadata(admin, userId, {
        access_granted_at: new Date().toISOString(),
        access_package: "standard_agency_access",
        billing_model: "upfront_plus_monthly",
        has_access: true,
        stripe_checkout_session_id: session.id,
        stripe_customer_id: customerId
      });

      const { error: profileUpdateError } = await admin
        .from("profiles")
        .update({
          access_granted_at: new Date().toISOString(),
          has_access: true,
          stripe_checkout_session_id: session.id,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (profileUpdateError) {
        console.warn("Buyer profile table update skipped for checkout webhook.", {
          code: profileUpdateError.code,
          message: profileUpdateError.message
        });
      }
    }
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.supabase_user_id;
    const customerId =
      typeof subscription.customer === "string" ? subscription.customer : null;
    const hasAccess = isSubscriptionAccessActive(subscription.status);

    if (userId || customerId) {
      const admin = createSupabaseAdminClient();
      const update = {
        has_access: hasAccess,
        updated_at: new Date().toISOString()
      };

      if (userId) {
        await updateUserAppMetadata(admin, userId, {
          has_access: hasAccess,
          stripe_customer_id: customerId,
          subscription_status: subscription.status
        });

        const { error: profileUpdateError } = await admin
          .from("profiles")
          .update(update)
          .eq("id", userId);

        if (profileUpdateError) {
          console.warn("Buyer profile table update skipped for subscription webhook.", {
            code: profileUpdateError.code,
            message: profileUpdateError.message
          });
        }
      } else if (customerId) {
        const { error: profileUpdateError } = await admin
          .from("profiles")
          .update(update)
          .eq("stripe_customer_id", customerId);

        if (profileUpdateError) {
          console.warn("Buyer profile table customer update skipped.", {
            code: profileUpdateError.code,
            message: profileUpdateError.message
          });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}

function isSubscriptionAccessActive(status: Stripe.Subscription.Status) {
  return status === "active" || status === "trialing";
}
