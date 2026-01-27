/**
 * Admin JWT Test Suite
 * Tests for admin authentication JWT utilities
 */

describe('Admin JWT', () => {
  // Module references - populated in beforeEach
  let adminJwtConfig: {
    encode: (params: { secret: string; token?: unknown; maxAge?: number }) => Promise<string | null>;
    decode: (params: { secret: string; token?: string }) => Promise<unknown | null>;
  };
  let isAdminJWT: (token: string) => boolean;
  let isUserJWT: (token: string) => boolean;
  let ADMIN_JWT_CONFIG_SUMMARY: Record<string, unknown>;

  // Mock functions
  let mockJwtSign: jest.Mock;
  let mockJwtVerify: jest.Mock;

  const originalEnv = process.env;

  beforeEach(() => {
    // Reset ALL modules to ensure fresh imports
    jest.resetModules();

    // Reset environment
    process.env = {
      ...originalEnv,
      ADMIN_JWT_SECRET: 'test-admin-secret',
      AUTH_SECRET: 'test-auth-secret',
    };

    // Create fresh mock functions
    mockJwtSign = jest.fn().mockReturnValue('mock-admin-jwt-token');
    mockJwtVerify = jest.fn();

    // Mock jsonwebtoken
    jest.doMock('jsonwebtoken', () => ({
      sign: mockJwtSign,
      verify: mockJwtVerify,
      TokenExpiredError: class TokenExpiredError extends Error {
        expiredAt: Date;
        constructor(message: string, expiredAt: Date) {
          super(message);
          this.name = 'TokenExpiredError';
          this.expiredAt = expiredAt;
        }
      },
    }));

    // Import modules AFTER mocking
    const adminJwt = require('@/lib/auth/admin-jwt');
    adminJwtConfig = adminJwt.adminJwtConfig;
    isAdminJWT = adminJwt.isAdminJWT;
    isUserJWT = adminJwt.isUserJWT;
    ADMIN_JWT_CONFIG_SUMMARY = adminJwt.ADMIN_JWT_CONFIG_SUMMARY;

    // Suppress console logs in tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterAll(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('adminJwtConfig.encode', () => {
    it('returns null when no token provided', async () => {
      const result = await adminJwtConfig.encode({
        secret: 'test-secret',
        token: undefined,
      });

      expect(result).toBeNull();
    });

    it('encodes a valid admin token with correct claims', async () => {
      const token = {
        sub: 'admin-123',
        email: 'admin@example.com',
        role: 'ADMIN',
      };

      await adminJwtConfig.encode({
        secret: 'test-secret',
        token,
        maxAge: 3600,
      });

      expect(mockJwtSign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'admin-123',
          email: 'admin@example.com',
          role: 'ADMIN',
          aud: 'taxomind-admin',
          iss: 'taxomind-admin-auth',
          adminAuth: true,
          sessionType: 'ADMIN',
          authType: 'ADMIN_CREDENTIALS',
          securityLevel: 'ELEVATED',
          requiresMFA: true,
        }),
        expect.any(String),
        expect.objectContaining({
          algorithm: 'HS512',
        })
      );
    });

    it('uses custom maxAge when provided', async () => {
      await adminJwtConfig.encode({
        secret: 'test-secret',
        token: { sub: 'admin-123', email: 'admin@example.com', role: 'ADMIN' },
        maxAge: 7200, // 2 hours
      });

      expect(mockJwtSign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({
          expiresIn: 7200,
        })
      );
    });

    it('uses default maxAge of 4 hours when not provided', async () => {
      await adminJwtConfig.encode({
        secret: 'test-secret',
        token: { sub: 'admin-123', email: 'admin@example.com', role: 'ADMIN' },
      });

      expect(mockJwtSign).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({
          expiresIn: 4 * 60 * 60, // 4 hours in seconds
        })
      );
    });

    it('returns encoded token on success', async () => {
      const result = await adminJwtConfig.encode({
        secret: 'test-secret',
        token: { sub: 'admin-123', email: 'admin@example.com', role: 'ADMIN' },
      });

      expect(result).toBe('mock-admin-jwt-token');
    });

    it('throws error when encoding fails', async () => {
      mockJwtSign.mockImplementation(() => {
        throw new Error('Encoding failed');
      });

      await expect(
        adminJwtConfig.encode({
          secret: 'test-secret',
          token: { sub: 'admin-123', email: 'admin@example.com', role: 'ADMIN' },
        })
      ).rejects.toThrow('Encoding failed');
    });
  });

  describe('adminJwtConfig.decode', () => {
    it('returns null when no token provided', async () => {
      const result = await adminJwtConfig.decode({
        secret: 'test-secret',
        token: undefined,
      });

      expect(result).toBeNull();
    });

    it('returns null for invalid JWT format', async () => {
      const result = await adminJwtConfig.decode({
        secret: 'test-secret',
        token: 'invalid-token',
      });

      expect(result).toBeNull();
    });

    it('extracts JWT from cookie format', async () => {
      const validAdminPayload = {
        sub: 'admin-123',
        email: 'admin@example.com',
        role: 'ADMIN',
        aud: 'taxomind-admin',
        iss: 'taxomind-admin-auth',
        adminAuth: true,
        sessionType: 'ADMIN',
      };

      // Create a mock JWT structure
      const mockPayload = Buffer.from(JSON.stringify(validAdminPayload)).toString('base64');
      const mockJwt = `eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.${mockPayload}.mockSignature`;
      const cookieString = `admin-session-token=${mockJwt}`;

      mockJwtVerify.mockReturnValue(validAdminPayload);

      const result = await adminJwtConfig.decode({
        secret: 'test-secret',
        token: cookieString,
      });

      expect(result).toBeTruthy();
    });

    it('verifies admin-specific claims', async () => {
      const validAdminPayload = {
        sub: 'admin-123',
        email: 'admin@example.com',
        role: 'ADMIN',
        aud: 'taxomind-admin',
        iss: 'taxomind-admin-auth',
        adminAuth: true,
        sessionType: 'ADMIN',
      };

      const mockPayload = Buffer.from(JSON.stringify(validAdminPayload)).toString('base64');
      const mockJwt = `eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.${mockPayload}.mockSignature`;

      mockJwtVerify.mockReturnValue(validAdminPayload);

      const result = await adminJwtConfig.decode({
        secret: 'test-secret',
        token: mockJwt,
      });

      expect(result).toEqual(validAdminPayload);
    });

    it('rejects token without adminAuth claim', async () => {
      const invalidPayload = {
        sub: 'admin-123',
        email: 'admin@example.com',
        role: 'ADMIN',
        aud: 'taxomind-admin',
        iss: 'taxomind-admin-auth',
        adminAuth: false, // Invalid
        sessionType: 'ADMIN',
      };

      const mockPayload = Buffer.from(JSON.stringify(invalidPayload)).toString('base64');
      const mockJwt = `eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.${mockPayload}.mockSignature`;

      mockJwtVerify.mockReturnValue(invalidPayload);

      const result = await adminJwtConfig.decode({
        secret: 'test-secret',
        token: mockJwt,
      });

      expect(result).toBeNull();
    });

    it('rejects token with wrong sessionType', async () => {
      const invalidPayload = {
        sub: 'user-123',
        email: 'user@example.com',
        role: 'ADMIN',
        aud: 'taxomind-admin',
        iss: 'taxomind-admin-auth',
        adminAuth: true,
        sessionType: 'USER', // Invalid
      };

      const mockPayload = Buffer.from(JSON.stringify(invalidPayload)).toString('base64');
      const mockJwt = `eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.${mockPayload}.mockSignature`;

      mockJwtVerify.mockReturnValue(invalidPayload);

      const result = await adminJwtConfig.decode({
        secret: 'test-secret',
        token: mockJwt,
      });

      expect(result).toBeNull();
    });

    it('handles expired token error', async () => {
      const validAdminPayload = {
        sub: 'admin-123',
        role: 'ADMIN',
        aud: 'taxomind-admin',
        iss: 'taxomind-admin-auth',
        adminAuth: true,
        sessionType: 'ADMIN',
      };

      const mockPayload = Buffer.from(JSON.stringify(validAdminPayload)).toString('base64');
      const mockJwt = `eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.${mockPayload}.mockSignature`;

      // Get the mocked TokenExpiredError class
      const jwt = require('jsonwebtoken');
      const expiredError = new jwt.TokenExpiredError('Token expired', new Date());

      mockJwtVerify.mockImplementation(() => {
        throw expiredError;
      });

      const result = await adminJwtConfig.decode({
        secret: 'test-secret',
        token: mockJwt,
      });

      expect(result).toBeNull();
    });
  });

  describe('isAdminJWT', () => {
    it('returns true for valid admin JWT', () => {
      const adminPayload = {
        adminAuth: true,
        sessionType: 'ADMIN',
        aud: 'taxomind-admin',
        iss: 'taxomind-admin-auth',
      };

      const mockPayload = Buffer.from(JSON.stringify(adminPayload)).toString('base64');
      const mockJwt = `eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.${mockPayload}.mockSignature`;

      expect(isAdminJWT(mockJwt)).toBe(true);
    });

    it('returns false for user JWT', () => {
      const userPayload = {
        sub: 'user-123',
        role: 'USER',
      };

      const mockPayload = Buffer.from(JSON.stringify(userPayload)).toString('base64');
      const mockJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${mockPayload}.mockSignature`;

      expect(isAdminJWT(mockJwt)).toBe(false);
    });

    it('returns false for invalid token', () => {
      expect(isAdminJWT('invalid')).toBe(false);
      expect(isAdminJWT('')).toBe(false);
      expect(isAdminJWT('a.b')).toBe(false);
    });
  });

  describe('isUserJWT', () => {
    it('returns true for valid user JWT', () => {
      const userPayload = {
        sub: 'user-123',
        role: 'USER',
      };

      const mockPayload = Buffer.from(JSON.stringify(userPayload)).toString('base64');
      const mockJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${mockPayload}.mockSignature`;

      expect(isUserJWT(mockJwt)).toBe(true);
    });

    it('returns false for admin JWT', () => {
      const adminPayload = {
        adminAuth: true,
        sessionType: 'ADMIN',
        aud: 'taxomind-admin',
      };

      const mockPayload = Buffer.from(JSON.stringify(adminPayload)).toString('base64');
      const mockJwt = `eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.${mockPayload}.mockSignature`;

      expect(isUserJWT(mockJwt)).toBe(false);
    });

    it('returns false for invalid token', () => {
      expect(isUserJWT('invalid')).toBe(false);
    });
  });

  describe('ADMIN_JWT_CONFIG_SUMMARY', () => {
    it('exports configuration summary', () => {
      expect(ADMIN_JWT_CONFIG_SUMMARY).toBeDefined();
      expect(ADMIN_JWT_CONFIG_SUMMARY.algorithm).toBe('HS512');
      expect(ADMIN_JWT_CONFIG_SUMMARY.maxAge).toBe(4 * 60 * 60);
      expect(ADMIN_JWT_CONFIG_SUMMARY.audience).toBe('taxomind-admin');
      expect(ADMIN_JWT_CONFIG_SUMMARY.issuer).toBe('taxomind-admin-auth');
      expect(ADMIN_JWT_CONFIG_SUMMARY.customClaims).toContain('adminAuth');
      expect(ADMIN_JWT_CONFIG_SUMMARY.customClaims).toContain('sessionType');
      expect(ADMIN_JWT_CONFIG_SUMMARY.securityFeatures).toBeInstanceOf(Array);
    });
  });
});
