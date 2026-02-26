jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { POST } from '@/app/api/sam/ai-tutor/detect-learning-style/route';
import { currentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

describe('/api/sam/ai-tutor/detect-learning-style route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/detect-learning-style', {
      method: 'POST',
      body: JSON.stringify({ interactions: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns detected style payload', async () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValueOnce(0);
    const req = new NextRequest('http://localhost:3000/api/sam/ai-tutor/detect-learning-style', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-1', interactions: [{ type: 'video' }] }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.type).toBe('visual');
    expect(body.confidence).toBe(0.7);
    randomSpy.mockRestore();
  });
});
