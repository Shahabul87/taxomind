/**
 * Tests for Dashboard Gantt Route - app/api/dashboard/gantt/route.ts
 */

import { GET } from '@/app/api/dashboard/gantt/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

for (const model of ['dailyLearningLog', 'learningActivity']) {
  if (!(db as Record<string, unknown>)[model]) {
    (db as Record<string, unknown>)[model] = { findMany: jest.fn() };
  } else {
    const m = (db as Record<string, any>)[model];
    if (!m.findMany) m.findMany = jest.fn();
  }
}

const mockDailyLog = (db as Record<string, any>).dailyLearningLog;
const mockActivity = (db as Record<string, any>).learningActivity;

function req(query = '') {
  return new NextRequest(`http://localhost:3000/api/dashboard/gantt${query ? `?${query}` : ''}`);
}

describe('Dashboard gantt route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockDailyLog.findMany.mockResolvedValue([
      {
        date: new Date('2026-03-01T00:00:00.000Z'),
        plannedMinutes: 120,
        actualMinutes: 90,
        focusScore: 80,
        productivityScore: 75,
      },
    ]);
    mockActivity.findMany.mockResolvedValue([
      {
        id: 'a1',
        scheduledDate: new Date('2026-03-01T00:00:00.000Z'),
        status: 'COMPLETED',
        estimatedDuration: 60,
        actualDuration: 50,
        title: 'Read',
        type: 'READING',
        startTime: '09:00',
        endTime: '10:00',
        progress: 100,
        course: { title: 'Course 1' },
      },
    ]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid query', async () => {
    const res = await GET(req('weeks=0'));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns gantt timeline payload', async () => {
    const res = await GET(req('weeks=1'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.timeline)).toBe(true);
  });
});

