/**
 * SAM Modes - Public API
 *
 * Re-exports all mode system types, registry, and resolver functions.
 */

// Types
export type { SAMMode, SAMModeCategory, SAMModeId, SAMModeCategoryInfo, ModeEngineConfig } from './types';
export { SAM_MODE_IDS, MODE_CATEGORIES } from './types';

// Registry
export { getModeById, getAllModes, getModesByCategory } from './registry';

// Resolver
export { resolveModeEngines, resolveModeEnginesWithMetadata, resolveModeSystemPrompt, resolveModeToolAllowlist } from './resolver';
export type { ModeEngineResolution } from './resolver';

// Engine maturity (re-export for convenience)
export { getEngineMaturity, getModeMaturity, getEnginesByMaturity } from '@sam-ai/educational/engine-maturity';
export type { EngineMaturityLevel } from '@sam-ai/educational/engine-maturity';

// Intent classifier
export { classifyModeRelevance } from './intent-classifier';
