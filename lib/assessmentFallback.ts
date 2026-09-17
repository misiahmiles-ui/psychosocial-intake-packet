// Deterministic NJ fallback: conditional sections use only reviewed intake
// values. No model, NoteOrigin, claim graph, or probabilistic validator.
import type { AssessmentFact } from "@/types/assessment";
import { renderAssessmentSynthesis, scanAssessmentSynthesis, authoritativeAssessmentBlocks, verifiedNarrativeOptions,
  type AssessmentSynthesis, type SynthesisBlock } from "@/lib/assessmentSynthesis";

export function buildDeterministicAssessment(facts: AssessmentFact[]) {
  const byField = new Map(facts.map((fact) => [fact.sourceField, fact]));
  const blocks: SynthesisBlock[] = [];
  const ids = new Set<string>();
  // The same source-bound clinical statement catalogue is used for the built-in
  // assessment and for validation of the optional AI-organized narrative.
  const record = (field: string, _prefix: string, section: SynthesisBlock["section"] = "assessment") => {
    const fact = byField.get(field);
    if (!fact?.normalizedValue.trim() || ["safety", "cognitive_screening"].includes(fact.domain)) return "";
    const wording = verifiedNarrativeOptions(fact, section)[0];
    if (!wording) return "";
    ids.add(fact.id);
    return wording;
  };
  const add = (section: SynthesisBlock["section"], parts: string[]) => {
    const text = parts.filter(Boolean).join(" ");
    if (text) blocks.push({ section, text, sourceFactIds: [...ids] });
    ids.clear();
  };
  const answer = (field: string, positive: string, negative: string, other: string) => {
    const fact = byField.get(field);
    if (!fact) return "";
    const value = fact.normalizedValue.trim().toLowerCase();
    if (value !== "yes" && value !== "no") return record(field, other);
    ids.add(fact.id);
    return value === "yes" ? positive : negative;
  };
  const age = byField.get("calculated-age");
  let ageText = "";
  if (age) {
    const exact = age.normalizedValue.match(/^age: (\d+)$/);
    if (exact) { ids.add(age.id); ageText = `The participant is a ${exact[1]}-year-old adult.`; }
    else ageText = record("calculated-age", "The intake records the following age range: ");
  }
  add("assessment", [ageText,
    record("identifying-primary-language", "The recorded primary language is "),
    answer("identifying-interpreter-needed", "An interpreter is needed.", "An interpreter is not needed.", "Interpreter need is recorded as "),
    record("living-current-residence", "Current living circumstances are described as follows: "),
    record("living-lives-with", "The household and available support are described as follows: "),
    answer("identifying-guardian-proxy-on-file", "A guardian or health care proxy is on file.", "No guardian or health care proxy is on file.", "Guardian or proxy status is recorded as "),
    record("living-transportation", "Transportation arrangements are documented as follows: ")]);
  add("assessment", [
    record("functional-orientation", "At intake, orientation is described as follows: "),
    record("functional-memory-concerns", "The record notes the following about memory: "),
    record("functional-decision-making", "Decision-making support is described as follows: "),
    record("functional-ambulation", "Regarding mobility, the intake records: "),
    record("functional-transfers", "Transfer support is documented as follows: "),
    record("functional-adl-help", "For activities of daily living, the intake records: ")]);
  add("assessment", [
    record("psychosocial-baseline-mood", "The psychosocial presentation is described as follows: "),
    record("psychosocial-mental-health-history", "The mental health history records: "),
    record("psychosocial-current-stressors", "Current stressors documented at intake include: "),
    record("psychosocial-social-engagement", "Social engagement is described as follows: "),
    record("psychosocial-thought-behavior-concerns", "The intake describes thought and behavior as follows: ")]);
  add("assessment", [
    record("medical-history-major-medical-diagnoses", "The documented medical history lists: "),
    record("medical-history-psychiatric-diagnoses", "Psychiatric diagnostic information is documented as follows: "),
    record("medical-history-current-medications", "Medication information in the intake is recorded as follows: "),
    record("conditions-medication-management", "Medication management is described as follows: "),
    record("communication-communication-needs", "Communication support needs are documented as follows: "),
    record("home-visit-comments", "The home-visit record describes the environment as follows: "),
    record("maryland-psychosocial-contribution", "The Maryland addendum records the following psychosocial contribution: "),
    record("maryland-notes", "Additional Maryland documentation records: ")]);
  add("strengths", [
    record("psychosocial-strengths-coping", "", "strengths"),
    record("home-visit-group-community-supports", "", "strengths")]);
  add("needs", [
    record("psychosocial-current-stressors", "", "needs"),
    record("goals-social-work-services-needed", "", "needs")]);
  // Prospective discussion of documented goals only; no assertion of consent,
  // referral, appointment or completed service is generated by a template.
  for (const [field, prefix] of [
    ["goals-participant-family-goals", "Collaboratively review and prioritize the goals recorded in the intake: "],
    ["goals-social-work-services-needed", "Explore appropriate support for the recorded service needs: "],
    ["goals-service-priorities", "Use the documented priorities to guide ongoing care planning: "],
    ["quarterly-discharge-supportive-services", "Review the documented supportive-service considerations as needs change: "],
    ["maryland-discharge-reason", "Review the documented discharge planning considerations: "]
  ].slice(0, 4)) add("plan", [record(field, prefix, "plan")]);
  const note: AssessmentSynthesis = { blocks };
  const authoritative = authoritativeAssessmentBlocks(facts);
  return {
    text: renderAssessmentSynthesis(note, facts),
    outputPhiFindings: scanAssessmentSynthesis(note, facts),
    sourceFactIds: [...new Set([...blocks.flatMap((block) => block.sourceFactIds),
      ...authoritative.safety.flatMap((block) => block.sourceFactIds), ...(authoritative.screening?.sourceFactIds ?? [])])]
  };
}
