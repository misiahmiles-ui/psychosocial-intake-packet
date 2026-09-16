import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type AssessmentUsage = {
  monthlyLimit: number;
  successfulGenerationsThisMonth: number;
  remainingSuccessfulGenerations: number;
};

type ReservationResult = AssessmentUsage & {
  allowed: boolean;
  reason: "allowed" | "monthly_quota" | "rapid_limit";
  reservationId: string | null;
};

export type AssessmentGenerationConfig = {
  monthlyLimit: number;
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
    monthlyLimit: integerEnvironmentValue(
      "PSYCHOSOCIAL_ASSESSMENT_MONTHLY_LIMIT",
      30,
      1,
      1000
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

export function currentAssessmentMonth(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    timeZone: "America/New_York",
    year: "numeric"
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  if (!year || !month) throw new Error("The assessment quota month could not be resolved.");
  return `${year}-${month}`;
}

export async function reserveAssessmentGeneration(
  userId: string
): Promise<ReservationResult> {
  const config = getAssessmentGenerationConfig();
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc(
    "psychosocial_reserve_assessment_generation",
    {
      p_month: currentAssessmentMonth(),
      p_monthly_limit: config.monthlyLimit,
      p_rapid_limit: config.rapidLimit,
      p_rapid_window_seconds: config.rapidWindowSeconds,
      p_reservation_ttl_seconds: config.reservationTtlSeconds,
      p_user_id: userId
    }
  );
  if (error || !isReservationResult(data)) {
    throw new Error("Assessment generation quota could not be reserved.");
  }
  return data;
}

export async function completeAssessmentGeneration(
  userId: string,
  reservationId: string
): Promise<AssessmentUsage> {
  const admin = createSupabaseAdminClient();
  const config = getAssessmentGenerationConfig();
  const { data, error } = await admin.rpc(
    "psychosocial_complete_assessment_generation",
    {
      p_monthly_limit: config.monthlyLimit,
      p_reservation_id: reservationId,
      p_user_id: userId
    }
  );
  if (error || !isUsage(data)) {
    throw new Error("Assessment generation quota could not be finalized.");
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
  if (error) throw new Error("Assessment generation quota could not be released.");
}

function isUsage(value: unknown): value is AssessmentUsage {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    Number.isInteger(item.monthlyLimit) &&
    Number.isInteger(item.successfulGenerationsThisMonth) &&
    Number.isInteger(item.remainingSuccessfulGenerations)
  );
}

function isReservationResult(value: unknown): value is ReservationResult {
  if (!isUsage(value)) return false;
  const item = value as unknown as Record<string, unknown>;
  return (
    typeof item.allowed === "boolean" &&
    ["allowed", "monthly_quota", "rapid_limit"].includes(String(item.reason)) &&
    (typeof item.reservationId === "string" || item.reservationId === null)
  );
}
