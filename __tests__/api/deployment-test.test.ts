import { GET } from '@/app/api/deployment-test/route';

describe('GET /api/deployment-test', () => {
  it('returns deployment diagnostics', async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe('Deployment test successful');
    expect(body.nextjsVersion).toBe('15');
    expect(body.paramsPattern).toBe('Promise<params> - FIXED');
    expect(typeof body.deploymentId).toBe('string');
  });

  it('returns 500 when GET throws unexpectedly', async () => {
    const spy = jest.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('random fail');
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal server error');

    spy.mockRestore();
  });
});
