import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await request.json();

    // Generate comprehensive student insights
    const insights = await generateStudentInsights(studentId);

    return NextResponse.json(insights);

  } catch (error) {
    logger.error('Student insights generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate student insights' },
      { status: 500 }
    );
  }
}

async function generateStudentInsights(studentId: string): Promise<any> {
  try {
    const [enrollments, streak, latestProgress, examAttempts, activityLogs, alerts, performanceMetrics] =
      await Promise.all([
        db.enrollment.findMany({
          where: { userId: studentId },
          select: { courseId: true },
        }),
        db.sAMStreak.findUnique({
          where: { userId: studentId },
          select: { currentStreak: true, lastActivityDate: true },
        }),
        db.studentBloomsProgress.findFirst({
          where: { userId: studentId },
          orderBy: { updatedAt: 'desc' },
        }),
        db.userExamAttempt.findMany({
          where: { userId: studentId, status: 'SUBMITTED' },
          orderBy: { submittedAt: 'desc' },
          select: {
            scorePercentage: true,
            isPassed: true,
            submittedAt: true,
            Exam: {
              select: {
                section: {
                  select: {
                    chapter: {
                      select: { courseId: true },
                    },
                  },
                },
              },
            },
          },
          take: 50,
        }),
        db.learningActivityLog.findMany({
          where: { userId: studentId },
          orderBy: { createdAt: 'desc' },
          take: 200,
          select: {
            createdAt: true,
            duration: true,
            contentType: true,
            bloomsLevel: true,
          },
        }),
        db.userProgressAlert.findMany({
          where: { userId: studentId, isDismissed: false },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        db.bloomsPerformanceMetric.findMany({
          where: { userId: studentId },
          orderBy: { recordedAt: 'desc' },
          take: 20,
        }),
      ]);

    const totalCourses = enrollments.length;
    const completedCourses = new Set(
      examAttempts
        .filter((attempt) => attempt.isPassed && attempt.Exam?.section?.chapter?.courseId)
        .map((attempt) => attempt.Exam?.section?.chapter?.courseId)
        .filter(Boolean)
    ).size;

    const scores = examAttempts.map((attempt) => attempt.scorePercentage).filter((score) => typeof score === 'number') as number[];
    const averageScore = scores.length
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;

    const totalTimeSpentMinutes = activityLogs.reduce((sum, log) => sum + (log.duration ?? 0) / 60, 0);
    const lastActive = activityLogs[0]?.createdAt ?? streak?.lastActivityDate ?? null;

    const preferredTimeOfDay = derivePreferredTimeOfDay(activityLogs.map((log) => log.createdAt));
    const averageSessionLength = activityLogs.length
      ? Math.round(totalTimeSpentMinutes / activityLogs.length)
      : 0;

    const engagementLevel = getEngagementLevel(activityLogs.length);
    const retentionRate = calculateRetentionRate(activityLogs.map((log) => log.createdAt));
    const preferredContentType = mostCommon(activityLogs.map((log) => log.contentType).filter(Boolean) as string[]);

    const strengths = normalizeTopicScores(latestProgress?.strengthAreas);
    const weaknesses = normalizeTopicScores(latestProgress?.weaknessAreas);

    const recommendations = generateRecommendations({
      performance: { weaknesses },
      learningPatterns: { engagementLevel },
    });

    const progressTrends = buildProgressTrends(examAttempts, activityLogs);
    const bloomsTaxonomy = deriveBloomsTaxonomy(latestProgress?.bloomsScores, performanceMetrics);

    return {
      studentId,
      overview: {
        totalCourses,
        completedCourses,
        averageScore,
        totalTimeSpent: Math.round(totalTimeSpentMinutes / 60), // hours
        lastActive: lastActive ? new Date(lastActive).toISOString() : null,
        streakDays: streak?.currentStreak ?? 0,
      },
      performance: {
        strengths,
        weaknesses,
      },
      learningPatterns: {
        preferredTimeOfDay,
        averageSessionLength,
        engagementLevel,
        retentionRate,
        preferredContentType,
        strugglingConcepts: weaknesses.map((item) => item.topic).slice(0, 5),
      },
      recommendations,
      alerts: alerts.map((alert) => ({
        type: alert.alertType.toLowerCase(),
        message: alert.message,
        severity: alert.severity.toLowerCase(),
        timestamp: alert.createdAt.toISOString(),
      })),
      progressTrends,
      bloomsTaxonomy,
    };

  } catch (error) {
    logger.error('Error generating student insights:', error);
    throw error;
  }
}

// Helper function to analyze learning patterns
function derivePreferredTimeOfDay(dates: Date[]): string {
  if (!dates.length) return 'unknown';
  const buckets = new Map<string, number>();
  dates.forEach((date) => {
    const hour = date.getHours();
    let bucket = 'evening';
    if (hour < 12) bucket = 'morning';
    else if (hour < 17) bucket = 'afternoon';
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
  });
  return Array.from(buckets.entries()).sort((a, b) => b[1] - a[1])[0][0];
}

// Helper function to identify struggling concepts
function calculateRetentionRate(dates: Date[]): number {
  if (!dates.length) return 0;
  const recentDates = dates
    .map((date) => new Date(date))
    .filter((date) => Date.now() - date.getTime() <= 30 * 24 * 60 * 60 * 1000);
  const uniqueDays = new Set(recentDates.map((date) => date.toDateString()));
  return Math.round((uniqueDays.size / 30) * 100) / 100;
}

// Helper function to generate recommendations
function generateRecommendations(insights: any): any[] {
  const recommendations = [];
  
  // Performance-based recommendations
  insights.performance.weaknesses.forEach((weakness: any) => {
    if (weakness.score < 75) {
      recommendations.push({
        type: 'remediation',
        topic: weakness.topic,
        suggestion: `Provide additional practice and support for ${weakness.topic}`,
        priority: weakness.score < 65 ? 'high' : 'medium'
      });
    }
  });
  
  // Engagement-based recommendations
  if (insights.learningPatterns.engagementLevel === 'low') {
    recommendations.push({
      type: 'engagement',
      topic: 'Study Motivation',
      suggestion: 'Consider gamification elements or different content formats',
      priority: 'high'
    });
  }
  
  return recommendations;
}

function normalizeTopicScores(raw: any): { topic: string; score: number; confidence: string }[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === 'string') {
          return { topic: item, score: 0, confidence: 'medium' };
        }
        if (item && typeof item === 'object') {
          return {
            topic: String((item as any).topic ?? (item as any).name ?? 'Unknown'),
            score: Number((item as any).score ?? (item as any).value ?? 0),
            confidence: (item as any).confidence ?? 'medium',
          };
        }
        return null;
      })
      .filter(Boolean) as { topic: string; score: number; confidence: string }[];
  }

  if (typeof raw === 'object') {
    return Object.entries(raw).map(([topic, score]) => ({
      topic,
      score: Number(score) || 0,
      confidence: 'medium',
    }));
  }

  return [];
}

function mostCommon(values: string[]): string {
  if (!values.length) return 'unknown';
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0];
}

function getEngagementLevel(activityCount: number): 'low' | 'medium' | 'high' {
  if (activityCount >= 50) return 'high';
  if (activityCount >= 20) return 'medium';
  return 'low';
}

function buildProgressTrends(examAttempts: any[], activityLogs: any[]) {
  const weeklyScores = examAttempts
    .slice(0, 7)
    .map((attempt) => Math.round(attempt.scorePercentage ?? 0))
    .reverse();

  const engagementTrend = activityLogs.length >= 40 ? 'increasing' : activityLogs.length >= 20 ? 'stable' : 'decreasing';

  const conceptMastery: Record<string, number> = {};
  const recentWeeks = Math.min(4, weeklyScores.length);
  for (let i = 0; i < recentWeeks; i += 1) {
    conceptMastery[`Week ${i + 1}`] = weeklyScores[weeklyScores.length - recentWeeks + i] ?? 0;
  }

  return {
    weeklyScores,
    engagementTrend,
    conceptMastery,
  };
}

function deriveBloomsTaxonomy(
  bloomsScores: any,
  metrics: any[]
): Record<string, number> {
  if (bloomsScores && typeof bloomsScores === 'object') {
    const normalized: Record<string, number> = {};
    Object.entries(bloomsScores).forEach(([key, value]) => {
      normalized[key.toLowerCase()] = Number(value) || 0;
    });
    return normalized;
  }

  const buckets: Record<string, number[]> = {};
  metrics.forEach((metric) => {
    const key = String(metric.bloomsLevel).toLowerCase();
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(metric.accuracy);
  });

  const result: Record<string, number> = {};
  Object.entries(buckets).forEach(([key, values]) => {
    result[key] = values.length
      ? Math.round((values.reduce((sum, val) => sum + val, 0) / values.length) * 100) / 100
      : 0;
  });

  return result;
}
