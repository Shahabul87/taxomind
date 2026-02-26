jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/sam/utils/sam-database', () => ({
  unlockSAMBadge: jest.fn(),
}));

import { POST } from '@/app/api/sam/badges/route';
import { auth } from '@/auth';
import { unlockSAMBadge } from '@/lib/sam/utils/sam-database';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockUnlockSAMBadge = unlockSAMBadge as jest.Mock;

describe('/api/sam/badges route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockUnlockSAMBadge.mockResolvedValue({ id: 'badge-1' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/sam/badges', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when required fields are missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/badges', {
      method: 'POST',
      body: JSON.stringify({ badgeType: 'A' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('unlocks badge and returns success', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/badges', {
      method: 'POST',
      body: JSON.stringify({
        badgeType: 'STREAK_MASTER',
        level: 'BRONZE',
        description: 'Great streak',
      }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockUnlockSAMBadge).toHaveBeenCalled();
  });
});
