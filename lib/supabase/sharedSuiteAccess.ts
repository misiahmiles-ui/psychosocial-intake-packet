import "server-only";

import {
  isActiveSubscriptionStatus,
  resolveWorkflowAccess,
  type SubscriptionPlan,
  type WorkflowProduct,
  type WorkflowSeatLimits
} from "@/lib/access/sharedSuiteRules";
import { createSupabaseAdminClient } from "./server";

type SupabaseAdminClient = ReturnType<typeof createSupabaseAdminClient>;

type MembershipRow = {
  organization_id: string;
  role: "facility_admin" | "staff";
};

type OrganizationRow = {
  facility_name: string;
  id: string;
};

type SubscriptionRow = {
  plan_code: SubscriptionPlan;
  status: string;
};

type EntitlementRow = {
  product_code: WorkflowProduct;
  seat_limit: number;
  status: string;
};

type AssignmentRow = {
  product_code: WorkflowProduct;
  user_id: string;
};

export function hasSharedSuiteAccessEnabled() {
  return process.env.SHARED_SUITE_ACCESS_ENABLED === "true";
}

export async function getSharedSuiteAccess(
  admin: SupabaseAdminClient,
  userId: string
) {
  const { data: memberships, error: membershipError } = await admin
    .from("organization_memberships")
    .select("organization_id,role")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(2);

  if (membershipError) {
    throw new Error(`Shared membership lookup failed: ${membershipError.message}`);
  }

  if ((memberships?.length ?? 0) > 1) {
    throw new Error(
      "Shared membership lookup failed: the account belongs to more than one facility."
    );
  }

  const membership = (memberships?.[0] ?? null) as MembershipRow | null;

  if (!membership) {
    return emptySharedAccess();
  }

  const [organizationResult, subscriptionResult, entitlementResult, assignmentResult] =
    await Promise.all([
      admin
        .from("organizations")
        .select("id,facility_name")
        .eq("id", membership.organization_id)
        .maybeSingle(),
      admin
        .from("organization_subscriptions")
        .select("plan_code,status")
        .eq("organization_id", membership.organization_id)
        .maybeSingle(),
      admin
        .from("organization_product_entitlements")
        .select("product_code,seat_limit,status")
        .eq("organization_id", membership.organization_id),
      admin
        .from("workflow_seat_assignments")
        .select("user_id,product_code")
        .eq("organization_id", membership.organization_id)
        .eq("user_id", userId)
    ]);

  const lookupError =
    organizationResult.error ??
    subscriptionResult.error ??
    entitlementResult.error ??
    assignmentResult.error;

  if (lookupError) {
    throw new Error(`Shared access lookup failed: ${lookupError.message}`);
  }

  const organization = organizationResult.data as OrganizationRow | null;
  const subscription = subscriptionResult.data as SubscriptionRow | null;
  const entitlements = (entitlementResult.data ?? []) as EntitlementRow[];
  const assignments = (assignmentResult.data ?? []) as AssignmentRow[];
  const subscriptionIsActive = isActiveSubscriptionStatus(
    subscription?.status ?? null
  );
  const seatLimits: WorkflowSeatLimits = { nursing: 0, psychosocial: 0 };
  const activeProducts = new Set<WorkflowProduct>();

  for (const entitlement of entitlements) {
    if (entitlement.status === "active" && subscriptionIsActive) {
      seatLimits[entitlement.product_code] = entitlement.seat_limit;
      activeProducts.add(entitlement.product_code);
    }
  }

  return {
    organizationId: membership.organization_id,
    organizationName: organization?.facility_name ?? null,
    organizationRole: membership.role,
    seatLimits,
    subscriptionPlan: subscription?.plan_code ?? null,
    workflowAccess: resolveWorkflowAccess({
      assignments: assignments
        .filter((assignment) => activeProducts.has(assignment.product_code))
        .map((assignment) => ({
          productCode: assignment.product_code,
          userId: assignment.user_id
        })),
      isProductOwner: false,
      subscriptionStatus: subscription?.status ?? null,
      userId
    })
  };
}

function emptySharedAccess() {
  return {
    organizationId: null,
    organizationName: null,
    organizationRole: null,
    seatLimits: { nursing: 0, psychosocial: 0 } satisfies WorkflowSeatLimits,
    subscriptionPlan: null,
    workflowAccess: { nursing: false, psychosocial: false }
  };
}
