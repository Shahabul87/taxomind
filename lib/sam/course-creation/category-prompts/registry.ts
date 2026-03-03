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
import { logger } from '@/lib/logger';

// =============================================================================
// Bloom's Level Constants
// =============================================================================

const ALL_BLOOMS_LEVELS: BloomsLevel[] = [
  'REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE',
];

const conflictWarningKeys = new Set<string>();
const truncationWarningKeys = new Set<string>();

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
  const matchedEnhancers = enhancers.filter((enhancer) =>
    enhancer.matchesCategories.some((matchCategory) => {
      const matchNorm = normalize(matchCategory);
      return searchTerms.some((term) =>
        term === matchNorm || term.includes(matchNorm) || matchNorm.includes(term)
      );
    })
  );

  if (matchedEnhancers.length > 1) {
    const warningKey = `${category}::${subcategory ?? ''}`;
    if (!conflictWarningKeys.has(warningKey)) {
      conflictWarningKeys.add(warningKey);
      logger.warn('[category-registry] Multiple enhancers matched category input; using first by priority order', {
        category,
        subcategory,
        selected: matchedEnhancers[0].categoryId,
        candidates: matchedEnhancers.map((e) => e.categoryId),
      });
    }
  }

  if (matchedEnhancers.length > 0) {
    return matchedEnhancers[0];
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

  if (results.length === maxResults) {
    const remainingMatches = enhancers.filter((enhancer) => {
      if (seenIds.has(enhancer.categoryId)) return false;
      return enhancer.matchesCategories.some((matchCategory) => {
        const matchNorm = normalize(matchCategory);
        const categoryMatch = categoryNorm === matchNorm || categoryNorm.includes(matchNorm) || matchNorm.includes(categoryNorm);
        const subcategoryMatch = subcategory
          ? (() => {
              const subNorm = normalize(subcategory);
              return subNorm === matchNorm || subNorm.includes(matchNorm) || matchNorm.includes(subNorm);
            })()
          : false;
        return categoryMatch || subcategoryMatch;
      });
    });

    if (remainingMatches.length > 0) {
      const warningKey = `${category}::${subcategory ?? ''}::${maxResults}`;
      if (!truncationWarningKeys.has(warningKey)) {
        truncationWarningKeys.add(warningKey);
        logger.warn('[category-registry] Additional enhancer matches were truncated by maxResults', {
          category,
          subcategory,
          selected: results.map((r) => r.categoryId),
          truncated: remainingMatches.map((r) => r.categoryId),
        });
      }
    }
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
    displayName: `${primary.displayName} x ${secondary.displayName}`,
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
 * Build subcategory-specific context when the subcategory is not already
 * covered by the base enhancer's domain expertise and teaching methodology.
 */
function buildSubcategoryContext(
  enhancer: CategoryPromptEnhancer,
  subcategory: string | undefined,
): string {
  if (!subcategory) return '';
  const enhancerText = `${enhancer.domainExpertise} ${enhancer.teachingMethodology}`.toLowerCase();
  if (enhancerText.includes(normalize(subcategory))) return ''; // Already covered
  return `\n### Subcategory Focus: ${subcategory}\nThis course focuses on ${subcategory} within ${enhancer.displayName}. Tailor examples, terminology, and applications to this subdomain specifically.`;
}

/**
 * Compose a CategoryPromptEnhancer into pre-formatted prompt blocks
 * ready for injection into Stage 1/2/3 prompts.
 *
 * @param enhancer - The domain-specific enhancer
 * @param bloomsLevel - Optional: filter Bloom's guidance to target + adjacent level
 * @param subcategory - Optional: adds subcategory-specific context when not already covered
 */
export function composeCategoryPrompt(
  enhancer: CategoryPromptEnhancer,
  bloomsLevel?: BloomsLevel,
  subcategory?: string,
): ComposedCategoryPrompt {
  const filterLevels = bloomsLevel ? getRelevantLevels(bloomsLevel) : undefined;
  const bloomsLines = buildBloomsLines(enhancer.bloomsInDomain, filterLevels);
  const activityLines = buildActivityLines(enhancer.activityExamples);

  const subcategoryBlock = buildSubcategoryContext(enhancer, subcategory);
  const expertiseBlock = `
## DOMAIN EXPERTISE
${enhancer.domainExpertise}${subcategoryBlock}`;

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

// =============================================================================
// AI-Generated Domain Context Fallback
// =============================================================================

const AI_DOMAIN_CONTEXT_ENABLED = process.env.ENABLE_AI_DOMAIN_CONTEXT_FALLBACK === 'true';

/** Module-level cache for AI-generated domain contexts (survives across calls within a process) */
const aiDomainContextCache = new Map<string, CategoryPromptEnhancer>();

/**
 * Generate domain context via AI for categories without a static enhancer.
 * Returns a lightweight CategoryPromptEnhancer with AI-generated expertise.
 */
async function generateDomainContext(
  category: string,
  subcategory: string | undefined,
  userId: string,
): Promise<CategoryPromptEnhancer> {
  const cacheKey = `${category}::${subcategory ?? ''}`;
  const cached = aiDomainContextCache.get(cacheKey);
  if (cached) return cached;

  try {
    const { runSAMChatWithPreference } = await import('@/lib/sam/ai-provider');
    const domainLabel = subcategory ? `${category} > ${subcategory}` : category;

    const prompt = `You are helping build an educational course in the domain: "${domainLabel}".
Provide a concise JSON object with these fields:
- "domainExpertise": A 2-3 sentence description of the expertise needed to teach this domain effectively.
- "teachingMethodology": A 2-3 sentence description of best teaching practices for this domain.
- "contentTypeGuidance": A 1-2 sentence note on ideal content types (video, reading, assignment, project, etc.) for this domain.
- "qualityCriteria": A 1-2 sentence note on what makes high-quality content in this domain.
- "chapterSequencingAdvice": A 1-2 sentence suggestion for ordering topics in this domain.
Respond with ONLY the JSON object, no extra text.`;

    const response = await runSAMChatWithPreference({
      userId,
      capability: 'course',
      messages: [{ role: 'user', content: prompt }],
      systemPrompt: 'You are a curriculum design expert. Respond with valid JSON only.',
      maxTokens: 500,
      temperature: 0.3,
    });

    const parsed = JSON.parse(response);
    const enhancer: CategoryPromptEnhancer = {
      categoryId: `ai-generated-${normalize(category).replace(/\s+/g, '-')}`,
      displayName: domainLabel,
      matchesCategories: [category, ...(subcategory ? [subcategory] : [])],
      domainExpertise: String(parsed.domainExpertise ?? ''),
      teachingMethodology: String(parsed.teachingMethodology ?? ''),
      bloomsInDomain: {},
      contentTypeGuidance: String(parsed.contentTypeGuidance ?? ''),
      qualityCriteria: String(parsed.qualityCriteria ?? ''),
      chapterSequencingAdvice: String(parsed.chapterSequencingAdvice ?? ''),
      activityExamples: {},
    };

    aiDomainContextCache.set(cacheKey, enhancer);
    logger.info('[category-registry] AI-generated domain context', { category, subcategory });
    return enhancer;
  } catch (error) {
    logger.warn('[category-registry] AI domain context generation failed, using general fallback', {
      category,
      error: error instanceof Error ? error.message : String(error),
    });
    return getGeneralEnhancer();
  }
}

/**
 * Get category enhancers with AI fallback for unmatched categories.
 * Tries static enhancers first. If only the general fallback would be returned
 * and AI fallback is enabled, generates domain context via AI.
 *
 * @param category - Course category
 * @param subcategory - Optional subcategory
 * @param userId - User ID for AI provider calls
 * @returns Array of matched enhancers (static or AI-generated)
 */
export async function getCategoryEnhancersWithAIFallback(
  category: string,
  subcategory: string | undefined,
  userId: string,
): Promise<CategoryPromptEnhancer[]> {
  const staticResult = getCategoryEnhancers(category, subcategory);

  // If we got a real match (not just the general fallback), use it
  const isOnlyGeneral = staticResult.length === 1 && staticResult[0].categoryId === 'general';
  if (!isOnlyGeneral) return staticResult;

  // If AI fallback is disabled, return the general fallback
  if (!AI_DOMAIN_CONTEXT_ENABLED) return staticResult;

  const aiEnhancer = await generateDomainContext(category, subcategory, userId);
  return [aiEnhancer];
}
