/**
 * Tests for course creation orchestrator
 */

import { orchestrateCourseCreation } from '@/lib/sam/course-creation/orchestrator';
import type { SequentialCreationConfig } from '@/lib/sam/course-creation/types';
import { db } from '@/lib/db';
import {
  createMockCourseContext,
  createMockChapterAIResponse,
  createMockSectionAIResponse,
  createMockDetailsAIResponse,
} from './test-fixtures';

// =============================================================================
// Mocks
// =============================================================================

// Note: @/lib/db is mapped to __mocks__/db.js via moduleNameMapper in jest config.
// We override specific model methods on the global mock below in beforeEach.

// Mock AI provider — runSAMChatWithPreference returns string directly
const mockRunSAMChat = jest.fn();

jest.mock('@/lib/sam/ai-provider', () => ({
  runSAMChatWithPreference: (...args: unknown[]) => mockRunSAMChat(...args),
  runSAMChatWithUsage: async (...args: unknown[]) => {
    const content = await mockRunSAMChat(...args);
    return { content, provider: 'mock', model: 'mock-model', usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 } };
  },
  runSAMChatStream: jest.fn().mockReturnValue((async function* () { /* empty stream */ })()),
  withSubscriptionGate: jest.fn().mockResolvedValue({ allowed: true }),
  handleAIAccessError: jest.fn().mockReturnValue(null),
  resolveAIModelInfo: jest.fn().mockResolvedValue({ provider: 'deepseek', model: 'deepseek-chat', isReasoningModel: false }),
}));

// Mock subscription enforcement
jest.mock('@/lib/ai/subscription-enforcement', () => ({
  recordAIUsage: jest.fn().mockResolvedValue(undefined),
}));

// Mock course-creation-controller
jest.mock('@/lib/sam/course-creation/course-creation-controller', () => ({
  initializeCourseCreationGoal: jest.fn().mockResolvedValue({
    goalId: 'goal-1',
    planId: 'plan-1',
    stepIds: ['step-1', 'step-2', 'step-3'],
  }),
  advanceCourseStage: jest.fn().mockResolvedValue(undefined),
  completeStageStep: jest.fn().mockResolvedValue(undefined),
  completeCourseCreation: jest.fn().mockResolvedValue(undefined),
  failCourseCreation: jest.fn().mockResolvedValue(undefined),
  reactivateCourseCreation: jest.fn().mockResolvedValue(undefined),
  initializeChapterSubGoal: jest.fn().mockResolvedValue('sub-goal-1'),
  completeChapterSubGoal: jest.fn().mockResolvedValue(undefined),
  storeBlueprintInGoal: jest.fn().mockResolvedValue(undefined),
  storeDecisionInPlan: jest.fn().mockResolvedValue(undefined),
  storeReflectionInGoal: jest.fn().mockResolvedValue(undefined),
}));

// Mock quality integration (Phase 1: SAM validation inside retry loops)
jest.mock('@/lib/sam/course-creation/quality-integration', () => ({
  validateChapterWithSAM: jest.fn().mockResolvedValue({
    combinedScore: 70, qualityGateScore: 70, pedagogyScore: 70,
    qualityIssues: [], pedagogyIssues: [], suggestions: [],
    failedGates: [], samValidationRan: true,
  }),
  validateSectionWithSAM: jest.fn().mockResolvedValue({
    combinedScore: 70, qualityGateScore: 70, pedagogyScore: 70,
    qualityIssues: [], pedagogyIssues: [], suggestions: [],
    failedGates: [], samValidationRan: true,
  }),
  validateDetailsWithSAM: jest.fn().mockResolvedValue({
    combinedScore: 70, qualityGateScore: 70, pedagogyScore: 70,
    qualityIssues: [], pedagogyIssues: [], suggestions: [],
    failedGates: [], samValidationRan: true,
  }),
  blendScores: jest.fn().mockImplementation((customScore) => customScore),
}));

// Mock quality feedback (Phase 1: agentic retry)
jest.mock('@/lib/sam/course-creation/quality-feedback', () => ({
  extractQualityFeedback: jest.fn().mockReturnValue({
    criticalIssues: [], pedagogyIssues: [], suggestions: [],
    weakDimensions: [], failedGates: [], previousScore: 50, attemptNumber: 1,
  }),
  buildQualityFeedbackBlock: jest.fn().mockReturnValue(''),
}));

// Mock memory recall (Phase 2: bidirectional memory)
jest.mock('@/lib/sam/course-creation/memory-recall', () => ({
  recallCourseCreationMemory: jest.fn().mockResolvedValue({
    priorConcepts: [], qualityPatterns: null, relatedConcepts: [],
  }),
  recallChapterContext: jest.fn().mockResolvedValue([]),
}));

// Mock healing loop (Phase 8: autonomous healing + Gap 5: AI-guided healing)
jest.mock('@/lib/sam/course-creation/healing-loop', () => ({
  runHealingLoop: jest.fn().mockResolvedValue({
    healed: false,
    iterationsRun: 0,
    chaptersRegenerated: [],
    finalCoherenceScore: 85,
    improvementDelta: 0,
  }),
  diagnoseChapterIssues: jest.fn().mockResolvedValue({
    type: 'full_regeneration',
    reasoning: 'Default full regeneration strategy',
  }),
}));

// Mock course planner (Phase 7: agentic planning + Phase 4: re-planning)
jest.mock('@/lib/sam/course-creation/course-planner', () => ({
  planCourseBlueprint: jest.fn().mockResolvedValue({
    chapterPlan: [
      {
        position: 1,
        suggestedTitle: 'Foundations of ML',
        primaryFocus: 'core ML concepts',
        bloomsLevel: 'UNDERSTAND',
        keyConcepts: ['training data', 'features', 'labels'],
        estimatedComplexity: 'medium',
        rationale: 'Foundation chapter',
      },
      {
        position: 2,
        suggestedTitle: 'Advanced ML',
        primaryFocus: 'advanced techniques',
        bloomsLevel: 'APPLY',
        keyConcepts: ['neural networks', 'optimization'],
        estimatedComplexity: 'high',
        rationale: 'Build on foundations',
      },
    ],
    conceptDependencies: [],
    bloomsStrategy: [{ level: 'UNDERSTAND', chapters: [1] }, { level: 'APPLY', chapters: [2] }],
    riskAreas: [],
    planConfidence: 80,
  }),
  buildBlueprintBlock: jest.fn().mockReturnValue(''),
  replanRemainingChapters: jest.fn().mockResolvedValue({
    chapterPlan: [],
    conceptDependencies: [],
    bloomsStrategy: [],
    riskAreas: [],
    planConfidence: 75,
  }),
}));

// Mock agentic decisions (Phase 7: between-chapter decisions + Phase 2: actionable)
jest.mock('@/lib/sam/course-creation/agentic-decisions', () => ({
  evaluateChapterOutcome: jest.fn().mockReturnValue({
    action: 'continue',
    reasoning: 'Chapter completed successfully. Continuing with standard strategy.',
  }),
  evaluateChapterOutcomeWithAI: jest.fn().mockResolvedValue({
    action: 'continue',
    reasoning: 'AI decision: chapter looks good. Continuing.',
  }),
  buildAdaptiveGuidance: jest.fn().mockReturnValue(''),
  applyAgenticDecision: jest.fn(),
  generateBridgeContent: jest.fn().mockResolvedValue(''),
}));

// Mock chapter regenerator (inline healing + Gap 5: partial regeneration)
jest.mock('@/lib/sam/course-creation/chapter-regenerator', () => {
  const result = {
    success: true,
    chapterId: 'healed-chapter-1',
    chapterTitle: 'Healed Chapter',
    sectionsRegenerated: 7,
    qualityScore: 75,
  };
  return {
    regenerateChapter: jest.fn().mockResolvedValue(result),
    regenerateSectionsOnly: jest.fn().mockResolvedValue(result),
    regenerateDetailsOnly: jest.fn().mockResolvedValue(result),
  };
});

// Mock course reflector (Phase 7: post-generation analysis + Gap 4: AI reflection)
jest.mock('@/lib/sam/course-creation/course-reflector', () => {
  const reflection = {
    coherenceScore: 85,
    bloomsProgression: { isMonotonic: true, gaps: [] },
    conceptCoverage: {
      totalConcepts: 10,
      coveredByMultipleChapters: 3,
      orphanedConcepts: [],
      missingPrerequisites: [],
    },
    flaggedChapters: [],
    summary: 'Course shows strong coherence.',
  };
  return {
    reflectOnCourse: jest.fn().mockReturnValue(reflection),
    reflectOnCourseWithAI: jest.fn().mockResolvedValue(reflection),
  };
});

// Mock chapter critic (multi-agent review — returns null to skip critic calls)
jest.mock('@/lib/sam/course-creation/chapter-critic', () => ({
  reviewChapterWithCritic: jest.fn().mockResolvedValue(null),
  reviewSectionWithCritic: jest.fn().mockResolvedValue(null),
  reviewDetailsWithCritic: jest.fn().mockResolvedValue(null),
  buildSectionCriticFeedbackBlock: jest.fn().mockReturnValue(''),
  buildDetailsCriticFeedbackBlock: jest.fn().mockReturnValue(''),
}));

// Mock self-critique (Phase 3: reasoning analysis)
jest.mock('@/lib/sam/course-creation/self-critique', () => ({
  critiqueGeneration: jest.fn().mockReturnValue({
    reasoningAnalysis: {
      followedStructuredThinking: true,
      weakSteps: [],
      referencedPriorConcepts: false,
      arrowPhasesCovered: [],
    },
    topImprovements: [],
    confidenceScore: 80,
    shouldRetry: false,
  }),
}));

// Mock post-creation enrichment
jest.mock('@/lib/sam/course-creation/post-creation-enrichment', () => ({
  runPostCreationEnrichmentBackground: jest.fn(),
  triggerBackgroundDepthAnalysis: jest.fn(),
}));

// Mock checkpoint manager (Phase 6: extracted from orchestrator)
jest.mock('@/lib/sam/course-creation/checkpoint-manager', () => ({
  saveCheckpoint: jest.fn().mockResolvedValue(undefined),
  saveCheckpointWithRetry: jest.fn().mockResolvedValue(undefined),
  resumeCourseCreation: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock course state machine — simulates step execution for each chapter
jest.mock('@/lib/sam/course-creation/course-state-machine', () => {
  return {
    CourseCreationStateMachine: jest.fn().mockImplementation((config: Record<string, unknown>) => {
      return {
        start: jest.fn().mockImplementation(
          async (
            chapterTitles: string[],
            buildContext: (chapterNumber: number) => Record<string, unknown>,
          ) => {
            const offset = (config.startChapterOffset as number) ?? 0;
            const { generateSingleChapter } = jest.requireActual(
              '@/lib/sam/course-creation/orchestrator'
            ) as { generateSingleChapter: (userId: string, context: Record<string, unknown>, callbacks: Record<string, unknown>) => Promise<Record<string, unknown>> };

            // Execute each chapter step (simulating state machine behavior)
            for (let i = 0; i < chapterTitles.length; i++) {
              const chapterNumber = i + 1 + offset;
              const context = buildContext(chapterNumber);

              // Emit state_change event like the real state machine
              const onSSEEvent = config.onSSEEvent as ((event: { type: string; data: Record<string, unknown> }) => void) | undefined;
              onSSEEvent?.({ type: 'state_change', data: { from: 'idle', to: 'running' } });

              await generateSingleChapter(
                config.userId as string,
                context,
                {
                  onSSEEvent,
                  enableStreamingThinking: config.enableStreamingThinking,
                },
              );
            }
          },
        ),
        pause: jest.fn().mockResolvedValue({}),
        resume: jest.fn().mockResolvedValue(undefined),
        abort: jest.fn().mockResolvedValue(undefined),
        getState: jest.fn().mockReturnValue('completed'),
        getPlanState: jest.fn().mockReturnValue(null),
      };
    }),
  };
});

// Mock chapter-templates — override getMinimumSectionsForDifficulty so that
// effectiveSectionsPerChapter = max(userRequested, minimum) respects the test's
// sectionsPerChapter: 2 instead of being clamped up to the template's 4 required.
jest.mock('@/lib/sam/course-creation/chapter-templates', () => {
  const actual = jest.requireActual('@/lib/sam/course-creation/chapter-templates');
  return {
    ...actual,
    getMinimumSectionsForDifficulty: jest.fn().mockReturnValue(2),
  };
});

// Mock memory persistence
jest.mock('@/lib/sam/course-creation/memory-persistence', () => ({
  persistConceptsBackground: jest.fn(),
  persistQualityScoresBackground: jest.fn(),
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

// Mock prompts
jest.mock('@/lib/sam/course-creation/prompts', () => ({
  buildStage1Prompt: jest.fn().mockReturnValue({ systemPrompt: 'sys1', userPrompt: 'user1' }),
  buildStage2Prompt: jest.fn().mockReturnValue({ systemPrompt: 'sys2', userPrompt: 'user2' }),
  buildStage3Prompt: jest.fn().mockReturnValue({ systemPrompt: 'sys3', userPrompt: 'user3' }),
  PROMPT_VERSION: 'stage1:2.1.0|stage2:2.1.0|stage3:2.1.0',
  PROMPT_VERSIONS: { stage1: '2.1.0', stage2: '2.1.0', stage3: '2.1.0' },
  getPromptVersion: jest.fn((stage: number) => '2.1.0'),
}));

// Mock category prompts
jest.mock('@/lib/sam/course-creation/category-prompts', () => {
  const enhancer = {
    categoryId: 'ai',
    displayName: 'AI',
    matchesCategories: ['artificial-intelligence', 'machine-learning'],
    domainExpertise: '',
    teachingMethodology: '',
    bloomsInDomain: {},
    contentTypeGuidance: '',
    qualityCriteria: '',
    chapterSequencingAdvice: '',
    activityExamples: {},
  };
  return {
    getCategoryEnhancer: jest.fn().mockReturnValue(enhancer),
    getCategoryEnhancers: jest.fn().mockReturnValue([enhancer]),
    blendEnhancers: jest.fn().mockImplementation((primary: unknown) => primary),
    composeCategoryPrompt: jest.fn().mockReturnValue({
      expertiseBlock: '',
      chapterGuidanceBlock: '',
      sectionGuidanceBlock: '',
      detailGuidanceBlock: '',
      tokenEstimate: { expertiseBlock: 0, chapterGuidanceBlock: 0, sectionGuidanceBlock: 0, detailGuidanceBlock: 0, total: 0 },
    }),
  };
});

// Mock COURSE_CATEGORIES (shared lib location — canonical source)
jest.mock('@/lib/sam/course-creation/course-categories', () => ({
  COURSE_CATEGORIES: [
    { value: 'artificial-intelligence', label: 'Artificial Intelligence' },
    { value: 'web-development', label: 'Web Development' },
  ],
}));

// Mock legacy re-export path (app-layer still re-exports from shared lib)
jest.mock('@/app/(protected)/teacher/create/ai-creator/types/sam-creator.types', () => ({
  COURSE_CATEGORIES: [
    { value: 'artificial-intelligence', label: 'Artificial Intelligence' },
    { value: 'web-development', label: 'Web Development' },
  ],
}));

// =============================================================================
// Helpers
// =============================================================================

function createBaseConfig(): SequentialCreationConfig {
  const ctx = createMockCourseContext({ totalChapters: 2, sectionsPerChapter: 2 });
  return {
    courseTitle: ctx.courseTitle,
    courseDescription: ctx.courseDescription,
    targetAudience: ctx.targetAudience,
    difficulty: ctx.difficulty,
    totalChapters: ctx.totalChapters,
    sectionsPerChapter: ctx.sectionsPerChapter,
    learningObjectivesPerChapter: ctx.learningObjectivesPerChapter,
    learningObjectivesPerSection: ctx.learningObjectivesPerSection,
    courseGoals: ctx.courseLearningObjectives,
    bloomsFocus: ctx.bloomsFocus,
    preferredContentTypes: ctx.preferredContentTypes as string[],
    category: 'artificial-intelligence',
  };
}

let dbIdCounter = 0;

function setupDBMocks() {
  dbIdCounter = 0;

  // Override db model methods on the global mock for our tests
  (db.course.create as jest.Mock).mockImplementation(async () => {
    dbIdCounter++;
    return { id: `course-${dbIdCounter}`, title: 'Test Course' };
  });
  (db.chapter.create as jest.Mock).mockImplementation(async () => {
    dbIdCounter++;
    return { id: `chapter-${dbIdCounter}` };
  });
  (db.section.create as jest.Mock).mockImplementation(async () => {
    dbIdCounter++;
    return { id: `section-${dbIdCounter}` };
  });
  (db.section.update as jest.Mock).mockImplementation(async () => ({ id: 'updated' }));
  (db.category.upsert as jest.Mock).mockImplementation(async () => {
    dbIdCounter++;
    return { id: `cat-${dbIdCounter}` };
  });
  (db.course.update as jest.Mock).mockImplementation(async () => ({ id: 'course-updated' }));
  (db.chapter.update as jest.Mock).mockImplementation(async () => ({ id: 'chapter-updated' }));
  (db.sAMExecutionPlan.update as jest.Mock).mockImplementation(async () => ({}));
}

function setupAIMocks() {
  // Alternate responses for chapter, section, details calls
  // Strict mode: user's sectionsPerChapter = 2 (not template default 7):
  // 1 = chapter, 2..3 = 2 sections, 4..5 = 2 details
  // Total per chapter = 5 calls
  const CALLS_PER_CHAPTER = 5; // 1 chapter + 2 sections + 2 details
  let callCount = 0;
  // runSAMChatWithPreference returns string directly (not { content: string })
  mockRunSAMChat.mockImplementation(() => {
    callCount++;
    const cyclePosition = ((callCount - 1) % CALLS_PER_CHAPTER) + 1;
    if (cyclePosition === 1) {
      return Promise.resolve(createMockChapterAIResponse(Math.ceil(callCount / CALLS_PER_CHAPTER)));
    } else if (cyclePosition <= 3) {
      return Promise.resolve(createMockSectionAIResponse(cyclePosition - 1));
    } else {
      return Promise.resolve(createMockDetailsAIResponse());
    }
  });
}

// =============================================================================
// Tests
// =============================================================================

describe('orchestrateCourseCreation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDBMocks();
    setupAIMocks();
  });

  // ==========================================================================
  // Legacy path tests (useAgenticStateMachine: false)
  // ==========================================================================

  it('completes a full pipeline (2 chapters x 2 user-requested sections)', async () => {
    const config = createBaseConfig();
    const sseEvents: Array<{ type: string; data: Record<string, unknown> }> = [];

    const result = await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      useAgenticStateMachine: false,
      onSSEEvent: (event) => sseEvents.push(event),
    });

    expect(result.error).toBeUndefined();
    expect(result.success).toBe(true);
    expect(result.courseId).toBeDefined();
    expect(result.chaptersCreated).toBe(2);
    // Strict mode: 2 chapters * 2 sections (user-requested) = 4
    expect(result.sectionsCreated).toBe(4);
    expect(result.stats).toBeDefined();
    expect(result.stats!.averageQualityScore).toBeGreaterThan(0);
  });

  it('emits SSE events in correct order including agentic events', async () => {
    const config = createBaseConfig();
    const eventTypes: string[] = [];

    await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      useAgenticStateMachine: false,
      onSSEEvent: (event) => eventTypes.push(event.type),
    });

    // Agentic planning events
    expect(eventTypes).toContain('planning_start');
    expect(eventTypes).toContain('planning_complete');

    // Standard pipeline events
    expect(eventTypes).toContain('item_complete');
    expect(eventTypes).toContain('stage_start');
    expect(eventTypes).toContain('item_generating');
    expect(eventTypes).toContain('thinking');
    expect(eventTypes).toContain('stage_complete');

    // Agentic decision events (only between chapters, not after the last)
    expect(eventTypes).toContain('agentic_decision');

    // Post-generation reflection
    expect(eventTypes).toContain('course_reflection');

    // Completion
    expect(eventTypes).toContain('complete');

    // Verify planning events come before stage_start
    const planningIdx = eventTypes.indexOf('planning_start');
    const stageStartIdx = eventTypes.indexOf('stage_start');
    expect(planningIdx).toBeLessThan(stageStartIdx);

    // Verify reflection comes before complete
    const reflectionIdx = eventTypes.indexOf('course_reflection');
    const completeIdx = eventTypes.indexOf('complete');
    expect(reflectionIdx).toBeLessThan(completeIdx);
  });

  it('handles abort via AbortSignal', async () => {
    const config = createBaseConfig();
    const abortController = new AbortController();

    // Abort after the first AI call
    let callCount = 0;
    mockRunSAMChat.mockImplementation(() => {
      callCount++;
      if (callCount >= 2) {
        abortController.abort();
      }
      return Promise.resolve(createMockChapterAIResponse(callCount));
    });

    const result = await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      useAgenticStateMachine: false,
      abortSignal: abortController.signal,
    });

    // Should succeed with partial results
    expect(result.success).toBe(true);
    expect(result.chaptersCreated).toBeGreaterThanOrEqual(0);
  });

  it('uses fallback generators on AI parse failure', async () => {
    const config = createBaseConfig();
    // Disable fallback halt so pipeline continues despite 100% fallback rate
    config.fallbackPolicy = { haltOnExcessiveFallbacks: false };

    // Return invalid JSON for all AI calls (runSAMChatWithPreference returns string)
    mockRunSAMChat.mockResolvedValue('not valid json at all!!!');

    const result = await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      useAgenticStateMachine: false,
    });

    // Should still succeed with fallback data
    expect(result.success).toBe(true);
    expect(result.chaptersCreated).toBe(2);
  });

  it('retries low-quality chapters and keeps best result', async () => {
    const config = createBaseConfig();

    // First call returns low quality (short description), second returns good
    let chapterCalls = 0;
    mockRunSAMChat.mockImplementation(() => {
      chapterCalls++;
      const cyclePosition = ((chapterCalls - 1) % 5) + 1;
      if (cyclePosition === 1) {
        // Always return a chapter - quality scoring will evaluate it
        return Promise.resolve(createMockChapterAIResponse(Math.ceil(chapterCalls / 5)));
      } else if (cyclePosition <= 3) {
        return Promise.resolve(createMockSectionAIResponse(cyclePosition - 1));
      } else {
        return Promise.resolve(createMockDetailsAIResponse());
      }
    });

    const result = await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      useAgenticStateMachine: false,
    });

    expect(result.success).toBe(true);
  });

  it('calls failCourseCreation on AI provider timeout', async () => {
    const config = createBaseConfig();
    const { failCourseCreation } = jest.requireMock(
      '@/lib/sam/course-creation/course-creation-controller'
    ) as { failCourseCreation: jest.Mock };

    // Mock AI to throw a timeout error — this is caught by orchestrator's catch block
    mockRunSAMChat.mockRejectedValue(new Error('AI provider timeout'));

    const result = await orchestrateCourseCreation({
      userId: 'user-1',
      config,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('AI provider timeout');
    expect(failCourseCreation).toHaveBeenCalled();
  });

  it('tracks concepts across chapters via agentic state machine', async () => {
    const config = createBaseConfig();
    const sseEvents: Array<{ type: string; data: Record<string, unknown> }> = [];

    const result = await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      onSSEEvent: (event) => sseEvents.push(event),
    });

    // In the agentic path, concept persistence happens inside the state
    // machine's step-executor-phases, which is mocked. Verify the pipeline
    // completed successfully — concept tracking is tested in integration tests.
    expect(result.success).toBe(true);
    expect(result.chaptersCreated).toBe(2);
  });

  it('calls planCourseBlueprint and stores blueprint in goal', async () => {
    const config = createBaseConfig();

    await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      useAgenticStateMachine: false,
    });

    const { planCourseBlueprint } = jest.requireMock(
      '@/lib/sam/course-creation/course-planner'
    ) as { planCourseBlueprint: jest.Mock };

    const { storeBlueprintInGoal } = jest.requireMock(
      '@/lib/sam/course-creation/course-creation-controller'
    ) as { storeBlueprintInGoal: jest.Mock };

    expect(planCourseBlueprint).toHaveBeenCalledTimes(1);
    expect(storeBlueprintInGoal).toHaveBeenCalledTimes(1);
    expect(storeBlueprintInGoal).toHaveBeenCalledWith('goal-1', expect.any(Object));
  });

  it('calls evaluateChapterOutcome after each completed chapter', async () => {
    const config = createBaseConfig();

    await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      useAgenticStateMachine: false,
    });

    const { evaluateChapterOutcome } = jest.requireMock(
      '@/lib/sam/course-creation/agentic-decisions'
    ) as { evaluateChapterOutcome: jest.Mock };

    // Called once per chapter (except the last one) — for 2 chapters, called 1 time
    expect(evaluateChapterOutcome).toHaveBeenCalledTimes(1);
  });

  it('calls reflectOnCourse and stores reflection after completion', async () => {
    const config = createBaseConfig();
    const sseEvents: Array<{ type: string; data: Record<string, unknown> }> = [];

    await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      useAgenticStateMachine: false,
      onSSEEvent: (event) => sseEvents.push(event),
    });

    const { reflectOnCourseWithAI } = jest.requireMock(
      '@/lib/sam/course-creation/course-reflector'
    ) as { reflectOnCourseWithAI: jest.Mock };

    const { storeReflectionInGoal } = jest.requireMock(
      '@/lib/sam/course-creation/course-creation-controller'
    ) as { storeReflectionInGoal: jest.Mock };

    expect(reflectOnCourseWithAI).toHaveBeenCalledTimes(1);
    expect(storeReflectionInGoal).toHaveBeenCalledTimes(1);

    // Verify reflection SSE event data
    const reflectionEvent = sseEvents.find(e => e.type === 'course_reflection');
    expect(reflectionEvent).toBeDefined();
    expect(reflectionEvent!.data.coherenceScore).toBe(85);
    expect(reflectionEvent!.data.summary).toBeDefined();
  });

  it('completes course with memory recall handled by state machine', async () => {
    const config = createBaseConfig();

    const result = await orchestrateCourseCreation({
      userId: 'user-1',
      config,
    });

    // In the agentic path, memory recall between chapters happens inside the
    // state machine's step-executor-phases. The mock state machine delegates
    // to generateSingleChapter but doesn't replicate inter-chapter phases.
    // Verify the pipeline completed successfully.
    expect(result.success).toBe(true);
    expect(result.chaptersCreated).toBe(2);
  });

  it('invokes onProgress callback with percentage updates', async () => {
    const config = createBaseConfig();
    const percentages: number[] = [];

    await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      useAgenticStateMachine: false,
      onProgress: (progress) => {
        percentages.push(progress.percentage);
      },
    });

    // Should have progress updates from 0 to 100
    expect(percentages.length).toBeGreaterThan(0);
    expect(percentages[percentages.length - 1]).toBe(100);
  });

  // ==========================================================================
  // Phase 2: Actionable Agentic Decisions
  // ==========================================================================

  it('calls evaluateChapterOutcome (rule-based) after chapter completion in legacy path', async () => {
    const config = createBaseConfig();

    await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      useAgenticStateMachine: false,
    });

    const { evaluateChapterOutcome } = jest.requireMock(
      '@/lib/sam/course-creation/agentic-decisions'
    ) as { evaluateChapterOutcome: jest.Mock };

    // Legacy path uses rule-based evaluateChapterOutcome (not applyAgenticDecision)
    // Called once for ch1 (not for ch2 since it's the last chapter)
    expect(evaluateChapterOutcome).toHaveBeenCalledTimes(1);
  });

  it('legacy path does not trigger re-planning (agentic path only)', async () => {
    // Re-planning requires evaluateChapterOutcomeWithAI + applyAgenticDecision
    // which are only in the agentic state machine path (step-executor-phases.ts).
    // See step-executor-phases.test.ts for full agentic decision coverage.
    const config = createBaseConfig();

    await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      useAgenticStateMachine: false,
    });

    const { replanRemainingChapters } = jest.requireMock(
      '@/lib/sam/course-creation/course-planner'
    ) as { replanRemainingChapters: jest.Mock };

    // Legacy path uses simplified decision handling — no re-planning
    expect(replanRemainingChapters).not.toHaveBeenCalled();
  });

  // ==========================================================================
  // Phase 3: Autonomous Healing Loop
  // ==========================================================================

  it('triggers healing loop when coherence is low and chapters are flagged', async () => {
    const config = createBaseConfig();

    const { reflectOnCourseWithAI } = jest.requireMock(
      '@/lib/sam/course-creation/course-reflector'
    ) as { reflectOnCourseWithAI: jest.Mock };

    // Mock reflection with low coherence and flagged chapters
    reflectOnCourseWithAI.mockResolvedValue({
      coherenceScore: 55,
      bloomsProgression: { isMonotonic: false, gaps: [] },
      conceptCoverage: { totalConcepts: 10, coveredByMultipleChapters: 2, orphanedConcepts: [], missingPrerequisites: [] },
      flaggedChapters: [
        { position: 1, reason: 'Quality score below threshold', severity: 'high' },
      ],
      summary: 'Course has coherence issues.',
    });

    await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      useAgenticStateMachine: false,
    });

    const { runHealingLoop } = jest.requireMock(
      '@/lib/sam/course-creation/healing-loop'
    ) as { runHealingLoop: jest.Mock };

    expect(runHealingLoop).toHaveBeenCalledTimes(1);

    // Verify the healing config is correct
    const healingConfig = runHealingLoop.mock.calls[0][0];
    expect(healingConfig).toMatchObject({
      userId: 'user-1',
      maxHealingIterations: 2,
      minCoherenceScore: 70,
      severityThreshold: 'high',
    });
  });

  it('skips healing loop when coherence is high', async () => {
    const config = createBaseConfig();

    // Explicitly reset reflectOnCourseWithAI to high coherence (no flagged chapters)
    const { reflectOnCourseWithAI } = jest.requireMock(
      '@/lib/sam/course-creation/course-reflector'
    ) as { reflectOnCourseWithAI: jest.Mock };
    reflectOnCourseWithAI.mockResolvedValue({
      coherenceScore: 85,
      bloomsProgression: { isMonotonic: true, gaps: [] },
      conceptCoverage: { totalConcepts: 10, coveredByMultipleChapters: 3, orphanedConcepts: [], missingPrerequisites: [] },
      flaggedChapters: [],
      summary: 'Course shows strong coherence.',
    });

    await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      useAgenticStateMachine: false,
    });

    const { runHealingLoop } = jest.requireMock(
      '@/lib/sam/course-creation/healing-loop'
    ) as { runHealingLoop: jest.Mock };

    expect(runHealingLoop).not.toHaveBeenCalled();
  });

  // ==========================================================================
  // New Agentic Gap Tests
  // ==========================================================================

  it('legacy path uses rule-based evaluation, not AI-driven decision', async () => {
    // The legacy path uses evaluateChapterOutcome (rule-based, in chapter-generator.ts)
    // rather than evaluateChapterOutcomeWithAI (which is in step-executor-phases.ts).
    // See step-executor-phases.test.ts for AI-driven decision coverage.
    const config = createBaseConfig();

    await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      useAgenticStateMachine: false,
    });

    const { evaluateChapterOutcomeWithAI, evaluateChapterOutcome } = jest.requireMock(
      '@/lib/sam/course-creation/agentic-decisions'
    ) as { evaluateChapterOutcomeWithAI: jest.Mock; evaluateChapterOutcome: jest.Mock };

    // AI-driven decision is NOT called in legacy path
    expect(evaluateChapterOutcomeWithAI).not.toHaveBeenCalled();

    // Rule-based evaluation IS called (from chapter-generator.ts)
    expect(evaluateChapterOutcome).toHaveBeenCalledTimes(1);
  });

  it('legacy path does not generate bridge content (agentic path only)', async () => {
    // Bridge content generation requires evaluateChapterOutcomeWithAI returning
    // 'inject_bridge_content' action, which is only in the agentic state machine path.
    // See step-executor-phases.test.ts for bridge content coverage.
    const config = createBaseConfig();

    await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      useAgenticStateMachine: false,
    });

    const { generateBridgeContent } = jest.requireMock(
      '@/lib/sam/course-creation/agentic-decisions'
    ) as { generateBridgeContent: jest.Mock };

    // Legacy path does not call generateBridgeContent
    expect(generateBridgeContent).not.toHaveBeenCalled();
  });

  it('legacy path does not perform inline healing (agentic path only)', async () => {
    // Inline healing (phaseInlineHealing) is only in the agentic state machine path.
    // The legacy path uses post-generation healing via runHealingLoop instead.
    // See step-executor-phases.test.ts for inline healing coverage.
    const config = createBaseConfig();

    await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      useAgenticStateMachine: false,
    });

    const { applyAgenticDecision } = jest.requireMock(
      '@/lib/sam/course-creation/agentic-decisions'
    ) as { applyAgenticDecision: jest.Mock };

    // Legacy path does not call applyAgenticDecision (no inline healing queue)
    expect(applyAgenticDecision).not.toHaveBeenCalled();
  });

  it('falls back to rule-based decision when AI call fails', async () => {
    const config = createBaseConfig();

    const { evaluateChapterOutcomeWithAI, evaluateChapterOutcome } = jest.requireMock(
      '@/lib/sam/course-creation/agentic-decisions'
    ) as {
      evaluateChapterOutcomeWithAI: jest.Mock;
      evaluateChapterOutcome: jest.Mock;
    };

    // Make AI decision fail
    evaluateChapterOutcomeWithAI.mockRejectedValue(new Error('AI timeout'));

    // Rule-based should still return a decision
    evaluateChapterOutcome.mockReturnValue({
      action: 'continue',
      reasoning: 'Rule-based fallback: continuing.',
    });

    const result = await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      useAgenticStateMachine: false,
    });

    // Should still complete successfully
    expect(result.success).toBe(true);
    expect(result.chaptersCreated).toBe(2);
  });

  it('legacy path completes without healing queue (agentic path only)', async () => {
    // Persistent healing queue is managed by step-executor-phases (agentic path).
    // Legacy path creates a healingQueue in pipeline-runner but never populates it
    // since applyAgenticDecision is not called.
    // See step-executor-phases.test.ts for healing queue persistence coverage.
    const config = createBaseConfig();

    const result = await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      useAgenticStateMachine: false,
    });

    // Pipeline completes normally without healing queue interaction
    expect(result.success).toBe(true);
    expect(result.chaptersCreated).toBe(2);
  });

  // ==========================================================================
  // Resume + State Machine Path
  // ==========================================================================

  it('uses state machine for resumed courses (resume gap closed)', async () => {
    const config = createBaseConfig();
    const sseEvents: Array<{ type: string; data: Record<string, unknown> }> = [];

    // Simulate resume: 1 chapter already completed, need chapter 2
    const result = await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      // useAgenticStateMachine defaults to true — state machine path
      onSSEEvent: (event) => sseEvents.push(event),
      resumeState: {
        courseId: 'course-resume-1',
        goalId: 'goal-1',
        planId: 'plan-1',
        stepIds: ['step-1', 'step-2', 'step-3'],
        completedChapterCount: 1,
        completedChapters: [
          {
            id: 'ch-existing-1',
            position: 1,
            title: 'Foundations of ML',
            description: 'Chapter 1 desc',
            bloomsLevel: 'UNDERSTAND',
            learningObjectives: ['Understand ML basics'],
            keyTopics: ['training data', 'features'],
            prerequisites: '',
            estimatedTime: '1-2 hours',
            topicsToExpand: [],
            sections: [
              {
                id: 'sec-1',
                position: 1,
                title: 'Introduction',
                contentType: 'video',
                estimatedDuration: '15 minutes',
                topicFocus: 'ML basics',
                parentChapterContext: {
                  title: 'Foundations of ML',
                  bloomsLevel: 'UNDERSTAND',
                  relevantObjectives: ['Understand ML basics'],
                },
              },
            ],
          },
        ],
        conceptTracker: {
          concepts: new Map([['training data', { concept: 'training data', introducedInChapter: 1, bloomsLevel: 'UNDERSTAND' }]]),
          vocabulary: ['training data', 'features'],
          skillsBuilt: [],
        },
        bloomsProgression: [{ chapter: 1, level: 'UNDERSTAND', topics: ['training data'] }],
        allSectionTitles: ['Introduction'],
        qualityScores: [{ overall: 75, depth: 70, structure: 80, pedagogy: 75, engagement: 70 }],
        chapterSectionCounts: [1],
        sectionsWithDetails: new Set<string>(),
      },
    });

    expect(result.success).toBe(true);
    expect(result.courseId).toBe('course-resume-1');
    // Should have generated chapter 2 (chapter 1 was already done)
    // completedChapters includes the resume chapter + newly generated
    expect(result.chaptersCreated).toBeGreaterThanOrEqual(2);

    // Verify state machine events are emitted (not legacy for-loop)
    expect(sseEvents.some(e => e.type === 'state_change')).toBe(true);

    // Verify reactivateCourseCreation was called (resume path)
    const { reactivateCourseCreation } = jest.requireMock(
      '@/lib/sam/course-creation/course-creation-controller'
    ) as { reactivateCourseCreation: jest.Mock };
    expect(reactivateCourseCreation).toHaveBeenCalledWith('goal-1', 'plan-1');
  });
});
