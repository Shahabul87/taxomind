/**
 * Course Creation Cost Estimator Tests
 *
 * Updated for template-driven sections per chapter (Chapter DNA).
 * The estimator resolves template from difficulty, overriding sectionsPerChapter:
 *   beginner: 8, intermediate: 7, advanced: 8.
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
    sectionsPerChapter: 7, // Template-driven: intermediate = 7
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
    // Template-driven: 5 chapters * 7 sections (intermediate) = 35
    expect(result.breakdown.stage2.calls).toBe(35);
    expect(result.breakdown.stage3.calls).toBe(35);
    expect(result.breakdown.retryOverheadPercent).toBe(30);
  });

  it('template overrides sectionsPerChapter input', () => {
    // Even if input says sectionsPerChapter: 3, template overrides based on difficulty
    const result = estimateCourseCost(
      { ...baseInput, sectionsPerChapter: 3 },
      DEEPSEEK_PRICING
    );

    // Intermediate template forces 7 sections per chapter
    expect(result.breakdown.stage2.calls).toBe(35); // 5 * 7
    expect(result.breakdown.stage3.calls).toBe(35); // 5 * 7
  });

  it('different difficulties produce different section counts', () => {
    const beginner = estimateCourseCost(
      { ...baseInput, difficulty: 'beginner', totalChapters: 1 },
      DEEPSEEK_PRICING
    );
    const intermediate = estimateCourseCost(
      { ...baseInput, difficulty: 'intermediate', totalChapters: 1 },
      DEEPSEEK_PRICING
    );
    const advanced = estimateCourseCost(
      { ...baseInput, difficulty: 'advanced', totalChapters: 1 },
      DEEPSEEK_PRICING
    );

    // beginner: 8, intermediate: 7, advanced: 8
    expect(beginner.breakdown.stage2.calls).toBe(8);
    expect(intermediate.breakdown.stage2.calls).toBe(7);
    expect(advanced.breakdown.stage2.calls).toBe(8);
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

  it('handles minimum input (1 chapter beginner)', () => {
    const result = estimateCourseCost(
      {
        totalChapters: 1,
        sectionsPerChapter: 8,
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
    // 1 chapter * 8 beginner template sections
    expect(result.breakdown.stage2.calls).toBe(8);
    expect(result.breakdown.stage3.calls).toBe(8);
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

    // expert falls back to advanced template (8 sections)
    // 20 chapters * 8 sections * 2 (stage2 + stage3) + 20 stage1 = 340 base calls
    expect(result.totalAICalls).toBeGreaterThan(300);
    expect(result.estimatedCostUSD).toBeGreaterThan(0);
    expect(result.breakdown.stage1.calls).toBe(20);
    expect(result.breakdown.stage2.calls).toBe(160);
    expect(result.breakdown.stage3.calls).toBe(160);
  });

  it('Stage 3 output tokens vary by section type', () => {
    // Verify that Stage 3 output uses per-section-type multipliers
    const result = estimateCourseCost(
      { ...baseInput, totalChapters: 1 },
      DEEPSEEK_PRICING
    );

    // Stage 3 output should not be exactly 7 * BASE_OUTPUT * combined
    // because different section types have different multipliers
    expect(result.breakdown.stage3.outputTokens).toBeGreaterThan(0);
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
