// Ported from LeanMaster production ef76ca0735ed841e82fa98eed48420724709468b.
// Import paths adapted; policy adaptations are documented separately.
import { canonicalizeNoteOriginSourceText } from "@/lib/leanmaster/src/noteorigin/sourceCanonicalization";

export const generationSourceFieldLabels = {
  documentationTypeId: "Documentation type",
  roleDiscipline: "Role / discipline",
  memberInitials: "Member initials / de-identified code",
  diagnosis: "Diagnosis",
  patientPopulation: "Patient population",
  dateOfService: "Date of service",
  payer: "Payer",
  otherPayer: "Other payer",
  county: "County or jurisdiction",
  stateCode: "State",
  localityGeoid: "County or jurisdiction selection",
  coverageType: "Coverage type",
  longTermServicesRelevant: "Long-term services relevance",
  clinicianName: "Clinician / staff name",
  jobTitle: "Job title",
  credential: "Credential",
  serviceJurisdiction: "Professional service jurisdiction",
  exactLicenseCredential: "Exact professional credential",
  scopeSupervisionStatus: "Professional supervision status",
  scopeSupervisorCredential: "Supervisor credential",
  scopeSupervisorApprovalStatus: "Supervisor approval status",
  independentPracticeStatus: "Independent-practice status",
  practiceSetting: "Professional practice setting",
  trainingOrCompetence: "Technique training or competence",
  validatedProtocol: "Validated protocol confirmation",
  treatmentPlanAuthorization: "Treatment-plan authorization",
  organizationalPolicyStatus: "Organizational scope policy",
  activitiesParticipation: "Activities participation",
  activitiesCarePlanGoal: "Activities care-plan goal",
  activityCategories: "Activity categories",
  otherActivityCategoryDescription: "Other activity category",
  caseManagementSetting: "Case Management Setting / Program Context",
  childWelfareJurisdiction: "Child Welfare Jurisdiction / Program",
  caseManagerContactType: "Case Manager Contact Type",
  programContext: "Session Data / Program Context",
  observedNeed: "Observed Need / Assessment Point",
  staffSupport: "Staff Intervention",
  participantResponse: "Participant / Caregiver Response or Action",
  followUpPlan: "Follow-Up Plan / Next Steps"
} as const;

export type GenerationSourceField = keyof typeof generationSourceFieldLabels;

export type GenerationSourceInput = Partial<
  Record<GenerationSourceField, unknown>
>;

export type GenerationSourceSnapshot = {
  version: 1;
  fields: Record<GenerationSourceField, string>;
};

const generationSourceFields = Object.keys(
  generationSourceFieldLabels
) as GenerationSourceField[];

function normalizeSourceValue(value: unknown): string {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) => normalizeSourceValue(item))
          .filter(Boolean)
      )
    )
      .sort((left, right) => left.localeCompare(right))
      .join("\n");
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value !== "string") return "";
  return canonicalizeNoteOriginSourceText(value);
}

export function createGenerationSourceSnapshot(
  input: GenerationSourceInput
): GenerationSourceSnapshot {
  return {
    version: 1,
    fields: Object.fromEntries(
      generationSourceFields.map((field) => [
        field,
        normalizeSourceValue(input[field])
      ])
    ) as Record<GenerationSourceField, string>
  };
}

export function isGenerationSourceSnapshot(
  value: unknown
): value is GenerationSourceSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Partial<GenerationSourceSnapshot>;
  if (
    snapshot.version !== 1 ||
    !snapshot.fields ||
    typeof snapshot.fields !== "object"
  ) {
    return false;
  }
  return generationSourceFields.every(
    (field) => typeof snapshot.fields?.[field] === "string"
  );
}

export function changedGenerationSourceFields(
  generated: GenerationSourceSnapshot,
  current: GenerationSourceSnapshot
) {
  return generationSourceFields.filter(
    (field) => generated.fields[field] !== current.fields[field]
  );
}

export function generationSourceSnapshotsMatch(
  generated: GenerationSourceSnapshot,
  current: GenerationSourceSnapshot
) {
  return changedGenerationSourceFields(generated, current).length === 0;
}

export function generationSourceChangeMessage(
  changedFields: readonly GenerationSourceField[]
) {
  const labels = changedFields.map((field) => generationSourceFieldLabels[field]);
  if (!labels.length) {
    return "The source facts changed after generation. Generate a new note before export.";
  }
  return `The generated note is stale because ${labels.join(", ")} changed after generation. Generate a new note before export.`;
}
