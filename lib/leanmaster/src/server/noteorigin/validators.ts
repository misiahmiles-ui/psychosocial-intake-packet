// Ported from LeanMaster production ef76ca0735ed841e82fa98eed48420724709468b.
// Import paths adapted; policy adaptations are documented separately.
import type { GenerationSourceSnapshot } from "@/lib/leanmaster/lib/generationSourceSnapshot";
import {
  buildNormalizedSourceEvidence,
  validateGroundedClinicalOutput
} from "@/lib/leanmaster/src/server/note/sourceGrounding";
import type { CareThreadContinuityItem } from "@/lib/leanmaster/src/server/note/careThreadContinuity";

const failClosedIssues = new Set([
  "unsupported_diagnosis",
  "unsupported_relationship",
  "third_party_attribution_lost",
  "denial_changed_to_positive",
  "unsupported_age",
  "unsupported_date",
  "unsupported_service_history",
  "unsupported_quotation"
]);

function careThreadItems(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const item = candidate as Record<string, unknown>;
    if (typeof item.update !== "string" || !item.update.trim()) return [];
    return [{
      topic: typeof item.topic === "string" ? item.topic : "",
      status: typeof item.status === "string" ? item.status : "",
      update: item.update
    } as CareThreadContinuityItem];
  });
}

/**
 * Reuses LeanMaster's existing source-grounding and atomic safety contracts for
 * every review unit. Omission findings are excluded because a review unit is
 * intentionally smaller than the whole note; contradictions remain fail-closed.
 *
 * The legacy `historical_fact_made_current` signal is intentionally not applied
 * here. Its whole-note heuristic treats any two-token/protected-concept overlap
 * with a historical record as related, which produces false unit-level warnings
 * for current facts such as depression or medication adherence. NoteOrigin's
 * proposition-aware temporal check remains fail-closed for actual historical-to-
 * current changes.
 */
export function createNoteOriginUnitValidator(options: {
  sourceSnapshot: GenerationSourceSnapshot;
  careThreadItems?: unknown;
}) {
  const fields = options.sourceSnapshot.fields;
  const evidence = buildNormalizedSourceEvidence({
    diagnosis: fields.diagnosis,
    dateOfService: fields.dateOfService,
    payerDisplay: fields.otherPayer || fields.payer,
    county: fields.county,
    programContext: fields.programContext,
    observedNeed: fields.observedNeed,
    staffSupport: fields.staffSupport,
    followUpPlan: fields.followUpPlan,
    careThreadContinuity: careThreadItems(options.careThreadItems)
  });

  return (unit: { text: string; sectionLabel: string }) => {
    const result = validateGroundedClinicalOutput({
      text: `${unit.sectionLabel}:\n${unit.text}`,
      evidence
    });
    if (result.valid) return [];
    return result.issues.filter(
      (issue) =>
        !issue.startsWith("omitted_safety_fact:") &&
        (issue.startsWith("unsupported_safety_fact:") ||
          issue.startsWith("changed_safety_") ||
          failClosedIssues.has(issue))
    );
  };
}
