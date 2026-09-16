import "server-only";

const ISSUE_RULES = [
  ["semantic_review_incomplete", /^semantic_review_incomplete$/],
  ["semantic_unsupported_statement", /^semantic_unsupported_statement$/],
  ["semantic_polarity_changed", /^semantic_polarity_changed$/],
  ["semantic_temporal_changed", /^semantic_temporal_changed$/],
  ["semantic_attribution_changed", /^semantic_attribution_changed$/],
  ["semantic_unsupported_diagnosis", /^semantic_unsupported_diagnosis$/],
  ["semantic_screening_boundary", /^semantic_screening_boundary$/],
  ["semantic_unsupported_plan", /^semantic_unsupported_plan$/],
  ["semantic_safety_changed", /^semantic_safety_changed$/],
  ["synthesis_shape", /^invalid_synthesis_shape$/],
  ["unsupported_statement", /^unsupported_statement$/],
  ["source_attribution_changed", /^source_attribution_changed$/],
  ["authoritative_safety_boundary", /^authoritative_safety_boundary$/],
  ["screening_boundary", /^screening_boundary$/],
  ["unsupported_numeric", /^unsupported_numeric$/],
  ["unsupported_diagnosis", /^unsupported_diagnosis$/],
  ["unsupported_relationship", /^unsupported_relationship$/],
  ["unsupported_clinical_concept", /^unsupported_clinical_concept$/],
  ["unsupported_commitment", /^unsupported_commitment$/],
  ["unsupported_treatment_detail", /^unsupported_treatment_detail$/],
  ["plan_not_prospective", /^plan_not_prospective$/],
  ["missing_source", /^missing_source$/],
  ["denial_changed_to_positive", /^denial_changed_to_positive$/],
  ["affirmed_changed_to_denied", /^affirmed_changed_to_denied$/],
  ["unknown_made_known", /^unknown_made_known$/],
  ["historical_fact_made_current", /^historical_fact_made_current$/],
  ["unsupported_numeric", /introduces unsupported numeric information/],
  ["unsupported_diagnosis", /makes an unsupported diagnostic statement/],
  ["screening_boundary", /exceeds the cognitive-screening boundary/],
  ["low_source_overlap", /is not semantically supported by its cited facts/],
  ["missing_source", /cites a nonexistent source fact/],
  ["citation_shape", /must cite 1 to 8 source facts/],
  ["temporal_mismatch", /changes the source temporal status/],
  ["source_type_mismatch", /changes source attribution|labels a single source type as mixed/],
  ["semantic_mismatch", /has unsupported (?:polarity|diagnosisStatus|relationshipStatus|riskStatus|functionalStatus|substanceUseStatus|caregiverInvolvement|serviceNeed)/],
  ["invalid_shape", /invalid|duplicate|unexpected field|must be an object/]
] as const;

export function classifyAssessmentValidationIssues(issues: string[]) {
  const counts: Record<string, number> = {};
  for (const issue of issues) {
    const category = ISSUE_RULES.find(([, pattern]) => pattern.test(issue))?.[0] ?? "other";
    counts[category] = (counts[category] ?? 0) + 1;
  }
  return counts;
}

// The log contains only fixed category names and integer counts. Never log
// issue strings, claims, facts, provider output, or the assessment narrative.
export function recordAssessmentValidationFailure(issues: string[], claimCount: number) {
  console.info("assessment_validation_failure", JSON.stringify({
    claimCount,
    issueCount: issues.length,
    categories: classifyAssessmentValidationIssues(issues)
  }));
}

export function recordAssessmentValidationSuccess(
  elapsedMs: number,
  owner: boolean,
  format: "claims-v1" | "synthesis-v1" | "synthesis-v2" | "synthesis-v3"
) {
  console.info("assessment_validation_success", JSON.stringify({
    elapsedMs: Math.max(0, Math.round(elapsedMs)),
    format,
    grounding: "passed", safety: "passed", screening: "passed", outputPhi: "passed",
    owner, chargedCredits: owner ? 0 : 1
  }));
}
