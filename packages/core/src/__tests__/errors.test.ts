/**
 * @sam-ai/core - Error Classes Tests
 * Tests for all SAM error types and utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
  SAMError,
  ConfigurationError,
  InitializationError,
  EngineError,
  OrchestrationError,
  AIError,
  StorageError,
  CacheError,
  ValidationError,
  TimeoutError,
  RateLimitError,
  DependencyError,
  isSAMError,
  wrapError,
  createTimeoutPromise,
  withTimeout,
  withRetry,
} from '../errors';

describe('Error Classes', () => {
  // ============================================================================
  // SAMError TESTS
  // ============================================================================

  describe('SAMError', () => {
    it('should create error with message', () => {
      const error = new SAMError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('SAMError');
    });

    it('should have default code UNKNOWN_ERROR', () => {
      const error = new SAMError('Test');
      expect(error.code).toBe('UNKNOWN_ERROR');
    });

    it('should accept custom code', () => {
      const error = new SAMError('Test', { code: 'ENGINE_ERROR' });
      expect(error.code).toBe('ENGINE_ERROR');
    });

    it('should be recoverable by default', () => {
      const error = new SAMError('Test');
      expect(error.recoverable).toBe(true);
    });

    it('should accept recoverable option', () => {
      const error = new SAMError('Test', { recoverable: false });
      expect(error.recoverable).toBe(false);
    });

    it('should store details', () => {
      const details = { field: 'email', reason: 'invalid' };
      const error = new SAMError('Test', { details });
      expect(error.details).toEqual(details);
    });

    it('should store cause', () => {
      const cause = new Error('Original error');
      const error = new SAMError('Wrapped', { cause });
      expect(error.originalCause).toBe(cause);
    });

    it('should store engine name', () => {
      const error = new SAMError('Test', { engineName: 'context' });
      expect(error.engineName).toBe('context');
    });

    it('should have timestamp', () => {
      const before = new Date();
      const error = new SAMError('Test');
      const after = new Date();

      expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(error.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should serialize to JSON', () => {
      const error = new SAMError('Test', {
        code: 'ENGINE_ERROR',
        details: { key: 'value' },
        engineName: 'blooms',
        recoverable: false,
      });

      const json = error.toJSON();

      expect(json.code).toBe('ENGINE_ERROR');
      expect(json.message).toBe('Test');
      expect(json.details).toEqual({ key: 'value' });
      expect(json.engineName).toBe('blooms');
      expect(json.recoverable).toBe(false);
      expect(json.timestamp).toBeInstanceOf(Date);
    });
  });

  // ============================================================================
  // SPECIFIC ERROR TYPES TESTS
  // ============================================================================

  describe('ConfigurationError', () => {
    it('should have correct code', () => {
      const error = new ConfigurationError('Invalid config');
      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.name).toBe('ConfigurationError');
    });

    it('should not be recoverable', () => {
      const error = new ConfigurationError('Invalid config');
      expect(error.recoverable).toBe(false);
    });

    it('should accept details', () => {
      const error = new ConfigurationError('Invalid config', { field: 'api_key' });
      expect(error.details).toEqual({ field: 'api_key' });
    });
  });

  describe('InitializationError', () => {
    it('should have correct code', () => {
      const error = new InitializationError('Failed to init');
      expect(error.code).toBe('INITIALIZATION_ERROR');
      expect(error.name).toBe('InitializationError');
    });

    it('should not be recoverable', () => {
      const error = new InitializationError('Failed');
      expect(error.recoverable).toBe(false);
    });

    it('should store engine name', () => {
      const error = new InitializationError('Failed', { engineName: 'context' });
      expect(error.engineName).toBe('context');
    });

    it('should store cause', () => {
      const cause = new Error('Root cause');
      const error = new InitializationError('Failed', { cause });
      expect(error.originalCause).toBe(cause);
    });
  });

  describe('EngineError', () => {
    it('should have correct code', () => {
      const error = new EngineError('context', 'Engine failed');
      expect(error.code).toBe('ENGINE_ERROR');
      expect(error.name).toBe('EngineError');
    });

    it('should store engine name', () => {
      const error = new EngineError('blooms', 'Analysis failed');
      expect(error.engineName).toBe('blooms');
    });

    it('should be recoverable by default', () => {
      const error = new EngineError('context', 'Failed');
      expect(error.recoverable).toBe(true);
    });

    it('should accept recoverable option', () => {
      const error = new EngineError('context', 'Failed', { recoverable: false });
      expect(error.recoverable).toBe(false);
    });
  });

  describe('OrchestrationError', () => {
    it('should have correct code', () => {
      const error = new OrchestrationError('Orchestration failed');
      expect(error.code).toBe('ORCHESTRATION_ERROR');
      expect(error.name).toBe('OrchestrationError');
    });

    it('should be recoverable', () => {
      const error = new OrchestrationError('Failed');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('AIError', () => {
    it('should have correct code', () => {
      const error = new AIError('AI request failed');
      expect(error.code).toBe('AI_ERROR');
      expect(error.name).toBe('AIError');
    });

    it('should be recoverable by default', () => {
      const error = new AIError('Failed');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('StorageError', () => {
    it('should have correct code', () => {
      const error = new StorageError('Storage failed');
      expect(error.code).toBe('STORAGE_ERROR');
      expect(error.name).toBe('StorageError');
    });

    it('should be recoverable', () => {
      const error = new StorageError('Failed');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('CacheError', () => {
    it('should have correct code', () => {
      const error = new CacheError('Cache failed');
      expect(error.code).toBe('CACHE_ERROR');
      expect(error.name).toBe('CacheError');
    });

    it('should be recoverable', () => {
      const error = new CacheError('Failed');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('ValidationError', () => {
    it('should have correct code', () => {
      const error = new ValidationError('Validation failed');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('ValidationError');
    });

    it('should store field errors', () => {
      const fieldErrors = {
        email: ['Invalid email format'],
        password: ['Too short', 'Must contain number'],
      };
      const error = new ValidationError('Invalid input', fieldErrors);
      expect(error.fieldErrors).toEqual(fieldErrors);
    });

    it('should have empty field errors by default', () => {
      const error = new ValidationError('Invalid');
      expect(error.fieldErrors).toEqual({});
    });
  });

  describe('TimeoutError', () => {
    it('should have correct code', () => {
      const error = new TimeoutError('Timed out', 5000);
      expect(error.code).toBe('TIMEOUT_ERROR');
      expect(error.name).toBe('TimeoutError');
    });

    it('should store timeout value', () => {
      const error = new TimeoutError('Timed out', 5000);
      expect(error.timeoutMs).toBe(5000);
    });

    it('should store engine name', () => {
      const error = new TimeoutError('Timed out', 5000, 'blooms');
      expect(error.engineName).toBe('blooms');
    });
  });

  describe('RateLimitError', () => {
    it('should have correct code', () => {
      const error = new RateLimitError('Rate limited');
      expect(error.code).toBe('RATE_LIMIT_ERROR');
      expect(error.name).toBe('RateLimitError');
    });

    it('should store retry after', () => {
      const error = new RateLimitError('Rate limited', 30000);
      expect(error.retryAfterMs).toBe(30000);
    });

    it('should be recoverable', () => {
      const error = new RateLimitError('Rate limited');
      expect(error.recoverable).toBe(true);
    });
  });

  describe('DependencyError', () => {
    it('should have correct code', () => {
      const error = new DependencyError('response', 'context');
      expect(error.code).toBe('DEPENDENCY_ERROR');
      expect(error.name).toBe('DependencyError');
    });

    it('should store missing dependency', () => {
      const error = new DependencyError('response', 'context');
      expect(error.missingDependency).toBe('context');
    });

    it('should store engine name', () => {
      const error = new DependencyError('response', 'context');
      expect(error.engineName).toBe('response');
    });

    it('should not be recoverable', () => {
      const error = new DependencyError('response', 'context');
      expect(error.recoverable).toBe(false);
    });

    it('should have descriptive message', () => {
      const error = new DependencyError('response', 'context');
      expect(error.message).toContain('response');
      expect(error.message).toContain('context');
    });
  });

  // ============================================================================
  // UTILITY FUNCTION TESTS
  // ============================================================================

  describe('isSAMError', () => {
    it('should return true for SAMError', () => {
      const error = new SAMError('Test');
      expect(isSAMError(error)).toBe(true);
    });

    it('should return true for subclasses', () => {
      expect(isSAMError(new EngineError('ctx', 'msg'))).toBe(true);
      expect(isSAMError(new ValidationError('msg'))).toBe(true);
      expect(isSAMError(new TimeoutError('msg', 1000))).toBe(true);
    });

    it('should return false for regular Error', () => {
      const error = new Error('Test');
      expect(isSAMError(error)).toBe(false);
    });

    it('should return false for non-error objects', () => {
      expect(isSAMError('string')).toBe(false);
      expect(isSAMError(123)).toBe(false);
      expect(isSAMError(null)).toBe(false);
      expect(isSAMError(undefined)).toBe(false);
      expect(isSAMError({})).toBe(false);
    });
  });

  describe('wrapError', () => {
    it('should return SAMError as-is', () => {
      const original = new SAMError('Original');
      const wrapped = wrapError(original);
      expect(wrapped).toBe(original);
    });

    it('should wrap regular Error', () => {
      const original = new Error('Regular error');
      const wrapped = wrapError(original);

      expect(wrapped).toBeInstanceOf(SAMError);
      expect(wrapped.message).toBe('Regular error');
      expect(wrapped.originalCause).toBe(original);
    });

    it('should wrap string error', () => {
      const wrapped = wrapError('String error');
      expect(wrapped).toBeInstanceOf(SAMError);
      expect(wrapped.message).toBe('String error');
    });

    it('should use fallback message for empty error', () => {
      const wrapped = wrapError('', 'Fallback message');
      expect(wrapped.message).toBe('Fallback message');
    });

    it('should use fallback for null/undefined', () => {
      expect(wrapError(null, 'Fallback').message).toBe('null');
      expect(wrapError(undefined, 'Fallback').message).toBe('undefined');
    });
  });

  describe('createTimeoutPromise', () => {
    it('should reject after timeout', async () => {
      vi.useFakeTimers();

      const promise = createTimeoutPromise(1000);
      const rejectHandler = vi.fn();

      promise.catch(rejectHandler);

      vi.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(rejectHandler).toHaveBeenCalled();
      const error = rejectHandler.mock.calls[0][0];
      expect(error).toBeInstanceOf(TimeoutError);

      vi.useRealTimers();
    });

    it('should include engine name in error', async () => {
      vi.useFakeTimers();

      const promise = createTimeoutPromise(1000, 'test-engine');
      const rejectHandler = vi.fn();

      promise.catch(rejectHandler);

      vi.advanceTimersByTime(1000);
      await Promise.resolve();

      const error = rejectHandler.mock.calls[0][0] as TimeoutError;
      expect(error.engineName).toBe('test-engine');

      vi.useRealTimers();
    });
  });

  describe('withTimeout', () => {
    it('should resolve if promise completes before timeout', async () => {
      const promise = Promise.resolve('success');
      const result = await withTimeout(promise, 1000);
      expect(result).toBe('success');
    });

    it('should reject with TimeoutError if timeout exceeded', async () => {
      vi.useFakeTimers();

      const slowPromise = new Promise((resolve) => {
        setTimeout(() => resolve('slow'), 2000);
      });

      const resultPromise = withTimeout(slowPromise, 1000);

      vi.advanceTimersByTime(1000);

      await expect(resultPromise).rejects.toThrow(TimeoutError);

      vi.useRealTimers();
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      const result = await withRetry(fn, { retries: 3 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      vi.useFakeTimers();

      const resultPromise = withRetry(fn, { retries: 3, baseDelayMs: 100 });

      // Advance through retries
      await vi.advanceTimersByTimeAsync(100); // After first failure
      await vi.advanceTimersByTimeAsync(200); // After second failure (exponential backoff)

      const result = await resultPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);

      vi.useRealTimers();
    });

    it('should call onRetry callback', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success');

      const onRetry = vi.fn();

      vi.useFakeTimers();

      const resultPromise = withRetry(fn, { retries: 2, baseDelayMs: 100, onRetry });

      await vi.advanceTimersByTimeAsync(100);
      await resultPromise;

      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1);

      vi.useRealTimers();
    });

    it('should throw after all retries exhausted', async () => {
      vi.useRealTimers(); // Use real timers to avoid unhandled rejection

      const fn = vi.fn().mockRejectedValue(new Error('Always fails'));

      await expect(
        withRetry(fn, { retries: 2, baseDelayMs: 10, maxDelayMs: 20 })
      ).rejects.toThrow('Always fails');

      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should respect maxDelayMs', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockRejectedValueOnce(new Error('Fail'))
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success');

      vi.useFakeTimers();

      const resultPromise = withRetry(fn, {
        retries: 5,
        baseDelayMs: 1000,
        maxDelayMs: 2000,
      });

      // First retry: 1000ms
      await vi.advanceTimersByTimeAsync(1000);
      // Second retry: 2000ms (would be 2000, capped at 2000)
      await vi.advanceTimersByTimeAsync(2000);
      // Third retry: 2000ms (would be 4000, capped at 2000)
      await vi.advanceTimersByTimeAsync(2000);

      await resultPromise;
      expect(fn).toHaveBeenCalledTimes(4);

      vi.useRealTimers();
    });
  });
});
