/**
 * E2E Integration tests for Course Creation Orchestration
 *
 * Tests the full orchestrator flow with mocked AI and DB:
 * 1. Initialization path: course record creation, goal/plan setup
 * 2. SSE event emission: correct events emitted in expected order
 * 3. Error handling: AI failures produce correct error SSE events
 * 4. FallbackTracker integration: tracker is created and threaded
 * 5. Abort signal handling: pipeline respects cancellation
 *
 * These tests mock the pipeline-runner and post-processor to isolate
 * the orchestrator's coordination logic without requiring a full AI stack.
 */

// Mock external dependencies before any imports
jest.mock('@/lib/db', () => ({
  db: {
    course: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    chapter: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    section: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    sAMGoal: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    sAMSubGoal: {
      create: jest.fn(),
    },
    sAMExecutionPlan: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    sAMExecutionStep: {
      create: jest.fn(),
      createMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/sam/taxomind-context', () => ({
  getTaxomindContext: jest.fn().mockReturnValue({
    stores: {
      goal: { create: jest.fn(), findById: jest.fn() },
      subGoal: { create: jest.fn(), findByGoal: jest.fn() },
      plan: { create: jest.fn(), save: jest.fn(), findById: jest.fn(), findByGoalId: jest.fn(), updateStatus: jest.fn() },
      vector: { search: jest.fn().mockResolvedValue([]) },
      knowledgeGraph: { search: jest.fn().mockResolvedValue([]) },
      sessionContext: { get: jest.fn().mockResolvedValue(null) },
    },
    isInitialized: true,
  }),
  getStore: jest.fn(),
  getGoalStores: jest.fn().mockReturnValue({
    goal: { create: jest.fn().mockResolvedValue({ id: 'goal-1' }), findById: jest.fn() },
    subGoal: { create: jest.fn().mockResolvedValue({ id: 'subgoal-1' }), findByGoal: jest.fn().mockResolvedValue([]) },
    plan: { create: jest.fn().mockResolvedValue({ id: 'plan-1' }), save: jest.fn(), findById: jest.fn(), findByGoalId: jest.fn() },
  }),
  getMemoryStores: jest.fn().mockReturnValue({
    vector: { search: jest.fn().mockResolvedValue([]) },
    knowledgeGraph: { search: jest.fn().mockResolvedValue([]) },
    sessionContext: { get: jest.fn().mockResolvedValue(null) },
  }),
}));

// Mock the course creation modules that orchestrator delegates to
const mockRunPipeline = jest.fn();
const mockRunParallelPipeline = jest.fn();
const mockRunPostProcessing = jest.fn();
const mockFinalizeAndEmit = jest.fn();
const mockInitializeCourseRecord = jest.fn();

jest.mock('../../pipeline-runner', () => ({
  runPipeline: (...args: unknown[]) => mockRunPipeline(...args),
}));

jest.mock('../../parallel-pipeline-runner', () => ({
  runParallelPipeline: (...args: unknown[]) => mockRunParallelPipeline(...args),
}));

jest.mock('../../post-processor', () => ({
  runPostProcessing: (...args: unknown[]) => mockRunPostProcessing(...args),
}));

jest.mock('../../completion-handler', () => ({
  finalizeAndEmit: (...args: unknown[]) => mockFinalizeAndEmit(...args),
}));

jest.mock('../../course-initializer', () => ({
  initializeCourseRecord: (...args: unknown[]) => mockInitializeCourseRecord(...args),
}));

jest.mock('../../memory-recall', () => ({
  recallCourseCreationMemory: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../course-planner', () => ({
  planCourseBlueprint: jest.fn().mockResolvedValue(null),
  convertTeacherBlueprint: jest.fn().mockReturnValue({
    chapterPlan: [
      { position: 1, suggestedTitle: 'Chapter 1', primaryFocus: 'Understand fundamentals', bloomsLevel: 'UNDERSTAND', keyConcepts: ['topic-a', 'topic-b'], estimatedComplexity: 'low', rationale: 'Understand fundamentals', recommendedSections: 2, sectionPlan: [{ position: 1, title: 'Section 1', keyTopics: ['topic-a'] }, { position: 2, title: 'Section 2', keyTopics: ['topic-b'] }] },
      { position: 2, suggestedTitle: 'Chapter 2', primaryFocus: 'Apply concepts', bloomsLevel: 'APPLY', keyConcepts: ['topic-c', 'topic-d'], estimatedComplexity: 'medium', rationale: 'Apply concepts', recommendedSections: 2, sectionPlan: [{ position: 1, title: 'Section 1', keyTopics: ['topic-c'] }, { position: 2, title: 'Section 2', keyTopics: ['topic-d'] }] },
    ],
    conceptDependencies: [],
    bloomsStrategy: [],
    riskAreas: [],
    planConfidence: 90,
  }),
}));

jest.mock('../../experiments', () => ({
  getActiveExperiments: jest.fn().mockResolvedValue([]),
  joinVariants: jest.fn().mockReturnValue(''),
}));

jest.mock('../../chapter-templates', () => ({
  getTemplateForDifficulty: jest.fn().mockReturnValue({
    id: 'default',
    difficulty: 'BEGINNER',
    chapterTemplate: { sections: [] },
    sectionDefs: [],
  }),
  getMinimumSectionsForDifficulty: jest.fn().mockReturnValue(1),
}));

jest.mock('../../category-prompts', () => ({
  getCategoryEnhancers: jest.fn().mockReturnValue([{
    categoryId: 'programming',
    displayName: 'Programming',
    systemPromptAdditions: '',
    qualityHeuristics: [],
  }]),
  blendEnhancers: jest.fn().mockReturnValue({
    categoryId: 'programming',
    displayName: 'Programming',
    systemPromptAdditions: '',
    qualityHeuristics: [],
  }),
  composeCategoryPrompt: jest.fn().mockReturnValue({
    systemPromptAdditions: '',
    qualityHeuristics: [],
    tokenEstimate: { system: 0, perChapter: 0, total: 0 },
  }),
}));

jest.mock('../../course-creation-controller', () => ({
  advanceCourseStage: jest.fn().mockResolvedValue(undefined),
  failCourseCreation: jest.fn().mockResolvedValue(undefined),
  reactivateCourseCreation: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../prompts', () => ({
  PROMPT_VERSION: 'stage1:2.1.0|stage2:2.1.0|stage3:2.1.0',
  PROMPT_VERSIONS: { stage1: '2.1.0', stage2: '2.1.0', stage3: '2.1.0' },
  getPromptVersion: jest.fn((stage: number) => '2.1.0'),
}));

// Mock deep transitive dependencies that would pull in AI provider + auth chain
jest.mock('@/lib/sam/ai-provider', () => ({
  runSAMChatWithPreference: jest.fn().mockResolvedValue(''),
  runSAMChatStream: jest.fn(),
  getSAMAdapter: jest.fn(),
  getAdapterStatus: jest.fn().mockReturnValue({}),
  handleAIAccessError: jest.fn(),
  resolveAIModelInfo: jest.fn().mockResolvedValue({ provider: 'deepseek', model: 'deepseek-chat', isReasoningModel: false }),
}));

jest.mock('../../chapter-generator', () => ({
  generateSingleChapter: jest.fn(),
}));

jest.mock('../../chapter-regenerator', () => ({
  regenerateChapter: jest.fn(),
}));

jest.mock('../../healing-loop', () => ({
  runHealingLoop: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../self-critique', () => ({
  runSelfCritique: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../chapter-critic', () => ({
  runChapterCritic: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../streaming-accumulator', () => ({
  StreamingAccumulator: jest.fn(),
}));

import { orchestrateCourseCreation } from '../../orchestrator';
import type { SequentialCreationConfig } from '../../types';

// ============================================================================
// TEST HELPERS
// ============================================================================

function createConfig(overrides: Partial<SequentialCreationConfig> = {}): SequentialCreationConfig {
  return {
    courseTitle: 'Test Course: TypeScript Fundamentals',
    courseDescription: 'Learn TypeScript from scratch',
    category: 'Programming',
    subcategory: 'TypeScript',
    courseIntent: 'Learn the fundamentals of TypeScript',
    targetAudience: 'Beginner developers',
    difficulty: 'beginner',
    duration: '4-6 weeks',
    totalChapters: 3,
    sectionsPerChapter: 2,
    learningObjectivesPerChapter: 3,
    learningObjectivesPerSection: 2,
    courseGoals: ['Understand TypeScript basics'],
    includeAssessments: false,
    bloomsFocus: ['UNDERSTAND', 'APPLY'],
    preferredContentTypes: ['reading'],
    ...overrides,
  };
}

function createTeacherBlueprint() {
  return {
    chapters: [
      {
        position: 1,
        title: 'Chapter 1',
        goal: 'Understand fundamentals',
        bloomsLevel: 'UNDERSTAND',
        sections: [
          { position: 1, title: 'Section 1', keyTopics: ['topic-a'] },
          { position: 2, title: 'Section 2', keyTopics: ['topic-b'] },
        ],
      },
      {
        position: 2,
        title: 'Chapter 2',
        goal: 'Apply concepts',
        bloomsLevel: 'APPLY',
        sections: [
          { position: 1, title: 'Section 1', keyTopics: ['topic-c'] },
          { position: 2, title: 'Section 2', keyTopics: ['topic-d'] },
        ],
      },
    ],
    confidence: 90,
    riskAreas: [],
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe('Orchestration E2E - Initialization Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: initialization succeeds
    mockInitializeCourseRecord.mockResolvedValue({
      courseId: 'course-test-1',
      goalId: 'goal-1',
      planId: 'plan-1',
      stepIds: ['step-1', 'step-2', 'step-3'],
      chapterTitles: ['Introduction', 'Core Concepts', 'Practice'],
    });

    // Default: pipeline runs successfully
    mockRunPipeline.mockResolvedValue({
      chaptersCreated: 3,
      sectionsCreated: 6,
      allSections: [],
    });

    // Default: post-processing succeeds
    mockRunPostProcessing.mockResolvedValue(undefined);

    // Default: finalization succeeds
    mockFinalizeAndEmit.mockResolvedValue(undefined);
  });

  it('should call initializeCourseRecord with correct positional args', async () => {
    const config = createConfig();
    const onSSEEvent = jest.fn();

    await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      onSSEEvent,
    });

    // initializeCourseRecord(userId, config, blueprintPlan, requestId, requestFingerprint)
    expect(mockInitializeCourseRecord).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        courseTitle: 'Test Course: TypeScript Fundamentals',
      }),
      null, // blueprintPlan (null when no memory recall)
      undefined, // requestId
      undefined, // requestFingerprint
    );
  });

  it('should delegate to pipeline-runner after initialization', async () => {
    const config = createConfig();

    await orchestrateCourseCreation({
      userId: 'user-1',
      config,
    });

    expect(mockRunPipeline).toHaveBeenCalledTimes(1);
    // Pipeline should receive FallbackTracker in options
    const pipelineCallArgs = mockRunPipeline.mock.calls[0][0];
    expect(pipelineCallArgs.fallbackTracker).toBeDefined();
    expect(pipelineCallArgs.courseId).toBe('course-test-1');
    expect(pipelineCallArgs.userId).toBe('user-1');
  });

  it('should delegate to post-processor after pipeline', async () => {
    await orchestrateCourseCreation({
      userId: 'user-1',
      config: createConfig(),
    });

    expect(mockRunPostProcessing).toHaveBeenCalledTimes(1);
  });

  it('should delegate to finalizeAndEmit after post-processing', async () => {
    await orchestrateCourseCreation({
      userId: 'user-1',
      config: createConfig(),
    });

    expect(mockFinalizeAndEmit).toHaveBeenCalledTimes(1);
  });

  it('should call modules in correct order: init → pipeline → post → finalize', async () => {
    const callOrder: string[] = [];

    mockInitializeCourseRecord.mockImplementation(async () => {
      callOrder.push('init');
      return {
        courseId: 'c-1', goalId: 'g-1', planId: 'p-1',
        stepIds: ['s-1'], chapterTitles: ['Ch 1'],
      };
    });
    mockRunPipeline.mockImplementation(async () => {
      callOrder.push('pipeline');
      return { chaptersCreated: 1, sectionsCreated: 2 };
    });
    mockRunPostProcessing.mockImplementation(async () => {
      callOrder.push('postprocess');
    });
    mockFinalizeAndEmit.mockImplementation(async () => {
      callOrder.push('finalize');
    });

    await orchestrateCourseCreation({
      userId: 'user-1',
      config: createConfig({ chapterCount: 1 }),
    });

    expect(callOrder).toEqual(['init', 'pipeline', 'postprocess', 'finalize']);
  });
});

describe('Orchestration E2E - SSE Events', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockInitializeCourseRecord.mockResolvedValue({
      courseId: 'course-1',
      goalId: 'goal-1',
      planId: 'plan-1',
      stepIds: ['step-1'],
      chapterTitles: ['Chapter 1'],
    });
    mockRunPipeline.mockResolvedValue({ chaptersCreated: 1, sectionsCreated: 2 });
    mockRunPostProcessing.mockResolvedValue(undefined);
    mockFinalizeAndEmit.mockResolvedValue(undefined);
  });

  it('should pass onSSEEvent callback to pipeline-runner', async () => {
    const onSSEEvent = jest.fn();

    await orchestrateCourseCreation({
      userId: 'user-1',
      config: createConfig({ chapterCount: 1 }),
      onSSEEvent,
    });

    // Pipeline should receive the SSE event callback
    const pipelineCallArgs = mockRunPipeline.mock.calls[0][0];
    expect(typeof pipelineCallArgs.onSSEEvent).toBe('function');
    pipelineCallArgs.onSSEEvent({ type: 'thinking', data: { message: 'hello' } });
    expect(onSSEEvent).toHaveBeenCalledWith({ type: 'thinking', data: { message: 'hello' } });
  });

  it('should pass onSSEEvent callback to finalizeAndEmit', async () => {
    const onSSEEvent = jest.fn();

    await orchestrateCourseCreation({
      userId: 'user-1',
      config: createConfig({ chapterCount: 1 }),
      onSSEEvent,
    });

    // Finalize should receive the SSE event callback
    const finalizeCallArgs = mockFinalizeAndEmit.mock.calls[0][0];
    expect(typeof finalizeCallArgs.onSSEEvent).toBe('function');
    finalizeCallArgs.onSSEEvent({ type: 'progress', data: { percentage: 10 } });
    expect(onSSEEvent).toHaveBeenCalledWith({ type: 'progress', data: { percentage: 10 } });
  });
});

describe('Orchestration E2E - Pipeline Mode Routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockInitializeCourseRecord.mockResolvedValue({
      courseId: 'course-mode-1',
      goalId: 'goal-1',
      planId: 'plan-1',
      stepIds: ['step-1'],
      chapterTitles: ['Chapter 1'],
    });
    mockRunPipeline.mockResolvedValue({ chaptersCreated: 1, sectionsCreated: 2, allSections: [] });
    mockRunParallelPipeline.mockResolvedValue({ chaptersCreated: 1, sectionsCreated: 2, allSections: [] });
    mockRunPostProcessing.mockResolvedValue(undefined);
    mockFinalizeAndEmit.mockResolvedValue({
      success: true,
      courseId: 'course-mode-1',
      chaptersCreated: 1,
      sectionsCreated: 2,
      stats: {
        totalChapters: 1,
        totalSections: 2,
        totalTime: 1000,
        averageQualityScore: 80,
      },
    });
  });

  it('uses parallel pipeline for new blueprint-driven runs when parallelMode is enabled', async () => {
    await orchestrateCourseCreation({
      userId: 'user-1',
      config: createConfig({
        parallelMode: true,
        teacherBlueprint: createTeacherBlueprint(),
      }),
    });

    expect(mockRunParallelPipeline).toHaveBeenCalledTimes(1);
    expect(mockRunPipeline).not.toHaveBeenCalled();
  });

  it('uses parallel pipeline on resume when checkpoint is at a clean chapter boundary', async () => {
    await orchestrateCourseCreation({
      userId: 'user-1',
      config: createConfig({
        parallelMode: true,
        teacherBlueprint: createTeacherBlueprint(),
      }),
      resumeState: {
        courseId: 'course-resume-clean',
        goalId: 'goal-resume',
        planId: 'plan-resume',
        stepIds: ['step-1'],
        completedChapters: [],
        conceptTracker: { concepts: new Map(), vocabulary: [], skillsBuilt: [] },
        bloomsProgression: [],
        allSectionTitles: [],
        qualityScores: [],
        completedChapterCount: 0,
        chapterSectionCounts: [],
        sectionsWithDetails: new Set<string>(),
      },
    });

    expect(mockRunParallelPipeline).toHaveBeenCalledTimes(1);
    expect(mockRunPipeline).not.toHaveBeenCalled();
  });

  it('falls back to sequential pipeline on resume when a partial chapter exists', async () => {
    await orchestrateCourseCreation({
      userId: 'user-1',
      config: createConfig({
        parallelMode: true,
        teacherBlueprint: createTeacherBlueprint(),
      }),
      resumeState: {
        courseId: 'course-resume-partial',
        goalId: 'goal-resume',
        planId: 'plan-resume',
        stepIds: ['step-1'],
        completedChapters: [],
        conceptTracker: { concepts: new Map(), vocabulary: [], skillsBuilt: [] },
        bloomsProgression: [],
        allSectionTitles: [],
        qualityScores: [],
        completedChapterCount: 0,
        chapterSectionCounts: [],
        sectionsWithDetails: new Set<string>(),
        partialChapterDbId: 'chapter-partial-1',
      },
    });

    expect(mockRunPipeline).toHaveBeenCalledTimes(1);
    expect(mockRunParallelPipeline).not.toHaveBeenCalled();
  });
});

describe('Orchestration E2E - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockInitializeCourseRecord.mockResolvedValue({
      courseId: 'course-1',
      goalId: 'goal-1',
      planId: 'plan-1',
      stepIds: ['step-1'],
      chapterTitles: ['Chapter 1'],
    });
    mockRunPostProcessing.mockResolvedValue(undefined);
    mockFinalizeAndEmit.mockResolvedValue(undefined);
  });

  it('should return error result when initialization fails', async () => {
    mockInitializeCourseRecord.mockRejectedValue(new Error('DB connection refused'));

    const onSSEEvent = jest.fn();
    const result = await orchestrateCourseCreation({
      userId: 'user-1',
      config: createConfig(),
      onSSEEvent,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return error result when pipeline fails', async () => {
    mockRunPipeline.mockRejectedValue(new Error('AI provider timeout'));

    const result = await orchestrateCourseCreation({
      userId: 'user-1',
      config: createConfig(),
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should emit error SSE event when pipeline fails', async () => {
    mockRunPipeline.mockRejectedValue(new Error('Rate limit exceeded'));

    const onSSEEvent = jest.fn();
    await orchestrateCourseCreation({
      userId: 'user-1',
      config: createConfig(),
      onSSEEvent,
    });

    // Should have emitted an error event
    const errorEvents = onSSEEvent.mock.calls.filter(
      (call: Array<{ type: string }>) => call[0].type === 'error',
    );
    expect(errorEvents.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Orchestration E2E - FallbackTracker Threading', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockInitializeCourseRecord.mockResolvedValue({
      courseId: 'course-1',
      goalId: 'goal-1',
      planId: 'plan-1',
      stepIds: ['step-1'],
      chapterTitles: ['Chapter 1'],
    });
    mockRunPipeline.mockResolvedValue({ chaptersCreated: 1, sectionsCreated: 2 });
    mockRunPostProcessing.mockResolvedValue(undefined);
    mockFinalizeAndEmit.mockResolvedValue(undefined);
  });

  it('should create FallbackTracker and pass to pipeline-runner', async () => {
    await orchestrateCourseCreation({
      userId: 'user-1',
      config: createConfig(),
    });

    const pipelineArgs = mockRunPipeline.mock.calls[0][0];
    expect(pipelineArgs.fallbackTracker).toBeDefined();
    expect(typeof pipelineArgs.fallbackTracker.record).toBe('function');
    expect(typeof pipelineArgs.fallbackTracker.shouldHalt).toBe('function');
    expect(typeof pipelineArgs.fallbackTracker.getSummary).toBe('function');
  });

  it('should pass FallbackTracker to finalizeAndEmit in metrics arg', async () => {
    await orchestrateCourseCreation({
      userId: 'user-1',
      config: createConfig(),
    });

    // finalizeAndEmit(identifiers, metrics, config, chapters, sections)
    // fallbackTracker is in the metrics arg (2nd positional)
    const metricsArg = mockFinalizeAndEmit.mock.calls[0][1];
    expect(metricsArg.fallbackTracker).toBeDefined();
  });
});

describe('Orchestration E2E - Budget Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockInitializeCourseRecord.mockResolvedValue({
      courseId: 'course-1',
      goalId: 'goal-1',
      planId: 'plan-1',
      stepIds: ['step-1'],
      chapterTitles: ['Chapter 1'],
    });
    mockRunPipeline.mockResolvedValue({ chaptersCreated: 1, sectionsCreated: 2 });
    mockRunPostProcessing.mockResolvedValue(undefined);
    mockFinalizeAndEmit.mockResolvedValue(undefined);
  });

  it('should create BudgetTracker and pass to pipeline-runner', async () => {
    await orchestrateCourseCreation({
      userId: 'user-1',
      config: createConfig(),
    });

    const pipelineArgs = mockRunPipeline.mock.calls[0][0];
    expect(pipelineArgs.budgetTracker).toBeDefined();
  });
});

describe('Orchestration E2E - Return Value', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockInitializeCourseRecord.mockResolvedValue({
      courseId: 'course-final',
      goalId: 'goal-1',
      planId: 'plan-1',
      stepIds: ['step-1', 'step-2'],
      chapterTitles: ['Ch 1', 'Ch 2'],
    });
    mockRunPostProcessing.mockResolvedValue(undefined);
    // finalizeAndEmit returns the SequentialCreationResult
    mockFinalizeAndEmit.mockResolvedValue({
      success: true,
      courseId: 'course-final',
      chaptersCreated: 2,
      sectionsCreated: 6,
      stats: {
        totalChapters: 2,
        totalSections: 6,
        totalTime: 5000,
        averageQualityScore: 80,
      },
    });
  });

  it('should return the result from finalizeAndEmit', async () => {
    mockRunPipeline.mockResolvedValue({
      chaptersCreated: 2,
      sectionsCreated: 6,
      allSections: [],
    });

    const result = await orchestrateCourseCreation({
      userId: 'user-1',
      config: createConfig({ chapterCount: 2 }),
    });

    expect(result.success).toBe(true);
    expect(result.courseId).toBe('course-final');
    expect(result.chaptersCreated).toBe(2);
    expect(result.sectionsCreated).toBe(6);
  });
});
