jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/sam/utils/sam-database', () => ({
  getUserSAMStats: jest.fn(),
}));

import { GET } from '@/app/api/sam/stats/route';
import { auth } from '@/auth';
import { getUserSAMStats } from '@/lib/sam/utils/sam-database';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockGetUserSAMStats = getUserSAMStats as jest.Mock;

describe('/api/sam/stats route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockGetUserSAMStats.mockResolvedValue({ sessions: 3, score: 80 });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/sam/stats');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns SAM stats for user', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/stats?courseId=c1');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.score).toBe(80);
    expect(mockGetUserSAMStats).toHaveBeenCalledWith('user-1', 'c1');
  });

  it('returns 500 on provider error', async () => {
    mockGetUserSAMStats.mockRejectedValueOnce(new Error('failed'));
    const req = new NextRequest('http://localhost:3000/api/sam/stats');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
