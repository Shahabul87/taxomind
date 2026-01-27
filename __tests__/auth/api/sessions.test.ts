/**
 * Sessions API Route Tests
 * Tests for GET/DELETE /api/auth/sessions
 */

import { NextRequest } from 'next/server';

describe('Sessions API', () => {
  // Module references - populated in beforeEach
  let GET: Function;
  let DELETE: Function;

  // Mock functions
  let mockAuth: jest.Mock;
  let mockGetActiveSessions: jest.Mock;
  let mockTerminateAllSessions: jest.Mock;

  beforeEach(() => {
    // Reset ALL modules to ensure fresh imports
    jest.resetModules();

    // Create fresh mock functions
    mockAuth = jest.fn();
    mockGetActiveSessions = jest.fn();
    mockTerminateAllSessions = jest.fn();

    // Mock React cache
    jest.doMock('react', () => ({
      ...jest.requireActual('react'),
      cache: (fn: Function) => fn,
    }));

    // Mock auth
    jest.doMock('@/auth', () => ({
      auth: () => mockAuth(),
    }));

    // Mock session limiter
    jest.doMock('@/lib/auth/session-limiter', () => ({
      getActiveSessions: (userId: string) => mockGetActiveSessions(userId),
      terminateAllSessions: (userId: string, deviceId?: string) =>
        mockTerminateAllSessions(userId, deviceId),
    }));

    // Import modules AFTER mocking
    const route = require('@/app/api/auth/sessions/route');
    GET = route.GET;
    DELETE = route.DELETE;
  });

  describe('GET /api/auth/sessions', () => {
    it('returns 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns list of active sessions', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          deviceId: 'device-1',
          deviceName: 'Chrome on Windows',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          lastActivity: new Date('2024-01-15T10:00:00Z'),
          createdAt: new Date('2024-01-14T08:00:00Z'),
          isTrustedDevice: true,
          riskLevel: 'LOW',
        },
        {
          id: 'session-2',
          deviceId: 'device-2',
          deviceName: null,
          ipAddress: '192.168.1.2',
          userAgent: 'Safari',
          lastActivity: new Date('2024-01-15T09:00:00Z'),
          createdAt: new Date('2024-01-13T12:00:00Z'),
          isTrustedDevice: false,
          riskLevel: 'MEDIUM',
        },
      ];

      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
      });
      mockGetActiveSessions.mockResolvedValue(mockSessions);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sessions).toHaveLength(2);
      expect(data.total).toBe(2);
    });

    it('formats session data correctly', async () => {
      const lastActivity = new Date('2024-01-15T10:00:00Z');
      const createdAt = new Date('2024-01-14T08:00:00Z');

      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
      });
      mockGetActiveSessions.mockResolvedValue([
        {
          id: 'session-1',
          deviceId: 'device-1',
          deviceName: 'Chrome on Windows',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          lastActivity,
          createdAt,
          isTrustedDevice: true,
          riskLevel: 'LOW',
        },
      ]);

      const response = await GET();
      const data = await response.json();

      const session = data.sessions[0];
      expect(session.id).toBe('session-1');
      expect(session.deviceId).toBe('device-1');
      expect(session.deviceName).toBe('Chrome on Windows');
      expect(session.ipAddress).toBe('192.168.1.1');
      expect(session.userAgent).toBe('Mozilla/5.0');
      expect(session.lastActivity).toBe(lastActivity.toISOString());
      expect(session.createdAt).toBe(createdAt.toISOString());
      expect(session.isTrusted).toBe(true);
      expect(session.riskLevel).toBe('LOW');
    });

    it('uses "Unknown Device" for null device names', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
      });
      mockGetActiveSessions.mockResolvedValue([
        {
          id: 'session-1',
          deviceId: 'device-1',
          deviceName: null,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          lastActivity: new Date(),
          createdAt: new Date(),
          isTrustedDevice: false,
          riskLevel: 'LOW',
        },
      ]);

      const response = await GET();
      const data = await response.json();

      expect(data.sessions[0].deviceName).toBe('Unknown Device');
    });

    it('returns empty list when no active sessions', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
      });
      mockGetActiveSessions.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.sessions).toEqual([]);
      expect(data.total).toBe(0);
    });

    it('handles errors gracefully', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
      });
      mockGetActiveSessions.mockRejectedValue(new Error('Database error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to get sessions');
      consoleSpy.mockRestore();
    });
  });

  describe('DELETE /api/auth/sessions', () => {
    it('returns 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/auth/sessions', {
        method: 'DELETE',
      });

      const response = await DELETE(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('terminates all sessions when no body provided', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
      });
      mockTerminateAllSessions.mockResolvedValue({ terminatedCount: 5 });

      const req = new NextRequest('http://localhost/api/auth/sessions', {
        method: 'DELETE',
      });

      const response = await DELETE(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.terminatedCount).toBe(5);
      expect(data.message).toBe('Logged out of 5 device(s)');
      expect(mockTerminateAllSessions).toHaveBeenCalledWith('user-123', undefined);
    });

    it('keeps current device when keepCurrent is true', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
      });
      mockTerminateAllSessions.mockResolvedValue({ terminatedCount: 4 });

      const req = new NextRequest('http://localhost/api/auth/sessions', {
        method: 'DELETE',
        body: JSON.stringify({
          keepCurrent: true,
          currentDeviceId: 'my-device-id',
        }),
      });

      const response = await DELETE(req);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.terminatedCount).toBe(4);
      expect(mockTerminateAllSessions).toHaveBeenCalledWith('user-123', 'my-device-id');
    });

    it('terminates all sessions when keepCurrent is false', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
      });
      mockTerminateAllSessions.mockResolvedValue({ terminatedCount: 5 });

      const req = new NextRequest('http://localhost/api/auth/sessions', {
        method: 'DELETE',
        body: JSON.stringify({
          keepCurrent: false,
          currentDeviceId: 'my-device-id',
        }),
      });

      const response = await DELETE(req);

      expect(mockTerminateAllSessions).toHaveBeenCalledWith('user-123', undefined);
    });

    it('handles invalid JSON body gracefully', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
      });
      mockTerminateAllSessions.mockResolvedValue({ terminatedCount: 3 });

      const req = new NextRequest('http://localhost/api/auth/sessions', {
        method: 'DELETE',
        body: 'invalid-json',
      });

      const response = await DELETE(req);
      const data = await response.json();

      // Should still work, defaulting to terminate all
      expect(data.success).toBe(true);
      expect(mockTerminateAllSessions).toHaveBeenCalledWith('user-123', undefined);
    });

    it('handles errors gracefully', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
      });
      mockTerminateAllSessions.mockRejectedValue(new Error('Database error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const req = new NextRequest('http://localhost/api/auth/sessions', {
        method: 'DELETE',
      });

      const response = await DELETE(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to logout devices');
      consoleSpy.mockRestore();
    });

    it('validates request body schema', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
      });
      mockTerminateAllSessions.mockResolvedValue({ terminatedCount: 0 });

      const req = new NextRequest('http://localhost/api/auth/sessions', {
        method: 'DELETE',
        body: JSON.stringify({
          keepCurrent: 'not-a-boolean', // Invalid type
          currentDeviceId: 123, // Invalid type
        }),
      });

      const response = await DELETE(req);

      // Schema validation fails, should use defaults
      expect(mockTerminateAllSessions).toHaveBeenCalledWith('user-123', undefined);
    });
  });
});
