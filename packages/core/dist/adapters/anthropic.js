/**
 * @sam-ai/core - Anthropic AI Adapter
 * Adapter for Anthropic Claude API
 */
import { AIError, ConfigurationError } from '../errors';
// ============================================================================
// ANTHROPIC ADAPTER
// ============================================================================
export class AnthropicAdapter {
    name = 'anthropic';
    version = '1.0.0';
    apiKey;
    model;
    baseURL;
    maxRetries;
    timeout;
    constructor(options) {
        if (!options.apiKey) {
            throw new ConfigurationError('Anthropic API key is required');
        }
        this.apiKey = options.apiKey;
        this.model = options.model ?? 'claude-sonnet-4-20250514';
        this.baseURL = options.baseURL ?? 'https://api.anthropic.com';
        this.maxRetries = options.maxRetries ?? 2;
        this.timeout = options.timeout ?? 60000;
    }
    /**
     * Check if the adapter is properly configured
     */
    isConfigured() {
        return Boolean(this.apiKey);
    }
    /**
     * Get the current model being used
     */
    getModel() {
        return this.model;
    }
    /**
     * Generate a chat completion
     */
    async chat(params) {
        const model = params.model ?? this.model;
        const messages = this.formatMessages(params.messages);
        // Extract system message from messages array if not provided via systemPrompt
        const systemMessage = params.systemPrompt ?? this.extractSystemMessage(params.messages);
        const requestBody = {
            model,
            max_tokens: params.maxTokens ?? 4096,
            messages,
            temperature: params.temperature,
            stop_sequences: params.stopSequences,
        };
        if (systemMessage) {
            requestBody.system = systemMessage;
        }
        let lastError;
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await this.makeRequest('/v1/messages', requestBody);
                const content = response.content
                    .filter((c) => c.type === 'text')
                    .map((c) => c.text)
                    .join('');
                return {
                    content,
                    model: response.model,
                    usage: {
                        inputTokens: response.usage.input_tokens,
                        outputTokens: response.usage.output_tokens,
                    },
                    finishReason: response.stop_reason === 'max_tokens' ? 'max_tokens' : 'stop',
                };
            }
            catch (error) {
                lastError = error;
                // Don't retry on certain errors
                if (error instanceof AIError && !error.recoverable) {
                    throw error;
                }
                // Exponential backoff
                if (attempt < this.maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError ?? new AIError('Unknown error occurred');
    }
    /**
     * Generate a streaming chat completion
     */
    async *chatStream(params) {
        const model = params.model ?? this.model;
        const messages = this.formatMessages(params.messages);
        // Extract system message from messages array if not provided via systemPrompt
        const systemMessage = params.systemPrompt ?? this.extractSystemMessage(params.messages);
        const requestBody = {
            model,
            max_tokens: params.maxTokens ?? 4096,
            messages,
            temperature: params.temperature,
            stop_sequences: params.stopSequences,
            stream: true,
        };
        if (systemMessage) {
            requestBody.system = systemMessage;
        }
        const response = await fetch(`${this.baseURL}/v1/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
            await this.handleErrorResponse(response);
        }
        if (!response.body) {
            throw new AIError('No response body for streaming');
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    yield { content: '', done: true };
                    break;
                }
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            yield { content: '', done: true };
                            return;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                                yield { content: parsed.delta.text, done: false };
                            }
                        }
                        catch {
                            // Ignore parse errors for incomplete JSON
                        }
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
    }
    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================
    /**
     * Format messages for Anthropic API
     */
    formatMessages(messages) {
        return messages
            .filter((m) => m.role !== 'system') // System messages handled separately
            .map((m) => ({
            role: m.role,
            content: m.content,
        }));
    }
    /**
     * Extract system message from messages array
     * Anthropic API requires system message as a separate field, not in messages array
     */
    extractSystemMessage(messages) {
        const systemMessage = messages.find((m) => m.role === 'system');
        return systemMessage?.content;
    }
    /**
     * Make a request to the Anthropic API
     */
    async makeRequest(endpoint, body) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            });
            if (!response.ok) {
                await this.handleErrorResponse(response);
            }
            return (await response.json());
        }
        catch (error) {
            if (error.name === 'AbortError') {
                throw new AIError('Request timed out', { recoverable: true });
            }
            throw error;
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    /**
     * Handle error responses from the API
     */
    async handleErrorResponse(response) {
        let errorMessage = `Anthropic API error: ${response.status}`;
        let recoverable = true;
        try {
            const errorBody = await response.json();
            errorMessage = errorBody.error?.message || errorMessage;
        }
        catch {
            // Ignore JSON parse errors
        }
        switch (response.status) {
            case 400:
                recoverable = false;
                break;
            case 401:
                throw new AIError('Invalid API key', { recoverable: false });
            case 403:
                throw new AIError('Access forbidden', { recoverable: false });
            case 429:
                throw new AIError('Rate limit exceeded', {
                    recoverable: true,
                    details: { retryAfter: response.headers.get('retry-after') },
                });
            case 500:
            case 502:
            case 503:
                throw new AIError('Anthropic service error', { recoverable: true });
        }
        throw new AIError(errorMessage, { recoverable });
    }
}
// ============================================================================
// FACTORY
// ============================================================================
export function createAnthropicAdapter(options) {
    return new AnthropicAdapter(options);
}
//# sourceMappingURL=anthropic.js.map