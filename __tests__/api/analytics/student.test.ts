jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(),
  getClientIdentifier: jest.fn(() => 'client-1'),
  getRateLimitHeaders: jest.fn(() => ({
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': '99',
    'X-RateLimit-Reset': '999999',
  })),
}));

jest.mock('@/lib/mocks/analytics-mock-data', () => ({
  getMockStudentData: jest.fn(() => ({
    overview: { totalCourses: 2, avgProgress: 60 },
  })),
}));

import { GET, OPTIONS } from '@/app/api/analytics/student/route';
import { currentUser } from '@/lib/auth';
import { getMockStudentData } from '@/lib/mocks/analytics-mock-data';
import { rateLimit } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockGetData = getMockStudentData as jest.Mock;
const mockRateLimit = rateLimit as jest.Mock;

describe('/api/analytics/student route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (!(globalThis as any).crypto) {
      Object.defineProperty(globalThis, 'crypto', {
        value: {},
        configurable: true,
      });
    }
    (globalThis as any).crypto.randomUUID = jest.fn(() => 'req-student-1');
    mockRateLimit.mockResolvedValue({
      success: true,
      remaining: 99,
      reset: Date.now() + 60000,
    });
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
  });

  it('returns 429 when rate limit is exceeded', async () => {
    mockRateLimit.mockResolvedValueOnce({
      success: false,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const req = new NextRequest('http://localhost:3000/api/analytics/student');
    const res = await GET(req);

    expect(res.status).toBe(429);
  });

  it('returns 400 for invalid date range query params', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/analytics/student?startDate=2026-02-20T00:00:00.000Z&endDate=2026-02-10T00:00:00.000Z'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns analytics data for authenticated user', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/analytics/student?courses=1,2,x&startDate=2026-02-01T00:00:00.000Z&endDate=2026-02-20T00:00:00.000Z'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.metadata.isDemo).toBe(false);
    expect(mockGetData).toHaveBeenCalledWith(
      expect.objectContaining({
        courseIds: ['1', '2'],
      })
    );
  });

  it('returns demo analytics when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/analytics/student');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.metadata.isDemo).toBe(true);
  });

  it('OPTIONS returns CORS headers', async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
  });
});
