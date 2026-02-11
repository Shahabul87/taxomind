/**
 * @sam-ai/adapter-taxomind - Anthropic AI Adapter
 * Implements AIAdapter using Anthropic Claude API
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  AIAdapter,
  AIService,
  ChatMessage,
  CompletionOptions,
  CompletionResponse,
  StreamChunk,
  ToolDefinition,
  ToolCall,
  HealthStatus,
} from '@sam-ai/integration';

// ============================================================================
// ANTHROPIC AI ADAPTER
// ============================================================================

/**
 * Anthropic Claude AI adapter
 */
export class AnthropicAIAdapter implements AIAdapter {
  private client: Anthropic;
  private defaultModel: string;
  private name: string = 'anthropic';

  constructor(options?: {
    apiKey?: string;
    defaultModel?: string;
  }) {
    this.client = new Anthropic({
      apiKey: options?.apiKey ?? process.env.ANTHROPIC_API_KEY,
    });
    this.defaultModel = options?.defaultModel ?? 'claude-sonnet-4-20250514';
  }

  // ============================================================================
  // ADAPTER INFO
  // ============================================================================

  getName(): string {
    return this.name;
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }

  async listModels(): Promise<string[]> {
    // Anthropic doesn't have a public list models API
    // Return known models
    return [
      'claude-sonnet-4-5-20250929',
      'claude-opus-4-20250514',
      'claude-sonnet-4-20250514',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-haiku-20240307',
    ];
  }

  async isAvailable(): Promise<boolean> {
    try {
      const health = await this.healthCheck();
      return health.healthy;
    } catch {
      return false;
    }
  }

  supportsStreaming(): boolean {
    return true;
  }

  supportsFunctionCalling(): boolean {
    return true;
  }

  supportsVision(): boolean {
    return true;
  }

  getMaxTokens(): number {
    return 8192;
  }

  getRateLimits(): { requestsPerMinute: number; tokensPerMinute: number } {
    return {
      requestsPerMinute: 60,
      tokensPerMinute: 100000,
    };
  }

  async countTokens(text: string): Promise<number> {
    // Rough estimation: ~4 chars per token for English text
    return Math.ceil(text.length / 4);
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: this.defaultModel,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }],
      });
      return true;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // CHAT CONVENIENCE METHODS
  // ============================================================================

  async chatWithSystem(
    systemPrompt: string,
    messages: ChatMessage[],
    options?: CompletionOptions
  ): Promise<CompletionResponse> {
    const allMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];
    return this.chat(allMessages, options);
  }

  async *chatStream(
    messages: ChatMessage[],
    options?: CompletionOptions
  ): AsyncGenerator<StreamChunk> {
    yield* this.stream(messages, options);
  }

  async *chatStreamWithSystem(
    systemPrompt: string,
    messages: ChatMessage[],
    options?: CompletionOptions
  ): AsyncGenerator<StreamChunk> {
    const allMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];
    yield* this.stream(allMessages, options);
  }

  async complete(
    prompt: string,
    options?: CompletionOptions
  ): Promise<CompletionResponse> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  async *completeStream(
    prompt: string,
    options?: CompletionOptions
  ): AsyncGenerator<StreamChunk> {
    yield* this.stream([{ role: 'user', content: prompt }], options);
  }

  async embed(text: string): Promise<number[]> {
    // Anthropic doesn't provide embeddings, throw error or return empty
    throw new Error('Anthropic does not support embeddings. Use OpenAI embeddings.');
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    throw new Error('Anthropic does not support embeddings. Use OpenAI embeddings.');
  }

  async chatWithTools(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    options?: CompletionOptions
  ): Promise<CompletionResponse> {
    return this.chat(messages, { ...options, tools });
  }

  async continueWithToolResults(
    messages: ChatMessage[],
    toolResults: Array<{ toolCallId: string; result: string }>,
    tools: ToolDefinition[],
    options?: Omit<CompletionOptions, 'tools'>
  ): Promise<CompletionResponse> {
    const toolMessages: ChatMessage[] = toolResults.map((r) => ({
      role: 'tool' as const,
      content: r.result,
      toolCallId: r.toolCallId,
    }));
    return this.chat([...messages, ...toolMessages], { ...options, tools });
  }

  getContextWindowSize(): number {
    // Claude 3.5 Sonnet has 200k context
    return 200000;
  }

  // ============================================================================
  // CHAT COMPLETION
  // ============================================================================

  async chat(
    messages: ChatMessage[],
    options?: CompletionOptions
  ): Promise<CompletionResponse> {
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
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    const toolCalls: ToolCall[] = response.content
      .filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      )
      .map((block) => ({
        id: block.id,
        type: 'function' as const,
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

  async *stream(
    messages: ChatMessage[],
    options?: CompletionOptions
  ): AsyncGenerator<StreamChunk> {
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
    let toolCallBuilder: {
      id: string;
      name: string;
      inputJson: string;
    } | null = null;

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
        } else if (event.delta.type === 'input_json_delta' && toolCallBuilder) {
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

  async callWithTools(
    messages: ChatMessage[],
    tools: ToolDefinition[],
    options?: CompletionOptions
  ): Promise<{
    response: CompletionResponse;
    toolCalls: ToolCall[];
  }> {
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

  async healthCheck(): Promise<HealthStatus> {
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
    } catch (error) {
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

  private mapToAnthropicMessages(
    messages: ChatMessage[]
  ): Anthropic.MessageParam[] {
    return messages
      .filter((msg) => msg.role !== 'system')
      .map((msg) => {
        if (msg.role === 'assistant' && msg.toolCalls) {
          return {
            role: 'assistant' as const,
            content: [
              ...(msg.content
                ? [{ type: 'text' as const, text: msg.content }]
                : []),
              ...msg.toolCalls.map((tc) => ({
                type: 'tool_use' as const,
                id: tc.id,
                name: tc.function.name,
                input: JSON.parse(tc.function.arguments),
              })),
            ],
          };
        }

        if (msg.role === 'tool') {
          return {
            role: 'user' as const,
            content: [
              {
                type: 'tool_result' as const,
                tool_use_id: msg.toolCallId ?? '',
                content: msg.content,
              },
            ],
          };
        }

        return {
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        };
      });
  }

  private extractSystemMessage(messages: ChatMessage[]): string {
    const systemMessages = messages.filter((msg) => msg.role === 'system');
    return systemMessages.map((msg) => msg.content).join('\n\n');
  }

  private mapToAnthropicTools(tools: ToolDefinition[]): Anthropic.Tool[] {
    return tools.map((tool) => ({
      name: tool.function.name,
      description: tool.function.description,
      input_schema: tool.function.parameters as Anthropic.Tool['input_schema'],
    }));
  }

  private mapStopReason(
    reason: string | null
  ): 'stop' | 'length' | 'tool_calls' | 'content_filter' {
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
export class TaxomindAIService implements AIService {
  private providers: Map<string, AIAdapter> = new Map();
  private defaultProvider: string;

  constructor(options?: {
    anthropicApiKey?: string;
    openaiApiKey?: string;
    defaultProvider?: string;
  }) {
    // Initialize Anthropic provider
    if (options?.anthropicApiKey || process.env.ANTHROPIC_API_KEY) {
      this.providers.set(
        'anthropic',
        new AnthropicAIAdapter({
          apiKey: options?.anthropicApiKey,
        })
      );
    }

    this.defaultProvider = options?.defaultProvider ?? 'anthropic';
  }

  getProvider(name?: string): AIAdapter | undefined {
    return this.providers.get(name ?? this.defaultProvider);
  }

  getAdapter(provider?: string): AIAdapter {
    const adapter = this.providers.get(provider ?? this.defaultProvider);
    if (!adapter) {
      throw new Error(`AI provider not available: ${provider ?? this.defaultProvider}`);
    }
    return adapter;
  }

  getDefaultAdapter(): AIAdapter {
    return this.getAdapter(this.defaultProvider);
  }

  setDefaultProvider(provider: string): void {
    if (!this.providers.has(provider)) {
      throw new Error(`Provider not registered: ${provider}`);
    }
    this.defaultProvider = provider;
  }

  registerAdapter(name: string, adapter: AIAdapter): void {
    this.providers.set(name, adapter);
  }

  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  async chat(
    messages: ChatMessage[],
    options?: CompletionOptions & { provider?: string }
  ): Promise<CompletionResponse> {
    const provider = this.getProvider(options?.provider);
    if (!provider) {
      throw new Error(`AI provider not available: ${options?.provider ?? this.defaultProvider}`);
    }
    return provider.chat(messages, options);
  }

  async *chatStream(
    messages: ChatMessage[],
    options?: CompletionOptions & { provider?: string }
  ): AsyncGenerator<StreamChunk> {
    const provider = this.getProvider(options?.provider);
    if (!provider) {
      throw new Error(`AI provider not available: ${options?.provider ?? this.defaultProvider}`);
    }
    yield* provider.chatStream(messages, options);
  }

  async healthCheck(): Promise<Map<string, HealthStatus>> {
    const results = new Map<string, HealthStatus>();

    await Promise.all(
      Array.from(this.providers.entries()).map(async ([name, provider]) => {
        const status = await provider.healthCheck();
        results.set(name, status);
      })
    );

    return results;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create an Anthropic AI adapter
 */
export function createAnthropicAIAdapter(options?: {
  apiKey?: string;
  defaultModel?: string;
}): AnthropicAIAdapter {
  return new AnthropicAIAdapter(options);
}

/**
 * Create a Taxomind AI service
 */
export function createTaxomindAIService(options?: {
  anthropicApiKey?: string;
  openaiApiKey?: string;
  defaultProvider?: string;
}): TaxomindAIService {
  return new TaxomindAIService(options);
}
