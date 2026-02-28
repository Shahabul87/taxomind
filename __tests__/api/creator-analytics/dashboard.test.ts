jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { POST } from '@/app/api/creator-analytics/dashboard/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

describe('/api/creator-analytics/dashboard route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'creator-1' });
    (db.course.findMany as jest.Mock).mockResolvedValue([]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/creator-analytics/dashboard', {
      method: 'POST',
      body: JSON.stringify({ timeframe: 'month' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 when request payload is invalid', async () => {
    const req = new NextRequest('http://localhost:3000/api/creator-analytics/dashboard', {
      method: 'POST',
      body: JSON.stringify({ timeframe: 'invalid-window' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid request format');
  });

  it('returns empty analytics snapshot for creators with no published courses', async () => {
    const req = new NextRequest('http://localhost:3000/api/creator-analytics/dashboard', {
      method: 'POST',
      body: JSON.stringify({ timeframe: 'month' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.analytics.overview.totalCourses).toBe(0);
    expect(body.analytics.overview.totalLearners).toBe(0);
    expect(body.analytics.coursePerformance).toEqual([]);
    expect(body.metadata.creatorId).toBe('creator-1');
  });
});
