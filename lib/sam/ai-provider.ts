import { createAnthropicAdapter, type AIMessage } from '@sam-ai/core';

// Standard adapter for quick operations (60s timeout)
let standardAdapter: ReturnType<typeof createAnthropicAdapter> | null = null;

// Extended adapter for complex operations like course generation (3 min timeout)
let extendedAdapter: ReturnType<typeof createAnthropicAdapter> | null = null;

function getAPIKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }
  return apiKey;
}

function getStandardAdapter() {
  if (!standardAdapter) {
    standardAdapter = createAnthropicAdapter({
      apiKey: getAPIKey(),
      model: 'claude-sonnet-4-5-20250929',
      timeout: 60000, // 60 seconds for quick operations
      maxRetries: 2,
    });
  }
  return standardAdapter;
}

function getExtendedAdapter() {
  if (!extendedAdapter) {
    extendedAdapter = createAnthropicAdapter({
      apiKey: getAPIKey(),
      model: 'claude-sonnet-4-5-20250929',
      timeout: 180000, // 3 minutes for complex operations
      maxRetries: 1, // Less retries for long operations
    });
  }
  return extendedAdapter;
}

export async function runSAMChat(options: {
  messages: AIMessage[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  extended?: boolean; // Use extended timeout for complex operations
}): Promise<string> {
  const adapter = options.extended ? getExtendedAdapter() : getStandardAdapter();

  const response = await adapter.chat({
    model: options.model,
    maxTokens: options.maxTokens ?? 2000,
    temperature: options.temperature ?? 0.7,
    systemPrompt: options.systemPrompt,
    messages: options.messages,
  });

  return response.content ?? '';
}
