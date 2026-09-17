// Ported from LeanMaster production ef76ca0735ed841e82fa98eed48420724709468b.
// Import paths adapted; policy adaptations are documented separately.
export const careThreadStatuses = [
  "Advanced",
  "Completed",
  "No progress",
  "New barrier",
  "Improved",
  "Worsened",
  "Not addressed today"
] as const;

export type CareThreadStatus = (typeof careThreadStatuses)[number];

export type CareThreadContinuityItem = {
  topic: string;
  status: CareThreadStatus;
  update: string;
};

export type CareThreadValidationIssue = {
  index: number;
  field: "topic" | "status" | "update";
  message: string;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateCareThreadContinuity(value: unknown): {
  items: CareThreadContinuityItem[];
  issues: CareThreadValidationIssue[];
} {
  if (!Array.isArray(value)) return { items: [], issues: [] };
  const items: CareThreadContinuityItem[] = [];
  const issues: CareThreadValidationIssue[] = [];

  value.slice(0, 3).forEach((entry, index) => {
    const candidate = entry && typeof entry === "object"
      ? (entry as Record<string, unknown>)
      : {};
    const topic = text(candidate.topic);
    const statusValue = text(candidate.status);
    const update = text(candidate.update);
    if (!topic && !statusValue && !update) return;
    if (!topic) issues.push({ index, field: "topic", message: "Enter a Care topic for this continuity item." });
    if (!careThreadStatuses.includes(statusValue as CareThreadStatus)) {
      issues.push({ index, field: "status", message: "Select a status for this continuity item." });
    }
    if (statusValue && statusValue !== "Not addressed today" && !update) {
      issues.push({ index, field: "update", message: "Enter a specific client update for this continuity item." });
    }
    if (topic && careThreadStatuses.includes(statusValue as CareThreadStatus) && (statusValue === "Not addressed today" || update)) {
      if (statusValue !== "Not addressed today") items.push({ topic, status: statusValue as CareThreadStatus, update });
    }
  });
  return { items, issues };
}
