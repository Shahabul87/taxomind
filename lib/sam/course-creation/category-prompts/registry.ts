/**
 * Category Prompt Enhancer Registry
 *
 * Maps course categories to domain-specific prompt enhancers.
 * Uses fuzzy matching (case-insensitive substring) to find the best enhancer.
 * Falls back to the general enhancer when no domain match is found.
 *
 * Enhancers are loaded from .skill.md files at runtime via skill-loader.
 */

import type { BloomsLevel } from '../types';
import type { CategoryPromptEnhancer, ComposedCategoryPrompt, DomainBloomsGuidance } from './types';
import { getOrderedEnhancers, getGeneralEnhancer } from './skill-loader';

// =============================================================================
// Bloom's Level Constants
// =============================================================================

const ALL_BLOOMS_LEVELS: BloomsLevel[] = [
  'REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE',
];

// =============================================================================
// Internal helpers
// =============================================================================

/**
 * Normalize a string for matching: lowercase and replace hyphens with spaces.
 * This ensures COURSE_CATEGORIES values like "personal-development" match
 * enhancer entries like "Personal Development".
 */
function normalize(s: string): string {
  return s.toLowerCase().replace(/-/g, ' ');
}

/**
 * Estimate token count from text length (4 chars ~ 1 token).
 * Same formula as lib/sam/depth-analysis-v2/token-estimator.ts.
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Get the relevant Bloom's levels for filtering: target level + one below for scaffolding.
 */
function getRelevantLevels(target: BloomsLevel): BloomsLevel[] {
  const idx = ALL_BLOOMS_LEVELS.indexOf(target);
  if (idx <= 0) return [target];
  return [ALL_BLOOMS_LEVELS[idx - 1], target];
}

/**
 * Build Bloom's guidance text from domain-specific entries.
 * Optionally filters to only the specified levels.
 */
function buildBloomsLines(
  bloomsInDomain: Partial<Record<BloomsLevel, DomainBloomsGuidance>>,
  filterLevels?: BloomsLevel[],
): string {
  const entries = filterLevels
    ? Object.entries(bloomsInDomain).filter(([level]) =>
        filterLevels.includes(level as BloomsLevel))
    : Object.entries(bloomsInDomain);

  return entries
    .map(([level, guidance]) => {
      if (!guidance) return '';
      return `- **${level}**: ${guidance.means}
  - Example objective: "${guidance.exampleObjectives[0]}"
  - Example activity: "${guidance.exampleActivities[0]}"`;
    })
    .filter(Boolean)
    .join('\n');
}

/**
 * Build activity examples text from a record of type → example.
 */
function buildActivityLines(activityExamples: Record<string, string>): string {
  return Object.entries(activityExamples)
    .map(([type, example]) => `- **${type}**: ${example}`)
    .join('\n');
}

/**
 * Extract the first paragraph (up to double newline or end of text) from a string.
 * Used for condensing secondary domain expertise in blended enhancers.
 */
function extractFirstParagraph(text: string): string {
  const idx = text.indexOf('\n\n');
  return idx > 0 ? text.slice(0, idx) : text;
}

// =============================================================================
// Public API — Single enhancer lookup (original)
// =============================================================================

/**
 * Find the best category enhancer for a given course category and subcategory.
 * Uses case-insensitive substring matching with hyphen normalization.
 *
 * @param category - The course category name (e.g., "Computer Science")
 * @param subcategory - Optional subcategory for more specific matching
 * @returns The matched enhancer, or the general fallback
 */
export function getCategoryEnhancer(
  category: string,
  subcategory?: string
): CategoryPromptEnhancer {
  const searchTerms = [
    normalize(category),
    subcategory ? normalize(subcategory) : undefined,
  ].filter((t): t is string => Boolean(t));

  const enhancers = getOrderedEnhancers();

  // Try exact match first, then substring match
  for (const enhancer of enhancers) {
    for (const matchCategory of enhancer.matchesCategories) {
      const matchNorm = normalize(matchCategory);
      for (const term of searchTerms) {
        // Exact match
        if (term === matchNorm) return enhancer;
        // Substring match (category contains the match term or vice versa)
        if (term.includes(matchNorm) || matchNorm.includes(term)) return enhancer;
      }
    }
  }

  // Fallback to general
  return getGeneralEnhancer();
}

// =============================================================================
// Public API — Multi-domain lookup + blending (Issue 3)
// =============================================================================

/**
 * Find up to `maxResults` matching enhancers for cross-domain blending.
 * Searches category and subcategory independently to find distinct matches.
 *
 * @param category - Primary course category (e.g., "Machine Learning")
 * @param subcategory - Secondary category (e.g., "Finance")
 * @param maxResults - Maximum enhancers to return (default 2)
 * @returns Array of matched enhancers (1-2), or [general fallback] if none match
 */
export function getCategoryEnhancers(
  category: string,
  subcategory?: string,
  maxResults = 2,
): CategoryPromptEnhancer[] {
  const enhancers = getOrderedEnhancers();
  const results: CategoryPromptEnhancer[] = [];
  const seenIds = new Set<string>();

  // Search with category term first
  const categoryNorm = normalize(category);
  for (const enhancer of enhancers) {
    if (seenIds.has(enhancer.categoryId)) continue;
    for (const matchCategory of enhancer.matchesCategories) {
      const matchNorm = normalize(matchCategory);
      if (categoryNorm === matchNorm || categoryNorm.includes(matchNorm) || matchNorm.includes(categoryNorm)) {
        results.push(enhancer);
        seenIds.add(enhancer.categoryId);
        break;
      }
    }
    if (results.length >= maxResults) break;
  }

  // Search with subcategory term if provided and we have room
  if (subcategory && results.length < maxResults) {
    const subNorm = normalize(subcategory);
    for (const enhancer of enhancers) {
      if (seenIds.has(enhancer.categoryId)) continue;
      for (const matchCategory of enhancer.matchesCategories) {
        const matchNorm = normalize(matchCategory);
        if (subNorm === matchNorm || subNorm.includes(matchNorm) || matchNorm.includes(subNorm)) {
          results.push(enhancer);
          seenIds.add(enhancer.categoryId);
          break;
        }
      }
      if (results.length >= maxResults) break;
    }
  }

  if (results.length === 0) {
    return [getGeneralEnhancer()];
  }

  return results;
}

/**
 * Blend two enhancers into a single composite enhancer for cross-domain courses.
 * Primary enhancer dominates; secondary contributes condensed expertise and activity examples.
 *
 * @param primary - Dominant domain enhancer
 * @param secondary - Supporting domain enhancer (condensed)
 * @returns Blended enhancer with combined expertise
 */
export function blendEnhancers(
  primary: CategoryPromptEnhancer,
  secondary: CategoryPromptEnhancer,
): CategoryPromptEnhancer {
  // Merge activity examples with prefixed keys for secondary
  const mergedActivities: Record<string, string> = { ...primary.activityExamples };
  for (const [type, example] of Object.entries(secondary.activityExamples)) {
    const key = `${type} (${secondary.displayName})`;
    if (!(key in mergedActivities)) {
      mergedActivities[key] = example;
    }
  }

  return {
    categoryId: `${primary.categoryId}+${secondary.categoryId}`,
    displayName: `${primary.displayName} \u00d7 ${secondary.displayName}`,
    matchesCategories: [...primary.matchesCategories, ...secondary.matchesCategories],
    domainExpertise: `${primary.domainExpertise}\n\n### Cross-Domain Context\n${extractFirstParagraph(secondary.domainExpertise)}`,
    teachingMethodology: primary.teachingMethodology,
    bloomsInDomain: primary.bloomsInDomain,
    contentTypeGuidance: primary.contentTypeGuidance,
    qualityCriteria: primary.qualityCriteria,
    chapterSequencingAdvice: primary.chapterSequencingAdvice,
    activityExamples: mergedActivities,
  };
}

// =============================================================================
// Public API — Composition (Steps 1-3)
// =============================================================================

/**
 * Compose a CategoryPromptEnhancer into pre-formatted prompt blocks
 * ready for injection into Stage 1/2/3 prompts.
 *
 * @param enhancer - The domain-specific enhancer
 * @param bloomsLevel - Optional: filter Bloom's guidance to target + adjacent level
 */
export function composeCategoryPrompt(
  enhancer: CategoryPromptEnhancer,
  bloomsLevel?: BloomsLevel,
): ComposedCategoryPrompt {
  const filterLevels = bloomsLevel ? getRelevantLevels(bloomsLevel) : undefined;
  const bloomsLines = buildBloomsLines(enhancer.bloomsInDomain, filterLevels);
  const activityLines = buildActivityLines(enhancer.activityExamples);

  const expertiseBlock = `
## DOMAIN EXPERTISE
${enhancer.domainExpertise}`;

  const chapterGuidanceBlock = `
${enhancer.teachingMethodology}

${enhancer.chapterSequencingAdvice}

## BLOOM'S TAXONOMY IN THIS DOMAIN
${bloomsLines}`;

  const sectionGuidanceBlock = `
${enhancer.contentTypeGuidance}

## DOMAIN-SPECIFIC ACTIVITY EXAMPLES
${activityLines}`;

  const detailGuidanceBlock = `
${enhancer.qualityCriteria}

## BLOOM'S TAXONOMY IN THIS DOMAIN
${bloomsLines}

## DOMAIN-SPECIFIC ACTIVITY EXAMPLES
${activityLines}`;

  return {
    expertiseBlock,
    chapterGuidanceBlock,
    sectionGuidanceBlock,
    detailGuidanceBlock,
    tokenEstimate: {
      expertiseBlock: estimateTokens(expertiseBlock),
      chapterGuidanceBlock: estimateTokens(chapterGuidanceBlock),
      sectionGuidanceBlock: estimateTokens(sectionGuidanceBlock),
      detailGuidanceBlock: estimateTokens(detailGuidanceBlock),
      total: estimateTokens(expertiseBlock)
        + estimateTokens(chapterGuidanceBlock)
        + estimateTokens(sectionGuidanceBlock)
        + estimateTokens(detailGuidanceBlock),
    },
  };
}

/**
 * List all available category enhancers (for debugging/admin).
 */
export function listCategoryEnhancers(): Array<{
  categoryId: string;
  displayName: string;
  matchesCategories: string[];
}> {
  return [...getOrderedEnhancers(), getGeneralEnhancer()].map(e => ({
    categoryId: e.categoryId,
    displayName: e.displayName,
    matchesCategories: e.matchesCategories,
  }));
}
