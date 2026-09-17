# Local bounded repair — not deployed

Historical design note. The active offline contract is documented in `assessment-verified-narrative.md`; the AI-first and source-selection paths described below are superseded.

The final bounded attempt uses a compact draft with hard factual checks instead
of the full LeanMaster/NoteOrigin provenance and plan-authority machinery.
Writing prompts remain pinned to LeanMaster ef76ca0. No overlap percentage,
second-model review, new dependency or new acceptance state was added.

After 43 local deterministic checks, typecheck and production build passed,
exactly one external provider request ran against the existing fictitious intake.
It returned a completed provider response but failed factual checks. The local
route took 17,650 ms. Owner customer credits consumed: 0. The external API call
can incur provider charges; zero customer credits does not mean a free API call.

## AI-first workflow with automatic fallback

AI-validator work stopped after the single test. Following the user's workflow
correction, the current NJ browser button requests `ai-first-v1` from the existing
`/api/assessment/generate` route. The route first attempts AI drafting and the
existing deterministic checks. Provider timeout/unavailability, incomplete or
invalid responses, output-PHI rejection and factual-validation rejection return
the deterministic fallback automatically. Explicit cancellation and privacy or
access failures remain blocking. No additional external provider test was run.
`lib/assessmentFallback.ts` builds predefined clinical sections from the reviewed
intake facts, preserving source values, negation, uncertainty, history, reporters
and quantities. Safety and screening use the existing authoritative rendering.
No model or separate factual-review system is called by this fallback.

The existing PHI Review Gate, input/output privacy scans, safety-conflict gate,
owner access and quota accounting remain in place. Successful customer AI
assessments settle one reservation. Failed attempts and deterministic fallbacks
release the reservation and consume zero AI-generation credits; owner generations
do not touch customer credits. The interface identifies rules-based fallback
drafts explicitly. The browser validates AI responses or reconstructs the same
deterministic text and rejects a mismatching response before display. Existing editing,
Accept Assessment, stale-source checks and browser-local final PDF export remain.
No new confirmation or acceptance state exists. Editable intake-only draft PDFs
are unchanged.

Legacy formats remain for compatibility. Earlier port/semantics audit documents
describe superseded experiments, not the current workflow. The bounded
test runner rejects `--provider-once` because that one authorized test is spent.

## Repeatable verification (no network)

- `node scripts/assessment-bounded-check.mjs`: hard-fact regressions, real route
  with external auth/credit/provider stubs, 10 repeated fallback results with
  zero provider requests, actual React component handlers and server render,
  editing, altered-response rejection, and actual final-PDF text inclusion.
- `node scripts/assessment-safeguards-check.mjs`
- `node scripts/assessment-architecture-check.mjs`
- `node scripts/assessment-deadline-check.mts`
- `node scripts/assessment-provider-draft-check.mjs`
- `node scripts/assessment-synthesis-check.mjs` (legacy contracts)
- `node scripts/assessment-validation-telemetry-check.mjs`
- `node scripts/owner-assessment-entitlement-check.mjs`
- `node node_modules/typescript/bin/tsc --noEmit`
- `node node_modules/next/dist/bin/next build`

No PR, merge, push or deployment was performed in this bounded attempt.

## Files changed in this bounded attempt

- `lib/assessmentFallback.ts`
- `app/api/assessment/generate/route.ts`
- `components/AssessmentWorkflow.tsx`
- `types/assessment.ts`
- `lib/assessmentValidationTelemetry.ts`
- `lib/leanmaster/psychosocialAdapter.ts`
- `lib/leanmaster/request.ts`
- `lib/leanmaster/requestBoundary.ts`
- `lib/leanmaster/staticInstructions.ts`
- `scripts/assessment-bounded-check.mjs`
- `scripts/assessment-architecture-check.mjs`
- `scripts/owner-assessment-entitlement-check.mjs`
- `docs/assessment-bounded-repair.md`

Pre-existing uncommitted port files and earlier safeguards/provider changes were
preserved. No pricing, Stripe, entitlement-policy, Maryland or PDF-design code
was changed in this bounded attempt.

Updated local results: 62 bounded route/component/export checks passed, including
AI-first success and automatic fallback for each simulated provider failure,
10 repeated fallback generations; 68 PHI/safeguards, 55 architecture, 5 deadline,
4 compact-provider, 59 legacy-synthesis, 1 telemetry and 8 owner-credit checks
passed. Typecheck and production build passed. These are local tests with
external auth/billing stubbed, not a production verification or deployment.
