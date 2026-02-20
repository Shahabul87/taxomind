/**
 * Course Reflector — Unit Tests
 *
 * Tests the post-generation structural analysis that evaluates course coherence,
 * Bloom's taxonomy progression, concept coverage, and chapter quality.
 *
 * reflectOnCourse() is a PURE SYNC function — fully testable without AI mocks.
 * reflectOnCourseWithAI() wraps it with an LLM call that adjusts scores within guardrails.
 */

// ============================================================================
// Mocks (must precede imports)
// ============================================================================

jest.mock('server-only', () => ({}));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/lib/sam/ai-provider', () => ({
  runSAMChatWithPreference: jest.fn(),
}));

// ============================================================================
// Imports (after mocks)
// ============================================================================

import { reflectOnCourse, reflectOnCourseWithAI } from '../course-reflector';
import {
  CompletedChapter,
  ConceptTracker,
  CourseContext,
  QualityScore,
  BloomsLevel,
  CourseBlueprintPlan,
  CompletedSection,
} from '../types';
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';

const mockedRunSAM = runSAMChatWithPreference as jest.MockedFunction<typeof runSAMChatWithPreference>;

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Build a CompletedChapter with sensible defaults.
 * bloomsLevel must be uppercase to match BLOOMS_LEVELS constant.
 */
function makeChapter(
  pos: number,
  bloomsLevel: BloomsLevel,
  title: string,
  overrides: Partial<CompletedChapter> = {},
): CompletedChapter {
  return {
    position: pos,
    id: `ch-${pos}`,
    title,
    bloomsLevel,
    description: `Description for ${title}`,
    keyTopics: [`topic-${pos}a`, `topic-${pos}b`],
    learningObjectives: [`objective-${pos}`],
    prerequisites: '',
    estimatedTime: '30 min',
    topicsToExpand: [],
    sections: [],
    ...overrides,
  };
}

/** Build a CompletedSection with sensible defaults */
function makeSection(
  pos: number,
  overrides: Partial<CompletedSection> = {},
): CompletedSection {
  return {
    position: pos,
    id: `sec-${pos}`,
    title: `Section ${pos}`,
    contentType: 'reading',
    estimatedDuration: '10 min',
    topicFocus: `focus-${pos}`,
    parentChapterContext: {
      title: 'Parent Chapter',
      bloomsLevel: 'UNDERSTAND',
      relevantObjectives: [],
    },
    ...overrides,
  };
}

/** Build a QualityScore with sensible defaults */
function makeQualityScore(overall: number, chapterNumber?: number): QualityScore {
  return {
    uniqueness: overall,
    specificity: overall,
    bloomsAlignment: overall,
    completeness: overall,
    depth: overall,
    overall,
    chapterNumber,
  };
}

/** Build a minimal CourseContext */
function makeCourseContext(overrides: Partial<CourseContext> = {}): CourseContext {
  return {
    courseTitle: 'Test Course',
    courseDescription: 'A test course',
    courseCategory: 'Programming',
    targetAudience: 'Developers',
    difficulty: 'intermediate',
    courseLearningObjectives: ['Learn testing'],
    totalChapters: 5,
    sectionsPerChapter: 3,
    bloomsFocus: ['UNDERSTAND', 'APPLY', 'ANALYZE'],
    learningObjectivesPerChapter: 3,
    learningObjectivesPerSection: 2,
    ...overrides,
  };
}

/** Build a minimal ConceptTracker (with Map-based concepts) */
function makeConceptTracker(
  concepts: Array<{ name: string; chapters: number[] }> = [],
): ConceptTracker {
  const map = new Map(
    concepts.map(c => [
      c.name.toLowerCase(),
      {
        concept: c.name.toLowerCase(),
        introducedInChapter: c.chapters[0],
        bloomsLevel: 'UNDERSTAND' as BloomsLevel,
      },
    ]),
  );
  return {
    concepts: map,
    vocabulary: [],
    skillsBuilt: [],
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('reflectOnCourse (pure structural analysis)', () => {
  const courseContext = makeCourseContext();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // 1. Coherence score is bounded 0-100
  // --------------------------------------------------------------------------
  it('returns coherence score between 0 and 100', () => {
    const chapters = [
      makeChapter(1, 'REMEMBER', 'Basics'),
      makeChapter(2, 'UNDERSTAND', 'Concepts'),
      makeChapter(3, 'APPLY', 'Practice'),
    ];
    const tracker = makeConceptTracker();
    const scores = chapters.map((_, i) => makeQualityScore(75, i + 1));

    const result = reflectOnCourse(chapters, tracker, courseContext, scores);

    expect(result.coherenceScore).toBeGreaterThanOrEqual(0);
    expect(result.coherenceScore).toBeLessThanOrEqual(100);
  });

  // --------------------------------------------------------------------------
  // 2. Bloom's regression detection
  // --------------------------------------------------------------------------
  it('identifies Bloom\'s progression regressions', () => {
    const chapters = [
      makeChapter(1, 'ANALYZE', 'Deep Analysis'),
      makeChapter(2, 'UNDERSTAND', 'Basic Concepts'), // regression
      makeChapter(3, 'APPLY', 'Practice'),
    ];
    const tracker = makeConceptTracker();
    const scores = chapters.map((_, i) => makeQualityScore(75, i + 1));

    const result = reflectOnCourse(chapters, tracker, courseContext, scores);

    expect(result.bloomsProgression.isMonotonic).toBe(false);
    expect(result.bloomsProgression.gaps.length).toBeGreaterThan(0);
    const regressionGap = result.bloomsProgression.gaps.find(g =>
      g.issue.includes('decreased'),
    );
    expect(regressionGap).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // 3. Large Bloom's jumps
  // --------------------------------------------------------------------------
  it('detects large Bloom\'s jumps (skipping 2+ levels)', () => {
    // REMEMBER (index 0) -> EVALUATE (index 4) = jump of 4
    const chapters = [
      makeChapter(1, 'REMEMBER', 'Recall'),
      makeChapter(2, 'EVALUATE', 'Critical Thinking'), // jump of 4 levels
    ];
    const tracker = makeConceptTracker();
    const scores = chapters.map((_, i) => makeQualityScore(75, i + 1));

    const result = reflectOnCourse(chapters, tracker, courseContext, scores);

    const jumpGap = result.bloomsProgression.gaps.find(g =>
      g.issue.includes('Large'),
    );
    expect(jumpGap).toBeDefined();
    expect(jumpGap!.fromChapter).toBe(1);
    expect(jumpGap!.toChapter).toBe(2);
  });

  // --------------------------------------------------------------------------
  // 4. Flags low-quality chapters below threshold (55)
  // --------------------------------------------------------------------------
  it('flags chapters with quality score below 55', () => {
    const chapters = [
      makeChapter(1, 'REMEMBER', 'Good Chapter'),
      makeChapter(2, 'UNDERSTAND', 'Bad Chapter'),
      makeChapter(3, 'APPLY', 'Good Chapter 2'),
    ];
    const tracker = makeConceptTracker();
    const scores = [
      makeQualityScore(80, 1),
      makeQualityScore(40, 2), // Below LOW_QUALITY_FLAG_THRESHOLD (55)
      makeQualityScore(80, 3),
    ];

    const result = reflectOnCourse(chapters, tracker, courseContext, scores);

    const lowQualityFlag = result.flaggedChapters.find(f =>
      f.position === 2 && f.reason.includes('Quality score'),
    );
    expect(lowQualityFlag).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // 5. Flags statistical outliers (1.5 sigma)
  // --------------------------------------------------------------------------
  it('flags statistical outliers below 1.5 standard deviations', () => {
    // Scores: 80, 82, 78, 85, 40 => mean ~73, stddev ~17.5 => 73 - 1.5*17.5 = 46.8
    // The outlier at 40 is below 46.8, so it should be flagged.
    // However, 40 is also below LOW_QUALITY_FLAG_THRESHOLD (55), so it gets flagged as low quality.
    // Use a value that is above 55 but still an outlier:
    // Scores: 90, 92, 88, 91, 60 => mean ~84.2, stddev ~12.6 => 84.2 - 1.5*12.6 = 65.3
    // 60 < 65.3 and 60 > 55, so it should be flagged as an outlier
    const chapters = [
      makeChapter(1, 'REMEMBER', 'Ch 1'),
      makeChapter(2, 'UNDERSTAND', 'Ch 2'),
      makeChapter(3, 'APPLY', 'Ch 3'),
      makeChapter(4, 'ANALYZE', 'Ch 4'),
      makeChapter(5, 'EVALUATE', 'Ch 5'),
    ];
    const tracker = makeConceptTracker();
    const scores = [
      makeQualityScore(90, 1),
      makeQualityScore(92, 2),
      makeQualityScore(88, 3),
      makeQualityScore(91, 4),
      makeQualityScore(60, 5), // outlier but above 55
    ];

    const result = reflectOnCourse(chapters, tracker, courseContext, scores);

    const outlierFlag = result.flaggedChapters.find(f =>
      f.position === 5 && f.reason.includes('outlier'),
    );
    expect(outlierFlag).toBeDefined();
    expect(outlierFlag!.severity).toBe('low');
  });

  // --------------------------------------------------------------------------
  // 6. Detects orphaned concepts
  // --------------------------------------------------------------------------
  it('detects orphaned concepts that appear only once in a late chapter', () => {
    // Concept "orphan-concept" appears only in chapter 3 (position > 1),
    // and no later chapter references it.
    const chapters = [
      makeChapter(1, 'REMEMBER', 'Intro', {
        keyTopics: ['basics'],
        conceptsIntroduced: ['basics'],
        sections: [],
      }),
      makeChapter(2, 'UNDERSTAND', 'Foundations', {
        keyTopics: ['foundations'],
        conceptsIntroduced: ['foundations'],
        sections: [],
      }),
      makeChapter(3, 'APPLY', 'Specialized', {
        keyTopics: ['orphan-concept'],
        conceptsIntroduced: ['orphan-concept'],
        sections: [],
      }),
    ];
    const tracker = makeConceptTracker([
      { name: 'basics', chapters: [1, 2] },
      { name: 'foundations', chapters: [2, 3] },
      { name: 'orphan-concept', chapters: [3] },
    ]);
    const scores = chapters.map((_, i) => makeQualityScore(75, i + 1));

    const result = reflectOnCourse(chapters, tracker, courseContext, scores);

    expect(result.conceptCoverage.orphanedConcepts.length).toBeGreaterThan(0);
    expect(result.conceptCoverage.orphanedConcepts).toContain('orphan-concept');
  });

  // --------------------------------------------------------------------------
  // 7. Awards spiral curriculum bonus
  // --------------------------------------------------------------------------
  it('awards spiral curriculum bonus for concepts in multiple chapters', () => {
    const sharedTopic = 'shared-concept';

    // Non-spiral: each chapter has unique topics, no reuse
    const nonSpiralChapters = [
      makeChapter(1, 'REMEMBER', 'Ch 1', { keyTopics: ['topic-a'] }),
      makeChapter(2, 'UNDERSTAND', 'Ch 2', { keyTopics: ['topic-b'] }),
      makeChapter(3, 'APPLY', 'Ch 3', { keyTopics: ['topic-c'] }),
    ];

    // Spiral: shared concept appears across chapters
    const spiralChapters = [
      makeChapter(1, 'REMEMBER', 'Ch 1', { keyTopics: [sharedTopic, 'topic-a'] }),
      makeChapter(2, 'UNDERSTAND', 'Ch 2', { keyTopics: [sharedTopic, 'topic-b'] }),
      makeChapter(3, 'APPLY', 'Ch 3', { keyTopics: [sharedTopic, 'topic-c'] }),
    ];

    const tracker = makeConceptTracker();
    const scores = [
      makeQualityScore(75, 1),
      makeQualityScore(75, 2),
      makeQualityScore(75, 3),
    ];

    const nonSpiralResult = reflectOnCourse(
      nonSpiralChapters, tracker, courseContext, scores,
    );
    const spiralResult = reflectOnCourse(
      spiralChapters, tracker, courseContext, scores,
    );

    // Spiral curriculum should yield higher (or equal) coherence
    expect(spiralResult.coherenceScore).toBeGreaterThanOrEqual(
      nonSpiralResult.coherenceScore,
    );
  });

  // --------------------------------------------------------------------------
  // 8. Summary is a non-empty string
  // --------------------------------------------------------------------------
  it('returns a non-empty summary string', () => {
    const chapters = [
      makeChapter(1, 'REMEMBER', 'Chapter One'),
      makeChapter(2, 'UNDERSTAND', 'Chapter Two'),
    ];
    const tracker = makeConceptTracker();
    const scores = chapters.map((_, i) => makeQualityScore(75, i + 1));

    const result = reflectOnCourse(chapters, tracker, courseContext, scores);

    expect(typeof result.summary).toBe('string');
    expect(result.summary.length).toBeGreaterThan(0);
  });

  // --------------------------------------------------------------------------
  // 9. Monotonic Bloom's progression yields high coherence
  // --------------------------------------------------------------------------
  it('returns high coherence for perfect monotonic progression', () => {
    const chapters = [
      makeChapter(1, 'REMEMBER', 'Recall'),
      makeChapter(2, 'UNDERSTAND', 'Comprehend'),
      makeChapter(3, 'APPLY', 'Practice'),
      makeChapter(4, 'ANALYZE', 'Analyze'),
      makeChapter(5, 'EVALUATE', 'Evaluate'),
    ];
    const tracker = makeConceptTracker();
    const scores = chapters.map((_, i) => makeQualityScore(85, i + 1));

    const result = reflectOnCourse(chapters, tracker, courseContext, scores);

    expect(result.bloomsProgression.isMonotonic).toBe(true);
    expect(result.bloomsProgression.gaps).toHaveLength(0);
    // Score may be slightly below 85 due to orphaned concept penalties
    // (each chapter has unique keyTopics that appear only once)
    expect(result.coherenceScore).toBeGreaterThanOrEqual(80);
  });

  // --------------------------------------------------------------------------
  // 10. Single chapter is trivially monotonic
  // --------------------------------------------------------------------------
  it('handles single chapter as monotonic with no gaps', () => {
    const chapters = [makeChapter(1, 'REMEMBER', 'Solo')];
    const tracker = makeConceptTracker();
    const scores = [makeQualityScore(80, 1)];

    const result = reflectOnCourse(chapters, tracker, courseContext, scores);

    expect(result.bloomsProgression.isMonotonic).toBe(true);
    expect(result.bloomsProgression.gaps).toHaveLength(0);
  });

  // --------------------------------------------------------------------------
  // 11. Empty quality scores do not crash
  // --------------------------------------------------------------------------
  it('handles empty quality scores gracefully', () => {
    const chapters = [
      makeChapter(1, 'REMEMBER', 'Ch 1'),
      makeChapter(2, 'UNDERSTAND', 'Ch 2'),
    ];
    const tracker = makeConceptTracker();

    const result = reflectOnCourse(chapters, tracker, courseContext, []);

    expect(result.coherenceScore).toBeGreaterThanOrEqual(0);
    expect(result.coherenceScore).toBeLessThanOrEqual(100);
    expect(result.flaggedChapters).toEqual([]);
  });

  // --------------------------------------------------------------------------
  // 12. Summary mentions the course title
  // --------------------------------------------------------------------------
  it('includes course title in the summary', () => {
    const chapters = [makeChapter(1, 'REMEMBER', 'First')];
    const tracker = makeConceptTracker();
    const scores = [makeQualityScore(80, 1)];

    const result = reflectOnCourse(chapters, tracker, courseContext, scores);

    expect(result.summary).toContain('Test Course');
  });

  // --------------------------------------------------------------------------
  // 13. Missing prerequisites detected via blueprint
  // --------------------------------------------------------------------------
  it('detects missing prerequisites from blueprint concept dependencies', () => {
    const chapters = [
      makeChapter(1, 'REMEMBER', 'Intro', {
        keyTopics: ['advanced-topic'],
        conceptsIntroduced: ['advanced-topic'],
      }),
      makeChapter(2, 'UNDERSTAND', 'Building Blocks', {
        keyTopics: ['basic-topic'],
        conceptsIntroduced: ['basic-topic'],
      }),
    ];
    const tracker = makeConceptTracker([
      { name: 'advanced-topic', chapters: [1] },
      { name: 'basic-topic', chapters: [2] },
    ]);
    const scores = chapters.map((_, i) => makeQualityScore(75, i + 1));

    const blueprint: CourseBlueprintPlan = {
      chapterPlan: [],
      conceptDependencies: [
        { concept: 'advanced-topic', dependsOn: ['basic-topic'] },
      ],
      bloomsStrategy: [],
      riskAreas: [],
      planConfidence: 80,
    };

    const result = reflectOnCourse(chapters, tracker, courseContext, scores, blueprint);

    expect(result.conceptCoverage.missingPrerequisites.length).toBeGreaterThan(0);
  });

  // --------------------------------------------------------------------------
  // 14. Chapters flagged for Bloom's regression appear in flaggedChapters
  // --------------------------------------------------------------------------
  it('flags chapters involved in Bloom\'s regressions', () => {
    const chapters = [
      makeChapter(1, 'EVALUATE', 'Advanced'),
      makeChapter(2, 'REMEMBER', 'Basics Revisited'), // severe regression
    ];
    const tracker = makeConceptTracker();
    const scores = chapters.map((_, i) => makeQualityScore(75, i + 1));

    const result = reflectOnCourse(chapters, tracker, courseContext, scores);

    // Chapter 2 should be flagged for the regression
    const regressionFlag = result.flaggedChapters.find(f =>
      f.position === 2 && f.reason.includes('decreased'),
    );
    expect(regressionFlag).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // 15. High-severity flag for very low quality (< 40)
  // --------------------------------------------------------------------------
  it('assigns high severity to chapters with quality below 40', () => {
    const chapters = [
      makeChapter(1, 'REMEMBER', 'Terrible Chapter'),
      makeChapter(2, 'UNDERSTAND', 'Good Chapter'),
    ];
    const tracker = makeConceptTracker();
    const scores = [
      makeQualityScore(30, 1), // very low
      makeQualityScore(80, 2),
    ];

    const result = reflectOnCourse(chapters, tracker, courseContext, scores);

    const flag = result.flaggedChapters.find(f => f.position === 1);
    expect(flag).toBeDefined();
    expect(flag!.severity).toBe('high');
  });

  // --------------------------------------------------------------------------
  // 16. Concept coverage reports totalConcepts and coveredByMultipleChapters
  // --------------------------------------------------------------------------
  it('reports concept coverage metrics accurately', () => {
    const chapters = [
      makeChapter(1, 'REMEMBER', 'Intro', {
        keyTopics: ['variables', 'functions'],
        conceptsIntroduced: ['variables', 'functions'],
      }),
      makeChapter(2, 'UNDERSTAND', 'Deep Dive', {
        keyTopics: ['variables', 'classes'],
        conceptsIntroduced: ['classes'],
      }),
    ];
    const tracker = makeConceptTracker();
    const scores = chapters.map((_, i) => makeQualityScore(75, i + 1));

    const result = reflectOnCourse(chapters, tracker, courseContext, scores);

    // "variables" appears in 2 chapters, "functions" in 1, "classes" in 1
    expect(result.conceptCoverage.totalConcepts).toBe(3);
    expect(result.conceptCoverage.coveredByMultipleChapters).toBe(1);
  });

  // --------------------------------------------------------------------------
  // 17. Section-level concepts are included in coverage
  // --------------------------------------------------------------------------
  it('includes section-level concepts in coverage analysis', () => {
    const chapters = [
      makeChapter(1, 'REMEMBER', 'Intro', {
        keyTopics: ['basics'],
        sections: [
          makeSection(1, {
            conceptsIntroduced: ['section-concept'],
          }),
        ],
      }),
      makeChapter(2, 'UNDERSTAND', 'Chapter Two', {
        keyTopics: ['advanced'],
        sections: [
          makeSection(1, {
            conceptsReferenced: ['section-concept'],
          }),
        ],
      }),
    ];
    const tracker = makeConceptTracker();
    const scores = chapters.map((_, i) => makeQualityScore(75, i + 1));

    const result = reflectOnCourse(chapters, tracker, courseContext, scores);

    // "section-concept" is introduced in ch1 section and referenced in ch2 section
    // so it should NOT be orphaned
    const hasOrphanedSectionConcept = result.conceptCoverage.orphanedConcepts.includes('section-concept');
    expect(hasOrphanedSectionConcept).toBe(false);
  });
});

// ============================================================================
// reflectOnCourseWithAI tests
// ============================================================================

describe('reflectOnCourseWithAI (AI-enhanced reflection)', () => {
  const courseContext = makeCourseContext();
  const userId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // 1. Coherence delta clamped to +/-15
  // --------------------------------------------------------------------------
  it('clamps AI coherence adjustment to +/-15 points', async () => {
    const chapters = [
      makeChapter(1, 'REMEMBER', 'Basics'),
      makeChapter(2, 'UNDERSTAND', 'Concepts'),
      makeChapter(3, 'APPLY', 'Practice'),
    ];
    const tracker = makeConceptTracker();
    const scores = chapters.map((_, i) => makeQualityScore(75, i + 1));

    // Get baseline score
    const baseline = reflectOnCourse(chapters, tracker, courseContext, scores);

    // AI tries to add +50 to the score (way beyond the +/-15 limit)
    mockedRunSAM.mockResolvedValueOnce(JSON.stringify({
      adjustedCoherenceScore: baseline.coherenceScore + 50,
      additionalFlaggedChapters: [],
      removeFlaggedPositions: [],
      enrichedSummary: 'AI enriched summary',
      pedagogicalInsights: [],
    }));

    const result = await reflectOnCourseWithAI(
      userId, chapters, tracker, courseContext, scores,
    );

    // Adjustment should be clamped to at most +15
    const delta = result.coherenceScore - baseline.coherenceScore;
    expect(delta).toBeLessThanOrEqual(15);
    expect(delta).toBeGreaterThanOrEqual(-15);
  });

  // --------------------------------------------------------------------------
  // 2. Negative AI delta clamped to -15
  // --------------------------------------------------------------------------
  it('clamps negative AI coherence adjustment to -15 points', async () => {
    const chapters = [
      makeChapter(1, 'REMEMBER', 'Basics'),
      makeChapter(2, 'UNDERSTAND', 'Concepts'),
    ];
    const tracker = makeConceptTracker();
    const scores = chapters.map((_, i) => makeQualityScore(75, i + 1));

    const baseline = reflectOnCourse(chapters, tracker, courseContext, scores);

    // AI tries to subtract -40 (way beyond the -15 limit)
    mockedRunSAM.mockResolvedValueOnce(JSON.stringify({
      adjustedCoherenceScore: baseline.coherenceScore - 40,
      additionalFlaggedChapters: [],
      removeFlaggedPositions: [],
      enrichedSummary: 'Lowered score summary',
      pedagogicalInsights: [],
    }));

    const result = await reflectOnCourseWithAI(
      userId, chapters, tracker, courseContext, scores,
    );

    const delta = result.coherenceScore - baseline.coherenceScore;
    expect(delta).toBeGreaterThanOrEqual(-15);
    expect(delta).toBeLessThanOrEqual(15);
  });

  // --------------------------------------------------------------------------
  // 3. Falls back to rule-based on AI failure
  // --------------------------------------------------------------------------
  it('falls back to rule-based result when AI call fails', async () => {
    const chapters = [
      makeChapter(1, 'REMEMBER', 'Intro'),
      makeChapter(2, 'UNDERSTAND', 'Concepts'),
      makeChapter(3, 'APPLY', 'Practice'),
    ];
    const tracker = makeConceptTracker();
    const scores = chapters.map((_, i) => makeQualityScore(75, i + 1));

    // AI provider rejects
    mockedRunSAM.mockRejectedValueOnce(new Error('AI service unavailable'));

    const baseline = reflectOnCourse(chapters, tracker, courseContext, scores);
    const result = await reflectOnCourseWithAI(
      userId, chapters, tracker, courseContext, scores,
    );

    // Should return exactly the rule-based result
    expect(result.coherenceScore).toBe(baseline.coherenceScore);
    expect(result.bloomsProgression).toEqual(baseline.bloomsProgression);
    expect(result.conceptCoverage).toEqual(baseline.conceptCoverage);
    expect(result.flaggedChapters).toEqual(baseline.flaggedChapters);
    expect(result.summary).toBe(baseline.summary);
  });

  // --------------------------------------------------------------------------
  // 4. AI can add flagged chapters
  // --------------------------------------------------------------------------
  it('merges AI-added flagged chapters into the result', async () => {
    const chapters = [
      makeChapter(1, 'REMEMBER', 'Basics'),
      makeChapter(2, 'UNDERSTAND', 'Concepts'),
    ];
    const tracker = makeConceptTracker();
    const scores = chapters.map((_, i) => makeQualityScore(80, i + 1));

    const baseline = reflectOnCourse(chapters, tracker, courseContext, scores);
    const baselineFlagCount = baseline.flaggedChapters.length;

    mockedRunSAM.mockResolvedValueOnce(JSON.stringify({
      adjustedCoherenceScore: baseline.coherenceScore,
      additionalFlaggedChapters: [
        { position: 2, reason: 'Content is too surface-level', severity: 'medium' },
      ],
      removeFlaggedPositions: [],
      enrichedSummary: baseline.summary,
      pedagogicalInsights: [],
    }));

    const result = await reflectOnCourseWithAI(
      userId, chapters, tracker, courseContext, scores,
    );

    expect(result.flaggedChapters.length).toBe(baselineFlagCount + 1);
    const addedFlag = result.flaggedChapters.find(f =>
      f.position === 2 && f.reason.includes('surface-level'),
    );
    expect(addedFlag).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // 5. AI can remove false-positive flags
  // --------------------------------------------------------------------------
  it('removes AI-identified false-positive flags', async () => {
    // Create chapters that will produce a regression flag on chapter 2
    const chapters = [
      makeChapter(1, 'ANALYZE', 'Advanced Analysis'),
      makeChapter(2, 'UNDERSTAND', 'Review'), // regression -> flagged
    ];
    const tracker = makeConceptTracker();
    const scores = chapters.map((_, i) => makeQualityScore(75, i + 1));

    const baseline = reflectOnCourse(chapters, tracker, courseContext, scores);
    expect(baseline.flaggedChapters.some(f => f.position === 2)).toBe(true);

    // AI removes the flag at position 2
    mockedRunSAM.mockResolvedValueOnce(JSON.stringify({
      adjustedCoherenceScore: baseline.coherenceScore,
      additionalFlaggedChapters: [],
      removeFlaggedPositions: [2],
      enrichedSummary: baseline.summary,
      pedagogicalInsights: [],
    }));

    const result = await reflectOnCourseWithAI(
      userId, chapters, tracker, courseContext, scores,
    );

    expect(result.flaggedChapters.some(f => f.position === 2)).toBe(false);
  });

  // --------------------------------------------------------------------------
  // 6. Falls back on invalid JSON response
  // --------------------------------------------------------------------------
  it('falls back to rule-based result when AI returns invalid JSON', async () => {
    const chapters = [
      makeChapter(1, 'REMEMBER', 'Intro'),
      makeChapter(2, 'UNDERSTAND', 'Concepts'),
    ];
    const tracker = makeConceptTracker();
    const scores = chapters.map((_, i) => makeQualityScore(75, i + 1));

    mockedRunSAM.mockResolvedValueOnce('This is not valid JSON at all');

    const baseline = reflectOnCourse(chapters, tracker, courseContext, scores);
    const result = await reflectOnCourseWithAI(
      userId, chapters, tracker, courseContext, scores,
    );

    expect(result.coherenceScore).toBe(baseline.coherenceScore);
    expect(result.summary).toBe(baseline.summary);
  });

  // --------------------------------------------------------------------------
  // 7. AI enriched summary includes pedagogical insights
  // --------------------------------------------------------------------------
  it('appends pedagogical insights to enriched summary', async () => {
    const chapters = [
      makeChapter(1, 'REMEMBER', 'Basics'),
      makeChapter(2, 'UNDERSTAND', 'Concepts'),
    ];
    const tracker = makeConceptTracker();
    const scores = chapters.map((_, i) => makeQualityScore(75, i + 1));

    const baseline = reflectOnCourse(chapters, tracker, courseContext, scores);

    mockedRunSAM.mockResolvedValueOnce(JSON.stringify({
      adjustedCoherenceScore: baseline.coherenceScore,
      additionalFlaggedChapters: [],
      removeFlaggedPositions: [],
      enrichedSummary: 'Enhanced summary from AI.',
      pedagogicalInsights: [
        'Chapter 2 could benefit from more real-world examples',
        'Consider adding a review section',
      ],
    }));

    const result = await reflectOnCourseWithAI(
      userId, chapters, tracker, courseContext, scores,
    );

    expect(result.summary).toContain('Enhanced summary from AI.');
    expect(result.summary).toContain('Pedagogical insights:');
    expect(result.summary).toContain('real-world examples');
  });

  // --------------------------------------------------------------------------
  // 8. Coherence score stays within 0-100 after AI adjustment
  // --------------------------------------------------------------------------
  it('ensures adjusted coherence score stays within 0-100 bounds', async () => {
    // Create chapters with high coherence (near 100)
    const chapters = [
      makeChapter(1, 'REMEMBER', 'Ch1'),
      makeChapter(2, 'UNDERSTAND', 'Ch2'),
    ];
    const tracker = makeConceptTracker();
    const scores = chapters.map((_, i) => makeQualityScore(90, i + 1));

    const baseline = reflectOnCourse(chapters, tracker, courseContext, scores);

    // AI tries to push score above 100
    mockedRunSAM.mockResolvedValueOnce(JSON.stringify({
      adjustedCoherenceScore: 115,
      additionalFlaggedChapters: [],
      removeFlaggedPositions: [],
      enrichedSummary: 'Great course!',
      pedagogicalInsights: [],
    }));

    const result = await reflectOnCourseWithAI(
      userId, chapters, tracker, courseContext, scores,
    );

    expect(result.coherenceScore).toBeLessThanOrEqual(100);
    expect(result.coherenceScore).toBeGreaterThanOrEqual(0);
  });

  // --------------------------------------------------------------------------
  // 9. AI response wrapped in markdown code fences is parsed correctly
  // --------------------------------------------------------------------------
  it('handles AI response wrapped in markdown code fences', async () => {
    const chapters = [
      makeChapter(1, 'REMEMBER', 'Basics'),
      makeChapter(2, 'UNDERSTAND', 'Concepts'),
    ];
    const tracker = makeConceptTracker();
    const scores = chapters.map((_, i) => makeQualityScore(75, i + 1));

    const baseline = reflectOnCourse(chapters, tracker, courseContext, scores);
    const adjustedScore = Math.min(100, baseline.coherenceScore + 5);

    mockedRunSAM.mockResolvedValueOnce(`\`\`\`json
{
  "adjustedCoherenceScore": ${adjustedScore},
  "additionalFlaggedChapters": [],
  "removeFlaggedPositions": [],
  "enrichedSummary": "Fenced response summary",
  "pedagogicalInsights": []
}
\`\`\``);

    const result = await reflectOnCourseWithAI(
      userId, chapters, tracker, courseContext, scores,
    );

    expect(result.summary).toBe('Fenced response summary');
    expect(result.coherenceScore).toBe(adjustedScore);
  });
});
