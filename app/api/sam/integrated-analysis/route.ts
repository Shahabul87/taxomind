import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import {
  createCourseGuideEngine,
  createMarketEngine,
  createResearchEngine,
  createTrendsEngine,
  createUnifiedBloomsEngine,
  type CourseGuideResponse,
  type MarketAnalysisResponse,
  type ResearchPaper,
  type TrendAnalysis,
  type UnifiedCourseInput,
  type UnifiedCourseResult,
} from '@sam-ai/educational';
import {
  createCourseGuideAdapter,
  createMarketAdapter,
  createTrendsAdapter,
  getDatabaseAdapter,
  getUserScopedSAMConfig,
} from '@/lib/adapters';
import { randomUUID } from 'crypto';

interface IntegratedRecommendation {
  source: 'market' | 'blooms' | 'guide' | 'trends' | 'research' | 'integrated';
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  actions: string[];
  expectedImpact: string;
  dependencies?: string[];
}

interface ActionPlan {
  immediate: ActionItem[];
  shortTerm: ActionItem[];
  longTerm: ActionItem[];
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  engineSource: string[];
  estimatedTime: string;
  requiredResources: string[];
  successMetrics: string[];
}

interface IntegratedAnalysis {
  courseId: string;
  timestamp: Date;
  marketInsights?: MarketAnalysisResponse | null;
  bloomsProfile?: UnifiedCourseResult | null;
  examRecommendations?: unknown | null;
  courseGuide?: CourseGuideResponse | null;
  studentProgress?: Record<string, unknown> | null;
  trendsAnalysis?: TrendAnalysis[] | null;
  newsDigest?: unknown | null;
  researchPapers?: ResearchPaper[] | null;
  integratedRecommendations: IntegratedRecommendation[];
  actionPlan: ActionPlan;
}

async function createEnginesForUser(userId: string) {
  const samConfig = await getUserScopedSAMConfig(userId, 'analysis');

  return {
    market: createMarketEngine({ databaseAdapter: createMarketAdapter(db as never) }),
    guide: createCourseGuideEngine({ databaseAdapter: createCourseGuideAdapter(db as never) }),
    blooms: createUnifiedBloomsEngine({
      samConfig,
      database: getDatabaseAdapter(),
      defaultMode: 'standard',
      confidenceThreshold: 0.7,
      enableCache: true,
      cacheTTL: 3600,
    }),
    trends: createTrendsEngine({ samConfig, database: createTrendsAdapter(db as never) }),
    research: createResearchEngine({ samConfig }),
  };
}

function buildCourseInput(course: {
  id: string;
  title: string;
  description: string | null;
  chapters: Array<{
    id: string;
    title: string;
    position: number;
    sections: Array<{
      id: string;
      title: string;
      description: string | null;
      learningObjectives: string | null;
      type: string | null;
    }>;
  }>;
}): UnifiedCourseInput {
  return {
    id: course.id,
    title: course.title,
    description: course.description ?? undefined,
    chapters: course.chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      position: chapter.position,
      sections: chapter.sections.map((section) => ({
        id: section.id,
        title: section.title,
        description: section.description ?? undefined,
        content: section.learningObjectives ?? undefined,
        type: section.type ?? undefined,
        learningObjectives: section.learningObjectives
          ? [section.learningObjectives]
          : undefined,
      })),
    })),
  };
}

function buildIntegratedRecommendations(args: {
  market?: MarketAnalysisResponse | null;
  blooms?: UnifiedCourseResult | null;
  guide?: CourseGuideResponse | null;
  trends?: TrendAnalysis[] | null;
}): IntegratedRecommendation[] {
  const recommendations: IntegratedRecommendation[] = [];

  if (args.market?.marketValue?.score !== undefined) {
    const score = args.market.marketValue.score;
    recommendations.push({
      source: 'market',
      priority: score < 40 ? 'high' : score < 60 ? 'medium' : 'low',
      category: 'market-position',
      title: 'Strengthen market positioning',
      description: `Market value score is ${score}. Improve differentiation and demand signals.`,
      actions: [
        'Refine the course value proposition',
        'Update pricing or packaging strategy',
      ],
      expectedImpact: 'Increase perceived market value and enrollment conversion',
    });
  }

  if (args.blooms?.recommendations?.length) {
    for (const rec of args.blooms.recommendations.slice(0, 3)) {
      recommendations.push({
        source: 'blooms',
        priority: rec.priority === 'high' ? 'high' : rec.priority === 'medium' ? 'medium' : 'low',
        category: rec.type,
        title: `Boost ${rec.targetLevel} coverage`,
        description: rec.description,
        actions: rec.examples ?? [],
        expectedImpact: rec.expectedImpact,
      });
    }
  }

  if (args.guide?.recommendations?.content?.length) {
    for (const rec of args.guide.recommendations.content.slice(0, 2)) {
      recommendations.push({
        source: 'guide',
        priority: rec.type === 'add' ? 'high' : 'medium',
        category: `content-${rec.type}`,
        title: rec.target,
        description: rec.suggestion,
        actions: [],
        expectedImpact: rec.expectedImpact ?? 'Improve course effectiveness',
      });
    }
  }

  if (args.trends?.length) {
    recommendations.push({
      source: 'trends',
      priority: 'low',
      category: 'market-trends',
      title: 'Align with emerging trends',
      description: `Top trend: ${args.trends[0].title}`,
      actions: args.trends[0].keyInsights.slice(0, 2),
      expectedImpact: 'Increase relevance and long-term growth potential',
    });
  }

  return recommendations;
}

function buildActionPlan(recommendations: IntegratedRecommendation[]): ActionPlan {
  const toActionItem = (rec: IntegratedRecommendation): ActionItem => ({
    id: randomUUID(),
    title: rec.title,
    description: rec.description,
    engineSource: [rec.source],
    estimatedTime: rec.priority === 'critical' ? '1-2 days' : rec.priority === 'high' ? '1 week' : '2-4 weeks',
    requiredResources: ['Content updates', 'Instructor review'],
    successMetrics: [rec.expectedImpact],
  });

  return {
    immediate: recommendations.filter((r) => r.priority === 'critical' || r.priority === 'high').map(toActionItem),
    shortTerm: recommendations.filter((r) => r.priority === 'medium').map(toActionItem),
    longTerm: recommendations.filter((r) => r.priority === 'low').map(toActionItem),
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      courseId,
      userId = user.id,
      analysisDepth = 'comprehensive',
      enginePreferences,
    } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: {
        userId: true,
        organizationId: true,
        title: true,
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const adminAccount = await db.adminAccount.findUnique({
      where: { id: user.id },
    });
    const isAdmin = adminAccount?.role === 'ADMIN' || adminAccount?.role === 'SUPERADMIN';

    const hasAccess =
      course.userId === user.id ||
      (course.organizationId && (await checkOrganizationAccess(user.id, course.organizationId))) ||
      isAdmin;

    if (!hasAccess) {
      const enrollment = await db.enrollment.findFirst({
        where: {
          userId: user.id,
          courseId,
        },
      });

      if (!enrollment) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const engines = await createEnginesForUser(user.id);

    const courseWithContent = await db.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          include: {
            sections: true,
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!courseWithContent) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const courseInput = buildCourseInput(courseWithContent);

    const [marketInsights, bloomsProfile, courseGuide, trendsAnalysis, researchPapers, studentProgress] =
      await Promise.all([
        enginePreferences?.enableMarketAnalysis === false
          ? null
          : engines.market.analyzeCourse(courseId, 'comprehensive'),
        enginePreferences?.enableBloomsTracking === false
          ? null
          : engines.blooms.analyzeCourse(courseInput, {
              depth:
                analysisDepth === 'basic'
                  ? 'basic'
                  : analysisDepth === 'comprehensive'
                    ? 'comprehensive'
                    : 'detailed',
              includeRecommendations: true,
            }),
        enginePreferences?.enableCourseGuide === false
          ? null
          : engines.guide.generateCourseGuide(courseId),
        enginePreferences?.enableTrendsAnalysis === false
          ? null
          : engines.trends.getEducationalTrends(),
        enginePreferences?.enableResearchAccess === false
          ? null
          : engines.research.searchPapers({ query: course.title ?? courseId, limit: 5 }),
        getStudentProgress(userId, courseId),
      ]);

    const integratedRecommendations = buildIntegratedRecommendations({
      market: marketInsights,
      blooms: bloomsProfile,
      guide: courseGuide,
      trends: trendsAnalysis,
    });

    const actionPlan = buildActionPlan(integratedRecommendations);

    const analysis: IntegratedAnalysis = {
      courseId,
      timestamp: new Date(),
      marketInsights,
      bloomsProfile,
      examRecommendations: null,
      courseGuide,
      studentProgress,
      trendsAnalysis,
      newsDigest: null,
      researchPapers,
      integratedRecommendations,
      actionPlan,
    };

    await storeAnalysisResults(user.id, courseId, analysis, analysisDepth);

    return NextResponse.json({
      success: true,
      data: analysis,
      metadata: {
        courseId,
        courseTitle: course.title,
        analysisDepth,
        timestamp: new Date().toISOString(),
        userId: user.id,
      },
    });
  } catch (error) {
    logger.error('Integrated analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to perform integrated analysis' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const analysisId = searchParams.get('analysisId');

    if (!courseId && !analysisId) {
      return NextResponse.json(
        { error: 'Course ID or Analysis ID is required' },
        { status: 400 }
      );
    }

    const where: any = {
      userId: user.id,
      context: {
        path: ['type'],
        equals: 'INTEGRATED_ANALYSIS',
      },
    };

    if (courseId) {
      where.courseId = courseId;
    }

    if (analysisId) {
      where.id = analysisId;
    }

    const latestAnalysis = await db.sAMInteraction.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
    });

    if (!latestAnalysis) {
      return NextResponse.json(
        { error: 'No analysis found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: latestAnalysis.context,
      metadata: {
        analysisId: latestAnalysis.id,
        courseId: latestAnalysis.courseId,
        createdAt: latestAnalysis.createdAt,
      },
    });
  } catch (error) {
    logger.error('Get integrated analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analysis' },
      { status: 500 }
    );
  }
}

async function checkOrganizationAccess(userId: string, organizationId: string): Promise<boolean> {
  const membership = await db.organizationUser.findFirst({
    where: {
      userId,
      organizationId,
      role: 'ADMIN',
    },
  });

  return !!membership;
}

async function getStudentProgress(userId: string, courseId: string): Promise<Record<string, unknown> | null> {
  try {
    const [bloomsProgress, cognitiveProfile, recentMetrics] = await Promise.all([
      db.studentBloomsProgress.findUnique({
        where: {
          userId_courseId: { userId, courseId } as any,
        },
      }),
      db.studentCognitiveProfile.findUnique({
        where: { userId },
      }),
      db.bloomsPerformanceMetric.findMany({
        where: { userId, courseId },
        orderBy: { recordedAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      bloomsProgress,
      cognitiveProfile,
      recentMetrics,
    };
  } catch (error) {
    logger.warn('Failed to load student progress', error);
    return null;
  }
}

async function storeAnalysisResults(
  userId: string,
  courseId: string,
  analysis: IntegratedAnalysis,
  analysisDepth: string
): Promise<void> {
  try {
    await db.sAMInteraction.create({
      data: {
        userId,
        courseId,
        interactionType: 'CONTENT_GENERATE',
        context: {
          type: 'INTEGRATED_ANALYSIS',
          depth: analysisDepth,
          timestamp: analysis.timestamp,
          recommendationCount: analysis.integratedRecommendations.length,
          criticalActions: analysis.integratedRecommendations.filter(
            (r) => r.priority === 'critical'
          ).length,
          actionPlan: analysis.actionPlan,
          keyInsights: {
            marketValue: analysis.marketInsights?.marketValue?.score,
            bloomsBalance: analysis.bloomsProfile?.courseLevel?.balance,
            engagementLevel: analysis.courseGuide?.metrics?.engagement?.overallEngagement,
            successProbability: analysis.courseGuide?.successPrediction?.successProbability,
          },
        },
      },
    });
  } catch (error) {
    logger.error('Error storing analysis results:', error);
  }
}
