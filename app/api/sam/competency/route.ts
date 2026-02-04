/**
 * Competency API Route
 * Handles skills framework management, competency assessment, career path analysis,
 * portfolio management, and job role matching.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createSAMConfig } from '@sam-ai/core';
import { getCoreAIAdapter } from '@/lib/sam/integration-adapters';
import {
  createCompetencyEngine,
  type CompetencyEngineConfig,
  type CompetencyFramework,
  type ProficiencyLevel,
  type CareerLevel,
  type PortfolioItemType,
} from '@sam-ai/educational';
import { enrichFeatureResponse } from '@/lib/sam/pipeline/feature-enrichment';

// ============================================================================
// ENGINE SINGLETON
// ============================================================================

let competencyEngine: ReturnType<typeof createCompetencyEngine> | null = null;

async function getCompetencyEngine() {
  if (!competencyEngine) {
    const coreAiAdapter = await getCoreAIAdapter();
    const aiAdapter = coreAiAdapter ?? {
      name: 'competency-fallback',
      version: '1.0.0',
      chat: async () => ({
        content: '',
        model: 'fallback',
        usage: { inputTokens: 0, outputTokens: 0 },
        finishReason: 'stop' as const,
      }),
      isConfigured: () => false,
      getModel: () => 'fallback',
    };

    const samConfig = createSAMConfig({
      ai: aiAdapter,
      logger: {
        debug: (msg: string, data?: unknown) => logger.debug(msg, data),
        info: (msg: string, data?: unknown) => logger.info(msg, data),
        warn: (msg: string, data?: unknown) => logger.warn(msg, data),
        error: (msg: string, data?: unknown) => logger.error(msg, data),
      },
      features: {
        gamification: true,
        formSync: false,
        autoContext: true,
        emotionDetection: false,
        learningStyleDetection: true,
        streaming: false,
        analytics: true,
      },
    });

    const config: CompetencyEngineConfig = {
      samConfig,
      enableAISkillExtraction: true,
      defaultFramework: 'CUSTOM',
      includeIndustryBenchmarks: true,
    };

    competencyEngine = createCompetencyEngine(config);
  }
  return competencyEngine;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ProficiencyLevelEnum = z.enum([
  'NOVICE', 'BEGINNER', 'COMPETENT', 'PROFICIENT', 'EXPERT', 'MASTER'
]);

const CareerLevelEnum = z.enum([
  'ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'PRINCIPAL', 'EXECUTIVE'
]);

const PortfolioItemTypeEnum = z.enum([
  'PROJECT', 'CERTIFICATION', 'COURSE', 'PUBLICATION', 'PRESENTATION',
  'OPEN_SOURCE', 'AWARD', 'VOLUNTEER', 'WORK_EXPERIENCE'
]);

const CreateSkillTreeSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  rootSkillId: z.string().min(1),
  targetRoles: z.array(z.string()).optional(),
  skills: z.array(z.object({
    skillId: z.string().min(1),
    tier: z.number().int().min(1),
    prerequisites: z.array(z.string()).optional(),
    isMilestone: z.boolean().optional(),
  })).min(1),
});

const GetUserCompetencySchema = z.object({
  includeRecommendations: z.boolean().optional().default(true),
  targetRoleIds: z.array(z.string()).optional(),
});

const MatchJobRolesSchema = z.object({
  industry: z.string().optional(),
  levels: z.array(CareerLevelEnum).optional(),
  minMatchScore: z.number().min(0).max(100).optional(),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

const AnalyzeCareerPathSchema = z.object({
  targetRoleId: z.string().optional(),
  targetIndustry: z.string().optional(),
  maxYearsHorizon: z.number().int().min(1).max(20).optional(),
});

const AddPortfolioItemSchema = z.object({
  type: PortfolioItemTypeEnum,
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  date: z.string().datetime(),
  demonstratedSkills: z.array(z.object({
    skillId: z.string().min(1),
    proficiency: ProficiencyLevelEnum,
    evidence: z.string().min(1),
  })).min(1),
  artifacts: z.array(z.object({
    type: z.enum(['IMAGE', 'DOCUMENT', 'VIDEO', 'CODE', 'LINK', 'PRESENTATION']),
    title: z.string().min(1),
    url: z.string().url().optional(),
    description: z.string().optional(),
  })).optional(),
  visibility: z.enum(['PUBLIC', 'CONNECTIONS', 'PRIVATE']).optional().default('PRIVATE'),
});

const UpdateProficiencySchema = z.object({
  skillId: z.string().min(1),
  proficiency: ProficiencyLevelEnum,
  score: z.number().min(0).max(100).optional(),
  evidence: z.object({
    type: z.enum(['COURSE', 'CERTIFICATION', 'PROJECT', 'ASSESSMENT', 'PEER_REVIEW', 'SELF_REPORT']),
    description: z.string().min(1),
    sourceId: z.string().optional(),
  }).optional(),
});

const ExtractSkillsSchema = z.object({
  content: z.string().min(10),
  contentType: z.enum(['JOB_POSTING', 'RESUME', 'COURSE', 'PROJECT', 'ARTICLE']),
  context: z.object({
    industry: z.string().optional(),
    level: CareerLevelEnum.optional(),
  }).optional(),
});

const GenerateSkillTreeSchema = z.object({
  targetRole: z.string().min(1),
  currentSkills: z.array(z.string()).optional(),
  timeframeMonths: z.number().int().min(1).max(60).optional(),
  preferredLearningStyle: z.enum(['STRUCTURED', 'PROJECT_BASED', 'MIXED']).optional(),
});

const GetSkillGapAnalysisSchema = z.object({
  targetRoleId: z.string().optional(),
  targetSkillIds: z.array(z.string()).optional(),
});

// ============================================================================
// GET - Retrieve competency profile or portfolio
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const engine = await getCompetencyEngine();

    // Support both 'action' (frontend) and 'endpoint' param names
    const endpoint = searchParams.get('endpoint') ?? searchParams.get('action') ?? 'profile';

    if (endpoint === 'get-assessment') {
      // Aggregate profile + portfolio + skills into CompetencyAssessment shape
      const frameworkId = searchParams.get('frameworkId') ?? undefined;

      const profile = engine.getUserCompetency({
        userId: session.user.id,
        includeRecommendations: true,
      });
      const portfolio = engine.getUserPortfolio(session.user.id);
      const gapAnalysis = engine.getSkillGapAnalysis({ userId: session.user.id });

      const profileData = profile as Record<string, unknown>;
      const portfolioData = (portfolio ?? []) as Array<Record<string, unknown>>;
      const gapData = gapAnalysis as Record<string, unknown>;

      const assessment = {
        overallScore: profileData?.overallScore ?? 0,
        levelDistribution: profileData?.levelDistribution ?? {},
        topCompetencies: profileData?.skills ?? profileData?.competencies ?? [],
        competencyGaps: gapData?.gaps ?? gapData?.skillGaps ?? [],
        careerPaths: profileData?.careerPaths ?? [],
        portfolio: portfolioData,
        recommendations: profileData?.recommendations ?? [],
        lastUpdated: new Date().toISOString(),
        frameworkId,
      };

      return NextResponse.json({
        success: true,
        data: { assessment },
        metadata: { timestamp: new Date().toISOString() },
      });
    }

    if (endpoint === 'profile') {
      const includeRecommendations = searchParams.get('includeRecommendations') !== 'false';
      const targetRoleIdsParam = searchParams.get('targetRoleIds');
      const targetRoleIds = targetRoleIdsParam ? targetRoleIdsParam.split(',') : undefined;

      const profile = engine.getUserCompetency({
        userId: session.user.id,
        includeRecommendations,
        targetRoleIds,
      });

      return NextResponse.json({
        success: true,
        data: profile,
        metadata: { timestamp: new Date().toISOString() },
      });
    }

    if (endpoint === 'portfolio') {
      const portfolio = engine.getUserPortfolio(session.user.id);

      return NextResponse.json({
        success: true,
        data: portfolio,
        metadata: { timestamp: new Date().toISOString() },
      });
    }

    if (endpoint === 'skill-tree') {
      const treeId = searchParams.get('treeId');
      if (!treeId) {
        return NextResponse.json(
          { success: false, error: { code: 'BAD_REQUEST', message: 'treeId parameter required' } },
          { status: 400 }
        );
      }

      const skillTree = engine.getSkillTree(treeId);

      return NextResponse.json({
        success: true,
        data: skillTree,
        metadata: { timestamp: new Date().toISOString() },
      });
    }

    if (endpoint === 'skills') {
      const skills = engine.getAllSkills();

      return NextResponse.json({
        success: true,
        data: skills,
        metadata: { timestamp: new Date().toISOString() },
      });
    }

    if (endpoint === 'job-roles') {
      const roles = engine.getAllJobRoles();

      return NextResponse.json({
        success: true,
        data: roles,
        metadata: { timestamp: new Date().toISOString() },
      });
    }

    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: `Unknown endpoint: ${endpoint}` } },
      { status: 400 }
    );
  } catch (error) {
    logger.error('[Competency] GET error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid parameters', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve competency data' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Action-based handler for various operations
// ============================================================================

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action, data } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Missing action parameter' } },
        { status: 400 }
      );
    }

    const engine = await getCompetencyEngine();
    let result: unknown;

    switch (action) {
      case 'create-skill-tree': {
        const validated = CreateSkillTreeSchema.parse(data);
        result = engine.createSkillTree(validated);
        logger.info('[Competency] Skill tree created', {
          userId: session.user.id,
          name: validated.name,
        });
        break;
      }

      case 'get-user-competency': {
        const validated = GetUserCompetencySchema.parse(data ?? {});
        result = engine.getUserCompetency({
          userId: session.user.id,
          ...validated,
        });
        break;
      }

      case 'match-job-roles': {
        const validated = MatchJobRolesSchema.parse(data ?? {});
        result = engine.matchJobRoles({
          userId: session.user.id,
          ...validated,
          levels: validated.levels as CareerLevel[] | undefined,
        });
        logger.info('[Competency] Job roles matched', {
          userId: session.user.id,
          industry: validated.industry,
        });
        break;
      }

      case 'analyze-career-path': {
        const validated = AnalyzeCareerPathSchema.parse(data ?? {});
        result = engine.analyzeCareerPath({
          userId: session.user.id,
          ...validated,
        });
        break;
      }

      case 'add-portfolio-item': {
        const validated = AddPortfolioItemSchema.parse(data);
        result = engine.addPortfolioItem({
          userId: session.user.id,
          type: validated.type as PortfolioItemType,
          title: validated.title,
          description: validated.description,
          date: new Date(validated.date),
          demonstratedSkills: validated.demonstratedSkills.map(s => ({
            skillId: s.skillId,
            proficiency: s.proficiency as ProficiencyLevel,
            evidence: s.evidence,
          })),
          artifacts: validated.artifacts,
          visibility: validated.visibility,
        });
        logger.info('[Competency] Portfolio item added', {
          userId: session.user.id,
          type: validated.type,
          title: validated.title,
        });
        break;
      }

      case 'update-proficiency': {
        const validated = UpdateProficiencySchema.parse(data);
        result = engine.updateProficiency({
          userId: session.user.id,
          skillId: validated.skillId,
          proficiency: validated.proficiency as ProficiencyLevel,
          score: validated.score,
          evidence: validated.evidence,
        });
        logger.info('[Competency] Proficiency updated', {
          userId: session.user.id,
          skillId: validated.skillId,
          proficiency: validated.proficiency,
        });
        break;
      }

      case 'extract-skills': {
        const validated = ExtractSkillsSchema.parse(data);
        result = await engine.extractSkills({
          content: validated.content,
          contentType: validated.contentType,
          context: validated.context ? {
            industry: validated.context.industry,
            level: validated.context.level as CareerLevel | undefined,
          } : undefined,
        });
        break;
      }

      case 'generate-skill-tree': {
        const validated = GenerateSkillTreeSchema.parse(data);
        result = await engine.generateSkillTree(validated);
        break;
      }

      case 'get-skill-gap-analysis': {
        const validated = GetSkillGapAnalysisSchema.parse(data ?? {});
        result = engine.getSkillGapAnalysis({
          userId: session.user.id,
          ...validated,
        });
        break;
      }

      case 'get-user-portfolio': {
        result = engine.getUserPortfolio(session.user.id);
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: { code: 'BAD_REQUEST', message: `Unknown action: ${action}` } },
          { status: 400 }
        );
    }

    // Fire-and-forget enrichment
    void enrichFeatureResponse({
      userId: session.user.id,
      featureName: 'competency',
      action,
      requestData: (data as Record<string, unknown>) ?? {},
      responseData: (result as Record<string, unknown>) ?? {},
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      action,
      data: result,
      metadata: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('[Competency] POST error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process competency request' } },
      { status: 500 }
    );
  }
}
