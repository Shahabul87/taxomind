/**
 * @sam-ai/api - Chat Handler
 * Handles chat/conversation requests with SAM AI
 */

import type {
  SAMConfig,
  SAMContext,
  OrchestrationResult,
  SAMUserContext,
} from '@sam-ai/core';
import {
  createOrchestrator,
  createBloomsEngine,
  createContextEngine,
  createResponseEngine,
  createDefaultContext,
} from '@sam-ai/core';
import type {
  SAMApiRequest,
  SAMApiResponse,
  SAMHandler,
  SAMHandlerContext,
  ChatRequest,
  ChatResponse,
} from '../types';

/**
 * Create success response
 */
function createSuccessResponse<T>(data: T, status = 200): SAMApiResponse {
  return {
    status,
    body: {
      success: true,
      data,
    },
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

/**
 * Create error response
 */
function createErrorResponse(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
): SAMApiResponse {
  return {
    status,
    body: {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

/**
 * Convert orchestration result to chat response
 */
function toResponse(result: OrchestrationResult): ChatResponse {
  return {
    message: result.response.message,
    conversationId: `conv_${Date.now()}`,
    suggestions: result.response.suggestions ?? [],
    actions: result.response.actions ?? [],
    bloomsAnalysis: result.response.blooms,
    usage: undefined,
  };
}

/**
 * Build user context from handler context
 */
function buildUserContext(
  handlerContext: SAMHandlerContext
): Partial<SAMUserContext> | undefined {
  if (!handlerContext.user) return undefined;

  return {
    id: handlerContext.user.id,
    role: handlerContext.user.role === 'teacher' ? 'teacher' : 'student',
    name: handlerContext.user.name,
    preferences: {
      learningStyle: 'visual',
      preferredTone: 'encouraging',
      teachingMethod: 'mixed',
    },
    capabilities: [],
  };
}

/**
 * Create chat handler
 */
export function createChatHandler(config: SAMConfig): SAMHandler {
  const orchestrator = createOrchestrator(config);

  // Register engines
  orchestrator.registerEngine(createContextEngine(config));
  orchestrator.registerEngine(createBloomsEngine(config));
  orchestrator.registerEngine(createResponseEngine(config));

  return async (
    request: SAMApiRequest,
    handlerContext: SAMHandlerContext
  ): Promise<SAMApiResponse> => {
    const body = request.body as ChatRequest;

    // Validate message
    if (!body.message || typeof body.message !== 'string') {
      return createErrorResponse(
        400,
        'INVALID_REQUEST',
        'Message is required and must be a string'
      );
    }

    if (body.message.length > 10000) {
      return createErrorResponse(
        400,
        'MESSAGE_TOO_LONG',
        'Message exceeds maximum length of 10000 characters'
      );
    }

    try {
      // Build user context
      const userContext = buildUserContext(handlerContext);

      // Create SAM context using factory
      const samContext: SAMContext = createDefaultContext({
        user: userContext as SAMUserContext,
        page: {
          type: 'other',
          path: '/',
          capabilities: [],
          breadcrumb: [],
        },
        conversation: {
          id: null,
          messages: body.history ?? [],
          isStreaming: false,
          lastMessageAt: null,
          totalMessages: body.history?.length ?? 0,
        },
      });

      // Process the message using orchestrator
      const result = await orchestrator.orchestrate(samContext, body.message, {
        includeInsights: true,
      });

      // Check for errors
      if (!result.success && result.metadata.enginesFailed.length > 0) {
        return createErrorResponse(
          500,
          'PROCESSING_ERROR',
          'Some engines failed during processing',
          {
            enginesFailed: result.metadata.enginesFailed,
          }
        );
      }

      // Return success response
      const chatResponse = toResponse(result);
      return createSuccessResponse(chatResponse);
    } catch (error) {
      console.error('[SAM Chat Handler] Error:', error);

      if (error instanceof Error) {
        return createErrorResponse(
          500,
          'INTERNAL_ERROR',
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'An error occurred while processing your message'
        );
      }

      return createErrorResponse(
        500,
        'INTERNAL_ERROR',
        'An unexpected error occurred'
      );
    }
  };
}

/**
 * Create streaming chat handler (for future use)
 */
export function createStreamingChatHandler(
  config: SAMConfig
): (
  request: SAMApiRequest,
  context: SAMHandlerContext,
  onChunk: (chunk: string) => void
) => Promise<void> {
  const orchestrator = createOrchestrator(config);

  // Register engines
  orchestrator.registerEngine(createContextEngine(config));
  orchestrator.registerEngine(createBloomsEngine(config));
  orchestrator.registerEngine(createResponseEngine(config));

  return async (
    request: SAMApiRequest,
    handlerContext: SAMHandlerContext,
    onChunk: (chunk: string) => void
  ): Promise<void> => {
    const body = request.body as ChatRequest;

    // Build user context
    const userContext = buildUserContext(handlerContext);

    // Create SAM context using factory
    const samContext: SAMContext = createDefaultContext({
      user: userContext as SAMUserContext,
      page: {
        type: 'other',
        path: '/',
        capabilities: [],
        breadcrumb: [],
      },
    });

    // Process and stream
    const result = await orchestrator.orchestrate(samContext, body.message);

    // Send the response as a single chunk (streaming can be enhanced later)
    onChunk(
      JSON.stringify({
        type: 'text',
        content: result.response.message,
      })
    );

    // Send final response
    onChunk(
      JSON.stringify({
        type: 'done',
        data: toResponse(result),
      })
    );
  };
}
