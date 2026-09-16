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
  { section: "assessment", text: "The documented goals are improved socialization and maintenance of routine. No interpreter is needed.", sourceFactIds: ["fact-003", "fact-004"] },
  { section: "strengths", text: "Enjoys music and structured activities.", sourceFactIds: ["fact-002"] },
  { section: "needs", text: "Improved socialization and maintenance of routine are identified goals.", sourceFactIds: ["fact-003"] },
  { section: "plan", text: "Consider structured music activities to support socialization.", sourceFactIds: ["fact-002", "fact-003"] },
  { section: "plan", text: "Review the participant's routine to support the documented goal of maintaining routine.", sourceFactIds: ["fact-003"] }
] };
let passed = 0;
function test(name, run) { run(); passed++; console.log(`PASS ${name}`); }
function altered(text, sourceFactIds = ["fact-001"], section = "assessment") {
  const result = structuredClone(draft);
  result.blocks[section === "plan" ? 5 : 0] = { section, text, sourceFactIds };
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
test("unsupported sentence cannot hide beside a supported sentence", () => rejects(altered("Lives alone in an apartment. Enjoys competitive swimming."), "unsupported_statement"));
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
console.log(`Assessment synthesis: ${passed} passed.`);
