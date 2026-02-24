/**
 * Course Planner — Unit Tests
 *
 * Tests planCourseBlueprint(), buildBlueprintBlock(), and replanRemainingChapters()
 * from the course-planner module.
 *
 * Requires mocking server-only, ai-provider, helpers, and logger.
 */

// Mock server-only before any imports
jest.mock('server-only', () => ({}));

// Mock AI provider
jest.mock('@/lib/sam/ai-provider', () => ({
  runSAMChatWithPreference: jest.fn(),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import {
  planCourseBlueprint,
  buildBlueprintBlock,
  replanRemainingChapters,
} from '../course-planner';
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import {
  CourseContext,
  CourseBlueprintPlan,
  ChapterPlanEntry,
  BloomsLevel,
  CompletedChapter,
  ConceptTracker,
} from '../types';
import { logger } from '@/lib/logger';

// ============================================================================
// Fixtures
// ============================================================================

const mockRunSAM = runSAMChatWithPreference as jest.MockedFunction<
  typeof runSAMChatWithPreference
>;

function makeCourseContext(overrides: Partial<CourseContext> = {}): CourseContext {
  return {
    courseTitle: 'React Fundamentals',
    courseDescription: 'Learn React from scratch',
    courseCategory: 'programming',
    targetAudience: 'web developers',
    difficulty: 'intermediate',
    totalChapters: 5,
    sectionsPerChapter: 4,
    bloomsFocus: [],
    learningObjectivesPerChapter: 3,
    learningObjectivesPerSection: 2,
    courseLearningObjectives: [
      'Build React components',
      'Manage state with hooks',
      'Handle side effects',
    ],
    ...overrides,
  };
}

function makeValidBlueprintJSON(totalChapters = 5): string {
  const chapterPlan = Array.from({ length: totalChapters }, (_, i) => ({
    position: i + 1,
    suggestedTitle: `Chapter ${i + 1}: Topic ${i + 1}`,
    primaryFocus: `Focus area for chapter ${i + 1}`,
    bloomsLevel: (['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE'] as BloomsLevel[])[
      i % 5
    ],
    keyConcepts: [`concept-${i + 1}-a`, `concept-${i + 1}-b`],
    estimatedComplexity: 'medium' as const,
    rationale: `Chapter ${i + 1} rationale for placement`,
    recommendedSections: 7,
  }));

  return JSON.stringify({
    chapterPlan,
    conceptDependencies: [
      { concept: 'concept-2-a', dependsOn: ['concept-1-a'] },
      { concept: 'concept-3-a', dependsOn: ['concept-2-a', 'concept-1-b'] },
    ],
    bloomsStrategy: [
      { level: 'REMEMBER', chapters: [1] },
      { level: 'UNDERSTAND', chapters: [2] },
      { level: 'APPLY', chapters: [3] },
    ],
    riskAreas: [
      'Chapter 3 involves complex state management that may overwhelm beginners',
      'Chapter 5 concept-5-a requires strong understanding of concept-3-a',
    ],
    planConfidence: 85,
  });
}

function makeBlueprint(overrides: Partial<CourseBlueprintPlan> = {}): CourseBlueprintPlan {
  return {
    chapterPlan: [
      {
        position: 1,
        suggestedTitle: 'Getting Started with React',
        primaryFocus: 'JSX and Components',
        bloomsLevel: 'REMEMBER',
        keyConcepts: ['JSX', 'components', 'props'],
        estimatedComplexity: 'low',
        rationale: 'Foundation chapter',
      },
      {
        position: 2,
        suggestedTitle: 'State Management',
        primaryFocus: 'useState and state patterns',
        bloomsLevel: 'UNDERSTAND',
        keyConcepts: ['state', 'useState', 'immutability'],
        estimatedComplexity: 'medium',
        rationale: 'Builds on components knowledge',
      },
      {
        position: 3,
        suggestedTitle: 'Side Effects',
        primaryFocus: 'useEffect and lifecycle',
        bloomsLevel: 'APPLY',
        keyConcepts: ['useEffect', 'cleanup', 'dependencies'],
        estimatedComplexity: 'high',
        rationale: 'Requires understanding of state',
      },
    ],
    conceptDependencies: [
      { concept: 'state', dependsOn: ['components'] },
      { concept: 'useEffect', dependsOn: ['state', 'components'] },
    ],
    bloomsStrategy: [
      { level: 'REMEMBER', chapters: [1] },
      { level: 'UNDERSTAND', chapters: [2] },
      { level: 'APPLY', chapters: [3] },
    ],
    riskAreas: [
      'Chapter 2 state management may be difficult for beginners',
      'Chapter 3 useEffect cleanup patterns are error-prone',
    ],
    planConfidence: 80,
    ...overrides,
  };
}

function makeCompletedChapters(count: number): CompletedChapter[] {
  return Array.from({ length: count }, (_, i) => ({
    position: i + 1,
    title: `Completed Chapter ${i + 1}`,
    description: `Description for chapter ${i + 1}`,
    bloomsLevel: 'UNDERSTAND' as BloomsLevel,
    learningObjectives: [`Objective ${i + 1}`],
    keyTopics: [`topic-${i + 1}-a`, `topic-${i + 1}-b`],
    prerequisites: i === 0 ? 'None' : `Chapter ${i}`,
    estimatedTime: '2 hours',
    topicsToExpand: [`topic-${i + 1}-a`],
    conceptsIntroduced: [`concept-${i + 1}-a`, `concept-${i + 1}-b`],
    id: `chapter-${i + 1}-id`,
    sections: [],
  }));
}

function makeConceptTracker(entries: Array<[string, { concept: string; introducedInChapter: number; bloomsLevel: BloomsLevel }]> = []): ConceptTracker {
  return {
    concepts: new Map(entries),
    vocabulary: entries.map(([name]) => name),
    skillsBuilt: [],
  };
}

// ============================================================================
// Test Suite
// ============================================================================

describe('course-planner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // planCourseBlueprint
  // ==========================================================================

  describe('planCourseBlueprint', () => {
    it('parses valid JSON into a CourseBlueprintPlan', async () => {
      const courseContext = makeCourseContext();
      mockRunSAM.mockResolvedValue(makeValidBlueprintJSON(5));

      const result = await planCourseBlueprint('user-1', courseContext);

      // Structural assertions
      expect(result.chapterPlan).toHaveLength(5);
      expect(result.conceptDependencies).toHaveLength(2);
      expect(result.bloomsStrategy).toHaveLength(3);
      expect(result.riskAreas).toHaveLength(2);
      expect(result.planConfidence).toBe(85);
      expect(result.recommendedChapterCount).toBeUndefined();

      // Chapter plan entries
      expect(result.chapterPlan[0].position).toBe(1);
      expect(result.chapterPlan[0].suggestedTitle).toBe('Chapter 1: Topic 1');
      expect(result.chapterPlan[0].bloomsLevel).toBe('REMEMBER');
      expect(result.chapterPlan[0].keyConcepts).toEqual(['concept-1-a', 'concept-1-b']);
      expect(result.chapterPlan[0].estimatedComplexity).toBe('medium');
      expect(result.chapterPlan[0].recommendedSections).toBe(7);

      // AI call was made with correct parameters
      // maxTokens is adaptive: Math.min(8192, 1500 + totalChapters*200 + totalSections*100)
      // For 5 chapters, 4 sections/ch: 1500 + 1000 + 2000 = 4500
      expect(mockRunSAM).toHaveBeenCalledTimes(1);
      expect(mockRunSAM).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          capability: 'course',
          maxTokens: 4500,
          temperature: 0.6,
        }),
      );
    });

    it('falls back to default blueprint when AI returns malformed JSON', async () => {
      const courseContext = makeCourseContext({ totalChapters: 3 });
      mockRunSAM.mockResolvedValue('This is not JSON at all, just random garbage text!');

      const result = await planCourseBlueprint('user-1', courseContext);

      // Default blueprint structure
      expect(result.chapterPlan).toHaveLength(3);
      expect(result.conceptDependencies).toEqual([]);
      expect(result.bloomsStrategy).toEqual([]);
      expect(result.riskAreas).toEqual([]);
      expect(result.planConfidence).toBe(50);
      expect(result.recommendedChapterCount).toBeUndefined();

      // Default chapter entries have generic titles and no concepts
      expect(result.chapterPlan[0].suggestedTitle).toBe('Chapter 1');
      expect(result.chapterPlan[0].primaryFocus).toBe('');
      expect(result.chapterPlan[0].keyConcepts).toEqual([]);
      expect(result.chapterPlan[0].estimatedComplexity).toBe('medium');

      // Logger warned about parse failure (either parse warning or fallback warning)
      expect(logger.warn).toHaveBeenCalled();
    });

    it('falls back to default blueprint when AI rejects with an error', async () => {
      const courseContext = makeCourseContext({ totalChapters: 4 });
      mockRunSAM.mockRejectedValue(new Error('AI provider unavailable'));

      const result = await planCourseBlueprint('user-1', courseContext);

      // Default blueprint
      expect(result.chapterPlan).toHaveLength(4);
      expect(result.planConfidence).toBe(50);
      expect(result.riskAreas).toEqual([]);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Blueprint generation failed'),
        expect.objectContaining({ error: 'AI provider unavailable' }),
      );
    });

    it('falls back to default blueprint on timeout', async () => {
      const courseContext = makeCourseContext({ totalChapters: 3 });

      // Simulate a promise that never resolves (will be caught by withTimeout)
      mockRunSAM.mockImplementation(
        () => new Promise((resolve) => {
          // Intentionally never resolves; the internal withTimeout will reject after 45s
          setTimeout(() => resolve('too late'), 120_000);
        }),
      );

      // Use fake timers to simulate the timeout without waiting 45s
      jest.useFakeTimers();

      const promise = planCourseBlueprint('user-1', courseContext);

      // Advance past the PLANNING_TIMEOUT_MS (45_000) — use async version to flush microtasks
      await jest.advanceTimersByTimeAsync(46_000);

      const result = await promise;

      jest.useRealTimers();

      // Should have fallen back to default
      expect(result.chapterPlan).toHaveLength(3);
      expect(result.planConfidence).toBe(50);
      expect(result.riskAreas).toEqual([]);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Blueprint generation failed'),
        expect.objectContaining({
          error: expect.stringContaining('timed out'),
        }),
      );
    });

    it('strips markdown code fences from AI response', async () => {
      const courseContext = makeCourseContext({ totalChapters: 2 });
      const json = JSON.stringify({
        chapterPlan: [
          {
            position: 1,
            suggestedTitle: 'Intro',
            primaryFocus: 'Basics',
            bloomsLevel: 'REMEMBER',
            keyConcepts: ['a'],
            estimatedComplexity: 'low',
            rationale: 'Start here',
          },
          {
            position: 2,
            suggestedTitle: 'Advanced',
            primaryFocus: 'Deep dive',
            bloomsLevel: 'APPLY',
            keyConcepts: ['b'],
            estimatedComplexity: 'high',
            rationale: 'Build on basics',
          },
        ],
        conceptDependencies: [],
        bloomsStrategy: [],
        riskAreas: [],
        planConfidence: 90,
      });

      mockRunSAM.mockResolvedValue('```json\n' + json + '\n```');

      const result = await planCourseBlueprint('user-1', courseContext);

      expect(result.chapterPlan).toHaveLength(2);
      expect(result.planConfidence).toBe(90);
      expect(result.chapterPlan[0].suggestedTitle).toBe('Intro');
    });

    it('clamps planConfidence to 0-100 range', async () => {
      const courseContext = makeCourseContext({ totalChapters: 1 });
      const json = JSON.stringify({
        chapterPlan: [
          {
            position: 1,
            suggestedTitle: 'Ch1',
            primaryFocus: 'Focus',
            bloomsLevel: 'REMEMBER',
            keyConcepts: [],
            estimatedComplexity: 'low',
            rationale: 'Only chapter',
          },
        ],
        conceptDependencies: [],
        bloomsStrategy: [],
        riskAreas: [],
        planConfidence: 150,
      });

      mockRunSAM.mockResolvedValue(json);

      const result = await planCourseBlueprint('user-1', courseContext);
      expect(result.planConfidence).toBe(100);
    });

    it('defaults planConfidence to 70 when not a number', async () => {
      const courseContext = makeCourseContext({ totalChapters: 1 });
      const json = JSON.stringify({
        chapterPlan: [
          {
            position: 1,
            suggestedTitle: 'Ch1',
            primaryFocus: 'Focus',
            bloomsLevel: 'REMEMBER',
            keyConcepts: [],
            estimatedComplexity: 'low',
            rationale: 'Only chapter',
          },
        ],
        conceptDependencies: [],
        bloomsStrategy: [],
        riskAreas: [],
        planConfidence: 'high',
      });

      mockRunSAM.mockResolvedValue(json);

      const result = await planCourseBlueprint('user-1', courseContext);
      expect(result.planConfidence).toBe(70);
    });

    it('uses default Blooms level when AI provides invalid level', async () => {
      const courseContext = makeCourseContext({ totalChapters: 2 });
      const json = JSON.stringify({
        chapterPlan: [
          {
            position: 1,
            suggestedTitle: 'Ch1',
            primaryFocus: 'Focus',
            bloomsLevel: 'INVALID_LEVEL',
            keyConcepts: [],
            estimatedComplexity: 'medium',
            rationale: 'Test',
          },
          {
            position: 2,
            suggestedTitle: 'Ch2',
            primaryFocus: 'Focus 2',
            bloomsLevel: 'APPLY',
            keyConcepts: [],
            estimatedComplexity: 'low',
            rationale: 'Test 2',
          },
        ],
        conceptDependencies: [],
        bloomsStrategy: [],
        riskAreas: [],
        planConfidence: 75,
      });

      mockRunSAM.mockResolvedValue(json);

      const result = await planCourseBlueprint('user-1', courseContext);

      // First chapter with invalid level should get default (REMEMBER for position 1 of 2)
      expect(result.chapterPlan[0].bloomsLevel).toBe('REMEMBER');
      // Second chapter with valid level should keep it
      expect(result.chapterPlan[1].bloomsLevel).toBe('APPLY');
    });

    it('defaults estimatedComplexity to medium for invalid values', async () => {
      const courseContext = makeCourseContext({ totalChapters: 1 });
      const json = JSON.stringify({
        chapterPlan: [
          {
            position: 1,
            suggestedTitle: 'Ch1',
            primaryFocus: 'Focus',
            bloomsLevel: 'REMEMBER',
            keyConcepts: [],
            estimatedComplexity: 'extreme',
            rationale: 'Test',
          },
        ],
        conceptDependencies: [],
        bloomsStrategy: [],
        riskAreas: [],
        planConfidence: 70,
      });

      mockRunSAM.mockResolvedValue(json);

      const result = await planCourseBlueprint('user-1', courseContext);
      expect(result.chapterPlan[0].estimatedComplexity).toBe('medium');
    });

    it('includes memory sections in prompt when recalledMemory is provided', async () => {
      const courseContext = makeCourseContext({ totalChapters: 1 });
      mockRunSAM.mockResolvedValue(makeValidBlueprintJSON(1));

      const recalledMemory = {
        priorConcepts: [
          { concept: 'JavaScript basics', bloomsLevel: 'REMEMBER' as BloomsLevel, courseTitle: 'JS 101' },
        ],
        qualityPatterns: {
          averageScore: 82,
          weakDimensions: ['specificity'],
          strongDimensions: ['completeness'],
          courseCount: 3,
        },
        relatedConcepts: [],
      };

      await planCourseBlueprint('user-1', courseContext, recalledMemory);

      // Verify the prompt sent to AI includes memory context
      const callArgs = mockRunSAM.mock.calls[0][0] as { messages: Array<{ content: string }> };
      const userPrompt = callArgs.messages[0].content;
      expect(userPrompt).toContain('PRIOR KNOWLEDGE');
      expect(userPrompt).toContain('JavaScript basics');
    });

    it('handles recommendedChapterCount within bounds', async () => {
      const courseContext = makeCourseContext({ totalChapters: 5 });
      const json = JSON.stringify({
        chapterPlan: Array.from({ length: 5 }, (_, i) => ({
          position: i + 1,
          suggestedTitle: `Ch ${i + 1}`,
          primaryFocus: 'Focus',
          bloomsLevel: 'REMEMBER',
          keyConcepts: [],
          estimatedComplexity: 'medium',
          rationale: 'Test',
        })),
        conceptDependencies: [],
        bloomsStrategy: [],
        riskAreas: [],
        planConfidence: 80,
        recommendedChapterCount: 7,
      });

      mockRunSAM.mockResolvedValue(json);

      const result = await planCourseBlueprint('user-1', courseContext);
      // 7 is clamped to totalChapters+2 = 7, and 7 !== 5 so it should be set
      expect(result.recommendedChapterCount).toBe(7);
    });

    it('omits recommendedChapterCount when same as totalChapters', async () => {
      const courseContext = makeCourseContext({ totalChapters: 5 });
      const json = JSON.stringify({
        chapterPlan: Array.from({ length: 5 }, (_, i) => ({
          position: i + 1,
          suggestedTitle: `Ch ${i + 1}`,
          primaryFocus: 'Focus',
          bloomsLevel: 'REMEMBER',
          keyConcepts: [],
          estimatedComplexity: 'medium',
          rationale: 'Test',
        })),
        conceptDependencies: [],
        bloomsStrategy: [],
        riskAreas: [],
        planConfidence: 80,
        recommendedChapterCount: 5,
      });

      mockRunSAM.mockResolvedValue(json);

      const result = await planCourseBlueprint('user-1', courseContext);
      expect(result.recommendedChapterCount).toBeUndefined();
    });
  });

  // ==========================================================================
  // buildBlueprintBlock
  // ==========================================================================

  describe('buildBlueprintBlock', () => {
    it('returns empty string when chapter not found in blueprint', () => {
      const blueprint = makeBlueprint();
      const result = buildBlueprintBlock(blueprint, 999);
      expect(result).toBe('');
    });

    it('returns empty string for chapter 0 (no entry at position 0)', () => {
      const blueprint = makeBlueprint();
      const result = buildBlueprintBlock(blueprint, 0);
      expect(result).toBe('');
    });

    it('includes primaryFocus, suggestedTitle, and bloomsLevel in output', () => {
      const blueprint = makeBlueprint();
      const result = buildBlueprintBlock(blueprint, 1);

      expect(result).toContain('JSX and Components');
      expect(result).toContain('Getting Started with React');
      expect(result).toContain('REMEMBER');
      expect(result).toContain('Foundation chapter');
    });

    it('includes key concepts joined by comma', () => {
      const blueprint = makeBlueprint();
      const result = buildBlueprintBlock(blueprint, 1);

      expect(result).toContain('JSX, components, props');
    });

    it('includes estimatedComplexity in output', () => {
      const blueprint = makeBlueprint();
      const result = buildBlueprintBlock(blueprint, 1);

      expect(result).toContain('low');
    });

    it('includes COURSE BLUEPRINT header', () => {
      const blueprint = makeBlueprint();
      const result = buildBlueprintBlock(blueprint, 1);

      expect(result).toContain('## COURSE BLUEPRINT');
    });

    it('includes risk warnings for matching chapter number', () => {
      const blueprint = makeBlueprint({
        riskAreas: [
          'Chapter 2 state management may be difficult for beginners',
          'Chapter 3 useEffect cleanup patterns are error-prone',
          'General risk about testing',
        ],
      });

      const result = buildBlueprintBlock(blueprint, 2);

      expect(result).toContain('Risk Areas');
      expect(result).toContain('Chapter 2 state management may be difficult for beginners');
      // Chapter 3 risk should NOT appear for chapter 2
      expect(result).not.toContain('Chapter 3 useEffect');
    });

    it('includes risk warnings matching chapter primaryFocus', () => {
      const blueprint = makeBlueprint({
        riskAreas: [
          'useState and state patterns require careful explanation for immutability',
        ],
      });

      // Chapter 2 has primaryFocus 'useState and state patterns'
      const result = buildBlueprintBlock(blueprint, 2);

      expect(result).toContain('Risk Areas');
      expect(result).toContain('useState and state patterns require careful explanation');
    });

    it('omits risk section when no matching risks', () => {
      const blueprint = makeBlueprint({
        riskAreas: [
          'Chapter 99 has an unrelated risk',
        ],
      });

      const result = buildBlueprintBlock(blueprint, 1);

      expect(result).not.toContain('Risk Areas');
    });

    it('includes concept dependencies for matching chapter concepts', () => {
      const blueprint = makeBlueprint({
        conceptDependencies: [
          { concept: 'state', dependsOn: ['components'] },
          { concept: 'useEffect', dependsOn: ['state', 'components'] },
          { concept: 'unrelated', dependsOn: ['nothing'] },
        ],
      });

      // Chapter 2 has keyConcepts: ['state', 'useState', 'immutability']
      const result = buildBlueprintBlock(blueprint, 2);

      expect(result).toContain('Concept Dependencies');
      expect(result).toContain('state depends on: components');
      // 'unrelated' should not appear since it is not in chapter 2 keyConcepts
      expect(result).not.toContain('unrelated');
    });

    it('omits dependencies section when no matching dependencies', () => {
      const blueprint = makeBlueprint({
        conceptDependencies: [
          { concept: 'unrelated-concept', dependsOn: ['other'] },
        ],
      });

      const result = buildBlueprintBlock(blueprint, 1);

      expect(result).not.toContain('Concept Dependencies');
    });
  });

  // ==========================================================================
  // replanRemainingChapters
  // ==========================================================================

  describe('replanRemainingChapters', () => {
    it('merges completed chapter entries with revised remaining entries', async () => {
      const courseContext = makeCourseContext({ totalChapters: 5 });
      const completedChapters = makeCompletedChapters(2);
      const conceptTracker = makeConceptTracker([
        ['concept-1-a', { concept: 'concept-1-a', introducedInChapter: 1, bloomsLevel: 'REMEMBER' }],
        ['concept-2-a', { concept: 'concept-2-a', introducedInChapter: 2, bloomsLevel: 'UNDERSTAND' }],
      ]);

      const currentBlueprint = makeBlueprint({
        chapterPlan: Array.from({ length: 5 }, (_, i) => ({
          position: i + 1,
          suggestedTitle: `Original Chapter ${i + 1}`,
          primaryFocus: `Original focus ${i + 1}`,
          bloomsLevel: 'UNDERSTAND' as BloomsLevel,
          keyConcepts: [`orig-concept-${i + 1}`],
          estimatedComplexity: 'medium' as const,
          rationale: 'Original plan',
        })),
      });

      // AI returns revised plan for chapters 3-5.
      // Note: parseBlueprintResponse reads AI array by INDEX (0-based), assigning
      // position = i+1 for i in [0..totalChapters). So we provide 5 entries
      // and the merge step keeps positions 1-2 from current blueprint and
      // positions 3-5 from the revised response.
      const revisedJson = JSON.stringify({
        chapterPlan: [
          {
            position: 1,
            suggestedTitle: 'Overwritten by merge',
            primaryFocus: 'Will be replaced',
            bloomsLevel: 'REMEMBER',
            keyConcepts: [],
            estimatedComplexity: 'low',
            rationale: 'Placeholder',
          },
          {
            position: 2,
            suggestedTitle: 'Overwritten by merge',
            primaryFocus: 'Will be replaced',
            bloomsLevel: 'UNDERSTAND',
            keyConcepts: [],
            estimatedComplexity: 'low',
            rationale: 'Placeholder',
          },
          {
            position: 3,
            suggestedTitle: 'Revised Chapter 3',
            primaryFocus: 'Revised focus 3',
            bloomsLevel: 'APPLY',
            keyConcepts: ['revised-3'],
            estimatedComplexity: 'high',
            rationale: 'Revised to cover gaps',
          },
          {
            position: 4,
            suggestedTitle: 'Revised Chapter 4',
            primaryFocus: 'Revised focus 4',
            bloomsLevel: 'ANALYZE',
            keyConcepts: ['revised-4'],
            estimatedComplexity: 'medium',
            rationale: 'Continuation',
          },
          {
            position: 5,
            suggestedTitle: 'Revised Chapter 5',
            primaryFocus: 'Revised focus 5',
            bloomsLevel: 'EVALUATE',
            keyConcepts: ['revised-5'],
            estimatedComplexity: 'high',
            rationale: 'Capstone',
          },
        ],
        conceptDependencies: [],
        bloomsStrategy: [],
        riskAreas: ['Revised risk area'],
        planConfidence: 78,
      });

      mockRunSAM.mockResolvedValue(revisedJson);

      const result = await replanRemainingChapters(
        'user-1',
        courseContext,
        completedChapters,
        conceptTracker,
        currentBlueprint,
      );

      // Completed chapters (1, 2) should be preserved from current blueprint
      expect(result.chapterPlan[0].position).toBe(1);
      expect(result.chapterPlan[0].suggestedTitle).toBe('Original Chapter 1');
      expect(result.chapterPlan[1].position).toBe(2);
      expect(result.chapterPlan[1].suggestedTitle).toBe('Original Chapter 2');

      // Remaining chapters (3, 4, 5) should be from revised plan
      expect(result.chapterPlan[2].position).toBe(3);
      expect(result.chapterPlan[2].suggestedTitle).toBe('Revised Chapter 3');
      expect(result.chapterPlan[3].suggestedTitle).toBe('Revised Chapter 4');
      expect(result.chapterPlan[4].suggestedTitle).toBe('Revised Chapter 5');

      // Total should be 5 entries (2 kept + 3 revised)
      expect(result.chapterPlan).toHaveLength(5);

      // Risk areas from revised plan
      expect(result.riskAreas).toContain('Revised risk area');

      // Logger info called for re-plan completion
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Re-plan complete'),
        expect.any(Object),
      );
    });

    it('falls back to current blueprint when AI fails', async () => {
      const courseContext = makeCourseContext({ totalChapters: 5 });
      const completedChapters = makeCompletedChapters(2);
      const conceptTracker = makeConceptTracker();

      const currentBlueprint = makeBlueprint({
        planConfidence: 80,
        riskAreas: ['Original risk'],
      });

      mockRunSAM.mockRejectedValue(new Error('AI service down'));

      const result = await replanRemainingChapters(
        'user-1',
        courseContext,
        completedChapters,
        conceptTracker,
        currentBlueprint,
      );

      // Should return the original blueprint unchanged
      expect(result).toBe(currentBlueprint);
      expect(result.planConfidence).toBe(80);
      expect(result.riskAreas).toContain('Original risk');

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Re-planning failed'),
        expect.objectContaining({ error: 'AI service down' }),
      );
    });

    it('falls back to default blueprint when AI fails and no current blueprint', async () => {
      const courseContext = makeCourseContext({ totalChapters: 4 });
      const completedChapters = makeCompletedChapters(1);
      const conceptTracker = makeConceptTracker();

      mockRunSAM.mockRejectedValue(new Error('Timeout'));

      const result = await replanRemainingChapters(
        'user-1',
        courseContext,
        completedChapters,
        conceptTracker,
        null, // no current blueprint
      );

      // Should return a default blueprint
      expect(result.chapterPlan).toHaveLength(4);
      expect(result.planConfidence).toBe(50);
      expect(result.riskAreas).toEqual([]);
    });

    it('returns current blueprint when no remaining chapters to plan', async () => {
      const courseContext = makeCourseContext({ totalChapters: 3 });
      const completedChapters = makeCompletedChapters(3);
      const conceptTracker = makeConceptTracker();
      const currentBlueprint = makeBlueprint();

      const result = await replanRemainingChapters(
        'user-1',
        courseContext,
        completedChapters,
        conceptTracker,
        currentBlueprint,
      );

      // Should return current blueprint without making any AI call
      expect(result).toBe(currentBlueprint);
      expect(mockRunSAM).not.toHaveBeenCalled();

      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('No remaining chapters'),
      );
    });

    it('returns default blueprint when no remaining chapters and no current blueprint', async () => {
      const courseContext = makeCourseContext({ totalChapters: 2 });
      const completedChapters = makeCompletedChapters(2);
      const conceptTracker = makeConceptTracker();

      const result = await replanRemainingChapters(
        'user-1',
        courseContext,
        completedChapters,
        conceptTracker,
        null,
      );

      expect(result.chapterPlan).toHaveLength(2);
      expect(result.planConfidence).toBe(50);
      expect(mockRunSAM).not.toHaveBeenCalled();
    });

    it('passes concept gaps and Blooms history in the replan prompt', async () => {
      const courseContext = makeCourseContext({ totalChapters: 5 });
      const completedChapters = makeCompletedChapters(2);
      // Only concept-1-a covered, but blueprint planned concept-1-a, concept-2-a, concept-3-a
      const conceptTracker = makeConceptTracker([
        ['concept-1-a', { concept: 'concept-1-a', introducedInChapter: 1, bloomsLevel: 'REMEMBER' }],
      ]);

      const currentBlueprint = makeBlueprint({
        chapterPlan: Array.from({ length: 5 }, (_, i) => ({
          position: i + 1,
          suggestedTitle: `Chapter ${i + 1}`,
          primaryFocus: `Focus ${i + 1}`,
          bloomsLevel: 'UNDERSTAND' as BloomsLevel,
          keyConcepts: [`concept-${i + 1}-a`],
          estimatedComplexity: 'medium' as const,
          rationale: 'Plan',
        })),
      });

      mockRunSAM.mockResolvedValue(JSON.stringify({
        chapterPlan: [
          { position: 3, suggestedTitle: 'Ch3', primaryFocus: 'F3', bloomsLevel: 'APPLY', keyConcepts: [], estimatedComplexity: 'medium', rationale: 'R' },
          { position: 4, suggestedTitle: 'Ch4', primaryFocus: 'F4', bloomsLevel: 'ANALYZE', keyConcepts: [], estimatedComplexity: 'medium', rationale: 'R' },
          { position: 5, suggestedTitle: 'Ch5', primaryFocus: 'F5', bloomsLevel: 'EVALUATE', keyConcepts: [], estimatedComplexity: 'medium', rationale: 'R' },
        ],
        conceptDependencies: [],
        bloomsStrategy: [],
        riskAreas: [],
        planConfidence: 75,
      }));

      await replanRemainingChapters(
        'user-1',
        courseContext,
        completedChapters,
        conceptTracker,
        currentBlueprint,
      );

      const callArgs = mockRunSAM.mock.calls[0][0] as { messages: Array<{ content: string }> };
      const userPrompt = callArgs.messages[0].content;

      // Prompt should mention concept gaps (concept-2-a through concept-5-a are uncovered)
      expect(userPrompt).toContain('CONCEPT GAPS');
      expect(userPrompt).toContain('concept-2-a');

      // Prompt should contain Blooms history from completed chapters
      expect(userPrompt).toContain("BLOOM'S PROGRESSION SO FAR");
    });

    it('handles replan with more completed chapters than remaining', async () => {
      const courseContext = makeCourseContext({ totalChapters: 5 });
      const completedChapters = makeCompletedChapters(4); // 4 of 5 done
      const conceptTracker = makeConceptTracker();

      const currentBlueprint = makeBlueprint({
        chapterPlan: Array.from({ length: 5 }, (_, i) => ({
          position: i + 1,
          suggestedTitle: `Original Ch ${i + 1}`,
          primaryFocus: `Focus ${i + 1}`,
          bloomsLevel: 'UNDERSTAND' as BloomsLevel,
          keyConcepts: [],
          estimatedComplexity: 'medium' as const,
          rationale: 'Plan',
        })),
      });

      // AI returns 5 entries (parseBlueprintResponse reads by index for totalChapters=5).
      // Only position 5 matters since merge keeps positions 1-4 from current blueprint.
      mockRunSAM.mockResolvedValue(JSON.stringify({
        chapterPlan: [
          { position: 1, suggestedTitle: 'Placeholder 1', primaryFocus: 'P', bloomsLevel: 'REMEMBER', keyConcepts: [], estimatedComplexity: 'low', rationale: 'P' },
          { position: 2, suggestedTitle: 'Placeholder 2', primaryFocus: 'P', bloomsLevel: 'UNDERSTAND', keyConcepts: [], estimatedComplexity: 'low', rationale: 'P' },
          { position: 3, suggestedTitle: 'Placeholder 3', primaryFocus: 'P', bloomsLevel: 'APPLY', keyConcepts: [], estimatedComplexity: 'low', rationale: 'P' },
          { position: 4, suggestedTitle: 'Placeholder 4', primaryFocus: 'P', bloomsLevel: 'ANALYZE', keyConcepts: [], estimatedComplexity: 'medium', rationale: 'P' },
          {
            position: 5,
            suggestedTitle: 'Revised Final Chapter',
            primaryFocus: 'Capstone',
            bloomsLevel: 'CREATE',
            keyConcepts: ['synthesis'],
            estimatedComplexity: 'high',
            rationale: 'Final project',
          },
        ],
        conceptDependencies: [],
        bloomsStrategy: [],
        riskAreas: [],
        planConfidence: 90,
      }));

      const result = await replanRemainingChapters(
        'user-1',
        courseContext,
        completedChapters,
        conceptTracker,
        currentBlueprint,
      );

      // 4 preserved from current blueprint + 1 revised from AI = 5
      expect(result.chapterPlan).toHaveLength(5);
      // First 4 are from current blueprint
      expect(result.chapterPlan[0].suggestedTitle).toBe('Original Ch 1');
      expect(result.chapterPlan[3].suggestedTitle).toBe('Original Ch 4');
      // Last one is from AI revision
      expect(result.chapterPlan[4].suggestedTitle).toBe('Revised Final Chapter');
    });
  });

  // ==========================================================================
  // Default Blooms Level Assignment
  // ==========================================================================

  describe('default Blooms level progression', () => {
    it('assigns REMEMBER to first chapter and higher levels to later chapters', async () => {
      const courseContext = makeCourseContext({ totalChapters: 6 });
      mockRunSAM.mockResolvedValue('not valid json');

      const result = await planCourseBlueprint('user-1', courseContext);

      // Default progression: REMEMBER -> UNDERSTAND -> APPLY -> ANALYZE -> EVALUATE -> CREATE
      expect(result.chapterPlan[0].bloomsLevel).toBe('REMEMBER');
      expect(result.chapterPlan[1].bloomsLevel).toBe('UNDERSTAND');
      expect(result.chapterPlan[2].bloomsLevel).toBe('APPLY');
      expect(result.chapterPlan[3].bloomsLevel).toBe('ANALYZE');
      expect(result.chapterPlan[4].bloomsLevel).toBe('EVALUATE');
      expect(result.chapterPlan[5].bloomsLevel).toBe('CREATE');
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('handles AI returning JSON with fewer chapters than totalChapters', async () => {
      const courseContext = makeCourseContext({ totalChapters: 5 });

      // Only 3 chapters returned by AI
      const json = JSON.stringify({
        chapterPlan: [
          { position: 1, suggestedTitle: 'Ch1', primaryFocus: 'F1', bloomsLevel: 'REMEMBER', keyConcepts: [], estimatedComplexity: 'low', rationale: 'R1' },
          { position: 2, suggestedTitle: 'Ch2', primaryFocus: 'F2', bloomsLevel: 'UNDERSTAND', keyConcepts: [], estimatedComplexity: 'medium', rationale: 'R2' },
          { position: 3, suggestedTitle: 'Ch3', primaryFocus: 'F3', bloomsLevel: 'APPLY', keyConcepts: [], estimatedComplexity: 'high', rationale: 'R3' },
        ],
        conceptDependencies: [],
        bloomsStrategy: [],
        riskAreas: [],
        planConfidence: 65,
      });

      mockRunSAM.mockResolvedValue(json);

      const result = await planCourseBlueprint('user-1', courseContext);

      // Should pad to 5 chapters (3 from AI + 2 defaults)
      expect(result.chapterPlan).toHaveLength(5);
      expect(result.chapterPlan[0].suggestedTitle).toBe('Ch1');
      expect(result.chapterPlan[3].suggestedTitle).toBe('Chapter 4'); // default
      expect(result.chapterPlan[4].suggestedTitle).toBe('Chapter 5'); // default
    });

    it('limits keyConcepts to 7 per chapter', async () => {
      const courseContext = makeCourseContext({ totalChapters: 1 });
      const json = JSON.stringify({
        chapterPlan: [
          {
            position: 1,
            suggestedTitle: 'Ch1',
            primaryFocus: 'F1',
            bloomsLevel: 'REMEMBER',
            keyConcepts: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
            estimatedComplexity: 'medium',
            rationale: 'R',
          },
        ],
        conceptDependencies: [],
        bloomsStrategy: [],
        riskAreas: [],
        planConfidence: 70,
      });

      mockRunSAM.mockResolvedValue(json);

      const result = await planCourseBlueprint('user-1', courseContext);
      expect(result.chapterPlan[0].keyConcepts).toHaveLength(7);
    });

    it('limits riskAreas to 10 entries', async () => {
      const courseContext = makeCourseContext({ totalChapters: 1 });
      const riskAreas = Array.from({ length: 15 }, (_, i) => `Risk ${i + 1}`);
      const json = JSON.stringify({
        chapterPlan: [
          { position: 1, suggestedTitle: 'Ch1', primaryFocus: 'F1', bloomsLevel: 'REMEMBER', keyConcepts: [], estimatedComplexity: 'medium', rationale: 'R' },
        ],
        conceptDependencies: [],
        bloomsStrategy: [],
        riskAreas,
        planConfidence: 70,
      });

      mockRunSAM.mockResolvedValue(json);

      const result = await planCourseBlueprint('user-1', courseContext);
      expect(result.riskAreas).toHaveLength(10);
    });

    it('limits conceptDependencies to 30 entries', async () => {
      const courseContext = makeCourseContext({ totalChapters: 1 });
      const deps = Array.from({ length: 35 }, (_, i) => ({
        concept: `concept-${i}`,
        dependsOn: [`dep-${i}`],
      }));
      const json = JSON.stringify({
        chapterPlan: [
          { position: 1, suggestedTitle: 'Ch1', primaryFocus: 'F1', bloomsLevel: 'REMEMBER', keyConcepts: [], estimatedComplexity: 'medium', rationale: 'R' },
        ],
        conceptDependencies: deps,
        bloomsStrategy: [],
        riskAreas: [],
        planConfidence: 70,
      });

      mockRunSAM.mockResolvedValue(json);

      const result = await planCourseBlueprint('user-1', courseContext);
      expect(result.conceptDependencies).toHaveLength(30);
    });

    it('bounds recommendedSections between 5 and 10', async () => {
      const courseContext = makeCourseContext({ totalChapters: 2 });
      const json = JSON.stringify({
        chapterPlan: [
          {
            position: 1,
            suggestedTitle: 'Ch1',
            primaryFocus: 'F1',
            bloomsLevel: 'REMEMBER',
            keyConcepts: [],
            estimatedComplexity: 'low',
            rationale: 'R',
            recommendedSections: 3,
          },
          {
            position: 2,
            suggestedTitle: 'Ch2',
            primaryFocus: 'F2',
            bloomsLevel: 'UNDERSTAND',
            keyConcepts: [],
            estimatedComplexity: 'medium',
            rationale: 'R',
            recommendedSections: 15,
          },
        ],
        conceptDependencies: [],
        bloomsStrategy: [],
        riskAreas: [],
        planConfidence: 70,
      });

      mockRunSAM.mockResolvedValue(json);

      const result = await planCourseBlueprint('user-1', courseContext);

      // 3 is below 5, so recommendedSections should be undefined
      expect(result.chapterPlan[0].recommendedSections).toBeUndefined();
      // 15 is above 10, so recommendedSections should be undefined
      expect(result.chapterPlan[1].recommendedSections).toBeUndefined();
    });

    it('accepts recommendedSections within valid range', async () => {
      const courseContext = makeCourseContext({ totalChapters: 1 });
      const json = JSON.stringify({
        chapterPlan: [
          {
            position: 1,
            suggestedTitle: 'Ch1',
            primaryFocus: 'F1',
            bloomsLevel: 'REMEMBER',
            keyConcepts: [],
            estimatedComplexity: 'low',
            rationale: 'R',
            recommendedSections: 8,
          },
        ],
        conceptDependencies: [],
        bloomsStrategy: [],
        riskAreas: [],
        planConfidence: 70,
      });

      mockRunSAM.mockResolvedValue(json);

      const result = await planCourseBlueprint('user-1', courseContext);
      expect(result.chapterPlan[0].recommendedSections).toBe(8);
    });
  });
});
