/**
 * MFA TOTP Setup API Route Tests
 * Tests for POST/GET /api/auth/mfa/totp/setup
 */

import { NextRequest, NextResponse } from 'next/server';

describe('MFA TOTP Setup API', () => {
  // Module references - populated in beforeEach
  let POST: Function;
  let GET: Function;

  // Mock functions
  let mockAuth: jest.Mock;
  let mockWithAuthRateLimit: jest.Mock;
  let mockUserFindUnique: jest.Mock;
  let mockUserUpdate: jest.Mock;
  let mockLoggerInfo: jest.Mock;
  let mockLoggerError: jest.Mock;
  let mockCreateTOTPSetup: jest.Mock;
  let mockEncryptTOTPSecret: jest.Mock;
  let mockEncryptRecoveryCodes: jest.Mock;
  let mockValidateTOTPSetup: jest.Mock;

  beforeEach(() => {
    // Reset ALL modules to ensure fresh imports
    jest.resetModules();

    // Create fresh mock functions
    mockAuth = jest.fn();
    mockWithAuthRateLimit = jest.fn();
    mockUserFindUnique = jest.fn();
    mockUserUpdate = jest.fn();
    mockLoggerInfo = jest.fn();
    mockLoggerError = jest.fn();
    mockCreateTOTPSetup = jest.fn();
    mockEncryptTOTPSecret = jest.fn();
    mockEncryptRecoveryCodes = jest.fn();
    mockValidateTOTPSetup = jest.fn();

    const mockDbObj = {
      user: {
        findUnique: mockUserFindUnique,
        update: mockUserUpdate,
      },
    };

    // Default mock implementations
    mockWithAuthRateLimit.mockResolvedValue({
      success: true,
      headers: { 'X-RateLimit-Remaining': '10' },
    });

    mockCreateTOTPSetup.mockResolvedValue({
      secret: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
      qrCodeUrl: 'data:image/png;base64,mockQRCode',
      backupCodes: Array(10).fill('AAAA-BBBB-CCCC-DDDD'),
    });

    mockEncryptTOTPSecret.mockResolvedValue('encrypted-secret');
    mockEncryptRecoveryCodes.mockResolvedValue(['encrypted-code-1', 'encrypted-code-2']);
    mockValidateTOTPSetup.mockReturnValue({ isValid: true, errors: [] });

    // Mock React cache
    jest.doMock('react', () => ({
      ...jest.requireActual('react'),
      cache: (fn: Function) => fn,
    }));

    // Mock auth
    jest.doMock('@/auth', () => ({
      auth: () => mockAuth(),
    }));

    // Mock rate limit middleware
    jest.doMock('@/lib/auth-rate-limit-middleware', () => ({
      withAuthRateLimit: (req: NextRequest, type: string) => mockWithAuthRateLimit(req, type),
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

    // Mock logger
    jest.doMock('@/lib/logger', () => ({
      logger: {
        info: mockLoggerInfo,
        error: mockLoggerError,
      },
    }));

    // Mock totp utilities
    jest.doMock('@/lib/auth/totp', () => ({
      createTOTPSetup: mockCreateTOTPSetup,
      encryptTOTPSecret: mockEncryptTOTPSecret,
      encryptRecoveryCodes: mockEncryptRecoveryCodes,
      validateTOTPSetup: mockValidateTOTPSetup,
    }));

    // Import modules AFTER mocking
    const route = require('@/app/api/auth/mfa/totp/setup/route');
    POST = route.POST;
    GET = route.GET;
  });

  describe('POST /api/auth/mfa/totp/setup', () => {
    it('returns 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/auth/mfa/totp/setup', {
        method: 'POST',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });

    it('returns 404 when user not found', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
      mockUserFindUnique.mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/auth/mfa/totp/setup', {
        method: 'POST',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('returns 400 when TOTP already enabled', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
      mockUserFindUnique.mockResolvedValue({
        totpEnabled: true,
        totpVerified: true,
        totpSecret: 'existing-secret',
      });

      const req = new NextRequest('http://localhost/api/auth/mfa/totp/setup', {
        method: 'POST',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('already enabled');
    });

    it('initiates TOTP setup successfully', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
      mockUserFindUnique.mockResolvedValue({
        totpEnabled: false,
        totpVerified: false,
        totpSecret: null,
      });
      mockUserUpdate.mockResolvedValue({});

      const req = new NextRequest('http://localhost/api/auth/mfa/totp/setup', {
        method: 'POST',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.qrCodeUrl).toBeDefined();
      expect(data.data.backupCodes).toHaveLength(10);
      expect(data.data.setupComplete).toBe(false);
    });

    it('stores encrypted secret and recovery codes', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
      mockUserFindUnique.mockResolvedValue({
        totpEnabled: false,
        totpVerified: false,
        totpSecret: null,
      });
      mockUserUpdate.mockResolvedValue({});

      const req = new NextRequest('http://localhost/api/auth/mfa/totp/setup', {
        method: 'POST',
      });

      await POST(req);

      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          totpSecret: 'encrypted-secret',
          recoveryCodes: ['encrypted-code-1', 'encrypted-code-2'],
          totpEnabled: false,
          totpVerified: false,
        },
      });
    });

    it('logs setup initiation', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
      mockUserFindUnique.mockResolvedValue({
        totpEnabled: false,
        totpVerified: false,
        totpSecret: null,
      });
      mockUserUpdate.mockResolvedValue({});

      const req = new NextRequest('http://localhost/api/auth/mfa/totp/setup', {
        method: 'POST',
      });

      await POST(req);

      expect(mockLoggerInfo).toHaveBeenCalledWith(
        '[TOTP_SETUP_INITIATED]',
        expect.objectContaining({
          userId: 'user-123',
          userEmail: 'test@example.com',
        })
      );
    });

    it('calls rate limit middleware for POST requests', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      });
      mockUserFindUnique.mockResolvedValue({
        totpEnabled: false,
        totpVerified: false,
        totpSecret: null,
      });
      mockUserUpdate.mockResolvedValue({});

      const req = new NextRequest('http://localhost/api/auth/mfa/totp/setup', {
        method: 'POST',
      });

      await POST(req);

      // Verify rate limit middleware was called with correct parameters
      expect(mockWithAuthRateLimit).toHaveBeenCalledWith(
        expect.any(Object),
        'twoFactor'
      );
    });
  });

  describe('GET /api/auth/mfa/totp/setup', () => {
    it('returns 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/auth/mfa/totp/setup');

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 404 when user not found', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
      });
      mockUserFindUnique.mockResolvedValue(null);

      const req = new NextRequest('http://localhost/api/auth/mfa/totp/setup');

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('returns TOTP status for user', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
      });
      mockUserFindUnique.mockResolvedValue({
        totpEnabled: true,
        totpVerified: true,
        isTwoFactorEnabled: true,
        recoveryCodes: ['code1', 'code2', 'code3'],
      });

      const req = new NextRequest('http://localhost/api/auth/mfa/totp/setup');

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.totpEnabled).toBe(true);
      expect(data.data.totpVerified).toBe(true);
      expect(data.data.twoFactorEnabled).toBe(true);
      expect(data.data.remainingRecoveryCodes).toBe(3);
      expect(data.data.setupRequired).toBe(false);
    });

    it('indicates setup required when not enabled', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123' },
      });
      mockUserFindUnique.mockResolvedValue({
        totpEnabled: false,
        totpVerified: false,
        isTwoFactorEnabled: false,
        recoveryCodes: [],
      });

      const req = new NextRequest('http://localhost/api/auth/mfa/totp/setup');

      const response = await GET(req);
      const data = await response.json();

      expect(data.data.setupRequired).toBe(true);
    });

    it('handles errors gracefully', async () => {
      mockAuth.mockRejectedValue(new Error('Auth error'));

      const req = new NextRequest('http://localhost/api/auth/mfa/totp/setup');

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to get TOTP status');
    });
  });
});
