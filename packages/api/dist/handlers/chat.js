/**
 * @sam-ai/api - Chat Handler
 * Handles chat/conversation requests with SAM AI
 *
 * UPDATED: Now uses Unified Blooms Engine from @sam-ai/educational
 * for AI-powered cognitive level analysis instead of keyword-only
 */
import { createOrchestrator, createContextEngine, createResponseEngine, createDefaultContext, } from '@sam-ai/core';
import { createUnifiedBloomsAdapterEngine, } from '@sam-ai/educational';
/**
 * Create success response
 */
function createSuccessResponse(data, status = 200) {
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
function createErrorResponse(status, code, message, details) {
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
function toResponse(result, bloomsAnalysis) {
    return {
        message: result.response.message,
        conversationId: `conv_${Date.now()}`,
        suggestions: result.response.suggestions ?? [],
        actions: result.response.actions ?? [],
        bloomsAnalysis: bloomsAnalysis ?? result.response.blooms,
        usage: undefined,
    };
}
/**
 * Build user context from handler context
 */
function buildUserContext(handlerContext) {
    if (!handlerContext.user)
        return undefined;
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
export function createChatHandler(config) {
    const orchestrator = createOrchestrator(config);
    // Register engines (use unified blooms adapter instead of core keyword-only engine)
    orchestrator.registerEngine(createContextEngine(config));
    orchestrator.registerEngine(createUnifiedBloomsAdapterEngine({
        samConfig: config,
        defaultMode: 'standard',
        confidenceThreshold: 0.7,
        enableCache: true,
        cacheTTL: 3600,
    }));
    orchestrator.registerEngine(createResponseEngine(config));
    return async (request, handlerContext) => {
        const body = request.body;
        // Validate message
        if (!body.message || typeof body.message !== 'string') {
            return createErrorResponse(400, 'INVALID_REQUEST', 'Message is required and must be a string');
        }
        if (body.message.length > 10000) {
            return createErrorResponse(400, 'MESSAGE_TOO_LONG', 'Message exceeds maximum length of 10000 characters');
        }
        try {
            // Build user context
            const userContext = buildUserContext(handlerContext);
            const normalizedHistory = (body.history ?? []).map((message) => ({
                ...message,
                timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
            }));
            const baseContext = createDefaultContext(body.context);
            const samContext = {
                ...baseContext,
                user: userContext
                    ? { ...baseContext.user, ...userContext }
                    : baseContext.user,
                conversation: {
                    ...baseContext.conversation,
                    messages: normalizedHistory.length > 0
                        ? normalizedHistory
                        : baseContext.conversation.messages,
                    totalMessages: normalizedHistory.length > 0
                        ? normalizedHistory.length
                        : baseContext.conversation.totalMessages,
                    lastMessageAt: normalizedHistory.length > 0
                        ? normalizedHistory[normalizedHistory.length - 1]?.timestamp ?? null
                        : baseContext.conversation.lastMessageAt,
                },
            };
            // Process the message using orchestrator
            const result = await orchestrator.orchestrate(samContext, body.message, {
                includeInsights: true,
            });
            const bloomsOutput = result.results.blooms?.data;
            const bloomsAnalysis = bloomsOutput?.analysis ?? result.response.blooms;
            // Check for errors
            if (!result.success && result.metadata.enginesFailed.length > 0) {
                return createErrorResponse(500, 'PROCESSING_ERROR', 'Some engines failed during processing', {
                    enginesFailed: result.metadata.enginesFailed,
                });
            }
            // Return success response
            const chatResponse = toResponse(result, bloomsAnalysis);
            return createSuccessResponse(chatResponse);
        }
        catch (error) {
            console.error('[SAM Chat Handler] Error:', error);
            if (error instanceof Error) {
                return createErrorResponse(500, 'INTERNAL_ERROR', process.env.NODE_ENV === 'development'
                    ? error.message
                    : 'An error occurred while processing your message');
            }
            return createErrorResponse(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
        }
    };
}
/**
 * Create streaming chat handler (for future use)
 */
export function createStreamingChatHandler(config) {
    const orchestrator = createOrchestrator(config);
    // Register engines (use unified blooms adapter instead of core keyword-only engine)
    orchestrator.registerEngine(createContextEngine(config));
    orchestrator.registerEngine(createUnifiedBloomsAdapterEngine({
        samConfig: config,
        defaultMode: 'standard',
        confidenceThreshold: 0.7,
        enableCache: true,
        cacheTTL: 3600,
    }));
    orchestrator.registerEngine(createResponseEngine(config));
    return async (request, handlerContext, onChunk) => {
        const body = request.body;
        // Build user context
        const userContext = buildUserContext(handlerContext);
        // Create SAM context using factory
        const normalizedHistory = (body.history ?? []).map((message) => ({
            ...message,
            timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
        }));
        const baseContext = createDefaultContext(body.context);
        const samContext = {
            ...baseContext,
            user: userContext
                ? { ...baseContext.user, ...userContext }
                : baseContext.user,
            conversation: {
                ...baseContext.conversation,
                messages: normalizedHistory.length > 0
                    ? normalizedHistory
                    : baseContext.conversation.messages,
                totalMessages: normalizedHistory.length > 0
                    ? normalizedHistory.length
                    : baseContext.conversation.totalMessages,
                lastMessageAt: normalizedHistory.length > 0
                    ? normalizedHistory[normalizedHistory.length - 1]?.timestamp ?? null
                    : baseContext.conversation.lastMessageAt,
            },
        };
        // Process and stream
        const result = await orchestrator.orchestrate(samContext, body.message);
        const bloomsOutput = result.results.blooms?.data;
        const bloomsAnalysis = bloomsOutput?.analysis ?? result.response.blooms;
        // Send the response as a single chunk (streaming can be enhanced later)
        onChunk(JSON.stringify({
            type: 'text',
            content: result.response.message,
        }));
        // Send final response
        onChunk(JSON.stringify({
            type: 'done',
            data: toResponse(result, bloomsAnalysis),
        }));
    };
}
