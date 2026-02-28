jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/self-assessment/exams/[examId]/questions/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;
const mockDb = db as Record<string, any>;

const params = { params: Promise.resolve({ examId: 'exam-1' }) };

describe('GET/POST /api/self-assessment/exams/[examId]/questions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockDb.selfAssessmentExam = {
      findUnique: jest.fn().mockResolvedValue({
        id: 'exam-1',
        userId: 'user-1',
        status: 'DRAFT',
        showResults: true,
      }),
      update: jest.fn().mockResolvedValue({ id: 'exam-1' }),
    };
    mockDb.selfAssessmentQuestion = {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'q1',
          question: 'What is JavaScript?',
          questionType: 'SHORT_ANSWER',
          options: null,
          correctAnswer: 'language',
          acceptableVariations: [],
          points: 2,
          bloomsLevel: 'UNDERSTAND',
          difficulty: 'EASY',
          hint: null,
          explanation: null,
          order: 0,
          tags: [],
          estimatedTime: null,
          rubric: null,
          totalAttempts: 0,
          correctAttempts: 0,
          avgTimeSpent: null,
        },
      ]),
      aggregate: jest.fn().mockResolvedValue({
        _max: { order: 0 },
        _sum: { points: 2 },
      }),
      create: jest.fn().mockResolvedValue({
        id: 'q2',
        question: '2+2',
        questionType: 'MULTIPLE_CHOICE',
        order: 1,
      }),
      count: jest.fn().mockResolvedValue(2),
      groupBy: jest.fn().mockResolvedValue([{ bloomsLevel: 'REMEMBER', _count: 2 }]),
    };
    mockDb.$transaction = jest.fn().mockImplementation(async (ops: Promise<unknown>[]) => Promise.all(ops));
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await GET(new NextRequest('http://localhost:3000/api/x'), params);
    expect(res.status).toBe(401);
  });

  it('GET returns 404 when exam not found', async () => {
    mockDb.selfAssessmentExam.findUnique.mockResolvedValueOnce(null);

    const res = await GET(new NextRequest('http://localhost:3000/api/x'), params);
    expect(res.status).toBe(404);
  });

  it('POST blocks archived exams', async () => {
    mockDb.selfAssessmentExam.findUnique.mockResolvedValueOnce({
      id: 'exam-1',
      userId: 'user-1',
      status: 'ARCHIVED',
    });

    const res = await POST(
      new NextRequest('http://localhost:3000/api/x', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          question: 'What is JS?',
          questionType: 'SHORT_ANSWER',
          correctAnswer: 'A language',
          points: 1,
          bloomsLevel: 'REMEMBER',
          difficulty: 'EASY',
        }),
      }),
      params
    );

    expect(res.status).toBe(400);
  });

  it('POST returns 400 when payload fails validation', async () => {
    const res = await POST(
      new NextRequest('http://localhost:3000/api/x', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          question: 'Too short',
          questionType: 'SHORT_ANSWER',
          correctAnswer: '',
          points: 2,
          bloomsLevel: 'UNDERSTAND',
          difficulty: 'EASY',
        }),
      }),
      params
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });
});
