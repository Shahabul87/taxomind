/**
 * Multimodal Input API Route
 * Handles voice transcription, image analysis, handwriting recognition,
 * and multimodal processing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createSAMConfig } from '@sam-ai/core';
import { getCoreAIAdapter } from '@/lib/sam/integration-adapters';
import {
  createMultimodalInputEngine,
  type MultimodalConfig,
  type MultimodalInputType,
} from '@sam-ai/educational';

// ============================================================================
// ENGINE SINGLETON
// ============================================================================

let multimodalEngine: ReturnType<typeof createMultimodalInputEngine> | null = null;

async function getMultimodalEngine() {
  if (!multimodalEngine) {
    const coreAiAdapter = await getCoreAIAdapter();
    const aiAdapter = coreAiAdapter ?? {
      name: 'multimodal-fallback',
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
        gamification: false,
        formSync: false,
        autoContext: true,
        emotionDetection: true,
        learningStyleDetection: true,
        streaming: false,
        analytics: true,
      },
    });

    const config: Partial<MultimodalConfig> = {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedFormats: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'mp3', 'wav', 'ogg', 'mp4', 'webm', 'pdf'],
      enableOCR: true,
      enableSpeechToText: true,
      enableHandwritingRecognition: true,
      defaultLanguage: 'en',
      qualityThreshold: 0.7,
      enableAIAnalysis: true,
      processingTimeout: 120,
      accessibility: {
        generateAltText: true,
        generateCaptions: true,
        enableTextToSpeech: true,
        highContrastMode: false,
        requirements: [],
      },
    };

    multimodalEngine = createMultimodalInputEngine(samConfig, config);
  }
  return multimodalEngine;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const InputTypeEnum = z.enum([
  'IMAGE', 'VOICE', 'HANDWRITING', 'VIDEO', 'DOCUMENT', 'MIXED'
]);

const MultimodalFileSchema = z.object({
  data: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  fileSize: z.number().int().min(0),
});

const ProcessingOptionsSchema = z.object({
  enableOCR: z.boolean().optional(),
  enableSpeechToText: z.boolean().optional(),
  enableHandwritingRecognition: z.boolean().optional(),
  targetLanguage: z.string().optional(),
  includeQualityCheck: z.boolean().optional(),
  generateAccessibilityData: z.boolean().optional(),
}).optional();

const ProcessInputSchema = z.object({
  file: MultimodalFileSchema,
  options: ProcessingOptionsSchema,
  courseId: z.string().optional(),
  assignmentId: z.string().optional(),
  questionId: z.string().optional(),
  expectedType: InputTypeEnum.optional(),
});

const BatchProcessSchema = z.object({
  files: z.array(MultimodalFileSchema).min(1).max(10),
  options: ProcessingOptionsSchema,
  courseId: z.string().optional(),
  assignmentId: z.string().optional(),
});

const ValidateInputSchema = z.object({
  file: MultimodalFileSchema,
});

const ExtractTextSchema = z.object({
  file: MultimodalFileSchema,
});

const AssessQualitySchema = z.object({
  file: MultimodalFileSchema,
});

const GetStatusSchema = z.object({
  inputId: z.string().min(1),
});

const GetStorageQuotaSchema = z.object({});

// ============================================================================
// GET - Retrieve processing status or storage quota
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
    const engine = await getMultimodalEngine();

    const endpoint = searchParams.get('endpoint') ?? 'quota';

    if (endpoint === 'quota') {
      const quota = await engine.getStorageQuota(session.user.id);
      return NextResponse.json({
        success: true,
        data: quota,
        metadata: { timestamp: new Date().toISOString() },
      });
    }

    if (endpoint === 'status') {
      const inputId = searchParams.get('inputId');
      if (!inputId) {
        return NextResponse.json(
          { success: false, error: { code: 'BAD_REQUEST', message: 'inputId parameter required' } },
          { status: 400 }
        );
      }

      const status = await engine.getProcessingStatus(inputId);
      return NextResponse.json({
        success: true,
        data: status,
        metadata: { timestamp: new Date().toISOString() },
      });
    }

    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: `Unknown endpoint: ${endpoint}` } },
      { status: 400 }
    );
  } catch (error) {
    logger.error('[Multimodal] GET error:', error);

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve multimodal data' } },
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

    const engine = await getMultimodalEngine();
    let result: unknown;

    switch (action) {
      case 'process-input': {
        const validated = ProcessInputSchema.parse(data);
        result = await engine.processInput({
          file: validated.file,
          options: validated.options ?? {},
          userId: session.user.id,
          courseId: validated.courseId,
          assignmentId: validated.assignmentId,
          questionId: validated.questionId,
          expectedType: validated.expectedType as MultimodalInputType | undefined,
        });
        logger.info('[Multimodal] Input processed', {
          userId: session.user.id,
          fileName: validated.file.fileName,
        });
        break;
      }

      case 'batch-process': {
        const validated = BatchProcessSchema.parse(data);
        result = await engine.processBatch({
          files: validated.files,
          options: validated.options ?? {},
          userId: session.user.id,
          courseId: validated.courseId,
          assignmentId: validated.assignmentId,
        });
        logger.info('[Multimodal] Batch processed', {
          userId: session.user.id,
          fileCount: validated.files.length,
        });
        break;
      }

      case 'validate-input': {
        const validated = ValidateInputSchema.parse(data);
        result = await engine.validateInput(validated.file);
        break;
      }

      case 'extract-text': {
        const validated = ExtractTextSchema.parse(data);
        result = await engine.extractText(validated.file);
        logger.info('[Multimodal] Text extracted', {
          userId: session.user.id,
          fileName: validated.file.fileName,
        });
        break;
      }

      case 'assess-quality': {
        const validated = AssessQualitySchema.parse(data);
        result = await engine.assessQuality(validated.file);
        break;
      }

      case 'get-status': {
        const validated = GetStatusSchema.parse(data);
        result = await engine.getProcessingStatus(validated.inputId);
        break;
      }

      case 'cancel-processing': {
        const validated = GetStatusSchema.parse(data);
        result = await engine.cancelProcessing(validated.inputId);
        break;
      }

      case 'get-storage-quota': {
        GetStorageQuotaSchema.parse(data || {});
        result = await engine.getStorageQuota(session.user.id);
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
    logger.error('[Multimodal] POST error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process multimodal request' } },
      { status: 500 }
    );
  }
}
