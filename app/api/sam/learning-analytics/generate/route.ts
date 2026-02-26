/**
 * Learning Analytics Generation API
 *
 * Generates comprehensive learning analytics based on user preferences.
 * Aggregates data from multiple sources and returns formatted analytics.
 *
 * Uses SSE (Server-Sent Events) for real-time progress updates.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// =============================================================================
// VALIDATION
// =============================================================================

const GenerateRequestSchema = z.object({
  scope: z.enum(['course', 'skills', 'goals', 'comprehensive']),
  courseId: z.string().optional(),
  timeRange: z.enum(['7d', '30d', '90d', 'all']),
  metricFocus: z.enum(['progress', 'time', 'mastery', 'engagement', 'all']),
  includeRecommendations: z.boolean().default(true),
});

// =============================================================================
// TYPES
// =============================================================================

interface ProgressEvent {
  stage:
    | 'starting'
    | 'fetching'
    | 'analyzing'
    | 'generating'
    | 'complete';
  percent: number;
  message: string;
}

interface LearningAnalyticsResult {
  scope: string;
  timeRange: string;
  generatedAt: string;

  overview: {
    totalCourses: number;
    totalHoursLearned: number;
    currentStreak: number;
    longestStreak: number;
    totalPoints: number;
    level: number;
  };

  progress: {
    completionRate: number;
    chaptersCompleted: number;
    sectionsCompleted: number;
    assessmentsPassed: number;
    progressTrend: 'up' | 'down' | 'stable';
    progressByDay: Array<{ date: string; progress: number }>;
  };

  mastery: {
    bloomsDistribution: Record<string, number>;
    averageMasteryLevel: number;
    skillsInProgress: number;
    skillsMastered: number;
    weakAreas: string[];
    strongAreas: string[];
  };

  engagement: {
    averageSessionDuration: number;
    sessionsPerWeek: number;
    mostActiveDay: string;
    mostActiveTime: string;
    engagementTrend: 'up' | 'down' | 'stable';
  };

  goals?: {
    activeGoals: number;
    completedGoals: number;
    goalProgress: Array<{
      id: string;
      title: string;
      progress: number;
      dueDate?: string;
    }>;
  };

  recommendations?: string[];

  comparison?: {
    previousPeriod: {
      progressDelta: number;
      timeDelta: number;
      engagementDelta: number;
    };
  };

  courseDetails?: {
    id: string;
    title: string;
    progress: number;
    chaptersTotal: number;
    chaptersCompleted: number;
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function getDateRange(timeRange: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  switch (timeRange) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case 'all':
      startDate.setFullYear(2020); // Far enough back
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  return { startDate, endDate };
}

function calculateTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
  const threshold = 0.05; // 5% threshold
  const change = previous > 0 ? (current - previous) / previous : 0;

  if (change > threshold) return 'up';
  if (change < -threshold) return 'down';
  return 'stable';
}

function formatProgressByDay(
  interactions: Array<{ createdAt: Date }>,
  startDate: Date,
  endDate: Date
): Array<{ date: string; progress: number }> {
  const dayMap = new Map<string, number>();

  // Initialize all days in range with 0
  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    dayMap.set(dateStr, 0);
    current.setDate(current.getDate() + 1);
  }

  // Count interactions per day
  for (const interaction of interactions) {
    const dateStr = interaction.createdAt.toISOString().split('T')[0];
    dayMap.set(dateStr, (dayMap.get(dateStr) ?? 0) + 1);
  }

  // Convert to array and sort
  return Array.from(dayMap.entries())
    .map(([date, count]) => ({ date, progress: count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getDayName(date: Date): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
    date.getDay()
  ];
}

function getTimeOfDay(date: Date): string {
  const hour = date.getHours();
  if (hour < 6) return 'Night';
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  if (hour < 21) return 'Evening';
  return 'Night';
}

/** Derive a numeric mastery level (0-10) from SkillMastery10K proficiency data */
const PROFICIENCY_LEVEL_MAP: Record<string, number> = {
  BEGINNER: 1,
  NOVICE: 2,
  INTERMEDIATE: 3,
  COMPETENT: 4,
  PROFICIENT: 5,
  ADVANCED: 6,
  EXPERT: 7,
  MASTER: 8,
};

function getSkillMasteryLevel(skill: { proficiencyLevel: string; progressPercentage: number }): number {
  return PROFICIENCY_LEVEL_MAP[skill.proficiencyLevel] ?? Math.round(skill.progressPercentage / 12.5);
}

function getSkillDisplayName(skill: { skillName: string; skill: { name: string } | null }): string {
  return skill.skill?.name ?? skill.skillName;
}

async function generateRecommendations(
  analytics: Partial<LearningAnalyticsResult>
): Promise<string[]> {
  const recommendations: string[] = [];

  // Streak-based recommendations
  if ((analytics.overview?.currentStreak ?? 0) === 0) {
    recommendations.push('Start a learning streak today! Consistency is key to mastery.');
  } else if ((analytics.overview?.currentStreak ?? 0) < 7) {
    recommendations.push(
      `You're on a ${analytics.overview?.currentStreak}-day streak! Keep it up for 7 days to form a habit.`
    );
  }

  // Progress-based recommendations
  if ((analytics.progress?.completionRate ?? 0) < 50) {
    recommendations.push('Try focusing on one course at a time to improve completion rates.');
  }

  // Engagement-based recommendations
  if ((analytics.engagement?.sessionsPerWeek ?? 0) < 3) {
    recommendations.push(
      'Aim for at least 3 study sessions per week for optimal learning retention.'
    );
  }

  // Mastery-based recommendations
  if (analytics.mastery?.weakAreas && analytics.mastery.weakAreas.length > 0) {
    recommendations.push(
      `Consider revisiting: ${analytics.mastery.weakAreas.slice(0, 3).join(', ')}`
    );
  }

  // Time-based recommendations
  if ((analytics.engagement?.averageSessionDuration ?? 0) < 15) {
    recommendations.push(
      'Try extending your study sessions to 25-30 minutes for deeper learning.'
    );
  } else if ((analytics.engagement?.averageSessionDuration ?? 0) > 60) {
    recommendations.push(
      'Consider breaking your study sessions into 45-minute blocks with short breaks.'
    );
  }

  // Goals-based recommendations
  if ((analytics.goals?.activeGoals ?? 0) === 0 && analytics.goals !== undefined) {
    recommendations.push('Set a learning goal to stay motivated and track your progress!');
  }

  // Default recommendation if none generated
  if (recommendations.length === 0) {
    recommendations.push('Keep up the great work! Your learning habits are on track.');
  }

  return recommendations.slice(0, 5); // Max 5 recommendations
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const parsed = GenerateRequestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid parameters', details: parsed.error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { scope, courseId, timeRange, metricFocus, includeRecommendations } = parsed.data;
    const { startDate, endDate } = getDateRange(timeRange);

    logger.info('[LearningAnalytics] Generating analytics', {
      userId: user.id,
      scope,
      courseId,
      timeRange,
      metricFocus,
    });

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const sendEvent = async (event: string, data: unknown) => {
      await writer.write(
        encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
      );
    };

    // Start async generation
    (async () => {
      try {
        // Stage 1: Starting
        await sendEvent('progress', {
          stage: 'starting',
          percent: 0,
          message: 'Initializing analytics generation...',
        } as ProgressEvent);

        // Stage 2: Fetching data
        await sendEvent('progress', {
          stage: 'fetching',
          percent: 20,
          message: 'Fetching your learning data...',
        } as ProgressEvent);

        // Fetch base data in parallel
        const [
          enrollments,
          samPoints,
          samStreak,
          samBadges,
          samInteractions,
          samAnalytics,
          learningGoals,
          skillMastery,
        ] = await Promise.all([
          // Enrollments with course details
          db.enrollment.findMany({
            where: {
              userId: user.id,
              ...(courseId && { courseId }),
            },
            include: {
              Course: {
                include: {
                  chapters: {
                    where: { isPublished: true },
                    include: {
                      sections: { where: { isPublished: true } },
                    },
                  },
                },
              },
            },
            take: 200,
          }),

          // Points
          db.sAMPoints.aggregate({
            where: {
              userId: user.id,
              ...(courseId && { courseId }),
              awardedAt: { gte: startDate, lte: endDate },
            },
            _sum: { points: true },
          }),

          // Streak
          db.sAMStreak.findUnique({
            where: { userId: user.id },
          }),

          // Badges count
          db.sAMBadge.count({
            where: { userId: user.id },
          }),

          // Interactions
          db.sAMInteraction.findMany({
            where: {
              userId: user.id,
              ...(courseId && { courseId }),
              createdAt: { gte: startDate, lte: endDate },
            },
            orderBy: { createdAt: 'desc' },
            take: 1000,
          }),

          // Analytics records
          db.sAMAnalytics.findMany({
            where: {
              userId: user.id,
              ...(courseId && { courseId }),
              recordedAt: { gte: startDate, lte: endDate },
            },
            orderBy: { recordedAt: 'desc' },
            take: 200,
          }),

          // Learning goals (if scope includes goals)
          scope === 'goals' || scope === 'comprehensive'
            ? db.sAMLearningGoal.findMany({
                where: { userId: user.id },
                include: { subGoals: true },
                take: 200,
              })
            : Promise.resolve([]),

          // Skill mastery (if scope includes skills)
          scope === 'skills' || scope === 'comprehensive'
            ? db.skillMastery10K.findMany({
                where: { userId: user.id },
                include: { skill: true },
                take: 200,
              })
            : Promise.resolve([]),
        ]);

        // Stage 3: Analyzing
        await sendEvent('progress', {
          stage: 'analyzing',
          percent: 50,
          message: 'Analyzing your learning patterns...',
        } as ProgressEvent);

        // Calculate overview metrics
        const totalPoints = samPoints._sum.points ?? 0;
        const level = Math.max(1, Math.floor(Math.sqrt(totalPoints / 100)) + 1);

        // Calculate total hours (estimate from interactions)
        const estimatedMinutesPerInteraction = 3;
        const totalMinutes = samInteractions.length * estimatedMinutesPerInteraction;
        const totalHoursLearned = Math.round(totalMinutes / 60);

        // Calculate progress metrics
        let totalChapters = 0;
        let completedChapters = 0;
        let totalSections = 0;
        let completedSections = 0;

        for (const enrollment of enrollments) {
          for (const chapter of enrollment.Course.chapters) {
            totalChapters++;
            // Check chapter progress (simplified - would need ChapterProgress table)
            const chapterProgress = 0; // Would fetch from ChapterProgress
            if (chapterProgress === 100) completedChapters++;

            totalSections += chapter.sections.length;
          }
        }

        const completionRate = totalChapters > 0
          ? Math.round((completedChapters / totalChapters) * 100)
          : 0;

        // Calculate progress by day
        const progressByDay = formatProgressByDay(samInteractions, startDate, endDate);

        // Calculate trend
        const midPoint = Math.floor(progressByDay.length / 2);
        const firstHalf = progressByDay.slice(0, midPoint).reduce((a, b) => a + b.progress, 0);
        const secondHalf = progressByDay.slice(midPoint).reduce((a, b) => a + b.progress, 0);
        const progressTrend = calculateTrend(secondHalf, firstHalf);

        // Calculate engagement metrics
        const dayDistribution = new Map<string, number>();
        const timeDistribution = new Map<string, number>();
        let totalSessionDuration = 0;

        for (const interaction of samInteractions) {
          const day = getDayName(interaction.createdAt);
          dayDistribution.set(day, (dayDistribution.get(day) ?? 0) + 1);

          const time = getTimeOfDay(interaction.createdAt);
          timeDistribution.set(time, (timeDistribution.get(time) ?? 0) + 1);

          // Estimate session duration from context
          const ctx = interaction.context as Record<string, unknown> | null;
          totalSessionDuration += (ctx?.duration as number) ?? 5;
        }

        const mostActiveDay = Array.from(dayDistribution.entries())
          .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Not enough data';

        const mostActiveTime = Array.from(timeDistribution.entries())
          .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Not enough data';

        const weeksInRange = Math.max(1, Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
        ));
        const sessionsPerWeek = Math.round(samInteractions.length / weeksInRange);

        const averageSessionDuration = samInteractions.length > 0
          ? Math.round(totalSessionDuration / samInteractions.length)
          : 0;

        // Calculate mastery metrics
        const bloomsDistribution: Record<string, number> = {
          Remember: 0,
          Understand: 0,
          Apply: 0,
          Analyze: 0,
          Evaluate: 0,
          Create: 0,
        };

        // Extract from analytics records
        for (const record of samAnalytics) {
          const ctx = record.context as Record<string, unknown> | null;
          const level = (ctx?.bloomsLevel as string) ?? 'Understand';
          if (bloomsDistribution[level] !== undefined) {
            bloomsDistribution[level]++;
          }
        }

        // Normalize to percentages
        const totalBloomsRecords = Object.values(bloomsDistribution).reduce((a, b) => a + b, 0);
        if (totalBloomsRecords > 0) {
          for (const key of Object.keys(bloomsDistribution)) {
            bloomsDistribution[key] = Math.round(
              (bloomsDistribution[key] / totalBloomsRecords) * 100
            );
          }
        }

        const skillsInProgress = skillMastery.filter((s) => getSkillMasteryLevel(s) < 5).length;
        const skillsMastered = skillMastery.filter((s) => getSkillMasteryLevel(s) >= 5).length;

        const averageMasteryLevel = skillMastery.length > 0
          ? Math.round(skillMastery.reduce((sum, s) => sum + getSkillMasteryLevel(s), 0) / skillMastery.length)
          : 0;

        // Identify weak and strong areas
        const weakAreas = skillMastery
          .filter((s) => getSkillMasteryLevel(s) < 3)
          .map((s) => getSkillDisplayName(s))
          .slice(0, 5);

        const strongAreas = skillMastery
          .filter((s) => getSkillMasteryLevel(s) >= 4)
          .map((s) => getSkillDisplayName(s))
          .slice(0, 5);

        // Stage 4: Generating result
        await sendEvent('progress', {
          stage: 'generating',
          percent: 80,
          message: 'Generating your personalized analytics...',
        } as ProgressEvent);

        // Build result
        const result: LearningAnalyticsResult = {
          scope,
          timeRange,
          generatedAt: new Date().toISOString(),

          overview: {
            totalCourses: enrollments.length,
            totalHoursLearned,
            currentStreak: samStreak?.currentStreak ?? 0,
            longestStreak: samStreak?.longestStreak ?? 0,
            totalPoints,
            level,
          },

          progress: {
            completionRate,
            chaptersCompleted: completedChapters,
            sectionsCompleted: completedSections,
            assessmentsPassed: 0, // Would need to query assessments
            progressTrend,
            progressByDay,
          },

          mastery: {
            bloomsDistribution,
            averageMasteryLevel,
            skillsInProgress,
            skillsMastered,
            weakAreas,
            strongAreas,
          },

          engagement: {
            averageSessionDuration,
            sessionsPerWeek,
            mostActiveDay,
            mostActiveTime,
            engagementTrend: progressTrend, // Same trend for now
          },
        };

        // Add goals if applicable
        if ((scope === 'goals' || scope === 'comprehensive') && learningGoals.length > 0) {
          result.goals = {
            activeGoals: learningGoals.filter((g) => g.status === 'ACTIVE').length,
            completedGoals: learningGoals.filter((g) => g.status === 'COMPLETED').length,
            goalProgress: learningGoals.map((g) => {
              const totalSubGoals = g.subGoals.length;
              const completedSubGoals = g.subGoals.filter(
                (sg) => sg.status === 'COMPLETED'
              ).length;
              const progress = totalSubGoals > 0
                ? Math.round((completedSubGoals / totalSubGoals) * 100)
                : 0;
              return {
                id: g.id,
                title: g.title,
                progress,
                dueDate: g.targetDate?.toISOString(),
              };
            }),
          };
        }

        // Add course details if specific course
        if (scope === 'course' && courseId && enrollments.length > 0) {
          const enrollment = enrollments[0];
          result.courseDetails = {
            id: enrollment.Course.id,
            title: enrollment.Course.title ?? 'Untitled Course',
            progress: completionRate,
            chaptersTotal: enrollment.Course.chapters.length,
            chaptersCompleted: completedChapters,
          };
        }

        // Generate recommendations if requested
        if (includeRecommendations) {
          result.recommendations = await generateRecommendations(result);
        }

        // Calculate comparison with previous period
        const periodLength = endDate.getTime() - startDate.getTime();
        const prevStartDate = new Date(startDate.getTime() - periodLength);
        const prevEndDate = startDate;

        const [prevInteractions, prevPoints] = await Promise.all([
          db.sAMInteraction.count({
            where: {
              userId: user.id,
              ...(courseId && { courseId }),
              createdAt: { gte: prevStartDate, lte: prevEndDate },
            },
          }),
          db.sAMPoints.aggregate({
            where: {
              userId: user.id,
              ...(courseId && { courseId }),
              awardedAt: { gte: prevStartDate, lte: prevEndDate },
            },
            _sum: { points: true },
          }),
        ]);

        const prevTotalPoints = prevPoints._sum.points ?? 0;
        const prevTotalMinutes = prevInteractions * estimatedMinutesPerInteraction;

        result.comparison = {
          previousPeriod: {
            progressDelta: totalPoints > 0 && prevTotalPoints > 0
              ? Math.round(((totalPoints - prevTotalPoints) / prevTotalPoints) * 100)
              : 0,
            timeDelta: totalMinutes > 0 && prevTotalMinutes > 0
              ? Math.round(((totalMinutes - prevTotalMinutes) / prevTotalMinutes) * 100)
              : 0,
            engagementDelta: samInteractions.length > 0 && prevInteractions > 0
              ? Math.round(((samInteractions.length - prevInteractions) / prevInteractions) * 100)
              : 0,
          },
        };

        // Stage 5: Complete
        await sendEvent('progress', {
          stage: 'complete',
          percent: 100,
          message: 'Analytics ready!',
        } as ProgressEvent);

        // Send the result
        await sendEvent('analytics', result);
        await sendEvent('done', {});

        logger.info('[LearningAnalytics] Generation complete', {
          userId: user.id,
          scope,
          totalCourses: result.overview.totalCourses,
          totalHours: result.overview.totalHoursLearned,
        });
      } catch (error) {
        logger.error('[LearningAnalytics] Generation error:', error);
        await sendEvent('error', {
          message: 'Analytics generation failed',
        });
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    logger.error('[LearningAnalytics] Request error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate analytics' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
