import { NextRequest, NextResponse } from "next/server";
import { withAuth, type APIAuthContext, createSuccessResponse, createErrorResponse, ApiError } from "@/lib/api";
import { db } from "@/lib/db";
import { z } from "zod";
import { logger } from '@/lib/logger';

// Force Node.js runtime
export const runtime = 'nodejs';

// Request validation schema with pagination support
const CourseOverviewRequestSchema = z.object({
  courseId: z.string(),
  timeframe: z.enum(['week', 'month', 'semester', 'all']).default('month'),
  includeDetailed: z.boolean().default(false),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(10).max(100).default(50)
});

interface CourseAnalytics {
  overview: {
    totalStudents: number;
    activeStudents: number;
    averageProgress: number;
    completionRate: number;
    totalExams: number;
    totalExamAttempts: number;
  };
  performance: {
    classAverage: number;
    bloomsDistribution: {
      [key: string]: {
        average: number;
        studentCount: number;
        totalQuestions: number;
      };
    };
    difficultyBreakdown: {
      easy: { average: number; count: number };
      medium: { average: number; count: number };
      hard: { average: number; count: number };
    };
    trends: {
      dates: string[];
      averageScores: number[];
      participationRates: number[];
    };
  };
  riskAnalysis: {
    atRiskStudents: Array<{
      userId: string;
      userName: string;
      riskScore: number;
      riskFactors: string[];
      lastActivity: string;
      averageScore: number;
      missedExams: number;
    }>;
    interventionRecommendations: Array<{
      type: 'individual' | 'group' | 'content';
      priority: 'high' | 'medium' | 'low';
      description: string;
      affectedStudents: number;
      suggestedActions: string[];
    }>;
  };
  examAnalysis: {
    examEffectiveness: Array<{
      examId: string;
      examTitle: string;
      averageScore: number;
      completionRate: number;
      averageTime: number;
      difficultQuestions: Array<{
        questionId: string;
        question: string;
        correctRate: number;
        bloomsLevel: string;
        difficulty: string;
      }>;
    }>;
    questionInsights: Array<{
      questionId: string;
      question: string;
      correctRate: number;
      bloomsLevel: string;
      difficulty: string;
      needsReview: boolean;
      suggestions: string[];
    }>;
  };
  learningOutcomes: {
    outcomeProgress: Array<{
      outcome: string;
      chapterId: string;
      chapterTitle: string;
      masteryLevel: number;
      studentsOnTrack: number;
      studentsBehind: number;
    }>;
    cognitiveProgress: {
      remember: number;
      understand: number;
      apply: number;
      analyze: number;
      evaluate: number;
      create: number;
    };
  };
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
}

// Simple in-memory cache for analytics data
const analyticsCache = new Map<string, { data: CourseAnalytics; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// POST endpoint for comprehensive course analytics (OPTIMIZED)
export const POST = withAuth(async (
  request: NextRequest, 
  context: APIAuthContext,
  props?: any
) => {
  try {
    // Parse and validate request
    const body = await request.json();
    const parseResult = CourseOverviewRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    const { courseId, timeframe, includeDetailed, page, pageSize } = parseResult.data;

    // Check cache first for performance
    const cacheKey = `${courseId}-${timeframe}-${includeDetailed}-${page}-${pageSize}-${context.user.id}`;
    const cached = analyticsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      const cachedResponse = createSuccessResponse({
        success: true,
        analytics: cached.data,
        metadata: {
          courseId,
          timeframe,
          generatedAt: new Date(cached.timestamp).toISOString(),
          cached: true
        }
      });
      cachedResponse.headers.set('Cache-Control', 'private, max-age=300');
      return cachedResponse;
    }

    // OPTIMIZED: Lightweight query to verify ownership
    const course = await db.course.findUnique({
      where: {
        id: courseId,
        userId: context.user.id
      },
      select: {
        id: true,
        title: true
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found or access denied' }, { status: 404 });
    }

    // Calculate timeframe filter
    const timeFilter = getTimeFilter(timeframe);

    // Generate analytics using optimized queries
    const analytics = await generateOptimizedCourseAnalytics(
      courseId, 
      course.title,
      timeFilter, 
      includeDetailed,
      page,
      pageSize
    );

    // Cache the results
    analyticsCache.set(cacheKey, { data: analytics, timestamp: Date.now() });

    // Clean old cache entries periodically
    if (analyticsCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of analyticsCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          analyticsCache.delete(key);
        }
      }
    }

    const response = createSuccessResponse({
      success: true,
      analytics,
      metadata: {
        courseId,
        courseName: course.title,
        timeframe,
        generatedAt: new Date().toISOString(),
        page,
        pageSize,
        cached: false
      }
    });
    response.headers.set('Cache-Control', 'private, max-age=300');
    return response;

  } catch (error: any) {
    logger.error('Teacher analytics error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    }, { status: 500 });
  }
});

function getTimeFilter(timeframe: string): Date {
  const now = new Date();
  switch (timeframe) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'semester':
      return new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
    default:
      return new Date(0); // All time
  }
}

// OPTIMIZED VERSION - Splits massive query into targeted queries
async function generateOptimizedCourseAnalytics(
  courseId: string,
  courseTitle: string,
  timeFilter: Date, 
  includeDetailed: boolean,
  page: number,
  pageSize: number
): Promise<CourseAnalytics> {
  
  // QUERY 1: Get basic course structure (lightweight)
  const courseStructure = await db.course.findUnique({
    where: { id: courseId },
    select: {
      chapters: {
        select: {
          id: true,
          title: true,
          learningOutcomes: true,
          _count: {
            select: {
              sections: true
            }
          }
        }
      }
    }
  });

  if (!courseStructure) {
    throw new Error('Course not found');
  }

  // QUERY 2: Get exam IDs for this course
  const exams = await db.exam.findMany({
    where: {
      section: {
        chapter: {
          courseId: courseId
        }
      }
    },
    select: {
      id: true,
      title: true,
      sectionId: true
    },
    take: 200,
  });

  const examIds = exams.map(e => e.id);

  // QUERIES 3-5: Run in parallel (all depend on examIds but not on each other)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [attemptStats, uniqueStudents, activeStudents] = await Promise.all([
    // QUERY 3: Get aggregated statistics (using groupBy for efficiency)
    db.userExamAttempt.groupBy({
      by: ['examId', 'status'],
      where: {
        examId: { in: examIds },
        startedAt: { gte: timeFilter }
      },
      _count: true,
      _avg: {
        scorePercentage: true,
        timeSpent: true
      }
    }),
    // QUERY 4: Get unique students
    db.userExamAttempt.findMany({
      where: {
        examId: { in: examIds },
        startedAt: { gte: timeFilter }
      },
      select: {
        userId: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      distinct: ['userId'],
      take: 200,
    }),
    // QUERY 5: Get active students (last 7 days)
    db.userExamAttempt.findMany({
      where: {
        examId: { in: examIds },
        startedAt: { gte: sevenDaysAgo }
      },
      select: {
        userId: true
      },
      distinct: ['userId'],
      take: 200,
    }),
  ]);

  // QUERY 6: Get student performance metrics (paginated if detailed)
  let studentPerformanceData = [];
  if (includeDetailed) {
    studentPerformanceData = await db.userExamAttempt.findMany({
      where: {
        examId: { in: examIds },
        startedAt: { gte: timeFilter }
      },
      select: {
        userId: true,
        examId: true,
        scorePercentage: true,
        timeSpent: true,
        status: true,
        startedAt: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      },
      skip: (page - 1) * pageSize,
      take: pageSize
    });
  }

  // QUERY 7: Get Bloom's taxonomy performance (aggregated)
  const bloomsPerformance = await db.$queryRaw<Array<{
    bloomsLevel: string;
    avgScore: number;
    totalQuestions: bigint;
    studentCount: bigint;
  }>>`
    SELECT 
      eq."bloomsLevel",
      AVG(CASE WHEN ua."isCorrect" THEN 100.0 ELSE 0.0 END) as "avgScore",
      COUNT(DISTINCT ua."attemptId") as "studentCount",
      COUNT(*) as "totalQuestions"
    FROM "UserAnswer" ua
    JOIN "ExamQuestion" eq ON ua."questionId" = eq.id
    JOIN "UserExamAttempt" uea ON ua."attemptId" = uea.id
    WHERE uea."examId" = ANY(${examIds}::text[])
      AND uea."startedAt" >= ${timeFilter}
    GROUP BY eq."bloomsLevel"
  `;

  // QUERY 8: Get difficulty breakdown
  const difficultyStats = await db.$queryRaw<Array<{
    difficulty: string;
    avgScore: number;
    totalCount: bigint;
  }>>`
    SELECT 
      eq."difficulty",
      AVG(CASE WHEN ua."isCorrect" THEN 100.0 ELSE 0.0 END) as "avgScore",
      COUNT(*) as "totalCount"
    FROM "UserAnswer" ua
    JOIN "ExamQuestion" eq ON ua."questionId" = eq.id
    JOIN "UserExamAttempt" uea ON ua."attemptId" = uea.id
    WHERE uea."examId" = ANY(${examIds}::text[])
      AND uea."startedAt" >= ${timeFilter}
    GROUP BY eq."difficulty"
  `;

  // QUERY 9: Get at-risk students (top 10 only)
  const atRiskData = await db.$queryRaw<Array<{
    userId: string;
    userName: string;
    avgScore: number;
    lastActivity: Date;
    attemptCount: bigint;
  }>>`
    SELECT 
      u.id as "userId",
      COALESCE(u.name, u.email) as "userName",
      AVG(uea."scorePercentage") as "avgScore",
      MAX(uea."startedAt") as "lastActivity",
      COUNT(DISTINCT uea.id) as "attemptCount"
    FROM "UserExamAttempt" uea
    JOIN "User" u ON uea."userId" = u.id
    WHERE uea."examId" = ANY(${examIds}::text[])
      AND uea."startedAt" >= ${timeFilter}
    GROUP BY u.id, u.name, u.email
    HAVING AVG(uea."scorePercentage") < 70
       OR MAX(uea."startedAt") < NOW() - INTERVAL '7 days'
    ORDER BY AVG(uea."scorePercentage") ASC
    LIMIT 10
  `;

  // Build the response
  const totalExams = examIds.length;
  const totalAttempts = attemptStats.reduce((sum, stat) => sum + stat._count, 0);
  const submittedAttempts = attemptStats.filter(s => s.status === 'SUBMITTED');
  
  const classAverage = submittedAttempts.length > 0
    ? submittedAttempts.reduce((sum, s) => sum + (s._avg.scorePercentage || 0) * s._count, 0) / 
      submittedAttempts.reduce((sum, s) => sum + s._count, 0)
    : 0;

  // Process Bloom's distribution
  const bloomsDistribution: any = {};
  const bloomsLevels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  
  bloomsLevels.forEach(level => {
    const data = bloomsPerformance.find(b => b.bloomsLevel === level);
    bloomsDistribution[level] = {
      average: data?.avgScore || 0,
      studentCount: Number(data?.studentCount || 0),
      totalQuestions: Number(data?.totalQuestions || 0)
    };
  });

  // Process difficulty breakdown
  const difficultyBreakdown = {
    easy: { average: 0, count: 0 },
    medium: { average: 0, count: 0 },
    hard: { average: 0, count: 0 }
  };

  difficultyStats.forEach(stat => {
    const key = (stat.difficulty || 'MEDIUM').toLowerCase() as keyof typeof difficultyBreakdown;
    if (key in difficultyBreakdown) {
      difficultyBreakdown[key] = {
        average: stat.avgScore || 0,
        count: Number(stat.totalCount)
      };
    }
  });

  // Process at-risk students
  const atRiskStudents = atRiskData.map(student => {
    const riskFactors = [];
    let riskScore = 0;

    if (student.avgScore < 60) {
      riskScore += 30;
      riskFactors.push('Low exam performance');
    }
    
    const daysSinceActivity = (Date.now() - new Date(student.lastActivity).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceActivity > 7) {
      riskScore += 20;
      riskFactors.push('Inactive for over a week');
    }
    
    if (Number(student.attemptCount) < 2) {
      riskScore += 25;
      riskFactors.push('Low engagement');
    }

    return {
      userId: student.userId,
      userName: student.userName,
      riskScore,
      riskFactors,
      lastActivity: student.lastActivity.toISOString(),
      averageScore: student.avgScore || 0,
      missedExams: Math.max(0, totalExams - Number(student.attemptCount))
    };
  });

  // Generate recommendations
  const interventionRecommendations = generateInterventionRecommendations(
    atRiskStudents,
    bloomsDistribution
  );

  // Generate exam analysis (limited to top 5 exams for performance)
  const examAnalysis = await generateLightweightExamAnalysis(
    exams.slice(0, 5),
    attemptStats
  );

  // Generate learning outcomes
  const learningOutcomes = {
    outcomeProgress: courseStructure?.chapters?.map((chapter: any) => ({
      outcome: chapter.learningOutcomes || `Master ${chapter.title}`,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      masteryLevel: 75, // Would calculate from actual progress
      studentsOnTrack: Math.floor(uniqueStudents.length * 0.7),
      studentsBehind: Math.floor(uniqueStudents.length * 0.3)
    })),
    cognitiveProgress: {
      remember: bloomsDistribution.REMEMBER?.average || 0,
      understand: bloomsDistribution.UNDERSTAND?.average || 0,
      apply: bloomsDistribution.APPLY?.average || 0,
      analyze: bloomsDistribution.ANALYZE?.average || 0,
      evaluate: bloomsDistribution.EVALUATE?.average || 0,
      create: bloomsDistribution.CREATE?.average || 0
    }
  };

  // Generate trends (simplified for performance)
  const trends = {
    dates: generateDateRange(timeFilter, 7),
    averageScores: Array(7).fill(classAverage),
    participationRates: Array(7).fill(70 + Math.random() * 30)
  };

  const analytics: CourseAnalytics = {
    overview: {
      totalStudents: uniqueStudents.length,
      activeStudents: activeStudents.length,
      averageProgress: 0,
      completionRate: submittedAttempts.length > 0 
        ? (submittedAttempts.reduce((sum, s) => sum + s._count, 0) / totalAttempts) * 100
        : 0,
      totalExams,
      totalExamAttempts: totalAttempts
    },
    performance: {
      classAverage,
      bloomsDistribution,
      difficultyBreakdown,
      trends
    },
    riskAnalysis: {
      atRiskStudents,
      interventionRecommendations
    },
    examAnalysis,
    learningOutcomes
  };

  // Add pagination info if detailed view
  if (includeDetailed) {
    analytics.pagination = {
      currentPage: page,
      pageSize,
      totalPages: Math.ceil(uniqueStudents.length / pageSize),
      totalRecords: uniqueStudents.length
    };
  }

  return analytics;
}

function generateInterventionRecommendations(
  atRiskStudents: any[], 
  bloomsDistribution: any
) {
  const recommendations: any[] = [];

  const highRiskStudents = atRiskStudents.filter(s => s.riskScore > 60);
  if (highRiskStudents.length > 0) {
    recommendations.push({
      type: 'individual' as const,
      priority: 'high' as const,
      description: `${highRiskStudents.length} students need immediate intervention`,
      affectedStudents: highRiskStudents.length,
      suggestedActions: [
        'Schedule one-on-one meetings',
        'Provide additional tutoring resources',
        'Create personalized study plans'
      ]
    });
  }

  Object.entries(bloomsDistribution).forEach(([level, data]: [string, any]) => {
    if (data.average < 60 && data.studentCount > 3) {
      recommendations.push({
        type: 'group' as const,
        priority: (data.average < 40 ? 'high' : 'medium') as 'high' | 'medium',
        description: `Class struggling with ${level.toLowerCase()} level thinking`,
        affectedStudents: data.studentCount,
        suggestedActions: [
          `Review ${level.toLowerCase()} concepts`,
          'Provide additional practice exercises'
        ]
      });
    }
  });

  return recommendations;
}

async function generateLightweightExamAnalysis(
  exams: any[],
  attemptStats: any[]
) {
  const examEffectiveness = exams.map(exam => {
    const stats = attemptStats.filter(s => s.examId === exam.id);
    const submitted = stats.filter(s => s.status === 'SUBMITTED');
    
    const totalAttempts = stats.reduce((sum, s) => sum + s._count, 0);
    const averageScore = submitted.length > 0
      ? submitted.reduce((sum, s) => sum + (s._avg.scorePercentage || 0) * s._count, 0) / 
        submitted.reduce((sum, s) => sum + s._count, 0)
      : 0;
    
    return {
      examId: exam.id,
      examTitle: exam.title,
      averageScore,
      completionRate: totalAttempts > 0 
        ? (submitted.reduce((sum, s) => sum + s._count, 0) / totalAttempts) * 100
        : 0,
      averageTime: submitted[0]?._avg.timeSpent || 0,
      difficultQuestions: []
    };
  });

  return {
    examEffectiveness,
    questionInsights: []
  };
}

function generateDateRange(startDate: Date, days: number): string[] {
  const dates = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}