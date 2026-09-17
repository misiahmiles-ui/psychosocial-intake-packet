// Pure browser/server boundary. No NoteOrigin review, claim graph, plan authority,
// word-overlap acceptance score, or second model. The writing prompts remain pinned.
import type { AssessmentFact, AssessmentRequest } from "@/types/assessment";
import { authoritativeAssessmentBlocks, renderAssessmentSynthesis, scanAssessmentSynthesis,
  sourceEvidenceLabel, type AssessmentSynthesis, type SynthesisBlock } from "@/lib/assessmentSynthesis";
import { sourceReporter, preservesReporterAttribution } from "@/lib/leanmaster/src/server/note/sourceGrounding";
import { stateForClause } from "@/lib/leanmaster/src/server/note/safetyFactContract";

export const LEANMASTER_PRODUCTION_COMMIT = "ef76ca0735ed841e82fa98eed48420724709468b";
const SECTIONS = ["assessment", "strengths", "needs", "plan"];
const HISTORY = /\b(?:history|historical|past|prior|previous|formerly|ago|lifetime)\b/i;
const DIAGNOSIS = /\b(?:diagnos\w*|meets? criteria|dementia|neurocognitive|schizophren\w*|bipolar|major depressive disorder|generalized anxiety disorder|ptsd)\b/i;
const SAFETY = /\b(?:suicid\w*|SI|HI|self[- ]harm|homicid\w*|harm to (?:self|others)|abuse|neglect|exploitation|elopement|wandering|safety risk|risk[- ]free)\b/i;
const CONCEPTS = [
  /\b(?:depress\w*|sadness)\b/i, /\b(?:anxi\w*|panic)\b/i,
  /\b(?:psychosis|psychotic|hallucinat\w*|delusion\w*)\b/i, /\b(?:mania|manic|bipolar)\b/i,
  /\b(?:trauma|ptsd)\b/i, /\b(?:alcohol|substance|drug use)\b/i,
  /\b(?:homeless\w*|eviction)\b/i, /\b(?:diabet\w*|insulin)\b/i,
  /\b(?:hypertension|blood pressure)\b/i, /\b(?:dementia|neurocognitive)\b/i,
  /\b(?:cancer|malignan\w*)\b/i, /\b(?:epilepsy|seizures?)\b/i,
  /\b(?:schizophren\w*)\b/i, /\b(?:osteoarthritis|arthritis)\b/i,
  /\b(?:stroke|cardiac|heart disease)\b/i, /\b(?:interpreter|interpretation)\b/i,
  /\b(?:guardian|proxy)\b/i, /\b(?:memory|forgetful\w*)\b/i,
  /\bexecutive[- ]function\w*\b/i
];
const RELATIONS = /\b(?:mother|father|parent|guardian|sister|brother|spouse|husband|wife|partner|son|daughter|child|caregiver|family)\b/gi;
const EVENTS = /\b(?:completed|received|attended|referred|scheduled|consented|agreed|hospitalized|admitted|prescribed|provided|administered|enrolled)\b/gi;
const FREQUENCIES = /\b(?:daily(?!\s+(?:routine|living)\b)|weekly|monthly|yearly|nightly|twice|three times|several times|every day|every week|every month)\b/gi;
const STOP = new Set("the and with from that this their participant client patient intake reported reports report documented documentation current assessment support plan goal consider recommend review offer needs need may can care service services program staff information notes response has have is are was were for not yes no unknown history known states stated requires require concern concerns status".split(" "));
function words(value: string) {
  return new Set((value.toLowerCase().match(/[a-z]{3,}/g) ?? []).filter((word) => !STOP.has(word))
    .map((word) => /^diagnos(?:is|es|tic|tically|ed|ing)?$/.test(word) ? "diagnosis" : word.replace(/(?:ing|ed|es|s)$/, "")));
}
function sharesTopic(left: string, right: string) {
  const rightWords = words(right);
  return [...words(left)].some((word) => rightWords.has(word));
}
const context = (fact: AssessmentFact) => `${sourceEvidenceLabel(fact)}: ${fact.normalizedValue}`;
// Independent predicates have their own negation and reporter scope. Ordinary
// noun lists ("bathing and dressing") stay together. This is grammar-based, not
// an exception for a particular participant, diagnosis or generated sentence.
const clauses = (text: string) => text.split(/(?<=[.!?;])\s+|\s+(?:but|while|whereas|although)\s+|,?\s+and\s+(?=(?:has|have|is|are|does|do|needs?|requires?|denies|reports?)\b|(?:the\s+)?(?:participant|family|caregiver|there|a guardian|no)\b)/i).filter(Boolean);
const REPORTER_ROLE = "family|caregiver|participant|client|patient|mother|father|parent|spouse|partner|guardian|staff";
function attributedReporter(text: string) {
  return sourceReporter(text) ||
    text.match(new RegExp(`\\b(${REPORTER_ROLE})\\s+(?:also\\s+)?(?:reports?|describes?|notes?)\\b`, "i"))?.[1]?.toLowerCase() ||
    text.match(new RegExp(`\\b(?:reported|described|noted) by (?:the )?(${REPORTER_ROLE})\\b`, "i"))?.[1]?.toLowerCase() ||
    text.match(new RegExp(`\\b(${REPORTER_ROLE})(?:[- ]reported|['’]s (?:report|account))\\b`, "i"))?.[1]?.toLowerCase() || "";
}
function preservesReporter(text: string, by: string) {
  return preservesReporterAttribution(text, by) || attributedReporter(text) === by;
}
function reporter(fact: AssessmentFact) {
  return attributedReporter(fact.normalizedValue) || (fact.sourceType === "caregiver_report" ? "caregiver" : fact.sourceType === "participant_report" ? "participant" : "");
}
function clauseState(text: string) {
  const parsed = stateForClause(text);
  if (["UNKNOWN", "NOT_ASSESSED", "NOT_DOCUMENTED"].includes(parsed)) return parsed;
  return /\b(?:does|do|did|is|are|was|were)\s+not\b|\b(?:none|without)\b/i.test(text) ? "DENIED" : parsed;
}
function state(fact: AssessmentFact) {
  if (fact.semantics.polarity === "unknown") return "UNKNOWN";
  if (fact.semantics.polarity === "not_assessed") return "NOT_ASSESSED";
  if (fact.semantics.polarity === "denied") return "DENIED";
  return clauseState(fact.normalizedValue);
}
function numbers(text: string) {
  const names = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
  return new Set((text.toLowerCase().match(/\b\d+(?:\.\d+)?\b|\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/g) ?? []).map((value) => names.includes(value) ? String(names.indexOf(value)) : value));
}

// These are material contradiction/detail checks, not a prose-similarity test.
// Source IDs attach paragraphs to the existing immutable facts; no model-authored
// semantics or redundant proposition text is required.
export function validateClinicalFacts(blocks: SynthesisBlock[], facts: AssessmentFact[]) {
  const ledger = new Map(facts.map((fact) => [fact.id, fact]));
  const issues: string[] = [];
  for (const block of blocks) {
    const found = block.sourceFactIds.map((id) => ledger.get(id));
    if (!found.length || found.some((fact) => !fact)) { issues.push("missing_source"); continue; }
    const sources = found as AssessmentFact[];
    const authority = sources.map(context).join("\n");
    if (sources.some((fact) => fact.domain === "cognitive_screening")) issues.push("screening_boundary");
    if (sources.some((fact) => fact.domain === "safety") || SAFETY.test(block.text)) issues.push("authoritative_safety_boundary");
    if (DIAGNOSIS.test(block.text) && /\b(?:screen|orientation|recall|cognitive)\w*\b/i.test(block.text)) issues.push("screening_boundary");
    for (const clause of clauses(block.text)) {
      const relevant = sources.filter((fact) => sharesTopic(clause, context(fact)));
      const evidence = relevant.map(context).join("\n");
      const values = relevant.map((fact) => fact.normalizedValue).join("\n");
      // Numeric/frequency support is scoped to the same topic, never borrowed
      // from an unrelated paragraph or another participant attribute.
      // A typed affirmative answer also affirms the fixed question's quantity
      // (e.g. rooms on one level). Denied/unknown answers never authorize it.
      const sourceNumbers = numbers(relevant.map((fact) =>
        /^(?:yes|true)$/i.test(fact.normalizedValue.trim()) && fact.semantics.polarity === "affirmed"
          ? context(fact) : fact.normalizedValue).join("\n"));
      const nonAgeText = clause.replace(/\b\d{1,3}[- ]year[- ]old\b|\b(?:aged|age)\s+\d{1,3}\b/gi, "");
      for (const value of numbers(nonAgeText)) if (!sourceNumbers.has(value)) issues.push("unsupported_numeric");
      const age = clause.match(/\b(\d{1,3})[- ]year[- ]old\b|\b(?:aged|age)\s+(\d{1,3})\b/i);
      if (age && !sources.some((fact) => fact.sourceField === "calculated-age" && fact.normalizedValue === `age: ${age[1] || age[2]}`)) issues.push("unsupported_age");
      for (const frequency of clause.match(FREQUENCIES) ?? []) {
        const normalized = frequency.toLowerCase().replace("every day", "daily").replace("every week", "weekly").replace("every month", "monthly");
        if (!(values.toLowerCase().match(FREQUENCIES) ?? []).map((value) => value.replace("every day", "daily").replace("every week", "weekly").replace("every month", "monthly")).includes(normalized)) issues.push("unsupported_frequency");
      }
      for (const relation of clause.match(RELATIONS) ?? []) if (!new RegExp(`\\b${relation}\\b`, "i").test(evidence)) issues.push("unsupported_relationship");
      for (const concept of CONCEPTS) {
        if (!concept.test(clause)) continue;
        const support = relevant.filter((fact) => concept.test(context(fact)));
        if (!support.length) { issues.push("unsupported_clinical_concept"); continue; }
        if (block.section !== "plan") {
          const outputState = clauseState(clause);
          if (support.every((fact) => state(fact) === "DENIED") && outputState !== "DENIED") issues.push("denial_changed_to_positive");
          if (support.every((fact) => !["DENIED", "UNKNOWN", "NOT_ASSESSED", "NOT_DOCUMENTED"].includes(state(fact))) && outputState === "DENIED") issues.push("affirmed_changed_to_denied");
          for (const unknown of ["UNKNOWN", "NOT_ASSESSED", "NOT_DOCUMENTED"]) if (support.every((fact) => state(fact) === unknown) && outputState !== unknown) issues.push("unknown_made_known");
          if (support.every((fact) => HISTORY.test(fact.normalizedValue)) && !HISTORY.test(clause)) issues.push("historical_fact_made_current");
        }
      }
      if (DIAGNOSIS.test(clause)) {
        // A generic diagnostic qualification can refer back to the named
        // condition in this paragraph. It still needs a cited documented
        // diagnosis with the stated timeframe; a symptom or unrelated citation
        // cannot authorize a named or current diagnosis.
        const namedConditions = CONCEPTS.slice(0, 14).filter((concept) => concept.test(clause));
        const diagnosisSources = relevant
          .filter((fact) => fact.semantics.diagnosisStatus === "documented_diagnosis" &&
            (!namedConditions.length || namedConditions.some((concept) => concept.test(fact.normalizedValue))));
        if (!diagnosisSources.length || (HISTORY.test(clause) && !diagnosisSources.some((fact) => HISTORY.test(fact.normalizedValue))) ||
          (!HISTORY.test(clause) && diagnosisSources.every((fact) => HISTORY.test(fact.normalizedValue)))) issues.push("unsupported_diagnosis");
      }
      // Free-form diagnosis names (not just the registered concepts above).
      for (const match of clause.matchAll(/\b(?:diagnosed with|diagnosis of|history of)\s+([^.;,]+)/gi)) {
        const detail = match[1].replace(/\s+(?:is|was|has|treated|reported)\b.*$/i, "");
        if (!sharesTopic(detail, values)) issues.push("unsupported_history_or_diagnosis");
      }
      if (block.section !== "plan") {
        for (const fact of relevant) {
          const by = reporter(fact);
          const topics = CONCEPTS.filter((concept) => concept.test(fact.normalizedValue));
          const matchingTopics = topics.filter((concept) => concept.test(clause));
          // A shared reporter word is not evidence that this clause restates
          // their clinical finding. Independently documented facts can support
          // an unattributed assertion of that same finding and timeframe.
          const independent = matchingTopics.length && relevant.some((other) =>
            !reporter(other) && matchingTopics.some((concept) => concept.test(other.normalizedValue)) &&
            HISTORY.test(other.normalizedValue) === HISTORY.test(clause) && state(other) === clauseState(clause));
          if (by && (!topics.length || matchingTopics.length) && !independent && !preservesReporter(clause, by)) issues.push("source_attribution_changed");
        }
        const by = attributedReporter(clause);
        if (by && !relevant.some((fact) => reporter(fact) === by)) issues.push("source_attribution_changed");
        if (relevant.length && relevant.every((fact) => state(fact) === "DENIED") && clauseState(clause) !== "DENIED") issues.push("denial_changed_to_positive");
        for (const unknown of ["UNKNOWN", "NOT_ASSESSED", "NOT_DOCUMENTED"]) if (relevant.length && relevant.every((fact) => state(fact) === unknown) && clauseState(clause) !== unknown) issues.push("unknown_made_known");
      }
      for (const event of clause.match(EVENTS) ?? []) {
        if (!new RegExp(`\\b${event}\\b`, "i").test(values)) issues.push("unsupported_completed_event");
      }
      for (const match of clause.matchAll(/\b(?:takes?|taking|prescribed|started on|medication(?:s)?(?: include|:))\s+([a-z][a-z-]+)/gi)) {
        if (!/^(?:a|an|the|medication|medications|medicine|part|place|steps)$/i.test(match[1]) && !new RegExp(`\\b${match[1]}\\b`, "i").test(values)) issues.push("unsupported_medication");
      }
      // Guard explicit factual complements without measuring paraphrase overlap.
      // Clinical recommendations in the plan remain recommendations, not events.
      if (block.section !== "plan") {
        for (const match of clause.matchAll(/\b(?:enjoys?|prefers?|owns?|worked as|lives with|resides in)\s+([^.;]+)/gi)) {
          if (!sharesTopic(match[1], values)) issues.push("unsupported_factual_detail");
        }
        if (!relevant.length && /\b(?:is|has|had|was|were|lives|reports?|reported|diagnosed|received|completed)\b/i.test(clause)) issues.push("unsupported_factual_assertion");
      }
    }
  }
  return { valid: issues.length === 0, issues: [...new Set(issues)] };
}

export function validateLeanMasterAssessment(raw: string, request: AssessmentRequest) {
  let candidate: AssessmentSynthesis;
  try { candidate = JSON.parse(raw); } catch { return { valid: false as const, issues: ["invalid_document_structure"] }; }
  if (!candidate || Object.keys(candidate).join() !== "blocks" || !Array.isArray(candidate.blocks) || candidate.blocks.length > 11 || candidate.blocks.some((block) =>
    !block || Object.keys(block).sort().join() !== "section,sourceFactIds,text" || !SECTIONS.includes(block.section) ||
    typeof block.text !== "string" || block.text.trim().length < 5 || block.text.length > 2600 ||
    !Array.isArray(block.sourceFactIds) || !block.sourceFactIds.length || block.sourceFactIds.length > 16 ||
    block.sourceFactIds.some((id) => typeof id !== "string") || new Set(block.sourceFactIds).size !== block.sourceFactIds.length)) return { valid: false as const, issues: ["invalid_document_structure"] };
  const count = (section: string) => candidate.blocks.filter((block) => block.section === section).length;
  if (count("assessment") < 3 || count("assessment") > 5 || count("strengths") > 1 || count("needs") > 1 || count("plan") < 2 || count("plan") > 4) return { valid: false as const, issues: ["invalid_document_structure"] };
  if (scanAssessmentSynthesis(candidate, request.facts).length) return { valid: false as const, issues: ["output_phi_blocked"] };
  const checked = validateClinicalFacts(candidate.blocks, request.facts);
  if (!checked.valid) return { valid: false as const, issues: checked.issues };
  const authoritative = authoritativeAssessmentBlocks(request.facts);
  return { valid: true as const, issues: [], note: candidate, text: renderAssessmentSynthesis(candidate, request.facts),
    sourceFactIds: [...new Set([...candidate.blocks.flatMap((block) => block.sourceFactIds), ...authoritative.safety.flatMap((block) => block.sourceFactIds), ...(authoritative.screening?.sourceFactIds ?? [])])] };
}
