/**
 * Shared helpers for AI API route tests.
 *
 * Provides common mock setup functions, request builders, and assertion
 * utilities so every AI route test file stays DRY and under 500 lines.
 */

import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MOCK_USER_ID = 'user-test-123';
export const MOCK_ADMIN_ID = 'admin-test-456';

export const MOCK_AI_RESPONSE = 'This is a mock AI response for testing.';

export const MOCK_AI_METADATA_RESPONSE = {
  content: MOCK_AI_RESPONSE,
  provider: 'anthropic',
  model: 'claude-sonnet-4-5-20250929',
};

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

/**
 * Configure the getCombinedSession mock.
 * Pass `null` to simulate unauthenticated requests.
 */
export function mockCombinedSession(
  getCombinedSessionMock: jest.Mock,
  opts?: { userId?: string | null; isAdmin?: boolean } | null,
) {
  if (opts === null) {
    getCombinedSessionMock.mockResolvedValue({ userId: null, isAdmin: false });
  } else {
    getCombinedSessionMock.mockResolvedValue({
      userId: opts?.userId ?? MOCK_USER_ID,
      isAdmin: opts?.isAdmin ?? false,
    });
  }
}

/**
 * Configure the withRateLimit mock.
 * When `shouldLimit` is true it returns a 429 NextResponse.
 */
export function mockRateLimit(
  withRateLimitMock: jest.Mock,
  shouldLimit = false,
) {
  if (shouldLimit) {
    withRateLimitMock.mockResolvedValue(
      NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 }),
    );
  } else {
    withRateLimitMock.mockResolvedValue(null);
  }
}

/**
 * Configure runSAMChatWithPreference to return the given string.
 */
export function mockAIPreference(
  mock: jest.Mock,
  response: string = MOCK_AI_RESPONSE,
) {
  mock.mockResolvedValue(response);
}

/**
 * Configure runSAMChatWithMetadata to return { content, provider, model }.
 */
export function mockAIMetadata(
  mock: jest.Mock,
  response: typeof MOCK_AI_METADATA_RESPONSE = MOCK_AI_METADATA_RESPONSE,
) {
  mock.mockResolvedValue(response);
}

/**
 * Make the retryable-timeout wrapper simply call through to the function.
 */
export function mockTimeout(withRetryableTimeoutMock: jest.Mock) {
  withRetryableTimeoutMock.mockImplementation(
    async (fn: () => Promise<unknown>) => fn(),
  );
}

// ---------------------------------------------------------------------------
// Request builder
// ---------------------------------------------------------------------------

/**
 * Build a NextRequest suitable for calling POST AI routes.
 */
export function createAIRequest(
  url: string,
  body: Record<string, unknown>,
): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// ---------------------------------------------------------------------------
// Assertion helpers
// ---------------------------------------------------------------------------

export async function assertUnauthorized(response: NextResponse | Response) {
  expect(response.status).toBe(401);
}

export async function assertRateLimited(response: NextResponse | Response) {
  expect(response.status).toBe(429);
}

export async function assertBadRequest(response: NextResponse | Response) {
  expect(response.status).toBe(400);
}

export async function assertSuccess(response: NextResponse | Response) {
  expect(response.status).toBe(200);
}
