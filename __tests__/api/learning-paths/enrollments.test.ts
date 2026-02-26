jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { GET } from '@/app/api/learning-paths/enrollments/route';
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

const learningPathEnrollment = ensureModel('learningPathEnrollment', ['findMany']);

describe('/api/learning-paths/enrollments route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    learningPathEnrollment.findMany.mockResolvedValue([{ id: 'e1', userId: 'user-1' }]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/learning-paths/enrollments');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns enrollment list for user', async () => {
    const req = new NextRequest('http://localhost:3000/api/learning-paths/enrollments');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.enrollments)).toBe(true);
  });
});
