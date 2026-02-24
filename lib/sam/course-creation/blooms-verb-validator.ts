/**
 * Bloom's Verb Validator
 *
 * Validates that learning objectives use verbs appropriate for their assigned
 * Bloom's taxonomy level. Provides auto-correction for violated objectives.
 *
 * Tolerance: Accepts verbs from the assigned level OR one level below
 * (scaffolding is pedagogically valid).
 *
 * Auto-correction: Replaces only the first word of violated objectives
 * with the first verb from the correct level, preserving the rest of the text.
 */

import { BLOOMS_TAXONOMY, BLOOMS_LEVELS, type BloomsLevel } from './types';

// ============================================================================
// Types
// ============================================================================

export interface BloomsVerbViolation {
  /** Index of the violated objective in the array */
  objectiveIndex: number;
  /** The original objective text */
  originalObjective: string;
  /** The verb detected at the start of the objective */
  detectedVerb: string;
  /** The Bloom's level the detected verb belongs to */
  detectedLevel: BloomsLevel | null;
  /** The expected Bloom's level */
  expectedLevel: BloomsLevel;
  /** The corrected objective text */
  correctedObjective: string;
}

export interface BloomsVerbValidationResult {
  /** Whether all objectives passed validation */
  valid: boolean;
  /** Overall score (0-100) — percentage of objectives with correct-level verbs */
  score: number;
  /** List of violated objectives with details */
  violations: BloomsVerbViolation[];
  /** Objectives with auto-corrected first verbs (all objectives, corrected or not) */
  correctedObjectives: string[];
}

// ============================================================================
// Verb → Level reverse lookup
// ============================================================================

/**
 * Map from lowercase verb to its Bloom's level.
 * Built once from BLOOMS_TAXONOMY on first access.
 */
let verbToLevelMap: Map<string, BloomsLevel> | null = null;

function getVerbToLevelMap(): Map<string, BloomsLevel> {
  if (verbToLevelMap) return verbToLevelMap;
  verbToLevelMap = new Map<string, BloomsLevel>();
  for (const level of BLOOMS_LEVELS) {
    for (const verb of BLOOMS_TAXONOMY[level].verbs) {
      verbToLevelMap.set(verb.toLowerCase(), level);
    }
  }
  return verbToLevelMap;
}

/**
 * Get the Bloom's level index (0-5) for a given level.
 */
function getLevelIndex(level: BloomsLevel): number {
  return BLOOMS_LEVELS.indexOf(level);
}

/**
 * Extract the first word from an objective string.
 */
function extractFirstVerb(objective: string): string {
  const trimmed = objective.trim();
  const firstWord = trimmed.split(/\s+/)[0] ?? '';
  // Strip trailing punctuation (colon, comma, etc.)
  return firstWord.replace(/[^a-zA-Z]/g, '');
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Validate that learning objectives use Bloom's-appropriate verbs.
 *
 * Tolerance: Accepts verbs from the assigned level OR one level below
 * (scaffolding is acceptable — e.g., an APPLY verb in an ANALYZE chapter).
 *
 * @param objectives - Array of learning objective strings
 * @param expectedLevel - The Bloom's level assigned to this chapter
 * @returns Validation result with violations and auto-corrected objectives
 */
export function validateBloomsVerbs(
  objectives: string[],
  expectedLevel: BloomsLevel,
): BloomsVerbValidationResult {
  const map = getVerbToLevelMap();
  const expectedIdx = getLevelIndex(expectedLevel);
  // Accept verbs from this level or one below (scaffolding tolerance)
  const minAcceptableIdx = Math.max(0, expectedIdx - 1);

  const violations: BloomsVerbViolation[] = [];
  const correctedObjectives: string[] = [];

  for (let i = 0; i < objectives.length; i++) {
    const objective = objectives[i];
    const firstVerb = extractFirstVerb(objective);
    const verbLower = firstVerb.toLowerCase();
    const detectedLevel = map.get(verbLower) ?? null;

    if (detectedLevel === null) {
      // Unknown verb — not in our taxonomy, pass through unchanged
      correctedObjectives.push(objective);
      continue;
    }

    const detectedIdx = getLevelIndex(detectedLevel);

    if (detectedIdx >= minAcceptableIdx && detectedIdx <= expectedIdx) {
      // Verb is at the correct level or one below — acceptable
      correctedObjectives.push(objective);
      continue;
    }

    // Violation detected — auto-correct by replacing the first verb
    const correctVerb = BLOOMS_TAXONOMY[expectedLevel].verbs[0];
    const restOfObjective = objective.trim().slice(firstVerb.length).trimStart();
    const correctedObjective = `${correctVerb} ${restOfObjective}`;

    violations.push({
      objectiveIndex: i,
      originalObjective: objective,
      detectedVerb: firstVerb,
      detectedLevel,
      expectedLevel,
      correctedObjective,
    });

    correctedObjectives.push(correctedObjective);
  }

  const validCount = objectives.length - violations.length;
  const score = objectives.length > 0
    ? Math.round((validCount / objectives.length) * 100)
    : 100;

  return {
    valid: violations.length === 0,
    score,
    violations,
    correctedObjectives,
  };
}
