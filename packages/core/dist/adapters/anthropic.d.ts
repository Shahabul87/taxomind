/**
 * @sam-ai/core - Anthropic AI Adapter
 * Adapter for Anthropic Claude API
 */
import type { AIAdapter, AIChatParams, AIChatResponse, AIChatStreamChunk } from '../types';
export interface AnthropicAdapterOptions {
    apiKey: string;
    model?: string;
    baseURL?: string;
    maxRetries?: number;
    timeout?: number;
}
export declare class AnthropicAdapter implements AIAdapter {
    readonly name = "anthropic";
    readonly version = "1.0.0";
    private readonly apiKey;
    private readonly model;
    private readonly baseURL;
    private readonly maxRetries;
    private readonly timeout;
    constructor(options: AnthropicAdapterOptions);
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
     * Format messages for Anthropic API
     */
    private formatMessages;
    /**
     * Extract system message from messages array
     * Anthropic API requires system message as a separate field, not in messages array
     */
    private extractSystemMessage;
    /**
     * Make a request to the Anthropic API
     */
    private makeRequest;
    /**
     * Handle error responses from the API
     */
    private handleErrorResponse;
}
export declare function createAnthropicAdapter(options: AnthropicAdapterOptions): AnthropicAdapter;
//# sourceMappingURL=anthropic.d.ts.map