/**
 * Safety Integration Tests
 *
 * Tests validateContentSafety() which validates AI-generated content
 * for bias, accessibility, and discouraging language using @sam-ai/safety
 * detectors.
 *
 * Each detector runs with a 3-second timeout via Promise.allSettled.
 * Score weights: bias 40%, accessibility 30%, discouraging 30%.
 *
 * NOTE: next-jest resolves @sam-ai/safety via tsconfig paths to
 * packages/safety/src/index.ts. We must mock that source path (not
 * the dist path) for the mock to intercept the import inside
 * safety-integration.ts.
 */

import path from 'path';

// ============================================================================
// Per-test module isolation
// ============================================================================
//
// safety-integration.ts caches detector singletons at module scope.
// We use jest.resetModules() + jest.doMock() + require() in beforeEach
// so each test gets a fresh module with fresh mock detectors.

const SAFETY_SOURCE_PATH = path.resolve(
  __dirname,
  '../../../../packages/safety/src/index.ts',
);

let mockBiasDetect: jest.Mock;
let mockAccessibilityCheck: jest.Mock;
let mockDiscouragingDetect: jest.Mock;

let validateContentSafety: (
  content: string,
  courseContext: { difficulty: string; targetAudience: string },
) => Promise<{
  passed: boolean;
  overallScore: number;
  issues: Array<{
    type: string;
    severity: string;
    description: string;
    suggestion: string;
  }>;
  validationRan: boolean;
}>;

beforeEach(() => {
  jest.resetModules();

  mockBiasDetect = jest.fn().mockReturnValue({
    detected: false,
    indicators: [],
    riskScore: 0,
    categories: [],
  });

  mockAccessibilityCheck = jest.fn().mockReturnValue({
    passed: true,
    readabilityScore: 100,
    gradeLevel: 8,
    issues: [],
    statistics: {
      wordCount: 50,
      sentenceCount: 5,
      averageSentenceLength: 10,
      averageWordSyllables: 1.5,
      complexWordPercentage: 5,
      passiveVoicePercentage: 0,
    },
  });

  mockDiscouragingDetect = jest.fn().mockReturnValue({
    found: false,
    matches: [],
    score: 100,
  });

  const safetyMock = {
    __esModule: true,
    createBiasDetector: jest.fn(() => ({ detect: mockBiasDetect })),
    createAccessibilityChecker: jest.fn(() => ({ check: mockAccessibilityCheck })),
    createDiscouragingLanguageDetector: jest.fn(() => ({ detect: mockDiscouragingDetect })),
  };

  jest.doMock('server-only', () => ({}));
  jest.doMock('@/lib/logger', () => ({
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    },
  }));

  // next-jest resolves @sam-ai/safety via tsconfig paths to the source .ts file.
  // We must mock BOTH the package name and the source path to cover all resolution.
  jest.doMock('@sam-ai/safety', () => safetyMock);
  jest.doMock(SAFETY_SOURCE_PATH, () => safetyMock);

  const mod = require('../safety-integration');
  validateContentSafety = mod.validateContentSafety;
});

// ============================================================================
// Helpers
// ============================================================================

const defaultContext = {
  difficulty: 'intermediate',
  targetAudience: 'adult learners',
};

// ============================================================================
// Tests
// ============================================================================

describe('validateContentSafety', () => {
  // --------------------------------------------------------------------------
  // 1. Empty content
  // --------------------------------------------------------------------------

  it('returns passed=true, overallScore=100, validationRan=false for empty content', async () => {
    const result = await validateContentSafety('', defaultContext);

    expect(result).toEqual({
      passed: true,
      overallScore: 100,
      issues: [],
      validationRan: false,
    });

    expect(mockBiasDetect).not.toHaveBeenCalled();
    expect(mockAccessibilityCheck).not.toHaveBeenCalled();
    expect(mockDiscouragingDetect).not.toHaveBeenCalled();
  });

  it('returns validationRan=false for whitespace-only content', async () => {
    const result = await validateContentSafety('   \n\t  ', defaultContext);

    expect(result.passed).toBe(true);
    expect(result.overallScore).toBe(100);
    expect(result.validationRan).toBe(false);
  });

  // --------------------------------------------------------------------------
  // 2. Clean content (all detectors pass)
  // --------------------------------------------------------------------------

  it('returns passed=true, validationRan=true for clean content with all detectors returning no issues', async () => {
    const result = await validateContentSafety(
      'This is a well-written educational paragraph about programming.',
      defaultContext,
    );

    expect(result.passed).toBe(true);
    expect(result.validationRan).toBe(true);
    expect(result.issues).toHaveLength(0);
    // bias: (100-0)*0.4 + accessibility: 100*0.3 + discouraging: 100*0.3 = 100
    expect(result.overallScore).toBe(100);
  });

  // --------------------------------------------------------------------------
  // 3. High-severity bias issue causes passed=false
  // --------------------------------------------------------------------------

  it('returns passed=false when bias detector finds a high-severity issue', async () => {
    mockBiasDetect.mockReturnValue({
      detected: true,
      indicators: [
        {
          type: 'gender',
          trigger: 'mankind',
          confidence: 0.9,
          explanation: 'Gender-biased term detected',
          neutralAlternative: 'Use "humankind" instead',
        },
      ],
      riskScore: 60,
      categories: ['gender'],
    });

    const result = await validateContentSafety(
      'Since the dawn of mankind, programming has evolved.',
      defaultContext,
    );

    expect(result.passed).toBe(false);
    expect(result.validationRan).toBe(true);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].type).toBe('bias');
    expect(result.issues[0].severity).toBe('high'); // confidence 0.9 >= 0.8
    expect(result.issues[0].suggestion).toBe('Use "humankind" instead');
  });

  // --------------------------------------------------------------------------
  // 4. Only low/medium severity issues: passed remains true
  // --------------------------------------------------------------------------

  it('returns passed=true when only low-severity bias issues are found', async () => {
    mockBiasDetect.mockReturnValue({
      detected: true,
      indicators: [
        {
          type: 'cultural',
          trigger: 'some phrase',
          confidence: 0.5,
          explanation: 'Potentially culturally insensitive',
          neutralAlternative: 'Consider rephrasing',
        },
      ],
      riskScore: 20,
      categories: ['cultural'],
    });

    const result = await validateContentSafety(
      'Content with a potentially insensitive phrase.',
      defaultContext,
    );

    expect(result.passed).toBe(true);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].severity).toBe('low'); // confidence 0.5 < 0.6
  });

  it('returns passed=true when only medium-severity issues are found', async () => {
    mockBiasDetect.mockReturnValue({
      detected: true,
      indicators: [
        {
          type: 'gender',
          trigger: 'he/she',
          confidence: 0.7,
          explanation: 'Binary gender assumption',
          neutralAlternative: 'Use "they" for inclusivity',
        },
      ],
      riskScore: 30,
      categories: ['gender'],
    });

    mockAccessibilityCheck.mockReturnValue({
      passed: false,
      readabilityScore: 70,
      gradeLevel: 12,
      issues: [
        {
          type: 'reading_level_too_high',
          description: 'Reading level is above target',
          severity: 'medium',
          suggestion: 'Simplify sentence structure',
        },
      ],
      statistics: {
        wordCount: 100,
        sentenceCount: 5,
        averageSentenceLength: 20,
        averageWordSyllables: 2.5,
        complexWordPercentage: 25,
        passiveVoicePercentage: 10,
      },
    });

    const result = await validateContentSafety(
      'Content with medium-severity issues across detectors.',
      defaultContext,
    );

    expect(result.passed).toBe(true);
    // bias issue: confidence 0.7 -> medium; accessibility issue: medium
    expect(result.issues).toHaveLength(2);
    expect(result.issues.every(i => i.severity === 'medium')).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 5. Detector failure does not block the pipeline
  // --------------------------------------------------------------------------

  it('still returns a result when one detector throws (simulating timeout/failure)', async () => {
    mockBiasDetect.mockImplementation(() => {
      throw new Error('Simulated timeout');
    });

    const result = await validateContentSafety(
      'Some educational content for testing.',
      defaultContext,
    );

    // Accessibility and discouraging still ran
    expect(result.validationRan).toBe(true);
    expect(result.passed).toBe(true);
    // biasScore defaults to 100 (detector failed), others 100
    expect(result.overallScore).toBe(100);
  }, 10000);

  // --------------------------------------------------------------------------
  // 6. Graceful degradation when detector throws an error
  // --------------------------------------------------------------------------

  it('returns passed=true when a single detector throws an error (graceful degradation)', async () => {
    mockAccessibilityCheck.mockImplementation(() => {
      throw new Error('Unexpected accessibility checker failure');
    });

    const result = await validateContentSafety(
      'This content triggers a checker error.',
      defaultContext,
    );

    expect(result.passed).toBe(true);
    expect(result.validationRan).toBe(true);
    // Only bias and discouraging ran, accessibility defaulted to 100
    expect(result.overallScore).toBe(100);
  });

  it('returns passed=true and validationRan=false when all detectors throw errors', async () => {
    mockBiasDetect.mockImplementation(() => {
      throw new Error('Bias error');
    });
    mockAccessibilityCheck.mockImplementation(() => {
      throw new Error('Accessibility error');
    });
    mockDiscouragingDetect.mockImplementation(() => {
      throw new Error('Discouraging error');
    });

    const result = await validateContentSafety(
      'Content that causes all detectors to fail.',
      defaultContext,
    );

    expect(result.passed).toBe(true);
    expect(result.validationRan).toBe(false); // No detector succeeded
    expect(result.overallScore).toBe(100);
    expect(result.issues).toHaveLength(0);
  });

  // --------------------------------------------------------------------------
  // 7. Weighted average score computation
  // --------------------------------------------------------------------------

  it('computes overallScore using weighted average: bias 40%, accessibility 30%, discouraging 30%', async () => {
    // Bias: riskScore 40 -> biasScore = 100 - 40 = 60
    mockBiasDetect.mockReturnValue({
      detected: true,
      indicators: [],
      riskScore: 40,
      categories: [],
    });

    // Accessibility: readabilityScore = 80
    mockAccessibilityCheck.mockReturnValue({
      passed: true,
      readabilityScore: 80,
      gradeLevel: 10,
      issues: [],
      statistics: {
        wordCount: 100,
        sentenceCount: 10,
        averageSentenceLength: 10,
        averageWordSyllables: 1.8,
        complexWordPercentage: 10,
        passiveVoicePercentage: 5,
      },
    });

    // Discouraging: score = 90
    mockDiscouragingDetect.mockReturnValue({
      found: false,
      matches: [],
      score: 90,
    });

    const result = await validateContentSafety(
      'Some educational content to test scoring.',
      defaultContext,
    );

    // Expected: 60 * 0.4 + 80 * 0.3 + 90 * 0.3 = 24 + 24 + 27 = 75
    expect(result.overallScore).toBe(75);
    expect(result.validationRan).toBe(true);
  });

  it('rounds the weighted average score to the nearest integer', async () => {
    // Bias: riskScore 33 -> biasScore = 67
    mockBiasDetect.mockReturnValue({
      detected: false,
      indicators: [],
      riskScore: 33,
      categories: [],
    });

    // Accessibility: readabilityScore = 77
    mockAccessibilityCheck.mockReturnValue({
      passed: true,
      readabilityScore: 77,
      gradeLevel: 9,
      issues: [],
      statistics: {
        wordCount: 80,
        sentenceCount: 8,
        averageSentenceLength: 10,
        averageWordSyllables: 1.6,
        complexWordPercentage: 8,
        passiveVoicePercentage: 3,
      },
    });

    // Discouraging: score = 83
    mockDiscouragingDetect.mockReturnValue({
      found: false,
      matches: [],
      score: 83,
    });

    const result = await validateContentSafety(
      'Content for rounding test.',
      defaultContext,
    );

    // Expected: 67 * 0.4 + 77 * 0.3 + 83 * 0.3 = 26.8 + 23.1 + 24.9 = 74.8 -> 75
    expect(result.overallScore).toBe(75);
  });

  // --------------------------------------------------------------------------
  // Additional edge cases
  // --------------------------------------------------------------------------

  it('strips HTML tags before passing content to detectors', async () => {
    await validateContentSafety(
      '<p>This is <strong>bold</strong> content.</p>',
      defaultContext,
    );

    expect(mockBiasDetect).toHaveBeenCalledTimes(1);
    const biasCallArg = mockBiasDetect.mock.calls[0][0] as string;
    expect(biasCallArg).not.toContain('<p>');
    expect(biasCallArg).not.toContain('<strong>');
    expect(biasCallArg).toContain('This is');
    expect(biasCallArg).toContain('bold');
    expect(biasCallArg).toContain('content.');
  });

  it('maps critical severity from accessibility issues to high', async () => {
    mockAccessibilityCheck.mockReturnValue({
      passed: false,
      readabilityScore: 40,
      gradeLevel: 16,
      issues: [
        {
          type: 'reading_level_too_high',
          description: 'Content is extremely difficult to read',
          severity: 'critical',
          suggestion: 'Rewrite at a lower reading level',
        },
      ],
      statistics: {
        wordCount: 200,
        sentenceCount: 5,
        averageSentenceLength: 40,
        averageWordSyllables: 3.5,
        complexWordPercentage: 50,
        passiveVoicePercentage: 30,
      },
    });

    const result = await validateContentSafety(
      'Extremely complex content with multisyllabic obfuscation.',
      defaultContext,
    );

    expect(result.passed).toBe(false); // critical mapped to high
    const highIssues = result.issues.filter(i => i.severity === 'high');
    expect(highIssues).toHaveLength(1);
    expect(highIssues[0].type).toBe('accessibility');
  });

  it('maps discouraging language matches correctly', async () => {
    mockDiscouragingDetect.mockReturnValue({
      found: true,
      matches: [
        {
          phrase: 'you will never understand',
          category: 'absolute_negative',
          severity: 'high',
          position: { start: 0, end: 25 },
          alternative: 'This concept takes practice to master',
        },
      ],
      score: 30,
    });

    const result = await validateContentSafety(
      'You will never understand this concept.',
      defaultContext,
    );

    expect(result.passed).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].type).toBe('discouraging_language');
    expect(result.issues[0].severity).toBe('high');
    expect(result.issues[0].description).toContain('you will never understand');
    expect(result.issues[0].description).toContain('absolute_negative');
    expect(result.issues[0].suggestion).toBe(
      'This concept takes practice to master',
    );
  });

  it('aggregates issues from all three detectors', async () => {
    mockBiasDetect.mockReturnValue({
      detected: true,
      indicators: [
        {
          type: 'gender',
          trigger: 'mankind',
          confidence: 0.65,
          explanation: 'Gender-biased term',
          neutralAlternative: 'humankind',
        },
      ],
      riskScore: 20,
      categories: ['gender'],
    });

    mockAccessibilityCheck.mockReturnValue({
      passed: false,
      readabilityScore: 70,
      gradeLevel: 12,
      issues: [
        {
          type: 'sentence_too_long',
          description: 'Sentence exceeds 30 words',
          severity: 'low',
          suggestion: 'Break into shorter sentences',
        },
      ],
      statistics: {
        wordCount: 100,
        sentenceCount: 3,
        averageSentenceLength: 33,
        averageWordSyllables: 2.0,
        complexWordPercentage: 15,
        passiveVoicePercentage: 5,
      },
    });

    mockDiscouragingDetect.mockReturnValue({
      found: true,
      matches: [
        {
          phrase: 'obviously',
          category: 'condescending',
          severity: 'medium',
          position: { start: 10, end: 19 },
          alternative: 'As you may know',
        },
      ],
      score: 75,
    });

    const result = await validateContentSafety(
      'Some content with multiple types of issues.',
      defaultContext,
    );

    expect(result.issues).toHaveLength(3);
    const issueTypes = result.issues.map(i => i.type);
    expect(issueTypes).toContain('bias');
    expect(issueTypes).toContain('accessibility');
    expect(issueTypes).toContain('discouraging_language');
    // No high severity -> passed is true
    expect(result.passed).toBe(true);
  });

  it('uses biasScore = max(0, 100 - riskScore) ensuring it does not go below 0', async () => {
    mockBiasDetect.mockReturnValue({
      detected: true,
      indicators: [],
      riskScore: 150, // Extreme riskScore exceeding 100
      categories: [],
    });

    const result = await validateContentSafety(
      'Content with extreme bias risk.',
      defaultContext,
    );

    // biasScore = max(0, 100 - 150) = 0
    // overallScore = 0 * 0.4 + 100 * 0.3 + 100 * 0.3 = 60
    expect(result.overallScore).toBe(60);
  });

  it('bias indicator with confidence exactly 0.8 is classified as high severity', async () => {
    mockBiasDetect.mockReturnValue({
      detected: true,
      indicators: [
        {
          type: 'racial_ethnic',
          trigger: 'biased phrase',
          confidence: 0.8,
          explanation: 'Racially insensitive phrasing',
          neutralAlternative: 'Use inclusive language',
        },
      ],
      riskScore: 50,
      categories: ['racial_ethnic'],
    });

    const result = await validateContentSafety(
      'Content with a borderline confidence bias indicator.',
      defaultContext,
    );

    expect(result.passed).toBe(false);
    expect(result.issues[0].severity).toBe('high'); // confidence === 0.8 -> high
  });

  it('bias indicator with confidence exactly 0.6 is classified as medium severity', async () => {
    mockBiasDetect.mockReturnValue({
      detected: true,
      indicators: [
        {
          type: 'cultural',
          trigger: 'some term',
          confidence: 0.6,
          explanation: 'Potentially culturally insensitive',
          neutralAlternative: null,
        },
      ],
      riskScore: 25,
      categories: ['cultural'],
    });

    const result = await validateContentSafety(
      'Content with boundary confidence value.',
      defaultContext,
    );

    expect(result.passed).toBe(true); // medium severity, not high
    expect(result.issues[0].severity).toBe('medium'); // confidence === 0.6 -> medium
    expect(result.issues[0].suggestion).toBe('Use neutral, inclusive language.');
  });
});
