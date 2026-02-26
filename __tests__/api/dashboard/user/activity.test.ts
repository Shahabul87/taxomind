/**
 * Tests for Dashboard User Activity Route - app/api/dashboard/user/activity/route.ts
 */

import { GET, POST } from '@/app/api/dashboard/user/activity/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

for (const model of ['realtime_activities', 'learning_sessions', 'user_progress', 'user_achievements']) {
  if (!(db as Record<string, unknown>)[model]) {
    (db as Record<string, unknown>)[model] = {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
  } else {
    const m = (db as Record<string, any>)[model];
    if (!m.findMany) m.findMany = jest.fn();
    if (!m.findFirst) m.findFirst = jest.fn();
    if (!m.count) m.count = jest.fn();
    if (!m.groupBy) m.groupBy = jest.fn();
    if (!m.create) m.create = jest.fn();
    if (!m.update) m.update = jest.fn();
  }
}
if (!(db as Record<string, unknown>).$queryRaw) {
  (db as Record<string, unknown>).$queryRaw = jest.fn();
}

const mockRealtime = (db as Record<string, any>).realtime_activities;
const mockSessions = (db as Record<string, any>).learning_sessions;
const mockProgress = (db as Record<string, any>).user_progress;
const mockAchievements = (db as Record<string, any>).user_achievements;
const mockQueryRaw = (db as Record<string, any>).$queryRaw;

function getReq(query = '') {
  return new NextRequest(`http://localhost:3000/api/dashboard/user/activity${query ? `?${query}` : ''}`);
}

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/dashboard/user/activity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Dashboard user activity route', () => {
  let uuidSpy: jest.SpyInstance | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    if (!global.crypto) {
      Object.defineProperty(global, 'crypto', {
        value: { randomUUID: () => 'uuid-1' },
        configurable: true,
      });
    } else if (!(global.crypto as any).randomUUID) {
      (global.crypto as any).randomUUID = () => 'uuid-1';
    }

    if (global.crypto?.randomUUID) {
      uuidSpy = jest.spyOn(global.crypto, 'randomUUID').mockReturnValue('uuid-1');
    }

    mockRealtime.findMany
      .mockResolvedValueOnce([
        {
          id: 'a1',
          activityType: 'COURSE_START',
          action: 'start',
          timestamp: new Date(),
          duration: 20,
          progress: 10,
          score: null,
          Course: { id: 'c1', title: 'Course 1', imageUrl: null },
          Chapter: null,
          Section: null,
          metadata: {},
        },
      ])
      .mockResolvedValueOnce([{ timestamp: new Date() }]);
    mockRealtime.count.mockResolvedValueOnce(2).mockResolvedValueOnce(5);
    mockRealtime.groupBy.mockResolvedValue([{ activityType: 'COURSE_START', _count: { id: 3 } }]);
    mockQueryRaw.mockResolvedValue([{ hour: 10, count: 2 }]);
  });

  afterEach(() => {
    uuidSpy?.mockRestore();
    uuidSpy = null;
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('GET returns activity dashboard payload', async () => {
    const res = await GET(getReq('limit=5'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body.activities)).toBe(true);
    expect(body.statistics.todayCount).toBe(2);
    expect(body.insights.favoriteActivityType).toBe('COURSE_START');
  });

  it('POST tracks activity and returns success', async () => {
    mockRealtime.create.mockResolvedValue({ id: 'a-created' });
    mockSessions.findFirst.mockResolvedValue(null);
    mockSessions.create.mockResolvedValue({ id: 'sess-1' });
    mockProgress.findFirst.mockResolvedValue(null);
    mockProgress.create.mockResolvedValue({ id: 'p1' });
    mockAchievements.findFirst.mockResolvedValue(null);
    mockAchievements.create.mockResolvedValue({ id: 'ach1' });

    const res = await POST(postReq({
      activityType: 'COURSE_START',
      action: 'start',
      courseId: 'c1',
      duration: 15,
      progress: 20,
      sessionId: 'sess-1',
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.activityId).toBe('a-created');
  });
});
