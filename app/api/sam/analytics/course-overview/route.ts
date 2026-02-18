/**
 * Consolidated Course Analytics API
 *
 * Aggregates data from multiple sources to provide a complete view
 * of a user's progress across all enrolled courses.
 *
 * Data sources:
 * - Enrollment
 * - user_progress
 * - UserSectionCompletion
 * - SAMLearningSession
 * - UserExamAttempt
 * - PracticeSession
 * - SAMLearningGoal (for milestones)
 * - SAMRecommendation (for AI insights)
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

interface TopicProgress {
  id: string;
  name: string;
  masteryLevel: number;
  timeSpentMinutes: number;
  lastStudiedAt: Date | null;
  status: 'not_started' | 'in_progress' | 'completed';
}

interface CourseAssessments {
  examAttempts: number;
  averageScore: number;
  passedExams: number;
  practiceSessionsCount: number;
  totalPracticeMinutes: number;
  bloomsBreakdown: {
    remember: number;
    understand: number;
    apply: number;
    analyze: number;
    evaluate: number;
    create: number;
  };
}

interface CourseMilestone {
  id: string;
  title: string;
  description?: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  targetDate?: Date;
  completedAt?: Date;
  progress: number;
}

interface CourseAnalytics {
  courseId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  enrolledAt: Date;
  lastActivityAt?: Date;
  progress: {
    overall: number;
    sectionsCompleted: number;
    totalSections: number;
    chaptersCompleted: number;
    totalChapters: number;
  };
  topics: TopicProgress[];
  timeSpent: {
    totalMinutes: number;
    thisWeekMinutes: number;
    averageSessionMinutes: number;
    sessionsCount: number;
  };
  assessments: CourseAssessments;
  milestones: CourseMilestone[];
  status: 'on_track' | 'needs_attention' | 'ahead' | 'behind' | 'completed';
  aiInsights: {
    recommendation?: string;
    riskLevel: 'low' | 'medium' | 'high';
    strengths: string[];
    weaknesses: string[];
  };
}

interface CourseOverviewResponse {
  courses: CourseAnalytics[];
  summary: {
    totalCourses: number;
    completedCourses: number;
    totalStudyTimeMinutes: number;
    averageProgress: number;
    overallHealthScore: number;
    currentStreak: number;
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

const querySchema = z.object({
  courseId: z.string().optional(),
  timeRange: z.enum(['week', 'month', 'quarter', 'all']).optional().default('month'),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getTimeRangeDate(range: string): Date {
  const now = new Date();
  switch (range) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'quarter':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(0); // All time
  }
}

function calculateCourseStatus(
  progress: number,
  daysSinceEnrollment: number,
  lastActivityDays: number
): 'on_track' | 'needs_attention' | 'ahead' | 'behind' | 'completed' {
  if (progress >= 100) return 'completed';

  // Expected progress based on time (assuming 30-day course completion target)
  const expectedProgress = Math.min((daysSinceEnrollment / 30) * 100, 100);
  const progressDiff = progress - expectedProgress;

  // If no activity in last 7 days, needs attention
  if (lastActivityDays > 7) return 'needs_attention';

  if (progressDiff >= 15) return 'ahead';
  if (progressDiff >= -10) return 'on_track';
  if (progressDiff >= -25) return 'behind';
  return 'needs_attention';
}

function calculateRiskLevel(
  progress: number,
  lastActivityDays: number,
  averageScore: number
): 'low' | 'medium' | 'high' {
  let riskScore = 0;

  // No activity in last week = +30 risk
  if (lastActivityDays > 7) riskScore += 30;
  else if (lastActivityDays > 3) riskScore += 15;

  // Low progress = +20 risk
  if (progress < 20) riskScore += 20;
  else if (progress < 40) riskScore += 10;

  // Low average score = +20 risk
  if (averageScore > 0 && averageScore < 50) riskScore += 20;
  else if (averageScore > 0 && averageScore < 70) riskScore += 10;

  if (riskScore >= 40) return 'high';
  if (riskScore >= 20) return 'medium';
  return 'low';
}

// ============================================================================
// GET /api/sam/analytics/course-overview
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      courseId: searchParams.get('courseId') ?? undefined,
      timeRange: searchParams.get('timeRange') ?? undefined,
    });

    if (!parsed.success) {
      logger.error('[COURSE_OVERVIEW] Validation failed:', {
        courseId: searchParams.get('courseId'),
        timeRange: searchParams.get('timeRange'),
        errors: parsed.error.issues,
      });
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PARAMS', message: 'Invalid parameters', details: parsed.error.issues } },
        { status: 400 }
      );
    }

    const { courseId, timeRange } = parsed.data;
    const timeRangeStart = getTimeRangeDate(timeRange);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const now = new Date();

    // Get enrollments with course details
    const enrollments = await db.enrollment.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
        ...(courseId ? { courseId } : {}),
      },
      include: {
        Course: {
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            chapters: {
              where: { isPublished: true },
              select: {
                id: true,
                title: true,
                sections: {
                  where: { isPublished: true },
                  select: { id: true, title: true },
                },
              },
            },
          },
        },
      },
      take: 500,
    });

    if (enrollments.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          courses: [],
          summary: {
            totalCourses: 0,
            completedCourses: 0,
            totalStudyTimeMinutes: 0,
            averageProgress: 0,
            overallHealthScore: 100,
            currentStreak: 0,
          },
        } satisfies CourseOverviewResponse,
      });
    }

    const courseIds = enrollments.map(e => e.courseId);

    // Batch fetch all data for efficiency - with individual error handling
    // Using explicit types to handle includes properly
    type SectionCompletionWithRelations = {
      id: string;
      userId: string;
      sectionId: string;
      completedAt: Date | null;
      timeSpent: number;
      section: {
        id: string;
        title: string;
        chapterId: string;
        chapter: { courseId: string };
      };
    };

    type ExamAttemptWithRelations = {
      id: string;
      userId: string;
      scorePercentage: number | null;
      isPassed: boolean | null;
      Exam: {
        section: {
          chapter: { courseId: string };
        } | null;
      } | null;
      UserAnswer: Array<{
        ExamQuestion: { bloomsLevel: string | null } | null;
      }> | null;
    };

    type GoalWithSubGoals = {
      id: string;
      courseId: string | null;
      subGoals: Array<{
        id: string;
        title: string;
        status: string;
        completedAt: Date | null;
      }>;
    };

    let sectionCompletions: SectionCompletionWithRelations[] = [];
    let learningSessions: Array<{
      id: string;
      sessionType: string;
      contentId: string;
      startTime: Date;
      duration: number;
    }> = [];
    let examAttempts: ExamAttemptWithRelations[] = [];
    let practiceSessions: Array<{
      id: string;
      courseId: string | null;
      startedAt: Date;
      durationMinutes: number;
    }> = [];
    let goals: GoalWithSubGoals[] = [];
    let studyStreaks: { currentStreak: number } | null = null;
    let bloomsProgress: Array<{ courseId: string | null }> = [];

    try {
      // Section completions for progress
      const rawCompletions = await db.userSectionCompletion.findMany({
        where: {
          userId: user.id,
          section: { chapter: { courseId: { in: courseIds } } },
        },
        include: {
          section: {
            select: {
              id: true,
              title: true,
              chapterId: true,
              chapter: { select: { courseId: true } },
            },
          },
        },
        take: 500,
      });
      sectionCompletions = rawCompletions as unknown as SectionCompletionWithRelations[];
    } catch (e) {
      logger.error('[COURSE_OVERVIEW] Error fetching section completions:', e);
    }

    try {
      // Learning sessions for time tracking
      const rawSessions = await db.learningSession.findMany({
        where: {
          userId: user.id,
          OR: [
            { sessionType: 'course', contentId: { in: courseIds } },
            { sessionType: { in: ['chapter', 'section'] } },
          ],
          startTime: { gte: timeRangeStart },
        },
        orderBy: { startTime: 'desc' },
        take: 500,
      });
      learningSessions = rawSessions as typeof learningSessions;
    } catch (e) {
      logger.error('[COURSE_OVERVIEW] Error fetching learning sessions:', e);
    }

    try {
      // Exam attempts for assessment tracking
      const rawAttempts = await db.userExamAttempt.findMany({
        where: {
          userId: user.id,
          Exam: { section: { chapter: { courseId: { in: courseIds } } } },
        },
        include: {
          Exam: {
            select: {
              section: {
                select: {
                  chapter: { select: { courseId: true } },
                },
              },
            },
          },
          UserAnswer: {
            include: {
              ExamQuestion: { select: { bloomsLevel: true } },
            },
          },
        },
        take: 500,
      });
      examAttempts = rawAttempts as unknown as ExamAttemptWithRelations[];
    } catch (e) {
      logger.error('[COURSE_OVERVIEW] Error fetching exam attempts:', e);
    }

    try {
      // Practice sessions
      const rawPractice = await db.practiceSession.findMany({
        where: {
          userId: user.id,
          courseId: { in: courseIds },
          startedAt: { gte: timeRangeStart },
        },
        take: 500,
      });
      practiceSessions = rawPractice as typeof practiceSessions;
    } catch (e) {
      logger.error('[COURSE_OVERVIEW] Error fetching practice sessions:', e);
    }

    try {
      // Goals for milestones
      const rawGoals = await db.sAMLearningGoal.findMany({
        where: {
          userId: user.id,
          courseId: { in: courseIds },
        },
        include: {
          subGoals: {
            orderBy: { order: 'asc' },
          },
        },
        take: 500,
      });
      goals = rawGoals as unknown as GoalWithSubGoals[];
    } catch (e) {
      logger.error('[COURSE_OVERVIEW] Error fetching goals:', e);
    }

    try {
      // Study streaks
      const rawStreaks = await db.study_streaks.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
      });
      studyStreaks = rawStreaks as typeof studyStreaks;
    } catch (e) {
      logger.error('[COURSE_OVERVIEW] Error fetching study streaks:', e);
    }

    try {
      // Bloom's progress for cognitive breakdown
      const rawBlooms = await db.studentBloomsProgress.findMany({
        where: {
          userId: user.id,
          courseId: { in: courseIds },
        },
        take: 500,
      });
      bloomsProgress = rawBlooms as typeof bloomsProgress;
    } catch (e) {
      logger.error('[COURSE_OVERVIEW] Error fetching blooms progress:', e);
    }

    // Group data by course
    const courseAnalytics: CourseAnalytics[] = enrollments.map(enrollment => {
      const course = enrollment.Course;
      if (!course) {
        return null;
      }

      // Calculate total sections
      const totalChapters = course.chapters.length;
      const totalSections = course.chapters.reduce(
        (sum, chapter) => sum + chapter.sections.length,
        0
      );

      // Get completions for this course (with null safety)
      const courseCompletions = sectionCompletions.filter(
        sc => sc.section?.chapter?.courseId === course.id
      );
      const sectionsCompleted = courseCompletions.filter(sc => sc.completedAt).length;
      const completedChapterIds = new Set(
        courseCompletions
          .filter(sc => sc.completedAt)
          .map(sc => sc.section?.chapterId)
          .filter((id): id is string => Boolean(id))
      );

      // Check if all sections in a chapter are completed
      const chaptersCompleted = course.chapters.filter(chapter => {
        const chapterSections = chapter.sections.map(s => s.id);
        const completedSections = courseCompletions
          .filter(sc => chapterSections.includes(sc.sectionId) && sc.completedAt)
          .map(sc => sc.sectionId);
        return chapterSections.length > 0 &&
               chapterSections.every(sId => completedSections.includes(sId));
      }).length;

      const overallProgress = totalSections > 0
        ? Math.round((sectionsCompleted / totalSections) * 100)
        : 0;

      // Time tracking - use multiple sources
      // 1. LearningSession: contentId is courseId when sessionType='course'
      const courseSessions = learningSessions.filter(s =>
        s.sessionType === 'course' && s.contentId === course.id
      );

      // 2. Calculate time from section completions (timeSpent is in seconds)
      const timeFromCompletions = courseCompletions.reduce(
        (sum, sc) => sum + (sc.timeSpent ?? 0),
        0
      );

      // 3. Calculate time from practice sessions
      const coursePracticeSessions = practiceSessions.filter(ps => ps.courseId === course.id);
      const timeFromPractice = coursePracticeSessions.reduce(
        (sum, ps) => sum + ((ps.durationMinutes ?? 0) * 60),
        0
      );

      // Total time in minutes (convert seconds to minutes)
      const sessionTimeSeconds = courseSessions.reduce((sum, s) => sum + (s.duration ?? 0), 0);
      const totalSeconds = sessionTimeSeconds + timeFromCompletions + timeFromPractice;
      const totalMinutes = Math.round(totalSeconds / 60);

      // This week's time
      const thisWeekSessions = courseSessions.filter(s => s.startTime >= weekAgo);
      const thisWeekPractice = coursePracticeSessions.filter(ps => ps.startedAt >= weekAgo);
      const thisWeekSeconds =
        thisWeekSessions.reduce((sum, s) => sum + (s.duration ?? 0), 0) +
        thisWeekPractice.reduce((sum, ps) => sum + ((ps.durationMinutes ?? 0) * 60), 0);
      const thisWeekMinutes = Math.round(thisWeekSeconds / 60);

      // Average session time
      const totalSessionCount = courseSessions.length + coursePracticeSessions.length;
      const averageSessionMinutes = totalSessionCount > 0
        ? Math.round(totalMinutes / totalSessionCount)
        : 0;

      // Assessment tracking
      const courseExamAttempts = examAttempts.filter(
        ea => ea.Exam?.section?.chapter?.courseId === course.id
      );
      const averageScore = courseExamAttempts.length > 0
        ? Math.round(
            courseExamAttempts.reduce((sum, ea) => sum + (ea.scorePercentage ?? 0), 0) /
              courseExamAttempts.length
          )
        : 0;
      const passedExams = courseExamAttempts.filter(ea => ea.isPassed).length;

      // Bloom's breakdown from exam answers
      const bloomsCounts = { remember: 0, understand: 0, apply: 0, analyze: 0, evaluate: 0, create: 0 };
      courseExamAttempts.forEach(attempt => {
        attempt.UserAnswer?.forEach(answer => {
          const level = answer.ExamQuestion?.bloomsLevel?.toLowerCase();
          if (level && level in bloomsCounts) {
            bloomsCounts[level as keyof typeof bloomsCounts]++;
          }
        });
      });
      const totalBloomsAnswers = Object.values(bloomsCounts).reduce((a, b) => a + b, 0);
      const bloomsBreakdown = totalBloomsAnswers > 0
        ? {
            remember: Math.round((bloomsCounts.remember / totalBloomsAnswers) * 100),
            understand: Math.round((bloomsCounts.understand / totalBloomsAnswers) * 100),
            apply: Math.round((bloomsCounts.apply / totalBloomsAnswers) * 100),
            analyze: Math.round((bloomsCounts.analyze / totalBloomsAnswers) * 100),
            evaluate: Math.round((bloomsCounts.evaluate / totalBloomsAnswers) * 100),
            create: Math.round((bloomsCounts.create / totalBloomsAnswers) * 100),
          }
        : { remember: 0, understand: 0, apply: 0, analyze: 0, evaluate: 0, create: 0 };

      // Practice sessions - use coursePracticeSessions already defined above
      const totalPracticeMinutes = coursePracticeSessions.reduce(
        (sum, ps) => sum + (ps.durationMinutes ?? 0),
        0
      );

      // Milestones from goals (with null safety)
      const courseGoals = goals.filter(g => g.courseId === course.id);
      const milestones: CourseMilestone[] = courseGoals.flatMap(goal => {
        // Create milestones from subgoals (with null safety)
        const subGoals = goal.subGoals ?? [];
        const subGoalMilestones = subGoals.slice(0, 5).map(sg => ({
          id: sg.id,
          title: sg.title,
          status: (sg.status === 'completed' ? 'completed' :
                  sg.status === 'in_progress' ? 'in_progress' : 'upcoming') as 'completed' | 'in_progress' | 'upcoming',
          completedAt: sg.completedAt ?? undefined,
          progress: sg.status === 'completed' ? 100 :
                   sg.status === 'in_progress' ? 50 : 0,
        }));

        return subGoalMilestones;
      });

      // Topics from chapters/sections (with null safety)
      const topics: TopicProgress[] = course.chapters.slice(0, 10).map(chapter => {
        const chapterCompletions = courseCompletions.filter(
          sc => sc.section?.chapterId === chapter.id
        );
        const chapterSectionCount = chapter.sections.length;
        const completedCount = chapterCompletions.filter(sc => sc.completedAt).length;
        const masteryLevel = chapterSectionCount > 0
          ? Math.round((completedCount / chapterSectionCount) * 100)
          : 0;
        const timeSpent = chapterCompletions.reduce(
          (sum, sc) => sum + (sc.timeSpent ?? 0),
          0
        );
        const lastStudied = chapterCompletions
          .filter(sc => sc.completedAt)
          .sort((a, b) =>
            (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0)
          )[0]?.completedAt ?? null;

        return {
          id: chapter.id,
          name: chapter.title,
          masteryLevel,
          timeSpentMinutes: Math.round(timeSpent / 60),
          lastStudiedAt: lastStudied,
          status: (masteryLevel === 100 ? 'completed' :
                  masteryLevel > 0 ? 'in_progress' : 'not_started') as 'completed' | 'in_progress' | 'not_started',
        };
      });

      // Calculate status and insights
      const daysSinceEnrollment = Math.floor(
        (now.getTime() - enrollment.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const lastActivity = courseSessions[0]?.startTime ?? enrollment.createdAt;
      const lastActivityDays = Math.floor(
        (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );

      const status = calculateCourseStatus(overallProgress, daysSinceEnrollment, lastActivityDays);
      const riskLevel = calculateRiskLevel(overallProgress, lastActivityDays, averageScore);

      // AI Insights
      const strengths: string[] = [];
      const weaknesses: string[] = [];

      topics.forEach(topic => {
        if (topic.masteryLevel >= 80) strengths.push(topic.name);
        else if (topic.masteryLevel < 40 && topic.masteryLevel > 0) weaknesses.push(topic.name);
      });

      let recommendation: string | undefined;
      if (status === 'needs_attention') {
        recommendation = `Resume your ${course.title} course - you haven&apos;t studied in ${lastActivityDays} days`;
      } else if (weaknesses.length > 0) {
        recommendation = `Focus on: ${weaknesses.slice(0, 2).join(', ')}`;
      } else if (overallProgress < 30) {
        recommendation = 'Keep up the momentum - complete more sections to build strong foundations';
      }

      return {
        courseId: course.id,
        title: course.title,
        description: course.description ?? undefined,
        thumbnailUrl: course.imageUrl ?? undefined,
        enrolledAt: enrollment.createdAt,
        lastActivityAt: lastActivity,
        progress: {
          overall: overallProgress,
          sectionsCompleted,
          totalSections,
          chaptersCompleted,
          totalChapters,
        },
        topics,
        timeSpent: {
          totalMinutes,
          thisWeekMinutes,
          averageSessionMinutes,
          sessionsCount: totalSessionCount,
        },
        assessments: {
          examAttempts: courseExamAttempts.length,
          averageScore,
          passedExams,
          practiceSessionsCount: coursePracticeSessions.length,
          totalPracticeMinutes,
          bloomsBreakdown,
        },
        milestones,
        status,
        aiInsights: {
          recommendation,
          riskLevel,
          strengths: strengths.slice(0, 3),
          weaknesses: weaknesses.slice(0, 3),
        },
      } satisfies CourseAnalytics;
    }).filter((c): c is CourseAnalytics => c !== null);

    // Calculate summary
    const totalStudyTimeMinutes = courseAnalytics.reduce(
      (sum, c) => sum + c.timeSpent.totalMinutes,
      0
    );
    const averageProgress = courseAnalytics.length > 0
      ? Math.round(
          courseAnalytics.reduce((sum, c) => sum + c.progress.overall, 0) /
            courseAnalytics.length
        )
      : 0;
    const completedCourses = courseAnalytics.filter(c => c.status === 'completed').length;

    // Health score based on course statuses
    const healthyCount = courseAnalytics.filter(
      c => c.status === 'on_track' || c.status === 'ahead' || c.status === 'completed'
    ).length;
    const overallHealthScore = courseAnalytics.length > 0
      ? Math.round((healthyCount / courseAnalytics.length) * 100)
      : 100;

    const response: CourseOverviewResponse = {
      courses: courseAnalytics,
      summary: {
        totalCourses: courseAnalytics.length,
        completedCourses,
        totalStudyTimeMinutes,
        averageProgress,
        overallHealthScore,
        currentStreak: studyStreaks?.currentStreak ?? 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('Error fetching course overview analytics:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch course analytics'
        }
      },
      { status: 500 }
    );
  }
}
