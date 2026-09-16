import assert from "node:assert/strict";
import {
  AssessmentDeadlineExpiredError,
  AssessmentRequestAbortedError,
  runWithAssessmentDeadline
} from "../lib/assessmentDeadline.ts";

const pause = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const options = {
  minimumRetryRemainingMs: 100,
  retryDelayMs: 5,
  shouldRetry: () => true,
  timeoutMs: 300
};

let attempts = 0;
let started = Date.now();
await assert.rejects(
  runWithAssessmentDeadline(async () => {
    attempts += 1;
    if (attempts === 1) {
      await pause(100);
      throw new Error("first attempt failed");
    }
    await pause(500);
    return "too late";
  }, options),
  AssessmentDeadlineExpiredError
);
assert.equal(attempts, 2, "a retry should use the remaining shared budget");
assert.ok(Date.now() - started < 450, "the retry must not receive a fresh deadline");
console.log("PASS retry shares the overall generation deadline");

attempts = 0;
await assert.rejects(
  runWithAssessmentDeadline(async () => {
    attempts += 1;
    await pause(240);
    throw new Error("late first failure");
  }, options),
  AssessmentDeadlineExpiredError
);
assert.equal(attempts, 1, "a retry with too little time must be skipped");
console.log("PASS late failure skips an unproductive retry");

attempts = 0;
await assert.rejects(
  runWithAssessmentDeadline(async () => {
    attempts += 1;
    await pause(100);
    throw new Error("first attempt failed before long backoff");
  }, { ...options, retryDelayMs: 150 }),
  AssessmentDeadlineExpiredError
);
assert.equal(attempts, 1, "retry delay must fit inside the remaining budget");
console.log("PASS retry delay is included in the shared deadline");

attempts = 0;
assert.equal(
  await runWithAssessmentDeadline(async () => {
    attempts += 1;
    if (attempts === 1) throw new Error("early failure");
    return "validated provider response";
  }, options),
  "validated provider response"
);
assert.equal(attempts, 2);
console.log("PASS early failure can retry successfully");

const requestController = new AbortController();
started = Date.now();
const aborted = runWithAssessmentDeadline(async (signal) => {
  await new Promise<void>((_, reject) => {
    signal.addEventListener("abort", () => reject(new Error("fetch aborted")), { once: true });
  });
  return "unreachable";
}, { ...options, requestSignal: requestController.signal });
requestController.abort();
await assert.rejects(aborted, AssessmentRequestAbortedError);
assert.ok(Date.now() - started < 300);
console.log("PASS request cancellation aborts provider work");
