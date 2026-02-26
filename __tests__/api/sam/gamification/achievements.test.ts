jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/sam/utils/sam-database', () => ({
  getSAMBadges: jest.fn(),
}));

import { GET } from '@/app/api/sam/gamification/achievements/route';
import { auth } from '@/auth';
import { getSAMBadges } from '@/lib/sam/utils/sam-database';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockGetSAMBadges = getSAMBadges as jest.Mock;

describe('/api/sam/gamification/achievements route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockGetSAMBadges.mockResolvedValue([
      {
        id: 'b1',
        badgeType: 'STREAK_MASTER',
        name: 'Streak Master',
        description: 'Keep a learning streak',
        iconUrl: 'icon',
        level: 2,
        earnedAt: '2026-02-26T00:00:00.000Z',
        pointsRequired: 100,
      },
    ]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/sam/gamification/achievements');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns mapped achievements list', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/gamification/achievements');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data[0].id).toBe('b1');
    expect(body.data[0].name).toBe('Streak Master');
  });
});
