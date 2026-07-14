import "server-only";

import {
  accountFacilityLocationKey,
  assertCustomerSeatEligible,
  buildPsychosocialPurchaseRecords
} from "@/lib/access/sharedAccountProvisioning";
import { createSupabaseAdminClient } from "./server";

type SupabaseAdminClient = ReturnType<typeof createSupabaseAdminClient>;

type CustomerContext = {
  agencyName: string | null;
  appMetadata: Record<string, unknown>;
  profileRole: string | null;
};

type MembershipRow = {
  organization_id: string;
  role: "facility_admin" | "staff";
  status: "active" | "invited" | "suspended";
};

type SubscriptionRow = {
  plan_code: "psychosocial" | "nursing" | "complete_suite";
  status: "incomplete" | "trialing" | "active" | "past_due" | "unpaid" | "canceled";
  stripe_subscription_id: string | null;
  upfront_paid_at: string | null;
};

export class SharedAccessConflictError extends Error {}

export async function createAccountOrganization(
  admin: SupabaseAdminClient,
  {
    facilityName,
    userId
  }: {
    facilityName?: string | null;
    userId: string;
  }
) {
  const customer = await getCustomerContext(admin, userId);
  const cleanFacilityName = facilityName?.trim() || customer.agencyName?.trim();

  if (!cleanFacilityName) {
    throw new Error("A facility name is required for shared account access.");
  }

  const { data: memberships, error: membershipLookupError } = await admin
    .from("organization_memberships")
    .select("organization_id,role,status")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(2);

  assertNoDatabaseError(membershipLookupError, "look up the facility membership");

  const existingMemberships = (memberships ?? []) as MembershipRow[];

  if (existingMemberships.length > 1) {
    throw new SharedAccessConflictError(
      "The buyer belongs to more than one facility account. Manual review is required."
    );
  }

  const existingMembership = existingMemberships[0];

  if (existingMembership) {
    if (existingMembership.status !== "active") {
      throw new SharedAccessConflictError(
        "The existing facility membership is not active."
      );
    }

    return existingMembership.organization_id;
  }

  const { data: organization, error: organizationError } = await admin
    .from("organizations")
    .upsert(
      {
        created_by: userId,
        facility_location_key: accountFacilityLocationKey(userId),
        facility_name: cleanFacilityName
      },
      { onConflict: "facility_location_key" }
    )
    .select("id,created_by")
    .single<{ created_by: string; id: string }>();

  assertNoDatabaseError(organizationError, "create the facility account");

  if (!organization?.id) {
    throw new Error("Shared facility account creation returned no organization ID.");
  }

  if (organization.created_by !== userId) {
    throw new SharedAccessConflictError(
      "The facility account owner does not match the buyer account."
    );
  }

  const { error: membershipError } = await admin
    .from("organization_memberships")
    .upsert(
      {
        created_by: userId,
        organization_id: organization.id,
        role: "facility_admin",
        status: "active",
        user_id: userId
      },
      { onConflict: "organization_id,user_id" }
    );

  assertNoDatabaseError(membershipError, "create the active facility membership");
  return organization.id;
}

export async function assertPsychosocialPurchaseAllowed(
  admin: SupabaseAdminClient,
  userId: string,
  facilityName?: string | null,
  { forNewCheckout = false }: { forNewCheckout?: boolean } = {}
) {
  const organizationId = await createAccountOrganization(admin, {
    facilityName,
    userId
  });

  const { data: purchaserMembership, error: purchaserMembershipError } =
    await admin
      .from("organization_memberships")
      .select("role,status")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .single<{ role: "facility_admin" | "staff"; status: string }>();

  assertNoDatabaseError(
    purchaserMembershipError,
    "verify the purchaser's facility authority"
  );

  if (
    purchaserMembership?.role !== "facility_admin" ||
    purchaserMembership.status !== "active"
  ) {
    throw new SharedAccessConflictError(
      "Only an active facility administrator may purchase workflow access."
    );
  }

  const [subscriptionResult, nursingEntitlementResult] = await Promise.all([
    admin
      .from("organization_subscriptions")
      .select("plan_code,status,stripe_subscription_id,upfront_paid_at")
      .eq("organization_id", organizationId)
      .maybeSingle<SubscriptionRow>(),
    admin
      .from("organization_product_entitlements")
      .select("product_code")
      .eq("organization_id", organizationId)
      .eq("product_code", "nursing")
      .maybeSingle<{ product_code: "nursing" }>()
  ]);

  assertNoDatabaseError(
    subscriptionResult.error,
    "look up the facility subscription"
  );
  assertNoDatabaseError(
    nursingEntitlementResult.error,
    "look up the Nursing entitlement"
  );

  if (
    forNewCheckout &&
    subscriptionResult.data?.stripe_subscription_id &&
    subscriptionResult.data.status !== "canceled" &&
    subscriptionResult.data.status !== "unpaid" &&
    subscriptionResult.data.status !== "incomplete"
  ) {
    throw new SharedAccessConflictError(
      "This facility already has a Psychosocial subscription that requires billing review."
    );
  }

  if (
    nursingEntitlementResult.data ||
    (subscriptionResult.data && subscriptionResult.data.plan_code !== "psychosocial")
  ) {
    throw new SharedAccessConflictError(
      "This facility already has another product plan. Use the future Complete Suite upgrade instead of replacing it."
    );
  }

  return {
    existingSubscription: subscriptionResult.data,
    organizationId
  };
}

export async function synchronizePsychosocialPurchase(
  admin: SupabaseAdminClient,
  {
    checkoutSessionId,
    currentPeriodEnd,
    facilityName,
    stripeCustomerId,
    stripeSubscriptionId,
    subscriptionStatus,
    upfrontPaidAt,
    userId,
    allowInactiveSubscriptionReplacement = false
  }: {
    checkoutSessionId?: string | null;
    currentPeriodEnd?: string | null;
    facilityName?: string | null;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    subscriptionStatus: string;
    upfrontPaidAt?: string | null;
    userId: string;
    allowInactiveSubscriptionReplacement?: boolean;
  }
) {
  const { existingSubscription, organizationId } =
    await assertPsychosocialPurchaseAllowed(admin, userId, facilityName);

  if (
    !allowInactiveSubscriptionReplacement &&
    (!existingSubscription?.stripe_subscription_id ||
      !existingSubscription.upfront_paid_at)
  ) {
    throw new SharedAccessConflictError(
      "The paid Psychosocial purchase has not been recorded for this facility."
    );
  }

  if (
    existingSubscription?.stripe_subscription_id &&
    existingSubscription.stripe_subscription_id !== stripeSubscriptionId
  ) {
    const oldSubscriptionIsReplaceable =
      existingSubscription.status === "canceled" ||
      existingSubscription.status === "unpaid" ||
      existingSubscription.status === "incomplete";

    if (!allowInactiveSubscriptionReplacement || !oldSubscriptionIsReplaceable) {
      throw new SharedAccessConflictError(
        "The Stripe subscription does not match this facility account."
      );
    }
  }

  const [organizationResult, profileResult] = await Promise.all([
    admin
      .from("organizations")
      .select("stripe_customer_id")
      .eq("id", organizationId)
      .single<{ stripe_customer_id: string | null }>(),
    admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single<{ stripe_customer_id: string | null }>()
  ]);

  assertNoDatabaseError(
    organizationResult.error,
    "verify the facility Stripe customer"
  );
  assertNoDatabaseError(profileResult.error, "verify the buyer Stripe customer");

  if (
    (organizationResult.data?.stripe_customer_id &&
      organizationResult.data.stripe_customer_id !== stripeCustomerId) ||
    (profileResult.data?.stripe_customer_id &&
      profileResult.data.stripe_customer_id !== stripeCustomerId)
  ) {
    throw new SharedAccessConflictError(
      "The Stripe customer does not match this facility account."
    );
  }

  const records = buildPsychosocialPurchaseRecords({
    checkoutSessionId,
    currentPeriodEnd,
    organizationId,
    stripeSubscriptionId,
    subscriptionStatus,
    upfrontPaidAt,
    userId
  });

  const { error: organizationUpdateError } = await admin
    .from("organizations")
    .update({ stripe_customer_id: stripeCustomerId })
    .eq("id", organizationId);
  assertNoDatabaseError(
    organizationUpdateError,
    "bind the Stripe customer to the facility"
  );

  const { error: subscriptionError } = await admin
    .from("organization_subscriptions")
    .upsert(records.subscription, { onConflict: "organization_id" });
  assertNoDatabaseError(subscriptionError, "synchronize the facility subscription");

  const { error: entitlementError } = await admin
    .from("organization_product_entitlements")
    .upsert(records.entitlement, {
      onConflict: "organization_id,product_code"
    });
  assertNoDatabaseError(
    entitlementError,
    "synchronize the Psychosocial entitlement"
  );

  const { data: existingAssignment, error: assignmentLookupError } = await admin
    .from("workflow_seat_assignments")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("product_code", "psychosocial")
    .maybeSingle<{ user_id: string }>();
  assertNoDatabaseError(
    assignmentLookupError,
    "look up the purchaser's Psychosocial seat"
  );

  // Avoid an upsert here: the database's BEFORE INSERT seat-limit trigger runs
  // before conflict resolution and would reject a legitimate webhook retry at 1/1.
  if (!existingAssignment) {
    const { error: assignmentError } = await admin
      .from("workflow_seat_assignments")
      .insert(records.assignment);
    assertNoDatabaseError(
      assignmentError,
      "assign the purchaser's Psychosocial seat"
    );
  }

  return organizationId;
}

export async function rollbackAccountSignup(
  admin: SupabaseAdminClient,
  userId: string
) {
  const { error: organizationDeleteError } = await admin
    .from("organizations")
    .delete()
    .eq("facility_location_key", accountFacilityLocationKey(userId))
    .eq("created_by", userId);
  assertNoDatabaseError(
    organizationDeleteError,
    "roll back the incomplete facility account"
  );

  const { error: profileDeleteError } = await admin
    .from("profiles")
    .delete()
    .eq("id", userId);
  assertNoDatabaseError(profileDeleteError, "roll back the incomplete buyer profile");

  const { error: userDeleteError } = await admin.auth.admin.deleteUser(userId);
  if (userDeleteError) {
    throw new Error(
      `Shared access could not roll back the incomplete buyer account: ${userDeleteError.message}`
    );
  }
}

async function getCustomerContext(
  admin: SupabaseAdminClient,
  userId: string
): Promise<CustomerContext> {
  const [userResult, profileResult] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin
      .from("profiles")
      .select("account_role,agency_name")
      .eq("id", userId)
      .maybeSingle<{ account_role: string | null; agency_name: string | null }>()
  ]);

  if (userResult.error || !userResult.data.user) {
    throw new Error(
      `Shared access could not verify the buyer account: ${userResult.error?.message ?? "User not found."}`
    );
  }

  assertNoDatabaseError(profileResult.error, "verify the buyer profile");

  const appMetadata = userResult.data.user.app_metadata as Record<string, unknown>;
  assertCustomerSeatEligible({
    appMetadata,
    profileRole: profileResult.data?.account_role
  });

  return {
    agencyName: profileResult.data?.agency_name ?? null,
    appMetadata,
    profileRole: profileResult.data?.account_role ?? null
  };
}

function assertNoDatabaseError(
  error: { message: string } | null,
  operation: string
) {
  if (error) {
    throw new Error(`Shared access could not ${operation}: ${error.message}`);
  }
}
