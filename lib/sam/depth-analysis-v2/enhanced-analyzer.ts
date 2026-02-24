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
 * 9. Factual Analysis (AI-only) - Check factual claims
 * 10. Learner Simulation (AI-only) - Simulate target learner
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
import { detectFallbacks } from './analyzers/fallback-detector';
import { analyzeReadability, type ReadabilityResult } from './analyzers/content-analyzer';
import { analyzeFactualClaims } from './analyzers/factual-analyzer';
import { simulateLearner } from './analyzers/learner-simulator';

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
  { id: 9, name: 'factual', label: 'Checking factual accuracy' },
  { id: 10, name: 'learner', label: 'Simulating learner experience' },
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
  private userId?: string;

  constructor(options: AnalyzerOptions) {
    this.course = options.course;
    this.courseId = options.courseId;
    this.onProgress = options.onProgress;
    this.aiEnabled = options.aiEnabled ?? true;
    this.previousAnalysisId = options.previousAnalysisId;
    this.userId = options.userId;
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

      // Step 7.5: Fallback Detection (rule-based, zero cost)
      const fallbackIssues = detectFallbacks(this.course);
      issues.push(...fallbackIssues);

      // Step 7.6: Readability Issues (rule-based, zero cost)
      const readabilityResults = analyzeReadability(this.course);
      for (const r of readabilityResults) {
        if (!r.isWithinRange && r.deviation > 2) {
          issues.push({
            id: `readability-${r.sectionId}`,
            type: 'READABILITY',
            severity: r.deviation > 4 ? 'HIGH' : 'MEDIUM',
            status: 'OPEN',
            location: {
              chapterId: r.chapterId,
              chapterTitle: r.chapterTitle,
              sectionId: r.sectionId,
              sectionTitle: r.sectionTitle,
            },
            title: `Readability mismatch (FK grade ${r.fkGrade} vs expected ${r.expectedRange.min}-${r.expectedRange.max})`,
            description: `Section "${r.sectionTitle}" has a Flesch-Kincaid grade level of ${r.fkGrade}, which is ${r.deviation.toFixed(1)} levels outside the expected range for this course difficulty.`,
            evidence: [
              `FK Grade Level: ${r.fkGrade}`,
              `Expected range: ${r.expectedRange.min}-${r.expectedRange.max}`,
              `Deviation: ${r.deviation.toFixed(1)} levels`,
            ],
            impact: {
              area: 'Readability',
              description: 'Content that is too complex or too simple for the target audience reduces learning effectiveness.',
            },
            fix: {
              action: 'modify',
              what: r.fkGrade > r.expectedRange.max
                ? 'Simplify language and sentence structure'
                : 'Add more technical depth and complexity',
              why: 'Content readability should match the expected level for the target audience.',
              how: r.fkGrade > r.expectedRange.max
                ? 'Use shorter sentences, simpler vocabulary, and break complex ideas into smaller chunks.'
                : 'Incorporate more domain-specific terminology and complex sentence structures.',
            },
          });
        }
      }

      // Step 7.7: Time Estimation Issues (rule-based, zero cost)
      if (structureResult.timeEstimates) {
        for (const estimate of structureResult.timeEstimates) {
          // Flag chapters with very short content (<2 min reading time)
          if (estimate.estimatedMinutes < 2 && estimate.wordCount > 0) {
            issues.push({
              id: `time-${estimate.chapterId}`,
              type: 'TIME',
              severity: 'MEDIUM',
              status: 'OPEN',
              location: {
                chapterId: estimate.chapterId,
                chapterTitle: estimate.chapterTitle,
              },
              title: `Very short chapter (${estimate.estimatedMinutes} min reading time)`,
              description: `Chapter "${estimate.chapterTitle}" has only ${estimate.wordCount} words (~${estimate.estimatedMinutes} min reading time). This may be too thin for a full chapter.`,
              evidence: [
                `Word count: ${estimate.wordCount}`,
                `Estimated reading time: ${estimate.estimatedMinutes} min`,
              ],
              impact: {
                area: 'Content Depth',
                description: 'Very short chapters may not provide sufficient depth for learning.',
              },
              fix: {
                action: 'add',
                what: 'Expand chapter content',
                why: 'Each chapter should provide enough depth for meaningful learning.',
                how: 'Add more explanations, examples, exercises, or merge with an adjacent chapter.',
              },
            });
          }
        }
      }

      logger.info('[DepthAnalyzerV2] Step 7 complete: Issue generation', {
        issueCount: issues.length,
        fallbackIssues: fallbackIssues.length,
        readabilityIssues: readabilityResults.filter((r) => !r.isWithinRange && r.deviation > 2).length,
      });

      // Step 8: Fix Generation
      this.reportProgress(8, 'Creating fix instructions...');
      const issuesWithFixes = await generateFixes(
        issues,
        this.course,
        this.aiEnabled
      );
      logger.info('[DepthAnalyzerV2] Step 8 complete: Fix generation');

      // Step 9: Factual Analysis (AI-only, skip if rule-based)
      if (this.aiEnabled) {
        this.reportProgress(9, 'Checking factual accuracy...');
        const factualIssues = await analyzeFactualClaims(
          this.course,
          this.aiEnabled,
          this.userId
        );
        if (factualIssues.length > 0) {
          issuesWithFixes.push(...factualIssues);
        }
        logger.info('[DepthAnalyzerV2] Step 9 complete: Factual analysis', {
          factualIssues: factualIssues.length,
        });
      } else {
        logger.info('[DepthAnalyzerV2] Step 9 skipped: Factual analysis (rule-based mode)');
      }

      // Step 10: Learner Simulation (AI-only, skip if rule-based)
      if (this.aiEnabled) {
        this.reportProgress(10, 'Simulating learner experience...');
        const learnerIssues = await simulateLearner(
          this.course,
          this.aiEnabled,
          this.userId
        );
        if (learnerIssues.length > 0) {
          issuesWithFixes.push(...learnerIssues);
        }
        logger.info('[DepthAnalyzerV2] Step 10 complete: Learner simulation', {
          learnerIssues: learnerIssues.length,
        });
      } else {
        logger.info('[DepthAnalyzerV2] Step 10 skipped: Learner simulation (rule-based mode)');
      }

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
