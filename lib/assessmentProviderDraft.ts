import {
  ASSESSMENT_SECTIONS,
  type AssessmentClaim,
  type AssessmentFact,
  type AssessmentSection,
  type FactSemantics
} from "@/types/assessment";

type ProviderClaim = {
  section: AssessmentSection;
  text: string;
  sourceFactIds: string[];
};

// The server retains the complete facts for every validation gate. Omit only
// duplicated prompt metadata; an omitted semantic axis means not_applicable.
export function compactFactsForProvider(facts: AssessmentFact[]) {
  return facts.map((fact) => ({
    id: fact.id,
    domain: fact.domain,
    sourceField: fact.sourceField,
    sourceType: fact.sourceType,
    temporalStatus: fact.temporalStatus,
    normalizedValue: fact.normalizedValue,
    semantics: Object.fromEntries(
      Object.entries(fact.semantics).filter(([, value]) => value !== "not_applicable")
    ) as Partial<FactSemantics>
  }));
}

// The provider writes prose and citations. All status metadata is copied from
// the cited source fact, never invented by the model. The first citation is
// the claim's semantic anchor; mixed source attribution is derived separately.
export function hydrateProviderClaims(candidate: unknown, facts: AssessmentFact[]): AssessmentClaim[] | null {
  if (!Array.isArray(candidate) || candidate.length < 1 || candidate.length > 60) return null;
  const factMap = new Map(facts.map((fact) => [fact.id, fact]));
  const claims: AssessmentClaim[] = [];

  for (const [index, value] of candidate.entries()) {
    if (!isRecord(value) || Object.keys(value).some((key) => !["section", "text", "sourceFactIds"].includes(key))) return null;
    const claim = value as ProviderClaim;
    if (!ASSESSMENT_SECTIONS.includes(claim.section) || typeof claim.text !== "string" ||
      !Array.isArray(claim.sourceFactIds) || claim.sourceFactIds.length < 1 || claim.sourceFactIds.length > 8 ||
      claim.sourceFactIds.some((id) => typeof id !== "string" || !factMap.has(id))) return null;

    const primary = factMap.get(claim.sourceFactIds[0]);
    if (!primary) return null;
    const sourceTypes = new Set(claim.sourceFactIds.map((id) => factMap.get(id)?.sourceType));
    claims.push({
      id: `claim-${index + 1}`,
      section: claim.section,
      text: claim.text,
      sourceFactIds: claim.sourceFactIds,
      polarity: primary.semantics.polarity,
      temporalStatus: primary.temporalStatus,
      sourceType: sourceTypes.size > 1 ? "mixed" : primary.sourceType,
      diagnosisStatus: primary.semantics.diagnosisStatus,
      relationshipStatus: primary.semantics.relationshipStatus,
      riskStatus: primary.semantics.riskStatus,
      functionalStatus: primary.semantics.functionalStatus,
      substanceUseStatus: primary.semantics.substanceUseStatus,
      caregiverInvolvement: primary.semantics.caregiverInvolvement,
      serviceNeed: primary.semantics.serviceNeed
    });
  }
  return claims;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
