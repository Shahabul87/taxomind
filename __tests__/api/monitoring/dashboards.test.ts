import { GET, POST } from '@/app/api/monitoring/dashboards/route';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

describe('/api/monitoring/dashboards route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET returns 401 when no authenticated user', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('GET returns dashboard list for authenticated user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } });
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body.dashboards)).toBe(true);
    expect(body.dashboards[0].name).toBe('System Overview');
  });

  it('POST returns 401 for non-admin user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } });
    const req = new NextRequest('http://localhost:3000/api/monitoring/dashboards', {
      method: 'POST',
      body: JSON.stringify({ name: 'Ops', widgets: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST creates dashboard for admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    const req = new NextRequest('http://localhost:3000/api/monitoring/dashboards', {
      method: 'POST',
      body: JSON.stringify({ name: 'Ops', widgets: [{ id: 'w1' }] }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.dashboard.name).toBe('Ops');
    expect(body.dashboard.createdBy).toBe('admin-1');
  });
});
