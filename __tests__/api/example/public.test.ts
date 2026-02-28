jest.mock('@/lib/api/with-api-auth', () => ({
  withPublicAPI: (handler: any) => handler,
}));

import {
  DELETE,
  GET,
  POST,
  PUT,
} from '@/app/api/example/public/route';
import { NextRequest } from 'next/server';

describe('/api/example/public route', () => {
  it('GET returns public endpoint metadata and parsed query params', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/example/public?page=2&debug=true'
    );
    const res = await GET(req, {} as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.message).toBe('This is a public endpoint');
    expect(body.data.queryParams).toEqual({ page: 2, debug: true });
  });

  it('POST returns 400 when required fields are missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/example/public', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com' }),
    });
    const res = await POST(req, {} as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('POST returns created response for valid submission', async () => {
    const req = new NextRequest('http://localhost:3000/api/example/public', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', message: 'hello' }),
    });
    const res = await POST(req, {} as any);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.submissionId).toContain('sub_');
  });

  it('unsupported methods return 405', async () => {
    const resDelete = await DELETE();
    const resPut = await PUT();
    expect(resDelete.status).toBe(405);
    expect(resPut.status).toBe(405);
  });
});
