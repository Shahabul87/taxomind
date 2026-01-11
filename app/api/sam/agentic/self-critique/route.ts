/**
 * SAM Self-Critique API
 *
 * Enables AI responses to critique and improve themselves iteratively.
 * Uses the @sam-ai/agentic self-critique engine.
 *
 * Endpoints:
 * - POST: Run self-critique on a response
 * - GET: Get critique configuration info
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import {
  createSelfCritiqueEngine,
  createStrictSelfCritiqueEngine,
  createLenientSelfCritiqueEngine,
  CritiqueDimension,
  CritiqueSeverity,
  type SelfCritiqueInput,
  type SelfCritiqueLoopInput,
} from '@sam-ai/agentic';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ResponseTypeSchema = z.enum([
  'explanation',
  'answer',
  'hint',
  'feedback',
  'assessment',
  'recommendation',
  'clarification',
]);

const TargetAudienceSchema = z.enum([
  'beginner',
  'intermediate',
  'advanced',
  'expert',
]);

const CritiqueDimensionSchema = z.enum([
  'accuracy',
  'clarity',
  'completeness',
  'pedagogy',
  'engagement',
  'safety',
  'relevance',
  'structure',
]);

const ContextSchema = z.object({
  courseId: z.string().optional(),
  chapterId: z.string().optional(),
  sectionId: z.string().optional(),
  questionText: z.string().optional(),
  studentLevel: z.string().optional(),
  previousAttempts: z.number().int().min(0).optional(),
  relatedConcepts: z.array(z.string()).optional(),
});

const CritiqueRequestSchema = z.object({
  responseId: z.string().min(1),
  responseText: z.string().min(10, 'Response must be at least 10 characters'),
  responseType: ResponseTypeSchema,
  topic: z.string().optional(),
  context: ContextSchema.optional(),
  targetAudience: TargetAudienceSchema.optional(),
  learningObjectives: z.array(z.string()).optional(),
  enabledDimensions: z.array(CritiqueDimensionSchema).optional(),
  passThreshold: z.number().min(0).max(100).optional(),
  critiqueMode: z.enum(['standard', 'strict', 'lenient']).optional().default('standard'),
  runLoop: z.boolean().optional().default(false),
  maxIterations: z.number().int().min(1).max(10).optional().default(3),
  minImprovement: z.number().min(0).max(100).optional().default(5),
});

// ============================================================================
// POST - Run Self-Critique
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = CritiqueRequestSchema.parse(body);

    // Create engine based on mode
    let engine;
    switch (validated.critiqueMode) {
      case 'strict':
        engine = createStrictSelfCritiqueEngine();
        break;
      case 'lenient':
        engine = createLenientSelfCritiqueEngine();
        break;
      default:
        engine = createSelfCritiqueEngine({
          passThreshold: validated.passThreshold,
        });
    }

    const startTime = Date.now();

    if (validated.runLoop) {
      // Run iterative critique loop
      const loopInput: SelfCritiqueLoopInput = {
        responseId: validated.responseId,
        userId: session.user.id,
        sessionId: `session_${Date.now()}`,
        responseText: validated.responseText,
        responseType: validated.responseType,
        topic: validated.topic,
        context: validated.context,
        targetAudience: validated.targetAudience,
        learningObjectives: validated.learningObjectives,
        enabledDimensions: validated.enabledDimensions as SelfCritiqueInput['enabledDimensions'],
        passThreshold: validated.passThreshold,
        maxIterations: validated.maxIterations,
        minImprovement: validated.minImprovement,
      };

      const loopResult = await engine.runCritiqueLoop(loopInput);

      logger.info('[SELF_CRITIQUE] Loop completed', {
        userId: session.user.id,
        responseId: validated.responseId,
        totalIterations: loopResult.totalIterations,
        initialScore: loopResult.initialScore,
        finalScore: loopResult.finalScore,
        passed: loopResult.passed,
        processingTimeMs: Date.now() - startTime,
      });

      return NextResponse.json({
        success: true,
        data: {
          type: 'loop',
          responseId: loopResult.responseId,
          finalResponse: loopResult.finalResponse,
          finalScore: loopResult.finalScore,
          passed: loopResult.passed,
          iterations: loopResult.iterations.map((it) => ({
            iteration: it.iteration,
            score: it.critique.overallScore,
            passed: it.critique.passed,
            criticalFindings: it.critique.criticalFindings,
            majorFindings: it.critique.majorFindings,
            improvements: it.improvements,
            converged: it.converged,
            reason: it.reason,
          })),
          totalIterations: loopResult.totalIterations,
          maxIterationsReached: loopResult.maxIterationsReached,
          improvement: {
            initial: loopResult.initialScore,
            final: loopResult.finalScore,
            absolute: loopResult.scoreImprovement,
            percentage: loopResult.improvementPercentage,
          },
          findings: {
            total: loopResult.allFindings.length,
            resolved: loopResult.resolvedFindings.length,
            unresolved: loopResult.unresolvedFindings.map((f) => ({
              id: f.id,
              dimension: f.dimension,
              severity: f.severity,
              description: f.description,
              suggestedFix: f.suggestedFix,
            })),
          },
          processingTimeMs: loopResult.totalProcessingTimeMs,
          averageIterationTimeMs: loopResult.averageIterationTimeMs,
        },
      });
    }

    // Single critique
    const critiqueInput: SelfCritiqueInput = {
      responseId: validated.responseId,
      userId: session.user.id,
      sessionId: `session_${Date.now()}`,
      responseText: validated.responseText,
      responseType: validated.responseType,
      topic: validated.topic,
      context: validated.context,
      targetAudience: validated.targetAudience,
      learningObjectives: validated.learningObjectives,
      enabledDimensions: validated.enabledDimensions as SelfCritiqueInput['enabledDimensions'],
      passThreshold: validated.passThreshold,
    };

    const result = await engine.critique(critiqueInput);

    logger.info('[SELF_CRITIQUE] Single critique completed', {
      userId: session.user.id,
      responseId: validated.responseId,
      overallScore: result.overallScore,
      passed: result.passed,
      criticalFindings: result.criticalFindings,
      processingTimeMs: result.processingTimeMs,
    });

    return NextResponse.json({
      success: true,
      data: {
        type: 'single',
        id: result.id,
        responseId: result.responseId,
        overallScore: result.overallScore,
        passed: result.passed,
        passThreshold: result.passThreshold,
        requiresRevision: result.requiresRevision,
        dimensionScores: result.dimensionScores.map((ds) => ({
          dimension: ds.dimension,
          score: ds.score,
          weight: ds.weight,
          strengths: ds.strengths,
          improvements: ds.improvements,
          findingCount: ds.findings.length,
        })),
        findings: {
          total: result.findings.length,
          critical: result.criticalFindings,
          major: result.majorFindings,
          minor: result.minorFindings,
          items: result.findings.map((f) => ({
            id: f.id,
            dimension: f.dimension,
            severity: f.severity,
            description: f.description,
            location: f.location,
            suggestedFix: f.suggestedFix,
            confidence: f.confidence,
          })),
        },
        topImprovements: result.topImprovements.map((imp) => ({
          priority: imp.priority,
          dimension: imp.dimension,
          description: imp.description,
          estimatedImpact: imp.estimatedImpact,
          effort: imp.effort,
        })),
        processingTimeMs: result.processingTimeMs,
      },
    });
  } catch (error) {
    logger.error('[SELF_CRITIQUE] Error running critique:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to run self-critique' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Get Critique Configuration Info
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configInfo = {
      critiqueModes: [
        {
          mode: 'standard',
          description: 'Default critique with balanced thresholds',
          passThreshold: 75,
        },
        {
          mode: 'strict',
          description: 'Strict critique with higher standards',
          passThreshold: 85,
        },
        {
          mode: 'lenient',
          description: 'Lenient critique with relaxed standards',
          passThreshold: 60,
        },
      ],
      dimensions: [
        {
          dimension: CritiqueDimension.ACCURACY,
          description: 'Factual correctness and precision',
          weight: 0.2,
        },
        {
          dimension: CritiqueDimension.CLARITY,
          description: 'Readability and understandability',
          weight: 0.15,
        },
        {
          dimension: CritiqueDimension.COMPLETENESS,
          description: 'Coverage of topic and objectives',
          weight: 0.15,
        },
        {
          dimension: CritiqueDimension.PEDAGOGY,
          description: 'Educational effectiveness and scaffolding',
          weight: 0.15,
        },
        {
          dimension: CritiqueDimension.ENGAGEMENT,
          description: 'Tone and reader engagement',
          weight: 0.1,
        },
        {
          dimension: CritiqueDimension.SAFETY,
          description: 'Constructive framing and discouragement avoidance',
          weight: 0.1,
        },
        {
          dimension: CritiqueDimension.RELEVANCE,
          description: 'Focus on topic and avoiding tangents',
          weight: 0.1,
        },
        {
          dimension: CritiqueDimension.STRUCTURE,
          description: 'Organization and formatting',
          weight: 0.05,
        },
      ],
      severityLevels: [
        {
          severity: CritiqueSeverity.CRITICAL,
          description: 'Must be fixed - blocks quality gate',
          scoreImpact: -25,
        },
        {
          severity: CritiqueSeverity.MAJOR,
          description: 'Should be fixed - significant issue',
          scoreImpact: -15,
        },
        {
          severity: CritiqueSeverity.MINOR,
          description: 'Nice to fix - minor improvement',
          scoreImpact: -8,
        },
        {
          severity: CritiqueSeverity.SUGGESTION,
          description: 'Optional improvement suggestion',
          scoreImpact: -3,
        },
      ],
      responseTypes: [
        'explanation',
        'answer',
        'hint',
        'feedback',
        'assessment',
        'recommendation',
        'clarification',
      ],
      targetAudiences: ['beginner', 'intermediate', 'advanced', 'expert'],
      loopConfig: {
        defaultMaxIterations: 3,
        maxAllowedIterations: 10,
        defaultMinImprovement: 5,
        convergenceThreshold: 2,
      },
      defaultConfig: {
        passThreshold: 75,
        maxFindings: 20,
        maxImprovements: 10,
      },
    };

    return NextResponse.json({
      success: true,
      data: configInfo,
    });
  } catch (error) {
    logger.error('[SELF_CRITIQUE] Error getting config info:', error);

    return NextResponse.json(
      { error: 'Failed to get critique configuration' },
      { status: 500 }
    );
  }
}
