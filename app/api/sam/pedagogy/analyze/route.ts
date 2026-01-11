/**
 * SAM Pedagogy Analysis API
 *
 * Analyzes educational content for pedagogical effectiveness.
 * Uses the @sam-ai/pedagogy package for Bloom&apos;s alignment,
 * scaffolding evaluation, and ZPD analysis.
 *
 * Endpoints:
 * - POST: Analyze content pedagogically
 * - GET: Get evaluator information
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import {
  evaluatePedagogically,
  createBloomsPipeline,
  createScaffoldingPipeline,
  createZPDPipeline,
  type PedagogicalContent,
  type StudentCognitiveProfile,
  type BloomsLevel,
  type DifficultyLevel,
  type PedagogicalPipelineResult,
} from '@sam-ai/pedagogy';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const BloomsLevelSchema = z.enum([
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
]);

const DifficultyLevelSchema = z.enum([
  'beginner',
  'intermediate',
  'advanced',
  'expert',
]);

const ContentTypeSchema = z.enum([
  'lesson',
  'explanation',
  'exercise',
  'assessment',
  'feedback',
]);

const PriorContentSchema = z.object({
  topic: z.string(),
  bloomsLevel: BloomsLevelSchema,
  difficulty: DifficultyLevelSchema,
  conceptsIntroduced: z.array(z.string()),
});

const MasteryLevelSchema = z.object({
  topicId: z.string(),
  mastery: z.number().min(0).max(100),
  highestBloomsLevel: BloomsLevelSchema,
  confidence: z.number().min(0).max(1),
  lastAssessed: z.string(),
});

const KnowledgeGapSchema = z.object({
  topicId: z.string(),
  concept: z.string(),
  severity: z.enum(['minor', 'moderate', 'major', 'critical']),
  affectedPrerequisites: z.array(z.string()),
  suggestedRemediation: z.string().optional(),
});

const StudentProfileSchema = z.object({
  masteryLevels: z.record(z.string(), MasteryLevelSchema),
  demonstratedBloomsLevels: z.record(z.string(), BloomsLevelSchema),
  currentDifficultyLevel: DifficultyLevelSchema,
  learningVelocity: z.enum(['slow', 'moderate', 'fast', 'accelerated']),
  completedTopics: z.array(z.string()),
  inProgressTopics: z.array(z.string()),
  knowledgeGaps: z.array(KnowledgeGapSchema),
  recentPerformance: z.object({
    averageScore: z.number().min(0).max(100),
    trend: z.enum(['improving', 'stable', 'declining']),
    assessmentCount: z.number().int().min(0),
    timeSpentMinutes: z.number().min(0),
    engagementLevel: z.enum(['low', 'moderate', 'high']),
  }),
});

const AnalyzeContentSchema = z.object({
  content: z.string().min(10, 'Content must be at least 10 characters'),
  type: ContentTypeSchema,
  topic: z.string().optional(),
  targetBloomsLevel: BloomsLevelSchema.optional(),
  targetDifficulty: DifficultyLevelSchema.optional(),
  prerequisites: z.array(z.string()).optional(),
  learningObjectives: z.array(z.string()).optional(),
  priorContent: z.array(PriorContentSchema).optional(),
  studentProfile: StudentProfileSchema.optional(),
  evaluators: z.array(z.enum(['blooms', 'scaffolding', 'zpd'])).optional(),
  config: z
    .object({
      threshold: z.number().min(0).max(100).optional(),
      parallel: z.boolean().optional(),
      timeoutMs: z.number().int().min(1000).max(60000).optional(),
    })
    .optional(),
});

// ============================================================================
// POST - Analyze Content Pedagogically
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = AnalyzeContentSchema.parse(body);

    // Build PedagogicalContent object
    const pedagogicalContent: PedagogicalContent = {
      content: validated.content,
      type: validated.type,
      topic: validated.topic,
      targetBloomsLevel: validated.targetBloomsLevel as BloomsLevel | undefined,
      targetDifficulty: validated.targetDifficulty as DifficultyLevel | undefined,
      prerequisites: validated.prerequisites,
      learningObjectives: validated.learningObjectives,
      priorContent: validated.priorContent?.map((p) => ({
        topic: p.topic,
        bloomsLevel: p.bloomsLevel as BloomsLevel,
        difficulty: p.difficulty as DifficultyLevel,
        conceptsIntroduced: p.conceptsIntroduced,
      })),
    };

    // Build StudentCognitiveProfile if provided
    let studentProfile: StudentCognitiveProfile | undefined;
    if (validated.studentProfile) {
      const sp = validated.studentProfile;
      studentProfile = {
        masteryLevels: Object.fromEntries(
          Object.entries(sp.masteryLevels).map(([key, value]) => [
            key,
            {
              ...value,
              highestBloomsLevel: value.highestBloomsLevel as BloomsLevel,
            },
          ])
        ),
        demonstratedBloomsLevels: sp.demonstratedBloomsLevels as Record<string, BloomsLevel>,
        currentDifficultyLevel: sp.currentDifficultyLevel as DifficultyLevel,
        learningVelocity: sp.learningVelocity,
        completedTopics: sp.completedTopics,
        inProgressTopics: sp.inProgressTopics,
        knowledgeGaps: sp.knowledgeGaps,
        recentPerformance: sp.recentPerformance,
      };
    }

    // Run pedagogical evaluation
    const result = await evaluatePedagogically(pedagogicalContent, studentProfile, {
      evaluators: validated.evaluators,
      threshold: validated.config?.threshold,
      parallel: validated.config?.parallel,
      timeoutMs: validated.config?.timeoutMs,
    });

    // Transform result for API response
    const response = transformResult(result);

    logger.info('[PEDAGOGY_ANALYSIS] Content analyzed', {
      userId: session.user.id,
      type: validated.type,
      passed: result.passed,
      score: result.overallScore,
      evaluatorsRun: result.metadata.evaluatorsRun,
      processingTimeMs: result.metadata.totalTimeMs,
    });

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('[PEDAGOGY_ANALYSIS] Error analyzing content:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyze content' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Get Evaluator Information
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const evaluatorInfo = {
      evaluators: [
        {
          name: 'blooms',
          displayName: 'Bloom&apos;s Taxonomy Aligner',
          description: 'Evaluates content alignment with Bloom&apos;s cognitive levels',
          metrics: [
            'detectedDistribution',
            'dominantLevel',
            'alignmentStatus',
            'levelDistance',
            'verbAnalysis',
            'activityAnalysis',
          ],
        },
        {
          name: 'scaffolding',
          displayName: 'Scaffolding Evaluator',
          description: 'Evaluates instructional scaffolding and complexity progression',
          metrics: [
            'properlyScaffolded',
            'complexityProgression',
            'prerequisiteCoverage',
            'supportStructures',
            'gradualRelease',
          ],
        },
        {
          name: 'zpd',
          displayName: 'Zone of Proximal Development Evaluator',
          description: 'Evaluates content fit within student&apos;s ZPD',
          metrics: [
            'inZPD',
            'zpdZone',
            'challengeLevel',
            'supportAdequacy',
            'engagementPrediction',
            'personalizationFit',
          ],
          requiresStudentProfile: true,
        },
      ],
      bloomsLevels: [
        { level: 'REMEMBER', index: 0, description: 'Recall facts and basic concepts' },
        { level: 'UNDERSTAND', index: 1, description: 'Explain ideas or concepts' },
        { level: 'APPLY', index: 2, description: 'Use information in new situations' },
        { level: 'ANALYZE', index: 3, description: 'Draw connections among ideas' },
        { level: 'EVALUATE', index: 4, description: 'Justify a decision or course of action' },
        { level: 'CREATE', index: 5, description: 'Produce new or original work' },
      ],
      zpdZones: [
        { zone: 'TOO_EASY', description: 'Below current ability, may cause boredom' },
        { zone: 'COMFORT_ZONE', description: 'Slightly below, good for easy practice' },
        { zone: 'ZPD_LOWER', description: 'Lower ZPD, achievable with minimal help' },
        { zone: 'ZPD_OPTIMAL', description: 'Optimal ZPD, challenging but achievable' },
        { zone: 'ZPD_UPPER', description: 'Upper ZPD, challenging, needs support' },
        { zone: 'FRUSTRATION', description: 'Above ZPD, too difficult' },
        { zone: 'UNREACHABLE', description: 'Way beyond current ability' },
      ],
      gradualReleasePhases: [
        { phase: 'I_DO', description: 'Teacher models the skill or concept' },
        { phase: 'WE_DO', description: 'Guided practice with teacher support' },
        { phase: 'YOU_DO_TOGETHER', description: 'Collaborative practice with peers' },
        { phase: 'YOU_DO_ALONE', description: 'Independent practice' },
      ],
      defaultConfig: {
        evaluators: ['blooms', 'scaffolding', 'zpd'],
        threshold: 70,
        parallel: true,
        timeoutMs: 10000,
        requireStudentProfile: false,
      },
    };

    return NextResponse.json({
      success: true,
      data: evaluatorInfo,
    });
  } catch (error) {
    logger.error('[PEDAGOGY_ANALYSIS] Error getting evaluator info:', error);

    return NextResponse.json(
      { error: 'Failed to get evaluator information' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function transformResult(result: PedagogicalPipelineResult) {
  return {
    passed: result.passed,
    overallScore: result.overallScore,
    evaluators: {
      blooms: result.evaluatorResults.blooms
        ? {
            passed: result.evaluatorResults.blooms.passed,
            score: result.evaluatorResults.blooms.score,
            confidence: result.evaluatorResults.blooms.confidence,
            dominantLevel: result.evaluatorResults.blooms.dominantLevel,
            targetLevel: result.evaluatorResults.blooms.targetLevel,
            alignmentStatus: result.evaluatorResults.blooms.alignmentStatus,
            levelDistance: result.evaluatorResults.blooms.levelDistance,
            distribution: result.evaluatorResults.blooms.detectedDistribution,
            verbAnalysis: result.evaluatorResults.blooms.verbAnalysis,
            activityAnalysis: result.evaluatorResults.blooms.activityAnalysis,
          }
        : null,
      scaffolding: result.evaluatorResults.scaffolding
        ? {
            passed: result.evaluatorResults.scaffolding.passed,
            score: result.evaluatorResults.scaffolding.score,
            confidence: result.evaluatorResults.scaffolding.confidence,
            properlyScaffolded: result.evaluatorResults.scaffolding.properlyScaffolded,
            complexityProgression: result.evaluatorResults.scaffolding.complexityProgression,
            prerequisiteCoverage: result.evaluatorResults.scaffolding.prerequisiteCoverage,
            supportStructures: result.evaluatorResults.scaffolding.supportStructures,
            gradualRelease: result.evaluatorResults.scaffolding.gradualRelease,
          }
        : null,
      zpd: result.evaluatorResults.zpd
        ? {
            passed: result.evaluatorResults.zpd.passed,
            score: result.evaluatorResults.zpd.score,
            confidence: result.evaluatorResults.zpd.confidence,
            inZPD: result.evaluatorResults.zpd.inZPD,
            zpdZone: result.evaluatorResults.zpd.zpdZone,
            challengeLevel: result.evaluatorResults.zpd.challengeLevel,
            supportAdequacy: result.evaluatorResults.zpd.supportAdequacy,
            engagementPrediction: result.evaluatorResults.zpd.engagementPrediction,
            personalizationFit: result.evaluatorResults.zpd.personalizationFit,
          }
        : null,
    },
    issues: result.allIssues.map((issue) => ({
      type: issue.type,
      severity: issue.severity,
      description: issue.description,
      learningImpact: issue.learningImpact,
      suggestedFix: issue.suggestedFix,
    })),
    recommendations: result.allRecommendations,
    metadata: {
      processingTimeMs: result.metadata.totalTimeMs,
      evaluatorsRun: result.metadata.evaluatorsRun,
      studentProfileUsed: result.metadata.studentProfileUsed,
    },
  };
}
