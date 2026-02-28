jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { GET, POST } from '@/app/api/progress/alerts/route';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

describe('/api/progress/alerts route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/progress/alerts');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('GET returns filtered alerts payload', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/progress/alerts?severity=CRITICAL&unresolved=true'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.alerts)).toBe(true);
  });

  it('POST creates mock alert for authenticated user', async () => {
    const req = new NextRequest('http://localhost:3000/api/progress/alerts', {
      method: 'POST',
      body: JSON.stringify({ courseId: 'react-101' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.alert.id).toBeDefined();
  });
});
