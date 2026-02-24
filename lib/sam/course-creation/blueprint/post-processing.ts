/**
 * Blueprint Module — Post-Processing
 *
 * Enriches the blueprint with computed metadata:
 * - Per-section and per-chapter learning time estimates
 * - Prerequisite dependency graph based on topic overlap
 * - Formative assessment checkpoints
 */

import type { BlueprintResponse } from './types';

// =============================================================================
// TIME ESTIMATES
// =============================================================================

const BLOOMS_TIME_MULTIPLIERS: Record<string, number> = {
  REMEMBER: 1.0,
  UNDERSTAND: 1.2,
  APPLY: 1.5,
  ANALYZE: 1.8,
  EVALUATE: 2.0,
  CREATE: 2.5,
};

const DIFFICULTY_SCALES: Record<string, number> = {
  BEGINNER: 0.8,
  INTERMEDIATE: 1.0,
  ADVANCED: 1.3,
};

/**
 * Compute per-section and per-chapter learning time estimates based on
 * key topic count, Bloom's level, and course difficulty.
 */
export function computeTimeEstimates(
  blueprint: BlueprintResponse,
  difficulty: string,
): BlueprintResponse {
  const difficultyScale = DIFFICULTY_SCALES[difficulty.toUpperCase()] ?? 1.0;

  const chapters = blueprint.chapters.map(ch => {
    const bloomsMultiplier = BLOOMS_TIME_MULTIPLIERS[ch.bloomsLevel] ?? 1.2;

    const sections = ch.sections.map(sec => {
      const baseMinutes = 12;
      const topicMinutes = sec.keyTopics.length * 3 * bloomsMultiplier;
      const estimatedMinutes = Math.round((baseMinutes + topicMinutes) * difficultyScale);
      return { ...sec, estimatedMinutes };
    });

    const chapterMinutes = sections.reduce((sum, sec) => sum + (sec.estimatedMinutes ?? 0), 0);
    return { ...ch, sections, estimatedMinutes: chapterMinutes };
  });

  return { ...blueprint, chapters };
}

// =============================================================================
// PREREQUISITE DEPENDENCY GRAPH
// =============================================================================

/**
 * Compute prerequisite relationships between chapters based on key topic overlap.
 * For each chapter after the first, check if any key topics share significant
 * words (>4 chars) with prior chapters' key topics.
 */
export function computePrerequisiteGraph(blueprint: BlueprintResponse): BlueprintResponse {
  const chapters = blueprint.chapters.map((ch, idx) => {
    if (idx === 0) return ch;

    const currentTopics = ch.sections.flatMap(s => s.keyTopics);
    const currentWords = new Set(
      currentTopics.flatMap(t => t.toLowerCase().split(/\s+/).filter(w => w.length > 4)),
    );

    const prerequisiteChapters: number[] = [];
    for (let prevIdx = 0; prevIdx < idx; prevIdx++) {
      const prevCh = blueprint.chapters[prevIdx];
      const prevTopics = prevCh.sections.flatMap(s => s.keyTopics);
      const prevWords = prevTopics.flatMap(t => t.toLowerCase().split(/\s+/).filter(w => w.length > 4));

      const overlapCount = prevWords.filter(w => currentWords.has(w)).length;
      if (overlapCount >= 2) {
        prerequisiteChapters.push(prevCh.position);
      }
    }

    return prerequisiteChapters.length > 0
      ? { ...ch, prerequisiteChapters }
      : ch;
  });

  return { ...blueprint, chapters };
}

// =============================================================================
// FORMATIVE ASSESSMENTS
// =============================================================================

const BLOOMS_ASSESSMENT_TYPES: Record<string, [string, string]> = {
  REMEMBER: ['quiz', 'self-assessment'],
  UNDERSTAND: ['reflection', 'quiz'],
  APPLY: ['practice', 'quiz'],
  ANALYZE: ['reflection', 'practice'],
  EVALUATE: ['peer-review', 'reflection'],
  CREATE: ['practice', 'self-assessment'],
};

const ASSESSMENT_PROMPT_TEMPLATES: Record<string, (chapterTitle: string, sectionTitle: string) => string> = {
  quiz: (ch, sec) => `Quick check: key concepts from "${sec}" in ${ch}`,
  reflection: (ch, sec) => `Reflect on how "${sec}" connects to the broader themes of ${ch}`,
  practice: (ch, sec) => `Apply what you learned in "${sec}" to a hands-on exercise`,
  'self-assessment': (ch, sec) => `Rate your understanding of "${sec}" concepts`,
  'peer-review': (ch, sec) => `Review a peer&apos;s work on "${sec}" using the evaluation criteria`,
};

/**
 * Inject formative assessment checkpoints at ~40% and ~80% through each chapter.
 * Assessment type is matched to the chapter's Bloom's level.
 */
export function injectFormativeAssessments(blueprint: BlueprintResponse): BlueprintResponse {
  const chapters = blueprint.chapters.map(ch => {
    const sectionCount = ch.sections.length;
    if (sectionCount < 2) return ch;

    const assessmentTypes = BLOOMS_ASSESSMENT_TYPES[ch.bloomsLevel] ?? ['quiz', 'reflection'];
    const checkpoint1 = Math.max(0, Math.round(sectionCount * 0.4) - 1);
    const checkpoint2 = Math.max(0, Math.round(sectionCount * 0.8) - 1);

    const sections = ch.sections.map((sec, idx) => {
      if (idx === checkpoint1) {
        const promptFn = ASSESSMENT_PROMPT_TEMPLATES[assessmentTypes[0]] ?? ASSESSMENT_PROMPT_TEMPLATES.quiz;
        return {
          ...sec,
          formativeAssessment: {
            type: assessmentTypes[0],
            prompt: promptFn(ch.title, sec.title),
          },
        };
      }
      if (idx === checkpoint2 && checkpoint2 !== checkpoint1) {
        const promptFn = ASSESSMENT_PROMPT_TEMPLATES[assessmentTypes[1]] ?? ASSESSMENT_PROMPT_TEMPLATES.reflection;
        return {
          ...sec,
          formativeAssessment: {
            type: assessmentTypes[1],
            prompt: promptFn(ch.title, sec.title),
          },
        };
      }
      return sec;
    });

    return { ...ch, sections };
  });

  return { ...blueprint, chapters };
}
