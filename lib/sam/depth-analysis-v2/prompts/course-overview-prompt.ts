/**
 * Course Overview Analysis Prompt
 *
 * Generates a comprehensive prompt for AI to analyze the overall course structure,
 * Bloom's taxonomy balance, and identify high-level issues.
 *
 * Enhanced with full course data and expert reviewer context.
 */

import type { CourseInput, BloomsLevel } from '../types';
import { getStageSystemPrompt } from './system-prompt';

export interface CourseOverviewContext {
  title: string;
  description: string | null;
  courseGoals: string | null;
  whatYouWillLearn: string[];
  prerequisites: string | null;
  difficulty: string | null;
  totalChapters: number;
  totalSections: number;
  totalAssessments: number;
  totalQuestions: number;
  estimatedDuration: string | null;
  chapters: Array<{
    position: number;
    title: string;
    description: string | null;
    sectionCount: number;
    totalContentLength: number;
    hasObjectives: boolean;
    hasAssessments: boolean;
    assessmentCount: number;
    sectionTitles: string[];
  }>;
}

/**
 * Build comprehensive context object from course input
 */
export function buildCourseOverviewContext(course: CourseInput): CourseOverviewContext {
  let totalSections = 0;
  let totalAssessments = 0;
  let totalQuestions = 0;

  const chapters = course.chapters.map((chapter) => {
    let chapterContentLength = 0;
    let chapterAssessmentCount = 0;
    let chapterQuestionCount = 0;
    let chapterHasObjectives = false;
    const sectionTitles: string[] = [];

    for (const section of chapter.sections) {
      totalSections++;
      sectionTitles.push(section.title);
      chapterContentLength += (section.content?.length ?? 0) + (section.description?.length ?? 0);

      if (section.objectives && section.objectives.length > 0) {
        chapterHasObjectives = true;
      }

      for (const exam of section.exams ?? []) {
        totalAssessments++;
        chapterAssessmentCount++;
        chapterQuestionCount += exam.questions?.length ?? 0;
        totalQuestions += exam.questions?.length ?? 0;
      }
    }

    return {
      position: chapter.position,
      title: chapter.title,
      description: chapter.description,
      sectionCount: chapter.sections.length,
      totalContentLength: chapterContentLength,
      hasObjectives: chapterHasObjectives,
      hasAssessments: chapterAssessmentCount > 0,
      assessmentCount: chapterAssessmentCount,
      sectionTitles,
    };
  });

  return {
    title: course.title,
    description: course.description,
    courseGoals: course.courseGoals,
    whatYouWillLearn: course.whatYouWillLearn,
    prerequisites: course.prerequisites,
    difficulty: course.difficulty,
    totalChapters: course.chapters.length,
    totalSections,
    totalAssessments,
    totalQuestions,
    estimatedDuration: null, // Will be calculated from content
    chapters,
  };
}

/**
 * Build the course overview analysis prompt with full context
 */
export function buildCourseOverviewPrompt(context: CourseOverviewContext): string {
  const chaptersDetail = context.chapters
    .map(
      (ch) => `
### Chapter ${ch.position}: ${ch.title}
- Description: ${ch.description || 'No description'}
- Sections (${ch.sectionCount}): ${ch.sectionTitles.join(', ')}
- Content Volume: ~${Math.round(ch.totalContentLength / 200)} min reading
- Learning Objectives: ${ch.hasObjectives ? 'Yes' : 'Missing'}
- Assessments: ${ch.hasAssessments ? `Yes (${ch.assessmentCount} exams)` : 'None'}`
    )
    .join('\n');

  return `## Course Under Review

### Course Metadata
- **Title**: ${context.title}
- **Description**: ${context.description || 'No description provided'}
- **Stated Goals**: ${context.courseGoals || 'No goals specified'}
- **Prerequisites**: ${context.prerequisites || 'None specified'}
- **Difficulty Level**: ${context.difficulty || 'Not specified'}

### What Students Will Learn
${context.whatYouWillLearn.length > 0 ? context.whatYouWillLearn.map((item, i) => `${i + 1}. ${item}`).join('\n') : 'Not specified'}

### Course Structure Statistics
- Total Chapters: ${context.totalChapters}
- Total Sections: ${context.totalSections}
- Total Assessments: ${context.totalAssessments}
- Total Assessment Questions: ${context.totalQuestions}
- Average Sections per Chapter: ${(context.totalSections / Math.max(1, context.totalChapters)).toFixed(1)}

### Chapter Details
${chaptersDetail}

---

## Your Analysis Task

Conduct a comprehensive course-level review covering:

### 1. Structure Quality Assessment
- Is the chapter count appropriate for the course scope?
- Are sections evenly distributed across chapters?
- Are there any empty or thin chapters?
- Is the overall organization logical?

### 2. Bloom's Taxonomy Balance (Course Level)
Based on chapter titles and descriptions, estimate the cognitive level distribution.
Consider the stated difficulty level when evaluating appropriateness.

### 3. Learning Goals Analysis
- Are the stated goals clear and measurable?
- Can these goals be achieved with the current structure?
- Are there goals that appear uncovered by any chapter?

### 4. Missing Topics Detection
- Based on the course title and goals, what essential topics appear to be missing?
- Are there industry-standard topics that should be included?

### 5. Structural Issues
Identify any high-level structural problems that impact learning.

---

## Scoring Rubric (CRITICAL - Follow This Exactly)

### overallScore (0-100): Overall course quality based on structure review
- **90-100**: Excellent structure, clear goals, well-organized chapters, comprehensive content
- **80-89**: Good structure and content with minor organizational improvements needed
- **70-79**: Acceptable structure and content but missing some important elements
- **60-69**: Has structure AND content but needs significant improvements
- **40-59**: Some content exists but many chapters/sections are empty
- **20-39**: Mostly empty — structure exists but almost no educational content
- **5-19**: Only titles exist; no descriptions, no body content, no objectives
- **0-4**: Fundamentally broken or completely empty course

**CRITICAL SCORING RULES — BE HONEST**:
- A course with multiple chapters, sections, AND body content: score 60+
- A course with good structure but missing body content: score 10-25 (titles do NOT teach students)
- A course with only titles (no descriptions, no content): score 5-15
- Look at "Content Volume" for each chapter — if most show "~0 min reading", the course is EMPTY
- NEVER give 40+ to a course where most chapters have zero content
- Your purpose is to HELP the creator by honestly reporting what is missing
- For every chapter with 0 content volume, create a CRITICAL structureIssue

---

## Response Format

Respond ONLY with valid JSON (no markdown code blocks, no extra text):

{
  "overallScore": <number 0-100>,
  "bloomsAssessment": "<well-balanced | bottom-heavy | top-heavy>",
  "bloomsReasoning": "<detailed explanation of cognitive level distribution and appropriateness for difficulty level>",
  "bloomsDistribution": {
    "REMEMBER": <estimated percentage>,
    "UNDERSTAND": <estimated percentage>,
    "APPLY": <estimated percentage>,
    "ANALYZE": <estimated percentage>,
    "EVALUATE": <estimated percentage>,
    "CREATE": <estimated percentage>
  },
  "strengths": [
    "<specific strength with evidence>"
  ],
  "weaknesses": [
    "<specific weakness with evidence>"
  ],
  "missingTopics": [
    {
      "topic": "<topic name>",
      "importance": "<CRITICAL | HIGH | MEDIUM>",
      "reason": "<why this topic should be included>",
      "suggestedPlacement": "<where in the course it should go>"
    }
  ],
  "goalCoverage": {
    "coveredGoals": ["<goal that is covered>"],
    "uncoveredGoals": ["<goal not addressed by current structure>"],
    "coverageScore": <0-100>
  },
  "structureIssues": [
    {
      "type": "STRUCTURE",
      "severity": "<CRITICAL | HIGH | MEDIUM | LOW>",
      "title": "<short descriptive title>",
      "description": "<detailed explanation of the issue>",
      "affectedChapters": [<0-based chapter indices>],
      "evidence": ["<specific observation>"],
      "fix": {
        "action": "<add | modify | remove | reorder | split | merge>",
        "what": "<what needs to change>",
        "why": "<educational rationale>",
        "how": "<step-by-step instructions>"
      }
    }
  ],
  "recommendedImprovements": [
    {
      "priority": <1-5>,
      "improvement": "<what to improve>",
      "impact": "<expected impact on learning>",
      "effort": "<LOW | MEDIUM | HIGH>"
    }
  ],
  "thinking": "<your detailed analysis reasoning process>"
}`;
}

/**
 * Get the system prompt for course overview analysis
 */
export function getCourseOverviewSystemPrompt(): string {
  return getStageSystemPrompt('overview');
}

/**
 * Parse the AI response for course overview
 */
export interface CourseOverviewResult {
  overallScore: number;
  bloomsAssessment: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
  bloomsReasoning: string;
  bloomsDistribution: Record<BloomsLevel, number>;
  strengths: string[];
  weaknesses: string[];
  missingTopics: Array<{
    topic: string;
    importance: string;
    reason: string;
    suggestedPlacement: string;
  }>;
  goalCoverage: {
    coveredGoals: string[];
    uncoveredGoals: string[];
    coverageScore: number;
  };
  structureIssues: Array<{
    type: string;
    severity: string;
    title: string;
    description: string;
    affectedChapters: number[];
    evidence: string[];
    fix: {
      action: string;
      what: string;
      why: string;
      how: string;
    };
  }>;
  recommendedImprovements: Array<{
    priority: number;
    improvement: string;
    impact: string;
    effort: string;
  }>;
  thinking: string;
}

export function parseCourseOverviewResponse(responseText: string): CourseOverviewResult {
  try {
    // Try to extract JSON from the response
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
      overallScore: Math.min(100, Math.max(0, parsed.overallScore ?? 50)),
      bloomsAssessment: parsed.bloomsAssessment ?? 'bottom-heavy',
      bloomsReasoning: parsed.bloomsReasoning ?? '',
      bloomsDistribution: {
        REMEMBER: parsed.bloomsDistribution?.REMEMBER ?? defaultDistribution.REMEMBER,
        UNDERSTAND: parsed.bloomsDistribution?.UNDERSTAND ?? defaultDistribution.UNDERSTAND,
        APPLY: parsed.bloomsDistribution?.APPLY ?? defaultDistribution.APPLY,
        ANALYZE: parsed.bloomsDistribution?.ANALYZE ?? defaultDistribution.ANALYZE,
        EVALUATE: parsed.bloomsDistribution?.EVALUATE ?? defaultDistribution.EVALUATE,
        CREATE: parsed.bloomsDistribution?.CREATE ?? defaultDistribution.CREATE,
      },
      strengths: parsed.strengths ?? [],
      weaknesses: parsed.weaknesses ?? [],
      missingTopics: (parsed.missingTopics ?? []).map((t: Record<string, unknown>) => ({
        topic: (t.topic as string) ?? '',
        importance: (t.importance as string) ?? 'MEDIUM',
        reason: (t.reason as string) ?? '',
        suggestedPlacement: (t.suggestedPlacement as string) ?? '',
      })),
      goalCoverage: {
        coveredGoals: parsed.goalCoverage?.coveredGoals ?? [],
        uncoveredGoals: parsed.goalCoverage?.uncoveredGoals ?? [],
        coverageScore: parsed.goalCoverage?.coverageScore ?? 50,
      },
      structureIssues: (parsed.structureIssues ?? []).map((issue: Record<string, unknown>) => ({
        type: (issue.type as string) ?? 'STRUCTURE',
        severity: (issue.severity as string) ?? 'MEDIUM',
        title: (issue.title as string) ?? '',
        description: (issue.description as string) ?? '',
        affectedChapters: (issue.affectedChapters as number[]) ?? [],
        evidence: (issue.evidence as string[]) ?? [],
        fix: {
          action: ((issue.fix as Record<string, unknown>)?.action as string) ?? 'modify',
          what: ((issue.fix as Record<string, unknown>)?.what as string) ?? '',
          why: ((issue.fix as Record<string, unknown>)?.why as string) ?? '',
          how: ((issue.fix as Record<string, unknown>)?.how as string) ?? '',
        },
      })),
      recommendedImprovements: (parsed.recommendedImprovements ?? []).map(
        (imp: Record<string, unknown>) => ({
          priority: (imp.priority as number) ?? 3,
          improvement: (imp.improvement as string) ?? '',
          impact: (imp.impact as string) ?? '',
          effort: (imp.effort as string) ?? 'MEDIUM',
        })
      ),
      thinking: parsed.thinking ?? '',
    };
  } catch {
    // On parse failure, return ERROR state (not fake 50s)
    return {
      overallScore: 0,
      bloomsAssessment: 'bottom-heavy' as const,
      bloomsReasoning: 'AI analysis failed — could not parse response. Course content may be missing or malformed.',
      bloomsDistribution: {
        REMEMBER: 100,
        UNDERSTAND: 0,
        APPLY: 0,
        ANALYZE: 0,
        EVALUATE: 0,
        CREATE: 0,
      },
      strengths: [],
      weaknesses: ['AI analysis could not be completed — review course content manually'],
      missingTopics: [],
      goalCoverage: {
        coveredGoals: [],
        uncoveredGoals: [],
        coverageScore: 0,
      },
      structureIssues: [
        {
          type: 'STRUCTURE',
          severity: 'CRITICAL',
          title: 'AI Analysis Failed',
          description: 'The AI could not analyze the course structure. This usually means the course lacks content or the response was malformed. Review the course and ensure chapters have body content.',
          affectedChapters: [],
          evidence: ['AI response could not be parsed'],
          fix: {
            action: 'modify',
            what: 'Ensure all chapters and sections have body content',
            why: 'A course without content cannot be analyzed or provide educational value',
            how: 'Add learning material (text, examples, exercises) to every section in the course',
          },
        },
      ],
      recommendedImprovements: [
        {
          priority: 1,
          improvement: 'Add body content to all sections',
          impact: 'Essential for course to function as educational material',
          effort: 'HIGH',
        },
      ],
      thinking: 'Parse error occurred — returning error state',
    };
  }
}
