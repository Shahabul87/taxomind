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

import { GET, POST } from '@/app/api/error-management/alerts/route';
import { currentUser } from '@/lib/auth';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

describe('/api/error-management/alerts route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
  });

  it('GET returns 401 for non-admin users', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1', role: 'USER' });
    const req = new NextRequest('http://localhost:3000/api/error-management/alerts');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('GET returns empty alerts summary by default', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/error-management/alerts?acknowledged=false&resolved=false'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.alerts).toEqual([]);
    expect(body.data.summary.total).toBe(0);
  });

  it('POST validates required fields', async () => {
    const req = new NextRequest('http://localhost:3000/api/error-management/alerts', {
      method: 'POST',
      body: JSON.stringify({ type: 'MANUAL' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('POST creates manual alert payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/error-management/alerts', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Manual issue detected',
        type: 'MANUAL',
        severity: 'HIGH',
        metadata: { source: 'admin' },
      }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.alert).toMatchObject({
      message: 'Manual issue detected',
      type: 'MANUAL',
      severity: 'HIGH',
    });
  });
});
