/**
 * Learner Simulator (Step 10 — AI-Only)
 *
 * AI-powered analyzer that simulates a target-audience learner going through
 * the course content. Identifies:
 * - Confusion points where explanations are unclear
 * - Pacing issues (too fast/slow progression)
 * - Knowledge gaps where prerequisites are assumed
 * - Engagement drops where content becomes monotonous
 *
 * Returns empty array if `aiEnabled: false`.
 * Zero cost in rule-based mode.
 */

import { logger } from '@/lib/logger';
import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';
import type { CourseInput, AnalysisIssue } from '../types';

function buildSimulatorPrompt(course: CourseInput): string {
  const difficulty = course.difficulty ?? 'INTERMEDIATE';
  const personaLevel = difficulty === 'BEGINNER' ? 'new to the subject'
    : difficulty === 'ADVANCED' ? 'experienced with foundational knowledge'
    : 'has some basic familiarity';

  return `You are simulating a learner named Alex who is ${personaLevel} in "${course.title}".
Walk through the course structure below as Alex would, chapter by chapter.

Identify issues from Alex's perspective:
1. CONFUSION: Where would Alex get confused? (unclear explanations, jargon without definition)
2. PACING: Where does the course move too fast or too slow for Alex's level?
3. GAP: Where does the course assume knowledge Alex doesn't have yet?
4. ENGAGEMENT: Where might Alex lose interest? (repetitive, too abstract, no examples)

Respond with a JSON array. Each issue:
{
  "chapterIndex": number,
  "sectionIndex": number | null,
  "issueType": "CONFUSION" | "PACING" | "GAP" | "ENGAGEMENT",
  "severity": "HIGH" | "MEDIUM" | "LOW",
  "learnerThought": "what Alex would be thinking at this point",
  "problem": "specific description of the issue",
  "suggestion": "how to fix it for Alex's level"
}

Be specific and practical. Only flag genuine learner experience issues.
Respond ONLY with a valid JSON array, no markdown fences.`;
}

function buildCourseSummary(course: CourseInput): string {
  const MAX_SECTION_CHARS = 400;
  const parts: string[] = [];

  parts.push(`Course: ${course.title}`);
  parts.push(`Difficulty: ${course.difficulty ?? 'Not specified'}`);
  if (course.prerequisites) parts.push(`Prerequisites: ${course.prerequisites}`);
  if (course.whatYouWillLearn.length > 0) {
    parts.push(`Learning goals: ${course.whatYouWillLearn.join('; ')}`);
  }

  for (let ci = 0; ci < course.chapters.length; ci++) {
    const ch = course.chapters[ci];
    parts.push(`\n## Chapter ${ci + 1}: ${ch.title}`);
    if (ch.description) parts.push(ch.description.substring(0, 200));

    for (let si = 0; si < ch.sections.length; si++) {
      const sec = ch.sections[si];
      const content = [sec.description ?? '', sec.content ?? ''].join(' ').trim();
      const truncated = content.length > MAX_SECTION_CHARS
        ? content.substring(0, MAX_SECTION_CHARS) + '...'
        : content;

      parts.push(`### S${si + 1}: ${sec.title}`);
      if (sec.objectives.length > 0) {
        parts.push(`Objectives: ${sec.objectives.slice(0, 3).join('; ')}`);
      }
      if (truncated) parts.push(truncated);
    }
  }

  return parts.join('\n');
}

interface LearnerIssue {
  chapterIndex: number;
  sectionIndex: number | null;
  issueType: 'CONFUSION' | 'PACING' | 'GAP' | 'ENGAGEMENT';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  learnerThought: string;
  problem: string;
  suggestion: string;
}

/**
 * Simulate a learner going through the course and identify experience issues.
 * Returns empty array if aiEnabled is false.
 */
export async function simulateLearner(
  course: CourseInput,
  aiEnabled: boolean,
  userId?: string
): Promise<AnalysisIssue[]> {
  if (!aiEnabled || !userId) {
    return [];
  }

  try {
    const systemPrompt = buildSimulatorPrompt(course);
    const courseSummary = buildCourseSummary(course);

    const response = await runSAMChatWithPreference({
      userId,
      capability: 'analysis',
      messages: [{ role: 'user', content: courseSummary }],
      systemPrompt,
      maxTokens: 2000,
      temperature: 0.5,
    });

    const parsed: LearnerIssue[] = JSON.parse(response.trim());
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((issue) => issue.chapterIndex >= 0 && issue.chapterIndex < course.chapters.length)
      .map((issue, idx) => {
        const chapter = course.chapters[issue.chapterIndex];
        const section = issue.sectionIndex !== null
          ? chapter?.sections[issue.sectionIndex]
          : undefined;

        return {
          id: `learner-${Date.now()}-${idx}`,
          type: 'LEARNER_EXPERIENCE' as const,
          severity: issue.severity === 'HIGH' ? 'HIGH' as const
            : issue.severity === 'LOW' ? 'LOW' as const
            : 'MEDIUM' as const,
          status: 'OPEN' as const,
          location: {
            chapterId: chapter?.id,
            chapterTitle: chapter?.title,
            chapterPosition: issue.chapterIndex + 1,
            sectionId: section?.id,
            sectionTitle: section?.title,
            sectionPosition: section && issue.sectionIndex !== null
              ? issue.sectionIndex + 1
              : undefined,
          },
          title: `${issue.issueType}: ${issue.problem.substring(0, 80)}${issue.problem.length > 80 ? '...' : ''}`,
          description: `${issue.problem}\n\nLearner perspective: "${issue.learnerThought}"`,
          evidence: [
            `Issue type: ${issue.issueType}`,
            `Learner thought: "${issue.learnerThought}"`,
          ],
          impact: {
            area: 'Learner Experience',
            description: issue.issueType === 'CONFUSION'
              ? 'Unclear content causes learner frustration and may lead to dropout.'
              : issue.issueType === 'PACING'
              ? 'Poor pacing leads to boredom or overwhelm, reducing learning outcomes.'
              : issue.issueType === 'GAP'
              ? 'Knowledge gaps cause learners to fall behind and lose confidence.'
              : 'Low engagement reduces motivation and knowledge retention.',
          },
          fix: {
            action: 'modify' as const,
            what: issue.suggestion,
            why: issue.problem,
            how: issue.issueType === 'CONFUSION'
              ? 'Add clearer explanations, define key terms, and provide concrete examples.'
              : issue.issueType === 'PACING'
              ? 'Adjust the depth and detail of content to match the target difficulty level.'
              : issue.issueType === 'GAP'
              ? 'Add prerequisite explanations or a brief review section before introducing advanced concepts.'
              : 'Add interactive elements, real-world examples, or varied content formats to maintain interest.',
          },
        };
      });
  } catch (error) {
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) {
      logger.warn('[LearnerSimulator] AI access denied, skipping learner simulation');
      return [];
    }

    logger.error('[LearnerSimulator] Failed to simulate learner', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}
