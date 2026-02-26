/**
 * Tests for Self-Assessment Attempts Route - app/api/self-assessment/exams/[examId]/attempts/route.ts
 */

import { GET, POST } from '@/app/api/self-assessment/exams/[examId]/attempts/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

function props(examId = 'exam-1') {
  return { params: Promise.resolve({ examId }) };
}

describe('Self-Assessment Attempts Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(new Request('http://localhost') as never, props());
    expect(res.status).toBe(401);
  });

  it('GET returns mapped attempts', async () => {
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

    const res = await GET(new Request('http://localhost') as never, props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.total).toBe(1);
    expect(body.attempts[0].examTitle).toBe('Exam 1');
  });

  it('POST returns 404 when exam does not exist', async () => {
    (db.selfAssessmentExam.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(new Request('http://localhost', { method: 'POST' }) as never, props());
    expect(res.status).toBe(404);
  });

  it('POST blocks retakes when not allowed', async () => {
    (db.selfAssessmentExam.findUnique as jest.Mock).mockResolvedValue({
      id: 'exam-1',
      userId: 'owner-1',
      status: 'PUBLISHED',
      allowRetakes: false,
      maxAttempts: null,
      shuffleQuestions: false,
      totalPoints: 20,
      passingScore: 70,
      timeLimit: 30,
      title: 'Exam 1',
      description: 'Desc',
      instructions: 'Do your best',
      showResults: true,
      questions: [{ id: 'q-1' }],
      _count: { attempts: 1 },
    });
    (db.selfAssessmentAttempt.count as jest.Mock).mockResolvedValue(1);

    const res = await POST(new Request('http://localhost', { method: 'POST' }) as never, props());
    expect(res.status).toBe(400);
  });

  it('POST resumes in-progress attempt', async () => {
    (db.selfAssessmentExam.findUnique as jest.Mock).mockResolvedValue({
      id: 'exam-1',
      userId: 'owner-1',
      status: 'PUBLISHED',
      allowRetakes: true,
      maxAttempts: 3,
      shuffleQuestions: false,
      totalPoints: 20,
      passingScore: 70,
      timeLimit: 30,
      title: 'Exam 1',
      description: 'Desc',
      instructions: 'Do your best',
      showResults: true,
      questions: [{ id: 'q-1', order: 1 }],
      _count: { attempts: 1 },
    });
    (db.selfAssessmentAttempt.count as jest.Mock).mockResolvedValue(1);
    (db.selfAssessmentAttempt.findFirst as jest.Mock).mockResolvedValue({
      id: 'att-existing',
      attemptNumber: 2,
      status: 'IN_PROGRESS',
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
      timeSpent: 60,
      answers: [{ questionId: 'q-1', answer: 'A' }],
    });

    const res = await POST(new Request('http://localhost', { method: 'POST' }) as never, props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toContain('Resuming existing attempt');
    expect(body.attempt.id).toBe('att-existing');
  });

  it('POST creates a new attempt when none in progress', async () => {
    (db.selfAssessmentExam.findUnique as jest.Mock).mockResolvedValue({
      id: 'exam-1',
      userId: 'owner-1',
      status: 'PUBLISHED',
      allowRetakes: true,
      maxAttempts: 3,
      shuffleQuestions: false,
      totalPoints: 20,
      passingScore: 70,
      timeLimit: 30,
      title: 'Exam 1',
      description: 'Desc',
      instructions: 'Do your best',
      showResults: true,
      questions: [{ id: 'q-1', order: 1 }],
      _count: { attempts: 0 },
    });
    (db.selfAssessmentAttempt.count as jest.Mock).mockResolvedValue(0);
    (db.selfAssessmentAttempt.findFirst as jest.Mock).mockResolvedValue(null);
    (db.selfAssessmentAttempt.create as jest.Mock).mockResolvedValue({
      id: 'att-new',
      attemptNumber: 1,
      status: 'IN_PROGRESS',
      startedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const res = await POST(new Request('http://localhost', { method: 'POST' }) as never, props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toContain('New attempt started');
    expect(body.attempt.id).toBe('att-new');
  });
});
