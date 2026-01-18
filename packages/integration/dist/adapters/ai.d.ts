/**
 * @sam-ai/integration - AI Provider Adapter Interface
 * Abstract AI/LLM operations for portability
 */
import { z } from 'zod';
/**
 * Message role in conversation
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'function' | 'tool';
/**
 * Chat message
 */
export interface ChatMessage {
    role: MessageRole;
    content: string;
    name?: string;
    toolCallId?: string;
    toolCalls?: ToolCall[];
}
/**
 * Tool/function call
 */
export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}
/**
 * Tool definition for function calling
 */
export interface ToolDefinition {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    };
}
/**
 * Completion request options
 */
export interface CompletionOptions {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    stopSequences?: string[];
    presencePenalty?: number;
    frequencyPenalty?: number;
    tools?: ToolDefinition[];
    toolChoice?: 'auto' | 'none' | 'required' | {
        type: 'function';
        function: {
            name: string;
        };
    };
    responseFormat?: {
        type: 'text' | 'json_object';
    };
    seed?: number;
    user?: string;
}
/**
 * Completion response
 */
export interface CompletionResponse {
    id: string;
    model: string;
    content: string;
    finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'error';
    toolCalls?: ToolCall[];
    usage: TokenUsage;
    latencyMs: number;
}
/**
 * Token usage information
 */
export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cachedTokens?: number;
}
/**
 * Health check status
 */
export interface HealthStatus {
    healthy: boolean;
    latencyMs: number;
    message?: string;
    error?: Error;
}
/**
 * Streaming chunk
 */
export interface StreamChunk {
    id: string;
    model: string;
    delta: {
        content?: string;
        toolCalls?: Partial<ToolCall>[];
    };
    finishReason?: string;
}
/**
 * AI/LLM adapter interface
 * Abstracts away the specific AI provider implementation
 */
export interface AIAdapter {
    /**
     * Get provider name
     */
    getName(): string;
    /**
     * Get default model
     */
    getDefaultModel(): string;
    /**
     * List available models
     */
    listModels(): Promise<string[]>;
    /**
     * Check if provider is available
     */
    isAvailable(): Promise<boolean>;
    /**
     * Health check
     */
    healthCheck(): Promise<HealthStatus>;
    /**
     * Generate chat completion
     */
    chat(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResponse>;
    /**
     * Generate chat completion with system prompt
     */
    chatWithSystem(systemPrompt: string, messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResponse>;
    /**
     * Generate streaming chat completion
     */
    chatStream(messages: ChatMessage[], options?: CompletionOptions): AsyncGenerator<StreamChunk, void, unknown>;
    /**
     * Generate streaming chat completion with system prompt
     */
    chatStreamWithSystem(systemPrompt: string, messages: ChatMessage[], options?: CompletionOptions): AsyncGenerator<StreamChunk, void, unknown>;
    /**
     * Generate text completion (single turn)
     */
    complete(prompt: string, options?: CompletionOptions): Promise<CompletionResponse>;
    /**
     * Generate streaming text completion
     */
    completeStream(prompt: string, options?: CompletionOptions): AsyncGenerator<StreamChunk, void, unknown>;
    /**
     * Chat with tool calling
     */
    chatWithTools(messages: ChatMessage[], tools: ToolDefinition[], options?: Omit<CompletionOptions, 'tools'>): Promise<CompletionResponse>;
    /**
     * Process tool call results and continue conversation
     */
    continueWithToolResults(messages: ChatMessage[], toolResults: Array<{
        toolCallId: string;
        result: string;
    }>, tools: ToolDefinition[], options?: Omit<CompletionOptions, 'tools'>): Promise<CompletionResponse>;
    /**
     * Count tokens in text
     */
    countTokens(text: string, model?: string): Promise<number>;
    /**
     * Get model context window size
     */
    getContextWindowSize(model?: string): number;
    /**
     * Get usage/rate limit status
     */
    getRateLimitStatus?(): Promise<{
        remainingRequests: number;
        remainingTokens: number;
        resetAt: Date;
    }>;
}
/**
 * AI service configuration
 */
export interface AIServiceConfig {
    provider: string;
    apiKey?: string;
    baseUrl?: string;
    defaultModel?: string;
    timeout?: number;
    maxRetries?: number;
    defaultOptions?: Partial<CompletionOptions>;
}
/**
 * Multi-provider AI service
 */
export interface AIService {
    /**
     * Get adapter for specific provider
     */
    getAdapter(provider?: string): AIAdapter;
    /**
     * Get default adapter
     */
    getDefaultAdapter(): AIAdapter;
    /**
     * Set default provider
     */
    setDefaultProvider(provider: string): void;
    /**
     * Register a new adapter
     */
    registerAdapter(name: string, adapter: AIAdapter): void;
    /**
     * List available providers
     */
    listProviders(): string[];
    /**
     * Unified chat (uses default adapter)
     */
    chat(messages: ChatMessage[], options?: CompletionOptions & {
        provider?: string;
    }): Promise<CompletionResponse>;
    /**
     * Unified streaming chat
     */
    chatStream(messages: ChatMessage[], options?: CompletionOptions & {
        provider?: string;
    }): AsyncGenerator<StreamChunk, void, unknown>;
}
/**
 * Prompt template
 */
export interface PromptTemplate {
    id: string;
    name: string;
    description?: string;
    template: string;
    variables: string[];
    defaultValues?: Record<string, string>;
}
/**
 * Prompt template engine
 */
export interface PromptTemplateEngine {
    /**
     * Register a template
     */
    register(template: PromptTemplate): void;
    /**
     * Get template by ID
     */
    get(id: string): PromptTemplate | undefined;
    /**
     * Render template with variables
     */
    render(id: string, variables: Record<string, string>): string;
    /**
     * Render template string directly
     */
    renderString(template: string, variables: Record<string, string>): string;
    /**
     * List all templates
     */
    list(): PromptTemplate[];
}
export declare const ChatMessageSchema: z.ZodObject<{
    role: z.ZodEnum<["system", "user", "assistant", "function", "tool"]>;
    content: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    toolCallId: z.ZodOptional<z.ZodString>;
    toolCalls: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodLiteral<"function">;
        function: z.ZodObject<{
            name: z.ZodString;
            arguments: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            arguments: string;
        }, {
            name: string;
            arguments: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        function: {
            name: string;
            arguments: string;
        };
        id: string;
        type: "function";
    }, {
        function: {
            name: string;
            arguments: string;
        };
        id: string;
        type: "function";
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    content: string;
    role: "function" | "user" | "assistant" | "system" | "tool";
    name?: string | undefined;
    toolCallId?: string | undefined;
    toolCalls?: {
        function: {
            name: string;
            arguments: string;
        };
        id: string;
        type: "function";
    }[] | undefined;
}, {
    content: string;
    role: "function" | "user" | "assistant" | "system" | "tool";
    name?: string | undefined;
    toolCallId?: string | undefined;
    toolCalls?: {
        function: {
            name: string;
            arguments: string;
        };
        id: string;
        type: "function";
    }[] | undefined;
}>;
export declare const CompletionOptionsSchema: z.ZodObject<{
    model: z.ZodOptional<z.ZodString>;
    maxTokens: z.ZodOptional<z.ZodNumber>;
    temperature: z.ZodOptional<z.ZodNumber>;
    topP: z.ZodOptional<z.ZodNumber>;
    topK: z.ZodOptional<z.ZodNumber>;
    stopSequences: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    presencePenalty: z.ZodOptional<z.ZodNumber>;
    frequencyPenalty: z.ZodOptional<z.ZodNumber>;
    responseFormat: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["text", "json_object"]>;
    }, "strip", z.ZodTypeAny, {
        type: "text" | "json_object";
    }, {
        type: "text" | "json_object";
    }>>;
    seed: z.ZodOptional<z.ZodNumber>;
    user: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    maxTokens?: number | undefined;
    user?: string | undefined;
    topK?: number | undefined;
    model?: string | undefined;
    temperature?: number | undefined;
    topP?: number | undefined;
    stopSequences?: string[] | undefined;
    presencePenalty?: number | undefined;
    frequencyPenalty?: number | undefined;
    responseFormat?: {
        type: "text" | "json_object";
    } | undefined;
    seed?: number | undefined;
}, {
    maxTokens?: number | undefined;
    user?: string | undefined;
    topK?: number | undefined;
    model?: string | undefined;
    temperature?: number | undefined;
    topP?: number | undefined;
    stopSequences?: string[] | undefined;
    presencePenalty?: number | undefined;
    frequencyPenalty?: number | undefined;
    responseFormat?: {
        type: "text" | "json_object";
    } | undefined;
    seed?: number | undefined;
}>;
export declare const ToolDefinitionSchema: z.ZodObject<{
    type: z.ZodLiteral<"function">;
    function: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        parameters: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    }, {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    }>;
}, "strip", z.ZodTypeAny, {
    function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    };
    type: "function";
}, {
    function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    };
    type: "function";
}>;
export declare const AIServiceConfigSchema: z.ZodObject<{
    provider: z.ZodString;
    apiKey: z.ZodOptional<z.ZodString>;
    baseUrl: z.ZodOptional<z.ZodString>;
    defaultModel: z.ZodOptional<z.ZodString>;
    timeout: z.ZodOptional<z.ZodNumber>;
    maxRetries: z.ZodOptional<z.ZodNumber>;
    defaultOptions: z.ZodOptional<z.ZodObject<{
        model: z.ZodOptional<z.ZodString>;
        maxTokens: z.ZodOptional<z.ZodNumber>;
        temperature: z.ZodOptional<z.ZodNumber>;
        topP: z.ZodOptional<z.ZodNumber>;
        topK: z.ZodOptional<z.ZodNumber>;
        stopSequences: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        presencePenalty: z.ZodOptional<z.ZodNumber>;
        frequencyPenalty: z.ZodOptional<z.ZodNumber>;
        responseFormat: z.ZodOptional<z.ZodObject<{
            type: z.ZodEnum<["text", "json_object"]>;
        }, "strip", z.ZodTypeAny, {
            type: "text" | "json_object";
        }, {
            type: "text" | "json_object";
        }>>;
        seed: z.ZodOptional<z.ZodNumber>;
        user: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        maxTokens?: number | undefined;
        user?: string | undefined;
        topK?: number | undefined;
        model?: string | undefined;
        temperature?: number | undefined;
        topP?: number | undefined;
        stopSequences?: string[] | undefined;
        presencePenalty?: number | undefined;
        frequencyPenalty?: number | undefined;
        responseFormat?: {
            type: "text" | "json_object";
        } | undefined;
        seed?: number | undefined;
    }, {
        maxTokens?: number | undefined;
        user?: string | undefined;
        topK?: number | undefined;
        model?: string | undefined;
        temperature?: number | undefined;
        topP?: number | undefined;
        stopSequences?: string[] | undefined;
        presencePenalty?: number | undefined;
        frequencyPenalty?: number | undefined;
        responseFormat?: {
            type: "text" | "json_object";
        } | undefined;
        seed?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    provider: string;
    apiKey?: string | undefined;
    baseUrl?: string | undefined;
    defaultModel?: string | undefined;
    timeout?: number | undefined;
    maxRetries?: number | undefined;
    defaultOptions?: {
        maxTokens?: number | undefined;
        user?: string | undefined;
        topK?: number | undefined;
        model?: string | undefined;
        temperature?: number | undefined;
        topP?: number | undefined;
        stopSequences?: string[] | undefined;
        presencePenalty?: number | undefined;
        frequencyPenalty?: number | undefined;
        responseFormat?: {
            type: "text" | "json_object";
        } | undefined;
        seed?: number | undefined;
    } | undefined;
}, {
    provider: string;
    apiKey?: string | undefined;
    baseUrl?: string | undefined;
    defaultModel?: string | undefined;
    timeout?: number | undefined;
    maxRetries?: number | undefined;
    defaultOptions?: {
        maxTokens?: number | undefined;
        user?: string | undefined;
        topK?: number | undefined;
        model?: string | undefined;
        temperature?: number | undefined;
        topP?: number | undefined;
        stopSequences?: string[] | undefined;
        presencePenalty?: number | undefined;
        frequencyPenalty?: number | undefined;
        responseFormat?: {
            type: "text" | "json_object";
        } | undefined;
        seed?: number | undefined;
    } | undefined;
}>;
//# sourceMappingURL=ai.d.ts.map