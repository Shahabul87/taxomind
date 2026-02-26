/**
 * Tests for Auth Rate Limit Middleware - lib/auth-rate-limit-middleware.ts
 *
 * Covers:
 *   withAuthRateLimit  - core rate-limit check that returns 429 or success object
 *   withRateLimit      - HOC that wraps a NextRequest handler with rate limiting
 */

jest.mock('@/lib/rate-limit', () => ({
  rateLimitAuth: jest.fn(),
  getRateLimitHeaders: jest.fn(),
  getClientIdentifier: jest.fn(),
}));

// @/lib/logger is globally mocked via jest.setup.js

import { NextRequest, NextResponse } from 'next/server';
import { withAuthRateLimit, withRateLimit } from '@/lib/auth-rate-limit-middleware';
import {
  rateLimitAuth,
  getRateLimitHeaders,
  getClientIdentifier,
} from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const mockRateLimitAuth = rateLimitAuth as jest.Mock;
const mockGetRateLimitHeaders = getRateLimitHeaders as jest.Mock;
const mockGetClientIdentifier = getClientIdentifier as jest.Mock;
const mockLogger = logger as jest.Mocked<typeof logger>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockRequest(
  url = 'http://localhost:3000/api/auth/login',
  options: { method?: string; body?: Record<string, unknown>; headers?: Record<string, string> } = {}
): NextRequest {
  const { method = 'GET', body, headers = {} } = options;
  const init: Record<string, unknown> = { method, headers };
  if (body) {
    init.body = JSON.stringify(body);
  }
  return new NextRequest(url, init as RequestInit);
}

const allowedResult = {
  success: true,
  limit: 5,
  remaining: 4,
  reset: Date.now() + 900000,
};

const blockedResult = {
  success: false,
  limit: 5,
  remaining: 0,
  reset: Date.now() + 900000,
  retryAfter: 120,
};

const defaultHeaders = {
  'X-RateLimit-Limit': '5',
  'X-RateLimit-Remaining': '4',
  'X-RateLimit-Reset': String(allowedResult.reset),
};

const blockedHeaders = {
  'X-RateLimit-Limit': '5',
  'X-RateLimit-Remaining': '0',
  'X-RateLimit-Reset': String(blockedResult.reset),
  'Retry-After': '120',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('auth-rate-limit-middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetClientIdentifier.mockReturnValue('192.168.1.1');
    mockGetRateLimitHeaders.mockReturnValue(defaultHeaders);
    mockRateLimitAuth.mockResolvedValue(allowedResult);
  });

  // =========================================================================
  // withAuthRateLimit
  // =========================================================================

  describe('withAuthRateLimit', () => {
    it('returns 429 NextResponse when rate limited', async () => {
      mockRateLimitAuth.mockResolvedValue(blockedResult);
      mockGetRateLimitHeaders.mockReturnValue(blockedHeaders);

      const request = createMockRequest();
      const result = await withAuthRateLimit(request, 'login');

      expect(result).toBeInstanceOf(NextResponse);
      const response = result as NextResponse;
      expect(response.status).toBe(429);

      const body = await response.json();
      expect(body.error).toBe('Too many requests');
    });

    it('returns success object with headers when request is allowed', async () => {
      const request = createMockRequest();
      const result = await withAuthRateLimit(request, 'login');

      expect(result).not.toBeInstanceOf(NextResponse);

      const successResult = result as { success: true; headers: Record<string, string>; rateLimitResult: typeof allowedResult };
      expect(successResult.success).toBe(true);
      expect(successResult.headers).toEqual(defaultHeaders);
      expect(successResult.rateLimitResult).toEqual(allowedResult);
    });

    it('includes retryAfter in the 429 response body', async () => {
      mockRateLimitAuth.mockResolvedValue(blockedResult);
      mockGetRateLimitHeaders.mockReturnValue(blockedHeaders);

      const request = createMockRequest();
      const result = await withAuthRateLimit(request, 'login');

      const response = result as NextResponse;
      const body = await response.json();
      expect(body.retryAfter).toBe(120);
      expect(body.message).toContain('120 seconds');
    });

    it('falls back to allow on error with limit=999 and remaining=999', async () => {
      mockRateLimitAuth.mockRejectedValue(new Error('Redis connection failed'));

      const request = createMockRequest();
      const result = await withAuthRateLimit(request, 'login');

      // Should NOT be a NextResponse (not blocked)
      expect(result).not.toBeInstanceOf(NextResponse);

      const successResult = result as { success: true; headers: Record<string, string>; rateLimitResult: { limit: number; remaining: number } };
      expect(successResult.success).toBe(true);
      expect(successResult.rateLimitResult.limit).toBe(999);
      expect(successResult.rateLimitResult.remaining).toBe(999);
      expect(successResult.headers['X-RateLimit-Limit']).toBe('999');
      expect(successResult.headers['X-RateLimit-Remaining']).toBe('999');
    });

    it('logs a warning when the rate limit is exceeded', async () => {
      mockRateLimitAuth.mockResolvedValue(blockedResult);
      mockGetRateLimitHeaders.mockReturnValue(blockedHeaders);

      const request = createMockRequest();
      await withAuthRateLimit(request, 'login');

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Rate limit exceeded for login'),
        expect.objectContaining({
          identifier: '192.168.1.1',
          endpoint: 'login',
          limit: blockedResult.limit,
          remaining: blockedResult.remaining,
        })
      );
    });

    it('passes userId for user-specific rate limiting via getClientIdentifier', async () => {
      const request = createMockRequest();
      await withAuthRateLimit(request, 'login', 'user-42');

      expect(mockGetClientIdentifier).toHaveBeenCalledWith(request, 'user-42');
    });

    it('uses the correct identifier returned by getClientIdentifier', async () => {
      mockGetClientIdentifier.mockReturnValue('10.0.0.1:user-99');

      const request = createMockRequest();
      await withAuthRateLimit(request, 'register', 'user-99');

      expect(mockRateLimitAuth).toHaveBeenCalledWith('register', '10.0.0.1:user-99');
    });

    it('logs an error and allows request when rateLimitAuth throws', async () => {
      const testError = new Error('Unexpected failure');
      mockRateLimitAuth.mockRejectedValue(testError);

      const request = createMockRequest();
      const result = await withAuthRateLimit(request, 'login');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Rate limiting error for login:'),
        testError
      );
      expect((result as { success: boolean }).success).toBe(true);
    });

    it('logs debug message when rate limit check passes', async () => {
      const request = createMockRequest();
      await withAuthRateLimit(request, 'verify');

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Rate limit check passed for verify'),
        expect.objectContaining({
          identifier: '192.168.1.1',
          remaining: allowedResult.remaining,
          limit: allowedResult.limit,
        })
      );
    });

    it('attaches rate limit headers to the 429 response', async () => {
      mockRateLimitAuth.mockResolvedValue(blockedResult);
      mockGetRateLimitHeaders.mockReturnValue(blockedHeaders);

      const request = createMockRequest();
      const result = await withAuthRateLimit(request, 'login');
      const response = result as NextResponse;

      expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(response.headers.get('Retry-After')).toBe('120');
    });
  });

  // =========================================================================
  // withRateLimit (HOC)
  // =========================================================================

  describe('withRateLimit', () => {
    it('passes the request to the handler when rate limit allows', async () => {
      const handler = jest.fn().mockResolvedValue(
        NextResponse.json({ data: 'ok' }, { status: 200 })
      );

      const wrapped = withRateLimit('login', handler);
      const request = createMockRequest();

      const response = await wrapped(request);

      expect(handler).toHaveBeenCalledWith(request);
      const body = await response.json();
      expect(body.data).toBe('ok');
    });

    it('returns 429 response when the rate limit is exceeded', async () => {
      mockRateLimitAuth.mockResolvedValue(blockedResult);
      mockGetRateLimitHeaders.mockReturnValue(blockedHeaders);

      const handler = jest.fn().mockResolvedValue(
        NextResponse.json({ data: 'ok' })
      );

      const wrapped = withRateLimit('login', handler);
      const request = createMockRequest();

      const response = await wrapped(request);

      // The handler should NOT have been called
      expect(handler).not.toHaveBeenCalled();
      expect(response.status).toBe(429);
    });

    it('adds rate limit headers to the handler response', async () => {
      const handler = jest.fn().mockResolvedValue(
        NextResponse.json({ data: 'ok' }, { status: 200 })
      );

      const wrapped = withRateLimit('login', handler);
      const request = createMockRequest();

      const response = await wrapped(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('4');
      expect(response.headers.get('X-RateLimit-Reset')).toBe(
        String(allowedResult.reset)
      );
    });

    it('extracts userId (email) from POST request body', async () => {
      const handler = jest.fn().mockResolvedValue(
        NextResponse.json({ ok: true })
      );

      const wrapped = withRateLimit('login', handler);
      const request = createMockRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: { email: 'user@example.com', password: 'secret' },
      });

      await wrapped(request);

      // getClientIdentifier should have been called with the email extracted from body
      expect(mockGetClientIdentifier).toHaveBeenCalledWith(
        expect.anything(),
        'user@example.com'
      );
    });

    it('extracts userId field from POST request body when email is absent', async () => {
      const handler = jest.fn().mockResolvedValue(
        NextResponse.json({ ok: true })
      );

      const wrapped = withRateLimit('login', handler);
      const request = createMockRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: { userId: 'user-123' },
      });

      await wrapped(request);

      expect(mockGetClientIdentifier).toHaveBeenCalledWith(
        expect.anything(),
        'user-123'
      );
    });

    it('handles handler errors by propagating them', async () => {
      const handlerError = new Error('Handler exploded');
      const handler = jest.fn().mockRejectedValue(handlerError);

      const wrapped = withRateLimit('login', handler);
      const request = createMockRequest();

      await expect(wrapped(request)).rejects.toThrow('Handler exploded');
    });

    it('does not extract userId from GET requests', async () => {
      const handler = jest.fn().mockResolvedValue(
        NextResponse.json({ ok: true })
      );

      const wrapped = withRateLimit('verify', handler);
      const request = createMockRequest('http://localhost:3000/api/auth/verify', {
        method: 'GET',
      });

      await wrapped(request);

      // For GET requests, userId should be undefined
      expect(mockGetClientIdentifier).toHaveBeenCalledWith(
        expect.anything(),
        undefined
      );
    });

    it('gracefully handles invalid JSON body in POST requests', async () => {
      const handler = jest.fn().mockResolvedValue(
        NextResponse.json({ ok: true })
      );

      const wrapped = withRateLimit('login', handler);

      // Create a POST request without a parseable JSON body
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
      });

      // Should not throw -- JSON parsing error is silently caught
      const response = await wrapped(request);
      expect(handler).toHaveBeenCalled();

      const body = await response.json();
      expect(body.ok).toBe(true);
    });
  });
});
