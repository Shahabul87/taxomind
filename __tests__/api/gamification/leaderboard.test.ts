/**
 * Tests for Gamification Leaderboard Route - app/api/gamification/leaderboard/route.ts
 */

jest.mock('@/lib/gamification', () => ({
  getLeaderboard: jest.fn(),
}));

import { GET } from '@/app/api/gamification/leaderboard/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { getLeaderboard } from '@/lib/gamification';

const mockCurrentUser = currentUser as jest.Mock;
const mockGetLeaderboard = getLeaderboard as jest.Mock;

function req(query = '') {
  return new NextRequest(`http://localhost:3000/api/gamification/leaderboard${query ? `?${query}` : ''}`, {
    headers: { 'x-request-id': 'req-1' },
  });
}

describe('Gamification leaderboard route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockGetLeaderboard.mockResolvedValue({ entries: [], period: 'WEEKLY' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid period', async () => {
    const res = await GET(req('period=INVALID'));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('INVALID_PERIOD');
  });

  it('returns leaderboard data with parsed pagination', async () => {
    const res = await GET(req('period=MONTHLY&limit=200&offset=5'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockGetLeaderboard).toHaveBeenCalledWith('MONTHLY', {
      limit: 100,
      offset: 5,
      userId: 'user-1',
    });
  });

  it('returns 500 on unexpected error', async () => {
    mockGetLeaderboard.mockRejectedValue(new Error('fail'));

    const res = await GET(req());
    expect(res.status).toBe(500);
  });
});
