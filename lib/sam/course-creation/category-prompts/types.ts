/**
 * Category Prompt Enhancer Types
 *
 * Each enhancer provides domain-specific pedagogical knowledge
 * that layers on top of the general course design framework.
 */

import type { BloomsLevel } from '../types';

/**
 * Domain-specific Bloom's guidance — how each cognitive level
 * translates into concrete activities within this domain.
 */
export interface DomainBloomsGuidance {
  means: string;
  exampleObjectives: string[];
  exampleActivities: string[];
}

/**
 * A CategoryPromptEnhancer provides domain-specific knowledge
 * that gets injected into the Stage 1/2/3 prompts alongside
 * the general pedagogical framework.
 *
 * If no category matches, the `general` enhancer is used (minimal additions).
 */
export interface CategoryPromptEnhancer {
  /** Unique identifier for this enhancer */
  categoryId: string;

  /** Display name for logging */
  displayName: string;

  /** Category names this enhancer matches (case-insensitive fuzzy match) */
  matchesCategories: string[];

  /**
   * Domain expert identity — appended to the system prompt.
   * Example: "You are also an expert software engineer with 15 years of industry experience..."
   */
  domainExpertise: string;

  /**
   * Domain-specific teaching methodology.
   * Example: "Use worked examples, live coding demonstrations, code reviews..."
   */
  teachingMethodology: string;

  /**
   * How Bloom's taxonomy levels translate in this domain.
   * Provides concrete examples of what each level MEANS in practice.
   */
  bloomsInDomain: Partial<Record<BloomsLevel, DomainBloomsGuidance>>;

  /**
   * Domain-specific content type preferences and guidance.
   * Example: "Programming courses should be assignment-heavy (60%+)..."
   */
  contentTypeGuidance: string;

  /**
   * Domain-specific quality criteria for chapters and sections.
   * Example: "Every programming chapter must include runnable code examples..."
   */
  qualityCriteria: string;

  /**
   * Domain-specific chapter sequencing advice.
   * Example: "Data structures courses follow: linear → trees → graphs → advanced..."
   */
  chapterSequencingAdvice: string;

  /**
   * Domain-specific project/activity ideas by content type.
   */
  activityExamples: Record<string, string>;
}

/**
 * Composed prompt text ready for injection into stage prompts.
 * Pre-formatted from a CategoryPromptEnhancer.
 */
export interface ComposedCategoryPrompt {
  /** Domain expertise block for system prompt */
  expertiseBlock: string;
  /** Methodology + content guidance for chapter prompts */
  chapterGuidanceBlock: string;
  /** Content type + activity guidance for section prompts */
  sectionGuidanceBlock: string;
  /** Quality criteria + activity examples for detail prompts */
  detailGuidanceBlock: string;
  /** Approximate token counts for budget awareness (4 chars ~ 1 token) */
  tokenEstimate: {
    expertiseBlock: number;
    chapterGuidanceBlock: number;
    sectionGuidanceBlock: number;
    detailGuidanceBlock: number;
    total: number;
  };
}
