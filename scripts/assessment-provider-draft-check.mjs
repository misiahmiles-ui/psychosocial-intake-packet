import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = resolve(import.meta.dirname, "..");

function loadTypeScript(relativePath, modules = {}) {
  const filename = resolve(root, relativePath);
  const output = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "module", "exports", "__filename", "__dirname", output)(
    (specifier) => specifier in modules ? modules[specifier] : require(specifier),
    loaded, loaded.exports, filename, dirname(filename)
  );
  return loaded.exports;
}

const types = loadTypeScript("types/assessment.ts");
const assessment = loadTypeScript("lib/assessment.ts", { "@/types/assessment": types });
const draft = loadTypeScript("lib/assessmentProviderDraft.ts", { "@/types/assessment": types });

const semantics = {
  polarity: "denied", diagnosisStatus: "not_applicable", relationshipStatus: "not_applicable",
  riskStatus: "denied", functionalStatus: "not_applicable", substanceUseStatus: "not_applicable",
  caregiverInvolvement: "not_applicable", serviceNeed: "not_applicable"
};
const facts = [{
  id: "fact-001", domain: "safety", sourceStep: "safety", sourceField: "riskOfHarm",
  sourceType: "participant_report", temporalStatus: "current",
  normalizedValue: "No current risk of harm to self or others reported.", semantics
}, {
  id: "fact-002", domain: "cognitive_screening", sourceStep: "screening", sourceField: "placeName",
  sourceType: "screening_result", temporalStatus: "current",
  normalizedValue: "Correctly identified the program setting.",
  semantics: { ...semantics, polarity: "affirmed", riskStatus: "not_applicable", diagnosisStatus: "screening_finding" }
}];

const compact = draft.compactFactsForProvider(facts);
assert.equal(compact[0].normalizedValue, facts[0].normalizedValue);
assert.equal(compact[1].normalizedValue, facts[1].normalizedValue);
assert.equal(compact[0].sourceField, facts[0].sourceField);
assert.equal(compact[0].semantics.riskStatus, "denied");
assert.ok(!("sourceStep" in compact[0]));
assert.ok(!("diagnosisStatus" in compact[0].semantics));
assert.ok(Buffer.byteLength(JSON.stringify(compact)) < Buffer.byteLength(JSON.stringify(facts)));
console.log("PASS provider input preserves source values while omitting redundant metadata");

const claims = draft.hydrateProviderClaims([{
  section: "safety", text: "No current risk of harm to self or others reported.", sourceFactIds: ["fact-001"]
}, {
  section: "functional_cognitive", text: "Correctly identified the program setting.", sourceFactIds: ["fact-002"]
}], facts);
assert.ok(claims);
assert.equal(claims[0].id, "claim-1");
assert.equal(claims[0].riskStatus, "denied");
assert.equal(claims[0].polarity, "denied");
assert.equal(claims[1].diagnosisStatus, "screening_finding");
assert.equal(assessment.validateClaims(claims, facts).valid, true);
assert.equal(assessment.scanGeneratedClaims(claims).length, 0);
console.log("PASS compact output receives source-derived semantics and passes unchanged grounding and PHI gates");

const mixed = draft.hydrateProviderClaims([{
  section: "safety", text: "No current risk of harm to self or others reported.",
  sourceFactIds: ["fact-001", "fact-002"]
}], facts);
assert.equal(mixed[0].sourceType, "mixed");
assert.equal(mixed[0].riskStatus, "denied");
assert.equal(assessment.validateClaims(mixed, facts).valid, true);
console.log("PASS mixed attribution is derived from cited source types");

for (const bad of [
  [{ section: "safety", text: "Unsupported", sourceFactIds: ["fact-999"] }],
  [{ section: "safety", text: "Unsupported", sourceFactIds: [] }],
  [{ section: "safety", text: "Unsupported", sourceFactIds: ["fact-001"], riskStatus: "present" }]
]) assert.equal(draft.hydrateProviderClaims(bad, facts), null);
console.log("PASS missing and fabricated citations or metadata are rejected");
