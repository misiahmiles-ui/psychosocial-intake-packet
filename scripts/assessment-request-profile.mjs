import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = resolve(import.meta.dirname, "..");

function loadTypeScript(relativePath, modules = {}) {
  const filename = resolve(root, relativePath);
  const output = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    },
    fileName: filename
  }).outputText;
  const loaded = { exports: {} };
  const localRequire = (specifier) => specifier in modules ? modules[specifier] : require(specifier);
  new Function("require", "module", "exports", "__filename", "__dirname", output)(
    localRequire,
    loaded,
    loaded.exports,
    filename,
    dirname(filename)
  );
  return loaded.exports;
}

const defaults = loadTypeScript("lib/defaultValues.ts");
const example = loadTypeScript("lib/examplePacket.ts", { "./defaultValues": defaults });
const assessment = loadTypeScript("lib/assessment.ts", {
  "@/types/assessment": loadTypeScript("types/assessment.ts")
});
const draft = loadTypeScript("lib/assessmentProviderDraft.ts", {
  "@/types/assessment": loadTypeScript("types/assessment.ts")
});
const packet = structuredClone(example.examplePacket);
packet.mentalStatus.responses[0].notes = "Correctly identified Harbor Wellness Adult Day Health Center.";

const workspace = assessment.createAssessmentWorkspace(packet, "NJ");
const sourceFacts = workspace.facts;
const inputBytes = Buffer.byteLength(JSON.stringify({ sourceFacts }));
const valueBytes = sourceFacts.reduce((sum, fact) => sum + Buffer.byteLength(fact.normalizedValue), 0);
const semanticBytes = sourceFacts.reduce((sum, fact) => sum + Buffer.byteLength(JSON.stringify(fact.semantics)), 0);
const sparseFacts = draft.compactFactsForProvider(sourceFacts);
const sparseInputBytes = Buffer.byteLength(JSON.stringify({ sourceFacts: sparseFacts }));
const compactFacts = sourceFacts.map((fact) => ({
  i: fact.id,
  d: fact.domain,
  f: fact.sourceField,
  y: fact.sourceType,
  t: fact.temporalStatus,
  v: fact.normalizedValue,
  s: Object.fromEntries(Object.entries(fact.semantics).filter(([, value]) => value !== "not_applicable"))
}));
const compactInputBytes = Buffer.byteLength(JSON.stringify({ sourceFacts: compactFacts }));
const sampleClaims = sourceFacts.slice(0, 18).map((fact, index) => ({
  id: `claim-${index + 1}`,
  section: "participant_context",
  text: fact.normalizedValue,
  sourceFactIds: [fact.id],
  polarity: fact.semantics.polarity,
  temporalStatus: fact.temporalStatus,
  sourceType: fact.sourceType,
  diagnosisStatus: fact.semantics.diagnosisStatus,
  relationshipStatus: fact.semantics.relationshipStatus,
  riskStatus: fact.semantics.riskStatus,
  functionalStatus: fact.semantics.functionalStatus,
  substanceUseStatus: fact.semantics.substanceUseStatus,
  caregiverInvolvement: fact.semantics.caregiverInvolvement,
  serviceNeed: fact.semantics.serviceNeed
}));
const sampleFullOutputBytes = Buffer.byteLength(JSON.stringify({ claims: sampleClaims }));
const sampleCompactOutputBytes = Buffer.byteLength(JSON.stringify({
  claims: sampleClaims.map(({ section, text, sourceFactIds }) => ({ section, text, sourceFactIds }))
}));
const compactRoundTrip = draft.hydrateProviderClaims(
  sampleClaims.map(({ section, text, sourceFactIds }) => ({ section, text, sourceFactIds })),
  sourceFacts
);
if (!compactRoundTrip || compactRoundTrip.length !== sampleClaims.length) throw new Error("Compact claim round-trip failed");

// This profile prints aggregate byte counts only, never fact or clinical text.
console.log(JSON.stringify({
  factCount: sourceFacts.length,
  sourceInputBytes: inputBytes,
  sparseInputBytes,
  compactInputBytes,
  sampleFullOutputBytes,
  sampleCompactOutputBytes,
  normalizedValueBytes: valueBytes,
  repeatedSemanticBytes: semanticBytes,
  metadataAndJsonBytes: inputBytes - valueBytes
}, null, 2));
