jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { POST } from '@/app/api/analytics/real-time/alerts/[alertId]/resolve/route';
import { currentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

describe('POST /api/analytics/real-time/alerts/[alertId]/resolve', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/analytics/real-time/alerts/a1/resolve', {
      method: 'POST',
    });
    const res = await POST(req, { params: Promise.resolve({ alertId: 'a1' }) });
    expect(res.status).toBe(401);
  });

  it('returns success payload when resolved', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    const req = new NextRequest('http://localhost:3000/api/analytics/real-time/alerts/a1/resolve', {
      method: 'POST',
    });
    const res = await POST(req, { params: Promise.resolve({ alertId: 'a1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Alert resolved successfully');
    expect(body.resolvedBy).toBe('user-1');
  });

  it('returns 500 when handler throws', async () => {
    mockCurrentUser.mockRejectedValueOnce(new Error('auth crash'));

    const req = new NextRequest('http://localhost:3000/api/analytics/real-time/alerts/a1/resolve', {
      method: 'POST',
    });
    const res = await POST(req, { params: Promise.resolve({ alertId: 'a1' }) });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to resolve alert');
  });
});
