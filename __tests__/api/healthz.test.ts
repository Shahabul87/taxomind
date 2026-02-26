import { GET, HEAD } from '@/app/api/healthz/route';

describe('/api/healthz route', () => {
  it('GET returns ok health payload', async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(typeof body.timestamp).toBe('string');
    expect(typeof body.uptime).toBe('number');
  });

  it('HEAD returns 200', async () => {
    const res = await HEAD();
    expect(res.status).toBe(200);
  });
});
