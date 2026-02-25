/**
 * Tests for POST /api/ai/blueprint-refinement
 *
 * Source: app/api/ai/blueprint-refinement/route.ts
 * Uses: getCombinedSession, runSAMChatWithPreference, withRateLimit, withRetryableTimeout
 * NOTE: Uses manual validation (not Zod). Requires admin role.
 * Uses plain Response (not NextResponse) in some places.
 */

// Polyfill Response.json for jsdom (the route uses Response.json instead of NextResponse.json)
if (typeof Response.json !== 'function') {
  (Response as unknown as Record<string, unknown>).json = function responseJson(
    data: unknown,
    init?: ResponseInit,
  ) {
    const body = JSON.stringify(data);
    const headers = new Headers(init?.headers);
    headers.set('content-type', 'application/json');
    return new Response(body, { ...init, headers });
  };
}

jest.mock('@/lib/auth/combined-session', () => ({
  getCombinedSession: jest.fn(),
}));
jest.mock('@/lib/sam/ai-provider', () => ({
  runSAMChatWithPreference: jest.fn(),
  handleAIAccessError: jest.fn(() => null),
}));
jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(),
}));
jest.mock('@/lib/sam/utils/timeout', () => ({
  withRetryableTimeout: jest.fn(),
  OperationTimeoutError: class OperationTimeoutError extends Error {
    operationName: string;
    timeoutMs: number;
    constructor(op: string, ms: number) {
      super(`Timeout: ${op}`);
      this.operationName = op;
      this.timeoutMs = ms;
    }
  },
  TIMEOUT_DEFAULTS: { AI_ANALYSIS: 30000 },
}));

import { getCombinedSession } from '@/lib/auth/combined-session';
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { withRetryableTimeout, OperationTimeoutError } from '@/lib/sam/utils/timeout';
import { POST } from '@/app/api/ai/blueprint-refinement/route';
import {
  MOCK_ADMIN_ID,
  mockCombinedSession,
  mockRateLimit,
  mockAIPreference,
  mockTimeout,
  createAIRequest,
} from './_ai-route-helpers';

const BASE_URL = 'http://localhost:3000/api/ai/blueprint-refinement';

const VALID_BODY = {
  blueprint: { course: { title: 'React', description: 'A React course' }, chapters: [] },
  refinementGoals: ['Improve engagement', 'Add assessments'],
};

describe('POST /api/ai/blueprint-refinement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit(withRateLimit as jest.Mock);
    mockCombinedSession(getCombinedSession as jest.Mock, { userId: MOCK_ADMIN_ID, isAdmin: true });
    mockTimeout(withRetryableTimeout as jest.Mock);
  });

  it('returns 401 when not authenticated', async () => {
    mockCombinedSession(getCombinedSession as jest.Mock, null);
    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not admin', async () => {
    mockCombinedSession(getCombinedSession as jest.Mock, { userId: 'user-1', isAdmin: false });
    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(403);
  });

  it('returns 429 when rate limited', async () => {
    mockRateLimit(withRateLimit as jest.Mock, true);
    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(429);
  });

  it('returns 400 when blueprint is missing', async () => {
    const res = await POST(createAIRequest(BASE_URL, { refinementGoals: ['Improve'] }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when refinementGoals is empty', async () => {
    const res = await POST(createAIRequest(BASE_URL, { blueprint: { title: 'test' }, refinementGoals: [] }));
    expect(res.status).toBe(400);
  });

  it('returns 200 with refinement result on success', async () => {
    const mockResult = JSON.stringify({
      refinedBlueprint: { course: { title: 'React Improved' } },
      suggestions: [],
      improvements: {
        structuralChanges: [],
        contentEnhancements: [],
        pedagogicalImprovements: [],
        engagementBoosts: [],
        assessmentRefinements: [],
      },
      qualityMetrics: {
        educationalEffectiveness: 80,
        learnerEngagement: 75,
        contentQuality: 85,
        structuralCoherence: 90,
        assessmentAlignment: 80,
      },
      comparisonAnalysis: {
        improvementAreas: ['Engagement'],
        strengthsPreserved: ['Structure'],
        overallImprovement: 15,
      },
    });
    mockAIPreference(runSAMChatWithPreference as jest.Mock, mockResult);

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.originalBlueprint).toBeDefined();
    expect(body.refinedBlueprint).toBeDefined();
  });

  it('uses fallback when AI returns non-JSON', async () => {
    mockAIPreference(runSAMChatWithPreference as jest.Mock, 'Not valid JSON at all');

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.suggestions).toBeDefined();
  });

  it('returns 500 when AI call completely fails', async () => {
    (runSAMChatWithPreference as jest.Mock).mockRejectedValue(new Error('Failed'));
    // The inner function calls runSAMChatWithPreference directly (not via withRetryableTimeout for the inner call)
    // withRetryableTimeout wraps generateBlueprintRefinement which catches and re-throws
    (withRetryableTimeout as jest.Mock).mockImplementation(async (fn: () => Promise<unknown>) => fn());

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(500);
  });

  it('returns 504 on OperationTimeoutError', async () => {
    (withRetryableTimeout as jest.Mock).mockRejectedValue(
      new OperationTimeoutError('blueprint-refine', 30000),
    );

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(504);
  });

  it('accepts optional userFeedback and targetImprovements', async () => {
    mockAIPreference(runSAMChatWithPreference as jest.Mock, JSON.stringify({
      refinedBlueprint: {},
      suggestions: [],
      improvements: { structuralChanges: [], contentEnhancements: [], pedagogicalImprovements: [], engagementBoosts: [], assessmentRefinements: [] },
      qualityMetrics: { educationalEffectiveness: 75, learnerEngagement: 70, contentQuality: 80, structuralCoherence: 85, assessmentAlignment: 75 },
      comparisonAnalysis: { improvementAreas: [], strengthsPreserved: [], overallImprovement: 10 },
    }));

    const res = await POST(createAIRequest(BASE_URL, {
      ...VALID_BODY,
      userFeedback: 'Needs more exercises',
      targetImprovements: ['pedagogy'],
      preserveStructure: true,
    }));
    expect(res.status).toBe(200);
  });

  it('handles empty AI response gracefully', async () => {
    mockAIPreference(runSAMChatWithPreference as jest.Mock, '');

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    // Empty response triggers the error path
    expect(res.status).toBe(500);
  });
});
