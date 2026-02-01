/**
 * Auth Stage Tests
 *
 * Validates authentication, subscription access, and rate limiting
 * checks performed by runAuthStage.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runAuthStage } from '../auth-stage';
import type { StageResult } from '../types';
import type { AuthStageResult } from '../auth-stage';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/auth', () => ({
  currentUserOrAdmin: jest.fn(),
}));

jest.mock('@/lib/ai/subscription-enforcement', () => ({
  checkAIAccess: jest.fn(),
}));

jest.mock('@/lib/sam/config/sam-rate-limiter', () => ({
  applyRateLimit: jest.fn(),
  samMessagesLimiter: {},
}));

// Re-import mocked modules so we can set return values per test
import { currentUserOrAdmin } from '@/lib/auth';
import { checkAIAccess } from '@/lib/ai/subscription-enforcement';
import { applyRateLimit } from '@/lib/sam/config/sam-rate-limiter';

const mockedCurrentUser = currentUserOrAdmin as jest.MockedFunction<typeof currentUserOrAdmin>;
const mockedCheckAIAccess = checkAIAccess as jest.MockedFunction<typeof checkAIAccess>;
const mockedApplyRateLimit = applyRateLimit as jest.MockedFunction<typeof applyRateLimit>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(url = 'http://localhost:3000/api/sam/unified'): NextRequest {
  return new NextRequest(new URL(url));
}

function isErrorResponse(result: StageResult<AuthStageResult>): result is { response: Response } {
  return 'response' in result;
}

function isSuccess(result: StageResult<AuthStageResult>): result is { ctx: AuthStageResult } {
  return 'ctx' in result;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('runAuthStage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---- Unauthenticated user ------------------------------------------------

  it('returns 401 response when no authenticated user is found', async () => {
    mockedCurrentUser.mockResolvedValue(null);

    const result = await runAuthStage(makeRequest());

    expect(isErrorResponse(result)).toBe(true);
    if (!isErrorResponse(result)) return;

    const body = await result.response.json();
    expect(result.response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
    expect(body.message).toBe('Please sign in to use SAM');
  });

  it('returns 401 response when user object has no id', async () => {
    mockedCurrentUser.mockResolvedValue({ id: '' } as ReturnType<typeof currentUserOrAdmin> extends Promise<infer T> ? T : never);

    const result = await runAuthStage(makeRequest());

    expect(isErrorResponse(result)).toBe(true);
    if (!isErrorResponse(result)) return;

    expect(result.response.status).toBe(401);
  });

  // ---- AI access denied -----------------------------------------------------

  it('returns 403 response when AI access is denied', async () => {
    mockedCurrentUser.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    } as Awaited<ReturnType<typeof currentUserOrAdmin>>);

    mockedCheckAIAccess.mockResolvedValue({
      allowed: false,
      reason: 'Usage limit exceeded',
      upgradeRequired: true,
      suggestedTier: 'pro',
      remainingDaily: 0,
      remainingMonthly: 0,
      maintenanceMode: false,
    });

    const result = await runAuthStage(makeRequest());

    expect(isErrorResponse(result)).toBe(true);
    if (!isErrorResponse(result)) return;

    const body = await result.response.json();
    expect(result.response.status).toBe(403);
    expect(body.error).toBe('Usage limit exceeded');
    expect(body.upgradeRequired).toBe(true);
    expect(body.suggestedTier).toBe('pro');
  });

  it('returns 503 response when AI access is denied due to maintenance', async () => {
    mockedCurrentUser.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    } as Awaited<ReturnType<typeof currentUserOrAdmin>>);

    mockedCheckAIAccess.mockResolvedValue({
      allowed: false,
      reason: 'System under maintenance',
      upgradeRequired: false,
      maintenanceMode: true,
    });

    const result = await runAuthStage(makeRequest());

    expect(isErrorResponse(result)).toBe(true);
    if (!isErrorResponse(result)) return;

    expect(result.response.status).toBe(503);
  });

  // ---- Rate limited ---------------------------------------------------------

  it('returns the rate-limit response when rate limit is exceeded', async () => {
    mockedCurrentUser.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    } as Awaited<ReturnType<typeof currentUserOrAdmin>>);

    mockedCheckAIAccess.mockResolvedValue({ allowed: true });

    const rateLimitResponse = NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 },
    );

    mockedApplyRateLimit.mockResolvedValue({
      success: false,
      response: rateLimitResponse,
    });

    const result = await runAuthStage(makeRequest());

    expect(isErrorResponse(result)).toBe(true);
    if (!isErrorResponse(result)) return;

    const body = await result.response.json();
    expect(body.error).toBe('Rate limit exceeded');
  });

  // ---- Success path ---------------------------------------------------------

  it('returns PipelineContext with user and rateLimitHeaders on full success', async () => {
    mockedCurrentUser.mockResolvedValue({
      id: 'user-42',
      name: 'Jane Doe',
      email: 'jane@example.com',
      isTeacher: true,
      role: 'ADMIN',
    } as Awaited<ReturnType<typeof currentUserOrAdmin>>);

    mockedCheckAIAccess.mockResolvedValue({ allowed: true });

    const headers = {
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '99',
    };

    mockedApplyRateLimit.mockResolvedValue({
      success: true,
      headers,
    });

    const result = await runAuthStage(makeRequest());

    expect(isSuccess(result)).toBe(true);
    if (!isSuccess(result)) return;

    expect(result.ctx.user.id).toBe('user-42');
    expect(result.ctx.user.name).toBe('Jane Doe');
    expect(result.ctx.user.email).toBe('jane@example.com');
    expect(result.ctx.user.isTeacher).toBe(true);
    expect(result.ctx.user.role).toBe('ADMIN');
    expect(result.ctx.rateLimitHeaders).toEqual(headers);
  });

  it('defaults rateLimitHeaders to empty object when headers are undefined', async () => {
    mockedCurrentUser.mockResolvedValue({
      id: 'user-99',
      name: null,
      email: null,
    } as Awaited<ReturnType<typeof currentUserOrAdmin>>);

    mockedCheckAIAccess.mockResolvedValue({ allowed: true });

    mockedApplyRateLimit.mockResolvedValue({
      success: true,
      headers: undefined,
    });

    const result = await runAuthStage(makeRequest());

    expect(isSuccess(result)).toBe(true);
    if (!isSuccess(result)) return;

    expect(result.ctx.rateLimitHeaders).toEqual({});
    expect(result.ctx.user.name).toBeNull();
    expect(result.ctx.user.email).toBeNull();
  });

  // ---- Argument forwarding --------------------------------------------------

  it('passes the user id to checkAIAccess', async () => {
    mockedCurrentUser.mockResolvedValue({
      id: 'user-check',
      name: 'Checker',
      email: 'check@test.com',
    } as Awaited<ReturnType<typeof currentUserOrAdmin>>);

    mockedCheckAIAccess.mockResolvedValue({ allowed: true });
    mockedApplyRateLimit.mockResolvedValue({ success: true, headers: {} });

    await runAuthStage(makeRequest());

    expect(mockedCheckAIAccess).toHaveBeenCalledWith('user-check', 'chat');
  });

  it('passes request and userId to applyRateLimit', async () => {
    mockedCurrentUser.mockResolvedValue({
      id: 'user-rl',
      name: 'RL User',
      email: 'rl@test.com',
    } as Awaited<ReturnType<typeof currentUserOrAdmin>>);

    mockedCheckAIAccess.mockResolvedValue({ allowed: true });
    mockedApplyRateLimit.mockResolvedValue({ success: true, headers: {} });

    const req = makeRequest();
    await runAuthStage(req);

    expect(mockedApplyRateLimit).toHaveBeenCalledWith(
      req,
      expect.anything(), // samMessagesLimiter
      'user-rl',
    );
  });
});
