jest.mock('@/lib/swagger', () => ({
  swaggerSpec: {
    openapi: '3.0.0',
    info: { title: 'Test API', version: '1.0.0' },
  },
}));

import { GET } from '@/app/api/docs/route';

describe('/api/docs route', () => {
  it('returns swagger spec payload', async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.openapi).toBe('3.0.0');
    expect(body.info.title).toBe('Test API');
  });
});
