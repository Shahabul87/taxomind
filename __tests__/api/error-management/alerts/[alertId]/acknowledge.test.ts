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

import { DELETE, POST } from '@/app/api/error-management/alerts/[alertId]/acknowledge/route';
import { currentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

describe('/api/error-management/alerts/[alertId]/acknowledge route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
  });

  it('POST returns 401 for non-admin users', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1', role: 'USER' });
    const req = new NextRequest('http://localhost:3000/api/error-management/alerts/a1/acknowledge', {
      method: 'POST',
    });
    const res = await POST(req, { params: Promise.resolve({ alertId: 'a1' }) });
    expect(res.status).toBe(401);
  });

  it('POST returns 404 because model is not implemented', async () => {
    const req = new NextRequest('http://localhost:3000/api/error-management/alerts/a1/acknowledge', {
      method: 'POST',
    });
    const res = await POST(req, { params: Promise.resolve({ alertId: 'a1' }) });
    expect(res.status).toBe(404);
  });

  it('DELETE returns 400 when alertId is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/error-management/alerts//acknowledge', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: Promise.resolve({ alertId: '' }) });
    expect(res.status).toBe(400);
  });

  it('DELETE returns 404 because model is not implemented', async () => {
    const req = new NextRequest('http://localhost:3000/api/error-management/alerts/a1/acknowledge', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: Promise.resolve({ alertId: 'a1' }) });
    expect(res.status).toBe(404);
  });
});
