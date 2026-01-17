/**
 * @sam-ai/integration - AI Provider Adapter Interface
 * Abstract AI/LLM operations for portability
 */
import { z } from 'zod';
// ============================================================================
// ZOD SCHEMAS
// ============================================================================
export const ChatMessageSchema = z.object({
    role: z.enum(['system', 'user', 'assistant', 'function', 'tool']),
    content: z.string(),
    name: z.string().optional(),
    toolCallId: z.string().optional(),
    toolCalls: z
        .array(z.object({
        id: z.string(),
        type: z.literal('function'),
        function: z.object({
            name: z.string(),
            arguments: z.string(),
        }),
    }))
        .optional(),
});
export const CompletionOptionsSchema = z.object({
    model: z.string().optional(),
    maxTokens: z.number().min(1).max(200000).optional(),
    temperature: z.number().min(0).max(2).optional(),
    topP: z.number().min(0).max(1).optional(),
    topK: z.number().min(1).optional(),
    stopSequences: z.array(z.string()).optional(),
    presencePenalty: z.number().min(-2).max(2).optional(),
    frequencyPenalty: z.number().min(-2).max(2).optional(),
    responseFormat: z
        .object({
        type: z.enum(['text', 'json_object']),
    })
        .optional(),
    seed: z.number().optional(),
    user: z.string().optional(),
});
export const ToolDefinitionSchema = z.object({
    type: z.literal('function'),
    function: z.object({
        name: z.string().min(1),
        description: z.string(),
        parameters: z.record(z.unknown()),
    }),
});
export const AIServiceConfigSchema = z.object({
    provider: z.string().min(1),
    apiKey: z.string().optional(),
    baseUrl: z.string().url().optional(),
    defaultModel: z.string().optional(),
    timeout: z.number().min(1000).max(600000).optional(),
    maxRetries: z.number().min(0).max(10).optional(),
    defaultOptions: CompletionOptionsSchema.optional(),
});
//# sourceMappingURL=ai.js.map