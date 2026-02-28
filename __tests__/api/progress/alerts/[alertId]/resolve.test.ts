jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { PATCH } from '@/app/api/progress/alerts/[alertId]/resolve/route';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

describe('/api/progress/alerts/[alertId]/resolve route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/progress/alerts/a1/resolve', {
      method: 'PATCH',
    });
    const res = await PATCH(req, { params: Promise.resolve({ alertId: 'a1' }) });

    expect(res.status).toBe(401);
  });

  it('returns resolved alert payload for authenticated user', async () => {
    const req = new NextRequest('http://localhost:3000/api/progress/alerts/a1/resolve', {
      method: 'PATCH',
    });
    const res = await PATCH(req, { params: Promise.resolve({ alertId: 'a1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.alert.id).toBe('a1');
    expect(body.alert.resolvedBy).toBe('user-1');
  });
});
