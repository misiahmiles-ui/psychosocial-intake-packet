export const WORKFLOW_PRODUCTS = ["psychosocial", "nursing"] as const;

export type WorkflowProduct = (typeof WORKFLOW_PRODUCTS)[number];
export type SubscriptionPlan =
  | "psychosocial"
  | "nursing"
  | "complete_suite";

export type WorkflowAccess = Record<WorkflowProduct, boolean>;
export type WorkflowSeatLimits = Record<WorkflowProduct, number>;

export type WorkflowSeatAssignment = {
  productCode: WorkflowProduct;
  userId: string;
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export function includedSeatLimitsForPlan(
  planCode: SubscriptionPlan
): WorkflowSeatLimits {
  if (planCode === "psychosocial") {
    return { nursing: 0, psychosocial: 1 };
  }

  if (planCode === "nursing") {
    return { nursing: 1, psychosocial: 0 };
  }

  return { nursing: 1, psychosocial: 1 };
}

export function isActiveSubscriptionStatus(status: string | null) {
  return status ? ACTIVE_SUBSCRIPTION_STATUSES.has(status) : false;
}

export function resolveWorkflowAccess({
  assignments,
  isProductOwner,
  subscriptionStatus,
  userId
}: {
  assignments: WorkflowSeatAssignment[];
  isProductOwner: boolean;
  subscriptionStatus: string | null;
  userId: string;
}): WorkflowAccess {
  if (isProductOwner) {
    return { nursing: true, psychosocial: true };
  }

  if (!isActiveSubscriptionStatus(subscriptionStatus)) {
    return { nursing: false, psychosocial: false };
  }

  return {
    nursing: assignments.some(
      (assignment) =>
        assignment.userId === userId && assignment.productCode === "nursing"
    ),
    psychosocial: assignments.some(
      (assignment) =>
        assignment.userId === userId &&
        assignment.productCode === "psychosocial"
    )
  };
}

export function canAssignWorkflowSeat({
  assignments,
  productCode,
  seatLimits,
  userId
}: {
  assignments: WorkflowSeatAssignment[];
  productCode: WorkflowProduct;
  seatLimits: WorkflowSeatLimits;
  userId: string;
}) {
  const alreadyAssigned = assignments.some(
    (assignment) =>
      assignment.userId === userId && assignment.productCode === productCode
  );

  if (alreadyAssigned) {
    return true;
  }

  const assignedSeats = new Set(
    assignments
      .filter((assignment) => assignment.productCode === productCode)
      .map((assignment) => assignment.userId)
  ).size;

  return assignedSeats < seatLimits[productCode];
}
