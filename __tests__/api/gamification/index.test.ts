/**
 * Tests for Gamification Dashboard Route - app/api/gamification/route.ts
 */

jest.mock('@/lib/gamification', () => ({
  getGamificationDashboard: jest.fn(),
}));

import { GET } from '@/app/api/gamification/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { getGamificationDashboard } from '@/lib/gamification';

const mockCurrentUser = currentUser as jest.Mock;
const mockGetGamificationDashboard = getGamificationDashboard as jest.Mock;

function req() {
  return new NextRequest('http://localhost:3000/api/gamification', {
    headers: { 'x-request-id': 'req-1' },
  });
}

describe('Gamification dashboard route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockGetGamificationDashboard.mockResolvedValue({ level: 3, xp: 320 });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(req());
    expect(res.status).toBe(401);
  });

  it('returns dashboard data for authenticated user', async () => {
    const res = await GET(req());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.level).toBe(3);
    expect(body.metadata.requestId).toBe('req-1');
  });

  it('returns 500 on unexpected error', async () => {
    mockGetGamificationDashboard.mockRejectedValue(new Error('boom'));

    const res = await GET(req());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
