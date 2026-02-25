/**
 * Tests for AI Enforcement Helper Wrapper
 * Source: lib/ai/enforce-ai-access.ts
 *
 * Covers: withAIEnforcement, enforceAIAccess
 * - Authentication check (401)
 * - Subscription/feature denial (403)
 * - Maintenance mode (503)
 * - Successful passthrough with usage recording
 * - Error handling (500)
 * - enforceAIAccess simple check
 */

// --- Module-level mocks (before imports) ---

jest.mock('@/lib/ai/subscription-enforcement', () => ({
  checkAIAccess: jest.fn(),
  recordAIUsage: jest.fn(),
}));

// @/lib/auth, @/lib/logger, next/server are globally mocked

import { withAIEnforcement, enforceAIAccess } from '@/lib/ai/enforce-ai-access';
import { currentUser } from '@/lib/auth';
import { checkAIAccess, recordAIUsage } from '@/lib/ai/subscription-enforcement';
import { NextRequest } from 'next/server';
import { MOCK_USER_ID } from './_ai-test-helpers';

const mockCurrentUser = currentUser as jest.Mock;
const mockCheckAIAccess = checkAIAccess as jest.Mock;
const mockRecordAIUsage = recordAIUsage as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createRequest(path = '/api/ai/test') {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: 'POST',
    body: JSON.stringify({ prompt: 'test' }),
    headers: { 'Content-Type': 'application/json' },
  });
}

// ---------------------------------------------------------------------------
// withAIEnforcement
// ---------------------------------------------------------------------------

describe('withAIEnforcement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: MOCK_USER_ID, name: 'Test', email: 'test@test.com' });
    mockCheckAIAccess.mockResolvedValue({
      allowed: true,
      remainingDaily: 9,
      remainingMonthly: 49,
    });
    mockRecordAIUsage.mockResolvedValue(undefined);
  });

  it('returns 401 when no user session exists', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const response = await withAIEnforcement(
      createRequest(),
      'chat',
      async () => ({ success: true }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when user has no id', async () => {
    mockCurrentUser.mockResolvedValue({ name: 'Test' }); // no id

    const response = await withAIEnforcement(
      createRequest(),
      'chat',
      async () => ({ success: true }),
    );

    expect(response.status).toBe(401);
  });

  it('returns 403 when subscription check denies access', async () => {
    mockCheckAIAccess.mockResolvedValue({
      allowed: false,
      reason: 'This feature requires STARTER subscription or higher',
      upgradeRequired: true,
      suggestedTier: 'STARTER',
    });

    const response = await withAIEnforcement(
      createRequest(),
      'course',
      async () => ({ success: true }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain('STARTER');
    expect(body.code).toBe('ACCESS_DENIED');
    expect(body.upgradeRequired).toBe(true);
  });

  it('returns 503 when maintenance mode is active', async () => {
    mockCheckAIAccess.mockResolvedValue({
      allowed: false,
      reason: 'AI features are temporarily unavailable',
      maintenanceMode: true,
      maintenanceMessage: 'Back in 30 minutes',
    });

    const response = await withAIEnforcement(
      createRequest(),
      'chat',
      async () => ({ success: true }),
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.code).toBe('MAINTENANCE_MODE');
    expect(body.maintenanceMode).toBe(true);
    expect(body.maintenanceMessage).toBe('Back in 30 minutes');
  });

  it('executes handler and returns result on success', async () => {
    const handler = jest.fn().mockResolvedValue({ content: 'AI response' });

    const response = await withAIEnforcement(createRequest(), 'chat', handler);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.content).toBe('AI response');
    expect(body.usage).toEqual({ remainingDaily: 9, remainingMonthly: 49 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('records usage by default after successful handler', async () => {
    await withAIEnforcement(createRequest(), 'chat', async () => ({ ok: true }));

    expect(mockRecordAIUsage).toHaveBeenCalledWith(MOCK_USER_ID, 'chat', 1, undefined);
  });

  it('skips usage recording when recordUsage is false', async () => {
    await withAIEnforcement(
      createRequest(),
      'chat',
      async () => ({ ok: true }),
      { recordUsage: false },
    );

    expect(mockRecordAIUsage).not.toHaveBeenCalled();
  });

  it('passes metadata to recordAIUsage', async () => {
    const metadata = { provider: 'anthropic', model: 'claude', tokensUsed: 500, cost: 0.02 };

    await withAIEnforcement(
      createRequest(),
      'course',
      async () => ({ ok: true }),
      { recordUsage: true, usageCount: 2, metadata },
    );

    expect(mockRecordAIUsage).toHaveBeenCalledWith(MOCK_USER_ID, 'course', 2, metadata);
  });

  it('returns 500 when handler throws', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('Internal failure'));

    const response = await withAIEnforcement(createRequest(), 'chat', handler);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Internal server error');
  });

  it('includes error message in development mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const handler = jest.fn().mockRejectedValue(new Error('Detailed error'));

    const response = await withAIEnforcement(createRequest(), 'chat', handler);
    const body = await response.json();

    expect(body.message).toBe('Detailed error');

    process.env.NODE_ENV = originalEnv;
  });

  it('hides error message in production mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const handler = jest.fn().mockRejectedValue(new Error('Secret error'));

    const response = await withAIEnforcement(createRequest(), 'chat', handler);
    const body = await response.json();

    expect(body.message).toBe('Something went wrong');

    process.env.NODE_ENV = originalEnv;
  });
});

// ---------------------------------------------------------------------------
// enforceAIAccess (simple check)
// ---------------------------------------------------------------------------

describe('enforceAIAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns allowed:true with accessCheck when access is granted', async () => {
    mockCheckAIAccess.mockResolvedValue({
      allowed: true,
      remainingDaily: 5,
      remainingMonthly: 40,
    });

    const result = await enforceAIAccess(MOCK_USER_ID, 'chat');

    expect(result.allowed).toBe(true);
    if (result.allowed) {
      expect(result.accessCheck.remainingDaily).toBe(5);
    }
  });

  it('returns allowed:false with NextResponse when access is denied', async () => {
    mockCheckAIAccess.mockResolvedValue({
      allowed: false,
      reason: 'Monthly limit exceeded',
      upgradeRequired: true,
      suggestedTier: 'PROFESSIONAL',
    });

    const result = await enforceAIAccess(MOCK_USER_ID, 'analysis');

    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      const body = await result.response.json();
      expect(body.error).toBe('Monthly limit exceeded');
      expect(result.response.status).toBe(403);
    }
  });

  it('returns 503 response for maintenance mode', async () => {
    mockCheckAIAccess.mockResolvedValue({
      allowed: false,
      maintenanceMode: true,
      reason: 'Maintenance',
    });

    const result = await enforceAIAccess(MOCK_USER_ID, 'chat');

    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.response.status).toBe(503);
    }
  });
});
