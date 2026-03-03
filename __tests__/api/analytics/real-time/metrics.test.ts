jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { GET, POST } from '@/app/api/analytics/real-time/metrics/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

function ensureModel(modelName: string, methods: string[]) {
  if (!(db as Record<string, unknown>)[modelName]) {
    (db as Record<string, unknown>)[modelName] = {};
  }
  const model = (db as Record<string, any>)[modelName];
  for (const method of methods) {
    if (!model[method]) model[method] = jest.fn();
  }
  return model;
}

const userExamAttempt = ensureModel('userExamAttempt', ['findMany', 'count', 'groupBy']);
const learningMetrics = ensureModel('learning_metrics', ['aggregate', 'count']);
const enrollment = ensureModel('enrollment', ['findMany']);

describe('/api/analytics/real-time/metrics route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    userExamAttempt.findMany.mockResolvedValue([{ userId: 'u1' }, { userId: 'u2' }]);
    userExamAttempt.count
      .mockResolvedValueOnce(10) // totalInteractions
      .mockResolvedValueOnce(3) // currentVideosWatching
      .mockResolvedValueOnce(15); // recent attempts (system load / calculateSystemLoad)
    // groupBy is called for: completion metrics (2x), struggling students low scores (1x)
    userExamAttempt.groupBy
      .mockResolvedValueOnce([{ userId: 'u1', _count: 8 }]) // examAttemptCounts
      .mockResolvedValueOnce([{ userId: 'u1', _count: 5 }]) // gradedCounts
      .mockResolvedValueOnce([{ userId: 'u3', _count: 2 }]); // lowScoreAttempts

    learningMetrics.aggregate.mockResolvedValue({ _avg: { riskScore: 0.2 } });
    learningMetrics.count.mockResolvedValue(1);

    enrollment.findMany.mockResolvedValue([{ userId: 'u1', courseId: 'course-1' }]);
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/analytics/real-time/metrics');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('GET returns realtime metrics payload', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/analytics/real-time/metrics?courseId=course-1&timeRange=1h'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.activeUsers).toBe(2);
    expect(body.totalInteractions).toBe(10);
    expect(body.currentVideosWatching).toBe(3);
    expect(body.avgEngagementScore).toBe(80);
    expect(body.completionRate).toBeGreaterThan(0);
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/analytics/real-time/metrics', {
      method: 'POST',
      body: JSON.stringify({ action: 'subscribe' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST supports subscribe/unsubscribe and rejects invalid action', async () => {
    const subscribeReq = new NextRequest('http://localhost:3000/api/analytics/real-time/metrics', {
      method: 'POST',
      body: JSON.stringify({ action: 'subscribe' }),
    });
    const subscribeRes = await POST(subscribeReq);
    expect(subscribeRes.status).toBe(200);

    const unsubscribeReq = new NextRequest('http://localhost:3000/api/analytics/real-time/metrics', {
      method: 'POST',
      body: JSON.stringify({ action: 'unsubscribe' }),
    });
    const unsubscribeRes = await POST(unsubscribeReq);
    expect(unsubscribeRes.status).toBe(200);

    const invalidReq = new NextRequest('http://localhost:3000/api/analytics/real-time/metrics', {
      method: 'POST',
      body: JSON.stringify({ action: 'noop' }),
    });
    const invalidRes = await POST(invalidReq);
    expect(invalidRes.status).toBe(400);
  });
});
