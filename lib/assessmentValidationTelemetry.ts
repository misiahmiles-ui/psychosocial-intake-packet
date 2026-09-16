import "server-only";

const ISSUE_RULES = [
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
