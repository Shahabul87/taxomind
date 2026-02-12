/**
 * Category Prompt Enhancer Registry
 *
 * Maps course categories to domain-specific prompt enhancers.
 * Uses fuzzy matching (case-insensitive substring) to find the best enhancer.
 * Falls back to the general enhancer when no domain match is found.
 */

import type { CategoryPromptEnhancer, ComposedCategoryPrompt } from './types';
import { programmingEnhancer } from './programming';
import { dataScienceMLEnhancer } from './data-science-ml';
import { dataStructuresAlgorithmsEnhancer } from './data-structures-algorithms';
import { mathematicsEnhancer } from './mathematics';
import { engineeringEnhancer } from './engineering';
import { financeAccountingEnhancer } from './finance-accounting';
import { businessManagementEnhancer } from './business-management';
import { designCreativeEnhancer } from './design-creative';
import { healthScienceEnhancer } from './health-science';
import { languageCommunicationEnhancer } from './language-communication';
import { educationEnhancer } from './education';
import { personalDevelopmentEnhancer } from './personal-development';
import { musicEnhancer } from './music';
import { lifestyleEnhancer } from './lifestyle';
import { artsHumanitiesEnhancer } from './arts-humanities';
import { generalEnhancer } from './general';

// All registered enhancers (order matters — first match wins)
const ENHANCERS: CategoryPromptEnhancer[] = [
  // More specific categories first (DSA before general Programming)
  dataStructuresAlgorithmsEnhancer,
  dataScienceMLEnhancer,
  programmingEnhancer,
  mathematicsEnhancer,
  // ARROW-based domain enhancers (more specific before more general)
  engineeringEnhancer,
  financeAccountingEnhancer,
  businessManagementEnhancer,
  designCreativeEnhancer,
  healthScienceEnhancer,
  languageCommunicationEnhancer,
  educationEnhancer,
  personalDevelopmentEnhancer,
  musicEnhancer,
  lifestyleEnhancer,
  artsHumanitiesEnhancer, // Broadest catch-all last
  // General is never matched by category — only used as explicit fallback
];

/**
 * Normalize a string for matching: lowercase and replace hyphens with spaces.
 * This ensures COURSE_CATEGORIES values like "personal-development" match
 * enhancer entries like "Personal Development".
 */
function normalize(s: string): string {
  return s.toLowerCase().replace(/-/g, ' ');
}

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

  // Try exact match first, then substring match
  for (const enhancer of ENHANCERS) {
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
  return generalEnhancer;
}

/**
 * Compose a CategoryPromptEnhancer into pre-formatted prompt blocks
 * ready for injection into Stage 1/2/3 prompts.
 */
export function composeCategoryPrompt(
  enhancer: CategoryPromptEnhancer
): ComposedCategoryPrompt {
  // Build Bloom's domain guidance string
  const bloomsLines = Object.entries(enhancer.bloomsInDomain)
    .map(([level, guidance]) => {
      if (!guidance) return '';
      return `- **${level}**: ${guidance.means}
  - Example objective: "${guidance.exampleObjectives[0]}"
  - Example activity: "${guidance.exampleActivities[0]}"`;
    })
    .filter(Boolean)
    .join('\n');

  // Build activity examples string
  const activityLines = Object.entries(enhancer.activityExamples)
    .map(([type, example]) => `- **${type}**: ${example}`)
    .join('\n');

  return {
    expertiseBlock: `
## DOMAIN EXPERTISE
${enhancer.domainExpertise}`,

    chapterGuidanceBlock: `
${enhancer.teachingMethodology}

${enhancer.chapterSequencingAdvice}

## BLOOM'S TAXONOMY IN THIS DOMAIN
${bloomsLines}`,

    sectionGuidanceBlock: `
${enhancer.contentTypeGuidance}

## DOMAIN-SPECIFIC ACTIVITY EXAMPLES
${activityLines}`,

    detailGuidanceBlock: `
${enhancer.qualityCriteria}

## BLOOM'S TAXONOMY IN THIS DOMAIN
${bloomsLines}

## DOMAIN-SPECIFIC ACTIVITY EXAMPLES
${activityLines}`,
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
  return [...ENHANCERS, generalEnhancer].map(e => ({
    categoryId: e.categoryId,
    displayName: e.displayName,
    matchesCategories: e.matchesCategories,
  }));
}
