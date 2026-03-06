/**
 * Agentic Depth Analysis - Post-Processor
 *
 * Handles semantic issue deduplication, prioritization, and analysis reflection.
 */

import { logger } from '@/lib/logger';
import { generateIssueFingerprint } from './orchestrator';
import type {
  ChapterAnalysisResult,
  CrossChapterResult,
  AnalysisIssue,
  AnalysisReflection,
  SSEEmitter,
} from './types';

export interface PostProcessingResult {
  deduplicatedIssues: AnalysisIssue[];
  reflection: AnalysisReflection | null;
}

export async function runPostProcessing(
  userId: string,
  analysisId: string,
  chapters: ChapterAnalysisResult[],
  crossResults: CrossChapterResult | null,
  allIssues: AnalysisIssue[],
  emitSSE: SSEEmitter
): Promise<PostProcessingResult> {
  // 1. Semantic deduplication
  emitSSE('post_processing', { stage: 'deduplication' });
  const deduplicatedIssues = deduplicateIssues(allIssues);

  logger.info('[PostProcessor] Deduplication complete', {
    original: allIssues.length,
    deduplicated: deduplicatedIssues.length,
    removed: allIssues.length - deduplicatedIssues.length,
  });

  // 2. Prioritization
  emitSSE('post_processing', { stage: 'prioritization' });
  const prioritizedIssues = prioritizeIssues(deduplicatedIssues);

  // 3. Generate reflection
  emitSSE('post_processing', { stage: 'reflection' });
  const reflection = generateReflection(chapters, crossResults, prioritizedIssues);

  return {
    deduplicatedIssues: prioritizedIssues,
    reflection,
  };
}

// =============================================================================
// SEMANTIC DEDUPLICATION
// =============================================================================

function deduplicateIssues(issues: AnalysisIssue[]): AnalysisIssue[] {
  const seen = new Map<string, AnalysisIssue>();

  for (const issue of issues) {
    // Use fingerprint as primary dedup key
    if (issue.fingerprint && seen.has(issue.fingerprint)) {
      // Keep the more detailed version
      const existing = seen.get(issue.fingerprint)!;
      if ((issue.description?.length ?? 0) > (existing.description?.length ?? 0)) {
        seen.set(issue.fingerprint, issue);
      }
      continue;
    }

    // Secondary dedup: same type + same location
    const locationKey = `${issue.type}|${issue.chapterId ?? ''}|${issue.sectionId ?? ''}`;
    if (seen.has(locationKey)) {
      const existing = seen.get(locationKey)!;
      // Keep higher severity
      const severityOrder = { CRITICAL: 4, MODERATE: 3, MINOR: 2, INFO: 1 };
      if ((severityOrder[issue.severity] ?? 0) > (severityOrder[existing.severity] ?? 0)) {
        seen.set(locationKey, issue);
      }
      continue;
    }

    const key = issue.fingerprint || locationKey;
    seen.set(key, issue);
  }

  return Array.from(seen.values());
}

// =============================================================================
// PRIORITIZATION
// =============================================================================

function prioritizeIssues(issues: AnalysisIssue[]): AnalysisIssue[] {
  const severityWeight: Record<string, number> = {
    CRITICAL: 100,
    MODERATE: 60,
    MINOR: 30,
    INFO: 10,
  };

  const typeWeight: Record<string, number> = {
    STRUCTURE: 1.5,
    CONTENT: 1.3,
    DEPTH: 1.4,
    ASSESSMENT: 1.3,
    FLOW: 1.2,
    PREREQUISITE: 1.2,
    PEDAGOGICAL: 1.1,
    OBJECTIVE: 1.1,
    GAP: 1.0,
    CONSISTENCY: 1.0,
    DUPLICATE: 0.9,
    TIME: 0.8,
    READABILITY: 0.8,
    ACCESSIBILITY: 0.7,
    LEARNER_EXPERIENCE: 0.7,
    FACTUAL: 1.5,
  };

  return [...issues].sort((a, b) => {
    const scoreA = (severityWeight[a.severity] ?? 10) * (typeWeight[a.type] ?? 1.0);
    const scoreB = (severityWeight[b.severity] ?? 10) * (typeWeight[b.type] ?? 1.0);
    return scoreB - scoreA;
  });
}

// =============================================================================
// REFLECTION
// =============================================================================

function generateReflection(
  chapters: ChapterAnalysisResult[],
  crossResults: CrossChapterResult | null,
  issues: AnalysisIssue[]
): AnalysisReflection {
  // Identify under-analyzed chapters (low analysis quality)
  const underAnalyzed = chapters
    .filter(c => c.analysisQuality < 60)
    .map(c => c.chapterNumber);

  // Identify cross-cutting patterns
  const patterns: string[] = [];

  // Check for consistent issue types across chapters
  const issueTypeCounts = new Map<string, number>();
  for (const issue of issues) {
    issueTypeCounts.set(issue.type, (issueTypeCounts.get(issue.type) ?? 0) + 1);
  }

  for (const [type, count] of issueTypeCounts) {
    if (count >= 3) {
      patterns.push(`${type} issues appear across ${count} locations - systemic pattern`);
    }
  }

  // Check for Bloom's imbalance
  const avgBlooms = chapters.reduce(
    (acc, c) => {
      for (const [level, pct] of Object.entries(c.bloomsDistribution)) {
        acc[level] = (acc[level] ?? 0) + pct / chapters.length;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  if ((avgBlooms.EVALUATE ?? 0) + (avgBlooms.CREATE ?? 0) < 15) {
    patterns.push('Course-wide deficit in higher-order thinking (Evaluate + Create < 15%)');
  }

  if ((avgBlooms.REMEMBER ?? 0) > 35) {
    patterns.push(`Over-reliance on recall/memorization (${Math.round(avgBlooms.REMEMBER ?? 0)}% Remember level)`);
  }

  // Compute confidence level
  const avgQuality = chapters.reduce((sum, c) => sum + c.analysisQuality, 0) / (chapters.length || 1);
  const hasAIResults = chapters.some(c => c.cognitiveScore > 0);
  const confidenceLevel = hasAIResults ? Math.min(0.9, avgQuality / 100) : 0.5;

  return {
    selfAssessment: `Analyzed ${chapters.length} chapters with ${issues.length} issues found. ${underAnalyzed.length > 0 ? `Chapters ${underAnalyzed.join(', ')} may need re-analysis.` : 'All chapters adequately analyzed.'}`,
    confidenceLevel,
    underAnalyzedChapters: underAnalyzed,
    calibrationNotes: `Average analysis quality: ${Math.round(avgQuality)}/100. ${hasAIResults ? 'AI-powered analysis used.' : 'Rule-based fallback only.'}`,
    crossCuttingPatterns: patterns,
  };
}
