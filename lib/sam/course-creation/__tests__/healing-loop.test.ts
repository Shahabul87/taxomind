/**
 * Healing Loop — Unit Tests
 *
 * Tests the autonomous post-generation quality recovery loop:
 * - runHealingLoop(): iterative chapter regeneration and re-reflection
 * - diagnoseChapterIssues(): AI-based healing strategy diagnosis
 *
 * All external dependencies (DB, AI, regeneration, reflection) are mocked.
 */

// ============================================================================
// Mocks (must be declared before imports)
// ============================================================================

jest.mock('server-only', () => ({}));

jest.mock('@/lib/db', () => ({
  db: {
    chapter: { findUnique: jest.fn() },
  },
}));

jest.mock('@/lib/sam/ai-provider', () => ({
  runSAMChatWithPreference: jest.fn(),
}));

jest.mock('@/lib/sam/utils/timeout', () => ({
  withRetryableTimeout: jest.fn((fn: () => unknown) => fn()),
  TIMEOUT_DEFAULTS: { AI_ANALYSIS: 30000 },
}));

jest.mock('../chapter-regenerator', () => ({
  regenerateChapter: jest.fn(),
  regenerateSectionsOnly: jest.fn(),
  regenerateDetailsOnly: jest.fn(),
}));

jest.mock('../course-reflector', () => ({
  reflectOnCourse: jest.fn(),
}));

jest.mock('../helpers', () => ({
  traceAICall: jest.fn((_trace: unknown, fn: () => unknown) => fn()),
}));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

// ============================================================================
// Imports (after mocks)
// ============================================================================

import { runHealingLoop, diagnoseChapterIssues } from '../healing-loop';
import { reflectOnCourse } from '../course-reflector';
import {
  regenerateChapter,
  regenerateSectionsOnly,
  regenerateDetailsOnly,
} from '../chapter-regenerator';
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import { db } from '@/lib/db';
import {
  CompletedChapter,
  ConceptTracker,
  CourseContext,
  QualityScore,
  CourseReflection,
  HealingLoopConfig,
} from '../types';

// ============================================================================
// Test Helpers
// ============================================================================

const mockReflectOnCourse = reflectOnCourse as jest.MockedFunction<typeof reflectOnCourse>;
const mockRegenerateChapter = regenerateChapter as jest.MockedFunction<typeof regenerateChapter>;
const mockRegenerateSectionsOnly = regenerateSectionsOnly as jest.MockedFunction<typeof regenerateSectionsOnly>;
const mockRegenerateDetailsOnly = regenerateDetailsOnly as jest.MockedFunction<typeof regenerateDetailsOnly>;
const mockRunSAMChat = runSAMChatWithPreference as jest.MockedFunction<typeof runSAMChatWithPreference>;
const mockDbChapterFindUnique = (db.chapter.findUnique as jest.Mock);

function makeConfig(overrides: Partial<HealingLoopConfig> = {}): HealingLoopConfig {
  return {
    userId: 'user-1',
    courseId: 'course-1',
    maxHealingIterations: 2,
    minCoherenceScore: 80,
    severityThreshold: 'medium',
    ...overrides,
  };
}

function makeCourseContext(overrides: Partial<CourseContext> = {}): CourseContext {
  return {
    courseTitle: 'Test Course',
    courseDescription: 'A test course',
    courseCategory: 'Testing',
    targetAudience: 'Developers',
    difficulty: 'intermediate',
    courseLearningObjectives: ['Learn testing'],
    totalChapters: 3,
    sectionsPerChapter: 4,
    bloomsFocus: ['UNDERSTAND'],
    learningObjectivesPerChapter: 3,
    learningObjectivesPerSection: 2,
    ...overrides,
  };
}

function makeCompletedChapter(position: number, id?: string): CompletedChapter {
  return {
    id: id ?? `chapter-${position}`,
    position,
    title: `Chapter ${position}`,
    description: `Description for chapter ${position}`,
    bloomsLevel: 'UNDERSTAND',
    learningObjectives: ['Objective 1', 'Objective 2'],
    keyTopics: ['Topic A', 'Topic B'],
    prerequisites: 'None',
    estimatedTime: '1-2 hours',
    topicsToExpand: ['Topic A', 'Topic B'],
    sections: [
      {
        id: `section-${position}-1`,
        position: 1,
        title: `Section ${position}.1`,
        contentType: 'video',
        estimatedDuration: '15 minutes',
        topicFocus: 'Topic A',
        parentChapterContext: {
          title: `Chapter ${position}`,
          bloomsLevel: 'UNDERSTAND',
          relevantObjectives: ['Objective 1'],
        },
      },
    ],
  };
}

function makeConceptTracker(): ConceptTracker {
  return {
    concepts: new Map(),
    vocabulary: [],
    skillsBuilt: [],
  };
}

function makeQualityScores(): QualityScore[] {
  return [
    {
      uniqueness: 80,
      specificity: 75,
      bloomsAlignment: 85,
      completeness: 90,
      depth: 70,
      overall: 80,
    },
  ];
}

function makeReflection(overrides: Partial<CourseReflection> = {}): CourseReflection {
  return {
    coherenceScore: 60,
    bloomsProgression: { isMonotonic: true, gaps: [] },
    conceptCoverage: {
      totalConcepts: 10,
      coveredByMultipleChapters: 5,
      orphanedConcepts: [],
      missingPrerequisites: [],
    },
    flaggedChapters: [],
    summary: 'Test reflection',
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('runHealingLoop', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('skips healing when coherence is already above threshold', async () => {
    mockReflectOnCourse.mockReturnValue(
      makeReflection({ coherenceScore: 95, flaggedChapters: [] }),
    );

    const result = await runHealingLoop(
      makeConfig({ minCoherenceScore: 80 }),
      [makeCompletedChapter(1)],
      makeConceptTracker(),
      makeCourseContext(),
      makeQualityScores(),
      null,
    );

    expect(result.healed).toBe(false);
    expect(result.iterationsRun).toBe(0);
    expect(result.chaptersRegenerated).toEqual([]);
    expect(result.finalCoherenceScore).toBe(95);
    expect(result.improvementDelta).toBe(0);
    expect(mockRegenerateChapter).not.toHaveBeenCalled();
  });

  it('identifies chapters below quality threshold and heals them', async () => {
    // First reflection: low coherence with flagged chapters
    // After healing + second reflection: above threshold
    mockReflectOnCourse
      .mockReturnValueOnce(
        makeReflection({
          coherenceScore: 55,
          flaggedChapters: [
            { position: 2, reason: 'Low quality', severity: 'high' },
          ],
        }),
      )
      .mockReturnValueOnce(
        makeReflection({ coherenceScore: 85, flaggedChapters: [] }),
      );

    // AI diagnosis returns full_regeneration
    mockRunSAMChat.mockResolvedValue(
      JSON.stringify({ type: 'full_regeneration', reasoning: 'Chapter needs full rework' }),
    );

    // Regeneration succeeds
    mockRegenerateChapter.mockResolvedValue({
      success: true,
      chapterId: 'chapter-2',
      chapterTitle: 'Improved Chapter 2',
      sectionsRegenerated: 4,
    });

    // DB reload after healing
    mockDbChapterFindUnique.mockResolvedValue({
      id: 'chapter-2',
      position: 2,
      title: 'Improved Chapter 2',
      description: 'Better description',
      targetBloomsLevel: 'UNDERSTAND',
      courseGoals: 'Objective 1\nObjective 2',
      prerequisites: 'None',
      estimatedTime: '1-2 hours',
      sections: [],
    });

    const chapters = [makeCompletedChapter(1), makeCompletedChapter(2)];

    const result = await runHealingLoop(
      makeConfig(),
      chapters,
      makeConceptTracker(),
      makeCourseContext(),
      makeQualityScores(),
      null,
    );

    expect(result.healed).toBe(true);
    expect(result.iterationsRun).toBe(1);
    expect(result.chaptersRegenerated).toContain(2);
    expect(result.finalCoherenceScore).toBe(85);
    expect(result.improvementDelta).toBe(30); // 85 - 55
    expect(mockRegenerateChapter).toHaveBeenCalledTimes(1);
  });

  it('respects max healing iterations capped at ABSOLUTE_MAX_ITERATIONS (3)', async () => {
    // Config asks for 10 iterations but ABSOLUTE_MAX_ITERATIONS=3
    // Each reflection returns below threshold with flagged chapters
    // Use different positions each time so they are not skipped as "already regenerated"
    let callCount = 0;
    mockReflectOnCourse.mockImplementation(() => {
      callCount++;
      // Always return below threshold, slightly improving to avoid regression guard
      return makeReflection({
        coherenceScore: 50 + callCount * 5, // 55, 60, 65, 70 (never reaches 80)
        flaggedChapters: [
          { position: callCount + 10, reason: 'Low quality', severity: 'high' },
        ],
      });
    });

    mockRunSAMChat.mockResolvedValue(
      JSON.stringify({ type: 'full_regeneration', reasoning: 'Needs rework' }),
    );
    mockRegenerateChapter.mockResolvedValue({
      success: true,
      chapterId: 'chapter-x',
      chapterTitle: 'Healed',
    });
    mockDbChapterFindUnique.mockResolvedValue(null); // Reload fails gracefully

    // Provide chapters for the flagged positions
    const chapters = Array.from({ length: 20 }, (_, i) => makeCompletedChapter(i + 1));

    const result = await runHealingLoop(
      makeConfig({ maxHealingIterations: 10 }),
      chapters,
      makeConceptTracker(),
      makeCourseContext(),
      makeQualityScores(),
      null,
    );

    // Should be capped at 3
    expect(result.iterationsRun).toBeLessThanOrEqual(3);
    // reflectOnCourse is called once initially + once per iteration
    // Initial + 3 iterations = 4 calls
    expect(mockReflectOnCourse.mock.calls.length).toBeLessThanOrEqual(4);
  });

  it('returns healingExhaustedChapters for persistent failures', async () => {
    // Chapter 2 always fails regeneration
    mockReflectOnCourse.mockImplementation(() =>
      makeReflection({
        coherenceScore: 50,
        flaggedChapters: [
          { position: 2, reason: 'Low quality', severity: 'high' },
        ],
      }),
    );

    mockRunSAMChat.mockResolvedValue(
      JSON.stringify({ type: 'full_regeneration', reasoning: 'Needs rework' }),
    );

    // Regeneration always fails
    mockRegenerateChapter.mockResolvedValue({
      success: false,
      error: 'AI generation failed',
    });

    const chapters = [makeCompletedChapter(1), makeCompletedChapter(2)];

    const result = await runHealingLoop(
      makeConfig({ maxHealingIterations: 2 }),
      chapters,
      makeConceptTracker(),
      makeCourseContext(),
      makeQualityScores(),
      null,
    );

    expect(result.healed).toBe(false);
    expect(result.healingExhaustedChapters).toBeDefined();
    expect(result.healingExhaustedChapters).toContain(2);
  });

  it('stops on coherence regression to prevent further degradation', async () => {
    // First reflection: coherence 60 (below 80 threshold)
    // After healing: coherence 50 (regressed)
    mockReflectOnCourse
      .mockReturnValueOnce(
        makeReflection({
          coherenceScore: 60,
          flaggedChapters: [
            { position: 1, reason: 'Low quality', severity: 'high' },
          ],
        }),
      )
      .mockReturnValueOnce(
        makeReflection({
          coherenceScore: 50, // Regression!
          flaggedChapters: [
            { position: 1, reason: 'Still low', severity: 'high' },
          ],
        }),
      );

    mockRunSAMChat.mockResolvedValue(
      JSON.stringify({ type: 'full_regeneration', reasoning: 'Needs rework' }),
    );
    mockRegenerateChapter.mockResolvedValue({
      success: true,
      chapterId: 'chapter-1',
      chapterTitle: 'Healed Chapter 1',
    });
    mockDbChapterFindUnique.mockResolvedValue(null);

    const chapters = [makeCompletedChapter(1), makeCompletedChapter(2)];

    const result = await runHealingLoop(
      makeConfig({ maxHealingIterations: 3 }),
      chapters,
      makeConceptTracker(),
      makeCourseContext(),
      makeQualityScores(),
      null,
    );

    // Should stop after 1 iteration due to regression
    expect(result.iterationsRun).toBe(1);
    expect(result.finalCoherenceScore).toBe(50);
    expect(result.improvementDelta).toBe(-10); // 50 - 60
  });

  it('emits SSE events during healing', async () => {
    const sseEvents: Array<{ type: string; data: Record<string, unknown> }> = [];
    const onSSEEvent = jest.fn((event: { type: string; data: Record<string, unknown> }) => {
      sseEvents.push(event);
    });

    mockReflectOnCourse
      .mockReturnValueOnce(
        makeReflection({
          coherenceScore: 55,
          flaggedChapters: [
            { position: 1, reason: 'Needs improvement', severity: 'high' },
          ],
        }),
      )
      .mockReturnValueOnce(
        makeReflection({ coherenceScore: 85, flaggedChapters: [] }),
      );

    mockRunSAMChat.mockResolvedValue(
      JSON.stringify({ type: 'full_regeneration', reasoning: 'Full rework needed' }),
    );
    mockRegenerateChapter.mockResolvedValue({
      success: true,
      chapterId: 'chapter-1',
      chapterTitle: 'Healed Chapter 1',
    });
    mockDbChapterFindUnique.mockResolvedValue(null);

    const chapters = [makeCompletedChapter(1)];

    await runHealingLoop(
      makeConfig(),
      chapters,
      makeConceptTracker(),
      makeCourseContext(),
      makeQualityScores(),
      null,
      onSSEEvent,
    );

    expect(onSSEEvent).toHaveBeenCalled();

    const eventTypes = sseEvents.map(e => e.type);
    expect(eventTypes).toContain('healing_start');
    expect(eventTypes).toContain('healing_chapter');
    expect(eventTypes).toContain('healing_diagnosis');
    expect(eventTypes).toContain('healing_complete');
  });

  it('dispatches to correct regenerator based on AI strategy', async () => {
    // Test sections_only strategy
    mockReflectOnCourse
      .mockReturnValueOnce(
        makeReflection({
          coherenceScore: 55,
          flaggedChapters: [
            { position: 1, reason: 'Sections weak', severity: 'high' },
          ],
        }),
      )
      .mockReturnValueOnce(
        makeReflection({ coherenceScore: 85, flaggedChapters: [] }),
      );

    mockRunSAMChat.mockResolvedValue(
      JSON.stringify({ type: 'sections_only', reasoning: 'Sections need rework' }),
    );
    mockRegenerateSectionsOnly.mockResolvedValue({
      success: true,
      chapterId: 'chapter-1',
      chapterTitle: 'Fixed Chapter 1',
    });
    mockDbChapterFindUnique.mockResolvedValue(null);

    const chapters = [makeCompletedChapter(1)];

    await runHealingLoop(
      makeConfig(),
      chapters,
      makeConceptTracker(),
      makeCourseContext(),
      makeQualityScores(),
      null,
    );

    expect(mockRegenerateSectionsOnly).toHaveBeenCalledTimes(1);
    expect(mockRegenerateChapter).not.toHaveBeenCalled();
    expect(mockRegenerateDetailsOnly).not.toHaveBeenCalled();
  });

  it('dispatches details_only strategy to regenerateDetailsOnly', async () => {
    mockReflectOnCourse
      .mockReturnValueOnce(
        makeReflection({
          coherenceScore: 55,
          flaggedChapters: [
            { position: 1, reason: 'Details lack depth', severity: 'high' },
          ],
        }),
      )
      .mockReturnValueOnce(
        makeReflection({ coherenceScore: 85, flaggedChapters: [] }),
      );

    mockRunSAMChat.mockResolvedValue(
      JSON.stringify({ type: 'details_only', reasoning: 'Only details need rework' }),
    );
    mockRegenerateDetailsOnly.mockResolvedValue({
      success: true,
      chapterId: 'chapter-1',
      chapterTitle: 'Chapter 1',
    });
    mockDbChapterFindUnique.mockResolvedValue(null);

    const chapters = [makeCompletedChapter(1)];

    await runHealingLoop(
      makeConfig(),
      chapters,
      makeConceptTracker(),
      makeCourseContext(),
      makeQualityScores(),
      null,
    );

    expect(mockRegenerateDetailsOnly).toHaveBeenCalledTimes(1);
    expect(mockRegenerateChapter).not.toHaveBeenCalled();
    expect(mockRegenerateSectionsOnly).not.toHaveBeenCalled();
  });

  it('skips already-regenerated chapters in subsequent iterations', async () => {
    // Iteration 1: chapter 1 flagged and healed, but coherence still below threshold
    // Iteration 2: chapter 1 still flagged but should be SKIPPED (already healed)
    mockReflectOnCourse
      .mockReturnValueOnce(
        makeReflection({
          coherenceScore: 55,
          flaggedChapters: [
            { position: 1, reason: 'Low quality', severity: 'high' },
          ],
        }),
      )
      .mockReturnValueOnce(
        makeReflection({
          coherenceScore: 65, // Improved but not above threshold
          flaggedChapters: [
            { position: 1, reason: 'Still flagged', severity: 'high' },
          ],
        }),
      )
      .mockReturnValueOnce(
        makeReflection({ coherenceScore: 85, flaggedChapters: [] }),
      );

    mockRunSAMChat.mockResolvedValue(
      JSON.stringify({ type: 'full_regeneration', reasoning: 'Full rework' }),
    );
    mockRegenerateChapter.mockResolvedValue({
      success: true,
      chapterId: 'chapter-1',
      chapterTitle: 'Healed',
    });
    mockDbChapterFindUnique.mockResolvedValue(null);

    const chapters = [makeCompletedChapter(1)];

    await runHealingLoop(
      makeConfig({ maxHealingIterations: 3 }),
      chapters,
      makeConceptTracker(),
      makeCourseContext(),
      makeQualityScores(),
      null,
    );

    // regenerateChapter should only be called once (skip on second iteration)
    expect(mockRegenerateChapter).toHaveBeenCalledTimes(1);
  });

  it('filters flagged chapters by severity threshold', async () => {
    // Config has severityThreshold 'high', so 'medium' flagged chapters should be skipped
    mockReflectOnCourse
      .mockReturnValueOnce(
        makeReflection({
          coherenceScore: 55,
          flaggedChapters: [
            { position: 1, reason: 'Minor issue', severity: 'medium' },
            { position: 2, reason: 'Minor issue', severity: 'low' },
          ],
        }),
      );

    const chapters = [makeCompletedChapter(1), makeCompletedChapter(2)];

    const result = await runHealingLoop(
      makeConfig({ severityThreshold: 'high' }),
      chapters,
      makeConceptTracker(),
      makeCourseContext(),
      makeQualityScores(),
      null,
    );

    // No chapters match 'high' severity so nothing is healed
    expect(mockRegenerateChapter).not.toHaveBeenCalled();
    expect(result.healed).toBe(false);
  });

  it('skips healing when AI diagnoses skip_healing strategy', async () => {
    mockReflectOnCourse
      .mockReturnValueOnce(
        makeReflection({
          coherenceScore: 55,
          flaggedChapters: [
            { position: 1, reason: 'False positive', severity: 'high' },
          ],
        }),
      )
      .mockReturnValueOnce(
        makeReflection({ coherenceScore: 55, flaggedChapters: [] }),
      );

    mockRunSAMChat.mockResolvedValue(
      JSON.stringify({ type: 'skip_healing', reasoning: 'Chapter is actually fine' }),
    );

    const chapters = [makeCompletedChapter(1)];

    await runHealingLoop(
      makeConfig(),
      chapters,
      makeConceptTracker(),
      makeCourseContext(),
      makeQualityScores(),
      null,
    );

    // No regeneration functions should be called
    expect(mockRegenerateChapter).not.toHaveBeenCalled();
    expect(mockRegenerateSectionsOnly).not.toHaveBeenCalled();
    expect(mockRegenerateDetailsOnly).not.toHaveBeenCalled();
  });

  it('continues healing other chapters when one throws an error', async () => {
    mockReflectOnCourse
      .mockReturnValueOnce(
        makeReflection({
          coherenceScore: 55,
          flaggedChapters: [
            { position: 1, reason: 'Error chapter', severity: 'high' },
            { position: 2, reason: 'Good chapter', severity: 'high' },
          ],
        }),
      )
      .mockReturnValueOnce(
        makeReflection({ coherenceScore: 85, flaggedChapters: [] }),
      );

    // First diagnosis throws, second succeeds
    mockRunSAMChat
      .mockRejectedValueOnce(new Error('AI timeout'))
      .mockResolvedValueOnce(
        JSON.stringify({ type: 'full_regeneration', reasoning: 'Needs rework' }),
      );

    mockRegenerateChapter.mockResolvedValue({
      success: true,
      chapterId: 'chapter-2',
      chapterTitle: 'Healed Chapter 2',
    });
    mockDbChapterFindUnique.mockResolvedValue(null);

    const chapters = [makeCompletedChapter(1), makeCompletedChapter(2)];

    const result = await runHealingLoop(
      makeConfig(),
      chapters,
      makeConceptTracker(),
      makeCourseContext(),
      makeQualityScores(),
      null,
    );

    // Chapter 2 should still be healed despite chapter 1 error
    expect(result.chaptersRegenerated).toContain(2);
    expect(result.healed).toBe(true);
  });
});

describe('diagnoseChapterIssues', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a valid HealingStrategy from AI response', async () => {
    mockRunSAMChat.mockResolvedValue(
      JSON.stringify({
        type: 'sections_only',
        reasoning: 'Section content is weak but chapter structure is fine',
      }),
    );

    const chapter = makeCompletedChapter(1);
    const courseContext = makeCourseContext();

    const strategy = await diagnoseChapterIssues(
      'user-1',
      chapter,
      'Low section quality',
      'medium',
      courseContext,
    );

    expect(strategy.type).toBe('sections_only');
    expect(strategy.reasoning).toContain('Section content is weak');
  });

  it('returns full_regeneration fallback on AI failure', async () => {
    mockRunSAMChat.mockRejectedValue(new Error('API unavailable'));

    const chapter = makeCompletedChapter(1);
    const courseContext = makeCourseContext();

    const strategy = await diagnoseChapterIssues(
      'user-1',
      chapter,
      'Low quality',
      'high',
      courseContext,
    );

    expect(strategy.type).toBe('full_regeneration');
    expect(strategy.reasoning).toContain('AI diagnosis unavailable');
  });

  it('returns full_regeneration fallback when AI returns invalid JSON', async () => {
    mockRunSAMChat.mockResolvedValue('This is not JSON at all');

    const chapter = makeCompletedChapter(1);
    const courseContext = makeCourseContext();

    const strategy = await diagnoseChapterIssues(
      'user-1',
      chapter,
      'Low quality',
      'high',
      courseContext,
    );

    expect(strategy.type).toBe('full_regeneration');
  });

  it('returns full_regeneration fallback when AI returns unknown strategy type', async () => {
    mockRunSAMChat.mockResolvedValue(
      JSON.stringify({
        type: 'unknown_strategy',
        reasoning: 'AI confused',
      }),
    );

    const chapter = makeCompletedChapter(1);
    const courseContext = makeCourseContext();

    const strategy = await diagnoseChapterIssues(
      'user-1',
      chapter,
      'Low quality',
      'high',
      courseContext,
    );

    expect(strategy.type).toBe('full_regeneration');
  });

  it('handles targeted_sections strategy with valid section positions', async () => {
    mockRunSAMChat.mockResolvedValue(
      JSON.stringify({
        type: 'targeted_sections',
        reasoning: 'Only sections 1 and 3 need rework',
        targetSections: [1, 3],
      }),
    );

    const chapter = makeCompletedChapter(1);
    const courseContext = makeCourseContext();

    const strategy = await diagnoseChapterIssues(
      'user-1',
      chapter,
      'Specific sections are weak',
      'medium',
      courseContext,
    );

    expect(strategy.type).toBe('targeted_sections');
    expect(strategy.targetSections).toEqual([1, 3]);
  });

  it('falls back when targeted_sections has no section positions', async () => {
    mockRunSAMChat.mockResolvedValue(
      JSON.stringify({
        type: 'targeted_sections',
        reasoning: 'Targeted healing but forgot positions',
        targetSections: [],
      }),
    );

    const chapter = makeCompletedChapter(1);
    const courseContext = makeCourseContext();

    const strategy = await diagnoseChapterIssues(
      'user-1',
      chapter,
      'Specific sections are weak',
      'medium',
      courseContext,
    );

    expect(strategy.type).toBe('full_regeneration');
    expect(strategy.reasoning).toContain('no section positions');
  });

  it('parses strategy when AI includes extra text around JSON', async () => {
    mockRunSAMChat.mockResolvedValue(
      'Here is my analysis:\n{"type": "details_only", "reasoning": "Details need depth"}\nEnd of analysis.',
    );

    const chapter = makeCompletedChapter(1);
    const courseContext = makeCourseContext();

    const strategy = await diagnoseChapterIssues(
      'user-1',
      chapter,
      'Shallow details',
      'medium',
      courseContext,
    );

    expect(strategy.type).toBe('details_only');
    expect(strategy.reasoning).toContain('Details need depth');
  });

  it('handles skip_healing strategy correctly', async () => {
    mockRunSAMChat.mockResolvedValue(
      JSON.stringify({
        type: 'skip_healing',
        reasoning: 'Chapter looks fine — flag is a false positive',
      }),
    );

    const chapter = makeCompletedChapter(1);
    const courseContext = makeCourseContext();

    const strategy = await diagnoseChapterIssues(
      'user-1',
      chapter,
      'Minor issue',
      'low',
      courseContext,
    );

    expect(strategy.type).toBe('skip_healing');
    expect(strategy.reasoning).toContain('false positive');
  });
});
