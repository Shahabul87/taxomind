/**
 * AI Analyzer for Depth Analysis V2
 *
 * Orchestrates AI-powered course analysis using structured prompts
 * with expert reviewer persona for comprehensive pedagogical review.
 *
 * Enhanced with:
 * - Expert reviewer system prompts (Dr. Sarah Chen persona)
 * - Full course content analysis (not just previews)
 * - Assessment-Bloom's alignment validation
 * - Time estimation validation
 * - Prerequisite chain validation
 * - Gagné's Nine Events checking
 */

import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import { AIAccessDeniedError } from '@/lib/ai/enterprise-client';
import { logger } from '@/lib/logger';
import { nanoid } from 'nanoid';
import type {
  CourseInput,
  BloomsLevel,
  AnalysisIssue,
  IssueType,
  IssueSeverity,
  BloomsDistribution,
} from './types';
import {
  getCourseReviewerSystemPrompt,
  getCourseOverviewSystemPrompt,
  getChapterAnalysisSystemPrompt,
  getCrossChapterSystemPrompt,
  buildCourseOverviewContext,
  buildCourseOverviewPrompt,
  parseCourseOverviewResponse,
  buildChapterContext,
  buildChapterAnalysisPrompt,
  parseChapterAnalysisResponse,
  buildChapterSummaryFromResult,
  buildCrossChapterContext,
  buildCrossChapterPrompt,
  parseCrossChapterResponse,
  type ChapterSummary,
  type ChapterAnalysisResult,
  type CourseOverviewResult,
  type CrossChapterAnalysisResult,
} from './prompts';
import {
  determineAnalysisMode,
  TOKEN_LIMITS,
  type AnalysisMode,
} from './token-estimator';

// =============================================================================
// TYPES
// =============================================================================

export interface AIAnalysisProgress {
  type:
    | 'analysis_start'
    | 'stage_start'
    | 'analyzing_item'
    | 'thinking'
    | 'issue_found'
    | 'stage_complete'
    | 'progress'
    | 'error';
  data: Record<string, unknown>;
}

export interface AIAnalyzerOptions {
  courseId: string;
  course: CourseInput;
  userId: string;
  onProgress?: (event: AIAnalysisProgress) => void;
}

export interface AIAnalysisResult {
  // Method used
  analysisMethod: 'ai' | 'hybrid';
  analysisMode: AnalysisMode;

  // Overview results
  overview: CourseOverviewResult;

  // Chapter results
  chapters: ChapterAnalysisResult[];
  chapterSummaries: EnhancedChapterSummary[];

  // Cross-chapter results
  crossChapter: CrossChapterAnalysisResult;

  // Aggregated scores
  scores: {
    overall: number;
    depth: number;
    consistency: number;
    flow: number;
    quality: number;
    assessmentAlignment: number;
    timeValidation: number;
  };

  // Bloom's distribution
  bloomsDistribution: BloomsDistribution;
  bloomsBalance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';

  // All issues
  allIssues: AnalysisIssue[];

  // New: Aggregated analysis data
  prerequisiteChain: PrerequisiteChainResult;
  assessmentSummary: AssessmentSummary;
  timeSummary: TimeSummary;
  overallAssessment: OverallAssessment;
}

// Enhanced chapter summary with new analysis data
interface EnhancedChapterSummary extends ChapterSummary {
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

interface PrerequisiteChainResult {
  allConcepts: Array<{
    concept: string;
    introducedInChapter: number | null;
    usedInChapters: number[];
    status: 'SATISFIED' | 'MISSING' | 'ASSUMED';
  }>;
  missingPrerequisitesCount: number;
  assumedPrerequisitesCount: number;
  circularDependencies: Array<{
    conceptA: string;
    conceptB: string;
  }>;
}

interface AssessmentSummary {
  totalAlignmentScore: number;
  totalMisalignments: number;
  totalUncoveredObjectives: number;
  chaptersWithIssues: number[];
}

interface TimeSummary {
  totalEstimatedTime: number;
  averageChapterTime: number;
  unrealisticChapters: number[];
  timeIssuesCount: number;
}

interface OverallAssessment {
  readyForPublication: boolean;
  criticalIssuesCount: number;
  highPriorityIssuesCount: number;
  topImprovements: string[];
}

// =============================================================================
// MAIN ANALYZER
// =============================================================================

/**
 * Run AI-powered course analysis with expert reviewer persona
 */
export async function runAIAnalysis(
  options: AIAnalyzerOptions
): Promise<AIAnalysisResult> {
  const { course, userId, onProgress } = options;

  // Determine analysis mode
  const { mode, estimatedApiCalls, estimatedTime, totalTokens } =
    determineAnalysisMode(course);

  logger.info('[AIAnalyzer] Starting enhanced analysis', {
    courseId: options.courseId,
    mode,
    totalTokens,
    chapters: course.chapters.length,
  });

  onProgress?.({
    type: 'analysis_start',
    data: {
      analysisMode: mode,
      estimatedTime,
      estimatedApiCalls,
      courseTitle: course.title,
      chaptersCount: course.chapters.length,
      reviewerPersona: 'Dr. Sarah Chen - Expert Instructional Designer',
    },
  });

  // Initialize results
  const result: AIAnalysisResult = {
    analysisMethod: 'ai',
    analysisMode: mode,
    overview: {} as CourseOverviewResult,
    chapters: [],
    chapterSummaries: [],
    crossChapter: {} as CrossChapterAnalysisResult,
    scores: {
      overall: 0,
      depth: 0,
      consistency: 0,
      flow: 0,
      quality: 0,
      assessmentAlignment: 0,
      timeValidation: 0,
    },
    bloomsDistribution: {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    },
    bloomsBalance: 'bottom-heavy',
    allIssues: [],
    prerequisiteChain: {
      allConcepts: [],
      missingPrerequisitesCount: 0,
      assumedPrerequisitesCount: 0,
      circularDependencies: [],
    },
    assessmentSummary: {
      totalAlignmentScore: 0,
      totalMisalignments: 0,
      totalUncoveredObjectives: 0,
      chaptersWithIssues: [],
    },
    timeSummary: {
      totalEstimatedTime: 0,
      averageChapterTime: 0,
      unrealisticChapters: [],
      timeIssuesCount: 0,
    },
    overallAssessment: {
      readyForPublication: false,
      criticalIssuesCount: 0,
      highPriorityIssuesCount: 0,
      topImprovements: [],
    },
  };

  let progressPercent = 0;

  // ==========================================================================
  // Stage 1: Course Overview Analysis
  // ==========================================================================
  onProgress?.({
    type: 'stage_start',
    data: {
      stage: 'overview',
      message: 'SAM is reviewing course structure...',
    },
  });

  try {
    const overviewContext = buildCourseOverviewContext(course);
    const overviewPrompt = buildCourseOverviewPrompt(overviewContext);
    const systemPrompt = getCourseOverviewSystemPrompt();

    const overviewResponse = await runSAMChatWithPreference({
      userId,
      capability: 'analysis',
      maxTokens: TOKEN_LIMITS.MAX_RESPONSE,
      temperature: 0.3,
      systemPrompt,
      messages: [{ role: 'user', content: overviewPrompt }],
      extended: true, // Use 180s timeout for complex analysis
    });

    result.overview = parseCourseOverviewResponse(overviewResponse);

    // Add structure issues from overview
    for (const structureIssue of result.overview.structureIssues) {
      const issue = convertOverviewIssue(structureIssue, course);
      result.allIssues.push(issue);
      onProgress?.({ type: 'issue_found', data: { issue } });
    }

    // Add missing topics as issues
    for (const missingTopic of result.overview.missingTopics) {
      if (missingTopic.importance === 'CRITICAL' || missingTopic.importance === 'HIGH') {
        const issue: AnalysisIssue = {
          id: nanoid(),
          type: 'CONTENT',
          severity: missingTopic.importance as IssueSeverity,
          status: 'OPEN',
          location: {},
          title: `Missing Topic: ${missingTopic.topic}`,
          description: missingTopic.reason,
          evidence: [],
          impact: {
            area: 'Course Completeness',
            description: `Essential topic "${missingTopic.topic}" is not covered`,
          },
          fix: {
            action: 'add',
            what: `Add content covering "${missingTopic.topic}"`,
            why: missingTopic.reason,
            how: `Create a new section or chapter for "${missingTopic.topic}" at ${missingTopic.suggestedPlacement}`,
          },
        };
        result.allIssues.push(issue);
        onProgress?.({ type: 'issue_found', data: { issue } });
      }
    }

    progressPercent = 15;
    onProgress?.({
      type: 'progress',
      data: { percent: progressPercent, stage: 'overview' },
    });

    onProgress?.({
      type: 'thinking',
      data: {
        stage: 'overview',
        thinking: result.overview.thinking || 'Analyzed course structure and goals',
      },
    });
  } catch (error) {
    // Re-throw access denied errors — no point continuing without AI access
    if (error instanceof AIAccessDeniedError) throw error;

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error('[AIAnalyzer] Overview analysis failed', {
      errorMessage,
      errorStack,
      errorType: error?.constructor?.name,
    });
    result.overview = getDefaultOverviewResult();
    onProgress?.({
      type: 'error',
      data: {
        stage: 'overview',
        message: errorMessage,
      },
    });
  }

  onProgress?.({
    type: 'stage_complete',
    data: { stage: 'overview', result: result.overview },
  });

  // ==========================================================================
  // Stage 2: Per-Chapter Deep Analysis
  // ==========================================================================
  onProgress?.({
    type: 'stage_start',
    data: {
      stage: 'chapters',
      message: `SAM is reviewing ${course.chapters.length} chapters in depth...`,
    },
  });

  const progressPerChapter = 60 / course.chapters.length;
  const allKeyTopics: string[] = [];
  const allPrerequisiteConcepts: PrerequisiteChainResult['allConcepts'] = [];

  for (let i = 0; i < course.chapters.length; i++) {
    const chapter = course.chapters[i];

    onProgress?.({
      type: 'analyzing_item',
      data: {
        item: `Chapter ${i + 1}: ${chapter.title}`,
        chapterIndex: i,
        totalChapters: course.chapters.length,
      },
    });

    // ====================================================================
    // Content Validation: Check if chapter has actual content before AI call
    // ====================================================================
    const totalContentLength = chapter.sections.reduce(
      (sum, s) => sum + (s.content?.length ?? 0),
      0
    );
    const sectionsWithContent = chapter.sections.filter(
      (s) => s.content && s.content.length > 50
    ).length;
    const isEmptyChapter = totalContentLength < 100 && sectionsWithContent === 0;

    if (isEmptyChapter) {
      // Skip expensive AI call for empty chapters — generate honest issues directly
      logger.info('[AIAnalyzer] Skipping AI call for empty chapter', {
        chapterIndex: i,
        chapterTitle: chapter.title,
        totalContentLength,
      });

      const emptyChapterResult: ChapterAnalysisResult = {
        chapterIndex: i,
        chapterTitle: chapter.title,
        primaryBloomsLevel: 'REMEMBER',
        bloomsDistribution: {
          // All zeros — there is no content to classify at ANY cognitive level.
          // This ensures depth score = 0 for empty chapters (no false 20 from REMEMBER:100).
          REMEMBER: 0,
          UNDERSTAND: 0,
          APPLY: 0,
          ANALYZE: 0,
          EVALUATE: 0,
          CREATE: 0,
        },
        sectionBloomsLevels: chapter.sections.map((s, sIdx) => ({
          sectionIndex: sIdx,
          sectionTitle: s.title,
          primaryLevel: 'REMEMBER' as BloomsLevel,
          reasoning: 'No content to analyze — cannot determine cognitive level',
        })),
        consistencyScore: 0,
        flowScore: 0,
        qualityScore: Math.min(15, Math.round(totalContentLength / 20)),
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
          // Chapter-level issue
          {
            sectionIndex: null,
            sectionTitle: null,
            type: 'CONTENT',
            severity: 'CRITICAL',
            title: `Empty Chapter: "${chapter.title}" has no body content`,
            description: `This chapter has ${chapter.sections.length} section(s) but virtually no educational content (${totalContentLength} characters total). Students cannot learn from empty pages. This is the #1 priority to fix.`,
            evidence: [
              `Total content: ${totalContentLength} characters (${Math.round(totalContentLength / 200)} min reading)`,
              `Sections with content: ${sectionsWithContent} of ${chapter.sections.length}`,
            ],
            fix: {
              action: 'add',
              what: 'Add comprehensive educational content to every section',
              why: 'A chapter without body content provides zero educational value, regardless of how well the titles are structured',
              how: `For each of the ${chapter.sections.length} sections: (1) Write explanatory text covering the topic, (2) Add examples and illustrations, (3) Include practice exercises, (4) Define learning objectives`,
            },
          },
          // Per-section issues
          ...chapter.sections.map((s, sIdx) => ({
            sectionIndex: sIdx,
            sectionTitle: s.title,
            type: 'CONTENT' as const,
            severity: (!s.content || s.content.length < 50 ? 'CRITICAL' : 'MEDIUM') as string,
            title: `Empty Section: "${s.title}"`,
            description: !s.content || s.content.length < 50
              ? `Section "${s.title}" has no body content. Add educational material.`
              : `Section "${s.title}" has minimal content (${s.content.length} chars). Expand with more detail.`,
            evidence: [
              `Content length: ${s.content?.length ?? 0} characters`,
              s.objectives && s.objectives.length > 0 ? `Has ${s.objectives.length} objectives but no content to cover them` : 'No learning objectives defined',
            ],
            fix: {
              action: 'add' as const,
              what: `Write educational content for "${s.title}"`,
              why: 'Every section needs substantive content for students to learn from',
              how: `Write at least 500-1000 words covering the topic. Include: (1) Explanation of key concepts, (2) Examples, (3) Practice exercises`,
            },
          })),
        ],
        gagneEventsCheck: {
          gainAttention: false,
          informObjectives: chapter.sections.some((s) => s.objectives && s.objectives.length > 0),
          stimulateRecall: false,
          presentContent: false,
          provideGuidance: false,
          elicitPerformance: false,
          provideFeedback: false,
          assessPerformance: chapter.sections.some((s) => s.exams && s.exams.length > 0),
          enhanceRetention: false,
          missingEvents: [
            'Gain Attention', 'Stimulate Recall', 'Present Content',
            'Provide Guidance', 'Elicit Performance', 'Provide Feedback',
            'Enhance Retention',
          ],
        },
        thinking: `Chapter "${chapter.title}" has ${chapter.sections.length} sections but only ${totalContentLength} characters of content. This is essentially an empty shell.`,
      };

      result.chapters.push(emptyChapterResult);

      const enhancedSummary: EnhancedChapterSummary = {
        ...buildChapterSummaryFromResult(emptyChapterResult),
        sectionCount: chapter.sections.length,
        objectivesCount: chapter.sections.reduce(
          (sum, s) => sum + (s.objectives?.length || 0),
          0
        ),
      };
      result.chapterSummaries.push(enhancedSummary);

      // Add issues to the allIssues list
      for (const issue of emptyChapterResult.issues) {
        const fullIssue = convertChapterIssue(issue, chapter, i, course);
        result.allIssues.push(fullIssue);
        onProgress?.({ type: 'issue_found', data: { issue: fullIssue } });
      }

      onProgress?.({
        type: 'thinking',
        data: {
          stage: 'chapters',
          chapter: chapter.title,
          thinking: `Chapter "${chapter.title}" is empty — created ${emptyChapterResult.issues.length} issues for missing content`,
        },
      });

      progressPercent = 15 + (i + 1) * progressPerChapter;
      onProgress?.({
        type: 'progress',
        data: { percent: Math.round(progressPercent), stage: 'chapters' },
      });
      continue; // Skip to next chapter
    }

    try {
      const chapterContext = buildChapterContext(
        course,
        i,
        result.chapterSummaries
      );
      const chapterPrompt = buildChapterAnalysisPrompt(chapterContext);
      const systemPrompt = getChapterAnalysisSystemPrompt();

      const chapterResponse = await runSAMChatWithPreference({
        userId,
        capability: 'analysis',
        maxTokens: TOKEN_LIMITS.MAX_RESPONSE + 2000, // Extra for detailed chapter analysis
        temperature: 0.3,
        systemPrompt,
        messages: [{ role: 'user', content: chapterPrompt }],
        extended: true, // Use 180s timeout for complex analysis
      });

      const chapterResult = parseChapterAnalysisResponse(
        chapterResponse,
        i,
        chapter.title
      );

      result.chapters.push(chapterResult);

      // Build enhanced summary with new analysis data
      const enhancedSummary: EnhancedChapterSummary = {
        ...buildChapterSummaryFromResult(chapterResult),
        sectionCount: chapter.sections.length,
        objectivesCount: chapter.sections.reduce(
          (sum, s) => sum + (s.objectives?.length || 0),
          0
        ),
        assessmentAlignment: {
          alignmentScore: chapterResult.assessmentAlignment.alignmentScore,
          misalignmentsCount: chapterResult.assessmentAlignment.misalignments.length,
          uncoveredObjectivesCount: chapterResult.assessmentAlignment.uncoveredObjectives.length,
        },
        timeValidation: {
          totalEstimatedTime: chapterResult.timeValidation.totalEstimatedTime,
          isRealistic: chapterResult.timeValidation.isRealistic,
          issueCount: chapterResult.timeValidation.issues.length,
        },
        prerequisiteConcepts: chapterResult.prerequisiteConcepts.map((p) => ({
          concept: p.concept,
          status: p.status,
        })),
        gagneEventsCoverage: Object.values(chapterResult.gagneEventsCheck).filter(
          (v) => v === true
        ).length,
      };

      result.chapterSummaries.push(enhancedSummary);

      // Aggregate key topics
      allKeyTopics.push(...chapterResult.keyTopics);

      // Aggregate prerequisite concepts
      for (const prereq of chapterResult.prerequisiteConcepts) {
        const existing = allPrerequisiteConcepts.find(
          (p) => p.concept.toLowerCase() === prereq.concept.toLowerCase()
        );
        if (existing) {
          if (!existing.usedInChapters.includes(i)) {
            existing.usedInChapters.push(i);
          }
          if (prereq.status === 'SATISFIED' && existing.introducedInChapter === null) {
            existing.introducedInChapter = i;
          }
        } else {
          allPrerequisiteConcepts.push({
            concept: prereq.concept,
            introducedInChapter: prereq.status === 'SATISFIED' ? i : null,
            usedInChapters: [i],
            status: prereq.status,
          });
        }
      }

      // Update assessment summary
      if (chapterResult.assessmentAlignment.misalignments.length > 0) {
        result.assessmentSummary.chaptersWithIssues.push(i);
      }
      result.assessmentSummary.totalMisalignments +=
        chapterResult.assessmentAlignment.misalignments.length;
      result.assessmentSummary.totalUncoveredObjectives +=
        chapterResult.assessmentAlignment.uncoveredObjectives.length;

      // Update time summary
      result.timeSummary.totalEstimatedTime +=
        chapterResult.timeValidation.totalEstimatedTime;
      result.timeSummary.timeIssuesCount += chapterResult.timeValidation.issues.length;
      if (!chapterResult.timeValidation.isRealistic) {
        result.timeSummary.unrealisticChapters.push(i);
      }

      // Convert chapter issues to full issues
      for (const issue of chapterResult.issues) {
        const fullIssue = convertChapterIssue(issue, chapter, i, course);
        result.allIssues.push(fullIssue);
        onProgress?.({ type: 'issue_found', data: { issue: fullIssue } });
      }

      // Add assessment alignment issues
      for (const misalignment of chapterResult.assessmentAlignment.misalignments) {
        const issue: AnalysisIssue = {
          id: nanoid(),
          type: 'ASSESSMENT',
          severity: 'HIGH',
          status: 'OPEN',
          location: {
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            chapterPosition: i,
            sectionId: chapter.sections[misalignment.sectionIndex]?.id,
            sectionTitle: misalignment.sectionTitle,
            sectionPosition: misalignment.sectionIndex,
          },
          title: `Assessment-Content Bloom's Mismatch`,
          description: misalignment.issue,
          evidence: [
            `Section teaches at ${misalignment.sectionBloomsLevel} level`,
            `Assessment question tests at ${misalignment.questionBloomsLevel} level`,
          ],
          impact: {
            area: 'Assessment Validity',
            description: 'Students may be tested on skills not taught in the content',
          },
          fix: {
            action: 'modify',
            what: 'Align assessment question with content cognitive level',
            why: 'Constructive alignment requires assessments to match taught content',
            how: `Revise question ${misalignment.questionIndex + 1} to test at ${misalignment.sectionBloomsLevel} level, or add content that teaches at ${misalignment.questionBloomsLevel} level`,
          },
        };
        result.allIssues.push(issue);
        onProgress?.({ type: 'issue_found', data: { issue } });
      }

      // Add time validation issues
      for (const timeIssue of chapterResult.timeValidation.issues) {
        const issue: AnalysisIssue = {
          id: nanoid(),
          type: 'TIME',
          severity: timeIssue.issue === 'cognitive overload' ? 'HIGH' : 'MEDIUM',
          status: 'OPEN',
          location: {
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            chapterPosition: i,
            sectionId: chapter.sections[timeIssue.sectionIndex]?.id,
            sectionTitle: timeIssue.sectionTitle,
            sectionPosition: timeIssue.sectionIndex,
          },
          title: `Time Issue: Section ${timeIssue.issue}`,
          description: `Section estimated at ${timeIssue.estimatedTime} minutes - ${timeIssue.issue}`,
          evidence: [`Estimated time: ${timeIssue.estimatedTime} minutes`],
          impact: {
            area: 'Learning Experience',
            description:
              timeIssue.issue === 'too long'
                ? 'Learners may experience fatigue or cognitive overload'
                : 'Section may lack sufficient depth or practice opportunity',
          },
          fix: {
            action: timeIssue.issue === 'too long' ? 'split' : 'modify',
            what: timeIssue.recommendation,
            why: 'Optimal section length is 10-20 minutes for effective learning',
            how: timeIssue.recommendation,
          },
        };
        result.allIssues.push(issue);
        onProgress?.({ type: 'issue_found', data: { issue } });
      }

      // Add missing Gagné events as issues
      if (chapterResult.gagneEventsCheck.missingEvents.length > 0) {
        const issue: AnalysisIssue = {
          id: nanoid(),
          type: 'CONTENT',
          severity: chapterResult.gagneEventsCheck.missingEvents.length > 3 ? 'HIGH' : 'MEDIUM',
          status: 'OPEN',
          location: {
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            chapterPosition: i,
          },
          title: `Missing Instructional Events`,
          description: `Chapter is missing ${chapterResult.gagneEventsCheck.missingEvents.length} of Gagné's Nine Events of Instruction`,
          evidence: chapterResult.gagneEventsCheck.missingEvents.map(
            (e) => `Missing: ${e}`
          ),
          impact: {
            area: 'Instructional Design',
            description: 'Incomplete instructional design may reduce learning effectiveness',
          },
          fix: {
            action: 'add',
            what: `Add content for: ${chapterResult.gagneEventsCheck.missingEvents.join(', ')}`,
            why: "Gagné's events ensure complete instructional cycle",
            how: 'Review each missing event and add appropriate content or activities',
          },
        };
        result.allIssues.push(issue);
        onProgress?.({ type: 'issue_found', data: { issue } });
      }

      onProgress?.({
        type: 'thinking',
        data: {
          stage: 'chapters',
          chapter: chapter.title,
          thinking: chapterResult.thinking || `Completed deep analysis of chapter ${i + 1}`,
        },
      });
    } catch (error) {
      // Re-throw access denied errors — no point continuing without AI access
      if (error instanceof AIAccessDeniedError) throw error;

      logger.error('[AIAnalyzer] Chapter analysis failed', {
        chapterIndex: i,
        error,
      });
      result.chapters.push(getDefaultChapterResult(i, chapter.title));
      result.chapterSummaries.push({
        chapterIndex: i,
        title: chapter.title,
        primaryBloomsLevel: 'UNDERSTAND',
        sectionCount: chapter.sections.length,
        keyTopics: [],
        objectivesCount: 0,
      });
    }

    progressPercent = 15 + (i + 1) * progressPerChapter;
    onProgress?.({
      type: 'progress',
      data: { percent: Math.round(progressPercent), stage: 'chapters' },
    });
  }

  // Update prerequisite chain
  result.prerequisiteChain.allConcepts = allPrerequisiteConcepts;
  result.prerequisiteChain.missingPrerequisitesCount = allPrerequisiteConcepts.filter(
    (p) => p.status === 'MISSING'
  ).length;
  result.prerequisiteChain.assumedPrerequisitesCount = allPrerequisiteConcepts.filter(
    (p) => p.status === 'ASSUMED'
  ).length;

  // Calculate average time
  result.timeSummary.averageChapterTime =
    result.timeSummary.totalEstimatedTime / Math.max(1, course.chapters.length);

  onProgress?.({
    type: 'stage_complete',
    data: {
      stage: 'chapters',
      chaptersAnalyzed: result.chapters.length,
      issuesFound: result.allIssues.length,
    },
  });

  // ==========================================================================
  // Stage 3: Cross-Chapter Analysis
  // ==========================================================================
  onProgress?.({
    type: 'stage_start',
    data: {
      stage: 'cross-chapter',
      message: 'SAM is validating cross-chapter consistency and knowledge flow...',
    },
  });

  try {
    const totalSections = course.chapters.reduce(
      (sum, ch) => sum + ch.sections.length,
      0
    );
    const totalAssessments = course.chapters.reduce(
      (sum, ch) =>
        sum + ch.sections.reduce((s, sec) => s + (sec.exams?.length ?? 0), 0),
      0
    );

    const crossChapterContext = buildCrossChapterContext(
      course.title,
      course.courseGoals,
      course.difficulty,
      result.chapterSummaries,
      totalSections,
      course.whatYouWillLearn,
      totalAssessments,
      allKeyTopics,
      allPrerequisiteConcepts
    );
    const crossChapterPrompt = buildCrossChapterPrompt(crossChapterContext);
    const systemPrompt = getCrossChapterSystemPrompt();

    const crossChapterResponse = await runSAMChatWithPreference({
      userId,
      capability: 'analysis',
      maxTokens: TOKEN_LIMITS.MAX_RESPONSE + 2000,
      temperature: 0.3,
      systemPrompt,
      messages: [{ role: 'user', content: crossChapterPrompt }],
      extended: true, // Use 180s timeout for complex analysis
    });

    result.crossChapter = parseCrossChapterResponse(crossChapterResponse);

    // Convert cross-chapter issues
    for (const issue of result.crossChapter.issues) {
      const fullIssue = convertCrossChapterIssue(issue, course);
      result.allIssues.push(fullIssue);
      onProgress?.({ type: 'issue_found', data: { issue: fullIssue } });
    }

    // Add knowledge flow issues
    for (const flowIssue of result.crossChapter.knowledgeFlowIssues) {
      const issue: AnalysisIssue = {
        id: nanoid(),
        type: 'FLOW',
        severity: flowIssue.severity as IssueSeverity,
        status: 'OPEN',
        location: {
          chapterId: course.chapters[flowIssue.usedInChapter]?.id,
          chapterTitle: course.chapters[flowIssue.usedInChapter]?.title,
          chapterPosition: flowIssue.usedInChapter,
        },
        title: `${flowIssue.type.replace(/_/g, ' ')}: ${flowIssue.concept}`,
        description: `Concept "${flowIssue.concept}" is used in chapter ${flowIssue.usedInChapter + 1} but ${flowIssue.type === 'MISSING_PREREQUISITE' ? 'is never introduced' : `should be introduced by chapter ${flowIssue.shouldBeIntroducedBy + 1}`}`,
        evidence: [`Concept: ${flowIssue.concept}`, `Issue type: ${flowIssue.type}`],
        impact: {
          area: 'Knowledge Flow',
          description: 'Students may encounter concepts they have not been taught',
        },
        fix: {
          action: 'add',
          what: flowIssue.fix,
          why: 'Prerequisites must be taught before dependent concepts',
          how: `Add introduction to "${flowIssue.concept}" before chapter ${flowIssue.usedInChapter + 1}`,
        },
      };
      result.allIssues.push(issue);
      onProgress?.({ type: 'issue_found', data: { issue } });
    }

    // Add Bloom's progression issues
    for (const progIssue of result.crossChapter.progressionIssues) {
      const issue: AnalysisIssue = {
        id: nanoid(),
        type: 'FLOW',
        severity: progIssue.severity as IssueSeverity,
        status: 'OPEN',
        location: {
          chapterId: course.chapters[progIssue.toChapter]?.id,
          chapterTitle: course.chapters[progIssue.toChapter]?.title,
          chapterPosition: progIssue.toChapter,
        },
        title: `Cognitive Level Regression`,
        description: progIssue.issue,
        evidence: [
          `From chapter ${progIssue.fromChapter + 1} to chapter ${progIssue.toChapter + 1}`,
        ],
        impact: {
          area: 'Learning Progression',
          description: 'Regression in cognitive level may confuse learners',
        },
        fix: {
          action: 'modify',
          what: progIssue.suggestion,
          why: 'Cognitive levels should generally progress from simple to complex',
          how: progIssue.suggestion,
        },
      };
      result.allIssues.push(issue);
      onProgress?.({ type: 'issue_found', data: { issue } });
    }

    // Add prerequisite issues for missing/assumed prerequisites
    for (const prereq of allPrerequisiteConcepts) {
      if (prereq.status === 'MISSING' || prereq.status === 'ASSUMED') {
        const issue: AnalysisIssue = {
          id: nanoid(),
          type: 'PREREQUISITE',
          severity: prereq.status === 'MISSING' ? 'HIGH' : 'MEDIUM',
          status: 'OPEN',
          location: {
            chapterId:
              prereq.usedInChapters.length > 0
                ? course.chapters[prereq.usedInChapters[0]]?.id
                : undefined,
            chapterTitle:
              prereq.usedInChapters.length > 0
                ? course.chapters[prereq.usedInChapters[0]]?.title
                : undefined,
            chapterPosition: prereq.usedInChapters[0],
          },
          title:
            prereq.status === 'MISSING'
              ? `Missing Prerequisite: ${prereq.concept}`
              : `Assumed Prerequisite: ${prereq.concept}`,
          description:
            prereq.status === 'MISSING'
              ? `The concept "${prereq.concept}" is used but never introduced in the course`
              : `The concept "${prereq.concept}" is assumed known but may need introduction for beginners`,
          evidence: [
            `First used in chapter ${(prereq.usedInChapters[0] ?? 0) + 1}`,
            prereq.introducedInChapter !== null
              ? `Introduced in chapter ${prereq.introducedInChapter + 1}`
              : 'Never formally introduced',
          ],
          impact: {
            area: 'Learning Prerequisites',
            description: 'Students may struggle with concepts that require prior knowledge not covered',
          },
          fix: {
            action: 'add',
            what:
              prereq.status === 'MISSING'
                ? `Add content to introduce "${prereq.concept}" before it is used`
                : `Consider adding brief review of "${prereq.concept}" for beginners`,
            why: 'Prerequisites must be established before dependent content',
            how: `Introduce "${prereq.concept}" in chapter ${Math.max(1, prereq.usedInChapters[0] ?? 1)} or earlier`,
          },
        };
        result.allIssues.push(issue);
        onProgress?.({ type: 'issue_found', data: { issue } });
      }
    }

    // Add content gap issues from duplicate content analysis
    if (result.crossChapter.duplicateContent) {
      for (const duplicate of result.crossChapter.duplicateContent) {
        if (duplicate.similarityScore > 0.7) {
          const issue: AnalysisIssue = {
            id: nanoid(),
            type: 'GAP',
            severity: duplicate.similarityScore > 0.9 ? 'HIGH' : 'MEDIUM',
            status: 'OPEN',
            location: {
              chapterId: course.chapters[duplicate.sourceAChapter]?.id,
              chapterTitle: course.chapters[duplicate.sourceAChapter]?.title,
              chapterPosition: duplicate.sourceAChapter,
            },
            title: `Content Duplication: ${Math.round(duplicate.similarityScore * 100)}% similarity`,
            description: `Similar content found between chapter ${duplicate.sourceAChapter + 1} and chapter ${duplicate.sourceBChapter + 1}`,
            evidence: [
              `Source A: Chapter ${duplicate.sourceAChapter + 1}`,
              `Source B: Chapter ${duplicate.sourceBChapter + 1}`,
              `Similarity: ${Math.round(duplicate.similarityScore * 100)}%`,
            ],
            impact: {
              area: 'Content Efficiency',
              description: 'Duplicate content wastes learner time and may cause confusion',
            },
            fix: {
              action: duplicate.recommendation === 'MERGE' ? 'merge' : 'modify',
              what: duplicate.recommendationReason,
              why: 'Each concept should be taught once with appropriate depth',
              how:
                duplicate.recommendation === 'MERGE'
                  ? 'Combine the content into a single, comprehensive section'
                  : 'Keep the more comprehensive version and reference it from other locations',
            },
          };
          result.allIssues.push(issue);
          onProgress?.({ type: 'issue_found', data: { issue } });
        }
      }
    }

    // Update overall assessment
    result.overallAssessment = result.crossChapter.overallAssessment;

    onProgress?.({
      type: 'thinking',
      data: {
        stage: 'cross-chapter',
        thinking:
          result.crossChapter.thinking || 'Analyzed cross-chapter consistency and flow',
      },
    });
  } catch (error) {
    // Re-throw access denied errors — no point continuing without AI access
    if (error instanceof AIAccessDeniedError) throw error;

    logger.error('[AIAnalyzer] Cross-chapter analysis failed', { error });
    result.crossChapter = getDefaultCrossChapterResult();
  }

  progressPercent = 90;
  onProgress?.({
    type: 'progress',
    data: { percent: progressPercent, stage: 'cross-chapter' },
  });

  onProgress?.({
    type: 'stage_complete',
    data: { stage: 'cross-chapter', result: result.crossChapter },
  });

  // ==========================================================================
  // Stage 4: Calculate Final Scores
  // ==========================================================================
  onProgress?.({
    type: 'stage_start',
    data: { stage: 'finalizing', message: 'SAM is generating final assessment...' },
  });

  result.scores = calculateFinalScores(result);
  result.bloomsDistribution = calculateBloomsDistribution(result.chapters);
  result.bloomsBalance = determineBloomsBalance(result.bloomsDistribution);

  // Calculate assessment alignment score
  const totalAlignmentScores = result.chapters.reduce(
    (sum, ch) => sum + ch.assessmentAlignment.alignmentScore,
    0
  );
  result.assessmentSummary.totalAlignmentScore =
    totalAlignmentScores / Math.max(1, result.chapters.length);
  result.scores.assessmentAlignment = Math.round(result.assessmentSummary.totalAlignmentScore);

  // Calculate time validation score
  const realisticChapters = result.chapters.filter(
    (ch) => ch.timeValidation.isRealistic
  ).length;
  result.scores.timeValidation = Math.round(
    (realisticChapters / Math.max(1, result.chapters.length)) * 100
  );

  // Update overall assessment
  result.overallAssessment.criticalIssuesCount = result.allIssues.filter(
    (i) => i.severity === 'CRITICAL'
  ).length;
  result.overallAssessment.highPriorityIssuesCount = result.allIssues.filter(
    (i) => i.severity === 'HIGH'
  ).length;
  result.overallAssessment.readyForPublication =
    result.overallAssessment.criticalIssuesCount === 0 && result.scores.overall >= 80;

  progressPercent = 100;
  onProgress?.({
    type: 'progress',
    data: { percent: progressPercent, stage: 'complete' },
  });

  onProgress?.({
    type: 'stage_complete',
    data: {
      stage: 'finalizing',
      scores: result.scores,
      issueCount: result.allIssues.length,
      readyForPublication: result.overallAssessment.readyForPublication,
    },
  });

  logger.info('[AIAnalyzer] Enhanced analysis complete', {
    courseId: options.courseId,
    overallScore: result.scores.overall,
    issueCount: result.allIssues.length,
    criticalIssues: result.overallAssessment.criticalIssuesCount,
    readyForPublication: result.overallAssessment.readyForPublication,
  });

  return result;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert overview structure issue to full issue format
 */
function convertOverviewIssue(
  issue: CourseOverviewResult['structureIssues'][0],
  course: CourseInput
): AnalysisIssue {
  const affectedChapter =
    issue.affectedChapters?.[0] !== undefined
      ? course.chapters[issue.affectedChapters[0]]
      : undefined;

  return {
    id: nanoid(),
    type: issue.type as IssueType,
    severity: issue.severity as IssueSeverity,
    status: 'OPEN',
    location: {
      chapterId: affectedChapter?.id,
      chapterTitle: affectedChapter?.title,
      chapterPosition: issue.affectedChapters?.[0],
    },
    title: issue.title,
    description: issue.description,
    evidence: issue.evidence || [],
    impact: {
      area: 'Course Structure',
      description: `Affects ${issue.affectedChapters?.length || 0} chapter(s)`,
    },
    fix: {
      action: (issue.fix?.action as AnalysisIssue['fix']['action']) || 'modify',
      what: issue.fix?.what || '',
      why: issue.fix?.why || 'Improves course structure and learning flow',
      how: issue.fix?.how || '',
    },
  };
}

/**
 * Convert chapter issue to full issue format
 */
function convertChapterIssue(
  issue: ChapterAnalysisResult['issues'][0],
  chapter: CourseInput['chapters'][0],
  chapterIndex: number,
  course: CourseInput
): AnalysisIssue {
  const section =
    issue.sectionIndex !== null
      ? chapter.sections[issue.sectionIndex]
      : undefined;

  return {
    id: nanoid(),
    type: issue.type as IssueType,
    severity: issue.severity as IssueSeverity,
    status: 'OPEN',
    location: {
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      chapterPosition: chapterIndex,
      sectionId: section?.id,
      sectionTitle: section?.title || issue.sectionTitle || undefined,
      sectionPosition: issue.sectionIndex ?? undefined,
    },
    title: issue.title,
    description: issue.description,
    evidence: issue.evidence || [],
    impact: {
      area: section ? 'Section Content' : 'Chapter Content',
      description: `Located in ${chapter.title}${section ? ` > ${section.title}` : ''}`,
    },
    fix: {
      action: (issue.fix?.action as AnalysisIssue['fix']['action']) || 'modify',
      what: issue.fix?.what || '',
      why: issue.fix?.why || 'Improves content quality',
      how: issue.fix?.how || '',
      suggestedContent: issue.fix?.suggestedContent,
    },
  };
}

/**
 * Convert cross-chapter issue to full issue format
 */
function convertCrossChapterIssue(
  issue: CrossChapterAnalysisResult['issues'][0],
  course: CourseInput
): AnalysisIssue {
  const firstChapterIndex = issue.affectedChapterIndices?.[0];
  const firstChapter =
    firstChapterIndex !== undefined
      ? course.chapters[firstChapterIndex]
      : undefined;

  return {
    id: nanoid(),
    type: issue.type as IssueType,
    severity: issue.severity as IssueSeverity,
    status: 'OPEN',
    location: {
      chapterId: firstChapter?.id,
      chapterTitle: firstChapter?.title,
      chapterPosition: firstChapterIndex,
    },
    title: issue.title,
    description: issue.description,
    evidence: issue.evidence || [],
    impact: {
      area: 'Cross-Chapter Flow',
      description: `Affects chapters: ${issue.affectedChapterTitles?.join(', ') || 'Multiple'}`,
    },
    fix: {
      action: (issue.fix?.action as AnalysisIssue['fix']['action']) || 'modify',
      what: issue.fix?.what || '',
      why: issue.fix?.why || 'Improves course flow and consistency',
      how: issue.fix?.how || '',
    },
    relatedIssueIds: issue.affectedChapterIndices?.map(() => nanoid()),
  };
}

/**
 * Calculate final scores from analysis results
 */
function calculateFinalScores(result: AIAnalysisResult): AIAnalysisResult['scores'] {
  const overviewScore = result.overview.overallScore ?? 0;

  let totalConsistency = 0;
  let totalFlow = 0;
  let totalQuality = 0;

  for (const chapter of result.chapters) {
    totalConsistency += chapter.consistencyScore;
    totalFlow += chapter.flowScore;
    totalQuality += chapter.qualityScore;
  }

  const chapterCount = Math.max(1, result.chapters.length);
  const avgConsistency = totalConsistency / chapterCount;
  const avgFlow = totalFlow / chapterCount;
  const avgQuality = totalQuality / chapterCount;

  // Use cross-chapter scores if available; fallback to chapter averages
  // Note: 0 is a valid score (empty course), so check for undefined/null not falsy
  const crossChapterFlow = result.crossChapter.flowScore ?? avgFlow;
  const crossChapterConsistency = result.crossChapter.styleConsistency ?? avgConsistency;

  // Depth score: Weighted Bloom's distribution normalized to 0-100.
  // The weighted sum (REMEMBER*0.05 ... CREATE*0.25) produces ~5-25 for typical distributions.
  // Multiply by 4 to normalize into a 0-100 range where:
  //   - A beginner course (40% Remember+Understand, 40% Apply, 20% Analyze) → ~48
  //   - An intermediate course (balanced distribution) → ~62
  //   - An advanced course (heavy Evaluate+Create) → ~80+
  const bloomsScores = result.chapters.map((ch) => {
    const dist = ch.bloomsDistribution;
    const weighted =
      (dist.REMEMBER || 0) * 0.05 +
      (dist.UNDERSTAND || 0) * 0.10 +
      (dist.APPLY || 0) * 0.20 +
      (dist.ANALYZE || 0) * 0.25 +
      (dist.EVALUATE || 0) * 0.20 +
      (dist.CREATE || 0) * 0.20;
    return Math.min(100, weighted * 4);
  });
  const avgDepth =
    bloomsScores.length > 0
      ? bloomsScores.reduce((a, b) => a + b, 0) / bloomsScores.length
      : 0;

  const criticalPenalty = result.allIssues.filter((i) => i.severity === 'CRITICAL').length * 5;
  const highPenalty = result.allIssues.filter((i) => i.severity === 'HIGH').length * 3;
  const mediumPenalty = result.allIssues.filter((i) => i.severity === 'MEDIUM').length * 1;
  const totalPenalty = Math.min(30, criticalPenalty + highPenalty + mediumPenalty);

  const consistencyScore = Math.round((avgConsistency + crossChapterConsistency) / 2);
  const flowScore = Math.round((avgFlow + crossChapterFlow) / 2);
  const depthScore = Math.round(avgDepth);

  // Quality score: Use AI-reported quality directly — no artificial floor.
  // The AI prompts now instruct honest scoring: empty courses get low scores.
  const qualityScore = Math.round(avgQuality);

  const overallRaw =
    overviewScore * 0.15 +
    depthScore * 0.2 +
    consistencyScore * 0.2 +
    flowScore * 0.2 +
    qualityScore * 0.15 +
    (result.crossChapter.goalCoverage ?? 0) * 0.1;
  const overall = Math.max(0, Math.min(100, Math.round(overallRaw - totalPenalty)));

  return {
    overall,
    depth: depthScore,
    consistency: consistencyScore,
    flow: flowScore,
    quality: qualityScore,
    assessmentAlignment: 0, // Calculated separately
    timeValidation: 0, // Calculated separately
  };
}

/**
 * Calculate aggregated Bloom's distribution
 */
function calculateBloomsDistribution(
  chapters: ChapterAnalysisResult[]
): BloomsDistribution {
  if (chapters.length === 0) {
    return {
      // No chapters = no content = no cognitive level to assign.
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };
  }

  const totals: BloomsDistribution = {
    REMEMBER: 0,
    UNDERSTAND: 0,
    APPLY: 0,
    ANALYZE: 0,
    EVALUATE: 0,
    CREATE: 0,
  };

  for (const chapter of chapters) {
    const dist = chapter.bloomsDistribution;
    totals.REMEMBER += dist.REMEMBER;
    totals.UNDERSTAND += dist.UNDERSTAND;
    totals.APPLY += dist.APPLY;
    totals.ANALYZE += dist.ANALYZE;
    totals.EVALUATE += dist.EVALUATE;
    totals.CREATE += dist.CREATE;
  }

  const count = chapters.length;
  return {
    REMEMBER: Math.round(totals.REMEMBER / count),
    UNDERSTAND: Math.round(totals.UNDERSTAND / count),
    APPLY: Math.round(totals.APPLY / count),
    ANALYZE: Math.round(totals.ANALYZE / count),
    EVALUATE: Math.round(totals.EVALUATE / count),
    CREATE: Math.round(totals.CREATE / count),
  };
}

/**
 * Determine Bloom's balance from distribution
 */
function determineBloomsBalance(
  dist: BloomsDistribution
): 'well-balanced' | 'bottom-heavy' | 'top-heavy' {
  const total = dist.REMEMBER + dist.UNDERSTAND + dist.APPLY + dist.ANALYZE + dist.EVALUATE + dist.CREATE;
  // If all zeros (no content), report as bottom-heavy — there is nothing to balance
  if (total === 0) return 'bottom-heavy';

  const lowerOrder = dist.REMEMBER + dist.UNDERSTAND;
  const higherOrder = dist.ANALYZE + dist.EVALUATE + dist.CREATE;

  if (lowerOrder > 60) return 'bottom-heavy';
  if (higherOrder > 50) return 'top-heavy';
  return 'well-balanced';
}

// =============================================================================
// DEFAULT/FALLBACK RESULTS
// =============================================================================

function getDefaultOverviewResult(): CourseOverviewResult {
  return {
    overallScore: 0,
    bloomsAssessment: 'bottom-heavy',
    bloomsReasoning: 'AI overview analysis failed — could not complete analysis',
    bloomsDistribution: {
      // All zeros — analysis failed, we cannot assign any cognitive level.
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    },
    strengths: [],
    weaknesses: ['AI overview analysis could not be completed — review course content manually'],
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
        title: 'AI Overview Analysis Failed',
        description: 'The AI could not analyze the course overview. This usually means the course lacks content or the AI service encountered an error.',
        affectedChapters: [],
        evidence: ['AI analysis could not be completed'],
        fix: {
          action: 'modify',
          what: 'Ensure the course has body content in all chapters and sections',
          why: 'A course without content cannot be analyzed or provide educational value',
          how: 'Add learning material to every section before re-running analysis',
        },
      },
    ],
    recommendedImprovements: [
      {
        priority: 1,
        improvement: 'Add body content to all sections',
        impact: 'Essential for the course to function as educational material',
        effort: 'HIGH',
      },
    ],
    thinking: 'Fallback result due to analysis error — returning zero scores',
  };
}

function getDefaultChapterResult(
  chapterIndex: number,
  chapterTitle: string
): ChapterAnalysisResult {
  return {
    chapterIndex,
    chapterTitle,
    primaryBloomsLevel: 'REMEMBER',
    bloomsDistribution: {
      // All zeros — AI analysis failed, cannot assign cognitive levels.
      REMEMBER: 0,
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
        title: `AI Analysis Failed for Chapter: ${chapterTitle}`,
        description: 'The AI could not analyze this chapter. This typically means the chapter content is missing, malformed, or could not be processed.',
        evidence: ['AI analysis could not be completed'],
        fix: {
          action: 'modify',
          what: 'Add body content to all sections in this chapter',
          why: 'A chapter without content cannot serve its educational purpose',
          how: 'Review each section and add: (1) explanatory text, (2) examples, (3) learning objectives',
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
    thinking: 'Fallback result due to analysis error — returning zero scores',
  };
}

function getDefaultCrossChapterResult(): CrossChapterAnalysisResult {
  return {
    bloomsProgression: 'inconsistent',
    bloomsProgressionReasoning: 'AI cross-chapter analysis failed — could not complete analysis',
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
        description: 'The AI could not analyze cross-chapter relationships. Review the course content and ensure all chapters have body content.',
        evidence: ['AI analysis could not be completed'],
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
      topImprovements: ['Add body content to all chapters', 'Define learning objectives for each section'],
    },
    thinking: 'Fallback result due to analysis error — returning zero scores',
  };
}
