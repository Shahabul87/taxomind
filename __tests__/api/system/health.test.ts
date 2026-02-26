import { GET, POST } from '@/app/api/system/health/route';
import { NextRequest } from 'next/server';

describe('/api/system/health route', () => {
  it('GET returns healthy checks payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/system/health');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('healthy');
    expect(body.checks).toEqual({
      database: true,
      redis: true,
      application: true,
    });
  });

  it('POST returns success message', async () => {
    const req = new NextRequest('http://localhost:3000/api/system/health', { method: 'POST' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('Health action completed');
  });
});
