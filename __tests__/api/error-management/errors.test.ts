jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

jest.mock('@/lib/error-handling/api-error-handler', () => ({
  withErrorHandling:
    (handler: (request: Request, context?: any) => Promise<any>) =>
    async (request: Request, context?: any) => {
      const { NextResponse } = jest.requireMock('next/server');
      try {
        const data = await handler(request, context);
        return NextResponse.json({ success: true, data });
      } catch (error: any) {
        const message = error?.message || 'Unknown error';
        let status = 500;
        if (message.includes('Unauthorized')) status = 401;
        else if (message.includes('required') || message.includes('Invalid')) status = 400;
        else if (message.toLowerCase().includes('not found')) status = 404;
        return NextResponse.json({ success: false, error: { message } }, { status });
      }
    },
}));

import { DELETE, GET, PATCH } from '@/app/api/error-management/errors/route';
import { adminAuth } from '@/auth.admin';
import { NextRequest } from 'next/server';

const mockAdminAuth = adminAuth as jest.Mock;

describe('/api/error-management/errors route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
  });

  it('GET returns 401 for non-admin users', async () => {
    mockAdminAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/error-management/errors');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('GET returns paginated error data', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/error-management/errors?page=2&limit=10&resolved=true'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 0,
      pages: 0,
    });
  });

  it('PATCH validates required fields', async () => {
    const req = new NextRequest('http://localhost:3000/api/error-management/errors', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'resolve' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it('PATCH performs resolve update action', async () => {
    const req = new NextRequest('http://localhost:3000/api/error-management/errors', {
      method: 'PATCH',
      body: JSON.stringify({
        errorIds: ['e1', 'e2'],
        action: 'resolve',
      }),
    });
    const res = await PATCH(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.updatedCount).toBe(2);
  });

  it('DELETE requires olderThan query param', async () => {
    const req = new NextRequest('http://localhost:3000/api/error-management/errors');
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });

  it('DELETE succeeds when olderThan is provided', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/error-management/errors?olderThan=2026-01-01T00:00:00.000Z&resolved=true'
    );
    const res = await DELETE(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.deletedCount).toBe(0);
  });
});
