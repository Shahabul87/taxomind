/**
 * Tests for Gamification Achievements Route - app/api/gamification/achievements/route.ts
 */

jest.mock('@/lib/gamification', () => ({
  getUserAchievements: jest.fn(),
  getAllAchievements: jest.fn(),
}));

import { GET } from '@/app/api/gamification/achievements/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { getUserAchievements, getAllAchievements } from '@/lib/gamification';

const mockCurrentUser = currentUser as jest.Mock;
const mockGetUserAchievements = getUserAchievements as jest.Mock;
const mockGetAllAchievements = getAllAchievements as jest.Mock;

function req(params = '') {
  const suffix = params ? `?${params}` : '';
  return new NextRequest(`http://localhost:3000/api/gamification/achievements${suffix}`, {
    headers: { 'x-request-id': 'req-1' },
  });
}

describe('Gamification achievements route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockGetUserAchievements.mockResolvedValue([
      { isUnlocked: true, achievement: { category: 'STREAK', rarity: 'COMMON' } },
      { isUnlocked: false, achievement: { category: 'COMPLETION', rarity: 'RARE' } },
    ]);
    mockGetAllAchievements.mockResolvedValue([
      { category: 'STREAK' },
      { category: 'COMPLETION' },
    ]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it('returns achievements and stats', async () => {
    const res = await GET(req('unlockedOnly=true&category=STREAK'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.achievements).toHaveLength(2);
    expect(body.data.stats.totalUnlocked).toBe(1);
    expect(mockGetUserAchievements).toHaveBeenCalledWith('user-1', {
      unlockedOnly: true,
      category: 'STREAK',
    });
  });

  it('returns 500 on unexpected error', async () => {
    mockGetUserAchievements.mockRejectedValue(new Error('db down'));

    const res = await GET(req());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
