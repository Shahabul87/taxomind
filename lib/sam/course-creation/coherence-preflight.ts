/**
 * Coherence Preflight Check
 *
 * Lightweight pre-generation coherence validation for teacher blueprints.
 * Runs BEFORE the expensive 15-min course creation pipeline to catch
 * structural issues early (Bloom&apos;s regressions, off-topic chapters,
 * missing goals, empty sections).
 */

// =============================================================================
// TYPES
// =============================================================================

export interface PreflightBlueprint {
  chapters: Array<{
    title: string;
    goal: string;
    bloomsLevel: string;
    sections: Array<{
      title: string;
      keyTopics: string[];
    }>;
  }>;
}

export interface PreflightConfig {
  courseTitle: string;
  courseGoals: string[];
  teacherBlueprint?: PreflightBlueprint;
}

export interface PreflightResult {
  score: number;
  warnings: string[];
  passed: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const BLOOMS_ORDER: Record<string, number> = {
  REMEMBER: 1, UNDERSTAND: 2, APPLY: 3, ANALYZE: 4, EVALUATE: 5, CREATE: 6,
};

const PREFLIGHT_PASS_THRESHOLD = 50;

// =============================================================================
// IMPLEMENTATION
// =============================================================================

/**
 * Run a lightweight coherence check on a teacher blueprint BEFORE committing
 * to the expensive generation pipeline. Checks 4 dimensions:
 *
 * 1. Bloom&apos;s progression — penalizes level regressions
 * 2. Scope coherence — chapter titles should relate to the course title
 * 3. Section density — chapters should have sections with key topics
 * 4. Goal alignment — course goals should be reflected in the blueprint
 */
export function runCoherencePreflight(config: PreflightConfig): PreflightResult {
  const blueprint = config.teacherBlueprint;
  if (!blueprint || blueprint.chapters.length === 0) {
    return { score: 100, warnings: [], passed: true };
  }

  const warnings: string[] = [];
  let score = 100;

  // 1. Bloom's progression — penalize regressions
  const levels = blueprint.chapters.map(ch => BLOOMS_ORDER[ch.bloomsLevel.toUpperCase()] ?? 0);
  let regressions = 0;
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > 0 && levels[i - 1] > 0 && levels[i] < levels[i - 1]) {
      regressions++;
    }
  }
  if (regressions > 0) {
    score -= regressions * 10;
    warnings.push(`${regressions} Bloom's level regression(s) detected`);
  }

  // 2. Scope coherence — chapter titles should relate to the course title
  const titleWords = new Set(
    config.courseTitle.toLowerCase().split(/\s+/).filter(w => w.length > 3),
  );
  let offTopic = 0;
  for (const ch of blueprint.chapters) {
    const chWords = ch.title.toLowerCase().split(/\s+/);
    const goalWords = ch.goal.toLowerCase().split(/\s+/);
    const hasOverlap = chWords.some(w => titleWords.has(w)) || goalWords.some(w => titleWords.has(w));
    if (!hasOverlap) offTopic++;
  }
  if (offTopic > blueprint.chapters.length * 0.4) {
    score -= 15;
    warnings.push(`${offTopic}/${blueprint.chapters.length} chapters appear off-topic`);
  }

  // 3. Section density — flag chapters with empty key topics
  const emptySections = blueprint.chapters.filter(ch =>
    ch.sections.some(s => s.keyTopics.length === 0),
  ).length;
  if (emptySections > 0) {
    score -= emptySections * 5;
    warnings.push(`${emptySections} chapter(s) have sections with no key topics`);
  }

  // 4. Goal alignment — check if course goals are reflected in the blueprint
  if (config.courseGoals.length > 0) {
    const allText = blueprint.chapters.map(ch =>
      `${ch.title} ${ch.goal} ${ch.sections.map(s => s.title).join(' ')}`,
    ).join(' ').toLowerCase();
    const unmatchedGoals = config.courseGoals.filter(goal => {
      const goalWords = goal.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      return goalWords.length > 0 && !goalWords.some(w => allText.includes(w));
    });
    if (unmatchedGoals.length > 0) {
      score -= unmatchedGoals.length * 8;
      warnings.push(`${unmatchedGoals.length} course goal(s) not reflected in blueprint`);
    }
  }

  const finalScore = Math.max(0, Math.min(100, score));
  return { score: finalScore, warnings, passed: finalScore >= PREFLIGHT_PASS_THRESHOLD };
}
