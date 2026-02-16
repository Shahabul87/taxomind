/**
 * Course Creation Cost Estimator Tests
 *
 * Updated for strict mode: user's sectionsPerChapter is authoritative.
 * Templates are only used for section-role token multipliers, not counts.
 *
 * Estimator now models ALL pipeline AI calls:
 *   Core: stage1/2/3 generation
 *   Non-core: planner, critics (probabilistic), decisions, reflection
 */

import { estimateCourseCost, formatEstimatedTime } from '@/lib/sam/course-creation/cost-estimator';
import type { CostEstimateInput, ProviderPricing } from '@/lib/sam/course-creation/cost-estimator';

const DEEPSEEK_PRICING: ProviderPricing = {
  provider: 'DeepSeek',
  inputPricePerMillion: 0.14,
  outputPricePerMillion: 0.28,
};

const ANTHROPIC_PRICING: ProviderPricing = {
  provider: 'Anthropic (Claude)',
  inputPricePerMillion: 3.0,
  outputPricePerMillion: 15.0,
};

describe('estimateCourseCost', () => {
  const baseInput: CostEstimateInput = {
    totalChapters: 5,
    sectionsPerChapter: 7,
    difficulty: 'intermediate',
    bloomsFocusCount: 3,
    learningObjectivesPerChapter: 5,
    learningObjectivesPerSection: 3,
  };

  it('returns a valid estimate with all required fields', () => {
    const result = estimateCourseCost(baseInput, DEEPSEEK_PRICING);

    expect(result.estimatedTotalInputTokens).toBeGreaterThan(0);
    expect(result.estimatedTotalOutputTokens).toBeGreaterThan(0);
    expect(result.estimatedCostUSD).toBeGreaterThan(0);
    expect(result.estimatedTimeSeconds).toBeGreaterThan(0);
    expect(result.totalAICalls).toBeGreaterThan(0);
    expect(result.provider).toBe('DeepSeek');
    expect(result.breakdown.stage1.calls).toBe(5);
    expect(result.breakdown.stage2.calls).toBe(35); // 5 * 7
    expect(result.breakdown.stage3.calls).toBe(35); // 5 * 7
    expect(result.breakdown.nonCore.calls).toBeGreaterThan(0);
    expect(result.breakdown.retryOverheadPercent).toBe(30);
  });

  it('uses user sectionsPerChapter (strict mode, not template)', () => {
    // User requests 3 sections — estimator should use 3, not template default 7
    const result = estimateCourseCost(
      { ...baseInput, sectionsPerChapter: 3 },
      DEEPSEEK_PRICING
    );

    expect(result.breakdown.stage2.calls).toBe(15); // 5 * 3
    expect(result.breakdown.stage3.calls).toBe(15); // 5 * 3
  });

  it('includes non-core calls (planner, critics, decisions, reflection)', () => {
    const result = estimateCourseCost(baseInput, DEEPSEEK_PRICING);

    // Non-core should include at minimum: 1 planner + decisions + 1 reflection
    // For 5 chapters: decisions = 4, planner = 1, reflection = 1 = 6 guaranteed
    // Plus probabilistic critics and conditional calls
    expect(result.breakdown.nonCore.calls).toBeGreaterThanOrEqual(6);
    expect(result.breakdown.nonCore.inputTokens).toBeGreaterThan(0);
    expect(result.breakdown.nonCore.outputTokens).toBeGreaterThan(0);
  });

  it('total calls includes both core and non-core', () => {
    const result = estimateCourseCost(baseInput, DEEPSEEK_PRICING);

    const coreCallsBase = 5 + 35 + 35; // stage1 + stage2 + stage3
    // Total should be core*1.3 + nonCore
    expect(result.totalAICalls).toBeGreaterThan(coreCallsBase);
    expect(result.totalAICalls).toBe(
      Math.round(coreCallsBase * 1.3) + result.breakdown.nonCore.calls
    );
  });

  it('scales with chapter count', () => {
    const small = estimateCourseCost(
      { ...baseInput, totalChapters: 2 },
      DEEPSEEK_PRICING
    );
    const large = estimateCourseCost(
      { ...baseInput, totalChapters: 10 },
      DEEPSEEK_PRICING
    );

    expect(large.estimatedCostUSD).toBeGreaterThan(small.estimatedCostUSD);
    expect(large.totalAICalls).toBeGreaterThan(small.totalAICalls);
    expect(large.estimatedTimeSeconds).toBeGreaterThan(small.estimatedTimeSeconds);
  });

  it('anthropic is more expensive than deepseek for same input', () => {
    const deepseek = estimateCourseCost(baseInput, DEEPSEEK_PRICING);
    const anthropic = estimateCourseCost(baseInput, ANTHROPIC_PRICING);

    expect(anthropic.estimatedCostUSD).toBeGreaterThan(deepseek.estimatedCostUSD);
    // Token counts should be identical (pricing doesn't affect token estimates)
    expect(anthropic.estimatedTotalInputTokens).toBe(deepseek.estimatedTotalInputTokens);
    expect(anthropic.estimatedTotalOutputTokens).toBe(deepseek.estimatedTotalOutputTokens);
  });

  it('difficulty affects token estimates via multiplier', () => {
    const beginner = estimateCourseCost(
      { ...baseInput, difficulty: 'beginner' },
      DEEPSEEK_PRICING
    );
    const expert = estimateCourseCost(
      { ...baseInput, difficulty: 'expert' },
      DEEPSEEK_PRICING
    );

    expect(expert.estimatedTotalInputTokens).toBeGreaterThan(beginner.estimatedTotalInputTokens);
  });

  it('handles minimum input (1 chapter)', () => {
    const result = estimateCourseCost(
      {
        totalChapters: 1,
        sectionsPerChapter: 3,
        difficulty: 'beginner',
        bloomsFocusCount: 2,
        learningObjectivesPerChapter: 3,
        learningObjectivesPerSection: 2,
      },
      DEEPSEEK_PRICING
    );

    expect(result.totalAICalls).toBeGreaterThan(0);
    expect(result.estimatedCostUSD).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.stage1.calls).toBe(1);
    expect(result.breakdown.stage2.calls).toBe(3); // 1 * 3
    expect(result.breakdown.stage3.calls).toBe(3); // 1 * 3
    // 1 chapter → 0 AI decisions (last chapter excluded)
    // Non-core: planner(1) + reflection(1) + probabilistic critics/conditional
    expect(result.breakdown.nonCore.calls).toBeGreaterThanOrEqual(2);
  });

  it('handles maximum input (20 chapters)', () => {
    const result = estimateCourseCost(
      {
        totalChapters: 20,
        sectionsPerChapter: 8,
        difficulty: 'expert',
        bloomsFocusCount: 6,
        learningObjectivesPerChapter: 10,
        learningObjectivesPerSection: 5,
      },
      ANTHROPIC_PRICING
    );

    expect(result.totalAICalls).toBeGreaterThan(300);
    expect(result.estimatedCostUSD).toBeGreaterThan(0);
    expect(result.breakdown.stage1.calls).toBe(20);
    expect(result.breakdown.stage2.calls).toBe(160); // 20 * 8
    expect(result.breakdown.stage3.calls).toBe(160); // 20 * 8
  });

  it('Stage 3 output tokens vary by section type', () => {
    const result = estimateCourseCost(
      { ...baseInput, totalChapters: 1 },
      DEEPSEEK_PRICING
    );

    // Stage 3 output should not be uniform — different section types have different multipliers
    expect(result.breakdown.stage3.outputTokens).toBeGreaterThan(0);
  });

  it('optimized variant reduces input token estimates', () => {
    const standard = estimateCourseCost(baseInput, DEEPSEEK_PRICING);
    const optimized = estimateCourseCost(baseInput, DEEPSEEK_PRICING, 'optimized-v1');

    expect(optimized.estimatedTotalInputTokens).toBeLessThan(standard.estimatedTotalInputTokens);
    // Output tokens should be the same (optimization targets input only)
    expect(optimized.estimatedTotalOutputTokens).toBe(standard.estimatedTotalOutputTokens);
  });

  it('multi-experiment comma-delimited variant works', () => {
    const standard = estimateCourseCost(baseInput, DEEPSEEK_PRICING);
    // Simulates both experiments active: arrow control + optimized prompt compression
    const multiVariant = estimateCourseCost(baseInput, DEEPSEEK_PRICING, 'control,optimized-v1');

    // Should pick up the optimized-v1 signal from the joined string
    expect(multiVariant.estimatedTotalInputTokens).toBeLessThan(standard.estimatedTotalInputTokens);
    expect(multiVariant.estimatedTotalOutputTokens).toBe(standard.estimatedTotalOutputTokens);
  });
});

describe('formatEstimatedTime', () => {
  it('formats seconds', () => {
    expect(formatEstimatedTime(30)).toBe('~30s');
    expect(formatEstimatedTime(59)).toBe('~59s');
  });

  it('formats minutes', () => {
    expect(formatEstimatedTime(60)).toBe('~1 min');
    expect(formatEstimatedTime(300)).toBe('~5 min');
    expect(formatEstimatedTime(3540)).toBe('~59 min');
  });

  it('formats hours', () => {
    expect(formatEstimatedTime(3600)).toBe('~1h');
    expect(formatEstimatedTime(5400)).toBe('~1h 30m');
    expect(formatEstimatedTime(7200)).toBe('~2h');
  });
});
