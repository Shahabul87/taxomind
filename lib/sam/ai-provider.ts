import { createAnthropicAdapter, type AIMessage } from '@sam-ai/core';

let aiAdapter: ReturnType<typeof createAnthropicAdapter> | null = null;

function getAIAdapter() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  if (!aiAdapter) {
    aiAdapter = createAnthropicAdapter({
      apiKey,
      model: 'claude-sonnet-4-5-20250929',
      timeout: 60000,
      maxRetries: 2,
    });
  }

  return aiAdapter;
}

export async function runSAMChat(options: {
  messages: AIMessage[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}): Promise<string> {
  const response = await getAIAdapter().chat({
    model: options.model,
    maxTokens: options.maxTokens ?? 2000,
    temperature: options.temperature ?? 0.7,
    systemPrompt: options.systemPrompt,
    messages: options.messages,
  });

  return response.content ?? '';
}
