import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { safeErrorResponse } from '@/lib/api/safe-error';
import { db } from '@/lib/db';
import type { CourseInsightData, CourseInsight, CourseInsightMetric } from '@/components/sam/course-insights';

/**
 * GET /api/sam/course-insights
 * Returns AI-powered insights for all enrolled courses
 */
export async function GET() {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Get user's enrolled courses with progress data
    const enrollments = await db.enrollment.findMany({
      where: { userId: user.id },
      include: {
        Course: {
          include: {
            chapters: {
              include: {
                sections: {
                  include: {
                    user_progress: {
                      where: { userId: user.id },
                    },
                  },
                },
              },
              orderBy: { position: 'asc' },
            },
            category: true,
          },
        },
      },
      take: 50,
    });

    // Get user's exam attempts for mastery calculation
    // Note: Exam -> section -> chapter -> Course (no direct courseId on Exam)
    const quizResults = await db.userExamAttempt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        Exam: {
          select: {
            title: true,
            section: {
              select: {
                chapter: {
                  select: {
                    courseId: true,
                  },
                },
              },
            },
          },
        },
      },
      take: 200,
    });

    // Get user's study sessions for engagement metrics
    const studySessions = await db.learning_sessions.findMany({
      where: { userId: user.id },
      orderBy: { startTime: 'desc' },
      take: 100, // Last 100 sessions for analysis
    });

    // Get user's achievements
    const achievements = await db.user_achievements.findMany({
      where: { userId: user.id },
    });

    // Get user's learning goals (Milestone relation, not subGoals)
    const goals = await db.goal.findMany({
      where: { userId: user.id },
      include: { Milestone: true },
    });

    // Calculate insights for each course (filter out enrollments without courses)
    const courseInsights: CourseInsightData[] = enrollments
      .filter((enrollment) => enrollment.Course !== null)
      .map((enrollment) => {
      const course = enrollment.Course!;

      // Calculate total sections and completed sections
      let totalSections = 0;
      let completedSections = 0;

      course.chapters.forEach((chapter) => {
        chapter.sections.forEach((section) => {
          totalSections++;
          if (section.user_progress.some((p) => p.isCompleted)) {
            completedSections++;
          }
        });
      });

      const progress = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;

      // Calculate study time for this course
      const courseStudySessions = studySessions.filter(
        (s) => s.courseId === course.id
      );
      const studyTimeMinutes = courseStudySessions.reduce(
        (sum, s) => sum + (s.duration || 0),
        0
      );

      // Get most recent study session
      const lastStudied = courseStudySessions[0]?.startTime;

      // Calculate quiz scores for this course
      // Traverse: Exam -> section -> chapter -> courseId
      const courseQuizResults = quizResults.filter(
        (r) => r.Exam?.section?.chapter?.courseId === course.id
      );
      const averageQuizScore =
        courseQuizResults.length > 0
          ? Math.round(
              courseQuizResults.reduce((sum, r) => sum + (r.scorePercentage || 0), 0) /
                courseQuizResults.length
            )
          : undefined;

      // Calculate mastery level based on quiz scores and completion
      const masteryLevel = calculateMasteryLevel(progress, averageQuizScore);

      // Determine Bloom's level based on progress and performance
      const bloomsLevel = determineBloomsLevel(progress, averageQuizScore);

      // Calculate current streak
      const currentStreak = calculateStreak(courseStudySessions);

      // Calculate engagement score
      const engagementScore = calculateEngagementScore(
        courseStudySessions,
        progress,
        currentStreak
      );

      // Calculate learning velocity (sections per week)
      const learningVelocity = calculateLearningVelocity(
        enrollment.createdAt,
        completedSections
      );

      // Predict completion time
      const predictedCompletionDays = predictCompletion(
        totalSections - completedSections,
        learningVelocity
      );

      // Generate AI insights
      const insights = generateInsights(
        course.title,
        progress,
        engagementScore,
        averageQuizScore,
        currentStreak,
        learningVelocity,
        lastStudied
      );

      // Generate metrics
      const metrics = generateMetrics(
        learningVelocity,
        masteryLevel,
        engagementScore,
        predictedCompletionDays
      );

      // Identify strengths and areas to improve
      const { strengths, areasToImprove } = analyzePerformance(
        courseQuizResults,
        progress,
        engagementScore
      );

      // Determine next milestone
      const nextMilestone = getNextMilestone(course.chapters, completedSections);

      return {
        id: course.id,
        title: course.title,
        description: course.description ?? undefined,
        imageUrl: course.imageUrl ?? undefined,
        progress,
        totalSections,
        completedSections,
        studyTimeMinutes,
        lastStudied,
        masteryLevel,
        bloomsLevel,
        currentStreak,
        averageQuizScore,
        engagementScore,
        learningVelocity,
        predictedCompletionDays,
        insights,
        metrics,
        strengths,
        areasToImprove,
        nextMilestone,
      };
    });

    // Sort by last studied (most recent first)
    courseInsights.sort((a, b) => {
      const aTime = a.lastStudied ? new Date(a.lastStudied).getTime() : 0;
      const bTime = b.lastStudied ? new Date(b.lastStudied).getTime() : 0;
      return bTime - aTime;
    });

    return NextResponse.json({
      success: true,
      data: courseInsights,
      metadata: {
        totalCourses: courseInsights.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return safeErrorResponse(error, 500, 'SAM_COURSE_INSIGHTS');
  }
}

// Helper Functions

function calculateMasteryLevel(progress: number, quizScore?: number): number {
  const progressWeight = 0.4;
  const quizWeight = 0.6;

  if (quizScore === undefined) {
    return Math.round(progress * progressWeight);
  }

  return Math.round(progress * progressWeight + quizScore * quizWeight);
}

function determineBloomsLevel(
  progress: number,
  quizScore?: number
): 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create' {
  const mastery = calculateMasteryLevel(progress, quizScore);

  if (mastery >= 90) return 'create';
  if (mastery >= 75) return 'evaluate';
  if (mastery >= 60) return 'analyze';
  if (mastery >= 45) return 'apply';
  if (mastery >= 25) return 'understand';
  return 'remember';
}

function calculateStreak(sessions: { startTime: Date }[]): number {
  if (sessions.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let currentDate = new Date(today);

  // Check each day going backwards
  for (let i = 0; i < 365; i++) {
    const dayStart = new Date(currentDate);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    const hasSession = sessions.some((s) => {
      const sessionDate = new Date(s.startTime);
      return sessionDate >= dayStart && sessionDate <= dayEnd;
    });

    if (hasSession) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (i === 0) {
      // If no session today, allow checking yesterday
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function calculateEngagementScore(
  sessions: { startTime: Date; duration?: number | null }[],
  progress: number,
  streak: number
): number {
  // Factors: study frequency, session length, consistency, progress rate
  const recentSessions = sessions.filter((s) => {
    const diff = Date.now() - new Date(s.startTime).getTime();
    return diff < 14 * 24 * 60 * 60 * 1000; // Last 14 days
  });

  const frequencyScore = Math.min(recentSessions.length * 10, 30);
  const durationScore = Math.min(
    recentSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60,
    25
  );
  const streakScore = Math.min(streak * 5, 25);
  const progressScore = Math.min(progress * 0.2, 20);

  return Math.round(frequencyScore + durationScore + streakScore + progressScore);
}

function calculateLearningVelocity(
  enrollmentDate: Date,
  completedSections: number
): number {
  const weeksSinceEnrollment = Math.max(
    1,
    (Date.now() - new Date(enrollmentDate).getTime()) / (7 * 24 * 60 * 60 * 1000)
  );

  return Math.round((completedSections / weeksSinceEnrollment) * 10) / 10;
}

function predictCompletion(
  remainingSections: number,
  velocity: number
): number | undefined {
  if (velocity <= 0 || remainingSections === 0) return undefined;

  const weeksRemaining = remainingSections / Math.max(velocity, 0.1);
  return Math.round(weeksRemaining * 7);
}

function generateInsights(
  courseTitle: string,
  progress: number,
  engagement: number,
  quizScore: number | undefined,
  streak: number,
  velocity: number,
  lastStudied: Date | undefined
): CourseInsight[] {
  const insights: CourseInsight[] = [];

  // Check for at-risk indicators
  if (lastStudied) {
    const daysSinceStudy = Math.floor(
      (Date.now() - new Date(lastStudied).getTime()) / (24 * 60 * 60 * 1000)
    );
    if (daysSinceStudy >= 3) {
      insights.push({
        id: 'inactive-warning',
        type: 'warning',
        title: 'Course at risk',
        description: `You haven&apos;t studied this course in ${daysSinceStudy} days`,
        priority: 'high',
        actionable: true,
        action: { label: 'Resume Now', href: `/courses/${courseTitle}` },
      });
    }
  }

  // Engagement warning
  if (engagement < 50) {
    insights.push({
      id: 'low-engagement',
      type: 'warning',
      title: 'Engagement declining',
      description: 'Your study frequency has decreased recently',
      priority: 'high',
      actionable: true,
      action: { label: 'Schedule Study', href: '/schedule' },
    });
  }

  // Velocity warning
  if (velocity < 1 && progress < 90) {
    insights.push({
      id: 'slow-velocity',
      type: 'improvement',
      title: 'Learning pace is slow',
      description: 'Consider dedicating more time to make faster progress',
      priority: 'medium',
    });
  }

  // Quiz performance insights
  if (quizScore !== undefined) {
    if (quizScore >= 85) {
      insights.push({
        id: 'strong-performance',
        type: 'strength',
        title: 'Excellent understanding',
        description: 'Your quiz scores show strong grasp of the material',
        priority: 'low',
      });
    } else if (quizScore < 70) {
      insights.push({
        id: 'review-needed',
        type: 'improvement',
        title: 'Review recommended',
        description: 'Consider revisiting challenging topics before moving on',
        priority: 'medium',
        actionable: true,
        action: { label: 'Review Topics', href: '/practice' },
      });
    }
  }

  // Streak achievements
  if (streak >= 7) {
    insights.push({
      id: 'streak-achievement',
      type: 'achievement',
      title: `${streak}-day streak!`,
      description: 'Great consistency - keep up the momentum',
      priority: 'low',
    });
  }

  // Near completion
  if (progress >= 90 && progress < 100) {
    insights.push({
      id: 'near-completion',
      type: 'achievement',
      title: 'Almost there!',
      description: `Just ${100 - progress}% left to complete this course`,
      priority: 'high',
    });
  }

  // Completed
  if (progress >= 100) {
    insights.push({
      id: 'completed',
      type: 'achievement',
      title: 'Course completed!',
      description: 'Congratulations on finishing this course',
      priority: 'high',
    });
  }

  return insights;
}

function generateMetrics(
  velocity: number,
  mastery: number,
  engagement: number,
  predictedDays: number | undefined
): CourseInsightMetric[] {
  const velocityTrend: 'up' | 'down' | 'stable' =
    velocity >= 3 ? 'up' : velocity >= 1 ? 'stable' : 'down';
  const masteryTrend: 'up' | 'down' | 'stable' =
    mastery >= 70 ? 'up' : mastery >= 40 ? 'stable' : 'down';
  const engagementTrend: 'up' | 'down' | 'stable' =
    engagement >= 70 ? 'up' : engagement >= 40 ? 'stable' : 'down';

  return [
    {
      label: 'Velocity',
      value: `${velocity}x`,
      trend: velocityTrend,
      color: velocityTrend === 'up' ? 'text-emerald-600' : velocityTrend === 'down' ? 'text-red-500' : undefined,
    },
    {
      label: 'Mastery',
      value: `${mastery}%`,
      trend: masteryTrend,
    },
    {
      label: 'Engagement',
      value: `${engagement}%`,
      trend: engagementTrend,
    },
    {
      label: 'Est. Completion',
      value: predictedDays ? `${predictedDays}d` : '—',
      color: predictedDays && predictedDays <= 14 ? 'text-emerald-600' : predictedDays && predictedDays >= 60 ? 'text-amber-600' : undefined,
    },
  ];
}

function analyzePerformance(
  quizResults: { scorePercentage?: number | null; Exam?: { title?: string | null } | null }[],
  progress: number,
  engagement: number
): { strengths: string[]; areasToImprove: string[] } {
  const strengths: string[] = [];
  const areasToImprove: string[] = [];

  // Analyze quiz results by exam/topic
  const topicScores = new Map<string, number[]>();
  quizResults.forEach((r) => {
    const topic = r.Exam?.title;
    if (topic && r.scorePercentage !== null && r.scorePercentage !== undefined) {
      const scores = topicScores.get(topic) || [];
      scores.push(r.scorePercentage);
      topicScores.set(topic, scores);
    }
  });

  topicScores.forEach((scores, topic) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg >= 80) {
      strengths.push(topic);
    } else if (avg < 60) {
      areasToImprove.push(topic);
    }
  });

  // Add general observations
  if (progress >= 50 && strengths.length === 0) {
    strengths.push('Consistent progress');
  }
  if (engagement >= 70 && strengths.length < 3) {
    strengths.push('Strong engagement');
  }

  if (engagement < 50 && areasToImprove.length < 3) {
    areasToImprove.push('Study consistency');
  }

  return {
    strengths: strengths.slice(0, 3),
    areasToImprove: areasToImprove.slice(0, 3),
  };
}

interface ChapterWithSections {
  id: string;
  title: string;
  sections: { id: string; title: string; user_progress: { isCompleted: boolean }[] }[];
}

function getNextMilestone(
  chapters: ChapterWithSections[],
  completedSections: number
): { title: string; progress: number; target: number } | undefined {
  // Find the current chapter being worked on
  let sectionCount = 0;
  for (const chapter of chapters) {
    const chapterSectionCount = chapter.sections.length;
    const completedInChapter = chapter.sections.filter((s) =>
      s.user_progress.some((p) => p.isCompleted)
    ).length;

    if (completedInChapter < chapterSectionCount) {
      return {
        title: `Complete: ${chapter.title}`,
        progress: completedInChapter,
        target: chapterSectionCount,
      };
    }

    sectionCount += chapterSectionCount;
  }

  // All chapters complete
  return undefined;
}
