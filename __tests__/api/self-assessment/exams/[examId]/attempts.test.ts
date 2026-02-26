jest.mock('uuid', () => ({
  v4: jest.fn(() => 'attempt-uuid-1'),
}));

import { GET, POST } from '@/app/api/self-assessment/exams/[examId]/attempts/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

describe('api/self-assessment/exams/[examId]/attempts route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await GET(new Request('http://localhost') as never, {
      params: Promise.resolve({ examId: 'exam-1' }),
    });
    expect(res.status).toBe(401);
  });

  it('GET returns mapped attempts list', async () => {
    (db.selfAssessmentAttempt.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'att-1',
        attemptNumber: 1,
        status: 'IN_PROGRESS',
        startedAt: new Date('2026-01-01T00:00:00.000Z'),
        submittedAt: null,
        timeSpent: 120,
        totalQuestions: 10,
        correctAnswers: 0,
        scorePercentage: null,
        isPassed: null,
        _count: { answers: 2 },
        exam: { title: 'Exam 1', passingScore: 70, timeLimit: 30 },
      },
    ]);

    const res = await GET(new Request('http://localhost') as never, {
      params: Promise.resolve({ examId: 'exam-1' }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.total).toBe(1);
    expect(body.attempts[0].examTitle).toBe('Exam 1');
  });

  it('POST returns 404 when exam is not found', async () => {
    (db.selfAssessmentExam.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(new Request('http://localhost', { method: 'POST' }) as never, {
      params: Promise.resolve({ examId: 'missing' }),
    });
    expect(res.status).toBe(404);
  });
});
