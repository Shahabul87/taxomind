import { GET } from '@/app/api/minimal-test/route';

describe('GET /api/minimal-test', () => {
  it('returns working status', async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('working');
    expect(typeof body.timestamp).toBe('string');
  });

  it('returns 500 when response serialization fails', async () => {
    const spy = jest
      .spyOn(Date.prototype, 'toISOString')
      .mockImplementationOnce(() => {
        throw new Error('serialize fail');
      });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal server error');

    spy.mockRestore();
  });
});
