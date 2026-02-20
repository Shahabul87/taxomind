/**
 * Category Prompt Enhancer Tests
 *
 * Verifies that all 15 frontend categories (from COURSE_CATEGORIES)
 * resolve to a domain-specific enhancer instead of the general fallback.
 */

import {
  getCategoryEnhancer,
  getCategoryEnhancers,
  blendEnhancers,
  composeCategoryPrompt,
} from '@/lib/sam/course-creation/category-prompts';

describe('Category Prompt Enhancers', () => {
  // ========================================================================
  // Phase 1: New enhancers — Education, Personal Development, Music, Lifestyle
  // ========================================================================

  describe('Education enhancer', () => {
    it('matches "education" category value', () => {
      const enhancer = getCategoryEnhancer('education');
      expect(enhancer.categoryId).toBe('education');
    });

    it('matches "Education" category label', () => {
      const enhancer = getCategoryEnhancer('Education');
      expect(enhancer.categoryId).toBe('education');
    });

    it('matches education subcategories', () => {
      expect(getCategoryEnhancer('Teaching Methods').categoryId).toBe('education');
      expect(getCategoryEnhancer('Pedagogy').categoryId).toBe('education');
      expect(getCategoryEnhancer('Assessment').categoryId).toBe('education');
    });

    it('does NOT fall back to artsHumanities or general', () => {
      const enhancer = getCategoryEnhancer('education');
      expect(enhancer.categoryId).not.toBe('arts-humanities');
      expect(enhancer.categoryId).not.toBe('general');
    });
  });

  describe('Personal Development enhancer', () => {
    it('matches "personal-development" category value', () => {
      const enhancer = getCategoryEnhancer('personal-development');
      expect(enhancer.categoryId).toBe('personal-development');
    });

    it('matches "Personal Development" category label', () => {
      const enhancer = getCategoryEnhancer('Personal Development');
      expect(enhancer.categoryId).toBe('personal-development');
    });

    it('matches personal development subcategories', () => {
      expect(getCategoryEnhancer('Goal Setting').categoryId).toBe('personal-development');
      expect(getCategoryEnhancer('Self-Improvement').categoryId).toBe('personal-development');
      expect(getCategoryEnhancer('Habits').categoryId).toBe('personal-development');
    });

    it('does NOT fall back to general', () => {
      const enhancer = getCategoryEnhancer('personal-development');
      expect(enhancer.categoryId).not.toBe('general');
    });
  });

  describe('Music enhancer', () => {
    it('matches "music" category value', () => {
      const enhancer = getCategoryEnhancer('music');
      expect(enhancer.categoryId).toBe('music');
    });

    it('matches "Music" category label', () => {
      const enhancer = getCategoryEnhancer('Music');
      expect(enhancer.categoryId).toBe('music');
    });

    it('matches music subcategories', () => {
      expect(getCategoryEnhancer('Music Production').categoryId).toBe('music');
      expect(getCategoryEnhancer('Guitar').categoryId).toBe('music');
      expect(getCategoryEnhancer('Songwriting').categoryId).toBe('music');
    });

    it('does NOT fall back to artsHumanities or general', () => {
      const enhancer = getCategoryEnhancer('music');
      expect(enhancer.categoryId).not.toBe('arts-humanities');
      expect(enhancer.categoryId).not.toBe('general');
    });
  });

  describe('Lifestyle enhancer', () => {
    it('matches "lifestyle" category value', () => {
      const enhancer = getCategoryEnhancer('lifestyle');
      expect(enhancer.categoryId).toBe('lifestyle');
    });

    it('matches "Lifestyle" category label', () => {
      const enhancer = getCategoryEnhancer('Lifestyle');
      expect(enhancer.categoryId).toBe('lifestyle');
    });

    it('matches lifestyle subcategories', () => {
      expect(getCategoryEnhancer('Cooking').categoryId).toBe('lifestyle');
      expect(getCategoryEnhancer('Gardening').categoryId).toBe('lifestyle');
      expect(getCategoryEnhancer('Home Improvement').categoryId).toBe('lifestyle');
    });

    it('does NOT fall back to general', () => {
      const enhancer = getCategoryEnhancer('lifestyle');
      expect(enhancer.categoryId).not.toBe('general');
    });
  });

  // ========================================================================
  // Compose tests — ensure all new enhancers produce non-empty prompt blocks
  // ========================================================================

  describe('composeCategoryPrompt', () => {
    const newCategories = ['education', 'personal-development', 'music', 'lifestyle'] as const;

    for (const category of newCategories) {
      it(`produces non-empty blocks for "${category}"`, () => {
        const enhancer = getCategoryEnhancer(category);
        const composed = composeCategoryPrompt(enhancer);

        expect(composed.expertiseBlock.trim().length).toBeGreaterThan(0);
        expect(composed.chapterGuidanceBlock.trim().length).toBeGreaterThan(0);
        expect(composed.sectionGuidanceBlock.trim().length).toBeGreaterThan(0);
        expect(composed.detailGuidanceBlock.trim().length).toBeGreaterThan(0);
      });
    }
  });

  // ========================================================================
  // Regression: existing enhancers still work
  // ========================================================================

  describe('existing enhancers still match correctly', () => {
    it('programming matches Computer Science', () => {
      const enhancer = getCategoryEnhancer('Computer Science');
      expect(enhancer.categoryId).toBe('programming');
    });

    it('health-science matches health', () => {
      const enhancer = getCategoryEnhancer('health');
      expect(enhancer.categoryId).toBe('health-science');
    });

    it('arts-humanities matches arts', () => {
      const enhancer = getCategoryEnhancer('arts');
      expect(enhancer.categoryId).toBe('arts-humanities');
    });

    it('finance-accounting matches finance', () => {
      const enhancer = getCategoryEnhancer('finance');
      expect(enhancer.categoryId).toBe('finance-accounting');
    });

    it('business-management matches business', () => {
      const enhancer = getCategoryEnhancer('business');
      expect(enhancer.categoryId).toBe('business-management');
    });

    it('unknown category falls back to general', () => {
      const enhancer = getCategoryEnhancer('completely-unknown-xyz');
      expect(enhancer.categoryId).toBe('general');
    });
  });

  // ========================================================================
  // Priority: Music should match before artsHumanities (Music Theory overlap)
  // ========================================================================

  describe('priority ordering', () => {
    it('Music Theory matches music enhancer, not arts-humanities', () => {
      const enhancer = getCategoryEnhancer('Music Theory');
      // Music enhancer lists 'Music Theory' in matchesCategories
      expect(enhancer.categoryId).toBe('music');
    });

    it('Music subcategory from COURSE_CATEGORIES matches music', () => {
      // From COURSE_CATEGORIES: arts > subcategories includes "Music Theory"
      // But the music enhancer is registered BEFORE artsHumanities
      const enhancer = getCategoryEnhancer('Music', 'Music Theory');
      expect(enhancer.categoryId).toBe('music');
    });
  });

  // ========================================================================
  // Bloom's Level Filtering (Issue 2)
  // ========================================================================

  describe('Bloom\u2019s level filtering', () => {
    it('composeCategoryPrompt(enhancer, APPLY) contains only UNDERSTAND + APPLY Bloom\u2019s lines', () => {
      const enhancer = getCategoryEnhancer('programming');
      const composed = composeCategoryPrompt(enhancer, 'APPLY');

      // Should contain APPLY and UNDERSTAND (scaffolding level)
      expect(composed.chapterGuidanceBlock).toContain('**APPLY**');
      expect(composed.chapterGuidanceBlock).toContain('**UNDERSTAND**');
      // Should NOT contain other levels
      expect(composed.chapterGuidanceBlock).not.toContain('**REMEMBER**');
      expect(composed.chapterGuidanceBlock).not.toContain('**ANALYZE**');
      expect(composed.chapterGuidanceBlock).not.toContain('**EVALUATE**');
      expect(composed.chapterGuidanceBlock).not.toContain('**CREATE**');
    });

    it('composeCategoryPrompt(enhancer, REMEMBER) contains only REMEMBER', () => {
      const enhancer = getCategoryEnhancer('programming');
      const composed = composeCategoryPrompt(enhancer, 'REMEMBER');

      // REMEMBER is the lowest level — no scaffolding level below it
      expect(composed.chapterGuidanceBlock).toContain('**REMEMBER**');
      expect(composed.chapterGuidanceBlock).not.toContain('**UNDERSTAND**');
      expect(composed.chapterGuidanceBlock).not.toContain('**APPLY**');
    });

    it('composeCategoryPrompt(enhancer) (no filter) contains all 6 levels (backward compat)', () => {
      const enhancer = getCategoryEnhancer('programming');
      const composed = composeCategoryPrompt(enhancer);

      // All levels present when no filter is applied
      const levels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
      for (const level of levels) {
        // Only check levels that exist in the enhancer's bloomsInDomain
        if (enhancer.bloomsInDomain[level as keyof typeof enhancer.bloomsInDomain]) {
          expect(composed.chapterGuidanceBlock).toContain(`**${level}**`);
        }
      }
    });

    it('filtered prompt has fewer tokens than unfiltered', () => {
      const enhancer = getCategoryEnhancer('programming');
      const unfilteredComposed = composeCategoryPrompt(enhancer);
      const filteredComposed = composeCategoryPrompt(enhancer, 'APPLY');

      expect(filteredComposed.tokenEstimate.total).toBeLessThan(unfilteredComposed.tokenEstimate.total);
    });
  });

  // ========================================================================
  // Token Budget Tracking (Issue 4)
  // ========================================================================

  describe('token budget tracking', () => {
    it('tokenEstimate.total > 0 for a non-general enhancer', () => {
      const enhancer = getCategoryEnhancer('programming');
      const composed = composeCategoryPrompt(enhancer);

      expect(composed.tokenEstimate.total).toBeGreaterThan(0);
    });

    it('tokenEstimate.total equals sum of individual block estimates', () => {
      const enhancer = getCategoryEnhancer('mathematics');
      const composed = composeCategoryPrompt(enhancer);

      const expectedTotal =
        composed.tokenEstimate.expertiseBlock +
        composed.tokenEstimate.chapterGuidanceBlock +
        composed.tokenEstimate.sectionGuidanceBlock +
        composed.tokenEstimate.detailGuidanceBlock;

      expect(composed.tokenEstimate.total).toBe(expectedTotal);
    });

    it('all individual block estimates are positive', () => {
      const enhancer = getCategoryEnhancer('finance');
      const composed = composeCategoryPrompt(enhancer);

      expect(composed.tokenEstimate.expertiseBlock).toBeGreaterThan(0);
      expect(composed.tokenEstimate.chapterGuidanceBlock).toBeGreaterThan(0);
      expect(composed.tokenEstimate.sectionGuidanceBlock).toBeGreaterThan(0);
      expect(composed.tokenEstimate.detailGuidanceBlock).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // Multi-domain Blending (Issue 3)
  // ========================================================================

  describe('multi-domain blending', () => {
    it('getCategoryEnhancers with category + different subcategory returns 2 enhancers', () => {
      // "Machine Learning" should match data-science-ml, "Finance" should match finance-accounting
      const enhancers = getCategoryEnhancers('Machine Learning', 'Finance');
      expect(enhancers.length).toBe(2);
      expect(enhancers[0].categoryId).not.toBe(enhancers[1].categoryId);
    });

    it('getCategoryEnhancers with maxResults=1 returns exactly 1 enhancer', () => {
      const enhancers = getCategoryEnhancers('programming', undefined, 1);
      expect(enhancers.length).toBe(1);
    });

    it('getCategoryEnhancers primary result matches getCategoryEnhancer', () => {
      const single = getCategoryEnhancer('music');
      const multi = getCategoryEnhancers('music');
      expect(multi[0].categoryId).toBe(single.categoryId);
    });

    it('getCategoryEnhancers with unknown category returns [general]', () => {
      const enhancers = getCategoryEnhancers('completely-unknown-xyz');
      expect(enhancers.length).toBe(1);
      expect(enhancers[0].categoryId).toBe('general');
    });

    it('blendEnhancers produces valid enhancer with combined expertise', () => {
      const primary = getCategoryEnhancer('music');
      const secondary = getCategoryEnhancer('finance');
      const blended = blendEnhancers(primary, secondary);

      // Combined categoryId
      expect(blended.categoryId).toBe('music+finance-accounting');
      // Combined display name
      expect(blended.displayName).toContain(' x ');
      // Primary expertise preserved (starts with primary's content)
      expect(blended.domainExpertise).toContain(primary.domainExpertise);
      // Cross-domain section present
      expect(blended.domainExpertise).toContain('### Cross-Domain Context');
      // Primary Bloom's preserved (same reference)
      expect(blended.bloomsInDomain).toBe(primary.bloomsInDomain);
      // Activity examples merged — at least as many keys as primary
      expect(Object.keys(blended.activityExamples).length).toBeGreaterThanOrEqual(
        Object.keys(primary.activityExamples).length,
      );
    });

    it('blended enhancer composes into valid prompt blocks', () => {
      const primary = getCategoryEnhancer('education');
      const secondary = getCategoryEnhancer('business');
      const blended = blendEnhancers(primary, secondary);
      const composed = composeCategoryPrompt(blended);

      expect(composed.expertiseBlock).toContain('Cross-Domain Context');
      expect(composed.tokenEstimate.total).toBeGreaterThan(0);
    });
  });
});
