/**
 * Session Limiter Test Suite
 * Tests for concurrent session management
 */

describe('Session Limiter', () => {
  // Module references - populated in beforeEach
  let countActiveSessions: Function;
  let enforceSessionLimit: Function;
  let getActiveSessions: Function;
  let terminateAllSessions: Function;
  let terminateSession: Function;

  // Mock functions
  let mockCount: jest.Mock;
  let mockFindFirst: jest.Mock;
  let mockFindMany: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockUpdateMany: jest.Mock;

  beforeEach(() => {
    // Reset ALL modules to ensure fresh imports
    jest.resetModules();

    // Create fresh mock functions
    mockCount = jest.fn();
    mockFindFirst = jest.fn();
    mockFindMany = jest.fn();
    mockUpdate = jest.fn();
    mockUpdateMany = jest.fn();

    const mockDbObj = {
      authSession: {
        count: mockCount,
        findFirst: mockFindFirst,
        findMany: mockFindMany,
        update: mockUpdate,
        updateMany: mockUpdateMany,
      },
    };

    // Mock React cache
    jest.doMock('react', () => ({
      ...jest.requireActual('react'),
      cache: (fn: Function) => fn,
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
    const sessionLimiter = require('@/lib/auth/session-limiter');
    countActiveSessions = sessionLimiter.countActiveSessions;
    enforceSessionLimit = sessionLimiter.enforceSessionLimit;
    getActiveSessions = sessionLimiter.getActiveSessions;
    terminateAllSessions = sessionLimiter.terminateAllSessions;
    terminateSession = sessionLimiter.terminateSession;
  });

  describe('countActiveSessions', () => {
    it('returns the count of active sessions', async () => {
      mockCount.mockResolvedValue(3);

      const count = await countActiveSessions('user-123');

      expect(count).toBe(3);
      expect(mockCount).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isActive: true,
          expiresAt: { gt: expect.any(Date) },
        },
      });
    });

    it('returns 0 on database error', async () => {
      mockCount.mockRejectedValue(new Error('DB Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const count = await countActiveSessions('user-123');

      expect(count).toBe(0);
      consoleSpy.mockRestore();
    });
  });

  describe('enforceSessionLimit', () => {
    it('does not enforce when under the limit', async () => {
      mockCount.mockResolvedValue(3);

      const result = await enforceSessionLimit('user-123');

      expect(result).toEqual({
        enforced: false,
        terminatedCount: 0,
      });
      expect(mockFindFirst).not.toHaveBeenCalled();
    });

    it('terminates oldest session when at limit', async () => {
      mockCount.mockResolvedValue(5);
      mockFindFirst.mockResolvedValue({
        id: 'oldest-session-id',
        userId: 'user-123',
      });
      mockUpdate.mockResolvedValue({});
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await enforceSessionLimit('user-123');

      expect(result).toEqual({
        enforced: true,
        terminatedCount: 1,
      });
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'oldest-session-id' },
        data: { isActive: false },
      });
      consoleSpy.mockRestore();
    });

    it('excludes current device when re-authenticating', async () => {
      mockCount.mockResolvedValue(5);
      mockFindFirst.mockResolvedValue({
        id: 'oldest-session-id',
        userId: 'user-123',
      });
      mockUpdate.mockResolvedValue({});
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await enforceSessionLimit('user-123', 'current-device-id');

      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isActive: true,
          expiresAt: { gt: expect.any(Date) },
          NOT: { deviceId: 'current-device-id' },
        },
        orderBy: { lastActivity: 'asc' },
      });
      consoleSpy.mockRestore();
    });

    it('handles no session found to terminate', async () => {
      mockCount.mockResolvedValue(5);
      mockFindFirst.mockResolvedValue(null);

      const result = await enforceSessionLimit('user-123');

      expect(result).toEqual({
        enforced: false,
        terminatedCount: 0,
      });
    });

    it('handles database errors gracefully', async () => {
      mockCount.mockRejectedValue(new Error('DB Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await enforceSessionLimit('user-123');

      expect(result).toEqual({
        enforced: false,
        terminatedCount: 0,
      });
      consoleSpy.mockRestore();
    });
  });

  describe('getActiveSessions', () => {
    it('returns list of active sessions', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          deviceId: 'device-1',
          deviceName: 'Chrome on Windows',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          lastActivity: new Date(),
          createdAt: new Date(),
          isTrustedDevice: true,
          riskLevel: 'LOW',
        },
        {
          id: 'session-2',
          deviceId: 'device-2',
          deviceName: 'Safari on iPhone',
          ipAddress: '192.168.1.2',
          userAgent: 'Safari',
          lastActivity: new Date(),
          createdAt: new Date(),
          isTrustedDevice: false,
          riskLevel: 'MEDIUM',
        },
      ];
      mockFindMany.mockResolvedValue(mockSessions);

      const sessions = await getActiveSessions('user-123');

      expect(sessions).toHaveLength(2);
      expect(sessions[0].id).toBe('session-1');
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isActive: true,
          expiresAt: { gt: expect.any(Date) },
        },
        select: {
          id: true,
          deviceId: true,
          deviceName: true,
          ipAddress: true,
          userAgent: true,
          lastActivity: true,
          createdAt: true,
          isTrustedDevice: true,
          riskLevel: true,
        },
        orderBy: { lastActivity: 'desc' },
      });
    });

    it('returns empty array on database error', async () => {
      mockFindMany.mockRejectedValue(new Error('DB Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const sessions = await getActiveSessions('user-123');

      expect(sessions).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  describe('terminateAllSessions', () => {
    it('terminates all sessions for a user', async () => {
      mockUpdateMany.mockResolvedValue({ count: 4 });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await terminateAllSessions('user-123');

      expect(result).toEqual({ terminatedCount: 4 });
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isActive: true,
        },
        data: { isActive: false },
      });
      consoleSpy.mockRestore();
    });

    it('excludes specified device from termination', async () => {
      mockUpdateMany.mockResolvedValue({ count: 3 });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await terminateAllSessions('user-123', 'keep-this-device');

      expect(result).toEqual({ terminatedCount: 3 });
      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isActive: true,
          NOT: { deviceId: 'keep-this-device' },
        },
        data: { isActive: false },
      });
      consoleSpy.mockRestore();
    });

    it('handles database errors gracefully', async () => {
      mockUpdateMany.mockRejectedValue(new Error('DB Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await terminateAllSessions('user-123');

      expect(result).toEqual({ terminatedCount: 0 });
      consoleSpy.mockRestore();
    });
  });

  describe('terminateSession', () => {
    it('terminates a specific session owned by the user', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'session-123',
        userId: 'user-123',
      });
      mockUpdate.mockResolvedValue({});
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await terminateSession('session-123', 'user-123');

      expect(result).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: { isActive: false },
      });
      consoleSpy.mockRestore();
    });

    it('returns false for non-existent session', async () => {
      mockFindFirst.mockResolvedValue(null);

      const result = await terminateSession('session-123', 'user-123');

      expect(result).toBe(false);
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('returns false when session belongs to different user', async () => {
      mockFindFirst.mockResolvedValue(null); // No match because userId doesn't match

      const result = await terminateSession('session-123', 'wrong-user');

      expect(result).toBe(false);
    });

    it('handles database errors gracefully', async () => {
      mockFindFirst.mockRejectedValue(new Error('DB Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await terminateSession('session-123', 'user-123');

      expect(result).toBe(false);
      consoleSpy.mockRestore();
    });
  });
});
