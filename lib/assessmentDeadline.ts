export class AssessmentDeadlineExpiredError extends Error {
  constructor() {
    super("Assessment generation deadline expired.");
  }
}

export class AssessmentRequestAbortedError extends Error {
  constructor() {
    super("Assessment generation request was aborted.");
  }
}

type DeadlineOptions = {
  minimumRetryRemainingMs: number;
  requestSignal?: AbortSignal;
  retryDelayMs: number;
  shouldRetry: (error: unknown) => boolean;
  timeoutMs: number;
};

export async function runWithAssessmentDeadline<T>(
  attempt: (signal: AbortSignal) => Promise<T>,
  options: DeadlineOptions
): Promise<T> {
  if (options.requestSignal?.aborted) throw new AssessmentRequestAbortedError();

  const deadlineAt = performance.now() + options.timeoutMs;
  const controller = new AbortController();
  let deadlineExpired = false;
  let requestAborted = false;
  let interrupt: (reason: Error) => void = () => undefined;
  const interruption = new Promise<never>((_, reject) => {
    interrupt = reject;
  });
  const timeout = setTimeout(() => {
    deadlineExpired = true;
    controller.abort();
    interrupt(new AssessmentDeadlineExpiredError());
  }, options.timeoutMs);
  const abortForRequest = () => {
    requestAborted = true;
    controller.abort();
    interrupt(new AssessmentRequestAbortedError());
  };
  options.requestSignal?.addEventListener("abort", abortForRequest, { once: true });
  if (options.requestSignal?.aborted) abortForRequest();

  const remainingMs = () => Math.max(0, deadlineAt - performance.now());
  const runAttempts = async () => {
    for (let index = 0; index < 2; index += 1) {
      if (deadlineExpired || remainingMs() === 0) throw new AssessmentDeadlineExpiredError();
      if (requestAborted) throw new AssessmentRequestAbortedError();
      if (index > 0 && remainingMs() < options.minimumRetryRemainingMs) {
        throw new AssessmentDeadlineExpiredError();
      }
      try {
        const result = await attempt(controller.signal);
        if (deadlineExpired || remainingMs() === 0) throw new AssessmentDeadlineExpiredError();
        if (requestAborted) throw new AssessmentRequestAbortedError();
        return result;
      } catch (error) {
        if (deadlineExpired || remainingMs() === 0) throw new AssessmentDeadlineExpiredError();
        if (requestAborted) throw new AssessmentRequestAbortedError();
        if (index === 1 || !options.shouldRetry(error)) throw error;
        if (remainingMs() < options.minimumRetryRemainingMs + options.retryDelayMs) {
          throw new AssessmentDeadlineExpiredError();
        }
        await waitForRetry(options.retryDelayMs, controller.signal);
      }
    }
    throw new AssessmentDeadlineExpiredError();
  };

  try {
    return await Promise.race([runAttempts(), interruption]);
  } finally {
    clearTimeout(timeout);
    options.requestSignal?.removeEventListener("abort", abortForRequest);
  }
}

function waitForRetry(delayMs: number, signal: AbortSignal) {
  if (delayMs === 0) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);
    const onAbort = () => {
      clearTimeout(timeout);
      reject(new AssessmentRequestAbortedError());
    };
    signal.addEventListener("abort", onAbort, { once: true });
    if (signal.aborted) onAbort();
  });
}
