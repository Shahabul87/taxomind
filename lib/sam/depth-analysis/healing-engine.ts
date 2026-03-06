/**
 * Agentic Depth Analysis - Healing Engine
 *
 * Re-analyzes flagged chapters/sections with targeted prompts.
 * The healing engine is called when the decision engine determines
 * a chapter needs deeper analysis or has quality issues.
 *
 * Healing modes:
 * 1. Deep-dive: Re-analyze specific weak sections with focused prompts
 * 2. Reanalyze: Full re-analysis of prior chapters that have prerequisite gaps
 * 3. Flag-healing: Targeted re-analysis of sections with CRITICAL issues
 */

import { logger } from '@/lib/logger';
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import { withRetryableTimeout, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import type {
  ChapterAnalysisResult,
  SectionAnalysisResult,
  AnalysisIssue,
  BloomsDistribution,
  SSEEmitter,
  AgenticDecision,
} from './types';
import { generateIssueFingerprint } from './orchestrator';

export interface HealingResult {
  chapterNumber: number;
  healedSections: string[];
  issuesAdded: number;
  issuesRefined: number;
  scoreChange: number;
  mergedResult: ChapterAnalysisResult;
}

/**
 * Heals a chapter by re-analyzing specific weak sections.
 * Called when decision engine returns 'deep-dive' or 'flag-healing'.
 */
export async function healChapter(
  userId: string,
  chapterResult: ChapterAnalysisResult,
  decision: AgenticDecision,
  emitSSE: SSEEmitter
): Promise<HealingResult> {
  const chapterNumber = decision.chapterNumber;

  emitSSE('healing_start', {
    chapterNumber,
    action: decision.action,
    reason: 'reason' in decision ? decision.reason : 'Quality improvement',
  });

  try {
    let targetSectionIds: string[] = [];

    if (decision.action === 'deep-dive' && 'sections' in decision) {
      targetSectionIds = decision.sections;
    } else if (decision.action === 'flag-healing' && 'issues' in decision) {
      // Find sections that contain the flagged issues
      const flaggedFingerprints = new Set(decision.issues);
      targetSectionIds = chapterResult.sections
        .filter(s => s.issues.some(i => flaggedFingerprints.has(i.fingerprint)))
        .map(s => s.sectionId);
    }

    // If no specific sections, re-analyze the weakest ones
    if (targetSectionIds.length === 0) {
      targetSectionIds = chapterResult.sections
        .sort((a, b) => getWeakestScore(a) - getWeakestScore(b))
        .slice(0, Math.min(3, chapterResult.sections.length))
        .map(s => s.sectionId);
    }

    const targetSections = chapterResult.sections.filter(
      s => targetSectionIds.includes(s.sectionId)
    );

    if (targetSections.length === 0) {
      logger.warn('[HealingEngine] No target sections to heal', { chapterNumber });
      return {
        chapterNumber,
        healedSections: [],
        issuesAdded: 0,
        issuesRefined: 0,
        scoreChange: 0,
        mergedResult: chapterResult,
      };
    }

    // Build healing context from original result
    const originalIssuesSummary = chapterResult.issues
      .filter(i => i.severity === 'CRITICAL' || i.severity === 'MODERATE')
      .slice(0, 10)
      .map(i => `- [${i.severity}] ${i.title}: ${i.description}`)
      .join('\n');

    const sectionsToHeal = targetSections.map(s =>
      `Section: "${s.sectionTitle}" (Position: ${s.sectionPosition})\n` +
      `Current Bloom's: ${s.bloomsLevel}\n` +
      `Issues: ${s.issues.length}\n` +
      `Word Count: ${s.contentWordCount}`
    ).join('\n---\n');

    const healingPrompt = buildHealingPrompt(
      chapterResult.chapterTitle,
      sectionsToHeal,
      originalIssuesSummary,
      'reason' in decision ? decision.reason : ''
    );

    // Run targeted AI analysis
    const response = await withRetryableTimeout(
      () => runSAMChatWithPreference({
        userId,
        capability: 'analysis',
        messages: [{ role: 'user', content: healingPrompt }],
        maxTokens: 2000,
        temperature: 0.3,
      }),
      TIMEOUT_DEFAULTS.AI_ANALYSIS,
      'healing-analysis'
    );

    const healingData = parseHealingResponse(response);

    // Merge healing results with original
    const mergedResult = mergeHealingResults(chapterResult, healingData, targetSectionIds);

    const scoreChange = mergedResult.overallScore - chapterResult.overallScore;
    const issuesAdded = mergedResult.issues.length - chapterResult.issues.length;

    emitSSE('healing_complete', {
      chapterNumber,
      healedSections: targetSectionIds,
      issuesAdded: Math.max(0, issuesAdded),
      issuesRefined: healingData.refinedIssues?.length ?? 0,
      scoreChange,
      newScore: mergedResult.overallScore,
    });

    logger.info('[HealingEngine] Healing complete', {
      chapterNumber,
      healedSections: targetSectionIds.length,
      scoreChange,
      issuesAdded,
    });

    return {
      chapterNumber,
      healedSections: targetSectionIds,
      issuesAdded: Math.max(0, issuesAdded),
      issuesRefined: healingData.refinedIssues?.length ?? 0,
      scoreChange,
      mergedResult,
    };
  } catch (error) {
    logger.warn('[HealingEngine] Healing failed, returning original result', {
      chapterNumber,
      error,
    });

    emitSSE('healing_complete', {
      chapterNumber,
      healedSections: [],
      issuesAdded: 0,
      issuesRefined: 0,
      scoreChange: 0,
      error: error instanceof Error ? error.message : 'Healing failed',
    });

    return {
      chapterNumber,
      healedSections: [],
      issuesAdded: 0,
      issuesRefined: 0,
      scoreChange: 0,
      mergedResult: chapterResult,
    };
  }
}

// =============================================================================
// PROMPT BUILDING
// =============================================================================

function buildHealingPrompt(
  chapterTitle: string,
  sectionsToHeal: string,
  originalIssuesSummary: string,
  healingReason: string
): string {
  return `You are Dr. Sarah Chen, performing a TARGETED RE-ANALYSIS of specific sections.

## Chapter: "${chapterTitle}"

## Healing Reason:
${healingReason || 'Quality improvement needed'}

## Original Issues Found:
${originalIssuesSummary || 'None documented'}

## Sections to Re-Analyze:
${sectionsToHeal}

## Instructions:
1. Look deeper into these specific sections
2. Identify issues that may have been missed in the initial analysis
3. Refine severity ratings based on deeper inspection
4. Provide more specific evidence and fix recommendations

Respond with ONLY valid JSON:
{
  "refinedIssues": [
    {
      "sectionTitle": "...",
      "type": "DEPTH|PEDAGOGICAL|CONTENT|STRUCTURE",
      "severity": "CRITICAL|MODERATE|MINOR|INFO",
      "title": "...",
      "description": "...",
      "evidence": "...",
      "fix": { "action": "...", "what": "...", "why": "...", "how": "..." }
    }
  ],
  "newIssues": [
    {
      "sectionTitle": "...",
      "type": "...",
      "severity": "...",
      "title": "...",
      "description": "...",
      "evidence": "...",
      "fix": { "action": "...", "what": "...", "why": "...", "how": "..." }
    }
  ],
  "scoreAdjustments": {
    "cognitiveAdjustment": 0,
    "pedagogicalAdjustment": 0,
    "overallAdjustment": 0
  },
  "insights": "Brief summary of what the deeper analysis revealed"
}`;
}

// =============================================================================
// RESPONSE PARSING
// =============================================================================

interface HealingData {
  refinedIssues: HealingIssue[];
  newIssues: HealingIssue[];
  scoreAdjustments: {
    cognitiveAdjustment: number;
    pedagogicalAdjustment: number;
    overallAdjustment: number;
  };
  insights: string;
}

interface HealingIssue {
  sectionTitle: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  evidence: string;
  fix?: { action: string; what: string; why: string; how: string };
}

function parseHealingResponse(response: string): HealingData {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        refinedIssues: parsed.refinedIssues ?? [],
        newIssues: parsed.newIssues ?? [],
        scoreAdjustments: {
          cognitiveAdjustment: clamp(parsed.scoreAdjustments?.cognitiveAdjustment ?? 0, -20, 20),
          pedagogicalAdjustment: clamp(parsed.scoreAdjustments?.pedagogicalAdjustment ?? 0, -20, 20),
          overallAdjustment: clamp(parsed.scoreAdjustments?.overallAdjustment ?? 0, -15, 15),
        },
        insights: parsed.insights ?? '',
      };
    }
  } catch {
    // Fall through
  }

  return {
    refinedIssues: [],
    newIssues: [],
    scoreAdjustments: { cognitiveAdjustment: 0, pedagogicalAdjustment: 0, overallAdjustment: 0 },
    insights: '',
  };
}

// =============================================================================
// MERGING
// =============================================================================

function mergeHealingResults(
  original: ChapterAnalysisResult,
  healing: HealingData,
  healedSectionIds: string[]
): ChapterAnalysisResult {
  const merged = { ...original };

  // Apply score adjustments (clamped to valid range)
  merged.cognitiveScore = clamp(
    original.cognitiveScore + healing.scoreAdjustments.cognitiveAdjustment,
    0, 100
  );
  merged.pedagogicalScore = clamp(
    original.pedagogicalScore + healing.scoreAdjustments.pedagogicalAdjustment,
    0, 100
  );
  merged.overallScore = clamp(
    original.overallScore + healing.scoreAdjustments.overallAdjustment,
    0, 100
  );

  // Add new issues with fingerprints
  const newIssues: AnalysisIssue[] = healing.newIssues.map(hi => ({
    fingerprint: generateIssueFingerprint(hi.type, hi.sectionTitle, hi.title),
    type: hi.type as AnalysisIssue['type'],
    severity: hi.severity as AnalysisIssue['severity'],
    framework: 'healing',
    title: hi.title,
    description: hi.description,
    chapterId: original.chapterId,
    chapterTitle: original.chapterTitle,
    chapterPosition: original.chapterNumber,
    evidence: hi.evidence ? { context: hi.evidence } : undefined,
    fix: hi.fix ? {
      action: hi.fix.action,
      what: hi.fix.what,
      why: hi.fix.why,
      how: hi.fix.how,
    } : undefined,
  }));

  // Deduplicate: don't add issues with same fingerprint
  const existingFingerprints = new Set(original.issues.map(i => i.fingerprint));
  const uniqueNewIssues = newIssues.filter(i => !existingFingerprints.has(i.fingerprint));

  merged.issues = [...original.issues, ...uniqueNewIssues];

  // Mark as healed
  merged.needsHealing = false;
  merged.healingReason = undefined;

  return merged;
}

// =============================================================================
// HELPERS
// =============================================================================

function getWeakestScore(section: SectionAnalysisResult): number {
  const scores = Object.values(section.frameworkScores).filter(
    (v): v is number => typeof v === 'number'
  );
  if (scores.length === 0) return 50;
  return Math.min(...scores);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
