/**
 * Tests for lib/distributed-lock.ts
 *
 * Covers two exported functions:
 *   - acquireLock(name, ttlSeconds?) -> Promise<boolean>
 *   - releaseLock(name) -> Promise<void>
 *
 * The module uses a Redis client obtained via dynamic import('redis').
 * When Redis is unavailable (no REDIS_URL or connection failure), the lock
 * functions gracefully degrade to single-instance mode (acquireLock returns true,
 * releaseLock is a no-op).
 *
 * We test:
 *   1. Behavior when Redis is not available (no REDIS_URL)
 *   2. Behavior when Redis connect fails
 *   3. Successful lock acquisition (SET NX EX returns 'OK')
 *   4. Failed lock acquisition (lock already held, SET returns null)
 *   5. Redis error during acquire (fail-open: returns true)
 *   6. Successful lock release (DEL)
 *   7. Redis error during release (swallowed, lock auto-expires via TTL)
 *   8. Default TTL value
 *   9. Redis client caching (getRedisClient called once, cached thereafter)
 */

// Unmock the module under test so we test real implementation
jest.unmock('@/lib/distributed-lock');

// Mock 'redis' as a virtual module since it is not installed as a dependency.
// The source code uses `await import('redis')` which will resolve to this mock.
const mockSet = jest.fn();
const mockDel = jest.fn();
const mockGet = jest.fn();
const mockConnect = jest.fn();
const mockCreateClient = jest.fn();

jest.mock('redis', () => ({
  createClient: mockCreateClient,
}), { virtual: true });

describe('lib/distributed-lock', () => {
  const originalRedisUrl = process.env.REDIS_URL;

  afterEach(() => {
    // Restore REDIS_URL
    if (originalRedisUrl !== undefined) {
      process.env.REDIS_URL = originalRedisUrl;
    } else {
      delete process.env.REDIS_URL;
    }
  });

  // ================================================================
  // No Redis available (REDIS_URL not set)
  // ================================================================

  describe('when REDIS_URL is not set', () => {
    it('acquireLock returns true (single-instance fallback)', async () => {
      await jest.isolateModulesAsync(async () => {
        delete process.env.REDIS_URL;
        const { acquireLock } = await import('@/lib/distributed-lock');
        const result = await acquireLock('cron:test-job');
        expect(result).toBe(true);
      });
    });

    it('releaseLock completes without error', async () => {
      await jest.isolateModulesAsync(async () => {
        delete process.env.REDIS_URL;
        const { releaseLock } = await import('@/lib/distributed-lock');
        await expect(releaseLock('cron:test-job')).resolves.toBeUndefined();
      });
    });

    it('acquireLock does not attempt to connect to Redis', async () => {
      await jest.isolateModulesAsync(async () => {
        delete process.env.REDIS_URL;
        mockCreateClient.mockClear();
        const { acquireLock } = await import('@/lib/distributed-lock');
        await acquireLock('cron:no-redis');
        expect(mockCreateClient).not.toHaveBeenCalled();
      });
    });
  });

  // ================================================================
  // Redis connect failure
  // ================================================================

  describe('when Redis connection fails', () => {
    it('acquireLock returns true (fail-open)', async () => {
      await jest.isolateModulesAsync(async () => {
        process.env.REDIS_URL = 'redis://bad-host:6379';
        mockCreateClient.mockReturnValue({
          connect: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
          set: mockSet,
          del: mockDel,
          get: mockGet,
        });
        const { acquireLock } = await import('@/lib/distributed-lock');
        const result = await acquireLock('cron:failing-job');
        expect(result).toBe(true);
      });
    });

    it('releaseLock completes without error when connection fails', async () => {
      await jest.isolateModulesAsync(async () => {
        process.env.REDIS_URL = 'redis://bad-host:6379';
        mockCreateClient.mockReturnValue({
          connect: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
          set: mockSet,
          del: mockDel,
          get: mockGet,
        });
        const { releaseLock } = await import('@/lib/distributed-lock');
        await expect(releaseLock('cron:failing-job')).resolves.toBeUndefined();
      });
    });
  });

  // ================================================================
  // Redis is available and working
  // ================================================================

  describe('when Redis is available', () => {
    // We use isolateModulesAsync for each test to get a fresh module
    // (no cached redisClient from previous tests).

    function setupRedisMock() {
      mockSet.mockReset();
      mockDel.mockReset();
      mockGet.mockReset();
      mockConnect.mockReset();
      mockCreateClient.mockReset();

      mockConnect.mockResolvedValue(undefined);
      mockCreateClient.mockReturnValue({
        connect: mockConnect,
        set: mockSet,
        del: mockDel,
        get: mockGet,
      });
      process.env.REDIS_URL = 'redis://localhost:6379';
    }

    // ---- acquireLock ----

    it('acquires lock when SET NX EX returns OK', async () => {
      await jest.isolateModulesAsync(async () => {
        setupRedisMock();
        mockSet.mockResolvedValue('OK');

        const { acquireLock } = await import('@/lib/distributed-lock');
        const result = await acquireLock('cron:practice-streaks');

        expect(result).toBe(true);
        expect(mockSet).toHaveBeenCalledTimes(1);
      });
    });

    it('passes correct lock key format (lock:<name>)', async () => {
      await jest.isolateModulesAsync(async () => {
        setupRedisMock();
        mockSet.mockResolvedValue('OK');

        const { acquireLock } = await import('@/lib/distributed-lock');
        await acquireLock('cron:daily-digest');

        expect(mockSet).toHaveBeenCalledWith(
          'lock:cron:daily-digest',
          expect.any(String),
          'NX',
          'EX',
          expect.any(String)
        );
      });
    });

    it('uses default TTL of 300 seconds when not specified', async () => {
      await jest.isolateModulesAsync(async () => {
        setupRedisMock();
        mockSet.mockResolvedValue('OK');

        const { acquireLock } = await import('@/lib/distributed-lock');
        await acquireLock('cron:default-ttl');

        expect(mockSet).toHaveBeenCalledWith(
          'lock:cron:default-ttl',
          expect.any(String),
          'NX',
          'EX',
          '300'
        );
      });
    });

    it('uses custom TTL when specified', async () => {
      await jest.isolateModulesAsync(async () => {
        setupRedisMock();
        mockSet.mockResolvedValue('OK');

        const { acquireLock } = await import('@/lib/distributed-lock');
        await acquireLock('cron:custom-ttl', 60);

        expect(mockSet).toHaveBeenCalledWith(
          'lock:cron:custom-ttl',
          expect.any(String),
          'NX',
          'EX',
          '60'
        );
      });
    });

    it('returns false when lock is already held (SET returns null)', async () => {
      await jest.isolateModulesAsync(async () => {
        setupRedisMock();
        mockSet.mockResolvedValue(null);

        const { acquireLock } = await import('@/lib/distributed-lock');
        const result = await acquireLock('cron:already-locked');

        expect(result).toBe(false);
      });
    });

    it('includes process PID and timestamp in lock value', async () => {
      await jest.isolateModulesAsync(async () => {
        setupRedisMock();
        mockSet.mockResolvedValue('OK');

        const { acquireLock } = await import('@/lib/distributed-lock');
        await acquireLock('cron:value-check');

        const lockValue = mockSet.mock.calls[0][1] as string;
        expect(lockValue).toContain(String(process.pid));
        expect(lockValue).toContain(':');
        // Value format: "<pid>:<timestamp>"
        const parts = lockValue.split(':');
        expect(parts).toHaveLength(2);
        expect(Number(parts[0])).toBe(process.pid);
        expect(Number(parts[1])).toBeGreaterThan(0);
      });
    });

    it('returns true (fail-open) when Redis SET throws an error', async () => {
      await jest.isolateModulesAsync(async () => {
        setupRedisMock();
        mockSet.mockRejectedValue(new Error('Redis READONLY'));

        const { acquireLock } = await import('@/lib/distributed-lock');
        const result = await acquireLock('cron:redis-error');

        expect(result).toBe(true);
      });
    });

    // ---- releaseLock ----

    it('deletes the lock key on release', async () => {
      await jest.isolateModulesAsync(async () => {
        setupRedisMock();
        mockSet.mockResolvedValue('OK');
        mockDel.mockResolvedValue(1);

        const { acquireLock, releaseLock } = await import('@/lib/distributed-lock');
        // First acquire to initialize the redis client
        await acquireLock('cron:release-test');
        // Then release
        await releaseLock('cron:release-test');

        expect(mockDel).toHaveBeenCalledWith('lock:cron:release-test');
      });
    });

    it('swallows Redis errors during release', async () => {
      await jest.isolateModulesAsync(async () => {
        setupRedisMock();
        mockSet.mockResolvedValue('OK');
        mockDel.mockRejectedValue(new Error('Redis connection closed'));

        const { acquireLock, releaseLock } = await import('@/lib/distributed-lock');
        // First acquire to initialize the redis client
        await acquireLock('cron:release-error');
        // Release should not throw
        await expect(releaseLock('cron:release-error')).resolves.toBeUndefined();
      });
    });

    // ---- Client caching ----

    it('reuses the same Redis client for multiple calls', async () => {
      await jest.isolateModulesAsync(async () => {
        setupRedisMock();
        mockSet.mockResolvedValue('OK');

        const { acquireLock } = await import('@/lib/distributed-lock');

        await acquireLock('cron:first-call');
        await acquireLock('cron:second-call');

        // createClient should have been called only once (client is cached)
        expect(mockCreateClient).toHaveBeenCalledTimes(1);
      });
    });

    it('connects to Redis with the URL from environment', async () => {
      await jest.isolateModulesAsync(async () => {
        setupRedisMock();
        process.env.REDIS_URL = 'redis://custom-host:6380';
        mockSet.mockResolvedValue('OK');

        const { acquireLock } = await import('@/lib/distributed-lock');
        await acquireLock('cron:url-check');

        expect(mockCreateClient).toHaveBeenCalledWith({
          url: 'redis://custom-host:6380',
        });
      });
    });
  });
});
