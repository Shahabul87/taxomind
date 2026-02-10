/**
 * Integrity API Route
 * Handles plagiarism detection, AI content detection, writing style consistency,
 * and comprehensive academic integrity checks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createSAMConfig } from '@sam-ai/core';
import { getSAMAdapter } from '@/lib/sam/ai-provider';
import {
  createIntegrityEngine,
  type IntegrityEngineConfig,
  type IntegrityRiskLevel,
} from '@sam-ai/educational';

// ============================================================================
// PER-REQUEST ENGINE FACTORY
// ============================================================================

async function createIntegrityEngineForUser(userId: string) {
  const aiAdapter = await getSAMAdapter({ userId, capability: 'analysis' });

  const samConfig = createSAMConfig({
    ai: aiAdapter,
    logger: {
      debug: (msg: string, data?: unknown) => logger.debug(msg, data),
      info: (msg: string, data?: unknown) => logger.info(msg, data),
      warn: (msg: string, data?: unknown) => logger.warn(msg, data),
      error: (msg: string, data?: unknown) => logger.error(msg, data),
    },
    features: {
      gamification: false,
      formSync: false,
      autoContext: true,
      emotionDetection: false,
      learningStyleDetection: false,
      streaming: false,
      analytics: true,
    },
  });

  const config: IntegrityEngineConfig = {
    samConfig,
    checkConfig: {
      enablePlagiarismCheck: true,
      enableAIDetection: true,
      enableConsistencyCheck: true,
      plagiarismThreshold: 30,
      aiProbabilityThreshold: 70,
      minTextLength: 50,
      compareWithCourseContent: true,
      compareWithOtherStudents: true,
      compareWithExternalSources: false,
    },
  };

  return createIntegrityEngine(config);
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const RiskLevelEnum = z.enum(['low', 'medium', 'high', 'critical']);

const SourceTypeEnum = z.enum(['student_answer', 'external_source', 'course_content']);

const CorpusEntrySchema = z.object({
  id: z.string().min(1),
  content: z.string().min(1),
  type: SourceTypeEnum,
});

const CheckPlagiarismSchema = z.object({
  text: z.string().min(1),
  corpus: z.array(CorpusEntrySchema).min(1),
});

const DetectAIContentSchema = z.object({
  text: z.string().min(1),
});

const CheckConsistencySchema = z.object({
  currentText: z.string().min(1),
  previousSubmissions: z.array(z.string()).min(1),
});

const RunIntegrityCheckSchema = z.object({
  answerId: z.string().min(1),
  text: z.string().min(1),
  studentId: z.string().min(1),
  examId: z.string().min(1),
  options: z.object({
    corpus: z.array(CorpusEntrySchema).optional(),
    previousSubmissions: z.array(z.string()).optional(),
  }).optional(),
});

const IntegritySubmissionSchema = z.object({
  answerId: z.string().min(1),
  text: z.string().min(1),
  studentId: z.string().min(1),
  examId: z.string().min(1),
});

const RunBatchIntegrityCheckSchema = z.object({
  submissions: z.array(IntegritySubmissionSchema).min(1).max(100),
});

const UpdateConfigSchema = z.object({
  enablePlagiarismCheck: z.boolean().optional(),
  enableAIDetection: z.boolean().optional(),
  enableConsistencyCheck: z.boolean().optional(),
  plagiarismThreshold: z.number().min(0).max(100).optional(),
  aiProbabilityThreshold: z.number().min(0).max(100).optional(),
  minTextLength: z.number().int().min(10).max(1000).optional(),
  compareWithCourseContent: z.boolean().optional(),
  compareWithOtherStudents: z.boolean().optional(),
  compareWithExternalSources: z.boolean().optional(),
});

const GetReportsSchema = z.object({
  studentId: z.string().optional(),
  examId: z.string().optional(),
  riskLevel: RiskLevelEnum.optional(),
  flaggedOnly: z.boolean().optional().default(false),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

// ============================================================================
// GET - Retrieve configuration or reports
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
    const engine = await createIntegrityEngineForUser(session.user.id);

    const endpoint = searchParams.get('endpoint') ?? 'config';

    if (endpoint === 'config') {
      const config = engine.getConfig();
      return NextResponse.json({
        success: true,
        data: config,
        metadata: { timestamp: new Date().toISOString() },
      });
    }

    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: `Unknown endpoint: ${endpoint}` } },
      { status: 400 }
    );
  } catch (error) {
    logger.error('[Integrity] GET error:', error);

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve integrity data' } },
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

    const engine = await createIntegrityEngineForUser(session.user.id);
    let result: unknown;

    switch (action) {
      case 'check-plagiarism': {
        const validated = CheckPlagiarismSchema.parse(data);
        result = await engine.checkPlagiarism(
          validated.text,
          validated.corpus
        );
        logger.info('[Integrity] Plagiarism check completed', {
          userId: session.user.id,
          corpusSize: validated.corpus.length,
          textLength: validated.text.length,
        });
        break;
      }

      case 'detect-ai-content': {
        const validated = DetectAIContentSchema.parse(data);
        result = await engine.detectAIContent(validated.text);
        logger.info('[Integrity] AI detection completed', {
          userId: session.user.id,
          textLength: validated.text.length,
        });
        break;
      }

      case 'check-consistency': {
        const validated = CheckConsistencySchema.parse(data);
        result = await engine.checkConsistency(
          validated.currentText,
          validated.previousSubmissions
        );
        logger.info('[Integrity] Consistency check completed', {
          userId: session.user.id,
          previousSubmissionCount: validated.previousSubmissions.length,
        });
        break;
      }

      case 'run-integrity-check': {
        const validated = RunIntegrityCheckSchema.parse(data);
        result = await engine.runIntegrityCheck(
          validated.answerId,
          validated.text,
          validated.studentId,
          validated.examId,
          validated.options
        );
        logger.info('[Integrity] Full integrity check completed', {
          userId: session.user.id,
          answerId: validated.answerId,
          studentId: validated.studentId,
          examId: validated.examId,
          riskLevel: (result as { overallRisk: IntegrityRiskLevel }).overallRisk,
        });
        break;
      }

      case 'run-batch-integrity-check': {
        const validated = RunBatchIntegrityCheckSchema.parse(data);
        result = await engine.runBatchIntegrityCheck(validated.submissions);
        logger.info('[Integrity] Batch integrity check completed', {
          userId: session.user.id,
          submissionCount: validated.submissions.length,
        });
        break;
      }

      case 'update-config': {
        const validated = UpdateConfigSchema.parse(data);
        engine.updateConfig(validated);
        result = engine.getConfig();
        logger.info('[Integrity] Config updated', {
          userId: session.user.id,
          updatedFields: Object.keys(validated),
        });
        break;
      }

      case 'get-config': {
        result = engine.getConfig();
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: { code: 'BAD_REQUEST', message: `Unknown action: ${action}` } },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      data: result,
      metadata: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('[Integrity] POST error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process integrity request' } },
      { status: 500 }
    );
  }
}
