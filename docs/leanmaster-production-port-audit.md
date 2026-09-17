# LeanMaster production port — pre-deployment hold

Status: both preflight blockers remain repaired. The subsequent pinned semantics integration and latest local provider result are documented in [leanmaster-semantics-integration.md](leanmaster-semantics-integration.md). Clinical acceptance remains incomplete: the latest full fictitious draft returned in 21.374 seconds but was rejected by semantic validation. The port is not enabled by a route or client. No PR, merge, or deployment has been made for this port. The preview wrote no provider payload to disk and did not copy the key out of `.env.local`. The historical audit and earlier provider result below are retained for traceability; they are not the latest integration status.

## Verified source

On 2026-09-16, GitHub's deployment record identified **ef76ca0735ed841e82fa98eed48420724709468b** as the latest deployed LeanMaster Production commit (September 14). It matches the fetched `main` head.

- Repository: https://github.com/misiahmiles-ui/leanmaster-note-engine
- Deployment record: https://github.com/misiahmiles-ui/leanmaster-note-engine/deployments
- Deployment URL in that record: https://leanmaster-note-engine-jr9ud7s58.vercel.app/
- The previously inspected local working tree was **5a3e636d6a64c808773064ff97598182baae5918**, not the current production implementation. Its files were not overwritten; the verified source was read from the fetched Git object.

## A. Exact active production path and adaptation

All paths and line references below refer to the pinned LeanMaster production commit, not the older local working tree.

| Responsibility | Active LeanMaster implementation | Port status |
| --- | --- | --- |
| Clinical narrative and professional wording | `src/server/prompts/ultimateIntegratedNoteEnginePrompt.ts`: `ultimateIntegratedNoteEnginePrompt`; `app/api/generate-note/route.ts:835`: `buildRuntimeInstructions()` | Full prompt copied; reusable static runtime rules extracted verbatim. Adapter replaces document schema and fixed identity/version metadata. |
| Assessment-to-plan clinical synthesis | `src/server/note/assessmentPlanTraceability.ts`: `assessmentPlanTraceabilityInstructions()` | Instruction function extracted unchanged, with its four documentation-type declarations localized. No advisory validation waiver imported. |
| Treatment-plan writing | `src/server/prompts/treatmentPlanPromptRules.ts`: `treatmentPlanPromptRules`; combined-plan branch of `buildRuntimeInstructions()` | Full rules module copied. Target document adapter requests 2–4 supported goal/intervention items instead of DAP plus a separate three-heading treatment-plan document. |
| Fact construction and allowed evidence | `src/server/note/sourceFactLedger.ts`: `buildSourceFactLedger()`, `buildAllowedClaimCatalog()`, `sourceFactLedgerPrompt()` | Full module copied; adapter maps existing reviewed fact IDs, original values, polarity, temporal status and source attribution. No library guidance or performed-care authority is created. |
| Provider request and typed output | `app/api/generate-note/route.ts:1270`: `callOpenAI()`; strict `leanmaster_provenance_note` schema at lines 1317–1377 | Schema extracted unchanged for the local preview. Existing app's low effort, `store:false`, and 42-second overall deadline retained in the preview runner. Not integrated into the production route. |
| Reference validation | `sourceFactLedger.ts`: `parseStructuredGeneratedNote()`, `validateStructuredGeneratedClaims()`, `validateStructuredPropositionCoverage()`; `planProposition.ts` action/authorization checks | Production modules copied and called. Existing psychosocial prose checks remain blocking, and exact span coverage rejects uncited trailing content. |
| Plan normalization | `src/server/note/structuredPlanNormalization.ts`: `normalizeStructuredPlanOutput()`; route line 2044 | Traced, **not imported**. The port must not silently normalize away unsupported content instead of blocking it. |
| Authoritative safety | `src/server/note/authoritativeSafetyFacts.ts`: `reconcileAuthoritativeSafetyFacts()`; route line 2127 | Traced. The psychosocial app retains its existing server-authoritative safety and screening construction instead. |
| Final section construction | `src/server/note/noteResult.ts`: `extractNoteSections()`, `composeClinicalNoteText()`, `createAuthoritativeClinicalDocument()`; route lines 2509 and 2545 | Section-extraction algorithm adapted to this app's headings. Model paragraphs are preserved, not rewritten. LeanMaster's export metadata/PDF machinery is not ported. |
| Regeneration | `components/engine/LeanMasterNoteEngine.tsx`: `generateNote()`; `lib/generationSourceSnapshot.ts`; route `callOpenAI()` and `buildUserInput()` | Current source inputs/snapshot establish each request; source changes invalidate output. One orphan-proposition regeneration is allowed upstream under the same deadline. Psychosocial regeneration and credit paths remain unchanged and are not yet wired to the port. |

Local copies are under `lib/leanmaster/`. Five complete modules were checked against the pinned Git source after only import-path and line-ending normalization. `psychosocialAdapter.ts` is a schema/source adapter, not a field-to-sentence writer. The abandoned `assessmentClinicalNarrative.ts` template renderer and its unshipped wiring were removed.

## Root causes and local repairs — no guard relaxed

### 1. Static production instructions were treated as participant data

`lib/assessment.ts:395`, `scanSerializedOutboundPayload()`, scans the complete serialized provider request using the same detector as participant content.

The initial candidate request produced **83 `person_name`** findings and **11 `record_identifier`** findings. Static upstream instructions include phrases such as `Treatment Plan`, `Clinical Library`, and `member denied`. The scanner treats those phrases as potentially identifying content. The fictitious reviewed fact set itself had zero PHI findings.

The root cause was a missing trust boundary, not defective participant-PHI detection. The local repair separates the code-owned production instructions from all dynamic participant data:

- `lib/leanmaster/staticInstructions.ts` constructs instructions and the field-context dictionary exclusively from checked-in constants. No participant values or ledger entries are interpolated into instructions.
- `lib/leanmaster/requestBoundary.ts` captures an immutable serialized static envelope. The final serialized request must match that envelope exactly, including instructions, schema, storage settings and generation configuration. Altered or additional envelope fields are rejected.
- All dynamic data remains in `input`. The final guard scans the dynamic payload recovered from the actual outbound bytes, including every decoded string and property name. Nested fields named `instructions`, `schema`, or `trusted` receive no exemption. JSON Unicode escapes cannot hide an identifier.
- The original reviewed request is also validated and scanned, including facts deliberately omitted from the model projection. The existing review decisions, hard-identifier blocks and safety-conflict checks remain mandatory.
- The local preview invokes the last-mile guard immediately before `fetch`. No PHI detector patterns or global approved-name lists were changed. The old blanket scanner still flags the static phrases; those same phrases in dynamic participant data still block.

### 2. Unbounded temporal matching misclassified the same fictitious source

`lib/assessment.ts`, `inferTemporalStatus()`, previously contained:

```ts
if (/history|historical|previous|prior|past|former|ever/.test(lower)) return "historical";
```

The unbounded `ever` alternative matches the substring in `several`. Consequently the fictitious `living-lives-with` source receives `temporalStatus: historical`. A present-tense rendition fails the retained validator with **one `historical_fact_made_current` finding**.

This was incorrect source metadata, not evidence that professional clinical prose is inherently incompatible with grounding. The local repair tokenizes camelCase field paths and Unicode-normalized prose, then requires complete-token boundaries for all temporal alternatives and phrases. Ordinary words such as `several`, `never`, `every`, `priorities`, and `unknown` no longer match fragments. Actual current/recent/historical terms still classify correctly. Explicit mapped timeframes retain priority, and polarity/source metadata and the grounding validator are unchanged.

### 3. Valid IDs are not sufficient semantic proof

A local adversarial test attached a legitimate living-arrangement source ID to an unrelated swimming assertion. LeanMaster's structured-ID validator accepted the reference structure. The retained psychosocial content validator rejected the unsupported text **10/10 times**. This is why its blocking checks cannot be replaced with the upstream advisory prose result.

## B. Actual full rendered provider output

**Available for clinical review, but rejected by validation.** With `OPENAI_API_KEY` read only from `.env.local`, the same fictitious case returned within the existing 42-second deadline. The final provider response took **32.013 seconds** and passed the separate local scan of all authored output lines. It failed the retained clinical validator with **four `unsupported_numeric`, three `unsupported_statement`, and one `plan_not_prospective`** findings. The four numeric findings are list markers `1)` through `4)`, which the prose validator currently treats as clinical numbers. The prospective-plan finding arises because its sentence splitter treats semicolon-separated continuation phrases as separate sentences. The unsupported-statement findings require clinical/source review; they were not waived. Authoritative safety and screening were not appended to the rejected draft.

An earlier provider response exposed a technical claim-binding mismatch: repeated source claim IDs across sections violated LeanMaster's exact one-proposition-per-claim contract. The adapter now creates distinct section-scoped copies of those references, preserving the model's clinical text and every source ID. The original LeanMaster validator and the app's stricter clinical checks remain blocking. This is covered by positive and adversarial regression tests; it does not establish that a future generated assessment will pass.

The hand-authored synthetic test fixture is not clinical acceptance evidence and is not presented as generated output. No production duration or live verification result is claimed.

## Verification performed

- New port checks: **22 passed, 0 failed**, including five full source-module identity comparisons against production `ef76ca0`, adversarial static/dynamic boundary checks, and repeated-claim binding cases.
- Existing synthesis checks: **59 passed**.
- PHI/assessment safeguards: **68 passed**, including four new temporal regression checks, adjacent-character preservation, `Correctly`, facility review, and exact full-date handling.
- Existing architecture checks: **54 passed**, including owner/credit boundaries and browser-local PDF behavior.
- Existing deadline checks: **5 passed**.
- Existing compact provider-draft checks: **4 passed**.
- Existing PHI-safe validation telemetry check: **1 passed**.
- Existing owner assessment entitlement checks: **8 passed**.
- Total: **221 checks passed, 0 failed** before the local provider preview. The intentionally unsupported valid-ID fixture was rejected on all **10/10** local repetitions. These checks do not override the failed provider-output validation above.
- Typecheck: passed.
- Local production build: passed (Next.js 15.5.20).
- PR/merge/deploy, repeated production generation and live credit verification: **not performed for this port**. Clinical-output acceptance has not occurred.

The live app remains on its previously deployed generation path. No pricing, Stripe, Supabase entitlement, Maryland, PDF, timeout-number, or second-model-reviewer changes were made.
