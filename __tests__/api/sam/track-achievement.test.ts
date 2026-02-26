jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/lib/adapters/achievement-adapter', () => ({
  getAchievementEngine: jest.fn(),
}));

import { POST } from '@/app/api/sam/track-achievement/route';
import { auth } from '@/auth';
import { getAchievementEngine } from '@/lib/adapters/achievement-adapter';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockGetAchievementEngine = getAchievementEngine as jest.Mock;

describe('/api/sam/track-achievement route', () => {
  const trackProgress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    trackProgress.mockResolvedValue({
      pointsAwarded: 15,
      achievementsUnlocked: ['badge-1'],
      challengesCompleted: [],
    });
    mockGetAchievementEngine.mockResolvedValue({ trackProgress });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/sam/track-achievement', {
      method: 'POST',
      body: JSON.stringify({ action: 'COMPLETE' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when action is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/track-achievement', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('tracks progress and returns rewards', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/track-achievement', {
      method: 'POST',
      body: JSON.stringify({ action: 'COMPLETE_QUIZ', metadata: { score: 90 } }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.pointsAwarded).toBe(15);
  });
});
