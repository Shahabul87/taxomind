/**
 * @sam-ai/adapter-taxomind - Anthropic AI Adapter
 * Implements AIAdapter using Anthropic Claude API
 */
import Anthropic from '@anthropic-ai/sdk';
// ============================================================================
// ANTHROPIC AI ADAPTER
// ============================================================================
/**
 * Anthropic Claude AI adapter
 */
export class AnthropicAIAdapter {
    client;
    defaultModel;
    name = 'anthropic';
    constructor(options) {
        this.client = new Anthropic({
            apiKey: options?.apiKey ?? process.env.ANTHROPIC_API_KEY,
        });
        this.defaultModel = options?.defaultModel ?? 'claude-sonnet-4-20250514';
    }
    // ============================================================================
    // ADAPTER INFO
    // ============================================================================
    getName() {
        return this.name;
    }
    getDefaultModel() {
        return this.defaultModel;
    }
    async listModels() {
        // Anthropic doesn't have a public list models API
        // Return known models
        return [
            'claude-opus-4-20250514',
            'claude-sonnet-4-20250514',
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022',
            'claude-3-opus-20240229',
            'claude-3-haiku-20240307',
        ];
    }
    async isAvailable() {
        try {
            const health = await this.healthCheck();
            return health.healthy;
        }
        catch {
            return false;
        }
    }
    supportsStreaming() {
        return true;
    }
    supportsFunctionCalling() {
        return true;
    }
    supportsVision() {
        return true;
    }
    getMaxTokens() {
        return 8192;
    }
    getRateLimits() {
        return {
            requestsPerMinute: 60,
            tokensPerMinute: 100000,
        };
    }
    async countTokens(text) {
        // Rough estimation: ~4 chars per token for English text
        return Math.ceil(text.length / 4);
    }
    async validateApiKey() {
        try {
            await this.client.messages.create({
                model: this.defaultModel,
                max_tokens: 1,
                messages: [{ role: 'user', content: 'test' }],
            });
            return true;
        }
        catch {
            return false;
        }
    }
    // ============================================================================
    // CHAT CONVENIENCE METHODS
    // ============================================================================
    async chatWithSystem(systemPrompt, messages, options) {
        const allMessages = [
            { role: 'system', content: systemPrompt },
            ...messages,
        ];
        return this.chat(allMessages, options);
    }
    async *chatStream(messages, options) {
        yield* this.stream(messages, options);
    }
    async *chatStreamWithSystem(systemPrompt, messages, options) {
        const allMessages = [
            { role: 'system', content: systemPrompt },
            ...messages,
        ];
        yield* this.stream(allMessages, options);
    }
    async complete(prompt, options) {
        return this.chat([{ role: 'user', content: prompt }], options);
    }
    async *completeStream(prompt, options) {
        yield* this.stream([{ role: 'user', content: prompt }], options);
    }
    async embed(text) {
        // Anthropic doesn't provide embeddings, throw error or return empty
        throw new Error('Anthropic does not support embeddings. Use OpenAI embeddings.');
    }
    async embedBatch(texts) {
        throw new Error('Anthropic does not support embeddings. Use OpenAI embeddings.');
    }
    async chatWithTools(messages, tools, options) {
        return this.chat(messages, { ...options, tools });
    }
    async continueWithToolResults(messages, toolResults, tools, options) {
        const toolMessages = toolResults.map((r) => ({
            role: 'tool',
            content: r.result,
            toolCallId: r.toolCallId,
        }));
        return this.chat([...messages, ...toolMessages], { ...options, tools });
    }
    getContextWindowSize() {
        // Claude 3.5 Sonnet has 200k context
        return 200000;
    }
    // ============================================================================
    // CHAT COMPLETION
    // ============================================================================
    async chat(messages, options) {
        const anthropicMessages = this.mapToAnthropicMessages(messages);
        const systemMessage = this.extractSystemMessage(messages);
        const startTime = Date.now();
        const tools = options?.tools
            ? this.mapToAnthropicTools(options.tools)
            : undefined;
        const response = await this.client.messages.create({
            model: options?.model ?? this.defaultModel,
            max_tokens: options?.maxTokens ?? 4096,
            temperature: options?.temperature ?? 0.7,
            system: systemMessage,
            messages: anthropicMessages,
            tools,
        });
        const latencyMs = Date.now() - startTime;
        // Extract text content and tool calls
        const textContent = response.content
            .filter((block) => block.type === 'text')
            .map((block) => block.text)
            .join('');
        const toolCalls = response.content
            .filter((block) => block.type === 'tool_use')
            .map((block) => ({
            id: block.id,
            type: 'function',
            function: {
                name: block.name,
                arguments: JSON.stringify(block.input),
            },
        }));
        return {
            id: response.id,
            content: textContent,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
            usage: {
                promptTokens: response.usage.input_tokens,
                completionTokens: response.usage.output_tokens,
                totalTokens: response.usage.input_tokens + response.usage.output_tokens,
            },
            finishReason: this.mapStopReason(response.stop_reason),
            model: response.model,
            latencyMs,
        };
    }
    // ============================================================================
    // STREAMING
    // ============================================================================
    async *stream(messages, options) {
        const anthropicMessages = this.mapToAnthropicMessages(messages);
        const systemMessage = this.extractSystemMessage(messages);
        const model = options?.model ?? this.defaultModel;
        const tools = options?.tools
            ? this.mapToAnthropicTools(options.tools)
            : undefined;
        const stream = await this.client.messages.create({
            model,
            max_tokens: options?.maxTokens ?? 4096,
            temperature: options?.temperature ?? 0.7,
            system: systemMessage,
            messages: anthropicMessages,
            tools,
            stream: true,
        });
        let messageId = '';
        let toolCallBuilder = null;
        for await (const event of stream) {
            if (event.type === 'message_start') {
                messageId = event.message.id;
            }
            if (event.type === 'content_block_start') {
                if (event.content_block.type === 'tool_use') {
                    toolCallBuilder = {
                        id: event.content_block.id,
                        name: event.content_block.name,
                        inputJson: '',
                    };
                }
            }
            if (event.type === 'content_block_delta') {
                if (event.delta.type === 'text_delta') {
                    yield {
                        id: messageId,
                        model,
                        delta: {
                            content: event.delta.text,
                        },
                    };
                }
                else if (event.delta.type === 'input_json_delta' && toolCallBuilder) {
                    toolCallBuilder.inputJson += event.delta.partial_json;
                }
            }
            if (event.type === 'content_block_stop' && toolCallBuilder) {
                yield {
                    id: messageId,
                    model,
                    delta: {
                        toolCalls: [
                            {
                                id: toolCallBuilder.id,
                                type: 'function',
                                function: {
                                    name: toolCallBuilder.name,
                                    arguments: toolCallBuilder.inputJson || '{}',
                                },
                            },
                        ],
                    },
                };
                toolCallBuilder = null;
            }
            if (event.type === 'message_stop') {
                yield {
                    id: messageId,
                    model,
                    delta: {},
                    finishReason: 'stop',
                };
            }
        }
    }
    // ============================================================================
    // TOOL CALLING
    // ============================================================================
    async callWithTools(messages, tools, options) {
        const response = await this.chat(messages, {
            ...options,
            tools,
        });
        return {
            response,
            toolCalls: response.toolCalls ?? [],
        };
    }
    // ============================================================================
    // HEALTH CHECK
    // ============================================================================
    async healthCheck() {
        const startTime = Date.now();
        try {
            // Make a minimal API call to check health
            await this.client.messages.create({
                model: this.defaultModel,
                max_tokens: 10,
                messages: [{ role: 'user', content: 'Hi' }],
            });
            return {
                healthy: true,
                latencyMs: Date.now() - startTime,
                message: 'Anthropic API is healthy',
            };
        }
        catch (error) {
            return {
                healthy: false,
                latencyMs: Date.now() - startTime,
                message: `Anthropic API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error: error instanceof Error ? error : new Error(String(error)),
            };
        }
    }
    // ============================================================================
    // HELPERS
    // ============================================================================
    mapToAnthropicMessages(messages) {
        return messages
            .filter((msg) => msg.role !== 'system')
            .map((msg) => {
            if (msg.role === 'assistant' && msg.toolCalls) {
                return {
                    role: 'assistant',
                    content: [
                        ...(msg.content
                            ? [{ type: 'text', text: msg.content }]
                            : []),
                        ...msg.toolCalls.map((tc) => ({
                            type: 'tool_use',
                            id: tc.id,
                            name: tc.function.name,
                            input: JSON.parse(tc.function.arguments),
                        })),
                    ],
                };
            }
            if (msg.role === 'tool') {
                return {
                    role: 'user',
                    content: [
                        {
                            type: 'tool_result',
                            tool_use_id: msg.toolCallId ?? '',
                            content: msg.content,
                        },
                    ],
                };
            }
            return {
                role: msg.role,
                content: msg.content,
            };
        });
    }
    extractSystemMessage(messages) {
        const systemMessages = messages.filter((msg) => msg.role === 'system');
        return systemMessages.map((msg) => msg.content).join('\n\n');
    }
    mapToAnthropicTools(tools) {
        return tools.map((tool) => ({
            name: tool.function.name,
            description: tool.function.description,
            input_schema: tool.function.parameters,
        }));
    }
    mapStopReason(reason) {
        switch (reason) {
            case 'end_turn':
                return 'stop';
            case 'max_tokens':
                return 'length';
            case 'tool_use':
                return 'tool_calls';
            case 'content_filter':
                return 'content_filter';
            default:
                return 'stop';
        }
    }
}
// ============================================================================
// AI SERVICE (Multi-provider)
// ============================================================================
/**
 * Multi-provider AI service for Taxomind
 */
export class TaxomindAIService {
    providers = new Map();
    defaultProvider;
    constructor(options) {
        // Initialize Anthropic provider
        if (options?.anthropicApiKey || process.env.ANTHROPIC_API_KEY) {
            this.providers.set('anthropic', new AnthropicAIAdapter({
                apiKey: options?.anthropicApiKey,
            }));
        }
        this.defaultProvider = options?.defaultProvider ?? 'anthropic';
    }
    getProvider(name) {
        return this.providers.get(name ?? this.defaultProvider);
    }
    getAdapter(provider) {
        const adapter = this.providers.get(provider ?? this.defaultProvider);
        if (!adapter) {
            throw new Error(`AI provider not available: ${provider ?? this.defaultProvider}`);
        }
        return adapter;
    }
    getDefaultAdapter() {
        return this.getAdapter(this.defaultProvider);
    }
    setDefaultProvider(provider) {
        if (!this.providers.has(provider)) {
            throw new Error(`Provider not registered: ${provider}`);
        }
        this.defaultProvider = provider;
    }
    registerAdapter(name, adapter) {
        this.providers.set(name, adapter);
    }
    listProviders() {
        return Array.from(this.providers.keys());
    }
    async chat(messages, options) {
        const provider = this.getProvider(options?.provider);
        if (!provider) {
            throw new Error(`AI provider not available: ${options?.provider ?? this.defaultProvider}`);
        }
        return provider.chat(messages, options);
    }
    async *chatStream(messages, options) {
        const provider = this.getProvider(options?.provider);
        if (!provider) {
            throw new Error(`AI provider not available: ${options?.provider ?? this.defaultProvider}`);
        }
        yield* provider.chatStream(messages, options);
    }
    async healthCheck() {
        const results = new Map();
        await Promise.all(Array.from(this.providers.entries()).map(async ([name, provider]) => {
            const status = await provider.healthCheck();
            results.set(name, status);
        }));
        return results;
    }
}
// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================
/**
 * Create an Anthropic AI adapter
 */
export function createAnthropicAIAdapter(options) {
    return new AnthropicAIAdapter(options);
}
/**
 * Create a Taxomind AI service
 */
export function createTaxomindAIService(options) {
    return new TaxomindAIService(options);
}
//# sourceMappingURL=anthropic-ai-adapter.js.map