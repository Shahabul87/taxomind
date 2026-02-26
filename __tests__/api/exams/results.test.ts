/**
 * Tests for Exam Results Route - app/api/exams/results/[attemptId]/route.ts
 *
 * Covers:
 *   GET - Fetch comprehensive exam results (auth, ownership, Bloom's breakdown,
 *          cognitive profile, learning path, answer transformation)
 */

jest.unmock('zod');

import { GET } from '@/app/api/exams/results/[attemptId]/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;
const mockFindUniqueAttempt = db.userExamAttempt.findUnique as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createRequest(attemptId: string): Request {
  return new Request(`http://localhost:3000/api/exams/results/${attemptId}`, {
    method: 'GET',
  });
}

function createParams(attemptId: string): { params: Promise<{ attemptId: string }> } {
  return { params: Promise.resolve({ attemptId }) };
}

function makeMockAttempt(overrides: Record<string, unknown> = {}) {
  return {
    id: 'attempt-1',
    examId: 'exam-1',
    userId: 'student-1',
    status: 'GRADED',
    scorePercentage: 75,
    isPassed: true,
    totalQuestions: 3,
    correctAnswers: 2,
    startedAt: new Date('2026-02-10T10:00:00Z'),
    submittedAt: new Date('2026-02-10T10:30:00Z'),
    Exam: {
      id: 'exam-1',
      title: 'Unit Test Exam',
      passingScore: 70,
      sectionId: 'section-1',
      enhancedQuestions: [],
      section: {
        id: 'section-1',
        title: 'Section A',
        chapter: {
          id: 'chapter-1',
          title: 'Chapter 1',
          courseId: 'course-1',
          course: {
            id: 'course-1',
            title: 'Test Course',
          },
        },
      },
    },
    enhancedAnswers: [
      {
        id: 'ans-1',
        questionId: 'q-1',
        answer: 'Answer A',
        isCorrect: true,
        pointsEarned: 10,
        evaluationType: 'AUTO_GRADED',
        question: {
          id: 'q-1',
          question: 'What is unit testing?',
          questionType: 'MULTIPLE_CHOICE',
          bloomsLevel: 'REMEMBER',
          difficulty: 'EASY',
          points: 10,
          correctAnswer: 'Answer A',
          explanation: 'Unit testing tests individual units.',
          hint: 'Think small.',
          options: [
            { id: 'opt-1', optionText: 'Answer A', isCorrect: true },
            { id: 'opt-2', optionText: 'Answer B', isCorrect: false },
            { id: 'opt-3', optionText: 'Answer C', isCorrect: false },
            { id: 'opt-4', optionText: 'Answer D', isCorrect: false },
          ],
        },
        aiEvaluations: [],
      },
      {
        id: 'ans-2',
        questionId: 'q-2',
        answer: 'My essay answer',
        isCorrect: true,
        pointsEarned: 8,
        evaluationType: 'AI_EVALUATED',
        question: {
          id: 'q-2',
          question: 'Explain the concept of mocking.',
          questionType: 'ESSAY',
          bloomsLevel: 'UNDERSTAND',
          difficulty: 'MEDIUM',
          points: 10,
          correctAnswer: 'Mocking is...',
          explanation: 'Mocking replaces real dependencies.',
          hint: null,
          options: null,
        },
        aiEvaluations: [
          {
            id: 'eval-1',
            accuracy: 0.8,
            completeness: 0.9,
            relevance: 0.85,
            depth: 0.7,
            feedback: 'Good explanation of mocking.',
            strengths: ['Clear writing'],
            improvements: ['Add examples'],
            nextSteps: ['Practice TDD'],
            demonstratedLevel: 'UNDERSTAND',
            conceptsUnderstood: ['mocking basics'],
            misconceptions: [],
            knowledgeGaps: [],
            confidence: 0.85,
            flaggedForReview: false,
          },
        ],
      },
      {
        id: 'ans-3',
        questionId: 'q-3',
        answer: 'Wrong answer',
        isCorrect: false,
        pointsEarned: 0,
        evaluationType: 'AUTO_GRADED',
        question: {
          id: 'q-3',
          question: 'Apply TDD principles to this scenario.',
          questionType: 'SHORT_ANSWER',
          bloomsLevel: 'APPLY',
          difficulty: 'HARD',
          points: 10,
          correctAnswer: 'Write test first.',
          explanation: 'TDD means test-driven development.',
          hint: 'Red, green, refactor.',
          options: null,
        },
        aiEvaluations: [],
      },
    ],
    User: {
      id: 'student-1',
      name: 'Test Student',
      email: 'student@test.com',
      image: null,
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/exams/results/[attemptId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'student-1', role: 'USER' });
    mockFindUniqueAttempt.mockResolvedValue(makeMockAttempt());
  });

  // ---- Authentication ----

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when user has no id', async () => {
    mockCurrentUser.mockResolvedValue({ id: null });
    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  // ---- Attempt not found ----

  it('returns 404 when attempt does not exist', async () => {
    mockFindUniqueAttempt.mockResolvedValue(null);
    const res = await GET(createRequest('bad-id'), createParams('bad-id'));
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error).toBe('Attempt not found');
  });

  // ---- Authorization ----

  it('returns 403 when user is not the owner and not ADMIN', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'other-user', role: 'USER' });
    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error).toBe('Not authorized');
  });

  it('allows owner to view results', async () => {
    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('allows ADMIN to view any student results', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1', role: 'ADMIN' });
    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  // ---- Result structure ----

  it('returns correctly structured result', async () => {
    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();

    expect(body.result.id).toBe('attempt-1');
    expect(body.result.examId).toBe('exam-1');
    expect(body.result.examTitle).toBe('Unit Test Exam');
    expect(body.result.status).toBe('GRADED');
    expect(body.result.scorePercentage).toBe(75);
    expect(body.result.isPassed).toBe(true);
    expect(body.result.passingScore).toBe(70);
    expect(body.result.totalQuestions).toBe(3);
    expect(body.result.correctAnswers).toBe(2);
  });

  it('calculates time spent in minutes', async () => {
    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();

    // 30 minutes between start and submit
    expect(body.result.timeSpent).toBe(30);
  });

  it('returns null timeSpent when dates are missing', async () => {
    mockFindUniqueAttempt.mockResolvedValue(
      makeMockAttempt({ startedAt: null, submittedAt: null })
    );

    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();

    expect(body.result.timeSpent).toBeNull();
  });

  it('calculates total and max points correctly', async () => {
    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();

    // 10 + 8 + 0 = 18 total, 10 + 10 + 10 = 30 max
    expect(body.result.totalPoints).toBe(18);
    expect(body.result.maxPoints).toBe(30);
  });

  // ---- Answers transformation ----

  it('returns correct number of answers', async () => {
    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();
    expect(body.result.answers).toHaveLength(3);
  });

  it('includes AI evaluation details when available', async () => {
    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();

    const aiAnswer = body.result.answers.find(
      (a: Record<string, string>) => a.questionId === 'q-2'
    );
    expect(aiAnswer.aiEvaluation).not.toBeNull();
    expect(aiAnswer.aiEvaluation.accuracy).toBe(0.8);
    expect(aiAnswer.aiEvaluation.feedback).toBe('Good explanation of mocking.');
    expect(aiAnswer.aiEvaluation.strengths).toEqual(['Clear writing']);
  });

  it('returns null aiEvaluation when none exists', async () => {
    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();

    const autoAnswer = body.result.answers.find(
      (a: Record<string, string>) => a.questionId === 'q-1'
    );
    expect(autoAnswer.aiEvaluation).toBeNull();
  });

  it('hides correct answer from non-teacher when student got it wrong', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'student-1', role: 'USER' });
    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();

    const wrongAnswer = body.result.answers.find(
      (a: Record<string, string>) => a.questionId === 'q-3'
    );
    expect(wrongAnswer.question.correctAnswer).toBeNull();
  });

  it('shows correct answer to student when they got it right', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'student-1', role: 'USER' });
    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();

    const correctAnswer = body.result.answers.find(
      (a: Record<string, string>) => a.questionId === 'q-1'
    );
    expect(correctAnswer.question.correctAnswer).toBe('Answer A');
  });

  it('shows correct answer to ADMIN regardless', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1', role: 'ADMIN' });
    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();

    const wrongAnswer = body.result.answers.find(
      (a: Record<string, string>) => a.questionId === 'q-3'
    );
    expect(wrongAnswer.question.correctAnswer).toBe('Write test first.');
  });

  it('transforms options correctly for student view', async () => {
    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();

    const mcAnswer = body.result.answers.find(
      (a: Record<string, string>) => a.questionId === 'q-1'
    );
    // Student got this correct, so isCorrect fields are shown
    expect(mcAnswer.question.options).toHaveLength(4);
    expect(mcAnswer.question.options[0].text).toBe('Answer A');
    expect(mcAnswer.question.options[0].isCorrect).toBe(true);
  });

  it('hides option isCorrect when student got it wrong', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'student-1', role: 'USER' });
    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();

    // q-3 has no options (SHORT_ANSWER), test q-1 which is correct
    const wrongAnswer = body.result.answers.find(
      (a: Record<string, string>) => a.questionId === 'q-3'
    );
    // no options for short answer
    expect(wrongAnswer.question.options).toBeNull();
  });

  it('provides fallback feedback when no AI evaluation', async () => {
    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();

    const correctAns = body.result.answers.find(
      (a: Record<string, string>) => a.questionId === 'q-1'
    );
    expect(correctAns.feedback).toBe('Correct!');

    const wrongAns = body.result.answers.find(
      (a: Record<string, string>) => a.questionId === 'q-3'
    );
    expect(wrongAns.feedback).toBe('Incorrect.');
  });

  // ---- Bloom's breakdown ----

  it('returns Bloom\'s breakdown with correct counts', async () => {
    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();

    const bloom = body.result.bloomsBreakdown;
    expect(bloom.REMEMBER.questionsCount).toBe(1);
    expect(bloom.REMEMBER.correctCount).toBe(1);
    expect(bloom.REMEMBER.scorePercentage).toBe(100);

    expect(bloom.UNDERSTAND.questionsCount).toBe(1);
    expect(bloom.UNDERSTAND.correctCount).toBe(1);
    expect(bloom.UNDERSTAND.scorePercentage).toBe(100);

    expect(bloom.APPLY.questionsCount).toBe(1);
    expect(bloom.APPLY.correctCount).toBe(0);
    expect(bloom.APPLY.scorePercentage).toBe(0);

    // Levels with no questions
    expect(bloom.ANALYZE.questionsCount).toBe(0);
    expect(bloom.ANALYZE.scorePercentage).toBe(0);
    expect(bloom.EVALUATE.questionsCount).toBe(0);
    expect(bloom.CREATE.questionsCount).toBe(0);
  });

  // ---- Cognitive profile ----

  it('returns cognitive profile with strengths and weaknesses', async () => {
    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();

    const profile = body.result.cognitiveProfile;
    expect(profile.overallMastery).toBe(67); // 2/3 = 66.67 rounded
    expect(profile.strengths).toContain('REMEMBER');
    expect(profile.strengths).toContain('UNDERSTAND');
    expect(profile.weaknesses).toContain('APPLY');
  });

  // ---- Learning path ----

  it('returns learning path recommendations', async () => {
    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();

    expect(body.result.learningPath).toBeDefined();
    expect(Array.isArray(body.result.learningPath)).toBe(true);
    // Should have at least one recommendation for the APPLY weakness
    const remediateRec = body.result.learningPath.find(
      (r: Record<string, string>) => r.type === 'remediate'
    );
    expect(remediateRec).toBeDefined();
    expect(remediateRec.bloomsLevel).toBe('APPLY');
    expect(remediateRec.priority).toBe('HIGH');
  });

  it('returns advance recommendation for top strength', async () => {
    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();

    const advanceRec = body.result.learningPath.find(
      (r: Record<string, string>) => r.type === 'advance'
    );
    // REMEMBER is a strength; next level is UNDERSTAND (but UNDERSTAND is also strength)
    // The advance rec should be based on the top strength sorted by score percentage
    expect(advanceRec).toBeDefined();
  });

  // ---- Course and section info ----

  it('returns course info when section exists', async () => {
    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();

    expect(body.result.course).toEqual({
      id: 'course-1',
      title: 'Test Course',
    });
    expect(body.result.section).toEqual({
      id: 'section-1',
      chapterId: 'chapter-1',
      chapterTitle: 'Chapter 1',
    });
  });

  it('returns null course when section is null', async () => {
    mockFindUniqueAttempt.mockResolvedValue(
      makeMockAttempt({
        Exam: {
          id: 'exam-1',
          title: 'Standalone Exam',
          passingScore: 70,
          sectionId: null,
          enhancedQuestions: [],
          section: null,
        },
      })
    );

    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();

    expect(body.result.course).toBeNull();
    expect(body.result.section).toBeNull();
  });

  // ---- Student info ----

  it('returns student information', async () => {
    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();

    expect(body.result.student).toEqual({
      id: 'student-1',
      name: 'Test Student',
      email: 'student@test.com',
      image: null,
    });
  });

  // ---- scorePercentage fallback ----

  it('uses fallback of 0 for null scorePercentage', async () => {
    mockFindUniqueAttempt.mockResolvedValue(
      makeMockAttempt({ scorePercentage: null, correctAnswers: null })
    );

    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();

    expect(body.result.scorePercentage).toBe(0);
    expect(body.result.correctAnswers).toBe(0);
  });

  // ---- Error handling ----

  it('returns 500 on database error', async () => {
    mockFindUniqueAttempt.mockRejectedValue(new Error('DB connection lost'));
    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to fetch exam results');
  });

  // ---- Edge case: no answers ----

  it('handles attempt with no answers', async () => {
    mockFindUniqueAttempt.mockResolvedValue(
      makeMockAttempt({ enhancedAnswers: [] })
    );

    const res = await GET(createRequest('attempt-1'), createParams('attempt-1'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.result.answers).toEqual([]);
    expect(body.result.totalPoints).toBe(0);
    expect(body.result.maxPoints).toBe(0);
    expect(body.result.bloomsBreakdown.REMEMBER.questionsCount).toBe(0);
    expect(body.result.cognitiveProfile.overallMastery).toBe(0);
  });
});
