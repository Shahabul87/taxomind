/**
 * Quality Integration Tests
 *
 * Tests for lib/sam/course-creation/quality-integration.ts which combines
 * SAM quality gates, pedagogy pipelines, and content safety validation
 * with custom scoring to produce blended quality scores.
 *
 * MOCK STRATEGY:
 * Next.js SWC jest-transformer resolves TypeScript path aliases at the
 * code-transformation level. It converts:
 *   import { ... } from '@sam-ai/quality'
 * into:
 *   require("../../../packages/quality/src")
 *
 * So we mock the resolved DIRECTORY path, not the package name.
 * From __tests__/ (one level deeper than the source), the path is:
 *   ../../../../packages/quality/src
 *   ../../../../packages/pedagogy/src
 */

// ---------------------------------------------------------------------------
// Module-level mock function declarations (hoisted above jest.mock)
// ---------------------------------------------------------------------------

const mockValidateFn = jest.fn();
const mockEvaluateFn = jest.fn();
const mockSafetyFn = jest.fn();

// ---------------------------------------------------------------------------
// Mocks (jest.mock calls are hoisted to top of file by babel/jest)
// ---------------------------------------------------------------------------

jest.mock('server-only', () => ({}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock the SWC-resolved paths for @sam-ai/quality and @sam-ai/pedagogy
jest.mock('../../../../packages/quality/src', () => ({
  createQualityGatePipeline: jest.fn(() => ({
    validate: mockValidateFn,
  })),
}));

jest.mock('../../../../packages/pedagogy/src', () => ({
  createPedagogicalPipeline: jest.fn(() => ({
    evaluate: mockEvaluateFn,
  })),
}));

jest.mock('../safety-integration', () => ({
  validateContentSafety: (...args: unknown[]) => mockSafetyFn(...args),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks so they get the mocked versions)
// ---------------------------------------------------------------------------

import {
  blendScores,
  validateChapterWithSAM,
  validateSectionWithSAM,
  validateDetailsWithSAM,
  SAMValidationResult,
} from '../quality-integration';

import {
  QualityScore,
  GeneratedChapter,
  GeneratedSection,
  SectionDetails,
  CourseContext,
  BloomsLevel,
} from '../types';

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

function makeQualityScore(overrides: Partial<QualityScore> = {}): QualityScore {
  return {
    uniqueness: 80,
    specificity: 75,
    bloomsAlignment: 85,
    completeness: 90,
    depth: 70,
    overall: 80,
    ...overrides,
  };
}

function makeSAMResult(overrides: Partial<SAMValidationResult> = {}): SAMValidationResult {
  return {
    combinedScore: 70,
    qualityGateScore: 75,
    pedagogyScore: 65,
    qualityIssues: [],
    pedagogyIssues: [],
    suggestions: [],
    failedGates: [],
    samValidationRan: true,
    ...overrides,
  };
}

function makeCourseContext(overrides: Partial<CourseContext> = {}): CourseContext {
  return {
    courseTitle: 'Test Course',
    courseDescription: 'A test course description',
    courseCategory: 'Testing',
    targetAudience: 'Developers',
    difficulty: 'intermediate',
    courseLearningObjectives: ['Objective 1', 'Objective 2'],
    totalChapters: 5,
    sectionsPerChapter: 4,
    bloomsFocus: ['APPLY' as BloomsLevel],
    learningObjectivesPerChapter: 3,
    learningObjectivesPerSection: 2,
    ...overrides,
  };
}

function makeChapter(overrides: Partial<GeneratedChapter> = {}): GeneratedChapter {
  return {
    position: 1,
    title: 'Introduction to Testing',
    description: 'This chapter covers the fundamentals of software testing.',
    bloomsLevel: 'UNDERSTAND' as BloomsLevel,
    learningObjectives: [
      'Explain the purpose of unit testing',
      'Identify common testing patterns',
    ],
    keyTopics: ['Unit Testing', 'Integration Testing', 'Mocking'],
    prerequisites: 'Basic programming knowledge',
    estimatedTime: '2 hours',
    topicsToExpand: ['Unit Testing', 'Mocking'],
    ...overrides,
  };
}

function makeSection(overrides: Partial<GeneratedSection> = {}): GeneratedSection {
  return {
    position: 1,
    title: 'Writing Your First Unit Test',
    contentType: 'reading',
    estimatedDuration: '30 minutes',
    topicFocus: 'Unit testing fundamentals',
    parentChapterContext: {
      title: 'Introduction to Testing',
      bloomsLevel: 'UNDERSTAND' as BloomsLevel,
      relevantObjectives: ['Explain the purpose of unit testing'],
    },
    ...overrides,
  };
}

function makeSectionDetails(overrides: Partial<SectionDetails> = {}): SectionDetails {
  return {
    description: 'A detailed explanation of unit testing concepts and best practices.',
    learningObjectives: ['Write a basic unit test', 'Use assertions effectively'],
    keyConceptsCovered: ['Assertions', 'Test runners', 'Test isolation'],
    practicalActivity: 'Write a unit test for a calculator function.',
    creatorGuidelines: 'Focus on practical examples.',
    resources: ['https://example.com/testing-guide'],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Default mock return values (reset in beforeEach)
// ---------------------------------------------------------------------------

function setDefaultMocks(): void {
  mockValidateFn.mockReset();
  mockEvaluateFn.mockReset();
  mockSafetyFn.mockReset();

  mockValidateFn.mockResolvedValue({
    overallScore: 80,
    passed: true,
    criticalIssues: [],
    allSuggestions: ['Suggestion A'],
    failedGates: [],
  });

  mockEvaluateFn.mockResolvedValue({
    overallScore: 75,
    passed: true,
    allIssues: [],
    allRecommendations: ['Recommendation B'],
    metadata: { evaluatorsRun: ['blooms', 'scaffolding'] },
  });

  mockSafetyFn.mockResolvedValue({
    passed: true,
    overallScore: 100,
    issues: [],
    validationRan: true,
  });
}

// ============================================================================
// Tests: blendScores (pure function, no pipeline mocking needed)
// ============================================================================

describe('blendScores', () => {
  it('returns customScore unchanged when samValidationRan is false', () => {
    const customScore = makeQualityScore({ overall: 80 });
    const samResult = makeSAMResult({ samValidationRan: false });

    const result = blendScores(customScore, samResult);

    expect(result.overall).toBe(80);
    expect(result).toEqual(customScore);
  });

  it('uses combinedScore from SAM result as the blended overall', () => {
    const customScore = makeQualityScore({ overall: 80 });
    const samResult = makeSAMResult({
      combinedScore: 76,
      samValidationRan: true,
      safetyPassed: true,
    });

    const result = blendScores(customScore, samResult);

    expect(result.overall).toBe(76);
  });

  it('preserves other dimension scores from customScore', () => {
    const customScore = makeQualityScore({
      overall: 80,
      uniqueness: 95,
      specificity: 88,
      bloomsAlignment: 72,
      completeness: 90,
      depth: 65,
    });
    const samResult = makeSAMResult({
      combinedScore: 76,
      samValidationRan: true,
      safetyPassed: true,
    });

    const result = blendScores(customScore, samResult);

    expect(result.uniqueness).toBe(95);
    expect(result.specificity).toBe(88);
    expect(result.bloomsAlignment).toBe(72);
    expect(result.completeness).toBe(90);
    expect(result.depth).toBe(65);
    expect(result.overall).toBe(76);
  });

  it('applies safety penalty when safetyPassed is false with high-severity issues', () => {
    const customScore = makeQualityScore({ overall: 80 });
    const samResult = makeSAMResult({
      combinedScore: 76,
      samValidationRan: true,
      safetyPassed: false,
      safetyIssues: [
        '[high/bias] Detected gender bias — Suggestion: Use inclusive language.',
      ],
    });

    const result = blendScores(customScore, samResult);

    // penalty = min(1 * 15, 45) = 15; finalScore = max(0, 76 - 15) = 61
    expect(result.overall).toBe(61);
  });

  it('applies cumulative safety penalty for multiple high-severity issues', () => {
    const customScore = makeQualityScore({ overall: 80 });
    const samResult = makeSAMResult({
      combinedScore: 76,
      samValidationRan: true,
      safetyPassed: false,
      safetyIssues: [
        '[high/bias] Issue 1 — Suggestion: Fix 1.',
        '[high/accessibility] Issue 2 — Suggestion: Fix 2.',
        '[high/discouraging_language] Issue 3 — Suggestion: Fix 3.',
      ],
    });

    const result = blendScores(customScore, samResult);

    // penalty = min(3 * 15, 45) = 45; finalScore = max(0, 76 - 45) = 31
    expect(result.overall).toBe(31);
  });

  it('caps safety penalty at 45 points', () => {
    const customScore = makeQualityScore({ overall: 80 });
    const samResult = makeSAMResult({
      combinedScore: 76,
      samValidationRan: true,
      safetyPassed: false,
      safetyIssues: [
        '[high/bias] Issue 1 — Suggestion: Fix.',
        '[high/bias] Issue 2 — Suggestion: Fix.',
        '[high/bias] Issue 3 — Suggestion: Fix.',
        '[high/bias] Issue 4 — Suggestion: Fix.',
        '[high/bias] Issue 5 — Suggestion: Fix.',
      ],
    });

    const result = blendScores(customScore, samResult);

    // penalty = min(5 * 15, 45) = 45 (capped); finalScore = max(0, 76 - 45) = 31
    expect(result.overall).toBe(31);
  });

  it('does not apply safety penalty when safetyPassed is true', () => {
    const customScore = makeQualityScore({ overall: 80 });
    const samResult = makeSAMResult({
      combinedScore: 76,
      samValidationRan: true,
      safetyPassed: true,
    });

    const result = blendScores(customScore, samResult);

    expect(result.overall).toBe(76);
  });

  it('does not apply safety penalty when safetyPassed is undefined', () => {
    const customScore = makeQualityScore({ overall: 80 });
    const samResult = makeSAMResult({
      combinedScore: 76,
      samValidationRan: true,
      safetyPassed: undefined,
      safetyIssues: undefined,
    });

    const result = blendScores(customScore, samResult);

    expect(result.overall).toBe(76);
  });

  it('ignores non-high-severity safety issues in penalty calculation', () => {
    const customScore = makeQualityScore({ overall: 80 });
    const samResult = makeSAMResult({
      combinedScore: 76,
      samValidationRan: true,
      safetyPassed: false,
      safetyIssues: [
        '[medium/bias] Medium issue — Suggestion: Fix.',
        '[low/accessibility] Low issue — Suggestion: Fix.',
      ],
    });

    const result = blendScores(customScore, samResult);

    expect(result.overall).toBe(76);
  });

  it('floors the score at 0 when penalty exceeds score', () => {
    const customScore = makeQualityScore({ overall: 20 });
    const samResult = makeSAMResult({
      combinedScore: 30,
      samValidationRan: true,
      safetyPassed: false,
      safetyIssues: [
        '[high/bias] Issue 1 — Suggestion: Fix.',
        '[high/bias] Issue 2 — Suggestion: Fix.',
        '[high/bias] Issue 3 — Suggestion: Fix.',
      ],
    });

    const result = blendScores(customScore, samResult);

    // penalty = min(3 * 15, 45) = 45; finalScore = max(0, 30 - 45) = 0
    expect(result.overall).toBe(0);
  });
});

// ============================================================================
// Tests: validateChapterWithSAM
// ============================================================================

describe('validateChapterWithSAM', () => {
  beforeEach(() => {
    setDefaultMocks();
  });

  it('returns combined result with samValidationRan=true when both pipelines succeed', async () => {
    const result = await validateChapterWithSAM(
      makeChapter(),
      makeQualityScore({ overall: 80 }),
      makeCourseContext(),
    );

    expect(result.samValidationRan).toBe(true);
    expect(result.qualityGateScore).toBe(80);
    expect(result.pedagogyScore).toBe(75);
    expect(mockValidateFn).toHaveBeenCalledTimes(1);
    expect(mockEvaluateFn).toHaveBeenCalledTimes(1);
  });

  it('blends quality (60%) and pedagogy (40%) into combined SAM score', async () => {
    mockValidateFn.mockResolvedValue({
      overallScore: 90,
      passed: true,
      criticalIssues: [],
      allSuggestions: [],
      failedGates: [],
    });
    mockEvaluateFn.mockResolvedValue({
      overallScore: 70,
      passed: true,
      allIssues: [],
      allRecommendations: [],
      metadata: { evaluatorsRun: ['blooms'] },
    });

    const result = await validateChapterWithSAM(
      makeChapter(),
      makeQualityScore({ overall: 80 }),
      makeCourseContext(),
    );

    // effectiveSamScore = 90 * 0.6 + 70 * 0.4 = 82
    // combinedScore = round(80 * 0.6 + 82 * 0.4) = round(80.8) = 81
    expect(result.combinedScore).toBe(81);
    expect(result.samValidationRan).toBe(true);
  });

  it('returns result with only pedagogy when quality pipeline rejects', async () => {
    mockValidateFn.mockRejectedValue(new Error('Validation timed out after 8000ms'));
    mockEvaluateFn.mockResolvedValue({
      overallScore: 75,
      passed: true,
      allIssues: [],
      allRecommendations: [],
      metadata: { evaluatorsRun: ['blooms'] },
    });

    const result = await validateChapterWithSAM(
      makeChapter(),
      makeQualityScore({ overall: 80 }),
      makeCourseContext(),
    );

    expect(result.samValidationRan).toBe(true);
    expect(result.qualityGateScore).toBe(0);
    expect(result.pedagogyScore).toBe(75);
    // effectiveSamScore = pedagogyScore = 75; combinedScore = round(80*0.6 + 75*0.4) = 78
    expect(result.combinedScore).toBe(78);
  });

  it('returns fallback result when both pipelines reject', async () => {
    mockValidateFn.mockRejectedValue(new Error('Validation timed out after 8000ms'));
    mockEvaluateFn.mockRejectedValue(new Error('Validation timed out after 8000ms'));

    const result = await validateChapterWithSAM(
      makeChapter(),
      makeQualityScore({ overall: 80 }),
      makeCourseContext(),
    );

    expect(result.samValidationRan).toBe(false);
    expect(result.combinedScore).toBe(80);
  });

  it('includes safety issues in result when safety detects problems', async () => {
    mockSafetyFn.mockResolvedValue({
      passed: false,
      overallScore: 60,
      issues: [
        {
          type: 'bias',
          severity: 'high',
          description: 'Gender bias detected',
          suggestion: 'Use inclusive language',
        },
      ],
      validationRan: true,
    });

    const result = await validateChapterWithSAM(
      makeChapter(),
      makeQualityScore({ overall: 80 }),
      makeCourseContext(),
    );

    expect(result.safetyPassed).toBe(false);
    expect(result.safetyIssues).toHaveLength(1);
    expect(result.safetyIssues![0]).toContain('[high/bias]');
    expect(result.safetyIssues![0]).toContain('Gender bias detected');
  });

  it('includes suggestions from both pipelines', async () => {
    mockValidateFn.mockResolvedValue({
      overallScore: 80,
      passed: true,
      criticalIssues: [],
      allSuggestions: ['Quality suggestion 1', 'Quality suggestion 2'],
      failedGates: [],
    });
    mockEvaluateFn.mockResolvedValue({
      overallScore: 75,
      passed: true,
      allIssues: [],
      allRecommendations: ['Pedagogy recommendation 1'],
      metadata: { evaluatorsRun: ['blooms'] },
    });

    const result = await validateChapterWithSAM(
      makeChapter(),
      makeQualityScore({ overall: 80 }),
      makeCourseContext(),
    );

    expect(result.suggestions).toContain('Quality suggestion 1');
    expect(result.suggestions).toContain('Quality suggestion 2');
    expect(result.suggestions).toContain('Pedagogy recommendation 1');
  });

  it('includes quality issues formatted with severity', async () => {
    mockValidateFn.mockResolvedValue({
      overallScore: 55,
      passed: false,
      criticalIssues: [
        { severity: 'critical', description: 'Content too shallow' },
        { severity: 'warning', description: 'Missing examples' },
      ],
      allSuggestions: [],
      failedGates: ['depth-gate'],
    });

    const result = await validateChapterWithSAM(
      makeChapter(),
      makeQualityScore({ overall: 70 }),
      makeCourseContext(),
    );

    expect(result.qualityIssues).toContain('[critical] Content too shallow');
    expect(result.qualityIssues).toContain('[warning] Missing examples');
    expect(result.failedGates).toContain('depth-gate');
  });

  it('includes pedagogy issues formatted with severity', async () => {
    mockEvaluateFn.mockResolvedValue({
      overallScore: 60,
      passed: false,
      allIssues: [{ severity: 'high', description: 'Bloom level mismatch' }],
      allRecommendations: [],
      metadata: { evaluatorsRun: ['blooms'] },
    });

    const result = await validateChapterWithSAM(
      makeChapter(),
      makeQualityScore({ overall: 70 }),
      makeCourseContext(),
    );

    expect(result.pedagogyIssues).toContain('[high] Bloom level mismatch');
  });

  it('handles safety validation not running (validationRan=false)', async () => {
    mockSafetyFn.mockResolvedValue({
      passed: true,
      overallScore: 100,
      issues: [],
      validationRan: false,
    });

    const result = await validateChapterWithSAM(
      makeChapter(),
      makeQualityScore({ overall: 80 }),
      makeCourseContext(),
    );

    expect(result.safetyPassed).toBeUndefined();
    expect(result.safetyIssues).toBeUndefined();
  });

  it('handles safety validation rejection gracefully', async () => {
    mockSafetyFn.mockRejectedValue(new Error('Safety service unavailable'));

    const result = await validateChapterWithSAM(
      makeChapter(),
      makeQualityScore({ overall: 80 }),
      makeCourseContext(),
    );

    expect(result.samValidationRan).toBe(true);
    expect(result.safetyPassed).toBeUndefined();
  });

  it('limits suggestions to 3 per pipeline', async () => {
    mockValidateFn.mockResolvedValue({
      overallScore: 80,
      passed: true,
      criticalIssues: [],
      allSuggestions: ['S1', 'S2', 'S3', 'S4', 'S5'],
      failedGates: [],
    });
    mockEvaluateFn.mockResolvedValue({
      overallScore: 75,
      passed: true,
      allIssues: [],
      allRecommendations: ['R1', 'R2', 'R3', 'R4'],
      metadata: { evaluatorsRun: ['blooms'] },
    });

    const result = await validateChapterWithSAM(
      makeChapter(),
      makeQualityScore({ overall: 80 }),
      makeCourseContext(),
    );

    expect(result.suggestions).toEqual(['S1', 'S2', 'S3', 'R1', 'R2', 'R3']);
  });
});

// ============================================================================
// Tests: validateSectionWithSAM
// ============================================================================

describe('validateSectionWithSAM', () => {
  beforeEach(() => {
    setDefaultMocks();

    mockValidateFn.mockResolvedValue({
      overallScore: 85,
      passed: true,
      criticalIssues: [],
      allSuggestions: [],
      failedGates: [],
    });
    mockEvaluateFn.mockResolvedValue({
      overallScore: 78,
      passed: true,
      allIssues: [],
      allRecommendations: [],
      metadata: { evaluatorsRun: ['blooms', 'scaffolding'] },
    });
  });

  it('returns combined result with correct scores', async () => {
    const result = await validateSectionWithSAM(
      makeSection(),
      makeQualityScore({ overall: 82 }),
      makeCourseContext(),
    );

    expect(result.samValidationRan).toBe(true);
    expect(result.qualityGateScore).toBe(85);
    expect(result.pedagogyScore).toBe(78);
    // effectiveSamScore = 85*0.6 + 78*0.4 = 82.2; combinedScore = round(82*0.6 + 82.2*0.4) = 82
    expect(result.combinedScore).toBe(82);
  });

  it('calls validateContentSafety with section text', async () => {
    const section = makeSection({
      title: 'My Section Title',
      topicFocus: 'My Topic Focus',
    });
    const ctx = makeCourseContext({
      difficulty: 'beginner',
      targetAudience: 'Students',
    });

    await validateSectionWithSAM(section, makeQualityScore({ overall: 80 }), ctx);

    expect(mockSafetyFn).toHaveBeenCalledWith(
      'My Section Title\nMy Topic Focus',
      { difficulty: 'beginner', targetAudience: 'Students' },
    );
  });
});

// ============================================================================
// Tests: validateDetailsWithSAM
// ============================================================================

describe('validateDetailsWithSAM', () => {
  beforeEach(() => {
    setDefaultMocks();

    mockValidateFn.mockResolvedValue({
      overallScore: 82,
      passed: true,
      criticalIssues: [],
      allSuggestions: [],
      failedGates: [],
    });
    mockEvaluateFn.mockResolvedValue({
      overallScore: 77,
      passed: true,
      allIssues: [],
      allRecommendations: [],
      metadata: { evaluatorsRun: ['blooms', 'scaffolding'] },
    });
  });

  it('returns combined result for detail-level validation', async () => {
    const result = await validateDetailsWithSAM(
      makeSectionDetails(),
      makeSection(),
      'APPLY' as BloomsLevel,
      makeQualityScore({ overall: 78 }),
      makeCourseContext(),
    );

    expect(result.samValidationRan).toBe(true);
    expect(result.qualityGateScore).toBe(82);
    expect(result.pedagogyScore).toBe(77);
  });

  it('calls safety validation with description, practicalActivity, and learningObjectives', async () => {
    const details = makeSectionDetails({
      description: 'Detail description',
      practicalActivity: 'Do this activity',
      learningObjectives: ['Objective A', 'Objective B'],
    });
    const ctx = makeCourseContext({
      difficulty: 'advanced',
      targetAudience: 'Engineers',
    });

    await validateDetailsWithSAM(
      details,
      makeSection(),
      'ANALYZE' as BloomsLevel,
      makeQualityScore({ overall: 80 }),
      ctx,
    );

    expect(mockSafetyFn).toHaveBeenCalledWith(
      'Detail description\nDo this activity\nObjective A\nObjective B',
      { difficulty: 'advanced', targetAudience: 'Engineers' },
    );
  });

  it('returns fallback when both pipelines reject', async () => {
    mockValidateFn.mockRejectedValue(new Error('Quality error'));
    mockEvaluateFn.mockRejectedValue(new Error('Pedagogy error'));
    mockSafetyFn.mockRejectedValue(new Error('Safety error'));

    const result = await validateDetailsWithSAM(
      makeSectionDetails(),
      makeSection(),
      'UNDERSTAND' as BloomsLevel,
      makeQualityScore({ overall: 72 }),
      makeCourseContext(),
    );

    expect(result.samValidationRan).toBe(false);
    expect(result.combinedScore).toBe(72);
  });
});

// ============================================================================
// Tests: Score blending math (end-to-end via pipeline mocks)
// ============================================================================

describe('score blending math (end-to-end)', () => {
  beforeEach(() => {
    setDefaultMocks();
  });

  it('computes blended score: custom=80, quality=90, pedagogy=70', async () => {
    mockValidateFn.mockResolvedValue({
      overallScore: 90,
      passed: true,
      criticalIssues: [],
      allSuggestions: [],
      failedGates: [],
    });
    mockEvaluateFn.mockResolvedValue({
      overallScore: 70,
      passed: true,
      allIssues: [],
      allRecommendations: [],
      metadata: { evaluatorsRun: ['blooms'] },
    });

    const result = await validateChapterWithSAM(
      makeChapter(),
      makeQualityScore({ overall: 80 }),
      makeCourseContext(),
    );

    // effectiveSamScore = 90*0.6 + 70*0.4 = 82; combinedScore = round(80*0.6 + 82*0.4) = 81
    expect(result.combinedScore).toBe(81);
  });

  it('computes blended score: custom=100, quality=100, pedagogy=100', async () => {
    mockValidateFn.mockResolvedValue({
      overallScore: 100,
      passed: true,
      criticalIssues: [],
      allSuggestions: [],
      failedGates: [],
    });
    mockEvaluateFn.mockResolvedValue({
      overallScore: 100,
      passed: true,
      allIssues: [],
      allRecommendations: [],
      metadata: { evaluatorsRun: ['blooms'] },
    });

    const result = await validateChapterWithSAM(
      makeChapter(),
      makeQualityScore({ overall: 100 }),
      makeCourseContext(),
    );

    expect(result.combinedScore).toBe(100);
  });

  it('computes blended score: custom=50, quality=60, pedagogy=40', async () => {
    mockValidateFn.mockResolvedValue({
      overallScore: 60,
      passed: false,
      criticalIssues: [],
      allSuggestions: [],
      failedGates: [],
    });
    mockEvaluateFn.mockResolvedValue({
      overallScore: 40,
      passed: false,
      allIssues: [],
      allRecommendations: [],
      metadata: { evaluatorsRun: ['blooms'] },
    });

    const result = await validateChapterWithSAM(
      makeChapter(),
      makeQualityScore({ overall: 50 }),
      makeCourseContext(),
    );

    // effectiveSamScore = 60*0.6 + 40*0.4 = 52; combinedScore = round(50*0.6 + 52*0.4) = 51
    expect(result.combinedScore).toBe(51);
  });

  it('uses only quality score when pedagogy rejects', async () => {
    mockValidateFn.mockResolvedValue({
      overallScore: 85,
      passed: true,
      criticalIssues: [],
      allSuggestions: [],
      failedGates: [],
    });
    mockEvaluateFn.mockRejectedValue(new Error('Pedagogy timeout'));

    const result = await validateChapterWithSAM(
      makeChapter(),
      makeQualityScore({ overall: 80 }),
      makeCourseContext(),
    );

    expect(result.samValidationRan).toBe(true);
    expect(result.qualityGateScore).toBe(85);
    expect(result.pedagogyScore).toBe(0);
    // effectiveSamScore = qualityGateScore = 85; combinedScore = round(80*0.6 + 85*0.4) = 82
    expect(result.combinedScore).toBe(82);
  });

  it('uses only pedagogy score when quality pipeline fails', async () => {
    mockValidateFn.mockRejectedValue(new Error('Quality error'));
    mockEvaluateFn.mockResolvedValue({
      overallScore: 70,
      passed: true,
      allIssues: [],
      allRecommendations: [],
      metadata: { evaluatorsRun: ['blooms'] },
    });

    const result = await validateChapterWithSAM(
      makeChapter(),
      makeQualityScore({ overall: 80 }),
      makeCourseContext(),
    );

    expect(result.samValidationRan).toBe(true);
    expect(result.qualityGateScore).toBe(0);
    expect(result.pedagogyScore).toBe(70);
    // effectiveSamScore = pedagogyScore = 70; combinedScore = round(80*0.6 + 70*0.4) = 76
    expect(result.combinedScore).toBe(76);
  });
});
