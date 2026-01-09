/**
 * SAM AI Insights API
 * Phase 5: Learning Analytics & Insights
 *
 * GET /api/dashboard/analytics/sam-insights - Get AI-powered learning insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import {
  SAMInsightsResponse,
  LearningInsight,
  LearningPattern,
  AttentionItem,
  SuggestedAction,
} from '@/types/learning-analytics';

// Helper to calculate actual duration from study session
function getSessionDuration(session: {
  duration: number;
  actualStartTime: Date | null;
  actualEndTime: Date | null;
}): number {
  if (session.actualStartTime && session.actualEndTime) {
    return Math.round(
      (session.actualEndTime.getTime() - session.actualStartTime.getTime()) / 60000
    );
  }
  return session.duration;
}

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch user enrollments
    const enrollments = await db.enrollment.findMany({
      where: { userId: user.id },
      include: {
        Course: {
          include: {
            chapters: {
              include: {
                sections: true,
              },
            },
          },
        },
      },
    });

    // Fetch study sessions for pattern analysis
    const studySessions = await db.dashboardStudySession.findMany({
      where: {
        userId: user.id,
        startTime: { gte: thirtyDaysAgo },
        status: 'COMPLETED',
      },
      select: {
        startTime: true,
        duration: true,
        actualStartTime: true,
        actualEndTime: true,
        courseId: true,
      },
    });

    // Fetch user progress
    const courseIds = enrollments.map((e) => e.courseId);
    const userProgress = await db.user_progress.findMany({
      where: {
        userId: user.id,
        Section: {
          chapter: {
            courseId: { in: courseIds },
          },
        },
      },
      include: {
        Section: {
          include: {
            chapter: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    // Fetch user goals
    const activeGoals = await db.dashboardGoal.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
      include: {
        course: true,
      },
    });

    // Fetch recent quiz scores
    const quizAttempts = await db.userExamAttempt.findMany({
      where: {
        userId: user.id,
        status: 'SUBMITTED',
        submittedAt: { gte: thirtyDaysAgo },
      },
      include: {
        Exam: {
          include: {
            section: {
              include: {
                chapter: {
                  include: {
                    course: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: 10,
    });

    // Fetch user streak
    const streakData = await db.study_streaks.findFirst({
      where: { userId: user.id },
    });

    // Generate insights
    const insights: LearningInsight[] = [];
    const attentionItems: AttentionItem[] = [];
    const suggestedActions: SuggestedAction[] = [];

    // Analyze study patterns for optimal time
    const hourlyActivity = new Array(24).fill(0);
    for (const session of studySessions) {
      const hour = session.startTime.getHours();
      hourlyActivity[hour] += getSessionDuration(session);
    }

    const peakHour = hourlyActivity.indexOf(Math.max(...hourlyActivity));
    const optimalStudyTime =
      peakHour >= 6 && peakHour < 12
        ? `${peakHour}:00 AM - ${peakHour + 2}:00 AM`
        : peakHour >= 12 && peakHour < 18
        ? `${peakHour - 12 || 12}:00 PM - ${(peakHour - 12 + 2) || 2}:00 PM`
        : `${peakHour > 12 ? peakHour - 12 : peakHour}:00 PM - ${(peakHour + 2) > 12 ? (peakHour + 2) - 12 : peakHour + 2}:00 PM`;

    // Find courses that are behind
    for (const enrollment of enrollments) {
      const course = enrollment.Course;
      if (!course) continue;

      const totalSections = course.chapters.reduce(
        (sum, chapter) => sum + chapter.sections.length,
        0
      );

      const completedSections = userProgress.filter(
        (p) =>
          p.isCompleted &&
          p.Section?.chapter?.courseId === course.id
      ).length;

      const progress = totalSections > 0
        ? (completedSections / totalSections) * 100
        : 0;

      // Calculate expected progress
      const enrollmentDate = new Date(enrollment.createdAt);
      const daysSinceEnrollment = Math.floor(
        (now.getTime() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const expectedProgress = Math.min((daysSinceEnrollment / 56) * 100, 100);

      if (progress < expectedProgress - 15) {
        insights.push({
          id: `behind-${course.id}`,
          type: 'warning',
          priority: 'high',
          title: `${course.title} is falling behind`,
          description: `You&apos;re ${Math.round(expectedProgress - progress)}% behind your expected progress. Consider dedicating more time to this course.`,
          icon: 'AlertTriangle',
          color: '#F59E0B',
          courseId: course.id,
          courseName: course.title,
          createdAt: now.toISOString(),
          action: {
            label: 'Continue Course',
            href: `/courses/${course.id}`,
            type: 'navigate',
          },
        });
      }

      // Note: Exams are related through chapters -> sections -> exams
      // To track exam deadlines, query them separately if needed

      // Suggest next action for courses
      const nextSection = course.chapters
        .flatMap((ch) => ch.sections)
        .find(
          (s) =>
            !userProgress.some(
              (p) => p.sectionId === s.id && p.isCompleted
            )
        );

      if (nextSection) {
        suggestedActions.push({
          id: `next-${course.id}`,
          title: `Continue: ${nextSection.title}`,
          duration: '25 min',
          type: 'lesson',
          courseId: course.id,
          courseName: course.title,
          href: `/courses/${course.id}/sections/${nextSection.id}`,
          priority: progress < 50 ? 1 : 2,
        });
      }
    }

    // Check streak status
    if (streakData) {
      const lastActive = streakData.lastStudyDate;
      const daysSinceActivity = lastActive
        ? Math.floor(
            (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
          )
        : Infinity;

      if (daysSinceActivity === 0) {
        // Good - streak maintained today
      } else if (daysSinceActivity === 1 && streakData.currentStreak > 3) {
        attentionItems.push({
          id: 'streak-warning',
          message: `Don&apos;t lose your ${streakData.currentStreak}-day streak! Complete an activity today.`,
          type: 'streak',
          severity: 'warning',
        });

        insights.push({
          id: 'streak-reminder',
          type: 'warning',
          priority: 'medium',
          title: 'Keep your streak alive!',
          description: `You&apos;re on a ${streakData.currentStreak}-day learning streak. Log an activity today to keep it going.`,
          icon: 'Flame',
          color: '#F97316',
          createdAt: now.toISOString(),
        });
      }
    }

    // Add achievement insights based on progress
    const totalLessonsCompleted = userProgress.filter((p) => p.isCompleted).length;
    if (totalLessonsCompleted >= 50 && totalLessonsCompleted < 100) {
      insights.push({
        id: 'milestone-50',
        type: 'achievement',
        priority: 'low',
        title: '50 Lessons Milestone!',
        description: `Amazing progress! You&apos;ve completed ${totalLessonsCompleted} lessons. Keep up the great work!`,
        icon: 'Trophy',
        color: '#10B981',
        createdAt: now.toISOString(),
      });
    }

    // Check goal progress
    for (const goal of activeGoals) {
      const daysUntilDeadline = goal.targetDate
        ? Math.ceil(
            (goal.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )
        : null;

      if (daysUntilDeadline !== null && daysUntilDeadline <= 7 && goal.progress < 80) {
        attentionItems.push({
          id: `goal-${goal.id}`,
          message: `Goal "${goal.title}" at ${goal.progress}% with ${daysUntilDeadline} days remaining`,
          type: 'goal',
          severity: goal.progress < 50 ? 'critical' : 'warning',
          progress: goal.progress,
        });
      }
    }

    // Generate learning patterns
    const patterns: LearningPattern[] = [];

    // Best study time pattern
    patterns.push({
      id: 'best-time',
      label: 'Best focus time',
      value: optimalStudyTime,
      type: 'strength',
      description: 'Based on your most productive sessions',
    });

    // Average quiz score pattern
    const avgQuizScore = quizAttempts.length > 0
      ? Math.round(
          quizAttempts.reduce((sum, q) => sum + (q.scorePercentage ?? 0), 0) / quizAttempts.length
        )
      : null;

    if (avgQuizScore !== null) {
      patterns.push({
        id: 'quiz-avg',
        label: 'Average quiz score',
        value: `${avgQuizScore}%`,
        type: avgQuizScore >= 80 ? 'strength' : avgQuizScore >= 60 ? 'neutral' : 'improvement',
        description: avgQuizScore >= 80 ? 'Excellent retention!' : 'Room for improvement',
      });
    }

    // Study consistency pattern
    const activeDaysThisMonth = new Set(
      studySessions
        .filter((s) => s.startTime >= oneWeekAgo)
        .map((s) => s.startTime.toDateString())
    ).size;

    patterns.push({
      id: 'consistency',
      label: 'Weekly activity',
      value: `${activeDaysThisMonth}/7 days`,
      type: activeDaysThisMonth >= 5 ? 'strength' : activeDaysThisMonth >= 3 ? 'neutral' : 'improvement',
      description: activeDaysThisMonth >= 5 ? 'Great consistency!' : 'Try to study more regularly',
    });

    // Add spaced repetition suggestion if relevant
    const lastReviewedTopics = userProgress
      .filter(
        (p) =>
          p.isCompleted &&
          p.updatedAt < new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
      )
      .slice(0, 3);

    if (lastReviewedTopics.length > 0) {
      insights.push({
        id: 'spaced-repetition',
        type: 'tip',
        priority: 'medium',
        title: 'Spaced repetition reminder',
        description: `You haven&apos;t reviewed ${lastReviewedTopics.length} topics in over 5 days. A quick review can boost retention by 40%.`,
        icon: 'Brain',
        color: '#8B5CF6',
        createdAt: now.toISOString(),
        action: {
          label: 'Quick Review',
          type: 'navigate',
        },
      });
    }

    // Calculate overall scores
    const totalStudyMinutes = studySessions.reduce(
      (sum, s) => sum + getSessionDuration(s),
      0
    );
    const weeklyStudyHours = totalStudyMinutes / 60 / 4; // Over 4 weeks

    // Learning score (0-100) based on multiple factors
    const streakScore = Math.min((streakData?.currentStreak ?? 0) * 5, 25);
    const consistencyScore = Math.min(activeDaysThisMonth * 5, 25);
    const progressScore = Math.min(
      enrollments.length > 0
        ? (totalLessonsCompleted / (enrollments.length * 20)) * 25
        : 0,
      25
    );
    const quizScoreContribution = Math.min(((avgQuizScore ?? 0) / 100) * 25, 25);
    const learningScore = Math.round(
      streakScore + consistencyScore + progressScore + quizScoreContribution
    );

    // Engagement level
    const engagementLevel: 'high' | 'medium' | 'low' =
      activeDaysThisMonth >= 5 ? 'high' : activeDaysThisMonth >= 3 ? 'medium' : 'low';

    // Progress rate
    const avgProgressDelta =
      enrollments.length > 0
        ? insights.filter((i) => i.type === 'warning' && i.id.startsWith('behind-')).length /
          enrollments.length
        : 0;
    const progressRate: 'ahead' | 'on_track' | 'behind' =
      avgProgressDelta < 0.2 ? 'ahead' : avgProgressDelta < 0.5 ? 'on_track' : 'behind';

    // Find focus area (course needing most attention)
    const courseBehind = insights.find(
      (i) => i.type === 'warning' && i.id.startsWith('behind-')
    );
    const focusArea = courseBehind?.courseName;

    // Sort insights by priority
    insights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Sort suggested actions by priority
    suggestedActions.sort((a, b) => a.priority - b.priority);

    const response: SAMInsightsResponse = {
      insights: insights.slice(0, 5),
      patterns,
      attentionItems: attentionItems.slice(0, 5),
      suggestedActions: suggestedActions.slice(0, 3),
      optimalStudyTime,
      focusArea,
      learningScore,
      engagementLevel,
      progressRate,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('SAM Insights API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch SAM insights',
        },
      },
      { status: 500 }
    );
  }
}
