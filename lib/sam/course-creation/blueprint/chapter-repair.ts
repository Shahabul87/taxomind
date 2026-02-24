/**
 * Blueprint Module — Chapter-Level Quality Repair
 *
 * Detects and repairs chapter-level quality issues that the parser accepted
 * but that indicate a partial AI failure (e.g., the AI ran out of tokens and
 * produced a generic "Chapter 5" with no goal or deliverable).
 *
 * Runs BEFORE fillIncompleteSections() so that repaired chapter metadata
 * (title, goal) can inform the section-level heuristics downstream.
 *
 * This is a pure heuristic function — no AI call.
 */

import { logger } from '@/lib/logger';
import type { BlueprintResponse, BlueprintRequestData } from './types';
import { BLOOMS_GOAL_VERBS, BLOOMS_ARTIFACT_GUIDANCE } from './bloom-distribution';

export function repairIncompleteChapters(
  blueprint: BlueprintResponse,
  data: BlueprintRequestData,
): BlueprintResponse {
  const courseKeyword = extractCourseKeyword(data.courseTitle);
  let repairedCount = 0;

  const chapters = blueprint.chapters.map((ch) => {
    let repaired = false;
    let title = ch.title;
    let goal = ch.goal;
    let deliverable = ch.deliverable;

    // --- Title repair: generic "Chapter N" pattern ---
    if (/^Chapter\s*\d+$/i.test(title)) {
      title = generateChapterTitle(
        ch.position,
        blueprint.chapters.length,
        courseKeyword,
        ch.bloomsLevel,
      );
      repaired = true;
    }

    // --- Goal repair: empty or missing ---
    if (!goal || goal.trim() === '') {
      const verb = BLOOMS_GOAL_VERBS[ch.bloomsLevel] ?? 'Understand';
      goal = `${verb} the core principles of ${courseKeyword} at the ${ch.bloomsLevel.toLowerCase()} level`;
      repaired = true;
    } else {
      // --- Goal verb alignment: check if goal uses verbs from wrong Bloom's level ---
      const correctedGoal = alignGoalVerbs(goal, ch.bloomsLevel);
      if (correctedGoal !== goal) {
        goal = correctedGoal;
        repaired = true;
      }
    }

    // --- Deliverable repair: empty or missing ---
    if (!deliverable || deliverable.trim() === '') {
      deliverable = generateDeliverable(ch.bloomsLevel, courseKeyword);
      repaired = true;
    }

    if (repaired) repairedCount++;

    return repaired
      ? { ...ch, title, goal, deliverable }
      : ch;
  });

  if (repairedCount === 0) return blueprint;

  logger.info('[BLUEPRINT] Chapter-level repair applied', {
    repairedCount,
    totalChapters: blueprint.chapters.length,
  });

  const confidence = Math.max(30, blueprint.confidence - repairedCount * 10);
  const riskAreas = [
    ...blueprint.riskAreas,
    `${repairedCount} chapter(s) had incomplete metadata and were repaired with heuristics — please review titles, goals, and deliverables.`,
  ];

  return { chapters, northStarProject: blueprint.northStarProject, confidence, riskAreas };
}

/**
 * Extract the first significant phrase from the course title to use as a keyword
 * in generated chapter titles and goals. Strips common filler words.
 */
export function extractCourseKeyword(courseTitle: string): string {
  const fillerWords = new Set([
    'the', 'a', 'an', 'to', 'of', 'in', 'for', 'and', 'with',
    'introduction', 'complete', 'guide', 'course', 'masterclass',
    'fundamentals', 'essentials', 'comprehensive',
  ]);

  const words = courseTitle
    .split(/\s+/)
    .filter(w => !fillerWords.has(w.toLowerCase()) && w.length > 2);

  // Take the first 3 meaningful words to form the keyword phrase
  return words.slice(0, 3).join(' ') || courseTitle;
}

/**
 * Generate a meaningful chapter title based on position within the course arc.
 */
function generateChapterTitle(
  position: number,
  totalChapters: number,
  courseKeyword: string,
  bloomsLevel: string,
): string {
  const bloomsThemes: Record<string, string> = {
    REMEMBER: 'Foundations',
    UNDERSTAND: 'Core Concepts',
    APPLY: 'Practical Applications',
    ANALYZE: 'Analysis and Patterns',
    EVALUATE: 'Evaluation and Assessment',
    CREATE: 'Design and Innovation',
  };

  if (position === 1) {
    return `Foundations of ${courseKeyword}`;
  }

  const mid = Math.ceil(totalChapters / 2);

  if (position === totalChapters) {
    return `Mastery: ${courseKeyword} Capstone`;
  }

  if (position <= mid) {
    const theme = bloomsThemes[bloomsLevel] ?? 'Core Concepts';
    return `${theme}: ${courseKeyword} in Depth`;
  }

  // position > mid and not last
  return `Applied ${courseKeyword}: Advanced Techniques`;
}

/**
 * Check if the goal uses verbs from a different Bloom's level and rewrite
 * the prefix with the correct verb if needed.
 */
export function alignGoalVerbs(goal: string, bloomsLevel: string): string {
  const verbMap: Record<string, string[]> = {
    REMEMBER: ['identify', 'recall', 'list', 'name', 'define', 'recognize'],
    UNDERSTAND: ['explain', 'interpret', 'summarize', 'describe', 'classify'],
    APPLY: ['implement', 'demonstrate', 'use', 'execute', 'solve'],
    ANALYZE: ['analyze', 'compare', 'differentiate', 'examine', 'deconstruct'],
    EVALUATE: ['evaluate', 'assess', 'justify', 'critique', 'judge'],
    CREATE: ['design', 'create', 'construct', 'develop', 'formulate'],
  };

  const correctVerbs = verbMap[bloomsLevel];
  if (!correctVerbs) return goal;

  // Check if goal already starts with a correct verb
  const goalLower = goal.toLowerCase().trim();
  if (correctVerbs.some(v => goalLower.startsWith(v))) return goal;

  // Check if goal starts with a verb from a different level
  const allOtherVerbs = Object.entries(verbMap)
    .filter(([level]) => level !== bloomsLevel)
    .flatMap(([, verbs]) => verbs);

  const startsWithWrongVerb = allOtherVerbs.some(v => goalLower.startsWith(v));
  if (!startsWithWrongVerb) return goal;

  // Replace the leading verb phrase with the correct one
  const correctPrefix = BLOOMS_GOAL_VERBS[bloomsLevel] ?? 'Understand';
  // Strip the old verb (first word or two) and prepend the correct one
  const withoutVerb = goal.replace(/^\w+(\s+and\s+\w+)?\s*/i, '');
  return `${correctPrefix} ${withoutVerb}`;
}

/**
 * Generate a deliverable from the Bloom's artifact guidance for the given level.
 * Picks the first artifact type and contextualizes it with the course keyword.
 */
function generateDeliverable(bloomsLevel: string, courseKeyword: string): string {
  const artifacts = BLOOMS_ARTIFACT_GUIDANCE[bloomsLevel] ?? BLOOMS_ARTIFACT_GUIDANCE.UNDERSTAND;
  // Pick the first artifact type from the comma-separated list
  const firstArtifact = artifacts.split(',')[0].trim();
  return `Create ${firstArtifact} covering ${courseKeyword}`;
}
