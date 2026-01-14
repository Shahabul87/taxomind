import type {
  AIAdapter as CoreAIAdapter,
  AIChatParams,
  AIChatResponse,
  AIChatStreamChunk,
} from '@sam-ai/core';
import type {
  AIAdapter as IntegrationAIAdapter,
  ChatMessage,
  CompletionOptions,
  CompletionResponse,
  StreamChunk,
} from '../adapters/ai';

const mapMessages = (messages: AIChatParams['messages']): ChatMessage[] =>
  messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));

const resolveModel = (
  adapter: IntegrationAIAdapter,
  params: AIChatParams,
  overrideModel?: string
): string => params.model ?? overrideModel ?? adapter.getDefaultModel();

const buildOptions = (
  params: AIChatParams,
  model: string
): CompletionOptions => ({
  model,
  temperature: params.temperature,
  maxTokens: params.maxTokens,
  stopSequences: params.stopSequences,
});

const mapFinishReason = (
  reason: CompletionResponse['finishReason']
): AIChatResponse['finishReason'] => {
  if (reason === 'stop') return 'stop';
  if (reason === 'length') return 'max_tokens';
  return 'error';
};

const chunkToStream = function* (chunk: StreamChunk): Generator<AIChatStreamChunk> {
  const content = chunk.delta?.content ?? '';
  const done = Boolean(chunk.finishReason);
  if (content.length > 0 || done) {
    yield { content, done };
  }
};

export function createCoreAIAdapterFromIntegration(
  adapter: IntegrationAIAdapter,
  options?: { model?: string }
): CoreAIAdapter {
  return {
    name: adapter.getName(),
    version: 'integration-bridge',
    isConfigured: () => true,
    getModel: () => resolveModel(adapter, { messages: [] }, options?.model),
    chat: async (params: AIChatParams): Promise<AIChatResponse> => {
      const messages = mapMessages(params.messages);
      const model = resolveModel(adapter, params, options?.model);
      const completionOptions = buildOptions(params, model);

      const response = params.systemPrompt
        ? await adapter.chatWithSystem(params.systemPrompt, messages, completionOptions)
        : await adapter.chat(messages, completionOptions);

      return {
        content: response.content,
        model: response.model,
        usage: {
          inputTokens: response.usage.promptTokens,
          outputTokens: response.usage.completionTokens,
        },
        finishReason: mapFinishReason(response.finishReason),
      };
    },
    chatStream: async function* (params: AIChatParams): AsyncGenerator<AIChatStreamChunk> {
      const messages = mapMessages(params.messages);
      const model = resolveModel(adapter, params, options?.model);
      const completionOptions = buildOptions(params, model);

      const stream = params.systemPrompt
        ? adapter.chatStreamWithSystem(params.systemPrompt, messages, completionOptions)
        : adapter.chatStream(messages, completionOptions);

      for await (const chunk of stream) {
        yield* chunkToStream(chunk);
      }
    },
  };
}
