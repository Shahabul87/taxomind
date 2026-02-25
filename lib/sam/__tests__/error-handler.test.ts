/**
 * Tests for SAM Error Handler
 */

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
} from '../utils/error-handler';

describe('Error Handler', () => {
  describe('SAMError classes', () => {
    it('creates SAMError with correct properties', () => {
      const error = new SAMError('Test error', 'TEST_CODE', {
        context: { key: 'value' },
        recoverable: true,
      });

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.context).toEqual({ key: 'value' });
      expect(error.recoverable).toBe(true);
      expect(error.name).toBe('SAMError');
    });

    it('creates SAMInitializationError correctly', () => {
      const cause = new Error('Root cause');
      const error = new SAMInitializationError('TestService', 'connection failed', cause);

      expect(error.message).toContain('TestService');
      expect(error.message).toContain('connection failed');
      expect(error.code).toBe('SAM_INIT_ERROR');
      expect(error.recoverable).toBe(false);
      expect(error.cause).toBe(cause);
    });

    it('creates SAMServiceUnavailableError correctly', () => {
      const error = new SAMServiceUnavailableError('AIAdapter', 'API key missing');

      expect(error.message).toContain('AIAdapter');
      expect(error.message).toContain('API key missing');
      expect(error.code).toBe('SAM_SERVICE_UNAVAILABLE');
      expect(error.recoverable).toBe(true);
    });

    it('creates SAMTimeoutError correctly', () => {
      const error = new SAMTimeoutError('fetchData', 5000);

      expect(error.message).toContain('fetchData');
      expect(error.message).toContain('5000');
      expect(error.code).toBe('SAM_TIMEOUT');
    });
  });

  describe('withErrorHandling', () => {
    it('returns result on success', async () => {
      const result = await withErrorHandling(
        async () => 'success',
        { component: 'Test', operation: 'test' }
      );

      expect(result).toBe('success');
    });

    it('rethrows error by default', async () => {
      await expect(
        withErrorHandling(
          async () => {
            throw new Error('Test error');
          },
          { component: 'Test', operation: 'test' }
        )
      ).rejects.toThrow('Test error');
    });

    it('returns fallback on error when provided', async () => {
      const result = await withErrorHandling(
        async () => {
          throw new Error('Test error');
        },
        { component: 'Test', operation: 'test', fallback: 'default' }
      );

      expect(result).toBe('default');
    });

    it('transforms error when transformer provided', async () => {
      await expect(
        withErrorHandling(
          async () => {
            throw new Error('Original');
          },
          {
            component: 'Test',
            operation: 'test',
            transform: () => new SAMConfigError('Transformed'),
          }
        )
      ).rejects.toThrow('Transformed');
    });
  });

  describe('withErrorHandlingSync', () => {
    it('returns result on success', () => {
      const result = withErrorHandlingSync(
        () => 'success',
        { component: 'Test', operation: 'test' }
      );

      expect(result).toBe('success');
    });

    it('returns fallback on error', () => {
      const result = withErrorHandlingSync(
        () => {
          throw new Error('Test error');
        },
        { component: 'Test', operation: 'test', fallback: 'default' }
      );

      expect(result).toBe('default');
    });
  });

  describe('Convenience functions', () => {
    it('mustSucceed throws on error', async () => {
      await expect(
        mustSucceed(
          async () => {
            throw new Error('Must fail');
          },
          'Test',
          'operation'
        )
      ).rejects.toThrow('Must fail');
    });

    it('tryOptional returns null on error', async () => {
      const result = await tryOptional(
        async () => {
          throw new Error('Optional error');
        },
        'Test',
        'operation'
      );

      expect(result).toBeNull();
    });

    it('tryArray returns empty array on error', async () => {
      const result = await tryArray(
        async () => {
          throw new Error('Array error');
        },
        'Test',
        'operation'
      );

      expect(result).toEqual([]);
    });
  });

  describe('withRetry', () => {
    it('succeeds on first try', async () => {
      let attempts = 0;
      const result = await withRetry(
        async () => {
          attempts++;
          return 'success';
        },
        { maxAttempts: 3 }
      );

      expect(result).toBe('success');
      expect(attempts).toBe(1);
    });

    it('retries on failure and eventually succeeds', async () => {
      let attempts = 0;
      const result = await withRetry(
        async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Retry me');
          }
          return 'success after retries';
        },
        { maxAttempts: 3, initialDelayMs: 10 }
      );

      expect(result).toBe('success after retries');
      expect(attempts).toBe(3);
    });

    it('throws after max attempts', async () => {
      let attempts = 0;
      await expect(
        withRetry(
          async () => {
            attempts++;
            throw new Error('Always fails');
          },
          { maxAttempts: 3, initialDelayMs: 10 }
        )
      ).rejects.toThrow('Always fails');

      expect(attempts).toBe(3);
    });

    it('respects isRetryable option', async () => {
      let attempts = 0;
      await expect(
        withRetry(
          async () => {
            attempts++;
            throw new Error('Not retryable');
          },
          {
            maxAttempts: 3,
            initialDelayMs: 10,
            isRetryable: () => false,
          }
        )
      ).rejects.toThrow('Not retryable');

      expect(attempts).toBe(1); // Only tried once
    });
  });

  describe('withTimeout', () => {
    it('returns result if operation completes in time', async () => {
      const result = await withTimeout(
        async () => {
          await new Promise((r) => setTimeout(r, 10));
          return 'completed';
        },
        1000,
        'testOp'
      );

      expect(result).toBe('completed');
    });

    it('throws SAMTimeoutError if operation exceeds timeout', async () => {
      await expect(
        withTimeout(
          async () => {
            await new Promise((r) => setTimeout(r, 100));
            return 'too slow';
          },
          10,
          'slowOp'
        )
      ).rejects.toThrow(SAMTimeoutError);
    });
  });

  describe('CircuitBreaker', () => {
    it('starts in closed state', () => {
      const breaker = new CircuitBreaker({ failureThreshold: 3 });
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('allows requests when closed', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 3 });
      const result = await breaker.execute(async () => 'success');
      expect(result).toBe('success');
    });

    it('opens after threshold failures', async () => {
      // Set coldStartThreshold equal to failureThreshold to bypass cold-start grace period
      const breaker = new CircuitBreaker({ failureThreshold: 2, coldStartThreshold: 2 });

      // Fail twice
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Failure');
          });
        } catch {
          // Expected
        }
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('rejects requests when open', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 1, coldStartThreshold: 1 });

      // Trigger open
      try {
        await breaker.execute(async () => {
          throw new Error('Trigger open');
        });
      } catch {
        // Expected
      }

      await expect(
        breaker.execute(async () => 'should not run')
      ).rejects.toThrow(SAMServiceUnavailableError);
    });

    it('can be reset', async () => {
      const breaker = new CircuitBreaker({ failureThreshold: 1, coldStartThreshold: 1 });

      // Trigger open
      try {
        await breaker.execute(async () => {
          throw new Error('Failure');
        });
      } catch {
        // Expected
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      breaker.reset();
      expect(breaker.getState()).toBe(CircuitState.CLOSED);

      // Should work again
      const result = await breaker.execute(async () => 'works');
      expect(result).toBe('works');
    });
  });

  describe('Utility functions', () => {
    describe('getErrorMessage', () => {
      it('extracts message from Error', () => {
        expect(getErrorMessage(new Error('Test message'))).toBe('Test message');
      });

      it('converts non-Error to string', () => {
        expect(getErrorMessage('string error')).toBe('string error');
        expect(getErrorMessage(123)).toBe('123');
        expect(getErrorMessage({ foo: 'bar' })).toBe('[object Object]');
      });
    });

    describe('isSAMError', () => {
      it('returns true for SAMError', () => {
        expect(isSAMError(new SAMError('Test', 'CODE'))).toBe(true);
        expect(isSAMError(new SAMInitializationError('Svc', 'reason'))).toBe(true);
      });

      it('returns false for regular Error', () => {
        expect(isSAMError(new Error('Regular'))).toBe(false);
      });
    });

    describe('createErrorResponse', () => {
      it('formats SAMError correctly', () => {
        const error = new SAMError('Test error', 'TEST_CODE', {
          context: { key: 'value' },
        });
        const response = createErrorResponse(error);

        expect(response).toEqual({
          error: 'Test error',
          code: 'TEST_CODE',
          details: { key: 'value' },
        });
      });

      it('formats regular Error correctly', () => {
        const response = createErrorResponse(new Error('Regular error'));

        expect(response).toEqual({
          error: 'Regular error',
        });
      });

      it('uses default message for unknown errors', () => {
        const response = createErrorResponse(null, 'Default message');

        expect(response).toEqual({
          error: 'Default message',
        });
      });
    });
  });
});
