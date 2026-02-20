/**
 * Self-Critique Tests
 *
 * Tests for lib/sam/course-creation/self-critique.ts which provides
 * self-critique analysis (AI-powered with rule-based fallback) of
 * AI-generated course content.
 *
 * Covers:
 * - Structured thinking step detection and depth analysis
 * - ARROW framework phase coverage
 * - Confidence score calculation (0-100 range)
 * - shouldRetry logic (confidence < 50 OR qualityScore.overall < 55)
 * - AI critique path with timeout fallback
 * - Rule-based critique path (no userId)
 * - topImprovements capped at 3
 */

// ---------------------------------------------------------------------------
// Mocks (jest.mock calls are hoisted to top of file by babel/jest)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Imports (after mocks so they get the mocked versions)
// ---------------------------------------------------------------------------

import { critiqueGeneration } from '../self-critique';
import { GenerationCritique } from '../self-critique';
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import { QualityScore, CourseContext, BloomsLevel } from '../types';
import { SAMValidationResult } from '../quality-integration';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockRunSAM = runSAMChatWithPreference as jest.Mock;

const mockQualityScore: QualityScore = {
  overall: 70,
  uniqueness: 75,
  specificity: 65,
  bloomsAlignment: 72,
  completeness: 70,
  depth: 68,
};

const mockCourseContext: CourseContext = {
  courseTitle: 'React Fundamentals',
  courseDescription: 'Learn React from scratch',
  courseCategory: 'programming',
  targetAudience: 'developers',
  difficulty: 'intermediate',
  courseLearningObjectives: ['Understand React components', 'Build SPAs'],
  totalChapters: 5,
  sectionsPerChapter: 4,
  bloomsFocus: ['UNDERSTAND', 'APPLY'],
  learningObjectivesPerChapter: 3,
  learningObjectivesPerSection: 2,
};

const mockSamResult: SAMValidationResult = {
  combinedScore: 70,
  qualityGateScore: 72,
  pedagogyScore: 68,
  qualityIssues: [],
  pedagogyIssues: [],
  suggestions: [],
  failedGates: [],
  samValidationRan: true,
};

const baseParams = {
  output: 'Generated chapter content with sections and objectives.',
  stage: 1 as const,
  bloomsLevel: 'UNDERSTAND' as BloomsLevel,
  courseContext: mockCourseContext,
  qualityScore: mockQualityScore,
  samResult: mockSamResult,
};

/**
 * Build a thinking string that includes the given step names with
 * adequate depth (>= 30 chars of content after each header).
 */
function buildThinkingWithSteps(steps: string[]): string {
  return steps
    .map(
      (step, i) =>
        `Step ${i + 1}: ${step}\n` +
        `This section covers the ${step.toLowerCase()} phase in detail with thorough analysis and reasoning about the approach.`,
    )
    .join('\n\n');
}

/**
 * Build a thinking string that includes ARROW phase keywords.
 */
function buildThinkingWithArrowPhases(phases: string[]): string {
  const phaseContent: Record<string, string> = {
    application:
      'We apply application-based reasoning to ensure real-world relevance in every module.',
    'reverse engineer':
      'We reverse engineer the final skill to map prerequisite knowledge backward.',
    intuition:
      'Building intuition through progressive examples and conceptual scaffolding.',
    formalization:
      'Formalization of concepts through mathematical notation and formal definitions.',
    'failure analysis':
      'Failure analysis identifies common misconceptions and debugging strategies.',
    'design thinking':
      'Design thinking informs the layout and flow of interactive components.',
    constraint:
      'Constraint-based design ensures content fits within cognitive load limits.',
    'build & iterate':
      'Build iterative exercises that reinforce learning through repetition.',
    'socratic defense':
      'Socratic questioning challenges learners to justify their reasoning.',
    'meta-cognition':
      'Meta-cognition prompts help learners reflect on their understanding.',
    'knowledge graph':
      'Knowledge graph connections link new concepts to prior learning.',
  };

  return phases
    .map((p) => phaseContent[p.toLowerCase()] || `${p} phase is addressed here in detail.`)
    .join('\n\n');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('critiqueGeneration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. Detects ARROW ARC structured thinking keywords
  // -------------------------------------------------------------------------
  describe('structured thinking detection', () => {
    it('detects structured thinking keywords and ARROW phases when all Stage 1 steps present', async () => {
      const allStage1Steps = [
        'ARROW ARC',
        'REVERSE ENGINEER',
        'TOPIC SELECTION',
        'LEARNING ARC',
        "BLOOM'S INTEGRATION",
        'CONCEPT TRACKING',
      ];

      const thinking = buildThinkingWithSteps(allStage1Steps);

      const result = await critiqueGeneration({
        ...baseParams,
        thinking,
      });

      expect(result.reasoningAnalysis.followedStructuredThinking).toBe(true);
      // Most steps covered means weakSteps should be minimal
      expect(result.reasoningAnalysis.weakSteps.length).toBeLessThanOrEqual(1);
    });

    it('identifies ARROW framework phases in thinking and output text', async () => {
      const thinking = buildThinkingWithArrowPhases([
        'application',
        'reverse engineer',
        'intuition',
        'formalization',
        'failure analysis',
      ]);

      const result = await critiqueGeneration({
        ...baseParams,
        thinking,
        output: 'Output that mentions design thinking and socratic questioning.',
      });

      expect(result.reasoningAnalysis.arrowPhasesCovered).toEqual(
        expect.arrayContaining(['Application', 'Reverse Engineer', 'Intuition']),
      );
      expect(result.reasoningAnalysis.arrowPhasesCovered.length).toBeGreaterThanOrEqual(5);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Missing expected steps populates weakSteps
  // -------------------------------------------------------------------------
  describe('weakSteps for missing steps', () => {
    it('flags missing steps as weak when only 2 of 6 Stage 1 steps are present', async () => {
      // Only include 2 of the 6 expected Stage 1 steps
      const thinking = buildThinkingWithSteps(['ARROW ARC', 'TOPIC SELECTION']);

      const result = await critiqueGeneration({
        ...baseParams,
        thinking,
      });

      // 4 of 6 steps missing => followedStructuredThinking should be false (< 60%)
      expect(result.reasoningAnalysis.followedStructuredThinking).toBe(false);

      // weakSteps should mention the missing step names
      const weakStepsText = result.reasoningAnalysis.weakSteps.join(' ');
      expect(weakStepsText).toContain('REVERSE ENGINEER');
      expect(weakStepsText).toContain('LEARNING ARC');
      expect(weakStepsText).toContain("BLOOM'S INTEGRATION");
      expect(weakStepsText).toContain('CONCEPT TRACKING');
    });

    it('marks followedStructuredThinking true when 60%+ steps are covered', async () => {
      // 4 of 6 steps = 66.7% => should be true
      const thinking = buildThinkingWithSteps([
        'ARROW ARC',
        'REVERSE ENGINEER',
        'TOPIC SELECTION',
        'LEARNING ARC',
      ]);

      const result = await critiqueGeneration({
        ...baseParams,
        thinking,
      });

      expect(result.reasoningAnalysis.followedStructuredThinking).toBe(true);
    });

    it('detects shallow steps (content < 30 chars after header)', async () => {
      // Step with header but very brief content
      const thinking =
        'ARROW ARC\nOK.\n\n' +
        'Step 2: REVERSE ENGINEER\n' +
        'This section covers the reverse engineering phase in detail with thorough analysis and reasoning.\n\n' +
        'Step 3: TOPIC SELECTION\n' +
        'This section covers topic selection with detailed analysis of curriculum requirements and prerequisites.\n\n' +
        'Step 4: LEARNING ARC\n' +
        'This section covers learning arc design with progressive complexity and scaffolding strategies.\n\n' +
        "Step 5: BLOOM'S INTEGRATION\n" +
        "This section covers bloom's integration with verb alignment and cognitive level progression.\n\n" +
        'Step 6: CONCEPT TRACKING\n' +
        'This section covers concept tracking with prerequisite mapping and knowledge graph construction.';

      const result = await critiqueGeneration({
        ...baseParams,
        thinking,
      });

      // ARROW ARC has only "OK." (3 chars) after it, so it should appear as shallow
      const weakStepsText = result.reasoningAnalysis.weakSteps.join(' ');
      expect(weakStepsText).toContain('ARROW ARC');
    });
  });

  // -------------------------------------------------------------------------
  // 3. Confidence score in 0-100 range
  // -------------------------------------------------------------------------
  describe('confidence score bounds', () => {
    it('returns confidence in 0-100 range for well-formed input', async () => {
      const thinking = buildThinkingWithSteps([
        'ARROW ARC',
        'REVERSE ENGINEER',
        'TOPIC SELECTION',
        'LEARNING ARC',
        "BLOOM'S INTEGRATION",
        'CONCEPT TRACKING',
      ]);

      const result = await critiqueGeneration({
        ...baseParams,
        thinking,
      });

      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(100);
    });

    it('returns confidence in 0-100 range for empty thinking', async () => {
      const result = await critiqueGeneration({
        ...baseParams,
        thinking: '',
      });

      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(100);
    });

    it('returns confidence in 0-100 range for extremely long input', async () => {
      const thinking = buildThinkingWithSteps([
        'ARROW ARC',
        'REVERSE ENGINEER',
        'TOPIC SELECTION',
      ]).repeat(50);

      const result = await critiqueGeneration({
        ...baseParams,
        thinking,
      });

      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(100);
    });
  });

  // -------------------------------------------------------------------------
  // 4. shouldRetry when confidence < 50
  // -------------------------------------------------------------------------
  describe('shouldRetry logic', () => {
    it('returns shouldRetry true when confidence is low (poor reasoning)', async () => {
      // Empty thinking + low quality => low confidence => shouldRetry
      const result = await critiqueGeneration({
        ...baseParams,
        thinking: '',
        qualityScore: { ...mockQualityScore, overall: 40 },
      });

      expect(result.confidenceScore).toBeLessThan(50);
      expect(result.shouldRetry).toBe(true);
    });

    // -----------------------------------------------------------------------
    // 5. shouldRetry when qualityScore.overall < 55
    // -----------------------------------------------------------------------
    it('returns shouldRetry true when qualityScore.overall < 55 even with decent reasoning', async () => {
      const thinking = buildThinkingWithSteps([
        'ARROW ARC',
        'REVERSE ENGINEER',
        'TOPIC SELECTION',
        'LEARNING ARC',
      ]);

      const result = await critiqueGeneration({
        ...baseParams,
        thinking,
        qualityScore: { ...mockQualityScore, overall: 50 },
      });

      // qualityScore.overall < 55 triggers shouldRetry regardless of confidence
      expect(result.shouldRetry).toBe(true);
    });

    // -----------------------------------------------------------------------
    // 6. shouldRetry false for good scores
    // -----------------------------------------------------------------------
    it('returns shouldRetry false when confidence and quality are both high', async () => {
      const allSteps = [
        'ARROW ARC',
        'REVERSE ENGINEER',
        'TOPIC SELECTION',
        'LEARNING ARC',
        "BLOOM'S INTEGRATION",
        'CONCEPT TRACKING',
      ];
      const arrowPhases = [
        'application',
        'reverse engineer',
        'intuition',
        'formalization',
        'failure analysis',
      ];

      const thinking =
        buildThinkingWithSteps(allSteps) + '\n\n' + buildThinkingWithArrowPhases(arrowPhases);

      const highQuality: QualityScore = {
        ...mockQualityScore,
        overall: 85,
      };

      const result = await critiqueGeneration({
        ...baseParams,
        thinking,
        qualityScore: highQuality,
      });

      // High coverage + high quality => confidence >= 50 and overall >= 55
      expect(result.confidenceScore).toBeGreaterThanOrEqual(50);
      expect(result.shouldRetry).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 7. Rule-based path when no userId
  // -------------------------------------------------------------------------
  describe('rule-based critique (no userId)', () => {
    it('uses rule-based critique and does not call AI when userId is absent', async () => {
      const thinking = buildThinkingWithSteps(['ARROW ARC', 'TOPIC SELECTION']);

      const result = await critiqueGeneration({
        ...baseParams,
        thinking,
        // No userId => rule-based path
      });

      expect(mockRunSAM).not.toHaveBeenCalled();

      // Should still return a valid GenerationCritique
      expect(result).toHaveProperty('reasoningAnalysis');
      expect(result).toHaveProperty('topImprovements');
      expect(result).toHaveProperty('confidenceScore');
      expect(result).toHaveProperty('shouldRetry');
      expect(typeof result.confidenceScore).toBe('number');
      expect(typeof result.shouldRetry).toBe('boolean');
    });
  });

  // -------------------------------------------------------------------------
  // 8. AI timeout falls back to rule-based
  // -------------------------------------------------------------------------
  describe('AI critique with fallback', () => {
    it('falls back to rule-based when AI call rejects (timeout)', async () => {
      mockRunSAM.mockRejectedValueOnce(new Error('Request timed out'));

      const thinking = buildThinkingWithSteps(['ARROW ARC', 'REVERSE ENGINEER']);

      const result = await critiqueGeneration({
        ...baseParams,
        thinking,
        userId: 'test-user-123',
      });

      expect(mockRunSAM).toHaveBeenCalledTimes(1);

      // Should still return a valid GenerationCritique (rule-based)
      expect(result).toHaveProperty('reasoningAnalysis');
      expect(result).toHaveProperty('topImprovements');
      expect(result).toHaveProperty('confidenceScore');
      expect(result).toHaveProperty('shouldRetry');
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(100);
    });

    it('uses AI critique result when AI succeeds with valid JSON', async () => {
      mockRunSAM.mockResolvedValueOnce(
        JSON.stringify({
          weakSteps: ['TOPIC SELECTION was superficial'],
          topImprovements: ['Add concrete examples in topic selection step'],
          confidenceScore: 72,
          shouldRetry: false,
        }),
      );

      const result = await critiqueGeneration({
        ...baseParams,
        thinking: 'Some structured thinking content for analysis.',
        userId: 'test-user-123',
      });

      expect(mockRunSAM).toHaveBeenCalledTimes(1);
      expect(result.confidenceScore).toBe(72);
      expect(result.reasoningAnalysis.weakSteps).toEqual(['TOPIC SELECTION was superficial']);
      expect(result.topImprovements).toEqual([
        'Add concrete examples in topic selection step',
      ]);
    });

    it('falls back to rule-based when AI returns invalid JSON', async () => {
      mockRunSAM.mockResolvedValueOnce('This is not JSON at all');

      const thinking = buildThinkingWithSteps(['ARROW ARC']);

      const result = await critiqueGeneration({
        ...baseParams,
        thinking,
        userId: 'test-user-123',
      });

      // AI parse failure => falls back to rule-based
      expect(result).toHaveProperty('reasoningAnalysis');
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(100);
    });
  });

  // -------------------------------------------------------------------------
  // 9. topImprovements limited to 3
  // -------------------------------------------------------------------------
  describe('topImprovements cap', () => {
    it('returns at most 3 top improvements (rule-based path)', async () => {
      // Empty thinking + many quality issues to generate multiple improvements
      const lowQuality: QualityScore = {
        overall: 40,
        uniqueness: 30,
        specificity: 30,
        bloomsAlignment: 30,
        completeness: 40,
        depth: 30,
      };

      const samWithIssues: SAMValidationResult = {
        ...mockSamResult,
        qualityIssues: ['SAM detected fundamental structure problems'],
      };

      const result = await critiqueGeneration({
        ...baseParams,
        thinking: '',
        qualityScore: lowQuality,
        samResult: samWithIssues,
      });

      expect(result.topImprovements.length).toBeLessThanOrEqual(3);
      expect(Array.isArray(result.topImprovements)).toBe(true);
    });

    it('returns at most 3 top improvements (AI path)', async () => {
      mockRunSAM.mockResolvedValueOnce(
        JSON.stringify({
          weakSteps: ['A', 'B', 'C', 'D', 'E'],
          topImprovements: ['Imp 1', 'Imp 2', 'Imp 3', 'Imp 4', 'Imp 5'],
          confidenceScore: 60,
          shouldRetry: false,
        }),
      );

      const result = await critiqueGeneration({
        ...baseParams,
        thinking: 'Some thinking.',
        userId: 'test-user-123',
      });

      expect(result.topImprovements.length).toBeLessThanOrEqual(3);
    });
  });

  // -------------------------------------------------------------------------
  // Stage-specific step expectations
  // -------------------------------------------------------------------------
  describe('stage-specific expected steps', () => {
    it('checks Stage 2 expected steps correctly', async () => {
      const stage2Steps = [
        'ARROW SECTION FLOW',
        'TOPIC SELECTION',
        'CONTENT TYPE',
        'COGNITIVE LOAD',
        'UNIQUENESS',
        'OBJECTIVE ALIGNMENT',
      ];

      const thinking = buildThinkingWithSteps(stage2Steps);

      const result = await critiqueGeneration({
        ...baseParams,
        thinking,
        stage: 2,
      });

      expect(result.reasoningAnalysis.followedStructuredThinking).toBe(true);
    });

    it('checks Stage 3 expected steps correctly', async () => {
      const stage3Steps = [
        'LESSON CONTENT',
        'LEARNING OBJECTIVES',
        'KEY CONCEPTS',
        'ARROW ASSESSMENT',
      ];

      const thinking = buildThinkingWithSteps(stage3Steps);

      const result = await critiqueGeneration({
        ...baseParams,
        thinking,
        stage: 3,
      });

      expect(result.reasoningAnalysis.followedStructuredThinking).toBe(true);
    });

    it('flags missing Stage 3 steps as weak', async () => {
      // Only 1 of 4 Stage 3 steps (25% < 60%)
      const thinking = buildThinkingWithSteps(['LESSON CONTENT']);

      const result = await critiqueGeneration({
        ...baseParams,
        thinking,
        stage: 3,
      });

      expect(result.reasoningAnalysis.followedStructuredThinking).toBe(false);
      const weakText = result.reasoningAnalysis.weakSteps.join(' ');
      expect(weakText).toContain('LEARNING OBJECTIVES');
      expect(weakText).toContain('KEY CONCEPTS');
      expect(weakText).toContain('ARROW ASSESSMENT');
    });
  });

  // -------------------------------------------------------------------------
  // ARROW coverage analysis
  // -------------------------------------------------------------------------
  describe('ARROW phase coverage', () => {
    it('detects all 11 ARROW phases when all keywords present', async () => {
      const allPhases = [
        'application',
        'reverse engineer',
        'intuition',
        'formalization',
        'failure analysis',
        'design thinking',
        'constraint',
        'build & iterate',
        'socratic defense',
        'meta-cognition',
        'knowledge graph',
      ];

      const thinking = buildThinkingWithArrowPhases(allPhases);

      const result = await critiqueGeneration({
        ...baseParams,
        thinking,
      });

      expect(result.reasoningAnalysis.arrowPhasesCovered.length).toBe(11);
      expect(result.reasoningAnalysis.arrowPhasesCovered).toEqual(
        expect.arrayContaining([
          'Application',
          'Reverse Engineer',
          'Intuition',
          'Formalization',
          'Failure Analysis',
          'Design Thinking',
          'Constraint',
          'Build & Iterate',
          'Socratic Defense',
          'Meta-Cognition',
          'Knowledge Graph',
        ]),
      );
    });

    it('returns empty array when no ARROW phases are mentioned', async () => {
      const thinking = 'This is generic thinking without any specific framework references.';

      const result = await critiqueGeneration({
        ...baseParams,
        thinking,
        output: 'Generic output text.',
      });

      expect(result.reasoningAnalysis.arrowPhasesCovered.length).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Concept tracker references
  // -------------------------------------------------------------------------
  describe('concept tracker references', () => {
    it('detects referenced prior concepts when conceptTracker is provided', async () => {
      const concepts = new Map<string, { chapterNumber: number; sectionNumber?: number }>([
        ['useState', { chapterNumber: 1 }],
        ['useEffect', { chapterNumber: 2 }],
        ['props', { chapterNumber: 1 }],
      ]);

      const thinking =
        'In this chapter we build upon the useState hook introduced earlier, ' +
        'and we also reference props handling patterns.';

      const result = await critiqueGeneration({
        ...baseParams,
        thinking,
        conceptTracker: {
          concepts,
          vocabulary: ['hook', 'component'],
          skillsBuilt: ['state management'],
        },
      });

      // 2 of 3 concepts referenced (66%) >= 20% threshold
      expect(result.reasoningAnalysis.referencedPriorConcepts).toBe(true);
    });

    it('returns false for referencedPriorConcepts when few concepts are mentioned', async () => {
      const concepts = new Map<string, { chapterNumber: number; sectionNumber?: number }>([
        ['useState', { chapterNumber: 1 }],
        ['useEffect', { chapterNumber: 2 }],
        ['useContext', { chapterNumber: 2 }],
        ['useReducer', { chapterNumber: 3 }],
        ['useMemo', { chapterNumber: 3 }],
      ]);

      const thinking = 'This chapter introduces completely new material without referencing prior hooks.';

      const result = await critiqueGeneration({
        ...baseParams,
        thinking,
        conceptTracker: {
          concepts,
          vocabulary: ['hook'],
          skillsBuilt: ['state management'],
        },
      });

      // 0 of 5 concepts referenced (0%) < 20% threshold
      expect(result.reasoningAnalysis.referencedPriorConcepts).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // AI critique response parsing edge cases
  // -------------------------------------------------------------------------
  describe('AI critique response parsing', () => {
    it('clamps confidence score from AI to 0-100 range', async () => {
      mockRunSAM.mockResolvedValueOnce(
        JSON.stringify({
          weakSteps: [],
          topImprovements: [],
          confidenceScore: 150, // Over max
          shouldRetry: false,
        }),
      );

      const result = await critiqueGeneration({
        ...baseParams,
        thinking: 'Some thinking.',
        userId: 'test-user-123',
      });

      expect(result.confidenceScore).toBeLessThanOrEqual(100);
    });

    it('clamps negative confidence score from AI to 0', async () => {
      mockRunSAM.mockResolvedValueOnce(
        JSON.stringify({
          weakSteps: [],
          topImprovements: [],
          confidenceScore: -20, // Below min
          shouldRetry: false,
        }),
      );

      const result = await critiqueGeneration({
        ...baseParams,
        thinking: 'Some thinking.',
        userId: 'test-user-123',
      });

      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
    });

    it('handles AI response with extra text around JSON', async () => {
      mockRunSAM.mockResolvedValueOnce(
        'Here is my analysis:\n' +
          JSON.stringify({
            weakSteps: ['Step A'],
            topImprovements: ['Improve X'],
            confidenceScore: 65,
            shouldRetry: false,
          }) +
          '\n\nHope this helps!',
      );

      const result = await critiqueGeneration({
        ...baseParams,
        thinking: 'Some thinking.',
        userId: 'test-user-123',
      });

      expect(result.confidenceScore).toBe(65);
      expect(result.reasoningAnalysis.weakSteps).toEqual(['Step A']);
    });

    it('overrides AI shouldRetry to true when qualityScore.overall < 55', async () => {
      mockRunSAM.mockResolvedValueOnce(
        JSON.stringify({
          weakSteps: [],
          topImprovements: [],
          confidenceScore: 80,
          shouldRetry: false, // AI says no retry
        }),
      );

      const result = await critiqueGeneration({
        ...baseParams,
        thinking: 'Some thinking.',
        userId: 'test-user-123',
        qualityScore: { ...mockQualityScore, overall: 50 }, // Low quality overrides
      });

      // Despite AI saying false, qualityScore.overall < 55 forces shouldRetry
      expect(result.shouldRetry).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Return structure validation
  // -------------------------------------------------------------------------
  describe('return structure', () => {
    it('always returns a complete GenerationCritique structure', async () => {
      const result = await critiqueGeneration({
        ...baseParams,
        thinking: 'Minimal thinking.',
      });

      // reasoningAnalysis
      expect(result.reasoningAnalysis).toBeDefined();
      expect(typeof result.reasoningAnalysis.followedStructuredThinking).toBe('boolean');
      expect(Array.isArray(result.reasoningAnalysis.weakSteps)).toBe(true);
      expect(typeof result.reasoningAnalysis.referencedPriorConcepts).toBe('boolean');
      expect(Array.isArray(result.reasoningAnalysis.arrowPhasesCovered)).toBe(true);

      // topImprovements
      expect(Array.isArray(result.topImprovements)).toBe(true);

      // confidenceScore
      expect(typeof result.confidenceScore).toBe('number');
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(100);

      // shouldRetry
      expect(typeof result.shouldRetry).toBe('boolean');
    });
  });
});
