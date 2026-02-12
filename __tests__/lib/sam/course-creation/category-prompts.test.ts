/**
 * Category Prompt Enhancer Tests
 *
 * Verifies that all 15 frontend categories (from COURSE_CATEGORIES)
 * resolve to a domain-specific enhancer instead of the general fallback.
 */

import { getCategoryEnhancer, composeCategoryPrompt } from '@/lib/sam/course-creation/category-prompts';

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
});
