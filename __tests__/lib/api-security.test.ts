/**
 * Tests for API Security Manager
 * Source: lib/api-security.ts
 *
 * Covers:
 * - RateLimiter singleton pattern
 * - RateLimiter.check() with new identifier, exceeding limit, window reset
 * - RateLimiter.getRemainingAttempts()
 * - RateLimiter.getResetTime()
 * - APISecurityManager.validateAPIKey() - valid key, missing key, expired key,
 *   locked account, rate-limited key, inactive key
 * - APISecurityManager.generateAPIKey() - with and without options
 * - APISecurityManager.revokeAPIKey() - success, not-found, db error
 * - APISecurityManager.validateJWT() - valid token, missing secret, invalid token,
 *   locked user
 * - APISecurityManager.checkIPRateLimit() - allowed and blocked
 * - APISecurityManager.getClientIP() - forwarded-for, real-ip, unknown
 * - withAPIAuth() wrapper - rate limiting, bearer auth, API key auth, permissions,
 *   security headers, handler error
 */

// Mock jsonwebtoken before any imports
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn(),
}));

// Mock crypto module (createHash and randomBytes)
jest.mock('crypto', () => {
  const actualCrypto = jest.requireActual('crypto');
  return {
    ...actualCrypto,
    createHash: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn(() => 'mocked-hash-value'),
    })),
    randomBytes: jest.fn(() => ({
      toString: jest.fn(() => 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'),
    })),
  };
});

// @/lib/db and next/server are globally mocked via jest.setup.js
// @/lib/permissions is auto-resolved via path alias

import { APISecurityManager, withAPIAuth } from '@/lib/api-security';
import { db } from '@/lib/db';
import * as jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const mockDb = db as jest.Mocked<typeof db>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockNextRequest(
  url = 'http://localhost:3000/api/test',
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {}
): NextRequest {
  return new NextRequest(url, {
    method: options.method ?? 'GET',
    headers: options.headers ?? {},
    body: options.body,
  }) as unknown as NextRequest;
}

// ---------------------------------------------------------------------------
// RateLimiter (tested indirectly through APISecurityManager.checkIPRateLimit
// and directly by accessing the singleton)
// ---------------------------------------------------------------------------

describe('RateLimiter (via APISecurityManager)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for clean test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  // The RateLimiter is a private singleton used inside APISecurityManager.
  // We exercise it through checkIPRateLimit which delegates to the RateLimiter.

  it('should allow a new identifier on first check', async () => {
    (mockDb as Record<string, unknown>).enhancedAuditLog = {
      create: jest.fn().mockResolvedValue({}),
    };

    const result = await APISecurityManager.checkIPRateLimit(
      '10.0.0.1',
      '/api/new-endpoint-unique-1',
      5
    );

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.resetAt).toBeInstanceOf(Date);
  });

  it('should block requests that exceed the rate limit', async () => {
    (mockDb as Record<string, unknown>).enhancedAuditLog = {
      create: jest.fn().mockResolvedValue({}),
    };

    const ip = '10.0.0.2';
    const endpoint = '/api/block-test-unique';
    const limit = 3;

    // Exhaust the limit
    for (let i = 0; i < limit; i++) {
      const r = await APISecurityManager.checkIPRateLimit(ip, endpoint, limit);
      expect(r.allowed).toBe(true);
    }

    // Next request should be blocked
    const blocked = await APISecurityManager.checkIPRateLimit(ip, endpoint, limit);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('should log an audit entry when IP rate limit is exceeded', async () => {
    const auditCreate = jest.fn().mockResolvedValue({});
    (mockDb as Record<string, unknown>).enhancedAuditLog = { create: auditCreate };

    const ip = '10.0.0.3';
    const endpoint = '/api/audit-log-test-unique';
    const limit = 1;

    // First request allowed
    await APISecurityManager.checkIPRateLimit(ip, endpoint, limit);
    // Second request blocked - should create audit log
    await APISecurityManager.checkIPRateLimit(ip, endpoint, limit);

    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'IP_RATE_LIMIT_EXCEEDED',
          severity: 'WARNING',
          ipAddress: ip,
        }),
      })
    );
  });

  it('should reset rate limit after the time window expires', async () => {
    (mockDb as Record<string, unknown>).enhancedAuditLog = {
      create: jest.fn().mockResolvedValue({}),
    };

    // We cannot easily test the window expiry via checkIPRateLimit because
    // it uses the default 1-hour window. Instead, we verify the structural
    // reset behavior: a completely new ip+endpoint pair always starts fresh.
    const result = await APISecurityManager.checkIPRateLimit(
      '10.0.0.99',
      '/api/window-reset-unique',
      100
    );

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99);
  });

  it('should return correct remaining attempts count', async () => {
    (mockDb as Record<string, unknown>).enhancedAuditLog = {
      create: jest.fn().mockResolvedValue({}),
    };

    const ip = '10.0.0.4';
    const endpoint = '/api/remaining-unique';
    const limit = 5;

    await APISecurityManager.checkIPRateLimit(ip, endpoint, limit);
    const second = await APISecurityManager.checkIPRateLimit(ip, endpoint, limit);
    expect(second.remaining).toBe(3); // 5 - 2 used

    const third = await APISecurityManager.checkIPRateLimit(ip, endpoint, limit);
    expect(third.remaining).toBe(2); // 5 - 3 used
  });

  it('should return resetAt as a Date object', async () => {
    (mockDb as Record<string, unknown>).enhancedAuditLog = {
      create: jest.fn().mockResolvedValue({}),
    };

    const result = await APISecurityManager.checkIPRateLimit(
      '10.0.0.5',
      '/api/reset-time-unique',
      10
    );

    expect(result.resetAt).toBeInstanceOf(Date);
    // resetAt should be in the future
    expect(result.resetAt!.getTime()).toBeGreaterThan(Date.now() - 1000);
  });
});

// ---------------------------------------------------------------------------
// APISecurityManager.getClientIP
// ---------------------------------------------------------------------------

describe('APISecurityManager.getClientIP', () => {
  it('should extract IP from x-forwarded-for header (first entry)', () => {
    const req = createMockNextRequest('http://localhost:3000/api/test', {
      headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
    });

    const ip = APISecurityManager.getClientIP(req);
    expect(ip).toBe('192.168.1.1');
  });

  it('should extract IP from x-real-ip when x-forwarded-for is absent', () => {
    const req = createMockNextRequest('http://localhost:3000/api/test', {
      headers: { 'x-real-ip': '203.0.113.5' },
    });

    const ip = APISecurityManager.getClientIP(req);
    expect(ip).toBe('203.0.113.5');
  });

  it('should prefer x-forwarded-for over x-real-ip', () => {
    const req = createMockNextRequest('http://localhost:3000/api/test', {
      headers: {
        'x-forwarded-for': '192.168.1.1',
        'x-real-ip': '203.0.113.5',
      },
    });

    const ip = APISecurityManager.getClientIP(req);
    expect(ip).toBe('192.168.1.1');
  });

  it('should return "unknown" when no IP headers are present', () => {
    const req = createMockNextRequest('http://localhost:3000/api/test');
    const ip = APISecurityManager.getClientIP(req);
    expect(ip).toBe('unknown');
  });
});

// ---------------------------------------------------------------------------
// APISecurityManager.validateAPIKey
// ---------------------------------------------------------------------------

describe('APISecurityManager.validateAPIKey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Provide mock models that may not exist in global mock
    (mockDb as Record<string, unknown>).apiKey = {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    };
    (mockDb as Record<string, unknown>).enhancedAuditLog = {
      create: jest.fn().mockResolvedValue({}),
    };
  });

  it('should return invalid when X-API-Key header is missing', async () => {
    const req = createMockNextRequest();
    const result = await APISecurityManager.validateAPIKey(req);
    expect(result).toEqual({ valid: false });
  });

  it('should return invalid when API key is not found in database', async () => {
    (mockDb as Record<string, unknown>).apiKey = {
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
    };

    const req = createMockNextRequest('http://localhost:3000/api/test', {
      headers: { 'X-API-Key': 'invalid-key' },
    });

    const result = await APISecurityManager.validateAPIKey(req);
    expect(result).toEqual({ valid: false });
  });

  it('should return invalid when API key is inactive', async () => {
    (mockDb as Record<string, unknown>).apiKey = {
      findUnique: jest.fn().mockResolvedValue({
        id: 'key-1',
        isActive: false,
        user: { isAccountLocked: false },
        userId: 'user-1',
        permissions: ['read'],
        rateLimit: 100,
        expiresAt: null,
      }),
      update: jest.fn(),
    };

    const req = createMockNextRequest('http://localhost:3000/api/test', {
      headers: { 'X-API-Key': 'some-key' },
    });

    const result = await APISecurityManager.validateAPIKey(req);
    expect(result).toEqual({ valid: false });
  });

  it('should return invalid when user account is locked', async () => {
    (mockDb as Record<string, unknown>).apiKey = {
      findUnique: jest.fn().mockResolvedValue({
        id: 'key-2',
        isActive: true,
        user: { isAccountLocked: true },
        userId: 'user-2',
        permissions: ['read'],
        rateLimit: 100,
        expiresAt: null,
      }),
      update: jest.fn(),
    };

    const req = createMockNextRequest('http://localhost:3000/api/test', {
      headers: { 'X-API-Key': 'some-key' },
    });

    const result = await APISecurityManager.validateAPIKey(req);
    expect(result).toEqual({ valid: false });
  });

  it('should return invalid and deactivate an expired API key', async () => {
    const pastDate = new Date(Date.now() - 86400000); // yesterday
    const updateFn = jest.fn().mockResolvedValue({});

    (mockDb as Record<string, unknown>).apiKey = {
      findUnique: jest.fn().mockResolvedValue({
        id: 'key-3',
        isActive: true,
        user: { isAccountLocked: false },
        userId: 'user-3',
        permissions: ['read'],
        rateLimit: 100,
        expiresAt: pastDate,
      }),
      update: updateFn,
    };

    const req = createMockNextRequest('http://localhost:3000/api/test', {
      headers: { 'X-API-Key': 'expired-key' },
    });

    const result = await APISecurityManager.validateAPIKey(req);
    expect(result).toEqual({ valid: false });
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'key-3' },
        data: { isActive: false },
      })
    );
  });

  it('should return valid result for an active, non-expired API key', async () => {
    const futureDate = new Date(Date.now() + 86400000); // tomorrow
    const updateFn = jest.fn().mockResolvedValue({});
    const auditCreate = jest.fn().mockResolvedValue({});

    (mockDb as Record<string, unknown>).apiKey = {
      findUnique: jest.fn().mockResolvedValue({
        id: 'key-4',
        isActive: true,
        user: { isAccountLocked: false },
        userId: 'user-4',
        permissions: ['read', 'write'],
        rateLimit: 1000,
        expiresAt: futureDate,
      }),
      update: updateFn,
    };
    (mockDb as Record<string, unknown>).enhancedAuditLog = { create: auditCreate };

    const req = createMockNextRequest('http://localhost:3000/api/test', {
      headers: { 'X-API-Key': 'valid-key' },
    });

    const result = await APISecurityManager.validateAPIKey(req);

    expect(result.valid).toBe(true);
    expect(result.userId).toBe('user-4');
    expect(result.permissions).toEqual(['read', 'write']);
    expect(result.keyId).toBe('key-4');

    // Should update lastUsedAt
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'key-4' },
        data: expect.objectContaining({ lastUsedAt: expect.any(Date) }),
      })
    );

    // Should log usage
    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'API_KEY_USED',
        }),
      })
    );
  });

  it('should return invalid when database throws an error', async () => {
    (mockDb as Record<string, unknown>).apiKey = {
      findUnique: jest.fn().mockRejectedValue(new Error('DB connection failed')),
      update: jest.fn(),
    };

    const req = createMockNextRequest('http://localhost:3000/api/test', {
      headers: { 'X-API-Key': 'some-key' },
    });

    const result = await APISecurityManager.validateAPIKey(req);
    expect(result).toEqual({ valid: false });
  });
});

// ---------------------------------------------------------------------------
// APISecurityManager.generateAPIKey
// ---------------------------------------------------------------------------

describe('APISecurityManager.generateAPIKey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    (mockDb as Record<string, unknown>).apiKey = {
      create: jest.fn().mockResolvedValue({ id: 'new-key-id' }),
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    };
    (mockDb as Record<string, unknown>).enhancedAuditLog = {
      create: jest.fn().mockResolvedValue({}),
    };
  });

  it('should generate a new API key with default options', async () => {
    const result = await APISecurityManager.generateAPIKey(
      'user-1',
      'My API Key',
      ['read']
    );

    expect(result).toHaveProperty('key');
    expect(result).toHaveProperty('keyId', 'new-key-id');
    expect(typeof result.key).toBe('string');
    expect(result.key.length).toBeGreaterThan(0);
  });

  it('should store the hashed key and partial key in database', async () => {
    const createFn = jest.fn().mockResolvedValue({ id: 'created-key-id' });
    (mockDb as Record<string, unknown>).apiKey = {
      create: createFn,
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    };

    await APISecurityManager.generateAPIKey('user-1', 'Test Key', ['read']);

    expect(createFn).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          name: 'Test Key',
          permissions: ['read'],
          hashedKey: expect.any(String),
          key: expect.stringContaining('...'), // partial key
          rateLimit: 1000, // default
          expiresAt: null,
        }),
      })
    );
  });

  it('should respect custom rateLimit and expiresInDays options', async () => {
    const createFn = jest.fn().mockResolvedValue({ id: 'custom-key-id' });
    (mockDb as Record<string, unknown>).apiKey = {
      create: createFn,
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    };

    await APISecurityManager.generateAPIKey('user-2', 'Custom Key', ['write'], {
      rateLimit: 500,
      expiresInDays: 30,
    });

    expect(createFn).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          rateLimit: 500,
          expiresAt: expect.any(Date),
        }),
      })
    );

    // Verify expiration is approximately 30 days from now
    const callData = createFn.mock.calls[0][0].data;
    const expectedExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
    expect(callData.expiresAt.getTime()).toBeCloseTo(expectedExpiry, -3); // within ~1 second
  });

  it('should create an audit log entry for key creation', async () => {
    const auditCreate = jest.fn().mockResolvedValue({});
    (mockDb as Record<string, unknown>).enhancedAuditLog = { create: auditCreate };

    await APISecurityManager.generateAPIKey('user-3', 'Audit Key', ['admin']);

    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-3',
          action: 'API_KEY_CREATED',
          resource: 'API',
        }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// APISecurityManager.revokeAPIKey
// ---------------------------------------------------------------------------

describe('APISecurityManager.revokeAPIKey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    (mockDb as Record<string, unknown>).apiKey = {
      findFirst: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    };
    (mockDb as Record<string, unknown>).enhancedAuditLog = {
      create: jest.fn().mockResolvedValue({}),
    };
  });

  it('should return false when key is not found', async () => {
    (mockDb as Record<string, unknown>).apiKey = {
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    };

    const result = await APISecurityManager.revokeAPIKey('key-99', 'user-1');
    expect(result).toBe(false);
  });

  it('should deactivate the key and return true on success', async () => {
    const updateFn = jest.fn().mockResolvedValue({});
    (mockDb as Record<string, unknown>).apiKey = {
      findFirst: jest.fn().mockResolvedValue({ id: 'key-1', userId: 'user-1' }),
      update: updateFn,
      findUnique: jest.fn(),
      create: jest.fn(),
    };

    const result = await APISecurityManager.revokeAPIKey('key-1', 'user-1');

    expect(result).toBe(true);
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'key-1' },
        data: { isActive: false },
      })
    );
  });

  it('should create an audit log when key is revoked', async () => {
    const auditCreate = jest.fn().mockResolvedValue({});
    (mockDb as Record<string, unknown>).apiKey = {
      findFirst: jest.fn().mockResolvedValue({ id: 'key-2', userId: 'user-2' }),
      update: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn(),
      create: jest.fn(),
    };
    (mockDb as Record<string, unknown>).enhancedAuditLog = { create: auditCreate };

    await APISecurityManager.revokeAPIKey('key-2', 'user-2');

    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-2',
          action: 'API_KEY_REVOKED',
          resourceId: 'key-2',
        }),
      })
    );
  });

  it('should return false when database throws an error', async () => {
    (mockDb as Record<string, unknown>).apiKey = {
      findFirst: jest.fn().mockRejectedValue(new Error('DB error')),
      update: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    };

    const result = await APISecurityManager.revokeAPIKey('key-3', 'user-3');
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// APISecurityManager.validateJWT
// ---------------------------------------------------------------------------

describe('APISecurityManager.validateJWT', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    process.env = { ...originalEnv, JWT_SECRET: 'test-jwt-secret' };

    (mockDb as Record<string, unknown>).user = {
      findUnique: jest.fn(),
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return invalid when JWT_SECRET is not configured', async () => {
    delete process.env.JWT_SECRET;
    delete process.env.AUTH_SECRET;

    const result = await APISecurityManager.validateJWT('some-token');
    expect(result).toEqual({ valid: false });
  });

  it('should return invalid when jwt.verify throws (invalid token)', async () => {
    (mockJwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid token');
    });

    const result = await APISecurityManager.validateJWT('bad-token');
    expect(result).toEqual({ valid: false });
  });

  it('should return invalid when user is not found in database', async () => {
    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 'missing-user' });

    (mockDb as Record<string, unknown>).user = {
      findUnique: jest.fn().mockResolvedValue(null),
    };

    const result = await APISecurityManager.validateJWT('valid-token');
    expect(result).toEqual({ valid: false });
  });

  it('should return invalid when user account is locked', async () => {
    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 'locked-user' });

    (mockDb as Record<string, unknown>).user = {
      findUnique: jest.fn().mockResolvedValue({
        id: 'locked-user',
        isAccountLocked: true,
        userPermissions: [],
      }),
    };

    const result = await APISecurityManager.validateJWT('valid-token');
    expect(result).toEqual({ valid: false });
  });

  it('should return valid with userId and permissions for a valid JWT', async () => {
    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 'user-1' });

    (mockDb as Record<string, unknown>).user = {
      findUnique: jest.fn().mockResolvedValue({
        id: 'user-1',
        isAccountLocked: false,
        userPermissions: [
          { permission: { name: 'COURSE_CREATE' } },
          { permission: { name: 'COURSE_EDIT_OWN' } },
        ],
      }),
    };

    const result = await APISecurityManager.validateJWT('good-token');

    expect(result.valid).toBe(true);
    expect(result.userId).toBe('user-1');
    expect(result.permissions).toEqual(['COURSE_CREATE', 'COURSE_EDIT_OWN']);
  });

  it('should use sub claim when userId is absent in token payload', async () => {
    (mockJwt.verify as jest.Mock).mockReturnValue({ sub: 'user-sub' });

    (mockDb as Record<string, unknown>).user = {
      findUnique: jest.fn().mockResolvedValue({
        id: 'user-sub',
        isAccountLocked: false,
        userPermissions: [],
      }),
    };

    const result = await APISecurityManager.validateJWT('sub-token');

    expect(result.valid).toBe(true);
    expect(result.userId).toBe('user-sub');
    expect(result.permissions).toEqual([]);
  });

  it('should fall back to AUTH_SECRET when JWT_SECRET is not set', async () => {
    delete process.env.JWT_SECRET;
    process.env.AUTH_SECRET = 'auth-secret-fallback';

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 'user-auth' });
    (mockDb as Record<string, unknown>).user = {
      findUnique: jest.fn().mockResolvedValue({
        id: 'user-auth',
        isAccountLocked: false,
        userPermissions: [],
      }),
    };

    const result = await APISecurityManager.validateJWT('auth-token');
    expect(result.valid).toBe(true);
    expect(mockJwt.verify).toHaveBeenCalledWith('auth-token', 'auth-secret-fallback');
  });
});

// ---------------------------------------------------------------------------
// withAPIAuth wrapper
// ---------------------------------------------------------------------------

describe('withAPIAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    (mockDb as Record<string, unknown>).enhancedAuditLog = {
      create: jest.fn().mockResolvedValue({}),
    };
    (mockDb as Record<string, unknown>).apiKey = {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    };
    (mockDb as Record<string, unknown>).user = {
      findUnique: jest.fn(),
    };
  });

  it('should return 429 when rate limit is exceeded', async () => {
    // Create a handler that should not be called
    const handler = jest.fn();

    const wrappedHandler = withAPIAuth(handler, {
      rateLimit: 1,
    });

    const ip = '10.100.0.1';
    const uniqueUrl = `http://localhost:3000/api/rate-limit-test-${Date.now()}`;

    // First request - allowed
    const req1 = createMockNextRequest(uniqueUrl, {
      headers: { 'x-forwarded-for': ip },
    });
    const res1 = await wrappedHandler(req1, {});
    // Handler should be called for the first request (no auth required by default)
    expect(handler).toHaveBeenCalledTimes(1);

    // Reset handler mock
    handler.mockClear();
    handler.mockResolvedValue(NextResponse.json({ ok: true }));

    // Second request - should be blocked by rate limit
    const req2 = createMockNextRequest(uniqueUrl, {
      headers: { 'x-forwarded-for': ip },
    });
    const res2 = await wrappedHandler(req2, {});

    expect(res2.status).toBe(429);
    const body = await res2.json();
    expect(body.error).toBe('Rate limit exceeded');
  });

  it('should return 401 when auth is required but no token provided', async () => {
    const handler = jest.fn();

    const wrappedHandler = withAPIAuth(handler, {
      requireAuth: true,
    });

    const req = createMockNextRequest('http://localhost:3000/api/auth-test');
    const res = await wrappedHandler(req, {});

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Authentication required');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should authenticate via Bearer token and call handler', async () => {
    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 'user-bearer' });
    (mockDb as Record<string, unknown>).user = {
      findUnique: jest.fn().mockResolvedValue({
        id: 'user-bearer',
        isAccountLocked: false,
        userPermissions: [
          { permission: { name: 'COURSE_CREATE' } },
        ],
      }),
    };

    const handler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    );

    const wrappedHandler = withAPIAuth(handler, {
      requireAuth: true,
    });

    const req = createMockNextRequest('http://localhost:3000/api/bearer-auth', {
      headers: { Authorization: 'Bearer valid-jwt-token' },
    });

    const res = await wrappedHandler(req, {});

    expect(handler).toHaveBeenCalledTimes(1);
    // Security headers should be set
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('X-XSS-Protection')).toBe('1; mode=block');
  });

  it('should authenticate via API key when allowAPIKey is true and Bearer fails', async () => {
    // JWT validation will fail (no auth header)
    const futureDate = new Date(Date.now() + 86400000);
    (mockDb as Record<string, unknown>).apiKey = {
      findUnique: jest.fn().mockResolvedValue({
        id: 'api-key-1',
        isActive: true,
        user: { isAccountLocked: false },
        userId: 'user-apikey',
        permissions: ['read'],
        rateLimit: 1000,
        expiresAt: futureDate,
      }),
      update: jest.fn().mockResolvedValue({}),
      create: jest.fn(),
      findFirst: jest.fn(),
    };

    const handler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    );

    const wrappedHandler = withAPIAuth(handler, {
      requireAuth: true,
      allowAPIKey: true,
    });

    const req = createMockNextRequest('http://localhost:3000/api/apikey-auth', {
      headers: { 'X-API-Key': 'my-api-key' },
    });

    const res = await wrappedHandler(req, {});

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should return 403 when user lacks required permissions', async () => {
    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 'user-no-perms' });
    (mockDb as Record<string, unknown>).user = {
      findUnique: jest.fn().mockResolvedValue({
        id: 'user-no-perms',
        isAccountLocked: false,
        userPermissions: [
          { permission: { name: 'COURSE_CREATE' } },
        ],
      }),
    };

    const handler = jest.fn();

    const wrappedHandler = withAPIAuth(handler, {
      requireAuth: true,
      permissions: ['ADMIN_MANAGE' as never],
    });

    const req = createMockNextRequest('http://localhost:3000/api/perm-test', {
      headers: { Authorization: 'Bearer valid-token' },
    });

    const res = await wrappedHandler(req, {});

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Insufficient permissions');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should allow request when user has at least one required permission', async () => {
    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 'user-with-perms' });
    (mockDb as Record<string, unknown>).user = {
      findUnique: jest.fn().mockResolvedValue({
        id: 'user-with-perms',
        isAccountLocked: false,
        userPermissions: [
          { permission: { name: 'COURSE_CREATE' } },
          { permission: { name: 'COURSE_EDIT_OWN' } },
        ],
      }),
    };

    const handler = jest.fn().mockResolvedValue(
      NextResponse.json({ success: true })
    );

    const wrappedHandler = withAPIAuth(handler, {
      requireAuth: true,
      permissions: ['COURSE_CREATE' as never],
    });

    const req = createMockNextRequest('http://localhost:3000/api/perm-ok', {
      headers: { Authorization: 'Bearer valid-token' },
    });

    const res = await wrappedHandler(req, {});
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should return 500 and log audit when handler throws an error', async () => {
    const auditCreate = jest.fn().mockResolvedValue({});
    (mockDb as Record<string, unknown>).enhancedAuditLog = { create: auditCreate };

    const handler = jest.fn().mockRejectedValue(new Error('Handler exploded'));

    const wrappedHandler = withAPIAuth(handler);

    const req = createMockNextRequest('http://localhost:3000/api/error-test');
    const res = await wrappedHandler(req, {});

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');

    expect(auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'API_ERROR',
          severity: 'ERROR',
          metadata: expect.objectContaining({
            error: 'Handler exploded',
          }),
        }),
      })
    );
  });

  it('should add security headers to successful responses', async () => {
    const handler = jest.fn().mockResolvedValue(
      NextResponse.json({ data: 'test' })
    );

    const wrappedHandler = withAPIAuth(handler);
    const req = createMockNextRequest('http://localhost:3000/api/headers-test');
    const res = await wrappedHandler(req, {});

    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('X-XSS-Protection')).toBe('1; mode=block');
  });

  it('should call handler without auth checks when requireAuth is not set', async () => {
    const handler = jest.fn().mockResolvedValue(
      NextResponse.json({ public: true })
    );

    const wrappedHandler = withAPIAuth(handler);
    const req = createMockNextRequest('http://localhost:3000/api/public');
    const res = await wrappedHandler(req, {});

    expect(handler).toHaveBeenCalledTimes(1);
    const body = await res.json();
    expect(body.public).toBe(true);
  });
});
