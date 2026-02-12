/**
 * Course Creation Cost Estimator Tests
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
    sectionsPerChapter: 4,
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
    expect(result.breakdown.stage2.calls).toBe(20);
    expect(result.breakdown.stage3.calls).toBe(20);
    expect(result.breakdown.retryOverheadPercent).toBe(30);
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

  it('scales with sections per chapter', () => {
    const few = estimateCourseCost(
      { ...baseInput, sectionsPerChapter: 2 },
      DEEPSEEK_PRICING
    );
    const many = estimateCourseCost(
      { ...baseInput, sectionsPerChapter: 8 },
      DEEPSEEK_PRICING
    );

    expect(many.estimatedCostUSD).toBeGreaterThan(few.estimatedCostUSD);
    expect(many.totalAICalls).toBeGreaterThan(few.totalAICalls);
  });

  it('anthropic is more expensive than deepseek for same input', () => {
    const deepseek = estimateCourseCost(baseInput, DEEPSEEK_PRICING);
    const anthropic = estimateCourseCost(baseInput, ANTHROPIC_PRICING);

    expect(anthropic.estimatedCostUSD).toBeGreaterThan(deepseek.estimatedCostUSD);
    // Token counts should be identical (pricing doesn't affect token estimates)
    expect(anthropic.estimatedTotalInputTokens).toBe(deepseek.estimatedTotalInputTokens);
    expect(anthropic.estimatedTotalOutputTokens).toBe(deepseek.estimatedTotalOutputTokens);
  });

  it('difficulty affects token estimates', () => {
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

  it('handles minimum input (1 chapter, 1 section)', () => {
    const result = estimateCourseCost(
      {
        totalChapters: 1,
        sectionsPerChapter: 1,
        difficulty: 'beginner',
        bloomsFocusCount: 2,
        learningObjectivesPerChapter: 3,
        learningObjectivesPerSection: 2,
      },
      DEEPSEEK_PRICING
    );

    expect(result.totalAICalls).toBeGreaterThan(0);
    // DeepSeek is so cheap that 1ch/1sec rounds to $0.00 — just verify non-negative
    expect(result.estimatedCostUSD).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.stage1.calls).toBe(1);
    expect(result.breakdown.stage2.calls).toBe(1);
    expect(result.breakdown.stage3.calls).toBe(1);
  });

  it('handles maximum input (20 chapters, 10 sections)', () => {
    const result = estimateCourseCost(
      {
        totalChapters: 20,
        sectionsPerChapter: 10,
        difficulty: 'expert',
        bloomsFocusCount: 6,
        learningObjectivesPerChapter: 10,
        learningObjectivesPerSection: 5,
      },
      ANTHROPIC_PRICING
    );

    expect(result.totalAICalls).toBeGreaterThan(200);
    expect(result.estimatedCostUSD).toBeGreaterThan(0);
    expect(result.breakdown.stage1.calls).toBe(20);
    expect(result.breakdown.stage2.calls).toBe(200);
    expect(result.breakdown.stage3.calls).toBe(200);
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
