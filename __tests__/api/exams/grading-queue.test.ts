/**
 * Tests for Grading Queue Route - app/api/exams/grading-queue/route.ts
 *
 * Covers:
 *   GET  - Fetch teacher grading queue (auth, role, pagination, filtering, transformation)
 *   PATCH - Update a single answer grade (teacher override, score recalculation)
 *   POST  - Bulk approve AI grades
 */

jest.unmock('zod');

import { GET, PATCH, POST } from '@/app/api/exams/grading-queue/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;
const mockFindMany = db.userExamAttempt.findMany as jest.Mock;
const mockCount = db.userExamAttempt.count as jest.Mock;
const mockFindUniqueAnswer = db.enhancedAnswer.findUnique as jest.Mock;
const mockUpdateAnswer = db.enhancedAnswer.update as jest.Mock;
const mockUpdateManyAnswer = db.enhancedAnswer.updateMany as jest.Mock;
const mockFindUniqueAttempt = db.userExamAttempt.findUnique as jest.Mock;
const mockUpdateAttempt = db.userExamAttempt.update as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createGetRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost:3000/api/exams/grading-queue');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new Request(url.toString(), { method: 'GET' });
}

function createPatchRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3000/api/exams/grading-queue', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function createPostRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3000/api/exams/grading-queue', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeMockAttemptForQueue(overrides: Record<string, unknown> = {}) {
  return {
    id: 'attempt-1',
    userId: 'student-1',
    examId: 'exam-1',
    status: 'GRADED',
    submittedAt: new Date('2026-02-10T14:00:00Z'),
    User: {
      id: 'student-1',
      name: 'Test Student',
      email: 'student@test.com',
      image: null,
    },
    Exam: {
      id: 'exam-1',
      title: 'Unit Test Exam',
      section: {
        id: 'section-1',
        title: 'Section A',
        chapter: {
          id: 'chapter-1',
          title: 'Chapter 1',
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
        evaluationType: 'AI_EVALUATED',
        pointsEarned: 8,
        isCorrect: true,
        question: { id: 'q-1', points: 10 },
        aiEvaluations: [{ id: 'eval-1', flaggedForReview: false }],
      },
      {
        id: 'ans-2',
        evaluationType: 'AI_EVALUATED',
        pointsEarned: 5,
        isCorrect: false,
        question: { id: 'q-2', points: 10 },
        aiEvaluations: [{ id: 'eval-2', flaggedForReview: true }],
      },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// GET /api/exams/grading-queue
// ---------------------------------------------------------------------------

describe('GET /api/exams/grading-queue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1', role: 'ADMIN', name: 'Teacher' });
    mockFindMany.mockResolvedValue([makeMockAttemptForQueue()]);
    mockCount.mockResolvedValue(1);
  });

  // ---- Authentication & Authorization ----

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const res = await GET(createGetRequest());
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when user has no id', async () => {
    mockCurrentUser.mockResolvedValue({ id: null, role: 'ADMIN' });
    const res = await GET(createGetRequest());
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 403 when user is not ADMIN', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1', role: 'USER' });
    const res = await GET(createGetRequest());
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error).toBe('Only teachers can access the grading queue');
  });

  // ---- Success cases ----

  it('returns grading queue with default pagination', async () => {
    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.queue).toHaveLength(1);
    expect(body.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
  });

  it('transforms attempt data into grading queue item format', async () => {
    const res = await GET(createGetRequest());
    const body = await res.json();

    const item = body.queue[0];
    expect(item.attemptId).toBe('attempt-1');
    expect(item.studentId).toBe('student-1');
    expect(item.studentName).toBe('Test Student');
    expect(item.studentEmail).toBe('student@test.com');
    expect(item.examId).toBe('exam-1');
    expect(item.examTitle).toBe('Unit Test Exam');
    expect(item.courseId).toBe('course-1');
    expect(item.courseName).toBe('Test Course');
    expect(item.chapterName).toBe('Chapter 1');
    expect(item.sectionName).toBe('Section A');
    expect(item.questionsToReview).toBe(2);
    expect(item.flaggedForReview).toBe(1);
    expect(item.status).toBe('needs_review');
  });

  it('calculates autoScore correctly', async () => {
    const res = await GET(createGetRequest());
    const body = await res.json();

    // 8+5=13 out of 10+10=20 = 65%
    expect(body.queue[0].autoScore).toBe(65);
  });

  it('sets status to pending when no answers are flagged', async () => {
    mockFindMany.mockResolvedValue([
      makeMockAttemptForQueue({
        enhancedAnswers: [
          {
            id: 'ans-1',
            evaluationType: 'AI_EVALUATED',
            pointsEarned: 10,
            isCorrect: true,
            question: { id: 'q-1', points: 10 },
            aiEvaluations: [{ id: 'eval-1', flaggedForReview: false }],
          },
        ],
      }),
    ]);

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(body.queue[0].flaggedForReview).toBe(0);
    expect(body.queue[0].status).toBe('pending');
  });

  it('handles autoScore of 0 when totalMaxScore is 0', async () => {
    mockFindMany.mockResolvedValue([
      makeMockAttemptForQueue({
        enhancedAnswers: [
          {
            id: 'ans-1',
            evaluationType: 'AI_EVALUATED',
            pointsEarned: 0,
            isCorrect: false,
            question: { id: 'q-1', points: 0 },
            aiEvaluations: [],
          },
        ],
      }),
    ]);

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(body.queue[0].autoScore).toBe(0);
  });

  it('handles student with no name gracefully', async () => {
    mockFindMany.mockResolvedValue([
      makeMockAttemptForQueue({
        User: { id: 'student-1', name: null, email: 'anon@test.com', image: null },
      }),
    ]);

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(body.queue[0].studentName).toBe('Unknown Student');
  });

  // ---- Pagination ----

  it('respects custom page and limit', async () => {
    await GET(createGetRequest({ page: '2', limit: '5' }));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
      })
    );
  });

  it('returns correct totalPages calculation', async () => {
    mockCount.mockResolvedValue(45);

    const res = await GET(createGetRequest({ limit: '20' }));
    const body = await res.json();

    expect(body.pagination.totalPages).toBe(3);
  });

  // ---- Filtering ----

  it('filters by courseId when provided', async () => {
    await GET(createGetRequest({ courseId: 'course-abc' }));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          Exam: {
            section: {
              chapter: {
                courseId: 'course-abc',
              },
            },
          },
        }),
      })
    );
  });

  it('does not add Exam filter when courseId is not provided', async () => {
    await GET(createGetRequest());

    const callArgs = mockFindMany.mock.calls[0][0];
    expect(callArgs.where.Exam).toBeUndefined();
  });

  // ---- Error handling ----

  it('returns 500 on database error', async () => {
    mockFindMany.mockRejectedValue(new Error('DB error'));

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to fetch grading queue');
  });

  it('returns 500 when count fails', async () => {
    mockCount.mockRejectedValue(new Error('Count failed'));

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to fetch grading queue');
  });

  // ---- Empty queue ----

  it('returns empty queue when no attempts need review', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.queue).toEqual([]);
    expect(body.pagination.total).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/exams/grading-queue (Update single grade)
// ---------------------------------------------------------------------------

describe('PATCH /api/exams/grading-queue', () => {
  const validBody = {
    answerId: 'ans-1',
    newScore: 7,
    reason: 'Partial credit for effort',
    feedback: 'Good try',
  };

  const mockAnswer = {
    id: 'ans-1',
    attemptId: 'attempt-1',
    pointsEarned: 5,
    evaluationType: 'AI_EVALUATED',
    question: { id: 'q-1', points: 10 },
    aiEvaluations: [{ id: 'eval-1' }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1', role: 'ADMIN' });
    mockFindUniqueAnswer.mockResolvedValue(mockAnswer);
    mockUpdateAnswer.mockResolvedValue({ id: 'ans-1', ...validBody });
    mockFindUniqueAttempt.mockResolvedValue({
      id: 'attempt-1',
      enhancedAnswers: [
        { id: 'ans-1', pointsEarned: 7, isCorrect: true, question: { points: 10 } },
        { id: 'ans-2', pointsEarned: 8, isCorrect: true, question: { points: 10 } },
      ],
      Exam: { passingScore: 70 },
    });
    mockUpdateAttempt.mockResolvedValue({ id: 'attempt-1' });
  });

  // ---- Authentication & Authorization ----

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const res = await PATCH(createPatchRequest(validBody));
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 403 when user is not ADMIN', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1', role: 'USER' });
    const res = await PATCH(createPatchRequest(validBody));
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error).toBe('Only teachers can update grades');
  });

  // ---- Validation ----

  it('returns 400 for missing answerId', async () => {
    const res = await PATCH(createPatchRequest({ newScore: 5, reason: 'test' }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  it('returns 400 for missing reason', async () => {
    const res = await PATCH(createPatchRequest({ answerId: 'ans-1', newScore: 5 }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  it('returns 400 for negative score', async () => {
    const res = await PATCH(createPatchRequest({ answerId: 'ans-1', newScore: -1, reason: 'test' }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  it('returns 400 for empty answerId', async () => {
    const res = await PATCH(createPatchRequest({ answerId: '', newScore: 5, reason: 'test' }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  it('returns 400 for empty reason', async () => {
    const res = await PATCH(createPatchRequest({ answerId: 'ans-1', newScore: 5, reason: '' }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  // ---- Answer not found ----

  it('returns 404 when answer does not exist', async () => {
    mockFindUniqueAnswer.mockResolvedValue(null);
    const res = await PATCH(createPatchRequest(validBody));
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error).toBe('Answer not found');
  });

  // ---- Score exceeds max ----

  it('returns 400 when newScore exceeds question max points', async () => {
    mockFindUniqueAnswer.mockResolvedValue({
      ...mockAnswer,
      question: { id: 'q-1', points: 5 },
    });

    const res = await PATCH(createPatchRequest({ answerId: 'ans-1', newScore: 7, reason: 'override' }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('Score cannot exceed maximum points');
  });

  // ---- Successful grade update ----

  it('updates answer with new score and teacher graded type', async () => {
    const res = await PATCH(createPatchRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Grade updated successfully');
    expect(body.answer.newScore).toBe(7);
    expect(body.answer.originalScore).toBe(5);
    expect(body.answer.evaluationType).toBe('TEACHER_GRADED');

    expect(mockUpdateAnswer).toHaveBeenCalledWith({
      where: { id: 'ans-1' },
      data: expect.objectContaining({
        pointsEarned: 7,
        evaluationType: 'TEACHER_GRADED',
      }),
    });
  });

  it('recalculates attempt score after grade update', async () => {
    await PATCH(createPatchRequest(validBody));

    expect(mockFindUniqueAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'attempt-1' },
      })
    );
    expect(mockUpdateAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'attempt-1' },
        data: expect.objectContaining({
          scorePercentage: 75, // (7+8)/(10+10) * 100
          isPassed: true,      // 75 >= 70
        }),
      })
    );
  });

  it('sets isPassed false when recalculated score is below passing', async () => {
    mockFindUniqueAttempt.mockResolvedValue({
      id: 'attempt-1',
      enhancedAnswers: [
        { id: 'ans-1', pointsEarned: 2, isCorrect: false, question: { points: 10 } },
        { id: 'ans-2', pointsEarned: 3, isCorrect: false, question: { points: 10 } },
      ],
      Exam: { passingScore: 70 },
    });

    await PATCH(createPatchRequest(validBody));

    expect(mockUpdateAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isPassed: false,
        }),
      })
    );
  });

  it('handles attempt not found gracefully (no recalculation)', async () => {
    mockFindUniqueAttempt.mockResolvedValue(null);

    const res = await PATCH(createPatchRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    // Should not attempt to update attempt
    expect(mockUpdateAttempt).not.toHaveBeenCalled();
  });

  // ---- Error handling ----

  it('returns 500 on database error during update', async () => {
    mockUpdateAnswer.mockRejectedValue(new Error('DB error'));

    const res = await PATCH(createPatchRequest(validBody));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to update grade');
  });
});

// ---------------------------------------------------------------------------
// POST /api/exams/grading-queue (Bulk approve)
// ---------------------------------------------------------------------------

describe('POST /api/exams/grading-queue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1', role: 'ADMIN' });
    mockUpdateManyAnswer.mockResolvedValue({ count: 3 });
  });

  // ---- Authentication & Authorization ----

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const res = await POST(createPostRequest({ action: 'bulk-approve', answerIds: ['a'] }));
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 403 when user is not ADMIN', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1', role: 'USER' });
    const res = await POST(createPostRequest({ action: 'bulk-approve', answerIds: ['a'] }));
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error).toBe('Only teachers can approve grades');
  });

  // ---- Invalid action ----

  it('returns 400 for invalid action', async () => {
    const res = await POST(createPostRequest({ action: 'unknown' }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid action');
  });

  it('returns 400 when action is missing', async () => {
    const res = await POST(createPostRequest({ answerIds: ['a', 'b'] }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid action');
  });

  // ---- Validation (bulk-approve) ----

  it('returns 400 when answerIds is empty', async () => {
    const res = await POST(createPostRequest({ action: 'bulk-approve', answerIds: [] }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  it('returns 400 when answerIds is missing', async () => {
    const res = await POST(createPostRequest({ action: 'bulk-approve' }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  // ---- Successful bulk approve ----

  it('updates AI-evaluated answers to teacher-graded', async () => {
    const res = await POST(
      createPostRequest({
        action: 'bulk-approve',
        answerIds: ['ans-1', 'ans-2', 'ans-3'],
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.count).toBe(3);
    expect(body.message).toBe('3 answers approved');

    expect(mockUpdateManyAnswer).toHaveBeenCalledWith({
      where: {
        id: { in: ['ans-1', 'ans-2', 'ans-3'] },
        evaluationType: 'AI_EVALUATED',
      },
      data: expect.objectContaining({
        evaluationType: 'TEACHER_GRADED',
      }),
    });
  });

  it('handles single answer bulk approve', async () => {
    mockUpdateManyAnswer.mockResolvedValue({ count: 1 });
    const res = await POST(
      createPostRequest({
        action: 'bulk-approve',
        answerIds: ['ans-1'],
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.count).toBe(1);
    expect(body.message).toBe('1 answers approved');
  });

  // ---- Error handling ----

  it('returns 500 on database error', async () => {
    mockUpdateManyAnswer.mockRejectedValue(new Error('DB error'));
    const res = await POST(
      createPostRequest({
        action: 'bulk-approve',
        answerIds: ['ans-1'],
      })
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to process action');
  });
});
