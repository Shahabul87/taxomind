/**
 * Knowledge Modules
 *
 * Re-exports pedagogical framework constants from their canonical sources
 * as KnowledgeModule objects. NO duplication — these reference existing files.
 */

import type { KnowledgeModule } from '../types';

import {
  BLOOMS_TAXONOMY,
  CHAPTER_THINKING_FRAMEWORK,
  SECTION_THINKING_FRAMEWORK,
  LEARNING_OBJECTIVES_FRAMEWORK,
} from '@/lib/sam/prompts/content-generation-criteria';

// ============================================================================
// Serialize the BLOOMS_TAXONOMY object into a readable text block
// ============================================================================

function serializeBloomsTaxonomy(): string {
  const levels = Object.entries(BLOOMS_TAXONOMY) as Array<
    [string, (typeof BLOOMS_TAXONOMY)[keyof typeof BLOOMS_TAXONOMY]]
  >;

  return levels
    .map(
      ([name, info]) =>
        `### ${name} (Level ${info.level})\n` +
        `- Description: ${info.description}\n` +
        `- Cognitive Process: ${info.cognitiveProcess}\n` +
        `- Student Outcome: ${info.studentOutcome}\n` +
        `- Verbs: ${info.verbs.join(', ')}`,
    )
    .join('\n\n');
}

// ============================================================================
// Exported knowledge modules
// ============================================================================

export const KNOWLEDGE_MODULES: KnowledgeModule[] = [
  {
    id: 'blooms-taxonomy',
    name: "Bloom&apos;s Taxonomy Framework",
    content: serializeBloomsTaxonomy(),
  },
  {
    id: 'chapter-thinking',
    name: 'Chapter Thinking Framework',
    content: CHAPTER_THINKING_FRAMEWORK,
  },
  {
    id: 'section-thinking',
    name: 'Section Thinking Framework',
    content: SECTION_THINKING_FRAMEWORK,
  },
  {
    id: 'learning-objectives',
    name: 'Learning Objectives Framework',
    content: LEARNING_OBJECTIVES_FRAMEWORK,
  },
];
