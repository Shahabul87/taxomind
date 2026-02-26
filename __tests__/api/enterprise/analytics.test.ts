jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { GET, POST } from '@/app/api/enterprise/analytics/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

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

const enterpriseAnalytics = ensureModel('enterpriseAnalytics', [
  'findMany',
  'createMany',
  'count',
  'groupBy',
  'aggregate',
]);

describe('/api/enterprise/analytics route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });

    enterpriseAnalytics.findMany.mockResolvedValue([
      {
        id: 'ea-1',
        organizationId: 'org-1',
        metricType: 'USER_ENGAGEMENT',
        metricCategory: 'daily_active_users',
        value: 1200,
        recordedAt: new Date('2026-02-20T00:00:00.000Z'),
        aggregationPeriod: 'DAILY',
      },
    ]);
    enterpriseAnalytics.createMany.mockResolvedValue({ count: 1 });
    enterpriseAnalytics.count.mockResolvedValue(1);
    enterpriseAnalytics.groupBy
      .mockResolvedValueOnce([{ organizationId: 'org-1', _count: 1 }])
      .mockResolvedValueOnce([
        { metricType: 'USER_ENGAGEMENT', _count: 1, _sum: { value: 1200 }, _avg: { value: 1200 } },
      ]);
    enterpriseAnalytics.aggregate.mockResolvedValue({
      _min: { recordedAt: new Date('2026-02-20T00:00:00.000Z') },
      _max: { recordedAt: new Date('2026-02-20T00:00:00.000Z') },
    });
  });

  it('GET returns demo data when no session', async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/enterprise/analytics');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.analytics)).toBe(true);
  });

  it('GET returns 401 for non-admin users', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } });
    const req = new NextRequest('http://localhost:3000/api/enterprise/analytics');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('GET returns enterprise analytics for admin', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/enterprise/analytics?organizationId=org-1&period=DAILY&groupBy=metricType'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totalRecords).toBe(1);
    expect(Array.isArray(body.data.analytics)).toBe(true);
    expect(body.data.summary.totalRecords).toBe(1);
  });

  it('POST returns 401 for non-admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } });
    const req = new NextRequest('http://localhost:3000/api/enterprise/analytics', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST records analytics rows for valid payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/enterprise/analytics', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-1',
        metricType: 'USER_ENGAGEMENT',
        metricCategory: 'active_users',
        value: 1200,
        aggregationPeriod: 'DAILY',
      }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.recordsInserted).toBe(1);
  });

  it('POST returns 400 for validation error', async () => {
    const req = new NextRequest('http://localhost:3000/api/enterprise/analytics', {
      method: 'POST',
      body: JSON.stringify({
        metricType: 'INVALID',
        metricCategory: 'x',
        value: 1,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
