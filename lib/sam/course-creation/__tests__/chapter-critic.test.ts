/**
 * Chapter Critic — Unit Tests
 *
 * Tests for lib/sam/course-creation/chapter-critic.ts which provides
 * AI-powered critique of generated chapters, sections, and details.
 *
 * Covers:
 * - Borderline quality gating (only fires for scores 45-58)
 * - AI response parsing and verdict overrides
 * - Low-confidence revise -> approve override
 * - Timeout / AI failure graceful degradation to rule-based critique
 * - buildSectionCriticFeedbackBlock pure string builder
 * - reviewSectionWithCritic borderline gating
 * - reviewDetailsWithCritic borderline gating and AI parsing
 */

// ============================================================================
// Mocks (hoisted before imports by babel/jest)
// ============================================================================

jest.mock('server-only', () => ({}));

jest.mock('@/lib/sam/ai-provider', () => ({
  runSAMChatWithPreference: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock helpers — passthrough sanitizeCourseContext, mock traceAICall to call through
jest.mock('../helpers', () => ({
  traceAICall: jest.fn((_trace: unknown, fn: () => Promise<unknown>) => fn()),
  sanitizeCourseContext: jest.fn((ctx: unknown) => ctx),
}));

// ============================================================================
// Imports (after mocks)
// ============================================================================

import {
  reviewChapterWithCritic,
  reviewSectionWithCritic,
  reviewDetailsWithCritic,
  buildSectionCriticFeedbackBlock,
  buildDetailsCriticFeedbackBlock,
  ChapterCritique,
  SectionCritique,
  DetailsCritique,
  CriticVerdict,
} from '../chapter-critic';

import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';

import {
  GeneratedChapter,
  GeneratedSection,
  SectionDetails,
  CourseContext,
  CompletedChapter,
  ConceptTracker,
  BloomsLevel,
} from '../types';

// ============================================================================
// Test Fixtures
// ============================================================================

const mockRunSAM = runSAMChatWithPreference as jest.Mock;

function makeCourseContext(overrides: Partial<CourseContext> = {}): CourseContext {
  return {
    courseTitle: 'React Fundamentals',
    courseDescription: 'A comprehensive course on React development',
    courseCategory: 'Web Development',
    targetAudience: 'Intermediate developers',
    difficulty: 'intermediate',
    courseLearningObjectives: [
      'Build React components',
      'Manage state with hooks',
    ],
    totalChapters: 10,
    sectionsPerChapter: 5,
    bloomsFocus: ['UNDERSTAND' as BloomsLevel, 'APPLY' as BloomsLevel],
    learningObjectivesPerChapter: 4,
    learningObjectivesPerSection: 3,
    ...overrides,
  };
}

function makeChapter(overrides: Partial<GeneratedChapter> = {}): GeneratedChapter {
  return {
    position: 1,
    title: 'Introduction to React',
    description: 'Learn the fundamentals of React including components, JSX, and the virtual DOM. This chapter covers the basic building blocks of React applications.',
    bloomsLevel: 'UNDERSTAND' as BloomsLevel,
    learningObjectives: [
      'Understand React component architecture',
      'Write JSX syntax correctly',
      'Explain the virtual DOM concept',
      'Identify component lifecycle phases',
    ],
    keyTopics: ['components', 'JSX', 'virtual DOM'],
    prerequisites: '',
    estimatedTime: '2 hours',
    topicsToExpand: ['components', 'JSX', 'virtual DOM'],
    ...overrides,
  };
}

function makeSection(overrides: Partial<GeneratedSection> = {}): GeneratedSection {
  return {
    position: 1,
    title: 'React Components Deep Dive',
    contentType: 'video',
    estimatedDuration: '20 minutes',
    topicFocus: 'components',
    parentChapterContext: {
      title: 'Introduction to React',
      bloomsLevel: 'UNDERSTAND' as BloomsLevel,
      relevantObjectives: ['Understand React component architecture'],
    },
    ...overrides,
  };
}

function makeSectionDetails(overrides: Partial<SectionDetails> = {}): SectionDetails {
  return {
    description: '<h2>The Big Picture</h2><p>The problem of managing UI state motivated React, emerging from the challenge of keeping complex interfaces in sync.</p><h2>Core Intuition</h2><p>Think of components as building blocks — each manages its own state like a self-contained widget.</p><h2>Concrete Example and Analogy</h2><p>For example, suppose you have a counter component with value 0. Each click increments the count independently.</p><h2>Common Confusion + Fix</h2><p>A common misconception is that state is shared between components. The fix is to remember state is local to each component.</p><h2>Step-by-Step Visualization</h2><p>First, create a component. Then, add state with useState. Next, render it and observe reactivity. Finally, compose multiple components together.</p>',
    learningObjectives: ['Understand component architecture'],
    keyConceptsCovered: ['components', 'props'],
    practicalActivity: 'Build a simple counter component',
    creatorGuidelines: 'Focus on practical examples',
    ...overrides,
  };
}

function makeConceptTracker(): ConceptTracker {
  return {
    concepts: new Map(),
    vocabulary: [],
    skillsBuilt: [],
  };
}

function makeCompletedChapter(overrides: Partial<CompletedChapter> = {}): CompletedChapter {
  return {
    ...makeChapter(),
    id: 'ch-001',
    sections: [],
    ...overrides,
  };
}

/**
 * Build a mock AI JSON response string that the critic AI would return.
 */
function buildChapterCriticResponse(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    verdict: 'approve',
    confidence: 90,
    reasoning: 'The chapter is well-structured with clear objectives.',
    arrowCompliance: 85,
    bloomsAlignment: 88,
    conceptFlow: 82,
    specificity: 90,
    difficultyCalibration: 80,
    actionableImprovements: [],
    ...overrides,
  });
}

function buildSectionCriticResponse(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    verdict: 'approve',
    confidence: 85,
    reasoning: 'Section aligns well with chapter objectives.',
    topicRelevance: 88,
    contentTypeAppropriate: 82,
    uniqueness: 90,
    conceptProgression: 85,
    actionableImprovements: [],
    ...overrides,
  });
}

function buildDetailsCriticResponse(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    verdict: 'approve',
    confidence: 85,
    reasoning: 'Section details are thorough and well-structured.',
    motivationClarity: 88,
    intuitionClarity: 85,
    equationIntuitionQuality: 80,
    visualizationQuality: 82,
    exampleConcreteness: 90,
    misconceptionRepairQuality: 85,
    actionableImprovements: [],
    ...overrides,
  });
}

// ============================================================================
// Tests
// ============================================================================

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================================================
// reviewChapterWithCritic
// ============================================================================

describe('reviewChapterWithCritic', () => {
  const baseParams = () => ({
    userId: 'user-123',
    chapter: makeChapter(),
    courseContext: makeCourseContext(),
    priorChapters: [] as CompletedChapter[],
    conceptTracker: makeConceptTracker(),
  });

  it('returns null when qualityScore > 58 (outside borderline range)', async () => {
    const result = await reviewChapterWithCritic({
      ...baseParams(),
      qualityScore: 59,
    });

    expect(result).toBeNull();
    expect(mockRunSAM).not.toHaveBeenCalled();
  });

  it('returns null when qualityScore = 80 (well above borderline range)', async () => {
    const result = await reviewChapterWithCritic({
      ...baseParams(),
      qualityScore: 80,
    });

    expect(result).toBeNull();
    expect(mockRunSAM).not.toHaveBeenCalled();
  });

  it('returns null when qualityScore < 45 (below borderline range)', async () => {
    const result = await reviewChapterWithCritic({
      ...baseParams(),
      qualityScore: 44,
    });

    expect(result).toBeNull();
    expect(mockRunSAM).not.toHaveBeenCalled();
  });

  it('returns null when qualityScore = 0', async () => {
    const result = await reviewChapterWithCritic({
      ...baseParams(),
      qualityScore: 0,
    });

    expect(result).toBeNull();
    expect(mockRunSAM).not.toHaveBeenCalled();
  });

  it('calls AI and returns approve verdict for high-quality response', async () => {
    mockRunSAM.mockResolvedValueOnce(buildChapterCriticResponse({
      verdict: 'approve',
      confidence: 90,
      arrowCompliance: 85,
      bloomsAlignment: 88,
      conceptFlow: 82,
      specificity: 90,
    }));

    const result = await reviewChapterWithCritic({
      ...baseParams(),
      qualityScore: 50,
    });

    expect(result).not.toBeNull();
    expect(result!.verdict).toBe('approve');
    expect(result!.confidence).toBe(90);
    expect(result!.arrowCompliance).toBe(85);
    expect(result!.bloomsAlignment).toBe(88);
    expect(result!.conceptFlow).toBe(82);
    expect(result!.specificity).toBe(90);
    expect(result!.actionableImprovements).toEqual([]);
    expect(mockRunSAM).toHaveBeenCalledTimes(1);
  });

  it('fires critic at qualityScore = 45 (BORDERLINE_MIN boundary)', async () => {
    mockRunSAM.mockResolvedValueOnce(buildChapterCriticResponse());

    const result = await reviewChapterWithCritic({
      ...baseParams(),
      qualityScore: 45,
    });

    expect(result).not.toBeNull();
    expect(mockRunSAM).toHaveBeenCalledTimes(1);
  });

  it('fires critic at qualityScore = 58 (BORDERLINE_MAX boundary)', async () => {
    mockRunSAM.mockResolvedValueOnce(buildChapterCriticResponse());

    const result = await reviewChapterWithCritic({
      ...baseParams(),
      qualityScore: 58,
    });

    expect(result).not.toBeNull();
    expect(mockRunSAM).toHaveBeenCalledTimes(1);
  });

  it('returns revise verdict with actionable improvements for low-quality content', async () => {
    mockRunSAM.mockResolvedValueOnce(buildChapterCriticResponse({
      verdict: 'revise',
      confidence: 75,
      arrowCompliance: 60,
      bloomsAlignment: 55,
      conceptFlow: 70,
      specificity: 65,
      actionableImprovements: [
        'Add ARROW walkthrough phase objectives',
        'Align objectives with Bloom\'s UNDERSTAND level verbs',
      ],
    }));

    const result = await reviewChapterWithCritic({
      ...baseParams(),
      qualityScore: 52,
    });

    expect(result).not.toBeNull();
    expect(result!.verdict).toBe('revise');
    expect(result!.confidence).toBe(75);
    expect(result!.actionableImprovements).toHaveLength(2);
    expect(result!.actionableImprovements[0]).toContain('ARROW');
  });

  it('overrides low-confidence revise to approve (confidence < 60)', async () => {
    mockRunSAM.mockResolvedValueOnce(buildChapterCriticResponse({
      verdict: 'revise',
      confidence: 50,
      arrowCompliance: 65,
      bloomsAlignment: 68,
      conceptFlow: 70,
      specificity: 72,
      actionableImprovements: ['Minor improvement suggestion'],
    }));

    const result = await reviewChapterWithCritic({
      ...baseParams(),
      qualityScore: 55,
    });

    expect(result).not.toBeNull();
    // Low-confidence revise should be overridden to approve
    expect(result!.verdict).toBe('approve');
    expect(result!.confidence).toBe(50);
    // Improvements are still present even though verdict is overridden
    expect(result!.actionableImprovements).toHaveLength(1);
  });

  it('does not override revise when confidence = 60 (at threshold)', async () => {
    mockRunSAM.mockResolvedValueOnce(buildChapterCriticResponse({
      verdict: 'revise',
      confidence: 60,
      actionableImprovements: ['Fix alignment'],
    }));

    const result = await reviewChapterWithCritic({
      ...baseParams(),
      qualityScore: 48,
    });

    expect(result).not.toBeNull();
    expect(result!.verdict).toBe('revise');
    expect(result!.confidence).toBe(60);
  });

  it('does not override reject verdict even with low confidence', async () => {
    mockRunSAM.mockResolvedValueOnce(buildChapterCriticResponse({
      verdict: 'reject',
      confidence: 40,
      actionableImprovements: ['Fundamentally flawed'],
    }));

    const result = await reviewChapterWithCritic({
      ...baseParams(),
      qualityScore: 46,
    });

    expect(result).not.toBeNull();
    // Reject is not subject to low-confidence override (only revise is)
    expect(result!.verdict).toBe('reject');
    expect(result!.confidence).toBe(40);
  });

  it('degrades gracefully to rule-based critique on AI timeout', async () => {
    mockRunSAM.mockRejectedValueOnce(new Error('Critic timed out after 12000ms'));

    const result = await reviewChapterWithCritic({
      ...baseParams(),
      qualityScore: 50,
    });

    // Should return a rule-based critique, not null and not throw
    expect(result).not.toBeNull();
    expect(result!.confidence).toBe(65); // Rule-based fallback uses confidence 65
    expect(['approve', 'revise', 'reject']).toContain(result!.verdict);
    expect(typeof result!.reasoning).toBe('string');
  });

  it('degrades gracefully to rule-based critique on AI network error', async () => {
    mockRunSAM.mockRejectedValueOnce(new Error('Network error'));

    const result = await reviewChapterWithCritic({
      ...baseParams(),
      qualityScore: 47,
    });

    expect(result).not.toBeNull();
    expect(result!.confidence).toBe(65);
  });

  it('handles AI response with markdown fences around JSON', async () => {
    const jsonBody = buildChapterCriticResponse({
      verdict: 'approve',
      confidence: 82,
    });
    const wrappedResponse = '```json\n' + jsonBody + '\n```';
    mockRunSAM.mockResolvedValueOnce(wrappedResponse);

    const result = await reviewChapterWithCritic({
      ...baseParams(),
      qualityScore: 50,
    });

    expect(result).not.toBeNull();
    expect(result!.verdict).toBe('approve');
    expect(result!.confidence).toBe(82);
  });

  it('passes prior chapters and concept tracker to AI prompt', async () => {
    const priorChapters = [
      makeCompletedChapter({
        position: 1,
        title: 'Getting Started',
        bloomsLevel: 'REMEMBER' as BloomsLevel,
        learningObjectives: ['Recall basic HTML tags'],
        keyTopics: ['HTML', 'tags'],
      }),
    ];

    const conceptTracker: ConceptTracker = {
      concepts: new Map([
        ['HTML', { concept: 'HTML', introducedInChapter: 1, bloomsLevel: 'REMEMBER' as BloomsLevel }],
        ['CSS', { concept: 'CSS', introducedInChapter: 1, bloomsLevel: 'REMEMBER' as BloomsLevel }],
      ]),
      vocabulary: ['HTML', 'CSS'],
      skillsBuilt: [],
    };

    mockRunSAM.mockResolvedValueOnce(buildChapterCriticResponse());

    await reviewChapterWithCritic({
      ...baseParams(),
      priorChapters,
      conceptTracker,
      chapter: makeChapter({ position: 2 }),
      qualityScore: 50,
    });

    expect(mockRunSAM).toHaveBeenCalledTimes(1);
    const callArgs = mockRunSAM.mock.calls[0][0];
    expect(callArgs.capability).toBe('analysis');
    expect(callArgs.messages[0].content).toContain('Getting Started');
    expect(callArgs.messages[0].content).toContain('HTML');
  });

  it('clamps confidence to 0-100 range', async () => {
    mockRunSAM.mockResolvedValueOnce(buildChapterCriticResponse({
      confidence: 150,
      arrowCompliance: -10,
    }));

    const result = await reviewChapterWithCritic({
      ...baseParams(),
      qualityScore: 50,
    });

    expect(result).not.toBeNull();
    expect(result!.confidence).toBe(100);
    expect(result!.arrowCompliance).toBe(0);
  });

  it('defaults unparseable verdict to approve', async () => {
    mockRunSAM.mockResolvedValueOnce(buildChapterCriticResponse({
      verdict: 'maybe',
    }));

    const result = await reviewChapterWithCritic({
      ...baseParams(),
      qualityScore: 50,
    });

    expect(result).not.toBeNull();
    expect(result!.verdict).toBe('approve');
  });

  it('rule-based fallback flags chapter with few learning objectives', async () => {
    mockRunSAM.mockRejectedValueOnce(new Error('AI unavailable'));

    const result = await reviewChapterWithCritic({
      ...baseParams(),
      chapter: makeChapter({
        learningObjectives: ['Only one objective'],
      }),
      qualityScore: 50,
    });

    expect(result).not.toBeNull();
    expect(result!.actionableImprovements.length).toBeGreaterThan(0);
    expect(result!.actionableImprovements.some(
      imp => imp.toLowerCase().includes('learning objectives')
    )).toBe(true);
  });

  it('rule-based fallback detects generic titles for middle chapters', async () => {
    mockRunSAM.mockRejectedValueOnce(new Error('AI unavailable'));

    const result = await reviewChapterWithCritic({
      ...baseParams(),
      chapter: makeChapter({
        title: 'Introduction',
        position: 3,
      }),
      courseContext: makeCourseContext({ totalChapters: 8 }),
      qualityScore: 50,
    });

    expect(result).not.toBeNull();
    expect(result!.actionableImprovements.some(
      imp => imp.toLowerCase().includes('generic')
    )).toBe(true);
  });
});

// ============================================================================
// reviewSectionWithCritic
// ============================================================================

describe('reviewSectionWithCritic', () => {
  const baseParams = () => ({
    userId: 'user-123',
    section: makeSection(),
    chapter: makeChapter(),
    priorSections: [] as GeneratedSection[],
    courseContext: makeCourseContext(),
  });

  it('returns null when qualityScore is outside borderline range (score = 70)', async () => {
    const result = await reviewSectionWithCritic({
      ...baseParams(),
      qualityScore: 70,
    });

    expect(result).toBeNull();
    expect(mockRunSAM).not.toHaveBeenCalled();
  });

  it('returns null when qualityScore < 45', async () => {
    const result = await reviewSectionWithCritic({
      ...baseParams(),
      qualityScore: 30,
    });

    expect(result).toBeNull();
    expect(mockRunSAM).not.toHaveBeenCalled();
  });

  it('calls AI and returns critique within borderline range', async () => {
    mockRunSAM.mockResolvedValueOnce(buildSectionCriticResponse({
      verdict: 'approve',
      confidence: 85,
      topicRelevance: 88,
    }));

    const result = await reviewSectionWithCritic({
      ...baseParams(),
      qualityScore: 50,
    });

    expect(result).not.toBeNull();
    expect(result!.verdict).toBe('approve');
    expect(result!.confidence).toBe(85);
    expect(result!.topicRelevance).toBe(88);
    expect(mockRunSAM).toHaveBeenCalledTimes(1);
  });

  it('overrides low-confidence revise to approve for sections', async () => {
    mockRunSAM.mockResolvedValueOnce(buildSectionCriticResponse({
      verdict: 'revise',
      confidence: 45,
    }));

    const result = await reviewSectionWithCritic({
      ...baseParams(),
      qualityScore: 50,
    });

    expect(result).not.toBeNull();
    expect(result!.verdict).toBe('approve');
    expect(result!.confidence).toBe(45);
  });

  it('degrades to rule-based critique on AI failure', async () => {
    mockRunSAM.mockRejectedValueOnce(new Error('Timeout'));

    const result = await reviewSectionWithCritic({
      ...baseParams(),
      qualityScore: 50,
    });

    expect(result).not.toBeNull();
    expect(result!.confidence).toBe(60); // Rule-based section fallback uses 60
    expect(['approve', 'revise', 'reject']).toContain(result!.verdict);
  });

  it('fires at qualityScore = 45 (BORDERLINE_MIN boundary)', async () => {
    mockRunSAM.mockResolvedValueOnce(buildSectionCriticResponse());

    const result = await reviewSectionWithCritic({
      ...baseParams(),
      qualityScore: 45,
    });

    expect(result).not.toBeNull();
  });

  it('fires at qualityScore = 58 (BORDERLINE_MAX boundary)', async () => {
    mockRunSAM.mockResolvedValueOnce(buildSectionCriticResponse());

    const result = await reviewSectionWithCritic({
      ...baseParams(),
      qualityScore: 58,
    });

    expect(result).not.toBeNull();
  });
});

// ============================================================================
// reviewDetailsWithCritic
// ============================================================================

describe('reviewDetailsWithCritic', () => {
  const baseParams = () => ({
    userId: 'user-123',
    details: makeSectionDetails(),
    section: makeSection(),
    chapter: makeChapter(),
    courseContext: makeCourseContext(),
  });

  it('returns null when qualityScore is outside borderline range', async () => {
    const result = await reviewDetailsWithCritic({
      ...baseParams(),
      qualityScore: 65,
    });

    expect(result).toBeNull();
    expect(mockRunSAM).not.toHaveBeenCalled();
  });

  it('calls AI and returns critique within borderline range', async () => {
    mockRunSAM.mockResolvedValueOnce(buildDetailsCriticResponse({
      verdict: 'approve',
      confidence: 88,
      motivationClarity: 90,
      intuitionClarity: 85,
    }));

    const result = await reviewDetailsWithCritic({
      ...baseParams(),
      qualityScore: 50,
    });

    expect(result).not.toBeNull();
    expect(result!.verdict).toBe('approve');
    expect(result!.confidence).toBe(88);
    expect(result!.motivationClarity).toBe(90);
    expect(result!.intuitionClarity).toBe(85);
  });

  it('overrides low-confidence revise to approve for details', async () => {
    mockRunSAM.mockResolvedValueOnce(buildDetailsCriticResponse({
      verdict: 'revise',
      confidence: 55,
    }));

    const result = await reviewDetailsWithCritic({
      ...baseParams(),
      qualityScore: 50,
    });

    expect(result).not.toBeNull();
    expect(result!.verdict).toBe('approve');
    expect(result!.confidence).toBe(55);
  });

  it('degrades to rule-based critique on AI failure', async () => {
    mockRunSAM.mockRejectedValueOnce(new Error('AI provider error'));

    const result = await reviewDetailsWithCritic({
      ...baseParams(),
      qualityScore: 50,
    });

    expect(result).not.toBeNull();
    expect(result!.confidence).toBe(60); // Rule-based details fallback uses 60
    expect(['approve', 'revise', 'reject']).toContain(result!.verdict);
  });

  it('returns null when qualityScore < 45', async () => {
    const result = await reviewDetailsWithCritic({
      ...baseParams(),
      qualityScore: 20,
    });

    expect(result).toBeNull();
  });
});

// ============================================================================
// buildSectionCriticFeedbackBlock
// ============================================================================

describe('buildSectionCriticFeedbackBlock', () => {
  it('builds formatted markdown block with verdict and improvements', () => {
    const critique: SectionCritique = {
      verdict: 'revise',
      confidence: 75,
      reasoning: 'Section needs improvement.',
      topicRelevance: 65,
      contentTypeAppropriate: 80,
      uniqueness: 70,
      conceptProgression: 60,
      actionableImprovements: [
        'Align topic more closely with chapter objectives',
        'Improve concept progression flow',
      ],
    };

    const result = buildSectionCriticFeedbackBlock(critique);

    expect(result).toContain('INDEPENDENT SECTION REVIEWER FEEDBACK');
    expect(result).toContain('confidence: 75%');
    expect(result).toContain('Required Improvements');
    expect(result).toContain('1. Align topic more closely with chapter objectives');
    expect(result).toContain('2. Improve concept progression flow');
    expect(result).toContain('TopicRelevance=65');
    expect(result).toContain('ContentType=80');
    expect(result).toContain('Uniqueness=70');
    expect(result).toContain('ConceptProgression=60');
    expect(result).toContain('Address ALL reviewer feedback');
  });

  it('handles empty improvements array', () => {
    const critique: SectionCritique = {
      verdict: 'approve',
      confidence: 90,
      reasoning: 'All good.',
      topicRelevance: 90,
      contentTypeAppropriate: 88,
      uniqueness: 95,
      conceptProgression: 85,
      actionableImprovements: [],
    };

    const result = buildSectionCriticFeedbackBlock(critique);

    expect(result).toContain('INDEPENDENT SECTION REVIEWER FEEDBACK');
    expect(result).toContain('confidence: 90%');
    expect(result).toContain('Required Improvements');
    // No numbered improvements present
    expect(result).not.toMatch(/\d+\.\s+\w/);
  });
});

// ============================================================================
// buildDetailsCriticFeedbackBlock
// ============================================================================

describe('buildDetailsCriticFeedbackBlock', () => {
  it('builds formatted markdown block with dimension scores', () => {
    const critique: DetailsCritique = {
      verdict: 'revise',
      confidence: 70,
      reasoning: 'Details need more concrete examples.',
      motivationClarity: 80,
      intuitionClarity: 75,
      equationIntuitionQuality: 60,
      visualizationQuality: 65,
      exampleConcreteness: 55,
      misconceptionRepairQuality: 70,
      actionableImprovements: [
        'Add a concrete worked example',
        'Strengthen the visualization steps',
      ],
    };

    const result = buildDetailsCriticFeedbackBlock(critique);

    expect(result).toContain('INDEPENDENT DETAILS REVIEWER FEEDBACK');
    expect(result).toContain('confidence: 70%');
    expect(result).toContain('Required Improvements');
    expect(result).toContain('1. Add a concrete worked example');
    expect(result).toContain('2. Strengthen the visualization steps');
    expect(result).toContain('Motivation=80');
    expect(result).toContain('Intuition=75');
    expect(result).toContain('Equation=60');
    expect(result).toContain('Visualization=65');
    expect(result).toContain('Example=55');
    expect(result).toContain('ConfusionFix=70');
  });
});
