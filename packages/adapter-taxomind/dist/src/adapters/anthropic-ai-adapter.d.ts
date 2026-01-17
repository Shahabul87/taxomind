/**
 * @sam-ai/adapter-taxomind - Anthropic AI Adapter
 * Implements AIAdapter using Anthropic Claude API
 */
import type { AIAdapter, AIService, ChatMessage, CompletionOptions, CompletionResponse, StreamChunk, ToolDefinition, ToolCall, HealthStatus } from '@sam-ai/integration';
/**
 * Anthropic Claude AI adapter
 */
export declare class AnthropicAIAdapter implements AIAdapter {
    private client;
    private defaultModel;
    private name;
    constructor(options?: {
        apiKey?: string;
        defaultModel?: string;
    });
    getName(): string;
    getDefaultModel(): string;
    listModels(): Promise<string[]>;
    isAvailable(): Promise<boolean>;
    supportsStreaming(): boolean;
    supportsFunctionCalling(): boolean;
    supportsVision(): boolean;
    getMaxTokens(): number;
    getRateLimits(): {
        requestsPerMinute: number;
        tokensPerMinute: number;
    };
    countTokens(text: string): Promise<number>;
    validateApiKey(): Promise<boolean>;
    chatWithSystem(systemPrompt: string, messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResponse>;
    chatStream(messages: ChatMessage[], options?: CompletionOptions): AsyncGenerator<StreamChunk>;
    chatStreamWithSystem(systemPrompt: string, messages: ChatMessage[], options?: CompletionOptions): AsyncGenerator<StreamChunk>;
    complete(prompt: string, options?: CompletionOptions): Promise<CompletionResponse>;
    completeStream(prompt: string, options?: CompletionOptions): AsyncGenerator<StreamChunk>;
    embed(text: string): Promise<number[]>;
    embedBatch(texts: string[]): Promise<number[][]>;
    chatWithTools(messages: ChatMessage[], tools: ToolDefinition[], options?: CompletionOptions): Promise<CompletionResponse>;
    continueWithToolResults(messages: ChatMessage[], toolResults: Array<{
        toolCallId: string;
        result: string;
    }>, tools: ToolDefinition[], options?: Omit<CompletionOptions, 'tools'>): Promise<CompletionResponse>;
    getContextWindowSize(): number;
    chat(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResponse>;
    stream(messages: ChatMessage[], options?: CompletionOptions): AsyncGenerator<StreamChunk>;
    callWithTools(messages: ChatMessage[], tools: ToolDefinition[], options?: CompletionOptions): Promise<{
        response: CompletionResponse;
        toolCalls: ToolCall[];
    }>;
    healthCheck(): Promise<HealthStatus>;
    private mapToAnthropicMessages;
    private extractSystemMessage;
    private mapToAnthropicTools;
    private mapStopReason;
}
/**
 * Multi-provider AI service for Taxomind
 */
export declare class TaxomindAIService implements AIService {
    private providers;
    private defaultProvider;
    constructor(options?: {
        anthropicApiKey?: string;
        openaiApiKey?: string;
        defaultProvider?: string;
    });
    getProvider(name?: string): AIAdapter | undefined;
    getAdapter(provider?: string): AIAdapter;
    getDefaultAdapter(): AIAdapter;
    setDefaultProvider(provider: string): void;
    registerAdapter(name: string, adapter: AIAdapter): void;
    listProviders(): string[];
    chat(messages: ChatMessage[], options?: CompletionOptions & {
        provider?: string;
    }): Promise<CompletionResponse>;
    chatStream(messages: ChatMessage[], options?: CompletionOptions & {
        provider?: string;
    }): AsyncGenerator<StreamChunk>;
    healthCheck(): Promise<Map<string, HealthStatus>>;
}
/**
 * Create an Anthropic AI adapter
 */
export declare function createAnthropicAIAdapter(options?: {
    apiKey?: string;
    defaultModel?: string;
}): AnthropicAIAdapter;
/**
 * Create a Taxomind AI service
 */
export declare function createTaxomindAIService(options?: {
    anthropicApiKey?: string;
    openaiApiKey?: string;
    defaultProvider?: string;
}): TaxomindAIService;
//# sourceMappingURL=anthropic-ai-adapter.d.ts.map