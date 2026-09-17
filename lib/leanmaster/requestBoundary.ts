import "server-only";
import type { AssessmentRequest, PhiFinding } from "@/types/assessment";
import {
  detectSafetyConflicts, scanAssessmentFacts, scanSerializedAssessmentRequest,
  scanSerializedOutboundPayload, validateAssessmentRequestShape
} from "@/lib/assessment";
import { LEANMASTER_STATIC_INSTRUCTIONS, clinicalDraftSchema } from "@/lib/leanmaster/staticInstructions";

// Capture the code-owned envelope once. Neither a request field nor a caller-
// supplied boolean/string can designate data as trusted. The schema is cloned
// from this immutable serialization rather than a shared mutable object.
const STATIC_ENVELOPE_JSON = JSON.stringify({
  instructions: LEANMASTER_STATIC_INSTRUCTIONS,
  reasoning: { effort: "low" }, store: false, stream: false,
  max_output_tokens: 3000,
  text: { format: { type: "json_schema", name: "psychosocial_clinical_draft", strict: true, schema: clinicalDraftSchema } }
});

function requestEnvelope(request: AssessmentRequest) {
  const envelope = JSON.parse(STATIC_ENVELOPE_JSON);
  // IDs are validated immutable fact tokens, never free-form participant data.
  // Constrain the provider at decoding time, and independently verify the same
  // exact schema below; nonexistent citations remain blocking on both sides.
  envelope.text.format.schema.properties.blocks.items.properties.sourceFactIds.items.enum = request.facts
    .filter((fact) => !["safety", "cognitive_screening"].includes(fact.domain)).map((fact) => fact.id);
  return envelope;
}

function failPrivacy(findings: PhiFinding[]) {
  if (findings.length) throw Object.assign(new Error("outbound_phi_blocked"), {
    findingKinds: [...new Set(findings.map((finding) => finding.kind))]
  });
}

export function assertReviewedAssessmentInput(request: AssessmentRequest) {
  if (validateAssessmentRequestShape(request).length) throw new Error("invalid_assessment_request");
  if (request.jurisdiction !== "NJ") throw new Error("unsupported_jurisdiction");
  // Preserve the review gate even for facts omitted from the provider projection.
  failPrivacy(scanAssessmentFacts(request.facts, request.reviewedAmbiguousFindings));
  failPrivacy(scanSerializedAssessmentRequest(request));
  if (detectSafetyConflicts(request.facts).length) throw new Error("unresolved_safety_conflict");
}

export function assertLeanMasterOutboundPrivacy(serialized: string, request: AssessmentRequest) {
  assertReviewedAssessmentInput(request);
  let body: Record<string, unknown>;
  let input: unknown;
  try {
    body = JSON.parse(serialized);
    if (!body || typeof body !== "object" || Array.isArray(body) || typeof body.input !== "string") throw new Error();
    input = JSON.parse(body.input);
  } catch { throw new Error("invalid_provider_envelope"); }
  const { input: _input, model, ...staticEnvelope } = body;
  // An extra field, altered instruction, or schema change is rejected, not
  // exempted. Trusted text is identified by exact code-owned position AND value.
  if (JSON.stringify(staticEnvelope) !== JSON.stringify(requestEnvelope(request)) || typeof model !== "string" || !/^[a-zA-Z0-9._-]{1,100}$/.test(model)) {
    throw new Error("untrusted_provider_envelope");
  }

  const scan = (value: string) => failPrivacy(scanSerializedOutboundPayload(value, request.facts, request.reviewedAmbiguousFindings));
  // Scan the actual dynamic payload recovered from the final serialized bytes,
  // not an earlier copy of the facts. Preserve the original scanner unchanged.
  scan(JSON.stringify({ model, input }));
  const visit = (value: unknown): void => {
    if (typeof value === "string") scan(value);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) { scan(key); visit(child); }
    }
  };
  // Decoded string scans also catch identifiers obscured by JSON escaping.
  // Nested properties named instructions/schema/trusted are still dynamic data.
  visit(input);
}

export function serializeLeanMasterProviderRequest(input: unknown, request: AssessmentRequest) {
  const serialized = JSON.stringify({
    ...requestEnvelope(request),
    model: process.env.OPENAI_MODEL || "gpt-5.5",
    input: JSON.stringify(input)
  });
  assertLeanMasterOutboundPrivacy(serialized, request);
  return serialized;
}
