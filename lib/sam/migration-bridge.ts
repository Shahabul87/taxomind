/**
 * SAM AI Migration Bridge
 *
 * This module provides a bridge between the legacy SAM implementation
 * and the new unified @sam-ai packages.
 *
 * Usage:
 * - Import from this file during migration
 * - Gradually replace with direct @sam-ai imports
 * - Remove this file after migration is complete
 */

import {
  createOrchestrator,
  createAnthropicAdapter,
  createContextEngine,
  createBloomsEngine,
  createResponseEngine,
  createDefaultContext,
  createSAMConfig,
  type SAMConfig,
  type SAMContext,
  type SAMUserContext,
  type SAMPageContext,
  type SAMPageType,
  type OrchestrationResult,
  type SAMConfigInput,
} from '@sam-ai/core';

// Re-export core types for convenience
export type {
  SAMConfig,
  SAMContext,
  SAMUserContext,
  SAMPageContext,
  OrchestrationResult,
  SAMMessage,
  SAMConversationContext,
  SAMGamificationContext,
  BloomsLevel,
  BloomsAnalysis,
} from '@sam-ai/core';

// Re-export core factories
export {
  createOrchestrator,
  createContextEngine,
  createBloomsEngine,
  createResponseEngine,
  createDefaultContext,
  createSAMConfig,
  SAMError,
} from '@sam-ai/core';

// Re-export API handlers
export {
  createChatHandler,
  createAnalyzeHandler,
  createGamificationHandler,
  createProfileHandler,
  createRouteHandlerFactory,
  createRateLimiter,
  rateLimitPresets,
  createAuthMiddleware,
  createValidationMiddleware,
  chatRequestSchema,
  analyzeRequestSchema,
} from '@sam-ai/api';

/**
 * Legacy context interface for backward compatibility
 */
interface LegacyContext {
  user?: {
    id: string;
    role?: string;
    name?: string;
    email?: string;
  };
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  pageType?: string;
  entityType?: string;
  entityData?: unknown;
  formData?: Record<string, unknown>;
  url?: string;
}

/**
 * Map legacy page types to new page types
 */
function mapLegacyPageType(legacyType?: string): SAMPageType {
  const typeMap: Record<string, SAMPageType> = {
    'course-edit': 'course-detail',
    'chapter-edit': 'chapter-detail',
    'section-edit': 'section-detail',
    'course-create': 'course-create',
    'revolutionary-architect': 'course-create',
    learning: 'learning',
    dashboard: 'dashboard',
    admin: 'settings',
    analytics: 'analytics',
    'courses-list': 'courses-list',
  };

  return typeMap[legacyType ?? ''] ?? 'other';
}

/**
 * Legacy context to new context converter
 * Converts old SAMContext format to new format
 */
export function convertLegacyContext(legacyContext: LegacyContext): SAMContext {
  // Map legacy role to new role type
  const roleMap: Record<string, 'teacher' | 'student' | 'admin'> = {
    TEACHER: 'teacher',
    ADMIN: 'admin',
    STUDENT: 'student',
    USER: 'student',
  };

  const userContext: SAMUserContext = {
    id: legacyContext.user?.id ?? 'anonymous',
    role: roleMap[legacyContext.user?.role ?? 'USER'] ?? 'student',
    name: legacyContext.user?.name,
    email: legacyContext.user?.email,
    preferences: {
      learningStyle: 'visual',
      preferredTone: 'encouraging',
      teachingMethod: 'socratic',
    },
    capabilities: [],
  };

  const pageContext: SAMPageContext = {
    type: mapLegacyPageType(legacyContext.pageType),
    path: legacyContext.url ?? '/',
    entityId: legacyContext.sectionId ?? legacyContext.chapterId ?? legacyContext.courseId,
    parentEntityId: legacyContext.sectionId
      ? legacyContext.chapterId
      : legacyContext.chapterId
        ? legacyContext.courseId
        : undefined,
    grandParentEntityId: legacyContext.sectionId ? legacyContext.courseId : undefined,
    capabilities: ['chat', 'analyze'],
    breadcrumb: [],
    metadata: legacyContext.entityData ? { entityData: legacyContext.entityData } : undefined,
  };

  return createDefaultContext({
    user: userContext,
    page: pageContext,
  });
}

/**
 * Legacy response format for backward compatibility
 */
interface LegacyResponse {
  message: string;
  suggestions: string[];
  contextInsights: {
    observation?: string;
    recommendation?: string;
  } | null;
}

/**
 * Legacy response to new response converter
 */
export function convertToLegacyResponse(result: OrchestrationResult): LegacyResponse {
  return {
    message: result.response.message,
    suggestions: result.response.suggestions?.map((s) => s.text) ?? [],
    contextInsights:
      result.response.insights && Object.keys(result.response.insights).length > 0
        ? {
            observation: result.response.blooms
              ? `Current cognitive level: ${result.response.blooms.dominantLevel}`
              : undefined,
            recommendation:
              result.response.suggestions && result.response.suggestions.length > 0
                ? result.response.suggestions[0].text
                : undefined,
          }
        : null,
  };
}

/**
 * Create a configured SAM orchestrator for the main app
 */
export function createAppOrchestrator(configOverrides?: Partial<SAMConfigInput>) {
  // Create the AI adapter
  const aiAdapter = createAnthropicAdapter({
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    model: 'claude-sonnet-4-5-20250929',
  });

  // Create config using the factory
  const config = createSAMConfig({
    ai: aiAdapter,
    features: {
      gamification: true,
      formSync: true,
      autoContext: true,
      emotionDetection: true,
      learningStyleDetection: true,
      streaming: true,
      analytics: true,
    },
    personality: {
      name: 'SAM',
      greeting: 'Hello! I am SAM, your Smart Adaptive Mentor.',
      tone: 'encouraging',
    },
    ...configOverrides,
  });

  const orchestrator = createOrchestrator(config);

  // Register core engines
  orchestrator.registerEngine(createContextEngine(config));
  orchestrator.registerEngine(createBloomsEngine(config));
  orchestrator.registerEngine(createResponseEngine(config));

  return orchestrator;
}

/**
 * Singleton orchestrator instance for the app
 */
let appOrchestrator: ReturnType<typeof createAppOrchestrator> | null = null;

export function getAppOrchestrator() {
  if (!appOrchestrator) {
    appOrchestrator = createAppOrchestrator();
  }
  return appOrchestrator;
}

/**
 * Reset the orchestrator (useful for testing or config changes)
 */
export function resetAppOrchestrator() {
  appOrchestrator = null;
}

/**
 * Process a message using the new orchestrator (legacy-compatible interface)
 */
export async function processMessage(
  legacyContext: LegacyContext,
  message: string,
  options?: { includeInsights?: boolean }
): Promise<LegacyResponse> {
  const orchestrator = getAppOrchestrator();
  const context = convertLegacyContext(legacyContext);

  const result = await orchestrator.orchestrate(context, message, {
    includeInsights: options?.includeInsights ?? true,
  });

  return convertToLegacyResponse(result);
}
