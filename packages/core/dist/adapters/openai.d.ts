/**
 * @sam-ai/core - OpenAI AI Adapter
 * Adapter for OpenAI GPT API
 */
import type { AIAdapter, AIChatParams, AIChatResponse, AIChatStreamChunk } from '../types';
export interface OpenAIAdapterOptions {
    apiKey: string;
    model?: string;
    baseURL?: string;
    organization?: string;
    maxRetries?: number;
    timeout?: number;
}
export declare class OpenAIAdapter implements AIAdapter {
    readonly name = "openai";
    readonly version = "1.0.0";
    private readonly apiKey;
    private readonly model;
    private readonly baseURL;
    private readonly organization?;
    private readonly maxRetries;
    private readonly timeout;
    constructor(options: OpenAIAdapterOptions);
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
     * Format messages for OpenAI API
     */
    private formatMessages;
    /**
     * Make a request to the OpenAI API
     */
    private makeRequest;
    /**
     * Handle error responses from the API
     */
    private handleErrorResponse;
}
export declare function createOpenAIAdapter(options: OpenAIAdapterOptions): OpenAIAdapter;
//# sourceMappingURL=openai.d.ts.map