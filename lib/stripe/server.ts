import "server-only";

import Stripe from "stripe";

type CheckoutLineItem = Stripe.Checkout.SessionCreateParams.LineItem;

export function hasStripeCheckoutConfig() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_STANDARD_ACCESS_UPFRONT_PRICE_ID &&
      process.env.STRIPE_STANDARD_ACCESS_MONTHLY_PRICE_ID &&
      process.env.STRIPE_PSYCHOSOCIAL_ASSESSMENT_GENERATIONS_MONTHLY_PRICE_ID
  );
}

export function hasStripeWebhookConfig() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.STRIPE_STANDARD_ACCESS_UPFRONT_PRICE_ID &&
      process.env.STRIPE_STANDARD_ACCESS_MONTHLY_PRICE_ID &&
      process.env.STRIPE_PSYCHOSOCIAL_ASSESSMENT_GENERATIONS_MONTHLY_PRICE_ID
  );
}

export function getStandardAccessPriceIds() {
  const upfrontPriceId = process.env.STRIPE_STANDARD_ACCESS_UPFRONT_PRICE_ID;
  const monthlyPriceId = process.env.STRIPE_STANDARD_ACCESS_MONTHLY_PRICE_ID;

  if (!upfrontPriceId || !monthlyPriceId) {
    throw new Error("Approved Psychosocial Stripe Price IDs are not configured.");
  }

  return { monthlyPriceId, upfrontPriceId };
}

export function getAssessmentGenerationMonthlyPriceId() {
  const priceId =
    process.env.STRIPE_PSYCHOSOCIAL_ASSESSMENT_GENERATIONS_MONTHLY_PRICE_ID;

  if (!priceId) {
    throw new Error("Assessment-generation Stripe Price ID is not configured.");
  }

  return priceId;
}

export function createStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Stripe secret key is not configured.");
  }

  return new Stripe(secretKey);
}

export async function ensureAssessmentGenerationSubscription(
  stripe: Stripe,
  {
    customerId,
    initialWindowExpiresAt,
    organizationId,
    parentCheckoutSessionId,
    userId
  }: {
    customerId: string;
    initialWindowExpiresAt: string;
    organizationId?: string;
    parentCheckoutSessionId: string;
    userId: string;
  }
) {
  const priceId = getAssessmentGenerationMonthlyPriceId();
  const existing = await stripe.subscriptions.list({
    customer: customerId,
    limit: 100,
    status: "all"
  });
  const matchingSubscription = existing.data.find(
    (subscription) =>
      subscription.metadata.parent_checkout_session_id ===
        parentCheckoutSessionId &&
      subscription.metadata.product_code ===
        "psychosocial_assessment_generations"
  );

  if (matchingSubscription) return matchingSubscription;

  const configuredTrialEnd = Math.floor(
    new Date(initialWindowExpiresAt).getTime() / 1000
  );
  const trialEnd = Math.max(
    configuredTrialEnd,
    Math.floor(Date.now() / 1000) + 60
  );

  return stripe.subscriptions.create(
    {
      collection_method: "charge_automatically",
      customer: customerId,
      items: [{ price: priceId, quantity: 1 }],
      metadata: {
        ...(organizationId ? { organization_id: organizationId } : {}),
        generation_scope: organizationId ? "organization" : "user",
        parent_checkout_session_id: parentCheckoutSessionId,
        product_code: "psychosocial_assessment_generations",
        supabase_user_id: userId
      },
      trial_end: trialEnd
    },
    {
      idempotencyKey: `psychosocial-assessment-generations:${parentCheckoutSessionId}`
    }
  );
}

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.URL ??
    process.env.DEPLOY_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function getStandardAccessLineItems(): CheckoutLineItem[] {
  return [
    getStandardAccessUpfrontLineItem(),
    getStandardAccessMonthlyLineItem()
  ];
}

function getStandardAccessUpfrontLineItem(): CheckoutLineItem {
  const priceId = process.env.STRIPE_STANDARD_ACCESS_UPFRONT_PRICE_ID;

  if (priceId) {
    return {
      price: priceId,
      quantity: 1
    };
  }

  const fallbackAmount = Number(
    process.env.STANDARD_ACCESS_UPFRONT_PRICE_CENTS ?? 48700
  );

  return {
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: Number.isFinite(fallbackAmount) ? fallbackAmount : 48700,
      product_data: {
        name: "Adult Day Intake Pro™ - Standard Agency Access",
        description:
          "Upfront access fee for the hosted psychosocial intake and PDF documentation workflow."
      }
    }
  };
}

function getStandardAccessMonthlyLineItem(): CheckoutLineItem {
  const priceId = process.env.STRIPE_STANDARD_ACCESS_MONTHLY_PRICE_ID;

  if (priceId) {
    return {
      price: priceId,
      quantity: 1
    };
  }

  const fallbackAmount = Number(
    process.env.STANDARD_ACCESS_MONTHLY_PRICE_CENTS ?? 1900
  );

  return {
    quantity: 1,
    price_data: {
      currency: "usd",
      product_data: {
        name: "Adult Day Intake Pro™ - Hosted Access and Maintenance",
        description:
          "Monthly hosted access and standard maintenance for the hosted psychosocial intake and PDF documentation workflow."
      },
      recurring: {
        interval: "month"
      },
      unit_amount: Number.isFinite(fallbackAmount) ? fallbackAmount : 1900
    }
  };
}
