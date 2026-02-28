jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { GET, POST } from '@/app/api/learning-paths/[pathId]/enroll/route';
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

const learningPath = ensureModel('learningPath', ['findFirst']);
const learningPathEnrollment = ensureModel('learningPathEnrollment', ['findUnique', 'create']);

function params(pathId = 'path-1') {
  return { params: Promise.resolve({ pathId }) };
}

describe('/api/learning-paths/[pathId]/enroll route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    learningPath.findFirst.mockResolvedValue({
      id: 'path-1',
      isPublished: true,
      courses: [],
    });
    learningPathEnrollment.findUnique.mockResolvedValue(null);
    learningPathEnrollment.create.mockResolvedValue({
      id: 'enroll-1',
      userId: 'user-1',
      learningPathId: 'path-1',
      status: 'ACTIVE',
    });
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/learning-paths/path-1/enroll', {
      method: 'POST',
    });
    const res = await POST(req, params());

    expect(res.status).toBe(401);
  });

  it('POST returns 404 when learning path does not exist', async () => {
    learningPath.findFirst.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/learning-paths/path-1/enroll', {
      method: 'POST',
    });
    const res = await POST(req, params());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Learning path not found');
  });

  it('POST returns 400 when user is already enrolled', async () => {
    learningPathEnrollment.findUnique.mockResolvedValueOnce({ id: 'enroll-existing' });
    const req = new NextRequest('http://localhost:3000/api/learning-paths/path-1/enroll', {
      method: 'POST',
    });

    const res = await POST(req, params());
    expect(res.status).toBe(400);
  });

  it('POST creates enrollment for authenticated user', async () => {
    const req = new NextRequest('http://localhost:3000/api/learning-paths/path-1/enroll', {
      method: 'POST',
    });
    const res = await POST(req, params());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.enrollment.id).toBe('enroll-1');
    expect(learningPathEnrollment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          learningPathId: 'path-1',
          status: 'ACTIVE',
        }),
      })
    );
  });

  it('GET returns enrollment state for current user', async () => {
    learningPathEnrollment.findUnique.mockResolvedValueOnce({
      id: 'enroll-1',
      userId: 'user-1',
      learningPathId: 'path-1',
      status: 'ACTIVE',
    });

    const req = new NextRequest('http://localhost:3000/api/learning-paths/path-1/enroll', {
      method: 'GET',
    });
    const res = await GET(req, params());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.enrollment.status).toBe('ACTIVE');
    expect(learningPathEnrollment.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_learningPathId: {
            userId: 'user-1',
            learningPathId: 'path-1',
          },
        },
      })
    );
  });
});
