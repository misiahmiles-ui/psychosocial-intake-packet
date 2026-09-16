"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Pencil,
  RotateCcw,
  ShieldAlert,
  WandSparkles,
  X
} from "lucide-react";

import {
  applyConflictResolutions,
  createAssessmentWorkspace,
  detectSafetyConflicts,
  findingToReviewDecision,
  renderAssessmentFromClaims,
  replaceFindingInFacts,
  scanAssessmentFacts,
  scanGeneratedClaims,
  scanSerializedAssessmentRequest,
  validateClaims
} from "@/lib/assessment";
import {
  INITIAL_ASSESSMENT_ENTITLEMENT_DETAIL,
  INITIAL_ASSESSMENT_ENTITLEMENT_LABEL,
  RECURRING_ASSESSMENT_ENTITLEMENT_LABEL
} from "@/lib/assessmentEntitlementPolicy";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { renderAssessmentSynthesis, scanAssessmentSynthesis, validateAssessmentSynthesis } from "@/lib/assessmentSynthesis";
import type {
  AcceptedAssessment,
  AssessmentClaim,
  AssessmentFact,
  AssessmentRequest,
  LocalFactLabel,
  ReviewedAmbiguousFinding,
  SafetyConflict,
  ValidatedAssessmentResponse
} from "@/types/assessment";
import type { IntakePacket, PsychosocialJurisdiction } from "@/types/intake";

type WorkflowStage = "idle" | "local-review" | "generating" | "review";

type AssessmentWorkflowProps = {
  acceptedAssessment: AcceptedAssessment | null;
  currentRevisionToken: string;
  jurisdiction: PsychosocialJurisdiction;
  onAccept: (assessment: AcceptedAssessment) => void;
  onReturnToIntake: () => void;
  packet: IntakePacket;
  developmentPreview?: "success" | "failure";
};

export function AssessmentWorkflow({
  acceptedAssessment,
  currentRevisionToken,
  jurisdiction,
  onAccept,
  onReturnToIntake,
  packet,
  developmentPreview
}: AssessmentWorkflowProps) {
  const [stage, setStage] = useState<WorkflowStage>("idle");
  const [facts, setFacts] = useState<AssessmentFact[]>([]);
  const [labels, setLabels] = useState<Record<string, LocalFactLabel>>({});
  const [reviewed, setReviewed] = useState<ReviewedAmbiguousFinding[]>([]);
  const [conflictChoices, setConflictChoices] = useState<Record<string, string>>({});
  const [replacements, setReplacements] = useState<Record<string, string>>({});
  const [generatedRevision, setGeneratedRevision] = useState("");
  const [workspaceRevision, setWorkspaceRevision] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [workingText, setWorkingText] = useState("");
  const [validation, setValidation] = useState<ValidatedAssessmentResponse["validation"] | null>(null);
  const [usage, setUsage] = useState<ValidatedAssessmentResponse["usage"] | null>(null);
  const [message, setMessage] = useState("");
  const abortController = useRef<AbortController | null>(null);

  const findings = useMemo(
    () => scanAssessmentFacts(facts, reviewed),
    [facts, reviewed]
  );
  const conflicts = useMemo(() => detectSafetyConflicts(facts), [facts]);
  const unresolvedConflicts = conflicts.filter(
    (conflict) => !conflict.factIds.includes(conflictChoices[conflict.id])
  );
  const stale = Boolean(generatedRevision && generatedRevision !== currentRevisionToken);
  const workspaceIsStale = Boolean(
    workspaceRevision && workspaceRevision !== currentRevisionToken
  );
  const acceptedIsStale = Boolean(
    acceptedAssessment && acceptedAssessment.localRevisionToken !== currentRevisionToken
  );
  const clinicianEdited = workingText.trim() !== generatedText.trim();

  function beginLocalReview() {
    const workspace = createAssessmentWorkspace(packet, jurisdiction);
    setFacts(workspace.facts);
    setLabels(workspace.labels);
    setReviewed([]);
    setConflictChoices({});
    setReplacements({});
    setWorkspaceRevision(workspace.localRevisionToken);
    setMessage("");
    setStage("local-review");
  }

  function replaceFinding(reviewKey: string, replacement: string) {
    const finding = findings.find((item) => item.reviewKey === reviewKey);
    if (!finding) return;
    setFacts((current) => replaceFindingInFacts(current, finding, replacement));
    setReviewed([]);
    setConflictChoices({});
    setReplacements((current) => ({ ...current, [reviewKey]: "" }));
  }

  function approveAmbiguousFinding(reviewKey: string) {
    const finding = findings.find((item) => item.reviewKey === reviewKey);
    if (!finding) return;
    const decision = findingToReviewDecision(finding);
    if (decision) setReviewed((current) => [...current, decision]);
  }

  async function generate() {
    setMessage("");
    if (!facts.length) {
      setMessage("Enter clinical intake information before generating an assessment.");
      return;
    }
    if (workspaceIsStale) {
      setMessage("Assessment-source intake fields changed. Refresh the privacy review from the current intake before generation.");
      return;
    }
    if (findings.length) {
      setMessage("Resolve every item in the PHI Review Gate before transmission.");
      return;
    }
    if (unresolvedConflicts.length) {
      setMessage("Resolve every critical safety conflict before transmission.");
      return;
    }

    const outboundFacts = applyConflictResolutions(facts, conflicts, conflictChoices);
    const requestBody: AssessmentRequest = {
      facts: outboundFacts,
      jurisdiction,
      reviewedAmbiguousFindings: reviewed,
      version: 1
    };
    if (
      scanAssessmentFacts(outboundFacts, reviewed).length ||
      scanSerializedAssessmentRequest(requestBody).length
    ) {
      setMessage("The final outbound privacy scan found identifying information. Review the de-identified facts again.");
      return;
    }

    const controller = new AbortController();
    abortController.current = controller;
    setStage("generating");
    try {
      if (process.env.NODE_ENV !== "production" && developmentPreview) {
        await new Promise((resolve) => window.setTimeout(resolve, 900));
        if (developmentPreview === "failure") {
          throw new Error("Previewed generation failure. The intake remains available and no generation is consumed.");
        }
        const previewClaims = createDevelopmentClaims(outboundFacts);
        const checked = validateClaims(previewClaims, outboundFacts);
        const rendered = renderAssessmentFromClaims(checked.claims);
        if (!checked.valid || !rendered) {
          throw new Error("The development preview fixture failed validation.");
        }
        setGeneratedText(rendered);
        setWorkingText(rendered);
        setGeneratedRevision(workspaceRevision);
        setValidation({
          criticalUnresolvedConflicts: 0,
          finalOutboundScan: "passed",
          outputPhiScan: "passed",
          preflightPhiScan: "passed",
          safetyPreserved: "passed",
          sourceFactsUsed: new Set(previewClaims.flatMap((item) => item.sourceFactIds)).size,
          sourceGrounding: "passed",
          unsupportedDiagnosisDetected: false
        });
        setUsage(null);
        setStage("review");
        return;
      }
      const {
        data: { session }
      } = await createSupabaseBrowserClient().auth.getSession();
      if (!session?.access_token) throw new Error("Please sign in again before generating an assessment.");

      const response = await fetch("/api/assessment/generate", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          ...(jurisdiction === "NJ" ? { "X-Assessment-Format": "synthesis-v4" } : {}),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(readSafeGenerationError(response.status, result));
      }
      if (!isValidatedResponse(result)) {
        throw new Error("The assessment response was incomplete and was not accepted.");
      }

      const checked = result.synthesis && jurisdiction === "NJ"
        ? { ...validateAssessmentSynthesis(result.synthesis, outboundFacts), claims: [] }
        : validateClaims(result.claims, outboundFacts);
      const rendered = result.synthesis && jurisdiction === "NJ"
        ? renderAssessmentSynthesis(result.synthesis, outboundFacts)
        : renderAssessmentFromClaims(checked.claims);
      if (
        !checked.valid ||
        (result.synthesis ? scanAssessmentSynthesis(result.synthesis, outboundFacts).length : scanGeneratedClaims(checked.claims).length) ||
        !rendered ||
        rendered !== result.assessmentText
      ) {
        throw new Error("The assessment response failed local validation and was not accepted.");
      }

      setGeneratedText(rendered);
      setWorkingText(rendered);
      setGeneratedRevision(workspaceRevision);
      setValidation(result.validation);
      setUsage(result.usage);
      setStage("review");
    } catch (error) {
      setMessage(
        error instanceof DOMException && error.name === "AbortError"
          ? "Generation was canceled. The attempt does not consume a generation."
          : error instanceof Error
            ? error.message
            : "Assessment generation could not be completed."
      );
      setStage("local-review");
    } finally {
      abortController.current = null;
    }
  }

  function acceptAssessment() {
    const text = workingText.trim();
    if (!text || !validation || stale) return;
    onAccept({
      assessmentText: text,
      clinicianEdited,
      generatedText,
      localRevisionToken: generatedRevision,
      validation
    });
    setMessage("Assessment accepted for local review, print, and final PDF export.");
  }

  return (
    <section className="no-print rounded-lg border border-[#b9d9d1] bg-white p-5 shadow-sm sm:p-6" aria-labelledby="assessment-workflow-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-clay">Optional AI-assisted draft</p>
          <h2 id="assessment-workflow-title" className="mt-2 text-2xl font-bold text-ink">Psychosocial Assessment</h2>
          <p className="mt-2 max-w-3xl leading-7 text-[#52645f]">
            The browser first creates a temporary de-identified fact set. Only that fact set may be sent for generation after local privacy and safety review. The original intake remains in this tab and is never sent.
          </p>
        </div>
        {usage ? (
          <div className="rounded-lg border border-[#cde7df] bg-mint px-4 py-3 text-sm font-semibold text-[#334642]">
            {usage.successfulGenerationsUsed} of {usage.includedQuantity} successful generations used · {usage.remainingGenerations} remaining · entitlement window ends {formatEntitlementEnd(usage.entitlementExpiresAt)}
          </div>
        ) : null}
      </div>

      {acceptedIsStale ? (
        <Notice tone="warning">The accepted assessment is stale because assessment-source intake fields changed. It will not be added to the final PDF until a current assessment is generated and accepted.</Notice>
      ) : null}
      {message ? <Notice tone={message.includes("accepted") ? "success" : "warning"}>{message}</Notice> : null}

      {stage === "idle" ? (
        <div className="mt-5">
          <button type="button" onClick={beginLocalReview} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-sea px-4 py-2 font-bold text-white transition hover:bg-[#0b615b]">
            <WandSparkles className="h-4 w-4" aria-hidden="true" />
            Generate Psychosocial Assessment
          </button>
          <p className="mt-3 text-sm leading-6 text-[#52645f]">{INITIAL_ASSESSMENT_ENTITLEMENT_LABEL}. {INITIAL_ASSESSMENT_ENTITLEMENT_DETAIL} Afterward, {RECURRING_ASSESSMENT_ENTITLEMENT_LABEL}. Only a successful, validated assessment counts.</p>
        </div>
      ) : null}

      {stage === "local-review" ? (
        <div className="mt-6 grid gap-5">
          {workspaceIsStale ? <Notice tone="warning">Assessment-source intake fields changed after this temporary fact set was created. Refresh before transmitting anything.</Notice> : null}
          <PrivacyGate
            facts={facts}
            findings={findings}
            labels={labels}
            replacements={replacements}
            onApprove={approveAmbiguousFinding}
            onRemove={(reviewKey) => replaceFinding(reviewKey, "")}
            onReplace={replaceFinding}
            onReplacementChange={(reviewKey, value) => setReplacements((current) => ({ ...current, [reviewKey]: value }))}
          />
          <SafetyConflictGate
            choices={conflictChoices}
            conflicts={conflicts}
            facts={facts}
            labels={labels}
            onChoose={(conflictId, factId) => setConflictChoices((current) => ({ ...current, [conflictId]: factId }))}
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={generate} disabled={Boolean(workspaceIsStale || findings.length || unresolvedConflicts.length || !facts.length)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-sea px-4 py-2 font-bold text-white transition hover:bg-[#0b615b] disabled:cursor-not-allowed disabled:opacity-50">
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              Privacy Review Complete — Generate
            </button>
            {workspaceIsStale ? <button type="button" onClick={beginLocalReview} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#b9c7c3] bg-white px-4 py-2 font-bold text-ink hover:border-sea"><RotateCcw className="h-4 w-4" aria-hidden="true" /> Refresh Privacy Review from Current Intake</button> : null}
            <button type="button" onClick={onReturnToIntake} className="inline-flex min-h-11 items-center rounded-lg border border-[#b9c7c3] px-4 py-2 font-bold text-ink hover:border-sea">Return to Intake</button>
          </div>
        </div>
      ) : null}

      {stage === "generating" ? (
        <div className="mt-6 rounded-lg border border-[#cde7df] bg-mint p-5" role="status">
          <p className="font-bold text-sea">Generating and validating the assessment…</p>
          <p className="mt-2 text-sm leading-6 text-[#334642]">The result will be rejected unless every claim is source-grounded and the post-generation privacy scan passes.</p>
          <button type="button" onClick={() => abortController.current?.abort()} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#b9c7c3] bg-white px-4 py-2 font-bold text-ink">
            <X className="h-4 w-4" aria-hidden="true" /> Cancel generation
          </button>
        </div>
      ) : null}

      {stage === "review" ? (
        <div className="mt-6 grid gap-5">
          {stale ? <Notice tone="warning">Assessment-source intake fields changed after generation. Regenerate from the current intake before accepting.</Notice> : null}
          <div className="rounded-lg border border-[#d7dfdc] bg-[#fbfcfb] p-4">
            <div className="flex items-center gap-2 font-bold text-ink"><Pencil className="h-4 w-4" aria-hidden="true" /> Clinician review and edit</div>
            <label htmlFor="assessment-review-text" className="mt-3 block text-sm font-bold text-[#40524e]">Assessment draft</label>
            <textarea id="assessment-review-text" value={workingText} onChange={(event) => setWorkingText(event.target.value)} rows={20} className="mt-2 w-full rounded-lg border border-[#9eafaa] bg-white px-3 py-3 leading-7 text-ink outline-none focus:border-sea focus:ring-2 focus:ring-[#b9ddd5]" />
            <p className="mt-2 text-sm text-[#52645f]">{clinicianEdited ? "Contains clinician-authored edits. Automated claim validation applies to the generated draft; review all edits clinically before accepting." : "No clinician edits yet."}</p>
          </div>
          {validation ? (
            <div className="rounded-lg border border-[#cde7df] bg-mint p-4 text-sm text-[#334642]">
              <p className="flex items-center gap-2 font-bold text-sea"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Generated draft validation passed</p>
              <p className="mt-2 leading-6">Preflight and final outbound PHI scans passed; post-output PHI scan passed; {validation.sourceFactsUsed} source facts were cited; no unsupported diagnosis or unresolved critical safety conflict was accepted.</p>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={acceptAssessment} disabled={stale || !workingText.trim()} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-sea px-4 py-2 font-bold text-white transition hover:bg-[#0b615b] disabled:cursor-not-allowed disabled:opacity-50"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Accept Assessment</button>
            <button type="button" onClick={beginLocalReview} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#b9c7c3] bg-white px-4 py-2 font-bold text-ink hover:border-sea"><RotateCcw className="h-4 w-4" aria-hidden="true" /> {stale ? "Regenerate Using Updated Intake" : "Regenerate Assessment"}</button>
            <button type="button" onClick={onReturnToIntake} className="inline-flex min-h-11 items-center rounded-lg border border-[#b9c7c3] px-4 py-2 font-bold text-ink hover:border-sea">Return to Intake</button>
          </div>
          <p className="text-sm leading-6 text-[#52645f]">Regeneration starts again from the current intake only, never from this assessment text or clinician edits. Each successful regenerated and validated assessment counts as another generation.</p>
        </div>
      ) : null}
    </section>
  );
}

function createDevelopmentClaims(facts: AssessmentFact[]): AssessmentClaim[] {
  return facts.slice(0, 18).map((source, index) => ({
    id: `claim-${index + 1}`,
    section:
      source.sourceField.includes("strengths-coping")
        ? "strengths_protective"
        : source.domain === "safety"
          ? "safety"
          : source.domain === "goals_services" || source.domain === "discharge_planning"
            ? index % 2
              ? "program_focus"
              : "goals_barriers"
            : source.domain === "participant_context"
              ? "participant_context"
              : source.domain === "living_support" || source.domain === "home_environment"
                ? "living_support"
                : source.domain === "functional" || source.domain === "cognitive_screening"
                  ? "functional_cognitive"
                  : source.domain === "communication"
                    ? "communication_sensory"
                    : source.domain === "medical" || source.domain === "nutrition_health"
                      ? "medical_psychiatric"
                      : "psychosocial_behavioral",
    text: source.normalizedValue,
    sourceFactIds: [source.id],
    polarity: source.semantics.polarity,
    temporalStatus: source.temporalStatus,
    sourceType: source.sourceType,
    diagnosisStatus: source.semantics.diagnosisStatus,
    relationshipStatus: source.semantics.relationshipStatus,
    riskStatus: source.semantics.riskStatus,
    functionalStatus: source.semantics.functionalStatus,
    substanceUseStatus: source.semantics.substanceUseStatus,
    caregiverInvolvement: source.semantics.caregiverInvolvement,
    serviceNeed: source.semantics.serviceNeed
  }));
}

function PrivacyGate({
  facts,
  findings,
  labels,
  replacements,
  onApprove,
  onRemove,
  onReplace,
  onReplacementChange
}: {
  facts: AssessmentFact[];
  findings: ReturnType<typeof scanAssessmentFacts>;
  labels: Record<string, LocalFactLabel>;
  replacements: Record<string, string>;
  onApprove: (reviewKey: string) => void;
  onRemove: (reviewKey: string) => void;
  onReplace: (reviewKey: string, replacement: string) => void;
  onReplacementChange: (reviewKey: string, value: string) => void;
}) {
  const factMap = new Map(facts.map((fact) => [fact.id, fact]));
  return (
    <section className="rounded-lg border border-[#d7dfdc] p-4" aria-labelledby="phi-review-title">
      <h3 id="phi-review-title" className="flex items-center gap-2 text-lg font-bold text-ink"><ShieldAlert className="h-5 w-5 text-clay" aria-hidden="true" /> PHI Review Gate</h3>
      <p className="mt-2 text-sm leading-6 text-[#52645f]">Hard identifiers must be removed or replaced. A possible person name can be marked “Not PHI” only after local human review. These values and snippets remain in this browser.</p>
      {!findings.length ? (
        <p className="mt-4 rounded-lg border border-[#cde7df] bg-mint p-3 font-semibold text-sea">No unresolved PHI findings in the temporary fact set.</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {findings.map((finding) => {
            const label = labels[finding.factId];
            const fact = factMap.get(finding.factId);
            return (
              <article key={finding.reviewKey} className="rounded-lg border border-[#e7c5b9] bg-[#fff8f5] p-4">
                <p className="font-bold text-clay">{finding.severity === "hard_block" ? "Hard identifier" : "Possible person name"}: {finding.kind.replaceAll("_", " ")}</p>
                <p className="mt-1 text-sm font-semibold text-[#40524e]">{label ? `${label.stepTitle} — ${label.fieldLabel}` : finding.factId}</p>
                <p className="mt-2 break-words rounded bg-white p-2 text-sm text-ink">Detected: {finding.detectedText}</p>
                <p className="mt-2 break-words text-sm text-[#52645f]">Context: {finding.snippet || fact?.normalizedValue}</p>
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <label className="min-w-[15rem] flex-1 text-sm font-bold text-[#40524e]">Safe replacement
                    <input value={replacements[finding.reviewKey] ?? ""} onChange={(event) => onReplacementChange(finding.reviewKey, event.target.value)} className="mt-1 block min-h-11 w-full rounded-lg border border-[#9eafaa] bg-white px-3 py-2 font-normal text-ink" />
                  </label>
                  <button type="button" onClick={() => onReplace(finding.reviewKey, replacements[finding.reviewKey] ?? "")} disabled={!(replacements[finding.reviewKey] ?? "").trim()} className="min-h-11 rounded-lg border border-[#b9c7c3] bg-white px-3 py-2 font-bold text-ink disabled:opacity-50">Replace</button>
                  <button type="button" onClick={() => onRemove(finding.reviewKey)} className="min-h-11 rounded-lg border border-[#e7c5b9] bg-white px-3 py-2 font-bold text-clay">Remove</button>
                  {finding.severity === "ambiguous" ? <button type="button" onClick={() => onApprove(finding.reviewKey)} className="min-h-11 rounded-lg border border-[#b9c7c3] bg-white px-3 py-2 font-bold text-ink">Mark as Not PHI</button> : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SafetyConflictGate({ choices, conflicts, facts, labels, onChoose }: {
  choices: Record<string, string>;
  conflicts: SafetyConflict[];
  facts: AssessmentFact[];
  labels: Record<string, LocalFactLabel>;
  onChoose: (conflictId: string, factId: string) => void;
}) {
  if (!conflicts.length) return null;
  const factMap = new Map(facts.map((fact) => [fact.id, fact]));
  return (
    <section className="rounded-lg border border-[#e7c5b9] bg-[#fff8f5] p-4" aria-labelledby="safety-conflicts-title">
      <h3 id="safety-conflicts-title" className="flex items-center gap-2 text-lg font-bold text-clay"><AlertTriangle className="h-5 w-5" aria-hidden="true" /> Resolve critical safety conflicts locally</h3>
      <p className="mt-2 text-sm leading-6 text-[#643524]">Select the accurate source statement for each topic. Conflicting alternatives are removed only from the temporary outbound fact set; the original intake is unchanged.</p>
      <div className="mt-4 grid gap-4">
        {conflicts.map((conflict) => (
          <fieldset key={conflict.id} className="rounded-lg border border-[#e7c5b9] bg-white p-3">
            <legend className="px-1 font-bold text-ink">{conflict.topic}</legend>
            <div className="mt-2 grid gap-2">
              {conflict.factIds.map((factId) => {
                const fact = factMap.get(factId);
                if (!fact) return null;
                const label = labels[factId];
                return <label key={factId} className="flex min-h-11 cursor-pointer gap-3 rounded-lg border border-[#d7dfdc] p-3 text-sm"><input type="radio" name={conflict.id} value={factId} checked={choices[conflict.id] === factId} onChange={() => onChoose(conflict.id, factId)} className="mt-1 h-4 w-4" /><span><strong>{label?.fieldLabel ?? factId}:</strong> {fact.normalizedValue}</span></label>;
              })}
            </div>
          </fieldset>
        ))}
      </div>
    </section>
  );
}

function Notice({ children, tone }: { children: React.ReactNode; tone: "success" | "warning" }) {
  return <p className={`mt-4 rounded-lg border p-3 text-sm font-semibold leading-6 ${tone === "success" ? "border-[#cde7df] bg-mint text-sea" : "border-[#e7c5b9] bg-[#fff8f5] text-[#643524]"}`}>{children}</p>;
}

function readSafeGenerationError(status: number, value: unknown) {
  if (value && typeof value === "object" && "error" in value && typeof value.error === "string") {
    return value.error;
  }
  if (status === 504) {
    return "Assessment generation timed out before a validated response was received. No generation was charged.";
  }
  if (status === 502 || status === 503) {
    return "Assessment generation is temporarily unavailable. No generation was charged.";
  }
  if (status === 429) {
    return "Assessment generation is temporarily limited. Please wait before trying again.";
  }
  return "Assessment generation could not be completed.";
}

function isValidatedResponse(value: unknown): value is ValidatedAssessmentResponse {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<ValidatedAssessmentResponse>;
  const usage = result.usage;
  return Boolean(
    Array.isArray(result.claims) &&
    typeof result.assessmentText === "string" &&
    result.validation &&
    (usage === null || isAssessmentUsage(usage))
  );
}

function isAssessmentUsage(
  value: unknown
): value is NonNullable<ValidatedAssessmentResponse["usage"]> {
  if (!value || typeof value !== "object") return false;
  const usage = value as Record<string, unknown>;
  return (
    Number.isInteger(usage.includedQuantity) &&
    Number.isInteger(usage.successfulGenerationsUsed) &&
    Number.isInteger(usage.remainingGenerations) &&
    typeof usage.entitlementStartsAt === "string" &&
    typeof usage.entitlementExpiresAt === "string"
  );
}

function formatEntitlementEnd(value: string) {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return "at the recorded expiration time";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(timestamp);
}
