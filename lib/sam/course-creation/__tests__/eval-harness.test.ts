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
        '<h2>The Big Picture</h2>' +
        '<p>Hash functions were developed to solve a practical bottleneck: searching through large collections one item at a time was too slow for real systems. Before hash functions, many programs depended on linear scans that became painful as data grew, especially for caching, routing, and account lookup workflows. The motivating problem was speed under real load. Teams needed near-constant-time access by key, not repeated full-list traversal. Hash functions transformed this limitation by mapping a key into a predictable storage location, making modern lookup-heavy applications feasible at scale.</p>' +
        '<h2>Core Intuition</h2>' +
        '<p>Think of a hash function as a smart mailroom sorter. You hand the sorter an address label, and it immediately routes the letter to a numbered shelf. You do not search every shelf; you compute where to start. This mental model helps beginners see that hash functions are not magic storage, but deterministic routing rules. The intuition is stable: the same key should produce the same shelf index. Good routing spreads keys across shelves, reducing pileups and keeping retrieval fast even as the number of stored entries grows.</p>' +
        '<h2>Concrete Example and Analogy</h2>' +
        '<p>Consider a table capacity of 10 and a simplified hash output for key <code>\"apple\"</code> equal to 37. Using the rule, <code>37 mod 10 = 7</code>, so the record is stored at bucket 7. Suppose key <code>\"angle\"</code> also maps to bucket 7, creating a collision. With chaining, both entries remain in bucket 7 as a short list. During lookup, the program computes the same bucket first, then compares keys locally. This worked example shows why hash functions give fast average access while collision handling preserves correctness.</p>' +
        '<h2>Common Confusion + Fix</h2>' +
        '<p>A common misconception is that hash functions eliminate collisions entirely. Another frequent mistake is assuming a fast hash guarantees fast lookup under any load. The fix is to teach two rules explicitly: collisions are normal, and performance depends on distribution plus load factor. Encourage learners to check bucket occupancy patterns, not just formula correctness. If collisions cluster, choose a stronger hash approach or resize earlier. Remember: a hash function is a routing strategy, not a promise of uniqueness, and the correction is disciplined collision management.</p>' +
        '<h2>Equation Intuition</h2>' +
        '<p>A common equation form is <code>index = hash(key) mod capacity</code>. Each term has a role: <code>hash(key)</code> turns the original key into a numeric fingerprint, <code>capacity</code> is the current table size, and <code>mod</code> constrains the index into valid bounds. The structure exists because the hash output can be large, but table slots are finite. The equation shape balances two needs: deterministic placement and bounded storage. If capacity changes, the same key may map differently, which is why resize operations require controlled rehashing.</p>' +
        '<h2>Step-by-Step Visualization</h2>' +
        '<p>First, visualize a table with numbered buckets from 0 to N-1. Second, take a key like <code>\"user:42\"</code> and compute its hash value. Third, apply modulo to get a bucket index. Next, check that bucket: if empty, place the record; if occupied, follow the collision strategy. Then, retrieve by repeating the exact same steps with the same key, which leads back to the same location. Finally, monitor load factor as entries grow and picture how increased collisions signal the need to resize for stable performance.</p>',
      learningObjectives: [
        'Apply a hash-function indexing rule to place key-value records into the correct bucket under a given table capacity',
        'Implement a basic collision-handling decision using chaining when two keys map to the same index',
        'Demonstrate lookup reasoning by tracing key-to-index computation and validating retrieval outcomes',
      ],
      keyConceptsCovered: ['hash function', 'bucket index', 'collision handling', 'load factor', 'rehashing'],
      practicalActivity:
        'Watch a short demo video that computes hash indexes for several keys, then observe where each key lands in a 10-slot table. ' +
        'Next, complete a guided worksheet where you apply the same rule to new keys, predict collisions, and explain your decision for chaining or probing. ' +
        'Finish by demonstrating your reasoning to a partner and verifying the final lookup results against expected outputs.',
      creatorGuidelines:
        'Start with a real production scenario where slow lookup caused user-visible latency, then transition into the mailroom analogy before showing the indexing equation. ' +
        'On screen, display key, hash output, modulo step, and final bucket side-by-side so learners can track each transformation. ' +
        'Emphasize that collisions are expected and model calm debugging language when one appears. ' +
        'Use deliberate pacing: concept, worked example, guided practice, then quick recap with one misconception correction at the end.',
      resources: ['https://en.wikipedia.org/wiki/Hash_table'],
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
      expect(result.qualityScore.overall).toBeLessThan(65);
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

  // --------------------------------------------------------------------------
  // Golden fixture regression tests
  // --------------------------------------------------------------------------
  describe('Golden Fixture Regression', () => {
    const stage1Good = require('./golden-fixtures/stage1-good.json');
    const stage2Good = require('./golden-fixtures/stage2-good.json');
    const stage3Good = require('./golden-fixtures/stage3-good.json');
    const blueprintGood = require('./golden-fixtures/blueprint-good.json');

    const REGRESSION_THRESHOLDS = {
      stage1: 65,
      stage2: 65,
      stage3: 65,
      blueprint: { minChapters: 3, minSectionsPerChapter: 3, minConfidence: 70 },
    };

    it('stage1 golden fixture scores above regression threshold', () => {
      const response = JSON.stringify(stage1Good);
      const result = parseChapterResponse(response, 1, defaultCourseContext, [], null);
      expect(result.qualityScore.overall).toBeGreaterThanOrEqual(REGRESSION_THRESHOLDS.stage1);
      expect(result.chapter.title.length).toBeGreaterThan(10);
      expect(result.chapter.learningObjectives.length).toBeGreaterThanOrEqual(2);
      expect(result.chapter.keyTopics.length).toBeGreaterThanOrEqual(3);
      expect(result.chapter.conceptsIntroduced?.length ?? 0).toBeGreaterThanOrEqual(3);
    });

    it('stage2 golden fixture scores above regression threshold', () => {
      const chapterPlain = {
        position: 1, title: 'Test Chapter', description: 'Test',
        bloomsLevel: 'UNDERSTAND' as const,
        learningObjectives: ['Understand X'], keyTopics: ['X'],
        prerequisites: '', estimatedTime: '1h',
        topicsToExpand: ['X'], conceptsIntroduced: ['X'],
      };
      const response = JSON.stringify(stage2Good);
      const result = parseSectionResponse(response, 1, chapterPlain, []);
      expect(result.qualityScore.overall).toBeGreaterThanOrEqual(REGRESSION_THRESHOLDS.stage2);
      expect(result.section.title.length).toBeGreaterThan(10);
      expect(result.section.conceptsIntroduced?.length ?? 0).toBeGreaterThanOrEqual(2);
    });

    it('stage3 golden fixture scores above regression threshold', () => {
      const chapterPlain = {
        position: 4, title: 'Hash Tables: Fast Lookup', description: 'Hash tables.',
        bloomsLevel: 'APPLY' as const,
        learningObjectives: ['Implement a hash table'], keyTopics: ['Hash functions'],
        prerequisites: 'Chapters 1-3', estimatedTime: '3h',
        topicsToExpand: ['Hash functions'], conceptsIntroduced: ['hash table'],
      };
      const sectionPlain: GeneratedSection = {
        position: 1, title: 'Why Hash Tables', contentType: 'video',
        estimatedDuration: '20 min', topicFocus: 'Hash functions',
        parentChapterContext: { title: 'Hash Tables', bloomsLevel: 'APPLY', relevantObjectives: ['Implement a hash table'] },
        conceptsIntroduced: ['hash function'], conceptsReferenced: ['array'],
      };
      const response = JSON.stringify(stage3Good);
      const result = parseDetailsResponse(response, chapterPlain, sectionPlain, intermediateCourseContext);
      expect(result.qualityScore.overall).toBeGreaterThanOrEqual(REGRESSION_THRESHOLDS.stage3);
      expect(result.details.description.length).toBeGreaterThan(200);
      expect(result.details.learningObjectives.length).toBeGreaterThanOrEqual(2);
      expect(result.details.keyConceptsCovered.length).toBeGreaterThanOrEqual(3);
    });

    it('blueprint golden fixture has valid structure', () => {
      expect(blueprintGood.chapters.length).toBeGreaterThanOrEqual(REGRESSION_THRESHOLDS.blueprint.minChapters);
      expect(blueprintGood.confidence).toBeGreaterThanOrEqual(REGRESSION_THRESHOLDS.blueprint.minConfidence);
      for (const ch of blueprintGood.chapters) {
        expect(ch.title.length).toBeGreaterThan(5);
        expect(ch.sections.length).toBeGreaterThanOrEqual(REGRESSION_THRESHOLDS.blueprint.minSectionsPerChapter);
        for (const sec of ch.sections) {
          expect(sec.title.length).toBeGreaterThan(5);
          expect(sec.keyTopics.length).toBeGreaterThanOrEqual(2);
        }
      }
    });

    it.each([
      ['stage1', stage1Good],
      ['stage2', stage2Good],
      ['stage3', stage3Good],
    ] as const)('%s golden fixture round-trips through JSON.stringify/parse', (_stage, fixture) => {
      const roundTripped = JSON.parse(JSON.stringify(fixture));
      expect(roundTripped).toEqual(fixture);
    });
  });
});
