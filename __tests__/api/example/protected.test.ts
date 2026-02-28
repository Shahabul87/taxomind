jest.mock('@/lib/api/with-api-auth', () => {
  const baseContext = {
    user: { id: 'user-1', name: 'User One', email: 'user@example.com' },
    permissions: {
      hasPermission: jest.fn().mockResolvedValue(true),
    },
    request: {
      method: 'GET',
      ip: '127.0.0.1',
      timestamp: '2026-02-28T00:00:00.000Z',
    },
  };

  return {
    withAPIAuth: (handler: any) => async (request: any) =>
      handler(request, { ...baseContext, request: { ...baseContext.request, method: request.method || 'GET' } }),
    withAdminAuth: (handler: any) => async (request: any) =>
      handler(request, { ...baseContext, user: { ...baseContext.user, id: 'admin-1' } }),
    withPermissions: (_permission: string, handler: any) => async (request: any) =>
      handler(request, baseContext),
    withOwnership: (_extractor: any, handler: any) => async (request: any) =>
      handler(request, baseContext),
  };
});

import {
  DELETE,
  GET,
  HEAD,
  PATCH,
  POST,
  PUT,
} from '@/app/api/example/protected/route';
import { NextRequest } from 'next/server';

describe('/api/example/protected route', () => {
  it('GET returns user and permission info', async () => {
    const req = new NextRequest('http://localhost:3000/api/example/protected');
    const res = await GET(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.user.id).toBe('user-1');
    expect(body.data.permissions.canViewAnalytics).toBe(true);
  });

  it('POST creates a course payload when required fields are present', async () => {
    const req = new NextRequest('http://localhost:3000/api/example/protected', {
      method: 'POST',
      body: JSON.stringify({
        title: 'New Course',
        description: 'Course description',
      }),
    });
    const res = await POST(req as any);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.course.title).toBe('New Course');
  });

  it('PATCH updates course for allowed owner context', async () => {
    const req = new NextRequest('http://localhost:3000/api/example/protected', {
      method: 'PATCH',
      body: JSON.stringify({
        courseId: 'course-1',
        courseUserId: 'user-1',
        updates: { title: 'Updated Title' },
      }),
    });
    const res = await PATCH(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.course.id).toBe('course-1');
  });

  it('DELETE succeeds for admin context with valid target', async () => {
    const req = new NextRequest('http://localhost:3000/api/example/protected', {
      method: 'DELETE',
      body: JSON.stringify({ targetUserId: 'user-2' }),
    });
    const res = await DELETE(req as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.deletedUserId).toBe('user-2');
  });

  it('unsupported methods return 405', async () => {
    const putReq = new NextRequest('http://localhost:3000/api/example/protected', {
      method: 'PUT',
      body: JSON.stringify({ action: 'refresh', targetId: 'x' }),
    });
    const putRes = await PUT(putReq as any);
    expect(putRes.status).toBe(200);

    const headRes = await HEAD();
    expect(headRes.status).toBe(405);
  });
});
