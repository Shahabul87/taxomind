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

jest.mock('@/lib/error-handling/error-monitoring', () => ({
  errorMonitoring: {
    getErrorMetrics: jest.fn(),
  },
}));

import { GET, POST } from '@/app/api/error-management/metrics/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { errorMonitoring } from '@/lib/error-handling/error-monitoring';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockGetErrorMetrics = errorMonitoring.getErrorMetrics as jest.Mock;

function ensureModel(modelName: string, methods: string[]) {
  if (!(db as Record<string, unknown>)[modelName]) {
    (db as Record<string, unknown>)[modelName] = {};
  }
  const model = (db as Record<string, any>)[modelName];
  for (const method of methods) {
    if (!model[method]) model[method] = jest.fn();
  }
  return model;
}

const progressAlerts = ensureModel('progress_alerts', ['count', 'groupBy']);
const auditLog = ensureModel('auditLog', ['groupBy', 'count']);
const user = ensureModel('user', ['findMany']);

describe('/api/error-management/metrics route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });

    mockGetErrorMetrics.mockResolvedValue({
      totalErrors: 10,
      errorsByType: { API: 4 },
      errorsBySeverity: { HIGH: 2, MEDIUM: 8 },
      errorsByComponent: { analytics: 3 },
      trends: [],
      recentErrors: [],
    });

    progressAlerts.count.mockResolvedValue(2);
    progressAlerts.groupBy.mockResolvedValue([{ userId: 'u1', _count: { userId: 2 } }]);
    auditLog.groupBy.mockResolvedValue([{ createdAt: new Date(), _count: { _all: 1 } }]);
    auditLog.count.mockResolvedValue(1);
    user.findMany.mockResolvedValue([{ id: 'u1', name: 'User 1', email: 'u1@test.com' }]);
  });

  it('GET returns 401 for non-admin users', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1', role: 'USER' });
    const req = new NextRequest('http://localhost:3000/api/error-management/metrics');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('GET returns metrics summary payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/error-management/metrics?timeRange=1d');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.summary.totalErrors).toBe(10);
    expect(body.data.analytics).toBeDefined();
  });

  it('GET includes user details when includeDetails=true', async () => {
    auditLog.groupBy.mockResolvedValueOnce([{ createdAt: new Date(), _count: { _all: 1 } }]);
    progressAlerts.count.mockResolvedValueOnce(2).mockResolvedValueOnce(4).mockResolvedValueOnce(3);
    const req = new NextRequest(
      'http://localhost:3000/api/error-management/metrics?timeRange=1d&includeDetails=true'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.analytics.topUsers).toBeDefined();
  });

  it('GET returns 500 when metrics provider fails', async () => {
    mockGetErrorMetrics.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/error-management/metrics');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });

  it('POST returns health metrics for admin', async () => {
    progressAlerts.count
      .mockResolvedValueOnce(0) // criticalErrorsLastHour
      .mockResolvedValueOnce(10) // totalErrorsLastHour
      .mockResolvedValueOnce(20) // totalErrorsLastDay
      .mockResolvedValueOnce(3); // activeAlerts
    auditLog.count.mockResolvedValueOnce(1); // systemErrors

    const req = new NextRequest('http://localhost:3000/api/error-management/metrics', {
      method: 'POST',
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.healthStatus).toBeDefined();
    expect(body.data.metrics.totalErrorsLastDay).toBe(20);
  });
});
