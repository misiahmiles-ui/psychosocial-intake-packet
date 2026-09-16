import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const filename = resolve(import.meta.dirname, "../lib/assessmentValidationTelemetry.ts");
const compiled = ts.transpileModule(readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }, fileName: filename
}).outputText;
const module = { exports: {} };
new Function("require", "module", "exports", "__filename", "__dirname", compiled)(
  (specifier) => specifier === "server-only" ? {} : require(specifier),
  module, module.exports, filename, dirname(filename)
);

const { classifyAssessmentValidationIssues, recordAssessmentValidationFailure } = module.exports;
const marker = "PRIVATE_CLINICAL_CONTENT_MUST_NOT_APPEAR";
const issues = [
  "Claim 1 introduces unsupported numeric information.",
  "Claim 2 is not semantically supported by its cited facts.",
  `Claim 3 contains unexpected field ${marker}.`
];
assert.deepEqual(classifyAssessmentValidationIssues(issues), {
  unsupported_numeric: 1, low_source_overlap: 1, invalid_shape: 1
});
let logged = "";
const originalInfo = console.info;
try {
  console.info = (...args) => { logged = args.join(" "); };
  recordAssessmentValidationFailure(issues, 3);
} finally {
  console.info = originalInfo;
}
assert.match(logged, /assessment_validation_failure/);
assert.doesNotMatch(logged, new RegExp(marker));
assert.doesNotMatch(logged, /Claim 1|Claim 2|Claim 3/);
console.log("PASS validation telemetry contains fixed categories and counts only");
