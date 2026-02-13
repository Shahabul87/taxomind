/**
 * Course Creation Cost Estimator
 *
 * Pure estimation logic — no DB access.
 * Calculates expected tokens, cost, and time based on course structure
 * and the 3-stage depth-first pipeline (chapters → sections → details).
 *
 * When a Chapter DNA template is active (always, since difficulty determines
 * the template), sectionsPerChapter is overridden to the template value
 * (beginner: 8, intermediate: 7, advanced: 8).
 */

import { getTemplateForDifficulty } from './chapter-templates';

// ============================================================================
// Types
// ============================================================================

export interface CostEstimateInput {
  totalChapters: number;
  sectionsPerChapter: number;
  difficulty: string;
  bloomsFocusCount: number;
  learningObjectivesPerChapter: number;
  learningObjectivesPerSection: number;
}

export interface ProviderPricing {
  provider: string;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
}

export interface CostEstimate {
  estimatedTotalInputTokens: number;
  estimatedTotalOutputTokens: number;
  estimatedCostUSD: number;
  estimatedTimeSeconds: number;
  totalAICalls: number;
  provider: string;
  breakdown: {
    stage1: { calls: number; inputTokens: number; outputTokens: number };
    stage2: { calls: number; inputTokens: number; outputTokens: number };
    stage3: { calls: number; inputTokens: number; outputTokens: number };
    retryOverheadPercent: number;
  };
}

// ============================================================================
// Constants (derived from actual pipeline behavior)
// ============================================================================

/** Base tokens per Stage 1 (chapter generation) call */
const STAGE1_BASE_INPUT = 2000;
const STAGE1_BASE_OUTPUT = 2000;

/** Base tokens per Stage 2 (section generation) call */
const STAGE2_BASE_INPUT = 1500;
const STAGE2_BASE_OUTPUT = 1500;

/** Base tokens per Stage 3 (detail generation) call */
const STAGE3_BASE_INPUT = 2000;
const STAGE3_BASE_OUTPUT = 3000;

/** Context grows ~15% per subsequent chapter (accumulating previous chapter data) */
const CONTEXT_GROWTH_RATE = 0.15;

/** Difficulty multiplier for more complex prompts */
const DIFFICULTY_MULTIPLIERS: Record<string, number> = {
  beginner: 1.0,
  intermediate: 1.1,
  advanced: 1.2,
  expert: 1.3,
};

/** Retry overhead — quality gates retry ~30% of calls on average */
const RETRY_OVERHEAD_PERCENT = 30;

/** Average time per AI call in seconds (includes network, parsing, saving) */
const SECONDS_PER_AI_CALL = 20;

// ============================================================================
// Estimator
// ============================================================================

/**
 * Estimate the cost, tokens, and time for a course creation run.
 *
 * @param input - Course structure parameters
 * @param pricing - Provider pricing (per 1M tokens, USD)
 * @returns Cost estimate with breakdown
 */
/**
 * Stage 3 output token multipliers per template section role.
 * Sections with more complex content (FORMALIZATION, WALKTHROUGH, PRACTICE)
 * produce more output tokens; simpler sections (SUMMARY, CHECKPOINT) produce fewer.
 */
const STAGE3_SECTION_TOKEN_MULTIPLIERS: Record<string, number> = {
  // Beginner roles
  HOOK: 0.7,
  INTUITION: 0.8,
  FORMALIZATION: 1.2,
  WALKTHROUGH: 1.2,
  PLAYGROUND: 1.1,
  PITFALLS: 0.9,
  SUMMARY: 0.6,
  CHECKPOINT: 0.7,
  // Intermediate roles
  PROVOCATION: 0.8,
  INTUITION_ENGINE: 1.0,
  DERIVATION: 1.4,
  LABORATORY: 1.3,
  DEPTH_DIVE: 1.0,
  SYNTHESIS: 0.7,
  // Advanced roles
  OPEN_QUESTION: 0.8,
  FIRST_PRINCIPLES: 1.4,
  ANALYSIS: 1.2,
  DESIGN_STUDIO: 1.5,
  FRONTIER: 0.9,
  // Legacy roles (backward compatibility)
  VISUALIZATION: 0.7,
  PRACTICE: 1.3,
  CONNECTION: 0.7,
};

export function estimateCourseCost(
  input: CostEstimateInput,
  pricing: ProviderPricing
): CostEstimate {
  const {
    totalChapters,
    difficulty,
    bloomsFocusCount,
    learningObjectivesPerChapter,
    learningObjectivesPerSection,
  } = input;

  // Resolve template — difficulty determines the template and section count
  const template = getTemplateForDifficulty(difficulty);
  const effectiveSectionsPerChapter = template.totalSections;

  const diffMultiplier = DIFFICULTY_MULTIPLIERS[difficulty.toLowerCase()] ?? 1.1;

  // Bloom's focus adds ~5% per additional level (beyond base of 2)
  const bloomsMultiplier = 1 + Math.max(0, bloomsFocusCount - 2) * 0.05;

  // Learning objectives add slight overhead
  const objectiveMultiplier = 1 + (learningObjectivesPerChapter - 3) * 0.02
    + (learningObjectivesPerSection - 2) * 0.01;

  const combined = diffMultiplier * bloomsMultiplier * Math.max(1, objectiveMultiplier);

  // Stage 1: One call per chapter, context grows with each subsequent chapter
  let stage1Input = 0;
  let stage1Output = 0;
  for (let ch = 0; ch < totalChapters; ch++) {
    const contextScale = 1 + CONTEXT_GROWTH_RATE * ch;
    stage1Input += Math.round(STAGE1_BASE_INPUT * contextScale * combined);
    stage1Output += Math.round(STAGE1_BASE_OUTPUT * combined);
  }

  // Stage 2: effectiveSectionsPerChapter calls per chapter
  const totalSections = totalChapters * effectiveSectionsPerChapter;
  let stage2Input = 0;
  let stage2Output = 0;
  for (let ch = 0; ch < totalChapters; ch++) {
    const contextScale = 1 + CONTEXT_GROWTH_RATE * ch;
    for (let sec = 0; sec < effectiveSectionsPerChapter; sec++) {
      stage2Input += Math.round(STAGE2_BASE_INPUT * contextScale * combined);
      stage2Output += Math.round(STAGE2_BASE_OUTPUT * combined);
    }
  }

  // Stage 3: One call per section — token output varies by section type
  let stage3Input = 0;
  let stage3Output = 0;
  for (let ch = 0; ch < totalChapters; ch++) {
    const contextScale = 1 + CONTEXT_GROWTH_RATE * ch;
    for (let sec = 0; sec < effectiveSectionsPerChapter; sec++) {
      const sectionRole = template.sections[sec]?.role ?? 'HOOK';
      const tokenMultiplier = STAGE3_SECTION_TOKEN_MULTIPLIERS[sectionRole] ?? 1.0;
      stage3Input += Math.round(STAGE3_BASE_INPUT * contextScale * combined);
      stage3Output += Math.round(STAGE3_BASE_OUTPUT * tokenMultiplier * combined);
    }
  }

  // Totals before retry overhead
  const baseInputTokens = stage1Input + stage2Input + stage3Input;
  const baseOutputTokens = stage1Output + stage2Output + stage3Output;

  // Apply retry overhead
  const retryFactor = 1 + RETRY_OVERHEAD_PERCENT / 100;
  const totalInputTokens = Math.round(baseInputTokens * retryFactor);
  const totalOutputTokens = Math.round(baseOutputTokens * retryFactor);

  // Cost calculation
  const inputCost = (totalInputTokens / 1_000_000) * pricing.inputPricePerMillion;
  const outputCost = (totalOutputTokens / 1_000_000) * pricing.outputPricePerMillion;
  const totalCost = Math.round((inputCost + outputCost) * 100) / 100;

  // Time calculation: stage1 + stage2 + stage3
  const baseCalls = totalChapters + totalSections + totalSections;
  const totalCalls = Math.round(baseCalls * retryFactor);
  const totalTimeSeconds = totalCalls * SECONDS_PER_AI_CALL;

  return {
    estimatedTotalInputTokens: totalInputTokens,
    estimatedTotalOutputTokens: totalOutputTokens,
    estimatedCostUSD: totalCost,
    estimatedTimeSeconds: totalTimeSeconds,
    totalAICalls: totalCalls,
    provider: pricing.provider,
    breakdown: {
      stage1: { calls: totalChapters, inputTokens: stage1Input, outputTokens: stage1Output },
      stage2: { calls: totalSections, inputTokens: stage2Input, outputTokens: stage2Output },
      stage3: { calls: totalSections, inputTokens: stage3Input, outputTokens: stage3Output },
      retryOverheadPercent: RETRY_OVERHEAD_PERCENT,
    },
  };
}

/**
 * Format seconds into a human-readable time string.
 */
export function formatEstimatedTime(seconds: number): string {
  if (seconds < 60) return `~${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `~${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `~${hours}h ${remainingMinutes}m` : `~${hours}h`;
}
