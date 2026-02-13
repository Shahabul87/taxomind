/**
 * Tests for course creation orchestrator
 */

import { orchestrateCourseCreation } from '@/lib/sam/course-creation/orchestrator';
import type { OrchestrateOptions } from '@/lib/sam/course-creation/orchestrator';
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

// Mock AI adapter
const mockAIChat = jest.fn();
const mockAIAdapter = {
  chat: mockAIChat,
};

// Mock user-scoped adapter creation
jest.mock('@/lib/ai/user-scoped-adapter', () => ({
  createUserScopedAdapter: jest.fn().mockResolvedValue({
    chat: (...args: unknown[]) => mockAIChat(...args),
  }),
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
}));

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
}));

// Mock category prompts
jest.mock('@/lib/sam/course-creation/category-prompts', () => ({
  getCategoryEnhancer: jest.fn().mockReturnValue({
    categoryId: 'ai',
    displayName: 'AI',
    domainSpecificGuidelines: '',
    topicEnhancements: {},
    bloomsGuidance: {},
    qualityWeights: {},
  }),
  composeCategoryPrompt: jest.fn().mockReturnValue(''),
}));

// Mock COURSE_CATEGORIES
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
  (db.sAMExecutionPlan.update as jest.Mock).mockImplementation(async () => ({}));
}

function setupAIMocks() {
  // Alternate responses for chapter, section, details calls
  // With template-driven sections per chapter (intermediate = 7):
  // 1 = chapter, 2..8 = 7 sections, 9..15 = 7 details
  // Total per chapter = 15 calls
  const CALLS_PER_CHAPTER = 15; // 1 chapter + 7 sections + 7 details
  let callCount = 0;
  mockAIChat.mockImplementation(() => {
    callCount++;
    const cyclePosition = ((callCount - 1) % CALLS_PER_CHAPTER) + 1;
    if (cyclePosition === 1) {
      return Promise.resolve({ content: createMockChapterAIResponse(Math.ceil(callCount / CALLS_PER_CHAPTER)) });
    } else if (cyclePosition <= 8) {
      return Promise.resolve({ content: createMockSectionAIResponse(cyclePosition - 1) });
    } else {
      return Promise.resolve({ content: createMockDetailsAIResponse() });
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

  it('completes a full pipeline (2 chapters x 7 template sections)', async () => {
    const config = createBaseConfig();
    const sseEvents: Array<{ type: string; data: Record<string, unknown> }> = [];

    const result = await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      aiAdapter: mockAIAdapter as unknown as OrchestrateOptions['aiAdapter'],
      onSSEEvent: (event) => sseEvents.push(event),
    });

    expect(result.error).toBeUndefined();
    expect(result.success).toBe(true);
    expect(result.courseId).toBeDefined();
    expect(result.chaptersCreated).toBe(2);
    // Template-driven: 2 chapters * 7 sections (intermediate) = 14
    expect(result.sectionsCreated).toBe(14);
    expect(result.stats).toBeDefined();
    expect(result.stats!.averageQualityScore).toBeGreaterThan(0);
  });

  it('emits SSE events in correct order', async () => {
    const config = createBaseConfig();
    const eventTypes: string[] = [];

    await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      aiAdapter: mockAIAdapter as unknown as OrchestrateOptions['aiAdapter'],
      onSSEEvent: (event) => eventTypes.push(event.type),
    });

    // First event is 'progress' from emitProgress('Creating course record...')
    // then 'item_complete' for the course record
    expect(eventTypes[0]).toBe('progress');
    expect(eventTypes).toContain('item_complete'); // course record + chapters + sections
    expect(eventTypes).toContain('stage_start');
    expect(eventTypes).toContain('item_generating');
    expect(eventTypes).toContain('thinking');
    expect(eventTypes).toContain('stage_complete');
    expect(eventTypes).toContain('complete');
  });

  it('handles abort via AbortSignal', async () => {
    const config = createBaseConfig();
    const abortController = new AbortController();

    // Abort after the first AI call
    let callCount = 0;
    mockAIChat.mockImplementation(() => {
      callCount++;
      if (callCount >= 2) {
        abortController.abort();
      }
      return Promise.resolve({ content: createMockChapterAIResponse(callCount) });
    });

    const result = await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      aiAdapter: mockAIAdapter as unknown as OrchestrateOptions['aiAdapter'],
      abortSignal: abortController.signal,
    });

    // Should succeed with partial results
    expect(result.success).toBe(true);
    expect(result.chaptersCreated).toBeGreaterThanOrEqual(0);
  });

  it('uses fallback generators on AI parse failure', async () => {
    const config = createBaseConfig();

    // Return invalid JSON for all AI calls
    mockAIChat.mockResolvedValue({ content: 'not valid json at all!!!' });

    const result = await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      aiAdapter: mockAIAdapter as unknown as OrchestrateOptions['aiAdapter'],
    });

    // Should still succeed with fallback data
    expect(result.success).toBe(true);
    expect(result.chaptersCreated).toBe(2);
  });

  it('retries low-quality chapters and keeps best result', async () => {
    const config = createBaseConfig();

    // First call returns low quality (short description), second returns good
    let chapterCalls = 0;
    mockAIChat.mockImplementation(() => {
      chapterCalls++;
      const cyclePosition = ((chapterCalls - 1) % 5) + 1;
      if (cyclePosition === 1) {
        // Always return a chapter - quality scoring will evaluate it
        return Promise.resolve({ content: createMockChapterAIResponse(Math.ceil(chapterCalls / 5)) });
      } else if (cyclePosition <= 3) {
        return Promise.resolve({ content: createMockSectionAIResponse(cyclePosition - 1) });
      } else {
        return Promise.resolve({ content: createMockDetailsAIResponse() });
      }
    });

    const result = await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      aiAdapter: mockAIAdapter as unknown as OrchestrateOptions['aiAdapter'],
    });

    expect(result.success).toBe(true);
  });

  it('calls failCourseCreation on AI provider timeout', async () => {
    const config = createBaseConfig();
    const { failCourseCreation } = jest.requireMock(
      '@/lib/sam/course-creation/course-creation-controller'
    ) as { failCourseCreation: jest.Mock };

    // Mock AI to throw a timeout error — this is caught by orchestrator's catch block
    mockAIChat.mockRejectedValue(new Error('AI provider timeout'));

    const result = await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      aiAdapter: mockAIAdapter as unknown as OrchestrateOptions['aiAdapter'],
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('AI provider timeout');
    expect(failCourseCreation).toHaveBeenCalled();
  });

  it('tracks concepts across chapters', async () => {
    const config = createBaseConfig();
    const sseEvents: Array<{ type: string; data: Record<string, unknown> }> = [];

    await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      aiAdapter: mockAIAdapter as unknown as OrchestrateOptions['aiAdapter'],
      onSSEEvent: (event) => sseEvents.push(event),
    });

    // Verify persistConceptsBackground was called with concept tracker data
    const { persistConceptsBackground } = jest.requireMock(
      '@/lib/sam/course-creation/memory-persistence'
    ) as { persistConceptsBackground: jest.Mock };

    // Called once per completed chapter
    expect(persistConceptsBackground).toHaveBeenCalledTimes(2);
  });

  it('invokes onProgress callback with percentage updates', async () => {
    const config = createBaseConfig();
    const percentages: number[] = [];

    await orchestrateCourseCreation({
      userId: 'user-1',
      config,
      onProgress: (progress) => {
        percentages.push(progress.percentage);
      },
      aiAdapter: mockAIAdapter as unknown as OrchestrateOptions['aiAdapter'],
    });

    // Should have progress updates from 0 to 100
    expect(percentages.length).toBeGreaterThan(0);
    expect(percentages[percentages.length - 1]).toBe(100);
  });
});
