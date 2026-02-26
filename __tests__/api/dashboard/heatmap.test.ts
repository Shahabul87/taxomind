/**
 * Tests for Dashboard Heatmap Route - app/api/dashboard/heatmap/route.ts
 */

import { GET } from '@/app/api/dashboard/heatmap/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

for (const model of ['dashboardStudySession', 'learningActivityLog', 'user_progress', 'userExamAttempt']) {
  if (!(db as Record<string, unknown>)[model]) {
    (db as Record<string, unknown>)[model] = { findMany: jest.fn() };
  } else {
    const m = (db as Record<string, any>)[model];
    if (!m.findMany) m.findMany = jest.fn();
  }
}

const mockSessions = (db as Record<string, any>).dashboardStudySession;
const mockLogs = (db as Record<string, any>).learningActivityLog;
const mockProgress = (db as Record<string, any>).user_progress;
const mockAttempts = (db as Record<string, any>).userExamAttempt;

function req(query = '') {
  return new NextRequest(`http://localhost:3000/api/dashboard/heatmap${query ? `?${query}` : ''}`);
}

describe('Dashboard heatmap route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockSessions.findMany.mockResolvedValue([
      {
        startTime: new Date('2026-01-10T09:00:00.000Z'),
        duration: 45,
        actualStartTime: null,
        actualEndTime: null,
        status: 'COMPLETED',
      },
    ]);
    mockLogs.findMany.mockResolvedValue([
      { createdAt: new Date('2026-01-10T10:00:00.000Z'), duration: 600, activityType: 'READING' },
    ]);
    mockProgress.findMany.mockResolvedValue([{ createdAt: new Date('2026-01-10T11:00:00.000Z'), isCompleted: true }]);
    mockAttempts.findMany.mockResolvedValue([{ submittedAt: new Date('2026-01-10T12:00:00.000Z') }]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid year parameter', async () => {
    const res = await GET(req('year=1900'));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('INVALID_PARAMS');
  });

  it('returns heatmap data', async () => {
    const res = await GET(req('year=2026'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.months).toHaveLength(12);
  });
});

