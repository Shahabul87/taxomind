/**
 * Tests for User Badges Route - app/api/badges/user/route.ts
 */

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/badge/service', () => ({
  badgeService: {
    getUserBadges: jest.fn(),
  },
}));

import { GET } from '@/app/api/badges/user/route';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { badgeService } from '@/lib/badge/service';

const mockAuth = auth as jest.Mock;
const mockGetUserBadges = badgeService.getUserBadges as jest.Mock;

describe('User badges route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockGetUserBadges.mockResolvedValue([{ id: 'badge-1' }, { id: 'badge-2' }]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(new NextRequest('http://localhost:3000/api/badges/user'));
    expect(res.status).toBe(401);
  });

  it('returns user badges when authenticated', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/badges/user'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.badges).toHaveLength(2);
    expect(mockGetUserBadges).toHaveBeenCalledWith('user-1');
  });

  it('returns 500 on unexpected error', async () => {
    mockGetUserBadges.mockRejectedValue(new Error('service fail'));

    const res = await GET(new NextRequest('http://localhost:3000/api/badges/user'));
    expect(res.status).toBe(500);
  });
});
