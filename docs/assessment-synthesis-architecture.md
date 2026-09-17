# NJ assessment synthesis

Historical design note. The active offline contract is documented in `assessment-verified-narrative.md`; the optional AI path now returns constrained, source-bound clinician-facing prose.

Reference: LeanMaster production revision `ef76ca0735ed841e82fa98eed48420724709468b`, confirmed in GitHub's Production deployment history. Read-only reference files: `sourceFactLedger.ts`, `assessmentPlanTraceability.ts`, `sourceGrounding.ts`, and the active `generate-note` route.

## Contract

- One low-effort provider selection of immutable source IDs for thematic paragraphs. The model does not emit clinical prose, duplicated propositions, or semantic axes in the active v4 contract.
- Three to five assessment paragraphs, short supported strengths/needs sections, and two to four prospective goal/intervention items.
- The server retains all reviewed facts. Human-readable field labels give yes/no answers their proper context. Evidence references must resolve; each source-ledger paragraph must match the exact deterministic rendering of its cited facts.
- Source polarity, unknown status, timing, attribution, clinical concepts, relationships, numbers, diagnostic and screening boundaries, and plan commitments cannot be changed by v4 provider text because none is accepted. Legacy prose contracts retain their blocking clinical checks. These deterministic checks are defense in depth, not a substitute for clinician review.
- Safety statements are rendered from reviewed safety facts. Screening counts and the non-diagnostic boundary are rendered deterministically from reviewed screening facts. The model cannot rewrite these into different clinical findings.
- Every dynamic output segment receives the existing output-PHI scan, including server-rendered source text. Static product headings are not treated as person names.
- The browser repeats the same validation and deterministic rendering. All state and final PDF remain browser-local. No additional clinical storage, background mode, or provider retention is introduced (`store:false`).

## Compatibility and execution

NJ clients use `X-Assessment-Format: synthesis-v4`. The v4 provider returns only source IDs grouped into 3–5 thematic assessment paragraphs. It cannot author clinical prose or plans. The server composes every paragraph from the reviewed source values and field labels and builds short strengths, needs, and prospective-plan sections only from documented priority fields. Exact deterministic re-rendering against the immutable fact ledger is mandatory on both server and browser. Missing, duplicate, safety/screening, or mismatched citations fail; no unsupported provider text can be accepted. Safety and screening remain separately server-rendered and output-PHI scanned. Older `synthesis-v1`, `synthesis-v2`, and `synthesis-v3` clients retain their compatible contracts; Maryland keeps the existing claims contract.

The deterministic v3 gates cover exact source IDs, clause-level source overlap, source context for short answers, polarity, unknown status, timing, attribution, relationships, numeric details, diagnostic and screening boundaries, safety boundaries, prospective-plan rules, and output-PHI scanning. Safety statements and screening summaries remain server-rendered from reviewed facts. A draft that fails these gates is never accepted. When meaningful time remains inside the same 42-second deadline, the provider may create one replacement draft; the replacement must pass the identical server gates. This is validation-aware redrafting, not an override or an acceptance retry.

The existing 42-second overall deadline, retry backoff, low effort, and failure categories remain. The v4 source-selection response is capped at 1,000 output tokens; older prose contracts retain their 3,000-token ceiling. A rejected selection is never automatically accepted; its bounded replacement must pass the same gates. A user-initiated retry still starts from the intake and PHI Review Gate. Unavailable-provider retries remain inside the same overall deadline.

Owner requests never reserve or settle credits. Customer settlement runs once, after all output gates; failed/aborted requests release their reservation. No entitlement, pricing, Stripe, Supabase schema, Maryland, or PDF policy changes.

The original defect was architectural: provider speed improved when repeated claim metadata was removed, but the old validator still treated source-value token overlap and first-citation semantic metadata as the narrative contract. Short form answers lacked field context; a screening disclaimer could also match a blanket diagnostic-word regex. This adaptation uses a small narrative contract with server evidence and authoritative safety/screening rendering, not exceptions for individual failed sentences.

Live v3 verification exposed a second scope mismatch in the deterministic ledger: a sentence containing both affirmed and denied clauses was checked as one polarity assertion, and relationship terms were looked up only in answer values even when the cited field label supplied the relationship context. The ledger now binds concept, polarity, timing, and relationship checks to each supported clause and its own cited evidence. Unsupported clauses remain blocking; a relationship from a different clause cannot authorize an uncited detail.

Repeated production checks showed that even clause-scoped lexical checks cannot reliably determine whether arbitrary model-authored prose preserves polarity, unknown status, and historical timing. The v4 contract therefore removes free-form clinical assertions from the provider output rather than adding case-specific exceptions to the validator. The provider still performs the clinically useful selection and organization of evidence, but source text, safety, screening, strengths, needs, and plan language are rendered deterministically. The exact source-ledger renderer is the provenance contract, and an intentionally unsupported text or citation fails instead of falling back to an accepted assessment.
