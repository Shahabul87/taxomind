/**
 * Eval Harness — Automated Quality Evaluation for Course Creation Pipeline
 *
 * Tests AI response parsing, quality scoring, and fallback behavior using
 * parameterized mock responses (good / borderline / poor) against golden
 * fixtures. Runs entirely offline — no AI calls, no network.
 *
 * Coverage:
 *   - Stage 1 (chapter), Stage 2 (section), Stage 3 (details) response parsing
 *   - Quality score thresholds for good/borderline/poor responses
 *   - Fallback triggers on malformed input
 *   - SchemaValidationError produces lower scores than parse errors
 *   - Golden fixture compatibility after schema changes
 */

import { parseChapterResponse, parseSectionResponse, parseDetailsResponse } from '../response-parsers';
import { SchemaValidationError } from '../response-parsers';
import {
  FIXTURE_BEGINNER_FIRST_CHAPTER,
  FIXTURE_INTERMEDIATE_MIDDLE_CHAPTER,
  FIXTURE_RESUMED_WITH_BRIDGE,
} from './golden-inputs';
import type { CourseContext, GeneratedChapter, GeneratedSection } from '../types';

// ============================================================================
// Mock Response Builders
// ============================================================================

type Quality = 'good' | 'borderline' | 'poor';

/** Build a Stage 1 (chapter) mock AI response */
function buildMockChapterResponse(quality: Quality): string {
  const good = {
    thinking: 'Analyzing the learning trajectory and concept dependencies for this chapter.',
    chapter: {
      title: 'Understanding Web Fundamentals: How Browsers Render Pages',
      description:
        'This chapter introduces the foundational concepts of how web browsers transform HTML and CSS code into the visual pages we interact with daily. Students will explore the document object model, rendering pipeline, and the relationship between markup and visual output.',
      bloomsLevel: 'UNDERSTAND',
      learningObjectives: [
        'Explain how browsers parse HTML into the Document Object Model (DOM)',
        'Describe the CSS rendering pipeline from stylesheets to painted pixels',
        'Compare block-level and inline elements and their layout behaviors',
        'Summarize the role of the browser dev tools in inspecting rendered output',
      ],
      keyTopics: ['DOM structure', 'CSS rendering pipeline', 'Block vs inline elements', 'Browser dev tools'],
      prerequisites: 'No prior experience required',
      estimatedTime: '2 hours 30 minutes',
      topicsToExpand: ['DOM structure', 'CSS rendering pipeline', 'Block vs inline elements', 'Browser dev tools'],
      conceptsIntroduced: ['DOM', 'rendering pipeline', 'block element', 'inline element', 'CSS specificity'],
    },
  };

  const borderline = {
    thinking: 'Thinking about the chapter.',
    chapter: {
      title: 'Web Basics',
      description: 'This chapter covers web basics and how browsers work with HTML and CSS.',
      bloomsLevel: 'REMEMBER',
      learningObjectives: [
        'List HTML tags',
        'Recall CSS properties',
      ],
      keyTopics: ['HTML', 'CSS'],
      prerequisites: '',
      estimatedTime: '1 hour',
      topicsToExpand: ['HTML'],
      conceptsIntroduced: ['HTML'],
    },
  };

  const poor = {
    thinking: '',
    chapter: {
      title: 'Ch 1',
      description: 'Web stuff.',
      bloomsLevel: 'INVALID_LEVEL',
      learningObjectives: [],
      keyTopics: [],
      prerequisites: '',
      estimatedTime: '',
      topicsToExpand: [],
      conceptsIntroduced: [],
    },
  };

  const map = { good, borderline, poor };
  return JSON.stringify(map[quality]);
}

/** Build a Stage 2 (section) mock AI response */
function buildMockSectionResponse(quality: Quality): string {
  const good = {
    thinking: 'Designing a section that builds on prior DOM concepts.',
    section: {
      title: 'The CSS Box Model: Margins, Borders, and Padding Demystified',
      contentType: 'reading',
      estimatedDuration: '25 minutes',
      topicFocus: 'CSS Box Model',
      parentChapterContext: {
        relevantObjectives: ['Describe the CSS rendering pipeline from stylesheets to painted pixels'],
      },
      conceptsIntroduced: ['box model', 'margin collapse'],
      conceptsReferenced: ['block element', 'inline element'],
    },
  };

  const borderline = {
    thinking: 'Section about CSS.',
    section: {
      title: 'CSS Stuff',
      contentType: 'reading',
      estimatedDuration: '15 minutes',
      topicFocus: 'CSS',
      parentChapterContext: {},
      conceptsIntroduced: [],
      conceptsReferenced: [],
    },
  };

  const poor = {
    thinking: '',
    section: {
      title: 'S1',
      contentType: '',
      estimatedDuration: '',
      topicFocus: '',
    },
  };

  const map = { good, borderline, poor };
  return JSON.stringify(map[quality]);
}

/** Build a Stage 3 (details) mock AI response */
function buildMockDetailsResponse(quality: Quality): string {
  const good = {
    thinking: 'Creating comprehensive content with practical exercises and clear explanations.',
    details: {
      description:
        '<h2>Understanding the CSS Box Model</h2>' +
        '<p>Every HTML element on a web page is represented as a rectangular box. The CSS Box Model describes how these boxes are sized, spaced, and positioned relative to one another. Understanding this model is essential for creating precise, predictable layouts.</p>' +
        '<h3>The Four Layers</h3>' +
        '<p>Each box consists of four concentric areas: content, padding, border, and margin. The content area holds the actual text or media. Padding creates space between the content and the border. The border wraps around the padding. Margins create space between the element and its neighbors.</p>' +
        '<h3>Box-Sizing Property</h3>' +
        '<p>By default, CSS uses <code>content-box</code> sizing, where width and height apply only to the content area. The <code>border-box</code> model includes padding and border in the declared dimensions, making layout calculations far more intuitive.</p>',
      learningObjectives: [
        'Identify the four layers of the CSS Box Model and their functions',
        'Apply box-sizing: border-box to simplify layout calculations',
        'Debug spacing issues using browser developer tools',
      ],
      keyConceptsCovered: ['box model', 'padding', 'margin', 'border', 'box-sizing', 'margin collapse'],
      practicalActivity:
        'Open your browser dev tools, select any element on a live page, and examine its box model diagram. ' +
        'Try modifying padding, margin, and border values in real-time to see how the layout shifts. ' +
        'Then create a simple card component using border-box sizing.',
      resources: ['https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/The_box_model'],
    },
  };

  const borderline = {
    thinking: 'Writing details.',
    details: {
      description:
        '<p>The CSS box model describes how elements are sized. It has content, padding, border, and margin. Understanding these layers helps with layout.</p>' +
        '<p>Content is the inner area. Padding surrounds it. Border wraps padding. Margin is the outer space.</p>',
      learningObjectives: [
        'Understand the box model',
      ],
      keyConceptsCovered: ['box model'],
      practicalActivity: 'Try changing margin and padding values in your CSS.',
    },
  };

  const poor = {
    thinking: '',
    details: {
      description: 'CSS boxes.',
      learningObjectives: [],
      practicalActivity: '',
    },
  };

  const map = { good, borderline, poor };
  return JSON.stringify(map[quality]);
}

// ============================================================================
// Test Helpers
// ============================================================================

const defaultCourseContext: CourseContext = FIXTURE_BEGINNER_FIRST_CHAPTER.stage1.courseContext;
const intermediateCourseContext: CourseContext = FIXTURE_INTERMEDIATE_MIDDLE_CHAPTER.stage1.courseContext;

// ============================================================================
// Tests
// ============================================================================

describe('Eval Harness: Course Creation Response Evaluation', () => {
  // --------------------------------------------------------------------------
  // Stage 1: Chapter parsing and quality
  // --------------------------------------------------------------------------
  describe('Stage 1: Chapter Response Parsing', () => {
    it('good response produces quality score >= 65', () => {
      const response = buildMockChapterResponse('good');
      const result = parseChapterResponse(response, 1, defaultCourseContext, [], null);
      expect(result.qualityScore.overall).toBeGreaterThanOrEqual(65);
      expect(result.chapter.title).toBeTruthy();
      expect(result.chapter.learningObjectives.length).toBeGreaterThanOrEqual(2);
      expect(result.chapter.keyTopics.length).toBeGreaterThanOrEqual(2);
    });

    it('borderline response produces quality score between 40-70', () => {
      const response = buildMockChapterResponse('borderline');
      const result = parseChapterResponse(response, 1, defaultCourseContext, [], null);
      expect(result.qualityScore.overall).toBeGreaterThanOrEqual(40);
      expect(result.qualityScore.overall).toBeLessThanOrEqual(70);
    });

    it('poor response triggers fallback generation', () => {
      const response = buildMockChapterResponse('poor');
      const result = parseChapterResponse(response, 1, defaultCourseContext, [], null);
      // Poor input should still produce a valid result (via fallback or lenient parsing)
      expect(result.chapter.title).toBeTruthy();
      expect(result.qualityScore.overall).toBeLessThan(60);
    });

    it('completely malformed JSON triggers fallback with low score', () => {
      const result = parseChapterResponse('NOT JSON AT ALL {{{', 1, defaultCourseContext, [], null);
      expect(result.chapter.title).toBeTruthy(); // Fallback should provide a title
      expect(result.qualityScore.overall).toBeLessThanOrEqual(50);
    });

    it('empty string triggers fallback', () => {
      const result = parseChapterResponse('', 1, defaultCourseContext, [], null);
      expect(result.chapter.title).toBeTruthy();
      expect(result.qualityScore.overall).toBeLessThanOrEqual(50);
    });
  });

  // --------------------------------------------------------------------------
  // Stage 2: Section parsing and quality
  // --------------------------------------------------------------------------
  describe('Stage 2: Section Response Parsing', () => {
    const chapterPlain = {
      position: 5,
      title: 'Binary Trees: Structure, Traversal, and Search',
      description: 'Understanding tree data structures.',
      bloomsLevel: 'ANALYZE' as const,
      learningObjectives: ['Analyze binary tree structures'],
      keyTopics: ['Binary trees', 'Traversal algorithms'],
      prerequisites: 'Chapters 1-4',
      estimatedTime: '3 hours',
      topicsToExpand: ['Binary trees'],
      conceptsIntroduced: ['binary tree'],
    };

    it('good response produces quality score >= 65', () => {
      const response = buildMockSectionResponse('good');
      const result = parseSectionResponse(response, 3, chapterPlain, ['Section 1', 'Section 2']);
      expect(result.qualityScore.overall).toBeGreaterThanOrEqual(65);
      expect(result.section.title).toBeTruthy();
      expect(result.section.title.length).toBeGreaterThan(5);
    });

    it('borderline response produces quality score between 40-75', () => {
      const response = buildMockSectionResponse('borderline');
      const result = parseSectionResponse(response, 3, chapterPlain, ['Section 1', 'Section 2']);
      expect(result.qualityScore.overall).toBeGreaterThanOrEqual(40);
      expect(result.qualityScore.overall).toBeLessThanOrEqual(75);
    });

    it('poor response triggers fallback', () => {
      const response = buildMockSectionResponse('poor');
      const result = parseSectionResponse(response, 3, chapterPlain, []);
      expect(result.section.title).toBeTruthy();
      expect(result.qualityScore.overall).toBeLessThan(60);
    });

    it('malformed JSON triggers fallback with low score', () => {
      const result = parseSectionResponse('{{BROKEN', 3, chapterPlain, []);
      expect(result.section.title).toBeTruthy();
      expect(result.qualityScore.overall).toBeLessThanOrEqual(50);
    });
  });

  // --------------------------------------------------------------------------
  // Stage 3: Details parsing and quality
  // --------------------------------------------------------------------------
  describe('Stage 3: Details Response Parsing', () => {
    const chapterPlain = {
      position: 4,
      title: 'Hash Tables: Fast Lookup and Collision Resolution',
      description: 'Design hash tables with different collision strategies.',
      bloomsLevel: 'APPLY' as const,
      learningObjectives: ['Implement a hash table'],
      keyTopics: ['Hash functions', 'Chaining'],
      prerequisites: 'Chapters 1-3',
      estimatedTime: '3 hours',
      topicsToExpand: ['Hash functions'],
      conceptsIntroduced: ['hash table'],
    };

    const sectionPlain: GeneratedSection = {
      position: 1,
      title: 'Why Hash Tables Power the Modern Web',
      contentType: 'video',
      estimatedDuration: '20 minutes',
      topicFocus: 'Hash functions',
      parentChapterContext: {
        title: 'Hash Tables',
        bloomsLevel: 'APPLY',
        relevantObjectives: ['Implement a hash table'],
      },
      conceptsIntroduced: ['hash function'],
      conceptsReferenced: ['array'],
    };

    it('good response produces quality score >= 65', () => {
      const response = buildMockDetailsResponse('good');
      const result = parseDetailsResponse(response, chapterPlain, sectionPlain, intermediateCourseContext);
      expect(result.qualityScore.overall).toBeGreaterThanOrEqual(65);
      expect(result.details.description.length).toBeGreaterThan(100);
      expect(result.details.learningObjectives.length).toBeGreaterThanOrEqual(1);
    });

    it('borderline response produces quality score between 40-70', () => {
      const response = buildMockDetailsResponse('borderline');
      const result = parseDetailsResponse(response, chapterPlain, sectionPlain, intermediateCourseContext);
      expect(result.qualityScore.overall).toBeGreaterThanOrEqual(40);
      expect(result.qualityScore.overall).toBeLessThanOrEqual(70);
    });

    it('poor response triggers fallback', () => {
      const response = buildMockDetailsResponse('poor');
      const result = parseDetailsResponse(response, chapterPlain, sectionPlain, defaultCourseContext);
      expect(result.details.description).toBeTruthy();
      expect(result.qualityScore.overall).toBeLessThan(60);
    });

    it('malformed JSON triggers fallback with low score', () => {
      const result = parseDetailsResponse('INVALID{{{', chapterPlain, sectionPlain, defaultCourseContext);
      expect(result.details.description).toBeTruthy();
      expect(result.qualityScore.overall).toBeLessThanOrEqual(50);
    });
  });

  // --------------------------------------------------------------------------
  // Cross-cutting: SchemaValidationError vs parse errors
  // --------------------------------------------------------------------------
  describe('Error Differentiation', () => {
    it('SchemaValidationError has issues array and descriptive message', () => {
      const err = new SchemaValidationError('Stage1', ['Missing title', 'Invalid bloomsLevel']);
      expect(err.name).toBe('SchemaValidationError');
      expect(err.issues).toHaveLength(2);
      expect(err.message).toContain('Stage1');
      expect(err.message).toContain('Missing title');
    });

    it('schema validation errors produce higher scores than JSON parse errors (both retryable)', () => {
      // Schema validation: JSON is valid but content doesn't match schema
      // This should score ~40 (retryable)
      const schemaViolation = JSON.stringify({
        chapter: {
          title: 'X', // too short for strict schema
          description: 'Short',
          bloomsLevel: 'INVALID',
          learningObjectives: [],
          keyTopics: [],
        },
      });

      // Complete garbage: can't even parse JSON → score ~50 (worse)
      const jsonGarbage = 'This is not JSON at all <<<>>>';

      const schemaResult = parseChapterResponse(schemaViolation, 1, defaultCourseContext, [], null);
      const garbageResult = parseChapterResponse(jsonGarbage, 1, defaultCourseContext, [], null);

      // Schema violation should produce a higher (or equal) score than complete parse failure
      // because at least the JSON was valid and some fields could be recovered
      expect(schemaResult.qualityScore.overall).toBeGreaterThanOrEqual(garbageResult.qualityScore.overall);
    });
  });

  // --------------------------------------------------------------------------
  // Golden fixture compatibility
  // --------------------------------------------------------------------------
  describe('Golden Fixture Compatibility', () => {
    it('beginner fixture courseContext has all required fields', () => {
      const ctx = FIXTURE_BEGINNER_FIRST_CHAPTER.stage1.courseContext;
      expect(ctx.courseTitle).toBeTruthy();
      expect(ctx.courseDescription).toBeTruthy();
      expect(ctx.totalChapters).toBeGreaterThan(0);
      expect(ctx.sectionsPerChapter).toBeGreaterThan(0);
      expect(ctx.difficulty).toBe('beginner');
    });

    it('intermediate fixture has stage2 data with chapter and sections', () => {
      const s2 = FIXTURE_INTERMEDIATE_MIDDLE_CHAPTER.stage2;
      expect(s2.chapter.title).toBeTruthy();
      expect(s2.chapter.bloomsLevel).toBe('ANALYZE');
      expect(s2.previousSections.length).toBeGreaterThan(0);
      expect(s2.currentSectionNumber).toBe(3);
    });

    it('resumed fixture has bridge content for stage3', () => {
      const s3 = FIXTURE_RESUMED_WITH_BRIDGE.stage3;
      expect(s3.bridgeContent).toBeTruthy();
      expect(s3.bridgeContent.length).toBeGreaterThan(50);
      expect(s3.section.title).toBeTruthy();
      expect(s3.chapterSections.length).toBeGreaterThan(0);
    });

    it('good mock responses parse successfully against all 3 stages', () => {
      // Stage 1
      const s1 = parseChapterResponse(
        buildMockChapterResponse('good'), 1, defaultCourseContext, [], null,
      );
      expect(s1.chapter.title).toBeTruthy();
      expect(s1.qualityScore.overall).toBeGreaterThan(50);

      // Stage 2
      const s2Chapter = {
        position: 1, title: 'Test Chapter', description: 'Test',
        bloomsLevel: 'UNDERSTAND' as const,
        learningObjectives: ['Understand X'], keyTopics: ['X'],
        prerequisites: '', estimatedTime: '1h',
        topicsToExpand: ['X'], conceptsIntroduced: ['X'],
      };
      const s2 = parseSectionResponse(
        buildMockSectionResponse('good'), 1, s2Chapter, [],
      );
      expect(s2.section.title).toBeTruthy();
      expect(s2.qualityScore.overall).toBeGreaterThan(50);

      // Stage 3
      const s3Section: GeneratedSection = {
        position: 1, title: 'Test Section', contentType: 'reading',
        estimatedDuration: '20 min', topicFocus: 'Test',
        parentChapterContext: { title: 'Test', bloomsLevel: 'UNDERSTAND', relevantObjectives: ['Test'] },
      };
      const s3 = parseDetailsResponse(
        buildMockDetailsResponse('good'), s2Chapter, s3Section, defaultCourseContext,
      );
      expect(s3.details.description).toBeTruthy();
      expect(s3.qualityScore.overall).toBeGreaterThan(50);
    });
  });
});
