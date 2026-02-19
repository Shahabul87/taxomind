// @ts-nocheck
/**
 * Learning Analytics Export
 *
 * Export personal learning analytics as CSV or JSON for download.
 * Queries the same data as the personal analytics endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, type APIAuthContext, createErrorResponse, ApiError } from '@/lib/api';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

const ExportRequestSchema = z.object({
  format: z.enum(['csv', 'json']).default('json'),
  timeframe: z.enum(['week', 'month', 'semester', 'all']).default('month'),
});

function getTimeframeDate(timeframe: string): Date {
  const now = new Date();
  switch (timeframe) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'semester':
      return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    default:
      return new Date(0);
  }
}

interface ExportActivity {
  courseTitle: string;
  activityType: string;
  activityTitle: string;
  score: number | null;
  completedAt: string;
  timeSpentMinutes: number;
  bloomsLevel: string;
}

interface ExportCourseProgress {
  courseTitle: string;
  progress: number;
  completedSections: number;
  totalSections: number;
  averageScore: number;
  lastActivity: string;
}

async function handler(req: NextRequest, context: APIAuthContext) {
  const userId = context.user.id;

  let params: z.infer<typeof ExportRequestSchema>;
  try {
    const url = new URL(req.url);
    params = ExportRequestSchema.parse({
      format: url.searchParams.get('format') ?? 'json',
      timeframe: url.searchParams.get('timeframe') ?? 'month',
    });
  } catch {
    throw new ApiError('VALIDATION_ERROR', 'Invalid parameters', 400);
  }

  const sinceDate = getTimeframeDate(params.timeframe);

  // Query enrollments with course progress
  const enrollments = await db.purchase.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          chapters: {
            include: {
              sections: true,
            },
          },
        },
      },
    },
    take: 200,
  });

  // Query exam attempts
  const examAttempts = await db.userExamAttempt.findMany({
    where: {
      userId,
      createdAt: { gte: sinceDate },
    },
    include: {
      Exam: {
        include: {
          section: {
            include: {
              chapter: {
                include: { course: true },
              },
            },
          },
        },
      },
      UserAnswer: {
        include: {
          ExamQuestion: { select: { id: true, bloomsLevel: true, title: true, questionType: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  // Query section completions
  const completions = await db.user_Progress.findMany({
    where: { userId, isCompleted: true },
    include: {
      section: {
        include: {
          chapter: {
            include: { course: true },
          },
        },
      },
    },
    take: 500,
  });

  // Build activity records
  const activities: ExportActivity[] = examAttempts.map((attempt) => ({
    courseTitle: attempt.Exam.section.chapter?.course?.title ?? 'Unknown Course',
    activityType: 'exam',
    activityTitle: `Exam: ${attempt.Exam.section.title ?? 'Section Exam'}`,
    score: attempt.score,
    completedAt: attempt.createdAt.toISOString(),
    timeSpentMinutes: Math.round((attempt.timeSpent ?? 0) / 60),
    bloomsLevel: attempt.UserAnswer[0]?.ExamQuestion.bloomLevel ?? 'N/A',
  }));

  // Add section completions
  for (const completion of completions) {
    if (completion.section && completion.createdAt >= sinceDate) {
      activities.push({
        courseTitle: completion.section.chapter?.course?.title ?? 'Unknown Course',
        activityType: 'section_complete',
        activityTitle: completion.section.title,
        score: null,
        completedAt: completion.createdAt.toISOString(),
        timeSpentMinutes: 0,
        bloomsLevel: 'N/A',
      });
    }
  }

  // Build course progress
  const courseProgress: ExportCourseProgress[] = enrollments.map((enrollment) => {
    const course = enrollment.course;
    const totalSections = course.chapters.reduce((sum, ch) => sum + ch.sections.length, 0);
    const completedSections = completions.filter(
      (c) => c.section?.chapter?.course?.id === course.id
    ).length;
    const courseExams = examAttempts.filter(
      (a) => a.Exam.section.chapter?.course?.id === course.id
    );
    const avgScore =
      courseExams.length > 0
        ? Math.round(courseExams.reduce((s, a) => s + (a.score ?? 0), 0) / courseExams.length)
        : 0;
    const lastAttempt = courseExams[0]?.createdAt;

    return {
      courseTitle: course.title,
      progress: totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0,
      completedSections,
      totalSections,
      averageScore: avgScore,
      lastActivity: lastAttempt?.toISOString() ?? 'N/A',
    };
  });

  // Bloom's distribution from exam answers
  const bloomsCounts: Record<string, { correct: number; total: number }> = {};
  for (const attempt of examAttempts) {
    for (const answer of attempt.UserAnswer) {
      const level = answer.ExamQuestion.bloomLevel ?? 'UNKNOWN';
      if (!bloomsCounts[level]) bloomsCounts[level] = { correct: 0, total: 0 };
      bloomsCounts[level].total++;
      if (answer.isCorrect) bloomsCounts[level].correct++;
    }
  }

  const bloomsDistribution = Object.entries(bloomsCounts).map(([level, data]) => ({
    level,
    correct: data.correct,
    total: data.total,
    accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
  }));

  logger.info('[ANALYTICS_EXPORT] Export generated', {
    userId,
    format: params.format,
    timeframe: params.timeframe,
    activityCount: activities.length,
    courseCount: courseProgress.length,
  });

  if (params.format === 'csv') {
    // Build CSV string
    const lines: string[] = [];

    // Course Progress section
    lines.push('=== Course Progress ===');
    lines.push('Course,Progress %,Completed Sections,Total Sections,Average Score,Last Activity');
    for (const cp of courseProgress) {
      lines.push(
        [
          csvEscape(cp.courseTitle),
          cp.progress,
          cp.completedSections,
          cp.totalSections,
          cp.averageScore,
          cp.lastActivity,
        ].join(',')
      );
    }

    lines.push('');
    lines.push('=== Learning Activity ===');
    lines.push('Course,Activity Type,Activity Title,Score,Completed At,Time (min),Blooms Level');
    for (const act of activities) {
      lines.push(
        [
          csvEscape(act.courseTitle),
          act.activityType,
          csvEscape(act.activityTitle),
          act.score ?? '',
          act.completedAt,
          act.timeSpentMinutes,
          act.bloomsLevel,
        ].join(',')
      );
    }

    lines.push('');
    lines.push('=== Cognitive Distribution ===');
    lines.push('Blooms Level,Correct,Total,Accuracy %');
    for (const bloom of bloomsDistribution) {
      lines.push([bloom.level, bloom.correct, bloom.total, bloom.accuracy].join(','));
    }

    const csvContent = lines.join('\n');
    const timestamp = new Date().toISOString().split('T')[0];

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="learning-analytics-${timestamp}.csv"`,
      },
    });
  }

  // JSON format
  const jsonData = {
    exportDate: new Date().toISOString(),
    timeframe: params.timeframe,
    courseProgress,
    activities,
    bloomsDistribution,
    summary: {
      totalCourses: enrollments.length,
      totalActivities: activities.length,
      totalExams: examAttempts.length,
      averageExamScore:
        examAttempts.length > 0
          ? Math.round(
              examAttempts.reduce((s, a) => s + (a.score ?? 0), 0) / examAttempts.length
            )
          : 0,
    },
  };

  const timestamp = new Date().toISOString().split('T')[0];

  return new NextResponse(JSON.stringify(jsonData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="learning-analytics-${timestamp}.json"`,
    },
  });
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export const GET = withAuth(handler);
