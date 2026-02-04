/**
 * SAM Mode Resolver
 *
 * Resolves mode IDs to engine pipelines, system prompts, and tool allowlists.
 * The base 'context' engine is always included regardless of mode.
 */

import { getModeById } from './registry';
import type { EngineMaturityLevel } from '@sam-ai/educational/engine-maturity';
import { getModeMaturity, getEngineMaturity } from '@sam-ai/educational/engine-maturity';
import { getPresetEffectivenessScore, getBestPresetForMode } from '@/lib/sam/pipeline/preset-tracker';
import { logger } from '@/lib/logger';

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
 *
 * @param contextConfidence  0-1 score from context gathering (default 1.0).
 *   Low values cause the resolver to prefer general engines over specialized ones.
 */
export function resolveModeEnginesWithMetadata(
  modeId: string,
  message: string,
  pageContext: { type: string; hasForm: boolean },
  contextConfidence = 1.0,
): ModeEngineResolution {
  const mode = getModeById(modeId);
  if (!mode) {
    return { engines: [...BASE_ENGINES, 'response'], reason: 'unknown mode fallback', augmented: false };
  }

  let engines = [...BASE_ENGINES, ...mode.enginePreset];
  let reason = `Mode '${mode.label}' preset`;
  let augmented = false;

  // --- Rule 1: Complex message → add blooms ---
  if (message.length > 120 || /\b(explain|compare|contrast|analyze|why)\b/i.test(message)) {
    if (!engines.includes('blooms')) {
      engines.push('blooms');
      reason += ' + blooms (complex query)';
      augmented = true;
    }
  }

  // --- Rule 2: Learning page → add personalization ---
  const learningPageTypes = ['learning', 'course-learning', 'chapter-learning', 'section-learning'];
  if (learningPageTypes.includes(pageContext.type)) {
    if (!engines.includes('personalization')) {
      engines.push('personalization');
      reason += ' + personalization (learning page)';
      augmented = true;
    }
  }

  // --- Rule 3: Assessment mode → always include quiz + practice ---
  const assessmentModes = ['assessment', 'quiz', 'practice', 'exam-prep'];
  if (assessmentModes.includes(modeId)) {
    for (const eng of ['quiz', 'practice']) {
      if (!engines.includes(eng)) {
        engines.push(eng);
        reason += ` + ${eng} (assessment mode)`;
        augmented = true;
      }
    }
  }

  // --- Rule 4: Content creation mode → always include content-generation ---
  const creationModes = ['content-creation', 'writing', 'course-creation'];
  if (creationModes.includes(modeId)) {
    if (!engines.includes('content-generation')) {
      engines.push('content-generation');
      reason += ' + content-generation (creation mode)';
      augmented = true;
    }
  }

  // --- Rule 5: Low-confidence context → prefer general engines ---
  if (contextConfidence < 0.5) {
    const generalEngines = engines.filter(
      (e) => BASE_ENGINES.includes(e) || e === 'response' || e === 'general' || e === 'explanation',
    );
    if (generalEngines.length > 0 && generalEngines.length < engines.length) {
      engines = generalEngines;
      reason += ' [degraded: low context confidence]';
      augmented = true;
      logger.info('[MODE_RESOLVER] Low context confidence, restricted to general engines', {
        modeId,
        contextConfidence,
        engines,
      });
    }
  }

  // --- Rule 6: Feedback-driven engine boosting (from preset tracker) ---
  const bestPreset = getBestPresetForMode(modeId);
  if (bestPreset && bestPreset.bayesianScore > 0.7) {
    logger.debug('[MODE_RESOLVER] High-performing preset detected', {
      modeId,
      presetId: bestPreset.presetId,
      score: bestPreset.bayesianScore.toFixed(3),
    });
    // If the best preset suggests specific engines that overlap with the mode's
    // registered presets, they are already included. This log serves as a
    // diagnostic hook for future per-preset engine mapping.
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
 * Safe default tool categories used when an unknown mode is requested.
 * Intentionally restrictive — only general-purpose safe categories.
 */
const SAFE_DEFAULT_TOOL_CATEGORIES = new Set(['external']);

/**
 * Filter tools to those allowed by the current mode.
 * Returns a subset of tools whose categories match the mode's allowlist.
 *
 * Security hardening:
 * - Unknown mode → safe default categories only (not all tools)
 * - general-assistant → uses its registered allowedToolCategories (not wildcard)
 * - Uncategorized tools (no category) → denied by default
 */
export function resolveModeToolAllowlist<T extends { category?: string }>(
  modeId: string,
  allTools: T[]
): T[] {
  const mode = getModeById(modeId);

  if (!mode) {
    // Unknown mode: restrict to safe defaults instead of returning all tools
    logger.warn('[MODE_RESOLVER] Unknown mode, using safe default tool categories', { modeId });
    return allTools.filter((tool) => {
      if (!tool.category) return false;
      return SAFE_DEFAULT_TOOL_CATEGORIES.has(tool.category);
    });
  }

  // All modes (including general-assistant) use their registered categories
  const allowedCategories = new Set(mode.allowedToolCategories);
  return allTools.filter((tool) => {
    // Uncategorized tools denied by default — must belong to an allowed category
    if (!tool.category) return false;
    return allowedCategories.has(tool.category);
  });
}
