/**
 * SAM AI Provider
 *
 * Provides `runSAMChatWithPreference` for all SAM API routes.
 * Uses the enterprise AI client for provider resolution (user preference → platform default → factory fallback).
 *
 * @see lib/ai/enterprise-client.ts for the full provider resolution logic
 */

import { type AIMessage } from '@sam-ai/core';
import { aiClient } from '@/lib/ai/enterprise-client';
import { logger } from '@/lib/logger';

/**
 * Run SAM chat with user's preferred provider for a specific capability.
 * This respects the user's AI provider preferences from settings.
 *
 * Provider resolution: User preference → Platform default → Factory default
 *
 * Every SAM route MUST use this function (not aiClient.chat directly)
 * to ensure consistent logging, defaults, and capability tracking.
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

  logger.debug('[SAM Chat] Response from provider', {
    provider: result.provider,
    model: result.model,
    userId: options.userId,
    capability: options.capability,
  });

  return result.content;
}
