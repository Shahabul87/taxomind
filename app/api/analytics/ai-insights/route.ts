import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

// ==========================================
// AI-Powered Analytics Insights API
// ==========================================
// Uses SAM + Claude to generate personalized learning insights

const RequestSchema = z.object({
  view: z.enum(['learner', 'creator', 'all']).default('all'),
  focusArea: z.enum(['progress', 'performance', 'engagement', 'cognitive', 'recommendations']).optional(),
});

interface LearningData {
  coursesEnrolled: number;
  coursesCompleted: number;
  overallProgress: number;
  studyStreak: number;
  averageScore: number | null;
  bloomsLevel: string;
  cognitiveScore: number;
  totalTimeSpent: number;
  examPerformance: {
    totalAttempts: number;
    passRate: number;
    averageScore: number;
  };
}

interface CreatorData {
  coursesCreated: number;
  publishedCourses: number;
  totalEnrollments: number;
  totalCompletions: number;
  completionRate: number;
  averageRating: number;
}

interface AIInsight {
  id: string;
  type: 'strength' | 'improvement' | 'recommendation' | 'warning' | 'achievement';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  action?: {
    label: string;
    href: string;
  };
  metric?: {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'stable';
  };
}

export async function GET(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'ai');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = RequestSchema.parse({
      view: searchParams.get('view') || 'all',
      focusArea: searchParams.get('focusArea') || undefined,
    });

    // Gather user data
    const learningData = await gatherLearningData(user.id);
    const creatorData = await gatherCreatorData(user.id);

    // Generate AI insights based on data
    const insights = await withRetryableTimeout(
      () => generateAIInsights(
        learningData,
        creatorData,
        params.view,
        params.focusArea,
        user.id
      ),
      TIMEOUT_DEFAULTS.AI_ANALYSIS,
      'analyticsAIInsights'
    );

    return NextResponse.json({
      success: true,
      insights,
      metadata: {
        userId: user.id,
        generatedAt: new Date().toISOString(),
        view: params.view,
        focusArea: params.focusArea,
        hasLearningData: learningData.coursesEnrolled > 0,
        hasCreatorData: creatorData.coursesCreated > 0,
      },
    });
  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('Operation timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json({ error: 'Operation timed out. Please try again.' }, { status: 504 });
    }

    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('AI insights error:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

async function gatherLearningData(userId: string): Promise<LearningData> {
  // Get enrollments
  const enrollments = await db.enrollment.findMany({
    where: { userId },
    take: 200,
  });

  // Get progress records
  const progressRecords = await db.user_progress.findMany({
    where: { userId },
    take: 500,
  });

  // Get exam attempts
  const examAttempts = await db.userExamAttempt.findMany({
    where: { userId, status: 'GRADED' },
    take: 500,
  });

  // Calculate metrics
  const totalSections = progressRecords.length;
  const completedSections = progressRecords.filter((r) => r.isCompleted).length;
  const overallProgress = totalSections > 0 ? (completedSections / totalSections) * 100 : 0;

  // Calculate course completions
  const courseProgressMap = new Map<string, { completed: number; total: number }>();
  progressRecords.forEach((record) => {
    if (record.courseId) {
      const current = courseProgressMap.get(record.courseId) || { completed: 0, total: 0 };
      current.total += 1;
      if (record.isCompleted) current.completed += 1;
      courseProgressMap.set(record.courseId, current);
    }
  });

  const coursesCompleted = Array.from(courseProgressMap.values()).filter(
    (stats) => stats.completed === stats.total && stats.total > 0
  ).length;

  // Calculate study streak
  const studyStreak = Math.max(...progressRecords.map((r) => r.currentStreak), 0);

  // Calculate exam performance
  const gradedExams = examAttempts.filter((a) => a.scorePercentage !== null);
  const averageExamScore =
    gradedExams.length > 0
      ? gradedExams.reduce((sum, a) => sum + (a.scorePercentage || 0), 0) / gradedExams.length
      : 0;
  const passedExams = gradedExams.filter((a) => a.isPassed).length;
  const passRate = gradedExams.length > 0 ? (passedExams / gradedExams.length) * 100 : 0;

  // Calculate cognitive score
  const cognitiveScore = Math.min(
    100,
    Math.round((averageExamScore * 0.6 + overallProgress * 0.4))
  );

  // Determine Bloom's level
  let bloomsLevel = 'Remember';
  if (cognitiveScore >= 90) bloomsLevel = 'Create';
  else if (cognitiveScore >= 75) bloomsLevel = 'Evaluate';
  else if (cognitiveScore >= 60) bloomsLevel = 'Analyze';
  else if (cognitiveScore >= 45) bloomsLevel = 'Apply';
  else if (cognitiveScore >= 30) bloomsLevel = 'Understand';

  // Calculate total time
  const totalTimeSpent = progressRecords.reduce((sum, r) => sum + r.timeSpent, 0);

  return {
    coursesEnrolled: enrollments.length,
    coursesCompleted,
    overallProgress: Math.round(overallProgress),
    studyStreak,
    averageScore: gradedExams.length > 0 ? Math.round(averageExamScore * 10) / 10 : null,
    bloomsLevel,
    cognitiveScore,
    totalTimeSpent,
    examPerformance: {
      totalAttempts: examAttempts.length,
      passRate: Math.round(passRate),
      averageScore: Math.round(averageExamScore),
    },
  };
}

async function gatherCreatorData(userId: string): Promise<CreatorData> {
  // Get courses created
  const courses = await db.course.findMany({
    where: { userId },
    include: {
      Enrollment: true,
      reviews: true,
    },
    take: 200,
  });

  const publishedCourses = courses.filter((c) => c.isPublished).length;
  const totalEnrollments = courses.reduce((sum, c) => sum + c.Enrollment.length, 0);

  // Get completion data
  const courseIds = courses.map((c) => c.id);
  const progressRecords = await db.user_progress.findMany({
    where: { courseId: { in: courseIds } },
    take: 500,
  });

  // Calculate completions
  const userCourseProgress = new Map<string, { completed: number; total: number }>();
  progressRecords.forEach((record) => {
    if (record.courseId && record.userId) {
      const key = `${record.userId}:${record.courseId}`;
      const current = userCourseProgress.get(key) || { completed: 0, total: 0 };
      current.total += 1;
      if (record.isCompleted) current.completed += 1;
      userCourseProgress.set(key, current);
    }
  });

  const totalCompletions = Array.from(userCourseProgress.values()).filter(
    (stats) => stats.completed === stats.total && stats.total > 0
  ).length;

  const completionRate =
    totalEnrollments > 0 ? Math.round((totalCompletions / totalEnrollments) * 100) : 0;

  // Calculate average rating
  const allRatings = courses.flatMap((c) => c.reviews.map((r) => r.rating));
  const averageRating =
    allRatings.length > 0
      ? Math.round((allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length) * 10) / 10
      : 0;

  return {
    coursesCreated: courses.length,
    publishedCourses,
    totalEnrollments,
    totalCompletions,
    completionRate,
    averageRating,
  };
}

async function generateAIInsights(
  learningData: LearningData,
  creatorData: CreatorData,
  view: string,
  focusArea?: string,
  userId?: string
): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];

  // Generate rule-based insights first (fast, no API call needed)
  insights.push(...generateRuleBasedInsights(learningData, creatorData, view));

  // Try to enhance with AI
  try {
    const aiEnhancedInsights = await generateClaudeInsights(
      learningData,
      creatorData,
      view,
      focusArea,
      userId
    );
    insights.push(...aiEnhancedInsights);
  } catch (error) {
    logger.error('AI insights error:', error);
    // Continue with rule-based insights
  }

  // Sort by priority and limit
  return insights
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 8);
}

function generateRuleBasedInsights(
  learningData: LearningData,
  creatorData: CreatorData,
  view: string
): AIInsight[] {
  const insights: AIInsight[] = [];

  // Learning insights
  if (view === 'all' || view === 'learner') {
    // Study streak insight
    if (learningData.studyStreak > 7) {
      insights.push({
        id: 'streak-achievement',
        type: 'achievement',
        title: `${learningData.studyStreak} Day Learning Streak!`,
        description: 'Amazing consistency! Keep up the great work to maintain your learning momentum.',
        priority: 'high',
        actionable: true,
        action: { label: 'Continue Learning', href: '/learn' },
        metric: { label: 'Current Streak', value: `${learningData.studyStreak} days`, trend: 'up' },
      });
    } else if (learningData.studyStreak === 0) {
      insights.push({
        id: 'streak-reminder',
        type: 'recommendation',
        title: 'Start Your Learning Streak Today',
        description: 'Regular practice leads to better retention. Begin a new streak today!',
        priority: 'medium',
        actionable: true,
        action: { label: 'Start Learning', href: '/learn' },
      });
    }

    // Cognitive level insight
    if (learningData.cognitiveScore >= 75) {
      insights.push({
        id: 'cognitive-strength',
        type: 'strength',
        title: `Advanced Thinker - ${learningData.bloomsLevel} Level`,
        description: `You&apos;re operating at the ${learningData.bloomsLevel} level of Bloom&apos;s Taxonomy, showing strong analytical skills.`,
        priority: 'medium',
        actionable: false,
        metric: { label: 'Cognitive Score', value: `${learningData.cognitiveScore}%`, trend: 'up' },
      });
    } else if (learningData.cognitiveScore < 50 && learningData.coursesEnrolled > 0) {
      insights.push({
        id: 'cognitive-improvement',
        type: 'improvement',
        title: 'Room for Cognitive Growth',
        description: 'Focus on higher-order thinking questions to advance to the next Bloom&apos;s level.',
        priority: 'medium',
        actionable: true,
        action: { label: 'Practice Exams', href: '/learn' },
      });
    }

    // Exam performance insight
    if (learningData.examPerformance.passRate >= 80) {
      insights.push({
        id: 'exam-excellence',
        type: 'achievement',
        title: 'Excellent Exam Performance',
        description: `With an ${learningData.examPerformance.passRate}% pass rate, you&apos;re mastering the material effectively.`,
        priority: 'low',
        actionable: false,
        metric: { label: 'Pass Rate', value: `${learningData.examPerformance.passRate}%` },
      });
    } else if (learningData.examPerformance.passRate < 60 && learningData.examPerformance.totalAttempts > 2) {
      insights.push({
        id: 'exam-improvement',
        type: 'warning',
        title: 'Exam Performance Needs Attention',
        description: 'Review the material before retaking exams. Consider using study guides and practice questions.',
        priority: 'high',
        actionable: true,
        action: { label: 'Review Material', href: '/learn' },
      });
    }

    // Progress insight
    if (learningData.overallProgress >= 80 && learningData.coursesEnrolled > 0) {
      insights.push({
        id: 'near-completion',
        type: 'recommendation',
        title: 'Almost There!',
        description: `You&apos;re ${learningData.overallProgress}% through your courses. Push to complete and earn your certificates!`,
        priority: 'high',
        actionable: true,
        action: { label: 'Complete Courses', href: '/my-courses' },
      });
    }
  }

  // Creator insights
  if (view === 'all' || view === 'creator') {
    if (creatorData.coursesCreated > 0) {
      // Course publication insight
      if (creatorData.publishedCourses === 0) {
        insights.push({
          id: 'publish-course',
          type: 'recommendation',
          title: 'Publish Your First Course',
          description: 'You have unpublished courses ready. Share your knowledge with the world!',
          priority: 'high',
          actionable: true,
          action: { label: 'Manage Courses', href: '/teacher/courses' },
        });
      }

      // Enrollment insight
      if (creatorData.totalEnrollments > 10) {
        insights.push({
          id: 'enrollment-success',
          type: 'achievement',
          title: `${creatorData.totalEnrollments} Learners Enrolled!`,
          description: 'Your courses are helping learners grow. Keep creating great content!',
          priority: 'medium',
          actionable: false,
          metric: { label: 'Total Enrollments', value: `${creatorData.totalEnrollments}` },
        });
      }

      // Completion rate insight
      if (creatorData.completionRate < 50 && creatorData.totalEnrollments > 5) {
        insights.push({
          id: 'completion-rate-warning',
          type: 'improvement',
          title: 'Improve Course Completion Rate',
          description: 'Consider breaking down content into smaller sections or adding interactive elements.',
          priority: 'medium',
          actionable: true,
          action: { label: 'View Analytics', href: '/my-courses/analytics' },
          metric: { label: 'Completion Rate', value: `${creatorData.completionRate}%`, trend: 'down' },
        });
      }

      // Rating insight
      if (creatorData.averageRating >= 4.5) {
        insights.push({
          id: 'high-rating',
          type: 'achievement',
          title: 'Highly Rated Creator',
          description: `Your courses have an average rating of ${creatorData.averageRating}/5. Excellent work!`,
          priority: 'low',
          actionable: false,
          metric: { label: 'Average Rating', value: `${creatorData.averageRating}/5` },
        });
      }
    }
  }

  return insights;
}

async function generateClaudeInsights(
  learningData: LearningData,
  creatorData: CreatorData,
  view: string,
  focusArea?: string,
  userId?: string
): Promise<AIInsight[]> {
  const prompt = `You are SAM, an AI learning assistant. Analyze this learner's data and provide 2-3 personalized insights.

Learning Data:
- Courses Enrolled: ${learningData.coursesEnrolled}
- Courses Completed: ${learningData.coursesCompleted}
- Overall Progress: ${learningData.overallProgress}%
- Study Streak: ${learningData.studyStreak} days
- Bloom's Taxonomy Level: ${learningData.bloomsLevel}
- Cognitive Score: ${learningData.cognitiveScore}%
- Exam Pass Rate: ${learningData.examPerformance.passRate}%
- Average Exam Score: ${learningData.examPerformance.averageScore}%

Creator Data:
- Courses Created: ${creatorData.coursesCreated}
- Published: ${creatorData.publishedCourses}
- Total Enrollments: ${creatorData.totalEnrollments}
- Completion Rate: ${creatorData.completionRate}%
- Average Rating: ${creatorData.averageRating}/5

View: ${view}
Focus Area: ${focusArea || 'general'}

Provide insights in this JSON format:
[
  {
    "id": "unique-id",
    "type": "strength|improvement|recommendation",
    "title": "Short title",
    "description": "Detailed personalized insight (1-2 sentences)",
    "priority": "high|medium|low"
  }
]

Focus on actionable, specific insights based on the data. Be encouraging but honest.`;

  try {
    const responseText = await runSAMChatWithPreference({
      userId: userId ?? 'system',
      capability: 'analysis',
      maxTokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });
    if (responseText) {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const aiInsights = JSON.parse(jsonMatch[0]) as Array<{
          id: string;
          type: 'strength' | 'improvement' | 'recommendation';
          title: string;
          description: string;
          priority: 'high' | 'medium' | 'low';
        }>;

        return aiInsights.map((insight) => ({
          ...insight,
          id: `ai-${insight.id}`,
          actionable: insight.type === 'recommendation',
        }));
      }
    }
  } catch (error) {
    logger.error('AI API error:', error);
  }

  return [];
}
