// @ts-nocheck
/**
 * Bloom's Taxonomy Helper Functions for Breadth-First Pipeline
 *
 * Provides utilities for detecting Bloom's verbs, checking progression,
 * mapping difficulty to allowed levels, and finding duplicate objectives.
 */

import { BLOOMS_TAXONOMY, BLOOMS_LEVELS } from './types';
import type { BloomsLevel, CourseContext } from './types';

// ============================================================================
// Bloom's Verb Detection
// ============================================================================

/** Result of detecting a Bloom's verb in text */
export interface BloomVerbDetection {
  verb: string;
  level: BloomsLevel;
}

/**
 * Detect which Bloom's verb starts an objective text.
 * Returns the first matching verb and its level, or null if no match.
 */
export function detectBloomVerb(text: string): BloomVerbDetection | null {
  const trimmed = text.trim();
  const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase() ?? '';

  for (const level of BLOOMS_LEVELS) {
    const info = BLOOMS_TAXONOMY[level];
    for (const verb of info.verbs) {
      if (firstWord === verb.toLowerCase()) {
        return { verb, level };
      }
    }
  }

  // Fallback: check if any verb appears in the first 5 words
  const firstFiveWords = trimmed.split(/\s+/).slice(0, 5).join(' ').toLowerCase();
  for (const level of BLOOMS_LEVELS) {
    const info = BLOOMS_TAXONOMY[level];
    for (const verb of info.verbs) {
      if (firstFiveWords.includes(verb.toLowerCase())) {
        return { verb, level };
      }
    }
  }

  return null;
}

// ============================================================================
// Bloom's Progression Check
// ============================================================================

/**
 * Check if Bloom's levels show upward (non-decreasing) progression.
 * Returns { valid, regressions } where regressions lists any step-backs.
 */
export function checkBloomProgression(levels: BloomsLevel[]): {
  valid: boolean;
  regressions: Array<{ from: BloomsLevel; to: BloomsLevel; position: number }>;
} {
  const regressions: Array<{ from: BloomsLevel; to: BloomsLevel; position: number }> = [];

  for (let i = 1; i < levels.length; i++) {
    const prevIdx = BLOOMS_LEVELS.indexOf(levels[i - 1]);
    const currIdx = BLOOMS_LEVELS.indexOf(levels[i]);
    if (currIdx < prevIdx) {
      regressions.push({
        from: levels[i - 1],
        to: levels[i],
        position: i + 1,
      });
    }
  }

  return { valid: regressions.length === 0, regressions };
}

// ============================================================================
// Difficulty-to-Bloom's Mapping
// ============================================================================

/**
 * Map course difficulty to allowed Bloom's level range.
 * Returns min and max indices into BLOOMS_LEVELS.
 */
export function getAllowedBloomLevels(difficulty: CourseContext['difficulty']): {
  min: BloomsLevel;
  max: BloomsLevel;
  minIndex: number;
  maxIndex: number;
} {
  switch (difficulty) {
    case 'beginner':
      return { min: 'REMEMBER', max: 'APPLY', minIndex: 0, maxIndex: 2 };
    case 'intermediate':
      return { min: 'UNDERSTAND', max: 'EVALUATE', minIndex: 1, maxIndex: 4 };
    case 'advanced':
      return { min: 'APPLY', max: 'CREATE', minIndex: 2, maxIndex: 5 };
    case 'expert':
      return { min: 'ANALYZE', max: 'CREATE', minIndex: 3, maxIndex: 5 };
    default:
      return { min: 'REMEMBER', max: 'CREATE', minIndex: 0, maxIndex: 5 };
  }
}

// ============================================================================
// Duplicate Objective Detection
// ============================================================================

/**
 * Word-overlap Jaccard similarity between two text strings.
 * Uses lowercased word sets, filtering short words.
 */
export function wordOverlapSimilarity(text1: string, text2: string): number {
  const words1 = new Set(
    text1.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  );
  const words2 = new Set(
    text2.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  );

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Find near-duplicate objectives via word-overlap Jaccard similarity.
 * Returns pairs of indices that exceed the threshold.
 */
export function findDuplicateObjectives(
  objectives: string[],
  threshold = 0.65,
): Array<{ indexA: number; indexB: number; similarity: number; textA: string; textB: string }> {
  const duplicates: Array<{ indexA: number; indexB: number; similarity: number; textA: string; textB: string }> = [];

  for (let i = 0; i < objectives.length; i++) {
    for (let j = i + 1; j < objectives.length; j++) {
      const sim = wordOverlapSimilarity(objectives[i], objectives[j]);
      if (sim >= threshold) {
        duplicates.push({
          indexA: i,
          indexB: j,
          similarity: sim,
          textA: objectives[i],
          textB: objectives[j],
        });
      }
    }
  }

  return duplicates;
}
