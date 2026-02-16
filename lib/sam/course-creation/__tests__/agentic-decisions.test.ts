/**
 * Agentic Decisions — Runtime Behavior Tests
 *
 * Tests the pure, deterministic rule-based decision engine:
 * - evaluateChapterOutcome()
 * - analyzeQualityTrend()
 *
 * No AI mocking needed — these are pure functions.
 */

import {
  evaluateChapterOutcome,
  analyzeQualityTrend,
} from '../agentic-decisions';
import type {
  QualityScore,
  CompletedChapter,
  ConceptTracker,
  CourseBlueprintPlan,
  BloomsLevel,
} from '../types';

// ============================================================================
// Fixtures
// ============================================================================

function makeScore(overall: number): QualityScore {
  return {
    uniqueness: overall,
    specificity: overall,
    bloomsAlignment: overall,
    completeness: overall,
    depth: overall,
    overall,
  };
}

function makeChapter(position: number, overrides?: Partial<CompletedChapter>): CompletedChapter {
  return {
    id: `ch-${position}`,
    position,
    title: `Chapter ${position}`,
    description: `Description for chapter ${position}`,
    bloomsLevel: 'UNDERSTAND' as BloomsLevel,
    learningObjectives: ['Objective 1'],
    keyTopics: ['topic-a', 'topic-b'],
    sections: [],
    conceptsIntroduced: ['topic-a', 'topic-b'],
    ...overrides,
  } as CompletedChapter;
}

function makeBlueprint(chapterCount: number): CourseBlueprintPlan {
  return {
    chapterPlan: Array.from({ length: chapterCount }, (_, i) => ({
      position: i + 1,
      suggestedTitle: `Chapter ${i + 1}`,
      primaryFocus: `Focus ${i + 1}`,
      bloomsLevel: 'UNDERSTAND' as BloomsLevel,
      keyConcepts: [`concept-${i + 1}-a`, `concept-${i + 1}-b`],
      estimatedComplexity: 'medium' as const,
      rationale: `Rationale ${i + 1}`,
    })),
    conceptDependencies: [],
    bloomsStrategy: [],
    riskAreas: [],
    planConfidence: 80,
  };
}

function makeTracker(concepts: string[] = []): ConceptTracker {
  const map = new Map<string, { concept: string; introducedInChapter: number; bloomsLevel: BloomsLevel }>();
  for (const c of concepts) {
    map.set(c.toLowerCase(), { concept: c, introducedInChapter: 1, bloomsLevel: 'UNDERSTAND' as BloomsLevel });
  }
  return { concepts: map, vocabulary: [], skillsBuilt: [] };
}

// ============================================================================
// analyzeQualityTrend
// ============================================================================

describe('analyzeQualityTrend', () => {
  it('returns stable trend for empty scores', () => {
    const trend = analyzeQualityTrend([]);
    expect(trend.trend).toBe('stable');
    expect(trend.recentAverage).toBe(0);
    expect(trend.consecutiveLow).toBe(0);
  });

  it('detects declining trend when recent scores drop', () => {
    // Overall avg = 80, recent window avg = 50 → declining
    const scores = [makeScore(80), makeScore(85), makeScore(80), makeScore(50), makeScore(50), makeScore(50)];
    const trend = analyzeQualityTrend(scores);
    expect(trend.trend).toBe('declining');
    expect(trend.consecutiveLow).toBe(3);
  });

  it('detects improving trend when recent scores rise', () => {
    // Overall avg ≈ 67, recent window avg = 90 → improving
    const scores = [makeScore(50), makeScore(50), makeScore(50), makeScore(90), makeScore(90), makeScore(90)];
    const trend = analyzeQualityTrend(scores);
    expect(trend.trend).toBe('improving');
    expect(trend.consecutiveHigh).toBe(3);
  });

  it('counts consecutive high scores', () => {
    const scores = [makeScore(80), makeScore(85), makeScore(90)];
    const trend = analyzeQualityTrend(scores);
    expect(trend.consecutiveHigh).toBe(3);
    expect(trend.consecutiveLow).toBe(0);
  });
});

// ============================================================================
// evaluateChapterOutcome
// ============================================================================

describe('evaluateChapterOutcome', () => {
  it('returns continue action for scores above HIGH_QUALITY_THRESHOLD', () => {
    const chapter = makeChapter(1);
    const scores = [makeScore(80)];
    const blueprint = makeBlueprint(5);
    const tracker = makeTracker(['topic-a', 'topic-b']);

    const decision = evaluateChapterOutcome(chapter, scores, blueprint, tracker);
    expect(decision.action).toBe('continue');
    expect(decision.reasoning).toContain('successfully');
  });

  it('returns flag_for_review for scores below LOW_QUALITY_THRESHOLD', () => {
    const chapter = makeChapter(1);
    const scores = [makeScore(40)];
    const blueprint = makeBlueprint(5);
    const tracker = makeTracker(['topic-a']);

    const decision = evaluateChapterOutcome(chapter, scores, blueprint, tracker);
    expect(decision.action).toBe('flag_for_review');
    expect(decision.reasoning).toContain('flagged');
  });

  it('returns flag_for_review for 2+ consecutive low scores', () => {
    const chapter = makeChapter(3);
    const scores = [makeScore(50), makeScore(50)];
    const blueprint = makeBlueprint(5);
    const tracker = makeTracker(['topic-a']);

    const decision = evaluateChapterOutcome(chapter, scores, blueprint, tracker);
    expect(decision.action).toBe('flag_for_review');
    expect(decision.adjustments?.temperatureShift).toBe(-0.1);
  });

  it('returns adjust_strategy for declining quality trend', () => {
    const chapter = makeChapter(4);
    // Declining: overall avg ≈ 72, recent avg ≈ 60
    const scores = [makeScore(80), makeScore(80), makeScore(80), makeScore(60), makeScore(60), makeScore(60)];
    const blueprint = makeBlueprint(5);
    const tracker = makeTracker(['topic-a', 'topic-b']);

    const decision = evaluateChapterOutcome(chapter, scores, blueprint, tracker);
    expect(decision.action).toBe('adjust_strategy');
    expect(decision.reasoning).toContain('declining');
  });

  it('emphasizes missing concepts when coverage is low and trend is declining', () => {
    const chapter = makeChapter(4, { keyTopics: ['topic-a'], conceptsIntroduced: ['topic-a'] });
    // Declining trend: overall avg ≈ 72, recent avg ≈ 60 → triggers adjust_strategy
    const scores = [makeScore(80), makeScore(80), makeScore(80), makeScore(60), makeScore(60), makeScore(60)];
    // Blueprint has 3+ missing concepts per chapter entry
    const blueprint: CourseBlueprintPlan = {
      ...makeBlueprint(5),
      chapterPlan: Array.from({ length: 5 }, (_, i) => ({
        position: i + 1,
        suggestedTitle: `Chapter ${i + 1}`,
        primaryFocus: `Focus ${i + 1}`,
        bloomsLevel: 'UNDERSTAND' as BloomsLevel,
        keyConcepts: [`concept-${i + 1}-a`, `concept-${i + 1}-b`, `concept-${i + 1}-c`],
        estimatedComplexity: 'medium' as const,
        rationale: `Rationale ${i + 1}`,
      })),
    };
    // Tracker only has topic-a — many concepts are missing
    const tracker = makeTracker(['topic-a']);

    const decision = evaluateChapterOutcome(chapter, scores, blueprint, tracker);
    expect(decision.action).toBe('adjust_strategy');
    expect(decision.adjustments?.conceptsToEmphasize).toBeDefined();
    expect(decision.adjustments!.conceptsToEmphasize!.length).toBeGreaterThan(0);
  });

  it('includes temperature shift in flag_for_review adjustments', () => {
    const chapter = makeChapter(1);
    const scores = [makeScore(30)];
    const blueprint = makeBlueprint(5);
    const tracker = makeTracker([]);

    const decision = evaluateChapterOutcome(chapter, scores, blueprint, tracker);
    expect(decision.action).toBe('flag_for_review');
    expect(decision.adjustments?.temperatureShift).toBeDefined();
  });
});
