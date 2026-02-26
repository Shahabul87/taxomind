import { GET, POST } from '@/app/api/monitoring/alerts/route';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

describe('/api/monitoring/alerts route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET returns 401 when session is missing', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('GET returns alerts for admin user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body.alerts)).toBe(true);
    expect(body.alerts.length).toBeGreaterThan(0);
  });

  it('POST resolves an alert for admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    const req = new NextRequest('http://localhost:3000/api/monitoring/alerts', {
      method: 'POST',
      body: JSON.stringify({ alertId: 'a1' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.alert.id).toBe('a1');
    expect(body.alert.resolvedBy).toBe('admin-1');
  });
});
