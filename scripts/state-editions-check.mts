import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeAuthorizedJurisdictions } from "../lib/access/psychosocialJurisdictions.ts";

assert.deepEqual(
  normalizeAuthorizedJurisdictions(undefined, false),
  ["NJ"],
  "Legacy access without jurisdiction must remain New Jersey."
);
assert.deepEqual(normalizeAuthorizedJurisdictions("MD", false), ["MD"]);
assert.deepEqual(normalizeAuthorizedJurisdictions(["NJ", "MD"], false), [
  "NJ",
  "MD"
]);
assert.deepEqual(normalizeAuthorizedJurisdictions(undefined, true), [
  "NJ",
  "MD"
]);

const baseline = readFileSync("lib/sections.ts", "utf8");
const editions = readFileSync("lib/psychosocialEditions.ts", "utf8");
const intakeApp = readFileSync("components/IntakeApp.tsx", "utf8");
const review = readFileSync("components/ReviewPacket.tsx", "utf8");
const pdf = readFileSync("lib/pdfExport.ts", "utf8");
const access = readFileSync("app/api/access/status/route.ts", "utf8");

assert.equal((baseline.match(/\n\s+id: "/g) ?? []).length, 18);
assert.equal(baseline.includes("Maryland"), false);
assert.match(editions, /id: "maryland-admission"/);
assert.match(editions, /within 45 days before admission/);
assert.match(editions, /not later than 120 days/);
assert.match(editions, /within 7 calendar days/);
assert.match(editions, /at least semiannually/);
assert.doesNotMatch(editions, /ADCAPS|registered nurse/i);
assert.match(editions, /LBSW/);
assert.match(editions, /LMSW/);
assert.match(editions, /LCSW-C/);
assert.match(intakeApp, /getIntakeSteps\(activeJurisdiction\)/);
assert.match(review, /getIntakeSteps\(jurisdiction\)/);
assert.match(pdf, /getIntakeSteps\(jurisdiction\)/);
assert.match(access, /psychosocialJurisdictions/);

const newWorkflowSource = [editions, intakeApp, review, pdf, access].join("\n");
for (const prohibited of [
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "document.cookie"
]) {
  assert.equal(newWorkflowSource.includes(prohibited), false, prohibited);
}

console.log("PASS New Jersey baseline remains 18 steps with no Maryland content");
console.log("PASS Maryland edition is conditional and keeps RN-owned ADCAPS tracking out of psychosocial");
console.log("PASS legacy and state-specific access resolution");
console.log("PASS review and PDF export select the packet jurisdiction");
console.log("PASS no browser persistence was introduced");
