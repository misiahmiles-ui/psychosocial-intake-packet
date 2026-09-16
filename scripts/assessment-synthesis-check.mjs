import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = resolve(import.meta.dirname, "..");
const cache = new Map();
function load(path, overrides = {}) {
  if (!Object.keys(overrides).length && cache.has(path)) return cache.get(path);
  const module = { exports: {} };
  const js = ts.transpileModule(readFileSync(resolve(root, path), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function("require", "module", "exports", js)((id) => {
    if (id in overrides) return overrides[id];
    if (id === "server-only") return {};
    if (id.startsWith("@/")) return load(`${id.slice(2)}.ts`);
    if (id.startsWith("./")) return load(`${path.slice(0, path.lastIndexOf("/") + 1)}${id.slice(2)}.ts`);
    return require(id);
  }, module, module.exports);
  if (!Object.keys(overrides).length) cache.set(path, module.exports);
  return module.exports;
}
const synth = load("lib/assessmentSynthesis.ts");
const assessment = load("lib/assessment.ts");
const semantics = { polarity: "affirmed", diagnosisStatus: "not_applicable", relationshipStatus: "not_applicable", riskStatus: "not_applicable", functionalStatus: "not_applicable", substanceUseStatus: "not_applicable", caregiverInvolvement: "not_applicable", serviceNeed: "not_applicable" };
const fact = (id, sourceField, normalizedValue, extra = {}) => ({ id: `fact-${String(id).padStart(3, "0")}`, sourceField, normalizedValue, sourceStep: "test", sourceType: "form_response", temporalStatus: "current", domain: "psychosocial", semantics: { ...semantics }, ...extra });
const facts = [
  fact(1, "living-current-residence", "Lives alone in an apartment."),
  fact(2, "psychosocial-strengths-coping", "Enjoys music and structured activities."),
  fact(3, "goals-participant-family-goals", "Improve socialization and maintain routine.", { domain: "goals_services" }),
  fact(4, "identifying-interpreter-needed", "No", { domain: "communication", semantics: { ...semantics, polarity: "denied" } }),
  fact(5, "safety-harm-risk", "No current risk of harm to self or others reported.", { domain: "safety", semantics: { ...semantics, polarity: "denied", riskStatus: "denied" } }),
  fact(6, "screening-item-1", "response: correct; notes: Correctly identified the program setting.", { domain: "cognitive_screening", sourceType: "screening_result" }),
  fact(7, "medical-history-psychiatric-diagnoses", "Depression by history.", { temporalStatus: "historical", semantics: { ...semantics, diagnosisStatus: "documented_diagnosis" } })
];
const draft = { blocks: [
  { section: "assessment", text: "The participant lives alone in an apartment.", sourceFactIds: ["fact-001"] },
  { section: "assessment", text: "The participant enjoys music and structured activities.", sourceFactIds: ["fact-002"] },
  { section: "assessment", text: "The documented goals are improved socialization and maintenance of routine.", sourceFactIds: ["fact-003"] },
  { section: "assessment", text: "No interpreter is needed.", sourceFactIds: ["fact-004"] },
  { section: "strengths", text: "Enjoys music and structured activities.", sourceFactIds: ["fact-002"] },
  { section: "needs", text: "Improved socialization and maintenance of routine are identified goals.", sourceFactIds: ["fact-003"] },
  { section: "plan", text: "Consider structured music activities to support socialization.", sourceFactIds: ["fact-002", "fact-003"] },
  { section: "plan", text: "Review the participant's routine to support the documented goal of maintaining routine.", sourceFactIds: ["fact-003"] }
] };
let passed = 0;
function test(name, run) { run(); passed++; console.log(`PASS ${name}`); }
function altered(text, sourceFactIds = ["fact-001"], section = "assessment") {
  const result = structuredClone(draft);
  result.blocks[result.blocks.findIndex((block) => block.section === section)] = { section, text, sourceFactIds };
  return result;
}
function rejects(candidate, category, source = facts) {
  const result = synth.validateAssessmentSynthesis(candidate, source);
  assert.equal(result.valid, false);
  assert.ok(result.issues.includes(category), JSON.stringify(result.issues));
}
test("concise synthesis has direct evidence without model semantic metadata", () => assert.equal(synth.validateAssessmentSynthesis(draft, facts).valid, true));
test("short denied form answer uses its field context without becoming positive", () => rejects(altered("An interpreter is needed.", ["fact-004"]), "denial_changed_to_positive"));
test("nonexistent evidence is blocked", () => rejects(altered("Lives alone.", ["fact-999"]), "missing_source"));
test("uncited paragraph is blocked", () => rejects(altered("Lives alone.", []), "invalid_synthesis_shape"));
test("a multi-sentence block is rejected before it can hide an unsupported statement", () => rejects(altered("Lives alone in an apartment. Enjoys competitive swimming."), "invalid_synthesis_shape"));
test("an unsupported detail cannot hide inside a supported sentence", () => rejects(altered("The participant lives alone in an apartment and enjoys competitive swimming."), "unsupported_statement"));
test("two supported clauses can cite their respective source facts", () => assert.equal(synth.validateAssessmentSynthesis(altered("The participant lives alone in an apartment and enjoys music activities.", ["fact-001", "fact-002"]), facts).valid, true));
test("a denied second clause does not negate an affirmed first clause", () => assert.equal(synth.validateAssessmentSynthesis(altered("The participant lives alone in an apartment and no interpreter is needed.", ["fact-001", "fact-004"]), facts).valid, true));
test("a relationship stated by a yes-answer field retains its source context", () => {
  const source = [...facts, fact(8, "supports-family-support", "Yes")];
  assert.equal(synth.validateAssessmentSynthesis(altered("Family support is documented.", ["fact-008"]), source).valid, true);
});
test("an uncited relationship cannot borrow authority from a different clause", () => rejects(altered("The participant lives alone in an apartment and has a daughter.", ["fact-001", "fact-002"]), "unsupported_statement"));
test("an unsupported plan detail cannot hide after a supported intervention", () => rejects(altered("Consider structured music activities to support socialization and add horseback riding.", ["fact-002", "fact-003"], "plan"), "unsupported_statement"));
test("unrelated citations cannot establish a diagnosis", () => rejects(altered("The participant is diagnosed with bipolar disorder.", ["fact-007"]), "unsupported_clinical_concept"));
test("unsupported relationship is blocked", () => rejects(altered("The participant lives with a daughter in an apartment."), "unsupported_relationship"));
test("unsupported numeric detail is blocked", () => rejects(altered("The participant lives in an apartment with 3 rooms."), "unsupported_numeric"));
test("historical diagnosis cannot become current", () => rejects(altered("Depression is documented.", ["fact-007"]), "historical_fact_made_current"));
test("historical diagnosis wording remains supported", () => assert.equal(synth.validateAssessmentSynthesis(altered("Depression is documented by history.", ["fact-007"]), facts).valid, true));
test("provider cannot reinterpret screening even with a valid citation", () => rejects(altered("Screening establishes dementia.", ["fact-006"]), "screening_boundary"));
test("provider cannot restate or broaden atomic safety", () => rejects(altered("No risk of harm to self or others.", ["fact-005"]), "authoritative_safety_boundary"));
test("server preserves safety denial and scope", () => assert.match(synth.renderAssessmentSynthesis(draft, facts), /Risk of harm to self or others: No current risk of harm to self or others reported/));
test("server screening disclaimer does not create a diagnostic finding", () => assert.match(synth.renderAssessmentSynthesis(draft, facts), /1 correct, 0 incorrect[\s\S]*do not establish a diagnosis/));
test("unknown is not a denial", () => rejects(altered("No interpreter is needed.", ["fact-004"]), "unknown_made_known", facts.map((f) => f.id === "fact-004" ? { ...f, normalizedValue: "Unknown", semantics: { ...f.semantics, polarity: "unknown" } } : f)));
test("caregiver attribution cannot become independently confirmed", () => rejects(altered("The participant lives alone in an apartment."), "source_attribution_changed", facts.map((f) => f.id === "fact-001" ? { ...f, sourceType: "caregiver_report" } : f)));
test("prospective support is not an invented client agreement", () => rejects(altered("The participant agreed to attend structured music activities.", ["fact-002"], "plan"), "unsupported_commitment"));
test("unsupported modality is blocked even in a recommendation", () => rejects(altered("Consider CBT to improve socialization.", ["fact-003"], "plan"), "unsupported_clinical_concept"));
test("unsupported treatment frequency is blocked", () => rejects(altered("Consider weekly music sessions.", ["fact-002"], "plan"), "unsupported_treatment_detail"));
test("output scan covers model prose", () => assert.ok(synth.scanAssessmentSynthesis(altered("Lives alone; contact person@example.test."), facts).length));
test("output scan covers server-rendered facts too", () => assert.ok(synth.scanAssessmentSynthesis(draft, facts.map((f) => f.id === "fact-005" ? { ...f, normalizedValue: "Contact person@example.test." } : f)).length));
test("headings do not create artificial PHI hits", () => assert.equal(synth.scanAssessmentSynthesis(draft, facts).length, 0));
test("rendered output has required concise structure", () => {
  const text = synth.renderAssessmentSynthesis(draft, facts);
  for (const heading of ["Psychosocial Assessment", "Strengths / Protective Factors", "Identified Needs / Barriers", "Safety Considerations", "Treatment / Service Plan"]) assert.ok(text.includes(heading));
  assert.match(text, /1\. Consider[\s\S]*2\. Review/);
});
const selectionFacts = [
  ...facts,
  fact(8, "goals-social-work-services-needed", "Benefits counseling and caregiver support.", { domain: "goals_services" }),
  fact(9, "goals-service-priorities", "Promote safe attendance and monitor mood.", { domain: "goals_services" }),
  fact(10, "psychosocial-current-stressors", "Reduced independence and transportation barriers."),
  fact(11, "home-visit-group-community-supports", "Faith community phone support.", { domain: "living_support" })
];
const sourceSelection = { paragraphs: [
  { sourceFactIds: ["fact-001"] },
  { sourceFactIds: ["fact-002", "fact-010"] },
  { sourceFactIds: ["fact-003", "fact-007"] }
] };
const selectedSynthesis = synth.buildSourceLedgerSynthesis(sourceSelection, selectionFacts);
test("source selection produces grounded paragraphs and documented plan priorities", () => {
  assert.ok(selectedSynthesis);
  assert.equal(selectedSynthesis.renderMode, "source-ledger");
  assert.equal(synth.validateAssessmentSynthesis(selectedSynthesis, selectionFacts).valid, true);
  assert.equal(selectedSynthesis.blocks.filter((block) => block.section === "plan").length, 3);
  assert.match(synth.renderAssessmentSynthesis(selectedSynthesis, selectionFacts), /Benefits counseling and caregiver support/);
});
test("source-ledger text cannot be replaced with unsupported clinical prose", () => {
  const tampered = structuredClone(selectedSynthesis);
  tampered.blocks[0].text = "The participant enjoys competitive swimming.";
  rejects(tampered, "source_ledger_mismatch", selectionFacts);
});
test("source selection cannot cite nonexistent or safety facts as assessment paragraphs", () => {
  assert.equal(synth.buildSourceLedgerSynthesis({ paragraphs: [{ sourceFactIds: ["fact-999"] }, ...sourceSelection.paragraphs.slice(1)] }, selectionFacts), null);
  assert.equal(synth.buildSourceLedgerSynthesis({ paragraphs: [{ sourceFactIds: ["fact-005"] }, ...sourceSelection.paragraphs.slice(1)] }, selectionFacts), null);
  assert.equal(synth.parseAssessmentSourceSelection({ ...sourceSelection, unsupportedText: "invented diagnosis" }), null);
});
const { examplePacket } = load("lib/examplePacket.ts");
const exampleWorkspace = assessment.createAssessmentWorkspace(examplePacket, "NJ", new Date("2026-09-16T12:00:00Z"));
const exampleByField = new Map(exampleWorkspace.facts.map((source) => [source.sourceField, source.id]));
const exampleSelection = { paragraphs: [
  { sourceFactIds: ["living-current-residence", "living-lives-with", "living-transportation"].map((field) => exampleByField.get(field)) },
  { sourceFactIds: ["functional-orientation", "functional-ambulation", "functional-adl-help"].map((field) => exampleByField.get(field)) },
  { sourceFactIds: ["psychosocial-baseline-mood", "psychosocial-mental-health-history", "psychosocial-social-engagement"].map((field) => exampleByField.get(field)) },
  { sourceFactIds: ["medical-history-major-medical-diagnoses", "goals-participant-family-goals"].map((field) => exampleByField.get(field)) }
] };
test("the same fictitious production case supports concise source-selected output", () => {
  const selected = synth.parseAssessmentSourceSelection(exampleSelection);
  assert.ok(selected);
  const result = synth.buildSourceLedgerSynthesis(selected, exampleWorkspace.facts);
  assert.ok(result);
  assert.equal(synth.validateAssessmentSynthesis(result, exampleWorkspace.facts).valid, true);
  assert.equal(synth.scanAssessmentSynthesis(result, exampleWorkspace.facts).length, 0);
  assert.equal(result.blocks.filter((block) => block.section === "assessment").length, 4);
  assert.equal(result.blocks.filter((block) => block.section === "plan").length, 4);
});
test("facility review preserves neighboring Correctly and full dates remain hard PHI", () => {
  const f = fact(8, "screening-item-1", "Correctly identified Harbor Wellness Adult Day Health Center.", { domain: "cognitive_screening" });
  const findings = assessment.scanAssessmentFacts([f], []);
  assert.ok(findings.length);
  assert.ok(findings.every((finding) => !finding.detectedText.includes("Correctly")));
  assert.ok(assessment.scanAssessmentFacts([fact(9, "screening-item-3", "September 16, 2026", { domain: "cognitive_screening" })], []).some((f) => f.kind === "full_date" && f.severity === "hard_block"));
});

// Exercise the actual route, not just a source-code pattern, to prove all
// validation runs before settlement and every failed reservation is released.
let owner = true, generated = draft, outputFacts = facts, fail = false;
let reserve = 0, complete = 0, release = 0;
const route = load("app/api/assessment/generate/route.ts", {
  "next/server": { NextResponse: { json: (body, init) => ({ body, status: init.status }) } },
  "@/lib/assessmentAccess": { authorizeAssessmentGeneration: async () => ({ authorized: true, isOwner: owner, userId: "test", entitlementActivation: null }), requestIsSameOrigin: () => true },
  "@/lib/assessmentProvider": { AssessmentProviderError: class extends Error {}, generateAssessmentClaims: async () => { if (fail) throw new Error("timeout"); return generated; } },
  "@/lib/assessmentUsage": {
    reserveAssessmentGeneration: async () => { reserve++; return { allowed: true, reservationId: "reservation" }; },
    completeAssessmentGeneration: async () => { complete++; return { successfulGenerationsUsed: 1 }; },
    releaseAssessmentGeneration: async () => { release++; }
  },
  "@/lib/assessmentValidationTelemetry": { recordAssessmentValidationFailure: () => {}, recordAssessmentValidationSuccess: () => {} }
});
const request = () => new Request("https://example.test/api/assessment/generate", { method: "POST", headers: { "X-Assessment-Format": "synthesis-v1" }, body: JSON.stringify({ version: 1, jurisdiction: "NJ", facts: outputFacts, reviewedAmbiguousFindings: [] }) });
let result = await route.POST(request());
test("live route owner success bypasses every credit mutation", () => { assert.equal(result.status, 200, JSON.stringify(result.body)); assert.equal(result.body.usage, null); assert.deepEqual([reserve, complete, release], [0, 0, 0]); });
owner = false;
result = await route.POST(request());
test("live route customer success settles exactly once after all gates", () => { assert.equal(result.status, 200); assert.deepEqual([reserve, complete, release], [1, 1, 0]); });
generated = altered("The participant has 90 cats in the apartment.");
result = await route.POST(request());
test("grounding failure releases reservation without charging", () => { assert.equal(result.status, 502); assert.deepEqual([reserve, complete, release], [2, 1, 1]); });
generated = altered("Lives alone in the apartment. Email person@example.test.");
result = await route.POST(request());
test("invalid or PHI output never charges", () => { assert.equal(result.status, 502); assert.deepEqual([reserve, complete, release], [3, 1, 2]); });
fail = true;
result = await route.POST(request());
test("provider failure releases reservation without charging", () => { assert.equal(result.status, 503); assert.deepEqual([reserve, complete, release], [4, 1, 3]); });

const semantic = load("lib/assessmentSemanticReview.ts");
const approved = { blocks: draft.blocks.map((_, index) => ({ index, verdict: "supported" })) };
test("semantic review must cover every block exactly once", () => {
  for (const bad of [null, {}, { blocks: [] }, { blocks: approved.blocks.slice(1) }, { blocks: approved.blocks.map(() => approved.blocks[0]) }, { blocks: approved.blocks.map((b) => ({ ...b, verdict: "probably" })) }]) assert.ok(semantic.semanticReviewIssues(bad, draft.blocks.length).length);
});
test("all clinical semantic failure categories are blocking", () => {
  for (const verdict of semantic.GROUNDING_VERDICTS.filter((v) => v !== "supported")) {
    const review = structuredClone(approved); review.blocks[0].verdict = verdict;
    assert.deepEqual(semantic.semanticReviewIssues(review, draft.blocks.length), [`semantic_${verdict}`]);
    assert.equal(synth.validateAssessmentSynthesis({ ...draft, semanticReview: review }, facts).valid, false);
  }
});
test("semantic approval cannot override numeric or screening hard gates", () => {
  rejects({ ...altered("Lives in an apartment with 999 rooms."), semanticReview: approved }, "unsupported_numeric");
  rejects({ ...altered("Screening establishes dementia.", ["fact-006"]), semanticReview: approved }, "screening_boundary");
});
test("review criteria require clause-level support, polarity, attribution and plan boundaries", () => {
  for (const text of ["EVERY material statement", "ONLY its cited", "exact reporter", "unknown versus not assessed", "functional independence", "consequential commitments", "unsupported or uncertain"]) assert.ok(semantic.SEMANTIC_REVIEW_INSTRUCTIONS.includes(text));
});
fail = false; owner = true; generated = draft;
const v2request = () => new Request("https://example.test/api/assessment/generate", { method: "POST", headers: { "X-Assessment-Format": "synthesis-v2" }, body: JSON.stringify({ version: 1, jurisdiction: "NJ", facts, reviewedAmbiguousFindings: [] }) });
result = await route.POST(v2request());
test("new route contract refuses a draft missing independent review", () => assert.equal(result.status, 502));
generated = { ...draft, semanticReview: approved };
result = await route.POST(v2request());
test("new owner contract completes only with full semantic coverage and no charge", () => { assert.equal(result.status, 200); assert.equal(result.body.usage, null); assert.deepEqual([reserve, complete, release], [4, 1, 3]); });
generated = draft;
const v3request = () => new Request("https://example.test/api/assessment/generate", { method: "POST", headers: { "X-Assessment-Format": "synthesis-v3" }, body: JSON.stringify({ version: 1, jurisdiction: "NJ", facts, reviewedAmbiguousFindings: [] }) });
result = await route.POST(v3request());
test("v3 accepts a server-validated single-sentence ledger draft without a model verdict", () => assert.equal(result.status, 200));
generated = altered("The participant lives alone in an apartment and enjoys competitive swimming.");
owner = false;
const unsupportedResults = [];
for (let index = 0; index < 10; index++) unsupportedResults.push(await route.POST(v3request()));
test("v3 rejects the same unsupported draft consistently without a customer charge", () => {
  assert.ok(unsupportedResults.every((entry) => entry.status === 502 && entry.body.code === "validation_failed"));
  assert.deepEqual([reserve, complete, release], [14, 1, 13]);
});
const v4request = () => new Request("https://example.test/api/assessment/generate", { method: "POST", headers: { "X-Assessment-Format": "synthesis-v4" }, body: JSON.stringify({ version: 1, jurisdiction: "NJ", facts: selectionFacts, reviewedAmbiguousFindings: [] }) });
owner = true; generated = selectedSynthesis;
result = await route.POST(v4request());
test("v4 owner selection renders and validates without touching customer credits", () => {
  assert.equal(result.status, 200, JSON.stringify(result.body));
  assert.equal(result.body.usage, null);
  assert.deepEqual([reserve, complete, release], [14, 1, 13]);
});
owner = false;
result = await route.POST(v4request());
test("v4 customer success settles exactly one credit after validation", () => {
  assert.equal(result.status, 200);
  assert.deepEqual([reserve, complete, release], [15, 2, 13]);
});
generated = structuredClone(selectedSynthesis);
generated.blocks[0].text = "The participant enjoys competitive swimming.";
const unsupportedV4 = [];
for (let index = 0; index < 10; index++) unsupportedV4.push(await route.POST(v4request()));
test("v4 unsupported prose fails consistently and releases every customer reservation", () => {
  assert.ok(unsupportedV4.every((entry) => entry.status === 502 && entry.body.code === "validation_failed"));
  assert.deepEqual([reserve, complete, release], [25, 2, 23]);
});
owner = true;

// Exercise the actual two-call provider operation. It may not self-certify a
// draft, leak PHI to the reviewer, accept missing verdicts, or reset its budget.
const provider = load("lib/assessmentProvider.ts", {
  "@/lib/assessmentUsage": { getAssessmentGenerationConfig: () => ({ timeoutMs: 42_000 }) },
  "@/lib/assessmentProviderTelemetry": { recordAssessmentProviderTiming: () => {} },
  "@/lib/assessmentValidationTelemetry": { recordAssessmentValidationFailure: () => {} }
});
const originalFetch = globalThis.fetch, originalKey = process.env.OPENAI_API_KEY;
process.env.OPENAI_API_KEY = "fictitious-test-key";
let responses = [], calls = [];
const envelope = (value) => new Response(JSON.stringify({ status: "completed", output: [{ content: [{ type: "output_text", text: JSON.stringify(value) }] }] }), { status: 200 });
globalThis.fetch = async (_url, options) => { calls.push(options); return envelope(responses.shift()); };
try {
  const input = { version: 1, jurisdiction: "NJ", facts, reviewedAmbiguousFindings: [] };
  responses = [draft, approved];
  let output = await provider.generateAssessmentClaims(input, undefined, true, true);
  test("draft and independent review share one signal and disable storage", () => {
    assert.equal(calls.length, 2); assert.equal(calls[0].signal, calls[1].signal);
    for (const call of calls) { const body = JSON.parse(call.body); assert.equal(body.store, false); assert.equal(body.reasoning.effort, "low"); }
    assert.deepEqual(output.semanticReview, approved);
  });
  calls = []; responses = [draft];
  output = await provider.generateAssessmentClaims(input, undefined, true, false);
  test("v3 completes with one provider draft and deterministic source-ledger validation", () => {
    assert.equal(calls.length, 1);
    assert.equal(output.semanticReview, undefined);
  });
  calls = []; responses = [sourceSelection];
  output = await provider.generateAssessmentClaims({ ...input, facts: selectionFacts }, undefined, true, false, true);
  test("v4 provider returns only source IDs and the server writes every clinical statement", () => {
    assert.equal(calls.length, 1);
    assert.equal(output.renderMode, "source-ledger");
    assert.equal(JSON.stringify(JSON.parse(calls[0].body).text.format.schema).includes('"text"'), false);
    assert.ok(JSON.parse(JSON.parse(calls[0].body).input[0].content[0].text).sourceFacts.every((source) => !["safety", "cognitive_screening"].includes(source.domain)));
    assert.equal(synth.validateAssessmentSynthesis(output, selectionFacts).valid, true);
  });
  calls = []; responses = [{ paragraphs: [{ sourceFactIds: ["fact-999"] }, ...sourceSelection.paragraphs.slice(1)] }, { paragraphs: [{ sourceFactIds: ["fact-999"] }, ...sourceSelection.paragraphs.slice(1)] }];
  await assert.rejects(provider.generateAssessmentClaims({ ...input, facts: selectionFacts }, undefined, true, false, true), (e) => e.failure === "grounding_failed");
  test("v4 unsupported source IDs fail both attempts without being accepted", () => assert.equal(calls.length, 2));
  calls = []; responses = [altered("The participant has 90 cats in the apartment."), draft];
  output = await provider.generateAssessmentClaims(input, undefined, true, false);
  test("a deterministic grounding rejection gets one bounded replacement draft", () => {
    assert.equal(calls.length, 2);
    assert.equal(output.blocks.length, draft.blocks.length);
  });
  calls = []; responses = [{ ...draft, semanticReview: approved }];
  await assert.rejects(provider.generateAssessmentClaims(input, undefined, true, true), (e) => e.failure === "invalid_response");
  test("draft provider cannot self-certify grounding", () => assert.equal(calls.length, 1));
  calls = []; responses = [draft, { blocks: approved.blocks.slice(1) }];
  await assert.rejects(provider.generateAssessmentClaims(input, undefined, true, true), (e) => e.failure === "grounding_failed");
  test("missing independent verdict blocks generation without retrying acceptance", () => assert.equal(calls.length, 2));
  calls = []; responses = [draft, { blocks: approved.blocks.map((b) => ({ ...b, verdict: "polarity_changed" })) }];
  await assert.rejects(provider.generateAssessmentClaims(input, undefined, true, true), (e) => e.failure === "grounding_failed");
  test("independent semantic rejection cannot be regenerated away", () => assert.equal(calls.length, 2));
  calls = []; responses = [altered("Lives alone in an apartment with contact person@example.test.")];
  await assert.rejects(provider.generateAssessmentClaims(input, undefined, true, true), (e) => e.failure === "output_phi_blocked");
  test("provider-added PHI is blocked before the second outbound call", () => assert.equal(calls.length, 1));
} finally {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalKey;
}
console.log(`Assessment synthesis: ${passed} passed.`);
