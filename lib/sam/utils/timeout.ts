/**
 * Timeout utility for wrapping async operations with a maximum execution time.
 * Prevents indefinite hangs from AI API calls, database queries, or external services.
 */

export class OperationTimeoutError extends Error {
  public readonly operationName: string;
  public readonly timeoutMs: number;

  constructor(operationName: string, timeoutMs: number) {
    super(`${operationName} timed out after ${timeoutMs}ms`);
    this.name = 'OperationTimeoutError';
    this.operationName = operationName;
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Wraps an async function with a timeout. If the function doesn't resolve
 * within the specified time, rejects with OperationTimeoutError.
 *
 * @param fn - The async function to execute
 * @param timeoutMs - Maximum time in milliseconds before timeout
 * @param operationName - Name for error reporting
 * @returns The result of the async function
 * @throws OperationTimeoutError if the timeout is exceeded
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  operationName: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new OperationTimeoutError(operationName, timeoutMs));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([fn(), timeoutPromise]);
    return result;
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Wraps an async function with timeout + retry for transient failures.
 * Each attempt gets its own timeout. Only retries on errors that look transient
 * (network failures, rate limits, temporary API errors). Timeouts and validation
 * errors are NOT retried.
 *
 * @param fn - The async function to execute
 * @param timeoutMs - Maximum time per attempt in milliseconds
 * @param operationName - Name for error reporting / logging
 * @param maxRetries - Number of retries after the first attempt (default: 1)
 * @returns The result of the async function
 */
export async function withRetryableTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  operationName: string,
  maxRetries = 1,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await withTimeout(fn, timeoutMs, operationName);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Never retry timeouts – the operation is genuinely too slow
      if (lastError instanceof OperationTimeoutError) {
        throw lastError;
      }

      // Only retry transient errors
      if (attempt < maxRetries && isTransientError(lastError)) {
        const baseDelay = Math.min(500 * (attempt + 1), 2000);
        const jitter = Math.random() * baseDelay * 0.3; // ±30% jitter to prevent thundering herd
        const delayMs = Math.floor(baseDelay + jitter);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      throw lastError;
    }
  }

  // TypeScript exhaustiveness – unreachable in practice
  throw lastError ?? new Error(`${operationName} failed`);
}

/**
 * Determines if an error is likely transient and worth retrying.
 * Network errors, rate limits, and temporary server errors are retryable.
 */
function isTransientError(error: Error): boolean {
  const msg = error.message.toLowerCase();
  return (
    msg.includes('econnreset') ||
    msg.includes('econnrefused') ||
    msg.includes('etimedout') ||
    msg.includes('enotfound') ||
    msg.includes('network') ||
    msg.includes('socket hang up') ||
    msg.includes('rate limit') ||
    msg.includes('429') ||
    msg.includes('503') ||
    msg.includes('502')
  );
}

/** Default timeout values for different operation types */
export const TIMEOUT_DEFAULTS = {
  /** AI analysis operations (Bloom's, multimedia, etc.) */
  AI_ANALYSIS: 30_000,
  /** AI generation tasks (roadmaps, course outlines — produce large structured JSON) */
  AI_GENERATION: 180_000,
  /** AI generation with reasoning model (deepseek-reasoner, o1, etc.) — 5min per attempt */
  AI_GENERATION_REASONING: 300_000,
  /** AI analysis with reasoning model — 90s per attempt */
  AI_ANALYSIS_REASONING: 90_000,
  /** AI adapter initialization */
  AI_ADAPTER_INIT: 10_000,
  /** Database queries */
  DB_QUERY: 15_000,
  /** External API calls */
  EXTERNAL_API: 20_000,
  /** Max wait for first token from streaming AI response */
  STREAM_FIRST_TOKEN: 15_000,
  /** Max gap between consecutive tokens during streaming */
  STREAM_INTER_TOKEN: 10_000,
  /** Total wall-clock limit for an entire streaming response */
  STREAM_TOTAL: 120_000,
  /** Max time for deferred analysis after streaming completes */
  DEFERRED_ANALYSIS: 30_000,
} as const;
