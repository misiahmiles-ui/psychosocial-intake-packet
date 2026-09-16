import { notFound } from "next/navigation";

import { IntakeApp } from "@/components/IntakeApp";
import { defaultValues } from "@/lib/defaultValues";
import { getIntakeSteps } from "@/lib/psychosocialEditions";
import type { IntakePacket } from "@/types/intake";

type PreviewPageProps = {
  searchParams?: Promise<{
    case?: string;
    step?: string;
  }>;
};

export default async function AssessmentPreviewPage({ searchParams }: PreviewPageProps) {
  if (process.env.NODE_ENV === "production") notFound();
  const params = await searchParams;
  const previewCase = params?.case ?? "success";
  const packet = previewPacket(previewCase);
  const requestedStep = Number(params?.step);
  const initialStepIndex = Number.isInteger(requestedStep)
    ? Math.min(Math.max(requestedStep, 0), getIntakeSteps("NJ").length)
    : getIntakeSteps("NJ").length;

  return (
    <IntakeApp
      accessMode="owner-review"
      demonstrationLoaded
      developmentAssessmentPreview={previewCase === "failure" ? "failure" : "success"}
      initialPacket={packet}
      initialStepIndex={initialStepIndex}
      jurisdiction="NJ"
    />
  );
}

function previewPacket(previewCase: string) {
  const packet = JSON.parse(JSON.stringify(defaultValues)) as IntakePacket;
  packet.identifying.participantName = "Fictitious Preview Participant";
  packet.identifying.dateOfBirth = "1955-04-12";
  packet.identifying.dateOfIntake = "2026-09-15";
  packet.identifying.evaluatorName = "Fictitious Preview Clinician";
  packet.identifying.primaryLanguage = "english";
  packet.living.currentResidence = "private residence";
  packet.living.primaryCaregiver = "daughter";
  packet.functional.ambulation = "walks with a cane and supervision";
  packet.functional.recentFalls = "No recent falls";
  packet.communication.primaryCommunication = "verbal communication";
  packet.psychosocial.baselineMood = "calm and engaged";
  packet.psychosocial.currentStressors = "transportation access limits attendance";
  packet.psychosocial.strengthsCoping = "uses breathing exercises and family support";
  packet.medicalHistory.majorMedicalDiagnoses = "documented hypertension";
  packet.safety.safetyPrecautions = "supervision during community mobility";
  packet.goals.participantFamilyGoals = "improve social engagement";
  packet.goals.socialWorkServicesNeeded = "transportation resource coordination needed";

  if (previewCase === "phi") {
    packet.psychosocial.currentStressors =
      "Caregiver Jane Sample requested a call at 201-555-0199 about transportation.";
  }
  if (previewCase === "conflict") {
    packet.medicalHistory.currentRiskDetails = "Current suicide risk present";
    packet.safety.harmRisk = "No current suicide risk";
  }
  return packet;
}
