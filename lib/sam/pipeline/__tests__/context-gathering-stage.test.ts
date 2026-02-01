/**
 * Context Gathering Stage Tests
 *
 * Tests the entity context extraction, form field transformation,
 * client entity summary builder, and the full runContextGatheringStage flow.
 */

import {
  transformFormFields,
  buildClientEntitySummary,
  runContextGatheringStage,
} from '../context-gathering-stage';
import type { PipelineContext } from '../types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/logger', () => ({
  logger: { warn: jest.fn(), debug: jest.fn(), info: jest.fn() },
}));

jest.mock('@/lib/sam/entity-context', () => ({
  buildEntityContext: jest.fn(),
  buildFormSummary: jest.fn((fields: Record<string, unknown> | undefined) => {
    if (!fields || Object.keys(fields).length === 0) {
      return 'No form data available on this page.';
    }
    return 'Form fields on this page:\n- title: "My Course"';
  }),
}));

jest.mock('@/lib/sam/context-gathering-integration', () => ({
  getContextSummaryForRoute: jest.fn(),
}));

jest.mock('@/lib/sam/agentic-tooling', () => ({
  ensureToolingInitialized: jest.fn(),
}));

import { buildEntityContext } from '@/lib/sam/entity-context';
import { getContextSummaryForRoute } from '@/lib/sam/context-gathering-integration';
import { ensureToolingInitialized } from '@/lib/sam/agentic-tooling';

const mockedBuildEntityContext = buildEntityContext as jest.MockedFunction<typeof buildEntityContext>;
const mockedGetContextSummary = getContextSummaryForRoute as jest.MockedFunction<typeof getContextSummaryForRoute>;
const mockedEnsureTooling = ensureToolingInitialized as jest.MockedFunction<typeof ensureToolingInitialized>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePipelineContext(overrides: Partial<PipelineContext> = {}): PipelineContext {
  return {
    user: { id: 'user-1', name: 'Test', email: 'test@test.com' },
    rateLimitHeaders: {},
    message: 'Hello',
    sessionId: 'session-1',
    pageContext: { type: 'general', path: '/dashboard' },
    modeId: 'general-assistant',
    entityContext: { type: 'none', summary: '' },
    entitySummary: '',
    contextConfidence: 0,
    classifiedIntent: {
      intent: 'question',
      shouldUseTool: false,
      shouldCheckGoals: false,
      shouldCheckInterventions: false,
      toolHints: [],
      confidence: 0.5,
    },
    agenticBridge: {
      getEnabledCapabilities: jest.fn(() => []),
    } as unknown as PipelineContext['agenticBridge'],
    orchestrationResult: null,
    bloomsAnalysis: null,
    bloomsOutput: null,
    qualityResult: null,
    pedagogyResult: null,
    memoryUpdate: null,
    enginesToRun: [],
    tutoringContext: null,
    planContextInjection: null,
    orchestrationData: null,
    memorySessionContext: null,
    sessionResumptionContext: null,
    toolExecution: null,
    responseText: '',
    agenticConfidence: null,
    verificationResult: null,
    safetyResult: null,
    responseGated: false,
    sessionRecorded: false,
    agenticGoalContext: null,
    agenticSkillUpdate: null,
    agenticRecommendations: null,
    interventions: [],
    interventionResults: [],
    proactiveData: null,
    startTime: Date.now(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// transformFormFields (pure helper)
// ---------------------------------------------------------------------------

describe('transformFormFields', () => {
  it('transforms simple scalar values into SAMFormField records', () => {
    const result = transformFormFields({
      title: 'My Course',
      price: 29.99,
      published: true,
    });

    expect(result.title).toEqual({
      name: 'title',
      value: 'My Course',
      type: 'text',
    });

    expect(result.price).toEqual({
      name: 'price',
      value: 29.99,
      type: 'text',
    });

    expect(result.published).toEqual({
      name: 'published',
      value: true,
      type: 'text',
    });
  });

  it('transforms structured field objects with metadata', () => {
    const result = transformFormFields({
      title: {
        value: 'Intro to React',
        type: 'text',
        label: 'Course Title',
        placeholder: 'Enter title...',
        required: true,
      },
    });

    expect(result.title).toEqual({
      name: 'title',
      value: 'Intro to React',
      type: 'text',
      label: 'Course Title',
      placeholder: 'Enter title...',
      required: true,
    });
  });

  it('defaults type to text when not provided in structured field', () => {
    const result = transformFormFields({
      description: { value: 'A course about things' },
    });

    expect(result.description.type).toBe('text');
  });

  it('handles empty fields record', () => {
    const result = transformFormFields({});
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('handles null values correctly', () => {
    const result = transformFormFields({ empty: null });

    // null is not an object, so treated as scalar
    expect(result.empty).toEqual({
      name: 'empty',
      value: null,
      type: 'text',
    });
  });
});

// ---------------------------------------------------------------------------
// buildClientEntitySummary (pure helper)
// ---------------------------------------------------------------------------

describe('buildClientEntitySummary', () => {
  describe('course entity type', () => {
    it('builds summary for a course with title and description', () => {
      const summary = buildClientEntitySummary(
        {
          title: 'Advanced TypeScript',
          description: 'Learn advanced TypeScript patterns',
          isPublished: true,
          chapterCount: 10,
        },
        'course',
      );

      expect(summary).toContain('Course: "Advanced TypeScript"');
      expect(summary).toContain('Description: Learn advanced TypeScript patterns');
      expect(summary).toContain('Chapters: 10');
      expect(summary).toContain('Status: Published');
    });

    it('includes learning objectives when available', () => {
      const summary = buildClientEntitySummary(
        {
          title: 'React Fundamentals',
          whatYouWillLearn: ['Components', 'Hooks', 'State Management', 'Routing'],
          isPublished: false,
        },
        'course',
      );

      expect(summary).toContain('Learning objectives: Components; Hooks; State Management...');
      expect(summary).toContain('Status: Draft');
    });

    it('includes chapter titles when chapters are provided', () => {
      const summary = buildClientEntitySummary(
        {
          title: 'NodeJS Basics',
          chapters: [
            { title: 'Introduction' },
            { title: 'Setup' },
            { title: 'First App' },
          ],
          isPublished: true,
        },
        'course',
      );

      expect(summary).toContain('Chapter titles: Introduction, Setup, First App');
    });

    it('truncates long descriptions at 300 characters', () => {
      const longDescription = 'A'.repeat(400);
      const summary = buildClientEntitySummary(
        { title: 'Test', description: longDescription, isPublished: false },
        'course',
      );

      expect(summary).toContain('Description: ' + 'A'.repeat(300) + '...');
    });
  });

  describe('chapter entity type', () => {
    it('builds summary for a chapter with sections', () => {
      const summary = buildClientEntitySummary(
        {
          title: 'Chapter 1: Setup',
          courseTitle: 'NodeJS Basics',
          description: 'Setting up the environment',
          sectionCount: 3,
          sections: [
            { title: 'Install Node' },
            { title: 'Configure IDE' },
          ],
        },
        'chapter',
      );

      expect(summary).toContain('Chapter: "Chapter 1: Setup"');
      expect(summary).toContain('Part of course: "NodeJS Basics"');
      expect(summary).toContain('Sections: 3');
      expect(summary).toContain('Section titles: Install Node, Configure IDE');
    });
  });

  describe('section entity type', () => {
    it('builds summary for a section with content', () => {
      const summary = buildClientEntitySummary(
        {
          title: 'Installing Node.js',
          chapterTitle: 'Setup',
          courseTitle: 'NodeJS Basics',
          contentType: 'text',
          content: '<p>Download Node.js from the official website.</p>',
          videoUrl: 'https://example.com/video.mp4',
        },
        'section',
      );

      expect(summary).toContain('Section: "Installing Node.js"');
      expect(summary).toContain('Part of chapter: "Setup"');
      expect(summary).toContain('Part of course: "NodeJS Basics"');
      expect(summary).toContain('Content type: text');
      expect(summary).toContain('Content preview: Download Node.js from the official website.');
      expect(summary).toContain('Has video: Yes');
    });

    it('strips HTML tags from content preview', () => {
      const summary = buildClientEntitySummary(
        {
          title: 'HTML Intro',
          content: '<h1>Hello</h1><p>World <strong>bold</strong></p>',
        },
        'section',
      );

      expect(summary).toContain('Content preview: Hello World bold');
    });
  });

  describe('edge cases', () => {
    it('returns fallback text for empty entity data', () => {
      const summary = buildClientEntitySummary({}, 'course');
      // Course always adds Status line
      expect(summary).toContain('Status: Draft');
    });

    it('returns fallback for unknown entity type with no data', () => {
      const summary = buildClientEntitySummary({}, 'unknown');
      expect(summary).toBe('No specific entity context available.');
    });
  });
});

// ---------------------------------------------------------------------------
// runContextGatheringStage (async, with mocks)
// ---------------------------------------------------------------------------

describe('runContextGatheringStage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: no context snapshot, no tooling
    mockedGetContextSummary.mockResolvedValue(null);
    mockedEnsureTooling.mockResolvedValue({
      toolRegistry: {
        listTools: jest.fn().mockResolvedValue([]),
      },
    } as never);
  });

  it('uses client-provided entity data when entityData with title is present', async () => {
    const ctx = makePipelineContext({
      pageContext: {
        type: 'course-detail',
        path: '/courses/abc',
        entityId: 'course-abc',
        entityData: {
          title: 'Client Course',
          description: 'From the client',
          isPublished: true,
          chapterCount: 3,
        },
        entityType: 'course',
      },
    });

    const result = await runContextGatheringStage(ctx);

    // Should NOT call the database-backed buildEntityContext
    expect(mockedBuildEntityContext).not.toHaveBeenCalled();

    expect(result.entityContext.type).toBe('course');
    expect(result.entityContext.course?.title).toBe('Client Course');
    expect(result.entitySummary).toContain('Course: "Client Course"');
  });

  it('falls back to database entity context when no client data is present', async () => {
    mockedBuildEntityContext.mockResolvedValue({
      type: 'course',
      summary: 'DB course summary',
      course: {
        id: 'db-course',
        title: 'DB Course',
        description: null,
        subtitle: null,
        courseGoals: null,
        whatYouWillLearn: [],
        prerequisites: null,
        difficulty: null,
        categoryName: null,
        isPublished: true,
        chapterCount: 0,
        chapters: [],
      },
    });

    const ctx = makePipelineContext({
      pageContext: {
        type: 'course-detail',
        path: '/courses/db1',
        entityId: 'db-course',
      },
    });

    const result = await runContextGatheringStage(ctx);

    expect(mockedBuildEntityContext).toHaveBeenCalledWith(
      'course-detail',
      'db-course',
      undefined,
      undefined,
      'user-1',
    );
    expect(result.entityContext.type).toBe('course');
    expect(result.entitySummary).toBe('DB course summary');
  });

  it('handles entity context errors gracefully with a none fallback', async () => {
    mockedBuildEntityContext.mockRejectedValue(new Error('Database unavailable'));

    const ctx = makePipelineContext({
      pageContext: {
        type: 'course-detail',
        path: '/courses/err',
        entityId: 'err-course',
      },
    });

    const result = await runContextGatheringStage(ctx);

    expect(result.entityContext.type).toBe('none');
    expect(result.entityContext.summary).toBe('');
  });

  it('includes form summary when formContext has fields', async () => {
    const ctx = makePipelineContext({
      formContext: {
        formId: 'course-edit',
        fields: { title: { value: 'My Course', type: 'text' } },
      },
    });

    const result = await runContextGatheringStage(ctx);

    expect(result.formSummary).toContain('Form fields on this page');
  });

  it('includes contextSnapshotSummary when available', async () => {
    const snapshotData = {
      pageSummary: 'On the course page',
      formSummary: 'Course form is open',
      contentSummary: 'Viewing intro chapter',
      navigationSummary: 'Dashboard > Courses',
    };
    mockedGetContextSummary.mockResolvedValue(snapshotData);

    const ctx = makePipelineContext();
    const result = await runContextGatheringStage(ctx);

    expect(result.contextSnapshotSummary).toEqual(snapshotData);
  });

  it('sets contextSnapshotSummary to null when retrieval fails', async () => {
    mockedGetContextSummary.mockRejectedValue(new Error('Snapshot unavailable'));

    const ctx = makePipelineContext();
    const result = await runContextGatheringStage(ctx);

    expect(result.contextSnapshotSummary).toBeNull();
  });

  it('builds toolsSummary when tools are available', async () => {
    mockedEnsureTooling.mockResolvedValue({
      toolRegistry: {
        listTools: jest.fn().mockResolvedValue([
          { name: 'quiz_generator', category: 'assessment' },
          { name: 'content_creator', category: 'content' },
          { name: 'flashcard_maker', category: 'assessment' },
        ]),
      },
    } as never);

    const ctx = makePipelineContext();
    const result = await runContextGatheringStage(ctx);

    expect(result.toolsSummary).toContain('Available Mentor Tools (3 total)');
    expect(result.toolsSummary).toContain('assessment: quiz_generator, flashcard_maker');
    expect(result.toolsSummary).toContain('content: content_creator');
  });

  it('leaves toolsSummary undefined when no tools exist', async () => {
    mockedEnsureTooling.mockResolvedValue({
      toolRegistry: {
        listTools: jest.fn().mockResolvedValue([]),
      },
    } as never);

    const ctx = makePipelineContext();
    const result = await runContextGatheringStage(ctx);

    expect(result.toolsSummary).toBeUndefined();
  });

  it('handles tooling initialization failure gracefully', async () => {
    mockedEnsureTooling.mockRejectedValue(new Error('Tooling init failed'));

    const ctx = makePipelineContext();
    const result = await runContextGatheringStage(ctx);

    // Should not throw, toolsSummary remains undefined
    expect(result.toolsSummary).toBeUndefined();
  });

  it('builds chapter entity context from client data correctly', async () => {
    const ctx = makePipelineContext({
      pageContext: {
        type: 'chapter-detail',
        path: '/courses/c1/chapters/ch1',
        entityId: 'ch1',
        entityData: {
          title: 'Chapter One',
          description: 'First chapter',
          courseTitle: 'My Course',
          courseId: 'c1',
          sections: [
            { id: 's1', title: 'Section 1' },
            { id: 's2', title: 'Section 2' },
          ],
        },
        entityType: 'chapter',
      },
    });

    const result = await runContextGatheringStage(ctx);

    expect(result.entityContext.type).toBe('chapter');
    expect(result.entityContext.chapter?.title).toBe('Chapter One');
    expect(result.entityContext.chapter?.sections).toHaveLength(2);
  });

  it('builds section entity context from client data correctly', async () => {
    const ctx = makePipelineContext({
      pageContext: {
        type: 'section-detail',
        path: '/courses/c1/chapters/ch1/sections/s1',
        entityId: 's1',
        entityData: {
          title: 'Section One',
          content: '<p>Some content</p>',
          chapterTitle: 'Chapter One',
          chapterId: 'ch1',
          courseTitle: 'My Course',
          courseId: 'c1',
          videoUrl: 'https://example.com/video.mp4',
          contentType: 'rich-text',
        },
        entityType: 'section',
      },
    });

    const result = await runContextGatheringStage(ctx);

    expect(result.entityContext.type).toBe('section');
    expect(result.entityContext.section?.title).toBe('Section One');
    expect(result.entityContext.section?.videoUrl).toBe('https://example.com/video.mp4');
    expect(result.entityContext.section?.contentType).toBe('rich-text');
  });
});
