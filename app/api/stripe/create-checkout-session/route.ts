import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  getBearerToken,
  hasSupabaseAdminConfig,
  hasSupabasePublicServerConfig
} from "@/lib/supabase/server";
import {
  createStripeClient,
  getSiteUrl,
  getStandardAccessLineItems,
  hasStripeCheckoutConfig
} from "@/lib/stripe/server";

export async function POST(request: Request) {
  if (
    !hasSupabasePublicServerConfig() ||
    !hasSupabaseAdminConfig() ||
    !hasStripeCheckoutConfig()
  ) {
    return NextResponse.json(
      { error: "Stripe/Supabase checkout settings are not configured." },
      { status: 503 }
    );
  }

  const token = getBearerToken(request);

  if (!token) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const authClient = createSupabaseServerClient(token);
  const {
    data: { user },
    error: userError
  } = await authClient.auth.getUser();

  if (userError || !user?.email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("has_access,stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle<{
      has_access: boolean;
      stripe_customer_id: string | null;
    }>();

  if (profile?.has_access) {
    return NextResponse.json({ url: `${getSiteUrl()}/dashboard` });
  }

  const stripe = createStripeClient();
  const session = await stripe.checkout.sessions.create({
    allow_promotion_codes: false,
    billing_address_collection: "auto",
    client_reference_id: user.id,
    customer: profile?.stripe_customer_id ?? undefined,
    customer_email: profile?.stripe_customer_id ? undefined : user.email,
    line_items: getStandardAccessLineItems(),
    metadata: {
      access_package: "standard_agency_access",
      billing_model: "upfront_plus_monthly",
      supabase_user_id: user.id
    },
    mode: "subscription",
    subscription_data: {
      metadata: {
        access_package: "standard_agency_access",
        billing_model: "upfront_plus_monthly",
        supabase_user_id: user.id
      }
    },
    success_url: `${getSiteUrl()}/dashboard?checkout=success`,
    cancel_url: `${getSiteUrl()}/dashboard?checkout=cancelled`
  });

  await admin
    .from("profiles")
    .update({
      stripe_checkout_session_id: session.id,
      stripe_customer_id:
        typeof session.customer === "string"
          ? session.customer
          : profile?.stripe_customer_id ?? null,
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id);

  return NextResponse.json({ url: session.url });
}
