import { GET } from '@/app/api/monitoring/health/route';
import { NextRequest } from 'next/server';

describe('/api/monitoring/health route', () => {
  it('returns liveness response for type=liveness', async () => {
    const req = new NextRequest('http://localhost:3000/api/monitoring/health?type=liveness');
    const res = GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.alive).toBe(true);
  });

  it('returns readiness response for type=readiness', async () => {
    const req = new NextRequest('http://localhost:3000/api/monitoring/health?type=readiness');
    const res = GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ready).toBe(true);
  });

  it('returns detailed health payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/monitoring/health?detailed=true');
    const res = GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('healthy');
    expect(body.services.database.status).toBe('healthy');
    expect(typeof body.metrics.uptime).toBe('number');
  });
});
