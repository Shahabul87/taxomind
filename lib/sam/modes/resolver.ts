/**
 * SAM Mode Resolver
 *
 * Resolves mode IDs to engine pipelines, system prompts, and tool allowlists.
 * The base 'context' engine is always included regardless of mode.
 */

import { getModeById } from './registry';
import type { EngineMaturityLevel } from '@sam-ai/educational/engine-maturity';
import { getModeMaturity, getEngineMaturity } from '@sam-ai/educational/engine-maturity';

/** Base engines always active in every mode */
const BASE_ENGINES = ['context'];

/** Result of mode engine resolution with metadata for diagnostics. */
export interface ModeEngineResolution {
  engines: string[];
  reason: string;
  augmented: boolean;
  maturity?: EngineMaturityLevel;
  engineMaturityMap?: Record<string, EngineMaturityLevel>;
  engineConfig?: Record<string, unknown>;
}

/**
 * Resolve which engines to run for a given mode, with metadata
 * explaining the selection and any augmentations applied.
 */
export function resolveModeEnginesWithMetadata(
  modeId: string,
  message: string,
  pageContext: { type: string; hasForm: boolean },
): ModeEngineResolution {
  const mode = getModeById(modeId);
  if (!mode) {
    return { engines: [...BASE_ENGINES, 'response'], reason: 'unknown mode fallback', augmented: false };
  }

  const engines = [...BASE_ENGINES, ...mode.enginePreset];
  let reason = `Mode '${mode.label}' preset`;
  let augmented = false;

  // Complex message augmentation: add blooms if not present
  if (message.length > 120 || /\b(explain|compare|contrast|analyze|why)\b/i.test(message)) {
    if (!engines.includes('blooms')) {
      engines.push('blooms');
      reason += ' + blooms (complex query)';
      augmented = true;
    }
  }

  // Learning page augmentation: add personalization if not present
  const learningPageTypes = ['learning', 'course-learning', 'chapter-learning', 'section-learning'];
  if (learningPageTypes.includes(pageContext.type)) {
    if (!engines.includes('personalization')) {
      engines.push('personalization');
      reason += ' + personalization (learning page)';
      augmented = true;
    }
  }

  // Compute maturity metadata
  const engineMaturityMap: Record<string, EngineMaturityLevel> = {};
  for (const eng of engines) {
    engineMaturityMap[eng] = getEngineMaturity(eng);
  }
  const maturity = getModeMaturity(engines);

  return { engines, reason, augmented, maturity, engineMaturityMap, engineConfig: mode.engineConfig };
}

/**
 * Resolve which engines to run for a given mode.
 * Returns BASE_ENGINES + mode-specific engines.
 */
export function resolveModeEngines(
  modeId: string,
  message: string,
  pageContext: { type: string; hasForm: boolean }
): string[] {
  return resolveModeEnginesWithMetadata(modeId, message, pageContext).engines;
}

/**
 * Resolve the full mode context including engines, config, maturity, and augmentations.
 */
export function resolveModeContext(
  modeId: string,
  message: string,
  pageContext: { type: string; hasForm: boolean },
): {
  engines: string[];
  config: Record<string, unknown> | undefined;
  maturity: EngineMaturityLevel | undefined;
  augmentations: string[];
} {
  const resolution = resolveModeEnginesWithMetadata(modeId, message, pageContext);
  return {
    engines: resolution.engines,
    config: resolution.engineConfig,
    maturity: resolution.maturity,
    augmentations: resolution.augmented ? [resolution.reason] : [],
  };
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
