// Network denied. The one authorized provider test was consumed (17,650 ms,
// validation_failed). AI-first/fallback routing is tested using fake providers.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = resolve(import.meta.dirname, "..");
if (process.argv.includes("--provider-once")) throw new Error("The single provider test is already consumed. Additional provider calls require explicit authorization.");
const cache = new Map(), modules = new Map();
function load(path) {
  path = path.replaceAll("\\", "/");
  if (!/\.(?:ts|tsx)$/.test(path)) path += existsSync(resolve(root, path + ".ts")) ? ".ts" : ".tsx";
  if (cache.has(path)) return cache.get(path);
  const module = { exports: {} }; cache.set(path, module.exports);
  const js = ts.transpileModule(readFileSync(resolve(root, path), "utf8"), { fileName: path, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function("require", "module", "exports", js)((id) => {
    if (id === "server-only") return {};
    if (modules.has(id)) return modules.get(id);
    if (id.startsWith("@/")) return load(id.slice(2));
    if (id.startsWith(".")) return load(resolve(dirname(path), id));
    return require(id);
  }, module, module.exports);
  return module.exports;
}
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => { throw new Error("Network is forbidden in deterministic tests"); };
const adapter = load("lib/leanmaster/psychosocialAdapter.ts");
const boundary = load("lib/leanmaster/requestBoundary.ts");
const assessment = load("lib/assessment.ts");
const { examplePacket } = load("lib/examplePacket.ts");
const workspace = assessment.createAssessmentWorkspace(examplePacket, "NJ", new Date("2026-09-16T12:00:00Z"));
const request = { version: 1, jurisdiction: "NJ", facts: workspace.facts, reviewedAmbiguousFindings: [] };
if (process.argv.includes("--trace-facts")) {
  console.log(JSON.stringify(request.facts, null, 2));
  process.exit(0);
}
if (process.argv.includes("--trace-captured-draft")) {
  const captured = JSON.parse(readFileSync(resolve(root, "tmp/fictitious-ai-review.json"), "utf8"));
  assert.deepEqual(captured.request, request);
  const note = JSON.parse(captured.raw);
  for (const [index, block] of note.blocks.entries()) {
    const validation = adapter.validateClinicalFacts([block], request.facts);
    if (!validation.valid) {
      const parts = block.text.split(/(?<=[.!?;])\s+|\s+(?:but|while|whereas|although)\s+|,?\s+and\s+(?=(?:has|have|is|are|does|do|needs?|requires?|denies|reports?)\b|(?:the\s+)?(?:participant|family|caregiver|there|a guardian|no)\b)/i);
      console.log(JSON.stringify({ index, validation, clauses: parts.map(text => ({ text, ...adapter.validateClinicalFacts([{...block,text}], request.facts) })).filter(part => !part.valid) }));
    }
  }
  const checked = adapter.validateLeanMasterAssessment(captured.raw, request);
  console.log(JSON.stringify({ valid: checked.valid, issues: checked.issues }));
  if (checked.valid) console.log(checked.text);
  process.exit(0);
}
if (process.argv.includes("--show-fallback")) {
  const result = load("lib/assessmentFallback.ts").buildDeterministicAssessment(request.facts);
  if (result.outputPhiFindings.length) throw new Error("Fallback preview blocked by output PHI scan.");
  console.log(result.text);
  process.exit(0);
}
const get = (field) => { const fact = request.facts.find((f) => f.sourceField === field); assert.ok(fact, field); return fact; };
const block = (text, fields, section = "assessment") => ({ section, text, sourceFactIds: fields.map((field) => get(field).id) });
const fixture = { blocks: [
  block("The participant is a 78-year-old English-speaking adult residing in a private apartment in senior housing. The participant lives alone, with family visiting several times per week.", ["calculated-age", "identifying-primary-language", "living-current-residence", "living-lives-with"]),
  block("A rolling walker supports mobility over longer distances. Assistance is needed with appointments and benefits paperwork. These support needs are relevant to maintaining a consistent daily routine.", ["functional-ambulation", "functional-decision-making", "goals-participant-family-goals"]),
  block("The participant is generally pleasant, with mild anxiety when routines change. Reduced independence, caregiver availability, and transportation present practical barriers to participation. Interest in center activities provides an opportunity for greater social engagement.", ["psychosocial-baseline-mood", "psychosocial-current-stressors", "psychosocial-social-engagement"]),
  block("Music, structured activities, and family phone calls are sources of enjoyment. Family contact and interest in center activities offer useful supports for participation.", ["psychosocial-strengths-coping", "living-lives-with", "psychosocial-social-engagement"], "strengths"),
  block("Limited socialization at home and transportation needs warrant attention alongside benefits counseling and caregiver support needs.", ["psychosocial-social-engagement", "psychosocial-current-stressors", "goals-social-work-services-needed"], "needs"),
  block("Promote engagement and reduced isolation through structured small-group activities and music matched to the participant's interests.", ["psychosocial-strengths-coping", "goals-participant-family-goals"], "plan"),
  block("Support consistent attendance by reviewing transportation needs and offering benefits counseling and caregiver support.", ["living-transportation", "goals-social-work-services-needed", "goals-service-priorities"], "plan")
] };
let passed = 0, failed = 0;
async function test(name, run) {
  try { await run(); passed++; console.log(`PASS ${name}`); }
  catch (error) { failed++; console.error(`FAIL ${name}: ${error.message}`); }
}
const checkText = (text, fields, section = "assessment", facts = request.facts) => adapter.validateClinicalFacts([block(text, fields, section)], facts);
const allow = (text, fields, section) => { const result = checkText(text, fields, section); assert.equal(result.valid, true, result.issues.join(",")); };
const deny = (text, fields, section) => assert.equal(checkText(text, fields, section).valid, false, text);
await test("reporter attribution is scoped to its finding, with independent historical evidence preserved", () => {
  const fields = ["functional-memory-concerns", "conditions-medication-management", "home-visit-shopping-availability"];
  allow("Family assists with weekly medication organization and shopping.", fields);
  deny("The participant reports short-term memory concerns.", fields);
  const history = ["psychosocial-mental-health-history", "medical-history-psychiatric-diagnoses"];
  allow("Documented psychiatric history includes depression by history.", history);
  allow("Family also reports a history of depression treated by the primary care provider.", history);
  deny("The participant reports a history of depression treated by the primary care provider.", history);
  deny("The participant has current depression.", history);
});
await test("affirmative fixed-question quantities support paraphrases, never altered quantities or denied answers", () => {
  const fields = ["home-visit-rooms-one-level"];
  allow("The rooms are on one level.", fields);
  deny("The rooms are on two levels.", fields);
  for (const [value, polarity] of [["no", "denied"], ["unknown", "unknown"]]) {
    const facts = request.facts.map(f => f.sourceField === fields[0] ? {...f, normalizedValue: value, semantics: {...f.semantics, polarity}} : f);
    assert.equal(checkText("The rooms are on one level.", fields, "assessment", facts).valid, false);
  }
});
await test("assistance with tasks does not establish an unassessed executive-function impairment", () => {
  deny("The participant presents with executive-function support needs.", ["functional-orientation", "functional-memory-concerns", "functional-decision-making"]);
});
await test("same fictitious intake passes unchanged PHI and safety gates", () => { assert.equal(assessment.scanAssessmentFacts(request.facts, []).length, 0); assert.equal(assessment.detectSafetyConflicts(request.facts).length, 0); });
await test("complete concise professional fixture passes hard factual checks", () => { const result = adapter.validateLeanMasterAssessment(JSON.stringify(fixture), request); assert.equal(result.valid, true, result.issues.join(",")); });
for (const [name, text, fields, section] of [
  ["clinical plan paraphrase", "Facilitate meaningful social connection through preferred group activities and music.", ["psychosocial-strengths-coping", "goals-participant-family-goals"], "plan"],
  ["prospective plan without authorization machinery", "Offer caregiver support and benefits counseling to address identified needs.", ["goals-social-work-services-needed"], "plan"],
  ["supported mobility paraphrase", "A rolling walker supports mobility over longer distances.", ["functional-ambulation"]],
  ["supported historical diagnosis", "Depression is documented by history.", ["medical-history-psychiatric-diagnoses"]],
  ["supported negation", "The participant does not need an interpreter.", ["identifying-interpreter-needed"]],
  ["supported reporter", "Family reports short-term memory concerns.", ["functional-memory-concerns"]]
]) await test(name, () => allow(text, fields, section));
for (const [name, text, fields, section] of [
  ["invented diagnosis", "The participant has schizophrenia.", ["medical-history-psychiatric-diagnoses"]],
  ["changed diagnosis status", "The participant has current depression.", ["medical-history-psychiatric-diagnoses"]],
  ["changed negation", "The participant needs an interpreter.", ["identifying-interpreter-needed"]],
  ["changed positive answer", "No guardian or proxy is on file.", ["identifying-guardian-proxy-on-file"]],
  ["changed SI", "The participant reports suicidal ideation.", ["medical-history-current-risk-details"]],
  ["changed HI", "The participant reports homicidal ideation.", ["medical-history-current-risk-details"]],
  ["changed safety", "The participant has no fall risk.", ["functional-recent-falls"]],
  ["changed reporter", "The participant reports short-term memory concerns.", ["functional-memory-concerns"]],
  ["changed age", "The participant is an 88-year-old adult.", ["calculated-age"]],
  ["borrowed number cannot change age", "The participant is a 2-year-old adult with diabetes.", ["calculated-age", "medical-history-major-medical-diagnoses"]],
  ["changed frequency", "Family visits daily.", ["living-lives-with"]],
  ["changed quantity", "Family visits 8 times per week.", ["living-lives-with"]],
  ["invented medication", "The participant takes sertraline.", ["medical-history-current-medications"]],
  ["invented medical history", "The participant has a history of cancer.", ["medical-history-major-medical-diagnoses"]],
  ["invented social history", "The participant worked as a pilot.", ["living-lives-with"]],
  ["completed treatment", "The clinician completed electroconvulsive therapy.", ["goals-social-work-services-needed"], "plan"],
  ["fabricated referral", "The participant was referred to a psychiatrist.", ["goals-social-work-services-needed"], "plan"],
  ["fabricated appointment", "A counseling appointment was scheduled.", ["goals-social-work-services-needed"], "plan"],
  ["fabricated consent", "The participant consented to counseling.", ["goals-social-work-services-needed"], "plan"],
  ["fabricated agreement", "The participant agreed to attend activities.", ["psychosocial-strengths-coping"], "plan"],
  ["fabricated service", "The social worker provided benefits counseling.", ["goals-social-work-services-needed"], "plan"],
  ["screening becomes diagnosis", "Screening confirms a diagnosis of dementia.", ["functional-orientation"]],
  ["unsupported fact in supported sentence", "The participant enjoys music. The participant owns a yacht.", ["psychosocial-strengths-coping"]]
]) await test(name, () => deny(text, fields, section));
await test("unknown/not assessed cannot become a known finding", () => {
  for (const polarity of ["unknown", "not_assessed"]) {
    const fact = structuredClone(get("functional-memory-concerns"));
    fact.normalizedValue = polarity === "unknown" ? "Unknown" : "Not assessed";
    fact.semantics.polarity = polarity;
    assert.equal(checkText("The participant has memory impairment.", [fact.sourceField], "assessment", [fact]).valid, false);
  }
});
await test("coordinated predicates preserve separate positive and negative findings", () => {
  allow("The participant does not require an interpreter and has a guardian or health care proxy on file.", ["identifying-interpreter-needed", "identifying-guardian-proxy-on-file"]);
  deny("The participant requires an interpreter and has a guardian on file.", ["identifying-interpreter-needed", "identifying-guardian-proxy-on-file"]);
  deny("The participant does not require an interpreter and does not have a guardian on file.", ["identifying-interpreter-needed", "identifying-guardian-proxy-on-file"]);
  allow("The participant has a guardian on file and does not require an interpreter.", ["identifying-interpreter-needed", "identifying-guardian-proxy-on-file"]);
});
await test("active, passive and adjectival reporting preserve the exact reporter", () => {
  for (const text of ["Family reports short-term memory concerns.", "Short-term memory concerns are reported by family.", "The participant has family-reported short-term memory concerns."]) allow(text, ["functional-memory-concerns"]);
  for (const text of ["The participant has participant-reported short-term memory concerns.", "Short-term memory concerns are reported by the participant.", "The participant has short-term memory concerns."]) deny(text, ["functional-memory-concerns"]);
});
await test("historical diagnostic qualification uses a cited diagnosis, never a symptom", () => {
  allow("Depression is documented by history; this is a historical diagnosis rather than a new diagnostic conclusion.", ["medical-history-psychiatric-diagnoses"]);
  deny("Depression is documented by history; this is a current confirmed diagnosis.", ["medical-history-psychiatric-diagnoses"]);
  deny("This is a historical diagnosis.", ["functional-memory-concerns"]);
  deny("The participant has a historical diagnosis of schizophrenia.", ["medical-history-psychiatric-diagnoses"]);
  deny("The participant has a diagnosis of generalized anxiety disorder.", ["psychosocial-baseline-mood"]);
});
await test("output PHI and missing citations remain blocking", () => {
  for (const changed of [
    { ...fixture.blocks[0], text: "Contact person@example.test." },
    { ...fixture.blocks[0], sourceFactIds: ["not-a-fact"] }
  ]) assert.equal(adapter.validateLeanMasterAssessment(JSON.stringify({ blocks: [changed, ...fixture.blocks.slice(1)] }), request).valid, false);
});
await test("request has concise schema, no NoteOrigin and unchanged protected envelope", () => {
  const body = JSON.parse(load("lib/leanmaster/request.ts").buildLeanMasterAssessmentRequest(request).serialized);
  assert.deepEqual(Object.keys(body.text.format.schema.properties), ["blocks"]);
  assert.equal(body.store, false); assert.equal(body.reasoning.effort, "low");
  assert.equal("allowedClaims" in JSON.parse(body.input), false);
  const ids = body.text.format.schema.properties.blocks.items.properties.sourceFactIds.items.enum;
  assert.deepEqual(ids, request.facts.filter((fact) => !["safety", "cognitive_screening"].includes(fact.domain)).map((fact) => fact.id));
  const changedSchema = structuredClone(body);
  changedSchema.text.format.schema.properties.blocks.items.properties.sourceFactIds.items.enum.push("fact-999");
  assert.throws(() => boundary.assertLeanMasterOutboundPrivacy(JSON.stringify(changedSchema), request), /untrusted_provider_envelope/);
  body.instructions += "Injected";
  assert.throws(() => boundary.assertLeanMasterOutboundPrivacy(JSON.stringify(body), request), /untrusted_provider_envelope/);
});

// Real route/provider/validators, fake external auth, credit store and network.
let owner = true, timeoutMs = 42000, calls, responseNote, behavior;
cache.set("lib/assessmentAccess.ts", { requestIsSameOrigin: () => true,
  authorizeAssessmentGeneration: async () => ({ authorized: true, userId: "fictitious-user", isOwner: owner, entitlementActivation: null }) });
cache.set("lib/assessmentUsage.ts", {
  getAssessmentGenerationConfig: () => ({ timeoutMs }),
  reserveAssessmentGeneration: async () => { calls.reserve++; return { allowed: true, reservationId: "test-reservation" }; },
  completeAssessmentGeneration: async () => { calls.complete++; return { includedQuantity: 30, successfulGenerationsUsed: 1, remainingGenerations: 29, entitlementStartsAt: "2026-09-16", entitlementExpiresAt: "2026-10-16" }; },
  releaseAssessmentGeneration: async () => { calls.release++; }
});
const originalKey = process.env.OPENAI_API_KEY;
process.env.OPENAI_API_KEY = "local-test-placeholder-not-a-real-key";
function reset() { calls = { reserve: 0, complete: 0, release: 0, provider: 0 }; responseNote = structuredClone(fixture); behavior = "complete"; timeoutMs = 42000; }
const mockProvider = async (_url, options) => {
  calls.provider++;
  boundary.assertLeanMasterOutboundPrivacy(options.body, request);
  if (behavior === "pending") return new Promise((_, reject) => options.signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true }));
  if (behavior === "unavailable") return new Response(null, { status: 503 });
  if (behavior === "network-error") throw new Error("Simulated provider connection failure");
  return Response.json({ status: behavior === "incomplete" ? "incomplete" : "completed", output: [{ content: [{ type: "output_text", text: behavior === "invalid" ? "{truncated" : JSON.stringify(responseNote) }] }] });
};
globalThis.fetch = mockProvider;
const route = load("app/api/assessment/generate/route.ts");
const invoke = (body = request, signal, format = "leanmaster-v1") => route.POST(new Request("http://localhost/api/assessment/generate", { method: "POST", headers: { "X-Assessment-Format": format, "Content-Type": "application/json" }, body: JSON.stringify(body), signal }));
let goodResponse, goodAIResponse;
await test("owner route succeeds repeatedly and uses zero customer credits", async () => {
  reset(); owner = true;
  for (let i = 0; i < 3; i++) { const response = await invoke(); assert.equal(response.status, 200); goodResponse = await response.json(); assert.equal(goodResponse.usage, null); }
  assert.deepEqual(calls, { reserve: 0, complete: 0, release: 0, provider: 3 });
});
await test("customer success consumes exactly one credit", async () => {
  reset(); owner = false; assert.equal((await invoke()).status, 200);
  assert.deepEqual(calls, { reserve: 1, complete: 1, release: 0, provider: 1 });
});
await test("unsupported content fails repeatedly and releases every reservation", async () => {
  reset(); responseNote.blocks[0].text = "The participant has schizophrenia.";
  for (let i = 0; i < 3; i++) assert.equal((await invoke()).status, 502);
  assert.deepEqual(calls, { reserve: 3, complete: 0, release: 3, provider: 3 });
});
await test("PHI is blocked before provider and reservation", async () => {
  reset(); const body = structuredClone(request); body.facts[0].normalizedValue = "person@example.test";
  assert.equal((await invoke(body)).status, 422); assert.deepEqual(calls, { reserve: 0, complete: 0, release: 0, provider: 0 });
});
await test("incomplete result consumes zero credits and is not retried", async () => {
  reset(); behavior = "incomplete"; assert.equal((await invoke()).status, 502);
  assert.deepEqual(calls, { reserve: 1, complete: 0, release: 1, provider: 1 });
});
await test("overall deadline releases credit", async () => {
  reset(); behavior = "pending"; timeoutMs = 50; assert.equal((await invoke()).status, 504);
  assert.deepEqual(calls, { reserve: 1, complete: 0, release: 1, provider: 1 });
});
await test("browser abort releases credit", async () => {
  reset(); behavior = "pending"; const controller = new AbortController();
  const response = invoke(request, controller.signal); setTimeout(() => controller.abort(), 20);
  assert.equal((await response).status, 499); assert.deepEqual(calls, { reserve: 1, complete: 0, release: 1, provider: 1 });
});

const fallback = load("lib/assessmentFallback.ts");
await test("AI-first returns a validated AI draft and charges customer exactly once", async () => {
  reset(); owner = false;
  const response = await invoke(request, undefined, "ai-first-v1");
  assert.equal(response.status, 200); goodAIResponse = await response.json();
  assert.equal(goodAIResponse.generationMethod, "ai");
  assert.equal(goodAIResponse.validation.sourceGrounding, "references_checked");
  assert.deepEqual(calls, { reserve: 1, complete: 1, release: 0, provider: 1 });
});
for (const mode of ["pending", "unavailable", "incomplete", "invalid", "network-error", "grounding", "output-phi"]) {
  await test(`AI-first ${mode} returns facts-only fallback and zero charged credits`, async () => {
    reset(); owner = false; behavior = mode;
    if (mode === "pending") timeoutMs = 50;
    if (mode === "grounding") responseNote.blocks[0].text = "The participant has schizophrenia.";
    if (mode === "output-phi") responseNote.blocks[0].text = "Contact person@example.test.";
    const response = await invoke(request, undefined, "ai-first-v1");
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.generationMethod, "deterministic");
    assert.equal(payload.assessmentText, fallback.buildDeterministicAssessment(request.facts).text);
    assert.equal(payload.leanmasterNote, undefined);
    assert.equal(payload.usage, null);
    assert.equal(calls.reserve, 1); assert.equal(calls.complete, 0); assert.equal(calls.release, 1);
    assert.ok(calls.provider >= 1);
  });
}
await test("AI-first missing configuration returns fallback without external request or charge", async () => {
  reset(); delete process.env.OPENAI_API_KEY;
  try {
    const response = await invoke(request, undefined, "ai-first-v1");
    assert.equal(response.status, 200); assert.equal((await response.json()).generationMethod, "deterministic");
    assert.deepEqual(calls, { reserve: 1, complete: 0, release: 1, provider: 0 });
  } finally { process.env.OPENAI_API_KEY = "local-test-placeholder-not-a-real-key"; }
});
await test("AI-first explicit cancellation remains canceled and never charged", async () => {
  reset(); behavior = "pending"; const controller = new AbortController();
  const pending = invoke(request, controller.signal, "ai-first-v1"); setTimeout(() => controller.abort(), 20);
  assert.equal((await pending).status, 499);
  assert.deepEqual(calls, { reserve: 1, complete: 0, release: 1, provider: 1 });
});
await test("fallback repeats the same full assessment with zero model calls", async () => {
  reset(); owner = true;
  let first;
  for (let i = 0; i < 10; i++) {
    const response = await invoke(request, undefined, "deterministic-v1");
    assert.equal(response.status, 200);
    goodResponse = await response.json();
    assert.equal(goodResponse.generationMethod, "deterministic");
    assert.equal(goodResponse.validation.sourceGrounding, "source_rendered");
    assert.equal(goodResponse.usage, null);
    if (first) assert.equal(goodResponse.assessmentText, first);
    first = goodResponse.assessmentText;
  }
  assert.deepEqual(calls, { reserve: 0, complete: 0, release: 0, provider: 0 });
});
await test("fallback preserves documented diagnoses, history, reporters, SI/HI and quantities verbatim", () => {
  const result = fallback.buildDeterministicAssessment(request.facts);
  assert.equal(result.outputPhiFindings.length, 0);
  for (const field of ["medical-history-psychiatric-diagnoses", "psychosocial-mental-health-history", "functional-memory-concerns", "functional-recent-falls", "medical-history-current-risk-details", "conditions-medication-adherence-concerns", "goals-participant-family-goals"]) {
    assert.ok(result.text.includes(get(field).normalizedValue.replace(/[.!?]+$/, "")), field);
  }
  assert.ok(result.text.includes("78-year-old"));
  assert.ok(result.text.includes("8 correct, 2 incorrect"));
  assert.ok(result.text.includes("do not establish a diagnosis"));
  assert.equal(result.text.split("\n\n")[1].includes("An interpreter is not needed"), true);
});
await test("fallback distinguishes yes, no, unknown and not assessed without inventing facts", () => {
  for (const value of ["yes", "no", "Unknown", "Not assessed"]) {
    const facts = structuredClone(request.facts);
    facts.find((fact) => fact.sourceField === "identifying-interpreter-needed").normalizedValue = value;
    const result = fallback.buildDeterministicAssessment(facts);
    assert.ok(result.text.includes(value === "yes" ? "An interpreter is needed." : value === "no" ? "An interpreter is not needed." : `Interpreter need is recorded as ${value}.`));
  }
});
await test("fallback does not invent missing history, medication or completed care", () => {
  const facts = request.facts.filter((fact) => !["medical", "nutrition_health"].includes(fact.domain));
  const result = fallback.buildDeterministicAssessment(facts);
  assert.ok(!result.text.includes("The documented medical history lists"));
  assert.ok(!result.text.includes("Medication information in the intake"));
  assert.ok(!/completed therapy|was referred|was scheduled|consented to|agreed to/i.test(result.text));
});
await test("fallback output privacy scan still blocks identifiers", () => {
  const facts = structuredClone(request.facts);
  facts.find((fact) => fact.sourceField === "psychosocial-baseline-mood").normalizedValue = "Contact person@example.test";
  assert.ok(fallback.buildDeterministicAssessment(facts).outputPhiFindings.length);
});
await test("direct fallback releases reservation without charging an AI credit", async () => {
  reset(); owner = false;
  assert.equal((await invoke(request, undefined, "deterministic-v1")).status, 200);
  assert.deepEqual(calls, { reserve: 1, complete: 0, release: 1, provider: 0 });
});
await test("fallback preflight rejection and cancellation never complete a credit", async () => {
  reset(); const body = structuredClone(request); body.facts[0].normalizedValue = "person@example.test";
  assert.equal((await invoke(body, undefined, "deterministic-v1")).status, 422);
  const controller = new AbortController(); controller.abort();
  assert.equal((await invoke(request, controller.signal, "deterministic-v1")).status, 499);
  assert.equal(calls.complete, 0); assert.equal(calls.provider, 0); assert.equal(calls.reserve, calls.release);
});

// Exercise actual React handlers/state without installing browser dependencies.
// The JSX tree is also server-rendered to verify the complete textarea value.
const React = require("react");
let hookIndex = 0, hooks = [];
modules.set("react", { ...React,
  useState(initial) { const index = hookIndex++; if (!(index in hooks)) hooks[index] = initial; return [hooks[index], (value) => { hooks[index] = typeof value === "function" ? value(hooks[index]) : value; }]; },
  useMemo(fn) { return fn(); },
  useRef(initial) { const index = hookIndex++; if (!(index in hooks)) hooks[index] = { current: initial }; return hooks[index]; }
});
cache.set("lib/supabase/browser.ts", { createSupabaseBrowserClient: () => ({ auth: { getSession: async () => ({ data: { session: { access_token: "local-session-stub" } } }) } }) });
const { AssessmentWorkflow } = load("components/AssessmentWorkflow.tsx");
function nodes(tree) { if (!tree || typeof tree !== "object") return []; return [tree, ...React.Children.toArray(tree.props?.children).flatMap(nodes)]; }
const label = (node) => React.Children.toArray(node.props?.children).map((item) => typeof item === "string" ? item : label(item)).join("");
async function exerciseUI(payload) {
  hooks = []; let accepted;
  const props = { acceptedAssessment: null, currentRevisionToken: workspace.localRevisionToken, jurisdiction: "NJ", onAccept: (value) => { accepted = value; }, onReturnToIntake: () => {}, packet: examplePacket };
  const render = () => { hookIndex = 0; return AssessmentWorkflow(props); };
  const button = (tree, text) => { const result = nodes(tree).find((node) => node.type === "button" && label(node).includes(text)); assert.ok(result, text); assert.equal(Boolean(result.props.disabled), false, text); return result; };
  let tree = render(); button(tree, "Generate Psychosocial Assessment").props.onClick(); tree = render();
  let browserRequests = 0;
  globalThis.fetch = async (url, options) => {
    browserRequests++; assert.equal(url, "/api/assessment/generate"); assert.equal(options.headers["X-Assessment-Format"], "ai-first-v1");
    assert.deepEqual(JSON.parse(options.body).facts, request.facts);
    return Response.json(payload);
  };
  await button(tree, "Privacy Review Complete").props.onClick(); tree = render();
  let editor = nodes(tree).find((node) => node.type === "textarea");
  assert.ok(editor, "full editor exists"); assert.equal(editor.props.value, payload.assessmentText);
  const html = require("react-dom/server").renderToStaticMarkup(tree);
  assert.ok(html.includes("Treatment / Service Plan")); assert.ok(html.includes("Safety Considerations"));
  assert.equal(html.includes("Rules-based fallback assessment"), payload.generationMethod === "deterministic");
  assert.equal(nodes(tree).some((node) => node.type === "input" && node.props.type === "checkbox"), false);
  const edited = payload.assessmentText + "\n\nClinician edit: reviewed transportation needs.";
  editor.props.onChange({ target: { value: edited } }); tree = render();
  editor = nodes(tree).find((node) => node.type === "textarea"); assert.equal(editor.props.value, edited);
  button(tree, "Accept Assessment").props.onClick();
  assert.equal(accepted.assessmentText, edited); assert.equal(accepted.clinicianEdited, true); assert.equal(browserRequests, 1);
  return accepted;
}
async function exerciseExport(accepted) {
  const pdf = require("pdf-lib"), drawn = [];
  const originalDraw = pdf.PDFPage.prototype.drawText;
  pdf.PDFPage.prototype.drawText = function(text, options) { drawn.push(text); return originalDraw.call(this, text, options); };
  try {
    const { buildPacketPdf } = load("lib/pdfExport.ts");
    const bytes = await buildPacketPdf(examplePacket, "final", accepted);
    assert.ok(bytes.length > 1000);
    const printed = drawn.join(" ").replace(/\s+/g, " ");
    for (const paragraph of accepted.assessmentText.split(/\n+/).filter(Boolean)) assert.ok(printed.includes(paragraph.replace(/\s+/g, " ")), "full paragraph in final PDF");
  } finally { pdf.PDFPage.prototype.drawText = originalDraw; }
}
await test("Generate button renders full response, permits edits, keeps existing acceptance only", async () => { assert.ok(goodResponse); await exerciseUI(goodResponse); });
await test("browser refuses altered fallback text rather than displaying unsupported content", async () => {
  assert.ok(goodResponse);
  await assert.rejects(() => exerciseUI({ ...goodResponse, assessmentText: goodResponse.assessmentText + " Participant has schizophrenia." }), /full editor exists/);
});
await test("existing final PDF export contains all assessment paragraphs and clinician edits", async () => { assert.ok(goodResponse); await exerciseExport(await exerciseUI(goodResponse)); });
await test("AI-first success renders and edits the AI draft and includes it in final export", async () => { assert.ok(goodAIResponse); await exerciseExport(await exerciseUI(goodAIResponse)); });
if (originalKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalKey;
globalThis.fetch = originalFetch;
console.log(`${passed} bounded checks passed; ${failed} failed. Additional real provider calls: 0.`);
if (failed) process.exitCode = 1;

// Explicitly authorized comparison run: one real request, followed by a fully
// simulated failure. Clinical output is the repository's fictitious case only.
if (process.argv.includes("--verify-ai-first-once") && !failed) {
  assert.ok(process.env.OPENAI_API_KEY, "The local provider key is not configured.");
  reset(); owner = true;
  let externalCalls = 0, providerBody, providerDurationMs;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    if (externalCalls !== 0) throw new Error("Only one external request is authorized for this run.");
    boundary.assertLeanMasterOutboundPrivacy(options.body, request);
    externalCalls++;
    const started = performance.now();
    const response = await originalFetch(url, options);
    // Capture only the fictitious response in memory for the requested review.
    providerBody = await response.clone().json().catch(() => null);
    providerDurationMs = Math.round(performance.now() - started);
    return response;
  };
  const started = performance.now();
  const response = await invoke(request, undefined, "ai-first-v1");
  const durationMs = Math.round(performance.now() - started);
  const payload = await response.json();
  const raw = providerBody?.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
  const checked = raw ? adapter.validateLeanMasterAssessment(raw, request) : { valid: false, issues: ["no_complete_provider_draft"] };
  // Only this fixed fictitious fixture is retained locally for reproducible
  // analysis. No credentials, provider metadata, or real participant data.
  if (raw) {
    mkdirSync(resolve(root, "tmp"), { recursive: true });
    writeFileSync(resolve(root, "tmp/fictitious-ai-review.json"), JSON.stringify({ request, raw, providerDurationMs, durationMs }, null, 2));
  }
  console.log("REAL_PROVIDER_RESULT " + JSON.stringify({ externalCalls, providerDurationMs, routeDurationMs: durationMs,
    providerStatus: providerBody?.status ?? "unavailable", routeStatus: response.status,
    returnedMethod: payload.generationMethod ?? "none", aiValidationPassed: checked.valid, issues: checked.issues,
    ownerCustomerCredits: calls.complete, externalProviderChargesPossible: externalCalls > 0 }));
  if (raw) {
    let draft;
    try { draft = JSON.parse(raw); } catch { /* Incomplete provider JSON cannot be rendered. */ }
    const synthesis = load("lib/assessmentSynthesis.ts");
    if (draft && Array.isArray(draft.blocks) && draft.blocks.every((block) => typeof block.text === "string") &&
      !synthesis.scanAssessmentSynthesis(draft, request.facts).length) {
      console.log(checked.valid ? "FULL_AI_DRAFT_VALIDATED" : "FULL_AI_DRAFT_REJECTED_NOT_ACCEPTED");
      console.log(synthesis.renderAssessmentSynthesis(draft, request.facts));
    } else console.log("AI draft withheld: incomplete structure or output privacy findings.");
  }
  if (response.ok) await exerciseExport(await exerciseUI(payload));

  reset(); owner = false; behavior = "incomplete"; globalThis.fetch = mockProvider;
  const failureStarted = performance.now();
  const simulated = await invoke(request, undefined, "ai-first-v1");
  const simulatedDurationMs = Math.round(performance.now() - failureStarted);
  const fallbackPayload = await simulated.json();
  assert.equal(simulated.status, 200);
  assert.equal(fallbackPayload.generationMethod, "deterministic");
  assert.equal(fallbackPayload.assessmentText, fallback.buildDeterministicAssessment(request.facts).text);
  assert.deepEqual(calls, { reserve: 1, complete: 0, release: 1, provider: 1 });
  await exerciseExport(await exerciseUI(fallbackPayload));
  console.log("SIMULATED_FAILURE_RESULT " + JSON.stringify({ failure: "incomplete", durationMs: simulatedDurationMs,
    validation: fallbackPayload.validation, creditsConsumed: calls.complete, reservationReleased: calls.release,
    completeRenderEditExportPassed: true, totalRealProviderCalls: externalCalls }));
  console.log("FULL_DETERMINISTIC_FALLBACK");
  console.log(fallbackPayload.assessmentText);
  globalThis.fetch = originalFetch;
}
