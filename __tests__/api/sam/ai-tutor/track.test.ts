jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { POST } from '@/app/api/sam/ai-tutor/track/route';
import { currentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

describe('/api/sam/ai-tutor/track route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/track', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns success for tracked interaction payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/track', {
      method: 'POST',
      body: JSON.stringify({
        type: 'QUESTION',
        data: { q: 'x' },
        timestamp: '2026-02-26T00:00:00.000Z',
        context: { courseId: 'c1' },
      }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('tracked');
  });
});
