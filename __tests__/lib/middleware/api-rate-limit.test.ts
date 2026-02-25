/**
 * Tests for API Rate Limiting Middleware - lib/middleware/api-rate-limit.ts
 *
 * Covers: applyRateLimit, withRateLimit HOF, addRateLimitHeaders,
 * shouldApplyAIRateLimit, getRequestAICategory, skip logic
 */

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(),
  rateLimitAI: jest.fn(),
  getClientIdentifier: jest.fn(),
  getRateLimitHeaders: jest.fn(),
  getAIRateLimitCategory: jest.fn(),
  isAIEndpoint: jest.fn(),
  createRateLimitResponse: jest.fn(),
}));

// @/lib/logger is globally mocked

import { NextRequest, NextResponse } from 'next/server';
import {
  applyRateLimit,
  addRateLimitHeaders,
  withRateLimit,
  checkRateLimit,
  shouldApplyAIRateLimit,
  getRequestAICategory,
  DEFAULT_RATE_LIMITS,
} from '@/lib/middleware/api-rate-limit';
import {
  rateLimit,
  rateLimitAI,
  getClientIdentifier,
  getRateLimitHeaders,
  getAIRateLimitCategory,
  isAIEndpoint,
  createRateLimitResponse,
} from '@/lib/rate-limit';

const mockRateLimit = rateLimit as jest.Mock;
const mockRateLimitAI = rateLimitAI as jest.Mock;
const mockGetClientIdentifier = getClientIdentifier as jest.Mock;
const mockGetRateLimitHeaders = getRateLimitHeaders as jest.Mock;
const mockGetAIRateLimitCategory = getAIRateLimitCategory as jest.Mock;
const mockIsAIEndpoint = isAIEndpoint as jest.Mock;
const mockCreateRateLimitResponse = createRateLimitResponse as jest.Mock;

function createRequest(pathname = '/api/test', userId?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userId) headers['x-user-id'] = userId;
  return new NextRequest(`http://localhost:3000${pathname}`, {
    method: 'GET',
    headers,
  });
}

describe('applyRateLimit', () => {
  beforeEach(() => {
    mockGetClientIdentifier.mockReturnValue('127.0.0.1');
    mockGetAIRateLimitCategory.mockReturnValue(null);
    mockRateLimit.mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000,
    });
  });

  it('allows request when under rate limit', async () => {
    const { result, response } = await applyRateLimit(createRequest());

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(99);
    expect(response).toBeUndefined();
  });

  it('blocks request when rate limit exceeded', async () => {
    mockRateLimit.mockResolvedValue({
      success: false,
      limit: 100,
      remaining: 0,
      reset: Date.now() + 60000,
      retryAfter: 60,
    });
    const mockResponse = new Response('Too many requests', { status: 429 });
    mockCreateRateLimitResponse.mockReturnValue(mockResponse);

    const { result, response } = await applyRateLimit(createRequest());

    expect(result.success).toBe(false);
    expect(response).toBeDefined();
    expect(mockCreateRateLimitResponse).toHaveBeenCalled();
  });

  it('uses AI rate limiting for AI endpoints', async () => {
    mockGetAIRateLimitCategory.mockReturnValue('sam-chat');
    mockRateLimitAI.mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000,
    });

    const { result } = await applyRateLimit(createRequest('/api/sam/chat'));

    expect(result.success).toBe(true);
    expect(mockRateLimitAI).toHaveBeenCalledWith('sam-chat', '127.0.0.1');
    expect(mockRateLimit).not.toHaveBeenCalled();
  });

  it('uses custom config when provided', async () => {
    await applyRateLimit(createRequest(), undefined, {
      limit: 10,
      windowMs: 30000,
    });

    expect(mockRateLimit).toHaveBeenCalledWith('127.0.0.1', 10, 30000);
  });

  it('uses custom identifier function', async () => {
    const customIdentifier = jest.fn().mockReturnValue('custom-id');

    await applyRateLimit(createRequest(), 'user-1', {
      getIdentifier: customIdentifier,
    });

    expect(customIdentifier).toHaveBeenCalled();
    expect(mockRateLimit).toHaveBeenCalledWith('custom-id', expect.any(Number), expect.any(Number));
  });

  it('skips rate limiting when skip function returns true', async () => {
    const { result } = await applyRateLimit(createRequest(), undefined, {
      skip: () => true,
    });

    expect(result.success).toBe(true);
    expect(result.limit).toBe(Infinity);
    expect(mockRateLimit).not.toHaveBeenCalled();
  });
});

describe('withRateLimit', () => {
  beforeEach(() => {
    mockGetClientIdentifier.mockReturnValue('127.0.0.1');
    mockGetAIRateLimitCategory.mockReturnValue(null);
    mockRateLimit.mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000,
    });
    mockGetRateLimitHeaders.mockReturnValue({
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '99',
      'X-RateLimit-Reset': String(Date.now() + 60000),
    });
  });

  it('calls handler when rate limit not exceeded', async () => {
    const handler = jest.fn().mockResolvedValue(
      NextResponse.json({ ok: true })
    );
    const wrapped = withRateLimit(handler);

    const res = await wrapped(createRequest());

    expect(handler).toHaveBeenCalled();
    // Handler receives the rateLimitResult in context
    const context = handler.mock.calls[0][1];
    expect(context.rateLimitResult.success).toBe(true);
  });

  it('returns rate limit response without calling handler when exceeded', async () => {
    mockRateLimit.mockResolvedValue({
      success: false,
      limit: 100,
      remaining: 0,
      reset: Date.now() + 60000,
    });
    const errorResponse = new Response('Rate limited', { status: 429 });
    mockCreateRateLimitResponse.mockReturnValue(errorResponse);

    const handler = jest.fn();
    const wrapped = withRateLimit(handler);

    const res = await wrapped(createRequest());

    expect(handler).not.toHaveBeenCalled();
    expect(res.status).toBe(429);
  });

  it('extracts userId from x-user-id header', async () => {
    const handler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withRateLimit(handler);

    await wrapped(createRequest('/api/test', 'user-1'));

    const context = handler.mock.calls[0][1];
    expect(context.userId).toBe('user-1');
  });

  it('passes custom config to applyRateLimit', async () => {
    const handler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withRateLimit(handler, { limit: 5, windowMs: 10000 });

    await wrapped(createRequest());

    expect(mockRateLimit).toHaveBeenCalledWith('127.0.0.1', 5, 10000);
  });

  it('re-throws handler errors', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('Handler failed'));
    const wrapped = withRateLimit(handler);

    await expect(wrapped(createRequest())).rejects.toThrow('Handler failed');
  });
});

describe('addRateLimitHeaders', () => {
  it('adds rate limit headers to response', () => {
    mockGetRateLimitHeaders.mockReturnValue({
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '50',
      'X-RateLimit-Reset': '1700000000',
    });

    const response = NextResponse.json({ ok: true });
    const result = addRateLimitHeaders(response, {
      success: true,
      limit: 100,
      remaining: 50,
      reset: 1700000000,
    });

    expect(result.headers.get('X-RateLimit-Limit')).toBe('100');
    expect(result.headers.get('X-RateLimit-Remaining')).toBe('50');
  });
});

describe('checkRateLimit', () => {
  it('returns rate limit result without blocking', async () => {
    mockGetClientIdentifier.mockReturnValue('127.0.0.1');
    mockGetAIRateLimitCategory.mockReturnValue(null);
    mockRateLimit.mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000,
    });

    const result = await checkRateLimit(createRequest());

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(99);
  });
});

describe('shouldApplyAIRateLimit', () => {
  it('returns true for AI endpoints', () => {
    mockIsAIEndpoint.mockReturnValue(true);

    expect(shouldApplyAIRateLimit(createRequest('/api/ai/generate'))).toBe(true);
  });

  it('returns false for non-AI endpoints', () => {
    mockIsAIEndpoint.mockReturnValue(false);

    expect(shouldApplyAIRateLimit(createRequest('/api/users'))).toBe(false);
  });
});

describe('getRequestAICategory', () => {
  it('returns AI category for AI endpoint', () => {
    mockGetAIRateLimitCategory.mockReturnValue('sam-chat');

    expect(getRequestAICategory(createRequest('/api/sam/chat'))).toBe('sam-chat');
  });

  it('returns null for non-AI endpoint', () => {
    mockGetAIRateLimitCategory.mockReturnValue(null);

    expect(getRequestAICategory(createRequest('/api/users'))).toBeNull();
  });
});

describe('DEFAULT_RATE_LIMITS', () => {
  it('has expected presets', () => {
    expect(DEFAULT_RATE_LIMITS.standard.limit).toBe(100);
    expect(DEFAULT_RATE_LIMITS.authenticated.limit).toBe(200);
    expect(DEFAULT_RATE_LIMITS.unauthenticated.limit).toBe(20);
    expect(DEFAULT_RATE_LIMITS.write.limit).toBe(50);
    expect(DEFAULT_RATE_LIMITS.expensive.limit).toBe(10);
  });
});
