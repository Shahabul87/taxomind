/**
 * SAM Quality Validation API
 *
 * Validates AI-generated educational content through quality gates.
 * Uses the @sam-ai/quality package for comprehensive content validation.
 *
 * Endpoints:
 * - POST: Validate content through quality gates
 * - GET: Get validation history for a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withSubscriptionGate } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { withRetryableTimeout, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import {
  validateContent,
  quickValidateContent,
  type ContentType,
  type DifficultyLevel,
  type GeneratedContent,
  type ValidationResult,
} from '@sam-ai/quality';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ContentTypeSchema = z.enum([
  'lesson',
  'explanation',
  'exercise',
  'quiz',
  'assessment',
  'summary',
  'tutorial',
  'example',
  'feedback',
  'answer',
]);

const DifficultyLevelSchema = z.enum([
  'beginner',
  'intermediate',
  'advanced',
  'expert',
]);

const BloomsLevelSchema = z.enum([
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
]);

const ValidateContentSchema = z.object({
  content: z.string().min(10, 'Content must be at least 10 characters'),
  type: ContentTypeSchema,
  targetBloomsLevel: BloomsLevelSchema.optional(),
  targetDifficulty: DifficultyLevelSchema.optional(),
  expectedExamples: z.number().int().min(0).optional(),
  expectedSections: z.array(z.string()).optional(),
  context: z
    .object({
      courseId: z.string().optional(),
      sectionId: z.string().optional(),
      topic: z.string().optional(),
      prerequisites: z.array(z.string()).optional(),
      learningObjectives: z.array(z.string()).optional(),
      studentLevel: DifficultyLevelSchema.optional(),
    })
    .optional(),
  originalRequest: z.string().optional(),
  quickValidation: z.boolean().optional().default(false),
  config: z
    .object({
      threshold: z.number().min(0).max(100).optional(),
      enabledGates: z.array(z.string()).optional(),
      disabledGates: z.array(z.string()).optional(),
      enableEnhancement: z.boolean().optional(),
    })
    .optional(),
});

const GetHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  offset: z.coerce.number().int().min(0).optional().default(0),
  type: ContentTypeSchema.optional(),
  passed: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

// ============================================================================
// TYPES
// ============================================================================

interface QualityValidationRecord {
  id: string;
  userId: string;
  contentType: ContentType;
  passed: boolean;
  overallScore: number;
  gateResults: ValidationResult['gateResults'];
  failedGates: string[];
  criticalIssues: ValidationResult['criticalIssues'];
  suggestions: string[];
  processingTimeMs: number;
  createdAt: Date;
}

// ============================================================================
// POST - Validate Content
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gateResult = await withSubscriptionGate(session.user.id, { category: 'analysis' });
    if (!gateResult.allowed && gateResult.response) return gateResult.response;

    const body = await req.json();
    const validated = ValidateContentSchema.parse(body);

    // Build GeneratedContent object
    const generatedContent: GeneratedContent = {
      content: validated.content,
      type: validated.type as ContentType,
      targetBloomsLevel: validated.targetBloomsLevel,
      targetDifficulty: validated.targetDifficulty as DifficultyLevel | undefined,
      expectedExamples: validated.expectedExamples,
      expectedSections: validated.expectedSections,
      context: validated.context
        ? {
            courseId: validated.context.courseId,
            sectionId: validated.context.sectionId,
            topic: validated.context.topic,
            prerequisites: validated.context.prerequisites,
            learningObjectives: validated.context.learningObjectives,
            studentLevel: validated.context.studentLevel as DifficultyLevel | undefined,
          }
        : undefined,
      originalRequest: validated.originalRequest,
      generationMetadata: {
        timestamp: new Date().toISOString(),
      },
    };

    let result: ValidationResult | { passed: boolean; score: number; criticalIssues: ValidationResult['criticalIssues'] };
    const startTime = Date.now();

    if (validated.quickValidation) {
      // Quick validation - only essential gates
      result = await withRetryableTimeout(
        () => quickValidateContent(generatedContent),
        TIMEOUT_DEFAULTS.AI_ANALYSIS,
        'quality-quick-validate'
      );
    } else {
      // Full validation with all gates
      result = await withRetryableTimeout(
        () => validateContent(generatedContent, validated.config),
        TIMEOUT_DEFAULTS.AI_ANALYSIS,
        'quality-full-validate'
      );
    }

    const processingTime = Date.now() - startTime;

    // Transform result for API response - use type narrowing properly
    const isFullResult = 'gateResults' in result;
    const fullResult = isFullResult ? (result as ValidationResult) : null;
    const quickResult = !isFullResult ? (result as { passed: boolean; score: number; criticalIssues: ValidationResult['criticalIssues'] }) : null;

    const response = {
      passed: result.passed,
      overallScore: fullResult ? fullResult.overallScore : (quickResult?.score ?? 0),
      gateResults: fullResult?.gateResults ?? [],
      failedGates: fullResult?.failedGates ?? [],
      criticalIssues: result.criticalIssues,
      suggestions: fullResult?.allSuggestions ?? [],
      iterations: fullResult?.iterations ?? 1,
      processingTimeMs: processingTime,
      metadata: fullResult?.metadata ?? null,
    };

    logger.info('[QUALITY_VALIDATION] Content validated', {
      userId: session.user.id,
      type: validated.type,
      passed: result.passed,
      score: response.overallScore,
      processingTimeMs: processingTime,
    });

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('[QUALITY_VALIDATION] Error validating content:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to validate content' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Get Quality Gate Information
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return information about available quality gates
    const gateInfo = {
      gates: [
        {
          name: 'CompletenessGate',
          description: 'Validates content completeness including word count, sections, and objective coverage',
          weight: 1.0,
          applicableTypes: ['lesson', 'explanation', 'tutorial', 'summary'],
        },
        {
          name: 'ExampleQualityGate',
          description: 'Validates the quality and quantity of examples in content',
          weight: 1.0,
          applicableTypes: ['lesson', 'explanation', 'tutorial', 'example'],
        },
        {
          name: 'DifficultyMatchGate',
          description: 'Validates that content difficulty matches the target level',
          weight: 1.0,
          applicableTypes: ['lesson', 'explanation', 'exercise', 'quiz', 'assessment', 'tutorial'],
        },
        {
          name: 'StructureGate',
          description: 'Validates content structure including headings, lists, and formatting',
          weight: 1.0,
          applicableTypes: ['lesson', 'explanation', 'tutorial', 'summary'],
        },
        {
          name: 'DepthGate',
          description: 'Validates cognitive depth and critical thinking elements',
          weight: 1.0,
          applicableTypes: ['lesson', 'explanation', 'assessment', 'tutorial'],
        },
      ],
      contentTypes: [
        'lesson',
        'explanation',
        'exercise',
        'quiz',
        'assessment',
        'summary',
        'tutorial',
        'example',
        'feedback',
        'answer',
      ],
      difficultyLevels: ['beginner', 'intermediate', 'advanced', 'expert'],
      bloomsLevels: ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'],
      defaultConfig: {
        threshold: 75,
        maxIterations: 2,
        parallel: true,
        timeoutMs: 10000,
        enableEnhancement: true,
      },
    };

    return NextResponse.json({
      success: true,
      data: gateInfo,
    });
  } catch (error) {
    logger.error('[QUALITY_VALIDATION] Error getting gate info:', error);

    return NextResponse.json(
      { error: 'Failed to get quality gate information' },
      { status: 500 }
    );
  }
}
