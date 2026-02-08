/**
 * Enhanced Course Depth Analyzer V2
 *
 * 8-step AI-powered analysis pipeline that provides specific, actionable
 * guidance on course improvements.
 *
 * Steps:
 * 1. Structure Analysis - Extract and validate course structure
 * 2. Bloom's Classification - Classify content by cognitive level
 * 3. Flow Analysis - Analyze learning progression
 * 4. Consistency Analysis - Check chapter/section consistency
 * 5. Content Analysis - Quality, duplicates, gaps
 * 6. Outcomes Analysis - Determine learning outcomes
 * 7. Issue Generation - Create specific actionable issues
 * 8. Fix Generation - Generate fix instructions
 */

import { createHash } from 'crypto';
import { logger } from '@/lib/logger';
import type {
  AnalyzerOptions,
  CourseInput,
  CourseDepthAnalysisV2Result,
  ProgressCallback,
  AnalysisProgress,
  StructureAnalysisResult,
  BloomsAnalysisResult,
  FlowAnalysisResult,
  ConsistencyAnalysisResult,
  ContentAnalysisResult,
  OutcomesAnalysisResult,
  AnalysisIssue,
  BloomsDistribution,
} from './types';

import { analyzeStructure } from './analyzers/structure-analyzer';
import { classifyBlooms } from './analyzers/blooms-classifier';
import { analyzeFlow } from './analyzers/flow-analyzer';
import { checkConsistency } from './analyzers/consistency-checker';
import { analyzeContent } from './analyzers/content-analyzer';
import { analyzeOutcomes } from './analyzers/outcomes-analyzer';
import { generateIssues } from './analyzers/issue-generator';
import { generateFixes } from './analyzers/fix-generator';

// =============================================================================
// CONSTANTS
// =============================================================================

const ANALYSIS_STEPS = [
  { id: 1, name: 'structure', label: 'Analyzing course structure' },
  { id: 2, name: 'blooms', label: 'Classifying cognitive levels' },
  { id: 3, name: 'flow', label: 'Analyzing learning progression' },
  { id: 4, name: 'consistency', label: 'Checking content consistency' },
  { id: 5, name: 'content', label: 'Analyzing content quality' },
  { id: 6, name: 'outcomes', label: 'Determining learning outcomes' },
  { id: 7, name: 'issues', label: 'Generating actionable issues' },
  { id: 8, name: 'fixes', label: 'Creating fix instructions' },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a content hash to detect course changes
 */
export function generateContentHash(course: CourseInput): string {
  const content = JSON.stringify({
    title: course.title,
    description: course.description,
    goals: course.courseGoals,
    whatYouWillLearn: course.whatYouWillLearn,
    chapters: course.chapters.map((ch) => ({
      title: ch.title,
      description: ch.description,
      sections: ch.sections.map((s) => ({
        title: s.title,
        description: s.description,
        content: s.content,
        objectives: s.objectives,
      })),
    })),
  });

  return createHash('sha256').update(content).digest('hex').substring(0, 16);
}

/**
 * Calculate overall score from component scores
 */
function calculateOverallScore(
  depthScore: number,
  consistencyScore: number,
  flowScore: number,
  qualityScore: number
): number {
  // Weighted average with depth and flow being more important
  const weights = { depth: 0.3, consistency: 0.2, flow: 0.3, quality: 0.2 };
  return Math.round(
    depthScore * weights.depth +
      consistencyScore * weights.consistency +
      flowScore * weights.flow +
      qualityScore * weights.quality
  );
}

/**
 * Determine Bloom's balance from distribution
 */
function determineBloomsBalance(
  distribution: BloomsDistribution
): 'well-balanced' | 'bottom-heavy' | 'top-heavy' {
  const lowerOrder =
    distribution.REMEMBER + distribution.UNDERSTAND + distribution.APPLY;
  const higherOrder =
    distribution.ANALYZE + distribution.EVALUATE + distribution.CREATE;

  if (Math.abs(lowerOrder - higherOrder) <= 20) {
    return 'well-balanced';
  }
  return lowerOrder > higherOrder ? 'bottom-heavy' : 'top-heavy';
}

/**
 * Count issues by severity
 */
function countIssuesBySeverity(issues: AnalysisIssue[]): {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
} {
  return {
    critical: issues.filter((i) => i.severity === 'CRITICAL').length,
    high: issues.filter((i) => i.severity === 'HIGH').length,
    medium: issues.filter((i) => i.severity === 'MEDIUM').length,
    low: issues.filter((i) => i.severity === 'LOW').length,
    total: issues.length,
  };
}

// =============================================================================
// MAIN ANALYZER CLASS
// =============================================================================

export class EnhancedCourseAnalyzerV2 {
  private course: CourseInput;
  private courseId: string;
  private onProgress?: ProgressCallback;
  private aiEnabled: boolean;
  private previousAnalysisId?: string;

  constructor(options: AnalyzerOptions) {
    this.course = options.course;
    this.courseId = options.courseId;
    this.onProgress = options.onProgress;
    this.aiEnabled = options.aiEnabled ?? true;
    this.previousAnalysisId = options.previousAnalysisId;
  }

  /**
   * Report progress to callback
   */
  private reportProgress(
    step: number,
    message: string,
    currentResult?: unknown
  ): void {
    if (!this.onProgress) return;

    const stepInfo = ANALYSIS_STEPS[step - 1];
    const progress: AnalysisProgress = {
      step,
      totalSteps: ANALYSIS_STEPS.length,
      stepName: stepInfo.name,
      message: message || stepInfo.label,
      percentComplete: Math.round((step / ANALYSIS_STEPS.length) * 100),
      currentResult,
    };

    this.onProgress(progress);
  }

  /**
   * Run the complete 8-step analysis pipeline
   */
  async analyze(): Promise<CourseDepthAnalysisV2Result> {
    const startTime = Date.now();
    logger.info('[DepthAnalyzerV2] Starting analysis', {
      courseId: this.courseId,
      aiEnabled: this.aiEnabled,
    });

    try {
      // Step 1: Structure Analysis
      this.reportProgress(1, 'Extracting and validating course structure...');
      const structureResult = await analyzeStructure(this.course);
      logger.info('[DepthAnalyzerV2] Step 1 complete: Structure analysis');

      // Step 2: Bloom's Classification
      this.reportProgress(2, 'Classifying content by cognitive level...');
      const bloomsResult = await classifyBlooms(this.course, this.aiEnabled);
      logger.info('[DepthAnalyzerV2] Step 2 complete: Blooms classification');

      // Step 3: Flow Analysis
      this.reportProgress(3, 'Analyzing learning progression...');
      const flowResult = await analyzeFlow(this.course, bloomsResult);
      logger.info('[DepthAnalyzerV2] Step 3 complete: Flow analysis');

      // Step 4: Consistency Analysis
      this.reportProgress(4, 'Checking chapter and section consistency...');
      const consistencyResult = await checkConsistency(
        this.course,
        bloomsResult
      );
      logger.info('[DepthAnalyzerV2] Step 4 complete: Consistency check');

      // Step 5: Content Analysis
      this.reportProgress(5, 'Analyzing content quality and duplicates...');
      const contentResult = await analyzeContent(this.course, this.aiEnabled);
      logger.info('[DepthAnalyzerV2] Step 5 complete: Content analysis');

      // Step 6: Outcomes Analysis
      this.reportProgress(6, 'Determining learning outcomes...');
      const outcomesResult = await analyzeOutcomes(
        this.course,
        bloomsResult,
        this.aiEnabled
      );
      logger.info('[DepthAnalyzerV2] Step 6 complete: Outcomes analysis');

      // Step 7: Issue Generation
      this.reportProgress(7, 'Generating actionable issues...');
      const issues = await generateIssues({
        course: this.course,
        structureResult,
        bloomsResult,
        flowResult,
        consistencyResult,
        contentResult,
        outcomesResult,
      });
      logger.info('[DepthAnalyzerV2] Step 7 complete: Issue generation', {
        issueCount: issues.length,
      });

      // Step 8: Fix Generation
      this.reportProgress(8, 'Creating fix instructions...');
      const issuesWithFixes = await generateFixes(
        issues,
        this.course,
        this.aiEnabled
      );
      logger.info('[DepthAnalyzerV2] Step 8 complete: Fix generation');

      // Calculate scores
      const depthScore = bloomsResult.cognitiveDepthScore;
      const consistencyScore = consistencyResult.overallConsistencyScore;
      const flowScore = flowResult.overallFlowScore;
      const qualityScore = contentResult.qualityScore;
      const overallScore = calculateOverallScore(
        depthScore,
        consistencyScore,
        flowScore,
        qualityScore
      );

      // Build chapter analysis summary
      const chapterAnalysis = this.course.chapters.map((ch, index) => {
        const chapterBlooms = bloomsResult.chapters.find(
          (c) => c.chapterId === ch.id
        );
        const chapterConsistency = consistencyResult.sectionConsistency.find(
          (c) => c.chapterId === ch.id
        );
        const chapterIssues = issuesWithFixes.filter(
          (i) => i.location.chapterId === ch.id
        );

        return {
          chapterId: ch.id,
          chapterTitle: ch.title,
          position: index + 1,
          scores: {
            depth: chapterBlooms?.distribution
              ? Math.round(
                  ((chapterBlooms.distribution.ANALYZE +
                    chapterBlooms.distribution.EVALUATE +
                    chapterBlooms.distribution.CREATE) /
                    100) *
                    100
                )
              : 50,
            consistency: chapterConsistency?.consistencyScore ?? 70,
            flow: 70, // Will be calculated per-chapter in enhanced version
            quality: 70, // Will be calculated per-chapter in enhanced version
          },
          issueCount: chapterIssues.length,
          primaryBloomsLevel: chapterBlooms?.primaryLevel ?? 'UNDERSTAND',
        };
      });

      // Build final result
      const result: CourseDepthAnalysisV2Result = {
        // Metadata
        courseId: this.courseId,
        version: 1,
        status: 'COMPLETED',
        analysisMethod: this.aiEnabled ? 'hybrid' : 'rule-based',
        contentHash: generateContentHash(this.course),

        // Scores
        overallScore,
        depthScore,
        consistencyScore,
        flowScore,
        qualityScore,

        // Bloom's
        bloomsDistribution: bloomsResult.courseDistribution,
        bloomsBalance: determineBloomsBalance(bloomsResult.courseDistribution),

        // Detailed Results
        structureAnalysis: structureResult,
        bloomsAnalysis: bloomsResult,
        flowAnalysis: flowResult,
        consistencyAnalysis: consistencyResult,
        contentAnalysis: contentResult,
        outcomesAnalysis: outcomesResult,

        // Issues
        issues: issuesWithFixes,
        issueCount: countIssuesBySeverity(issuesWithFixes),

        // Chapter Summary
        chapterAnalysis,

        // Timestamps
        analyzedAt: new Date(),
      };

      const duration = Date.now() - startTime;
      logger.info('[DepthAnalyzerV2] Analysis complete', {
        courseId: this.courseId,
        overallScore,
        issueCount: result.issueCount.total,
        durationMs: duration,
      });

      return result;
    } catch (error) {
      logger.error('[DepthAnalyzerV2] Analysis failed', {
        courseId: this.courseId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createEnhancedAnalyzerV2(
  options: AnalyzerOptions
): EnhancedCourseAnalyzerV2 {
  return new EnhancedCourseAnalyzerV2(options);
}
