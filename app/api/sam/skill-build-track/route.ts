/**
 * SkillBuildTrack API Route
 * Handles skill development tracking, practice logging, roadmap generation,
 * decay predictions, and skill insights.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createSAMConfig } from '@sam-ai/core';
import { getCoreAIAdapter } from '@/lib/sam/integration-adapters';
import {
  createSkillBuildTrackEngine,
  type SkillBuildTrackEngineConfig,
  type SkillBuildProficiencyLevel,
  type SkillBuildCategory,
  type SkillBuildEvidenceType,
} from '@sam-ai/educational';
import { getStore } from '@/lib/sam/taxomind-context';

// ============================================================================
// ENGINE SINGLETON
// ============================================================================

let skillBuildTrackEngine: ReturnType<typeof createSkillBuildTrackEngine> | null = null;

async function getSkillBuildTrackEngine() {
  if (!skillBuildTrackEngine) {
    // Use TaxomindContext for store access
    const store = getStore('skillBuildTrack');

    // Use integration adapter factory instead of hardcoding Anthropic
    const coreAiAdapter = await getCoreAIAdapter();
    const aiAdapter = coreAiAdapter ?? {
      // Fallback stub if no API key configured
      name: 'skill-build-track-fallback',
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

    const config: SkillBuildTrackEngineConfig = {
      samConfig,
      database: store as unknown as import('@sam-ai/core').SAMDatabaseAdapter,
      enableVelocityTracking: true,
      enableDecayPrediction: true,
      enableBenchmarking: true,
    };

    skillBuildTrackEngine = createSkillBuildTrackEngine(config);
  }
  return skillBuildTrackEngine;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ProficiencyLevelEnum = z.enum([
  'NOVICE', 'BEGINNER', 'COMPETENT', 'PROFICIENT', 'ADVANCED', 'EXPERT', 'STRATEGIST'
]);

const CategoryEnum = z.enum([
  'TECHNICAL', 'SOFT', 'DOMAIN', 'TOOL', 'METHODOLOGY', 'CERTIFICATION', 'LEADERSHIP'
]);

const EvidenceTypeEnum = z.enum([
  'ASSESSMENT', 'PROJECT', 'CERTIFICATION', 'COURSE_COMPLETION',
  'PEER_REVIEW', 'SELF_ASSESSMENT', 'PRACTICE_SESSION', 'REAL_WORLD', 'TEACHING'
]);

const GetProfileSchema = z.object({
  skillId: z.string().min(1),
  includeEvidence: z.boolean().optional().default(true),
  includeHistory: z.boolean().optional().default(false),
});

const GetUserProfilesSchema = z.object({
  category: CategoryEnum.optional(),
  minLevel: ProficiencyLevelEnum.optional(),
  includeDecayRisks: z.boolean().optional().default(true),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
});

const RecordPracticeSchema = z.object({
  skillId: z.string().min(1),
  durationMinutes: z.number().int().min(1).max(480),
  score: z.number().min(0).max(100).optional(),
  maxScore: z.number().min(0).max(100).optional().default(100),
  isAssessment: z.boolean().optional().default(false),
  completed: z.boolean().optional().default(true),
  sourceId: z.string().optional(),
  sourceType: z.enum(['COURSE', 'PROJECT', 'EXERCISE', 'ASSESSMENT', 'REAL_WORLD']).optional(),
  notes: z.string().max(1000).optional(),
});

const GetDecayPredictionsSchema = z.object({
  skillIds: z.array(z.string()).optional(),
  daysAhead: z.number().int().min(1).max(365).optional().default(30),
  includeReviewSchedule: z.boolean().optional().default(true),
});

const GenerateRoadmapSchema = z.object({
  targetType: z.enum(['ROLE', 'SKILL_SET', 'CERTIFICATION', 'CUSTOM']),
  targetId: z.string().optional(),
  targetSkills: z.array(z.object({
    skillId: z.string(),
    targetLevel: ProficiencyLevelEnum,
  })).optional(),
  targetCompletionDate: z.string().datetime().optional(),
  hoursPerWeek: z.number().min(1).max(40).optional().default(10),
  preferences: z.object({
    learningStyle: z.enum(['STRUCTURED', 'PROJECT_BASED', 'MIXED']).optional(),
    includeAssessments: z.boolean().optional(),
    prioritizeQuickWins: z.boolean().optional(),
    focusCategories: z.array(CategoryEnum).optional(),
  }).optional(),
});

const GetBenchmarkSchema = z.object({
  skillId: z.string().min(1),
  source: z.enum(['INDUSTRY', 'ROLE', 'PEER_GROUP', 'ORGANIZATION', 'MARKET']).optional(),
  roleId: z.string().optional(),
  industry: z.string().optional(),
});

const AddEvidenceSchema = z.object({
  skillId: z.string().min(1),
  type: EvidenceTypeEnum,
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  sourceId: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  score: z.number().min(0).max(100).optional(),
  maxScore: z.number().min(0).max(100).optional(),
  demonstratedLevel: ProficiencyLevelEnum,
  date: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
});

const GetInsightsSchema = z.object({
  includeRecommendations: z.boolean().optional().default(true),
  includeNextActions: z.boolean().optional().default(true),
  maxRecommendations: z.number().int().min(1).max(20).optional().default(10),
});

const GetPortfolioSchema = z.object({
  includeEmployability: z.boolean().optional().default(true),
  includeRecommendations: z.boolean().optional().default(true),
  targetRoleIds: z.array(z.string()).optional(),
});

// ============================================================================
// GET - Retrieve skill profiles or specific profile
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const engine = await getSkillBuildTrackEngine();

    // If skillId is provided, get specific profile
    const skillId = searchParams.get('skillId');
    if (skillId) {
      const profile = await engine.getSkillProfile({
        userId: session.user.id,
        skillId,
        includeEvidence: searchParams.get('includeEvidence') === 'true',
        includeHistory: searchParams.get('includeHistory') === 'true',
      });

      if (!profile) {
        return NextResponse.json({ error: 'Skill profile not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: profile });
    }

    // Otherwise, get all user profiles
    const query = GetUserProfilesSchema.parse({
      category: searchParams.get('category') ?? undefined,
      minLevel: searchParams.get('minLevel') ?? undefined,
      includeDecayRisks: searchParams.get('includeDecayRisks') !== 'false',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    });

    const result = await engine.getUserSkillProfiles({
      userId: session.user.id,
      category: query.category as SkillBuildCategory | undefined,
      minLevel: query.minLevel as SkillBuildProficiencyLevel | undefined,
      includeDecayRisks: query.includeDecayRisks,
      limit: query.limit,
      offset: query.offset,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error('[SkillBuildTrack] GET error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve skill profiles' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Action-based handler for various operations
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, data } = body;

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    const engine = await getSkillBuildTrackEngine();
    let result: unknown;

    switch (action) {
      case 'record-practice': {
        const validated = RecordPracticeSchema.parse(data);
        result = await engine.recordPractice({
          userId: session.user.id,
          ...validated,
        });
        logger.info('[SkillBuildTrack] Practice recorded', {
          userId: session.user.id,
          skillId: validated.skillId,
          score: validated.score,
        });
        break;
      }

      case 'get-decay-predictions': {
        const validated = GetDecayPredictionsSchema.parse(data || {});
        result = await engine.getDecayPredictions({
          userId: session.user.id,
          ...validated,
        });
        break;
      }

      case 'generate-roadmap': {
        const validated = GenerateRoadmapSchema.parse(data);
        result = await engine.generateRoadmap({
          userId: session.user.id,
          ...validated,
          targetCompletionDate: validated.targetCompletionDate
            ? new Date(validated.targetCompletionDate)
            : undefined,
        });
        logger.info('[SkillBuildTrack] Roadmap generated', {
          userId: session.user.id,
          targetType: validated.targetType,
        });
        break;
      }

      case 'get-benchmark': {
        const validated = GetBenchmarkSchema.parse(data);
        result = await engine.getSkillBenchmark({
          ...validated,
          userId: session.user.id,
        });
        break;
      }

      case 'add-evidence': {
        const validated = AddEvidenceSchema.parse(data);
        result = await engine.addEvidence({
          userId: session.user.id,
          ...validated,
          demonstratedLevel: validated.demonstratedLevel as SkillBuildProficiencyLevel,
          type: validated.type as SkillBuildEvidenceType,
          date: new Date(validated.date),
          expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : undefined,
        });
        logger.info('[SkillBuildTrack] Evidence added', {
          userId: session.user.id,
          skillId: validated.skillId,
          type: validated.type,
        });
        break;
      }

      case 'get-insights': {
        const validated = GetInsightsSchema.parse(data || {});
        result = await engine.getInsights({
          userId: session.user.id,
          ...validated,
        });
        break;
      }

      case 'get-portfolio': {
        const validated = GetPortfolioSchema.parse(data || {});
        result = await engine.getPortfolio({
          userId: session.user.id,
          ...validated,
        });
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, action, data: result });
  } catch (error) {
    logger.error('[SkillBuildTrack] POST error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process skill build track request' },
      { status: 500 }
    );
  }
}
