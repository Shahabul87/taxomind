jest.mock('@sam-ai/educational', () => ({
  createCollaborationEngine: jest.fn(() => ({
    startCollaborationSession: jest.fn(),
    joinCollaborationSession: jest.fn(),
    recordContribution: jest.fn(),
    getRealTimeMetrics: jest.fn().mockResolvedValue({ messagesPerMinute: 0, activeUsers: 0 }),
    endCollaborationSession: jest.fn(),
    analyzeCollaboration: jest.fn(),
  })),
}));

jest.mock('@/lib/adapters', () => ({
  createCollaborationAdapter: jest.fn(() => ({})),
}));

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/sam/ai-provider', () => ({
  withSubscriptionGate: jest.fn().mockResolvedValue({ allowed: true }),
}));

jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(() => null),
}));

jest.mock('@/lib/sam/utils/timeout', () => ({
  withRetryableTimeout: jest.fn((fn: () => Promise<unknown>) => fn()),
  TIMEOUT_DEFAULTS: { AI_ANALYSIS: 30000 },
}));

import { GET, POST } from '@/app/api/sam/collaboration-analytics/route';
import { auth } from '@/auth';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { NextRequest, NextResponse } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockRateLimit = withRateLimit as jest.Mock;

describe('api/sam/collaboration-analytics route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockReturnValue(null);
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('POST returns rate-limit response when limited', async () => {
    mockRateLimit.mockReturnValueOnce(NextResponse.json({ error: 'limited' }, { status: 429 }));
    const req = new NextRequest('http://localhost:3000/api/sam/collaboration-analytics', {
      method: 'POST',
      body: JSON.stringify({ action: 'start-session', data: {} }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/sam/collaboration-analytics', {
      method: 'POST',
      body: JSON.stringify({ action: 'start-session', data: {} }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST returns 400 for missing fields', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/collaboration-analytics', {
      method: 'POST',
      body: JSON.stringify({ action: 'start-session' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('POST returns 400 for invalid action', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/collaboration-analytics', {
      method: 'POST',
      body: JSON.stringify({ action: 'invalid-action', data: {} }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/sam/collaboration-analytics');

    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('GET returns rate-limit response when limited', async () => {
    mockRateLimit.mockReturnValueOnce(NextResponse.json({ error: 'limited' }, { status: 429 }));
    const req = new NextRequest('http://localhost:3000/api/sam/collaboration-analytics');

    const res = await GET(req);
    expect(res.status).toBe(429);
  });
});
