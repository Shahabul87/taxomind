jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '@/app/api/self-assessment/exams/[examId]/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;
const mockDb = db as Record<string, any>;

const params = { params: Promise.resolve({ examId: 'exam-1' }) };

function makeExam(overrides: Record<string, unknown> = {}) {
  return {
    id: 'exam-1',
    userId: 'user-1',
    title: 'Exam One',
    description: 'desc',
    instructions: 'instructions',
    courseId: null,
    status: 'DRAFT',
    timeLimit: 45,
    passingScore: 70,
    shuffleQuestions: false,
    showResults: true,
    allowRetakes: true,
    maxAttempts: 3,
    generatedByAI: true,
    targetBloomsDistribution: {},
    actualBloomsDistribution: {},
    totalPoints: 10,
    avgScore: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    publishedAt: null,
    questions: [],
    attempts: [],
    _count: {
      questions: 1,
      attempts: 0,
    },
    ...overrides,
  };
}

describe('GET/PUT/DELETE /api/self-assessment/exams/[examId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockDb.selfAssessmentExam = {
      findUnique: jest.fn().mockResolvedValue(makeExam()),
      update: jest.fn().mockResolvedValue(makeExam({ status: 'PUBLISHED' })),
      delete: jest.fn().mockResolvedValue({ id: 'exam-1' }),
    };
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await GET(new NextRequest('http://localhost:3000/api/x'), params);
    expect(res.status).toBe(401);
  });

  it('GET returns exam details for owner', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/x'), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.exam.id).toBe('exam-1');
  });

  it('PUT returns 400 for invalid payload', async () => {
    const res = await PUT(
      new NextRequest('http://localhost:3000/api/x', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'x' }),
      }),
      params
    );

    expect(res.status).toBe(400);
  });

  it('PUT returns 404 when exam does not exist', async () => {
    mockDb.selfAssessmentExam.findUnique.mockResolvedValueOnce(null);

    const res = await PUT(
      new NextRequest('http://localhost:3000/api/x', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'Valid title' }),
      }),
      params
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Exam not found');
  });

  it('DELETE deletes exam for owner', async () => {
    const res = await DELETE(new NextRequest('http://localhost:3000/api/x'), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockDb.selfAssessmentExam.delete).toHaveBeenCalledWith({
      where: { id: 'exam-1' },
    });
  });
});
