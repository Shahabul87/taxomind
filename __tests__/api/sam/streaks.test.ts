jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/sam/utils/sam-database', () => ({
  updateSAMStreak: jest.fn(),
}));

import { POST } from '@/app/api/sam/streaks/route';
import { auth } from '@/auth';
import { updateSAMStreak } from '@/lib/sam/utils/sam-database';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockUpdateSAMStreak = updateSAMStreak as jest.Mock;

describe('/api/sam/streaks route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockUpdateSAMStreak.mockResolvedValue({ currentStreak: 5, longestStreak: 7 });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/sam/streaks', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when required fields are missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/streaks', {
      method: 'POST',
      body: JSON.stringify({ streakType: 'daily' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('updates streak and returns success', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/streaks', {
      method: 'POST',
      body: JSON.stringify({
        streakType: 'daily',
        currentStreak: 5,
        longestStreak: 7,
      }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockUpdateSAMStreak).toHaveBeenCalledWith('user-1', {
      streakType: 'daily',
      currentStreak: 5,
      longestStreak: 7,
      courseId: undefined,
    });
  });
});
