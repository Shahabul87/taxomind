/**
 * Tests for course creation helper functions
 */

import {
  cleanTitle,
  ensureArray,
  ensureOptionalArray,
  normalizeContentType,
  parseDuration,
  cleanAIResponse,
  jaccardSimilarity,
  buildDefaultQualityScore,
  scoreChapter,
  scoreSection,
  scoreDetails,
  validateChapterSectionCoverage,
  buildFallbackChapter,
  buildFallbackSection,
  buildFallbackDetails,
  buildFallbackDescription,
} from '@/lib/sam/course-creation/helpers';
import {
  createMockCourseContext,
  createMockChapter,
  createMockSection,
  createMockSectionDetails,
} from './test-fixtures';

// Mock the content-generation-criteria validator
jest.mock('@/lib/sam/prompts/content-generation-criteria', () => ({
  validateObjective: (obj: string, _level: string) => ({
    score: obj.length > 10 ? 80 : 40,
    valid: obj.length > 10,
    suggestions: [],
  }),
}));

// =============================================================================
// cleanTitle
// =============================================================================

describe('cleanTitle', () => {
  it('removes "Chapter N:" prefix', () => {
    expect(cleanTitle('Chapter 1: Introduction to ML', 1, 'ML Course')).toBe('Introduction to ML');
    expect(cleanTitle('Chapter 12: Advanced Topics', 12, 'ML Course')).toBe('Advanced Topics');
  });

  it('removes "Chapter N -" prefix', () => {
    expect(cleanTitle('Chapter 3 - Data Structures', 3, 'CS Course')).toBe('Data Structures');
  });

  it('handles undefined', () => {
    expect(cleanTitle(undefined, 1, 'My Course')).toBe('My Course - Part 1');
  });

  it('handles short titles (< 5 chars)', () => {
    expect(cleanTitle('Hi', 2, 'My Course')).toBe('My Course - Part 2');
    expect(cleanTitle('', 1, 'My Course')).toBe('My Course - Part 1');
  });

  it('preserves valid titles without prefix', () => {
    expect(cleanTitle('Machine Learning Fundamentals', 1, 'ML Course')).toBe('Machine Learning Fundamentals');
  });

  it('falls back to courseTitle when stripping prefix leaves empty string', () => {
    expect(cleanTitle('Chapter 1:   ', 1, 'My Course')).toBe('My Course - Part 1');
  });
});

// =============================================================================
// ensureArray
// =============================================================================

describe('ensureArray', () => {
  it('pads short arrays to minLength', () => {
    const result = ensureArray(['item1'], 3);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('item1');
    expect(result[1]).toContain('Additional item');
  });

  it('filters empty strings', () => {
    // ensureArray filters items where typeof !== 'string' || item.length === 0
    // '  ' has length 2, so it's kept (only truly empty '' is removed)
    const result = ensureArray(['valid', '', '  ', 'also valid'], 2);
    expect(result).toEqual(['valid', '  ', 'also valid']);
  });

  it('handles non-array input', () => {
    const result = ensureArray('not an array', 3);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Item 1');
  });

  it('handles null input', () => {
    const result = ensureArray(null, 2);
    expect(result).toHaveLength(2);
  });

  it('passes through arrays that meet minLength', () => {
    const result = ensureArray(['a', 'b', 'c'], 3);
    expect(result).toEqual(['a', 'b', 'c']);
  });
});

// =============================================================================
// ensureOptionalArray
// =============================================================================

describe('ensureOptionalArray', () => {
  it('returns empty array for non-array', () => {
    expect(ensureOptionalArray(null)).toEqual([]);
    expect(ensureOptionalArray(undefined)).toEqual([]);
    expect(ensureOptionalArray('string')).toEqual([]);
  });

  it('filters non-string items', () => {
    expect(ensureOptionalArray(['valid', 42, null, 'also valid'])).toEqual(['valid', 'also valid']);
  });

  it('filters empty strings', () => {
    expect(ensureOptionalArray(['good', '', 'fine'])).toEqual(['good', 'fine']);
  });
});

// =============================================================================
// normalizeContentType
// =============================================================================

describe('normalizeContentType', () => {
  it('handles exact matches', () => {
    expect(normalizeContentType('video')).toBe('video');
    expect(normalizeContentType('reading')).toBe('reading');
    expect(normalizeContentType('assignment')).toBe('assignment');
    expect(normalizeContentType('quiz')).toBe('quiz');
    expect(normalizeContentType('project')).toBe('project');
    expect(normalizeContentType('discussion')).toBe('discussion');
  });

  it('handles partial matches', () => {
    expect(normalizeContentType('Video Lecture')).toBe('video');
    expect(normalizeContentType('Reading Material')).toBe('reading');
    expect(normalizeContentType('Exercise')).toBe('assignment');
    expect(normalizeContentType('Test Yourself')).toBe('quiz');
    expect(normalizeContentType('Build a Project')).toBe('project');
    expect(normalizeContentType('Group Discussion')).toBe('discussion');
  });

  it('defaults to video for unknown types', () => {
    expect(normalizeContentType('interactive_lab')).toBe('video');
    expect(normalizeContentType('podcast')).toBe('video');
  });

  it('defaults to video for undefined', () => {
    expect(normalizeContentType(undefined)).toBe('video');
  });

  it('is case insensitive', () => {
    expect(normalizeContentType('VIDEO')).toBe('video');
    expect(normalizeContentType('Quiz')).toBe('quiz');
  });
});

// =============================================================================
// parseDuration
// =============================================================================

describe('parseDuration', () => {
  it('extracts numbers from duration strings', () => {
    expect(parseDuration('15-20 minutes')).toBe(15);
    expect(parseDuration('30 minutes')).toBe(30);
    expect(parseDuration('2 hours')).toBe(2);
  });

  it('returns null for non-numeric strings', () => {
    expect(parseDuration('about an hour')).toBeNull();
    expect(parseDuration('TBD')).toBeNull();
  });
});

// =============================================================================
// cleanAIResponse
// =============================================================================

describe('cleanAIResponse', () => {
  it('removes JSON code fences', () => {
    const input = '```json\n{"key": "value"}\n```';
    expect(cleanAIResponse(input)).toBe('{"key": "value"}');
  });

  it('removes generic code fences', () => {
    const input = '```\n{"key": "value"}\n```';
    expect(cleanAIResponse(input)).toBe('{"key": "value"}');
  });

  it('trims whitespace', () => {
    expect(cleanAIResponse('  {"key": "value"}  ')).toBe('{"key": "value"}');
  });

  it('handles clean input', () => {
    expect(cleanAIResponse('{"key": "value"}')).toBe('{"key": "value"}');
  });
});

// =============================================================================
// jaccardSimilarity
// =============================================================================

describe('jaccardSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(jaccardSimilarity('hello world', 'hello world')).toBe(1);
  });

  it('returns 0 for completely different strings', () => {
    expect(jaccardSimilarity('hello world', 'foo bar')).toBe(0);
  });

  it('returns between 0 and 1 for partial overlap', () => {
    const sim = jaccardSimilarity('machine learning basics', 'machine learning advanced');
    expect(sim).toBeGreaterThan(0);
    expect(sim).toBeLessThan(1);
  });

  it('returns 1 for empty strings (both split to same single-element set)', () => {
    // ''.split(/\s+/) gives [''], so both sets are {''}, intersection=1, union=1 → 1
    expect(jaccardSimilarity('', '')).toBe(1);
  });

  it('is case insensitive', () => {
    expect(jaccardSimilarity('Hello World', 'hello world')).toBe(1);
  });
});

// =============================================================================
// buildDefaultQualityScore
// =============================================================================

describe('buildDefaultQualityScore', () => {
  it('creates a score with all dimensions set to the given value', () => {
    const score = buildDefaultQualityScore(75);
    expect(score.completeness).toBe(75);
    expect(score.specificity).toBe(75);
    expect(score.bloomsAlignment).toBe(75);
    expect(score.uniqueness).toBe(75);
    expect(score.depth).toBe(75);
    expect(score.overall).toBe(75);
  });
});

// =============================================================================
// scoreChapter
// =============================================================================

describe('scoreChapter', () => {
  const ctx = createMockCourseContext();

  it('returns high score for well-formed chapter', () => {
    const chapter = createMockChapter();
    const score = scoreChapter(chapter, ctx, []);
    expect(score.overall).toBeGreaterThanOrEqual(50);
    expect(score.completeness).toBeLessThanOrEqual(100);
    expect(score.specificity).toBeLessThanOrEqual(100);
    expect(score.uniqueness).toBeLessThanOrEqual(100);
    expect(score.depth).toBeLessThanOrEqual(100);
  });

  it('applies correct weights: completeness 20%, specificity 15%, blooms 30%, uniqueness 15%, depth 20%', () => {
    const chapter = createMockChapter();
    const score = scoreChapter(chapter, ctx, []);
    // Verify overall is a weighted average
    const manualOverall = Math.round(
      score.completeness * 0.20 +
      score.specificity * 0.15 +
      score.bloomsAlignment * 0.30 +
      score.uniqueness * 0.15 +
      score.depth * 0.20
    );
    expect(score.overall).toBe(manualOverall);
  });

  it('penalizes uniqueness when similar to previous chapters', () => {
    const chapter1 = createMockChapter();
    const chapter2 = createMockChapter({ position: 2 }); // Same topics
    const score = scoreChapter(chapter2, ctx, [chapter1]);
    expect(score.uniqueness).toBeLessThan(100);
  });

  it('penalizes short descriptions', () => {
    const chapter = createMockChapter({ description: 'Short.' });
    const score = scoreChapter(chapter, ctx, []);
    expect(score.completeness).toBeLessThan(100);
    expect(score.depth).toBeLessThan(100);
  });

  it('penalizes generic titles', () => {
    const chapter = createMockChapter({ title: 'Introduction' });
    const score = scoreChapter(chapter, ctx, []);
    expect(score.specificity).toBeLessThan(100);
  });
});

// =============================================================================
// scoreSection
// =============================================================================

describe('scoreSection', () => {
  it('returns score for well-formed section', () => {
    const section = createMockSection();
    const score = scoreSection(section, []);
    expect(score.overall).toBeGreaterThan(0);
  });

  it('all 5 dimensions weighted at 20% each', () => {
    const section = createMockSection();
    const score = scoreSection(section, []);
    const manualOverall = Math.round(
      score.completeness * 0.20 +
      score.specificity * 0.20 +
      score.bloomsAlignment * 0.20 +
      score.uniqueness * 0.20 +
      score.depth * 0.20
    );
    expect(score.overall).toBe(manualOverall);
  });

  it('penalizes duplicate titles', () => {
    const section = createMockSection({ title: 'Understanding Supervised Learning' });
    const score = scoreSection(section, ['Understanding Supervised Learning']);
    expect(score.uniqueness).toBeLessThan(100);
  });

  it('penalizes generic section titles', () => {
    const section = createMockSection({ title: 'Overview' });
    const score = scoreSection(section, []);
    expect(score.specificity).toBeLessThan(100);
  });
});

// =============================================================================
// scoreDetails
// =============================================================================

describe('scoreDetails', () => {
  it('returns score for well-formed details', () => {
    const details = createMockSectionDetails();
    const section = createMockSection();
    const score = scoreDetails(details, section, 'UNDERSTAND');
    expect(score.overall).toBeGreaterThan(0);
  });

  it('applies correct weights: completeness 25%, specificity 15%, blooms 25%, uniqueness 15%, depth 20%', () => {
    const details = createMockSectionDetails();
    const section = createMockSection();
    const score = scoreDetails(details, section, 'UNDERSTAND');
    const manualOverall = Math.round(
      score.completeness * 0.25 +
      score.specificity * 0.15 +
      score.bloomsAlignment * 0.25 +
      score.uniqueness * 0.15 +
      score.depth * 0.20
    );
    expect(score.overall).toBe(manualOverall);
  });

  it('penalizes short descriptions', () => {
    const details = createMockSectionDetails({ description: 'Short.' });
    const section = createMockSection();
    const score = scoreDetails(details, section, 'UNDERSTAND');
    expect(score.completeness).toBeLessThan(100);
  });

  it('penalizes missing practical activity', () => {
    const details = createMockSectionDetails({ practicalActivity: '' });
    const section = createMockSection();
    const score = scoreDetails(details, section, 'UNDERSTAND');
    expect(score.completeness).toBeLessThan(100);
  });

  it('penalizes descriptions under 500 characters', () => {
    const details = createMockSectionDetails({
      description: 'This is a short description that does not meet the minimum character requirement for a rich lesson.',
    });
    const section = createMockSection();
    const score = scoreDetails(details, section, 'UNDERSTAND');
    expect(score.completeness).toBeLessThan(100);
    expect(score.depth).toBeLessThan(100);
  });

  it('penalizes descriptions missing HTML lesson sections', () => {
    const longPlainText = 'This is a long plain text description without any HTML structure. '.repeat(30);
    const details = createMockSectionDetails({ description: longPlainText });
    const section = createMockSection();
    const score = scoreDetails(details, section, 'UNDERSTAND');
    expect(score.depth).toBeLessThan(100);
  });

  it('rewards rich HTML lesson with all 5 sections', () => {
    const details = createMockSectionDetails(); // Uses the rich HTML fixture
    const section = createMockSection();
    const score = scoreDetails(details, section, 'UNDERSTAND');
    expect(score.depth).toBeGreaterThanOrEqual(50);
    expect(score.completeness).toBeGreaterThanOrEqual(75);
  });
});

// =============================================================================
// validateChapterSectionCoverage
// =============================================================================

describe('validateChapterSectionCoverage', () => {
  it('returns 100% when all topics are covered', () => {
    const chapter = {
      position: 1,
      title: 'ML Basics',
      keyTopics: ['supervised learning'],
      topicsToExpand: ['supervised learning'],
    };
    const sections = [
      createMockSection({ title: 'Supervised Learning Algorithms', topicFocus: 'supervised learning' }),
    ];
    const result = validateChapterSectionCoverage(chapter, sections);
    expect(result.coveragePercent).toBe(100);
    expect(result.uncoveredTopics).toHaveLength(0);
  });

  it('identifies uncovered topics', () => {
    const chapter = {
      position: 1,
      title: 'ML Basics',
      keyTopics: ['supervised learning', 'unsupervised learning'],
      topicsToExpand: ['supervised learning', 'unsupervised learning'],
    };
    const sections = [
      createMockSection({ title: 'Supervised Learning', topicFocus: 'supervised learning' }),
    ];
    const result = validateChapterSectionCoverage(chapter, sections);
    expect(result.coveragePercent).toBeLessThan(100);
    expect(result.uncoveredTopics).toContain('unsupervised learning');
  });

  it('returns 100% for empty topic lists', () => {
    const chapter = { position: 1, title: 'Empty', keyTopics: [], topicsToExpand: [] };
    const result = validateChapterSectionCoverage(chapter, []);
    expect(result.coveragePercent).toBe(100);
  });
});

// =============================================================================
// Fallback Generators
// =============================================================================

describe('buildFallbackChapter', () => {
  const ctx = createMockCourseContext();

  it('generates valid chapter for given position', () => {
    const chapter = buildFallbackChapter(1, ctx);
    expect(chapter.position).toBe(1);
    expect(chapter.title).toContain(ctx.courseTitle);
    expect(chapter.learningObjectives).toHaveLength(ctx.learningObjectivesPerChapter);
    expect(chapter.keyTopics).toHaveLength(3);
  });

  it('includes prerequisites for chapters after first', () => {
    const chapter1 = buildFallbackChapter(1, ctx);
    const chapter2 = buildFallbackChapter(2, ctx);
    expect(chapter1.prerequisites).not.toContain('Chapter');
    expect(chapter2.prerequisites).toContain('Chapter 1');
  });

  it('cycles through topic variations', () => {
    const ch1 = buildFallbackChapter(1, ctx);
    const ch2 = buildFallbackChapter(2, ctx);
    expect(ch1.title).not.toBe(ch2.title);
  });
});

describe('buildFallbackSection', () => {
  const chapter = createMockChapter();

  it('generates valid section', () => {
    const section = buildFallbackSection(1, chapter, []);
    expect(section.position).toBe(1);
    expect(section.title).toContain(chapter.title);
    expect(section.parentChapterContext.title).toBe(chapter.title);
  });

  it('avoids duplicate titles', () => {
    const existingTitle = `${chapter.title} - Part 1`;
    const section = buildFallbackSection(1, chapter, [existingTitle]);
    // When duplicate detected, title is appended with chapter prefix
    expect(section.title).not.toBe(existingTitle);
    expect(section.title).toContain(chapter.title);
  });
});

describe('buildFallbackDetails', () => {
  it('generates valid details without template', () => {
    const ctx = createMockCourseContext();
    const chapter = createMockChapter();
    const section = createMockSection();
    const details = buildFallbackDetails(chapter, section, ctx);
    expect(details.description).toContain(section.topicFocus);
    expect(details.learningObjectives).toHaveLength(ctx.learningObjectivesPerSection);
    expect(details.keyConceptsCovered).toHaveLength(3);
    expect(details.practicalActivity).toContain(section.contentType);
  });

  // Helper to create a minimal valid TemplateSectionDef for testing
  function makeTemplateDef(role: string, pos = 1) {
    return {
      position: pos,
      role,
      displayName: role,
      purpose: '',
      contentType: 'reading',
      bloomsLevels: ['UNDERSTAND'],
      wordCountRange: { min: 200, max: 400 },
      formatRules: [],
      htmlStructure: '',
      tone: '',
      consistencyRules: [],
    } as unknown as Parameters<typeof buildFallbackDetails>[3];
  }

  it('generates HOOK fallback with template', () => {
    const ctx = createMockCourseContext();
    const chapter = createMockChapter();
    const section = createMockSection();
    const details = buildFallbackDetails(chapter, section, ctx, makeTemplateDef('HOOK'));
    expect(details.description).toContain('Real-World Challenge');
    expect(details.description).toContain(section.topicFocus);
  });

  it('generates INTUITION fallback with analogy mapping table', () => {
    const ctx = createMockCourseContext();
    const chapter = createMockChapter();
    const section = createMockSection();
    const details = buildFallbackDetails(chapter, section, ctx, makeTemplateDef('INTUITION'));
    expect(details.description).toContain('<table>');
    expect(details.description).toContain('Aha:');
  });

  it('generates PLAYGROUND fallback with 3 progressive exercises', () => {
    const ctx = createMockCourseContext();
    const chapter = createMockChapter();
    const section = createMockSection();
    const details = buildFallbackDetails(chapter, section, ctx, makeTemplateDef('PLAYGROUND'));
    expect(details.description).toContain('Guided');
    expect(details.description).toContain('Semi-Guided');
    expect(details.description).toContain('Independent');
  });

  it('generates PROVOCATION fallback', () => {
    const ctx = createMockCourseContext();
    const chapter = createMockChapter();
    const section = createMockSection();
    const details = buildFallbackDetails(chapter, section, ctx, makeTemplateDef('PROVOCATION'));
    expect(details.description).toContain('Provocation');
    expect(details.description).toContain('Counterintuitive');
  });

  it('generates INTUITION_ENGINE fallback with multiple mental models', () => {
    const ctx = createMockCourseContext();
    const chapter = createMockChapter();
    const section = createMockSection();
    const details = buildFallbackDetails(chapter, section, ctx, makeTemplateDef('INTUITION_ENGINE'));
    expect(details.description).toContain('Mental Model 1');
    expect(details.description).toContain('Mental Model 2');
    expect(details.description).toContain('Unifying Insight');
  });

  it('generates DERIVATION fallback with step-by-step', () => {
    const ctx = createMockCourseContext();
    const chapter = createMockChapter();
    const section = createMockSection();
    const details = buildFallbackDetails(chapter, section, ctx, makeTemplateDef('DERIVATION'));
    expect(details.description).toContain('Deriving');
    expect(details.description).toContain('Step 1');
    expect(details.description).toContain('Intuition Check');
  });

  it('generates LABORATORY fallback with 5 exercise types', () => {
    const ctx = createMockCourseContext();
    const chapter = createMockChapter();
    const section = createMockSection();
    const details = buildFallbackDetails(chapter, section, ctx, makeTemplateDef('LABORATORY'));
    expect(details.description).toContain('Compute');
    expect(details.description).toContain('Predict-Verify');
    expect(details.description).toContain('Diagnose');
    expect(details.description).toContain('Compare');
    expect(details.description).toContain('Design');
  });

  it('generates DEPTH_DIVE fallback', () => {
    const ctx = createMockCourseContext();
    const chapter = createMockChapter();
    const section = createMockSection();
    const details = buildFallbackDetails(chapter, section, ctx, makeTemplateDef('DEPTH_DIVE'));
    expect(details.description).toContain('Edge Cases');
    expect(details.description).toContain('Breaking Conditions');
  });

  it('generates SYNTHESIS fallback with concept map', () => {
    const ctx = createMockCourseContext();
    const chapter = createMockChapter();
    const section = createMockSection();
    const details = buildFallbackDetails(chapter, section, ctx, makeTemplateDef('SYNTHESIS'));
    expect(details.description).toContain('Synthesis');
    expect(details.description).toContain('Concept Map');
  });

  it('generates OPEN_QUESTION fallback', () => {
    const ctx = createMockCourseContext();
    const chapter = createMockChapter();
    const section = createMockSection();
    const details = buildFallbackDetails(chapter, section, ctx, makeTemplateDef('OPEN_QUESTION'));
    expect(details.description).toContain('Open Question');
    expect(details.description).toContain('fundamental limit');
  });

  it('generates FIRST_PRINCIPLES fallback', () => {
    const ctx = createMockCourseContext();
    const chapter = createMockChapter();
    const section = createMockSection();
    const details = buildFallbackDetails(chapter, section, ctx, makeTemplateDef('FIRST_PRINCIPLES'));
    expect(details.description).toContain('First Principles');
    expect(details.description).toContain('Simplest Case');
  });

  it('generates ANALYSIS fallback', () => {
    const ctx = createMockCourseContext();
    const chapter = createMockChapter();
    const section = createMockSection();
    const details = buildFallbackDetails(chapter, section, ctx, makeTemplateDef('ANALYSIS'));
    expect(details.description).toContain('Formal Analysis');
    expect(details.description).toContain('Complexity');
  });

  it('generates DESIGN_STUDIO fallback with challenges', () => {
    const ctx = createMockCourseContext();
    const chapter = createMockChapter();
    const section = createMockSection();
    const details = buildFallbackDetails(chapter, section, ctx, makeTemplateDef('DESIGN_STUDIO'));
    expect(details.description).toContain('Design Studio');
    expect(details.description).toContain('Challenge 1');
  });

  it('generates FRONTIER fallback with research direction', () => {
    const ctx = createMockCourseContext();
    const chapter = createMockChapter();
    const section = createMockSection();
    const details = buildFallbackDetails(chapter, section, ctx, makeTemplateDef('FRONTIER'));
    expect(details.description).toContain('Frontier');
    expect(details.description).toContain('Open Questions');
  });

  it('generates CHECKPOINT fallback with self-assessment', () => {
    const ctx = createMockCourseContext();
    const chapter = createMockChapter();
    const section = createMockSection();
    const details = buildFallbackDetails(chapter, section, ctx, makeTemplateDef('CHECKPOINT'));
    expect(details.description).toContain('Self-Assessment');
    expect(details.description).toContain('Confidence Check');
  });

  it('generates PITFALLS fallback with common mistakes', () => {
    const ctx = createMockCourseContext();
    const chapter = createMockChapter();
    const section = createMockSection();
    const details = buildFallbackDetails(chapter, section, ctx, makeTemplateDef('PITFALLS'));
    expect(details.description).toContain('Common Pitfalls');
    expect(details.description).toContain('Misconception Buster');
  });

  it('generates SUMMARY fallback with connections', () => {
    const ctx = createMockCourseContext();
    const chapter = createMockChapter();
    const section = createMockSection();
    const details = buildFallbackDetails(chapter, section, ctx, makeTemplateDef('SUMMARY'));
    expect(details.description).toContain('Chapter Summary');
    expect(details.description).toContain('Connections');
  });
});

describe('buildFallbackDescription', () => {
  it('includes course context', () => {
    const ctx = createMockCourseContext();
    const desc = buildFallbackDescription(ctx);
    expect(desc).toContain(ctx.targetAudience);
    expect(desc).toContain(ctx.courseTitle);
    expect(desc).toContain(ctx.difficulty);
  });
});
