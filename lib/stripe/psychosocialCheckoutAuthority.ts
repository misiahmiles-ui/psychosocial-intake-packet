type PurchaseMetadata = Record<string, string | null | undefined>;

type CheckoutAuthorityInput = {
  clientReferenceId: string | null;
  expectedMonthlyPriceId: string;
  expectedUpfrontPriceId: string;
  lineItems: Array<{ priceId: string | null; quantity: number | null }>;
  sessionCustomerId: string | null;
  sessionMetadata: PurchaseMetadata;
  subscriptionCustomerId: string | null;
  subscriptionMetadata: PurchaseMetadata;
  userId: string;
};

export class PsychosocialCheckoutAuthorityError extends Error {}

export function assertPsychosocialCheckoutAuthority({
  clientReferenceId,
  expectedMonthlyPriceId,
  expectedUpfrontPriceId,
  lineItems,
  sessionCustomerId,
  sessionMetadata,
  subscriptionCustomerId,
  subscriptionMetadata,
  userId
}: CheckoutAuthorityInput) {
  assertPsychosocialMetadata(sessionMetadata, userId, "checkout session");
  assertPsychosocialMetadata(subscriptionMetadata, userId, "subscription");

  if (clientReferenceId !== userId) {
    throw new PsychosocialCheckoutAuthorityError(
      "Stripe checkout is not bound to the buyer account."
    );
  }

  if (!sessionCustomerId || sessionCustomerId !== subscriptionCustomerId) {
    throw new PsychosocialCheckoutAuthorityError(
      "Stripe customer binding does not match the subscription."
    );
  }

  const expected = new Map([
    [expectedUpfrontPriceId, 1],
    [expectedMonthlyPriceId, 1]
  ]);

  if (lineItems.length !== expected.size) {
    throw new PsychosocialCheckoutAuthorityError(
      "Stripe checkout contains unexpected line items."
    );
  }

  for (const item of lineItems) {
    if (!item.priceId || expected.get(item.priceId) !== item.quantity) {
      throw new PsychosocialCheckoutAuthorityError(
        "Stripe checkout prices or quantities are not approved."
      );
    }
    expected.delete(item.priceId);
  }

  if (expected.size > 0) {
    throw new PsychosocialCheckoutAuthorityError(
      "Stripe checkout is missing an approved price."
    );
  }
}

export function assertPsychosocialSubscriptionAuthority({
  customerId,
  expectedMonthlyPriceId,
  items,
  metadata,
  userId
}: {
  customerId: string | null;
  expectedMonthlyPriceId: string;
  items: Array<{ priceId: string | null; quantity: number | null }>;
  metadata: PurchaseMetadata;
  userId: string;
}) {
  assertPsychosocialMetadata(metadata, userId, "subscription");

  if (!customerId) {
    throw new PsychosocialCheckoutAuthorityError(
      "Stripe subscription is missing its customer binding."
    );
  }

  if (
    items.length !== 1 ||
    items[0]?.priceId !== expectedMonthlyPriceId ||
    items[0]?.quantity !== 1
  ) {
    throw new PsychosocialCheckoutAuthorityError(
      "Stripe subscription does not contain the approved monthly price."
    );
  }
}

function assertPsychosocialMetadata(
  metadata: PurchaseMetadata,
  userId: string,
  source: string
) {
  if (
    metadata.supabase_user_id !== userId ||
    metadata.product_code !== "psychosocial" ||
    metadata.plan_code !== "psychosocial" ||
    metadata.access_package !== "standard_agency_access" ||
    metadata.billing_model !== "upfront_plus_monthly"
  ) {
    throw new PsychosocialCheckoutAuthorityError(
      `Stripe ${source} metadata is not authorized for Psychosocial access.`
    );
  }
}
