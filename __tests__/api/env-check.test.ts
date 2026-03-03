jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

jest.mock('@/lib/api/dev-only-guard', () => ({
  devOnlyGuard: jest.fn(),
}));

import { GET } from '@/app/api/env-check/route';
import { adminAuth } from '@/auth.admin';
import { devOnlyGuard } from '@/lib/api/dev-only-guard';

const mockAdminAuth = adminAuth as jest.Mock;
const mockDevOnlyGuard = devOnlyGuard as jest.Mock;

describe('/api/env-check route', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'development';
    mockDevOnlyGuard.mockReturnValue(null);
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('returns 404 in production', async () => {
    process.env.NODE_ENV = 'production';
    const { NextResponse } = jest.requireMock('next/server');
    mockDevOnlyGuard.mockReturnValue(NextResponse.json({ error: 'Not Found' }, { status: 404 }));
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it('returns 401 for non-admin in development', async () => {
    mockAdminAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns boolean environment checks for admin', async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.environment).toBe('development');
    expect(body.checks).toBeDefined();
    expect(typeof body.checks.database).toBe('boolean');
  });

  it('returns 500 when auth provider throws', async () => {
    mockAdminAuth.mockRejectedValueOnce(new Error('auth error'));
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe(true);
  });
});
