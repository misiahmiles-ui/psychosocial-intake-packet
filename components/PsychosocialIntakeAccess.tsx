"use client";

import { useSearchParams } from "next/navigation";
import { IntakeApp } from "@/components/IntakeApp";
import {
  ProtectedAccess,
  type ActiveAccessDetails
} from "@/components/auth/ProtectedAccess";
import type { PsychosocialJurisdiction } from "@/types/intake";

export function PsychosocialIntakeAccess() {
  const searchParams = useSearchParams();

  return (
    <ProtectedAccess>
      {(access) => (
        <IntakeApp
          jurisdiction={resolveRequestedJurisdiction(
            searchParams.get("edition"),
            access
          )}
        />
      )}
    </ProtectedAccess>
  );
}

function resolveRequestedJurisdiction(
  requested: string | null,
  access: ActiveAccessDetails
): PsychosocialJurisdiction {
  const normalized = requested?.toUpperCase();
  const allowed = access.psychosocialJurisdictions.length
    ? access.psychosocialJurisdictions
    : (["NJ"] as PsychosocialJurisdiction[]);

  if (
    (normalized === "NJ" || normalized === "MD") &&
    allowed.includes(normalized)
  ) {
    return normalized;
  }

  return allowed[0];
}
