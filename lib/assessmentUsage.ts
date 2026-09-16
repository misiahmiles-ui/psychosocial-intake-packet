import "server-only";

import {
  DEFAULT_ASSESSMENT_ENTITLEMENT_WINDOW_DAYS,
  DEFAULT_ASSESSMENT_INCLUDED_QUANTITY
} from "@/lib/assessmentEntitlementPolicy";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type AssessmentUsage = {
  includedQuantity: number;
  successfulGenerationsUsed: number;
  remainingGenerations: number;
  entitlementStartsAt: string;
  entitlementExpiresAt: string;
};

export type AssessmentEntitlementActivation =
  | {
      kind: "organization";
      organizationId: string;
      purchaseReference: string;
      startsAt: string;
    }
  | {
      kind: "user";
      userId: string;
      purchaseReference: string;
      startsAt: string;
    };

type ReservationResult = {
  allowed: boolean;
  reason:
    | "allowed"
    | "entitlement_exhausted"
    | "entitlement_inactive"
    | "entitlement_unavailable"
    | "rapid_limit";
  reservationId: string | null;
  includedQuantity: number;
  successfulGenerationsUsed: number;
  remainingGenerations: number;
  entitlementStartsAt: string | null;
  entitlementExpiresAt: string | null;
};

export type AssessmentGenerationConfig = {
  includedQuantity: number;
  entitlementWindowDays: number;
  rapidLimit: number;
  rapidWindowSeconds: number;
  reservationTtlSeconds: number;
  timeoutMs: number;
};

function integerEnvironmentValue(
  name: string,
  fallback: number,
  minimum: number,
  maximum: number
) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : fallback;
}

export function getAssessmentGenerationConfig(): AssessmentGenerationConfig {
  return {
    includedQuantity: integerEnvironmentValue(
      "PSYCHOSOCIAL_ASSESSMENT_INCLUDED_QUANTITY",
      DEFAULT_ASSESSMENT_INCLUDED_QUANTITY,
      1,
      1000
    ),
    entitlementWindowDays: integerEnvironmentValue(
      "PSYCHOSOCIAL_ASSESSMENT_ENTITLEMENT_WINDOW_DAYS",
      DEFAULT_ASSESSMENT_ENTITLEMENT_WINDOW_DAYS,
      1,
      365
    ),
    rapidLimit: integerEnvironmentValue(
      "PSYCHOSOCIAL_ASSESSMENT_RAPID_LIMIT",
      5,
      1,
      100
    ),
    rapidWindowSeconds: integerEnvironmentValue(
      "PSYCHOSOCIAL_ASSESSMENT_RAPID_WINDOW_SECONDS",
      60,
      10,
      3600
    ),
    reservationTtlSeconds: integerEnvironmentValue(
      "PSYCHOSOCIAL_ASSESSMENT_RESERVATION_TTL_SECONDS",
      600,
      60,
      3600
    ),
    timeoutMs: integerEnvironmentValue(
      "PSYCHOSOCIAL_ASSESSMENT_TIMEOUT_MS",
      75_000,
      5_000,
      120_000
    )
  };
}

export async function grantAssessmentGenerationEntitlement(
  activation: AssessmentEntitlementActivation
) {
  const config = getAssessmentGenerationConfig();
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc(
    "psychosocial_grant_assessment_generation_entitlement",
    {
      p_entitlement_window_days: config.entitlementWindowDays,
      p_included_quantity: config.includedQuantity,
      p_organization_id:
        activation.kind === "organization" ? activation.organizationId : null,
      p_purchase_reference: activation.purchaseReference,
      p_starts_at: activation.startsAt,
      p_user_id: activation.kind === "user" ? activation.userId : null
    }
  );

  if (error || typeof data !== "string") {
    throw new Error("Assessment generation entitlement could not be granted.");
  }
  return data;
}

export async function reserveAssessmentGeneration(
  userId: string,
  activation: AssessmentEntitlementActivation | null
): Promise<ReservationResult> {
  if (!activation) return unavailableReservation();

  const config = getAssessmentGenerationConfig();
  const entitlementId = await grantAssessmentGenerationEntitlement(activation);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc(
    "psychosocial_reserve_assessment_generation",
    {
      p_entitlement_id: entitlementId,
      p_rapid_limit: config.rapidLimit,
      p_rapid_window_seconds: config.rapidWindowSeconds,
      p_reservation_ttl_seconds: config.reservationTtlSeconds,
      p_user_id: userId
    }
  );
  if (error || !isReservationResult(data)) {
    throw new Error("Assessment generation entitlement could not be reserved.");
  }
  return data;
}

export async function completeAssessmentGeneration(
  userId: string,
  reservationId: string
): Promise<AssessmentUsage> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc(
    "psychosocial_complete_assessment_generation",
    {
      p_reservation_id: reservationId,
      p_user_id: userId
    }
  );
  if (error || !isUsage(data)) {
    throw new Error("Assessment generation entitlement could not be finalized.");
  }
  return data;
}

export async function releaseAssessmentGeneration(
  userId: string,
  reservationId: string
) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.rpc("psychosocial_release_assessment_generation", {
    p_reservation_id: reservationId,
    p_user_id: userId
  });
  if (error) {
    throw new Error("Assessment generation entitlement could not be released.");
  }
}

function isUsage(value: unknown): value is AssessmentUsage {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    Number.isInteger(item.includedQuantity) &&
    Number.isInteger(item.successfulGenerationsUsed) &&
    Number.isInteger(item.remainingGenerations) &&
    typeof item.entitlementStartsAt === "string" &&
    typeof item.entitlementExpiresAt === "string"
  );
}

function isReservationResult(value: unknown): value is ReservationResult {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.allowed === "boolean" &&
    [
      "allowed",
      "entitlement_exhausted",
      "entitlement_inactive",
      "entitlement_unavailable",
      "rapid_limit"
    ].includes(String(item.reason)) &&
    (typeof item.reservationId === "string" || item.reservationId === null) &&
    Number.isInteger(item.includedQuantity) &&
    Number.isInteger(item.successfulGenerationsUsed) &&
    Number.isInteger(item.remainingGenerations) &&
    (typeof item.entitlementStartsAt === "string" ||
      item.entitlementStartsAt === null) &&
    (typeof item.entitlementExpiresAt === "string" ||
      item.entitlementExpiresAt === null)
  );
}

function unavailableReservation(): ReservationResult {
  return {
    allowed: false,
    reason: "entitlement_unavailable",
    reservationId: null,
    includedQuantity: 0,
    successfulGenerationsUsed: 0,
    remainingGenerations: 0,
    entitlementStartsAt: null,
    entitlementExpiresAt: null
  };
}
