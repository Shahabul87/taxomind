/**
 * Tests for Badge Check Route - app/api/badges/check/route.ts
 */

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/badge/service', () => ({
  badgeService: {
    checkAndAwardBadges: jest.fn(),
  },
}));

import { POST } from '@/app/api/badges/check/route';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { badgeService } from '@/lib/badge/service';

const mockAuth = auth as jest.Mock;
const mockCheckAndAward = badgeService.checkAndAwardBadges as jest.Mock;

function req(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/badges/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Badge check route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockCheckAndAward.mockResolvedValue([{ id: 'badge-1' }]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(req({ triggerEvent: 'COURSE_COMPLETED' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when triggerEvent is missing', async () => {
    const res = await POST(req({}));
    expect(res.status).toBe(400);
  });

  it('awards badges and returns count', async () => {
    const res = await POST(req({ triggerEvent: 'COURSE_COMPLETED' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.count).toBe(1);
    expect(mockCheckAndAward).toHaveBeenCalledWith('user-1', 'COURSE_COMPLETED');
  });

  it('returns 500 on unexpected error', async () => {
    mockCheckAndAward.mockRejectedValue(new Error('service fail'));

    const res = await POST(req({ triggerEvent: 'COURSE_COMPLETED' }));
    expect(res.status).toBe(500);
  });
});
