/**
 * Agentic Depth Analysis - Cross-Chapter Analyzer
 *
 * Analyzes relationships and flow across all chapters.
 * Runs after per-chapter analysis is complete.
 */

import { logger } from '@/lib/logger';
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import { withRetryableTimeout, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { generateIssueFingerprint } from './orchestrator';
import type {
  CourseDataForAnalysis,
  ChapterAnalysisResult,
  CrossChapterResult,
  KnowledgeFlowIssue,
  ProgressionIssue,
  ConceptDependency,
  SSEEmitter,
  BloomsLevel,
} from './types';

export async function runCrossChapterAnalysis(
  userId: string,
  courseData: CourseDataForAnalysis,
  chapterResults: ChapterAnalysisResult[],
  emitSSE: SSEEmitter
): Promise<CrossChapterResult> {
  const defaultResult: CrossChapterResult = {
    flowScore: 0,
    consistencyScore: 0,
    progressionScore: 0,
    knowledgeFlowIssues: [],
    progressionIssues: [{
      type: 'INCONSISTENT_STYLE',
      fromChapter: 1,
      toChapter: chapterResults.length,
      dimension: 'analysis_coverage',
      description: 'Cross-chapter AI analysis was unavailable. Flow, consistency, and progression scores could not be determined.',
      severity: 'INFO',
    }],
    terminologyConsistency: 0,
    difficultyProgression: chapterResults.map(c => c.overallScore),
    conceptDependencyGraph: [],
    dataSource: 'fallback',
  };

  try {
    // Build cross-chapter summary
    const chapterSummaries = chapterResults.map(c => {
      const topBlooms = getTopBloomsLevels(c.bloomsDistribution);
      return `Chapter ${c.chapterNumber}: "${c.chapterTitle}" | Score: ${c.overallScore}/100 | Bloom's: ${topBlooms} | Issues: ${c.issues.length}`;
    }).join('\n');

    const prompt = `You are an expert instructional designer analyzing CROSS-CHAPTER COHERENCE.

## Course: "${courseData.title}" (${courseData.difficulty} level)
## Chapter Summary:
${chapterSummaries}

## Analyze:
1. KNOWLEDGE FLOW: Do concepts build logically from chapter to chapter?
2. BLOOM'S PROGRESSION: Does cognitive complexity increase appropriately?
3. CONSISTENCY: Is the style, depth, and quality consistent?
4. GAPS: Are there missing topics between chapters?

Respond with ONLY valid JSON:
{
  "flowScore": 75,
  "consistencyScore": 80,
  "progressionScore": 70,
  "knowledgeFlowIssues": [
    { "type": "MISSING_PREREQUISITE", "concept": "...", "sourceChapter": 1, "targetChapter": 3, "severity": "MODERATE", "description": "..." }
  ],
  "progressionIssues": [
    { "type": "REGRESSION", "fromChapter": 3, "toChapter": 4, "dimension": "cognitive_level", "description": "...", "severity": "MINOR" }
  ],
  "terminologyConsistency": 85,
  "overallInsights": "Brief summary of cross-chapter quality"
}`;

    const response = await withRetryableTimeout(
      () => runSAMChatWithPreference({
        userId,
        capability: 'analysis',
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 2500,
        temperature: 0.3,
      }),
      TIMEOUT_DEFAULTS.AI_ANALYSIS,
      'cross-chapter-analysis'
    );

    const parsed = parseJSONResponse(response);
    if (Object.keys(parsed).length === 0) {
      throw new Error('Failed to parse cross-chapter analysis response');
    }

    const result: CrossChapterResult = {
      flowScore: parsed.flowScore ?? 60,
      consistencyScore: parsed.consistencyScore ?? 60,
      progressionScore: parsed.progressionScore ?? 60,
      knowledgeFlowIssues: (parsed.knowledgeFlowIssues ?? []).map((i: Record<string, unknown>) => ({
        type: (i.type as string) ?? 'MISSING_PREREQUISITE',
        concept: (i.concept as string) ?? '',
        sourceChapter: (i.sourceChapter as number) ?? 0,
        targetChapter: (i.targetChapter as number) ?? 0,
        severity: (i.severity as string) ?? 'MODERATE',
        description: (i.description as string) ?? '',
      })) as KnowledgeFlowIssue[],
      progressionIssues: (parsed.progressionIssues ?? []).map((i: Record<string, unknown>) => ({
        type: (i.type as string) ?? 'REGRESSION',
        fromChapter: (i.fromChapter as number) ?? 0,
        toChapter: (i.toChapter as number) ?? 0,
        dimension: (i.dimension as string) ?? '',
        description: (i.description as string) ?? '',
        severity: (i.severity as string) ?? 'MINOR',
      })) as ProgressionIssue[],
      terminologyConsistency: parsed.terminologyConsistency ?? 70,
      difficultyProgression: chapterResults.map(c => c.overallScore),
      conceptDependencyGraph: [],
      dataSource: 'ai',
    };

    // Emit flow issues
    for (const issue of result.knowledgeFlowIssues) {
      emitSSE('flow_issue_found', {
        type: issue.type,
        concept: issue.concept,
        sourceChapter: issue.sourceChapter,
        targetChapter: issue.targetChapter,
        severity: issue.severity,
      });
    }

    // Detect Bloom's progression issues from data
    for (let i = 1; i < chapterResults.length; i++) {
      const prev = chapterResults[i - 1];
      const curr = chapterResults[i];
      const prevHigher = (prev.bloomsDistribution.ANALYZE ?? 0) + (prev.bloomsDistribution.EVALUATE ?? 0) + (prev.bloomsDistribution.CREATE ?? 0);
      const currHigher = (curr.bloomsDistribution.ANALYZE ?? 0) + (curr.bloomsDistribution.EVALUATE ?? 0) + (curr.bloomsDistribution.CREATE ?? 0);

      if (prevHigher > currHigher + 15) {
        result.progressionIssues.push({
          type: 'REGRESSION',
          fromChapter: prev.chapterNumber,
          toChapter: curr.chapterNumber,
          dimension: 'cognitive_level',
          description: `Higher-order content drops from ${prevHigher}% to ${currHigher}% between chapters ${prev.chapterNumber} and ${curr.chapterNumber}.`,
          severity: 'MINOR',
        });
      }
    }

    logger.info('[CrossChapter] Analysis complete', {
      flowScore: result.flowScore,
      flowIssues: result.knowledgeFlowIssues.length,
      progressionIssues: result.progressionIssues.length,
    });

    return result;
  } catch (error) {
    logger.warn('[CrossChapter] Analysis failed, returning defaults', { error });
    return defaultResult;
  }
}

function getTopBloomsLevels(dist: Record<string, number>): string {
  return Object.entries(dist)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([level, pct]) => `${level} ${pct}%`)
    .join(', ');
}

function parseJSONResponse(response: string): Record<string, unknown> {
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch { /* fallthrough */ }
  }
  try { return JSON.parse(response); } catch { return {}; }
}
