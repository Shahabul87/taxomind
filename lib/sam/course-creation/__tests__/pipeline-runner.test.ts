/**
 * Tests for pipeline-runner.ts
 *
 * Verifies runPipeline: state machine delegation, chapter title generation,
 * abort handling, and result accumulation.
 */

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockStart = jest.fn().mockResolvedValue(undefined);

jest.mock('../course-state-machine', () => ({
  CourseCreationStateMachine: jest.fn().mockImplementation(() => ({
    start: mockStart,
    pause: jest.fn(),
    resume: jest.fn(),
    abort: jest.fn(),
  })),
}));

import { runPipeline, type PipelineRunnerOptions } from '../pipeline-runner';
import { AdaptiveStrategyMonitor } from '../adaptive-strategy';

describe('runPipeline', () => {
  const baseOptions: PipelineRunnerOptions = {
    userId: 'user-1',
    courseId: 'course-1',
    goalId: 'goal-1',
    planId: 'plan-1',
    config: {} as any,
    courseContext: {
      courseTitle: 'Test',
      courseDescription: 'desc',
      courseCategory: 'cat',
      targetAudience: 'devs',
      difficulty: 'INTERMEDIATE',
      courseLearningObjectives: [],
      totalChapters: 3,
      sectionsPerChapter: 2,
    },
    completedChapters: [],
    generatedChapters: [],
    qualityScores: [],
    allSectionTitles: [],
    conceptTracker: { concepts: new Map(), vocabulary: [], skillsBuilt: [] },
    bloomsProgression: [],
    blueprintPlan: null,
    lastAgenticDecision: null,
    recalledMemory: null,
    strategyMonitor: new AdaptiveStrategyMonitor(),
    chapterTemplate: {} as any,
    categoryPrompt: {} as any,
    categoryEnhancer: {} as any,
    experimentVariant: 'control',
    chapterSectionCounts: [],
    budgetTracker: {} as any,
    fallbackTracker: {} as any,
    stepIds: ['s1', 's2', 's3'],
    startChapter: 1,
    totalChapters: 3,
    effectiveSectionsPerChapter: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create and start the state machine', async () => {
    const result = await runPipeline(baseOptions);
    expect(mockStart).toHaveBeenCalled();
    expect(result).toHaveProperty('chaptersCreated');
    expect(result).toHaveProperty('sectionsCreated');
    expect(result).toHaveProperty('allSections');
  });

  it('should generate fallback chapter titles when no blueprint', async () => {
    const result = await runPipeline(baseOptions);
    // mockStart is called, titles would be Chapter 1, Chapter 2, Chapter 3
    expect(mockStart).toHaveBeenCalled();
    const callArgs = mockStart.mock.calls[0];
    const titles = callArgs[0];
    expect(titles).toHaveLength(3);
  });

  it('should use blueprint titles when available', async () => {
    const options = {
      ...baseOptions,
      blueprintPlan: {
        chapterPlan: [
          { position: 1, suggestedTitle: 'Intro' },
          { position: 2, suggestedTitle: 'Core' },
          { position: 3, suggestedTitle: 'Advanced' },
        ],
      } as any,
    };
    await runPipeline(options);
    const callArgs = mockStart.mock.calls[0];
    expect(callArgs[0]).toEqual(['Intro', 'Core', 'Advanced']);
  });

  it('should handle abort gracefully', async () => {
    const controller = new AbortController();
    controller.abort();
    mockStart.mockRejectedValueOnce(Object.assign(new Error('Aborted'), { name: 'AbortError' }));

    const result = await runPipeline({
      ...baseOptions,
      abortSignal: controller.signal,
    });
    expect(result.chaptersCreated).toBe(0);
  });

  it('should re-throw non-abort errors', async () => {
    mockStart.mockRejectedValueOnce(new Error('Unexpected failure'));
    await expect(runPipeline(baseOptions)).rejects.toThrow('Unexpected failure');
  });
});
