// Adapted from LeanMaster ef76ca0735ed841e82fa98eed48420724709468b.
// Retains production source-fact projection; excludes unrelated authority sources.
import type { GenerationSourceSnapshot } from "@/lib/leanmaster/lib/generationSourceSnapshot";
import type {
  NoteOriginSource,
  NoteOriginSourceType
} from "@/lib/leanmaster/src/noteorigin/types";
import type { SourceFactLedger } from "@/lib/leanmaster/src/server/note/sourceFactLedger";
import { NOTEORIGIN_SOURCE_INDEXING } from "@/lib/leanmaster/src/noteorigin/sourceCanonicalization";

export type InternalNoteOriginSource = NoteOriginSource & {
  matchingText: string;
};

const enteredFields: Array<{
  field: keyof GenerationSourceSnapshot["fields"];
  label: string;
  prefix: string;
  sourceType: NoteOriginSourceType;
  anchor: string;
  fragment: boolean;
}> = [
  { field: "programContext", label: "Raw Session Information", prefix: "RAW", sourceType: "raw_session", anchor: "program-context", fragment: true },
  { field: "observedNeed", label: "Entered observed need / assessment point", prefix: "RAW", sourceType: "raw_session", anchor: "observed-need", fragment: true },
  { field: "staffSupport", label: "Entered staff intervention", prefix: "RAW", sourceType: "raw_session", anchor: "staff-support", fragment: true },
  { field: "followUpPlan", label: "Entered follow-up plan", prefix: "RAW", sourceType: "raw_session", anchor: "follow-up-plan", fragment: true },
  { field: "diagnosis", label: "Professional-selected diagnosis", prefix: "DX", sourceType: "selected_diagnosis", anchor: "diagnosis", fragment: false },
  { field: "activitiesCarePlanGoal", label: "Professional-selected treatment goal", prefix: "GOAL", sourceType: "selected_goal", anchor: "activities-care-plan-goal", fragment: true }
];

function textValue(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function actionText(value: unknown) {
  if (typeof value === "string") return textValue(value);
  if (!value || typeof value !== "object") return "";
  const action = value as Record<string, unknown>;
  return [action.statement, action.text, action.label, action.action]
    .map(textValue)
    .find(Boolean) || "";
}

function generationScope(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).toUpperCase().padStart(6, "0").slice(-6);
}

/** Canonical excerpts retain their complete sentence-level clinical context. */
export function fragmentNoteOriginSource(value: string) {
  const clean = value.replace(/\r\n?/g, "\n").trim();
  if (!clean) return [];
  const fragments: string[] = [];
  for (const line of clean.split(/\n+/)) {
    for (const match of line.match(/[^.!?]+(?:[.!?]+|$)/g) || []) {
      const excerpt = match.replace(/\s+/g, " ").trim();
      if (excerpt) fragments.push(excerpt);
    }
  }
  return fragments;
}

export function buildNoteOriginSourceLedger(options: {
  generationId: string;
  sourceSnapshot: GenerationSourceSnapshot;
  sourceFactLedger?: SourceFactLedger;
  clinicalGuidanceId?: unknown;
  interventionGuidanceContract?: unknown;
  careThreadItems?: unknown;
}) {
  const entries: InternalNoteOriginSource[] = [];
  const counters = new Map<string, number>();
  const scope = generationScope(options.generationId);
  const nextId = (prefix: string) => {
    const count = (counters.get(prefix) || 0) + 1;
    counters.set(prefix, count);
    return `${prefix}-${scope}-${String(count).padStart(3, "0")}`;
  };
  const add = (input: {
    id?: string;
    prefix: string;
    sourceType: NoteOriginSourceType;
    label: string;
    exactText: string;
    matchingText?: string;
    sourceField?: string;
    sourceAnchor?: string;
    sourceSpan?: { start: number; end: number };
    referenceText?: string;
    protectedDescriptor?: boolean;
  }) => {
    const clean = textValue(input.exactText);
    const match = textValue(input.matchingText ?? input.exactText);
    if (!clean || !match) return;
    entries.push({
      id: input.id || nextId(input.prefix),
      sourceType: input.sourceType,
      label: input.label,
      exactText: clean,
      matchingText: match,
      ...(input.sourceField ? { sourceField: input.sourceField } : {}),
      ...(input.sourceAnchor ? { sourceAnchor: input.sourceAnchor } : {}),
      ...(input.sourceSpan
        ? {
            sourceSpan: {
              ...input.sourceSpan,
              indexing: NOTEORIGIN_SOURCE_INDEXING
            }
          }
        : {}),
      ...(input.referenceText ? { referenceText: textValue(input.referenceText) } : {}),
      ...(input.protectedDescriptor ? { protectedDescriptor: true } : {})
    });
  };

  const sourceFactLabels: Record<string, { label: string; anchor: string; sourceType: NoteOriginSourceType }> = {
    programContext: { label: "Raw Session Information", anchor: "program-context", sourceType: "raw_session" },
    observedNeed: { label: "Entered observed need / assessment point", anchor: "observed-need", sourceType: "raw_session" },
    staffSupport: { label: "Entered staff intervention", anchor: "staff-support", sourceType: "raw_session" },
    followUpPlan: { label: "Entered follow-up plan", anchor: "follow-up-plan", sourceType: "raw_session" },
    careThreadContinuityText: { label: "Authorized Care-Thread continuity information", anchor: "care-thread-update-0", sourceType: "care_thread" }
  };
  for (const fact of options.sourceFactLedger?.facts || []) {
    const descriptor = sourceFactLabels[fact.sourceField] || sourceFactLabels.programContext;
    add({
      id: fact.id,
      prefix: "SF",
      sourceType: descriptor.sourceType,
      label: descriptor.label,
      exactText: fact.value,
      sourceField: fact.sourceField,
      sourceAnchor: descriptor.anchor,
      sourceSpan: fact.supportingSourceSpan
    });
  }


  // This adapter accepts only reviewed intake fact entries; no selections,
  // external clinical-library authority, or care-thread storage is introduced.
  return entries;
}
