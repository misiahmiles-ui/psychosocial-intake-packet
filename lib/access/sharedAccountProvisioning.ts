export type SharedSubscriptionStatus =
  | "incomplete"
  | "trialing"
  | "active"
  | "past_due"
  | "unpaid"
  | "canceled";

type PurchaseRecordInput = {
  checkoutSessionId?: string | null;
  currentPeriodEnd?: string | null;
  organizationId: string;
  stripeSubscriptionId: string;
  subscriptionStatus: string;
  upfrontPaidAt?: string | null;
  userId: string;
};

export function accountFacilityLocationKey(userId: string) {
  return `account:${userId}`;
}

export function assertCustomerSeatEligible({
  appMetadata,
  profileRole
}: {
  appMetadata?: Record<string, unknown>;
  profileRole: unknown;
}) {
  if (
    profileRole === "owner" ||
    appMetadata?.account_role === "owner" ||
    appMetadata?.owner_access === true
  ) {
    throw new Error("Product-owner access cannot consume a customer seat.");
  }
}

export function normalizeSharedSubscriptionStatus(
  status: string
): SharedSubscriptionStatus {
  if (
    status === "incomplete" ||
    status === "trialing" ||
    status === "active" ||
    status === "past_due" ||
    status === "unpaid" ||
    status === "canceled"
  ) {
    return status;
  }

  if (status === "incomplete_expired") {
    return "canceled";
  }

  // Stripe's paused state must not grant workflow access. The shared schema
  // intentionally stores it as a non-active billing state.
  return "past_due";
}

export function buildPsychosocialPurchaseRecords({
  checkoutSessionId,
  currentPeriodEnd,
  organizationId,
  stripeSubscriptionId,
  subscriptionStatus,
  upfrontPaidAt,
  userId
}: PurchaseRecordInput) {
  return {
    assignment: {
      assigned_by: userId,
      organization_id: organizationId,
      product_code: "psychosocial" as const,
      user_id: userId
    },
    entitlement: {
      included_seats: 1,
      organization_id: organizationId,
      product_code: "psychosocial" as const,
      status: "active" as const
    },
    subscription: {
      organization_id: organizationId,
      plan_code: "psychosocial" as const,
      status: normalizeSharedSubscriptionStatus(subscriptionStatus),
      stripe_subscription_id: stripeSubscriptionId,
      ...(checkoutSessionId
        ? { stripe_checkout_session_id: checkoutSessionId }
        : {}),
      ...(currentPeriodEnd ? { current_period_end: currentPeriodEnd } : {}),
      ...(upfrontPaidAt ? { upfront_paid_at: upfrontPaidAt } : {})
    }
  };
}
