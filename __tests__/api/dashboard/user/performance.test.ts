/**
 * Tests for Dashboard User Performance Route - app/api/dashboard/user/performance/route.ts
 */

import { GET } from '@/app/api/dashboard/user/performance/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

for (const model of ['performance_metrics', 'learning_metrics', 'learning_sessions', 'realtime_activities']) {
  if (!(db as Record<string, unknown>)[model]) {
    (db as Record<string, unknown>)[model] = {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      aggregate: jest.fn(),
    };
  } else {
    const m = (db as Record<string, any>)[model];
    if (!m.findMany) m.findMany = jest.fn();
    if (!m.findFirst) m.findFirst = jest.fn();
    if (!m.create) m.create = jest.fn();
    if (!m.aggregate) m.aggregate = jest.fn();
  }
}

const mockPerformance = (db as Record<string, any>).performance_metrics;
const mockLearningMetrics = (db as Record<string, any>).learning_metrics;
const mockSessions = (db as Record<string, any>).learning_sessions;
const mockRealtime = (db as Record<string, any>).realtime_activities;

function req(query = '') {
  return new NextRequest(`http://localhost:3000/api/dashboard/user/performance${query ? `?${query}` : ''}`);
}

describe('Dashboard user performance route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    const metric = {
      id: 'pm1',
      date: new Date(),
      period: 'DAILY',
      learningVelocity: 30,
      retentionRate: 80,
      engagementScore: 75,
      quizPerformance: 70,
      totalLearningTime: 120,
      activeTime: 100,
      sessionsCount: 2,
      averageSessionLength: 60,
      velocityTrend: 'STABLE',
      engagementTrend: 'STABLE',
      performanceTrend: 'STABLE',
      improvementRate: 0,
    };

    mockPerformance.findMany.mockResolvedValue([metric]);
    mockPerformance.findFirst.mockResolvedValue(metric);
    mockPerformance.aggregate.mockResolvedValue({
      _avg: { engagementScore: 70, quizPerformance: 65, learningVelocity: 25 },
    });
    mockPerformance.create.mockResolvedValue({ id: 'pm-created' });

    mockLearningMetrics.findMany.mockResolvedValue([
      {
        id: 'lm1',
        courseId: 'c1',
        Course: { id: 'c1', title: 'Course 1', imageUrl: null },
        overallProgress: 60,
        learningVelocity: 30,
        engagementTrend: 'STABLE',
        riskScore: 20,
        averageEngagementScore: 75,
        totalStudyTime: 200,
        lastActivityDate: new Date(),
      },
    ]);

    mockSessions.findMany.mockResolvedValue([]);
    mockRealtime.findMany.mockResolvedValue([]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it('returns performance dashboard payload', async () => {
    const res = await GET(req('period=DAILY&days=0'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.summary.totalSessions).toBe(2);
    expect(body.comparative.peerComparison).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(body.insights)).toBe(true);
  });
});

