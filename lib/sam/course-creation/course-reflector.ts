/**
 * Course Reflector — Post-Generation Structural Analysis
 *
 * After all chapters are generated, reflects on the full course to identify
 * structural issues and produce a quality report. This is NOT an AI call —
 * it's a deterministic structural analysis of the generated data.
 *
 * Checks:
 * 1. Bloom's progression (monotonic or justifiable)
 * 2. Concept coherence (no orphans, no missing prerequisites)
 * 3. Cross-chapter quality (identifies outlier chapters)
 * 4. Blueprint alignment (plan vs reality comparison)
 *
 * Returns a CourseReflection that gets:
 * - Emitted as an SSE event for the UI
 * - Stored in the SAM Goal metadata for future reference
 * - Used to flag chapters for regeneration
 */

import 'server-only';

import { logger } from '@/lib/logger';
import type {
  CompletedChapter,
  ConceptTracker,
  CourseContext,
  CourseBlueprintPlan,
  CourseReflection,
  QualityScore,
  BloomsLevel,
} from './types';
import { BLOOMS_LEVELS } from './types';

// ============================================================================
// Constants
// ============================================================================

/** Quality score threshold for flagging a chapter */
const LOW_QUALITY_FLAG_THRESHOLD = 55;

/** Standard deviation multiplier for outlier detection */
const OUTLIER_SIGMA = 1.5;

// ============================================================================
// Public API
// ============================================================================

/**
 * Reflect on a completed course — pure structural analysis, no AI calls.
 *
 * Returns a CourseReflection with coherence score, progression analysis,
 * concept coverage, flagged chapters, and a human-readable summary.
 */
export function reflectOnCourse(
  completedChapters: CompletedChapter[],
  conceptTracker: ConceptTracker,
  courseContext: CourseContext,
  qualityScores: QualityScore[],
  blueprint?: CourseBlueprintPlan,
): CourseReflection {
  // 1. Analyze Bloom's progression
  const bloomsResult = analyzeBloomsProgression(completedChapters);

  // 2. Analyze concept coverage
  const conceptResult = analyzeConceptCoverage(completedChapters, conceptTracker, blueprint);

  // 3. Identify flagged chapters
  const flaggedChapters = identifyFlaggedChapters(
    completedChapters,
    qualityScores,
    bloomsResult,
    conceptResult,
  );

  // 4. Calculate coherence score
  const coherenceScore = calculateCoherenceScore(
    bloomsResult,
    conceptResult,
    flaggedChapters,
    completedChapters.length,
  );

  // 5. Generate summary
  const summary = buildSummary(
    coherenceScore,
    bloomsResult,
    conceptResult,
    flaggedChapters,
    completedChapters.length,
    courseContext,
  );

  const reflection: CourseReflection = {
    coherenceScore,
    bloomsProgression: bloomsResult,
    conceptCoverage: conceptResult,
    flaggedChapters,
    summary,
  };

  logger.info('[CourseReflector] Course reflection complete', {
    coherenceScore,
    isMonotonic: bloomsResult.isMonotonic,
    totalConcepts: conceptResult.totalConcepts,
    orphanedConcepts: conceptResult.orphanedConcepts.length,
    flaggedChapters: flaggedChapters.length,
  });

  return reflection;
}

/**
 * AI-enhanced course reflection — hybrid approach.
 *
 * 1. Runs the rule-based reflectOnCourse() as baseline
 * 2. Makes a single LLM call with compact chapter summaries
 * 3. AI can adjust coherenceScore by ±15, add/remove flags, enrich summary
 * 4. Falls back to pure rule-based result if AI call fails
 */
export async function reflectOnCourseWithAI(
  userId: string,
  completedChapters: CompletedChapter[],
  conceptTracker: ConceptTracker,
  courseContext: CourseContext,
  qualityScores: QualityScore[],
  blueprint?: CourseBlueprintPlan,
): Promise<CourseReflection> {
  // 1. Get rule-based baseline
  const ruleBasedReflection = reflectOnCourse(
    completedChapters,
    conceptTracker,
    courseContext,
    qualityScores,
    blueprint,
  );

  try {
    const { runSAMChatWithPreference } = await import('@/lib/sam/ai-provider');

    // Build compact chapter summaries (~200 tokens per chapter)
    const chapterSummaries = completedChapters.map(ch => {
      const avgQuality = estimateChapterScores([ch], qualityScores.slice(-completedChapters.length * 10));
      return `Ch${ch.position}: "${ch.title}" | Bloom's: ${ch.bloomsLevel} | Topics: ${ch.keyTopics.slice(0, 3).join(', ')} | Sections: ${ch.sections.length} | Avg Quality: ${avgQuality[0] ?? 'N/A'}`;
    }).join('\n');

    const systemPrompt = `You are a course quality analyst. Given a course's structural analysis and chapter summaries, provide AI-enhanced reflection. Return ONLY valid JSON.`;

    const userPrompt = `Analyze this course and enhance the structural reflection.

## Course
- Title: "${courseContext.courseTitle}"
- Difficulty: ${courseContext.difficulty}
- Chapters: ${completedChapters.length}

## Chapter Summaries
${chapterSummaries}

## Rule-Based Analysis (Baseline)
- Coherence Score: ${ruleBasedReflection.coherenceScore}/100
- Bloom's Monotonic: ${ruleBasedReflection.bloomsProgression.isMonotonic}
- Bloom's Gaps: ${ruleBasedReflection.bloomsProgression.gaps.length}
- Orphaned Concepts: ${ruleBasedReflection.conceptCoverage.orphanedConcepts.join(', ') || 'none'}
- Flagged Chapters: ${ruleBasedReflection.flaggedChapters.map(f => `Ch${f.position} (${f.severity}: ${f.reason})`).join('; ') || 'none'}

## Task
Enhance this reflection with pedagogical insights. You may:
1. Adjust coherenceScore by up to ±15 points (must stay 0-100)
2. Add new flagged chapters with reasoning
3. Remove false-positive flags (list positions to remove)
4. Provide pedagogical insights (cross-chapter issues, redundancies, narrative gaps)
5. Enrich the summary

## Output Format (JSON only)
{
  "adjustedCoherenceScore": <number>,
  "additionalFlaggedChapters": [{"position": <number>, "reason": "<string>", "severity": "low|medium|high"}],
  "removeFlaggedPositions": [<number>],
  "enrichedSummary": "<string>",
  "pedagogicalInsights": ["<string>"]
}`;

    const responseText = await runSAMChatWithPreference({
      userId,
      capability: 'analysis',
      messages: [{ role: 'user', content: userPrompt }],
      systemPrompt,
      maxTokens: 800,
      temperature: 0.4,
    });

    // Parse AI response
    const cleaned = responseText
      .replace(/^```(?:json)?\s*/m, '')
      .replace(/```\s*$/m, '')
      .trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    // Apply adjustments with guardrails
    const baseScore = ruleBasedReflection.coherenceScore;
    let adjustedScore = baseScore;
    if (typeof parsed.adjustedCoherenceScore === 'number') {
      const delta = parsed.adjustedCoherenceScore - baseScore;
      // Clamp to ±15
      const clampedDelta = Math.max(-15, Math.min(15, delta));
      adjustedScore = Math.max(0, Math.min(100, baseScore + clampedDelta));
    }

    // Merge flagged chapters
    let mergedFlags = [...ruleBasedReflection.flaggedChapters];

    // Remove false positives
    if (Array.isArray(parsed.removeFlaggedPositions)) {
      const removeSet = new Set(
        (parsed.removeFlaggedPositions as unknown[]).filter((p): p is number => typeof p === 'number'),
      );
      mergedFlags = mergedFlags.filter(f => !removeSet.has(f.position));
    }

    // Add new flags
    if (Array.isArray(parsed.additionalFlaggedChapters)) {
      for (const flag of parsed.additionalFlaggedChapters as Array<Record<string, unknown>>) {
        if (
          typeof flag.position === 'number' &&
          typeof flag.reason === 'string' &&
          (flag.severity === 'low' || flag.severity === 'medium' || flag.severity === 'high') &&
          !mergedFlags.some(f => f.position === flag.position)
        ) {
          mergedFlags.push({
            position: flag.position,
            reason: flag.reason,
            severity: flag.severity,
          });
        }
      }
    }

    // Build enriched summary
    const insights = Array.isArray(parsed.pedagogicalInsights)
      ? (parsed.pedagogicalInsights as unknown[]).filter((i): i is string => typeof i === 'string')
      : [];
    const enrichedSummary = typeof parsed.enrichedSummary === 'string'
      ? parsed.enrichedSummary
      : ruleBasedReflection.summary;
    const finalSummary = insights.length > 0
      ? `${enrichedSummary} Pedagogical insights: ${insights.join('; ')}`
      : enrichedSummary;

    const aiReflection: CourseReflection = {
      coherenceScore: adjustedScore,
      bloomsProgression: ruleBasedReflection.bloomsProgression,
      conceptCoverage: ruleBasedReflection.conceptCoverage,
      flaggedChapters: mergedFlags,
      summary: finalSummary,
    };

    logger.info('[CourseReflector] AI-enhanced reflection complete', {
      ruleBasedScore: baseScore,
      adjustedScore,
      flagsAdded: mergedFlags.length - ruleBasedReflection.flaggedChapters.length,
      insightsCount: insights.length,
    });

    return aiReflection;
  } catch (error) {
    logger.warn('[CourseReflector] AI reflection failed, using rule-based fallback', {
      error: error instanceof Error ? error.message : String(error),
    });
    return ruleBasedReflection;
  }
}

// ============================================================================
// Bloom's Progression Analysis
// ============================================================================

interface BloomsProgressionResult {
  isMonotonic: boolean;
  gaps: Array<{ fromChapter: number; toChapter: number; issue: string }>;
}

function analyzeBloomsProgression(
  chapters: CompletedChapter[],
): BloomsProgressionResult {
  if (chapters.length <= 1) {
    return { isMonotonic: true, gaps: [] };
  }

  const gaps: BloomsProgressionResult['gaps'] = [];
  let isMonotonic = true;

  for (let i = 1; i < chapters.length; i++) {
    const prevLevel = chapters[i - 1].bloomsLevel;
    const currLevel = chapters[i].bloomsLevel;
    const prevIndex = BLOOMS_LEVELS.indexOf(prevLevel);
    const currIndex = BLOOMS_LEVELS.indexOf(currLevel);

    if (currIndex < prevIndex) {
      isMonotonic = false;
      gaps.push({
        fromChapter: chapters[i - 1].position,
        toChapter: chapters[i].position,
        issue: `Bloom's level decreased from ${prevLevel} (Ch${chapters[i - 1].position}) to ${currLevel} (Ch${chapters[i].position})`,
      });
    }

    // Check for large jumps (skipping 2+ levels)
    if (currIndex - prevIndex > 2) {
      gaps.push({
        fromChapter: chapters[i - 1].position,
        toChapter: chapters[i].position,
        issue: `Large Bloom's jump from ${prevLevel} to ${currLevel} — may lack scaffolding`,
      });
    }
  }

  return { isMonotonic, gaps };
}

// ============================================================================
// Concept Coverage Analysis
// ============================================================================

interface ConceptCoverageResult {
  totalConcepts: number;
  coveredByMultipleChapters: number;
  orphanedConcepts: string[];
  missingPrerequisites: string[];
}

function analyzeConceptCoverage(
  chapters: CompletedChapter[],
  conceptTracker: ConceptTracker,
  blueprint?: CourseBlueprintPlan,
): ConceptCoverageResult {
  // Build concept → chapters mapping
  const conceptChapters = new Map<string, Set<number>>();

  for (const chapter of chapters) {
    const concepts = [
      ...(chapter.conceptsIntroduced ?? []),
      ...chapter.keyTopics,
    ];

    for (const concept of concepts) {
      const key = concept.toLowerCase();
      if (!conceptChapters.has(key)) {
        conceptChapters.set(key, new Set());
      }
      conceptChapters.get(key)!.add(chapter.position);
    }

    // Also check section concepts
    for (const section of chapter.sections) {
      for (const concept of section.conceptsIntroduced ?? []) {
        const key = concept.toLowerCase();
        if (!conceptChapters.has(key)) {
          conceptChapters.set(key, new Set());
        }
        conceptChapters.get(key)!.add(chapter.position);
      }
    }
  }

  const totalConcepts = conceptChapters.size;
  let coveredByMultipleChapters = 0;
  const orphanedConcepts: string[] = [];

  for (const [concept, chapterSet] of conceptChapters) {
    if (chapterSet.size > 1) {
      coveredByMultipleChapters++;
    } else if (chapterSet.size === 1) {
      // A concept in only one chapter that isn't referenced elsewhere could be orphaned
      const chapterNum = Array.from(chapterSet)[0];
      // Only flag as orphaned if it appears only in a late chapter (no spiral curriculum)
      if (chapterNum > 1) {
        // Check if it references something from a prior chapter
        const isReferenced = chapters.some(ch => {
          if (ch.position <= chapterNum) return false;
          return ch.sections.some(sec =>
            (sec.conceptsReferenced ?? []).some(r => r.toLowerCase() === concept),
          );
        });
        if (!isReferenced) {
          orphanedConcepts.push(concept);
        }
      }
    }
  }

  // Check for missing prerequisites from blueprint
  const missingPrerequisites: string[] = [];
  if (blueprint) {
    for (const dep of blueprint.conceptDependencies) {
      const conceptKey = dep.concept.toLowerCase();
      const conceptChapterSet = conceptChapters.get(conceptKey);
      if (!conceptChapterSet) continue;

      const conceptFirstChapter = Math.min(...Array.from(conceptChapterSet));

      for (const prereq of dep.dependsOn) {
        const prereqKey = prereq.toLowerCase();
        const prereqChapterSet = conceptChapters.get(prereqKey);
        if (!prereqChapterSet) {
          missingPrerequisites.push(`${prereq} (prerequisite for ${dep.concept}) never introduced`);
        } else {
          const prereqFirstChapter = Math.min(...Array.from(prereqChapterSet));
          if (prereqFirstChapter > conceptFirstChapter) {
            missingPrerequisites.push(
              `${prereq} (Ch${prereqFirstChapter}) introduced after ${dep.concept} (Ch${conceptFirstChapter})`,
            );
          }
        }
      }
    }
  }

  return {
    totalConcepts,
    coveredByMultipleChapters,
    orphanedConcepts: orphanedConcepts.slice(0, 10),
    missingPrerequisites: missingPrerequisites.slice(0, 10),
  };
}

// ============================================================================
// Flagged Chapter Detection
// ============================================================================

function identifyFlaggedChapters(
  chapters: CompletedChapter[],
  qualityScores: QualityScore[],
  bloomsResult: BloomsProgressionResult,
  conceptResult: ConceptCoverageResult,
): CourseReflection['flaggedChapters'] {
  const flagged: CourseReflection['flaggedChapters'] = [];

  // Calculate average quality per chapter (approximate)
  // Quality scores accumulate: chapter score, then section scores, then detail scores
  // Each chapter contributes ~(1 + 2*sections) scores
  const chapterAvgScores = estimateChapterScores(chapters, qualityScores);

  // Flag chapters with low quality
  if (chapterAvgScores.length > 0) {
    const overallAvg = chapterAvgScores.reduce((a, b) => a + b, 0) / chapterAvgScores.length;
    const stdDev = Math.sqrt(
      chapterAvgScores.reduce((sum, s) => sum + (s - overallAvg) ** 2, 0) / chapterAvgScores.length,
    );

    for (let i = 0; i < chapters.length; i++) {
      const score = chapterAvgScores[i] ?? overallAvg;

      if (score < LOW_QUALITY_FLAG_THRESHOLD) {
        flagged.push({
          position: chapters[i].position,
          reason: `Quality score (${Math.round(score)}/100) below threshold`,
          severity: score < 40 ? 'high' : 'medium',
        });
      } else if (score < overallAvg - OUTLIER_SIGMA * stdDev && stdDev > 5) {
        flagged.push({
          position: chapters[i].position,
          reason: `Quality score (${Math.round(score)}/100) is an outlier (avg: ${Math.round(overallAvg)})`,
          severity: 'low',
        });
      }
    }
  }

  // Flag chapters involved in Bloom's regressions
  for (const gap of bloomsResult.gaps) {
    if (gap.issue.includes('decreased')) {
      const exists = flagged.some(f => f.position === gap.toChapter);
      if (!exists) {
        flagged.push({
          position: gap.toChapter,
          reason: gap.issue,
          severity: 'medium',
        });
      }
    }
  }

  return flagged;
}

/**
 * Estimate average quality scores per chapter from the quality scores array.
 *
 * If scores have `chapterNumber` metadata (new pipeline), groups precisely by it.
 * Otherwise falls back to position-based estimation for backward compatibility
 * with old checkpoint data.
 */
function estimateChapterScores(
  chapters: CompletedChapter[],
  qualityScores: QualityScore[],
): number[] {
  if (qualityScores.length === 0) return [];

  // Precise path: use chapterNumber metadata if available on any scores
  const hasChapterMetadata = qualityScores.some(s => s.chapterNumber !== undefined);

  if (hasChapterMetadata) {
    return chapters.map(ch => {
      const chapterScores = qualityScores.filter(s => s.chapterNumber === ch.position);
      if (chapterScores.length === 0) return 0;
      return chapterScores.reduce((sum, s) => sum + s.overall, 0) / chapterScores.length;
    });
  }

  // Fallback: position-based estimation (old checkpoint data)
  const result: number[] = [];
  let scoreIdx = 0;

  for (const chapter of chapters) {
    const sectionCount = chapter.sections.length;
    const scoresPerChapter = 1 + 2 * sectionCount; // chapter + sections + details
    const chapterScores = qualityScores.slice(scoreIdx, scoreIdx + scoresPerChapter);

    if (chapterScores.length > 0) {
      const avg = chapterScores.reduce((sum, s) => sum + s.overall, 0) / chapterScores.length;
      result.push(avg);
    }

    scoreIdx += scoresPerChapter;
  }

  return result;
}

// ============================================================================
// Coherence Score Calculation
// ============================================================================

function calculateCoherenceScore(
  bloomsResult: BloomsProgressionResult,
  conceptResult: ConceptCoverageResult,
  flaggedChapters: CourseReflection['flaggedChapters'],
  totalChapters: number,
): number {
  let score = 100;

  // Bloom's progression penalties
  if (!bloomsResult.isMonotonic) {
    score -= 10 * bloomsResult.gaps.filter(g => g.issue.includes('decreased')).length;
  }
  score -= 5 * bloomsResult.gaps.filter(g => g.issue.includes('Large')).length;

  // Concept coverage penalties
  const orphanRatio = conceptResult.totalConcepts > 0
    ? conceptResult.orphanedConcepts.length / conceptResult.totalConcepts
    : 0;
  score -= Math.round(orphanRatio * 20);

  // Missing prerequisites penalty
  score -= 5 * Math.min(conceptResult.missingPrerequisites.length, 4);

  // Bonus for concept reuse (spiral curriculum)
  const reuseRatio = conceptResult.totalConcepts > 0
    ? conceptResult.coveredByMultipleChapters / conceptResult.totalConcepts
    : 0;
  score += Math.round(reuseRatio * 10);

  // Flagged chapter penalties
  const flagRatio = totalChapters > 0 ? flaggedChapters.length / totalChapters : 0;
  score -= Math.round(flagRatio * 15);

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================================================
// Summary Generation
// ============================================================================

function buildSummary(
  coherenceScore: number,
  bloomsResult: BloomsProgressionResult,
  conceptResult: ConceptCoverageResult,
  flaggedChapters: CourseReflection['flaggedChapters'],
  totalChapters: number,
  courseContext: CourseContext,
): string {
  const lines: string[] = [];

  // Overall assessment
  if (coherenceScore >= 85) {
    lines.push(`Course "${courseContext.courseTitle}" shows strong coherence (${coherenceScore}/100).`);
  } else if (coherenceScore >= 70) {
    lines.push(`Course "${courseContext.courseTitle}" has good coherence (${coherenceScore}/100) with minor areas for improvement.`);
  } else {
    lines.push(`Course "${courseContext.courseTitle}" has coherence issues (${coherenceScore}/100) that may benefit from review.`);
  }

  // Bloom's progression
  if (bloomsResult.isMonotonic) {
    lines.push('Bloom\'s taxonomy progression is consistent across all chapters.');
  } else {
    const regressionCount = bloomsResult.gaps.filter(g => g.issue.includes('decreased')).length;
    lines.push(`${regressionCount} Bloom's level regression(s) detected.`);
  }

  // Concept coverage
  lines.push(`${conceptResult.totalConcepts} unique concepts introduced across ${totalChapters} chapters.`);
  if (conceptResult.coveredByMultipleChapters > 0) {
    lines.push(`${conceptResult.coveredByMultipleChapters} concepts appear in multiple chapters (good spiral curriculum).`);
  }
  if (conceptResult.orphanedConcepts.length > 0) {
    lines.push(`${conceptResult.orphanedConcepts.length} concept(s) appear only once and may need reinforcement.`);
  }

  // Flagged chapters
  if (flaggedChapters.length > 0) {
    const highSeverity = flaggedChapters.filter(f => f.severity === 'high');
    if (highSeverity.length > 0) {
      lines.push(`${highSeverity.length} chapter(s) flagged with high severity — consider regeneration.`);
    }
    const medium = flaggedChapters.filter(f => f.severity === 'medium');
    if (medium.length > 0) {
      lines.push(`${medium.length} chapter(s) flagged for review.`);
    }
  } else {
    lines.push('No chapters flagged for review.');
  }

  return lines.join(' ');
}
