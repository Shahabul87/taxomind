jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/lib/api', () => ({
  withAuth: (handler: unknown) => handler,
  createSuccessResponse: (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  createErrorResponse: (error: { message?: string; statusCode?: number }) =>
    new Response(JSON.stringify({ error: error?.message || 'error' }), {
      status: error?.statusCode || 500,
      headers: { 'Content-Type': 'application/json' },
    }),
  ApiError: class ApiError extends Error {
    statusCode: number;
    constructor(message: string, statusCode = 500) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));

import { POST } from '@/app/api/learning-analytics/personal/route';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

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

const purchase = ensureModel('purchase', ['findMany']);

describe('/api/learning-analytics/personal route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    purchase.findMany.mockResolvedValue([]);
  });

  it('returns 400 for invalid payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/learning-analytics/personal', {
      method: 'POST',
      body: JSON.stringify({ timeframe: 'invalid' }),
    });

    const res = await POST(req, { user: { id: 'user-1' } } as never);
    expect(res.status).toBe(400);
  });

  it('returns empty analytics structure for user with no enrollments', async () => {
    const req = new NextRequest('http://localhost:3000/api/learning-analytics/personal', {
      method: 'POST',
      body: JSON.stringify({ timeframe: 'month' }),
    });

    const res = await POST(req, { user: { id: 'user-1' } } as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.analytics.overview.totalCourses).toBe(0);
    expect(body.analytics.courseProgress).toEqual([]);
  });
});
