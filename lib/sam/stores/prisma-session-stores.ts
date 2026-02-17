/**
 * Prisma Session Stores — Teacher Session Monitoring
 *
 * Provides read-only access for teachers to view student SAM sessions
 * within courses they instruct. All queries are course-scoped.
 */

import { getDb } from './db-provider';
import { logger } from '@/lib/logger';

// =============================================================================
// TYPES
// =============================================================================

export interface StudentSessionSummary {
  sessionId: string;
  studentId: string;
  studentName: string | null;
  studentEmail: string | null;
  topicName: string | null;
  messageCount: number;
  startTime: string;
  lastActive: string;
  duration: number;
}

export interface SessionMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export interface StudentSessionListResult {
  sessions: StudentSessionSummary[];
  total: number;
  cursor: string | null;
}

// =============================================================================
// AUTHORIZATION CHECK
// =============================================================================

/**
 * Verify that the given teacher actually instructs a course
 * the given student is enrolled in.
 */
export async function isTeacherOfStudent(
  teacherId: string,
  studentId: string,
): Promise<boolean> {
  // Find courses where teacherId is the instructor and studentId is enrolled
  const teacherCourses = await getDb().course.findMany({
    where: { userId: teacherId },
    select: { id: true },
    take: 200,
  });

  if (teacherCourses.length === 0) return false;

  const courseIds = teacherCourses.map((c) => c.id);

  const enrollment = await getDb().enrollment.findFirst({
    where: {
      userId: studentId,
      courseId: { in: courseIds },
    },
    select: { id: true },
  });

  return !!enrollment;
}

/**
 * Verify that a teacher instructs a specific course.
 */
export async function isTeacherOfCourse(
  teacherId: string,
  courseId: string,
): Promise<boolean> {
  const course = await getDb().course.findFirst({
    where: { id: courseId, userId: teacherId },
    select: { id: true },
  });
  return !!course;
}

// =============================================================================
// SESSION QUERIES
// =============================================================================

/**
 * Get SAM sessions for students enrolled in the teacher's courses.
 * Supports cursor-based pagination.
 */
export async function getStudentSessions(
  teacherId: string,
  options: {
    courseId?: string;
    cursor?: string;
    limit?: number;
  } = {},
): Promise<StudentSessionListResult> {
  const limit = Math.min(options.limit ?? 20, 50);

  try {
    // Get courses this teacher instructs
    const teacherCourses = await getDb().course.findMany({
      where: {
        userId: teacherId,
        ...(options.courseId ? { id: options.courseId } : {}),
      },
      select: { id: true },
      take: 200,
    });

    if (teacherCourses.length === 0) {
      return { sessions: [], total: 0, cursor: null };
    }

    const courseIds = teacherCourses.map((c) => c.id);

    // Get enrolled student IDs
    const enrollments = await getDb().enrollment.findMany({
      where: { courseId: { in: courseIds } },
      select: { userId: true },
      take: 500,
    });

    const studentIds = [...new Set(enrollments.map((e) => e.userId))];

    if (studentIds.length === 0) {
      return { sessions: [], total: 0, cursor: null };
    }

    // Get total count
    const total = await getDb().sAMAgenticSession.count({
      where: { userId: { in: studentIds } },
    });

    // Get sessions with cursor pagination
    const sessions = await getDb().sAMAgenticSession.findMany({
      where: {
        userId: { in: studentIds },
        ...(options.cursor ? { id: { lt: options.cursor } } : {}),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { startTime: 'desc' },
      take: limit + 1, // Fetch one extra to determine if there are more
    });

    const hasMore = sessions.length > limit;
    const resultSessions = hasMore ? sessions.slice(0, limit) : sessions;
    const nextCursor = hasMore ? resultSessions[resultSessions.length - 1].id : null;

    const summaries: StudentSessionSummary[] = resultSessions.map((s) => ({
      sessionId: s.id,
      studentId: s.userId,
      studentName: s.user?.name ?? null,
      studentEmail: s.user?.email ?? null,
      topicName: s.topicName,
      messageCount: s.questionsAnswered + s.activitiesCompleted,
      startTime: s.startTime.toISOString(),
      lastActive: (s.endTime ?? s.startTime).toISOString(),
      duration: s.duration,
    }));

    return { sessions: summaries, total, cursor: nextCursor };
  } catch (error) {
    logger.error('[SessionStore] getStudentSessions failed', {
      teacherId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { sessions: [], total: 0, cursor: null };
  }
}

/**
 * Get messages for a specific student SAM session.
 * Returns conversation memory entries for the session.
 */
export async function getSessionMessages(
  sessionId: string,
): Promise<SessionMessage[]> {
  try {
    const memories = await getDb().sAMConversationMemory.findMany({
      where: { sessionId },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    return memories.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }));
  } catch (error) {
    logger.error('[SessionStore] getSessionMessages failed', {
      sessionId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}
