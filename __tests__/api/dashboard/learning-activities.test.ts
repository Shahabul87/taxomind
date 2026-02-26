/**
 * Tests for Learning Activities Route - app/api/dashboard/learning-activities/route.ts
 */

import { GET, POST } from '@/app/api/dashboard/learning-activities/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).learningActivity) {
  (db as Record<string, unknown>).learningActivity = {
    count: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  };
}
if (!(db as Record<string, unknown>).dailyLearningLog) {
  (db as Record<string, unknown>).dailyLearningLog = {
    upsert: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).dailyLearningLog;
  if (!model.upsert) model.upsert = jest.fn();
}

const mockActivity = (db as Record<string, any>).learningActivity;
const mockDailyLog = (db as Record<string, any>).dailyLearningLog;

function getReq(query = '') {
  return new NextRequest(`http://localhost:3000/api/dashboard/learning-activities${query ? `?${query}` : ''}`);
}

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/dashboard/learning-activities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Learning activities route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    mockActivity.count.mockResolvedValue(5);
    mockActivity.findMany
      .mockResolvedValueOnce([
        {
          id: 'a1',
          userId: 'user-1',
          status: 'NOT_STARTED',
          estimatedDuration: 30,
          actualDuration: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'a2',
          userId: 'user-1',
          status: 'COMPLETED',
          estimatedDuration: 60,
          actualDuration: 45,
        },
      ]);

    mockActivity.create.mockResolvedValue({
      id: 'a3',
      userId: 'user-1',
      title: 'Session',
      estimatedDuration: 40,
    });
    mockDailyLog.upsert.mockResolvedValue({});
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('GET returns activities with today stats', async () => {
    const res = await GET(getReq('page=1&limit=10&status=NOT_STARTED'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.pagination).toEqual({ page: 1, limit: 10, total: 5 });
    expect(body.metadata.todayStats.completed).toBe(1);
  });

  it('POST returns 400 for invalid payload', async () => {
    const res = await POST(postReq({ type: 'INVALID' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST creates activity and updates daily log', async () => {
    const res = await POST(postReq({
      type: 'STUDY_SESSION',
      title: 'Session',
      scheduledDate: '2026-03-05T00:00:00.000Z',
      estimatedDuration: 40,
      priority: 'MEDIUM',
      tags: [],
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockActivity.create).toHaveBeenCalled();
    expect(mockDailyLog.upsert).toHaveBeenCalled();
  });
});

