jest.mock('@sam-ai/educational', () => ({
  createUnifiedBloomsEngine: jest.fn(),
}));

jest.mock('@sam-ai/pedagogy', () => ({
  createCognitiveLoadAnalyzer: jest.fn(() => ({
    analyze: jest.fn(),
  })),
}));

jest.mock('@/lib/adapters', () => ({
  getUserScopedSAMConfig: jest.fn().mockResolvedValue({}),
  getDatabaseAdapter: jest.fn(() => ({})),
}));

jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(),
}));

jest.mock('@/lib/sam/ai-provider', () => ({
  handleAIAccessError: jest.fn(),
  withSubscriptionGate: jest.fn(),
}));

jest.mock('@/lib/sam/utils/timeout', () => {
  const actual = jest.requireActual('@/lib/sam/utils/timeout');
  return {
    ...actual,
    withRetryableTimeout: jest.fn(),
  };
});

import { GET, POST } from '@/app/api/sam/blooms-analysis/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { handleAIAccessError, withSubscriptionGate } from '@/lib/sam/ai-provider';
import { withRetryableTimeout, OperationTimeoutError } from '@/lib/sam/utils/timeout';
import { NextRequest, NextResponse } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockWithRateLimit = withRateLimit as jest.Mock;
const mockWithSubscriptionGate = withSubscriptionGate as jest.Mock;
const mockHandleAIAccessError = handleAIAccessError as jest.Mock;
const mockWithRetryableTimeout = withRetryableTimeout as jest.Mock;

describe('api/sam/blooms-analysis route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithRateLimit.mockResolvedValue(null);
    mockWithSubscriptionGate.mockResolvedValue({ allowed: true });
    mockHandleAIAccessError.mockReturnValue(null);
    mockCurrentUser.mockResolvedValue({ id: 'user-1', role: 'USER' });
  });

  it('POST returns rate-limit response when middleware blocks', async () => {
    mockWithRateLimit.mockResolvedValueOnce(
      NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    );

    const req = new NextRequest('http://localhost:3000/api/sam/blooms-analysis', {
      method: 'POST',
      body: JSON.stringify({ courseId: 'course-1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/sam/blooms-analysis', {
      method: 'POST',
      body: JSON.stringify({ courseId: 'course-1' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('POST returns 400 when courseId is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/blooms-analysis', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Course ID is required');
  });

  it('POST returns 504 when analysis times out', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      title: 'Course',
      description: 'desc',
      courseGoals: null,
      userId: 'user-1',
      organizationId: null,
      chapters: [],
    });
    mockWithRetryableTimeout.mockRejectedValue(
      new OperationTimeoutError('analyzeCourse', 30000)
    );

    const req = new NextRequest('http://localhost:3000/api/sam/blooms-analysis', {
      method: 'POST',
      body: JSON.stringify({ courseId: 'course-1' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(504);
    expect(body.error).toContain('timed out');
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await GET(new NextRequest('http://localhost:3000/api/sam/blooms-analysis?courseId=course-1'));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('GET returns 400 when courseId is missing', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/sam/blooms-analysis'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Course ID is required');
  });

  it('GET returns 404 when course is not found', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(new NextRequest('http://localhost:3000/api/sam/blooms-analysis?courseId=missing'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Course not found');
  });
});
