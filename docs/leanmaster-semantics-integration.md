# Local semantics integration — production hold

Pinned source: LeanMaster `ef76ca0735ed841e82fa98eed48420724709468b`.
This integration is used by the local preview adapter only. No production route,
entitlement policy, pricing, Stripe, Maryland, or PDF path is changed.

## Actual production code reused

- `sourceFactLedger.ts` and `textNormalization.ts`: source segmentation, typed
  claim catalog, structured reference validation and proposition coverage.
- `noteorigin/grounding.ts`: source compatibility, review segments, clinical
  normalization, semantic coverage, structural issues, mapped proposition review
  and final reference verification.
- `sourceGrounding.ts`: source evidence, reporter identification/preservation,
  unsupported clinical concepts, diagnosis, relationship, quotation and service
  history checks.
- `safetyFactContract.ts`: exact state precedence, temporal classification,
  atomic safety extraction and contract comparison.
- `planProposition.ts`: prospective/completed actions, participant/professional
  actors and consequential commitment authorization.
- `assessmentPlanTraceability.ts`: actual assessment/plan validator, not just its
  prompt instructions.
- `noteorigin/sourceLedger.ts`: production source-fact projection with original
  spans. External selections/library/care-thread authority is excluded because
  this intake does not supply it.
- `generationSourceSnapshot.ts` and `sourceCanonicalization.ts`: canonical source
  snapshot support for the NoteOrigin source projection.

Full imported modules are checked against the pinned Git objects in
`scripts/leanmaster-port-check.mjs --verify-upstream <LeanMaster repo>`.
Changes inside those modules are import prefixes and explicit exports of existing
internal functions. NoteOrigin types omit unrelated commercial constants.
The source-ledger projection is the explicitly adapted module.

## Schema and stricter policy adapter

`lib/leanmaster/semantics.ts` is not a narrative renderer. It:

1. Keeps all upstream source segments and relationship entries, with immutable
   parent IDs and original UTF-16 spans, rather than keeping only `.facts[0]`.
   NoteOrigin contrast boundaries scope polarity within a source sentence.
2. Combines upstream reporter extractors and preserves explicit intake unknown,
   not-assessed and mapped timeframe states. Generic historical field headings
   do not override explicit current facts or current-medication mapping.
3. Reviews only the cited sources for each proposition. Valid IDs alone cannot
   authorize unrelated clinical text.
4. Uses the upstream factual coverage threshold of 0.7 for substantive plan
   segments too. It does not import LeanMaster's zero-coverage recommendation
   allowance or advisory acceptance policy.
5. Retains the intake-specific screening, diagnosis, authoritative safety and
   full visible-character provenance coverage restrictions.
6. Runs production traceability and NoteOrigin reference review. Contradictions,
   unsupported content and unresolved review findings block.

The legacy sentence-wide psychosocial prose validator is no longer called by
this port. It remains present only for the unchanged pre-existing production
contracts and their regression tests. No second-model reviewer is used.

Safety is still server-rendered from the authoritative reviewed intake. The
atomic safety contract additionally compares that source with its rendered
section. Every final authored/authoritative block still passes the output-PHI
scan. All dynamic provider bytes remain subject to the original outbound PHI
scanner and review gate; static instructions are matched to an immutable envelope.

## Verification

At integration: 36 port checks (including pinned-source identity), 68 PHI/safety
safeguards, 54 architecture, 59 synthesis, 5 deadline, 4 compact-provider,
1 telemetry, and 8 owner/credit checks passed (235 total). Typecheck and a local
production build passed. Unsupported fact and plan fixtures with legitimate
source IDs each rejected on 10/10 repetitions.

Local provider clinical acceptance is a separate requirement. Passing these
tests does not establish that the same fictitious case generates successfully.
No production deployment or production credit verification is claimed.

## Local provider outcome — not accepted

The latest unchanged fictitious intake returned a complete structured draft in
**21,374 ms** under the unchanged 42-second deadline. The full proposition
coverage check passed after the adapter required complete verbatim propositions
instead of disconnected micro-clauses. Validation still rejected the draft:

- `unsupported_statement`: 5
- `recommendation_not_separated_from_facts`: 3
- `plan_not_prospective`: 4

These are validator findings, not proof that every flagged statement is clinically
unsupported. No finding was waived. The separate diagnostic scan of all authored
output lines passed before the fictitious draft was displayed in the conversation.
The authoritative safety/screening sections were not assembled into an accepted
document because validation failed. Clinical acceptance remains incomplete.

Earlier attempts during this integration: 41,006 ms ended with a generic provider
error (the previous runner could not distinguish its exact category); 38,940 ms
returned a draft rejected for incomplete proposition coverage. Diagnostic errors
now use a fixed safe allowlist, with no credentials or raw provider errors printed.
No provider payload was written to disk, no deployment occurred, and this local
runner never invoked customer/owner credit mutation code.

Typed source adaptations are limited to validation context: question labels stay
bound to their answers, exact calculated `age: N` becomes LeanMaster's recognized
`aged N` evidence form, and historical status uses the production non-safety fact
classifier. Original values, spans, and generated prose remain unchanged. Mapped
propositions use their explicit sources, not NoteOrigin's fallback source-discovery
candidate pruning. Regression tests reject altered ages and reversed yes/no answers.

## Offline investigation after the rejected preview — still blocked

No additional provider request, deployment, credit mutation, or writing-prompt
change was made during this investigation.

Two adapter misuses of the production semantics were corrected:

- `not_prospective_plan` is a classification, not an upstream rejection rule.
  Imperative plan wording is no longer rejected solely for lacking a modal verb.
  Production completed-care, agreement, authorization and traceability checks
  are unchanged.
- `recommendation_not_separated_from_facts` is an advisory placement finding,
  excluded by production NoteOrigin's unit validator. It is no longer promoted
  to a clinical-support failure. Actual unsupported-content findings remain
  blocking. Tests accept documented recommendations and reject an invented
  intervention and a planned-to-performed care change.

The new legitimate-imperative regression still FAILS `unsupported_statement`.
This failure is deliberately retained, not reclassified as an expected success.
The added mandatory token-overlap gate is not a general semantic proof. For
example, the previous draft's supported age/language/residence/interpreter
sentence has only 0.429 token coverage even before incompatible-source filtering.
Its unrelated denial also excludes affirmative language/residence evidence.
Relationship matching similarly requires each cited source to contain every
relationship in a compound sentence, excluding otherwise relevant evidence.
`node scripts/leanmaster-port-check.mjs --audit-rejected-grounding` reproduces
these findings offline using only the existing fictitious fixture.

Removing this gate wholesale is not an acceptable remedy: production
`statusFromMappedPropositions` accepts mapped source IDs plus structural and
selected clinical checks; it does not prove arbitrary natural-language
entailment. The existing valid-ID/competitive-swimming regression demonstrates
why structured reference validation alone is insufficient for this app.
Neither reducing a percentage nor accepting all mapped prose addresses both
false rejection and unsupported-content prevention. The remaining blocker is
the strict source-proof contract for freely synthesized clinical prose, not
provider timing or the writing prompt.

Latest checks: typecheck passed; 68 safeguards, 54 architecture and 8 owner/credit
checks passed. Local port suite: 35 passed, 1 failed (the valid-imperative
regression above). These results do not establish clinical acceptance.
