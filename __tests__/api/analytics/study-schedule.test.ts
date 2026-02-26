jest.mock('@/lib/predictive-analytics', () => ({
  PredictiveAnalytics: {
    predictOptimalStudySchedule: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { GET } from '@/app/api/analytics/study-schedule/route';
import { auth } from '@/auth';
import { PredictiveAnalytics } from '@/lib/predictive-analytics';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockPredictSchedule = PredictiveAnalytics.predictOptimalStudySchedule as jest.Mock;

describe('GET /api/analytics/study-schedule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockPredictSchedule.mockResolvedValue({
      bestTime: '18:00',
      recommendedDuration: 45,
      days: ['Monday', 'Wednesday'],
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/analytics/study-schedule?courseId=c1');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when courseId is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/study-schedule');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Course ID is required');
  });

  it('returns predicted schedule for authenticated user', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/study-schedule?courseId=course-1');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.schedule.bestTime).toBe('18:00');
    expect(mockPredictSchedule).toHaveBeenCalledWith('user-1', 'course-1');
  });

  it('returns 500 when prediction fails', async () => {
    mockPredictSchedule.mockRejectedValueOnce(new Error('engine failed'));

    const req = new NextRequest('http://localhost:3000/api/analytics/study-schedule?courseId=course-1');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to predict optimal study schedule');
  });
});
