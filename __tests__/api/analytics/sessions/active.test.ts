jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

import { GET } from '@/app/api/analytics/sessions/active/route';
import { currentUser } from '@/lib/auth';
import { adminAuth } from '@/auth.admin';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockAdminAuth = adminAuth as jest.Mock;

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

const userExamAttempt = ensureModel('userExamAttempt', ['findMany']);

describe('GET /api/analytics/sessions/active', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    // Mock as admin to avoid course ownership filter
    mockAdminAuth.mockResolvedValue({ user: { id: 'user-1' } });
    userExamAttempt.findMany.mockResolvedValue([
      { id: 'a1', userId: 'u1', examId: 'exam-1' },
      { id: 'a2', userId: 'u2', examId: 'exam-1' },
      { id: 'a3', userId: 'u2', examId: 'exam-1' },
      { id: 'a4', userId: 'u3', examId: 'exam-2' },
    ]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/analytics/sessions/active');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns active sessions grouped by exam with unique student counts', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/sessions/active');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.count).toBe(4);
    expect(body.exams).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ examId: 'exam-1', count: 3, uniqueStudents: 2 }),
        expect.objectContaining({ examId: 'exam-2', count: 1, uniqueStudents: 1 }),
      ])
    );
  });

  it('returns 500 on unexpected errors', async () => {
    userExamAttempt.findMany.mockRejectedValueOnce(new Error('db fail'));

    const req = new NextRequest('http://localhost:3000/api/analytics/sessions/active');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to fetch active sessions');
  });
});
