/**
 * SAM Unified API Route
 * Uses @sam-ai/core orchestrator with all 6 engines
 * Now with FULL context awareness - fetches actual entity data!
 */

import { NextRequest, NextResponse } from 'next/server';
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

// Import entity context service for REAL context awareness
import { buildEntityContext, buildFormSummary } from '@/lib/sam/entity-context';

// Force Node.js runtime
export const runtime = 'nodejs';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const UnifiedRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  pageContext: z.object({
    type: z.string(),
    path: z.string(),
    entityId: z.string().optional(),
    parentEntityId: z.string().optional(),
    grandParentEntityId: z.string().optional(),
    capabilities: z.array(z.string()).optional(),
    breadcrumb: z.array(z.string()).optional(),
    // Client-provided entity data from window context (SimpleCourseContext, etc.)
    entityData: z.object({
      title: z.string().optional(),
      description: z.string().nullable().optional(),
      whatYouWillLearn: z.array(z.string()).optional(),
      learningObjectives: z.array(z.string()).optional(),
      isPublished: z.boolean().optional(),
      categoryId: z.string().nullable().optional(),
      price: z.number().nullable().optional(),
      imageUrl: z.string().nullable().optional(),
      chapterCount: z.number().optional(),
      publishedChapters: z.number().optional(),
      chapters: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().nullable().optional(),
        isPublished: z.boolean().optional(),
        isFree: z.boolean().optional(),
        position: z.number().optional(),
        sectionCount: z.number().optional(),
        sections: z.array(z.object({
          id: z.string(),
          title: z.string(),
          isPublished: z.boolean().optional(),
        })).optional(),
      })).optional(),
      // Chapter-specific
      courseId: z.string().optional(),
      courseTitle: z.string().optional(),
      sectionCount: z.number().optional(),
      sections: z.array(z.object({
        id: z.string(),
        title: z.string(),
        isPublished: z.boolean().optional(),
      })).optional(),
      // Section-specific
      chapterId: z.string().optional(),
      chapterTitle: z.string().optional(),
      content: z.string().nullable().optional(),
      contentType: z.string().nullable().optional(),
      videoUrl: z.string().nullable().optional(),
    }).optional(),
    entityType: z.enum(['course', 'chapter', 'section']).optional(),
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
    stream: z.boolean().optional(),
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

  // Create AI adapter
  const aiAdapter = createAnthropicAdapter({
    apiKey,
    model: 'claude-sonnet-4-20250514',
    timeout: 60000,
    maxRetries: 2,
  });

  // Create cache adapter
  const cacheAdapter = createMemoryCache({
    maxSize: 1000,
    defaultTTL: 300,
  });

  // Create SAM configuration
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
      gamification: false, // Phase 4
      formSync: true,
      autoContext: true,
      emotionDetection: true,
      learningStyleDetection: true,
      streaming: false, // Phase 4
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

  // Create orchestrator
  orchestrator = new SAMAgentOrchestrator(samConfig);

  // Register all engines
  orchestrator.registerEngine(createContextEngine(samConfig));
  orchestrator.registerEngine(createBloomsEngine(samConfig));
  orchestrator.registerEngine(createContentEngine(samConfig));
  orchestrator.registerEngine(createPersonalizationEngine(samConfig));
  orchestrator.registerEngine(createResponseEngine(samConfig));

  logger.info('[SAM_UNIFIED] Orchestrator initialized with all engines');

  return orchestrator;
}

// ============================================================================
// ENGINE PRESETS
// ============================================================================

const ENGINE_PRESETS: Record<string, string[]> = {
  // Quick chat - minimal engines for fast response
  quick: ['context', 'response'],

  // Standard chat - with Bloom's analysis
  standard: ['context', 'blooms', 'response'],

  // Full analysis - all engines
  full: ['context', 'blooms', 'content', 'personalization', 'response'],

  // Content focused
  content: ['context', 'blooms', 'content', 'response'],

  // Learning focused
  learning: ['context', 'blooms', 'personalization', 'response'],
};

function getEnginePreset(pageType: string, hasForm: boolean, message?: string): string[] {
  const lowerMessage = (message || '').toLowerCase();

  // Use quick preset for simple queries (faster response)
  const isSimpleQuery = lowerMessage.length < 50 &&
    !lowerMessage.includes('generate') &&
    !lowerMessage.includes('create') &&
    !lowerMessage.includes('analyze') &&
    !lowerMessage.includes('improve');

  if (isSimpleQuery) {
    return ENGINE_PRESETS.quick;
  }

  // Use content preset only for generation/creation requests
  const isGenerationRequest = lowerMessage.includes('generate') ||
    lowerMessage.includes('create') ||
    lowerMessage.includes('write') ||
    lowerMessage.includes('draft');

  if (isGenerationRequest) {
    return ENGINE_PRESETS.content;
  }

  // Use standard for analysis requests
  const isAnalysisRequest = lowerMessage.includes('analyze') ||
    lowerMessage.includes('review') ||
    lowerMessage.includes('check') ||
    lowerMessage.includes('improve');

  if (isAnalysisRequest) {
    return ENGINE_PRESETS.standard;
  }

  // Default to quick for faster response
  return ENGINE_PRESETS.quick;
}

// ============================================================================
// API HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Authentication check
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to use SAM' },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validation = UnifiedRequestSchema.safeParse(body);

    if (!validation.success) {
      logger.warn('[SAM_UNIFIED] Invalid request:', validation.error.errors);
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { message, pageContext, formContext, conversationHistory, options } = validation.data;

    const hasClientEntityData = !!pageContext.entityData?.title;

    logger.info('[SAM_UNIFIED] Processing request:', {
      userId: user.id,
      pageType: pageContext.type,
      hasForm: !!formContext,
      messageLength: message.length,
      entityId: pageContext.entityId,
      hasClientEntityData,
      clientEntityTitle: pageContext.entityData?.title,
    });

    // Use client-provided entity data if available, otherwise fetch from database
    // Client data comes from SimpleCourseContext which has already loaded the data
    let entityContext: Awaited<ReturnType<typeof buildEntityContext>>;

    if (hasClientEntityData && pageContext.entityData) {
      // Client provided entity data - use it directly (faster, no DB call needed)
      const clientData = pageContext.entityData;
      const entityType = pageContext.entityType || 'course';

      logger.debug('[SAM_UNIFIED] Using client-provided entity data:', {
        type: entityType,
        title: clientData.title,
        hasChapters: !!clientData.chapters?.length,
      });

      // Build entity context from client data
      entityContext = {
        type: entityType as 'course' | 'chapter' | 'section' | 'none',
        course: entityType === 'course' || clientData.courseTitle ? {
          id: pageContext.entityId || '',
          title: clientData.title || clientData.courseTitle || '',
          description: clientData.description || null,
          subtitle: null,
          courseGoals: null,
          whatYouWillLearn: clientData.whatYouWillLearn || clientData.learningObjectives || [],
          prerequisites: null,
          difficulty: null,
          categoryName: null,
          isPublished: clientData.isPublished ?? false,
          chapterCount: clientData.chapterCount || clientData.chapters?.length || 0,
          chapters: clientData.chapters?.map(ch => ({
            id: ch.id,
            title: ch.title,
            position: ch.position || 0,
            sectionCount: ch.sectionCount || ch.sections?.length || 0,
          })) || [],
        } : undefined,
        chapter: entityType === 'chapter' ? {
          id: pageContext.entityId || '',
          title: clientData.title || '',
          description: clientData.description || null,
          position: 0,
          courseTitle: clientData.courseTitle || '',
          courseId: clientData.courseId || '',
          sections: clientData.sections?.map(s => ({
            id: s.id,
            title: s.title,
            position: 0,
            contentType: null,
          })) || [],
        } : undefined,
        section: entityType === 'section' ? {
          id: pageContext.entityId || '',
          title: clientData.title || '',
          description: clientData.description || null,
          content: clientData.content || null,
          position: 0,
          chapterTitle: clientData.chapterTitle || '',
          chapterId: clientData.chapterId || '',
          courseTitle: clientData.courseTitle || '',
          courseId: clientData.courseId || '',
          videoUrl: clientData.videoUrl || null,
          contentType: clientData.contentType || null,
        } : undefined,
        summary: buildClientEntitySummary(clientData, entityType),
      };
    } else {
      // No client data - fetch from database (fallback)
      entityContext = await buildEntityContext(
        pageContext.type,
        pageContext.entityId,
        pageContext.parentEntityId,
        pageContext.grandParentEntityId
      );
    }

    logger.debug('[SAM_UNIFIED] Entity context ready:', {
      type: entityContext.type,
      hasEntity: entityContext.type !== 'none',
      summaryLength: entityContext.summary.length,
      source: hasClientEntityData ? 'client' : 'database',
    });

    // Build form summary for context
    const formSummary = buildFormSummary(formContext?.fields);

    // Build SAMContext with REAL entity data
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
        // CRITICAL: Pass actual entity data in metadata for context awareness
        metadata: {
          entityContext,
          entitySummary: entityContext.summary,
          formSummary,
          // Include specific entity data for easy access
          courseTitle: entityContext.course?.title,
          courseDescription: entityContext.course?.description,
          chapterTitle: entityContext.chapter?.title,
          sectionTitle: entityContext.section?.title,
          sectionContent: entityContext.section?.content,
        },
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
        isStreaming: false,
        lastMessageAt: new Date(),
        totalMessages: conversationHistory?.length || 0,
      },
    });

    // Determine which engines to run based on message intent
    const hasForm = !!formContext && Object.keys(formContext.fields || {}).length > 0;
    const defaultEngines = getEnginePreset(pageContext.type, hasForm, message);
    const enginesToRun = options?.engines || defaultEngines;

    logger.debug('[SAM_UNIFIED] Running engines:', { engines: enginesToRun, messageLength: message.length });

    // Get orchestrator and run
    const orch = getOrchestrator();
    const result = await orch.orchestrate(samContext, message, {
      engines: enginesToRun,
    });

    // Extract data from results
    const contextData = result.results.context?.data as Record<string, unknown> | undefined;
    const bloomsData = result.results.blooms?.data as Record<string, unknown> | undefined;
    const contentData = result.results.content?.data as Record<string, unknown> | undefined;
    const personalizationData = result.results.personalization?.data as Record<string, unknown> | undefined;

    // Build response
    const response = {
      success: result.success,
      response: result.response.message,
      suggestions: result.response.suggestions || [],
      actions: result.response.actions || [],
      insights: {
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
      },
      metadata: {
        enginesRun: result.metadata.enginesExecuted,
        enginesFailed: result.metadata.enginesFailed,
        enginesCached: result.metadata.enginesCached,
        totalTime: result.metadata.totalExecutionTime,
        requestTime: Date.now() - startTime,
      },
    };

    logger.info('[SAM_UNIFIED] Request completed:', {
      success: result.success,
      enginesRun: result.metadata.enginesExecuted.length,
      totalTime: result.metadata.totalExecutionTime,
    });

    return NextResponse.json(response);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[SAM_UNIFIED] Error:', errorMessage);

    // Return graceful error response
    return NextResponse.json({
      success: false,
      response: 'I apologize, but I encountered an issue processing your request. Please try again.',
      suggestions: [
        { id: 'retry', label: 'Try again', text: 'Please try my request again', type: 'quick-reply' as const },
        { id: 'help', label: 'Get help', text: 'What can you help me with?', type: 'quick-reply' as const },
      ],
      actions: [],
      insights: {},
      metadata: {
        enginesRun: [],
        enginesFailed: ['orchestrator'],
        enginesCached: [],
        totalTime: Date.now() - startTime,
        requestTime: Date.now() - startTime,
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
    }, { status: 500 });
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

/**
 * Build a human-readable summary from client-provided entity data
 */
function buildClientEntitySummary(
  entityData: NonNullable<(typeof UnifiedRequestSchema)['_output']['pageContext']['entityData']>,
  entityType: string
): string {
  const parts: string[] = [];

  if (entityType === 'course') {
    if (entityData.title) {
      parts.push(`Course: "${entityData.title}"`);
    }
    if (entityData.description) {
      parts.push(`Description: ${entityData.description.substring(0, 300)}${entityData.description.length > 300 ? '...' : ''}`);
    }
    if (entityData.whatYouWillLearn?.length) {
      parts.push(`Learning objectives: ${entityData.whatYouWillLearn.slice(0, 3).join('; ')}${entityData.whatYouWillLearn.length > 3 ? '...' : ''}`);
    }
    if (entityData.chapterCount !== undefined) {
      parts.push(`Chapters: ${entityData.chapterCount}`);
    }
    if (entityData.chapters?.length) {
      const chapterTitles = entityData.chapters.slice(0, 5).map(ch => ch.title).join(', ');
      parts.push(`Chapter titles: ${chapterTitles}${entityData.chapters.length > 5 ? '...' : ''}`);
    }
    parts.push(`Status: ${entityData.isPublished ? 'Published' : 'Draft'}`);
  } else if (entityType === 'chapter') {
    if (entityData.title) {
      parts.push(`Chapter: "${entityData.title}"`);
    }
    if (entityData.courseTitle) {
      parts.push(`Part of course: "${entityData.courseTitle}"`);
    }
    if (entityData.description) {
      parts.push(`Description: ${entityData.description.substring(0, 200)}${entityData.description.length > 200 ? '...' : ''}`);
    }
    if (entityData.sectionCount !== undefined) {
      parts.push(`Sections: ${entityData.sectionCount}`);
    }
    if (entityData.sections?.length) {
      const sectionTitles = entityData.sections.slice(0, 5).map(s => s.title).join(', ');
      parts.push(`Section titles: ${sectionTitles}${entityData.sections.length > 5 ? '...' : ''}`);
    }
  } else if (entityType === 'section') {
    if (entityData.title) {
      parts.push(`Section: "${entityData.title}"`);
    }
    if (entityData.chapterTitle) {
      parts.push(`Part of chapter: "${entityData.chapterTitle}"`);
    }
    if (entityData.courseTitle) {
      parts.push(`Part of course: "${entityData.courseTitle}"`);
    }
    if (entityData.description) {
      parts.push(`Description: ${entityData.description.substring(0, 200)}${entityData.description.length > 200 ? '...' : ''}`);
    }
    if (entityData.contentType) {
      parts.push(`Content type: ${entityData.contentType}`);
    }
    if (entityData.content) {
      // Strip HTML and truncate
      const stripped = entityData.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      parts.push(`Content preview: ${stripped.substring(0, 300)}${stripped.length > 300 ? '...' : ''}`);
    }
    if (entityData.videoUrl) {
      parts.push('Has video: Yes');
    }
  }

  return parts.length > 0 ? parts.join('\n') : 'No specific entity context available.';
}
