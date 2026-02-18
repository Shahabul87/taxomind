jest.mock('@/lib/db', () => ({
  db: {
    chapter: {
      create: jest.fn(),
      update: jest.fn(),
    },
    section: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/sam/ai-provider', () => ({
  runSAMChatWithUsage: jest.fn(),
  runSAMChatWithPreference: jest.fn(),
}));

jest.mock('@/lib/ai/subscription-enforcement', () => ({
  recordAIUsage: jest.fn(async () => undefined),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../retry-quality-gate', () => ({
  retryWithQualityGate: jest.fn(async (config: {
    executeAttempt: (attempt: number, feedback: unknown) => Promise<{ result: unknown; score: number }>;
  }) => {
    const attempt = await config.executeAttempt(0, null);
    return {
      bestResult: attempt.result,
      bestScore: attempt.score,
      attemptsUsed: 1,
    };
  }),
}));

jest.mock('../../prompts', () => ({
  buildStage1Prompt: jest.fn(() => ({ systemPrompt: 's1', userPrompt: 'u1' })),
  buildStage2Prompt: jest.fn(() => ({ systemPrompt: 's2', userPrompt: 'u2' })),
  buildStage3Prompt: jest.fn(() => ({ systemPrompt: 's3', userPrompt: 'u3' })),
}));

jest.mock('../../chapter-templates', () => ({
  composeTemplatePromptBlocks: jest.fn(() => ({ stage1Block: '', stage2Block: '', stage3Block: '' })),
  selectTemplateSections: jest.fn(() => ([
    { role: 'HOOK', displayName: 'Hook' },
    { role: 'PRACTICE', displayName: 'Practice' },
  ])),
}));

jest.mock('../../quality-integration', () => ({
  validateChapterWithSAM: jest.fn(async () => ({
    combinedScore: 90,
    qualityGateScore: 90,
    pedagogyScore: 90,
    qualityIssues: [],
    pedagogyIssues: [],
    suggestions: [],
    failedGates: [],
    samValidationRan: false,
  })),
  validateSectionWithSAM: jest.fn(async () => ({
    combinedScore: 90,
    qualityGateScore: 90,
    pedagogyScore: 90,
    qualityIssues: [],
    pedagogyIssues: [],
    suggestions: [],
    failedGates: [],
    samValidationRan: false,
  })),
  validateDetailsWithSAM: jest.fn(async () => ({
    combinedScore: 90,
    qualityGateScore: 90,
    pedagogyScore: 90,
    qualityIssues: [],
    pedagogyIssues: [],
    suggestions: [],
    failedGates: [],
    samValidationRan: false,
  })),
  blendScores: jest.fn((score: unknown) => score),
}));

jest.mock('../../chapter-critic', () => ({
  reviewChapterWithCritic: jest.fn(async () => null),
  reviewSectionWithCritic: jest.fn(async () => null),
  reviewDetailsWithCritic: jest.fn(async () => null),
  buildSectionCriticFeedbackBlock: jest.fn(() => ''),
  buildDetailsCriticFeedbackBlock: jest.fn(() => ''),
}));

jest.mock('../../self-critique', () => ({
  critiqueGeneration: jest.fn(async () => ({
    confidenceScore: 90,
    topImprovements: [],
    reasoningAnalysis: { weakSteps: [] },
  })),
}));

jest.mock('../../response-parsers', () => ({
  parseChapterResponse: jest.fn(() => ({
    chapter: {
      position: 1,
      title: 'Chapter 1: API Foundations',
      description: 'Deep chapter description for robust API architecture and production constraints.',
      bloomsLevel: 'UNDERSTAND',
      learningObjectives: [
        'Explain API architecture decisions',
        'Describe reliability boundaries',
      ],
      keyTopics: ['Contracts', 'Versioning'],
      prerequisites: 'HTTP',
      estimatedTime: '2 hours',
      topicsToExpand: ['Contracts', 'Versioning'],
      conceptsIntroduced: ['contract', 'versioning'],
    },
    thinking: 'chapter-thinking',
    qualityScore: { completeness: 90, specificity: 90, bloomsAlignment: 90, uniqueness: 90, depth: 90, overall: 90 },
  })),
  parseSectionResponse: jest.fn((_: string, sectionNumber: number) => ({
    section: {
      position: sectionNumber,
      title: `Section ${sectionNumber} Title`,
      contentType: 'reading',
      estimatedDuration: '20 minutes',
      topicFocus: `Topic ${sectionNumber}`,
      parentChapterContext: {
        title: 'Chapter 1: API Foundations',
        bloomsLevel: 'UNDERSTAND',
        relevantObjectives: ['Explain API architecture decisions'],
      },
      conceptsIntroduced: [`concept-${sectionNumber}`],
      conceptsReferenced: [],
    },
    thinking: `section-${sectionNumber}-thinking`,
    qualityScore: { completeness: 88, specificity: 88, bloomsAlignment: 88, uniqueness: 88, depth: 88, overall: 88 },
  })),
  parseDetailsResponse: jest.fn((_: string, _chapter: unknown, section: { position: number }) => ({
    details: {
      description: `<h2>Section ${section.position}</h2><p>Detailed content.</p>`,
      learningObjectives: [
        `Apply concept ${section.position}`,
        `Evaluate concept ${section.position}`,
      ],
      keyConceptsCovered: [`concept-${section.position}`],
      practicalActivity: `Build exercise ${section.position}`,
      creatorGuidelines: `Creator guidelines for section ${section.position}`,
      resources: [],
    },
    thinking: `details-${section.position}-thinking`,
    qualityScore: { completeness: 87, specificity: 87, bloomsAlignment: 87, uniqueness: 87, depth: 87, overall: 87 },
  })),
}));

import { db } from '@/lib/db';
import { runSAMChatWithUsage } from '@/lib/sam/ai-provider';
import { generateSingleChapter } from '../../chapter-generator';
import type { ChapterStepContext } from '../../types';

const mockDb = db as unknown as {
  chapter: { create: jest.Mock; update: jest.Mock };
  section: { create: jest.Mock; update: jest.Mock };
};

const mockRunSAMChatWithUsage = runSAMChatWithUsage as jest.Mock;

describe('chapter generator interleaving + DB write contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunSAMChatWithUsage.mockResolvedValue({
      content: '{}',
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    });

    mockDb.chapter.create.mockResolvedValue({ id: 'chapter-1' });
    mockDb.chapter.update.mockResolvedValue({ id: 'chapter-1' });
    mockDb.section.create
      .mockResolvedValueOnce({ id: 'section-1' })
      .mockResolvedValueOnce({ id: 'section-2' });
    mockDb.section.update.mockResolvedValue({ id: 'section-updated' });
  });

  it('writes creatorGuidelines and enforces Stage2->Stage3 strict interleaving per section', async () => {
    const events: Array<{ type: string; data: Record<string, unknown> }> = [];
    const onSSEEvent = (event: { type: string; data: Record<string, unknown> }) => events.push(event);

    const context: ChapterStepContext = {
      chapterNumber: 1,
      courseId: 'course-1',
      courseContext: {
        courseTitle: 'Enterprise API Design',
        courseDescription: 'Build enterprise APIs.',
        courseCategory: 'Programming',
        targetAudience: 'Engineers',
        difficulty: 'intermediate',
        courseLearningObjectives: ['Design APIs'],
        totalChapters: 2,
        sectionsPerChapter: 2,
        bloomsFocus: ['UNDERSTAND', 'APPLY'],
        learningObjectivesPerChapter: 2,
        learningObjectivesPerSection: 2,
        preferredContentTypes: ['reading'],
        courseIntent: 'Professional API creation',
        includeAssessments: true,
        duration: '4 weeks',
      },
      conceptTracker: { concepts: new Map(), vocabulary: [], skillsBuilt: [] },
      bloomsProgression: [],
      allSectionTitles: [],
      qualityScores: [],
      completedChapters: [],
      generatedChapters: [],
      blueprintPlan: null,
      lastAgenticDecision: null,
      recalledMemory: null,
      strategyMonitor: {
        getStrategy: () => ({
          maxRetries: 0,
          retryThreshold: 70,
          maxTokens: 512,
          temperature: 0.3,
          enableSelfCritique: false,
        }),
        record: jest.fn(),
      } as unknown as ChapterStepContext['strategyMonitor'],
      chapterTemplate: { id: 'beginner', displayName: 'Beginner', totalSections: 2 } as unknown as ChapterStepContext['chapterTemplate'],
      categoryPrompt: {
        categoryId: 'general',
        displayName: 'General',
        systemPromptAdditions: '',
        qualityHeuristics: [],
        tokenEstimate: { total: 0 },
      } as unknown as ChapterStepContext['categoryPrompt'],
      experimentVariant: undefined,
    };

    await generateSingleChapter(
      'user-1',
      context,
      { onSSEEvent, enableStreamingThinking: false },
    );

    expect(mockDb.chapter.create).toHaveBeenCalledTimes(1);
    expect(mockDb.section.create).toHaveBeenCalledTimes(2);
    expect(mockDb.section.update).toHaveBeenCalledTimes(2);
    expect(mockDb.section.update.mock.calls[0][0].data.creatorGuidelines).toContain('Creator guidelines for section 1');
    expect(mockDb.section.update.mock.calls[1][0].data.creatorGuidelines).toContain('Creator guidelines for section 2');

    const idxS2Complete1 = events.findIndex(e => e.type === 'item_complete' && e.data.stage === 2 && e.data.section === 1);
    const idxS3Generating1 = events.findIndex(e => e.type === 'item_generating' && e.data.stage === 3 && e.data.section === 1);
    const idxS3Complete1 = events.findIndex(e => e.type === 'item_complete' && e.data.stage === 3 && e.data.section === 1);
    const idxS2Generating2 = events.findIndex(e => e.type === 'item_generating' && e.data.stage === 2 && e.data.section === 2);
    const idxS2Complete2 = events.findIndex(e => e.type === 'item_complete' && e.data.stage === 2 && e.data.section === 2);
    const idxS3Complete2 = events.findIndex(e => e.type === 'item_complete' && e.data.stage === 3 && e.data.section === 2);

    expect(idxS2Complete1).toBeGreaterThan(-1);
    expect(idxS3Generating1).toBeGreaterThan(idxS2Complete1);
    expect(idxS3Complete1).toBeGreaterThan(idxS3Generating1);
    expect(idxS2Generating2).toBeGreaterThan(idxS3Complete1);
    expect(idxS3Complete2).toBeGreaterThan(idxS2Complete2);
  });
});
