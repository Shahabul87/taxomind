/**
 * Tests for Analytics AI Insights Route - app/api/analytics/ai-insights/route.ts
 *
 * Covers: GET (AI-powered learning insights)
 * Auth: Uses currentUser() from @/lib/auth
 */

jest.mock('@/lib/sam/ai-provider', () => ({
  runSAMChatWithPreference: jest.fn(),
  handleAIAccessError: jest.fn(() => null),
}));

jest.mock('@/lib/sam/utils/timeout', () => ({
  withRetryableTimeout: jest.fn((fn: () => Promise<unknown>) => fn()),
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

jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(() => null),
}));

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

// Add missing model mocks not in global jest.setup.js
const mockModel = () => ({
  findMany: jest.fn(() => Promise.resolve([])),
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  create: jest.fn(),
  count: jest.fn(() => Promise.resolve(0)),
  groupBy: jest.fn(() => Promise.resolve([])),
  aggregate: jest.fn(),
});
if (!(db as Record<string, unknown>).user_progress) {
  (db as Record<string, unknown>).user_progress = mockModel();
}
if (!(db as Record<string, unknown>).userExamAttempt) {
  (db as Record<string, unknown>).userExamAttempt = mockModel();
}

import { GET } from '@/app/api/analytics/ai-insights/route';

const mockCurrentUser = currentUser as jest.Mock;

describe('GET /api/analytics/ai-insights', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/analytics/ai-insights');
    const res = await GET(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns insights for authenticated user', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.enrollment.findMany as jest.Mock).mockResolvedValue([{ id: 'e1', userId: 'user-1' }]);
    (db.user_progress.findMany as jest.Mock).mockResolvedValue([]);
    (db.userExamAttempt.findMany as jest.Mock).mockResolvedValue([]);
    (db.course.findMany as jest.Mock).mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/analytics/ai-insights');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.insights).toBeDefined();
    expect(data.metadata.userId).toBe('user-1');
  });

  it('returns empty insights when user has no data', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-2' });
    (db.enrollment.findMany as jest.Mock).mockResolvedValue([]);
    (db.user_progress.findMany as jest.Mock).mockResolvedValue([]);
    (db.userExamAttempt.findMany as jest.Mock).mockResolvedValue([]);
    (db.course.findMany as jest.Mock).mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/analytics/ai-insights');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.metadata.hasLearningData).toBe(false);
    expect(data.metadata.hasCreatorData).toBe(false);
  });

  it('filters insights by view parameter', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.enrollment.findMany as jest.Mock).mockResolvedValue([]);
    (db.user_progress.findMany as jest.Mock).mockResolvedValue([]);
    (db.userExamAttempt.findMany as jest.Mock).mockResolvedValue([]);
    (db.course.findMany as jest.Mock).mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/analytics/ai-insights?view=learner');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.metadata.view).toBe('learner');
  });

  it('filters insights by focusArea parameter', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.enrollment.findMany as jest.Mock).mockResolvedValue([]);
    (db.user_progress.findMany as jest.Mock).mockResolvedValue([]);
    (db.userExamAttempt.findMany as jest.Mock).mockResolvedValue([]);
    (db.course.findMany as jest.Mock).mockResolvedValue([]);

    const req = new NextRequest(
      'http://localhost:3000/api/analytics/ai-insights?focusArea=progress'
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.metadata.focusArea).toBe('progress');
  });

  it('generates rule-based insights for high study streak', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.enrollment.findMany as jest.Mock).mockResolvedValue([{ id: 'e1' }]);
    (db.user_progress.findMany as jest.Mock).mockResolvedValue([
      { isCompleted: true, courseId: 'c1', currentStreak: 10, timeSpent: 60, progressPercent: 80 },
    ]);
    (db.userExamAttempt.findMany as jest.Mock).mockResolvedValue([]);
    (db.course.findMany as jest.Mock).mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/analytics/ai-insights?view=learner');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.insights.some((i: { id: string }) => i.id === 'streak-achievement')).toBe(true);
  });

  it('returns 400 for invalid view parameter', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    const req = new NextRequest('http://localhost:3000/api/analytics/ai-insights?view=invalid');
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it('returns 500 on database error', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.enrollment.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

    const req = new NextRequest('http://localhost:3000/api/analytics/ai-insights');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Failed to generate insights');
  });
});
