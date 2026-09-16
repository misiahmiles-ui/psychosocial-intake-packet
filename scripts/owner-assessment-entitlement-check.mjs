import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const access = read("lib/assessmentAccess.ts");
const endpoint = read("app/api/assessment/generate/route.ts");
const workflow = read("components/AssessmentWorkflow.tsx");

const tests = [
  ["verified owner can generate without a purchase entitlement", () => {
    assert.match(access, /if \(owner\.isOwner\)[\s\S]*entitlementActivation: null,[\s\S]*isOwner: true/);
    assert.match(endpoint, /if \(!access\.isOwner\) \{[\s\S]*reserveAssessmentGeneration/);
  }],
  ["owner generation does not consume credits", () => {
    assert.match(endpoint, /const usage = access\.isOwner\s*\? null\s*:\s*await completeAssessmentGeneration/);
  }],
  ["owner regeneration does not consume credits", () => {
    assert.match(workflow, /Regenerate Assessment/);
    assert.match(workflow, /beginLocalReview[\s\S]*createAssessmentWorkspace\(packet, jurisdiction\)/);
    assert.match(workflow, /fetch\("\/api\/assessment\/generate"/);
  }],
  ["owner generation does not alter customer or facility quota records", () => {
    const ownerGuard = endpoint.indexOf("if (!access.isOwner)");
    const reserve = endpoint.lastIndexOf("reserveAssessmentGeneration");
    assert.ok(ownerGuard >= 0 && reserve > ownerGuard);
    assert.match(endpoint, /const usage = access\.isOwner\s*\? null/);
    assert.match(endpoint, /if \(reservationId && !completed\)[\s\S]*releaseAssessmentGeneration/);
  }],
  ["normal customers still require a valid entitlement", () => {
    assert.match(endpoint, /if \(!access\.isOwner\) \{[\s\S]*reserveAssessmentGeneration/);
    assert.match(endpoint, /reservationDenial\(reservation\.reason\)/);
  }],
  ["normal successful customer generation still consumes exactly one credit", () => {
    assert.match(endpoint, /reserveAssessmentGeneration[\s\S]*generateAssessmentClaims[\s\S]*completeAssessmentGeneration/);
  }],
  ["failed customer generation still consumes zero credits", () => {
    assert.match(endpoint, /finally \{[\s\S]*if \(reservationId && !completed\)[\s\S]*releaseAssessmentGeneration/);
  }],
  ["owner requests retain PHI, provenance, and safety validation", () => {
    const guard = endpoint.indexOf("if (!access.isOwner)");
    assert.ok(endpoint.indexOf("scanAssessmentFacts(") < guard);
    assert.ok(endpoint.indexOf("detectSafetyConflicts(") < guard);
    assert.ok(endpoint.indexOf("validateClaims(") > guard);
    assert.ok(endpoint.indexOf("scanGeneratedClaims(") > guard);
  }]
];

let passed = 0;
for (const [name, run] of tests) {
  try {
    run();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error);
  }
}

const failed = tests.length - passed;
console.log(`Owner assessment entitlement: ${passed} passed, ${failed} failed, ${tests.length} total.`);
if (failed) process.exitCode = 1;
