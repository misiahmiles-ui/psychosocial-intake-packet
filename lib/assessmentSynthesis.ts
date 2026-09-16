import { sourceMappingInventory, scanGeneratedClaims } from "@/lib/assessment";
import type { AssessmentFact } from "@/types/assessment";
import { semanticReviewIssues, type SemanticReview } from "@/lib/assessmentSemanticReview";

// The model supplies prose once, with direct immutable source IDs. There is no
// second copy of the narrative or model-authored polarity/provenance metadata.
export const SYNTHESIS_SECTIONS = ["assessment", "strengths", "needs", "plan"] as const;
export type SynthesisBlock = {
  section: typeof SYNTHESIS_SECTIONS[number];
  text: string;
  sourceFactIds: string[];
};
export type AssessmentSynthesis = { blocks: SynthesisBlock[]; semanticReview?: SemanticReview };

const slug = (value: string) => value.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
const labels = new Map(sourceMappingInventory().map((source) => [slug(source.path), source.fieldLabel]));
export function sourceEvidenceText(fact: AssessmentFact) {
  return `${sourceEvidenceLabel(fact)}: ${fact.normalizedValue}`;
}
export function sourceEvidenceLabel(fact: AssessmentFact) { return labels.get(fact.sourceField) ?? fact.sourceField.replace(/-/g, " "); }

export function parseAssessmentSynthesis(value: unknown): AssessmentSynthesis | null {
  if (!record(value) || Object.keys(value).some((key) => !["blocks", "semanticReview"].includes(key)) || !Array.isArray(value.blocks) || value.blocks.length > 11) return null;
  const blocks: SynthesisBlock[] = [];
  for (const raw of value.blocks) {
    if (!record(raw) || Object.keys(raw).length !== 3 ||
      !SYNTHESIS_SECTIONS.includes(raw.section as never) || typeof raw.text !== "string" ||
      raw.text.trim().length < 5 || raw.text.length > 1100 || /\n/.test(raw.text) ||
      !Array.isArray(raw.sourceFactIds) || raw.sourceFactIds.length < 1 || raw.sourceFactIds.length > 16 ||
      raw.sourceFactIds.some((id) => typeof id !== "string" || !/^fact-\d{3}$/.test(id)) ||
      new Set(raw.sourceFactIds).size !== raw.sourceFactIds.length) return null;
    blocks.push(raw as SynthesisBlock);
  }
  const count = (section: SynthesisBlock["section"]) => blocks.filter((block) => block.section === section).length;
  if (count("assessment") < 3 || count("assessment") > 5 || count("strengths") > 1 ||
    count("needs") > 1 || count("plan") < 2 || count("plan") > 4) return null;
  return { blocks, ...(value.semanticReview === undefined ? {} : { semanticReview: value.semanticReview as SemanticReview }) };
}

const DENIAL = /\b(?:no|not|denies?|denied|without|none|negative|absent)\b/i;
const UNKNOWN = /\b(?:unknown|unclear|not assessed|not evaluated|not documented|not reported|unsure)\b/i;
const HISTORY = /\b(?:histor(?:y|ical)|past|prior|previous|formerly|ago|lifetime)\b/i;
const RECOMMENDATION = /\b(?:recommend|consider|offer|support|review|monitor|discuss|explore|encourage|assist|maintain|promote|coordinate|reinforce|facilitate|continue|goal)\w*\b/i;
const COMMITMENT = /\b(?:agreed|committed|consented|will|scheduled|referred|completed|provided|prescribed)\b/i;
const DIAGNOSIS = /\b(?:diagnos\w*|meets? criteria|dementia|neurocognitive|schizophren\w*|bipolar|major depressive disorder|generalized anxiety disorder|ptsd)\b/i;
const SCREENING_CONCLUSION = /\b(?:dementia|neurocognitive|incompeten\w*|incapacit\w*|eligible|eligibility|diagnos\w*)\b/i;
const SAFETY = /\b(?:suicid\w*|self[- ]harm|homicid\w*|harm to (?:self|others)|abuse|neglect|exploitation|elopement|wandering|safety risk|risk[- ]free)\b/i;
const RELATIONSHIPS = /\b(?:mother|father|parent|guardian|sister|brother|spouse|husband|wife|partner|son|daughter|child|caregiver|family)\b/gi;
const CONCEPTS = [
  /\b(?:depress\w*|sadness)\b/i, /\b(?:anxi\w*|panic)\b/i,
  /\b(?:psychosis|psychotic|hallucinat\w*|delusion\w*)\b/i,
  /\b(?:mania|manic|bipolar)\b/i, /\b(?:trauma|ptsd)\b/i,
  /\b(?:alcohol|substance|drug use)\b/i, /\b(?:homeless\w*|eviction)\b/i,
  /\b(?:diabet\w*|insulin)\b/i, /\b(?:hypertension|blood pressure)\b/i,
  /\bsevere\b/i, /\bmild\b/i, /\bmoderate\b/i, /\bimpaired\b/i, /\bindependent\b/i, /\bdependent\b/i,
  /\b(?:dementia|neurocognitive)\b/i, /\b(?:cancer|malignancy)\b/i, /\b(?:epilepsy|seizures?)\b/i,
  /\b(?:medication|medicine|prescription)\b/i,
  /\b(?:CBT|DBT|EMDR|psychotherapy|cognitive behavioral therapy|dialectical behavior therapy)\b/i
];
const STOP = new Set("the and with from that this their participant intake reported reports report documented documentation current assessment support plan goal consider recommend review offer needs need may can care service services program staff information notes response".split(" "));
function tokens(value: string) {
  return new Set((value.toLowerCase().match(/[a-z]{3,}/g) ?? []).filter((word) => !STOP.has(word))
    .map((word) => word.replace(/(?:ing|ed|es|s)$/, "")));
}
function related(text: string, fact: AssessmentFact) {
  const source = tokens(sourceEvidenceText(fact));
  const words = tokens(text);
  return [...words].filter((word) => source.has(word)).length;
}
function sentences(text: string) { return text.split(/(?<=[.!?])\s+|;\s*/).filter(Boolean); }

// Fail closed on provenance, clinical boundaries, attribution and unsupported
// details. Labels are context for short form answers, never affirmative facts:
// e.g. "Interpreter needed: No" cannot support "needs an interpreter".
export function validateAssessmentSynthesis(candidate: unknown, facts: AssessmentFact[]) {
  const synthesis = parseAssessmentSynthesis(candidate);
  const issues: string[] = [];
  if (!synthesis) return { valid: false, issues: ["invalid_synthesis_shape"] };
  const reviewIssues = synthesis.semanticReview === undefined ? null : semanticReviewIssues(synthesis.semanticReview, synthesis.blocks.length);
  if (reviewIssues) issues.push(...reviewIssues);
  const semanticallyReviewed = reviewIssues !== null && reviewIssues.length === 0;
  const semanticIssue = (issue: string) => { if (!semanticallyReviewed) issues.push(issue); };
  const ledger = new Map(facts.map((fact) => [fact.id, fact]));
  for (const block of synthesis.blocks) {
    const sources = block.sourceFactIds.map((id) => ledger.get(id)).filter((fact): fact is AssessmentFact => Boolean(fact));
    if (sources.length !== block.sourceFactIds.length) { issues.push("missing_source"); continue; }
    const plan = block.section === "plan";
    if (sources.some((fact) => fact.domain === "cognitive_screening")) issues.push("screening_boundary");
    if (!plan && sources.some((fact) => fact.domain === "safety")) issues.push("authoritative_safety_boundary");
    const authority = sources.map(sourceEvidenceText).join(" ");
    const values = sources.map((fact) => fact.normalizedValue).join(" ");
    const sourceNumbers = new Set<string>(values.match(/\b\d+(?:\.\d+)?\b/g) ?? []);
    for (const sentence of sentences(block.text)) {
      const relevant = sources.filter((fact) => related(sentence, fact) > 0);
      if (!relevant.length) semanticIssue("unsupported_statement");
      const relevantValues = relevant.map((fact) => fact.normalizedValue).join(" ");
      const sentenceTokens = tokens(sentence);
      const authorityTokens = tokens(authority);
      if (sentenceTokens.size > 2 && [...sentenceTokens].filter((token) => authorityTokens.has(token)).length / sentenceTokens.size < 0.12) semanticIssue("unsupported_statement");
      for (const number of sentence.match(/\b\d+(?:\.\d+)?\b/g) ?? []) {
        if (!sourceNumbers.has(number)) issues.push("unsupported_numeric");
      }
      for (const relationship of sentence.match(RELATIONSHIPS) ?? []) {
        if (!new RegExp(`\\b${relationship}\\b`, "i").test(values)) semanticIssue("unsupported_relationship");
      }
      for (const concept of CONCEPTS) {
        if (concept.test(sentence) && !concept.test(authority)) issues.push("unsupported_clinical_concept");
        if (!plan && concept.test(sentence)) {
          const conceptSources = relevant.filter((fact) => concept.test(sourceEvidenceText(fact)));
          if (conceptSources.length && conceptSources.every((fact) => fact.semantics.polarity === "denied") && !DENIAL.test(sentence)) semanticIssue("denial_changed_to_positive");
          if (conceptSources.length && conceptSources.every((fact) => fact.semantics.polarity === "affirmed" && !DENIAL.test(fact.normalizedValue)) && DENIAL.test(sentence)) semanticIssue("affirmed_changed_to_denied");
          if (conceptSources.length && conceptSources.every((fact) => HISTORY.test(fact.normalizedValue) || ["historical", "lifetime"].includes(fact.temporalStatus)) && !HISTORY.test(sentence)) semanticIssue("historical_fact_made_current");
        }
      }
      if (DIAGNOSIS.test(sentence) && !sources.some((fact) =>
        (fact.semantics.diagnosisStatus === "documented_diagnosis" ||
          (fact.semantics.diagnosisStatus === "none" && DENIAL.test(sentence)) ||
          (fact.semantics.diagnosisStatus === "unknown" && UNKNOWN.test(sentence))) && related(sentence, fact) > 0)) issues.push("unsupported_diagnosis");
      if (SCREENING_CONCLUSION.test(sentence) && /\b(?:screen|orientation|recall|cognitive)\w*\b/i.test(sentence)) issues.push("screening_boundary");
      if (!plan && SAFETY.test(sentence)) issues.push("authoritative_safety_boundary");
      if (plan) {
        if (!RECOMMENDATION.test(sentence)) issues.push("plan_not_prospective");
        // A recommended goal is not an agreement, completed intervention,
        // referral authorization or newly prescribed course of treatment.
        if (COMMITMENT.test(sentence) && !COMMITMENT.test(relevantValues)) issues.push("unsupported_commitment");
        if (/\b(?:daily|weekly|monthly|sessions?|dosage|dose|mg)\b/i.test(sentence) && !/\b(?:daily|weekly|monthly|sessions?|dosage|dose|mg)\b/i.test(values)) issues.push("unsupported_treatment_detail");
      } else {
        if (relevant.every((fact) => fact.semantics.polarity === "denied") && !DENIAL.test(sentence)) semanticIssue("denial_changed_to_positive");
        if (relevant.every((fact) => fact.semantics.polarity === "affirmed" && !DENIAL.test(fact.normalizedValue)) && DENIAL.test(sentence) && !UNKNOWN.test(sentence)) semanticIssue("affirmed_changed_to_denied");
        if (relevant.every((fact) => ["unknown", "not_assessed"].includes(fact.semantics.polarity)) && !UNKNOWN.test(sentence)) semanticIssue("unknown_made_known");
        if (relevant.every((fact) => ["historical", "lifetime"].includes(fact.temporalStatus)) && !HISTORY.test(sentence)) semanticIssue("historical_fact_made_current");
        if (relevant.every((fact) => fact.sourceType === "caregiver_report") && !/\b(?:caregiver|family)\s+(?:reports?|reported|states?|stated)/i.test(sentence)) semanticIssue("source_attribution_changed");
        if (relevant.every((fact) => fact.sourceType === "participant_report") && !/\b(?:participant|self)[- ]report|\bparticipant\s+(?:reports?|reported|states?|stated|describes?)/i.test(sentence)) semanticIssue("source_attribution_changed");
      }
    }
  }
  return { valid: issues.length === 0, issues };
}

// Safety and screening are authoritative source renderings, not AI prose.
// Thus omission, negation loss, and diagnostic conversion cannot be introduced
// by the provider. They are still included in the final output privacy scan.
export function authoritativeAssessmentBlocks(facts: AssessmentFact[]) {
  const safety = facts.filter((fact) => fact.domain === "safety").map((fact) => ({
    text: `${sourceEvidenceText(fact)}.`, sourceFactIds: [fact.id]
  }));
  const screeningFacts = facts.filter((fact) => fact.domain === "cognitive_screening");
  const counts = { correct: 0, incorrect: 0, unable: 0, unspecified: 0 };
  for (const fact of screeningFacts) {
    const status = fact.normalizedValue.match(/^response: (correct|incorrect|unable)(?:;|$)/)?.[1] as keyof typeof counts | undefined;
    counts[status ?? "unspecified"]++;
  }
  const screening = screeningFacts.length ? {
    text: `Brief mental-status screening recorded ${counts.correct} correct, ${counts.incorrect} incorrect, ${counts.unable} unable-to-answer, and ${counts.unspecified} unspecified responses. These screening observations do not establish a diagnosis, capacity, competency, or eligibility determination.`,
    sourceFactIds: screeningFacts.map((fact) => fact.id)
  } : null;
  return { safety, screening };
}

export function renderAssessmentSynthesis(synthesis: AssessmentSynthesis, facts: AssessmentFact[]) {
  const select = (section: SynthesisBlock["section"]) => synthesis.blocks.filter((block) => block.section === section).map((block) => block.text.trim());
  const authoritative = authoritativeAssessmentBlocks(facts);
  const paragraphs = select("assessment");
  if (authoritative.screening) paragraphs[paragraphs.length - 1] += ` ${authoritative.screening.text}`;
  const sections = ["Psychosocial Assessment", paragraphs.join("\n\n")];
  for (const [heading, content] of [
    ["Strengths / Protective Factors", select("strengths").join(" ")],
    ["Identified Needs / Barriers", select("needs").join(" ")],
    ["Safety Considerations", authoritative.safety.map((block) => block.text).join(" ")],
    ["Treatment / Service Plan", select("plan").map((text, index) => `${index + 1}. ${text}`).join("\n")]
  ]) if (content) sections.push(heading, content);
  return sections.join("\n\n");
}

export function scanAssessmentSynthesis(synthesis: AssessmentSynthesis, facts: AssessmentFact[]) {
  // Scan every dynamic part, including server-rendered source values. Static
  // headings are not person names and contain no user/provider content.
  const authoritative = authoritativeAssessmentBlocks(facts);
  const blocks = [...synthesis.blocks, ...authoritative.safety, ...(authoritative.screening ? [authoritative.screening] : [])];
  return scanGeneratedClaims(blocks.map((block, index) => ({ id: `claim-${index + 1}`, text: block.text })) as Parameters<typeof scanGeneratedClaims>[0]);
}
function record(value: unknown): value is Record<string, unknown> { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
