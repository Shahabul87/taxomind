/**
 * Blueprint Module — Bloom's Taxonomy Distribution
 *
 * Pre-computes a Bloom's cognitive level for each chapter,
 * ensuring progressive escalation across the course arc.
 */

export const BLOOMS_ORDER = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'] as const;

/**
 * Maps Bloom's cognitive levels to the type of student deliverable/artifact
 * that is pedagogically appropriate. Injected into the blueprint prompt so
 * the AI generates deliverables aligned with the cognitive level.
 */
export const BLOOMS_ARTIFACT_GUIDANCE: Record<string, string> = {
  REMEMBER: 'concept maps, annotated notes, summary documents, glossaries',
  UNDERSTAND: 'concept maps, diagrams, annotated notes, summary documents, explanation essays',
  APPLY: 'runnable code, working implementations, lab notebooks, solved problem sets',
  ANALYZE: 'comparison matrices, ADRs, tradeoff analysis documents, model cards',
  EVALUATE: 'evaluation reports, code reviews, benchmark analysis, recommendation memos',
  CREATE: 'original projects, system designs, published artifacts, portfolio pieces',
};

/**
 * Maps Bloom's cognitive levels to goal verb prefixes used when
 * repairing chapters with missing or misaligned goals.
 */
export const BLOOMS_GOAL_VERBS: Record<string, string> = {
  REMEMBER: 'Identify and recall',
  UNDERSTAND: 'Explain and interpret',
  APPLY: 'Implement and demonstrate',
  ANALYZE: 'Analyze and compare',
  EVALUATE: 'Evaluate and assess',
  CREATE: 'Design and create',
};

/**
 * Pre-compute a Bloom's level for each chapter, ensuring progressive escalation.
 *
 * Algorithm:
 * 1. Sort the teacher-selected Bloom's levels by taxonomy order.
 * 2. Divide chapters into equal-ish bands — one band per level.
 * 3. Assign earlier chapters to lower bands, later chapters to higher bands.
 *
 * Example: 5 chapters with [APPLY, ANALYZE] → [APPLY, APPLY, ANALYZE, ANALYZE, ANALYZE]
 * Example: 6 chapters with [UNDERSTAND, APPLY, EVALUATE] → [UNDERSTAND, UNDERSTAND, APPLY, APPLY, EVALUATE, EVALUATE]
 */
export function computeBloomsDistribution(
  bloomsFocus: string[],
  chapterCount: number,
): string[] {
  // Sort selected levels by taxonomy order
  const sorted = [...bloomsFocus].sort(
    (a, b) => BLOOMS_ORDER.indexOf(a as typeof BLOOMS_ORDER[number]) - BLOOMS_ORDER.indexOf(b as typeof BLOOMS_ORDER[number]),
  );

  // Deduplicate while preserving order
  const uniqueLevels = Array.from(new Set(sorted));

  if (uniqueLevels.length === 0) {
    return Array(chapterCount).fill('UNDERSTAND');
  }

  // Fill cognitive gaps: if non-adjacent levels are selected, insert missing
  // intermediate levels to maintain proper Bloom's progression.
  // E.g., [UNDERSTAND, ANALYZE] → [UNDERSTAND, APPLY, ANALYZE]
  const filledLevels: string[] = [];
  for (let i = 0; i < uniqueLevels.length; i++) {
    const currentIdx = BLOOMS_ORDER.indexOf(uniqueLevels[i] as typeof BLOOMS_ORDER[number]);
    if (i > 0) {
      const prevIdx = BLOOMS_ORDER.indexOf(uniqueLevels[i - 1] as typeof BLOOMS_ORDER[number]);
      for (let gapIdx = prevIdx + 1; gapIdx < currentIdx; gapIdx++) {
        filledLevels.push(BLOOMS_ORDER[gapIdx]);
      }
    }
    filledLevels.push(uniqueLevels[i]);
  }

  if (filledLevels.length === 1) {
    return Array(chapterCount).fill(filledLevels[0]);
  }

  // Distribute chapters across levels proportionally
  // Earlier chapters get lower levels, later chapters get higher levels
  const distribution: string[] = [];
  const bandSize = chapterCount / filledLevels.length;

  for (let i = 0; i < chapterCount; i++) {
    const bandIndex = Math.min(
      Math.floor(i / bandSize),
      filledLevels.length - 1,
    );
    distribution.push(filledLevels[bandIndex]);
  }

  return distribution;
}

/**
 * Format per-chapter Bloom's assignments as an explicit instruction block.
 */
export function formatBloomsAssignments(distribution: string[]): string {
  return distribution
    .map((level, i) => `- Chapter ${i + 1}: **${level}**`)
    .join('\n');
}
