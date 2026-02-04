/**
 * SAM AI Provider
 *
 * Provides `runSAMChat` and `runSAMChatWithPreference` for all SAM API routes.
 * Uses the enterprise AI client for provider resolution (platform default → user preference → factory fallback).
 *
 * @see lib/ai/enterprise-client.ts for the full provider resolution logic
 */

import { type AIMessage } from '@sam-ai/core';
import { aiClient } from '@/lib/ai/enterprise-client';
import { logger } from '@/lib/logger';

/**
 * Run a SAM AI chat request.
 *
 * Provider resolution: Platform default → Factory default (DeepSeek > Anthropic > OpenAI)
 *
 * NOTE: The `model` parameter is intentionally omitted. Each provider uses its own
 * default model from the registry. Passing provider-specific model names (e.g. claude-*)
 * breaks when the platform is configured for a different provider.
 */
export async function runSAMChat(options: {
  messages: AIMessage[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  extended?: boolean;
}): Promise<string> {
  const result = await aiClient.chat({
    messages: options.messages,
    systemPrompt: options.systemPrompt,
    maxTokens: options.maxTokens ?? 2000,
    temperature: options.temperature ?? 0.7,
    extended: options.extended,
  });

  logger.debug('[SAM Chat] Response from provider', {
    provider: result.provider,
    model: result.model,
  });

  return result.content;
}

/**
 * Run SAM chat with user's preferred provider for a specific capability.
 * This respects the user's AI provider preferences from settings.
 *
 * Provider resolution: User preference → Platform default → Factory default
 */
export async function runSAMChatWithPreference(options: {
  userId: string;
  capability: 'chat' | 'course' | 'analysis' | 'code' | 'skill-roadmap';
  messages: AIMessage[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  extended?: boolean;
}): Promise<string> {
  const result = await aiClient.chat({
    userId: options.userId,
    capability: options.capability,
    messages: options.messages,
    systemPrompt: options.systemPrompt,
    maxTokens: options.maxTokens ?? 2000,
    temperature: options.temperature ?? 0.7,
    extended: options.extended,
  });

  logger.debug('[SAM Chat Preference] Response from provider', {
    provider: result.provider,
    model: result.model,
    userId: options.userId,
    capability: options.capability,
  });

  return result.content;
}

/**
 * Get user's preferred AI provider for a specific capability.
 * Re-exported for backward compatibility.
 *
 * @deprecated Use `aiClient.getResolvedProvider({ userId })` instead
 */
export async function getUserPreferredProvider(
  userId: string,
  _capability: 'chat' | 'course' | 'analysis' | 'code' | 'skill-roadmap'
): Promise<string> {
  return aiClient.getResolvedProvider({ userId });
}
