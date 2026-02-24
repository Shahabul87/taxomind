/**
 * @sam-ai/core - OpenAI AI Adapter
 * Adapter for OpenAI GPT API
 */

import type {
  AIAdapter,
  AIChatParams,
  AIChatResponse,
  AIChatStreamChunk,
} from '../types';
import { AIError, ConfigurationError } from '../errors';

// ============================================================================
// TYPES
// ============================================================================

export interface OpenAIAdapterOptions {
  apiKey: string;
  model?: string;
  baseURL?: string;
  organization?: string;
  maxRetries?: number;
  timeout?: number;
}

interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenAIRequest {
  model: string;
  max_tokens?: number;
  messages: OpenAIMessage[];
  temperature?: number;
  top_p?: number;
  stop?: string[];
  stream?: boolean;
  response_format?: { type: 'json_object' | 'text' };
}

interface OpenAIChoice {
  index: number;
  message: {
    role: 'assistant';
    content: string;
  };
  finish_reason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | null;
}

interface OpenAIResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIStreamDelta {
  role?: 'assistant';
  content?: string;
}

interface OpenAIStreamChoice {
  index: number;
  delta: OpenAIStreamDelta;
  finish_reason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | null;
}

interface OpenAIStreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: OpenAIStreamChoice[];
}

// ============================================================================
// OPENAI ADAPTER
// ============================================================================

export class OpenAIAdapter implements AIAdapter {
  readonly name = 'openai';
  readonly version = '1.0.0';

  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseURL: string;
  private readonly organization?: string;
  private readonly maxRetries: number;
  private readonly timeout: number;

  constructor(options: OpenAIAdapterOptions) {
    if (!options.apiKey) {
      throw new ConfigurationError('OpenAI API key is required');
    }

    this.apiKey = options.apiKey;
    this.model = options.model ?? 'gpt-4o';
    this.baseURL = options.baseURL ?? 'https://api.openai.com';
    this.organization = options.organization;
    this.maxRetries = options.maxRetries ?? 2;
    this.timeout = options.timeout ?? 60000;
  }

  /**
   * Check if the adapter is properly configured
   */
  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Get the current model being used
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Generate a chat completion
   */
  async chat(params: AIChatParams): Promise<AIChatResponse> {
    const model = params.model ?? this.model;
    const messages = this.formatMessages(params.messages, params.systemPrompt);

    const requestBody: OpenAIRequest = {
      model,
      max_tokens: params.maxTokens ?? 4096,
      messages,
      temperature: params.temperature,
      stop: params.stopSequences,
    };

    if (params.responseFormat === 'json') {
      requestBody.response_format = { type: 'json_object' };
    }

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.makeRequest<OpenAIResponse>(
          '/v1/chat/completions',
          requestBody
        );

        const choice = response.choices[0];
        if (!choice) {
          throw new AIError('No response choice returned from OpenAI');
        }

        return {
          content: choice.message.content,
          model: response.model,
          usage: {
            inputTokens: response.usage.prompt_tokens,
            outputTokens: response.usage.completion_tokens,
          },
          finishReason: choice.finish_reason === 'length' ? 'max_tokens' : 'stop',
        };
      } catch (error) {
        lastError = error as Error;

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
  async *chatStream(params: AIChatParams): AsyncIterable<AIChatStreamChunk> {
    const model = params.model ?? this.model;
    const messages = this.formatMessages(params.messages, params.systemPrompt);

    const requestBody: OpenAIRequest = {
      model,
      max_tokens: params.maxTokens ?? 4096,
      messages,
      temperature: params.temperature,
      stop: params.stopSequences,
      stream: true,
    };

    if (params.responseFormat === 'json') {
      requestBody.response_format = { type: 'json_object' };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };

    if (this.organization) {
      headers['OpenAI-Organization'] = this.organization;
    }

    const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers,
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
          const trimmedLine = line.trim();

          if (!trimmedLine || trimmedLine === '') {
            continue;
          }

          if (trimmedLine.startsWith('data: ')) {
            const data = trimmedLine.slice(6);

            if (data === '[DONE]') {
              yield { content: '', done: true };
              return;
            }

            try {
              const parsed: OpenAIStreamChunk = JSON.parse(data);
              const delta = parsed.choices[0]?.delta;

              if (delta?.content) {
                yield { content: delta.content, done: false };
              }
            } catch {
              // Ignore parse errors for incomplete JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Format messages for OpenAI API
   */
  private formatMessages(
    messages: AIChatParams['messages'],
    systemPrompt?: string
  ): OpenAIMessage[] {
    const formattedMessages: OpenAIMessage[] = [];

    // Add system prompt first if provided
    if (systemPrompt) {
      formattedMessages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    // Add all messages (including system messages from the array)
    for (const m of messages) {
      formattedMessages.push({
        role: m.role,
        content: m.content,
      });
    }

    return formattedMessages;
  }

  /**
   * Make a request to the OpenAI API
   */
  private async makeRequest<T>(endpoint: string, body: unknown): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };

    if (this.organization) {
      headers['OpenAI-Organization'] = this.organization;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      return (await response.json()) as T;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new AIError('Request timed out', { recoverable: true });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Handle error responses from the API
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `OpenAI API error: ${response.status}`;
    let recoverable = true;

    try {
      const errorBody = await response.json() as { error?: { message?: string } };
      errorMessage = errorBody.error?.message || errorMessage;
    } catch {
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
        throw new AIError('OpenAI service error', { recoverable: true });
    }

    throw new AIError(errorMessage, { recoverable });
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createOpenAIAdapter(options: OpenAIAdapterOptions): OpenAIAdapter {
  return new OpenAIAdapter(options);
}
