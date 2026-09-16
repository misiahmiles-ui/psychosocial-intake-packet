# NJ assessment synthesis

Reference: LeanMaster production revision `ef76ca0735ed841e82fa98eed48420724709468b`, confirmed in GitHub's Production deployment history. Read-only reference files: `sourceFactLedger.ts`, `assessmentPlanTraceability.ts`, `sourceGrounding.ts`, and the active `generate-note` route.

## Contract

- One low-effort provider draft; prose is emitted once, with immutable source IDs directly on each paragraph or proposed plan item. No parallel narrative, duplicated propositions, or model-generated semantic axes.
- Three to five assessment paragraphs, short supported strengths/needs sections, and two to four prospective goal/intervention items.
- The server retains all reviewed facts. Human-readable field labels give yes/no answers their proper context. Evidence references must resolve; each sentence is checked, not merely an entire multi-sentence paragraph.
- Source polarity, unknown status, timing, attribution, clinical concepts, relationships, numbers, diagnostic and screening boundaries, and plan commitments are blocking checks. The legacy lexical threshold is not reduced; field context is now included. These deterministic checks are defense in depth, not a substitute for clinician review.
- Safety statements are rendered from reviewed safety facts. Screening counts and the non-diagnostic boundary are rendered deterministically from reviewed screening facts. The model cannot rewrite these into different clinical findings.
- Every dynamic output segment receives the existing output-PHI scan, including server-rendered source text. Static product headings are not treated as person names.
- The browser repeats the same validation and deterministic rendering. All state and final PDF remain browser-local. No additional clinical storage, background mode, or provider retention is introduced (`store:false`).

## Compatibility and execution

Only NJ clients opting in with `X-Assessment-Format: synthesis-v1` receive this response. Existing browser bundles and Maryland keep the existing claims contract; an old browser must not incur a successful-generation charge for a response it cannot parse.

The existing 42-second overall deadline, retry backoff, low effort, 3,000-token ceiling and failure categories remain. Validation failure is not automatically regenerated into acceptance. A user retry starts from the intake and PHI Review Gate. Unavailable-provider retries remain inside the same overall deadline.

Owner requests never reserve or settle credits. Customer settlement runs once, after all output gates; failed/aborted requests release their reservation. No entitlement, pricing, Stripe, Supabase schema, Maryland, or PDF policy changes.

The original defect was architectural: provider speed improved when repeated claim metadata was removed, but the old validator still treated source-value token overlap and first-citation semantic metadata as the narrative contract. Short form answers lacked field context; a screening disclaimer could also match a blanket diagnostic-word regex. This adaptation uses a small narrative contract with server evidence and authoritative safety/screening rendering, not exceptions for individual failed sentences.
