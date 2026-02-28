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
  ApiError: class ApiError extends Error {
    statusCode: number;
    constructor(message: string, statusCode = 500) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));

import { POST } from '@/app/api/teacher-analytics/student-profile/route';
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
const user = ensureModel('user', ['findUnique']);

describe('/api/teacher-analytics/student-profile route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    course.findUnique.mockResolvedValue({ id: 'course-1', title: 'Algorithms' });
    user.findUnique.mockResolvedValue({
      id: 'student-1',
      name: 'Student One',
      email: 'student@test.com',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
  });

  it('returns 400 for invalid request body', async () => {
    const req = new NextRequest('http://localhost:3000/api/teacher-analytics/student-profile', {
      method: 'POST',
      body: JSON.stringify({ courseId: 'course-1' }),
    });

    const res = await POST(req, { user: { id: 'teacher-1' } } as never);
    expect(res.status).toBe(400);
  });

  it('returns 404 when teacher does not own course', async () => {
    course.findUnique.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/teacher-analytics/student-profile', {
      method: 'POST',
      body: JSON.stringify({ courseId: 'course-1', studentId: 'student-1', timeframe: 'month' }),
    });

    const res = await POST(req, { user: { id: 'teacher-1' } } as never);
    expect(res.status).toBe(404);
  });

  it('returns 404 when target student is missing', async () => {
    user.findUnique.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/teacher-analytics/student-profile', {
      method: 'POST',
      body: JSON.stringify({ courseId: 'course-1', studentId: 'student-1', timeframe: 'month' }),
    });

    const res = await POST(req, { user: { id: 'teacher-1' } } as never);
    expect(res.status).toBe(404);
  });
});
