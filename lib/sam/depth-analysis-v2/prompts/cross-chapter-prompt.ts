/**
 * Cross-Chapter Analysis Prompt
 *
 * Generates a comprehensive prompt for AI to analyze consistency and flow across
 * all chapters in a course, identifying gaps, duplicates, progression issues,
 * prerequisite chains, and overall knowledge flow.
 *
 * Enhanced with full context and expert reviewer guidelines.
 */

import { z } from 'zod';
import type { BloomsLevel } from '../types';
import type { ChapterSummary } from './chapter-analysis-prompt';
import { getStageSystemPrompt } from './system-prompt';

export interface CrossChapterContext {
  courseTitle: string;
  courseGoals: string | null;
  whatYouWillLearn: string[];
  difficulty: string | null;
  totalChapters: number;
  totalSections: number;
  totalAssessments: number;
  chapters: Array<
    ChapterSummary & {
      assessmentAlignment?: {
        alignmentScore: number;
        misalignmentsCount: number;
        uncoveredObjectivesCount: number;
      };
      timeValidation?: {
        totalEstimatedTime: number;
        isRealistic: boolean;
        issueCount: number;
      };
      prerequisiteConcepts?: Array<{
        concept: string;
        status: 'SATISFIED' | 'MISSING' | 'ASSUMED';
      }>;
      gagneEventsCoverage?: number;
    }
  >;
  allKeyTopics: string[];
  allPrerequisiteConcepts: Array<{
    concept: string;
    introducedInChapter: number | null;
    usedInChapters: number[];
    status: 'SATISFIED' | 'MISSING' | 'ASSUMED';
  }>;
}

/**
 * Build context for cross-chapter analysis
 */
export function buildCrossChapterContext(
  courseTitle: string,
  courseGoals: string | null,
  difficulty: string | null,
  chapterSummaries: ChapterSummary[],
  totalSections: number,
  whatYouWillLearn: string[] = [],
  totalAssessments: number = 0,
  allKeyTopics: string[] = [],
  allPrerequisiteConcepts: CrossChapterContext['allPrerequisiteConcepts'] = []
): CrossChapterContext {
  return {
    courseTitle,
    courseGoals,
    whatYouWillLearn,
    difficulty,
    totalChapters: chapterSummaries.length,
    totalSections,
    totalAssessments,
    chapters: chapterSummaries,
    allKeyTopics,
    allPrerequisiteConcepts,
  };
}

/**
 * Get the system prompt for cross-chapter analysis
 */
export function getCrossChapterSystemPrompt(): string {
  return getStageSystemPrompt('cross-chapter');
}

/**
 * Build the comprehensive cross-chapter analysis prompt
 */
export function buildCrossChapterPrompt(context: CrossChapterContext): string {
  const chaptersText = context.chapters
    .map(
      (ch, i) => `
### Chapter ${i + 1}: ${ch.title}
- **Primary Bloom's Level**: ${ch.primaryBloomsLevel}
- **Sections**: ${ch.sectionCount}
- **Learning Objectives**: ${ch.objectivesCount} defined
- **Key Topics Introduced**: ${ch.keyTopics.length > 0 ? ch.keyTopics.join(', ') : 'None identified'}
${
  ch.assessmentAlignment
    ? `- **Assessment Alignment**: ${ch.assessmentAlignment.alignmentScore}% (${ch.assessmentAlignment.misalignmentsCount} misalignments, ${ch.assessmentAlignment.uncoveredObjectivesCount} uncovered objectives)`
    : ''
}
${
  ch.timeValidation
    ? `- **Time Validation**: ${ch.timeValidation.totalEstimatedTime} min estimated${!ch.timeValidation.isRealistic ? ' ⚠️ UNREALISTIC' : ''}`
    : ''
}
${
  ch.prerequisiteConcepts && ch.prerequisiteConcepts.length > 0
    ? `- **Prerequisites**: ${ch.prerequisiteConcepts.filter((p) => p.status === 'MISSING').length} missing, ${ch.prerequisiteConcepts.filter((p) => p.status === 'ASSUMED').length} assumed`
    : ''
}
${ch.gagneEventsCoverage !== undefined ? `- **Gagné Events Coverage**: ${ch.gagneEventsCoverage}/9 events` : ''}`
    )
    .join('\n');

  const prerequisiteChainText =
    context.allPrerequisiteConcepts.length > 0
      ? context.allPrerequisiteConcepts
          .map(
            (p) =>
              `- **${p.concept}**: ${p.status === 'SATISFIED' ? `Introduced Ch${(p.introducedInChapter ?? 0) + 1}, Used in Ch${p.usedInChapters.map((c) => c + 1).join(', Ch')}` : p.status === 'MISSING' ? `⚠️ NEVER INTRODUCED, Used in Ch${p.usedInChapters.map((c) => c + 1).join(', Ch')}` : `ASSUMED (external prerequisite), Used in Ch${p.usedInChapters.map((c) => c + 1).join(', Ch')}`}`
          )
          .join('\n')
      : '(No prerequisite analysis available yet)';

  return `## Cross-Chapter Consistency Review

### Course Overview
- **Title**: ${context.courseTitle}
- **Goals**: ${context.courseGoals || 'Not specified'}
- **Difficulty**: ${context.difficulty || 'Not specified'}
- **Structure**: ${context.totalChapters} chapters, ${context.totalSections} sections, ${context.totalAssessments} assessments

### What Students Will Learn (Stated Outcomes)
${
  context.whatYouWillLearn.length > 0
    ? context.whatYouWillLearn.map((item, i) => `${i + 1}. ${item}`).join('\n')
    : 'Not specified'
}

### All Topics Covered in Course
${context.allKeyTopics.length > 0 ? context.allKeyTopics.join(', ') : 'Topics not yet identified'}

---

## Chapter Summaries

${chaptersText}

---

## Prerequisite Concept Chain

${prerequisiteChainText}

---

## Your Analysis Task

Conduct a comprehensive cross-chapter review:

### 1. Bloom's Progression Analysis
Validate that cognitive levels progress appropriately:
- **Beginner courses**: Chapters should start at REMEMBER/UNDERSTAND and gradually increase
- **Intermediate courses**: Can start at APPLY and progress to ANALYZE/EVALUATE
- **Advanced courses**: Can start at ANALYZE and include significant CREATE activities

Flag any:
- Chapters that regress more than 1 level from previous
- Missing transitional content between cognitive jumps
- Final chapters that don't reach appropriate depth for course level

### 2. Knowledge Flow & Prerequisite Validation
- Are all concepts introduced before they are used?
- Are there "orphan concepts" (used but never taught)?
- Are there circular dependencies (A requires B, B requires A)?
- Are assumed prerequisites explicitly stated in course prereqs?

### 3. Goal Coverage Analysis
- Which stated learning outcomes are covered?
- Which stated outcomes are NOT covered by any chapter?
- Are there chapters that don't contribute to any stated goal?

### 4. Style & Depth Consistency
- Do chapters have similar section counts?
- Is content depth consistent across chapters?
- Is writing style consistent?
- Are there outlier chapters (too deep or too shallow)?

### 5. Duplicate Content Detection
- Are any topics covered in multiple chapters?
- Is there redundant content that should be consolidated?
- Is intentional repetition (spiral curriculum) clearly marked?

### 6. Time Distribution
- Is learning time distributed evenly across chapters?
- Are there chapters that are too long or too short?
- Does the total course time match expectations for the difficulty level?

---

## Scoring Rubric (CRITICAL - Follow This Exactly)

All scores MUST be on a 0-100 scale. Use this rubric:

### flowScore (0-100): Cross-chapter knowledge flow and Bloom's progression
- **90-100**: Perfect prerequisite chain; Bloom's levels progress logically; no orphan concepts
- **80-89**: Good progression with minor gaps; concepts mostly flow naturally
- **70-79**: Some flow issues; a few concepts used before proper introduction
- **60-69**: Noticeable flow problems; several prerequisite violations
- **<60**: Chaotic flow; many concepts used without introduction; major cognitive jumps

### styleConsistency (0-100): Cross-chapter style, depth, and format consistency
- **90-100**: Uniform style, depth, and formatting across all chapters
- **80-89**: Mostly consistent with minor variations between chapters
- **70-79**: Some chapters differ noticeably in depth or style
- **60-69**: Significant inconsistencies; chapters feel disjointed
- **<60**: No consistency; chapters could be from entirely different courses

### goalCoverage (0-100): How well chapters cover stated learning outcomes
- **90-100**: All goals fully covered with clear chapter mapping
- **80-89**: Most goals covered; minor gaps in peripheral topics
- **70-79**: Core goals covered but some stated outcomes lack chapter support
- **60-69**: Several important goals uncovered or only partially addressed
- **<60**: Most stated goals are not adequately covered by content

**CRITICAL SCORING RULES — BE HONEST**:
- A course with real content and good flow should score 70+
- A course with content but flow problems should score 40-69
- A course with mostly empty chapters (no body content) should score 5-25
- DO NOT inflate scores for courses that lack content — empty courses cannot have "flow" or "consistency"
- If chapter summaries show zero key topics and zero objectives, that signals MISSING CONTENT

---

## Response Format

Respond ONLY with valid JSON (no markdown code blocks):

{
  "bloomsProgression": "<good | inconsistent | needs_reordering>",
  "bloomsProgressionReasoning": "<detailed explanation of cognitive level flow and appropriateness>",
  "progressionIssues": [
    {
      "fromChapter": <0-based index>,
      "toChapter": <0-based index>,
      "issue": "<description of progression problem>",
      "severity": "<CRITICAL | HIGH | MEDIUM | LOW>",
      "suggestion": "<how to fix>"
    }
  ],
  "flowScore": <0-100>,
  "styleConsistency": <0-100>,
  "goalCoverage": <0-100>,
  "coveredGoals": ["<learning outcome that IS covered>"],
  "uncoveredGoals": ["<learning outcome that is NOT covered>"],
  "goalToChapterMapping": [
    {
      "goal": "<learning outcome>",
      "coveredByChapters": [<0-based chapter indices>],
      "coverageLevel": "<FULL | PARTIAL | NONE>"
    }
  ],
  "knowledgeFlowIssues": [
    {
      "type": "<ORPHAN_CONCEPT | CIRCULAR_DEPENDENCY | LATE_INTRODUCTION | MISSING_PREREQUISITE>",
      "concept": "<concept name>",
      "usedInChapter": <0-based index>,
      "shouldBeIntroducedBy": <0-based index>,
      "severity": "<CRITICAL | HIGH | MEDIUM | LOW>",
      "fix": "<how to resolve>"
    }
  ],
  "duplicateContent": [
    {
      "topic": "<duplicated topic>",
      "chapters": [<0-based indices where it appears>],
      "recommendation": "<CONSOLIDATE | KEEP_AS_SPIRAL | REMOVE_DUPLICATE>",
      "rationale": "<why this recommendation>"
    }
  ],
  "timeDistribution": {
    "totalEstimatedTime": <minutes>,
    "averageChapterTime": <minutes>,
    "imbalancedChapters": [
      {
        "chapterIndex": <0-based>,
        "estimatedTime": <minutes>,
        "issue": "<too long | too short>",
        "recommendation": "<suggested action>"
      }
    ],
    "matchesStatedDuration": <true | false>
  },
  "issues": [
    {
      "type": "<FLOW | CONSISTENCY | DUPLICATE | GAP | STRUCTURE | PREREQUISITE | TIME>",
      "severity": "<CRITICAL | HIGH | MEDIUM | LOW>",
      "affectedChapterIndices": [<0-based indices>],
      "affectedChapterTitles": ["<chapter title>"],
      "title": "<short descriptive title>",
      "description": "<detailed explanation of the problem>",
      "evidence": ["<specific observation>"],
      "fix": {
        "action": "<reorder | merge | add | modify | split | remove>",
        "what": "<what needs to change>",
        "why": "<educational rationale>",
        "how": "<step-by-step instructions>"
      }
    }
  ],
  "recommendedChapterOrder": [<0-based indices in optimal order>] | null,
  "overallAssessment": {
    "readyForPublication": <true | false>,
    "criticalIssuesCount": <number>,
    "highPriorityIssuesCount": <number>,
    "topImprovements": ["<most impactful improvement 1>", "<improvement 2>", "<improvement 3>"]
  },
  "thinking": "<your detailed cross-chapter analysis reasoning>"
}`;
}

/**
 * Result from cross-chapter analysis
 */
export interface CrossChapterAnalysisResult {
  bloomsProgression: 'good' | 'inconsistent' | 'needs_reordering';
  bloomsProgressionReasoning: string;
  progressionIssues: Array<{
    fromChapter: number;
    toChapter: number;
    issue: string;
    severity: string;
    suggestion: string;
  }>;
  flowScore: number;
  styleConsistency: number;
  goalCoverage: number;
  coveredGoals: string[];
  uncoveredGoals: string[];
  goalToChapterMapping: Array<{
    goal: string;
    coveredByChapters: number[];
    coverageLevel: 'FULL' | 'PARTIAL' | 'NONE';
  }>;
  knowledgeFlowIssues: Array<{
    type: 'ORPHAN_CONCEPT' | 'CIRCULAR_DEPENDENCY' | 'LATE_INTRODUCTION' | 'MISSING_PREREQUISITE';
    concept: string;
    usedInChapter: number;
    shouldBeIntroducedBy: number;
    severity: string;
    fix: string;
  }>;
  duplicateContent: Array<{
    topic: string;
    chapters: number[];
    recommendation: 'CONSOLIDATE' | 'KEEP_AS_SPIRAL' | 'REMOVE_DUPLICATE';
    rationale: string;
  }>;
  timeDistribution: {
    totalEstimatedTime: number;
    averageChapterTime: number;
    imbalancedChapters: Array<{
      chapterIndex: number;
      estimatedTime: number;
      issue: string;
      recommendation: string;
    }>;
    matchesStatedDuration: boolean;
  };
  issues: Array<{
    type: string;
    severity: string;
    affectedChapterIndices: number[];
    affectedChapterTitles: string[];
    title: string;
    description: string;
    evidence: string[];
    fix: {
      action: string;
      what: string;
      why: string;
      how: string;
    };
  }>;
  recommendedChapterOrder: number[] | null;
  overallAssessment: {
    readyForPublication: boolean;
    criticalIssuesCount: number;
    highPriorityIssuesCount: number;
    topImprovements: string[];
  };
  thinking: string;
}

/**
 * Parse AI response for cross-chapter analysis
 */
// Zod schema for cross-chapter AI response validation
const CrossChapterResponseSchema = z.object({
  bloomsProgression: z.string().default('inconsistent'),
  bloomsProgressionReasoning: z.string().default(''),
  progressionIssues: z.array(z.object({
    fromChapter: z.coerce.number().default(0),
    toChapter: z.coerce.number().default(0),
    issue: z.string().default(''),
    severity: z.string().default('MEDIUM'),
    suggestion: z.string().default(''),
  })).default([]),
  flowScore: z.coerce.number().min(0).max(100).default(50),
  styleConsistency: z.coerce.number().min(0).max(100).default(50),
  goalCoverage: z.coerce.number().min(0).max(100).default(50),
  coveredGoals: z.array(z.string()).default([]),
  uncoveredGoals: z.array(z.string()).default([]),
  goalToChapterMapping: z.array(z.object({
    goal: z.string().default(''),
    coveredByChapters: z.array(z.coerce.number()).default([]),
    coverageLevel: z.enum(['FULL', 'PARTIAL', 'NONE']).default('NONE'),
  })).default([]),
  knowledgeFlowIssues: z.array(z.object({
    type: z.enum(['ORPHAN_CONCEPT', 'CIRCULAR_DEPENDENCY', 'LATE_INTRODUCTION', 'MISSING_PREREQUISITE']).default('MISSING_PREREQUISITE'),
    concept: z.string().default(''),
    usedInChapter: z.coerce.number().default(0),
    shouldBeIntroducedBy: z.coerce.number().default(0),
    severity: z.string().default('MEDIUM'),
    fix: z.string().default(''),
  })).default([]),
  duplicateContent: z.array(z.object({
    topic: z.string().default(''),
    chapters: z.array(z.coerce.number()).default([]),
    recommendation: z.enum(['CONSOLIDATE', 'KEEP_AS_SPIRAL', 'REMOVE_DUPLICATE']).default('CONSOLIDATE'),
    rationale: z.string().default(''),
  })).default([]),
  timeDistribution: z.object({
    totalEstimatedTime: z.coerce.number().default(0),
    averageChapterTime: z.coerce.number().default(0),
    imbalancedChapters: z.array(z.object({
      chapterIndex: z.coerce.number().default(0),
      estimatedTime: z.coerce.number().default(0),
      issue: z.string().default(''),
      recommendation: z.string().default(''),
    })).default([]),
    matchesStatedDuration: z.boolean().default(true),
  }).default({}),
  issues: z.array(z.object({
    type: z.string().default('FLOW'),
    severity: z.string().default('MEDIUM'),
    affectedChapterIndices: z.array(z.coerce.number()).default([]),
    affectedChapterTitles: z.array(z.string()).default([]),
    title: z.string().default('Unknown issue'),
    description: z.string().default(''),
    evidence: z.array(z.string()).default([]),
    fix: z.object({
      action: z.string().default('modify'),
      what: z.string().default(''),
      why: z.string().default(''),
      how: z.string().default(''),
    }).default({}),
  })).default([]),
  recommendedChapterOrder: z.array(z.coerce.number()).nullable().default(null),
  overallAssessment: z.object({
    readyForPublication: z.boolean().default(false),
    criticalIssuesCount: z.coerce.number().default(0),
    highPriorityIssuesCount: z.coerce.number().default(0),
    topImprovements: z.array(z.string()).default([]),
  }).default({}),
  thinking: z.string().default(''),
});

export function parseCrossChapterResponse(responseText: string): CrossChapterAnalysisResult {
  try {
    let jsonStr = responseText.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }

    const rawParsed = JSON.parse(jsonStr.trim());
    const parsed = CrossChapterResponseSchema.parse(rawParsed);

    return parsed;
  } catch {
    // On parse failure, return ERROR state (not fake 50s)
    return {
      bloomsProgression: 'inconsistent',
      bloomsProgressionReasoning: 'AI analysis failed — could not parse response. Course content may be missing or malformed.',
      progressionIssues: [],
      flowScore: 0,
      styleConsistency: 0,
      goalCoverage: 0,
      coveredGoals: [],
      uncoveredGoals: [],
      goalToChapterMapping: [],
      knowledgeFlowIssues: [],
      duplicateContent: [],
      timeDistribution: {
        totalEstimatedTime: 0,
        averageChapterTime: 0,
        imbalancedChapters: [],
        matchesStatedDuration: false,
      },
      issues: [
        {
          type: 'FLOW',
          severity: 'CRITICAL',
          affectedChapterIndices: [],
          affectedChapterTitles: [],
          title: 'Cross-Chapter AI Analysis Failed',
          description: 'The AI could not analyze cross-chapter relationships. This usually means the course lacks content or the response was malformed. Review the course and add body content to all chapters.',
          evidence: ['AI response could not be parsed'],
          fix: {
            action: 'modify',
            what: 'Add body content to all chapters and sections',
            why: 'Cross-chapter analysis requires actual content to evaluate flow and consistency',
            how: 'Ensure every section has learning material before re-running analysis',
          },
        },
      ],
      recommendedChapterOrder: null,
      overallAssessment: {
        readyForPublication: false,
        criticalIssuesCount: 1,
        highPriorityIssuesCount: 0,
        topImprovements: ['Add body content to all chapters', 'Define learning objectives for each section', 'Complete manual review'],
      },
      thinking: 'Parse error occurred — returning error state with zero scores',
    };
  }
}

/**
 * Helper to map Bloom's level to numeric value for progression analysis
 */
export function bloomsLevelToNumber(level: BloomsLevel): number {
  const mapping: Record<BloomsLevel, number> = {
    REMEMBER: 1,
    UNDERSTAND: 2,
    APPLY: 3,
    ANALYZE: 4,
    EVALUATE: 5,
    CREATE: 6,
  };
  return mapping[level] ?? 2;
}

/**
 * Check if chapter order follows Bloom's progression
 */
export function checkBloomsProgression(
  chapters: ChapterSummary[]
): 'good' | 'inconsistent' | 'needs_reordering' {
  if (chapters.length < 2) return 'good';

  let totalProgressions = 0;
  let goodProgressions = 0;

  for (let i = 1; i < chapters.length; i++) {
    const prevLevel = bloomsLevelToNumber(chapters[i - 1].primaryBloomsLevel);
    const currLevel = bloomsLevelToNumber(chapters[i].primaryBloomsLevel);

    totalProgressions++;

    // Good: level increases or stays same
    // Acceptable: decreases by 1 (minor review)
    // Bad: decreases by more than 1 (cognitive regression)
    if (currLevel >= prevLevel || currLevel >= prevLevel - 1) {
      goodProgressions++;
    }
  }

  const progressionScore = goodProgressions / totalProgressions;

  if (progressionScore >= 0.8) return 'good';
  if (progressionScore >= 0.5) return 'inconsistent';
  return 'needs_reordering';
}
