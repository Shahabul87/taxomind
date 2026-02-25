/**
 * Tests for admin audit helpers
 * Source: lib/admin/audit-helpers.ts
 */

import { db } from '@/lib/db';
import {
  logAdminAuditEvent,
  createAdminSessionMetric,
  updateAdminSessionMetric,
  endAdminSession,
  logAdminLoginSuccess,
  logAdminLoginFailure,
} from '@/lib/admin/audit-helpers';

const mockDb = db as Record<string, Record<string, jest.Mock>>;

// The global mock may not include adminAuditLog and adminSessionMetrics.
// Ensure they exist with standard Prisma methods.
function ensureModel(name: string) {
  if (!mockDb[name]) {
    mockDb[name] = {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(() => Promise.resolve([])),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(() => Promise.resolve(0)),
    };
  }
}
ensureModel('adminAuditLog');
ensureModel('adminSessionMetrics');

describe('audit-helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logAdminAuditEvent', () => {
    it('should create an audit log entry', async () => {
      (mockDb.adminAuditLog.create as jest.Mock).mockResolvedValue({ id: 'audit-1' });

      await logAdminAuditEvent({
        userId: 'admin-1',
        action: 'USER_DELETE',
        actionCategory: 'USER_MANAGEMENT',
        resource: 'User',
        resourceId: 'user-123',
        ipAddress: '192.168.1.1',
        success: true,
        statusCode: 200,
      });

      expect(mockDb.adminAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'admin-1',
          adminAccountId: 'admin-1',
          action: 'USER_DELETE',
          actionCategory: 'USER_MANAGEMENT',
          resource: 'User',
          resourceId: 'user-123',
          ipAddress: '192.168.1.1',
          success: true,
          statusCode: 200,
          timestamp: expect.any(Date),
        }),
      });
    });

    it('should handle audit log failure gracefully', async () => {
      (mockDb.adminAuditLog.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      // Should not throw - audit failures are silently caught
      await expect(
        logAdminAuditEvent({
          userId: 'admin-1',
          action: 'LOGIN',
          success: true,
        })
      ).resolves.toBeUndefined();
    });

    it('should serialize previousValue and newValue', async () => {
      (mockDb.adminAuditLog.create as jest.Mock).mockResolvedValue({ id: 'audit-2' });

      const previousValue = { name: 'Old Name', email: 'old@test.com' };
      const newValue = { name: 'New Name', email: 'new@test.com' };

      await logAdminAuditEvent({
        userId: 'admin-1',
        action: 'USER_UPDATE',
        success: true,
        previousValue,
        newValue,
      });

      expect(mockDb.adminAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          previousValue: previousValue,
          newValue: newValue,
        }),
      });
    });

    it('should use default action category when not provided', async () => {
      (mockDb.adminAuditLog.create as jest.Mock).mockResolvedValue({ id: 'audit-3' });

      await logAdminAuditEvent({
        userId: 'admin-1',
        action: 'CUSTOM_ACTION',
        success: true,
      });

      expect(mockDb.adminAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actionCategory: 'GENERAL',
        }),
      });
    });
  });

  describe('createAdminSessionMetric', () => {
    it('should create a session metric record', async () => {
      (mockDb.adminSessionMetrics.create as jest.Mock).mockResolvedValue({ id: 'sm-1' });

      await createAdminSessionMetric({
        userId: 'admin-1',
        sessionId: 'session-123',
        sessionToken: 'token-abc',
        ipAddress: '10.0.0.1',
        userAgent: 'Mozilla/5.0',
        browser: 'Chrome',
        os: 'macOS',
      });

      expect(mockDb.adminSessionMetrics.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'admin-1',
          sessionId: 'session-123',
          ipAddress: '10.0.0.1',
          actionsCount: 0,
          apiCallsCount: 0,
          isSuspicious: false,
          securityScore: 100,
        }),
      });
    });

    it('should handle session creation failure gracefully', async () => {
      (mockDb.adminSessionMetrics.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(
        createAdminSessionMetric({
          userId: 'admin-1',
          sessionId: 'session-fail',
          ipAddress: '10.0.0.1',
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('updateAdminSessionMetric', () => {
    it('should update an existing session metric', async () => {
      (mockDb.adminSessionMetrics.findUnique as jest.Mock).mockResolvedValue({
        sessionId: 'session-1',
        actionsCount: 5,
      });
      (mockDb.adminSessionMetrics.update as jest.Mock).mockResolvedValue({ sessionId: 'session-1' });

      await updateAdminSessionMetric('session-1', {
        actionsCount: 10,
        isSuspicious: false,
      });

      expect(mockDb.adminSessionMetrics.update).toHaveBeenCalledWith({
        where: { sessionId: 'session-1' },
        data: expect.objectContaining({
          lastActivity: expect.any(Date),
          actionsCount: 10,
        }),
      });
    });

    it('should warn and return when session not found', async () => {
      (mockDb.adminSessionMetrics.findUnique as jest.Mock).mockResolvedValue(null);

      await updateAdminSessionMetric('nonexistent-session', { actionsCount: 1 });

      expect(mockDb.adminSessionMetrics.update).not.toHaveBeenCalled();
    });
  });

  describe('endAdminSession', () => {
    it('should end a session with duration calculation', async () => {
      const loginTime = new Date(Date.now() - 3600000); // 1 hour ago
      (mockDb.adminSessionMetrics.findUnique as jest.Mock).mockResolvedValue({
        sessionId: 'session-1',
        loginTime,
      });
      (mockDb.adminSessionMetrics.update as jest.Mock).mockResolvedValue({ sessionId: 'session-1' });

      await endAdminSession('session-1', 'USER_LOGOUT', false);

      expect(mockDb.adminSessionMetrics.update).toHaveBeenCalledWith({
        where: { sessionId: 'session-1' },
        data: expect.objectContaining({
          logoutTime: expect.any(Date),
          sessionDuration: expect.any(Number),
          logoutReason: 'USER_LOGOUT',
          wasForced: false,
        }),
      });

      const callData = (mockDb.adminSessionMetrics.update as jest.Mock).mock.calls[0][0].data;
      expect(callData.sessionDuration).toBeGreaterThanOrEqual(3600);
    });

    it('should not update when session not found', async () => {
      (mockDb.adminSessionMetrics.findUnique as jest.Mock).mockResolvedValue(null);

      await endAdminSession('nonexistent');

      expect(mockDb.adminSessionMetrics.update).not.toHaveBeenCalled();
    });
  });

  describe('logAdminLoginSuccess', () => {
    it('should log a successful login audit event', async () => {
      (mockDb.adminAuditLog.create as jest.Mock).mockResolvedValue({ id: 'audit-login' });

      await logAdminLoginSuccess('admin-1', 'session-1', '10.0.0.1', 'Chrome', 'credentials');

      expect(mockDb.adminAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'LOGIN',
          actionCategory: 'AUTHENTICATION',
          success: true,
        }),
      });
    });
  });

  describe('logAdminLoginFailure', () => {
    it('should log a failed login audit event', async () => {
      (mockDb.adminAuditLog.create as jest.Mock).mockResolvedValue({ id: 'audit-fail' });

      await logAdminLoginFailure('admin-1', '10.0.0.1', 'Invalid credentials');

      expect(mockDb.adminAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'LOGIN_FAILED',
          actionCategory: 'AUTHENTICATION',
          success: false,
          failureReason: 'Invalid credentials',
        }),
      });
    });
  });
});
