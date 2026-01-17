/**
 * @sam-ai/core - DeepSeek AI Adapter
 * Adapter for DeepSeek API (OpenAI-compatible)
 */
import type { AIAdapter, AIChatParams, AIChatResponse, AIChatStreamChunk } from '../types';
export interface DeepSeekAdapterOptions {
    apiKey: string;
    model?: string;
    baseURL?: string;
    maxRetries?: number;
    timeout?: number;
}
export declare class DeepSeekAdapter implements AIAdapter {
    readonly name = "deepseek";
    readonly version = "1.0.0";
    private readonly apiKey;
    private readonly model;
    private readonly baseURL;
    private readonly maxRetries;
    private readonly timeout;
    constructor(options: DeepSeekAdapterOptions);
    /**
     * Check if the adapter is properly configured
     */
    isConfigured(): boolean;
    /**
     * Get the current model being used
     */
    getModel(): string;
    /**
     * Generate a chat completion
     */
    chat(params: AIChatParams): Promise<AIChatResponse>;
    /**
     * Generate a streaming chat completion
     */
    chatStream(params: AIChatParams): AsyncIterable<AIChatStreamChunk>;
    /**
     * Format messages for DeepSeek API (OpenAI format)
     */
    private formatMessages;
    /**
     * Make a request to the DeepSeek API
     */
    private makeRequest;
    /**
     * Handle error responses from the API
     */
    private handleErrorResponse;
}
export declare function createDeepSeekAdapter(options: DeepSeekAdapterOptions): DeepSeekAdapter;
//# sourceMappingURL=deepseek.d.ts.map