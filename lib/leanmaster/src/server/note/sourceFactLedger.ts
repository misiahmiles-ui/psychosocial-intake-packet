// Ported from misiahmiles-ui/leanmaster-note-engine@ef76ca0735ed841e82fa98eed48420724709468b
// Original: src/server/note/sourceFactLedger.ts. Only module import paths are adapted.
import { segmentSupportSources } from "@/lib/leanmaster/src/support/textNormalization";
import {
  classifyPlanProposition,
  clientActionReassignedToProfessional,
  hasExplicitConsequentialAuthorization,
  plannedSourceCannotProveCompletion
} from "@/lib/leanmaster/src/server/note/planProposition";

export const structuredClaimKinds = [
  "source_fact_claim",
  "qualified_assessment_inference",
  "performed_intervention_claim",
  "client_commitment_claim",
  "library_guided_recommendation",
  "clinician_next_step",
  "coordination_recommendation"
] as const;

export type StructuredClaimKind = (typeof structuredClaimKinds)[number];
type Polarity = "affirmed" | "denied" | "unknown";
type SourceType = "session" | "observation" | "performed_intervention" | "participant_response" | "follow_up";
type Attribution = "client_report" | "third_party_report" | "clinician_observation" | "documented_record";

export type SourceFactLedgerEntry = {
  id: string;
  personOrEntity: string;
  relationship: string | null;
  predicate: "source_statement";
  value: string;
  polarity: Polarity;
  reporter: string | null;
  attribution: Attribution;
  sourceType: SourceType;
  certainty: "explicit";
  timeScope: "current" | "historical" | "unspecified";
  sourceField: string;
  supportingSourceSpan: { start: number; end: number };
  permittedClaimTypes: StructuredClaimKind[];
};

export type SourceFactLedger = {
  version: "source-fact-ledger.v1";
  facts: SourceFactLedgerEntry[];
};

export type AllowedClaimCatalog = {
  version: "allowed-claim-catalog.v1";
  sourceFactIds: string[];
  performedInterventionFactIds: string[];
  clientCommitmentFactIds: string[];
  libraryGuidance: Array<{ id: string; source: "clinical_guidance" | "intervention_guidance" }>;
};

type SourceFactClaim = { id: string; sourceFactId: string; section: string };
type QualifiedAssessmentInference = { id: string; supportingSourceFactIds: string[]; section: string; qualification: "qualified" };
type PerformedInterventionClaim = { id: string; sourceFactId: string; section: string };
type ClientCommitmentClaim = { id: string; sourceFactId: string; section: string };
type LibraryGuidedRecommendation = { id: string; libraryGuidanceId: string; supportingSourceFactIds: string[]; section: string };
type ClinicianNextStep = { id: string; supportingSourceFactIds: string[]; section: string };
type CoordinationRecommendation = { id: string; supportingSourceFactIds: string[]; section: string };

export type StructuredGeneratedProposition = {
  id: string;
  section: string;
  text: string;
  claimIds: string[];
};

export type StructuredGeneratedNote = {
  noteText: string;
  propositions: StructuredGeneratedProposition[];
  sourceFactClaims: SourceFactClaim[];
  qualifiedAssessmentInferences: QualifiedAssessmentInference[];
  performedInterventionClaims: PerformedInterventionClaim[];
  clientCommitmentClaims: ClientCommitmentClaim[];
  libraryGuidedRecommendations: LibraryGuidedRecommendation[];
  clinicianNextSteps: ClinicianNextStep[];
  coordinationRecommendations: CoordinationRecommendation[];
};

export type StructuredClaimValidationFinding = {
  issue: string;
  claimId: string;
  claimType: StructuredClaimKind;
  section: string;
  sourceFactIds: string[];
  libraryGuidanceId: string | null;
  sourceFields: string[];
  attributionTypes: Attribution[];
  polarities: Polarity[];
  detailCode: string;
};

export type ValidatedStructuredRecord = StructuredGeneratedNote & {
  immutableSourceFacts: SourceFactLedgerEntry[];
};

type LedgerInput = { programContext?: string; observedNeed?: string; staffSupport?: string; participantResponse?: string; followUpPlan?: string; careThreadContinuityText?: string };

const relationshipPattern = /\b(mother|father|parent|guardian|family|sister|brother|spouse|husband|wife|partner|friend|school|teachers?|caregiver|neighbor|landlord|prescriber|son|daughter|child|payer|pca)\b/i;
const reporterPattern = /\b(client|member|patient|participant|mother|father|parent|guardian|caregiver|teacher|school|landlord|prescriber|payer)\s+(?:reported|reports|stated|states|said|requested|asked|noted|confirmed|denied|denies)\b/i;

function canonicalRelationship(value: string | undefined) {
  if (!value) return null;
  const lower = value.toLowerCase();
  return lower === "teachers" ? "teacher" : lower;
}

function sourceTypeFor(field: string): SourceType {
  if (field === "observedNeed") return "observation";
  if (field === "staffSupport") return "performed_intervention";
  if (field === "participantResponse") return "participant_response";
  if (field === "followUpPlan") return "follow_up";
  return "session";
}

function reporterFor(text: string) {
  return text.match(reporterPattern)?.[1]?.toLowerCase() || null;
}

function polarityFor(text: string): Polarity {
  return /\b(?:denied|denies|no |not |without)\b/i.test(text) ? "denied" : "affirmed";
}

function permittedClaimTypesFor(options: {
  sourceType: SourceType;
  value: string;
}): StructuredClaimKind[] {
  const permitted = new Set<StructuredClaimKind>([
    "source_fact_claim",
    "qualified_assessment_inference",
    "clinician_next_step",
    "coordination_recommendation"
  ]);
  if (options.sourceType === "performed_intervention") permitted.add("performed_intervention_claim");
  if (/\b(?:agreed|agreement|accepted|consented|will participate)\b/i.test(options.value)) {
    permitted.add("client_commitment_claim");
  }
  return [...permitted];
}

export function buildSourceFactLedger(input: LedgerInput): SourceFactLedger {
  const fields = ["programContext", "observedNeed", "staffSupport", "participantResponse", "followUpPlan", "careThreadContinuityText"] as const;
  const facts: SourceFactLedgerEntry[] = [];
  for (const field of fields) {
    const text = input[field] || "";
    let ordinal = 0;
    for (const segment of segmentSupportSources([{ field, text }])) {
      const value = segment.originalText.trim();
      if (!value) continue;
      const reporter = reporterFor(value);
      const sourceType = sourceTypeFor(field);
      const attribution: Attribution = sourceType === "observation"
        ? "clinician_observation"
        : reporter === "client" || reporter === "member" || reporter === "patient" || reporter === "participant"
          ? "client_report"
          : reporter ? "third_party_report" : "documented_record";
      const relationships = Array.from(value.matchAll(new RegExp(relationshipPattern.source, "gi")))
        .map((match) => canonicalRelationship(match[1]));
      for (const relationship of relationships.length ? relationships : [null]) {
        ordinal += 1;
        facts.push({
          id: `sf_${field}_${ordinal}`,
          personOrEntity: relationship || reporter || "unspecified",
          relationship,
          predicate: "source_statement",
          value,
          polarity: polarityFor(value),
          reporter,
          attribution,
          sourceType,
          certainty: "explicit",
          timeScope: /\b(?:history|prior|previous|past|ago)\b/i.test(value) ? "historical" : "current",
          sourceField: field,
          supportingSourceSpan: { start: segment.startOffset, end: segment.endOffset },
          permittedClaimTypes: permittedClaimTypesFor({ sourceType, value })
        });
      }
    }
  }
  return { version: "source-fact-ledger.v1", facts };
}

export function buildAllowedClaimCatalog(options: {
  ledger: SourceFactLedger;
  clinicalGuidanceId: string | null;
  selectedInterventionCount: number;
}): AllowedClaimCatalog {
  const libraryGuidance: AllowedClaimCatalog["libraryGuidance"] = [];
  if (options.clinicalGuidanceId) {
    libraryGuidance.push({ id: `lg_clinical_${options.clinicalGuidanceId}`, source: "clinical_guidance" });
  }
  for (let index = 0; index < options.selectedInterventionCount; index += 1) {
    libraryGuidance.push({ id: `lg_intervention_${index + 1}`, source: "intervention_guidance" });
  }
  return {
    version: "allowed-claim-catalog.v1",
    sourceFactIds: options.ledger.facts.map((fact) => fact.id),
    performedInterventionFactIds: options.ledger.facts
      .filter((fact) => fact.permittedClaimTypes.includes("performed_intervention_claim"))
      .map((fact) => fact.id),
    clientCommitmentFactIds: options.ledger.facts
      .filter((fact) => fact.permittedClaimTypes.includes("client_commitment_claim"))
      .map((fact) => fact.id),
    libraryGuidance
  };
}

export function sourceFactLedgerPrompt(ledger: SourceFactLedger, catalog: AllowedClaimCatalog) {
  return JSON.stringify({ ledger, allowedClaimCatalog: catalog });
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  return Object.keys(value).length === keys.length && keys.every((key) => key in value);
}

function isIdReference(value: unknown): value is { id: string; sourceFactId: string; section: string } {
  return Boolean(value) && typeof value === "object" && hasExactKeys(value as Record<string, unknown>, ["id", "sourceFactId", "section"]) &&
    typeof (value as { id?: unknown }).id === "string" && typeof (value as { sourceFactId?: unknown }).sourceFactId === "string" && typeof (value as { section?: unknown }).section === "string";
}

function isSupportedReference(value: unknown): value is { id: string; supportingSourceFactIds: string[]; section: string } {
  return Boolean(value) && typeof value === "object" &&
    typeof (value as { id?: unknown }).id === "string" && Array.isArray((value as { supportingSourceFactIds?: unknown }).supportingSourceFactIds) &&
    (value as { supportingSourceFactIds: unknown[] }).supportingSourceFactIds.every((id) => typeof id === "string") && typeof (value as { section?: unknown }).section === "string";
}

function isInference(value: unknown): value is QualifiedAssessmentInference {
  return isSupportedReference(value) && hasExactKeys(value as Record<string, unknown>, ["id", "supportingSourceFactIds", "section", "qualification"]) &&
    (value as { qualification?: unknown }).qualification === "qualified";
}

function isLibraryRecommendation(value: unknown): value is LibraryGuidedRecommendation {
  return isSupportedReference(value) && hasExactKeys(value as Record<string, unknown>, ["id", "libraryGuidanceId", "supportingSourceFactIds", "section"]) &&
    typeof (value as { libraryGuidanceId?: unknown }).libraryGuidanceId === "string";
}

function isGeneratedProposition(value: unknown): value is StructuredGeneratedProposition {
  return Boolean(value) && typeof value === "object" &&
    hasExactKeys(value as Record<string, unknown>, ["id", "section", "text", "claimIds"]) &&
    typeof (value as { id?: unknown }).id === "string" &&
    typeof (value as { section?: unknown }).section === "string" &&
    typeof (value as { text?: unknown }).text === "string" &&
    Array.isArray((value as { claimIds?: unknown }).claimIds) &&
    (value as { claimIds: unknown[] }).claimIds.length > 0 &&
    (value as { claimIds: unknown[] }).claimIds.every((id) => typeof id === "string");
}

export function parseStructuredGeneratedNote(value: string): StructuredGeneratedNote | null {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const keys = ["noteText", "propositions", "sourceFactClaims", "qualifiedAssessmentInferences", "performedInterventionClaims", "clientCommitmentClaims", "libraryGuidedRecommendations", "clinicianNextSteps", "coordinationRecommendations"];
    if (!hasExactKeys(parsed, keys) || typeof parsed.noteText !== "string") return null;
    const collections = keys.slice(1).map((key) => parsed[key]);
    if (!collections.every(Array.isArray)) return null;
    return (parsed.propositions as unknown[]).every(isGeneratedProposition) &&
      (parsed.sourceFactClaims as unknown[]).every(isIdReference) &&
      (parsed.qualifiedAssessmentInferences as unknown[]).every(isInference) &&
      (parsed.performedInterventionClaims as unknown[]).every(isIdReference) &&
      (parsed.clientCommitmentClaims as unknown[]).every(isIdReference) &&
      (parsed.libraryGuidedRecommendations as unknown[]).every(isLibraryRecommendation) &&
      (parsed.clinicianNextSteps as unknown[]).every((item) => isSupportedReference(item) && hasExactKeys(item as Record<string, unknown>, ["id", "supportingSourceFactIds", "section"])) &&
      (parsed.coordinationRecommendations as unknown[]).every((item) => isSupportedReference(item) && hasExactKeys(item as Record<string, unknown>, ["id", "supportingSourceFactIds", "section"]))
      ? parsed as unknown as StructuredGeneratedNote
      : null;
  } catch {
    return null;
  }
}

export function canRetryOrphanPropositionGeneration(options: {
  rawOutput: string;
  ledger: SourceFactLedger;
  catalog: AllowedClaimCatalog;
  retryCount: number;
}) {
  if (options.retryCount !== 0) return false;

  const ledgerFactIds = new Set(options.ledger.facts.map((fact) => fact.id));
  const hasLegitimateSourceSupport = options.catalog.sourceFactIds.some((id) =>
    ledgerFactIds.has(id)
  );
  if (!hasLegitimateSourceSupport) return false;

  try {
    const parsed = JSON.parse(options.rawOutput) as Record<string, unknown>;
    if (!Array.isArray(parsed.propositions)) return false;

    let foundOrphan = false;
    const shapeOnlyPropositions = parsed.propositions.map((value) => {
      if (!value || typeof value !== "object") return value;
      const proposition = value as Record<string, unknown>;
      if (Array.isArray(proposition.claimIds) && proposition.claimIds.length === 0) {
        foundOrphan = true;
        return { ...proposition, claimIds: ["__shape_check_only__"] };
      }
      return value;
    });
    if (!foundOrphan) return false;

    return Boolean(
      parseStructuredGeneratedNote(
        JSON.stringify({ ...parsed, propositions: shapeOnlyPropositions })
      )
    );
  } catch {
    return false;
  }
}

function claimFinding(options: {
  issue: string;
  claimId: string;
  claimType: StructuredClaimKind;
  section: string;
  sourceFactIds: string[];
  libraryGuidanceId?: string | null;
  detailCode: string;
  sourceFacts: SourceFactLedgerEntry[];
}): StructuredClaimValidationFinding {
  return {
    issue: options.issue,
    claimId: options.claimId,
    claimType: options.claimType,
    section: options.section,
    sourceFactIds: options.sourceFactIds,
    libraryGuidanceId: options.libraryGuidanceId || null,
    sourceFields: Array.from(new Set(options.sourceFacts.map((fact) => fact.sourceField))),
    attributionTypes: Array.from(new Set(options.sourceFacts.map((fact) => fact.attribution))),
    polarities: Array.from(new Set(options.sourceFacts.map((fact) => fact.polarity))),
    detailCode: options.detailCode
  };
}

export function validateStructuredGeneratedClaims(
  note: StructuredGeneratedNote,
  ledger: SourceFactLedger,
  catalog: AllowedClaimCatalog
) {
  const facts = new Map(ledger.facts.map((fact) => [fact.id, fact]));
  const issues: string[] = [];
  const findings: StructuredClaimValidationFinding[] = [];
  const seen = new Set<string>();
  const add = (finding: StructuredClaimValidationFinding) => { issues.push(finding.issue); findings.push(finding); };
  const requireUnique = (id: string, type: StructuredClaimKind, section: string, sourceFactIds: string[], libraryGuidanceId: string | null = null) => {
    if (!seen.has(id)) { seen.add(id); return true; }
    add(claimFinding({ issue: `duplicate_claim:${id}`, claimId: id, claimType: type, section, sourceFactIds, libraryGuidanceId, detailCode: "duplicate_claim", sourceFacts: sourceFactIds.map((sourceId) => facts.get(sourceId)).filter(Boolean) as SourceFactLedgerEntry[] }));
    return false;
  };
  const sourceFactsFor = (id: string, type: StructuredClaimKind, section: string, sourceFactIds: string[], libraryGuidanceId: string | null = null) => {
    const sources = sourceFactIds.map((sourceId) => facts.get(sourceId));
    if (!sourceFactIds.length) {
      add(claimFinding({ issue: `claim_without_source:${id}`, claimId: id, claimType: type, section, sourceFactIds, libraryGuidanceId, detailCode: "missing_source_fact", sourceFacts: [] }));
      return null;
    }
    if (sources.some((source) => !source)) {
      add(claimFinding({ issue: `unknown_source_fact:${id}`, claimId: id, claimType: type, section, sourceFactIds, libraryGuidanceId, detailCode: "unknown_source_fact", sourceFacts: sources.filter(Boolean) as SourceFactLedgerEntry[] }));
      return null;
    }
    return sources as SourceFactLedgerEntry[];
  };
  const requirePermitted = (id: string, type: StructuredClaimKind, section: string, sourceFactIds: string[], sources: SourceFactLedgerEntry[]) => {
    if (sources.some((source) => source.permittedClaimTypes.includes(type))) return;
    add(claimFinding({ issue: `claim_type_not_permitted:${id}:${type}`, claimId: id, claimType: type, section, sourceFactIds, detailCode: "claim_type_not_permitted", sourceFacts: sources }));
  };

  for (const claim of note.sourceFactClaims) {
    if (!requireUnique(claim.id, "source_fact_claim", claim.section, [claim.sourceFactId])) continue;
    const sources = sourceFactsFor(claim.id, "source_fact_claim", claim.section, [claim.sourceFactId]);
    if (sources) requirePermitted(claim.id, "source_fact_claim", claim.section, [claim.sourceFactId], sources);
  }
  for (const claim of note.qualifiedAssessmentInferences) {
    if (!requireUnique(claim.id, "qualified_assessment_inference", claim.section, claim.supportingSourceFactIds)) continue;
    const sources = sourceFactsFor(claim.id, "qualified_assessment_inference", claim.section, claim.supportingSourceFactIds);
    if (sources) requirePermitted(claim.id, "qualified_assessment_inference", claim.section, claim.supportingSourceFactIds, sources);
  }
  for (const claim of note.performedInterventionClaims) {
    if (!requireUnique(claim.id, "performed_intervention_claim", claim.section, [claim.sourceFactId])) continue;
    const sources = sourceFactsFor(claim.id, "performed_intervention_claim", claim.section, [claim.sourceFactId]);
    if (sources) requirePermitted(claim.id, "performed_intervention_claim", claim.section, [claim.sourceFactId], sources);
  }
  for (const claim of note.clientCommitmentClaims) {
    if (!requireUnique(claim.id, "client_commitment_claim", claim.section, [claim.sourceFactId])) continue;
    const sources = sourceFactsFor(claim.id, "client_commitment_claim", claim.section, [claim.sourceFactId]);
    if (sources) requirePermitted(claim.id, "client_commitment_claim", claim.section, [claim.sourceFactId], sources);
  }
  for (const claim of note.libraryGuidedRecommendations) {
    if (!requireUnique(claim.id, "library_guided_recommendation", claim.section, claim.supportingSourceFactIds, claim.libraryGuidanceId)) continue;
    const sources = sourceFactsFor(claim.id, "library_guided_recommendation", claim.section, claim.supportingSourceFactIds, claim.libraryGuidanceId);
    if (sources && !catalog.libraryGuidance.some((guidance) => guidance.id === claim.libraryGuidanceId)) {
      add(claimFinding({ issue: `unknown_library_guidance:${claim.id}`, claimId: claim.id, claimType: "library_guided_recommendation", section: claim.section, sourceFactIds: claim.supportingSourceFactIds, libraryGuidanceId: claim.libraryGuidanceId, detailCode: "unknown_library_guidance", sourceFacts: sources }));
    }
  }
  for (const claim of note.clinicianNextSteps) {
    if (!requireUnique(claim.id, "clinician_next_step", claim.section, claim.supportingSourceFactIds)) continue;
    const sources = sourceFactsFor(claim.id, "clinician_next_step", claim.section, claim.supportingSourceFactIds);
    if (sources) requirePermitted(claim.id, "clinician_next_step", claim.section, claim.supportingSourceFactIds, sources);
  }
  for (const claim of note.coordinationRecommendations) {
    if (!requireUnique(claim.id, "coordination_recommendation", claim.section, claim.supportingSourceFactIds)) continue;
    const sources = sourceFactsFor(claim.id, "coordination_recommendation", claim.section, claim.supportingSourceFactIds);
    if (sources) requirePermitted(claim.id, "coordination_recommendation", claim.section, claim.supportingSourceFactIds, sources);
  }


  const claims = new Map<string, {
    section: string;
    type: StructuredClaimKind;
    sourceFactIds: string[];
    libraryGuidanceId: string | null;
  }>();
  const indexClaims = (
    type: StructuredClaimKind,
    values: Array<{ id: string; section: string; sourceFactId?: string; supportingSourceFactIds?: string[]; libraryGuidanceId?: string }>
  ) => {
    values.forEach((claim) => claims.set(claim.id, {
      section: claim.section,
      type,
      sourceFactIds: claim.sourceFactId ? [claim.sourceFactId] : claim.supportingSourceFactIds || [],
      libraryGuidanceId: claim.libraryGuidanceId || null
    }));
  };
  indexClaims("source_fact_claim", note.sourceFactClaims);
  indexClaims("qualified_assessment_inference", note.qualifiedAssessmentInferences);
  indexClaims("performed_intervention_claim", note.performedInterventionClaims);
  indexClaims("client_commitment_claim", note.clientCommitmentClaims);
  indexClaims("library_guided_recommendation", note.libraryGuidedRecommendations);
  indexClaims("clinician_next_step", note.clinicianNextSteps);
  indexClaims("coordination_recommendation", note.coordinationRecommendations);

  const normalizedText = (value: string) => value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const normalizedNote = normalizedText(note.noteText);
  const propositionIds = new Set<string>();
  const boundClaimIds = new Set<string>();
  for (const proposition of note.propositions) {
    if (propositionIds.has(proposition.id)) {
      issues.push(`duplicate_proposition:${proposition.id}`);
      continue;
    }
    propositionIds.add(proposition.id);
    const propositionText = normalizedText(proposition.text);
    if (!propositionText || !normalizedNote.includes(propositionText)) {
      issues.push(`proposition_not_in_note:${proposition.id}`);
    }
    if (!proposition.claimIds.length) issues.push(`proposition_without_claim:${proposition.id}`);
    for (const claimId of proposition.claimIds) {
      const claim = claims.get(claimId);
      if (!claim) {
        issues.push(`unknown_proposition_claim:${proposition.id}:${claimId}`);
        continue;
      }
      if (claim.section.toLowerCase() !== proposition.section.toLowerCase()) {
        issues.push(`proposition_claim_section_mismatch:${proposition.id}:${claimId}`);
      }
      if (boundClaimIds.has(claimId)) issues.push(`claim_bound_more_than_once:${claimId}`);
      boundClaimIds.add(claimId);
    }

    const propositionClaims = proposition.claimIds
      .map((claimId) => claims.get(claimId))
      .filter(Boolean) as Array<{
        section: string;
        type: StructuredClaimKind;
        sourceFactIds: string[];
        libraryGuidanceId: string | null;
      }>;
    const propositionSources = Array.from(new Set(propositionClaims.flatMap((claim) => claim.sourceFactIds)))
      .map((sourceId) => facts.get(sourceId))
      .filter(Boolean) as SourceFactLedgerEntry[];
    const planClassification = classifyPlanProposition(
      proposition.text,
      proposition.section,
      proposition.section
    );
    if (
      planClassification.kind === "consequential_professional_commitment" &&
      planClassification.professionalActor
    ) {
      const explicitlyAuthorized = hasExplicitConsequentialAuthorization(
        proposition.text,
        propositionSources.map((source) => ({
          sourceType: source.sourceType,
          sourceField: source.sourceField,
          matchingText: source.value,
          exactText: source.value
        }))
      );
      if (!explicitlyAuthorized) {
        issues.push(`unauthorized_consequential_professional_commitment:${proposition.id}`);
      }
    }
    if (clientActionReassignedToProfessional(
      proposition.text,
      propositionSources.map((source) => ({ sourceField: source.sourceField, matchingText: source.value }))
    )) {
      issues.push(`client_action_reassigned_to_professional:${proposition.id}`);
    }
    if (plannedSourceCannotProveCompletion(
      proposition.text,
      propositionSources.map((source) => ({ sourceField: source.sourceField, matchingText: source.value }))
    )) {
      issues.push(`planned_action_used_as_completed_evidence:${proposition.id}`);
    }
  }
  for (const claimId of claims.keys()) {
    if (!boundClaimIds.has(claimId)) issues.push(`unbound_claim:${claimId}`);
  }

  return {
    valid: issues.length === 0,
    issues,
    findings,
    record: {
      ...note,
      immutableSourceFacts: Array.from(new Set(note.sourceFactClaims.map((claim) => claim.sourceFactId)))
        .map((id) => facts.get(id))
        .filter(Boolean) as SourceFactLedgerEntry[]
    } satisfies ValidatedStructuredRecord
  };
}

export function validateStructuredPropositionCoverage(note: StructuredGeneratedNote) {
  const normalize = (value: string) => value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim();
  const propositionTexts = note.propositions.map((proposition) => normalize(proposition.text)).filter(Boolean);
  const reviewUnits = note.noteText
    .replace(/\r\n?/g, "\n")
    .split(/(?<=[.!?])\s+|\n+/u)
    .map((unit) => unit.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter((unit) => /[.!?]["']?$/.test(unit) && normalize(unit).length >= 8);
  const uncoveredUnits = reviewUnits.filter((unit) => {
    const normalizedUnit = normalize(unit);
    return !propositionTexts.some((proposition) =>
      normalizedUnit.includes(proposition) || proposition.includes(normalizedUnit)
    );
  });
  return {
    valid: reviewUnits.length > 0 && uncoveredUnits.length === 0,
    reviewUnitCount: reviewUnits.length,
    uncoveredUnits
  };
}
