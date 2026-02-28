jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import { GET } from '@/app/api/sam/analytics/course-overview/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const typedDb = db as Record<string, unknown>;

typedDb.enrollment = typedDb.enrollment || { findMany: jest.fn() };
typedDb.userSectionCompletion = typedDb.userSectionCompletion || { findMany: jest.fn() };
typedDb.learningSession = typedDb.learningSession || { findMany: jest.fn() };
typedDb.userExamAttempt = typedDb.userExamAttempt || { findMany: jest.fn() };
typedDb.practiceSession = typedDb.practiceSession || { findMany: jest.fn() };
typedDb.sAMLearningGoal = typedDb.sAMLearningGoal || { findMany: jest.fn() };
typedDb.study_streaks = typedDb.study_streaks || { findFirst: jest.fn() };
typedDb.studentBloomsProgress = typedDb.studentBloomsProgress || { findMany: jest.fn() };

const mockEnrollmentFindMany = (typedDb.enrollment as { findMany: jest.Mock }).findMany;
const mockSectionCompletionFindMany = (typedDb.userSectionCompletion as { findMany: jest.Mock }).findMany;
const mockLearningSessionFindMany = (typedDb.learningSession as { findMany: jest.Mock }).findMany;
const mockUserExamAttemptFindMany = (typedDb.userExamAttempt as { findMany: jest.Mock }).findMany;
const mockPracticeSessionFindMany = (typedDb.practiceSession as { findMany: jest.Mock }).findMany;
const mockLearningGoalFindMany = (typedDb.sAMLearningGoal as { findMany: jest.Mock }).findMany;
const mockStudyStreakFindFirst = (typedDb.study_streaks as { findFirst: jest.Mock }).findFirst;
const mockBloomsProgressFindMany = (typedDb.studentBloomsProgress as { findMany: jest.Mock }).findMany;

describe('/api/sam/analytics/course-overview route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    mockEnrollmentFindMany.mockResolvedValue([]);
    mockSectionCompletionFindMany.mockResolvedValue([]);
    mockLearningSessionFindMany.mockResolvedValue([]);
    mockUserExamAttemptFindMany.mockResolvedValue([]);
    mockPracticeSessionFindMany.mockResolvedValue([]);
    mockLearningGoalFindMany.mockResolvedValue([]);
    mockStudyStreakFindFirst.mockResolvedValue(null);
    mockBloomsProgressFindMany.mockResolvedValue([]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/sam/analytics/course-overview');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 400 for invalid query params', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/sam/analytics/course-overview?timeRange=invalid'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_PARAMS');
  });

  it('returns empty overview when no active enrollments exist', async () => {
    mockEnrollmentFindMany.mockResolvedValueOnce([]);

    const req = new NextRequest('http://localhost:3000/api/sam/analytics/course-overview');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.courses).toHaveLength(0);
    expect(body.data.summary.totalCourses).toBe(0);
    expect(body.data.summary.overallHealthScore).toBe(100);
  });

  it('returns aggregated analytics for enrolled courses', async () => {
    const createdAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const sectionCompletedAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    mockEnrollmentFindMany.mockResolvedValueOnce([
      {
        courseId: 'course-1',
        createdAt,
        Course: {
          id: 'course-1',
          title: 'TypeScript Mastery',
          description: 'Deep TS',
          imageUrl: 'https://example.com/ts.png',
          chapters: [
            {
              id: 'chapter-1',
              title: 'Foundations',
              sections: [
                { id: 'sec-1', title: 'Types' },
                { id: 'sec-2', title: 'Interfaces' },
              ],
            },
          ],
        },
      },
    ]);

    mockSectionCompletionFindMany.mockResolvedValueOnce([
      {
        id: 'comp-1',
        userId: 'user-1',
        sectionId: 'sec-1',
        completedAt: sectionCompletedAt,
        timeSpent: 1200,
        section: {
          id: 'sec-1',
          title: 'Types',
          chapterId: 'chapter-1',
          chapter: { courseId: 'course-1' },
        },
      },
    ]);

    mockLearningSessionFindMany.mockResolvedValueOnce([
      {
        id: 'session-1',
        sessionType: 'course',
        contentId: 'course-1',
        startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        duration: 1800,
      },
    ]);

    mockUserExamAttemptFindMany.mockResolvedValueOnce([
      {
        id: 'attempt-1',
        userId: 'user-1',
        scorePercentage: 80,
        isPassed: true,
        Exam: { section: { chapter: { courseId: 'course-1' } } },
        UserAnswer: [
          { ExamQuestion: { bloomsLevel: 'REMEMBER' } },
          { ExamQuestion: { bloomsLevel: 'APPLY' } },
        ],
      },
    ]);

    mockPracticeSessionFindMany.mockResolvedValueOnce([
      {
        id: 'practice-1',
        courseId: 'course-1',
        startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        durationMinutes: 30,
      },
    ]);

    mockLearningGoalFindMany.mockResolvedValueOnce([
      {
        id: 'goal-1',
        courseId: 'course-1',
        subGoals: [
          { id: 'sg-1', title: 'Complete chapter 1', status: 'completed', completedAt: new Date() },
          { id: 'sg-2', title: 'Practice exercises', status: 'in_progress', completedAt: null },
        ],
      },
    ]);

    mockStudyStreakFindFirst.mockResolvedValueOnce({ currentStreak: 4, updatedAt: new Date() });

    const req = new NextRequest('http://localhost:3000/api/sam/analytics/course-overview');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.summary.totalCourses).toBe(1);
    expect(body.data.summary.currentStreak).toBe(4);

    const course = body.data.courses[0];
    expect(course.courseId).toBe('course-1');
    expect(course.progress.sectionsCompleted).toBe(1);
    expect(course.progress.totalSections).toBe(2);
    expect(course.progress.overall).toBe(50);
    expect(course.assessments.examAttempts).toBe(1);
    expect(course.assessments.averageScore).toBe(80);
    expect(course.assessments.practiceSessionsCount).toBe(1);
    expect(course.milestones.length).toBe(2);
    expect(course.timeSpent.totalMinutes).toBeGreaterThan(0);
    expect(['on_track', 'needs_attention', 'ahead', 'behind', 'completed']).toContain(course.status);
  });

  it('continues with partial analytics when non-critical data sources fail', async () => {
    mockEnrollmentFindMany.mockResolvedValueOnce([
      {
        courseId: 'course-1',
        createdAt: new Date(),
        Course: {
          id: 'course-1',
          title: 'Resilient Course',
          description: null,
          imageUrl: null,
          chapters: [{ id: 'chapter-1', title: 'Intro', sections: [{ id: 'sec-1', title: 'Start' }] }],
        },
      },
    ]);

    mockSectionCompletionFindMany.mockRejectedValueOnce(new Error('section source down'));
    mockLearningSessionFindMany.mockRejectedValueOnce(new Error('session source down'));
    mockUserExamAttemptFindMany.mockRejectedValueOnce(new Error('exam source down'));
    mockPracticeSessionFindMany.mockRejectedValueOnce(new Error('practice source down'));
    mockLearningGoalFindMany.mockRejectedValueOnce(new Error('goals source down'));
    mockStudyStreakFindFirst.mockRejectedValueOnce(new Error('streak source down'));
    mockBloomsProgressFindMany.mockRejectedValueOnce(new Error('blooms source down'));

    const req = new NextRequest('http://localhost:3000/api/sam/analytics/course-overview');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.summary.totalCourses).toBe(1);
    expect(body.data.courses[0].assessments.examAttempts).toBe(0);
    expect(body.data.courses[0].timeSpent.totalMinutes).toBe(0);
  });

  it('returns 500 when top-level fetch fails', async () => {
    mockEnrollmentFindMany.mockRejectedValueOnce(new Error('database unavailable'));

    const req = new NextRequest('http://localhost:3000/api/sam/analytics/course-overview');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
