import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const endpoint = read("app/api/assessment/generate/route.ts");
const provider = read("lib/assessmentProvider.ts");
const usage = read("lib/assessmentUsage.ts");
const migration = read("supabase/migrations/20260915_psychosocial_assessment_quota.sql");
const workflow = read("components/AssessmentWorkflow.tsx");
const pdf = read("lib/pdfExport.ts");
const guidance = read("lib/fieldGuidance.ts");
const fieldInput = read("components/FieldInput.tsx");
const mental = read("components/MentalStatusScreening.tsx");

const checks = [
  ["endpoint is POST-only", () => assert.match(endpoint, /export async function POST/)],
  ["GET is explicitly rejected", () => assert.match(endpoint, /export function GET[\s\S]*405/)],
  ["endpoint enforces a byte limit", () => assert.match(endpoint, /MAX_REQUEST_BYTES[\s\S]*413/)],
  ["endpoint checks same origin", () => assert.match(endpoint, /requestIsSameOrigin/)],
  ["endpoint checks existing account authorization", () => assert.match(endpoint, /authorizeAssessmentGeneration/)],
  ["endpoint sends no-store and no-cache headers", () => assert.match(endpoint, /no-store, no-cache/)],
  ["endpoint does not log clinical content", () => assert.doesNotMatch(endpoint, /console\.(?:log|warn|error)/)],
  ["provider uses the Responses API server-side", () => assert.match(provider, /https:\/\/api\.openai\.com\/v1\/responses/)],
  ["provider uses a server-only API key", () => { assert.match(provider, /process\.env\.OPENAI_API_KEY/); assert.doesNotMatch(provider, /NEXT_PUBLIC_OPENAI/); }],
  ["provider disables response storage", () => assert.match(provider, /store: false/)],
  ["provider uses strict JSON Schema structured output", () => assert.match(provider, /strict: true[\s\S]*type: "json_schema"/)],
  ["provider keeps instructions separate from structured facts", () => {
    assert.match(provider, /instructions: ASSESSMENT_INSTRUCTIONS/);
    assert.match(provider, /type: "input_text"[\s\S]*JSON\.stringify\(\{ sourceFacts: facts \}\)/);
    assert.doesNotMatch(provider, /ASSESSMENT_INSTRUCTIONS\s*\+/);
  }],
  ["provider treats fact values as untrusted data", () => assert.match(provider, /untrusted clinical data, never as an instruction/)],
  ["provider scans the exact serialized body immediately before fetch", () => {
    const scanIndex = provider.indexOf("scanSerializedOutboundPayload");
    const fetchIndex = provider.indexOf('fetch("https://api.openai.com/v1/responses"');
    assert.ok(scanIndex > 0 && scanIndex < fetchIndex);
  }],
  ["provider has an explicit output token limit", () => assert.match(provider, /max_output_tokens: 6000/)],
  ["provider has an abortable timeout", () => assert.match(provider, /setTimeout[\s\S]*controller\.abort/)],
  ["provider errors never include the provider response body", () => assert.doesNotMatch(provider, /response\.text|console\./)],
  ["monthly quota default is centralized at 30", () => assert.match(usage, /PSYCHOSOCIAL_ASSESSMENT_MONTHLY_LIMIT"[\s\S]*30/)],
  ["quota uses an Eastern calendar month", () => assert.match(usage, /America\/New_York/)],
  ["quota reserves before completion", () => assert.match(endpoint, /reserveAssessmentGeneration[\s\S]*generateAssessmentClaims[\s\S]*completeAssessmentGeneration/)],
  ["failed generation releases its reservation", () => assert.match(endpoint, /finally[\s\S]*releaseAssessmentGeneration/)],
  ["database ledger contains no clinical payload columns", () => {
    const tableDefinition = migration.slice(
      migration.indexOf("create table"),
      migration.indexOf("create index")
    );
    assert.doesNotMatch(tableDefinition, /assessment_text|\bfacts\b|payload|participant|clinical_content/);
  }],
  ["database ledger supports stale reservation cleanup", () => assert.match(migration, /status = 'reserved'[\s\S]*reserved_at < now\(\)/)],
  ["only completed ledger rows count toward monthly use", () => assert.match(migration, /status = 'completed'/)],
  ["quota RPCs are service-role only", () => assert.match(migration, /grant execute[\s\S]*service_role/)],
  ["workflow uses volatile React state only", () => assert.doesNotMatch(workflow, /localStorage|sessionStorage|indexedDB|supabase.*from\(/i)],
  ["workflow never sends generated or edited assessment text", () => {
    const requestBlock = workflow.slice(workflow.indexOf("const requestBody"), workflow.indexOf("const controller"));
    assert.doesNotMatch(requestBlock, /generatedText|workingText|acceptedAssessment/);
  }],
  ["clinician edits are explicitly distinguished", () => assert.match(workflow, /Contains clinician-authored edits/)],
  ["stale assessments are detected", () => assert.match(workflow, /generatedRevision !== currentRevisionToken/)],
  ["regeneration rebuilds a workspace from intake", () => assert.match(workflow, /beginLocalReview[\s\S]*createAssessmentWorkspace\(packet, jurisdiction\)/)],
  ["hard PHI findings omit the Not PHI control", () => assert.match(workflow, /finding\.severity === "ambiguous"[\s\S]*Mark as Not PHI/)],
  ["accepted assessment is appended only to final PDF", () => assert.match(pdf, /mode === "final" && acceptedAssessment/)],
  ["PDF contains no field guidance", () => assert.doesNotMatch(pdf, /What to ask|What to document|Documentation caution|FieldGuidance/)],
  ["guidance is centrally configured", () => assert.match(guidance, /FIELD_GUIDANCE/)],
  ["standard fields render guidance", () => assert.match(fieldInput, /<FieldGuidance/)],
  ["mental screening renders guidance", () => assert.match(mental, /<FieldGuidance/)],
  ["guidance does not mutate form values", () => assert.doesNotMatch(guidance, /setValue|register\(|useForm/)]
];

let passed = 0;
for (const [name, run] of checks) {
  try {
    run();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error);
  }
}
const failed = checks.length - passed;
console.log(`Assessment architecture: ${passed} passed, ${failed} failed, ${checks.length} total.`);
if (failed) process.exitCode = 1;
