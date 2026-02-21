/**
 * Blueprint Constructive Alignment Validation
 *
 * Client-side utility that validates alignment between chapter goals,
 * deliverables, and Bloom's cognitive levels. No API call needed.
 */

import type { BlueprintChapter } from '../types/sam-creator.types';

// =============================================================================
// TYPES
// =============================================================================

export type AlignmentSeverity = 'error' | 'warning' | 'info';

export interface AlignmentWarning {
  severity: AlignmentSeverity;
  message: string;
  scorePenalty: number;
}

export interface ChapterAlignment {
  position: number;
  score: number;
  warnings: AlignmentWarning[];
}

export interface AlignmentScore {
  overall: number; // 0-100 average across chapters
  perChapter: ChapterAlignment[];
  totalWarnings: number;
}

// =============================================================================
// BLOOM'S-DELIVERABLE KEYWORD MAP
// =============================================================================

/**
 * Keywords that should appear in deliverables for each Bloom's level.
 * If the deliverable doesn't contain ANY of the expected keywords,
 * it may be misaligned with the cognitive level.
 */
const BLOOMS_DELIVERABLE_KEYWORDS: Record<string, string[]> = {
  REMEMBER: ['list', 'define', 'identify', 'recall', 'name', 'glossary', 'notes', 'summary', 'map', 'label'],
  UNDERSTAND: ['explain', 'describe', 'summarize', 'interpret', 'classify', 'diagram', 'essay', 'compare', 'discuss', 'illustrate'],
  APPLY: ['implement', 'build', 'code', 'solve', 'demonstrate', 'use', 'execute', 'practice', 'calculate', 'run'],
  ANALYZE: ['analyze', 'compare', 'contrast', 'examine', 'investigate', 'differentiate', 'tradeoff', 'matrix', 'breakdown', 'dissect'],
  EVALUATE: ['evaluate', 'judge', 'assess', 'critique', 'review', 'recommend', 'justify', 'defend', 'benchmark', 'validate'],
  CREATE: ['create', 'design', 'develop', 'build', 'produce', 'compose', 'construct', 'invent', 'generate', 'project', 'portfolio'],
};

// =============================================================================
// VALIDATION LOGIC
// =============================================================================

/**
 * Validate constructive alignment for a set of blueprint chapters.
 * Returns per-chapter scores and an overall alignment percentage.
 */
export function validateAlignment(chapters: BlueprintChapter[]): AlignmentScore {
  if (chapters.length === 0) {
    return { overall: 100, perChapter: [], totalWarnings: 0 };
  }

  const perChapter: ChapterAlignment[] = chapters.map(ch => {
    const warnings: AlignmentWarning[] = [];

    // Check 1: Missing goal (severity: error, -30)
    if (!ch.goal || ch.goal.trim().length === 0) {
      warnings.push({
        severity: 'error',
        message: 'Missing learning goal',
        scorePenalty: 30,
      });
    }

    // Check 2: Missing deliverable (severity: warning, -20)
    if (!ch.deliverable || ch.deliverable.trim().length === 0) {
      warnings.push({
        severity: 'warning',
        message: 'No chapter deliverable specified',
        scorePenalty: 20,
      });
    }

    // Check 3: Bloom's-deliverable mismatch (severity: info, -10)
    if (ch.deliverable && ch.bloomsLevel) {
      const expectedKeywords = BLOOMS_DELIVERABLE_KEYWORDS[ch.bloomsLevel] ?? [];
      const deliverableLower = ch.deliverable.toLowerCase();
      const hasMatch = expectedKeywords.some(kw => deliverableLower.includes(kw));
      if (!hasMatch && expectedKeywords.length > 0) {
        warnings.push({
          severity: 'info',
          message: `Deliverable may not match ${ch.bloomsLevel} level (expected keywords: ${expectedKeywords.slice(0, 4).join(', ')})`,
          scorePenalty: 10,
        });
      }
    }

    // Check 4: Goal-deliverable disconnect (severity: info, -10)
    if (ch.goal && ch.deliverable) {
      const goalWords = new Set(
        ch.goal.toLowerCase().split(/\s+/).filter(w => w.length > 3),
      );
      const deliverableWords = ch.deliverable.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const overlap = deliverableWords.filter(w => goalWords.has(w)).length;
      if (overlap === 0) {
        warnings.push({
          severity: 'info',
          message: 'Goal and deliverable share no keywords — may be disconnected',
          scorePenalty: 10,
        });
      }
    }

    const totalPenalty = warnings.reduce((sum, w) => sum + w.scorePenalty, 0);
    const score = Math.max(0, 100 - totalPenalty);

    return { position: ch.position, score, warnings };
  });

  const overall = Math.round(
    perChapter.reduce((sum, ch) => sum + ch.score, 0) / perChapter.length,
  );
  const totalWarnings = perChapter.reduce((sum, ch) => sum + ch.warnings.length, 0);

  return { overall, perChapter, totalWarnings };
}
