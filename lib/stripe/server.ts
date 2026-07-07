import "server-only";

import Stripe from "stripe";

type CheckoutLineItem = Stripe.Checkout.SessionCreateParams.LineItem;

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
        name: "Standard Agency Access - Upfront Access",
        description:
          "One-time upfront access charge for the hosted Psychosocial Intake Packet workflow."
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
        name: "Standard Agency Access - Hosted Access and Maintenance",
        description:
          "Monthly hosted access and maintenance for the Psychosocial Intake Packet workflow."
      },
      recurring: {
        interval: "month"
      },
      unit_amount: Number.isFinite(fallbackAmount) ? fallbackAmount : 1900
    }
  };
}
