/**
 * Tests for Section Exams Route - app/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/exams/route.ts
 */

jest.unmock('zod');

import { GET, POST } from '@/app/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/exams/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).examQuestion) {
  (db as Record<string, unknown>).examQuestion = {
    create: jest.fn(),
  };
}
if (!(db as Record<string, unknown>).enhancedQuestion) {
  (db as Record<string, unknown>).enhancedQuestion = {
    create: jest.fn(),
  };
}

const mockExamQuestionCreate = db.examQuestion.create as jest.Mock;
const mockEnhancedQuestionCreate = db.enhancedQuestion.create as jest.Mock;

function props(courseId = 'course-1', chapterId = 'chapter-1', sectionId = 'section-1') {
  return { params: Promise.resolve({ courseId, chapterId, sectionId }) };
}

function postRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/courses/course-1/chapters/chapter-1/sections/section-1/exams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function validPayload() {
  return {
    title: 'Section Exam',
    description: 'Checks key concepts',
    passingScore: 70,
    totalPoints: 10,
    questions: [
      {
        id: 'q-1',
        type: 'multiple-choice',
        difficulty: 'easy',
        question: 'What is TypeScript?',
        options: ['A superset of JS', 'A database'],
        correctAnswer: 'A superset of JS',
        points: 10,
        explanation: 'TS extends JavaScript.',
      },
    ],
  };
}

describe('Section Exams Route', () => {
  beforeAll(() => {
    if (typeof globalThis.crypto?.randomUUID !== 'function') {
      const nodeCrypto = require('crypto');
      Object.defineProperty(globalThis.crypto, 'randomUUID', {
        value: () => nodeCrypto.randomUUID(),
        configurable: true,
        writable: true,
      });
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.section.findUnique as jest.Mock).mockResolvedValue({
      id: 'section-1',
      chapter: { course: { userId: 'user-1' } },
    });
    (db.$transaction as jest.Mock).mockImplementation(async (fn: (tx: typeof db) => unknown) => fn(db));
    (db.exam.create as jest.Mock).mockResolvedValue({ id: 'exam-1', title: 'Section Exam' });
    mockExamQuestionCreate.mockResolvedValue({ id: 'eq-1', points: 10 });
    mockEnhancedQuestionCreate.mockResolvedValue({ id: 'enh-1' });
    (db.exam.findMany as jest.Mock).mockResolvedValue([]);
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(postRequest(validPayload()) as never, props());
    expect(res.status).toBe(401);
  });

  it('POST returns 400 for invalid payload', async () => {
    const res = await POST(postRequest({ title: '', totalPoints: 0, questions: [] }) as never, props());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid request format');
  });

  it('POST returns 404 for non-owned section', async () => {
    (db.section.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(postRequest(validPayload()) as never, props());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('Section not found');
  });

  it('POST creates exam successfully', async () => {
    const res = await POST(postRequest(validPayload()) as never, props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.exam.id).toBe('exam-1');
    expect(db.exam.create).toHaveBeenCalled();
    expect(mockExamQuestionCreate).toHaveBeenCalled();
  });

  it('GET returns exams for owned section', async () => {
    (db.exam.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'exam-1',
        title: 'Exam 1',
        createdAt: new Date(),
        ExamQuestion: [{ id: 'q-1', points: 4 }, { id: 'q-2', points: 6 }],
        enhancedQuestions: [],
        _count: { UserExamAttempt: 1 },
      },
    ]);

    const res = await GET(new Request('http://localhost') as never, props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.exams[0].totalPoints).toBe(10);
    expect(body.exams[0]._count.userAttempts).toBe(1);
  });
});
