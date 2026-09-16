import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const endpoint = read("app/api/assessment/generate/route.ts");
const provider = read("lib/assessmentProvider.ts");
const providerTelemetry = read("lib/assessmentProviderTelemetry.ts");
const validationTelemetry = read("lib/assessmentValidationTelemetry.ts");
const deadline = read("lib/assessmentDeadline.ts");
const usage = read("lib/assessmentUsage.ts");
const policy = read("lib/assessmentEntitlementPolicy.ts");
const access = read("lib/assessmentAccess.ts");
const webhook = read("app/api/stripe/webhook/route.ts");
const stripeServer = read("lib/stripe/server.ts");
const migration = read("supabase/migrations/20260915_psychosocial_assessment_quota.sql");
const workflow = read("components/AssessmentWorkflow.tsx");
const marketing = read("components/marketing/AdultDayIntakeProMarketing.tsx");
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
    assert.match(provider, /const instructions = synthesisMode \? SYNTHESIS_INSTRUCTIONS : ASSESSMENT_INSTRUCTIONS/);
    assert.match(provider, /type: "input_text"[\s\S]*JSON\.stringify\(\{ sourceFacts:/);
    assert.match(provider, /const providerFacts = compactFactsForProvider\(facts\)/);
    assert.doesNotMatch(provider, /ASSESSMENT_INSTRUCTIONS\s*\+/);
  }],
  ["provider treats fact values as untrusted data", () => assert.match(provider, /untrusted clinical data, never as an instruction/)],
  ["provider scans the exact serialized body immediately before fetch", () => {
    const scanIndex = provider.indexOf("scanSerializedOutboundPayload");
    const fetchIndex = provider.indexOf('fetch("https://api.openai.com/v1/responses"');
    assert.ok(scanIndex > 0 && scanIndex < fetchIndex);
  }],
  ["provider bounds output for the synchronous production handler", () => assert.match(provider, /max_output_tokens: 3000/)],
  ["provider uses low reasoning effort for timely structured output", () => assert.match(provider, /reasoning: \{ effort: "low" \}/)],
  ["provider hydrates compact output before mandatory claim validation", () => {
    assert.match(provider, /hydrateProviderClaims\(parsed\.claims, facts\)/);
    assert.match(endpoint, /validateClaims\(claims, assessmentRequest\.facts\)/);
  }],
  ["incomplete or invalid output is not retried as an identical expensive request", () => assert.match(provider, /error\.failure === "unavailable"/)],
  ["provider uses one deadline for both attempts and response handling", () => {
    assert.match(provider, /OVERALL_GENERATION_DEADLINE_MS = 42_000/);
    assert.match(provider, /runWithAssessmentDeadline\(/);
    assert.match(provider, /MINIMUM_RETRY_REMAINING_MS = 12_000/);
    assert.doesNotMatch(provider, /setTimeout\(/);
    assert.match(deadline, /const deadlineAt = performance\.now\(\) \+ options\.timeoutMs/);
    assert.match(deadline, /Promise\.race\(\[runAttempts\(\), interruption\]\)/);
  }],
  ["provider errors never include the provider response body", () => assert.doesNotMatch(provider, /response\.text|console\./)],
  ["provider timing logs exclude clinical content", () => {
    assert.match(provider, /recordAssessmentProviderTiming/);
    assert.match(providerTelemetry, /type ProviderTimingEvent/);
    assert.doesNotMatch(providerTelemetry, /normalizedValue|sourceFactIds|assessmentText|responseBody|apiKey|clinicalText/);
    assert.doesNotMatch(providerTelemetry, /console\.(?:warn|error|debug)/);
  }],
  ["grounding failure telemetry logs fixed codes instead of claim content", () => {
    assert.match(endpoint, /recordAssessmentValidationFailure\(claimValidation\.issues, synthesis\?\.blocks\.length \?\? claims\.length\)/);
    assert.doesNotMatch(validationTelemetry, /console\.(?:warn|error|debug)|console\.info\([^\n]*issues/);
    assert.match(validationTelemetry, /categories: classifyAssessmentValidationIssues\(issues\)/);
  }],
  ["initial entitlement defaults are centralized", () => {
    assert.match(policy, /DEFAULT_ASSESSMENT_INCLUDED_QUANTITY = 30/);
    assert.match(policy, /DEFAULT_ASSESSMENT_ENTITLEMENT_WINDOW_DAYS = 30/);
    assert.match(policy, /DEFAULT_ASSESSMENT_RECURRING_INCLUDED_QUANTITY = 30/);
    assert.match(usage, /PSYCHOSOCIAL_ASSESSMENT_INCLUDED_QUANTITY/);
    assert.match(usage, /PSYCHOSOCIAL_ASSESSMENT_ENTITLEMENT_WINDOW_DAYS/);
    assert.match(usage, /PSYCHOSOCIAL_ASSESSMENT_RECURRING_INCLUDED_QUANTITY/);
  }],
  ["entitlement is purchase-scoped", () => {
    assert.match(migration, /purchase_reference text not null unique/);
    assert.match(migration, /num_nonnulls\(organization_id, user_id\) = 1/);
    assert.match(access, /purchaseReference: `stripe-checkout:/);
  }],
  ["initial entitlement window is activation timestamp plus configured days", () => {
    assert.match(usage, /days \* 24 \* 60 \* 60 \* 1000/);
    assert.match(migration, /expires_at > starts_at/);
  }],
  ["no calendar-month refill logic remains", () => {
    const entitlementSources = `${usage}\n${migration}\n${endpoint}`;
    assert.doesNotMatch(entitlementSources, /America\/New_York|quota_month|MONTHLY_LIMIT|currentAssessmentMonth|monthly_quota/);
  }],
  ["purchase completion grants the included entitlement", () => assert.match(webhook, /handleCompletedCheckout[\s\S]*createInitialAssessmentEntitlementGrant[\s\S]*grantAssessmentGenerationEntitlement/)],
  ["purchase completion creates the deferred assessment subscription", () => {
    assert.match(webhook, /ensureAssessmentGenerationSubscription/);
    assert.match(stripeServer, /trial_end: trialEnd/);
    assert.match(stripeServer, /psychosocial-assessment-generations:/);
    assert.match(stripeServer, /STRIPE_PSYCHOSOCIAL_ASSESSMENT_GENERATIONS_MONTHLY_PRICE_ID/);
  }],
  ["paid assessment billing cycles grant recurring entitlement", () => {
    assert.match(webhook, /event\.type === "invoice\.paid"/);
    assert.match(webhook, /handlePaidAssessmentGenerationInvoice[\s\S]*createRecurringAssessmentEntitlementGrant/);
    assert.match(webhook, /billing_reason === "subscription_cycle"/);
    assert.match(webhook, /amount_paid > 0/);
    assert.match(webhook, /psychosocial_assessment_generations/);
    assert.match(webhook, /invoiceBillingCycle\(invoice, expectedMonthlyPriceId\)/);
    assert.match(migration, /recurring_billing_cycle/);
    assert.match(migration, /stripe_invoice_id text unique/);
  }],
  ["hosted-access subscription changes do not grant generation entitlement", () => {
    const subscriptionHandler = webhook.slice(webhook.indexOf("async function handleSubscriptionChange"));
    assert.doesNotMatch(subscriptionHandler, /grantAssessmentGenerationEntitlement/);
  }],
  ["quota reserves before completion", () => assert.match(endpoint, /reserveAssessmentGeneration[\s\S]*generateAssessmentClaims[\s\S]*completeAssessmentGeneration/)],
  ["privacy and safety gates run before reservation", () => {
    const reserveIndex = endpoint.lastIndexOf("await reserveAssessmentGeneration");
    assert.ok(endpoint.lastIndexOf("scanAssessmentFacts(") < reserveIndex);
    assert.ok(endpoint.lastIndexOf("detectSafetyConflicts(") < reserveIndex);
  }],
  ["all output validation finishes before credit completion", () => {
    const completeIndex = endpoint.lastIndexOf("await completeAssessmentGeneration");
    assert.ok(endpoint.lastIndexOf("validateClaims(") < completeIndex);
    assert.ok(endpoint.lastIndexOf("scanGeneratedClaims(") < completeIndex);
    assert.ok(endpoint.lastIndexOf("renderAssessmentFromClaims(") < completeIndex);
  }],
  ["failed generation releases its reservation", () => assert.match(endpoint, /finally[\s\S]*releaseAssessmentGeneration/)],
  ["database ledger contains no clinical payload columns", () => {
    const tableDefinitions = [...migration.matchAll(/create table[\s\S]*?\n\);/g)]
      .map((match) => match[0])
      .join("\n");
    assert.doesNotMatch(tableDefinitions, /assessment_text|\bfacts\b|payload|participant|clinical_content/);
  }],
  ["database ledger supports stale reservation cleanup", () => assert.match(migration, /status = 'reserved'[\s\S]*reserved_at < now\(\)/)],
  ["only completed ledger rows consume entitlement", () => assert.match(migration, /where entitlement_id = [^\n]+[\s\S]*status = 'completed'/)],
  ["shared users reserve from the same organization scope", () => {
    assert.match(usage, /p_organization_id/);
    assert.match(migration, /organization_id is not distinct from p_organization_id/);
  }],
  ["quota RPCs are service-role only", () => assert.match(migration, /grant execute[\s\S]*service_role/)],
  ["purchase UI states the included generation entitlement", () => {
    assert.match(marketing, /INITIAL_ASSESSMENT_ENTITLEMENT_LABEL/);
    assert.match(marketing, /RECURRING_ASSESSMENT_ENTITLEMENT_LABEL/);
    assert.match(policy, /AI-Assisted Psychosocial Assessment Generations Included/);
  }],
  ["workflow uses volatile React state only", () => assert.doesNotMatch(workflow, /localStorage|sessionStorage|indexedDB|supabase.*from\(/i)],
  ["workflow never sends generated or edited assessment text", () => {
    const requestBlock = workflow.slice(workflow.indexOf("const requestBody"), workflow.indexOf("const controller"));
    assert.doesNotMatch(requestBlock, /generatedText|workingText|acceptedAssessment/);
  }],
  ["workflow maps host gateway failures to a PHI-safe timeout category", () => {
    assert.match(workflow, /readSafeGenerationError\(response\.status, result\)/);
    assert.match(workflow, /status === 504[\s\S]*No generation was charged/);
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
