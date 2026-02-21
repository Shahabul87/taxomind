/**
 * Safe AI JSON response parser.
 *
 * Handles common AI response quirks:
 * - Reasoning model <think>...</think> blocks (deepseek-reasoner, o1, etc.)
 * - Markdown code fences (```json ... ```)
 * - Leading/trailing whitespace
 * - Optional Zod schema validation
 *
 * Returns null on any failure (never throws) so callers can provide fallbacks.
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';

/**
 * Strip <think>...</think> blocks emitted by reasoning models (deepseek-reasoner, o1, etc.).
 * Handles both complete blocks and truncated (unclosed) think tags from token-limited responses.
 */
function stripThinkBlocks(raw: string): string {
  // Strip complete <think>...</think> blocks (non-greedy to handle multiple blocks)
  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, '');

  // Strip unclosed <think> blocks (truncated response hit token limit before closing tag)
  text = text.replace(/<think>[\s\S]*$/gi, '');

  return text;
}

/**
 * Strip markdown code fences from AI response text.
 * Handles ```json, ```, and bare fences.
 */
function stripMarkdownFences(raw: string): string {
  let text = raw.trim();

  // Remove opening fence: ```json or ```
  const openFenceRegex = /^```(?:json|JSON|typescript|ts)?\s*\n?/;
  if (openFenceRegex.test(text)) {
    text = text.replace(openFenceRegex, '');
  }

  // Remove closing fence
  const closeFenceRegex = /\n?```\s*$/;
  if (closeFenceRegex.test(text)) {
    text = text.replace(closeFenceRegex, '');
  }

  return text.trim();
}

/**
 * Parse an AI response string as JSON, with optional Zod validation.
 *
 * @param raw - The raw AI response string
 * @param schema - Optional Zod schema to validate parsed JSON
 * @param context - Optional context string for logging
 * @returns Parsed and validated object, or null on failure
 */
export function parseAIJsonResponse<T>(
  raw: string,
  schema?: z.ZodSchema<T>,
  context?: string
): T | null {
  const logPrefix = context ? `[parseAIJson:${context}]` : '[parseAIJson]';

  if (!raw || typeof raw !== 'string') {
    logger.warn(`${logPrefix} Empty or non-string input`);
    return null;
  }

  // Strip reasoning model <think> blocks FIRST, before any other processing
  const withoutThinking = stripThinkBlocks(raw);
  const stripped = stripMarkdownFences(withoutThinking);

  // Try to extract JSON object or array if there's surrounding text
  let jsonCandidate = stripped;

  // If the stripped text doesn't start with { or [, try to find JSON within
  if (!stripped.startsWith('{') && !stripped.startsWith('[')) {
    const objectMatch = stripped.match(/(\{[\s\S]*\})/);
    const arrayMatch = stripped.match(/(\[[\s\S]*\])/);

    if (objectMatch) {
      jsonCandidate = objectMatch[1];
    } else if (arrayMatch) {
      jsonCandidate = arrayMatch[1];
    } else {
      logger.warn(`${logPrefix} No JSON object or array found in response`);
      return null;
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonCandidate);
  } catch (parseError) {
    logger.warn(`${logPrefix} JSON.parse failed`, {
      error: parseError instanceof Error ? parseError.message : String(parseError),
      snippet: jsonCandidate.slice(0, 200),
    });
    return null;
  }

  if (!schema) {
    return parsed as T;
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    logger.warn(`${logPrefix} Zod validation failed`, {
      errors: result.error.issues.slice(0, 5),
    });
    return null;
  }

  return result.data;
}
