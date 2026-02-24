/**
 * Factual Analyzer (Step 9 — AI-Only)
 *
 * AI-powered analyzer that extracts factual claims from course content and checks for:
 * - Unsupported claims (statistics without sources)
 * - Potentially outdated information (deprecated technology versions)
 * - Missing citations for data-driven claims
 *
 * Returns empty array if `aiEnabled: false`.
 * Zero cost in rule-based mode.
 */

import { logger } from '@/lib/logger';
import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';
import type { CourseInput, AnalysisIssue } from '../types';

const FACTUAL_SYSTEM_PROMPT = `You are a factual accuracy reviewer for educational course content.
Analyze the provided course content and identify:
1. Unsupported statistical claims (numbers/percentages without citation)
2. Potentially outdated technology references (deprecated versions, sunset services)
3. Misleading or oversimplified factual statements
4. Claims that would benefit from a citation or source

Respond with a JSON array of issues. Each issue:
{
  "chapterIndex": number,
  "sectionIndex": number,
  "claim": "the specific claim text",
  "concern": "UNSUPPORTED" | "OUTDATED" | "MISLEADING" | "NEEDS_CITATION",
  "severity": "HIGH" | "MEDIUM" | "LOW",
  "explanation": "why this is flagged",
  "suggestion": "how to fix it"
}

Only flag genuine concerns — do not flag general educational statements or well-known facts.
Respond ONLY with a valid JSON array, no markdown fences.`;

interface FactualConcern {
  chapterIndex: number;
  sectionIndex: number;
  claim: string;
  concern: 'UNSUPPORTED' | 'OUTDATED' | 'MISLEADING' | 'NEEDS_CITATION';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
  suggestion: string;
}

/**
 * Build a compact content summary for AI analysis.
 * Limits total size to avoid excessive token usage.
 */
function buildContentSummary(course: CourseInput): string {
  const MAX_SECTION_CHARS = 500;
  const parts: string[] = [`Course: ${course.title}`];

  for (let ci = 0; ci < course.chapters.length; ci++) {
    const ch = course.chapters[ci];
    parts.push(`\n## Chapter ${ci + 1}: ${ch.title}`);
    for (let si = 0; si < ch.sections.length; si++) {
      const sec = ch.sections[si];
      const content = [sec.description ?? '', sec.content ?? ''].join(' ').trim();
      const truncated = content.length > MAX_SECTION_CHARS
        ? content.substring(0, MAX_SECTION_CHARS) + '...'
        : content;
      if (truncated) {
        parts.push(`### Section ${si + 1}: ${sec.title}\n${truncated}`);
      }
    }
  }

  return parts.join('\n');
}

/**
 * Analyze course content for factual accuracy concerns using AI.
 * Returns empty array if aiEnabled is false.
 */
export async function analyzeFactualClaims(
  course: CourseInput,
  aiEnabled: boolean,
  userId?: string
): Promise<AnalysisIssue[]> {
  if (!aiEnabled || !userId) {
    return [];
  }

  try {
    const contentSummary = buildContentSummary(course);

    const response = await runSAMChatWithPreference({
      userId,
      capability: 'analysis',
      messages: [{ role: 'user', content: contentSummary }],
      systemPrompt: FACTUAL_SYSTEM_PROMPT,
      maxTokens: 2000,
      temperature: 0.3,
    });

    const parsed: FactualConcern[] = JSON.parse(response.trim());
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((c) => c.chapterIndex >= 0 && c.chapterIndex < course.chapters.length)
      .map((concern, idx) => {
        const chapter = course.chapters[concern.chapterIndex];
        const section = chapter?.sections[concern.sectionIndex];

        return {
          id: `factual-${Date.now()}-${idx}`,
          type: 'FACTUAL' as const,
          severity: concern.severity === 'HIGH' ? 'HIGH' as const
            : concern.severity === 'LOW' ? 'LOW' as const
            : 'MEDIUM' as const,
          status: 'OPEN' as const,
          location: {
            chapterId: chapter?.id,
            chapterTitle: chapter?.title,
            chapterPosition: concern.chapterIndex + 1,
            sectionId: section?.id,
            sectionTitle: section?.title,
            sectionPosition: section ? concern.sectionIndex + 1 : undefined,
          },
          title: `${concern.concern}: "${concern.claim.substring(0, 80)}${concern.claim.length > 80 ? '...' : ''}"`,
          description: concern.explanation,
          evidence: [
            `Claim: "${concern.claim}"`,
            `Concern type: ${concern.concern}`,
          ],
          impact: {
            area: 'Factual Accuracy',
            description: 'Inaccurate or unsupported factual claims can undermine learner trust and lead to incorrect understanding.',
          },
          fix: {
            action: 'modify' as const,
            what: concern.suggestion,
            why: concern.explanation,
            how: concern.concern === 'NEEDS_CITATION'
              ? 'Add a credible source reference for this claim.'
              : concern.concern === 'OUTDATED'
              ? 'Update to reflect the latest version or current best practices.'
              : 'Verify the claim and add supporting evidence or rephrase to be more accurate.',
          },
        };
      });
  } catch (error) {
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) {
      logger.warn('[FactualAnalyzer] AI access denied, skipping factual analysis');
      return [];
    }

    logger.error('[FactualAnalyzer] Failed to analyze factual claims', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}
