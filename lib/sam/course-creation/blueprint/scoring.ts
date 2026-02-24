/**
 * Blueprint Module — Scoring & Fallback
 *
 * Rule-based blueprint scoring for comparing original vs retry.
 * Also provides heuristic fallback blueprint generation when AI calls fail.
 */

import type { CourseContext } from '@/lib/sam/course-creation/types';
import type { BlueprintCritique } from '@/lib/sam/course-creation/blueprint-critic';
import type { BlueprintChapter, BlueprintSection, BlueprintResponse, BlueprintRequestData } from './types';
import { BLOOMS_ORDER, computeBloomsDistribution } from './bloom-distribution';

/**
 * Quick rule-based scoring of a blueprint for comparing original vs retry.
 * Does NOT make an AI call — used only for the Pass 3 comparison.
 *
 * Returns a BlueprintCritique-compatible object with the 6 dimension scores.
 */
export function buildRuleBasedBlueprintScore(
  blueprint: BlueprintResponse,
  courseContext: CourseContext,
  courseGoals: string[],
): BlueprintCritique {
  let objectiveCoverage = 80;
  let topicSequencing = 80;
  let bloomsProgression = 80;
  let scopeCoherence = 80;
  let northStarAlignment = 80;
  let specificity = 80;
  const improvements: string[] = [];

  // Objective coverage
  const allText = blueprint.chapters
    .map(ch => `${ch.title} ${ch.goal} ${ch.sections.map(s => `${s.title} ${s.keyTopics.join(' ')}`).join(' ')}`)
    .join(' ').toLowerCase();

  for (const goal of courseGoals) {
    const words = goal.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    const hits = words.filter(w => allText.includes(w)).length;
    if (words.length > 0 && hits / words.length < 0.3) {
      objectiveCoverage -= 15;
    }
  }

  // Bloom's progression
  for (let i = 1; i < blueprint.chapters.length; i++) {
    const prevIdx = BLOOMS_ORDER.indexOf(blueprint.chapters[i - 1].bloomsLevel as typeof BLOOMS_ORDER[number]);
    const currIdx = BLOOMS_ORDER.indexOf(blueprint.chapters[i].bloomsLevel as typeof BLOOMS_ORDER[number]);
    if (prevIdx >= 0 && currIdx >= 0 && currIdx < prevIdx) {
      bloomsProgression -= 15;
    }
  }

  // Scope coherence
  const courseTitleWords = courseContext.courseTitle.toLowerCase()
    .split(/\s+/).filter(w => w.length > 3 && !['the', 'and', 'for', 'with'].includes(w));
  for (const ch of blueprint.chapters) {
    const chText = `${ch.title} ${ch.goal}`.toLowerCase();
    if (courseTitleWords.length > 0 && courseTitleWords.filter(w => chText.includes(w)).length === 0) {
      scopeCoherence -= 12;
    }
  }

  // North Star alignment
  if (!blueprint.northStarProject) {
    northStarAlignment -= 30;
  } else {
    const noDeliverable = blueprint.chapters.filter(ch => !ch.deliverable || ch.deliverable.trim() === '');
    northStarAlignment -= noDeliverable.length * 8;
  }

  // Specificity
  const genericPattern = /^(introduction|overview|basics|getting started|conclusion|chapter \d+)/i;
  const genericCount = blueprint.chapters.filter(ch => genericPattern.test(ch.title)).length;
  if (genericCount > 1) specificity -= genericCount * 10;

  const emptySections = blueprint.chapters.flatMap(ch =>
    ch.sections.filter(s => s.keyTopics.length === 0 || /^Section \d+/i.test(s.title)),
  );
  if (emptySections.length > 2) specificity -= emptySections.length * 5;

  // Topic sequencing — lightweight check
  for (let i = 2; i < blueprint.chapters.length; i++) {
    const chTopics = blueprint.chapters[i].sections.flatMap(s => s.keyTopics).map(t => t.toLowerCase());
    const prevTopics = new Set(
      blueprint.chapters.slice(0, i).flatMap(c => c.sections.flatMap(s => s.keyTopics.map(t => t.toLowerCase()))),
    );
    const novelCount = chTopics.filter(t => {
      const words = t.split(/\s+/).filter(w => w.length > 4);
      return words.length > 0 && words.every(w => !Array.from(prevTopics).some(pt => pt.includes(w)));
    }).length;
    if (chTopics.length > 0 && novelCount / chTopics.length > 0.8) {
      topicSequencing -= 10;
    }
  }

  // Clamp
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  objectiveCoverage = clamp(objectiveCoverage);
  topicSequencing = clamp(topicSequencing);
  bloomsProgression = clamp(bloomsProgression);
  scopeCoherence = clamp(scopeCoherence);
  northStarAlignment = clamp(northStarAlignment);
  specificity = clamp(specificity);

  const scores = [objectiveCoverage, topicSequencing, bloomsProgression, scopeCoherence, northStarAlignment, specificity];
  const allAbove70 = scores.every(s => s >= 70);
  const belowFiftyCount = scores.filter(s => s < 50).length;

  type CriticVerdict = 'approve' | 'revise' | 'reject';
  const verdict: CriticVerdict = belowFiftyCount >= 3 ? 'reject' : !allAbove70 ? 'revise' : 'approve';

  return {
    verdict,
    confidence: 65,
    reasoning: `Rule-based assessment: ${scores.filter(s => s >= 70).length}/6 dimensions pass`,
    objectiveCoverage,
    topicSequencing,
    bloomsProgression,
    scopeCoherence,
    northStarAlignment,
    specificity,
    actionableImprovements: improvements,
  };
}

// =============================================================================
// HEURISTIC FALLBACK
// =============================================================================

export function buildFallbackChapter(
  position: number,
  data: BlueprintRequestData,
  assignedBloomsLevel?: string,
): BlueprintChapter {
  const goalIndex = Math.min(position - 1, data.courseGoals.length - 1);
  const goal = data.courseGoals[goalIndex] ?? '';

  const sections: BlueprintSection[] = [];
  for (let j = 0; j < data.sectionsPerChapter; j++) {
    sections.push({
      position: j + 1,
      title: `Section ${position}.${j + 1}`,
      keyTopics: [],
    });
  }

  return {
    position,
    title: `Chapter ${position}`,
    goal,
    bloomsLevel: assignedBloomsLevel ?? data.bloomsFocus[Math.min(position - 1, data.bloomsFocus.length - 1)] ?? 'UNDERSTAND',
    sections,
  };
}

export function buildHeuristicBlueprint(data: BlueprintRequestData): BlueprintResponse {
  const distribution = computeBloomsDistribution(data.bloomsFocus, data.chapterCount);
  const chapters: BlueprintChapter[] = [];
  for (let i = 0; i < data.chapterCount; i++) {
    chapters.push(buildFallbackChapter(i + 1, data, distribution[i]));
  }

  return {
    chapters,
    confidence: 30,
    riskAreas: ['Blueprint was generated using heuristics — AI generation was unavailable. Please review and add key topics manually.'],
  };
}
