/**
 * Tests for Gamification XP Route - app/api/gamification/xp/route.ts
 */

jest.mock('@/lib/gamification', () => ({
  getUserXP: jest.fn(),
  awardXP: jest.fn(),
  updateStreak: jest.fn(),
}));

import { GET, POST } from '@/app/api/gamification/xp/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { getUserXP, awardXP, updateStreak } from '@/lib/gamification';

const mockCurrentUser = currentUser as jest.Mock;
const mockGetUserXP = getUserXP as jest.Mock;
const mockAwardXP = awardXP as jest.Mock;
const mockUpdateStreak = updateStreak as jest.Mock;

function getReq() {
  return new NextRequest('http://localhost:3000/api/gamification/xp', {
    headers: { 'x-request-id': 'req-1' },
  });
}

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/gamification/xp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': 'req-1',
    },
    body: JSON.stringify(body),
  });
}

describe('Gamification XP route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockGetUserXP.mockResolvedValue({ totalXP: 100, currentLevel: 2 });
    mockUpdateStreak.mockResolvedValue({ currentStreak: 4 });
    mockAwardXP.mockResolvedValue({ awarded: 50, newTotal: 150 });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('GET returns xp and streak', async () => {
    const res = await GET(getReq());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.xp.totalXP).toBe(100);
    expect(body.data.streak.currentStreak).toBe(4);
  });

  it('POST returns 400 for invalid payload', async () => {
    const res = await POST(postReq({ amount: -5, source: 'QUIZ', description: '' }));
    expect(res.status).toBe(400);
  });

  it('POST awards XP for valid payload', async () => {
    const res = await POST(postReq({
      amount: 50,
      source: 'QUIZ',
      description: 'Completed quiz',
      sourceId: 'quiz-1',
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockAwardXP).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        amount: 50,
        source: 'QUIZ',
      })
    );
  });

  it('POST returns 500 on unexpected error', async () => {
    mockAwardXP.mockRejectedValue(new Error('award fail'));

    const res = await POST(postReq({ amount: 50, source: 'QUIZ', description: 'ok' }));
    expect(res.status).toBe(500);
  });
});
