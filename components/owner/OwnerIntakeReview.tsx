"use client";

import { OwnerAccess } from "@/components/auth/OwnerAccess";
import { IntakeApp, type IntakeAccessMode } from "@/components/IntakeApp";
import type { IntakePacket, PsychosocialJurisdiction } from "@/types/intake";

type OwnerIntakeReviewProps = {
  accessMode: IntakeAccessMode;
  autoPrint?: boolean;
  demonstrationLoaded?: boolean;
  initialPacket?: IntakePacket;
  initialStepIndex?: number;
  jurisdiction?: PsychosocialJurisdiction;
};

export function OwnerIntakeReview(props: OwnerIntakeReviewProps) {
  return (
    <OwnerAccess>
      {() => <IntakeApp {...props} />}
    </OwnerAccess>
  );
}
