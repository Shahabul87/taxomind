/**
 * SAM Client Adapter
 *
 * Creates a client-side SAMConfig that proxies AI calls through API routes.
 * This allows using the @sam-ai/react hooks while delegating actual AI
 * processing to the server-side API routes.
 */

import {
  createSAMConfig,
  type SAMConfig,
  type AIAdapter,
  type AIChatParams,
  type AIChatResponse,
} from '@sam-ai/core';

/**
 * Client-side AI adapter that proxies calls to API endpoints
 */
function createClientAIAdapter(apiEndpoint: string = '/api/sam'): AIAdapter {
  return {
    name: 'client-proxy',
    version: '1.0.0',

    async chat(params: AIChatParams): Promise<AIChatResponse> {
      try {
        // Extract the last user message
        const lastUserMessage = params.messages.filter((m) => m.role === 'user').pop();

        const response = await fetch(`${apiEndpoint}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: lastUserMessage?.content || '',
            conversationHistory: params.messages,
          }),
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        const message =
          typeof data?.data?.message === 'string'
            ? data.data.message
            : data.response || data.message || '';

        return {
          content: message,
          model: 'api-proxy',
          finishReason: 'stop',
          usage: {
            inputTokens: 0,
            outputTokens: 0,
          },
        };
      } catch (error) {
        throw error instanceof Error ? error : new Error(String(error));
      }
    },

    isConfigured(): boolean {
      return true; // Always configured for client-side use
    },

    getModel(): string {
      return 'api-proxy';
    },
  };
}

export interface ClientSAMConfigOptions {
  apiEndpoint?: string;
  features?: {
    gamification?: boolean;
    formSync?: boolean;
    autoContext?: boolean;
    emotionDetection?: boolean;
    learningStyleDetection?: boolean;
    streaming?: boolean;
    analytics?: boolean;
  };
}

/**
 * Create a client-side SAMConfig for use with SAMProvider
 */
export function createClientSAMConfig(options: ClientSAMConfigOptions = {}): SAMConfig {
  const { apiEndpoint = '/api/sam', features = {} } = options;

  const aiAdapter = createClientAIAdapter(apiEndpoint);

  return createSAMConfig({
    ai: aiAdapter,
    features: {
      gamification: features.gamification ?? true,
      formSync: features.formSync ?? true,
      autoContext: features.autoContext ?? true,
      emotionDetection: features.emotionDetection ?? true,
      learningStyleDetection: features.learningStyleDetection ?? true,
      streaming: features.streaming ?? false, // Streaming handled by backend
      analytics: features.analytics ?? true,
    },
    personality: {
      name: 'SAM',
      greeting: 'Hello! I am SAM, your Smart Adaptive Mentor.',
      tone: 'encouraging',
    },
  });
}
