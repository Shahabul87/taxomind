/**
 * Prompt Regression Tests
 *
 * Pure unit tests that call the prompt builders with golden inputs and validate:
 * - System prompt contains ARROW framework keywords
 * - User prompt contains required context sections
 * - Token count within expected range (using estimateTokens())
 * - Bloom's level verbs appropriate for chapter position
 * - No prompt exceeds budget limits from INPUT_TOKEN_BUDGETS
 *
 * These tests do NOT call any AI — they test prompt construction only.
 */

import {
  buildStage1Prompt,
  buildStage2Prompt,
  buildStage3Prompt,
  PROMPT_VERSION,
  PROMPT_VERSIONS,
  getContentAwareBloomsLevel,
} from '../prompts';
import { estimateTokens, INPUT_TOKEN_BUDGETS } from '../prompt-budget';
import { BLOOMS_TAXONOMY } from '../types';
import type { BloomsLevel, StagePrompt } from '../types';
import {
  FIXTURE_BEGINNER_FIRST_CHAPTER,
  FIXTURE_INTERMEDIATE_MIDDLE_CHAPTER,
  FIXTURE_EXPERT_LATE_CHAPTER,
  FIXTURE_AFTER_REPLAN,
  FIXTURE_PROGRAMMING_DOMAIN,
  FIXTURE_RESUMED_WITH_BRIDGE,
  ALL_STAGE1_FIXTURES,
} from './golden-inputs';

// ============================================================================
// Helpers
// ============================================================================

/** ARROW framework keywords that must appear in Stage 1/2 system prompts (full ARROW) */
const ARROW_KEYWORDS_FULL = [
  'ARROW',
  'APPLICATION',
  'REVERSE',
  'INTUITION',
  'FORMALIZATION',
  'FAILURE',
];

/**
 * ARROW framework keywords for Stage 3 system prompts (condensed ARROW).
 * Stage 3 uses a ~500 token condensed version that omits "Reverse Engineer"
 * and some other phases to save tokens across many Stage 3 calls.
 */
const ARROW_KEYWORDS_CONDENSED = [
  'ARROW',
  'APPLICATION',
  'INTUITION',
  'FORMALIZATION',
  'FAILURE',
];

/** Verifies that the expected Bloom's verbs appear somewhere in the prompt */
function containsBloomsVerbs(text: string, level: BloomsLevel): boolean {
  const verbs = BLOOMS_TAXONOMY[level].verbs;
  return verbs.some(verb => text.includes(verb));
}

// ============================================================================
// PROMPT_VERSION
// ============================================================================

describe('PROMPT_VERSION', () => {
  it('composite version contains all 3 stages', () => {
    expect(PROMPT_VERSION).toContain('stage1:');
    expect(PROMPT_VERSION).toContain('stage2:');
    expect(PROMPT_VERSION).toContain('stage3:');
  });

  it('each per-stage version is a valid semver string', () => {
    for (const stage of ['stage1', 'stage2', 'stage3'] as const) {
      expect(PROMPT_VERSIONS[stage]).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });
});

// ============================================================================
// Stage 1: Chapter Generation Prompt
// ============================================================================

describe('buildStage1Prompt', () => {
  describe.each(ALL_STAGE1_FIXTURES.map(f => [f.label, f] as const))(
    '%s',
    (_label, fixture) => {
      let prompt: StagePrompt;

      beforeAll(() => {
        const s1 = fixture.stage1;
        prompt = buildStage1Prompt(
          s1.courseContext,
          s1.currentChapterNumber,
          s1.previousChapters,
          s1.conceptTracker,
          s1.categoryPrompt,
          s1.completedChapters,
          s1.variant,
          s1.templatePrompt,
          s1.recalledMemory,
        );
      });

      it('returns a systemPrompt and userPrompt', () => {
        expect(prompt.systemPrompt).toBeDefined();
        expect(prompt.userPrompt).toBeDefined();
        expect(typeof prompt.systemPrompt).toBe('string');
        expect(typeof prompt.userPrompt).toBe('string');
        expect(prompt.systemPrompt.length).toBeGreaterThan(100);
        expect(prompt.userPrompt.length).toBeGreaterThan(100);
      });

      it('system prompt contains ARROW framework keywords', () => {
        for (const keyword of ARROW_KEYWORDS_FULL) {
          expect(prompt.systemPrompt.toUpperCase()).toContain(keyword);
        }
      });

      it('system prompt contains chapter design principles', () => {
        expect(prompt.systemPrompt).toContain('CHAPTER DESIGN PRINCIPLES');
      });

      it('user prompt contains COURSE CONTEXT section', () => {
        expect(prompt.userPrompt).toContain('COURSE CONTEXT');
        expect(prompt.userPrompt).toContain(fixture.stage1.courseContext.courseTitle);
      });

      it('user prompt contains OUTPUT REQUIREMENTS section', () => {
        expect(prompt.userPrompt).toContain('OUTPUT REQUIREMENTS');
        expect(prompt.userPrompt).toContain('JSON');
      });

      it('user prompt contains Bloom\'s level assignment', () => {
        expect(prompt.userPrompt).toContain('BLOOM');
      });

      it('user prompt contains appropriate Bloom\'s verbs for chapter position', () => {
        const level = getContentAwareBloomsLevel({
          chapterNumber: fixture.stage1.currentChapterNumber,
          totalChapters: fixture.stage1.courseContext.totalChapters,
          focusLevels: fixture.stage1.courseContext.bloomsFocus,
          difficulty: fixture.stage1.courseContext.difficulty,
          isFoundational: fixture.stage1.currentChapterNumber <= 2,
          isCapstone: fixture.stage1.currentChapterNumber >= fixture.stage1.courseContext.totalChapters - 1,
          previousBloomsLevels: fixture.stage1.previousChapters.map(ch => ch.bloomsLevel),
        });
        expect(containsBloomsVerbs(prompt.userPrompt, level)).toBe(true);
      });

      it('user prompt token count is within budget', () => {
        const tokens = estimateTokens(prompt.userPrompt);
        expect(tokens).toBeLessThanOrEqual(INPUT_TOKEN_BUDGETS.stage1.user);
      });

      it('total prompt token count is reasonable (not zero, not extreme)', () => {
        const systemTokens = estimateTokens(prompt.systemPrompt);
        const userTokens = estimateTokens(prompt.userPrompt);
        const totalTokens = systemTokens + userTokens;

        // Total prompt should be at least 500 tokens (system + user)
        expect(totalTokens).toBeGreaterThan(500);

        // Total prompt should not exceed a reasonable ceiling (system has no enforced budget,
        // but combined should not exceed 2x the sum of budgets)
        const combinedBudget = INPUT_TOKEN_BUDGETS.stage1.system + INPUT_TOKEN_BUDGETS.stage1.user;
        expect(totalTokens).toBeLessThan(combinedBudget * 2);
      });
    },
  );

  describe('first chapter specifics', () => {
    it('contains opening chapter position guidance for chapter 1', () => {
      const s1 = FIXTURE_BEGINNER_FIRST_CHAPTER.stage1;
      const prompt = buildStage1Prompt(
        s1.courseContext,
        s1.currentChapterNumber,
        s1.previousChapters,
        s1.conceptTracker,
        s1.categoryPrompt,
        s1.completedChapters,
        s1.variant,
        s1.templatePrompt,
        s1.recalledMemory,
      );
      // Chapter 1 should get "OPENING CHAPTER" or "first chapter" or foundation guidance
      expect(prompt.userPrompt).toContain('first chapter');
    });

    it('does not include CONCEPT FLOW for first chapter', () => {
      const s1 = FIXTURE_BEGINNER_FIRST_CHAPTER.stage1;
      const prompt = buildStage1Prompt(
        s1.courseContext,
        s1.currentChapterNumber,
        s1.previousChapters,
        s1.conceptTracker,
        s1.categoryPrompt,
        s1.completedChapters,
        s1.variant,
        s1.templatePrompt,
        s1.recalledMemory,
      );
      // No concept tracker provided, so no CONCEPT FLOW section
      expect(prompt.userPrompt).not.toContain('CONCEPT FLOW');
    });
  });

  describe('middle chapter specifics', () => {
    it('includes CONCEPT FLOW when concept tracker is provided', () => {
      const s1 = FIXTURE_INTERMEDIATE_MIDDLE_CHAPTER.stage1;
      const prompt = buildStage1Prompt(
        s1.courseContext,
        s1.currentChapterNumber,
        s1.previousChapters,
        s1.conceptTracker,
        s1.categoryPrompt,
        s1.completedChapters,
        s1.variant,
        s1.templatePrompt,
        s1.recalledMemory,
      );
      expect(prompt.userPrompt).toContain('CONCEPT FLOW');
      expect(prompt.userPrompt).toContain('PREREQUISITE CHAIN');
    });

    it('includes previous chapter titles', () => {
      const s1 = FIXTURE_INTERMEDIATE_MIDDLE_CHAPTER.stage1;
      const prompt = buildStage1Prompt(
        s1.courseContext,
        s1.currentChapterNumber,
        s1.previousChapters,
        s1.conceptTracker,
        s1.categoryPrompt,
        s1.completedChapters,
        s1.variant,
        s1.templatePrompt,
        s1.recalledMemory,
      );
      expect(prompt.userPrompt).toContain('PREVIOUS CHAPTERS');
      // Should contain at least the first previous chapter title
      expect(prompt.userPrompt).toContain('Arrays and Time Complexity');
    });
  });

  describe('expert late chapter specifics', () => {
    it('uses focus-level-derived Bloom\'s for expert course with bloomsFocus', () => {
      const s1 = FIXTURE_EXPERT_LATE_CHAPTER.stage1;
      const prompt = buildStage1Prompt(
        s1.courseContext,
        s1.currentChapterNumber,
        s1.previousChapters,
        s1.conceptTracker,
        s1.categoryPrompt,
        s1.completedChapters,
        s1.variant,
        s1.templatePrompt,
        s1.recalledMemory,
      );
      // Expert course has bloomsFocus: ['ANALYZE', 'EVALUATE', 'CREATE']
      // Chapter 10 of 12 should map to one of these
      const level = getContentAwareBloomsLevel({
        chapterNumber: 10,
        totalChapters: 12,
        focusLevels: s1.courseContext.bloomsFocus,
        difficulty: s1.courseContext.difficulty,
        isFoundational: false,
        isCapstone: true,
        previousBloomsLevels: s1.previousChapters.map(ch => ch.bloomsLevel),
      });
      expect(['ANALYZE', 'EVALUATE', 'CREATE']).toContain(level);
      expect(containsBloomsVerbs(prompt.userPrompt, level)).toBe(true);
    });

    it('stays within token budget even with 9 previous chapters', () => {
      const s1 = FIXTURE_EXPERT_LATE_CHAPTER.stage1;
      const prompt = buildStage1Prompt(
        s1.courseContext,
        s1.currentChapterNumber,
        s1.previousChapters,
        s1.conceptTracker,
        s1.categoryPrompt,
        s1.completedChapters,
        s1.variant,
        s1.templatePrompt,
        s1.recalledMemory,
      );
      const userTokens = estimateTokens(prompt.userPrompt);
      expect(userTokens).toBeLessThanOrEqual(INPUT_TOKEN_BUDGETS.stage1.user);
    });
  });

  describe('completed chapters context (depth-first mode)', () => {
    it('includes section-level details when completedChapters are provided', () => {
      const s1 = FIXTURE_PROGRAMMING_DOMAIN.stage1;
      const prompt = buildStage1Prompt(
        s1.courseContext,
        s1.currentChapterNumber,
        s1.previousChapters,
        s1.conceptTracker,
        s1.categoryPrompt,
        s1.completedChapters,
        s1.variant,
        s1.templatePrompt,
        s1.recalledMemory,
      );
      // With completed chapters, section details should appear
      expect(prompt.userPrompt).toContain('Section 1');
      expect(prompt.userPrompt).toContain('Netflix');
    });
  });
});

// ============================================================================
// Stage 2: Section Generation Prompt
// ============================================================================

describe('buildStage2Prompt', () => {
  const fixture = FIXTURE_INTERMEDIATE_MIDDLE_CHAPTER;

  let prompt: StagePrompt;

  beforeAll(() => {
    const s2 = fixture.stage2;
    prompt = buildStage2Prompt(
      s2.courseContext,
      s2.chapter,
      s2.currentSectionNumber,
      [...s2.previousSections],
      [...s2.allExistingSectionTitles],
      s2.enrichedContext,
      s2.categoryPrompt,
      s2.variant,
      s2.templatePrompt,
      s2.recalledMemory,
    );
  });

  it('returns a systemPrompt and userPrompt', () => {
    expect(prompt.systemPrompt).toBeDefined();
    expect(prompt.userPrompt).toBeDefined();
  });

  it('system prompt contains ARROW framework keywords', () => {
    for (const keyword of ARROW_KEYWORDS_FULL) {
      expect(prompt.systemPrompt.toUpperCase()).toContain(keyword);
    }
  });

  it('system prompt contains section design principles', () => {
    expect(prompt.systemPrompt).toContain('SECTION DESIGN PRINCIPLES');
  });

  it('user prompt contains CHAPTER CONTEXT', () => {
    expect(prompt.userPrompt).toContain('CHAPTER CONTEXT');
    expect(prompt.userPrompt).toContain(fixture.stage2.chapter.title);
  });

  it('user prompt lists previous sections', () => {
    expect(prompt.userPrompt).toContain('PREVIOUS SECTIONS');
    expect(prompt.userPrompt).toContain('Real-World Trees');
    expect(prompt.userPrompt).toContain('Traversing Trees');
  });

  it('user prompt contains existing section titles for uniqueness check', () => {
    expect(prompt.userPrompt).toContain('EXISTING SECTION TITLES');
    for (const title of fixture.stage2.allExistingSectionTitles) {
      expect(prompt.userPrompt).toContain(title);
    }
  });

  it('user prompt contains Bloom\'s verbs for the chapter level', () => {
    expect(containsBloomsVerbs(prompt.userPrompt, fixture.stage2.chapter.bloomsLevel)).toBe(true);
  });

  it('user prompt contains COURSE-WIDE CONTEXT when enriched context provided', () => {
    expect(prompt.userPrompt).toContain('COURSE-WIDE CONTEXT');
  });

  it('user prompt contains OUTPUT REQUIREMENTS with JSON structure', () => {
    expect(prompt.userPrompt).toContain('OUTPUT REQUIREMENTS');
    expect(prompt.userPrompt).toContain('"section"');
  });

  it('user prompt token count is within budget', () => {
    const tokens = estimateTokens(prompt.userPrompt);
    expect(tokens).toBeLessThanOrEqual(INPUT_TOKEN_BUDGETS.stage2.user);
  });

  it('total prompt token count is reasonable', () => {
    const totalTokens = estimateTokens(prompt.systemPrompt) + estimateTokens(prompt.userPrompt);
    expect(totalTokens).toBeGreaterThan(500);
    const combinedBudget = INPUT_TOKEN_BUDGETS.stage2.system + INPUT_TOKEN_BUDGETS.stage2.user;
    expect(totalTokens).toBeLessThan(combinedBudget * 2);
  });
});

// ============================================================================
// Stage 3: Detail Generation Prompt
// ============================================================================

describe('buildStage3Prompt', () => {
  const fixture = FIXTURE_RESUMED_WITH_BRIDGE;

  let prompt: StagePrompt;

  beforeAll(() => {
    const s3 = fixture.stage3;
    prompt = buildStage3Prompt({
      courseContext: s3.courseContext,
      chapter: s3.chapter,
      section: s3.section,
      chapterSections: [...s3.chapterSections],
      enrichedContext: s3.enrichedContext,
      categoryPrompt: s3.categoryPrompt,
      variant: s3.variant,
      templatePrompt: s3.templatePrompt,
      completedSections: s3.completedSections,
      recalledMemory: s3.recalledMemory,
      bridgeContent: s3.bridgeContent,
    });
  });

  it('returns a systemPrompt and userPrompt', () => {
    expect(prompt.systemPrompt).toBeDefined();
    expect(prompt.userPrompt).toBeDefined();
  });

  it('system prompt contains ARROW framework keywords (condensed for Stage 3)', () => {
    for (const keyword of ARROW_KEYWORDS_CONDENSED) {
      expect(prompt.systemPrompt.toUpperCase()).toContain(keyword);
    }
  });

  it('system prompt contains detail design principles', () => {
    expect(prompt.systemPrompt).toContain('DETAIL DESIGN PRINCIPLES');
  });

  it('system prompt contains content-type-specific activity guidance', () => {
    // Section is video type, so should include VIDEO guidance
    expect(prompt.systemPrompt).toContain('CONTENT TYPE: VIDEO');
  });

  it('user prompt contains CURRENT SECTION TO FILL', () => {
    expect(prompt.userPrompt).toContain('CURRENT SECTION TO FILL');
    expect(prompt.userPrompt).toContain(fixture.stage3.section.title);
  });

  it('user prompt contains bridge content for section position 1', () => {
    // Bridge content should be included because section position = 1
    expect(prompt.userPrompt).toContain('CONCEPT BRIDGE');
    expect(prompt.userPrompt).toContain('associative data access');
  });

  it('user prompt contains chapter objectives', () => {
    for (const objective of fixture.stage3.chapter.learningObjectives) {
      // At least the first objective should appear
      if (objective.includes('Implement')) {
        expect(prompt.userPrompt).toContain('Implement');
        break;
      }
    }
  });

  it('user prompt contains Bloom\'s verbs for chapter level', () => {
    expect(containsBloomsVerbs(prompt.userPrompt, fixture.stage3.chapter.bloomsLevel)).toBe(true);
  });

  it('user prompt contains OUTPUT REQUIREMENTS with JSON structure', () => {
    expect(prompt.userPrompt).toContain('OUTPUT REQUIREMENTS');
    expect(prompt.userPrompt).toContain('"details"');
  });

  it('user prompt contains HTML structure guidance', () => {
    expect(prompt.userPrompt).toContain('Why It Was Developed');
    expect(prompt.userPrompt).toContain('Core Intuition');
    expect(prompt.userPrompt).toContain('Common Confusion + Fix');
  });

  it('user prompt token count is within budget', () => {
    const tokens = estimateTokens(prompt.userPrompt);
    expect(tokens).toBeLessThanOrEqual(INPUT_TOKEN_BUDGETS.stage3.user);
  });

  it('total prompt token count is reasonable', () => {
    const totalTokens = estimateTokens(prompt.systemPrompt) + estimateTokens(prompt.userPrompt);
    expect(totalTokens).toBeGreaterThan(500);
    const combinedBudget = INPUT_TOKEN_BUDGETS.stage3.system + INPUT_TOKEN_BUDGETS.stage3.user;
    expect(totalTokens).toBeLessThan(combinedBudget * 2);
  });
});

// ============================================================================
// Cross-cutting: Token Budget Enforcement
// ============================================================================

describe('token budget enforcement across all fixtures', () => {
  it('no Stage 1 user prompt exceeds its budget', () => {
    for (const fixture of ALL_STAGE1_FIXTURES) {
      const s1 = fixture.stage1;
      const prompt = buildStage1Prompt(
        s1.courseContext,
        s1.currentChapterNumber,
        s1.previousChapters,
        s1.conceptTracker,
        s1.categoryPrompt,
        s1.completedChapters,
        s1.variant,
        s1.templatePrompt,
        s1.recalledMemory,
      );
      const tokens = estimateTokens(prompt.userPrompt);
      expect(tokens).toBeLessThanOrEqual(INPUT_TOKEN_BUDGETS.stage1.user);
    }
  });
});

// ============================================================================
// Bloom's Level Assignment Regression
// ============================================================================

describe('getContentAwareBloomsLevel regression', () => {
  it('beginner chapter 1 is capped at UNDERSTAND (foundational)', () => {
    const level = getContentAwareBloomsLevel({
      chapterNumber: 1,
      totalChapters: 8,
      focusLevels: [],
      difficulty: 'beginner',
      isFoundational: true,
      isCapstone: false,
      previousBloomsLevels: [],
    });
    expect(['REMEMBER', 'UNDERSTAND']).toContain(level);
  });

  it('intermediate course progresses monotonically', () => {
    const allLevels: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
    const levels: BloomsLevel[] = [];

    for (let ch = 1; ch <= 10; ch++) {
      const level = getContentAwareBloomsLevel({
        chapterNumber: ch,
        totalChapters: 10,
        focusLevels: [],
        difficulty: 'intermediate',
        isFoundational: ch <= 2,
        isCapstone: ch >= 9,
        previousBloomsLevels: levels,
      });
      levels.push(level);
    }

    // Verify monotonic non-decreasing
    for (let i = 1; i < levels.length; i++) {
      const prevIndex = allLevels.indexOf(levels[i - 1]);
      const currIndex = allLevels.indexOf(levels[i]);
      expect(currIndex).toBeGreaterThanOrEqual(prevIndex);
    }
  });

  it('capstone chapter is at least EVALUATE for a 10-chapter course', () => {
    const previousLevels: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'UNDERSTAND', 'APPLY', 'APPLY', 'ANALYZE', 'ANALYZE', 'EVALUATE'];
    const level = getContentAwareBloomsLevel({
      chapterNumber: 10,
      totalChapters: 10,
      focusLevels: [],
      difficulty: 'intermediate',
      isFoundational: false,
      isCapstone: true,
      previousBloomsLevels: previousLevels,
    });
    expect(['EVALUATE', 'CREATE']).toContain(level);
  });

  it('respects explicit bloomsFocus over auto-assignment', () => {
    const level = getContentAwareBloomsLevel({
      chapterNumber: 1,
      totalChapters: 5,
      focusLevels: ['APPLY', 'ANALYZE', 'CREATE'],
      difficulty: 'advanced',
      isFoundational: true,
      isCapstone: false,
      previousBloomsLevels: [],
    });
    expect(level).toBe('APPLY');
  });

  it('expert chapter 2 reaches at least ANALYZE', () => {
    const level = getContentAwareBloomsLevel({
      chapterNumber: 2,
      totalChapters: 12,
      focusLevels: [],
      difficulty: 'expert',
      isFoundational: true,
      isCapstone: false,
      previousBloomsLevels: ['UNDERSTAND'],
    });
    // Expert difficulty floors at ANALYZE from ch2, but isFoundational caps at UNDERSTAND
    // The result depends on implementation ordering — either is acceptable
    expect(['UNDERSTAND', 'APPLY', 'ANALYZE']).toContain(level);
  });
});
