import { NextResponse } from 'next/server';
import { z } from 'zod';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

const QuerySchema = z.object({
  courseId: z.string().optional(),
  categoryId: z.string().optional(),
});

interface BenchmarkData {
  courseId: string;
  courseGrade: string;
  courseScore: number;
  categoryId: string;
  categoryName: string;
  categoryStats: {
    totalCourses: number;
    averageScore: number;
    averageGrade: string;
    medianScore: number;
    top10PercentScore: number;
    top10PercentGrade: string;
  };
  ranking: {
    rank: number;
    percentile: number;
    aboveAverage: boolean;
    inTop10Percent: boolean;
  };
  topCourseInsights: string[];
  improvementOpportunities: string[];
}

export async function GET(req: Request) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = QuerySchema.parse({
      courseId: searchParams.get('courseId') ?? undefined,
      categoryId: searchParams.get('categoryId') ?? undefined,
    });

    if (!query.courseId && !query.categoryId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_PARAMS', message: 'courseId or categoryId is required' },
        },
        { status: 400 }
      );
    }

    // Get the course and its category
    let course;
    let categoryId: string;

    if (query.courseId) {
      course = await db.course.findUnique({
        where: {
          id: query.courseId,
          userId: user.id,
        },
        include: {
          category: true,
          cognitiveQuality: true,
        },
      });

      if (!course) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Course not found' } },
          { status: 404 }
        );
      }

      if (!course.categoryId) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'NO_CATEGORY', message: 'Course has no category assigned' },
          },
          { status: 400 }
        );
      }

      categoryId = course.categoryId;
    } else {
      categoryId = query.categoryId!;
    }

    // Get all published courses in the same category with cognitive quality
    const categoryCourses = await db.course.findMany({
      where: {
        categoryId,
        isPublished: true,
        cognitiveQuality: {
          isNot: null,
        },
      },
      take: 500,
      include: {
        cognitiveQuality: true,
      },
      orderBy: {
        cognitiveQuality: {
          cognitiveScore: 'desc',
        },
      },
    });

    // Calculate category statistics
    const scores = categoryCourses
      .map((c) => c.cognitiveQuality?.cognitiveScore ?? 0)
      .filter((s) => s > 0);

    if (scores.length === 0) {
      // No benchmark data available
      const category = await db.category.findUnique({
        where: { id: categoryId },
        select: { name: true },
      });

      return NextResponse.json({
        success: true,
        data: {
          courseId: query.courseId ?? '',
          courseGrade: course?.cognitiveQuality?.cognitiveGrade ?? 'N/A',
          courseScore: course?.cognitiveQuality?.cognitiveScore ?? 0,
          categoryId,
          categoryName: category?.name ?? 'Unknown',
          categoryStats: {
            totalCourses: 0,
            averageScore: 0,
            averageGrade: 'N/A',
            medianScore: 0,
            top10PercentScore: 0,
            top10PercentGrade: 'N/A',
          },
          ranking: {
            rank: 0,
            percentile: 0,
            aboveAverage: false,
            inTop10Percent: false,
          },
          topCourseInsights: [
            'Not enough data to provide insights yet.',
            'Be the first to set a high cognitive quality standard!',
          ],
          improvementOpportunities: [
            'Add content at multiple Bloom&apos;s levels',
            'Include hands-on exercises and projects',
          ],
        },
      });
    }

    // Calculate statistics
    const sortedScores = [...scores].sort((a, b) => b - a);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const medianScore = sortedScores[Math.floor(scores.length / 2)];
    const top10Index = Math.max(0, Math.floor(scores.length * 0.1) - 1);
    const top10PercentScore = sortedScores[top10Index];

    const averageGrade = scoreToGrade(averageScore);
    const top10PercentGrade = scoreToGrade(top10PercentScore);

    // Get category info
    const category = await db.category.findUnique({
      where: { id: categoryId },
      select: { name: true },
    });

    // Calculate course ranking if we have a specific course
    let ranking = {
      rank: 0,
      percentile: 0,
      aboveAverage: false,
      inTop10Percent: false,
    };

    const courseScore = course?.cognitiveQuality?.cognitiveScore ?? 0;

    if (course && courseScore > 0) {
      const rank = sortedScores.findIndex((s) => courseScore >= s) + 1;
      const percentile = Math.round((1 - rank / scores.length) * 100);

      ranking = {
        rank,
        percentile,
        aboveAverage: courseScore >= averageScore,
        inTop10Percent: courseScore >= top10PercentScore,
      };
    }

    // Generate insights from top courses
    const topCourses = categoryCourses.slice(0, Math.min(5, categoryCourses.length));
    const topCourseInsights = generateTopCourseInsights(topCourses, courseScore);

    // Generate improvement opportunities
    const improvementOpportunities = generateImprovementOpportunities(
      course?.cognitiveQuality ?? null,
      topCourses
    );

    const benchmarkData: BenchmarkData = {
      courseId: query.courseId ?? '',
      courseGrade: course?.cognitiveQuality?.cognitiveGrade ?? 'N/A',
      courseScore,
      categoryId,
      categoryName: category?.name ?? 'Unknown',
      categoryStats: {
        totalCourses: categoryCourses.length,
        averageScore: Math.round(averageScore),
        averageGrade,
        medianScore: Math.round(medianScore),
        top10PercentScore: Math.round(top10PercentScore),
        top10PercentGrade,
      },
      ranking,
      topCourseInsights,
      improvementOpportunities,
    };

    return NextResponse.json({
      success: true,
      data: benchmarkData,
    });
  } catch (error) {
    logger.error('[CATEGORY_BENCHMARKS]', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
      },
      { status: 500 }
    );
  }
}

function scoreToGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
}

interface CourseWithQuality {
  cognitiveQuality: {
    cognitiveScore: number;
    cognitiveGrade: string;
    rememberPercent: number;
    understandPercent: number;
    applyPercent: number;
    analyzePercent: number;
    evaluatePercent: number;
    createPercent: number;
  } | null;
}

function generateTopCourseInsights(
  topCourses: CourseWithQuality[],
  courseScore: number
): string[] {
  const insights: string[] = [];

  if (topCourses.length === 0) {
    return ['Be the first to set the benchmark in this category!'];
  }

  // Analyze what top courses do well
  const avgApply = topCourses.reduce(
    (sum, c) => sum + (c.cognitiveQuality?.applyPercent ?? 0),
    0
  ) / topCourses.length;
  const avgAnalyze = topCourses.reduce(
    (sum, c) => sum + (c.cognitiveQuality?.analyzePercent ?? 0),
    0
  ) / topCourses.length;
  const avgCreate = topCourses.reduce(
    (sum, c) => sum + (c.cognitiveQuality?.createPercent ?? 0),
    0
  ) / topCourses.length;

  if (avgApply >= 20) {
    insights.push(`Top courses average ${Math.round(avgApply)}% hands-on application activities`);
  }

  if (avgAnalyze >= 15) {
    insights.push(`Leading courses include ${Math.round(avgAnalyze)}% analytical content`);
  }

  if (avgCreate >= 8) {
    insights.push(`Best performers have ${Math.round(avgCreate)}% creative project components`);
  }

  // Calculate how many levels top courses cover
  const avgActiveLevels = topCourses.reduce((sum, c) => {
    if (!c.cognitiveQuality) return sum;
    let count = 0;
    if (c.cognitiveQuality.rememberPercent > 5) count++;
    if (c.cognitiveQuality.understandPercent > 5) count++;
    if (c.cognitiveQuality.applyPercent > 5) count++;
    if (c.cognitiveQuality.analyzePercent > 5) count++;
    if (c.cognitiveQuality.evaluatePercent > 5) count++;
    if (c.cognitiveQuality.createPercent > 5) count++;
    return sum + count;
  }, 0) / topCourses.length;

  if (avgActiveLevels >= 4) {
    insights.push(`Top-rated courses cover ${Math.round(avgActiveLevels)} Bloom&apos;s levels on average`);
  }

  if (insights.length === 0) {
    insights.push('Analyze top courses in your category for inspiration');
  }

  return insights;
}

function generateImprovementOpportunities(
  courseQuality: CourseWithQuality['cognitiveQuality'],
  topCourses: CourseWithQuality[]
): string[] {
  const opportunities: string[] = [];

  if (!courseQuality) {
    return [
      'Add cognitive quality analysis to your course',
      'Include content at multiple thinking levels',
    ];
  }

  // Compare with top courses
  const avgTop = {
    apply: topCourses.reduce((s, c) => s + (c.cognitiveQuality?.applyPercent ?? 0), 0) / Math.max(1, topCourses.length),
    analyze: topCourses.reduce((s, c) => s + (c.cognitiveQuality?.analyzePercent ?? 0), 0) / Math.max(1, topCourses.length),
    evaluate: topCourses.reduce((s, c) => s + (c.cognitiveQuality?.evaluatePercent ?? 0), 0) / Math.max(1, topCourses.length),
    create: topCourses.reduce((s, c) => s + (c.cognitiveQuality?.createPercent ?? 0), 0) / Math.max(1, topCourses.length),
  };

  if (courseQuality.applyPercent < avgTop.apply - 5) {
    opportunities.push(`Add ${Math.round(avgTop.apply - courseQuality.applyPercent)}% more hands-on exercises`);
  }

  if (courseQuality.analyzePercent < avgTop.analyze - 5) {
    opportunities.push('Include case studies for deeper analysis');
  }

  if (courseQuality.createPercent < avgTop.create - 3) {
    opportunities.push('Add creative projects or design challenges');
  }

  // Check for dominant level
  const levels = [
    courseQuality.rememberPercent,
    courseQuality.understandPercent,
    courseQuality.applyPercent,
    courseQuality.analyzePercent,
    courseQuality.evaluatePercent,
    courseQuality.createPercent,
  ];
  const maxLevel = Math.max(...levels);

  if (maxLevel > 50) {
    opportunities.push('Diversify content to reduce cognitive level concentration');
  }

  if (opportunities.length === 0) {
    opportunities.push('Your course is performing well compared to category peers');
  }

  return opportunities;
}
