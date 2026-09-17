import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = resolve(import.meta.dirname, "..");
const cache = new Map();
const overrides = new Map();
function load(path) {
  path = path.replaceAll("\\", "/");
  if (!/\.(ts|tsx)$/.test(path)) path += existsSync(resolve(root, path + ".ts")) ? ".ts" : ".tsx";
  if (cache.has(path)) return cache.get(path);
  const module = { exports: {} };
  cache.set(path, module.exports);
  const js = ts.transpileModule(readFileSync(resolve(root, path), "utf8"), {
    fileName: path,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX }
  }).outputText;
  new Function("require", "module", "exports", js)((id) => {
    if (id === "server-only") return {};
    if (overrides.has(id)) return overrides.get(id);
    if (id.startsWith("@/")) return load(id.slice(2));
    if (id.startsWith(".")) return load(resolve(dirname(path), id));
    return require(id);
  }, module, module.exports);
  return module.exports;
}

const assessment = load("lib/assessment.ts");
const synthesis = load("lib/assessmentSynthesis.ts");
const fallback = load("lib/assessmentFallback.ts");
const { examplePacket } = load("lib/examplePacket.ts");
const facts = assessment.createAssessmentWorkspace(examplePacket, "NJ", new Date("2026-09-16T12:00:00Z")).facts;
const request = { version: 1, jurisdiction: "NJ", facts, reviewedAmbiguousFindings: [] };
const byField = (name) => facts.find((fact) => fact.sourceField === name);
const selection = { paragraphs: [
  { sourceFactIds: [byField("living-current-residence").id, byField("living-lives-with").id] },
  { sourceFactIds: [byField("functional-ambulation").id, byField("functional-adl-help").id] },
  { sourceFactIds: [byField("psychosocial-baseline-mood").id, byField("psychosocial-current-stressors").id] }
] };
const sourceNote = synthesis.buildSourceLedgerSynthesis(selection, facts);
assert.ok(sourceNote);
const ledger = new Map(facts.map((fact) => [fact.id, fact]));
const verifiedNote = { renderMode: "verified-prose", blocks: sourceNote.blocks.map((block) => ({
  ...block,
  text: block.sourceFactIds.map((id, index) => synthesis.verifiedNarrativeOptions(ledger.get(id), block.section)[index % 2]).join(" ")
})) };
let passed = 0;
function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }
test("built-in draft repeats without AI and has all five sections", () => {
  const first = fallback.buildDeterministicAssessment(facts);
  for (let i = 0; i < 10; i++) assert.deepEqual(fallback.buildDeterministicAssessment(facts), first);
  for (const title of ["Psychosocial Assessment", "Strengths / Protective Factors", "Identified Needs / Barriers", "Safety Considerations", "Service / Treatment Plan"]) assert.ok(first.text.includes(title));
  assert.doesNotMatch(first.text, /(?:^|\n)(?:Primary language|Current residence|Calculated age):/m);
  assert.equal(first.text.split("Psychosocial Assessment\n\n")[1].split("\n\nStrengths")[0].split("\n\n").length, 4);
  assert.match(first.text, /The participant lives alone, with family visiting several times per week/);
  assert.match(first.text, /No psychosis was reported; the intake notes that the participant may become tearful/);
  assert.match(first.text, /No history of suicide attempts or self-harm was reported/);
  assert.doesNotMatch(first.text, /\bage:\s*78\b|\bin sample\b|\bsample intake\b|\bexample medication list\b/i);
  assert.match(first.text, /The LSW will review goals for improved socialization/);
  assert.doesNotMatch(first.text, /(?:^|\n)(?:Safety hazards|History of suicide attempts|Current stressors):/m);
});
test("source selection permits verified fact organization", () => {
  assert.equal(synthesis.validateAssessmentSynthesis(sourceNote, facts).valid, true);
  assert.equal(synthesis.scanAssessmentSynthesis(sourceNote, facts).length, 0);
});
test("AI-authored professional narrative passes only when every clause matches a verified source-bound paraphrase", () => {
  assert.equal(synthesis.validateAssessmentSynthesis(verifiedNote, facts).valid, true);
  const rendered = synthesis.renderAssessmentSynthesis(verifiedNote, facts);
  assert.notEqual(rendered, fallback.buildDeterministicAssessment(facts).text);
  assert.doesNotMatch(rendered, /(?:^|\n)(?:Current residence|Lives with|Ambulation|Current stressors):/m);
  assert.match(rendered, /The LSW will/);
  const altered = structuredClone(verifiedNote);
  altered.blocks[0].text += " The participant has schizophrenia.";
  assert.equal(synthesis.validateAssessmentSynthesis(altered, facts).valid, false);
  const repaired = synthesis.repairVerifiedNarrative(altered, facts);
  assert.ok(repaired);
  assert.equal(synthesis.validateAssessmentSynthesis(repaired, facts).valid, true);
  assert.equal(repaired.blocks[1].text, verifiedNote.blocks[1].text);
});
test("the prior provider fact selection renders cleanly with the revised source-bound prose", () => {
  const paragraphs = [
    ["calculated-age", "living-current-residence", "living-lives-with", "home-visit-household-composition"],
    ["functional-orientation", "functional-memory-concerns", "functional-decision-making", "conditions-medication-management"],
    ["psychosocial-baseline-mood", "psychosocial-mental-health-history", "psychosocial-current-stressors", "psychosocial-social-engagement"],
    ["functional-ambulation", "functional-adl-help", "communication-communication-needs", "medical-history-major-medical-diagnoses"]
  ];
  const sections = [
    ...paragraphs.map((fields) => ["assessment", fields]),
    ["strengths", ["psychosocial-strengths-coping", "home-visit-group-community-supports"]],
    ["needs", ["psychosocial-current-stressors", "goals-social-work-services-needed"]],
    ...["goals-participant-family-goals", "goals-social-work-services-needed", "goals-service-priorities", "quarterly-discharge-supportive-services"]
      .map((field) => ["plan", [field]])
  ];
  const note = { renderMode: "verified-prose", blocks: sections.map(([section, fields]) => {
    const sources = fields.map(byField);
    assert.ok(sources.every(Boolean));
    return { section, sourceFactIds: sources.map((fact) => fact.id),
      text: sources.map((fact) => synthesis.verifiedNarrativeOptions(fact, section)[0]).join(" ") };
  }) };
  assert.equal(synthesis.validateAssessmentSynthesis(note, facts).valid, true);
  assert.equal(synthesis.scanAssessmentSynthesis(note, facts).length, 0);
  const text = synthesis.renderAssessmentSynthesis(note, facts);
  assert.doesNotMatch(text, /\bage:\s*78\b|\bin sample\b|\bsample intake\b|\bthe intake (?:documents|records|identifies)\b/i);
  if (process.env.SHOW_REVISED_ASSESSMENT === "1") console.log(`REVISED_ASSESSMENT_START\n${text}\nREVISED_ASSESSMENT_END`);
});
test("professional wording in a reviewed fact remains intact", () => {
  for (const phrase of ["reported by family", "family reported", "family-reported", "according to family"]) {
    const modified = structuredClone(facts);
    const source = modified.find((fact) => fact.id === byField("psychosocial-baseline-mood").id);
    source.normalizedValue = `${phrase}: mild anxiety when routines change`;
    const note = synthesis.buildSourceLedgerSynthesis(selection, modified);
    assert.ok(note);
    assert.equal(synthesis.validateAssessmentSynthesis(note, modified).valid, true);
  }
});
test("unsupported diagnoses, denial flips, time reversals, unknown conversion, reporter changes, relationships, numbers, completed care and scope text fail", () => {
  for (const text of ["Schizophrenia is diagnosed.", "The participant does not deny anxiety.", "Depression is current.", "Unknown status is now confirmed.", "The participant reported this.", "Her daughter provides care.", "The participant is 52.", "Psychotherapy was completed.", "The assessor prescribed medication."]) {
    const altered = structuredClone(verifiedNote);
    altered.blocks[0].text = text;
    assert.equal(synthesis.validateAssessmentSynthesis(altered, facts).valid, false, text);
  }
});
test("missing sources, screening-to-diagnosis and safety changes fail", () => {
  const missing = structuredClone(verifiedNote); missing.blocks[0].sourceFactIds = ["fact-999"];
  assert.equal(synthesis.validateAssessmentSynthesis(missing, facts).valid, false);
  for (const text of ["Screening establishes dementia.", "No safety risk exists."]) {
    const altered = structuredClone(verifiedNote); altered.blocks[0].text = text;
    assert.equal(synthesis.validateAssessmentSynthesis(altered, facts).valid, false);
  }
});
test("output PHI is detected", () => {
  const altered = structuredClone(verifiedNote); altered.blocks[0].text = "Contact person@example.com.";
  assert.ok(synthesis.scanAssessmentSynthesis(altered, facts).length);
});
test("25-use billing policy and existing prices remain configured", () => {
  const policy = load("lib/assessmentEntitlementPolicy.ts");
  assert.equal(policy.DEFAULT_ASSESSMENT_INCLUDED_QUANTITY, 25);
  assert.equal(policy.DEFAULT_ASSESSMENT_RECURRING_INCLUDED_QUANTITY, 25);
  const stripe = readFileSync(resolve(root, "lib/stripe/server.ts"), "utf8");
  const webhook = readFileSync(resolve(root, "app/api/stripe/webhook/route.ts"), "utf8");
  assert.match(stripe, /STANDARD_ACCESS_UPFRONT_PRICE_CENTS \?\? 48700/);
  assert.match(stripe, /STANDARD_ACCESS_MONTHLY_PRICE_CENTS \?\? 1900/);
  assert.doesNotMatch(webhook, /ensureAssessmentGenerationSubscription/);
  assert.match(webhook, /getStandardAccessPriceIds\(\)\.monthlyPriceId/);
  const migration = readFileSync(resolve(root, "supabase/migrations/20260917_included_psychosocial_assessments.sql"), "utf8");
  assert.match(migration, /v_entitlement_id uuid := '[0-9a-f-]+'/i);
  assert.match(migration, /entitlement_kind = 'initial_purchase'[\s\S]*included_quantity in \(25, 30\)/i);
  assert.match(migration, /v_completed <> 1 or v_reserved <> 0 or v_released <> 1/i);
  assert.match(migration, /update public\.psychosocial_assessment_generation_entitlements\s+set included_quantity = 25\s+where id = v_entitlement_id and included_quantity = 30/i);
  assert.doesNotMatch(migration, /delete\s+from\s+public\.psychosocial_assessment_generation_events/i);
  assert.match(migration, /after insert on public\.psychosocial_assessment_generation_entitlements[\s\S]*for each row/i);
  assert.match(migration, /if new\.included_quantity <> 25 then/i);
  assert.match(migration, /on conflict \(purchase_reference\) do nothing/i);
  assert.match(migration, /entitlement\.included_quantity = 30 and p_included_quantity = 25/i);
  assert.match(migration, /entitlement\.starts_at = p_starts_at[\s\S]*entitlement\.expires_at = p_expires_at/i);
});
test("accepted assessment starts a new print and final-PDF page", () => {
  const css = readFileSync(resolve(root, "app/globals.css"), "utf8");
  const review = readFileSync(resolve(root, "components/ReviewPacket.tsx"), "utf8");
  const pdf = readFileSync(resolve(root, "lib/pdfExport.ts"), "utf8");
  const buttons = readFileSync(resolve(root, "components/ExportButtons.tsx"), "utf8");
  assert.match(css, /break-before:\s*page/);
  assert.match(review, /className="accepted-assessment/);
  assert.match(pdf, /mode === "final" && acceptedAssessment/);
  assert.match(pdf, /function drawAcceptedAssessment[\s\S]*?pdfDoc\.addPage\(pageSize\)/);
  assert.match(buttons, /Download Editable Draft PDF/);
  assert.match(buttons, /Export Final PDF/);
});

let isOwner = false;
let providerMode = "valid";
let calls;
const reset = () => { calls = { provider: 0, reserve: 0, complete: 0, release: 0 }; };
reset();
overrides.set("@/lib/assessmentAccess", {
  requestIsSameOrigin: () => true,
  authorizeAssessmentGeneration: async () => ({ authorized: true, userId: "fixture-user", isOwner, entitlementActivation: { kind: "user", userId: "fixture-user", purchaseReference: "fixture", startsAt: "2026-09-16" } })
});
overrides.set("@/lib/assessmentUsage", {
  getAssessmentGenerationConfig: () => ({ timeoutMs: 42000 }),
  reserveAssessmentGeneration: async () => { calls.reserve++; return { allowed: true, reservationId: "fixture-reservation" }; },
  completeAssessmentGeneration: async () => { calls.complete++; return { includedQuantity: 25, successfulGenerationsUsed: calls.complete, remainingGenerations: 25 - calls.complete, entitlementStartsAt: "2026-09-16", entitlementExpiresAt: "2026-10-16" }; },
  releaseAssessmentGeneration: async () => { calls.release++; }
});
overrides.set("@/lib/assessmentProvider", {
  AssessmentProviderError: class AssessmentProviderError extends Error { constructor(failure) { super(failure); this.failure = failure; } },
  generateAssessmentClaims: async () => {
    calls.provider++;
    if (providerMode === "unavailable") throw new Error("offline simulated provider failure");
    const note = structuredClone(verifiedNote);
    if (providerMode === "invented") note.blocks[0].text = "The participant has schizophrenia.";
    if (providerMode === "missing") note.blocks[0].sourceFactIds = ["fact-999"];
    if (providerMode === "all-invalid") note.blocks.forEach((block) => { block.text = "The participant has schizophrenia."; });
    if (providerMode === "output-phi") note.blocks[0].text = "Contact person@example.com.";
    return note;
  }
});
const route = load("app/api/assessment/generate/route.ts");
async function invoke(body) {
  const response = await route.POST(new Request("http://localhost/api/assessment/generate", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
  }));
  return { status: response.status, body: await response.json() };
}
async function asyncTest(name, fn) { await fn(); passed++; console.log(`PASS ${name}`); }
await asyncTest("built-in route needs zero provider calls and settles one assessment", async () => {
  reset(); const result = await invoke(request);
  assert.equal(result.status, 200);
  assert.equal(result.body.assessmentText, fallback.buildDeterministicAssessment(facts).text);
  assert.deepEqual(calls, { provider: 0, reserve: 1, complete: 1, release: 0 });
});
await asyncTest("Maryland also receives a built-in assessment without AI", async () => {
  reset(); const result = await invoke({ ...request, jurisdiction: "MD" });
  assert.equal(result.status, 200);
  assert.equal(result.body.generationMethod, "deterministic");
  assert.deepEqual(calls, { provider: 0, reserve: 1, complete: 1, release: 0 });
});
await asyncTest("optional AI narrative is displayed and stays within one assessment use", async () => {
  reset(); providerMode = "valid";
  const result = await invoke({ ...request, aiEnhancement: true });
  assert.equal(result.status, 200);
  assert.equal(result.body.generationMethod, "ai");
  assert.equal(result.body.synthesis.blocks[0].text, verifiedNote.blocks[0].text);
  assert.ok(result.body.assessmentText.includes(verifiedNote.blocks[0].text));
  assert.deepEqual(calls, { provider: 1, reserve: 1, complete: 1, release: 0 });
});
await asyncTest("one deterministic repair removes invented AI wording but keeps valid AI prose", async () => {
  reset(); providerMode = "invented";
  const result = await invoke({ ...request, aiEnhancement: true });
  assert.equal(result.status, 200);
  assert.equal(result.body.generationMethod, "ai");
  assert.ok(!result.body.assessmentText.includes("schizophrenia"));
  assert.ok(result.body.assessmentText.includes(verifiedNote.blocks[1].text));
  assert.deepEqual(calls, { provider: 1, reserve: 1, complete: 1, release: 0 });
});
await asyncTest("invalid source or provider failure uses original built-in assessment", async () => {
  for (const mode of ["missing", "all-invalid", "output-phi", "unavailable"]) {
    reset(); providerMode = mode;
    const result = await invoke({ ...request, aiEnhancement: true });
    assert.equal(result.status, 200);
    assert.equal(result.body.generationMethod, "deterministic");
    assert.equal(result.body.assessmentText, fallback.buildDeterministicAssessment(facts).text);
    assert.deepEqual(calls, { provider: 1, reserve: 1, complete: 1, release: 0 });
  }
});
await asyncTest("owner is unlimited and PHI is blocked before provider or quota", async () => {
  reset(); isOwner = true;
  assert.equal((await invoke(request)).status, 200);
  assert.deepEqual(calls, { provider: 0, reserve: 0, complete: 0, release: 0 });
  const phi = structuredClone(request); phi.facts[0].normalizedValue = "person@example.com";
  assert.equal((await invoke({ ...phi, aiEnhancement: true })).status, 422);
  assert.equal(calls.provider, 0);
  isOwner = false;
});
const React = require("react");
let hookIndex = 0;
let hooks = [];
overrides.set("react", { ...React,
  useState(initial) { const index = hookIndex++; if (!(index in hooks)) hooks[index] = initial; return [hooks[index], (value) => { hooks[index] = typeof value === "function" ? value(hooks[index]) : value; }]; },
  useMemo(fn) { return fn(); },
  useRef(initial) { const index = hookIndex++; if (!(index in hooks)) hooks[index] = { current: initial }; return hooks[index]; }
});
overrides.set("@/lib/supabase/browser", { createSupabaseBrowserClient: () => ({ auth: { getSession: async () => ({ data: { session: { access_token: "offline" } } }) } }) });
const { AssessmentWorkflow } = load("components/AssessmentWorkflow.tsx");
function nodes(tree) { if (!tree || typeof tree !== "object") return []; return [tree, ...React.Children.toArray(tree.props?.children).flatMap(nodes)]; }
function label(node) { return React.Children.toArray(node.props?.children).map((part) => typeof part === "string" ? part : label(part)).join(""); }
await asyncTest("review, edit, accept and final PDF retain the full assessment", async () => {
  reset();
  const payload = (await invoke(request)).body;
  hooks = [];
  let accepted;
  const revision = assessment.createAssessmentWorkspace(examplePacket, "NJ", new Date("2026-09-16T12:00:00Z")).localRevisionToken;
  const props = { acceptedAssessment: null, currentRevisionToken: revision, jurisdiction: "NJ", onAccept: (value) => { accepted = value; }, onReturnToIntake: () => {}, packet: examplePacket };
  const render = () => { hookIndex = 0; return AssessmentWorkflow(props); };
  const button = (tree, text) => { const found = nodes(tree).find((node) => node.type === "button" && label(node).includes(text)); assert.ok(found, text); return found; };
  button(render(), "Review Assessment Privacy").props.onClick();
  assert.equal(nodes(render()).filter((node) => node.type === "button" && label(node).includes("Create Psychosocial Assessment")).length, 1);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers.Authorization, "Bearer offline");
    assert.equal(JSON.parse(options.body).aiEnhancement, false);
    return Response.json(payload);
  };
  try {
    await button(render(), "Privacy Review Complete").props.onClick();
    const tree = render();
    const editor = nodes(tree).find((node) => node.type === "textarea");
    assert.ok(editor); assert.equal(editor.props.value, payload.assessmentText);
    editor.props.onChange({ target: { value: payload.assessmentText + "\n\nClinician edit: care plan reviewed." } });
    button(render(), "Accept Assessment").props.onClick();
    assert.ok(accepted?.clinicianEdited);
    const pdf = require("pdf-lib");
    const drawn = [];
    const originalDraw = pdf.PDFPage.prototype.drawText;
    pdf.PDFPage.prototype.drawText = function(text, options) { drawn.push(text); return originalDraw.call(this, text, options); };
    try {
      const { buildPacketPdf } = load("lib/pdfExport.ts");
      const bytes = await buildPacketPdf(examplePacket, "final", accepted);
      assert.ok(bytes.length > 1000);
      assert.ok(drawn.join(" ").includes("Clinician edit: care plan reviewed."));
    } finally { pdf.PDFPage.prototype.drawText = originalDraw; }
  } finally { globalThis.fetch = originalFetch; }
});
await asyncTest("clinician sees validated AI-authored narrative and can accept it", async () => {
  reset(); providerMode = "valid";
  const payload = (await invoke({ ...request, aiEnhancement: true })).body;
  hooks = [];
  let accepted;
  const revision = assessment.createAssessmentWorkspace(examplePacket, "NJ", new Date("2026-09-16T12:00:00Z")).localRevisionToken;
  const props = { acceptedAssessment: null, currentRevisionToken: revision, jurisdiction: "NJ", onAccept: (value) => { accepted = value; }, onReturnToIntake: () => {}, packet: examplePacket };
  const render = () => { hookIndex = 0; return AssessmentWorkflow(props); };
  nodes(render()).find((node) => node.type === "button" && label(node).includes("Review Assessment Privacy")).props.onClick();
  let tree = render();
  nodes(tree).find((node) => node.type === "input" && node.props.type === "checkbox").props.onChange({ target: { checked: true } });
  tree = render();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    assert.equal(JSON.parse(options.body).aiEnhancement, true);
    return Response.json(payload);
  };
  try {
    await nodes(tree).find((node) => node.type === "button" && label(node).includes("Privacy Review Complete")).props.onClick();
    tree = render();
    assert.equal(nodes(tree).find((node) => node.type === "textarea").props.value, payload.assessmentText);
    assert.ok(payload.assessmentText.includes(verifiedNote.blocks[0].text));
    assert.ok(require("react-dom/server").renderToStaticMarkup(tree).includes("AI-enhanced clinical narrative passed"));
    nodes(tree).find((node) => node.type === "button" && label(node).includes("Accept Assessment")).props.onClick();
    assert.equal(accepted.assessmentText, payload.assessmentText);
  } finally { globalThis.fetch = originalFetch; }
});
await asyncTest("browser rejects altered AI text before clinician review", async () => {
  reset(); providerMode = "valid";
  const payload = (await invoke({ ...request, aiEnhancement: true })).body;
  hooks = [];
  const revision = assessment.createAssessmentWorkspace(examplePacket, "NJ", new Date("2026-09-16T12:00:00Z")).localRevisionToken;
  const props = { acceptedAssessment: null, currentRevisionToken: revision, jurisdiction: "NJ", onAccept: () => { throw new Error("unsafe accept"); }, onReturnToIntake: () => {}, packet: examplePacket };
  const render = () => { hookIndex = 0; return AssessmentWorkflow(props); };
  nodes(render()).find((node) => node.type === "button" && label(node).includes("Review Assessment Privacy")).props.onClick();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ ...payload, assessmentText: payload.assessmentText + " Invented diagnosis." });
  try {
    await nodes(render()).find((node) => node.type === "button" && label(node).includes("Privacy Review Complete")).props.onClick();
    assert.equal(nodes(render()).some((node) => node.type === "textarea"), false);
  } finally { globalThis.fetch = originalFetch; }
});
await asyncTest("real provider adapter accepts AI prose from one mocked local response", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "offline-test-key";
  let providerCalls = 0;
  globalThis.fetch = async (url, options) => {
    providerCalls++;
    assert.equal(url, "https://api.openai.com/v1/responses");
    const body = JSON.parse(options.body);
    assert.equal(body.store, false);
    assert.ok(JSON.parse(body.input[0].content[0].text).allowedStatements.length);
    return Response.json({ status: "completed", output: [{ content: [{ type: "output_text", text: JSON.stringify(verifiedNote) }] }] });
  };
  try {
    const actualProvider = load("lib/assessmentProvider.ts");
    const note = await actualProvider.generateAssessmentClaims(request, undefined, true, false, false, true);
    assert.equal(note.renderMode, "verified-prose");
    assert.equal(note.blocks[0].text, verifiedNote.blocks[0].text);
    assert.equal(providerCalls, 1);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalKey;
  }
});
console.log(`${passed} active offline assessment checks passed. Real provider calls: 0.`);
