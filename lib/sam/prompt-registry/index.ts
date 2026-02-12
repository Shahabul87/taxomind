/**
 * Prompt Registry — Public API
 *
 * Single entry point for the unified prompt management system.
 *
 * Usage:
 *   import { executeProfile, listProfiles } from '@/lib/sam/prompt-registry';
 *
 *   const result = await executeProfile({
 *     taskType: 'chapter-content-generation',
 *     input: { chapterTitle: '...', ... },
 *     userId: session.userId,
 *   });
 */

import { runSAMChatWithMetadata, handleAIAccessError } from '@/lib/sam/ai-provider';
import { withRetryableTimeout, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { logger } from '@/lib/logger';

import type {
  PromptTaskType,
  AIParameters,
  ExecuteProfileResult,
} from './types';
import { getProfile, composeSystemPrompt } from './registry';

// Side-effect import: registers all profiles on first import of this module
import './profiles';

// ============================================================================
// Re-exports
// ============================================================================

export { registerProfile, getProfile, composeSystemPrompt, listProfiles } from './registry';
export type {
  PromptTaskType,
  PromptProfile,
  KnowledgeModule,
  AIParameters,
  ExecuteProfileResult,
} from './types';

// ============================================================================
// JSON extraction helper
// ============================================================================

function extractJsonFromResponse(text: string): string {
  // Try JSON object first
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) return objectMatch[0];

  // Try JSON array
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) return arrayMatch[0];

  // Return raw text as last resort
  return text;
}

// ============================================================================
// executeProfile — the main public function
// ============================================================================

/**
 * Full execution lifecycle:
 * 1. Look up profile from registry
 * 2. Compose system prompt (base + knowledge modules)
 * 3. Build user prompt from typed input
 * 4. Call runSAMChatWithMetadata() with resolved AI parameters
 * 5. Extract JSON from response
 * 6. Parse with outputSchema (Zod)
 * 7. Run postValidate() if present
 * 8. Return typed output + provider/model metadata
 */
export async function executeProfile<TInput, TOutput>(params: {
  taskType: PromptTaskType;
  input: TInput;
  userId: string;
  overrides?: Partial<AIParameters>;
}): Promise<ExecuteProfileResult<TOutput>> {
  const { taskType, input, userId, overrides } = params;

  // 1. Look up profile
  const profile = getProfile<TInput, TOutput>(taskType);
  if (!profile) {
    throw new Error(
      `[PromptRegistry] No profile registered for task type: ${taskType}`,
    );
  }

  // 2. Compose system prompt
  const systemPrompt = composeSystemPrompt(profile);

  // 3. Build user prompt
  const userPrompt = profile.buildUserPrompt(input);

  // 4. Resolve AI parameters (profile defaults + overrides)
  const aiParams: AIParameters = {
    capability: overrides?.capability ?? profile.aiParameters.capability,
    maxTokens: overrides?.maxTokens ?? profile.aiParameters.maxTokens,
    temperature: overrides?.temperature ?? profile.aiParameters.temperature,
  };

  // 5. Call AI with timeout + retry
  const completion = await withRetryableTimeout(
    () =>
      runSAMChatWithMetadata({
        userId,
        capability: aiParams.capability,
        systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        maxTokens: aiParams.maxTokens,
        temperature: aiParams.temperature,
      }),
    TIMEOUT_DEFAULTS.AI_GENERATION,
    taskType,
  );

  const responseText = completion.content;
  if (!responseText) {
    throw new Error(`[PromptRegistry] Empty response from AI for ${taskType}`);
  }

  // 6. Extract JSON
  const jsonStr = extractJsonFromResponse(responseText);

  let rawParsed: unknown;
  try {
    rawParsed = JSON.parse(jsonStr);
  } catch (parseError) {
    logger.error(`[PromptRegistry] JSON parse failed for ${taskType}`, {
      error: parseError instanceof Error ? parseError.message : String(parseError),
      responseSnippet: responseText.slice(0, 200),
    });
    throw new Error(
      `[PromptRegistry] Failed to parse AI response as JSON for ${taskType}`,
    );
  }

  // 7. Validate with Zod schema
  const parseResult = profile.outputSchema.safeParse(rawParsed);
  if (!parseResult.success) {
    logger.error(`[PromptRegistry] Schema validation failed for ${taskType}`, {
      errors: parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    });
    throw new Error(
      `[PromptRegistry] AI response does not match schema for ${taskType}: ${parseResult.error.errors.map((e) => e.message).join('; ')}`,
    );
  }

  const data = parseResult.data as TOutput;

  // 8. Run post-validation if present
  if (profile.postValidate) {
    const validation = profile.postValidate(data, input);
    if (!validation.valid) {
      logger.warn(`[PromptRegistry] Post-validation issues for ${taskType}`, {
        issues: validation.issues,
      });
      // Post-validation issues are warnings, not hard failures
    }
  }

  return {
    data,
    provider: completion.provider,
    model: completion.model,
  };
}

// Re-export handleAIAccessError for routes that need it alongside executeProfile
export { handleAIAccessError };
