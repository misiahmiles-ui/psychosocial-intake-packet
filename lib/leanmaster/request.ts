import "server-only";
import type { AssessmentRequest } from "@/types/assessment";
import { assertReviewedAssessmentInput, serializeLeanMasterProviderRequest } from "@/lib/leanmaster/requestBoundary";

export function buildLeanMasterAssessmentRequest(request: AssessmentRequest) {
  assertReviewedAssessmentInput(request);
  const serialized = serializeLeanMasterProviderRequest({
    sourceFacts: request.facts.filter((fact) => !["safety", "cognitive_screening"].includes(fact.domain))
  }, request);
  return { serialized };
}
