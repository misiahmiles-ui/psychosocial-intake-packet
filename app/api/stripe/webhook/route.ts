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
      await admin
        .from("profiles")
        .update({
          access_granted_at: new Date().toISOString(),
          has_access: true,
          stripe_checkout_session_id: session.id,
          stripe_customer_id:
            typeof session.customer === "string" ? session.customer : null,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);
    }
  }

  return NextResponse.json({ received: true });
}
