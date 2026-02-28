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

import { POST } from '@/app/api/teacher-analytics/course-overview/route';
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

const course = ensureModel('course', ['findUnique']);

describe('/api/teacher-analytics/course-overview route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    course.findUnique.mockResolvedValue({ id: 'course-1', title: 'Algorithms' });
  });

  it('returns 400 for invalid request payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/teacher-analytics/course-overview', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req, { user: { id: 'teacher-1' } } as never);
    expect(res.status).toBe(400);
  });

  it('returns 404 when teacher does not own the course', async () => {
    course.findUnique.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/teacher-analytics/course-overview', {
      method: 'POST',
      body: JSON.stringify({
        courseId: 'course-1',
        timeframe: 'month',
        includeDetailed: false,
        page: 1,
        pageSize: 50,
      }),
    });

    const res = await POST(req, { user: { id: 'teacher-1' } } as never);
    expect(res.status).toBe(404);
  });
});
