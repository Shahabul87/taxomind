/**
 * Prisma Session Stores Unit Tests
 *
 * Tests the teacher session monitoring store functions:
 * - isTeacherOfStudent / isTeacherOfCourse (authorization checks)
 * - getStudentSessions (paginated session listing)
 * - getSessionMessages (conversation retrieval)
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockCourseFindMany = jest.fn();
const mockCourseFindFirst = jest.fn();
const mockEnrollmentFindFirst = jest.fn();
const mockEnrollmentFindMany = jest.fn();
const mockSessionCount = jest.fn();
const mockSessionFindMany = jest.fn();
const mockMemoryFindMany = jest.fn();

const mockDb = {
  course: {
    findMany: mockCourseFindMany,
    findFirst: mockCourseFindFirst,
  },
  enrollment: {
    findFirst: mockEnrollmentFindFirst,
    findMany: mockEnrollmentFindMany,
  },
  sAMAgenticSession: {
    count: mockSessionCount,
    findMany: mockSessionFindMany,
  },
  sAMConversationMemory: {
    findMany: mockMemoryFindMany,
  },
};

jest.mock('@/lib/sam/stores/db-provider', () => ({
  getDb: () => mockDb,
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import {
  isTeacherOfStudent,
  isTeacherOfCourse,
  getStudentSessions,
  getSessionMessages,
} from '@/lib/sam/stores/prisma-session-stores';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Session Stores - Authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // isTeacherOfStudent
  // -----------------------------------------------------------------------
  describe('isTeacherOfStudent', () => {
    it('returns true when teacher has a course the student is enrolled in', async () => {
      mockCourseFindMany.mockResolvedValue([{ id: 'course-1' }]);
      mockEnrollmentFindFirst.mockResolvedValue({ id: 'enroll-1' });

      const result = await isTeacherOfStudent('teacher-1', 'student-1');

      expect(result).toBe(true);
      expect(mockCourseFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'teacher-1' },
        })
      );
    });

    it('returns false when teacher has no courses', async () => {
      mockCourseFindMany.mockResolvedValue([]);

      const result = await isTeacherOfStudent('teacher-1', 'student-1');

      expect(result).toBe(false);
      expect(mockEnrollmentFindFirst).not.toHaveBeenCalled();
    });

    it('returns false when student is not enrolled in any teacher courses', async () => {
      mockCourseFindMany.mockResolvedValue([{ id: 'course-1' }]);
      mockEnrollmentFindFirst.mockResolvedValue(null);

      const result = await isTeacherOfStudent('teacher-1', 'student-1');

      expect(result).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // isTeacherOfCourse
  // -----------------------------------------------------------------------
  describe('isTeacherOfCourse', () => {
    it('returns true when teacher owns the course', async () => {
      mockCourseFindFirst.mockResolvedValue({ id: 'course-1' });

      const result = await isTeacherOfCourse('teacher-1', 'course-1');

      expect(result).toBe(true);
      expect(mockCourseFindFirst).toHaveBeenCalledWith({
        where: { id: 'course-1', userId: 'teacher-1' },
        select: { id: true },
      });
    });

    it('returns false when teacher does not own the course', async () => {
      mockCourseFindFirst.mockResolvedValue(null);

      const result = await isTeacherOfCourse('teacher-1', 'course-99');

      expect(result).toBe(false);
    });
  });
});

describe('Session Stores - Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // getStudentSessions
  // -----------------------------------------------------------------------
  describe('getStudentSessions', () => {
    it('returns sessions for enrolled students', async () => {
      mockCourseFindMany.mockResolvedValue([{ id: 'course-1' }]);
      mockEnrollmentFindMany.mockResolvedValue([{ userId: 'student-1' }]);
      mockSessionCount.mockResolvedValue(1);
      mockSessionFindMany.mockResolvedValue([
        {
          id: 'sess-1',
          userId: 'student-1',
          topicName: 'TypeScript Generics',
          questionsAnswered: 5,
          activitiesCompleted: 3,
          startTime: new Date('2026-02-10T09:00:00Z'),
          endTime: new Date('2026-02-10T10:00:00Z'),
          duration: 3600,
          user: { id: 'student-1', name: 'Alice', email: 'alice@test.com' },
        },
      ]);

      const result = await getStudentSessions('teacher-1');

      expect(result.sessions).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.sessions[0].studentName).toBe('Alice');
      expect(result.sessions[0].messageCount).toBe(8); // 5 + 3
      expect(result.sessions[0].duration).toBe(3600);
    });

    it('returns empty result when teacher has no courses', async () => {
      mockCourseFindMany.mockResolvedValue([]);

      const result = await getStudentSessions('teacher-1');

      expect(result).toEqual({ sessions: [], total: 0, cursor: null });
    });

    it('returns empty result when no students enrolled', async () => {
      mockCourseFindMany.mockResolvedValue([{ id: 'course-1' }]);
      mockEnrollmentFindMany.mockResolvedValue([]);

      const result = await getStudentSessions('teacher-1');

      expect(result).toEqual({ sessions: [], total: 0, cursor: null });
    });

    it('handles cursor pagination', async () => {
      mockCourseFindMany.mockResolvedValue([{ id: 'course-1' }]);
      mockEnrollmentFindMany.mockResolvedValue([{ userId: 'student-1' }]);
      mockSessionCount.mockResolvedValue(5);
      // Return limit + 1 to indicate more results
      mockSessionFindMany.mockResolvedValue([
        {
          id: 'sess-2',
          userId: 'student-1',
          topicName: 'React Hooks',
          questionsAnswered: 2,
          activitiesCompleted: 1,
          startTime: new Date(),
          endTime: null,
          duration: 1800,
          user: { id: 'student-1', name: 'Alice', email: 'alice@test.com' },
        },
        {
          id: 'sess-3',
          userId: 'student-1',
          topicName: 'Next.js',
          questionsAnswered: 1,
          activitiesCompleted: 0,
          startTime: new Date(),
          endTime: null,
          duration: 900,
          user: { id: 'student-1', name: 'Alice', email: 'alice@test.com' },
        },
      ]);

      const result = await getStudentSessions('teacher-1', { limit: 1 });

      // hasMore = sessions.length (2) > limit (1) => true
      expect(result.sessions).toHaveLength(1);
      expect(result.cursor).toBe('sess-2');
    });

    it('limits max page size to 50', async () => {
      mockCourseFindMany.mockResolvedValue([{ id: 'course-1' }]);
      mockEnrollmentFindMany.mockResolvedValue([{ userId: 'student-1' }]);
      mockSessionCount.mockResolvedValue(0);
      mockSessionFindMany.mockResolvedValue([]);

      await getStudentSessions('teacher-1', { limit: 200 });

      // take should be capped at 50 + 1 = 51
      const call = mockSessionFindMany.mock.calls[0][0];
      expect(call.take).toBe(51);
    });

    it('returns empty sessions on DB error', async () => {
      mockCourseFindMany.mockRejectedValue(new Error('DB error'));

      const result = await getStudentSessions('teacher-1');

      expect(result).toEqual({ sessions: [], total: 0, cursor: null });
    });

    it('filters by courseId', async () => {
      mockCourseFindMany.mockResolvedValue([{ id: 'course-5' }]);
      mockEnrollmentFindMany.mockResolvedValue([]);

      await getStudentSessions('teacher-1', { courseId: 'course-5' });

      const call = mockCourseFindMany.mock.calls[0][0];
      expect(call.where.id).toBe('course-5');
    });
  });

  // -----------------------------------------------------------------------
  // getSessionMessages
  // -----------------------------------------------------------------------
  describe('getSessionMessages', () => {
    it('returns messages for a session', async () => {
      mockMemoryFindMany.mockResolvedValue([
        { id: 'msg-1', role: 'user', content: 'What is a closure?', createdAt: new Date() },
        { id: 'msg-2', role: 'assistant', content: 'A closure is...', createdAt: new Date() },
      ]);

      const result = await getSessionMessages('session-1');

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe('user');
      expect(result[1].role).toBe('assistant');
      expect(typeof result[0].createdAt).toBe('string');
    });

    it('returns empty array when no messages found', async () => {
      mockMemoryFindMany.mockResolvedValue([]);

      const result = await getSessionMessages('session-empty');

      expect(result).toEqual([]);
    });

    it('returns empty array on DB error', async () => {
      mockMemoryFindMany.mockRejectedValue(new Error('Timeout'));

      const result = await getSessionMessages('session-1');

      expect(result).toEqual([]);
    });
  });
});
