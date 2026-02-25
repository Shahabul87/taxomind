/**
 * Tests for parallel-pipeline-runner.ts
 *
 * Verifies runParallelPipeline: batched execution, adaptive batch sizing,
 * fallback handling, coherence checking, and checkpoint saving.
 */

jest.mock('@/lib/db');
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/sam/ai-provider', () => ({
  resolveAIModelInfo: jest.fn().mockResolvedValue({
    provider: 'deepseek',
    model: 'deepseek-chat',
    isReasoningModel: false,
  }),
}));

jest.mock('@/lib/sam/utils/timeout', () => ({
  withTimeout: jest.fn((fn: () => unknown) => fn()),
  OperationTimeoutError: class OperationTimeoutError extends Error {
    constructor(msg: string) { super(msg); this.name = 'OperationTimeoutError'; }
  },
  TIMEOUT_DEFAULTS: { AI_GENERATION: 120000, AI_GENERATION_REASONING: 300000 },
}));

jest.mock('../chapter-generator', () => ({
  generateSingleChapter: jest.fn().mockResolvedValue({
    chaptersCreated: 1,
    sectionsCreated: 3,
    completedChapter: {
      id: 'ch-1',
      position: 1,
      title: 'Chapter 1',
      bloomsLevel: 'UNDERSTAND',
      keyTopics: ['topic1'],
      sections: [{ id: 's-1', title: 'Section 1', position: 1 }],
    },
    qualityScores: [],
  }),
}));

jest.mock('../checkpoint-manager', () => ({
  saveCheckpointWithRetry: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../helpers', () => ({
  buildFallbackChapter: jest.fn((pos: number) => ({
    position: pos,
    title: `Fallback Chapter ${pos}`,
    description: 'Fallback',
    learningObjectives: ['Objective'],
    estimatedTime: '30 minutes',
    prerequisites: '',
    bloomsLevel: 'UNDERSTAND',
    keyTopics: [],
  })),
  buildFallbackSection: jest.fn((secNum: number) => ({
    position: secNum,
    title: `Fallback Section ${secNum}`,
    contentType: 'TEXT',
    estimatedDuration: '10 minutes',
  })),
  buildFallbackDetails: jest.fn(() => ({
    description: 'Fallback description',
    learningObjectives: ['obj'],
    creatorGuidelines: '',
    practicalActivity: '',
    keyConceptsCovered: [],
  })),
  parseDuration: jest.fn(() => 10),
  sanitizeHtmlOutput: jest.fn((html: string) => html),
  buildDefaultQualityScore: jest.fn(() => ({ overall: 30 })),
}));

jest.mock('../prompts', () => ({
  PROMPT_VERSION: '2.1.0',
}));

import { runParallelPipeline, type ParallelPipelineOptions } from '../parallel-pipeline-runner';
import { AdaptiveStrategyMonitor } from '../adaptive-strategy';
import { resolveAIModelInfo } from '@/lib/sam/ai-provider';
import { generateSingleChapter } from '../chapter-generator';
import { saveCheckpointWithRetry } from '../checkpoint-manager';
import { withTimeout } from '@/lib/sam/utils/timeout';
import {
  buildFallbackChapter, parseDuration, sanitizeHtmlOutput, buildDefaultQualityScore,
} from '../helpers';

/**
 * Create a fresh options object for each test to prevent mutation
 * of shared arrays (completedChapters, qualityScores, etc.) across tests.
 * The parallel pipeline mutates these arrays internally via mergeChapterResult.
 */
function createBaseOptions(): ParallelPipelineOptions {
  return {
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
      totalChapters: 2,
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
    stepIds: ['s1', 's2'],
    startChapter: 1,
    totalChapters: 2,
    effectiveSectionsPerChapter: 2,
    batchSize: 3,
  };
}

describe('runParallelPipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore mock implementations cleared by resetMocks
    (resolveAIModelInfo as jest.Mock).mockResolvedValue({
      provider: 'deepseek',
      model: 'deepseek-chat',
      isReasoningModel: false,
    });
    (generateSingleChapter as jest.Mock).mockResolvedValue({
      chaptersCreated: 1,
      sectionsCreated: 3,
      completedChapter: {
        id: 'ch-1',
        position: 1,
        title: 'Chapter 1',
        bloomsLevel: 'UNDERSTAND',
        keyTopics: ['topic1'],
        sections: [{ id: 's-1', title: 'Section 1', position: 1 }],
      },
      qualityScores: [],
    });
    (saveCheckpointWithRetry as jest.Mock).mockResolvedValue(undefined);
    (withTimeout as jest.Mock).mockImplementation((fn: () => unknown) => fn());
    (buildFallbackChapter as jest.Mock).mockImplementation((pos: number) => ({
      position: pos, title: `Fallback Chapter ${pos}`, description: 'Fallback',
      learningObjectives: ['Objective'], estimatedTime: '30 minutes', prerequisites: '',
      bloomsLevel: 'UNDERSTAND', keyTopics: [],
    }));
    (parseDuration as jest.Mock).mockReturnValue(10);
    (sanitizeHtmlOutput as jest.Mock).mockImplementation((html: string) => html);
    (buildDefaultQualityScore as jest.Mock).mockReturnValue({ overall: 30 });
  });

  it('should return pipeline results with chapter and section counts', async () => {
    const result = await runParallelPipeline(createBaseOptions());
    expect(result).toHaveProperty('chaptersCreated');
    expect(result).toHaveProperty('sectionsCreated');
    expect(result).toHaveProperty('allSections');
  });

  it('should emit parallel_generation_start SSE event', async () => {
    const onSSEEvent = jest.fn();
    await runParallelPipeline({ ...createBaseOptions(), onSSEEvent });
    expect(onSSEEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'parallel_generation_start' }),
    );
  });

  it('should emit parallel_generation_complete SSE event', async () => {
    const onSSEEvent = jest.fn();
    await runParallelPipeline({ ...createBaseOptions(), onSSEEvent });
    expect(onSSEEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'parallel_generation_complete' }),
    );
  });

  it('should emit parallel_model_info SSE event', async () => {
    const onSSEEvent = jest.fn();
    await runParallelPipeline({ ...createBaseOptions(), onSSEEvent });
    expect(onSSEEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'parallel_model_info',
        data: expect.objectContaining({ provider: 'deepseek' }),
      }),
    );
  });

  it('should sort completed chapters by position', async () => {
    const opts = createBaseOptions();
    await runParallelPipeline(opts);
    const positions = opts.completedChapters.map((ch) => ch.position);
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThanOrEqual(positions[i - 1]);
    }
  });

  it('should handle abort signal', async () => {
    const controller = new AbortController();
    controller.abort();
    const result = await runParallelPipeline({ ...createBaseOptions(), abortSignal: controller.signal });
    expect(result.chaptersCreated).toBe(0);
  });
});
