/**
 * Chapter Analysis Prompt
 *
 * Generates a comprehensive prompt for AI to analyze a single chapter in detail,
 * including Bloom's classification, content quality, section consistency,
 * assessment alignment, and time estimation validation.
 *
 * Enhanced to send full content and include expert reviewer context.
 */

import type { CourseInput, BloomsLevel } from '../types';
import { getStageSystemPrompt } from './system-prompt';

export interface ChapterContext {
  courseTitle: string;
  courseGoals: string | null;
  difficulty: string | null;
  chapterIndex: number;
  totalChapters: number;
  chapterTitle: string;
  chapterDescription: string | null;
  previousChapterTitles: string[];
  previousChapterTopics: string[];
  sections: Array<{
    index: number;
    title: string;
    description: string | null;
    fullContent: string | null;
    contentLength: number;
    estimatedReadTime: number;
    hasVideo: boolean;
    videoUrl: string | null;
    objectives: string[];
    hasAssessments: boolean;
    assessments: Array<{
      examTitle: string;
      questionCount: number;
      questions: Array<{
        question: string;
        type: string;
        bloomsLevel: BloomsLevel | null;
      }>;
    }>;
  }>;
}

export interface ChapterSummary {
  chapterIndex: number;
  title: string;
  primaryBloomsLevel: BloomsLevel;
  sectionCount: number;
  keyTopics: string[];
  objectivesCount: number;
}

/**
 * Build comprehensive context for chapter analysis
 */
export function buildChapterContext(
  course: CourseInput,
  chapterIndex: number,
  previousSummaries: ChapterSummary[]
): ChapterContext {
  const chapter = course.chapters[chapterIndex];

  return {
    courseTitle: course.title,
    courseGoals: course.courseGoals,
    difficulty: course.difficulty,
    chapterIndex,
    totalChapters: course.chapters.length,
    chapterTitle: chapter.title,
    chapterDescription: chapter.description,
    previousChapterTitles: previousSummaries.map((s) => s.title),
    previousChapterTopics: previousSummaries.flatMap((s) => s.keyTopics),
    sections: chapter.sections.map((section, sIndex) => {
      const contentLength = section.content?.length ?? 0;
      const estimatedReadTime = Math.ceil(contentLength / 200); // ~200 chars per minute

      return {
        index: sIndex,
        title: section.title,
        description: section.description,
        fullContent: section.content, // Send FULL content, not preview
        contentLength,
        estimatedReadTime,
        hasVideo: !!section.videoUrl,
        videoUrl: section.videoUrl,
        objectives: section.objectives ?? [],
        hasAssessments: (section.exams?.length ?? 0) > 0,
        assessments: (section.exams ?? []).map((exam) => ({
          examTitle: exam.title,
          questionCount: exam.questions?.length ?? 0,
          questions: (exam.questions ?? []).map((q) => ({
            question: q.question,
            type: q.type,
            bloomsLevel: q.bloomsLevel ?? null,
          })),
        })),
      };
    }),
  };
}

/**
 * Get the system prompt for chapter analysis
 */
export function getChapterAnalysisSystemPrompt(): string {
  return getStageSystemPrompt('chapter');
}

/**
 * Build the comprehensive chapter analysis prompt
 */
export function buildChapterAnalysisPrompt(context: ChapterContext): string {
  const sectionsText = context.sections
    .map(
      (s) => `
### Section ${s.index + 1}: ${s.title}

**Metadata:**
- Estimated Read Time: ~${s.estimatedReadTime} minutes
- Content Length: ${s.contentLength} characters
- Has Video: ${s.hasVideo ? 'Yes' : 'No'}
- Assessments: ${s.hasAssessments ? `Yes (${s.assessments.length} exam(s))` : 'None'}

**Learning Objectives:**
${s.objectives.length > 0 ? s.objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n') : '⚠️ NO OBJECTIVES DEFINED'}

**Description:**
${s.description || '(No description provided)'}

**Full Content:**
"""
${s.fullContent || '(No content provided)'}
"""

${
  s.hasAssessments
    ? `**Assessment Questions:**
${s.assessments
  .map(
    (exam) => `
Exam: ${exam.examTitle} (${exam.questionCount} questions)
${exam.questions
  .map(
    (q, qi) =>
      `  Q${qi + 1} [${q.bloomsLevel || 'UNKNOWN'}]: ${q.question.substring(0, 200)}${q.question.length > 200 ? '...' : ''}`
  )
  .join('\n')}`
  )
  .join('\n')}`
    : '**Assessment Questions:** None'
}
`
    )
    .join('\n---\n');

  return `## Chapter Under Review

### Course Context
- **Course Title**: ${context.courseTitle}
- **Course Goals**: ${context.courseGoals || 'Not specified'}
- **Difficulty Level**: ${context.difficulty || 'Not specified'}
- **Position**: Chapter ${context.chapterIndex + 1} of ${context.totalChapters}

### Previous Chapters (for prerequisite validation)
${
  context.previousChapterTitles.length > 0
    ? context.previousChapterTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')
    : '(This is the first chapter)'
}

### Previously Introduced Topics
${
  context.previousChapterTopics.length > 0
    ? context.previousChapterTopics.join(', ')
    : '(No prior topics - this is the first chapter)'
}

---

## Chapter: "${context.chapterTitle}"

**Description:** ${context.chapterDescription || 'No description provided'}

---

## Sections in This Chapter

${sectionsText}

---

## Your Analysis Task

Conduct a thorough chapter review covering:

### 1. Bloom&apos;s Taxonomy Classification
For each section:
- Identify the PRIMARY cognitive level based on ACTUAL CONTENT (not titles alone)
- Estimate the distribution across all 6 levels
- Flag any mismatches between stated objectives and actual content
- **CRITICAL: When body content is missing or says "(No content provided)"**:
  - You CANNOT determine Bloom&apos;s level without actual content to analyze
  - Set the section to REMEMBER (lowest level) since there is nothing to learn from
  - Flag this as a CRITICAL issue: "Missing Content - Cannot Assess Cognitive Level"
  - DO NOT guess or infer Bloom&apos;s levels from titles — titles describe intent, not achievement

### 2. Content Quality Assessment
- Is content comprehensive for the topic?
- Are explanations clear and well-structured?
- Are there examples and practical applications?
- Is the content depth appropriate for the course difficulty?

### 3. Learning Flow Analysis
- Do sections flow logically?
- Are concepts introduced before they're used?
- Are there cognitive jumps (sudden difficulty spikes)?

### 4. Assessment Alignment (CRITICAL)
For each assessment:
- Does the question's Bloom's level match the section's content level?
- Are all learning objectives covered by assessments?
- Are there objectives with no corresponding assessment?

### 5. Time Estimation Validation
- Is the estimated read time realistic?
- Is cognitive load distributed appropriately?
- Are there sections that are too long (>20 min) or too short (<3 min)?

### 6. Prerequisite Validation
- What concepts does this chapter assume knowledge of?
- Are those concepts covered in previous chapters?
- Are there any "orphan concepts" used but never introduced?

---

## Scoring Rubric (CRITICAL - Follow This Exactly)

All scores MUST be on a 0-100 scale. Use this rubric:

### consistencyScore (0-100): Internal chapter consistency
- **90-100**: Consistent writing style, depth, and formatting across all sections
- **80-89**: Mostly consistent with minor variations
- **70-79**: Some inconsistencies in style, depth, or formatting between sections
- **60-69**: Noticeable inconsistencies that affect readability
- **<60**: Major inconsistencies - sections feel like different authors/courses

### flowScore (0-100): Learning progression within the chapter
- **90-100**: Concepts build perfectly from simple to complex; no cognitive jumps
- **80-89**: Good progression with minor flow gaps
- **70-79**: Mostly logical but some concepts introduced out of order
- **60-69**: Several flow issues; learners would struggle with order
- **<60**: Chaotic ordering; concepts used before introduction

### qualityScore (0-100): Content completeness and educational value
- **90-100**: Comprehensive, well-explained, practical examples, real-world applications
- **80-89**: Good coverage with clear explanations; some examples
- **70-79**: Adequate content but missing depth or practical application
- **60-69**: Thin content; explanations are superficial or incomplete
- **40-59**: Minimal content; some sections have text but many are empty
- **20-39**: Mostly titles with very little or no body content
- **5-19**: Only titles exist; no descriptions, no content, no objectives
- **0-4**: Completely empty chapter with no usable structure

**CRITICAL SCORING RULES — BE HONEST**:
- A chapter with well-structured titles, descriptions, AND substantial body content: score 60+
- A chapter with good titles and descriptions but NO body content: score 10-20 (titles alone do NOT teach)
- A chapter with only titles (no descriptions, no content): score 5-15
- If ALL sections say "(No content provided)", quality MUST be below 20
- NEVER give 50+ to a chapter with no body content — that is dishonest
- Your job is to HELP the course creator by being truthful about what is missing
- Create CRITICAL issues for every section that has no body content

---

## Response Format

Respond ONLY with valid JSON (no markdown code blocks):

{
  "primaryBloomsLevel": "<REMEMBER | UNDERSTAND | APPLY | ANALYZE | EVALUATE | CREATE>",
  "bloomsDistribution": {
    "REMEMBER": <0-100>,
    "UNDERSTAND": <0-100>,
    "APPLY": <0-100>,
    "ANALYZE": <0-100>,
    "EVALUATE": <0-100>,
    "CREATE": <0-100>
  },
  "sectionBloomsLevels": [
    {
      "sectionIndex": <0-based>,
      "sectionTitle": "<title>",
      "primaryLevel": "<BLOOM_LEVEL>",
      "reasoning": "<why this level>"
    }
  ],
  "consistencyScore": <0-100>,
  "flowScore": <0-100>,
  "qualityScore": <0-100>,
  "keyTopics": ["<topic introduced in this chapter>"],
  "prerequisiteConcepts": [
    {
      "concept": "<concept name>",
      "introducedIn": "<chapter title or 'NOT FOUND'>",
      "status": "<SATISFIED | MISSING | ASSUMED>"
    }
  ],
  "assessmentAlignment": {
    "alignmentScore": <0-100>,
    "misalignments": [
      {
        "sectionIndex": <0-based>,
        "sectionTitle": "<title>",
        "sectionBloomsLevel": "<level>",
        "questionIndex": <0-based>,
        "questionBloomsLevel": "<level>",
        "issue": "<description of misalignment>"
      }
    ],
    "uncoveredObjectives": ["<objective with no assessment>"]
  },
  "timeValidation": {
    "totalEstimatedTime": <minutes>,
    "isRealistic": <true | false>,
    "issues": [
      {
        "sectionIndex": <0-based>,
        "sectionTitle": "<title>",
        "estimatedTime": <minutes>,
        "issue": "<too long | too short | cognitive overload>",
        "recommendation": "<suggested fix>"
      }
    ]
  },
  "issues": [
    {
      "sectionIndex": <0-based index or null for chapter-level>,
      "sectionTitle": "<section title or null>",
      "type": "<STRUCTURE | CONTENT | FLOW | CONSISTENCY | DEPTH | OBJECTIVE | ASSESSMENT | PREREQUISITE | TIME>",
      "severity": "<CRITICAL | HIGH | MEDIUM | LOW>",
      "title": "<short descriptive title>",
      "description": "<detailed explanation of the problem>",
      "evidence": ["<specific quote or observation>"],
      "fix": {
        "action": "<add | modify | remove | reorder | split | merge>",
        "what": "<what needs to change>",
        "why": "<educational rationale>",
        "how": "<step-by-step instructions>",
        "suggestedContent": "<example content if applicable>"
      }
    }
  ],
  "gagneEventsCheck": {
    "gainAttention": <true | false>,
    "informObjectives": <true | false>,
    "stimulateRecall": <true | false>,
    "presentContent": <true | false>,
    "provideGuidance": <true | false>,
    "elicitPerformance": <true | false>,
    "provideFeedback": <true | false>,
    "assessPerformance": <true | false>,
    "enhanceRetention": <true | false>,
    "missingEvents": ["<event name>"]
  },
  "thinking": "<your detailed analysis reasoning>"
}`;
}

/**
 * Result from chapter analysis
 */
export interface ChapterAnalysisResult {
  chapterIndex: number;
  chapterTitle: string;
  primaryBloomsLevel: BloomsLevel;
  bloomsDistribution: Record<BloomsLevel, number>;
  sectionBloomsLevels: Array<{
    sectionIndex: number;
    sectionTitle: string;
    primaryLevel: BloomsLevel;
    reasoning: string;
  }>;
  consistencyScore: number;
  flowScore: number;
  qualityScore: number;
  keyTopics: string[];
  prerequisiteConcepts: Array<{
    concept: string;
    introducedIn: string;
    status: 'SATISFIED' | 'MISSING' | 'ASSUMED';
  }>;
  assessmentAlignment: {
    alignmentScore: number;
    misalignments: Array<{
      sectionIndex: number;
      sectionTitle: string;
      sectionBloomsLevel: BloomsLevel;
      questionIndex: number;
      questionBloomsLevel: BloomsLevel;
      issue: string;
    }>;
    uncoveredObjectives: string[];
  };
  timeValidation: {
    totalEstimatedTime: number;
    isRealistic: boolean;
    issues: Array<{
      sectionIndex: number;
      sectionTitle: string;
      estimatedTime: number;
      issue: string;
      recommendation: string;
    }>;
  };
  issues: Array<{
    sectionIndex: number | null;
    sectionTitle: string | null;
    type: string;
    severity: string;
    title: string;
    description: string;
    evidence: string[];
    fix: {
      action: string;
      what: string;
      why: string;
      how: string;
      suggestedContent?: string;
    };
  }>;
  gagneEventsCheck: {
    gainAttention: boolean;
    informObjectives: boolean;
    stimulateRecall: boolean;
    presentContent: boolean;
    provideGuidance: boolean;
    elicitPerformance: boolean;
    provideFeedback: boolean;
    assessPerformance: boolean;
    enhanceRetention: boolean;
    missingEvents: string[];
  };
  thinking: string;
}

/**
 * Parse AI response for chapter analysis
 */
export function parseChapterAnalysisResponse(
  responseText: string,
  chapterIndex: number,
  chapterTitle: string
): ChapterAnalysisResult {
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

    const parsed = JSON.parse(jsonStr.trim());

    const defaultDistribution: Record<BloomsLevel, number> = {
      REMEMBER: 20,
      UNDERSTAND: 30,
      APPLY: 20,
      ANALYZE: 15,
      EVALUATE: 10,
      CREATE: 5,
    };

    return {
      chapterIndex,
      chapterTitle,
      primaryBloomsLevel: parsed.primaryBloomsLevel ?? 'UNDERSTAND',
      bloomsDistribution: {
        REMEMBER: parsed.bloomsDistribution?.REMEMBER ?? defaultDistribution.REMEMBER,
        UNDERSTAND: parsed.bloomsDistribution?.UNDERSTAND ?? defaultDistribution.UNDERSTAND,
        APPLY: parsed.bloomsDistribution?.APPLY ?? defaultDistribution.APPLY,
        ANALYZE: parsed.bloomsDistribution?.ANALYZE ?? defaultDistribution.ANALYZE,
        EVALUATE: parsed.bloomsDistribution?.EVALUATE ?? defaultDistribution.EVALUATE,
        CREATE: parsed.bloomsDistribution?.CREATE ?? defaultDistribution.CREATE,
      },
      sectionBloomsLevels: (parsed.sectionBloomsLevels ?? []).map(
        (s: Record<string, unknown>) => ({
          sectionIndex: (s.sectionIndex as number) ?? 0,
          sectionTitle: (s.sectionTitle as string) ?? '',
          primaryLevel: (s.primaryLevel as BloomsLevel) ?? 'UNDERSTAND',
          reasoning: (s.reasoning as string) ?? '',
        })
      ),
      consistencyScore: Math.min(100, Math.max(0, parsed.consistencyScore ?? 70)),
      flowScore: Math.min(100, Math.max(0, parsed.flowScore ?? 70)),
      qualityScore: Math.min(100, Math.max(0, parsed.qualityScore ?? 70)),
      keyTopics: parsed.keyTopics ?? [],
      prerequisiteConcepts: (parsed.prerequisiteConcepts ?? []).map(
        (p: Record<string, unknown>) => ({
          concept: (p.concept as string) ?? '',
          introducedIn: (p.introducedIn as string) ?? 'NOT FOUND',
          status: (p.status as 'SATISFIED' | 'MISSING' | 'ASSUMED') ?? 'ASSUMED',
        })
      ),
      assessmentAlignment: {
        alignmentScore: parsed.assessmentAlignment?.alignmentScore ?? 50,
        misalignments: (parsed.assessmentAlignment?.misalignments ?? []).map(
          (m: Record<string, unknown>) => ({
            sectionIndex: (m.sectionIndex as number) ?? 0,
            sectionTitle: (m.sectionTitle as string) ?? '',
            sectionBloomsLevel: (m.sectionBloomsLevel as BloomsLevel) ?? 'UNDERSTAND',
            questionIndex: (m.questionIndex as number) ?? 0,
            questionBloomsLevel: (m.questionBloomsLevel as BloomsLevel) ?? 'REMEMBER',
            issue: (m.issue as string) ?? '',
          })
        ),
        uncoveredObjectives: parsed.assessmentAlignment?.uncoveredObjectives ?? [],
      },
      timeValidation: {
        totalEstimatedTime: parsed.timeValidation?.totalEstimatedTime ?? 0,
        isRealistic: parsed.timeValidation?.isRealistic ?? true,
        issues: (parsed.timeValidation?.issues ?? []).map((t: Record<string, unknown>) => ({
          sectionIndex: (t.sectionIndex as number) ?? 0,
          sectionTitle: (t.sectionTitle as string) ?? '',
          estimatedTime: (t.estimatedTime as number) ?? 0,
          issue: (t.issue as string) ?? '',
          recommendation: (t.recommendation as string) ?? '',
        })),
      },
      issues: (parsed.issues ?? []).map((issue: Record<string, unknown>) => ({
        sectionIndex: issue.sectionIndex as number | null,
        sectionTitle: issue.sectionTitle as string | null,
        type: (issue.type as string) ?? 'CONTENT',
        severity: (issue.severity as string) ?? 'MEDIUM',
        title: (issue.title as string) ?? 'Unknown issue',
        description: (issue.description as string) ?? '',
        evidence: (issue.evidence as string[]) ?? [],
        fix: {
          action: ((issue.fix as Record<string, unknown>)?.action as string) ?? 'modify',
          what: ((issue.fix as Record<string, unknown>)?.what as string) ?? '',
          why: ((issue.fix as Record<string, unknown>)?.why as string) ?? '',
          how: ((issue.fix as Record<string, unknown>)?.how as string) ?? '',
          suggestedContent:
            ((issue.fix as Record<string, unknown>)?.suggestedContent as string) ?? undefined,
        },
      })),
      gagneEventsCheck: {
        gainAttention: parsed.gagneEventsCheck?.gainAttention ?? false,
        informObjectives: parsed.gagneEventsCheck?.informObjectives ?? false,
        stimulateRecall: parsed.gagneEventsCheck?.stimulateRecall ?? false,
        presentContent: parsed.gagneEventsCheck?.presentContent ?? true,
        provideGuidance: parsed.gagneEventsCheck?.provideGuidance ?? false,
        elicitPerformance: parsed.gagneEventsCheck?.elicitPerformance ?? false,
        provideFeedback: parsed.gagneEventsCheck?.provideFeedback ?? false,
        assessPerformance: parsed.gagneEventsCheck?.assessPerformance ?? false,
        enhanceRetention: parsed.gagneEventsCheck?.enhanceRetention ?? false,
        missingEvents: parsed.gagneEventsCheck?.missingEvents ?? [],
      },
      thinking: parsed.thinking ?? '',
    };
  } catch {
    // On parse failure, return ERROR state scores (not fake 50s)
    // so the course creator knows the analysis failed and needs attention
    return {
      chapterIndex,
      chapterTitle,
      primaryBloomsLevel: 'REMEMBER',
      bloomsDistribution: {
        REMEMBER: 100,
        UNDERSTAND: 0,
        APPLY: 0,
        ANALYZE: 0,
        EVALUATE: 0,
        CREATE: 0,
      },
      sectionBloomsLevels: [],
      consistencyScore: 0,
      flowScore: 0,
      qualityScore: 0,
      keyTopics: [],
      prerequisiteConcepts: [],
      assessmentAlignment: {
        alignmentScore: 0,
        misalignments: [],
        uncoveredObjectives: [],
      },
      timeValidation: {
        totalEstimatedTime: 0,
        isRealistic: false,
        issues: [],
      },
      issues: [
        {
          sectionIndex: null,
          sectionTitle: null,
          type: 'CONTENT',
          severity: 'CRITICAL',
          title: 'AI Analysis Failed for This Chapter',
          description: 'The AI analysis could not be completed for this chapter. This typically indicates the chapter content is missing, malformed, or could not be processed. Please review the chapter content manually and ensure it has substantive educational material.',
          evidence: ['AI response could not be parsed'],
          fix: {
            action: 'modify',
            what: 'Add or fix chapter content',
            why: 'Without analyzable content, the chapter cannot serve its educational purpose',
            how: 'Review each section in this chapter and ensure it has: (1) body content, (2) learning objectives, (3) clear explanations of concepts',
          },
        },
      ],
      gagneEventsCheck: {
        gainAttention: false,
        informObjectives: false,
        stimulateRecall: false,
        presentContent: false,
        provideGuidance: false,
        elicitPerformance: false,
        provideFeedback: false,
        assessPerformance: false,
        enhanceRetention: false,
        missingEvents: [
          'Gain Attention', 'Inform Objectives', 'Stimulate Recall',
          'Present Content', 'Provide Guidance', 'Elicit Performance',
          'Provide Feedback', 'Assess Performance', 'Enhance Retention',
        ],
      },
      thinking: 'Parse error occurred - returning error state with zero scores',
    };
  }
}

/**
 * Build a summary from chapter analysis result
 */
export function buildChapterSummaryFromResult(result: ChapterAnalysisResult): ChapterSummary {
  return {
    chapterIndex: result.chapterIndex,
    title: result.chapterTitle,
    primaryBloomsLevel: result.primaryBloomsLevel,
    sectionCount: 0, // Will be filled by caller
    keyTopics: result.keyTopics,
    objectivesCount: 0, // Will be filled by caller
  };
}
