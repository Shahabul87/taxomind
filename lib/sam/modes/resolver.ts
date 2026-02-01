/**
 * SAM Mode Resolver
 *
 * Resolves mode IDs to engine pipelines, system prompts, and tool allowlists.
 * The base 'context' engine is always included regardless of mode.
 */

import { getModeById } from './registry';

/** Base engines always active in every mode */
const BASE_ENGINES = ['context'];

/**
 * Resolve which engines to run for a given mode.
 * Returns BASE_ENGINES + mode-specific engines.
 */
export function resolveModeEngines(
  modeId: string,
  _message: string,
  _pageContext: { type: string; hasForm: boolean }
): string[] {
  const mode = getModeById(modeId);
  if (!mode) return [...BASE_ENGINES, 'response'];

  return [...BASE_ENGINES, ...mode.enginePreset];
}

/**
 * Resolve the system prompt addition for a given mode.
 * Returns the mode-specific prompt to append to the base system prompt.
 */
export function resolveModeSystemPrompt(
  modeId: string,
  _basePrompt: string
): string {
  const mode = getModeById(modeId);
  if (!mode) return '';
  return mode.systemPromptAddition;
}

/**
 * Filter tools to those allowed by the current mode.
 * Returns a subset of tools whose categories match the mode's allowlist.
 */
export function resolveModeToolAllowlist<T extends { category?: string }>(
  modeId: string,
  allTools: T[]
): T[] {
  const mode = getModeById(modeId);
  if (!mode) return allTools;

  // general-assistant allows everything
  if (modeId === 'general-assistant') return allTools;

  const allowedCategories = new Set(mode.allowedToolCategories);
  return allTools.filter((tool) => {
    if (!tool.category) return true; // uncategorized tools are always allowed
    return allowedCategories.has(tool.category);
  });
}
