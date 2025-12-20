/**
 * SAM Unified Streaming API Route
 * Real-time streaming responses with Server-Sent Events
 */

import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Import from @sam-ai/core package
import {
  SAMAgentOrchestrator,
  createSAMConfig,
  createDefaultContext,
  createAnthropicAdapter,
  createMemoryCache,
  createContextEngine,
  createBloomsEngine,
  createContentEngine,
  createPersonalizationEngine,
  createResponseEngine,
  type SAMConfig,
  type SAMContext,
  type SAMPageType,
  type SAMFormField,
} from '@/packages/core/src';

// Force Node.js runtime
export const runtime = 'nodejs';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const StreamRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  pageContext: z.object({
    type: z.string(),
    path: z.string(),
    entityId: z.string().optional(),
    parentEntityId: z.string().optional(),
    grandParentEntityId: z.string().optional(),
    capabilities: z.array(z.string()).optional(),
    breadcrumb: z.array(z.string()).optional(),
  }),
  formContext: z.object({
    formId: z.string().optional(),
    formName: z.string().optional(),
    fields: z.record(z.any()).optional(),
    isDirty: z.boolean().optional(),
  }).optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional(),
  options: z.object({
    engines: z.array(z.string()).optional(),
  }).optional()
});

// ============================================================================
// ORCHESTRATOR SINGLETON
// ============================================================================

let orchestrator: SAMAgentOrchestrator | null = null;
let samConfig: SAMConfig | null = null;

function getOrchestrator(): SAMAgentOrchestrator {
  if (orchestrator) {
    return orchestrator;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const aiAdapter = createAnthropicAdapter({
    apiKey,
    model: 'claude-sonnet-4-20250514',
    timeout: 60000,
    maxRetries: 2,
  });

  const cacheAdapter = createMemoryCache({
    maxSize: 1000,
    defaultTTL: 300,
  });

  samConfig = createSAMConfig({
    ai: aiAdapter,
    cache: cacheAdapter,
    logger: {
      debug: (msg, ...args) => logger.debug(msg, ...args),
      info: (msg, ...args) => logger.info(msg, ...args),
      warn: (msg, ...args) => logger.warn(msg, ...args),
      error: (msg, ...args) => logger.error(msg, ...args),
    },
    features: {
      gamification: true,
      formSync: true,
      autoContext: true,
      emotionDetection: true,
      learningStyleDetection: true,
      streaming: true,
      analytics: true,
    },
    model: {
      name: 'claude-sonnet-4-20250514',
      temperature: 0.7,
      maxTokens: 4096,
    },
    engine: {
      timeout: 30000,
      retries: 2,
      concurrency: 3,
      cacheEnabled: true,
      cacheTTL: 300,
    },
    maxConversationHistory: 20,
    personality: {
      name: 'SAM',
      greeting: 'Hello! I\'m SAM, your intelligent learning assistant.',
      tone: 'friendly and professional',
    },
  });

  orchestrator = new SAMAgentOrchestrator(samConfig);

  orchestrator.registerEngine(createContextEngine(samConfig));
  orchestrator.registerEngine(createBloomsEngine(samConfig));
  orchestrator.registerEngine(createContentEngine(samConfig));
  orchestrator.registerEngine(createPersonalizationEngine(samConfig));
  orchestrator.registerEngine(createResponseEngine(samConfig));

  logger.info('[SAM_STREAM] Orchestrator initialized with streaming support');

  return orchestrator;
}

// ============================================================================
// ENGINE PRESETS
// ============================================================================

const ENGINE_PRESETS: Record<string, string[]> = {
  quick: ['context', 'response'],
  standard: ['context', 'blooms', 'response'],
  full: ['context', 'blooms', 'content', 'personalization', 'response'],
  content: ['context', 'blooms', 'content', 'response'],
  learning: ['context', 'blooms', 'personalization', 'response'],
};

function getEnginePreset(pageType: string, hasForm: boolean): string[] {
  if (hasForm && ['section-detail', 'chapter-detail', 'course-detail'].includes(pageType)) {
    return ENGINE_PRESETS.full;
  }

  switch (pageType) {
    case 'section-detail':
    case 'chapter-detail':
      return ENGINE_PRESETS.standard;
    case 'course-detail':
    case 'course-create':
      return ENGINE_PRESETS.content;
    case 'learning':
    case 'exam':
      return ENGINE_PRESETS.learning;
    default:
      return ENGINE_PRESETS.quick;
  }
}

// ============================================================================
// STREAMING API HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Authentication check
    const user = await currentUser();
    if (!user?.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Please sign in to use SAM' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validation = StreamRequestSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('[SAM_STREAM] Invalid request:', validation.error.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: validation.error.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { message, pageContext, formContext, conversationHistory, options } = validation.data;

    logger.info('[SAM_STREAM] Processing streaming request:', {
      userId: user.id,
      pageType: pageContext.type,
      hasForm: !!formContext,
      messageLength: message.length,
    });

    // Build SAMContext
    const samContext: SAMContext = createDefaultContext({
      user: {
        id: user.id,
        role: (user as { isTeacher?: boolean }).isTeacher ? 'teacher' : 'student',
        name: user.name || undefined,
        email: user.email || undefined,
        preferences: {},
        capabilities: pageContext.capabilities || [],
      },
      page: {
        type: pageContext.type as SAMPageType,
        path: pageContext.path,
        entityId: pageContext.entityId,
        parentEntityId: pageContext.parentEntityId,
        grandParentEntityId: pageContext.grandParentEntityId,
        capabilities: pageContext.capabilities || [],
        breadcrumb: pageContext.breadcrumb || [],
      },
      form: formContext ? {
        formId: formContext.formId || 'detected-form',
        formName: formContext.formName || 'Page Form',
        fields: transformFormFields(formContext.fields || {}),
        isDirty: formContext.isDirty || false,
        isSubmitting: false,
        isValid: true,
        errors: {},
        touchedFields: new Set(),
        lastUpdated: new Date(),
      } : null,
      conversation: {
        id: null,
        messages: (conversationHistory || []).map((m, i) => ({
          id: `msg-${i}`,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(),
        })),
        isStreaming: true,
        lastMessageAt: new Date(),
        totalMessages: conversationHistory?.length || 0,
      },
    });

    // Determine which engines to run
    const hasForm = !!formContext && Object.keys(formContext.fields || {}).length > 0;
    const defaultEngines = getEnginePreset(pageContext.type, hasForm);
    const enginesToRun = options?.engines || defaultEngines;

    logger.debug('[SAM_STREAM] Running engines:', enginesToRun);

    // Get orchestrator
    const orch = getOrchestrator();

    // Create readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial event with metadata
          controller.enqueue(encoder.encode(`event: start\ndata: ${JSON.stringify({
            engines: enginesToRun,
            timestamp: new Date().toISOString(),
          })}\n\n`));

          // Run orchestrator (non-streaming for engine analysis first)
          const result = await orch.orchestrate(samContext, message, {
            engines: enginesToRun,
          });

          // Send insights event
          const contextData = result.results.context?.data as Record<string, unknown> | undefined;
          const bloomsData = result.results.blooms?.data as Record<string, unknown> | undefined;
          const contentData = result.results.content?.data as Record<string, unknown> | undefined;
          const personalizationData = result.results.personalization?.data as Record<string, unknown> | undefined;

          const insights = {
            blooms: bloomsData ? {
              distribution: (bloomsData as { analysis?: { distribution?: unknown } }).analysis?.distribution,
              dominantLevel: (bloomsData as { analysis?: { dominantLevel?: unknown } }).analysis?.dominantLevel,
              recommendations: (bloomsData as { recommendations?: unknown[] }).recommendations,
              gaps: (bloomsData as { analysis?: { gaps?: unknown[] } }).analysis?.gaps,
            } : undefined,
            content: contentData ? {
              metrics: (contentData as { metrics?: unknown }).metrics,
              suggestions: (contentData as { suggestions?: unknown[] }).suggestions,
              overallScore: (contentData as { overallScore?: number }).overallScore,
            } : undefined,
            personalization: personalizationData ? {
              learningStyle: (personalizationData as { learningStyle?: unknown }).learningStyle,
              cognitiveLoad: (personalizationData as { cognitiveLoad?: unknown }).cognitiveLoad,
              motivation: (personalizationData as { motivation?: unknown }).motivation,
            } : undefined,
            context: contextData ? {
              intent: (contextData as { queryAnalysis?: { intent?: string } }).queryAnalysis?.intent,
              keywords: (contextData as { queryAnalysis?: { keywords?: string[] } }).queryAnalysis?.keywords,
              complexity: (contextData as { queryAnalysis?: { complexity?: string } }).queryAnalysis?.complexity,
            } : undefined,
          };

          controller.enqueue(encoder.encode(`event: insights\ndata: ${JSON.stringify(insights)}\n\n`));

          // Stream the response content in chunks
          const responseText = result.response.message;
          const chunkSize = 20; // Characters per chunk for smooth streaming effect

          for (let i = 0; i < responseText.length; i += chunkSize) {
            const chunk = responseText.slice(i, i + chunkSize);
            controller.enqueue(encoder.encode(`event: content\ndata: ${JSON.stringify({ text: chunk })}\n\n`));
            // Small delay for streaming effect
            await new Promise(resolve => setTimeout(resolve, 30));
          }

          // Send suggestions
          if (result.response.suggestions && result.response.suggestions.length > 0) {
            controller.enqueue(encoder.encode(`event: suggestions\ndata: ${JSON.stringify(result.response.suggestions)}\n\n`));
          }

          // Send actions
          if (result.response.actions && result.response.actions.length > 0) {
            controller.enqueue(encoder.encode(`event: actions\ndata: ${JSON.stringify(result.response.actions)}\n\n`));
          }

          // Send completion event
          controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({
            success: result.success,
            metadata: {
              enginesRun: result.metadata.enginesExecuted,
              enginesFailed: result.metadata.enginesFailed,
              enginesCached: result.metadata.enginesCached,
              totalTime: result.metadata.totalExecutionTime,
              requestTime: Date.now() - startTime,
            },
          })}\n\n`));

          controller.close();

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error('[SAM_STREAM] Error:', errorMessage);

          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({
            error: errorMessage,
            recoverable: true,
          })}\n\n`));

          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[SAM_STREAM] Fatal error:', errorMessage);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to initialize streaming',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function transformFormFields(fields: Record<string, unknown>): Record<string, SAMFormField> {
  const result: Record<string, SAMFormField> = {};

  for (const [name, value] of Object.entries(fields)) {
    if (typeof value === 'object' && value !== null) {
      const field = value as Record<string, unknown>;
      result[name] = {
        name,
        value: field.value,
        type: (field.type as string) || 'text',
        label: field.label as string | undefined,
        placeholder: field.placeholder as string | undefined,
        required: field.required as boolean | undefined,
      };
    } else {
      result[name] = {
        name,
        value,
        type: 'text',
      };
    }
  }

  return result;
}
