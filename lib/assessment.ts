import type { IntakePacket, PsychosocialJurisdiction } from "@/types/intake";
import {
  ASSESSMENT_SECTIONS,
  CAREGIVER_INVOLVEMENT_STATUSES,
  DIAGNOSIS_STATUSES,
  FACT_DOMAINS,
  FUNCTIONAL_STATUSES,
  POLARITIES,
  RELATIONSHIP_STATUSES,
  RISK_STATUSES,
  SERVICE_NEED_STATUSES,
  SOURCE_TYPES,
  SUBSTANCE_USE_STATUSES,
  TEMPORAL_STATUSES,
  type AssessmentClaim,
  type AssessmentFact,
  type AssessmentRequest,
  type AssessmentSection,
  type AssessmentWorkspace,
  type ClaimValidationResult,
  type FactDomain,
  type FactSemantics,
  type LocalFactLabel,
  type PhiFinding,
  type PhiFindingKind,
  type ReviewedAmbiguousFinding,
  type SafetyConflict,
  type SourceType,
  type TemporalStatus
} from "@/types/assessment";

type SourceMapping = {
  path: string;
  stepId: string;
  stepTitle: string;
  fieldLabel: string;
  domain: FactDomain;
  sourceType?: SourceType;
  temporalStatus?: TemporalStatus;
};

const SOURCE_MAPPINGS: SourceMapping[] = [
  map("identifying.primaryLanguage", "identifying", "Identifying Information", "Primary language", "participant_context"),
  map("identifying.interpreterNeeded", "identifying", "Identifying Information", "Interpreter needed", "communication"),
  map("identifying.guardianProxyOnFile", "identifying", "Identifying Information", "Guardian / health care proxy on file", "living_support"),
  map("living.currentResidence", "living", "Living Situation and Supports", "Current residence", "living_support"),
  map("living.livesWith", "living", "Living Situation and Supports", "Lives with", "living_support"),
  map("living.stairsInside", "living", "Living Situation and Supports", "Number of stairs inside home", "home_environment"),
  map("living.stairsOutside", "living", "Living Situation and Supports", "Number of stairs outside home", "home_environment"),
  map("living.elevatorAccess", "living", "Living Situation and Supports", "Elevator access", "home_environment"),
  map("living.caregiverStressNoted", "living", "Living Situation and Supports", "Caregiver stress noted", "living_support"),
  map("living.transportation", "living", "Living Situation and Supports", "Transportation to / from center", "living_support"),
  map("functional.orientation", "functional", "Functional and Cognitive Status", "Orientation", "functional"),
  map("functional.memoryConcerns", "functional", "Functional and Cognitive Status", "Memory concerns", "functional"),
  map("functional.decisionMaking", "functional", "Functional and Cognitive Status", "Decision-making", "functional"),
  map("functional.ambulation", "functional", "Functional and Cognitive Status", "Ambulation", "functional"),
  map("functional.transfers", "functional", "Functional and Cognitive Status", "Transfers", "functional"),
  map("functional.adlHelp", "functional", "Functional and Cognitive Status", "ADL help", "functional"),
  map("functional.recentFalls", "functional", "Functional and Cognitive Status", "Recent falls in last 6 months", "safety", "form_response", "recent"),
  map("communication.primaryCommunication", "communication", "Communication, Hearing, and Vision", "Primary communication", "communication"),
  map("communication.hearingStatus", "communication", "Communication, Hearing, and Vision", "Hearing status", "communication"),
  map("communication.hearingAids", "communication", "Communication, Hearing, and Vision", "Hearing aids", "communication"),
  map("communication.visionStatus", "communication", "Communication, Hearing, and Vision", "Vision status", "communication"),
  map("communication.glasses", "communication", "Communication, Hearing, and Vision", "Glasses", "communication"),
  map("communication.communicationNeeds", "communication", "Communication, Hearing, and Vision", "Communication needs / barriers", "communication"),
  map("psychosocial.baselineMood", "psychosocial", "Psychosocial and Behavioral Health", "Baseline mood", "psychosocial"),
  map("psychosocial.mentalHealthHistory", "psychosocial", "Psychosocial and Behavioral Health", "Mental health history", "psychosocial", "form_response", "historical"),
  map("psychosocial.currentStressors", "psychosocial", "Psychosocial and Behavioral Health", "Current stressors", "psychosocial", "form_response", "current"),
  map("psychosocial.strengthsCoping", "psychosocial", "Psychosocial and Behavioral Health", "Strengths and coping skills", "psychosocial"),
  map("psychosocial.socialEngagement", "psychosocial", "Psychosocial and Behavioral Health", "Social engagement", "psychosocial"),
  map("psychosocial.thoughtBehaviorConcerns", "psychosocial", "Psychosocial and Behavioral Health", "Thought content / behavior concerns", "psychosocial"),
  map("medicalHistory.majorMedicalDiagnoses", "medical-history", "Medical / Psychiatric History", "Major medical diagnoses", "medical", "documented_history"),
  map("medicalHistory.psychiatricDiagnoses", "medical-history", "Medical / Psychiatric History", "Psychiatric diagnoses", "medical", "documented_history"),
  map("medicalHistory.currentMedications", "medical-history", "Medical / Psychiatric History", "Current medications", "medical", "documented_history", "current"),
  map("medicalHistory.allergies", "medical-history", "Medical / Psychiatric History", "Allergies / medication intolerances", "medical", "documented_history"),
  map("medicalHistory.psychiatricHospitalization", "medical-history", "Medical / Psychiatric History", "History of psychiatric hospitalization", "medical", "documented_history", "historical"),
  map("medicalHistory.psychiatricHospitalizationDetails", "medical-history", "Medical / Psychiatric History", "Psychiatric hospitalization details", "medical", "documented_history", "historical"),
  map("medicalHistory.suicideSelfHarmHistory", "medical-history", "Medical / Psychiatric History", "History of suicide attempts or self-harm", "safety", "documented_history", "historical"),
  map("medicalHistory.currentRiskDetails", "medical-history", "Medical / Psychiatric History", "Current risk details", "safety", "form_response", "current"),
  map("medicalHistory.substanceUseHistory", "medical-history", "Medical / Psychiatric History", "Substance use history", "psychosocial", "form_response", "historical"),
  map("medicalHistory.alcoholUse", "medical-history", "Medical / Psychiatric History", "Alcohol use", "psychosocial"),
  map("medicalHistory.drugUse", "medical-history", "Medical / Psychiatric History", "Drug use", "psychosocial"),
  map("medicalHistory.otherHistory", "medical-history", "Medical / Psychiatric History", "Other relevant history", "medical"),
  map("conditions.medicationManagement", "conditions", "Medical Conditions, Nutrition, Oral, and Skin", "Medication management", "functional"),
  map("conditions.medicationAdherenceConcerns", "conditions", "Medical Conditions, Nutrition, Oral, and Skin", "Medication adherence concerns", "safety"),
  map("conditions.appetite", "conditions", "Medical Conditions, Nutrition, Oral, and Skin", "Appetite", "nutrition_health"),
  map("conditions.specialDiet", "conditions", "Medical Conditions, Nutrition, Oral, and Skin", "Special diet", "nutrition_health"),
  map("conditions.recentWeightChange", "conditions", "Medical Conditions, Nutrition, Oral, and Skin", "Recent weight change", "nutrition_health", "form_response", "recent"),
  map("conditions.oralDentalStatus", "conditions", "Medical Conditions, Nutrition, Oral, and Skin", "Oral / dental status", "nutrition_health"),
  map("conditions.skinCondition", "conditions", "Medical Conditions, Nutrition, Oral, and Skin", "Skin condition", "nutrition_health"),
  map("safety.assistiveDevices", "safety", "Special Treatments, Assistive Devices, and Safety", "Assistive devices", "functional"),
  map("safety.specialTreatments", "safety", "Special Treatments, Assistive Devices, and Safety", "Special treatments", "medical"),
  map("safety.harmRisk", "safety", "Special Treatments, Assistive Devices, and Safety", "Risk of harm to self or others", "safety", "form_response", "current"),
  map("safety.abuseNeglectConcerns", "safety", "Special Treatments, Assistive Devices, and Safety", "Abuse / neglect / exploitation concerns", "safety", "form_response", "current"),
  map("safety.elopementRisk", "safety", "Special Treatments, Assistive Devices, and Safety", "Elopement / wandering risk", "safety", "form_response", "current"),
  map("safety.safetyPrecautions", "safety", "Special Treatments, Assistive Devices, and Safety", "Safety precautions", "safety", "form_response", "current"),
  map("goals.participantFamilyGoals", "goals", "Participant Goals and Service Needs", "Participant / family goals", "goals_services"),
  map("goals.socialWorkServicesNeeded", "goals", "Participant Goals and Service Needs", "Social work services needed", "goals_services"),
  map("goals.servicePriorities", "goals", "Participant Goals and Service Needs", "Recommended service priorities", "goals_services"),
  map("homeVisit.livingArrangements", "home-visit", "Home Visit Evaluation", "Living arrangements", "home_environment", "clinician_observation"),
  map("homeVisit.householdComposition", "home-visit", "Home Visit Evaluation", "Household composition", "living_support", "clinician_observation"),
  map("homeVisit.frequencyOfVisits", "home-visit", "Home Visit Evaluation", "Frequency of visits", "living_support"),
  map("homeVisit.groupCommunitySupports", "home-visit", "Home Visit Evaluation", "Group / church / community supports", "living_support"),
  map("homeVisit.shoppingAvailability", "home-visit", "Home Visit Evaluation", "Shopping availability", "functional"),
  map("homeVisit.publicTransportation", "home-visit", "Home Visit Evaluation", "Public transportation", "living_support"),
  map("homeVisit.structuralEnvironment", "home-visit", "Home Visit Evaluation", "Structural environment", "home_environment", "clinician_observation"),
  map("homeVisit.entrance", "home-visit", "Home Visit Evaluation", "Entrance", "home_environment", "clinician_observation"),
  map("homeVisit.livingRoom", "home-visit", "Home Visit Evaluation", "Living room", "home_environment", "clinician_observation"),
  map("homeVisit.kitchen", "home-visit", "Home Visit Evaluation", "Kitchen", "home_environment", "clinician_observation"),
  map("homeVisit.bathroom", "home-visit", "Home Visit Evaluation", "Bathroom", "home_environment", "clinician_observation"),
  map("homeVisit.bedroom", "home-visit", "Home Visit Evaluation", "Bedroom", "home_environment", "clinician_observation"),
  map("homeVisit.roomsOneLevel", "home-visit", "Home Visit Evaluation", "Rooms on one level", "home_environment", "clinician_observation"),
  map("homeVisit.telephones", "home-visit", "Home Visit Evaluation", "Telephone access", "home_environment", "clinician_observation"),
  map("homeVisit.roomAppearance", "home-visit", "Home Visit Evaluation", "Appearance of rooms", "home_environment", "clinician_observation"),
  map("homeVisit.carpeting", "home-visit", "Home Visit Evaluation", "Carpeting", "home_environment", "clinician_observation"),
  map("homeVisit.safetyHazards", "home-visit", "Home Visit Evaluation", "Safety hazards", "safety", "clinician_observation", "current"),
  map("homeVisit.otherSafetyHazard", "home-visit", "Home Visit Evaluation", "Other safety hazard", "safety", "clinician_observation", "current"),
  map("homeVisit.comments", "home-visit", "Home Visit Evaluation", "Home visit comments", "home_environment", "clinician_observation"),
  map("initialDischarge.clientStatus", "initial-discharge", "Social Services Initial Discharge Plan", "Client status", "participant_context"),
  map("initialDischarge.socialization", "initial-discharge", "Social Services Initial Discharge Plan", "Level of socialization", "psychosocial"),
  map("initialDischarge.participation", "initial-discharge", "Social Services Initial Discharge Plan", "Expected participation", "goals_services"),
  map("initialDischarge.participationNotes", "initial-discharge", "Social Services Initial Discharge Plan", "Participation notes", "goals_services"),
  map("initialDischarge.livingAdls", "initial-discharge", "Social Services Initial Discharge Plan", "Living arrangements / ADLs", "functional"),
  map("initialDischarge.levelOfServiceAppropriate", "initial-discharge", "Social Services Initial Discharge Plan", "Level of service appropriate", "goals_services"),
  map("initialDischarge.mobility", "initial-discharge", "Social Services Initial Discharge Plan", "Mobility", "functional"),
  map("initialDischarge.mobilityNotes", "initial-discharge", "Social Services Initial Discharge Plan", "Mobility notes", "functional"),
  map("quarterlyDischarge.dischargeSetting", "quarterly-discharge", "Quarterly / Projected Discharge Plan", "Projected discharge setting", "discharge_planning"),
  map("quarterlyDischarge.familyCaregiverSpecify", "quarterly-discharge", "Quarterly / Projected Discharge Plan", "Family / caregiver support", "discharge_planning"),
  map("quarterlyDischarge.otherSettingSpecify", "quarterly-discharge", "Quarterly / Projected Discharge Plan", "Other projected setting", "discharge_planning"),
  map("quarterlyDischarge.settingComments", "quarterly-discharge", "Quarterly / Projected Discharge Plan", "Setting comments", "discharge_planning"),
  map("quarterlyDischarge.supportiveServices", "quarterly-discharge", "Quarterly / Projected Discharge Plan", "Supportive services potentially needed", "discharge_planning"),
  map("quarterlyDischarge.otherServiceSpecify", "quarterly-discharge", "Quarterly / Projected Discharge Plan", "Other supportive service", "discharge_planning"),
  map("quarterlyDischarge.servicesComments", "quarterly-discharge", "Quarterly / Projected Discharge Plan", "Services comments", "discharge_planning"),
  map("quarterlyDischarge.longTermCareReferralNote", "quarterly-discharge", "Quarterly / Projected Discharge Plan", "Long-term care referral note", "discharge_planning"),
  map("maryland.homeEnvironmentAssessmentStatus", "maryland-admission", "Maryland Admission Documents and Coordination", "Home-environment assessment status", "maryland_coordination"),
  map("maryland.socialWorkConsultationStatus", "maryland-admission", "Maryland Admission Documents and Coordination", "Social-work consultation status", "maryland_coordination"),
  map("maryland.significantChangeReassessmentStatus", "maryland-admission", "Maryland Admission Documents and Coordination", "Significant-change reassessment status", "maryland_coordination"),
  map("maryland.planOfCareCoordinationStatus", "maryland-admission", "Maryland Admission Documents and Coordination", "Plan-of-care coordination status", "maryland_coordination"),
  map("maryland.psychosocialContribution", "maryland-admission", "Maryland Admission Documents and Coordination", "Psychosocial contribution", "maryland_coordination"),
  map("maryland.dischargeException", "maryland-admission", "Maryland Admission Documents and Coordination", "Emergency / regulatory exception", "discharge_planning"),
  map("maryland.dischargeReason", "maryland-admission", "Maryland Admission Documents and Coordination", "Discharge reason and planned location", "discharge_planning"),
  map("maryland.notes", "maryland-admission", "Maryland Admission Documents and Coordination", "Maryland edition notes", "maryland_coordination")
];

const DIRECT_IDENTIFIER_PATHS = new Set([
  "identifying.participantName",
  "identifying.medicaidId",
  "identifying.dateOfBirth",
  "identifying.evaluatorName",
  "identifying.guardianProxyName",
  "living.primaryCaregiver",
  "living.caregiverPhone",
  "medicalHistory.primaryCareProvider",
  "medicalHistory.pcpPhone",
  "homeVisit.name",
  "homeVisit.dob",
  "homeVisit.address",
  "homeVisit.phone",
  "homeVisit.cell",
  "homeVisit.email",
  "homeVisit.closestRelative"
]);

const PHI_PATTERNS: Array<{
  kind: Exclude<PhiFindingKind, "person_name">;
  pattern: RegExp;
}> = [
  { kind: "email", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { kind: "url", pattern: /\b(?:https?:\/\/|www\.)[^\s]+/gi },
  { kind: "ip_address", pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },
  { kind: "ssn", pattern: /\b(?:\d{3}[- ]?\d{2}[- ]?\d{4}|(?:ssn|social security)(?:\s*(?:last\s*4|number|no\.?|#))?\s*[:#-]?\s*\d{4,9})\b/gi },
  { kind: "telephone", pattern: /(?<!\d)(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)/g },
  { kind: "full_date", pattern: /\b(?:19|20)\d{2}[-/]\d{1,2}[-/]\d{1,2}\b|\b\d{1,2}[/-]\d{1,2}[/-](?:19|20)?\d{2}\b|\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+(?:19|20)\d{2}\b|\b\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(?:19|20)\d{2}\b/gi },
  { kind: "postal_code", pattern: /\b\d{5}(?:-\d{4})?\b/g },
  { kind: "sub_state_geography", pattern: /\b[A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){0,2}\s+County\b/g },
  { kind: "street_address", pattern: /\b\d{1,6}\s+(?:[A-Z0-9.'-]+\s+){0,5}(?:street|st\.?|avenue|ave\.?|road|rd\.?|boulevard|blvd\.?|lane|ln\.?|drive|dr\.?|court|ct\.?|parkway|pkwy\.?|highway|hwy\.?)\b/gi },
  { kind: "record_identifier", pattern: /\b(?:medicaid|medicare|health\s*plan|member|medical\s*record|mrn|account|policy|certificate|license|device|vehicle|biometric|fingerprint|retinal|voiceprint|photograph|photo)(?:\s+(?:id|identifier|number|no\.?))?\s*(?:[:#-]\s*)?[A-Z0-9][A-Z0-9-]{3,}\b/gi }
];

const PERSON_NAME_PATTERN = /\b(?:Dr\.?|Mr\.?|Mrs\.?|Ms\.?|Miss)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\b|\b(?:[A-Z][a-z]{2,}\s+){1,3}[A-Z][a-z]{2,}\b/g;
const NAME_EXCLUSIONS = new Set([
  "Adult Day",
  "Assisted Living",
  "Mental Health",
  "Home Care",
  "Meals Wheels",
  "New Jersey",
  "Maryland Medical",
  "Social Work",
  "Unable Refused",
  "Not Applicable",
  "Primary Care",
  "Plan Care"
]);

const SAFETY_TOPICS = [
  { topic: "suicide or self-harm", pattern: /suicid|self[- ]?harm/i },
  { topic: "homicidal or other-directed harm", pattern: /homicid|harm\s+to\s+others?/i },
  { topic: "abuse, neglect, or exploitation", pattern: /abuse|neglect|exploit/i },
  { topic: "wandering or elopement", pattern: /wander|elop/i },
  { topic: "falls", pattern: /\bfalls?|near[- ]?fall/i },
  { topic: "aggression", pattern: /aggress|violent|assault/i },
  { topic: "medication safety", pattern: /medicat|dose|adherence/i }
];

const STOP_WORDS = new Set([
  "about", "after", "again", "also", "and", "are", "because", "been",
  "being", "but", "care", "current", "currently", "does", "from", "has",
  "have", "into", "member", "more", "participant", "reported", "reports",
  "that", "the", "their", "them", "there", "they", "this", "with", "would"
]);

export const ASSESSMENT_SOURCE_PATHS = SOURCE_MAPPINGS.map((item) => item.path);
export const ADMINISTRATIVE_EXCLUDED_PREFIXES = [
  "company.",
  "attachments.",
  "consents.",
  "roi.",
  "therapy."
];

export function createAssessmentWorkspace(
  packet: IntakePacket,
  jurisdiction: PsychosocialJurisdiction,
  now = new Date()
): AssessmentWorkspace {
  const rawFacts: Array<Omit<AssessmentFact, "id"> & { label: LocalFactLabel }> = [];

  const age = calculateAgeForAssessment(
    packet.identifying.dateOfBirth,
    packet.identifying.dateOfIntake,
    now
  );
  if (age) {
    rawFacts.push({
      domain: "participant_context",
      sourceStep: "identifying",
      sourceField: "calculated-age",
      sourceType: "form_response",
      temporalStatus: "current",
      normalizedValue: age,
      semantics: emptySemantics({ polarity: "affirmed" }),
      label: {
        stepTitle: "Identifying Information",
        fieldLabel: "Age calculated locally from date of birth"
      }
    });
  }

  const caregiverRole = extractCaregiverRole(packet.living.primaryCaregiver);
  if (caregiverRole) {
    rawFacts.push({
      domain: "living_support",
      sourceStep: "living",
      sourceField: "primary-caregiver-role",
      sourceType: "form_response",
      temporalStatus: "current",
      normalizedValue: `${caregiverRole} identified as the primary caregiver`,
      semantics: emptySemantics({
        polarity: "affirmed",
        relationshipStatus: "present",
        caregiverInvolvement: "active"
      }),
      label: {
        stepTitle: "Living Situation and Supports",
        fieldLabel: "Primary caregiver relationship (name excluded)"
      }
    });
  }

  SOURCE_MAPPINGS.forEach((mapping) => {
    if (jurisdiction !== "MD" && mapping.path.startsWith("maryland.")) {
      return;
    }
    if (DIRECT_IDENTIFIER_PATHS.has(mapping.path)) {
      return;
    }

    const normalizedValue = normalizeValue(getValueByPath(packet, mapping.path));
    if (!normalizedValue) {
      return;
    }

    rawFacts.push({
      domain: mapping.domain,
      sourceStep: slug(mapping.stepId),
      sourceField: slug(mapping.path),
      sourceType: mapping.sourceType ?? "form_response",
      temporalStatus:
        mapping.temporalStatus ?? inferTemporalStatus(mapping.path, normalizedValue),
      normalizedValue,
      semantics: deriveSemantics(mapping.path, normalizedValue, mapping.domain),
      label: {
        stepTitle: mapping.stepTitle,
        fieldLabel: mapping.fieldLabel
      }
    });
  });

  packet.mentalStatus.responses.forEach((response, index) => {
    const status = normalizeValue(response.status);
    const notes = normalizeValue(response.notes);
    if (!status && !notes) {
      return;
    }
    const normalizedValue = [status ? `response: ${status}` : "", notes ? `notes: ${notes}` : ""]
      .filter(Boolean)
      .join("; ");
    rawFacts.push({
      domain: "cognitive_screening",
      sourceStep: "mental-status",
      sourceField: `screening-item-${index + 1}`,
      sourceType: "screening_result",
      temporalStatus: "current",
      normalizedValue,
      semantics: emptySemantics({
        polarity: status === "correct" ? "affirmed" : status ? "denied" : "unknown",
        diagnosisStatus: "screening_finding"
      }),
      label: {
        stepTitle: "Brief Mental Status Screening",
        fieldLabel: `${index + 1}. ${response.question}`
      }
    });
  });

  const facts: AssessmentFact[] = [];
  const labels: Record<string, LocalFactLabel> = {};
  rawFacts.forEach(({ label, ...fact }, index) => {
    const id = `fact-${String(index + 1).padStart(3, "0")}`;
    facts.push({ id, ...fact });
    labels[id] = label;
  });

  return {
    facts,
    labels,
    findings: scanAssessmentFacts(facts),
    conflicts: detectSafetyConflicts(facts),
    localRevisionToken: assessmentInputRevision(packet, jurisdiction)
  };
}

export function calculateAgeForAssessment(
  dateOfBirth: string,
  dateOfIntake: string,
  now = new Date()
) {
  const birth = parseIsoDate(dateOfBirth);
  if (!birth) return "";
  const reference = parseIsoDate(dateOfIntake) ?? now;
  let age = reference.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday =
    reference.getUTCMonth() < birth.getUTCMonth() ||
    (reference.getUTCMonth() === birth.getUTCMonth() &&
      reference.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) age -= 1;
  if (age < 0 || age > 130) return "";
  return age > 89 ? "age: 90 or older" : `age: ${age}`;
}

export function assessmentInputRevision(
  packet: IntakePacket,
  jurisdiction: PsychosocialJurisdiction
) {
  const values = ASSESSMENT_SOURCE_PATHS.map((path) => [path, getValueByPath(packet, path)]);
  values.push(["dateOfBirthForLocalAge", packet.identifying.dateOfBirth]);
  values.push(["dateOfIntakeForLocalAge", packet.identifying.dateOfIntake]);
  values.push(["mentalStatus", packet.mentalStatus.responses]);
  values.push(["jurisdiction", jurisdiction]);
  return `local-${simpleHash(JSON.stringify(values))}`;
}

export function scanAssessmentFacts(
  facts: AssessmentFact[],
  reviewed: ReviewedAmbiguousFinding[] = []
) {
  const reviewedKeys = new Set(reviewed.map(reviewDecisionKey));
  return facts.flatMap((fact) =>
    scanText(fact.normalizedValue, fact.id).filter(
      (finding) => !reviewedKeys.has(finding.reviewKey)
    )
  );
}

export function scanSerializedAssessmentRequest(request: AssessmentRequest) {
  const serialized = JSON.stringify(request);
  return scanSerializedOutboundPayload(
    serialized,
    request.facts,
    request.reviewedAmbiguousFindings
  );
}

export function scanSerializedOutboundPayload(
  serialized: string,
  facts: AssessmentFact[],
  reviewed: ReviewedAmbiguousFinding[]
) {
  const reviewedTexts = approvedAmbiguousTexts(facts, reviewed);
  return scanText(serialized, "serialized-payload").filter(
    (finding) =>
      finding.severity === "hard_block" ||
      !reviewedTexts.has(finding.detectedText.toLowerCase())
  );
}

export function scanGeneratedClaims(claims: AssessmentClaim[]) {
  return claims.flatMap((claim) =>
    scanText(claim.text, claim.id).map((finding) => ({
      ...finding,
      severity: "hard_block" as const
    }))
  );
}

export function findingToReviewDecision(
  finding: PhiFinding
): ReviewedAmbiguousFinding | null {
  if (finding.severity !== "ambiguous" || finding.kind !== "person_name") {
    return null;
  }
  return {
    factId: finding.factId,
    kind: "person_name",
    start: finding.start,
    end: finding.end
  };
}

export function replaceFindingInFacts(
  facts: AssessmentFact[],
  finding: PhiFinding,
  replacement: string
) {
  const normalizedReplacement = replacement.trim();
  return facts.map((fact) => {
    if (fact.id !== finding.factId) return fact;
    if (
      !Number.isInteger(finding.start) ||
      !Number.isInteger(finding.end) ||
      finding.start < 0 ||
      finding.end <= finding.start ||
      finding.end > fact.normalizedValue.length ||
      fact.normalizedValue.slice(finding.start, finding.end) !== finding.detectedText
    ) {
      return fact;
    }
    return {
      ...fact,
      normalizedValue: normalizeWhitespace(
        `${fact.normalizedValue.slice(0, finding.start)}${normalizedReplacement}${fact.normalizedValue.slice(finding.end)}`
      )
    };
  }).filter((fact) => fact.normalizedValue.length > 0);
}

export function applyConflictResolutions(
  facts: AssessmentFact[],
  conflicts: SafetyConflict[],
  selectedFactIds: Record<string, string>
) {
  const excluded = new Set<string>();
  conflicts.forEach((conflict) => {
    const selected = selectedFactIds[conflict.id];
    if (!conflict.factIds.includes(selected)) return;
    conflict.factIds.forEach((factId) => {
      if (factId !== selected) excluded.add(factId);
    });
  });
  return facts.filter((fact) => !excluded.has(fact.id));
}

export function validateAssessmentRequestShape(value: unknown): string[] {
  const issues: string[] = [];
  if (!isObject(value)) return ["Request must be an object."];
  const allowedTop = new Set(["version", "jurisdiction", "facts", "reviewedAmbiguousFindings"]);
  Object.keys(value).forEach((key) => {
    if (!allowedTop.has(key)) issues.push(`Unexpected request field: ${key}.`);
  });
  if (value.version !== 1) issues.push("Unsupported request version.");
  if (value.jurisdiction !== "NJ" && value.jurisdiction !== "MD") {
    issues.push("Jurisdiction must be NJ or MD.");
  }
  if (!Array.isArray(value.facts) || value.facts.length < 1 || value.facts.length > 180) {
    issues.push("Facts must contain between 1 and 180 items.");
  }
  if (!Array.isArray(value.reviewedAmbiguousFindings) || value.reviewedAmbiguousFindings.length > 100) {
    issues.push("Reviewed findings must be an array of at most 100 items.");
  }
  const factIds = new Set<string>();
  if (Array.isArray(value.facts)) {
    value.facts.forEach((fact, index) => {
      if (!isObject(fact)) {
        issues.push(`Fact ${index + 1} must be an object.`);
        return;
      }
      const allowed = new Set([
        "id", "domain", "sourceStep", "sourceField", "sourceType",
        "temporalStatus", "normalizedValue", "semantics"
      ]);
      Object.keys(fact).forEach((key) => {
        if (!allowed.has(key)) issues.push(`Unexpected fact field: ${key}.`);
      });
      if (typeof fact.id !== "string" || !/^fact-\d{3}$/.test(fact.id) || factIds.has(fact.id)) {
        issues.push(`Fact ${index + 1} has an invalid or duplicate id.`);
      } else factIds.add(fact.id);
      if (!FACT_DOMAINS.includes(fact.domain as never)) issues.push(`Fact ${index + 1} has an invalid domain.`);
      if (!SOURCE_TYPES.includes(fact.sourceType as never)) issues.push(`Fact ${index + 1} has an invalid source type.`);
      if (!TEMPORAL_STATUSES.includes(fact.temporalStatus as never)) issues.push(`Fact ${index + 1} has an invalid temporal status.`);
      if (typeof fact.sourceStep !== "string" || !/^[a-z0-9-]{1,60}$/.test(fact.sourceStep)) issues.push(`Fact ${index + 1} has an invalid source step.`);
      if (typeof fact.sourceField !== "string" || !/^[a-z0-9-]{1,90}$/.test(fact.sourceField)) issues.push(`Fact ${index + 1} has an invalid source field.`);
      if (typeof fact.normalizedValue !== "string" || fact.normalizedValue.length < 1 || fact.normalizedValue.length > 2000) issues.push(`Fact ${index + 1} has an invalid value.`);
      issues.push(...validateSemantics(fact.semantics, `Fact ${index + 1}`));
    });
  }
  if (Array.isArray(value.reviewedAmbiguousFindings)) {
    value.reviewedAmbiguousFindings.forEach((decision, index) => {
      if (!isObject(decision)) {
        issues.push(`Reviewed finding ${index + 1} must be an object.`);
        return;
      }
      const keys = Object.keys(decision);
      if (keys.some((key) => !["factId", "kind", "start", "end"].includes(key))) {
        issues.push(`Reviewed finding ${index + 1} contains an unexpected field.`);
      }
      if (!factIds.has(String(decision.factId)) || decision.kind !== "person_name" || !Number.isInteger(decision.start) || !Number.isInteger(decision.end)) {
        issues.push(`Reviewed finding ${index + 1} is invalid.`);
      }
    });
  }
  return issues;
}

export function validateClaims(
  candidateClaims: unknown,
  facts: AssessmentFact[]
): ClaimValidationResult {
  const issues: string[] = [];
  if (!Array.isArray(candidateClaims) || candidateClaims.length < 1 || candidateClaims.length > 60) {
    return { valid: false, issues: ["Claims must contain between 1 and 60 items."], claims: [] };
  }
  const factMap = new Map(facts.map((fact) => [fact.id, fact]));
  const claims: AssessmentClaim[] = [];
  const claimIds = new Set<string>();

  candidateClaims.forEach((raw, index) => {
    if (!isObject(raw)) {
      issues.push(`Claim ${index + 1} must be an object.`);
      return;
    }
    const allowedKeys = new Set([
      "id", "section", "text", "sourceFactIds", "polarity", "temporalStatus",
      "sourceType", "diagnosisStatus", "relationshipStatus", "riskStatus",
      "functionalStatus", "substanceUseStatus", "caregiverInvolvement", "serviceNeed"
    ]);
    Object.keys(raw).forEach((key) => {
      if (!allowedKeys.has(key)) issues.push(`Claim ${index + 1} contains unexpected field ${key}.`);
    });
    const claim = raw as unknown as AssessmentClaim;
    if (typeof claim.id !== "string" || !/^claim-\d{1,3}$/.test(claim.id) || claimIds.has(claim.id)) {
      issues.push(`Claim ${index + 1} has an invalid or duplicate id.`);
    } else claimIds.add(claim.id);
    if (!ASSESSMENT_SECTIONS.includes(claim.section as never)) issues.push(`Claim ${index + 1} has an invalid section.`);
    if (typeof claim.text !== "string" || claim.text.trim().length < 5 || claim.text.length > 700) issues.push(`Claim ${index + 1} has invalid text.`);
    if (!Array.isArray(claim.sourceFactIds) || claim.sourceFactIds.length < 1 || claim.sourceFactIds.length > 8) {
      issues.push(`Claim ${index + 1} must cite 1 to 8 source facts.`);
      return;
    }
    const sourceFacts = claim.sourceFactIds.map((id) => factMap.get(id)).filter(Boolean) as AssessmentFact[];
    if (sourceFacts.length !== claim.sourceFactIds.length) issues.push(`Claim ${index + 1} cites a nonexistent source fact.`);
    if (!POLARITIES.includes(claim.polarity as never)) issues.push(`Claim ${index + 1} has invalid polarity.`);
    if (!TEMPORAL_STATUSES.includes(claim.temporalStatus as never)) issues.push(`Claim ${index + 1} has invalid temporal status.`);
    if (claim.sourceType !== "mixed" && !SOURCE_TYPES.includes(claim.sourceType as never)) issues.push(`Claim ${index + 1} has invalid source type.`);
    issues.push(...validateClaimSemanticValues(claim, index + 1));
    if (sourceFacts.length) {
      issues.push(...validateSemanticSupport(claim, sourceFacts, index + 1));
    }
    claims.push(claim);
  });

  return { valid: issues.length === 0, issues, claims };
}

export function renderAssessmentFromClaims(claims: AssessmentClaim[]) {
  const bySection = new Map<AssessmentSection, AssessmentClaim[]>();
  claims.forEach((claim) => {
    bySection.set(claim.section, [...(bySection.get(claim.section) ?? []), claim]);
  });
  const narrativeSections: AssessmentSection[][] = [
    ["participant_context", "living_support"],
    ["functional_cognitive", "communication_sensory"],
    ["psychosocial_behavioral", "medical_psychiatric"],
    ["goals_barriers", "overall_impression"]
  ];
  const paragraphs = narrativeSections
    .map((sections) => sections.flatMap((section) => bySection.get(section) ?? []).map((claim) => claim.text.trim()).join(" "))
    .filter(Boolean)
    .slice(0, 5);
  const blocks = [paragraphs.join("\n\n")];
  appendClaimSection(blocks, "Strengths / Protective Factors", bySection.get("strengths_protective"));
  appendClaimSection(blocks, "Identified Needs / Barriers", bySection.get("goals_barriers"));
  appendClaimSection(blocks, "Safety Considerations", bySection.get("safety"));
  appendClaimSection(blocks, "Recommended Social-Work / Program Focus", bySection.get("program_focus"));
  return blocks.filter(Boolean).join("\n\n").trim();
}

export function sourceMappingInventory() {
  return SOURCE_MAPPINGS.map((mapping) => ({ ...mapping }));
}

function map(
  path: string,
  stepId: string,
  stepTitle: string,
  fieldLabel: string,
  domain: FactDomain,
  sourceType?: SourceType,
  temporalStatus?: TemporalStatus
): SourceMapping {
  return { path, stepId, stepTitle, fieldLabel, domain, sourceType, temporalStatus };
}

function deriveSemantics(path: string, value: string, domain: FactDomain): FactSemantics {
  const lower = value.toLowerCase();
  const polarity = inferPolarity(value);
  const diagnosisStatus = path === "medicalHistory.majorMedicalDiagnoses" || path === "medicalHistory.psychiatricDiagnoses"
    ? polarity === "denied" || polarity === "not_applicable"
      ? "none"
      : polarity === "unknown" || polarity === "not_assessed"
        ? "unknown"
        : "documented_diagnosis"
    : domain === "cognitive_screening"
      ? "screening_finding"
      : polarity === "unknown" || polarity === "not_assessed"
        ? "unknown"
      : /symptom|concern|mood|thought|behavior|memory/.test(`${path} ${lower}`)
        ? "symptom_or_concern"
        : "not_applicable";
  const relationshipStatus = /living|household|caregiver|support|family/.test(path.toLowerCase())
    ? polarity === "denied" || polarity === "not_applicable" ? "absent" : polarity === "unknown" || polarity === "not_assessed" ? "unknown" : "present"
    : "not_applicable";
  const isRisk = domain === "safety" || /risk|fall|adherence/.test(path.toLowerCase());
  const riskStatus = isRisk
    ? polarity === "denied" ? "denied" : polarity === "unknown" ? "unknown" : polarity === "not_assessed" ? "not_assessed" : polarity === "not_applicable" ? "not_applicable" : /history$/i.test(path) ? "historical" : /concern/.test(`${path} ${lower}`) ? "concern" : "present"
    : "not_applicable";
  const isFunctional = domain === "functional" || /mobility|adl|ambulation|transfer|shopping/.test(path.toLowerCase());
  const functionalStatus = isFunctional
    ? /independent|without assistance|self/.test(lower) ? "independent" : /assist|help|supervis|depend|unable/.test(lower) ? "assistance_required" : /variable|fluctuat/.test(lower) ? "variable" : polarity === "unknown" || polarity === "not_assessed" ? "unknown" : polarity === "not_applicable" ? "not_applicable" : "impaired"
    : "not_applicable";
  const isSubstance = /substance|alcohol|druguse|drug-use|drug_use/.test(path.toLowerCase());
  const substanceUseStatus = isSubstance
    ? polarity === "denied" ? "denied" : polarity === "unknown" ? "unknown" : polarity === "not_assessed" ? "not_assessed" : polarity === "not_applicable" ? "not_applicable" : /history|past|former/.test(`${path} ${lower}`) ? "historical" : /concern|misuse|problem/.test(lower) ? "concern" : "current"
    : "not_applicable";
  const isCaregiver = /caregiver|liveswith|household/.test(path.toLowerCase());
  const caregiverInvolvement = isCaregiver
    ? /stress|strain|overwhelm/.test(`${path} ${lower}`) && !["denied", "unknown", "not_assessed", "not_applicable"].includes(polarity) ? "strain_noted" : polarity === "denied" || polarity === "not_applicable" ? "absent" : polarity === "unknown" || polarity === "not_assessed" ? "unknown" : "active"
    : "not_applicable";
  const isService = domain === "goals_services" || domain === "discharge_planning" || /service|planofcare|levelofservice|referral/.test(path.toLowerCase());
  const serviceNeed = isService
    ? polarity === "denied" || polarity === "not_applicable" ? "not_needed" : /consider|potential|project|may/.test(lower) ? "consider" : /progress|requested|pending/.test(lower) ? "in_progress" : polarity === "unknown" || polarity === "not_assessed" ? "unknown" : "needed"
    : "not_applicable";
  return {
    polarity,
    diagnosisStatus,
    relationshipStatus,
    riskStatus,
    functionalStatus,
    substanceUseStatus,
    caregiverInvolvement,
    serviceNeed
  };
}

function inferPolarity(value: string) {
  const lower = value.trim().toLowerCase();
  if (/^(unknown|unsure|not known)\b/.test(lower)) return "unknown" as const;
  if (/^(not assessed|not evaluated)\b/.test(lower)) return "not_assessed" as const;
  if (/^(no|denied|none|negative|not present)\b/.test(lower) || /\bdenies?\b|\bno\s+(?:current\s+)?(?:risk|concern|history|use|falls?|ideation|attempts?)\b/.test(lower)) return "denied" as const;
  if (/^(not applicable|n\/a)$/.test(lower)) return "not_applicable" as const;
  return "affirmed" as const;
}

function inferTemporalStatus(path: string, value: string): TemporalStatus {
  const lower = `${path} ${value}`.toLowerCase();
  if (/\bcurrent|currently|today|now\b/.test(lower)) return "current";
  if (/\brecent|last\s+(?:week|month|six months)|past\s+(?:week|month|year)\b/.test(lower)) return "recent";
  if (/history|historical|previous|prior|past|former|ever/.test(lower)) return "historical";
  return "unknown";
}

function scanText(value: string, factId: string): PhiFinding[] {
  const findings: PhiFinding[] = [];
  PHI_PATTERNS.forEach(({ kind, pattern }) => {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(value))) {
      findings.push(createFinding(factId, kind, "hard_block", value, match.index, match[0]));
      if (match[0].length === 0) pattern.lastIndex += 1;
    }
  });
  PERSON_NAME_PATTERN.lastIndex = 0;
  let nameMatch: RegExpExecArray | null;
  while ((nameMatch = PERSON_NAME_PATTERN.exec(value))) {
    const normalized = nameMatch[0].replace(/[.]/g, "").trim();
    if (!NAME_EXCLUSIONS.has(normalized)) {
      findings.push(createFinding(factId, "person_name", "ambiguous", value, nameMatch.index, nameMatch[0]));
    }
    if (nameMatch[0].length === 0) PERSON_NAME_PATTERN.lastIndex += 1;
  }
  return deduplicateFindings(findings).sort((a, b) => a.start - b.start);
}

function createFinding(
  factId: string,
  kind: PhiFindingKind,
  severity: PhiFinding["severity"],
  fullText: string,
  start: number,
  detectedText: string
): PhiFinding {
  const end = start + detectedText.length;
  return {
    reviewKey: reviewDecisionKey({ factId, kind: kind as "person_name", start, end }),
    factId,
    kind,
    severity,
    start,
    end,
    detectedText,
    snippet: fullText.slice(Math.max(0, start - 45), Math.min(fullText.length, end + 45))
  };
}

export function detectSafetyConflicts(facts: AssessmentFact[]): SafetyConflict[] {
  const conflicts: SafetyConflict[] = [];
  SAFETY_TOPICS.forEach(({ topic, pattern }) => {
    const relevant = facts.filter((fact) => {
      if (fact.temporalStatus === "historical" && !/history/.test(fact.sourceField)) return false;
      return pattern.test(`${fact.sourceField} ${fact.normalizedValue}`);
    });
    const present = relevant.filter((fact) => fact.semantics.riskStatus === "present" || fact.semantics.riskStatus === "concern");
    const denied = relevant.filter((fact) => fact.semantics.riskStatus === "denied");
    if (present.length && denied.length) {
      conflicts.push({
        id: `conflict-${conflicts.length + 1}`,
        topic,
        factIds: [...new Set([...present, ...denied].map((fact) => fact.id))]
      });
    }
  });
  return conflicts;
}

function validateSemanticSupport(
  claim: AssessmentClaim,
  sourceFacts: AssessmentFact[],
  index: number
) {
  const issues: string[] = [];
  const temporal = new Set(sourceFacts.map((fact) => fact.temporalStatus));
  const sourceTypes = new Set(sourceFacts.map((fact) => fact.sourceType));
  if (!temporal.has(claim.temporalStatus)) {
    issues.push(`Claim ${index} changes the source temporal status.`);
  }
  if (claim.sourceType === "mixed") {
    if (sourceTypes.size < 2) issues.push(`Claim ${index} labels a single source type as mixed.`);
  } else if (!sourceTypes.has(claim.sourceType)) {
    issues.push(`Claim ${index} changes source attribution.`);
  }
  const axes: Array<keyof FactSemantics> = [
    "polarity", "diagnosisStatus", "relationshipStatus", "riskStatus",
    "functionalStatus", "substanceUseStatus", "caregiverInvolvement", "serviceNeed"
  ];
  axes.forEach((axis) => {
    const claimValue = axis === "polarity" ? claim.polarity : claim[axis];
    if (!sourceFacts.some((fact) => fact.semantics[axis] === claimValue)) {
      issues.push(`Claim ${index} has unsupported ${axis}.`);
    }
  });
  const sourceText = sourceFacts.map((fact) => fact.normalizedValue).join(" ");
  const claimNumbers = claim.text.match(/\b\d+(?:\.\d+)?\b/g) ?? [];
  claimNumbers.forEach((number) => {
    if (!new RegExp(`\\b${escapeRegex(number)}\\b`).test(sourceText)) {
      issues.push(`Claim ${index} introduces unsupported numeric information.`);
    }
  });
  const startsWithDiagnosticNegation = /^\s*(?:no|none|denied|without)\b/i.test(claim.text);
  const usesAffirmativeDiagnosticLanguage = /\b(?:diagnoses?|diagnosed)(?:\s+with)?\b|\bdiagnosis\s+of\b|\bhas\s+(?:a\s+)?diagnosis\b|\bmeets?\s+criteria\b/i.test(claim.text);
  if (usesAffirmativeDiagnosticLanguage && !startsWithDiagnosticNegation) {
    if (claim.diagnosisStatus !== "documented_diagnosis" || !sourceFacts.some((fact) => fact.semantics.diagnosisStatus === "documented_diagnosis")) {
      issues.push(`Claim ${index} makes an unsupported diagnostic statement.`);
    }
  }
  if (sourceFacts.some((fact) => fact.domain === "cognitive_screening") && /dement|neurocognitive|incapac|incompeten|eligib|diagnos/i.test(claim.text)) {
    issues.push(`Claim ${index} exceeds the cognitive-screening boundary.`);
  }
  const claimTokens = meaningfulTokens(claim.text);
  const sourceTokens = meaningfulTokens(sourceText);
  if (claimTokens.size > 2) {
    const overlap = [...claimTokens].filter((token) => sourceTokens.has(token)).length;
    if (overlap / claimTokens.size < 0.12) {
      issues.push(`Claim ${index} is not semantically supported by its cited facts.`);
    }
  }
  return issues;
}

function validateClaimSemanticValues(claim: AssessmentClaim, index: number) {
  const issues: string[] = [];
  if (!DIAGNOSIS_STATUSES.includes(claim.diagnosisStatus as never)) issues.push(`Claim ${index} has invalid diagnosis status.`);
  if (!RELATIONSHIP_STATUSES.includes(claim.relationshipStatus as never)) issues.push(`Claim ${index} has invalid relationship status.`);
  if (!RISK_STATUSES.includes(claim.riskStatus as never)) issues.push(`Claim ${index} has invalid risk status.`);
  if (!FUNCTIONAL_STATUSES.includes(claim.functionalStatus as never)) issues.push(`Claim ${index} has invalid functional status.`);
  if (!SUBSTANCE_USE_STATUSES.includes(claim.substanceUseStatus as never)) issues.push(`Claim ${index} has invalid substance-use status.`);
  if (!CAREGIVER_INVOLVEMENT_STATUSES.includes(claim.caregiverInvolvement as never)) issues.push(`Claim ${index} has invalid caregiver involvement.`);
  if (!SERVICE_NEED_STATUSES.includes(claim.serviceNeed as never)) issues.push(`Claim ${index} has invalid service-need status.`);
  return issues;
}

function validateSemantics(value: unknown, prefix: string) {
  if (!isObject(value)) return [`${prefix} semantics must be an object.`];
  const issues: string[] = [];
  const allowed = new Set([
    "polarity", "diagnosisStatus", "relationshipStatus", "riskStatus",
    "functionalStatus", "substanceUseStatus", "caregiverInvolvement", "serviceNeed"
  ]);
  Object.keys(value).forEach((key) => {
    if (!allowed.has(key)) issues.push(`${prefix} semantics contain unexpected field ${key}.`);
  });
  if (!POLARITIES.includes(value.polarity as never)) issues.push(`${prefix} has invalid polarity.`);
  if (!DIAGNOSIS_STATUSES.includes(value.diagnosisStatus as never)) issues.push(`${prefix} has invalid diagnosis status.`);
  if (!RELATIONSHIP_STATUSES.includes(value.relationshipStatus as never)) issues.push(`${prefix} has invalid relationship status.`);
  if (!RISK_STATUSES.includes(value.riskStatus as never)) issues.push(`${prefix} has invalid risk status.`);
  if (!FUNCTIONAL_STATUSES.includes(value.functionalStatus as never)) issues.push(`${prefix} has invalid functional status.`);
  if (!SUBSTANCE_USE_STATUSES.includes(value.substanceUseStatus as never)) issues.push(`${prefix} has invalid substance-use status.`);
  if (!CAREGIVER_INVOLVEMENT_STATUSES.includes(value.caregiverInvolvement as never)) issues.push(`${prefix} has invalid caregiver involvement.`);
  if (!SERVICE_NEED_STATUSES.includes(value.serviceNeed as never)) issues.push(`${prefix} has invalid service need.`);
  return issues;
}

function emptySemantics(overrides: Partial<FactSemantics> = {}): FactSemantics {
  return {
    polarity: "not_applicable",
    diagnosisStatus: "not_applicable",
    relationshipStatus: "not_applicable",
    riskStatus: "not_applicable",
    functionalStatus: "not_applicable",
    substanceUseStatus: "not_applicable",
    caregiverInvolvement: "not_applicable",
    serviceNeed: "not_applicable",
    ...overrides
  };
}

function approvedAmbiguousTexts(
  facts: AssessmentFact[],
  decisions: ReviewedAmbiguousFinding[]
) {
  const factMap = new Map(facts.map((fact) => [fact.id, fact]));
  const result = new Set<string>();
  decisions.forEach((decision) => {
    const value = factMap.get(decision.factId)?.normalizedValue;
    if (!value || decision.start < 0 || decision.end > value.length || decision.start >= decision.end) return;
    const match = value.slice(decision.start, decision.end);
    const rescanned = scanText(match, decision.factId);
    if (rescanned.some((finding) => finding.kind === "person_name" && finding.start === 0 && finding.end === match.length)) {
      result.add(match.toLowerCase());
    }
  });
  return result;
}

function reviewDecisionKey(value: Pick<ReviewedAmbiguousFinding, "factId" | "kind" | "start" | "end">) {
  return `${value.factId}:${value.kind}:${value.start}:${value.end}`;
}

function deduplicateFindings(findings: PhiFinding[]) {
  const keys = new Set<string>();
  return findings.filter((finding) => {
    const key = `${finding.kind}:${finding.start}:${finding.end}`;
    if (keys.has(key)) return false;
    keys.add(key);
    return true;
  });
}

function appendClaimSection(blocks: string[], title: string, claims?: AssessmentClaim[]) {
  if (!claims?.length) return;
  blocks.push(`${title}\n${claims.map((claim) => `- ${claim.text.trim()}`).join("\n")}`);
}

function extractCaregiverRole(value: string) {
  const lower = value.toLowerCase();
  const roles = [
    "daughter", "son", "spouse", "wife", "husband", "partner", "sister",
    "brother", "parent", "mother", "father", "niece", "nephew", "friend",
    "neighbor", "guardian", "caregiver", "home health aide"
  ];
  return roles.find((role) => new RegExp(`\\b${escapeRegex(role)}\\b`, "i").test(lower)) ?? "";
}

function normalizeValue(value: unknown) {
  if (Array.isArray(value)) return normalizeWhitespace(value.map(String).filter(Boolean).join("; "));
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return normalizeWhitespace(value);
  return "";
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getValueByPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
}

function parseIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

function slug(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function simpleHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function meaningfulTokens(value: string) {
  return new Set(
    (value.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter((token) => !STOP_WORDS.has(token))
  );
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
