jest.mock('@/lib/auth-dynamic', () => ({
  authenticateDynamicRoute: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { GET, POST } from '@/app/api/auth-dynamic-test/route';
import { authenticateDynamicRoute } from '@/lib/auth-dynamic';
import { NextRequest } from 'next/server';

const mockAuthenticate = authenticateDynamicRoute as jest.Mock;

describe('/api/auth-dynamic-test route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET returns 401 when authentication fails', async () => {
    mockAuthenticate.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/auth-dynamic-test');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.authenticated).toBe(false);
  });

  it('GET returns authenticated user payload', async () => {
    mockAuthenticate.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      name: 'User 1',
    });

    const req = new NextRequest('http://localhost:3000/api/auth-dynamic-test');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.authenticated).toBe(true);
    expect(body.user.id).toBe('user-1');
    expect(body.message).toBe('Authentication successful');
  });

  it('POST returns body for authenticated users', async () => {
    mockAuthenticate.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      name: 'User 1',
    });

    const req = new NextRequest('http://localhost:3000/api/auth-dynamic-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'value' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.authenticated).toBe(true);
    expect(body.requestBody).toEqual({ key: 'value' });
  });

  it('POST returns 500 when request parsing fails', async () => {
    mockAuthenticate.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      name: 'User 1',
    });

    const req = new NextRequest('http://localhost:3000/api/auth-dynamic-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalid-json',
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.authenticated).toBe(false);
  });

  it('GET returns 500 when authenticator throws', async () => {
    mockAuthenticate.mockRejectedValueOnce(new Error('auth crash'));

    const req = new NextRequest('http://localhost:3000/api/auth-dynamic-test');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('auth crash');
  });
});
