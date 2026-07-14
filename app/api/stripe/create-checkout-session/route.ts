import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  getBearerToken,
  hasSupabaseAdminConfig
} from "@/lib/supabase/server";
import {
  createStripeClient,
  getSiteUrl,
  getStandardAccessLineItems,
  hasStripeCheckoutConfig
} from "@/lib/stripe/server";
import {
  metadataHasAccess,
  metadataString,
  updateUserAppMetadata
} from "@/lib/supabase/accessMetadata";
import { resolveOwnerAuthorization } from "@/lib/supabase/ownerRole";
import {
  assertPsychosocialPurchaseAllowed,
  SharedAccessConflictError
} from "@/lib/supabase/sharedAccessSync";
import { hasCurrentLegalAcceptance } from "@/lib/legal/acceptance";

export async function POST(request: Request) {
  if (
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

  const admin = createSupabaseAdminClient();
  const {
    data: { user },
    error: userError
  } = await admin.auth.getUser(token);

  if (userError || !user?.email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const appMetadata = user.app_metadata as Record<string, unknown>;
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("account_role,agency_name,has_access,stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle<{
      account_role: string | null;
      agency_name: string | null;
      has_access: boolean;
      stripe_customer_id: string | null;
    }>();

  if (profileError) {
    console.warn("Buyer profile table could not be read for checkout.", {
      code: profileError.code,
      message: profileError.message
    });
  }

  const ownerAuthorization = resolveOwnerAuthorization({
    appMetadata,
    profileRole: profile?.account_role
  });

  if (ownerAuthorization.isOwner) {
    return NextResponse.json({ url: `${getSiteUrl()}/owner` });
  }

  try {
    if (!(await hasCurrentLegalAcceptance(admin, user.id))) {
      return NextResponse.json(
        {
          acceptanceUrl: "/legal/accept",
          error: "Review and accept the current Terms and Privacy Policy before checkout."
        },
        { status: 428 }
      );
    }
  } catch (legalError) {
    console.error("Checkout legal acceptance verification failed.", legalError);
    return NextResponse.json(
      { error: "Legal acceptance could not be verified." },
      { status: 503 }
    );
  }

  if (profile?.has_access || metadataHasAccess(appMetadata)) {
    return NextResponse.json({ url: `${getSiteUrl()}/dashboard` });
  }

  try {
    await assertPsychosocialPurchaseAllowed(
      admin,
      user.id,
      profile?.agency_name,
      { forNewCheckout: true }
    );
  } catch (sharedAccessError) {
    const isConflict = sharedAccessError instanceof SharedAccessConflictError;
    console.error("Psychosocial checkout authorization failed.", sharedAccessError);
    return NextResponse.json(
      {
        error: isConflict
          ? sharedAccessError.message
          : "Shared facility access could not be verified."
      },
      { status: isConflict ? 409 : 503 }
    );
  }

  const stripeCustomerId =
    profile?.stripe_customer_id ?? metadataString(appMetadata, "stripe_customer_id");
  const stripe = createStripeClient();
  const session = await stripe.checkout.sessions.create({
    allow_promotion_codes: false,
    billing_address_collection: "auto",
    client_reference_id: user.id,
    customer: stripeCustomerId ?? undefined,
    customer_email: stripeCustomerId ? undefined : user.email,
    line_items: getStandardAccessLineItems(),
    metadata: {
      access_package: "standard_agency_access",
      billing_model: "upfront_plus_monthly",
      plan_code: "psychosocial",
      product_code: "psychosocial",
      supabase_user_id: user.id
    },
    mode: "subscription",
    subscription_data: {
      metadata: {
        access_package: "standard_agency_access",
        billing_model: "upfront_plus_monthly",
        plan_code: "psychosocial",
        product_code: "psychosocial",
        supabase_user_id: user.id
      }
    },
    success_url: `${getSiteUrl()}/dashboard?checkout=success`,
    cancel_url: `${getSiteUrl()}/dashboard?checkout=cancelled`
  });

  const customerId =
    typeof session.customer === "string" ? session.customer : stripeCustomerId;

  await updateUserAppMetadata(admin, user.id, {
    access_package: "standard_agency_access",
    billing_model: "upfront_plus_monthly",
    stripe_checkout_session_id: session.id,
    stripe_customer_id: customerId
  });

  const { error: profileUpdateError } = await admin
    .from("profiles")
    .update({
      stripe_checkout_session_id: session.id,
      stripe_customer_id: customerId ?? null,
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id);

  if (profileUpdateError) {
    console.warn("Buyer profile table update skipped for checkout.", {
      code: profileUpdateError.code,
      message: profileUpdateError.message
    });
  }

  return NextResponse.json({ url: session.url });
}
