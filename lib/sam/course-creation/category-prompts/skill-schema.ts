/**
 * Zod validation schema for category skill file frontmatter.
 *
 * Each `.skill.md` file has YAML frontmatter containing structured data
 * (categoryId, matchesCategories, bloomsInDomain, activityExamples)
 * and a markdown body with natural-language pedagogical content.
 */

import { z } from 'zod';

const DomainBloomsGuidanceSchema = z.object({
  means: z.string(),
  exampleObjectives: z.array(z.string()).min(1),
  exampleActivities: z.array(z.string()).min(1),
});

export const CategorySkillFrontmatterSchema = z.object({
  categoryId: z.string().min(1),
  displayName: z.string().min(1),
  matchesCategories: z.array(z.string()),
  bloomsInDomain: z.record(z.string(), DomainBloomsGuidanceSchema),
  activityExamples: z.record(z.string(), z.string()),
});

export type CategorySkillFrontmatter = z.infer<typeof CategorySkillFrontmatterSchema>;

/**
 * Parsed category skill file: validated frontmatter + markdown body sections.
 */
export interface ParsedCategorySkill {
  frontmatter: CategorySkillFrontmatter;
  /** H2-delimited sections from the markdown body */
  sections: Record<string, string>;
}
