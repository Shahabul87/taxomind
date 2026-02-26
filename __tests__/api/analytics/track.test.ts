jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(),
  getClientIdentifier: jest.fn(() => 'client-1'),
  getRateLimitHeaders: jest.fn(() => ({
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': '99',
    'X-RateLimit-Reset': '999999',
  })),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { OPTIONS, POST } from '@/app/api/analytics/track/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockRateLimit = rateLimit as jest.Mock;

function ensureModel(modelName: string, methods: string[]) {
  if (!(db as Record<string, unknown>)[modelName]) {
    (db as Record<string, unknown>)[modelName] = {};
  }
  const model = (db as Record<string, any>)[modelName];
  for (const method of methods) {
    if (!model[method]) model[method] = jest.fn();
  }
  return model;
}

const userProgress = ensureModel('user_progress', ['findFirst', 'update']);

describe('/api/analytics/track route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockRateLimit.mockResolvedValue({
      success: true,
      remaining: 99,
      reset: Date.now() + 60000,
    });
    userProgress.findFirst.mockResolvedValue({ id: 'progress-1' });
    userProgress.update.mockResolvedValue({ id: 'progress-1' });
  });

  it('returns 429 when rate limit is exceeded', async () => {
    mockRateLimit.mockResolvedValueOnce({
      success: false,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const req = new NextRequest('http://localhost:3000/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ event: 'view', properties: {}, timestamp: Date.now() }),
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it('tracks learning analytics batch events', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({
        events: [
          {
            eventType: 'time_spent',
            eventData: { timeSpent: 120 },
            timestamp: Date.now(),
            sessionId: 's-1',
          },
          {
            eventType: 'video_completed',
            eventData: {},
            timestamp: Date.now(),
            sessionId: 's-1',
          },
        ],
        courseId: 'course-1',
        chapterId: 'chapter-1',
        sectionId: 'section-1',
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Learning analytics tracked');
    expect(userProgress.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1', courseId: 'course-1' } })
    );
  });

  it('tracks legacy analytics event format', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({
        event: 'page_view',
        properties: { page: '/dashboard' },
        timestamp: Date.now(),
      }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Event tracked');
  });

  it('returns 400 for invalid payload format', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ foo: 'bar' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_EVENT');
  });

  it('returns 500 when request parsing fails', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/track', {
      method: 'POST',
      body: '{invalid-json',
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('TRACKING_ERROR');
  });

  it('OPTIONS returns CORS headers', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/track', { method: 'OPTIONS' });
    const res = await OPTIONS(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
  });
});
