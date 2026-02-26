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

import { GET } from '@/app/api/sam/gamification/stats/route';
import { auth } from '@/auth';
import { getAchievementEngine } from '@/lib/adapters/achievement-adapter';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockGetAchievementEngine = getAchievementEngine as jest.Mock;

describe('/api/sam/gamification/stats route', () => {
  const getSummary = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    getSummary.mockResolvedValue({ points: 200, level: 4 });
    mockGetAchievementEngine.mockResolvedValue({ getSummary });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/sam/gamification/stats');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns stats summary for authenticated user', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/gamification/stats');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.points).toBe(200);
    expect(getSummary).toHaveBeenCalledWith('user-1');
  });
});
