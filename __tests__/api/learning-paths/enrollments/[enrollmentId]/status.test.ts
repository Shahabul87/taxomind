jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { PATCH } from '@/app/api/learning-paths/enrollments/[enrollmentId]/status/route';
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

const learningPathEnrollment = ensureModel('learningPathEnrollment', ['findFirst', 'update']);

describe('/api/learning-paths/enrollments/[enrollmentId]/status route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    learningPathEnrollment.findFirst.mockResolvedValue({ id: 'e1', userId: 'user-1' });
    learningPathEnrollment.update.mockResolvedValue({ id: 'e1', status: 'ACTIVE' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/learning-paths/enrollments/e1/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ enrollmentId: 'e1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid status value', async () => {
    const req = new NextRequest('http://localhost:3000/api/learning-paths/enrollments/e1/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'INVALID' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ enrollmentId: 'e1' }) });
    expect(res.status).toBe(400);
  });

  it('updates enrollment status for owner', async () => {
    const req = new NextRequest('http://localhost:3000/api/learning-paths/enrollments/e1/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ enrollmentId: 'e1' }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
