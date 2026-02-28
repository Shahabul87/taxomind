jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@sam-ai/educational', () => ({
  createFinancialEngine: jest.fn(),
}));

jest.mock('@/lib/adapters', () => ({
  getUserScopedSAMConfig: jest.fn().mockResolvedValue({}),
  getDatabaseAdapter: jest.fn(() => ({})),
}));

jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(() => null),
}));

jest.mock('@/lib/sam/ai-provider', () => ({
  handleAIAccessError: jest.fn(() => null),
}));

jest.mock('@/lib/sam/utils/timeout', () => ({
  withRetryableTimeout: jest.fn((fn: () => Promise<unknown>) => fn()),
  OperationTimeoutError: class OperationTimeoutError extends Error {
    operationName: string;
    timeoutMs: number;

    constructor(operationName: string, timeoutMs: number) {
      super(`Timeout: ${operationName}`);
      this.operationName = operationName;
      this.timeoutMs = timeoutMs;
    }
  },
  TIMEOUT_DEFAULTS: {
    AI_ANALYSIS: 30000,
  },
}));

import { POST } from '@/app/api/sam/financial-intelligence/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { handleAIAccessError } from '@/lib/sam/ai-provider';
import { withRetryableTimeout, OperationTimeoutError } from '@/lib/sam/utils/timeout';
import { NextRequest, NextResponse } from 'next/server';

const mockAuth = auth as jest.Mock;
const { createFinancialEngine: mockCreateFinancialEngine } = jest.requireMock('@sam-ai/educational') as {
  createFinancialEngine: jest.Mock;
};
const mockWithRateLimit = withRateLimit as jest.Mock;
const mockHandleAIAccessError = handleAIAccessError as jest.Mock;
const mockWithRetryableTimeout = withRetryableTimeout as jest.Mock;

const typedDb = db as Record<string, unknown>;
typedDb.course = typedDb.course || { findUnique: jest.fn() };
typedDb.financialSnapshot = typedDb.financialSnapshot || { create: jest.fn() };
typedDb.sAMInteraction = typedDb.sAMInteraction || { create: jest.fn() };

const mockCourseFindUnique = (typedDb.course as { findUnique: jest.Mock }).findUnique;
const mockFinancialSnapshotCreate = (typedDb.financialSnapshot as { create: jest.Mock }).create;
const mockInteractionCreate = (typedDb.sAMInteraction as { create: jest.Mock }).create;

const mockEngine = {
  analyzeFinancials: jest.fn(),
  analyzeProfitability: jest.fn(),
};

describe('/api/sam/financial-intelligence route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithRateLimit.mockResolvedValue(null);
    mockWithRetryableTimeout.mockImplementation((fn: () => Promise<unknown>) => fn());
    mockHandleAIAccessError.mockReturnValue(null);
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    mockCreateFinancialEngine.mockReturnValue(mockEngine);
    mockEngine.analyzeFinancials.mockResolvedValue({
      revenue: { totalRevenue: 1000 },
      costs: { totalCosts: 400 },
      profitability: { netProfit: 600, netMargin: 60 },
      subscriptions: { activeSubscribers: 12, monthlyRecurringRevenue: 500 },
    });
    mockEngine.analyzeProfitability.mockResolvedValue({
      netProfit: 123,
      margin: 0.5,
    });
    mockCourseFindUnique.mockResolvedValue(null);
    mockFinancialSnapshotCreate.mockResolvedValue({ id: 'snapshot-1' });
    mockInteractionCreate.mockResolvedValue({ id: 'interaction-1' });
  });

  it('returns rate-limit response when blocked', async () => {
    mockWithRateLimit.mockResolvedValueOnce(
      NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    );

    const req = new NextRequest('http://localhost:3000/api/sam/financial-intelligence', {
      method: 'POST',
      body: JSON.stringify({ action: 'analyze-financials', data: { organizationId: 'org-1' } }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/sam/financial-intelligence', {
      method: 'POST',
      body: JSON.stringify({ action: 'analyze-financials', data: { organizationId: 'org-1' } }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when action/data is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/financial-intelligence', {
      method: 'POST',
      body: JSON.stringify({ action: 'analyze-financials' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('blocks non-admin users for non-profitability actions', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-1', role: 'USER' } });

    const req = new NextRequest('http://localhost:3000/api/sam/financial-intelligence', {
      method: 'POST',
      body: JSON.stringify({ action: 'revenue-analysis', data: { organizationId: 'org-1' } }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('requires courseId for non-admin profitability analysis', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-1', role: 'USER' } });

    const req = new NextRequest('http://localhost:3000/api/sam/financial-intelligence', {
      method: 'POST',
      body: JSON.stringify({ action: 'profitability-analysis', data: {} }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 when requested course is not found for non-admin profitability', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-1', role: 'USER' } });
    mockCourseFindUnique.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/sam/financial-intelligence', {
      method: 'POST',
      body: JSON.stringify({ action: 'profitability-analysis', data: { courseId: 'course-1' } }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('returns 403 when non-admin user does not own the course', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-1', role: 'USER' } });
    mockCourseFindUnique.mockResolvedValueOnce({ userId: 'other-user', organizationId: 'org-1' });

    const req = new NextRequest('http://localhost:3000/api/sam/financial-intelligence', {
      method: 'POST',
      body: JSON.stringify({ action: 'profitability-analysis', data: { courseId: 'course-1' } }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('returns 400 when organizationId cannot be resolved', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/financial-intelligence', {
      method: 'POST',
      body: JSON.stringify({ action: 'analyze-financials', data: {} }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid action', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/financial-intelligence', {
      method: 'POST',
      body: JSON.stringify({ action: 'unknown-action', data: { organizationId: 'org-1' } }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 504 on operation timeout', async () => {
    mockWithRetryableTimeout.mockImplementationOnce(() => {
      throw new OperationTimeoutError('analyzeFinancials', 30000);
    });

    const req = new NextRequest('http://localhost:3000/api/sam/financial-intelligence', {
      method: 'POST',
      body: JSON.stringify({ action: 'analyze-financials', data: { organizationId: 'org-1' } }),
    });

    const res = await POST(req);
    expect(res.status).toBe(504);
  });

  it('uses AI access error response when provider access fails', async () => {
    mockWithRetryableTimeout.mockImplementationOnce(() => {
      throw new Error('quota exceeded');
    });
    mockHandleAIAccessError.mockReturnValueOnce(
      NextResponse.json({ error: 'AI access denied' }, { status: 402 })
    );

    const req = new NextRequest('http://localhost:3000/api/sam/financial-intelligence', {
      method: 'POST',
      body: JSON.stringify({ action: 'analyze-financials', data: { organizationId: 'org-1' } }),
    });

    const res = await POST(req);
    expect(res.status).toBe(402);
  });

  it('returns successful financial analysis payload for admin user', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/financial-intelligence', {
      method: 'POST',
      body: JSON.stringify({
        action: 'analyze-financials',
        data: {
          organizationId: 'org-1',
          dateRange: { start: '2025-01-01', end: '2025-01-31' },
        },
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.action).toBe('analyze-financials');
    expect(body.data.revenue.totalRevenue).toBeGreaterThan(0);
    expect(mockFinancialSnapshotCreate).toHaveBeenCalled();
    expect(mockInteractionCreate).toHaveBeenCalled();
  });
});
