jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/adapters/achievement-adapter', () => ({
  getAchievementEngine: jest.fn(),
}));

import { POST } from '@/app/api/sam/gamification/challenges/start/route';
import { auth } from '@/auth';
import { getAchievementEngine } from '@/lib/adapters/achievement-adapter';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockGetAchievementEngine = getAchievementEngine as jest.Mock;

describe('/api/sam/gamification/challenges/start route', () => {
  const startChallenge = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    startChallenge.mockResolvedValue(true);
    mockGetAchievementEngine.mockResolvedValue({ startChallenge });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/sam/gamification/challenges/start', {
      method: 'POST',
      body: JSON.stringify({ challengeId: 'ch-1' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when challengeId is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/gamification/challenges/start', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('starts challenge successfully', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/gamification/challenges/start', {
      method: 'POST',
      body: JSON.stringify({ challengeId: 'ch-1' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(startChallenge).toHaveBeenCalledWith('user-1', 'ch-1');
  });
});
