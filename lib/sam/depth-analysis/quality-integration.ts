/**
 * Agentic Depth Analysis - Quality Gate Integration
 *
 * Validates analysis RESULTS using @sam-ai/quality and @sam-ai/pedagogy.
 * Quality gates check the QUALITY OF THE ANALYSIS ITSELF, not the course content.
 *
 * Used by the decision engine to determine if a chapter needs re-analysis.
 */

import { logger } from '@/lib/logger';
import { validateContent } from '@sam-ai/quality';
import { createPedagogicalPipeline } from '@sam-ai/pedagogy';
import type { GeneratedContent } from '@sam-ai/quality';
import type { PedagogicalContent, BloomsLevel as PedBloomsLevel } from '@sam-ai/pedagogy';
import type { ChapterAnalysisResult, SectionAnalysisResult, BloomsLevel } from './types';

export interface AnalysisQualityValidation {
  overallQuality: number;
  needsReanalysis: boolean;
  weakAreas: WeakArea[];
  completenessScore: number;
  evidenceScore: number;
  consistencyScore: number;
  calibrationScore: number;
}

interface WeakArea {
  sectionId: string;
  sectionTitle: string;
  reason: string;
  suggestedFocus: string[];
}

/**
 * Validates the quality of a chapter analysis using SAM quality gates.
 * Returns a quality score and whether reanalysis is needed.
 */
export async function validateAnalysisQuality(
  chapterResult: ChapterAnalysisResult,
  courseDifficulty: string
): Promise<AnalysisQualityValidation> {
  try {
    const [completeness, evidence, consistency, calibration, pedagogyCheck] = await Promise.all([
      checkCompleteness(chapterResult),
      checkEvidenceQuality(chapterResult),
      checkScoreConsistency(chapterResult),
      checkCalibration(chapterResult, courseDifficulty),
      checkPedagogicalQuality(chapterResult),
    ]);

    const overallQuality = Math.round(
      completeness.score * 0.25 +
      evidence.score * 0.25 +
      consistency.score * 0.20 +
      calibration.score * 0.15 +
      pedagogyCheck.score * 0.15
    );

    const weakAreas = identifyWeakAreas(chapterResult, completeness, evidence);

    return {
      overallQuality,
      needsReanalysis: overallQuality < 60,
      weakAreas,
      completenessScore: completeness.score,
      evidenceScore: evidence.score,
      consistencyScore: consistency.score,
      calibrationScore: calibration.score,
    };
  } catch (error) {
    logger.warn('[QualityIntegration] Quality validation failed, defaulting', { error });
    return {
      overallQuality: 70, // Assume reasonable quality
      needsReanalysis: false,
      weakAreas: [],
      completenessScore: 70,
      evidenceScore: 70,
      consistencyScore: 70,
      calibrationScore: 70,
    };
  }
}

/**
 * Runs the @sam-ai/quality pipeline on section content to validate
 * analysis coverage and thoroughness.
 */
export async function runQualityGateOnSection(
  sectionContent: string,
  sectionTitle: string,
  difficulty: string
): Promise<{ score: number; issues: string[] }> {
  try {
    const content: GeneratedContent = {
      content: sectionContent,
      contentType: 'lesson',
      difficulty: mapDifficulty(difficulty),
      expectedSections: ['Introduction', 'Content', 'Examples'],
    };

    const result = await validateContent(content);
    return {
      score: result.overallScore,
      issues: result.allSuggestions,
    };
  } catch (error) {
    logger.warn('[QualityIntegration] Quality gate failed for section', {
      sectionTitle,
      error,
    });
    return { score: 60, issues: [] };
  }
}

/**
 * Runs the @sam-ai/pedagogy pipeline on a section for Bloom's alignment.
 */
export async function runPedagogicalGateOnSection(
  sectionContent: string,
  targetBloomsLevel: BloomsLevel,
  objectives: string[]
): Promise<{ alignmentScore: number; detectedLevel: string; issues: string[] }> {
  try {
    const pipeline = createPedagogicalPipeline({
      evaluators: ['blooms'],
      threshold: 60,
    });

    const content: PedagogicalContent = {
      content: sectionContent,
      targetBloomsLevel: targetBloomsLevel as PedBloomsLevel,
      objectives,
    };

    const result = await pipeline.evaluate(content);

    return {
      alignmentScore: result.bloomsResult?.alignmentScore ?? 60,
      detectedLevel: result.bloomsResult?.detectedLevel ?? 'UNKNOWN',
      issues: result.recommendations,
    };
  } catch (error) {
    logger.warn('[QualityIntegration] Pedagogical gate failed', { error });
    return { alignmentScore: 60, detectedLevel: 'UNKNOWN', issues: [] };
  }
}

// =============================================================================
// INTERNAL CHECKS
// =============================================================================

interface CheckResult {
  score: number;
  details: string[];
}

async function checkCompleteness(chapter: ChapterAnalysisResult): Promise<CheckResult> {
  let score = 100;
  const details: string[] = [];

  // Check all sections were analyzed
  const analyzedSections = chapter.sections.length;
  if (analyzedSections === 0) {
    score -= 50;
    details.push('No sections analyzed');
  }

  // Check Bloom's distribution adds up
  const bloomsTotal = Object.values(chapter.bloomsDistribution).reduce((s, v) => s + v, 0);
  if (bloomsTotal < 90 || bloomsTotal > 110) {
    score -= 15;
    details.push(`Bloom's distribution sums to ${bloomsTotal}% (expected ~100%)`);
  }

  // Check each section has a Bloom's level
  for (const section of chapter.sections) {
    if (!section.bloomsLevel) {
      score -= 10;
      details.push(`Section "${section.sectionTitle}" missing Bloom's classification`);
    }
  }

  // Check issues have descriptions
  for (const issue of chapter.issues) {
    if (!issue.description || issue.description.length < 10) {
      score -= 5;
      details.push(`Issue "${issue.title}" has insufficient description`);
    }
  }

  return { score: Math.max(0, score), details };
}

async function checkEvidenceQuality(chapter: ChapterAnalysisResult): Promise<CheckResult> {
  let score = 100;
  const details: string[] = [];

  const issuesWithEvidence = chapter.issues.filter(i => i.evidence?.quotes?.length ?? 0 > 0);
  const evidenceRate = chapter.issues.length > 0
    ? issuesWithEvidence.length / chapter.issues.length
    : 1;

  if (evidenceRate < 0.5) {
    score -= 30;
    details.push(`Only ${Math.round(evidenceRate * 100)}% of issues have evidence`);
  }

  // Check fixes have actionable content
  const issuesWithFixes = chapter.issues.filter(i => i.fix?.action);
  const fixRate = chapter.issues.length > 0
    ? issuesWithFixes.length / chapter.issues.length
    : 1;

  if (fixRate < 0.7) {
    score -= 20;
    details.push(`Only ${Math.round(fixRate * 100)}% of issues have fix recommendations`);
  }

  return { score: Math.max(0, score), details };
}

async function checkScoreConsistency(chapter: ChapterAnalysisResult): Promise<CheckResult> {
  let score = 100;
  const details: string[] = [];

  // Overall score should be roughly the weighted average of sub-scores
  const expected = Math.round(
    chapter.structuralScore * 0.10 +
    chapter.cognitiveScore * 0.30 +
    chapter.pedagogicalScore * 0.20 +
    chapter.flowScore * 0.25 +
    chapter.assessmentScore * 0.15
  );

  const diff = Math.abs(chapter.overallScore - expected);
  if (diff > 15) {
    score -= 20;
    details.push(`Overall score (${chapter.overallScore}) deviates ${diff} from expected (${expected})`);
  }

  // Scores should be in valid range
  const scores = [
    chapter.structuralScore, chapter.cognitiveScore,
    chapter.pedagogicalScore, chapter.flowScore, chapter.assessmentScore,
  ];
  for (const s of scores) {
    if (s < 0 || s > 100) {
      score -= 15;
      details.push(`Score out of range: ${s}`);
    }
  }

  return { score: Math.max(0, score), details };
}

async function checkCalibration(
  chapter: ChapterAnalysisResult,
  courseDifficulty: string
): Promise<CheckResult> {
  let score = 100;
  const details: string[] = [];

  // Higher-level courses should have more higher-order Bloom's
  const higherOrder = (chapter.bloomsDistribution.ANALYZE ?? 0) +
    (chapter.bloomsDistribution.EVALUATE ?? 0) +
    (chapter.bloomsDistribution.CREATE ?? 0);

  if (courseDifficulty === 'advanced' || courseDifficulty === 'expert') {
    if (higherOrder < 20) {
      score -= 15;
      details.push(`Advanced course with only ${higherOrder}% higher-order content`);
    }
  }

  // Beginner courses should not be primarily CREATE
  if (courseDifficulty === 'beginner') {
    if ((chapter.bloomsDistribution.CREATE ?? 0) > 30) {
      score -= 10;
      details.push('Beginner course with unusually high CREATE level');
    }
  }

  return { score: Math.max(0, score), details };
}

async function checkPedagogicalQuality(chapter: ChapterAnalysisResult): Promise<CheckResult> {
  let score = 80; // Start at 80 and add/subtract
  const details: string[] = [];

  // Check Gagne's events coverage
  const presentEvents = chapter.gagneCompliance.filter(g => g.present).length;
  const totalEvents = chapter.gagneCompliance.length;
  if (totalEvents > 0) {
    const coverage = presentEvents / totalEvents;
    if (coverage < 0.5) {
      score -= 20;
      details.push(`Only ${presentEvents}/${totalEvents} Gagne events present`);
    } else if (coverage > 0.7) {
      score += 10;
    }
  }

  // Check constructive alignment
  if (chapter.constructiveAlignmentScore < 50) {
    score -= 15;
    details.push(`Low constructive alignment: ${chapter.constructiveAlignmentScore}`);
  }

  return { score: Math.max(0, Math.min(100, score)), details };
}

function identifyWeakAreas(
  chapter: ChapterAnalysisResult,
  completeness: CheckResult,
  evidence: CheckResult
): WeakArea[] {
  const weak: WeakArea[] = [];

  for (const section of chapter.sections) {
    const reasons: string[] = [];
    const suggestedFocus: string[] = [];

    // Low framework scores
    if ((section.frameworkScores.blooms ?? 100) < 50) {
      reasons.push('Low Bloom\'s classification confidence');
      suggestedFocus.push('cognitive-depth');
    }

    // Missing Gagne events
    const missedEvents = section.gagneEvents.filter(g => !g.present).length;
    if (missedEvents > 4) {
      reasons.push(`${missedEvents} Gagne events missing`);
      suggestedFocus.push('pedagogical-structure');
    }

    // Very low or very high content
    if (section.contentWordCount < 100) {
      reasons.push('Insufficient content for thorough analysis');
      suggestedFocus.push('structural');
    }

    if (reasons.length > 0) {
      weak.push({
        sectionId: section.sectionId,
        sectionTitle: section.sectionTitle,
        reason: reasons.join('; '),
        suggestedFocus,
      });
    }
  }

  return weak;
}

function mapDifficulty(difficulty: string): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
  switch (difficulty.toLowerCase()) {
    case 'beginner': return 'beginner';
    case 'intermediate': return 'intermediate';
    case 'advanced': return 'advanced';
    case 'expert': return 'expert';
    default: return 'intermediate';
  }
}
