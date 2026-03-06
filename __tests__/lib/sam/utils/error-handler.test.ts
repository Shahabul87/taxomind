/**
 * Comprehensive tests for SAM Error Handler
 *
 * Tests all error classes, error handling wrappers, retry logic,
 * timeout utilities, circuit breaker, and utility functions exported
 * from lib/sam/utils/error-handler.ts.
 */

// ============================================================================
// MOCKS - Must be defined before imports (jest.mock is hoisted)
// ============================================================================

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// ============================================================================
// IMPORTS
// ============================================================================

import {
  SAMError,
  SAMInitializationError,
  SAMServiceUnavailableError,
  SAMConfigError,
  SAMTimeoutError,
  withErrorHandling,
  withErrorHandlingSync,
  mustSucceed,
  tryOptional,
  tryArray,
  withRetry,
  withTimeout,
  CircuitBreaker,
  CircuitState,
  getErrorMessage,
  isSAMError,
  createErrorResponse,
} from '@/lib/sam/utils/error-handler';

import { logger } from '@/lib/logger';

// Cast to jest.Mock for assertion access
const mockLogger = logger as unknown as {
  info: jest.Mock;
  warn: jest.Mock;
  error: jest.Mock;
  debug: jest.Mock;
};

// ============================================================================
// 1. SAMError and Subclasses
// ============================================================================

describe('SAMError and subclasses', () => {
  describe('SAMError (base class)', () => {
    it('constructs with message and code', () => {
      const err = new SAMError('something broke', 'CUSTOM_CODE');

      expect(err.message).toBe('something broke');
      expect(err.code).toBe('CUSTOM_CODE');
      expect(err.recoverable).toBe(false);
      expect(err.context).toBeUndefined();
      expect(err.cause).toBeUndefined();
      expect(err.name).toBe('SAMError');
    });

    it('constructs with all optional fields', () => {
      const cause = new Error('root cause');
      const ctx = { userId: 'u1', attempt: 3 };
      const err = new SAMError('with options', 'OPT_CODE', {
        context: ctx,
        recoverable: true,
        cause,
      });

      expect(err.message).toBe('with options');
      expect(err.code).toBe('OPT_CODE');
      expect(err.context).toEqual(ctx);
      expect(err.recoverable).toBe(true);
      expect(err.cause).toBe(cause);
    });

    it('defaults recoverable to false when not provided', () => {
      const err = new SAMError('msg', 'CODE', { context: { a: 1 } });
      expect(err.recoverable).toBe(false);
    });

    it('is an instance of Error', () => {
      const err = new SAMError('msg', 'CODE');
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(SAMError);
    });

    it('has a stack trace', () => {
      const err = new SAMError('msg', 'CODE');
      expect(err.stack).toBeDefined();
      expect(err.stack).toContain('SAMError');
    });
  });

  describe('SAMInitializationError', () => {
    it('constructs with service and reason', () => {
      const err = new SAMInitializationError('MemoryStore', 'DB not connected');

      expect(err.message).toBe('Failed to initialize MemoryStore: DB not connected');
      expect(err.code).toBe('SAM_INIT_ERROR');
      expect(err.recoverable).toBe(false);
      expect(err.context).toEqual({ service: 'MemoryStore' });
      expect(err.name).toBe('SAMInitializationError');
    });

    it('preserves cause when provided', () => {
      const cause = new Error('connection refused');
      const err = new SAMInitializationError('DB', 'connect failed', cause);

      expect(err.cause).toBe(cause);
    });

    it('works without cause', () => {
      const err = new SAMInitializationError('Cache', 'missing config');
      expect(err.cause).toBeUndefined();
    });

    it('is an instance of SAMError and Error', () => {
      const err = new SAMInitializationError('svc', 'reason');
      expect(err).toBeInstanceOf(SAMError);
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(SAMInitializationError);
    });
  });

  describe('SAMServiceUnavailableError', () => {
    it('constructs with service name only', () => {
      const err = new SAMServiceUnavailableError('AIProvider');

      expect(err.message).toBe('Service AIProvider is not available');
      expect(err.code).toBe('SAM_SERVICE_UNAVAILABLE');
      expect(err.recoverable).toBe(true);
      expect(err.context).toEqual({ service: 'AIProvider' });
      expect(err.name).toBe('SAMServiceUnavailableError');
    });

    it('constructs with service name and reason', () => {
      const err = new SAMServiceUnavailableError('VectorDB', 'maintenance window');

      expect(err.message).toBe('Service VectorDB is not available: maintenance window');
    });

    it('is an instance of SAMError and Error', () => {
      const err = new SAMServiceUnavailableError('svc');
      expect(err).toBeInstanceOf(SAMError);
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe('SAMConfigError', () => {
    it('constructs with message only', () => {
      const err = new SAMConfigError('Missing API key');

      expect(err.message).toBe('Missing API key');
      expect(err.code).toBe('SAM_CONFIG_ERROR');
      expect(err.recoverable).toBe(false);
      expect(err.context).toBeUndefined();
      expect(err.name).toBe('SAMConfigError');
    });

    it('constructs with message and context', () => {
      const ctx = { key: 'OPENAI_API_KEY', env: 'production' };
      const err = new SAMConfigError('Invalid configuration', ctx);

      expect(err.context).toEqual(ctx);
    });

    it('is an instance of SAMError and Error', () => {
      const err = new SAMConfigError('msg');
      expect(err).toBeInstanceOf(SAMError);
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe('SAMTimeoutError', () => {
    it('constructs with operation and timeout', () => {
      const err = new SAMTimeoutError('bloom-analysis', 5000);

      expect(err.message).toBe('Operation bloom-analysis timed out after 5000ms');
      expect(err.code).toBe('SAM_TIMEOUT');
      expect(err.recoverable).toBe(true);
      expect(err.context).toEqual({ operation: 'bloom-analysis', timeoutMs: 5000 });
      expect(err.name).toBe('SAMTimeoutError');
    });

    it('is an instance of SAMError and Error', () => {
      const err = new SAMTimeoutError('op', 100);
      expect(err).toBeInstanceOf(SAMError);
      expect(err).toBeInstanceOf(Error);
    });
  });
});

// ============================================================================
// 2. withErrorHandling (async)
// ============================================================================

describe('withErrorHandling', () => {
  it('returns the result on success', async () => {
    const result = await withErrorHandling(
      async () => 42,
      { component: 'Test', operation: 'compute' }
    );

    expect(result).toBe(42);
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it('rethrows errors by default after logging', async () => {
    const original = new Error('async boom');

    await expect(
      withErrorHandling(
        async () => { throw original; },
        { component: 'TestComp', operation: 'doWork' }
      )
    ).rejects.toThrow('async boom');

    expect(mockLogger.error).toHaveBeenCalledWith(
      '[TestComp] doWork failed',
      expect.objectContaining({ error: 'async boom' })
    );
  });

  it('returns fallback value on error when provided', async () => {
    const result = await withErrorHandling(
      async () => { throw new Error('fail'); },
      { component: 'Cache', operation: 'get', fallback: 'default-val' }
    );

    expect(result).toBe('default-val');
    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalledWith(
      '[Cache] get using fallback value',
      expect.objectContaining({ fallbackType: 'string' })
    );
  });

  it('returns null fallback on error', async () => {
    const result = await withErrorHandling<string | null>(
      async () => { throw new Error('fail'); },
      { component: 'A', operation: 'b', fallback: null }
    );

    expect(result).toBeNull();
  });

  it('applies error transform before rethrowing', async () => {
    const transform = (err: Error) =>
      new SAMConfigError(`Transformed: ${err.message}`);

    await expect(
      withErrorHandling(
        async () => { throw new Error('original'); },
        { component: 'X', operation: 'y', rethrow: true, transform }
      )
    ).rejects.toThrow('Transformed: original');
  });

  it('applies error transform but returns fallback when fallback is provided', async () => {
    const transform = jest.fn((err: Error) => new Error(`t: ${err.message}`));

    const result = await withErrorHandling(
      async () => { throw new Error('boom'); },
      { component: 'C', operation: 'd', fallback: 'safe', transform }
    );

    // Transform is called, but fallback is returned
    expect(transform).toHaveBeenCalled();
    expect(result).toBe('safe');
  });

  it('logs additional context when provided', async () => {
    await expect(
      withErrorHandling(
        async () => { throw new Error('contextual'); },
        {
          component: 'Ctx',
          operation: 'op',
          context: { userId: 'u123', courseId: 'c456' },
        }
      )
    ).rejects.toThrow('contextual');

    expect(mockLogger.error).toHaveBeenCalledWith(
      '[Ctx] op failed',
      expect.objectContaining({
        userId: 'u123',
        courseId: 'c456',
      })
    );
  });

  it('wraps non-Error throws as Error objects', async () => {
    await expect(
      withErrorHandling(
        async () => { throw 'string error'; },
        { component: 'S', operation: 'op' }
      )
    ).rejects.toThrow('string error');

    expect(mockLogger.error).toHaveBeenCalledWith(
      '[S] op failed',
      expect.objectContaining({ error: 'string error' })
    );
  });

  it('handles numeric throws', async () => {
    await expect(
      withErrorHandling(
        async () => { throw 404; },
        { component: 'N', operation: 'op' }
      )
    ).rejects.toThrow('404');
  });
});

// ============================================================================
// 3. withErrorHandlingSync
// ============================================================================

describe('withErrorHandlingSync', () => {
  it('returns the result on success', () => {
    const result = withErrorHandlingSync(
      () => 'sync result',
      { component: 'Sync', operation: 'compute' }
    );

    expect(result).toBe('sync result');
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it('rethrows errors by default after logging', () => {
    expect(() =>
      withErrorHandlingSync(
        () => { throw new Error('sync boom'); },
        { component: 'SyncComp', operation: 'doWork' }
      )
    ).toThrow('sync boom');

    expect(mockLogger.error).toHaveBeenCalledWith(
      '[SyncComp] doWork failed',
      expect.objectContaining({ error: 'sync boom' })
    );
  });

  it('returns fallback value on error when provided', () => {
    const result = withErrorHandlingSync(
      () => { throw new Error('fail'); },
      { component: 'SCache', operation: 'get', fallback: 0 }
    );

    expect(result).toBe(0);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      '[SCache] get using fallback value',
      expect.objectContaining({ fallbackType: 'number' })
    );
  });

  it('applies error transform before rethrowing', () => {
    const transform = (err: Error) =>
      new SAMInitializationError('SyncSvc', err.message);

    expect(() =>
      withErrorHandlingSync(
        () => { throw new Error('init fail'); },
        { component: 'SI', operation: 'init', rethrow: true, transform }
      )
    ).toThrow('Failed to initialize SyncSvc: init fail');
  });

  it('wraps non-Error throws as Error objects', () => {
    expect(() =>
      withErrorHandlingSync(
        () => { throw 'string throw'; },
        { component: 'S', operation: 'op' }
      )
    ).toThrow('string throw');
  });
});

// ============================================================================
// 4. mustSucceed / tryOptional / tryArray
// ============================================================================

describe('mustSucceed', () => {
  it('returns value on success', async () => {
    const result = await mustSucceed(
      async () => ({ data: 'important' }),
      'Critical',
      'fetchData'
    );

    expect(result).toEqual({ data: 'important' });
  });

  it('always rethrows errors with logging', async () => {
    await expect(
      mustSucceed(
        async () => { throw new Error('critical failure'); },
        'Critical',
        'mustWork'
      )
    ).rejects.toThrow('critical failure');

    expect(mockLogger.error).toHaveBeenCalledWith(
      '[Critical] mustWork failed',
      expect.objectContaining({ error: 'critical failure' })
    );
  });
});

describe('tryOptional', () => {
  it('returns value on success', async () => {
    const result = await tryOptional(
      async () => 'found',
      'Optional',
      'lookup'
    );

    expect(result).toBe('found');
  });

  it('returns null on error with logging', async () => {
    const result = await tryOptional(
      async () => { throw new Error('not found'); },
      'Optional',
      'lookup'
    );

    expect(result).toBeNull();
    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalled();
  });
});

describe('tryArray', () => {
  it('returns array on success', async () => {
    const result = await tryArray(
      async () => [1, 2, 3],
      'List',
      'fetchItems'
    );

    expect(result).toEqual([1, 2, 3]);
  });

  it('returns empty array on error with logging', async () => {
    const result = await tryArray(
      async () => { throw new Error('query failed'); },
      'List',
      'fetchItems'
    );

    expect(result).toEqual([]);
    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalled();
  });
});

// ============================================================================
// 5. withRetry
// ============================================================================

describe('withRetry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns result on first successful attempt', async () => {
    const fn = jest.fn<Promise<string>, []>().mockResolvedValue('ok');

    const promise = withRetry(fn, {
      component: 'Retry',
      operation: 'firstTry',
    });

    const result = await promise;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('retries and succeeds on a subsequent attempt', async () => {
    const fn = jest.fn<Promise<string>, []>()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce('recovered');

    const promise = withRetry(fn, {
      maxAttempts: 3,
      initialDelayMs: 100,
      component: 'Retry',
      operation: 'retrySuccess',
    });

    // After first failure, the retry logic calls sleep(100).
    // Advance timers to resolve the sleep.
    await jest.advanceTimersByTimeAsync(100);

    const result = await promise;
    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);

    // Logger warned about the retry
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('retrySuccess failed (attempt 1/3)'),
      expect.objectContaining({ nextRetryMs: 100 })
    );
  });

  it('throws after all retry attempts are exhausted', async () => {
    // Use real timers with very short delays to avoid fake timer microtask issues
    jest.useRealTimers();

    const fn = jest.fn<Promise<string>, []>(async () => {
      throw new Error('persistent');
    });

    await expect(
      withRetry(fn, {
        maxAttempts: 3,
        initialDelayMs: 1,
        maxDelayMs: 2,
        backoffMultiplier: 1,
        component: 'Retry',
        operation: 'allFail',
      })
    ).rejects.toThrow('persistent');

    expect(fn).toHaveBeenCalledTimes(3);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('allFail failed after 3 attempts'),
      expect.objectContaining({ attempts: 3 })
    );

    // Re-enable fake timers for subsequent tests in this describe block
    jest.useFakeTimers();
  });

  it('stops retrying when isRetryable returns false', async () => {
    const fn = jest.fn<Promise<string>, []>()
      .mockRejectedValue(new Error('non-retryable'));

    const isRetryable = jest.fn().mockReturnValue(false);

    const promise = withRetry(fn, {
      maxAttempts: 5,
      initialDelayMs: 100,
      isRetryable,
      component: 'Retry',
      operation: 'nonRetryable',
    });

    await expect(promise).rejects.toThrow('non-retryable');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(isRetryable).toHaveBeenCalledWith(expect.any(Error));

    // Should log error, not warn (since it didn't retry)
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('nonRetryable failed after 1 attempts'),
      expect.any(Object)
    );
  });

  it('applies exponential backoff with maxDelayMs cap', async () => {
    const fn = jest.fn<Promise<string>, []>()
      .mockRejectedValueOnce(new Error('e1'))
      .mockRejectedValueOnce(new Error('e2'))
      .mockRejectedValueOnce(new Error('e3'))
      .mockResolvedValueOnce('ok');

    const promise = withRetry(fn, {
      maxAttempts: 4,
      initialDelayMs: 100,
      maxDelayMs: 250,
      backoffMultiplier: 2,
      component: 'Backoff',
      operation: 'capped',
    });

    // Attempt 1 fails -> delay = 100
    await jest.advanceTimersByTimeAsync(100);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('attempt 1/4'),
      expect.objectContaining({ nextRetryMs: 100 })
    );

    // Attempt 2 fails -> delay = min(200, 250) = 200
    await jest.advanceTimersByTimeAsync(200);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('attempt 2/4'),
      expect.objectContaining({ nextRetryMs: 200 })
    );

    // Attempt 3 fails -> delay = min(400, 250) = 250 (capped)
    await jest.advanceTimersByTimeAsync(250);

    const result = await promise;
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it('wraps non-Error throws in Error before checking retryable', async () => {
    const fn = jest.fn<Promise<string>, []>()
      .mockRejectedValue('string failure' as unknown);

    const isRetryable = jest.fn().mockReturnValue(false);

    const promise = withRetry(fn, {
      maxAttempts: 3,
      isRetryable,
      component: 'R',
      operation: 'nonError',
    });

    await expect(promise).rejects.toThrow('string failure');
    expect(isRetryable).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'string failure' })
    );
  });

  it('uses default options when none provided', async () => {
    const fn = jest.fn<Promise<string>, []>()
      .mockRejectedValueOnce(new Error('e1'))
      .mockResolvedValueOnce('ok');

    const promise = withRetry(fn);

    // Default initialDelayMs is 100
    await jest.advanceTimersByTimeAsync(100);

    const result = await promise;
    expect(result).toBe('ok');
  });
});

// ============================================================================
// 6. withTimeout
// ============================================================================

describe('withTimeout', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns result when operation completes within timeout', async () => {
    const result = await withTimeout(
      async () => 'fast',
      500,
      'quick-op'
    );

    expect(result).toBe('fast');
  });

  it('throws SAMTimeoutError when operation exceeds timeout', async () => {
    // Use real timers with a very short timeout to avoid flakiness
    const slowFn = () => new Promise<string>((resolve) => {
      setTimeout(() => resolve('too late'), 200);
    });

    await expect(
      withTimeout(slowFn, 10, 'slow-op')
    ).rejects.toThrow(SAMTimeoutError);

    try {
      await withTimeout(slowFn, 10, 'slow-op');
    } catch (err) {
      expect(err).toBeInstanceOf(SAMTimeoutError);
      expect(err).toBeInstanceOf(SAMError);
      const timeoutErr = err as SAMTimeoutError;
      expect(timeoutErr.code).toBe('SAM_TIMEOUT');
      expect(timeoutErr.message).toContain('slow-op');
      expect(timeoutErr.message).toContain('10ms');
      expect(timeoutErr.recoverable).toBe(true);
    }
  });

  it('propagates errors from the original function', async () => {
    await expect(
      withTimeout(
        async () => { throw new Error('fn error'); },
        5000,
        'error-op'
      )
    ).rejects.toThrow('fn error');
  });
});

// ============================================================================
// 7. CircuitBreaker
// ============================================================================

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeoutMs: 1000,
      component: 'TestBreaker',
    });
  });

  describe('initial state (closed)', () => {
    it('starts in CLOSED state', () => {
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('executes function successfully', async () => {
      const result = await breaker.execute(async () => 'hello');
      expect(result).toBe('hello');
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('cold-start behavior', () => {
    it('uses coldStartThreshold (2x) before first success', async () => {
      // Default coldStartThreshold = failureThreshold * 2 = 6
      // So we need 6 failures (not 3) to trip the breaker during cold-start
      const coldBreaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeoutMs: 1000,
        component: 'ColdStart',
      });

      // 3 failures should NOT open the breaker (cold-start threshold is 6)
      for (let i = 0; i < 3; i++) {
        await expect(
          coldBreaker.execute(async () => { throw new Error(`fail ${i}`); })
        ).rejects.toThrow();
      }
      expect(coldBreaker.getState()).toBe(CircuitState.CLOSED);

      // 3 more failures (total 6) should open it
      for (let i = 3; i < 6; i++) {
        await expect(
          coldBreaker.execute(async () => { throw new Error(`fail ${i}`); })
        ).rejects.toThrow();
      }
      expect(coldBreaker.getState()).toBe(CircuitState.OPEN);
    });

    it('uses normal failureThreshold after first success', async () => {
      // First success exits cold-start period
      await breaker.execute(async () => 'success');
      expect(breaker.getState()).toBe(CircuitState.CLOSED);

      // Now 3 failures (failureThreshold) should open the breaker
      for (let i = 0; i < 3; i++) {
        await expect(
          breaker.execute(async () => { throw new Error(`fail ${i}`); })
        ).rejects.toThrow();
      }
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('accepts custom coldStartThreshold', async () => {
      const customBreaker = new CircuitBreaker({
        failureThreshold: 2,
        coldStartThreshold: 4,
        component: 'Custom',
      });

      // 3 failures should not open (cold-start threshold is 4)
      for (let i = 0; i < 3; i++) {
        await expect(
          customBreaker.execute(async () => { throw new Error('fail'); })
        ).rejects.toThrow();
      }
      expect(customBreaker.getState()).toBe(CircuitState.CLOSED);

      // 4th failure opens it
      await expect(
        customBreaker.execute(async () => { throw new Error('fail'); })
      ).rejects.toThrow();
      expect(customBreaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('transition to OPEN state', () => {
    it('opens after reaching failure threshold (post first success)', async () => {
      // Mark first success to exit cold-start
      await breaker.execute(async () => 'ok');

      for (let i = 0; i < 3; i++) {
        await expect(
          breaker.execute(async () => { throw new Error('fail'); })
        ).rejects.toThrow('fail');
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Circuit breaker opened after 3 failures')
      );
    });

    it('rejects calls immediately when open', async () => {
      // Exit cold start, then trip breaker
      await breaker.execute(async () => 'ok');
      for (let i = 0; i < 3; i++) {
        await expect(
          breaker.execute(async () => { throw new Error('fail'); })
        ).rejects.toThrow();
      }

      // Now breaker is open, next call should throw SAMServiceUnavailableError
      await expect(
        breaker.execute(async () => 'should not run')
      ).rejects.toThrow(SAMServiceUnavailableError);

      try {
        await breaker.execute(async () => 'nope');
      } catch (err) {
        expect(err).toBeInstanceOf(SAMServiceUnavailableError);
        const svcErr = err as SAMServiceUnavailableError;
        expect(svcErr.message).toContain('Circuit breaker is open');
        expect(svcErr.code).toBe('SAM_SERVICE_UNAVAILABLE');
      }
    });
  });

  describe('transition to HALF_OPEN state', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('enters HALF_OPEN after resetTimeout elapses', async () => {
      // Exit cold start, then trip the breaker
      await breaker.execute(async () => 'ok');
      for (let i = 0; i < 3; i++) {
        await expect(
          breaker.execute(async () => { throw new Error('fail'); })
        ).rejects.toThrow();
      }
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Advance past resetTimeoutMs
      jest.advanceTimersByTime(1100);

      // Next execute should transition to HALF_OPEN and try the function
      const result = await breaker.execute(async () => 'recovered');

      // After success in HALF_OPEN, it goes back to CLOSED
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      expect(result).toBe('recovered');
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('half-open')
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('closed after successful call')
      );
    });

    it('re-opens on failure in HALF_OPEN state', async () => {
      // Exit cold start, then trip the breaker
      await breaker.execute(async () => 'ok');
      for (let i = 0; i < 3; i++) {
        await expect(
          breaker.execute(async () => { throw new Error('fail'); })
        ).rejects.toThrow();
      }
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Advance past resetTimeoutMs
      jest.advanceTimersByTime(1100);

      // Attempt in HALF_OPEN fails
      await expect(
        breaker.execute(async () => { throw new Error('still broken'); })
      ).rejects.toThrow('still broken');

      // Since failures (3 from before + 1 more = 4) >= threshold (3),
      // breaker should be OPEN again
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('recordFailure', () => {
    it('increments failure count and can trip the breaker', async () => {
      // Exit cold start
      await breaker.execute(async () => 'ok');

      // Record external failures
      breaker.recordFailure(new Error('external error 1'));
      breaker.recordFailure(new Error('external error 2'));
      expect(breaker.getState()).toBe(CircuitState.CLOSED);

      breaker.recordFailure(new Error('external error 3'));
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Circuit breaker opened after 3 failures (external)'),
        expect.objectContaining({ error: 'external error 3' })
      );
    });

    it('uses coldStartThreshold before first success', () => {
      // Cold start: threshold is 6, not 3
      for (let i = 0; i < 5; i++) {
        breaker.recordFailure(new Error(`fail ${i}`));
      }
      expect(breaker.getState()).toBe(CircuitState.CLOSED);

      breaker.recordFailure(new Error('fail 5'));
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('reset', () => {
    it('resets state to CLOSED and clears failure count', async () => {
      // Exit cold start, then trip breaker
      await breaker.execute(async () => 'ok');
      for (let i = 0; i < 3; i++) {
        await expect(
          breaker.execute(async () => { throw new Error('fail'); })
        ).rejects.toThrow();
      }
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      breaker.reset();
      expect(breaker.getState()).toBe(CircuitState.CLOSED);

      // After reset, breaker should work normally and use normal threshold
      // (hasSucceeded is NOT reset, so it stays on normal failureThreshold)
      const result = await breaker.execute(async () => 'after reset');
      expect(result).toBe('after reset');
    });

    it('preserves hasSucceeded flag after reset (no re-entering cold-start)', async () => {
      // Exit cold start
      await breaker.execute(async () => 'ok');

      breaker.reset();

      // After reset, since hasSucceeded is preserved, normal threshold (3) applies
      for (let i = 0; i < 3; i++) {
        await expect(
          breaker.execute(async () => { throw new Error('fail'); })
        ).rejects.toThrow();
      }
      // Should open at 3, not 6 (cold start threshold)
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('default options', () => {
    it('uses default values when no options provided', () => {
      const defaultBreaker = new CircuitBreaker();
      expect(defaultBreaker.getState()).toBe(CircuitState.CLOSED);
    });
  });
});

// ============================================================================
// 8. Utility Functions
// ============================================================================

describe('getErrorMessage', () => {
  it('extracts message from Error instances', () => {
    expect(getErrorMessage(new Error('hello'))).toBe('hello');
  });

  it('extracts message from SAMError instances', () => {
    expect(getErrorMessage(new SAMError('sam msg', 'CODE'))).toBe('sam msg');
  });

  it('converts string to string', () => {
    expect(getErrorMessage('raw string')).toBe('raw string');
  });

  it('converts number to string', () => {
    expect(getErrorMessage(42)).toBe('42');
  });

  it('converts null to string', () => {
    expect(getErrorMessage(null)).toBe('null');
  });

  it('converts undefined to string', () => {
    expect(getErrorMessage(undefined)).toBe('undefined');
  });

  it('converts object to string', () => {
    expect(getErrorMessage({ key: 'value' })).toBe('[object Object]');
  });
});

describe('isSAMError', () => {
  it('returns true for SAMError instances', () => {
    expect(isSAMError(new SAMError('msg', 'CODE'))).toBe(true);
  });

  it('returns true for SAMError subclasses', () => {
    expect(isSAMError(new SAMInitializationError('svc', 'reason'))).toBe(true);
    expect(isSAMError(new SAMServiceUnavailableError('svc'))).toBe(true);
    expect(isSAMError(new SAMConfigError('msg'))).toBe(true);
    expect(isSAMError(new SAMTimeoutError('op', 100))).toBe(true);
  });

  it('returns false for regular Error', () => {
    expect(isSAMError(new Error('msg'))).toBe(false);
  });

  it('returns false for non-error values', () => {
    expect(isSAMError('string')).toBe(false);
    expect(isSAMError(42)).toBe(false);
    expect(isSAMError(null)).toBe(false);
    expect(isSAMError(undefined)).toBe(false);
    expect(isSAMError({})).toBe(false);
  });
});

describe('createErrorResponse', () => {
  it('creates response from SAMError with code and details', () => {
    const err = new SAMError('sam error', 'SAM_CUSTOM', {
      context: { detail: 'extra' },
    });

    const response = createErrorResponse(err);

    expect(response).toEqual({
      error: 'sam error',
      code: 'SAM_CUSTOM',
      details: { detail: 'extra' },
    });
  });

  it('creates response from SAMError subclass', () => {
    const err = new SAMTimeoutError('analysis', 5000);
    const response = createErrorResponse(err);

    expect(response).toEqual({
      error: 'Operation analysis timed out after 5000ms',
      code: 'SAM_TIMEOUT',
      details: { operation: 'analysis', timeoutMs: 5000 },
    });
  });

  it('creates response from SAMError without context', () => {
    const err = new SAMConfigError('missing key');
    const response = createErrorResponse(err);

    expect(response).toEqual({
      error: 'missing key',
      code: 'SAM_CONFIG_ERROR',
      details: undefined,
    });
  });

  it('creates response from regular Error (no code or details)', () => {
    const err = new Error('standard error');
    const response = createErrorResponse(err);

    expect(response).toEqual({
      error: 'standard error',
    });
    expect(response.code).toBeUndefined();
    expect(response.details).toBeUndefined();
  });

  it('uses default message for non-Error values', () => {
    const response = createErrorResponse('string error');

    expect(response).toEqual({
      error: 'An error occurred',
    });
  });

  it('uses custom default message for non-Error values', () => {
    const response = createErrorResponse(42, 'Something went wrong');

    expect(response).toEqual({
      error: 'Something went wrong',
    });
  });

  it('uses custom default message for null', () => {
    const response = createErrorResponse(null, 'Null error occurred');

    expect(response).toEqual({
      error: 'Null error occurred',
    });
  });
});

// ============================================================================
// CircuitState enum values
// ============================================================================

describe('CircuitState enum', () => {
  it('has correct string values', () => {
    expect(CircuitState.CLOSED).toBe('closed');
    expect(CircuitState.OPEN).toBe('open');
    expect(CircuitState.HALF_OPEN).toBe('half_open');
  });
});
