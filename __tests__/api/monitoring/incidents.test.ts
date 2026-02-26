import { GET, POST } from '@/app/api/monitoring/incidents/route';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

describe('/api/monitoring/incidents route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET returns 401 for non-admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('GET returns incidents for admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body.incidents)).toBe(true);
    expect(body.incidents[0].title).toContain('Database');
  });

  it('POST updates incident for admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    const req = new NextRequest('http://localhost:3000/api/monitoring/incidents', {
      method: 'POST',
      body: JSON.stringify({
        incidentId: 'inc-1',
        status: 'resolved',
        resolution: 'restarted db',
      }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.incident.id).toBe('inc-1');
    expect(body.incident.updatedBy).toBe('admin-1');
  });
});
