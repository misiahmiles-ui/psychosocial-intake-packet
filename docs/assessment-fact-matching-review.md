# Local factual matching review — 2026-09-16

Scope: native AI-first generation with unchanged deterministic fallback. No deployment, billing-policy change, reviewer model, or additional architecture.

## Original reported findings

- `affirmed_changed_to_denied`: fact-003 answers interpreter needed `no`; fact-004 answers guardian/proxy `yes`. The rendered sentence correctly conveyed both. Sentence-wide negation incorrectly applied the interpreter denial to the guardian. Separate coordinated predicates now retain their own polarity; noun lists remain intact. Both reversed facts still fail regression tests.
- `source_attribution_changed`: fact-013 states `Short-term memory concerns reported by family.` The rendered `family-reported` phrase preserves the reporter. Active, passive, possessive and adjectival reporter forms are now matched. A changed participant reporter still fails.
- `unsupported_diagnosis`: fact-032 documents `Depression by history.` Fact-026 separately states `Family reports history of depression treated by PCP.` Historical diagnostic qualification is supported. Inconsistent stemming of diagnosis/diagnoses/diagnostic prevented matching. Canonical diagnostic tokens and condition-specific, timeframe-specific diagnosis evidence replace that mismatch. Symptoms cannot establish a diagnosis, and historical diagnosis cannot become current.
- `missing_source`: the original response's citation IDs were not retained, so the specific original invalid/missing citation cannot be established retrospectively. Missing/invalid IDs remain blocking. The provider schema now enumerates actual eligible supplied fact IDs, with exact-envelope privacy validation; generation instructions require exact source IDs. This is not a lexical paraphrase acceptance rule.

## One real local rerun

Provider response: 15,915 ms. Route: 15,981 ms. One external HTTP request; 15,902 input tokens and 1,253 output tokens, including zero reasoning tokens. This can incur provider charges despite zero owner/customer generation credits.

The response initially failed attribution and numeric checks and returned the unchanged fallback. Captured structured response and fictitious facts are retained only under ignored `tmp/fictitious-ai-review.json`, without credentials. Subsequent checks are offline; no further provider calls were made.

Offline attribution tracing identified shared `family` wording incorrectly associating the memory report with the medication/shopping sentence (facts 043/063), failure to recognize `family also reports`, and inappropriate reporter requirements on independently documented historical depression (fact-032). Matching now scopes reporter requirements to the finding, recognizes active reporting with an intervening `also`, and permits independently documented findings with matching state and timeframe. An explicitly changed reporter still fails.

The numeric finding was `rooms on one level`: fact-071 is an affirmative answer to that fixed question. Numeric support now includes fixed question context only for affirmative yes/true answers. Changed numbers, negative answers and unknown answers still fail.

After these matching corrections, the captured response still must be rejected: it introduces executive-function support needs from orientation, memory and task-assistance facts (012–014), without a documented executive-function finding. That clinical-domain assertion remains blocking. The generation contract now prohibits inference of unassessed clinical domains or transfer of severity between findings. The revised contract has not been sent for another paid generation; this is not an accepted AI assessment or a completion claim.

## Verification

68 bounded deterministic checks pass, including paraphrase acceptance, deliberately altered clinical facts, AI-first fallback, zero-credit failure/owner handling, rendering, editing and final export. Safeguards: 68 passed. Architecture: 55 passed. Owner entitlement: 8 passed. Typecheck passed. No fallback implementation or routing change was made in this review.
