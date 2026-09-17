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
export type AssessmentSynthesis = { blocks: SynthesisBlock[]; semanticReview?: SemanticReview; renderMode?: "source-ledger" | "verified-prose" };
export type AssessmentSourceSelection = { paragraphs: { sourceFactIds: string[] }[] };

const slug = (value: string) => value.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
const labels = new Map(sourceMappingInventory().map((source) => [slug(source.path), source.fieldLabel]));
export function sourceEvidenceText(fact: AssessmentFact) {
  return `${sourceEvidenceLabel(fact)}: ${fact.normalizedValue}`;
}
export function sourceEvidenceLabel(fact: AssessmentFact) { return labels.get(fact.sourceField) ?? fact.sourceField.replace(/-/g, " "); }

export function parseAssessmentSynthesis(value: unknown): AssessmentSynthesis | null {
  if (!record(value) || Object.keys(value).some((key) => !["blocks", "semanticReview", "renderMode"].includes(key)) || !Array.isArray(value.blocks) || value.blocks.length > 11 ||
    (value.renderMode !== undefined && !["source-ledger", "verified-prose"].includes(String(value.renderMode)))) return null;
  const sourceLedger = value.renderMode === "source-ledger";
  const verifiedProse = value.renderMode === "verified-prose";
  const blocks: SynthesisBlock[] = [];
  for (const raw of value.blocks) {
    if (!record(raw) || Object.keys(raw).length !== 3 ||
      !SYNTHESIS_SECTIONS.includes(raw.section as never) || typeof raw.text !== "string" ||
      raw.text.trim().length < 5 || raw.text.length > (sourceLedger || verifiedProse ? 2400 : 1100) || /\n/.test(raw.text) ||
      (!sourceLedger && !verifiedProse && sentences(raw.text).length !== 1) ||
      !Array.isArray(raw.sourceFactIds) || raw.sourceFactIds.length < 1 || raw.sourceFactIds.length > 16 ||
      raw.sourceFactIds.some((id) => typeof id !== "string" || !/^fact-\d{3}$/.test(id)) ||
      new Set(raw.sourceFactIds).size !== raw.sourceFactIds.length) return null;
    blocks.push(raw as SynthesisBlock);
  }
  const count = (section: SynthesisBlock["section"]) => blocks.filter((block) => block.section === section).length;
  if (count("assessment") < 3 || count("assessment") > 5 || count("strengths") > 1 ||
    count("needs") > 1 || count("plan") < 2 || count("plan") > 4) return null;
  return { blocks, ...(value.semanticReview === undefined ? {} : { semanticReview: value.semanticReview as SemanticReview }),
    ...(sourceLedger ? { renderMode: "source-ledger" as const } : verifiedProse ? { renderMode: "verified-prose" as const } : {}) };
}

const SOURCE_ID = /^fact-\d{3}$/;
const STRENGTH_FIELDS = ["psychosocial-strengths-coping", "home-visit-group-community-supports"];
const NEED_FIELDS = ["psychosocial-current-stressors", "goals-social-work-services-needed"];
const PLAN_FIELDS = ["goals-participant-family-goals", "goals-social-work-services-needed", "goals-service-priorities", "quarterly-discharge-supportive-services"];

// Closed, source-bound professional paraphrases. The provider writes the
// paragraph text by choosing, ordering, and grouping these statements. An
// arbitrary free-form clinical sentence has no deterministic safety proof and
// cannot pass this contract.
export function verifiedNarrativeOptions(fact: AssessmentFact, section: SynthesisBlock["section"]) {
  if (["safety", "cognitive_screening"].includes(fact.domain)) return [];
  if (section === "strengths" && !STRENGTH_FIELDS.includes(fact.sourceField)) return [];
  if (section === "needs" && !NEED_FIELDS.includes(fact.sourceField)) return [];
  if (section === "plan" && !PLAN_FIELDS.includes(fact.sourceField)) return [];
  if (section !== "assessment" && ["denied", "unknown", "not_assessed", "not_applicable"].includes(fact.semantics.polarity)) return [];
  const value = fact.normalizedValue.trim().replace(/\s+/g, " ").replace(/[.!?]+$/, "");
  if (!value) return [];
  const lower = (text: string) => text[0].toLowerCase() + text.slice(1);
  if (section === "plan") {
    const plans: Record<string, string> = {
      "goals-participant-family-goals": /^improve socialization, maintain routine, reduce isolation, and support caregiver respite$/i.test(value)
        ? "The LSW will review goals for improved socialization, a maintained routine, reduced isolation, and caregiver respite with the participant and family."
        : `The LSW will review the participant and family goals recorded in the intake (${value}) and clarify priorities with them.`,
      "goals-social-work-services-needed": `The LSW will assess the documented need for ${lower(value)}.`,
      "goals-service-priorities": /^promote safe attendance, increase activity engagement, monitor mood, support care planning$/i.test(value)
        ? "The LSW will use the documented priorities of safe attendance, activity engagement, mood monitoring, and care planning to guide follow-up."
        : `The LSW will use the documented priorities (${value}) to guide care planning.`,
      "quarterly-discharge-supportive-services": /^home care; meals on wheels; mental health$/i.test(value)
        ? "The LSW will review possible home care, Meals on Wheels, and mental health services as needs change."
        : `The LSW will review the documented supportive-service considerations (${value}) as needs change.`
    };
    const first = plans[fact.sourceField] ?? `The LSW will review the documented service consideration (${value}).`;
    return [first, first.replace(/^The LSW will /, "As part of care planning, the LSW will ")];
  }
  // Direct clinical clauses are used only for recognizable source wording. All
  // other values retain an explicit evidence frame, including reporter and time.
  const direct: Record<string, [RegExp, string]> = {
    "calculated-age": [/^age: (\d+)$/i, `At assessment, the participant was ${value.match(/^age: (\d+)$/i)?.[1]} years old.`],
    "living-current-residence": [/^private apartment\b/i, `The participant resides in a ${lower(value)}.`],
    "living-lives-with": [/^(?:alone|with|family|spouse|partner)\b/i, `The participant lives ${lower(value)}.`],
    "home-visit-household-composition": [/^one-person household; adult child nearby$/i,
      "The home visit describes a one-person household with an adult child nearby."],
    "living-transportation": [/^center transportation requested for program attendance$/i, "Center transportation was requested for program attendance."],
    "functional-orientation": [/^usually oriented\b/i, `At intake, the participant was ${lower(value)}.`],
    "functional-ambulation": [/^uses rolling walker for longer distances$/i, "The intake describes use of a rolling walker for longer distances."],
    "functional-adl-help": [/^needs cueing with bathing and dressing; independent with feeding$/i,
      "The participant needs cueing with bathing and dressing and is independent with feeding."],
    "psychosocial-baseline-mood": [/^generally pleasant\b/i, `At intake, the participant was described as ${lower(value)}.`],
    "psychosocial-mental-health-history": [/^family reports\b/i, `${value}.`],
    "psychosocial-current-stressors": [/^reduced independence, caregiver availability, transportation$/i,
      "Current stressors include reduced independence, caregiver availability, and transportation."],
    "psychosocial-thought-behavior-concerns": [/^no psychosis reported\. may become tearful when overwhelmed$/i,
      "No psychosis was reported; the intake notes that the participant may become tearful when overwhelmed."],
    "functional-memory-concerns": [/^short-term memory concerns reported by family$/i, "Family reported short-term memory concerns."],
    "functional-decision-making": [/^some assistance for appointments and benefits paperwork$/i,
      "Some assistance is documented for appointments and benefits paperwork."],
    "functional-transfers": [/^supervision recommended\b/i, `${value}.`],
    "psychosocial-social-engagement": [/^limited at home; interested in center activities$/i,
      "Social engagement at home is limited, and the participant is interested in center activities."],
    "psychosocial-strengths-coping": [/^enjoys\b/i, `The participant ${lower(value)}.`],
    "home-visit-group-community-supports": [/^faith community phone support$/i, "Faith community phone support is documented."],
    "goals-social-work-services-needed": [/^benefits counseling\b/i, `Identified social work needs include ${lower(value)}.`],
    "medical-history-psychiatric-diagnoses": [/^depression by history\b/i, `The record lists ${lower(value)}; this is historical diagnostic information.`],
    "medical-history-major-medical-diagnoses": [/^hypertension, type 2 diabetes, osteoarthritis$/i, `The documented medical history includes ${lower(value)}.`],
    "medical-history-current-medications": [/^example medication list attached by family$/i, "A medication list was attached by family."],
    "communication-communication-needs": [/^face participant when speaking; allow extra response time$/i, "Communication support needs include facing the participant when speaking and allowing extra response time."],
    "home-visit-comments": [/^sample home visit indicates manageable environment with fall-risk modifications$/i,
      "The home visit indicates a manageable environment with fall-risk modifications."],
    "conditions-medication-management": [/^family fills weekly pill organizer$/i,
      "Family fills a weekly pill organizer."]
  };
  const candidate = direct[fact.sourceField];
  const historyInClause = ["psychosocial-mental-health-history", "medical-history-major-medical-diagnoses", "medical-history-psychiatric-diagnoses"].includes(fact.sourceField);
  const reporterInClause = ["psychosocial-mental-health-history", "functional-memory-concerns", "conditions-medication-management"].includes(fact.sourceField);
  const explicitDenial = fact.sourceField === "psychosocial-thought-behavior-concerns" &&
    fact.semantics.polarity === "denied" && /^no psychosis reported\b/i.test(value);
  const canUseDirect = (fact.semantics.polarity === "affirmed" || explicitDenial) &&
    (!["historical", "lifetime"].includes(fact.temporalStatus) || historyInClause) &&
    (fact.sourceType !== "caregiver_report" || reporterInClause) && Boolean(candidate?.[0].test(value));
  const reporter = fact.sourceType === "caregiver_report" ? "The caregiver reports" :
    fact.sourceType === "participant_report" ? "The participant reports" :
    fact.sourceType === "clinician_observation" ? "The clinician observed" : "The reviewed intake records";
  const history = fact.temporalStatus === "historical" || fact.temporalStatus === "lifetime" ? "historically " : "";
  const label = sourceEvidenceLabel(fact).toLowerCase();
  const first = canUseDirect ? candidate![1] : `${reporter} ${history}${label} as ${value}.`;
  const second = canUseDirect
    ? first.replace(/^The participant /, "The reviewed intake indicates that the participant ")
      .replace(/^The participant's /, "The reviewed intake indicates that the participant's ")
      .replace(/^At intake, /, "The reviewed intake indicates that at intake, ")
    : `Regarding ${history}${label}, ${reporter.toLowerCase()} ${value}.`;
  return [first, second === first ? `In the reviewed intake, ${lower(first).replace(/[.!?]+$/, "")}.` : second];
}

export function verifiedNarrativeChoices(facts: AssessmentFact[]) {
  return facts.flatMap((fact) => SYNTHESIS_SECTIONS.flatMap((section) => {
    const options = verifiedNarrativeOptions(fact, section);
    return options.length ? [{ sourceFactId: fact.id, section, options }] : [];
  }));
}

function verifiedBlockText(block: SynthesisBlock, factsById: Map<string, AssessmentFact>) {
  const choices: string[][] = [];
  for (const id of block.sourceFactIds) {
    const fact = factsById.get(id);
    if (!fact) return null;
    const options = verifiedNarrativeOptions(fact, block.section);
    if (!options.length) return null;
    choices.push(options);
  }
  const emitted = block.text.trim();
  // A paragraph is a sequence of independently authorized clauses. Parsing
  // exact options from left to right prevents one citation from licensing an
  // unrelated clause, number, diagnosis, relationship, or service claim.
  let remaining = emitted;
  for (const options of choices) {
    const match = options.find((option) => remaining.startsWith(option));
    if (!match) return null;
    remaining = remaining.slice(match.length);
    if (remaining && !remaining.startsWith(" ")) return null;
    remaining = remaining.trimStart();
  }
  return remaining === "" ? emitted : null;
}

export function repairVerifiedNarrative(candidate: unknown, facts: AssessmentFact[]) {
  const parsed = parseAssessmentSynthesis(candidate);
  if (!parsed || parsed.renderMode !== "verified-prose" || parsed.semanticReview !== undefined) return null;
  const ledger = new Map(facts.map((fact) => [fact.id, fact]));
  const blocks: SynthesisBlock[] = [];
  for (const block of parsed.blocks) {
    const exact = verifiedBlockText(block, ledger);
    if (exact) { blocks.push(block); continue; }
    const options = block.sourceFactIds.map((id) => {
      const fact = ledger.get(id);
      return fact ? verifiedNarrativeOptions(fact, block.section)[0] : undefined;
    });
    if (options.some((option) => !option)) return null;
    blocks.push({ ...block, text: options.join(" ") });
  }
  return { blocks, renderMode: "verified-prose" as const };
}
function selectedFacts(facts: AssessmentFact[], fields: string[], limit: number) {
  return fields.map((field) => facts.find((fact) => fact.sourceField === field))
    .filter((fact): fact is AssessmentFact => Boolean(fact && !["denied", "unknown", "not_assessed", "not_applicable"].includes(fact.semantics.polarity)))
    .slice(0, limit);
}
function sourceLedgerText(section: SynthesisBlock["section"], sources: AssessmentFact[]) {
  return sources.map((fact) => {
    const value = fact.normalizedValue.trim().replace(/\s+/g, " ").replace(/[.!?]+$/, "");
    const label = sourceEvidenceLabel(fact);
    return section === "plan"
      ? `For clinician review, consider the documented ${label.toLowerCase()}: ${value}.`
      : `${label}: ${value}.`;
  }).join(" ");
}
export function parseAssessmentSourceSelection(value: unknown): AssessmentSourceSelection | null {
  if (!record(value) || Object.keys(value).length !== 1 || !Array.isArray(value.paragraphs) ||
    value.paragraphs.length < 3 || value.paragraphs.length > 5) return null;
  const seen = new Set<string>();
  for (const paragraph of value.paragraphs) {
    if (!record(paragraph) || Object.keys(paragraph).length !== 1 || !Array.isArray(paragraph.sourceFactIds) ||
      paragraph.sourceFactIds.length < 1 || paragraph.sourceFactIds.length > 4) return null;
    for (const id of paragraph.sourceFactIds) {
      if (typeof id !== "string" || !SOURCE_ID.test(id) || seen.has(id)) return null;
      seen.add(id);
    }
  }
  return value as AssessmentSourceSelection;
}
export function buildSourceLedgerSynthesis(selection: AssessmentSourceSelection, facts: AssessmentFact[]): AssessmentSynthesis | null {
  const ledger = new Map(facts.map((fact) => [fact.id, fact]));
  const blocks: SynthesisBlock[] = [];
  for (const paragraph of selection.paragraphs) {
    const sources = paragraph.sourceFactIds.map((id) => ledger.get(id));
    if (sources.some((fact) => !fact || ["safety", "cognitive_screening"].includes(fact.domain))) return null;
    const resolved = sources as AssessmentFact[];
    blocks.push({ section: "assessment", text: sourceLedgerText("assessment", resolved), sourceFactIds: paragraph.sourceFactIds });
  }
  for (const [section, fields, limit] of [["strengths", STRENGTH_FIELDS, 2], ["needs", NEED_FIELDS, 2], ["plan", PLAN_FIELDS, 4]] as const) {
    const chosen = selectedFacts(facts, fields, limit);
    if (section === "plan" && chosen.length < 2) return null;
    if (section === "plan") {
      for (const fact of chosen) blocks.push({ section, text: sourceLedgerText(section, [fact]), sourceFactIds: [fact.id] });
    } else if (chosen.length) {
      blocks.push({ section, text: sourceLedgerText(section, chosen), sourceFactIds: chosen.map((fact) => fact.id) });
    }
  }
  return { blocks, renderMode: "source-ledger" };
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
function evidenceClauses(text: string) {
  return text.split(/\s+(?:and|but|while|whereas|although|including)\s+|,\s*(?:and|but|while|whereas|although|including)\s+/i)
    .map((part) => part.trim()).filter(Boolean);
}
function sourceDenies(fact: AssessmentFact) {
  return fact.semantics.polarity === "denied" || DENIAL.test(fact.normalizedValue);
}

// Fail closed on provenance, clinical boundaries, attribution and unsupported
// details. Labels are context for short form answers, never affirmative facts:
// e.g. "Interpreter needed: No" cannot support "needs an interpreter".
export function validateAssessmentSynthesis(candidate: unknown, facts: AssessmentFact[]) {
  const synthesis = parseAssessmentSynthesis(candidate);
  const issues: string[] = [];
  if (!synthesis) return { valid: false, issues: ["invalid_synthesis_shape"] };
  const reviewIssues = synthesis.semanticReview === undefined ? null : semanticReviewIssues(synthesis.semanticReview, synthesis.blocks.length);
  if (reviewIssues) issues.push(...reviewIssues);
  if (synthesis.renderMode === "source-ledger") {
    if (synthesis.semanticReview !== undefined) issues.push("invalid_synthesis_shape");
    const paragraphs = synthesis.blocks.filter((block) => block.section === "assessment");
    const selection = parseAssessmentSourceSelection({ paragraphs: paragraphs.map((block) => ({ sourceFactIds: block.sourceFactIds })) });
    const expected = selection && buildSourceLedgerSynthesis(selection, facts);
    if (!expected || expected.blocks.length !== synthesis.blocks.length ||
      expected.blocks.some((block, index) => block.section !== synthesis.blocks[index].section ||
        block.text !== synthesis.blocks[index].text ||
        block.sourceFactIds.join("|") !== synthesis.blocks[index].sourceFactIds.join("|"))) issues.push("source_ledger_mismatch");
    return { valid: issues.length === 0, issues };
  }
  if (synthesis.renderMode === "verified-prose") {
    if (synthesis.semanticReview !== undefined) issues.push("invalid_synthesis_shape");
    const ledger = new Map(facts.map((fact) => [fact.id, fact]));
    for (const [index, block] of synthesis.blocks.entries()) {
      if (!verifiedBlockText(block, ledger)) issues.push(`unsupported_verified_prose_${index}`);
    }
    return { valid: issues.length === 0, issues };
  }
  return validateAssessmentProseBlocks(synthesis.blocks, facts, reviewIssues, issues);
}

// Legacy synthesis validation retained for the existing production contracts.
// The pre-deployment LeanMaster path uses its pinned proposition semantics
// instead; it does not run these competing sentence-wide heuristics.
export function validateAssessmentProseBlocks(
  blocks: SynthesisBlock[], facts: AssessmentFact[], reviewIssues: string[] | null = null, issues: string[] = []
) {
  const semanticallyReviewed = reviewIssues !== null && reviewIssues.length === 0;
  const semanticIssue = (issue: string) => { if (!semanticallyReviewed) issues.push(issue); };
  const ledger = new Map(facts.map((fact) => [fact.id, fact]));
  for (const block of blocks) {
    const sources = block.sourceFactIds.map((id) => ledger.get(id)).filter((fact): fact is AssessmentFact => Boolean(fact));
    if (sources.length !== block.sourceFactIds.length) { issues.push("missing_source"); continue; }
    const plan = block.section === "plan";
    if (sources.some((fact) => fact.domain === "cognitive_screening")) issues.push("screening_boundary");
    if (!plan && sources.some((fact) => fact.domain === "safety")) issues.push("authoritative_safety_boundary");
    const authority = sources.map(sourceEvidenceText).join(" ");
    const values = sources.map((fact) => fact.normalizedValue).join(" ");
    const sourceNumbers = new Set<string>(values.match(/\b\d+(?:\.\d+)?\b/g) ?? []);
    for (const sentence of sentences(block.text)) {
      // A supported opening clause must not lend its citation to a separate,
      // unsupported assertion later in the same sentence.
      for (const clause of evidenceClauses(sentence)) {
        const relevant = sources.filter((fact) => related(clause, fact) > 0);
        if (tokens(clause).size > 0 && !relevant.length) { semanticIssue("unsupported_statement"); continue; }
        const clauseEvidence = relevant.map(sourceEvidenceText).join(" ");
        for (const relationship of clause.match(RELATIONSHIPS) ?? []) {
          // Short yes/no source values need their field label for context, but
          // the whole sentence must not borrow a relationship from another clause.
          if (!new RegExp(`\\b${relationship}\\b`, "i").test(clauseEvidence)) semanticIssue("unsupported_relationship");
        }
        for (const concept of CONCEPTS) {
          if (concept.test(clause) && !concept.test(clauseEvidence)) issues.push("unsupported_clinical_concept");
          if (!plan && concept.test(clause)) {
            const conceptSources = relevant.filter((fact) => concept.test(sourceEvidenceText(fact)));
            if (conceptSources.length && conceptSources.every(sourceDenies) && !DENIAL.test(clause)) semanticIssue("denial_changed_to_positive");
            if (conceptSources.length && conceptSources.every((fact) => fact.semantics.polarity === "affirmed" && !sourceDenies(fact)) && DENIAL.test(clause)) semanticIssue("affirmed_changed_to_denied");
            if (conceptSources.length && conceptSources.every((fact) => HISTORY.test(fact.normalizedValue) || ["historical", "lifetime"].includes(fact.temporalStatus)) && !HISTORY.test(clause)) semanticIssue("historical_fact_made_current");
          }
        }
        if (!plan) {
          if (relevant.every(sourceDenies) && !DENIAL.test(clause)) semanticIssue("denial_changed_to_positive");
          if (relevant.every((fact) => fact.semantics.polarity === "affirmed" && !sourceDenies(fact)) && DENIAL.test(clause) && !UNKNOWN.test(clause)) semanticIssue("affirmed_changed_to_denied");
          if (relevant.every((fact) => ["unknown", "not_assessed"].includes(fact.semantics.polarity)) && !UNKNOWN.test(clause)) semanticIssue("unknown_made_known");
          if (relevant.every((fact) => ["historical", "lifetime"].includes(fact.temporalStatus)) && !HISTORY.test(clause)) semanticIssue("historical_fact_made_current");
        }
      }
      const relevant = sources.filter((fact) => related(sentence, fact) > 0);
      if (!relevant.length) semanticIssue("unsupported_statement");
      const relevantValues = relevant.map((fact) => fact.normalizedValue).join(" ");
      const sentenceTokens = tokens(sentence);
      const authorityTokens = tokens(authority);
      if (sentenceTokens.size > 2 && [...sentenceTokens].filter((token) => authorityTokens.has(token)).length / sentenceTokens.size < 0.12) semanticIssue("unsupported_statement");
      for (const number of sentence.match(/\b\d+(?:\.\d+)?\b/g) ?? []) {
        if (!sourceNumbers.has(number)) issues.push("unsupported_numeric");
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
    text: safetyStatement(fact), sourceFactIds: [fact.id]
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

function safetyStatement(fact: AssessmentFact) {
  const value = fact.normalizedValue.trim().replace(/[.!?]+$/, "");
  const lower = value[0]?.toLowerCase() + value.slice(1);
  if (fact.sourceField === "functional-recent-falls" && /^one non-injury fall reported in the last 6 months$/i.test(value))
    return "One non-injury fall was reported in the last six months.";
  if (fact.sourceField === "medical-history-suicide-self-harm-history" && /^no$/i.test(value))
    return "No history of suicide attempts or self-harm was reported.";
  if (fact.sourceField === "safety-harm-risk" && /^no current risk of harm to self or others reported$/i.test(value))
    return "No current risk of harm to self or others was reported.";
  if (fact.sourceField === "safety-abuse-neglect-concerns" && /^none reported during sample intake$/i.test(value))
    return "No abuse or neglect concerns were reported at intake.";
  if (fact.sourceField === "medical-history-current-risk-details" && /^denies current suicidal or homicidal ideation in sample$/i.test(value))
    return "At intake, the participant denied current suicidal or homicidal ideation.";
  if (fact.sourceField === "conditions-medication-adherence-concerns" && /^occasional missed evening dose per caregiver$/i.test(value))
    return "The caregiver reports an occasional missed evening dose.";
  if (fact.sourceField === "safety-elopement-risk" && /^low; needs orientation to center exits and routines$/i.test(value))
    return "Elopement risk is recorded as low, with orientation to center exits and routines needed.";
  if (fact.sourceField === "safety-safety-precautions" && /^fall precautions, walker within reach, hydration reminders$/i.test(value))
    return "Documented precautions include fall precautions, a walker within reach, and hydration reminders.";
  if (fact.sourceField === "home-visit-safety-hazards" && /^scatter rugs; poor lighting$/i.test(value))
    return "The home visit identified scatter rugs and poor lighting as safety hazards.";
  if (fact.sourceField === "home-visit-other-safety-hazard" && /^recommend night lights\b/i.test(value))
    return "The home visit recommends night lights in the hallway.";
  return `The safety review records ${sourceEvidenceLabel(fact).toLowerCase()} as ${value}.`;
}

export function renderAssessmentSynthesis(synthesis: AssessmentSynthesis, facts: AssessmentFact[]) {
  const select = (section: SynthesisBlock["section"]) => synthesis.blocks.filter((block) => block.section === section).map((block) => block.text.trim());
  const authoritative = authoritativeAssessmentBlocks(facts);
  const paragraphs = select("assessment");
  if (!paragraphs.length) paragraphs.push("No psychosocial narrative information was documented in the reviewed intake.");
  if (authoritative.screening) paragraphs[paragraphs.length - 1] += ` ${authoritative.screening.text}`;
  const sections = ["Psychosocial Assessment", paragraphs.join("\n\n")];
  for (const [heading, content] of [
    ["Strengths / Protective Factors", select("strengths").join(" ")],
    ["Identified Needs / Barriers", select("needs").join(" ")],
    ["Safety Considerations", authoritative.safety.map((block) => block.text).join(" ")],
    ["Service / Treatment Plan", select("plan").map((text, index) => `${index + 1}. ${text}`).join("\n")]
  ]) sections.push(heading, content || "No information documented in the reviewed intake for this section.");
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
