/**
 * Step API Utilities — Unit Tests
 *
 * Tests for shared utilities: extractJSON, Zod response schemas,
 * scoring functions, and safety check wrapper.
 */

import {
  extractJSON,
  TitleWithScoreSchema,
  TitleAIResponseSchema,
  TitleLegacyResponseSchema,
  OverviewWithScoreSchema,
  OverviewAIResponseSchema,
  OverviewLegacyResponseSchema,
  LearningObjectiveItemSchema,
  ObjectivesAIResponseSchema,
  computeAverageScore,
  scoreObjectives,
} from '../step-api-utils';

// ============================================================================
// extractJSON
// ============================================================================

describe('extractJSON', () => {
  it('extracts plain JSON object', () => {
    const input = '{"title": "test"}';
    expect(JSON.parse(extractJSON(input))).toEqual({ title: 'test' });
  });

  it('strips markdown code fences', () => {
    const input = '```json\n{"title": "test"}\n```';
    expect(JSON.parse(extractJSON(input))).toEqual({ title: 'test' });
  });

  it('strips <think> blocks from reasoning models', () => {
    const input = '<think>Let me reason about this...</think>{"title": "test"}';
    expect(JSON.parse(extractJSON(input))).toEqual({ title: 'test' });
  });

  it('strips both <think> and code fences', () => {
    const input = '<think>reasoning</think>\n```json\n{"items":[1,2]}\n```\nExtra text';
    const parsed = JSON.parse(extractJSON(input));
    expect(parsed).toEqual({ items: [1, 2] });
  });

  it('extracts JSON array when no object found', () => {
    const input = 'Here are the results: [1, 2, 3]';
    expect(JSON.parse(extractJSON(input))).toEqual([1, 2, 3]);
  });

  it('handles deeply nested JSON', () => {
    const input = '{"a":{"b":{"c":[1,2]}}}';
    const parsed = JSON.parse(extractJSON(input));
    expect(parsed.a.b.c).toEqual([1, 2]);
  });

  it('returns trimmed input when no JSON found', () => {
    expect(extractJSON('  no json here  ')).toBe('no json here');
  });

  it('handles multi-line <think> blocks', () => {
    const input = '<think>\nLet me think step by step.\n1. First\n2. Second\n</think>\n{"result": true}';
    expect(JSON.parse(extractJSON(input))).toEqual({ result: true });
  });
});

// ============================================================================
// TitleWithScoreSchema
// ============================================================================

describe('TitleWithScoreSchema', () => {
  it('parses valid scored title', () => {
    const input = {
      title: 'Master React Hooks',
      marketingScore: 85,
      brandingScore: 80,
      salesScore: 78,
      overallScore: 81,
      reasoning: 'Good hook-based title',
    };
    const result = TitleWithScoreSchema.parse(input);
    expect(result.title).toBe('Master React Hooks');
    expect(result.overallScore).toBe(81);
  });

  it('computes overallScore when missing', () => {
    const input = {
      title: 'Learn TypeScript',
      marketingScore: 90,
      brandingScore: 84,
      salesScore: 78,
    };
    const result = TitleWithScoreSchema.parse(input);
    expect(result.overallScore).toBe(84); // Math.round((90+84+78)/3) = 84
  });

  it('coerces string scores to numbers', () => {
    const input = {
      title: 'Python Bootcamp',
      marketingScore: '85',
      brandingScore: '80',
      salesScore: '75',
    };
    const result = TitleWithScoreSchema.parse(input);
    expect(result.marketingScore).toBe(85);
    expect(result.brandingScore).toBe(80);
    expect(result.salesScore).toBe(75);
  });

  it('uses catch default for non-coercible scores', () => {
    // z.coerce.number() converts null→0, undefined→NaN (caught→75), "invalid"→NaN (caught→75)
    const input = {
      title: 'Test Title',
      marketingScore: 'invalid',
      brandingScore: null,
      salesScore: undefined,
    };
    const result = TitleWithScoreSchema.parse(input);
    expect(result.marketingScore).toBe(75); // NaN caught → 75
    expect(result.brandingScore).toBe(0);   // null coerces to 0
    expect(result.salesScore).toBe(75);     // undefined → NaN caught → 75
  });

  it('uses default reasoning when missing', () => {
    const input = { title: 'Test', marketingScore: 80, brandingScore: 80, salesScore: 80 };
    const result = TitleWithScoreSchema.parse(input);
    expect(result.reasoning).toBe('AI-generated title optimized for the target audience.');
  });

  it('rejects empty title', () => {
    const result = TitleWithScoreSchema.safeParse({ title: '', marketingScore: 80 });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// TitleAIResponseSchema
// ============================================================================

describe('TitleAIResponseSchema', () => {
  it('parses valid response with scored titles', () => {
    const input = {
      scoredTitles: [
        { title: 'Title 1', marketingScore: 85, brandingScore: 80, salesScore: 78 },
        { title: 'Title 2', marketingScore: 90, brandingScore: 82, salesScore: 84 },
      ],
      suggestions: { message: 'Strategy', reasoning: 'Why these work' },
    };
    const result = TitleAIResponseSchema.parse(input);
    expect(result.scoredTitles).toHaveLength(2);
    expect(result.suggestions?.message).toBe('Strategy');
  });

  it('rejects empty scoredTitles array', () => {
    const result = TitleAIResponseSchema.safeParse({ scoredTitles: [] });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// TitleLegacyResponseSchema
// ============================================================================

describe('TitleLegacyResponseSchema', () => {
  it('parses legacy title array format', () => {
    const input = {
      titles: ['Title A', 'Title B'],
      suggestions: { message: 'Tips', reasoning: 'Because' },
    };
    const result = TitleLegacyResponseSchema.parse(input);
    expect(result.titles).toHaveLength(2);
  });

  it('rejects empty titles array', () => {
    const result = TitleLegacyResponseSchema.safeParse({ titles: [] });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// OverviewWithScoreSchema
// ============================================================================

describe('OverviewWithScoreSchema', () => {
  it('parses valid scored overview', () => {
    const input = {
      overview: 'A comprehensive course on React...',
      relevanceScore: 88,
      clarityScore: 85,
      engagementScore: 80,
      overallScore: 84,
      reasoning: 'Strong engagement hook',
    };
    const result = OverviewWithScoreSchema.parse(input);
    expect(result.overallScore).toBe(84);
  });

  it('computes overallScore when missing', () => {
    const input = {
      overview: 'Learn Python from scratch...',
      relevanceScore: 90,
      clarityScore: 84,
      engagementScore: 78,
    };
    const result = OverviewWithScoreSchema.parse(input);
    expect(result.overallScore).toBe(84); // Math.round((90+84+78)/3) = 84
  });
});

// ============================================================================
// OverviewAIResponseSchema / OverviewLegacyResponseSchema
// ============================================================================

describe('OverviewAIResponseSchema', () => {
  it('parses valid response with scored overviews', () => {
    const input = {
      scoredOverviews: [
        { overview: 'Overview text', relevanceScore: 80, clarityScore: 80, engagementScore: 80 },
      ],
      reasoning: 'Different angles',
    };
    const result = OverviewAIResponseSchema.parse(input);
    expect(result.scoredOverviews).toHaveLength(1);
  });
});

describe('OverviewLegacyResponseSchema', () => {
  it('parses legacy suggestions array format', () => {
    const input = {
      suggestions: ['Overview A', 'Overview B'],
      reasoning: 'Variety of angles',
    };
    const result = OverviewLegacyResponseSchema.parse(input);
    expect(result.suggestions).toHaveLength(2);
  });
});

// ============================================================================
// LearningObjectiveItemSchema / ObjectivesAIResponseSchema
// ============================================================================

describe('LearningObjectiveItemSchema', () => {
  it('parses valid objective with all fields', () => {
    const input = {
      objective: 'Analyze code complexity using Big-O notation',
      bloomsLevel: 'ANALYZE',
      actionVerb: 'Analyze',
    };
    const result = LearningObjectiveItemSchema.parse(input);
    expect(result.bloomsLevel).toBe('ANALYZE');
    expect(result.actionVerb).toBe('Analyze');
  });

  it('extracts actionVerb from objective when missing', () => {
    const input = {
      objective: 'Evaluate different sorting algorithms',
      bloomsLevel: 'EVALUATE',
    };
    const result = LearningObjectiveItemSchema.parse(input);
    expect(result.actionVerb).toBe('Evaluate');
  });

  it('defaults bloomsLevel to UNDERSTAND when invalid', () => {
    const input = {
      objective: 'Learn the basics',
      bloomsLevel: undefined,
    };
    const result = LearningObjectiveItemSchema.parse(input);
    expect(result.bloomsLevel).toBe('UNDERSTAND');
  });
});

describe('ObjectivesAIResponseSchema', () => {
  it('parses valid objectives array', () => {
    const input = {
      objectives: [
        { objective: 'Identify key concepts', bloomsLevel: 'REMEMBER', actionVerb: 'Identify' },
        { objective: 'Explain the process', bloomsLevel: 'UNDERSTAND', actionVerb: 'Explain' },
      ],
    };
    const result = ObjectivesAIResponseSchema.parse(input);
    expect(result.objectives).toHaveLength(2);
  });

  it('rejects empty objectives array', () => {
    const result = ObjectivesAIResponseSchema.safeParse({ objectives: [] });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// computeAverageScore
// ============================================================================

describe('computeAverageScore', () => {
  it('computes average of overallScores', () => {
    const items = [
      { overallScore: 80 },
      { overallScore: 90 },
      { overallScore: 70 },
    ];
    expect(computeAverageScore(items)).toBe(80);
  });

  it('returns 0 for empty array', () => {
    expect(computeAverageScore([])).toBe(0);
  });

  it('rounds to nearest integer', () => {
    const items = [{ overallScore: 81 }, { overallScore: 82 }];
    expect(computeAverageScore(items)).toBe(82); // Math.round(81.5) = 82
  });
});

// ============================================================================
// scoreObjectives
// ============================================================================

describe('scoreObjectives', () => {
  it('returns 0 for empty array', () => {
    expect(scoreObjectives([], 5)).toBe(0);
  });

  it('scores well for diverse Bloom&apos;s levels and correct count', () => {
    const objectives = [
      { objective: 'Identify key concepts in machine learning algorithms', bloomsLevel: 'REMEMBER', actionVerb: 'Identify' },
      { objective: 'Explain the fundamental principles of neural networks', bloomsLevel: 'UNDERSTAND', actionVerb: 'Explain' },
      { objective: 'Apply gradient descent to optimize model parameters', bloomsLevel: 'APPLY', actionVerb: 'Apply' },
      { objective: 'Analyze feature importance using statistical methods', bloomsLevel: 'ANALYZE', actionVerb: 'Analyze' },
      { objective: 'Evaluate model performance using cross-validation metrics', bloomsLevel: 'EVALUATE', actionVerb: 'Evaluate' },
    ];
    const score = scoreObjectives(objectives, 5);
    expect(score).toBeGreaterThanOrEqual(80);
  });

  it('penalizes when count is below requested', () => {
    const objectives = [
      { objective: 'Identify key concepts in the subject area', bloomsLevel: 'REMEMBER', actionVerb: 'Identify' },
      { objective: 'Explain the fundamental principles of the topic', bloomsLevel: 'UNDERSTAND', actionVerb: 'Explain' },
    ];
    const score5 = scoreObjectives(objectives, 5);
    const score2 = scoreObjectives(objectives, 2);
    expect(score2).toBeGreaterThan(score5);
  });

  it('penalizes vague objectives (under 30 chars)', () => {
    const objectives = [
      { objective: 'Learn basics', bloomsLevel: 'REMEMBER', actionVerb: 'Learn' },
      { objective: 'Explain the fundamental principles and core concepts', bloomsLevel: 'UNDERSTAND', actionVerb: 'Explain' },
    ];
    const score = scoreObjectives(objectives, 2);
    // Score should be reduced due to vague objective
    expect(score).toBeLessThan(85);
  });

  it('clamps score between 0 and 100', () => {
    // Many diverse objectives should not exceed 100
    const objectives = Array.from({ length: 6 }, (_, i) => ({
      objective: `Objective ${i} with enough detail to be specific and measurable`,
      bloomsLevel: ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'][i],
      actionVerb: ['Identify', 'Explain', 'Apply', 'Analyze', 'Evaluate', 'Create'][i],
    }));
    const score = scoreObjectives(objectives, 6);
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});
