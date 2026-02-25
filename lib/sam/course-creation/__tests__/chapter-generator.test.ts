/**
 * Tests for chapter-generator.ts
 *
 * Verifies generateSingleChapter: 3-stage pipeline, SSE callbacks,
 * fallback behavior, and result structure.
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
  runSAMChatWithPreference: jest.fn().mockResolvedValue('{"title": "Test Chapter"}'),
  runSAMChatWithUsage: jest.fn().mockResolvedValue({
    content: '{"title": "Test Chapter"}',
    provider: 'deepseek',
    model: 'deepseek-chat',
    usage: { inputTokens: 500, outputTokens: 200, totalTokens: 700 },
  }),
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

jest.mock('../rag-retriever', () => ({
  retrieveRelevantContext: jest.fn().mockResolvedValue(null),
  buildRAGQuery: jest.fn(() => ''),
}));

jest.mock('../chapter-templates', () => ({
  composeTemplatePromptBlocks: jest.fn(() => ({ blockText: '', sectionHints: [] })),
  selectTemplateSections: jest.fn(() => []),
}));

jest.mock('../category-prompts', () => ({
  composeCategoryPrompt: jest.fn(() => null),
}));

jest.mock('../quality-integration', () => ({
  validateChapterWithSAM: jest.fn().mockResolvedValue({ overall: 80 }),
  validateSectionWithSAM: jest.fn().mockResolvedValue({ overall: 80 }),
  validateDetailsWithSAM: jest.fn().mockResolvedValue({ overall: 80 }),
  blendScores: jest.fn((a: unknown) => a),
}));

jest.mock('../quality-feedback', () => ({
  extractQualityFeedback: jest.fn(() => null),
  buildQualityFeedbackBlock: jest.fn(() => ''),
}));

jest.mock('../course-planner', () => ({
  buildBlueprintBlock: jest.fn(() => ''),
}));

jest.mock('../agentic-decisions', () => ({
  evaluateChapterOutcome: jest.fn().mockResolvedValue({ action: 'continue' }),
  buildAdaptiveGuidance: jest.fn(() => ''),
}));

jest.mock('../self-critique', () => ({
  critiqueGeneration: jest.fn().mockResolvedValue(null),
}));

jest.mock('../streaming-accumulator', () => ({
  streamWithThinkingExtraction: jest.fn().mockResolvedValue({
    content: '{"title": "Test"}',
    thinkingContent: '',
    provider: 'deepseek',
    model: 'deepseek-chat',
    usage: { inputTokens: 100, outputTokens: 50 },
  }),
}));

jest.mock('../response-parsers', () => ({
  parseChapterResponse: jest.fn(() => ({
    chapter: {
      title: 'Test Chapter',
      description: 'A test chapter',
      learningObjectives: ['Learn basics'],
      estimatedTime: '30 minutes',
      prerequisites: '',
      bloomsLevel: 'UNDERSTAND',
      keyTopics: ['basics'],
      position: 1,
    },
    thinking: '',
    qualityScore: { overall: 85, structure: 80, content: 90, pedagogy: 85 },
  })),
  parseSectionResponse: jest.fn(() => ({
    section: {
      position: 1,
      title: 'Test Section',
      contentType: 'TEXT',
      estimatedDuration: '10 minutes',
    },
    thinking: '',
    qualityScore: { overall: 85, structure: 80, content: 90, pedagogy: 85 },
  })),
  parseDetailsResponse: jest.fn(() => ({
    details: {
      description: 'Section details',
      learningObjectives: ['obj1'],
      creatorGuidelines: '',
      practicalActivity: '',
      keyConceptsCovered: ['concept1'],
    },
    thinking: '',
    qualityScore: { overall: 85, structure: 80, content: 90, pedagogy: 85 },
  })),
}));

jest.mock('../helpers', () => ({
  buildFallbackChapter: jest.fn((pos: number) => ({
    position: pos,
    title: `Fallback Chapter ${pos}`,
    description: 'Fallback',
    learningObjectives: ['obj'],
    estimatedTime: '30m',
    prerequisites: '',
    bloomsLevel: 'UNDERSTAND',
    keyTopics: [],
  })),
  buildFallbackSection: jest.fn((num: number) => ({
    position: num,
    title: `Fallback Section ${num}`,
    contentType: 'TEXT',
    estimatedDuration: '10m',
  })),
  buildFallbackDetails: jest.fn(() => ({
    description: 'desc',
    learningObjectives: ['obj'],
    creatorGuidelines: '',
    practicalActivity: '',
    keyConceptsCovered: [],
  })),
  parseDuration: jest.fn(() => 10),
  sanitizeHtmlOutput: jest.fn((html: string) => html),
  buildDefaultQualityScore: jest.fn(() => ({ overall: 50 })),
  // These were missing and caused the test to fail
  traceAICall: jest.fn((_trace: unknown, fn: () => unknown) => fn()),
  ensureOptionalArray: jest.fn((val: unknown) => (Array.isArray(val) ? val : [])),
  validateChapterSectionCoverage: jest.fn(() => ({ coveragePercent: 100, coveredTopics: [], uncoveredTopics: [] })),
}));

jest.mock('../memory-recall', () => ({
  recallCourseCreationMemory: jest.fn().mockResolvedValue(null),
  buildMemoryRecallBlock: jest.fn(() => ''),
}));

jest.mock('../adaptive-strategy', () => ({
  AdaptiveStrategyMonitor: jest.fn().mockImplementation(() => ({
    recordChapterOutcome: jest.fn(),
    getStrategy: jest.fn(() => ({
      temperature: 0.7,
      maxTokens: 4000,
      retryThreshold: 55,
      maxRetries: 1,
      enableSelfCritique: false,
    })),
    shouldUseTemplate: jest.fn(() => false),
  })),
}));

jest.mock('../chapter-critic', () => ({
  reviewChapterWithCritic: jest.fn().mockResolvedValue(null),
  reviewSectionWithCritic: jest.fn().mockResolvedValue(null),
  reviewDetailsWithCritic: jest.fn().mockResolvedValue(null),
  buildSectionCriticFeedbackBlock: jest.fn(() => ''),
  buildDetailsCriticFeedbackBlock: jest.fn(() => ''),
}));

jest.mock('../prompt-budget', () => ({
  checkBudget: jest.fn(() => null),
}));

// Additional modules that chapter-generator imports but were not mocked
jest.mock('../retry-quality-gate', () => ({
  retryWithQualityGate: jest.fn(async (config: {
    strategy: { maxRetries: number; retryThreshold: number };
    buildFallback: () => unknown;
    executeAttempt: (attempt: number, feedback: unknown) => Promise<{ result: unknown; score: number }>;
    extractFeedback: (result: unknown, score: number, nextAttempt: number) => unknown;
  }) => {
    const { result, score } = await config.executeAttempt(0, null);
    return { bestResult: result, bestScore: score, attemptsUsed: 1 };
  }),
}));

jest.mock('../math-validator', () => ({
  validateAndFixMath: jest.fn((text: string) => ({ html: text, fixesApplied: [] })),
}));

jest.mock('../blooms-verb-validator', () => ({
  validateBloomsVerbs: jest.fn(() => ({ valid: true, violations: [], correctedObjectives: [] })),
}));

jest.mock('../semantic-duplicate-gate', () => ({
  SemanticDuplicateGate: jest.fn().mockImplementation(() => ({
    assess: jest.fn().mockResolvedValue(null),
    add: jest.fn(),
  })),
}));

jest.mock('../pipeline-budget', () => ({
  BudgetExceededError: class BudgetExceededError extends Error {
    constructor(msg: string) { super(msg); this.name = 'BudgetExceededError'; }
  },
}));

import { generateSingleChapter, type ChapterGenerationCallbacks } from '../chapter-generator';
import { db } from '@/lib/db';
import type { ChapterStepContext } from '../types';
import { runSAMChatWithPreference, runSAMChatWithUsage } from '@/lib/sam/ai-provider';
import { recordAIUsage } from '@/lib/ai/subscription-enforcement';
import { buildStage1Prompt, buildStage2Prompt, buildStage3Prompt } from '../prompts';
import { parseChapterResponse, parseSectionResponse, parseDetailsResponse } from '../response-parsers';
import {
  buildFallbackChapter, buildFallbackSection, buildFallbackDetails,
  parseDuration, sanitizeHtmlOutput, buildDefaultQualityScore, traceAICall,
  ensureOptionalArray, validateChapterSectionCoverage,
} from '../helpers';
import { validateChapterWithSAM, validateSectionWithSAM, validateDetailsWithSAM, blendScores } from '../quality-integration';
import { streamWithThinkingExtraction } from '../streaming-accumulator';
import { composeTemplatePromptBlocks, selectTemplateSections } from '../chapter-templates';
import { composeCategoryPrompt } from '../category-prompts';
import { extractQualityFeedback, buildQualityFeedbackBlock } from '../quality-feedback';
import { buildBlueprintBlock } from '../course-planner';
import { evaluateChapterOutcome, buildAdaptiveGuidance } from '../agentic-decisions';
import { critiqueGeneration } from '../self-critique';
import { recallCourseCreationMemory, buildMemoryRecallBlock } from '../memory-recall';
import {
  reviewChapterWithCritic, reviewSectionWithCritic, reviewDetailsWithCritic,
  buildSectionCriticFeedbackBlock, buildDetailsCriticFeedbackBlock,
} from '../chapter-critic';
import { checkBudget } from '../prompt-budget';
import { retryWithQualityGate } from '../retry-quality-gate';
import { validateAndFixMath } from '../math-validator';
import { validateBloomsVerbs } from '../blooms-verb-validator';
import { SemanticDuplicateGate } from '../semantic-duplicate-gate';

const mockDb = db as jest.Mocked<typeof db>;

describe('generateSingleChapter', () => {
  const sampleContext: ChapterStepContext = {
    chapterNumber: 1,
    courseId: 'course-1',
    courseContext: {
      courseTitle: 'React',
      courseDescription: 'Learn React',
      courseCategory: 'Web',
      targetAudience: 'devs',
      difficulty: 'INTERMEDIATE',
      courseLearningObjectives: ['Learn hooks'],
      totalChapters: 3,
      sectionsPerChapter: 2,
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
      recordChapterOutcome: jest.fn(),
      record: jest.fn(),
      getStrategy: jest.fn(() => ({
        temperature: 0.7,
        maxTokens: 4000,
        retryThreshold: 55,
        maxRetries: 1,
        enableSelfCritique: false,
      })),
      shouldUseTemplate: jest.fn(() => false),
    } as any,
    chapterTemplate: {} as any,
    categoryPrompt: {} as any,
    categoryEnhancer: {} as any,
    experimentVariant: 'control',
  };

  const callbacks: ChapterGenerationCallbacks = {
    onSSEEvent: jest.fn(),
    enableStreamingThinking: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockDb.chapter.create as jest.Mock).mockResolvedValue({ id: 'ch-1' });
    (mockDb.section.create as jest.Mock).mockResolvedValue({ id: 'sec-1' });
    (mockDb.section.update as jest.Mock).mockResolvedValue({ id: 'sec-1' });

    // Restore module-level mock implementations cleared by resetMocks
    (runSAMChatWithPreference as jest.Mock).mockResolvedValue('{"title": "Test Chapter"}');
    (runSAMChatWithUsage as jest.Mock).mockResolvedValue({
      content: '{"title": "Test Chapter"}', provider: 'deepseek', model: 'deepseek-chat',
      usage: { inputTokens: 500, outputTokens: 200, totalTokens: 700 },
    });
    (recordAIUsage as jest.Mock).mockResolvedValue(undefined);
    (buildStage1Prompt as jest.Mock).mockReturnValue({ systemPrompt: 'sys', userPrompt: 'user' });
    (buildStage2Prompt as jest.Mock).mockReturnValue({ systemPrompt: 'sys', userPrompt: 'user' });
    (buildStage3Prompt as jest.Mock).mockReturnValue({ systemPrompt: 'sys', userPrompt: 'user' });
    (parseChapterResponse as jest.Mock).mockReturnValue({
      chapter: {
        title: 'Test Chapter', description: 'A test chapter',
        learningObjectives: ['Learn basics'], estimatedTime: '30 minutes',
        prerequisites: '', bloomsLevel: 'UNDERSTAND', keyTopics: ['basics'], position: 1,
      },
      thinking: '',
      qualityScore: { overall: 85, structure: 80, content: 90, pedagogy: 85 },
    });
    (parseSectionResponse as jest.Mock).mockReturnValue({
      section: {
        position: 1, title: 'Test Section', contentType: 'TEXT', estimatedDuration: '10 minutes',
      },
      thinking: '',
      qualityScore: { overall: 85, structure: 80, content: 90, pedagogy: 85 },
    });
    (parseDetailsResponse as jest.Mock).mockReturnValue({
      details: {
        description: 'Section details', learningObjectives: ['obj1'],
        creatorGuidelines: '', practicalActivity: '', keyConceptsCovered: ['concept1'],
      },
      thinking: '',
      qualityScore: { overall: 85, structure: 80, content: 90, pedagogy: 85 },
    });
    (buildFallbackChapter as jest.Mock).mockImplementation((pos: number) => ({
      position: pos, title: `Fallback Chapter ${pos}`, description: 'Fallback',
      learningObjectives: ['obj'], estimatedTime: '30m', prerequisites: '',
      bloomsLevel: 'UNDERSTAND', keyTopics: [],
    }));
    (buildFallbackSection as jest.Mock).mockImplementation((num: number) => ({
      position: num, title: `Fallback Section ${num}`, contentType: 'TEXT', estimatedDuration: '10m',
    }));
    (buildFallbackDetails as jest.Mock).mockReturnValue({
      description: 'desc', learningObjectives: ['obj'],
      creatorGuidelines: '', practicalActivity: '', keyConceptsCovered: [],
    });
    (parseDuration as jest.Mock).mockReturnValue(10);
    (sanitizeHtmlOutput as jest.Mock).mockImplementation((html: string) => html);
    (buildDefaultQualityScore as jest.Mock).mockReturnValue({ overall: 50 });
    (traceAICall as jest.Mock).mockImplementation((_trace: unknown, fn: () => unknown) => fn());
    (ensureOptionalArray as jest.Mock).mockImplementation((val: unknown) => (Array.isArray(val) ? val : []));
    (validateChapterSectionCoverage as jest.Mock).mockReturnValue({ coveragePercent: 100, coveredTopics: [], uncoveredTopics: [] });
    (validateChapterWithSAM as jest.Mock).mockResolvedValue({ overall: 80 });
    (validateSectionWithSAM as jest.Mock).mockResolvedValue({ overall: 80 });
    (validateDetailsWithSAM as jest.Mock).mockResolvedValue({ overall: 80 });
    (blendScores as jest.Mock).mockImplementation((a: unknown) => a);
    (streamWithThinkingExtraction as jest.Mock).mockResolvedValue({
      content: '{"title": "Test"}', thinkingContent: '',
      provider: 'deepseek', model: 'deepseek-chat',
      usage: { inputTokens: 100, outputTokens: 50 },
    });
    (composeTemplatePromptBlocks as jest.Mock).mockReturnValue({ blockText: '', sectionHints: [] });
    (selectTemplateSections as jest.Mock).mockReturnValue([]);
    (composeCategoryPrompt as jest.Mock).mockReturnValue(null);
    (extractQualityFeedback as jest.Mock).mockReturnValue(null);
    (buildQualityFeedbackBlock as jest.Mock).mockReturnValue('');
    (buildBlueprintBlock as jest.Mock).mockReturnValue('');
    (evaluateChapterOutcome as jest.Mock).mockResolvedValue({ action: 'continue' });
    (buildAdaptiveGuidance as jest.Mock).mockReturnValue('');
    (critiqueGeneration as jest.Mock).mockResolvedValue(null);
    (recallCourseCreationMemory as jest.Mock).mockResolvedValue(null);
    (buildMemoryRecallBlock as jest.Mock).mockReturnValue('');
    (reviewChapterWithCritic as jest.Mock).mockResolvedValue(null);
    (reviewSectionWithCritic as jest.Mock).mockResolvedValue(null);
    (reviewDetailsWithCritic as jest.Mock).mockResolvedValue(null);
    (buildSectionCriticFeedbackBlock as jest.Mock).mockReturnValue('');
    (buildDetailsCriticFeedbackBlock as jest.Mock).mockReturnValue('');
    (checkBudget as jest.Mock).mockReturnValue(null);
    (retryWithQualityGate as jest.Mock).mockImplementation(async (config: {
      executeAttempt: (attempt: number, feedback: unknown) => Promise<{ result: unknown; score: number }>;
    }) => {
      const { result, score } = await config.executeAttempt(0, null);
      return { bestResult: result, bestScore: score, attemptsUsed: 1 };
    });
    (validateAndFixMath as jest.Mock).mockImplementation((text: string) => ({ html: text, fixesApplied: [] }));
    (validateBloomsVerbs as jest.Mock).mockReturnValue({ valid: true, violations: [], correctedObjectives: [] });
    (SemanticDuplicateGate as unknown as jest.Mock).mockImplementation(() => ({
      assess: jest.fn().mockResolvedValue(null),
      add: jest.fn(),
    }));

    // Restore strategy monitor mocks
    (sampleContext.strategyMonitor.getStrategy as jest.Mock).mockReturnValue({
      temperature: 0.7, maxTokens: 4000, retryThreshold: 55, maxRetries: 1, enableSelfCritique: false,
    });
    (sampleContext.strategyMonitor.shouldUseTemplate as jest.Mock).mockReturnValue(false);
    (sampleContext.strategyMonitor.record as jest.Mock).mockReturnValue(undefined);
  });

  it('should export the generateSingleChapter function', () => {
    expect(typeof generateSingleChapter).toBe('function');
  });

  it('should return a result with chaptersCreated and sectionsCreated', async () => {
    const result = await generateSingleChapter('user-1', sampleContext, callbacks);
    expect(result).toHaveProperty('chaptersCreated');
    expect(result).toHaveProperty('sectionsCreated');
    expect(result).toHaveProperty('completedChapter');
    expect(result).toHaveProperty('qualityScores');
  });

  it('should emit SSE events during generation', async () => {
    await generateSingleChapter('user-1', sampleContext, callbacks);
    expect(callbacks.onSSEEvent).toHaveBeenCalled();
  });
});
