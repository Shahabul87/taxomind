/**
 * Course Template Loader
 *
 * Loads difficulty-specific course design templates and composes them
 * into system prompts for single-call blueprint generation.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

const templateCache = new Map<Difficulty, string>();

const TEMPLATE_DIR = join(process.cwd(), 'lib/sam/course-creation/templates');

/**
 * Load a course template markdown file by difficulty.
 * Caches in memory after first read.
 */
export function loadCourseTemplate(difficulty: Difficulty): string {
  const cached = templateCache.get(difficulty);
  if (cached) return cached;

  const filename = difficulty.toLowerCase() + '.md';
  const content = readFileSync(join(TEMPLATE_DIR, filename), 'utf-8');
  templateCache.set(difficulty, content);
  return content;
}

/**
 * Build the full system prompt for blueprint generation:
 * 1. Role preamble (return JSON only)
 * 2. Full template content
 * 3. Bloom's assignments (non-negotiable)
 */
export function buildTemplateSystemPrompt(
  difficulty: Difficulty,
  bloomsAssignmentBlock: string,
): string {
  const template = loadCourseTemplate(difficulty);

  return `You are a Taxomind course architect. You design university-quality course blueprints.

CRITICAL: Return ONLY valid JSON. No markdown fences, no commentary, no explanation outside the JSON object.

---

## COURSE DESIGN TEMPLATE (${difficulty} LEVEL)

Use the following template as your pedagogical guide. Follow its design principles, structural rules, tone guidelines, and quality standards when generating the blueprint.

${template}

---

## BLOOM'S TAXONOMY ASSIGNMENTS (NON-NEGOTIABLE)

The following Bloom's cognitive levels are PRE-ASSIGNED to each chapter. You MUST use these exact levels — do not reassign or reorder them.

${bloomsAssignmentBlock}

Each chapter's goal, deliverable, and section topics must align with its assigned Bloom's level:
- REMEMBER: recall, identify, list, define
- UNDERSTAND: explain, describe, interpret, summarize
- APPLY: implement, demonstrate, use, execute
- ANALYZE: compare, contrast, differentiate, examine
- EVALUATE: assess, critique, justify, recommend
- CREATE: design, build, compose, produce`;
}
