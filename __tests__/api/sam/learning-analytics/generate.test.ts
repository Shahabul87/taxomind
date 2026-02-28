jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const { TransformStream } = require('stream/web');
if (!(global as Record<string, unknown>).TransformStream) {
  (global as Record<string, unknown>).TransformStream = TransformStream;
}

import { POST } from '@/app/api/sam/learning-analytics/generate/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const typedDb = db as Record<string, unknown>;

typedDb.enrollment = typedDb.enrollment || { findMany: jest.fn() };
typedDb.sAMPoints = typedDb.sAMPoints || { aggregate: jest.fn() };
typedDb.sAMStreak = typedDb.sAMStreak || { findUnique: jest.fn() };
typedDb.sAMBadge = typedDb.sAMBadge || { count: jest.fn() };
typedDb.sAMInteraction = typedDb.sAMInteraction || { findMany: jest.fn(), count: jest.fn() };
typedDb.sAMAnalytics = typedDb.sAMAnalytics || { findMany: jest.fn() };
typedDb.sAMLearningGoal = typedDb.sAMLearningGoal || { findMany: jest.fn() };
typedDb.skillMastery10K = typedDb.skillMastery10K || { findMany: jest.fn() };

const mockEnrollmentFindMany = (typedDb.enrollment as { findMany: jest.Mock }).findMany;
const mockSAMPointsAggregate = (typedDb.sAMPoints as { aggregate: jest.Mock }).aggregate;
const mockSAMStreakFindUnique = (typedDb.sAMStreak as { findUnique: jest.Mock }).findUnique;
const mockSAMBadgeCount = (typedDb.sAMBadge as { count: jest.Mock }).count;
const mockSAMInteractionFindMany = (typedDb.sAMInteraction as { findMany: jest.Mock }).findMany;
const mockSAMInteractionCount = (typedDb.sAMInteraction as { count: jest.Mock }).count;
const mockSAMAnalyticsFindMany = (typedDb.sAMAnalytics as { findMany: jest.Mock }).findMany;
const mockSAMLearningGoalFindMany = (typedDb.sAMLearningGoal as { findMany: jest.Mock }).findMany;
const mockSkillMasteryFindMany = (typedDb.skillMastery10K as { findMany: jest.Mock }).findMany;

async function readSSEBody(body: unknown): Promise<string> {
  if (!body || typeof body !== 'object' || !('getReader' in (body as Record<string, unknown>))) {
    return String(body ?? '');
  }

  const stream = body as ReadableStream<Uint8Array>;
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let output = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    output += decoder.decode(value, { stream: true });
  }
  output += decoder.decode();

  return output;
}

describe('/api/sam/learning-analytics/generate route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    mockEnrollmentFindMany.mockResolvedValue([]);
    mockSAMPointsAggregate.mockResolvedValue({ _sum: { points: 0 } });
    mockSAMStreakFindUnique.mockResolvedValue({ currentStreak: 0, longestStreak: 0 });
    mockSAMBadgeCount.mockResolvedValue(0);
    mockSAMInteractionFindMany.mockResolvedValue([]);
    mockSAMInteractionCount.mockResolvedValue(0);
    mockSAMAnalyticsFindMany.mockResolvedValue([]);
    mockSAMLearningGoalFindMany.mockResolvedValue([]);
    mockSkillMasteryFindMany.mockResolvedValue([]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/sam/learning-analytics/generate', {
      method: 'POST',
      body: JSON.stringify({
        scope: 'comprehensive',
        timeRange: '30d',
        metricFocus: 'all',
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 for invalid parameters', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/learning-analytics/generate', {
      method: 'POST',
      body: JSON.stringify({
        scope: 'comprehensive',
        timeRange: 'invalid',
        metricFocus: 'all',
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid parameters');
  });

  it('streams analytics and completion events for valid requests', async () => {
    mockEnrollmentFindMany.mockResolvedValueOnce([
      {
        courseId: 'course-1',
        Course: {
          id: 'course-1',
          title: 'TypeScript Mastery',
          chapters: [
            {
              id: 'ch-1',
              sections: [{ id: 'sec-1' }, { id: 'sec-2' }],
            },
          ],
        },
      },
    ]);

    mockSAMPointsAggregate
      .mockResolvedValueOnce({ _sum: { points: 900 } })
      .mockResolvedValueOnce({ _sum: { points: 600 } });

    mockSAMStreakFindUnique.mockResolvedValueOnce({ currentStreak: 4, longestStreak: 9 });
    mockSAMBadgeCount.mockResolvedValueOnce(3);

    const now = Date.now();
    mockSAMInteractionFindMany.mockResolvedValueOnce([
      { createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000), context: { duration: 15 } },
      { createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000), context: { duration: 20 } },
      { createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000), context: { duration: 10 } },
    ]);
    mockSAMInteractionCount.mockResolvedValueOnce(2);

    mockSAMAnalyticsFindMany.mockResolvedValueOnce([
      { context: { bloomsLevel: 'Understand' }, recordedAt: new Date() },
      { context: { bloomsLevel: 'Apply' }, recordedAt: new Date() },
    ]);

    mockSAMLearningGoalFindMany.mockResolvedValueOnce([
      {
        id: 'goal-1',
        status: 'ACTIVE',
        title: 'Complete Module 1',
        targetDate: new Date('2026-04-01T00:00:00.000Z'),
        subGoals: [
          { status: 'COMPLETED' },
          { status: 'IN_PROGRESS' },
        ],
      },
    ]);

    mockSkillMasteryFindMany.mockResolvedValueOnce([
      {
        proficiencyLevel: 'BEGINNER',
        progressPercentage: 20,
        skillName: 'Debugging',
        skill: { name: 'Debugging' },
      },
      {
        proficiencyLevel: 'PROFICIENT',
        progressPercentage: 70,
        skillName: 'Algorithms',
        skill: { name: 'Algorithms' },
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/sam/learning-analytics/generate', {
      method: 'POST',
      body: JSON.stringify({
        scope: 'comprehensive',
        timeRange: '30d',
        metricFocus: 'all',
        includeRecommendations: true,
      }),
    });

    const res = await POST(req);
    const text = await readSSEBody(res.body);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/event-stream');
    expect(text).toContain('event: progress');
    expect(text).toContain('event: analytics');
    expect(text).toContain('"scope":"comprehensive"');
    expect(text).toContain('"totalCourses":1');
    expect(text).toContain('"currentStreak":4');
    expect(text).toContain('event: done');
  });

  it('streams an error event when generation fails after stream starts', async () => {
    mockEnrollmentFindMany.mockRejectedValueOnce(new Error('db unavailable'));

    const req = new NextRequest('http://localhost:3000/api/sam/learning-analytics/generate', {
      method: 'POST',
      body: JSON.stringify({
        scope: 'comprehensive',
        timeRange: '30d',
        metricFocus: 'all',
      }),
    });

    const res = await POST(req);
    const text = await readSSEBody(res.body);

    expect(res.status).toBe(200);
    expect(text).toContain('event: error');
    expect(text).toContain('Analytics generation failed');
  });

  it('returns 500 when request body cannot be parsed', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/learning-analytics/generate', {
      method: 'POST',
      body: '{bad-json',
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to generate analytics');
  });
});
