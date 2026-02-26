jest.mock('@/lib/predictive-analytics', () => ({
  PredictiveAnalytics: {
    generatePersonalizedRecommendations: jest.fn(),
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

import { GET } from '@/app/api/analytics/recommendations/route';
import { auth } from '@/auth';
import { PredictiveAnalytics } from '@/lib/predictive-analytics';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockGenerateRecommendations =
  PredictiveAnalytics.generatePersonalizedRecommendations as jest.Mock;

describe('GET /api/analytics/recommendations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockGenerateRecommendations.mockResolvedValue([
      { type: 'practice', message: 'Review chapter 3' },
    ]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/analytics/recommendations?courseId=c1');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when courseId is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/recommendations');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Course ID is required');
  });

  it('returns recommendations for authenticated user', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/recommendations?courseId=course-1');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.recommendations).toHaveLength(1);
    expect(mockGenerateRecommendations).toHaveBeenCalledWith('user-1', 'course-1');
  });

  it('returns 500 when generator throws', async () => {
    mockGenerateRecommendations.mockRejectedValueOnce(new Error('prediction failure'));

    const req = new NextRequest('http://localhost:3000/api/analytics/recommendations?courseId=course-1');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to generate personalized recommendations');
  });
});
