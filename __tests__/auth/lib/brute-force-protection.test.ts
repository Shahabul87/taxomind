/**
 * Brute Force Protection Test Suite
 * Tests for account lockout and login attempt tracking
 */

describe('Brute Force Protection', () => {
  // Module references - populated in beforeEach
  let recordLoginAttempt: Function;
  let checkAccountLocked: Function;
  let incrementFailedAttempts: Function;
  let resetFailedAttempts: Function;
  let getRecentAttemptCount: Function;
  let isAttemptRateLimited: Function;

  // Mock functions
  let mockLoginAttemptCreate: jest.Mock;
  let mockLoginAttemptCount: jest.Mock;
  let mockUserFindUnique: jest.Mock;
  let mockUserUpdate: jest.Mock;

  beforeEach(() => {
    // Reset ALL modules to ensure fresh imports
    jest.resetModules();

    // Create fresh mock functions
    mockLoginAttemptCreate = jest.fn();
    mockLoginAttemptCount = jest.fn();
    mockUserFindUnique = jest.fn();
    mockUserUpdate = jest.fn();

    const mockDbObj = {
      loginAttempt: {
        create: mockLoginAttemptCreate,
        count: mockLoginAttemptCount,
      },
      user: {
        findUnique: mockUserFindUnique,
        update: mockUserUpdate,
      },
    };

    // Mock uuid
    jest.doMock('uuid', () => ({
      v4: jest.fn().mockReturnValue('mock-uuid-123'),
    }));

    // Mock React cache
    jest.doMock('react', () => ({
      ...jest.requireActual('react'),
      cache: (fn: Function) => fn,
    }));

    // Mock logger
    jest.doMock('@/lib/logger', () => ({
      logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
    }));

    // Mock BOTH db paths
    jest.doMock('@/lib/db', () => ({
      db: mockDbObj,
    }));

    jest.doMock('@/lib/db-pooled', () => ({
      db: mockDbObj,
      getDb: jest.fn(() => mockDbObj),
      getDbMetrics: jest.fn(),
      checkDatabaseHealth: jest.fn(),
      getBasePrismaClient: jest.fn(),
    }));

    // Import modules AFTER mocking
    const bruteForce = require('@/lib/auth/brute-force-protection');
    recordLoginAttempt = bruteForce.recordLoginAttempt;
    checkAccountLocked = bruteForce.checkAccountLocked;
    incrementFailedAttempts = bruteForce.incrementFailedAttempts;
    resetFailedAttempts = bruteForce.resetFailedAttempts;
    getRecentAttemptCount = bruteForce.getRecentAttemptCount;
    isAttemptRateLimited = bruteForce.isAttemptRateLimited;
  });

  describe('recordLoginAttempt', () => {
    it('creates a login attempt record for successful login', async () => {
      mockLoginAttemptCreate.mockResolvedValue({});

      await recordLoginAttempt(
        'test@example.com',
        '192.168.1.1',
        true,
        'Mozilla/5.0'
      );

      expect(mockLoginAttemptCreate).toHaveBeenCalledWith({
        data: {
          id: 'mock-uuid-123',
          email: 'test@example.com',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          success: true,
        },
      });
    });

    it('creates a login attempt record for failed login', async () => {
      mockLoginAttemptCreate.mockResolvedValue({});

      await recordLoginAttempt(
        'test@example.com',
        '192.168.1.1',
        false
      );

      expect(mockLoginAttemptCreate).toHaveBeenCalledWith({
        data: {
          id: 'mock-uuid-123',
          email: 'test@example.com',
          ipAddress: '192.168.1.1',
          userAgent: null,
          success: false,
        },
      });
    });

    it('handles database errors gracefully', async () => {
      mockLoginAttemptCreate.mockRejectedValue(new Error('DB Error'));
      const { logger } = require('@/lib/logger');

      await recordLoginAttempt('test@example.com', '192.168.1.1', false);

      expect(logger.error).toHaveBeenCalledWith(
        '[BruteForce] Failed to record login attempt',
        expect.any(Error)
      );
    });
  });

  describe('checkAccountLocked', () => {
    it('returns not locked for non-existent user', async () => {
      mockUserFindUnique.mockResolvedValue(null);

      const result = await checkAccountLocked('user-123');

      expect(result).toEqual({
        locked: false,
        remainingMs: 0,
        reason: null,
      });
    });

    it('returns not locked for unlocked account', async () => {
      mockUserFindUnique.mockResolvedValue({
        isAccountLocked: false,
        lockReason: null,
        failedLoginAttempts: 2,
        lastLoginAt: new Date(),
      });

      const result = await checkAccountLocked('user-123');

      expect(result).toEqual({
        locked: false,
        remainingMs: 0,
        reason: null,
      });
    });

    it('returns locked status with remaining time', async () => {
      const lockTime = new Date();
      mockUserFindUnique.mockResolvedValue({
        isAccountLocked: true,
        lockReason: 'Too many failed attempts',
        failedLoginAttempts: 5,
        lastLoginAt: lockTime,
      });

      const result = await checkAccountLocked('user-123');

      expect(result.locked).toBe(true);
      expect(result.remainingMs).toBeGreaterThan(0);
      expect(result.reason).toBe('Too many failed attempts');
    });

    it('auto-unlocks expired lockouts', async () => {
      const expiredLockTime = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
      mockUserFindUnique.mockResolvedValue({
        isAccountLocked: true,
        lockReason: 'Too many failed attempts',
        failedLoginAttempts: 5,
        lastLoginAt: expiredLockTime,
      });
      mockUserUpdate.mockResolvedValue({});

      const result = await checkAccountLocked('user-123');

      expect(result).toEqual({
        locked: false,
        remainingMs: 0,
        reason: null,
      });
      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          isAccountLocked: false,
          lockReason: null,
          failedLoginAttempts: 0,
        },
      });
    });

    it('handles database errors gracefully (fail open)', async () => {
      mockUserFindUnique.mockRejectedValue(new Error('DB Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await checkAccountLocked('user-123');

      expect(result).toEqual({
        locked: false,
        remainingMs: 0,
        reason: null,
      });
      consoleSpy.mockRestore();
    });
  });

  describe('incrementFailedAttempts', () => {
    it('returns not locked for non-existent user', async () => {
      mockUserFindUnique.mockResolvedValue(null);

      const result = await incrementFailedAttempts('user-123');

      expect(result).toEqual({
        locked: false,
        attempts: 0,
      });
    });

    it('increments failed attempts without locking', async () => {
      mockUserFindUnique.mockResolvedValue({
        failedLoginAttempts: 2,
      });
      mockUserUpdate.mockResolvedValue({});

      const result = await incrementFailedAttempts('user-123');

      expect(result).toEqual({
        locked: false,
        attempts: 3,
      });
      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          failedLoginAttempts: 3,
          isAccountLocked: false,
          lockReason: null,
          lastLoginAt: undefined,
        },
      });
    });

    it('locks account after 5 failed attempts', async () => {
      mockUserFindUnique.mockResolvedValue({
        failedLoginAttempts: 4,
      });
      mockUserUpdate.mockResolvedValue({});

      const result = await incrementFailedAttempts('user-123');

      expect(result).toEqual({
        locked: true,
        attempts: 5,
      });
      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: expect.objectContaining({
          failedLoginAttempts: 5,
          isAccountLocked: true,
          lockReason: 'Too many failed login attempts (5)',
        }),
      });
    });

    it('handles database errors gracefully', async () => {
      mockUserFindUnique.mockRejectedValue(new Error('DB Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await incrementFailedAttempts('user-123');

      expect(result).toEqual({
        locked: false,
        attempts: 0,
      });
      consoleSpy.mockRestore();
    });
  });

  describe('resetFailedAttempts', () => {
    it('resets failed attempts and unlocks account', async () => {
      mockUserUpdate.mockResolvedValue({});

      await resetFailedAttempts('user-123');

      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          failedLoginAttempts: 0,
          isAccountLocked: false,
          lockReason: null,
          lastLoginAt: expect.any(Date),
        },
      });
    });

    it('handles database errors gracefully', async () => {
      mockUserUpdate.mockRejectedValue(new Error('DB Error'));
      const { logger } = require('@/lib/logger');

      await resetFailedAttempts('user-123');

      expect(logger.error).toHaveBeenCalledWith(
        '[BruteForce] Failed to reset failed attempts',
        expect.any(Error)
      );
    });
  });

  describe('getRecentAttemptCount', () => {
    it('returns count of recent failed attempts', async () => {
      mockLoginAttemptCount.mockResolvedValue(3);

      const count = await getRecentAttemptCount(
        'test@example.com',
        '192.168.1.1',
        15
      );

      expect(count).toBe(3);
      expect(mockLoginAttemptCount).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: 'test@example.com' },
            { ipAddress: '192.168.1.1' },
          ],
          createdAt: { gte: expect.any(Date) },
          success: false,
        },
      });
    });

    it('uses default window of 15 minutes', async () => {
      mockLoginAttemptCount.mockResolvedValue(0);

      await getRecentAttemptCount('test@example.com', '192.168.1.1');

      expect(mockLoginAttemptCount).toHaveBeenCalled();
    });

    it('handles database errors gracefully', async () => {
      mockLoginAttemptCount.mockRejectedValue(new Error('DB Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const count = await getRecentAttemptCount('test@example.com', '192.168.1.1');

      expect(count).toBe(0);
      consoleSpy.mockRestore();
    });
  });

  describe('isAttemptRateLimited', () => {
    it('returns false when under the limit', async () => {
      mockLoginAttemptCount.mockResolvedValue(5);

      const isLimited = await isAttemptRateLimited(
        'test@example.com',
        '192.168.1.1',
        10,
        15
      );

      expect(isLimited).toBe(false);
    });

    it('returns true when at the limit', async () => {
      mockLoginAttemptCount.mockResolvedValue(10);

      const isLimited = await isAttemptRateLimited(
        'test@example.com',
        '192.168.1.1',
        10,
        15
      );

      expect(isLimited).toBe(true);
    });

    it('returns true when over the limit', async () => {
      mockLoginAttemptCount.mockResolvedValue(15);

      const isLimited = await isAttemptRateLimited(
        'test@example.com',
        '192.168.1.1',
        10,
        15
      );

      expect(isLimited).toBe(true);
    });

    it('uses default values when not provided', async () => {
      mockLoginAttemptCount.mockResolvedValue(5);

      const isLimited = await isAttemptRateLimited(
        'test@example.com',
        '192.168.1.1'
      );

      expect(isLimited).toBe(false);
    });
  });
});
