/**
 * Skill File Loader for Category Prompt Enhancers
 *
 * Reads `.skill.md` files from `lib/sam/skills/course-domains/`,
 * parses YAML frontmatter + markdown body, validates with Zod,
 * and converts to CategoryPromptEnhancer objects.
 *
 * Cached in a module-level Map after first load (~5ms cold start for 16 files).
 * Invalid files are logged and skipped (graceful degradation).
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { CategoryPromptEnhancer, DomainBloomsGuidance } from './types';
import type { BloomsLevel } from '../types';
import { CategorySkillFrontmatterSchema, type ParsedCategorySkill } from './skill-schema';

// ---------------------------------------------------------------------------
// Directory where .skill.md files live
// ---------------------------------------------------------------------------
const SKILLS_DIR = path.join(process.cwd(), 'lib', 'sam', 'skills', 'course-domains');

// ---------------------------------------------------------------------------
// Priority order — first match wins, so more specific enhancers come first.
// This array defines the order enhancers are checked during fuzzy matching.
// The "general" enhancer is never in this list (used as explicit fallback).
// ---------------------------------------------------------------------------
const PRIORITY_ORDER: string[] = [
  'data-structures-algorithms',
  'data-science-ml',
  'programming',
  'mathematics',
  'engineering',
  'finance-accounting',
  'business-management',
  'design-creative',
  'health-science',
  'language-communication',
  'education',
  'personal-development',
  'music',
  'lifestyle',
  'arts-humanities',
];

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------
let orderedCache: CategoryPromptEnhancer[] | null = null;
let generalCache: CategoryPromptEnhancer | null = null;

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

/**
 * Parse H2-delimited sections from a markdown body.
 * Returns a record where keys are the H2 heading text (e.g., "Domain Expertise")
 * and values are the content below that heading until the next H2 or end of text.
 */
function parseMarkdownSections(body: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = body.split('\n');
  let currentHeading = '';
  let currentContent: string[] = [];

  for (const line of lines) {
    const h2Match = line.match(/^## (.+)$/);
    if (h2Match) {
      // Save previous section
      if (currentHeading) {
        sections[currentHeading] = currentContent.join('\n').trim();
      }
      currentHeading = h2Match[1].trim();
      currentContent = [];
    } else if (currentHeading) {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentHeading) {
    sections[currentHeading] = currentContent.join('\n').trim();
  }

  return sections;
}

/**
 * Read and parse a single .skill.md file.
 * Returns null if the file is invalid (logs a warning).
 */
function parseSkillFile(filePath: string): ParsedCategorySkill | null {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  const result = CategorySkillFrontmatterSchema.safeParse(data);
  if (!result.success) {
    console.warn(
      `[skill-loader] Invalid frontmatter in ${path.basename(filePath)}: ${result.error.message}`
    );
    return null;
  }

  return {
    frontmatter: result.data,
    sections: parseMarkdownSections(content),
  };
}

/**
 * Convert a ParsedCategorySkill into a CategoryPromptEnhancer
 * (the same interface consumed by registry.ts and composeCategoryPrompt).
 */
function toEnhancer(skill: ParsedCategorySkill): CategoryPromptEnhancer {
  const { frontmatter, sections } = skill;

  // Map string-keyed bloomsInDomain to Partial<Record<BloomsLevel, DomainBloomsGuidance>>
  const bloomsInDomain: Partial<Record<BloomsLevel, DomainBloomsGuidance>> = {};
  for (const [level, guidance] of Object.entries(frontmatter.bloomsInDomain)) {
    bloomsInDomain[level as BloomsLevel] = guidance;
  }

  return {
    categoryId: frontmatter.categoryId,
    displayName: frontmatter.displayName,
    matchesCategories: frontmatter.matchesCategories,
    domainExpertise: sections['Domain Expertise'] ?? '',
    teachingMethodology: sections['Teaching Methodology'] ?? '',
    bloomsInDomain,
    contentTypeGuidance: sections['Content Type Guidance'] ?? '',
    qualityCriteria: sections['Quality Criteria'] ?? '',
    chapterSequencingAdvice: sections['Chapter Sequencing Advice'] ?? '',
    activityExamples: frontmatter.activityExamples,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load and return all enhancers in priority order (excluding "general").
 * Results are cached after first call.
 */
export function getOrderedEnhancers(): CategoryPromptEnhancer[] {
  if (orderedCache) return orderedCache;
  loadAll();
  return orderedCache!;
}

/**
 * Load and return the "general" fallback enhancer.
 * Result is cached after first call.
 */
export function getGeneralEnhancer(): CategoryPromptEnhancer {
  if (generalCache) return generalCache;
  loadAll();
  return generalCache!;
}

/**
 * Clear the cache (useful for tests).
 */
export function clearCache(): void {
  orderedCache = null;
  generalCache = null;
}

// ---------------------------------------------------------------------------
// Internal loader
// ---------------------------------------------------------------------------

function loadAll(): void {
  if (!fs.existsSync(SKILLS_DIR)) {
    console.warn(`[skill-loader] Skills directory not found: ${SKILLS_DIR}`);
    orderedCache = [];
    generalCache = createFallbackGeneral();
    return;
  }

  const files = fs.readdirSync(SKILLS_DIR).filter(f => f.endsWith('.skill.md'));
  const byId = new Map<string, CategoryPromptEnhancer>();

  for (const file of files) {
    const parsed = parseSkillFile(path.join(SKILLS_DIR, file));
    if (parsed) {
      byId.set(parsed.frontmatter.categoryId, toEnhancer(parsed));
    }
  }

  // Build ordered list based on PRIORITY_ORDER
  const ordered: CategoryPromptEnhancer[] = [];
  for (const id of PRIORITY_ORDER) {
    const enhancer = byId.get(id);
    if (enhancer) {
      ordered.push(enhancer);
    }
  }

  // Add any enhancers not in PRIORITY_ORDER (excluding "general") at the end
  for (const [id, enhancer] of byId) {
    if (id !== 'general' && !PRIORITY_ORDER.includes(id)) {
      ordered.push(enhancer);
    }
  }

  orderedCache = ordered;
  generalCache = byId.get('general') ?? createFallbackGeneral();
}

/**
 * Minimal fallback if general.skill.md is missing or invalid.
 */
function createFallbackGeneral(): CategoryPromptEnhancer {
  return {
    categoryId: 'general',
    displayName: 'General (Default)',
    matchesCategories: [],
    domainExpertise: 'You are a versatile educator experienced across multiple disciplines.',
    teachingMethodology: '',
    bloomsInDomain: {},
    contentTypeGuidance: '',
    qualityCriteria: '',
    chapterSequencingAdvice: '',
    activityExamples: {},
  };
}
