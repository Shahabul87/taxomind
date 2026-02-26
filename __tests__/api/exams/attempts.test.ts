/**
 * Tests for Exam Attempts Route - app/api/exams/attempts/route.ts
 *
 * Covers: GET (fetch user exam attempts with pagination, filtering)
 */

// Unmock modules that are auto-mocked in jest.setup.js but we need real behavior from
jest.unmock('zod');

import { GET } from '@/app/api/exams/attempts/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;
const mockFindMany = db.userExamAttempt.findMany as jest.Mock;
const mockCount = db.userExamAttempt.count as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost:3000/api/exams/attempts');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new Request(url.toString(), { method: 'GET' });
}

// Factory for a mock attempt row returned by Prisma
function makeMockAttempt(overrides: Record<string, unknown> = {}) {
  return {
    id: 'attempt-1',
    examId: 'exam-1',
    userId: 'user-1',
    status: 'GRADED',
    scorePercentage: 85,
    isPassed: true,
    correctAnswers: 8,
    totalQuestions: 10,
    startedAt: new Date('2026-02-01T10:00:00Z'),
    submittedAt: new Date('2026-02-01T10:30:00Z'),
    timeSpent: 1800,
    Exam: {
      id: 'exam-1',
      title: 'Unit Test Exam',
      passingScore: 70,
      section: {
        title: 'Section A',
        chapter: {
          title: 'Chapter 1',
          courseId: 'course-1',
          course: {
            title: 'Test Course',
          },
        },
      },
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/exams/attempts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1', name: 'Test User' });
    mockFindMany.mockResolvedValue([makeMockAttempt()]);
    mockCount.mockResolvedValue(1);
  });

  // ---- Authentication ----

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(createRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when user has no id', async () => {
    mockCurrentUser.mockResolvedValue({ id: null });

    const res = await GET(createRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  // ---- Success cases ----

  it('returns attempts with default pagination', async () => {
    const res = await GET(createRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.attempts).toHaveLength(1);
    expect(body.pagination).toEqual({
      total: 1,
      limit: 10,
      offset: 0,
      hasMore: false,
    });
  });

  it('formats attempt response fields correctly', async () => {
    const res = await GET(createRequest());
    const body = await res.json();

    const attempt = body.attempts[0];
    expect(attempt.id).toBe('attempt-1');
    expect(attempt.examId).toBe('exam-1');
    expect(attempt.examTitle).toBe('Unit Test Exam');
    expect(attempt.sectionTitle).toBe('Section A');
    expect(attempt.chapterTitle).toBe('Chapter 1');
    expect(attempt.courseTitle).toBe('Test Course');
    expect(attempt.courseId).toBe('course-1');
    expect(attempt.status).toBe('GRADED');
    expect(attempt.scorePercentage).toBe(85);
    expect(attempt.isPassed).toBe(true);
    expect(attempt.correctAnswers).toBe(8);
    expect(attempt.totalQuestions).toBe(10);
    expect(attempt.passingScore).toBe(70);
    expect(attempt.timeSpent).toBe(1800);
    // Dates should be ISO strings
    expect(typeof attempt.startedAt).toBe('string');
    expect(typeof attempt.submittedAt).toBe('string');
  });

  it('calls db.userExamAttempt.findMany with correct default params', async () => {
    await GET(createRequest());

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        take: 10,
        skip: 0,
        orderBy: { startedAt: 'desc' },
      })
    );
  });

  // ---- Pagination ----

  it('respects custom limit and offset', async () => {
    await GET(createRequest({ limit: '5', offset: '10' }));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 5,
        skip: 10,
      })
    );
  });

  it('returns hasMore true when more results exist', async () => {
    mockCount.mockResolvedValue(25);

    const res = await GET(createRequest({ limit: '10', offset: '0' }));
    const body = await res.json();

    expect(body.pagination.hasMore).toBe(true);
  });

  it('returns hasMore false when no more results', async () => {
    mockCount.mockResolvedValue(5);

    const res = await GET(createRequest({ limit: '10', offset: '0' }));
    const body = await res.json();

    expect(body.pagination.hasMore).toBe(false);
  });

  // ---- Filtering by status ----

  it('filters by status when provided', async () => {
    await GET(createRequest({ status: 'IN_PROGRESS' }));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          status: 'IN_PROGRESS',
        }),
      })
    );
  });

  it('filters by courseId when provided', async () => {
    await GET(createRequest({ courseId: 'course-abc' }));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
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

  it('supports filtering by both status and courseId', async () => {
    await GET(createRequest({ status: 'GRADED', courseId: 'course-abc' }));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          status: 'GRADED',
          Exam: expect.any(Object),
        }),
      })
    );
  });

  // ---- Validation errors ----

  it('returns 400 for invalid status value', async () => {
    const res = await GET(createRequest({ status: 'INVALID_STATUS' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
    expect(body.details).toBeDefined();
  });

  it('returns 400 for limit exceeding max (50)', async () => {
    const res = await GET(createRequest({ limit: '100' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  it('returns 400 for negative offset', async () => {
    const res = await GET(createRequest({ offset: '-1' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  it('returns 400 for limit of 0', async () => {
    const res = await GET(createRequest({ limit: '0' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation error');
  });

  // ---- Null-safe formatting ----

  it('handles null section gracefully', async () => {
    mockFindMany.mockResolvedValue([
      makeMockAttempt({
        Exam: {
          id: 'exam-1',
          title: 'No Section Exam',
          passingScore: 70,
          section: null,
        },
      }),
    ]);

    const res = await GET(createRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    const attempt = body.attempts[0];
    expect(attempt.sectionTitle).toBeNull();
    expect(attempt.chapterTitle).toBeNull();
    expect(attempt.courseTitle).toBeNull();
    expect(attempt.courseId).toBeNull();
  });

  it('handles null submittedAt', async () => {
    mockFindMany.mockResolvedValue([
      makeMockAttempt({ submittedAt: null }),
    ]);

    const res = await GET(createRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.attempts[0].submittedAt).toBeNull();
  });

  it('handles null scorePercentage / isPassed / correctAnswers', async () => {
    mockFindMany.mockResolvedValue([
      makeMockAttempt({
        scorePercentage: null,
        isPassed: null,
        correctAnswers: null,
      }),
    ]);

    const res = await GET(createRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    const attempt = body.attempts[0];
    expect(attempt.scorePercentage).toBe(0);
    expect(attempt.isPassed).toBe(false);
    expect(attempt.correctAnswers).toBe(0);
  });

  // ---- Empty results ----

  it('returns empty array when no attempts exist', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const res = await GET(createRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.attempts).toEqual([]);
    expect(body.pagination.total).toBe(0);
  });

  // ---- Error handling ----

  it('returns 500 on unexpected database error', async () => {
    mockFindMany.mockRejectedValue(new Error('DB connection lost'));

    const res = await GET(createRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to fetch exam attempts');
  });

  it('returns 500 when count query fails', async () => {
    mockCount.mockRejectedValue(new Error('Count failed'));

    const res = await GET(createRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to fetch exam attempts');
  });
});
