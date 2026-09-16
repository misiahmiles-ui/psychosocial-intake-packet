export const ASSESSMENT_SECTIONS = [
  "participant_context",
  "living_support",
  "functional_cognitive",
  "communication_sensory",
  "psychosocial_behavioral",
  "medical_psychiatric",
  "strengths_protective",
  "safety",
  "goals_barriers",
  "overall_impression",
  "program_focus"
] as const;

export const FACT_DOMAINS = [
  "participant_context",
  "living_support",
  "functional",
  "cognitive_screening",
  "communication",
  "psychosocial",
  "medical",
  "nutrition_health",
  "safety",
  "goals_services",
  "home_environment",
  "discharge_planning",
  "maryland_coordination"
] as const;

export const SOURCE_TYPES = [
  "participant_report",
  "caregiver_report",
  "clinician_observation",
  "screening_result",
  "documented_history",
  "form_response"
] as const;

export const TEMPORAL_STATUSES = [
  "current",
  "recent",
  "historical",
  "lifetime",
  "unknown",
  "not_applicable"
] as const;

export const POLARITIES = [
  "affirmed",
  "denied",
  "unknown",
  "not_assessed",
  "not_applicable"
] as const;

export const DIAGNOSIS_STATUSES = [
  "documented_diagnosis",
  "reported_diagnosis",
  "screening_finding",
  "symptom_or_concern",
  "none",
  "unknown",
  "not_applicable"
] as const;

export const RELATIONSHIP_STATUSES = [
  "present",
  "limited",
  "absent",
  "unknown",
  "not_applicable"
] as const;

export const RISK_STATUSES = [
  "present",
  "denied",
  "historical",
  "concern",
  "unknown",
  "not_assessed",
  "not_applicable"
] as const;

export const FUNCTIONAL_STATUSES = [
  "independent",
  "assistance_required",
  "impaired",
  "variable",
  "unknown",
  "not_applicable"
] as const;

export const SUBSTANCE_USE_STATUSES = [
  "current",
  "historical",
  "denied",
  "concern",
  "unknown",
  "not_assessed",
  "not_applicable"
] as const;

export const CAREGIVER_INVOLVEMENT_STATUSES = [
  "active",
  "limited",
  "absent",
  "strain_noted",
  "unknown",
  "not_applicable"
] as const;

export const SERVICE_NEED_STATUSES = [
  "needed",
  "not_needed",
  "consider",
  "in_progress",
  "unknown",
  "not_applicable"
] as const;

export type AssessmentSection = (typeof ASSESSMENT_SECTIONS)[number];
export type FactDomain = (typeof FACT_DOMAINS)[number];
export type SourceType = (typeof SOURCE_TYPES)[number];
export type TemporalStatus = (typeof TEMPORAL_STATUSES)[number];
export type Polarity = (typeof POLARITIES)[number];
export type DiagnosisStatus = (typeof DIAGNOSIS_STATUSES)[number];
export type RelationshipStatus = (typeof RELATIONSHIP_STATUSES)[number];
export type RiskStatus = (typeof RISK_STATUSES)[number];
export type FunctionalStatus = (typeof FUNCTIONAL_STATUSES)[number];
export type SubstanceUseStatus = (typeof SUBSTANCE_USE_STATUSES)[number];
export type CaregiverInvolvementStatus =
  (typeof CAREGIVER_INVOLVEMENT_STATUSES)[number];
export type ServiceNeedStatus = (typeof SERVICE_NEED_STATUSES)[number];

export type FactSemantics = {
  polarity: Polarity;
  diagnosisStatus: DiagnosisStatus;
  relationshipStatus: RelationshipStatus;
  riskStatus: RiskStatus;
  functionalStatus: FunctionalStatus;
  substanceUseStatus: SubstanceUseStatus;
  caregiverInvolvement: CaregiverInvolvementStatus;
  serviceNeed: ServiceNeedStatus;
};

export type AssessmentFact = {
  id: string;
  domain: FactDomain;
  sourceStep: string;
  sourceField: string;
  sourceType: SourceType;
  temporalStatus: TemporalStatus;
  normalizedValue: string;
  semantics: FactSemantics;
};

export type LocalFactLabel = {
  stepTitle: string;
  fieldLabel: string;
};

export type PhiFindingKind =
  | "email"
  | "telephone"
  | "ssn"
  | "full_date"
  | "postal_code"
  | "street_address"
  | "url"
  | "ip_address"
  | "record_identifier"
  | "person_name";

export type PhiFinding = {
  reviewKey: string;
  factId: string;
  kind: PhiFindingKind;
  severity: "hard_block" | "ambiguous";
  start: number;
  end: number;
  detectedText: string;
  snippet: string;
};

export type SafetyConflict = {
  id: string;
  topic: string;
  factIds: string[];
};

export type AssessmentWorkspace = {
  facts: AssessmentFact[];
  labels: Record<string, LocalFactLabel>;
  findings: PhiFinding[];
  conflicts: SafetyConflict[];
  localRevisionToken: string;
};

export type ReviewedAmbiguousFinding = {
  factId: string;
  kind: "person_name";
  start: number;
  end: number;
};

export type AssessmentRequest = {
  version: 1;
  jurisdiction: "NJ" | "MD";
  facts: AssessmentFact[];
  reviewedAmbiguousFindings: ReviewedAmbiguousFinding[];
};

export type AssessmentClaim = {
  id: string;
  section: AssessmentSection;
  text: string;
  sourceFactIds: string[];
  polarity: Polarity;
  temporalStatus: TemporalStatus;
  sourceType: SourceType | "mixed";
  diagnosisStatus: DiagnosisStatus;
  relationshipStatus: RelationshipStatus;
  riskStatus: RiskStatus;
  functionalStatus: FunctionalStatus;
  substanceUseStatus: SubstanceUseStatus;
  caregiverInvolvement: CaregiverInvolvementStatus;
  serviceNeed: ServiceNeedStatus;
};

export type ClaimValidationResult = {
  valid: boolean;
  issues: string[];
  claims: AssessmentClaim[];
};

export type AssessmentValidationSummary = {
  preflightPhiScan: "passed";
  finalOutboundScan: "passed";
  outputPhiScan: "passed";
  sourceGrounding: "passed";
  safetyPreserved: "passed";
  unsupportedDiagnosisDetected: false;
  criticalUnresolvedConflicts: 0;
  sourceFactsUsed: number;
};

export type ValidatedAssessmentResponse = {
  claims: AssessmentClaim[];
  assessmentText: string;
  validation: AssessmentValidationSummary;
  usage: {
    monthlyLimit: number;
    successfulGenerationsThisMonth: number;
    remainingSuccessfulGenerations: number;
  };
};

export type AcceptedAssessment = {
  assessmentText: string;
  generatedText: string;
  clinicianEdited: boolean;
  localRevisionToken: string;
  validation: AssessmentValidationSummary;
};
