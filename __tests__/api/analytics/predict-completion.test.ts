/**
 * Tests for Analytics Predict Completion Route - app/api/analytics/predict-completion/route.ts
 *
 * Covers: GET (predict course completion)
 * Auth: Uses auth() from @/auth (session-based)
 */

jest.mock('@/lib/predictive-analytics', () => ({
  PredictiveAnalytics: {
    predictCourseCompletion: jest.fn(),
  },
}));

import { GET } from '@/app/api/analytics/predict-completion/route';
import { auth } from '@/auth';
import { PredictiveAnalytics } from '@/lib/predictive-analytics';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockPredict = PredictiveAnalytics.predictCourseCompletion as jest.Mock;

describe('GET /api/analytics/predict-completion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest(
      'http://localhost:3000/api/analytics/predict-completion?courseId=c1'
    );
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when courseId is missing', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/analytics/predict-completion');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Course ID is required');
  });

  it('returns prediction for valid request', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockPredict.mockResolvedValue({
      probability: 0.85,
      estimatedDays: 14,
      confidence: 'high',
    });

    const req = new NextRequest(
      'http://localhost:3000/api/analytics/predict-completion?courseId=c1'
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.prediction.probability).toBe(0.85);
    expect(data.prediction.estimatedDays).toBe(14);
  });

  it('returns high confidence prediction', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockPredict.mockResolvedValue({
      probability: 0.95,
      estimatedDays: 7,
      confidence: 'high',
      factors: ['consistent_study', 'high_engagement'],
    });

    const req = new NextRequest(
      'http://localhost:3000/api/analytics/predict-completion?courseId=c1'
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.prediction.confidence).toBe('high');
    expect(data.prediction.probability).toBeGreaterThan(0.9);
  });

  it('returns low confidence prediction', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockPredict.mockResolvedValue({
      probability: 0.3,
      estimatedDays: 45,
      confidence: 'low',
    });

    const req = new NextRequest(
      'http://localhost:3000/api/analytics/predict-completion?courseId=c1'
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.prediction.confidence).toBe('low');
  });

  it('passes correct userId and courseId to analytics', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-42' } });
    mockPredict.mockResolvedValue({ probability: 0.5 });

    const req = new NextRequest(
      'http://localhost:3000/api/analytics/predict-completion?courseId=course-abc'
    );
    await GET(req);

    expect(mockPredict).toHaveBeenCalledWith('user-42', 'course-abc');
  });

  it('returns 500 on prediction error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockPredict.mockRejectedValue(new Error('Prediction engine error'));

    const req = new NextRequest(
      'http://localhost:3000/api/analytics/predict-completion?courseId=c1'
    );
    const res = await GET(req);

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Failed to predict course completion');
  });

  it('handles session with missing user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });
    const req = new NextRequest(
      'http://localhost:3000/api/analytics/predict-completion?courseId=c1'
    );
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
