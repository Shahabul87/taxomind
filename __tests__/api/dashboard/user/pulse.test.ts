/**
 * Tests for Dashboard User Pulse Route - app/api/dashboard/user/pulse/route.ts
 */

import { GET } from '@/app/api/dashboard/user/pulse/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

for (const model of ['learning_sessions', 'realtime_activities']) {
  if (!(db as Record<string, unknown>)[model]) {
    (db as Record<string, unknown>)[model] = {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    };
  } else {
    const m = (db as Record<string, any>)[model];
    if (!m.findFirst) m.findFirst = jest.fn();
    if (!m.findMany) m.findMany = jest.fn();
    if (!m.count) m.count = jest.fn();
  }
}

const mockSessions = (db as Record<string, any>).learning_sessions;
const mockRealtime = (db as Record<string, any>).realtime_activities;

function req() {
  return new NextRequest('http://localhost:3000/api/dashboard/user/pulse');
}

describe('Dashboard user pulse route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    mockSessions.findFirst.mockResolvedValue({
      id: 'sess-1',
      duration: 40,
      startTime: new Date(),
      engagementScore: 70,
      completionPercentage: 30,
      Course: { id: 'c1', title: 'Course 1', imageUrl: null },
      Chapter: { id: 'ch1', title: 'Chapter 1' },
    });
    mockSessions.findMany.mockResolvedValue([{ duration: 40, engagementScore: 70 }]);

    mockRealtime.findMany
      .mockResolvedValueOnce([
        {
          id: 'a1',
          activityType: 'COURSE_START',
          action: 'start',
          timestamp: new Date(),
          Course: null,
          Chapter: null,
          Section: null,
          progress: 20,
          score: null,
          duration: 10,
          courseId: 'c1',
        },
      ])
      .mockResolvedValueOnce([
        {
          activityType: 'COURSE_START',
          timestamp: new Date(),
          duration: 10,
          score: null,
          courseId: 'c1',
        },
      ])
      .mockResolvedValueOnce([
        {
          activityType: 'COURSE_COMPLETE',
          timestamp: new Date(),
          duration: 20,
          score: 80,
          courseId: 'c1',
        },
      ]);
    mockRealtime.findFirst.mockResolvedValue({ timestamp: new Date() });
    mockRealtime.count.mockResolvedValueOnce(3).mockResolvedValueOnce(6);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it('returns pulse dashboard payload', async () => {
    const res = await GET(req());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.activeSession.id).toBe('sess-1');
    expect(body.liveMetrics.status).toBe('active');
    expect(Array.isArray(body.aiInsights)).toBe(true);
    expect(Array.isArray(body.recommendations)).toBe(true);
  });
});

