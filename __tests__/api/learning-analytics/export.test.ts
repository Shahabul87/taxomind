jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/lib/api', () => ({
  withAuth: (handler: unknown) => handler,
  ApiError: class ApiError extends Error {
    code: string;
    statusCode: number;
    constructor(code: string, message: string, statusCode = 500) {
      super(message);
      this.code = code;
      this.statusCode = statusCode;
    }
  },
}));

import { GET } from '@/app/api/learning-analytics/export/route';
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
const userExamAttempt = ensureModel('userExamAttempt', ['findMany']);
const userProgress = ensureModel('user_progress', ['findMany']);

describe('/api/learning-analytics/export route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    purchase.findMany.mockResolvedValue([]);
    userExamAttempt.findMany.mockResolvedValue([]);
    userProgress.findMany.mockResolvedValue([]);
  });

  it('returns JSON export by default', async () => {
    const req = new NextRequest('http://localhost:3000/api/learning-analytics/export');
    const res = await GET(req, { user: { id: 'user-1' } } as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/json');
    expect(body.summary.totalCourses).toBe(0);
    expect(body.activities).toEqual([]);
  });

  it('returns CSV export when format=csv is requested', async () => {
    const req = new NextRequest('http://localhost:3000/api/learning-analytics/export?format=csv&timeframe=week');
    const res = await GET(req, { user: { id: 'user-1' } } as never);
    const csv = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/csv');
    expect(csv).toContain('=== Course Progress ===');
    expect(csv).toContain('=== Learning Activity ===');
  });
});
