// Ported from LeanMaster production ef76ca0735ed841e82fa98eed48420724709468b.
// Import paths adapted; policy adaptations are documented separately.
import {
  extractSafetyFactContract,
  type SafetyFact,
  type SafetyFactCategory
} from "@/lib/leanmaster/src/server/note/safetyFactContract";
import {
  normalizeSupportText,
  segmentSupportSources,
  type SupportSourceInput
} from "@/lib/leanmaster/src/support/textNormalization";

// Adult emergency routing is a projection of the universal atomic fact
// contract. These categories are intentionally siblings: a command-
// hallucination fact never creates, denies, or affirms PSYCHOSIS,
// HALLUCINATIONS, or DELUSIONS.
export const adultSafetyConditions = [
  "SUICIDAL_IDEATION",
  "HOMICIDAL_IDEATION",
  "SELF_HARM",
  "PSYCHOSIS",
  "HALLUCINATIONS",
  "DELUSIONS",
  "COMMAND_HALLUCINATIONS",
  "ACUTE_MEDICAL_EMERGENCY",
  "OVERDOSE",
  "WITHDRAWAL"
] as const satisfies readonly SafetyFactCategory[];

export type AdultSafetyCondition = (typeof adultSafetyConditions)[number];

export const adultSafetyStates = [
  "CURRENT_PRESENT",
  "EXPLICITLY_DENIED",
  "HISTORICAL_ONLY",
  "THIRD_PARTY_CONCERN",
  "AMBIGUOUS_OR_INSUFFICIENT",
  "NOT_DOCUMENTED"
] as const;

export type AdultSafetyState = (typeof adultSafetyStates)[number];

export type AdultSafetyEvidence = {
  condition: AdultSafetyCondition;
  state: Exclude<AdultSafetyState, "NOT_DOCUMENTED">;
  sourceField: string;
  sourceLocation: string;
  originalText: string;
};

export type AdultSafetyConditionResult = {
  condition: AdultSafetyCondition;
  state: AdultSafetyState;
};

export type AdultSafetyResult = {
  schemaVersion: "adult-safety-result.v1";
  conditions: Record<AdultSafetyCondition, AdultSafetyConditionResult>;
  currentEmergencyRoutingRequired: boolean;
  evidence: AdultSafetyEvidence[];
};

export type PublicAdultSafetyResult = Omit<AdultSafetyResult, "evidence">;

const REVOKED_SAFETY_DENIAL =
  /\b(?:denial|denials|denied)\b[^.!?;]{0,100}\b(?:no\s+longer|not\s+(?:accurate|applicable|current|valid)|retracted|withdrawn)\b/i;
const NON_ASSERTIVE_SAFETY_MONITORING =
  /^(?:(?:the\s+)?(?:staff|clinician|provider|member|client|patient|participant|he|she|they)\s+)?(?:(?:will|should|plans?\s+to|agreed\s+to)\s+(?:continue\s+to\s+)?(?:monitor|assess|screen|watch)\s+(?:the\s+member\s+)?(?:for|regarding)|(?:ongoing|continued)\s+(?:monitoring|assessment|screening)\s+(?:for|of))\b[^.!?;]*[.!?]?$/i;

function adultStateForAtomicFact(fact: SafetyFact): AdultSafetyState {
  if (fact.state === "NOT_DOCUMENTED") return "NOT_DOCUMENTED";
  if (fact.state === "DENIED") return "EXPLICITLY_DENIED";
  if (fact.state === "HISTORICAL") return "HISTORICAL_ONLY";
  if (
    ["NOT_ASSESSED", "UNKNOWN", "AMBIGUOUS"].includes(fact.state)
  ) {
    return "AMBIGUOUS_OR_INSUFFICIENT";
  }
  if (fact.attribution === "THIRD_PARTY") return "THIRD_PARTY_CONCERN";
  return "CURRENT_PRESENT";
}

function adultStateForCondition(
  contract: ReturnType<typeof extractSafetyFactContract>,
  condition: AdultSafetyCondition
): AdultSafetyState {
  const current = adultStateForAtomicFact(contract.facts[condition]);
  if (
    condition === "SUICIDAL_IDEATION" &&
    current === "NOT_DOCUMENTED" &&
    contract.facts.SUICIDAL_IDEATION_HISTORY.state === "PRESENT"
  ) {
    return "HISTORICAL_ONLY";
  }
  return current;
}

function factForCondition(text: string, condition: AdultSafetyCondition) {
  return extractSafetyFactContract(text).facts[condition];
}

export function hasCurrentAdultSafetyAssertion(
  text: string,
  condition: AdultSafetyCondition
) {
  return adultStateForAtomicFact(factForCondition(text, condition)) === "CURRENT_PRESENT";
}

export function isRevokedSafetyDenialText(text: string) {
  return REVOKED_SAFETY_DENIAL.test(text);
}

export function hasExplicitSafetyDenialText(text: string) {
  const contract = extractSafetyFactContract(text);
  return adultSafetyConditions.some(
    (condition) => contract.facts[condition].state === "DENIED"
  );
}

export function isNonAssertiveSafetyMonitoringText(text: string) {
  return (
    NON_ASSERTIVE_SAFETY_MONITORING.test(text.trim()) &&
    adultSafetyConditions.every(
      (condition) => factForCondition(text, condition).state === "NOT_DOCUMENTED"
    )
  );
}

export function classifyAdultSafetySources(
  sources: SupportSourceInput[]
): AdultSafetyResult {
  const sourceSegments = segmentSupportSources(sources);
  const combinedContract = extractSafetyFactContract(
    sourceSegments.map((segment) => segment.originalText).join("\n")
  );
  const conditions = Object.fromEntries(
    adultSafetyConditions.map((condition) => [
      condition,
      {
        condition,
        state: adultStateForCondition(combinedContract, condition)
      }
    ])
  ) as Record<AdultSafetyCondition, AdultSafetyConditionResult>;

  const evidence: AdultSafetyEvidence[] = [];
  for (const segment of sourceSegments) {
    const sourceContract = extractSafetyFactContract(segment.originalText);
    for (const condition of adultSafetyConditions) {
      const state = adultStateForCondition(sourceContract, condition);
      if (state === "NOT_DOCUMENTED") continue;
      evidence.push({
        condition,
        state,
        sourceField: segment.sourceField,
        sourceLocation: segment.sourceLocation,
        originalText: segment.originalText
      });
    }
  }

  return {
    schemaVersion: "adult-safety-result.v1",
    conditions,
    currentEmergencyRoutingRequired: adultSafetyConditions.some(
      (condition) => conditions[condition].state === "CURRENT_PRESENT"
    ),
    evidence
  };
}

export function classifyAdultSafetyText(
  text: string,
  sourceField = "sourceText"
) {
  return classifyAdultSafetySources([{ field: sourceField, text }]);
}

export function publicAdultSafetyResult(
  result: AdultSafetyResult
): PublicAdultSafetyResult {
  return {
    schemaVersion: result.schemaVersion,
    conditions: result.conditions,
    currentEmergencyRoutingRequired: result.currentEmergencyRoutingRequired
  };
}

export function adultSafetyPromptSummary(result: AdultSafetyResult) {
  return adultSafetyConditions
    .map((condition) => `${condition}: ${result.conditions[condition].state}`)
    .join("\n");
}

export function hasDocumentedAdultSafetyConcern(result: AdultSafetyResult) {
  return adultSafetyConditions.some((condition) =>
    ["CURRENT_PRESENT", "THIRD_PARTY_CONCERN"].includes(
      result.conditions[condition].state
    )
  );
}

export function normalizeAdultSafetySourceText(text: string) {
  return normalizeSupportText(text);
}
