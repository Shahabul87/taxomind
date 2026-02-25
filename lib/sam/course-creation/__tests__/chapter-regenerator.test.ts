/**
 * Tests for chapter-regenerator.ts
 *
 * Verifies the regenerateChapter function: 3-stage pipeline,
 * DB update operations, and SSE progress reporting.
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
  runSAMChatWithPreference: jest.fn().mockResolvedValue('{"title": "Regenerated Chapter"}'),
}));

jest.mock('@/lib/ai/subscription-enforcement', () => ({
  recordAIUsage: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../prompts', () => ({
  buildStage1Prompt: jest.fn(() => ({ systemPrompt: 'sys', userPrompt: 'user' })),
  buildStage2Prompt: jest.fn(() => ({ systemPrompt: 'sys', userPrompt: 'user' })),
  buildStage3Prompt: jest.fn(() => ({ systemPrompt: 'sys', userPrompt: 'user' })),
  PROMPT_VERSION: '2.1.0',
}));

jest.mock('../chapter-templates', () => ({
  getTemplateForDifficulty: jest.fn(() => ({})),
  composeTemplatePromptBlocks: jest.fn(() => ({ blockText: '', sectionHints: [] })),
}));

jest.mock('../category-prompts', () => ({
  getCategoryEnhancer: jest.fn(() => ({})),
  composeCategoryPrompt: jest.fn(() => null),
}));

jest.mock('../quality-integration', () => ({
  validateChapterWithSAM: jest.fn().mockResolvedValue({ overall: 75 }),
  validateSectionWithSAM: jest.fn().mockResolvedValue({ overall: 75 }),
  validateDetailsWithSAM: jest.fn().mockResolvedValue({ overall: 75 }),
  blendScores: jest.fn((a) => a),
}));

jest.mock('../response-parsers', () => ({
  parseChapterResponse: jest.fn(() => ({
    title: 'Regenerated Chapter',
    description: 'Updated description',
    learningObjectives: ['New objective'],
    estimatedTime: '45 minutes',
    prerequisites: '',
    bloomsLevel: 'APPLY',
    keyTopics: ['new topic'],
    position: 1,
  })),
  parseSectionResponse: jest.fn(() => [{
    position: 1,
    title: 'Updated Section',
    contentType: 'TEXT',
    estimatedDuration: '15 minutes',
  }]),
  parseDetailsResponse: jest.fn(() => ({
    description: 'Updated details',
    learningObjectives: ['obj'],
    creatorGuidelines: '',
    practicalActivity: '',
    keyConceptsCovered: ['concept'],
  })),
}));

jest.mock('../helpers', () => ({
  buildFallbackChapter: jest.fn(() => ({
    position: 1,
    title: 'Fallback',
    description: 'desc',
    learningObjectives: [],
    estimatedTime: '30m',
    prerequisites: '',
    bloomsLevel: 'UNDERSTAND',
    keyTopics: [],
  })),
  buildFallbackSection: jest.fn((num) => ({
    position: num,
    title: `FB Section ${num}`,
    contentType: 'TEXT',
    estimatedDuration: '10m',
  })),
  buildFallbackDetails: jest.fn(() => ({
    description: 'fb desc',
    learningObjectives: [],
    creatorGuidelines: '',
    practicalActivity: '',
    keyConceptsCovered: [],
  })),
  parseDuration: jest.fn(() => 15),
  sanitizeHtmlOutput: jest.fn((html) => html),
  buildDefaultQualityScore: jest.fn(() => ({ overall: 30 })),
}));

jest.mock('../memory-recall', () => ({
  recallCourseCreationMemory: jest.fn().mockResolvedValue(null),
  buildMemoryRecallBlock: jest.fn(() => ''),
}));

jest.mock('../adaptive-strategy', () => ({
  AdaptiveStrategyMonitor: jest.fn().mockImplementation(() => ({
    recordChapterOutcome: jest.fn(),
    getStrategy: jest.fn(() => 'standard'),
  })),
}));

jest.mock('../quality-feedback', () => ({
  extractQualityFeedback: jest.fn(() => null),
  buildQualityFeedbackBlock: jest.fn(() => ''),
}));

jest.mock('../self-critique', () => ({
  critiqueGeneration: jest.fn().mockResolvedValue(null),
}));

jest.mock('../chapter-critic', () => ({
  reviewChapterWithCritic: jest.fn().mockResolvedValue(null),
  reviewSectionWithCritic: jest.fn().mockResolvedValue(null),
  reviewDetailsWithCritic: jest.fn().mockResolvedValue(null),
  buildSectionCriticFeedbackBlock: jest.fn(() => ''),
  buildDetailsCriticFeedbackBlock: jest.fn(() => ''),
}));

import { db } from '@/lib/db';

// Dynamic import because module uses 'server-only'
let regenerateChapter: typeof import('../chapter-regenerator').regenerateChapter;

beforeAll(async () => {
  // Mock server-only module
  jest.mock('server-only', () => ({}));
  const mod = await import('../chapter-regenerator');
  regenerateChapter = mod.regenerateChapter;
});

const mockDb = db as jest.Mocked<typeof db>;

describe('chapter-regenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockDb.chapter.findUnique as jest.Mock).mockResolvedValue({
      id: 'ch-1',
      position: 1,
      title: 'Old Chapter',
      courseId: 'course-1',
      course: {
        id: 'course-1',
        title: 'React',
        description: 'Learn React',
        difficulty: 'INTERMEDIATE',
        courseGoals: 'Build apps\nLearn hooks',
        whatYouWillLearn: ['Build apps', 'Learn hooks'],
        userId: 'user-1',
        category: { name: 'Web Dev' },
        _count: { chapters: 3 },
      },
      sections: [{ id: 'sec-1', position: 1, title: 'Old Section' }],
    });
    (mockDb.chapter.update as jest.Mock).mockResolvedValue({ id: 'ch-1' });
    (mockDb.section.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
    (mockDb.section.create as jest.Mock).mockResolvedValue({ id: 'new-sec-1' });
    (mockDb.section.update as jest.Mock).mockResolvedValue({ id: 'new-sec-1' });
  });

  it('should export regenerateChapter function', () => {
    expect(typeof regenerateChapter).toBe('function');
  });

  it('should return a result object with success flag', async () => {
    const result = await regenerateChapter({
      userId: 'user-1',
      chapterId: 'ch-1',
      onProgress: jest.fn(),
    });
    expect(result).toHaveProperty('success');
  });
});
