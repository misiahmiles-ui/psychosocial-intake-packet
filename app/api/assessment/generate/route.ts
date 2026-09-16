import { NextResponse } from "next/server";

import {
  detectSafetyConflicts,
  renderAssessmentFromClaims,
  scanAssessmentFacts,
  scanGeneratedClaims,
  scanSerializedAssessmentRequest,
  validateAssessmentRequestShape,
  validateClaims
} from "@/lib/assessment";
import {
  authorizeAssessmentGeneration,
  requestIsSameOrigin
} from "@/lib/assessmentAccess";
import {
  AssessmentProviderError,
  generateAssessmentClaims
} from "@/lib/assessmentProvider";
import { recordAssessmentValidationFailure, recordAssessmentValidationSuccess } from "@/lib/assessmentValidationTelemetry";
import { authoritativeAssessmentBlocks, renderAssessmentSynthesis, scanAssessmentSynthesis, validateAssessmentSynthesis } from "@/lib/assessmentSynthesis";
import {
  completeAssessmentGeneration,
  releaseAssessmentGeneration,
  reserveAssessmentGeneration
} from "@/lib/assessmentUsage";
import type {
  AssessmentRequest,
  ValidatedAssessmentResponse
} from "@/types/assessment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 128 * 1024;
const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, max-age=0",
  Pragma: "no-cache",
  Vary: "Authorization, Origin",
  "X-Content-Type-Options": "nosniff"
};

export async function POST(request: Request) {
  const startedAt = performance.now();
  if (!requestIsSameOrigin(request)) {
    return failure("Cross-site requests are not allowed.", 403, "cross_site");
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return failure("The assessment request is too large.", 413, "request_too_large");
  }

  const access = await authorizeAssessmentGeneration(request);
  if (!access.authorized) {
    return failure(access.error, access.status, "access_denied");
  }

  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch {
    return failure("The assessment request could not be read.", 400, "invalid_request");
  }
  if (new TextEncoder().encode(bodyText).byteLength > MAX_REQUEST_BYTES) {
    return failure("The assessment request is too large.", 413, "request_too_large");
  }

  let candidate: unknown;
  try {
    candidate = JSON.parse(bodyText);
  } catch {
    return failure("The assessment request is invalid.", 400, "invalid_request");
  }

  const requestIssues = validateAssessmentRequestShape(candidate);
  if (requestIssues.length) {
    return failure("The assessment request is invalid.", 400, "invalid_request");
  }
  const assessmentRequest = candidate as AssessmentRequest;

  const factFindings = scanAssessmentFacts(
    assessmentRequest.facts,
    assessmentRequest.reviewedAmbiguousFindings
  );
  const serializedFindings = scanSerializedAssessmentRequest(assessmentRequest);
  if (factFindings.length || serializedFindings.length) {
    return failure(
      "Potential identifying information remains. Return to the PHI Review Gate.",
      422,
      "phi_blocked"
    );
  }

  const conflicts = detectSafetyConflicts(assessmentRequest.facts);
  if (conflicts.length) {
    return failure(
      "Critical safety information conflicts must be resolved locally before generation.",
      422,
      "safety_conflict"
    );
  }

  let reservationId: string | null = null;
  let completed = false;
  try {
    if (!access.isOwner) {
      const reservation = await reserveAssessmentGeneration(
        access.userId,
        access.entitlementActivation
      );
      if (!reservation.allowed || !reservation.reservationId) {
        const denial = reservationDenial(reservation.reason);
        return NextResponse.json(
          {
            error: denial.error,
            code: reservation.reason,
            usage: {
              entitlementExpiresAt: reservation.entitlementExpiresAt,
              entitlementStartsAt: reservation.entitlementStartsAt,
              includedQuantity: reservation.includedQuantity,
              remainingGenerations: reservation.remainingGenerations,
              successfulGenerationsUsed: reservation.successfulGenerationsUsed
            }
          },
          {
            status: denial.status,
            headers: {
              ...NO_STORE_HEADERS,
              ...(reservation.reason === "rapid_limit" ? { "Retry-After": "60" } : {})
            }
          }
        );
      }
      reservationId = reservation.reservationId;
    }

    const draft = await generateAssessmentClaims(
      assessmentRequest,
      request.signal,
      assessmentRequest.jurisdiction === "NJ" && ["synthesis-v1", "synthesis-v2"].includes(request.headers.get("X-Assessment-Format") ?? ""),
      assessmentRequest.jurisdiction === "NJ" && request.headers.get("X-Assessment-Format") === "synthesis-v2"
    );
    const synthesis = !Array.isArray(draft) ? draft : undefined;
    const claims = Array.isArray(draft) ? draft : [];
    const claimValidation = synthesis
      ? { ...validateAssessmentSynthesis(synthesis, assessmentRequest.facts), claims: [] }
      : validateClaims(claims, assessmentRequest.facts);
    if (!claimValidation.valid || (assessmentRequest.jurisdiction === "NJ" && request.headers.get("X-Assessment-Format") === "synthesis-v2" && !synthesis?.semanticReview)) {
      recordAssessmentValidationFailure(claimValidation.issues, synthesis?.blocks.length ?? claims.length);
      return failure(
        "The generated assessment did not pass source-grounding validation. No generation was charged.",
        502,
        "validation_failed"
      );
    }

    if (synthesis ? scanAssessmentSynthesis(synthesis, assessmentRequest.facts).length : scanGeneratedClaims(claimValidation.claims).length) {
      return failure(
        "The generated assessment did not pass the post-generation privacy scan. No generation was charged.",
        502,
        "output_phi_blocked"
      );
    }

    const assessmentText = synthesis ? renderAssessmentSynthesis(synthesis, assessmentRequest.facts) : renderAssessmentFromClaims(claimValidation.claims);
    if (!assessmentText) {
      return failure(
        "The generated assessment was incomplete. No generation was charged.",
        502,
        "validation_failed"
      );
    }

    if (request.signal.aborted) throw new AssessmentProviderError("aborted");
    const usage = access.isOwner
      ? null
      : await completeAssessmentGeneration(access.userId, reservationId as string);
    completed = true;
    recordAssessmentValidationSuccess(performance.now() - startedAt, access.isOwner, Boolean(synthesis), Boolean(synthesis?.semanticReview));
    const authoritative = authoritativeAssessmentBlocks(assessmentRequest.facts);
    const sourceFactsUsed = new Set(synthesis
      ? [...synthesis.blocks.flatMap((block) => block.sourceFactIds), ...authoritative.safety.flatMap((block) => block.sourceFactIds), ...(authoritative.screening?.sourceFactIds ?? [])]
      : claimValidation.claims.flatMap((claim) => claim.sourceFactIds)).size;
    const response: ValidatedAssessmentResponse = {
      assessmentText,
      claims: claimValidation.claims,
      ...(synthesis ? { synthesis } : {}),
      usage,
      validation: {
        criticalUnresolvedConflicts: 0,
        finalOutboundScan: "passed",
        outputPhiScan: "passed",
        preflightPhiScan: "passed",
        safetyPreserved: "passed",
        sourceFactsUsed,
        sourceGrounding: "passed",
        unsupportedDiagnosisDetected: false
      }
    };
    return NextResponse.json(response, {
      status: 200,
      headers: NO_STORE_HEADERS
    });
  } catch (error) {
    if (error instanceof AssessmentProviderError) {
      if (error.failure === "grounding_failed") {
        return failure("The generated assessment did not pass source-grounding validation. No generation was charged.", 502, "validation_failed");
      }
      if (error.failure === "output_phi_blocked") {
        return failure("The generated assessment did not pass the post-generation privacy scan. No generation was charged.", 502, "output_phi_blocked");
      }
      if (error.failure === "aborted") {
        return failure("Assessment generation was aborted. No generation was charged.", 499, "aborted");
      }
      if (error.failure === "timeout") {
        return failure("Assessment generation timed out. No generation was charged.", 504, "timeout");
      }
      if (error.failure === "configuration") {
        return failure("Assessment generation is not configured.", 503, "configuration");
      }
      if (error.failure === "privacy_blocked") {
        return failure("The final outbound privacy scan blocked generation. No generation was charged.", 422, "phi_blocked");
      }
      return failure("Assessment generation is temporarily unavailable. No generation was charged.", 502, error.failure);
    }
    return failure("Assessment generation is temporarily unavailable. No generation was charged.", 503, "unavailable");
  } finally {
    if (reservationId && !completed) {
      await releaseAssessmentGeneration(access.userId, reservationId).catch(() => undefined);
    }
  }
}

function reservationDenial(reason: string) {
  if (reason === "rapid_limit") {
    return {
      error: "Please wait before trying another assessment generation.",
      status: 429
    };
  }
  if (reason === "entitlement_exhausted") {
    return {
      error: "The included assessment-generation credits have been used.",
      status: 429
    };
  }
  if (reason === "entitlement_inactive") {
    return {
      error: "The assessment-generation entitlement window is not active.",
      status: 403
    };
  }
  return {
    error: "A qualifying Psychosocial purchase activation is required.",
    status: 403
  };
}

export function GET() {
  return failure("Method not allowed.", 405, "method_not_allowed", {
    Allow: "POST"
  });
}

function failure(
  error: string,
  status: number,
  code: string,
  headers: Record<string, string> = {}
) {
  return NextResponse.json(
    { error, code },
    { status, headers: { ...NO_STORE_HEADERS, ...headers } }
  );
}
