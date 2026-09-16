import "server-only";

type ProviderTimingEvent = {
  runId: string;
  phase: "request" | "headers" | "body" | "complete" | "failure";
  attempt?: number;
  elapsedMs?: number;
  phaseMs?: number;
  status?: number;
  factCount?: number;
  requestBytes?: number;
  instructionBytes?: number;
  schemaBytes?: number;
  model?: string;
  reasoningEffort?: "low";
  maxOutputTokens?: number;
  failure?: string;
};

// This closed metric shape deliberately excludes facts, prompts, response text,
// headers, and provider error objects. Never log clinical payload content.
export function recordAssessmentProviderTiming(event: ProviderTimingEvent) {
  console.info("assessment_provider_timing", JSON.stringify(event));
}
