import "server-only";

import Stripe from "stripe";

export function hasStripeCheckoutConfig() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function hasStripeWebhookConfig() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET
  );
}

export function createStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Stripe secret key is not configured.");
  }

  return new Stripe(secretKey);
}

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.URL ??
    process.env.DEPLOY_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function getStandardAccessLineItem(): Stripe.Checkout.SessionCreateParams.LineItem {
  const priceId = process.env.STRIPE_STANDARD_ACCESS_PRICE_ID;

  if (priceId) {
    return {
      price: priceId,
      quantity: 1
    };
  }

  const fallbackAmount = Number(process.env.STANDARD_ACCESS_PRICE_CENTS ?? 49700);

  return {
    quantity: 1,
    price_data: {
      currency: "usd",
      unit_amount: Number.isFinite(fallbackAmount) ? fallbackAmount : 49700,
      product_data: {
        name: "Standard Agency Access",
        description:
          "One-time access to the hosted Psychosocial Intake Packet workflow."
      }
    }
  };
}
