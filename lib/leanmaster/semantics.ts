// Schema/policy adapter around the pinned ef76ca0 semantics, not a prose writer.
import type { AssessmentFact } from "@/types/assessment";
import { sourceMappingInventory } from "@/lib/assessment";
import { sourceEvidenceLabel, type SynthesisBlock } from "@/lib/assessmentSynthesis";
import { buildSourceFactLedger, type SourceFactLedgerEntry, type StructuredGeneratedNote } from "@/lib/leanmaster/src/server/note/sourceFactLedger";
import { sourceReporter, buildNormalizedSourceEvidence, validateGroundedClinicalOutput, preservesReporterAttribution } from "@/lib/leanmaster/src/server/note/sourceGrounding";
import { stateForClause, temporalScopeForClause, extractSafetyFactContract, compareSafetyFactContracts } from "@/lib/leanmaster/src/server/note/safetyFactContract";
import { buildNoteOriginSourceLedger } from "@/lib/leanmaster/src/server/noteorigin/sourceLedger";
import { createGenerationSourceSnapshot } from "@/lib/leanmaster/lib/generationSourceSnapshot";
import { evaluateNoteOriginSections, validateNoteOriginSentenceStatuses, structuralIssues, reviewSegments, synthesisTokenSet, tokenSet } from "@/lib/leanmaster/src/server/noteorigin/grounding";
import { validateAssessmentPlanTraceability } from "@/lib/leanmaster/src/server/note/assessmentPlanTraceability";

export type IntakeSegment = SourceFactLedgerEntry & {
  originalFactId: string;
  originalSourceField: string;
  intakeState: ReturnType<typeof stateForClause>;
};
const mappedTime = new Map(sourceMappingInventory().map((mapping) => [
  mapping.path.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase(), mapping.temporalStatus
]));

export function buildSegmentedPsychosocialLedger(facts: AssessmentFact[]) {
  const entries: IntakeSegment[] = [];
  for (const fact of facts.filter((f) => !["safety", "cognitive_screening"].includes(f.domain))) {
    const field = ["goals_services", "discharge_planning"].includes(fact.domain) ? "followUpPlan"
      : fact.sourceType === "clinician_observation" ? "observedNeed" : "programContext";
    const segments = buildSourceFactLedger({ [field]: fact.normalizedValue }).facts.flatMap((entry) => {
      // Reuse NoteOrigin's proposition boundaries within a source sentence.
      // Preserve exact original offsets; a contrast does not share polarity.
      let cursor = 0;
      return reviewSegments(entry.value).map((value) => {
        const offset = entry.value.indexOf(value, cursor);
        if (offset < 0) throw new Error("invalid_source_span");
        cursor = offset + value.length;
        return { ...entry, value,
          reporter: sourceReporter(value) || sourceReporter(entry.value) || entry.reporter,
          supportingSourceSpan: { start: entry.supportingSourceSpan.start + offset, end: entry.supportingSourceSpan.start + offset + value.length } };
      });
    });
    for (const [index, entry] of segments.entries()) {
      const reporter = sourceReporter(entry.value) || entry.reporter ||
        (fact.sourceType === "caregiver_report" ? "caregiver" : fact.sourceType === "participant_report" ? "participant" : null);
      let state = stateForClause(entry.value);
      if (segments.length === 1 && ["unknown", "not_assessed"].includes(fact.semantics.polarity))
        state = fact.semantics.polarity === "not_assessed" ? "NOT_ASSESSED" : "UNKNOWN";
      const time = temporalScopeForClause(entry.value);
      entries.push({
        ...entry, id: index === 0 ? fact.id : `${fact.id}-segment-${index + 1}`,
        originalFactId: fact.id, originalSourceField: fact.sourceField, intakeState: state,
        reporter,
        attribution: reporter ? (/^(client|member|patient|participant)$/.test(reporter) ? "client_report" : "third_party_report") : entry.attribution,
        polarity: ["UNKNOWN", "NOT_ASSESSED", "NOT_DOCUMENTED"].includes(state) ? "unknown" : state === "DENIED" ? "denied" : "affirmed",
        timeScope: time === "HISTORICAL" ? "historical" : time === "CURRENT" ? "current"
          : fact.temporalStatus === "unknown" ? "unspecified"
          : mappedTime.get(fact.sourceField) === "historical" ? "historical"
          : mappedTime.get(fact.sourceField) === "current" ? "current" : entry.timeScope,
        // Intake goals/needs cannot authorize performed care or participant agreement.
        permittedClaimTypes: ["source_fact_claim", "qualified_assessment_inference", "clinician_next_step", "coordination_recommendation"]
      });
    }
  }
  return { version: "source-fact-ledger.v1" as const, facts: entries };
}

const DIAGNOSIS = /\b(?:diagnos\w*|meets? criteria|dementia|neurocognitive|schizophren\w*|bipolar|major depressive disorder|generalized anxiety disorder|ptsd)\b/i;
const SCREENING_CONCLUSION = /\b(?:dementia|neurocognitive|incompeten\w*|incapacit\w*|eligible|eligibility|diagnos\w*)\b/i;
const SAFETY = /\b(?:suicid\w*|self[- ]harm|homicid\w*|harm to (?:self|others)|abuse|neglect|exploitation|elopement|wandering|safety risk|risk[- ]free)\b/i;

export function validatePsychosocialSemantics(blocks: SynthesisBlock[], facts: AssessmentFact[], provenance?: StructuredGeneratedNote) {
  const ledger = buildSegmentedPsychosocialLedger(facts);
  const entries = new Map(ledger.facts.map((entry) => [entry.id, entry]));
  const originals = new Map(facts.map((fact) => [fact.id, fact]));
  const sources = buildNoteOriginSourceLedger({ generationId: "local-intake", sourceFactLedger: ledger,
    sourceSnapshot: createGenerationSourceSnapshot({}) }).map((source) => {
      const entry = entries.get(source.id)!;
      const original = originals.get(entry.originalFactId)!;
      // A label supplies question context, never an affirmative answer. Original
      // source text and UTF-16 spans remain intact for provenance.
      return { ...source, matchingText: `${sourceEvidenceLabel(original)}: ${source.exactText}` };
    });
  const issues: string[] = [];
  for (const block of blocks) {
    const boundEntries = block.sourceFactIds.map((id) => entries.get(id));
    if (!boundEntries.length || boundEntries.some((entry) => !entry)) { issues.push("missing_source"); continue; }
    const selected = boundEntries as IntakeSegment[];
    const selectedSources = sources.filter((source) => block.sourceFactIds.includes(source.id));
    const originalFacts = selected.map((entry) => originals.get(entry.originalFactId)!);
    const text = block.text.replace(/^\s*\d+[.)]\s*/, "");
    // A production classifier result is not itself a validation failure.
    // In particular, imperatives need not contain a future-tense modal. The
    // unchanged production structural/traceability checks below still reject
    // performed care, invented agreements and unauthorized commitments.
    if (originalFacts.some((f) => f.domain === "cognitive_screening")) issues.push("screening_boundary");
    if (SCREENING_CONCLUSION.test(text) && /\b(?:screen|orientation|recall|cognitive)\w*\b/i.test(text)) issues.push("screening_boundary");
    if (SAFETY.test(text) && block.section !== "plan") issues.push("authoritative_safety_boundary");

    // Mapped provenance and explicit clinical checks remain mandatory. They
    // do not certify arbitrary prose entailment. Ordinary clinical review stays
    // in the existing edit/accept flow, not an added gate or second model.
    issues.push(...structuralIssues(text, selectedSources, block.section, block.section));

    for (const clause of reviewSegments(text)) {
      const material = synthesisTokenSet(clause);
      const relevant = selected.filter((entry) => {
        // Scalar yes/no/unknown answers need their immutable question context
        // to identify the proposition whose polarity must be preserved.
        const words = tokenSet(`${sourceEvidenceLabel(originals.get(entry.originalFactId)!)}: ${entry.value}`);
        return [...material].some((word) => words.has(word));
      });
      if (block.section !== "plan" && relevant.length) {
        const state = stateForClause(clause);
        if (relevant.every((entry) => entry.intakeState === "NOT_ASSESSED") && state !== "NOT_ASSESSED") issues.push("not_assessed_changed");
        if (relevant.every((entry) => entry.intakeState === "UNKNOWN") && state !== "UNKNOWN") issues.push("unknown_made_known");
        if (relevant.every((entry) => entry.intakeState === "NOT_DOCUMENTED") && state !== "NOT_DOCUMENTED") issues.push("not_documented_changed");
        if (relevant.every((entry) => entry.polarity === "denied") && state !== "DENIED") issues.push("denial_changed_to_positive");
        if (relevant.every((entry) => entry.polarity === "affirmed") && state === "DENIED") issues.push("affirmed_changed_to_denied");
        if (relevant.every((entry) => entry.timeScope === "historical") && !buildSourceFactLedger({ programContext: clause }).facts.some((entry) => entry.timeScope === "historical")) issues.push("historical_fact_made_current");
        const clauseReporter = sourceReporter(clause) || buildSourceFactLedger({ programContext: clause }).facts[0]?.reporter;
        for (const entry of relevant) if (entry.reporter && clauseReporter !== entry.reporter && !preservesReporterAttribution(clause, entry.reporter)) issues.push("source_attribution_changed");
      }
      if (DIAGNOSIS.test(clause) && !relevant.some((entry) => {
        const fact = originals.get(entry.originalFactId)!;
        return fact.semantics.diagnosisStatus === "documented_diagnosis" ||
          (fact.semantics.diagnosisStatus === "none" && stateForClause(clause) === "DENIED") ||
          (fact.semantics.diagnosisStatus === "unknown" && stateForClause(clause) === "UNKNOWN");
      })) issues.push("unsupported_diagnosis");
    }

    const contextualEvidence = selected.map((entry) => {
      const original = originals.get(entry.originalFactId)!;
      // Typed scalar adaptation for validation only, never rendered output.
      // LeanMaster accepts "aged N"; intake calculates "age: N" locally.
      // Exact full-value match prevents a coarse age band becoming an exact age.
      const value = original.sourceField === "calculated-age" && /^age: \d+$/.test(entry.value)
        ? entry.value.replace(/^age: /, "aged ") : entry.value;
      return `${sourceEvidenceLabel(original)}: ${value}`;
    }).join("\n");
    const evidence = buildNormalizedSourceEvidence({ programContext: contextualEvidence,
      diagnosis: originalFacts.filter((fact) => fact.semantics.diagnosisStatus === "documented_diagnosis").map((fact) => fact.normalizedValue).join("; ") });
    const grounding = validateGroundedClinicalOutput({ text: `${block.section === "plan" ? "Plan" : "Assessment"}:\n${text}`, evidence });
    // NoteOrigin deliberately replaces this legacy historical-overlap heuristic
    // with proposition checks. Omission is assessed on the final safety section,
    // not on every individual clinical proposition. NoteOrigin also excludes
    // recommendation placement: "recommended" can describe documented care,
    // not only new advice. This is a section-style finding, not source support.
    // Unlike upstream's wider advisory policy, every unsupported-content and
    // contradictory-content finding remains blocking here.
    issues.push(...grounding.issues.filter((issue) => issue !== "historical_fact_made_current" &&
      issue !== "recommendation_not_separated_from_facts" && !issue.startsWith("omitted_safety_fact:")));
  }
  const sections = [...new Set(blocks.map((block) => block.section))].map((key) => ({ key, heading: key, content: blocks.filter((block) => block.section === key).map((block) => block.text.replace(/^\s*\d+[.)]\s*/, "")).join("\n") }));
  // Full NoteOrigin proposition/source binding is defense in depth; the stricter
  // source-scoped semantic review above remains mandatory for mapped prose too.
  const sectionKeys: Record<string, string> = { "Psychosocial Assessment": "assessment", "Strengths / Protective Factors": "strengths", "Identified Needs / Barriers": "needs", "Treatment / Service Plan": "plan" };
  const reviewProvenance = provenance && structuredClone(provenance);
  if (reviewProvenance) {
    for (const group of [reviewProvenance.propositions, reviewProvenance.sourceFactClaims, reviewProvenance.qualifiedAssessmentInferences,
      reviewProvenance.performedInterventionClaims, reviewProvenance.clientCommitmentClaims, reviewProvenance.libraryGuidedRecommendations,
      reviewProvenance.clinicianNextSteps, reviewProvenance.coordinationRecommendations])
      for (const claim of group) claim.section = sectionKeys[claim.section] ?? claim.section;
    for (const proposition of reviewProvenance.propositions) proposition.text = proposition.text.replace(/^\s*\d+[.)]\s*/, "");
  }
  const review = evaluateNoteOriginSections({ sections, baseSections: sections, sources, provenance: reviewProvenance });
  const status = validateNoteOriginSentenceStatuses(review, sources);
  for (const unit of status) if (unit.status === "review_needed") issues.push(...(unit.validatorIssues.length ? unit.validatorIssues : ["unsupported_statement"]));
  const traceability = validateAssessmentPlanTraceability({ documentationTypeId: "dap_note_with_treatment_plan",
    text: `Assessment:\n${blocks.filter((b) => b.section !== "plan").map((b) => b.text).join("\n")}\nPlan:\n${blocks.filter((b) => b.section === "plan").map((b) => b.text).join("\n")}`,
    programContext: ledger.facts.filter((f) => f.sourceType !== "follow_up").map((f) => f.value).join("\n"),
    followUpPlan: ledger.facts.filter((f) => f.sourceType === "follow_up").map((f) => f.value).join("\n") });
  issues.push(...traceability.issues);
  return { valid: issues.length === 0, issues, review };
}

export function validateAuthoritativeSafety(sourceText: string, renderedText: string) {
  return compareSafetyFactContracts(extractSafetyFactContract(sourceText), extractSafetyFactContract(renderedText));
}
