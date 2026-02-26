/**
 * Tests for Gamification Preferences Route - app/api/gamification/preferences/route.ts
 */

jest.mock('@/lib/gamification', () => ({
  getGamificationPreferences: jest.fn(),
  updateGamificationPreferences: jest.fn(),
}));

import { GET, PATCH } from '@/app/api/gamification/preferences/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { getGamificationPreferences, updateGamificationPreferences } from '@/lib/gamification';

const mockCurrentUser = currentUser as jest.Mock;
const mockGetPreferences = getGamificationPreferences as jest.Mock;
const mockUpdatePreferences = updateGamificationPreferences as jest.Mock;

function getReq() {
  return new NextRequest('http://localhost:3000/api/gamification/preferences', {
    headers: { 'x-request-id': 'req-1' },
  });
}

function patchReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/gamification/preferences', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': 'req-1',
    },
    body: JSON.stringify(body),
  });
}

describe('Gamification preferences route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockGetPreferences.mockResolvedValue({ achievementNotifications: true });
    mockUpdatePreferences.mockResolvedValue({ achievementNotifications: false });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('GET returns user preferences', async () => {
    const res = await GET(getReq());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.achievementNotifications).toBe(true);
  });

  it('PATCH returns 400 for invalid preferences payload', async () => {
    const res = await PATCH(patchReq({ pinnedAchievements: [123] as any }));
    expect(res.status).toBe(400);
  });

  it('PATCH updates preferences', async () => {
    const res = await PATCH(patchReq({ achievementNotifications: false, showLevel: true }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockUpdatePreferences).toHaveBeenCalledWith('user-1', {
      achievementNotifications: false,
      showLevel: true,
    });
  });

  it('PATCH returns 500 on unexpected error', async () => {
    mockUpdatePreferences.mockRejectedValue(new Error('write fail'));

    const res = await PATCH(patchReq({ achievementNotifications: false }));
    expect(res.status).toBe(500);
  });
});
