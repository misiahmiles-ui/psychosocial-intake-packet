// Ported from LeanMaster production ef76ca0735ed841e82fa98eed48420724709468b.
// Import paths adapted; policy adaptations are documented separately.

export type NoteOriginSourceType =
  | "raw_session"
  | "selected_diagnosis"
  | "selected_goal"
  | "selected_intervention"
  | "care_thread"
  | "clinical_library";

export type NoteOriginReviewUnitType =
  | "clinical_fact"
  | "professional_synthesis"
  | "clinical_library_guidance"
  | "citation_reference_metadata"
  | "professional_selected_diagnosis"
  | "internal_scaffolding";

export type NoteOriginReviewEligibility =
  | "clinical_review"
  | "synthesis_review"
  | "provenance_metadata"
  | "excluded_scaffolding";

export type NoteOriginReviewUnitManifestEntry = {
  id: string;
  sectionKey: string;
  text: string;
  unitType: NoteOriginReviewUnitType;
  eligibility: NoteOriginReviewEligibility;
  sourceRefs: string[];
  sourceOrigin:
    | "structured_generation"
    | "clinical_library_contract"
    | "professional_selected_diagnosis"
    | "internal_scaffolding";
};

export type NoteOriginReviewUnitManifest = {
  version: "noteorigin-review-units.v1";
  units: NoteOriginReviewUnitManifestEntry[];
};

export type NoteOriginSource = {
  id: string;
  sourceType: NoteOriginSourceType;
  label: string;
  exactText: string;
  sourceField?: string;
  sourceAnchor?: string;
  sourceSpan?: {
    start: number;
    end: number;
    indexing: "noteorigin-canonical-source.v1";
  };
  referenceText?: string;
  protectedDescriptor?: boolean;
};

export type NoteOriginStatus =
  | "fact_backed"
  | "professional_rewrite"
  | "source_metadata"
  | "review_needed";

export type NoteOriginSentence = {
  id: string;
  sectionKey: string;
  sectionLabel: string;
  text: string;
  unitType: NoteOriginReviewUnitType;
  eligibility: NoteOriginReviewEligibility;
  status: NoteOriginStatus;
  sourceRefs: string[];
  reason: string | null;
  supportedPortions: string[];
  unsupportedPortions: string[];
  validatorIssues: string[];
  changed: boolean;
};

export type NoteOriginCounts = {
  total: number;
  factBacked: number;
  professionalSynthesis: number;
  sourceMetadata: number;
  reviewNeeded: number;
};

export type NoteOriginReview = {
  generationId: string;
  sentences: NoteOriginSentence[];
  sources: NoteOriginSource[];
  sourceFieldValues: Record<string, string>;
  sections: Record<string, string>;
  unresolvedCount: number;
  counts: NoteOriginCounts;
  reviewConfirmed: boolean;
  reviewArtifact: string;
};

export const noteOriginStatusLabels: Record<NoteOriginStatus, string> = {
  fact_backed: "Fact-Backed",
  professional_rewrite: "Professional Synthesis",
  source_metadata: "Authorized Source Metadata",
  review_needed: "Reviewer Decision Needed"
};
