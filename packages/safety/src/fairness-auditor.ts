/**
 * Fairness Auditor
 *
 * Priority 10: Safety + Fairness Checks
 * Performs periodic fairness audits across multiple evaluations
 */

import type {
  FairnessAuditReport,
  FairnessAuditConfig,
  DemographicAnalysis,
  GroupStatistics,
  FairnessRecommendation,
  EvaluationFeedback,
  SafetyIssue,
  SafetyLogger,
} from './types';
import {
  FairnessSafetyValidator,
  type FullFairnessValidatorConfig,
} from './fairness-validator';

// ============================================================================
// AUDITOR CONFIGURATION
// ============================================================================

/**
 * Full auditor configuration
 */
export interface FullFairnessAuditorConfig extends FairnessAuditConfig {
  /**
   * Validator configuration
   */
  validatorConfig?: FullFairnessValidatorConfig;

  /**
   * Logger
   */
  logger?: SafetyLogger;
}

/**
 * Default audit configuration
 */
export const DEFAULT_AUDIT_CONFIG: Required<
  Omit<FairnessAuditConfig, 'logger'>
> = {
  minSampleSize: 30,
  significanceThreshold: 0.05,
  disparityThreshold: 0.15,
  checkScoreDistribution: true,
  checkFeedbackSentiment: true,
  checkIssuePatterns: true,
};

// ============================================================================
// EVALUATION WITH DEMOGRAPHICS
// ============================================================================

/**
 * Evaluation with optional demographic information
 */
export interface EvaluationWithDemographics extends EvaluationFeedback {
  /**
   * Optional demographic group identifiers
   */
  demographics?: {
    gradeLevel?: number;
    subject?: string;
    school?: string;
    region?: string;
    learnerType?: string;
    performanceLevel?: 'low' | 'medium' | 'high';
    [key: string]: string | number | undefined;
  };
}

// ============================================================================
// AUDITOR IMPLEMENTATION
// ============================================================================

/**
 * Fairness Auditor
 * Performs comprehensive fairness audits across evaluation sets
 */
export class FairnessAuditor {
  private readonly config: Required<Omit<FairnessAuditConfig, 'logger'>>;
  private readonly validator: FairnessSafetyValidator;
  private readonly logger?: SafetyLogger;

  constructor(config: FullFairnessAuditorConfig = {}) {
    this.config = { ...DEFAULT_AUDIT_CONFIG, ...config };
    this.validator = new FairnessSafetyValidator(config.validatorConfig);
    this.logger = config.logger;
  }

  /**
   * Run comprehensive fairness audit
   */
  async runFairnessAudit(
    evaluations: EvaluationWithDemographics[]
  ): Promise<FairnessAuditReport> {
    const startTime = Date.now();

    this.logger?.info('Starting fairness audit', {
      evaluationCount: evaluations.length,
    });

    // Validate all evaluations
    const validationResults = await this.validateAllEvaluations(evaluations);

    // Group by demographic indicators
    const demographicGroups = this.groupByDemographics(evaluations);

    // Analyze each demographic dimension
    const demographicAnalysis = await this.analyzeDemographics(
      evaluations,
      demographicGroups,
      validationResults
    );

    // Check for score distribution disparities
    const scoreDistribution = this.config.checkScoreDistribution
      ? this.analyzeScoreDistribution(evaluations, demographicGroups)
      : undefined;

    // Analyze feedback sentiment by group
    const sentimentAnalysis = this.config.checkFeedbackSentiment
      ? this.analyzeFeedbackSentiment(
          evaluations,
          demographicGroups,
          validationResults
        )
      : undefined;

    // Analyze issue patterns
    const issuePatterns = this.config.checkIssuePatterns
      ? this.analyzeIssuePatterns(validationResults)
      : undefined;

    // Generate overall statistics
    const overallStatistics = this.calculateOverallStatistics(
      evaluations,
      validationResults
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      demographicAnalysis,
      scoreDistribution,
      sentimentAnalysis,
      issuePatterns
    );

    // Calculate overall fairness score
    const fairnessScore = this.calculateFairnessScore(
      demographicAnalysis,
      overallStatistics
    );

    // Determine pass/fail
    const passed =
      fairnessScore >= 70 &&
      recommendations.filter((r) => r.priority === 'critical').length === 0;

    const report: FairnessAuditReport = {
      passed,
      fairnessScore,
      evaluationsAnalyzed: evaluations.length,
      demographicAnalysis,
      scoreDistribution,
      sentimentAnalysis,
      issuePatterns,
      overallStatistics,
      recommendations,
      auditedAt: new Date(),
      auditDurationMs: Date.now() - startTime,
    };

    this.logger?.info('Fairness audit complete', {
      passed,
      fairnessScore,
      recommendationCount: recommendations.length,
      auditDurationMs: report.auditDurationMs,
    });

    return report;
  }

  /**
   * Validate all evaluations
   */
  private async validateAllEvaluations(
    evaluations: EvaluationWithDemographics[]
  ): Promise<Map<string, { issues: SafetyIssue[]; score: number }>> {
    const results = new Map<string, { issues: SafetyIssue[]; score: number }>();

    for (const evaluation of evaluations) {
      const result = await this.validator.validateFeedback(evaluation);
      results.set(evaluation.id, {
        issues: result.issues,
        score: result.score,
      });
    }

    return results;
  }

  /**
   * Group evaluations by demographic indicators
   */
  private groupByDemographics(
    evaluations: EvaluationWithDemographics[]
  ): Map<string, Map<string, EvaluationWithDemographics[]>> {
    const groups = new Map<
      string,
      Map<string, EvaluationWithDemographics[]>
    >();

    // Define demographic dimensions to analyze
    const dimensions = [
      'gradeLevel',
      'subject',
      'school',
      'region',
      'learnerType',
      'performanceLevel',
    ];

    for (const dimension of dimensions) {
      const dimensionGroups = new Map<string, EvaluationWithDemographics[]>();

      for (const evaluation of evaluations) {
        const value = evaluation.demographics?.[dimension];
        if (value !== undefined) {
          const key = String(value);
          const existing = dimensionGroups.get(key) ?? [];
          existing.push(evaluation);
          dimensionGroups.set(key, existing);
        }
      }

      // Only include if there are multiple groups with sufficient samples
      const validGroups = Array.from(dimensionGroups.entries()).filter(
        ([, evals]) => evals.length >= this.config.minSampleSize
      );

      if (validGroups.length >= 2) {
        groups.set(dimension, new Map(validGroups));
      }
    }

    return groups;
  }

  /**
   * Analyze demographics for disparities
   */
  private async analyzeDemographics(
    _evaluations: EvaluationWithDemographics[],
    groups: Map<string, Map<string, EvaluationWithDemographics[]>>,
    validationResults: Map<string, { issues: SafetyIssue[]; score: number }>
  ): Promise<DemographicAnalysis[]> {
    const analyses: DemographicAnalysis[] = [];

    for (const [dimension, dimensionGroups] of Array.from(groups.entries())) {
      const groupStats: GroupStatistics[] = [];

      for (const [groupName, groupEvals] of Array.from(
        dimensionGroups.entries()
      )) {
        const scores = groupEvals.map((e) => e.score / e.maxScore);
        const safetyScores = groupEvals
          .map((e) => validationResults.get(e.id)?.score ?? 100)
          .filter((s) => s !== undefined);

        const issueCount = groupEvals.reduce((sum, e) => {
          return sum + (validationResults.get(e.id)?.issues.length ?? 0);
        }, 0);

        groupStats.push({
          groupName,
          sampleSize: groupEvals.length,
          averageScore: this.calculateMean(scores),
          scoreStandardDeviation: this.calculateStdDev(scores),
          averageSafetyScore: this.calculateMean(safetyScores),
          issueRate: issueCount / groupEvals.length,
          passRate:
            groupEvals.filter((e) => e.score / e.maxScore >= 0.6).length /
            groupEvals.length,
        });
      }

      // Calculate disparity between groups
      const disparity = this.calculateDisparity(groupStats);

      analyses.push({
        dimension,
        groups: groupStats,
        disparity,
        isSignificant: disparity > this.config.disparityThreshold,
      });
    }

    return analyses;
  }

  /**
   * Analyze score distribution
   */
  private analyzeScoreDistribution(
    evaluations: EvaluationWithDemographics[],
    groups: Map<string, Map<string, EvaluationWithDemographics[]>>
  ): {
    overall: { mean: number; median: number; stdDev: number; skewness: number };
    byGroup: Map<string, { mean: number; median: number; stdDev: number }>;
  } {
    const allScores = evaluations.map((e) => e.score / e.maxScore);

    const overall = {
      mean: this.calculateMean(allScores),
      median: this.calculateMedian(allScores),
      stdDev: this.calculateStdDev(allScores),
      skewness: this.calculateSkewness(allScores),
    };

    const byGroup = new Map<
      string,
      { mean: number; median: number; stdDev: number }
    >();

    for (const [dimension, dimensionGroups] of Array.from(groups.entries())) {
      for (const [groupName, groupEvals] of Array.from(
        dimensionGroups.entries()
      )) {
        const scores = groupEvals.map((e) => e.score / e.maxScore);
        byGroup.set(`${dimension}:${groupName}`, {
          mean: this.calculateMean(scores),
          median: this.calculateMedian(scores),
          stdDev: this.calculateStdDev(scores),
        });
      }
    }

    return { overall, byGroup };
  }

  /**
   * Analyze feedback sentiment by group
   */
  private analyzeFeedbackSentiment(
    evaluations: EvaluationWithDemographics[],
    groups: Map<string, Map<string, EvaluationWithDemographics[]>>,
    validationResults: Map<string, { issues: SafetyIssue[]; score: number }>
  ): {
    overallPositivityRate: number;
    byGroup: Map<string, number>;
    disparities: Array<{ dimension: string; disparity: number }>;
  } {
    // Overall positivity based on safety scores
    const overallScores = evaluations.map(
      (e) => validationResults.get(e.id)?.score ?? 100
    );
    const overallPositivityRate = this.calculateMean(overallScores) / 100;

    const byGroup = new Map<string, number>();
    const disparities: Array<{ dimension: string; disparity: number }> = [];

    for (const [dimension, dimensionGroups] of Array.from(groups.entries())) {
      const groupRates: number[] = [];

      for (const [groupName, groupEvals] of Array.from(
        dimensionGroups.entries()
      )) {
        const scores = groupEvals.map(
          (e) => validationResults.get(e.id)?.score ?? 100
        );
        const rate = this.calculateMean(scores) / 100;
        byGroup.set(`${dimension}:${groupName}`, rate);
        groupRates.push(rate);
      }

      if (groupRates.length >= 2) {
        const maxRate = Math.max(...groupRates);
        const minRate = Math.min(...groupRates);
        disparities.push({
          dimension,
          disparity: maxRate - minRate,
        });
      }
    }

    return { overallPositivityRate, byGroup, disparities };
  }

  /**
   * Analyze issue patterns
   */
  private analyzeIssuePatterns(
    validationResults: Map<string, { issues: SafetyIssue[]; score: number }>
  ): {
    totalIssues: number;
    issuesByType: Map<string, number>;
    issuesBySeverity: Map<string, number>;
    mostCommonIssues: Array<{ type: string; count: number; percentage: number }>;
  } {
    const issuesByType = new Map<string, number>();
    const issuesBySeverity = new Map<string, number>();
    let totalIssues = 0;

    for (const [, result] of Array.from(validationResults.entries())) {
      for (const issue of result.issues) {
        totalIssues++;

        const typeCount = issuesByType.get(issue.type) ?? 0;
        issuesByType.set(issue.type, typeCount + 1);

        const severityCount = issuesBySeverity.get(issue.severity) ?? 0;
        issuesBySeverity.set(issue.severity, severityCount + 1);
      }
    }

    // Get most common issues
    const mostCommonIssues = Array.from(issuesByType.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: totalIssues > 0 ? (count / totalIssues) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { totalIssues, issuesByType, issuesBySeverity, mostCommonIssues };
  }

  /**
   * Calculate overall statistics
   */
  private calculateOverallStatistics(
    evaluations: EvaluationWithDemographics[],
    validationResults: Map<string, { issues: SafetyIssue[]; score: number }>
  ): {
    totalEvaluations: number;
    averageScore: number;
    averageSafetyScore: number;
    passRate: number;
    safetyPassRate: number;
    issuesPerEvaluation: number;
  } {
    const scores = evaluations.map((e) => e.score / e.maxScore);
    const safetyScores = Array.from(validationResults.values()).map(
      (r) => r.score
    );
    const totalIssues = Array.from(validationResults.values()).reduce(
      (sum, r) => sum + r.issues.length,
      0
    );

    return {
      totalEvaluations: evaluations.length,
      averageScore: this.calculateMean(scores),
      averageSafetyScore: this.calculateMean(safetyScores),
      passRate: scores.filter((s) => s >= 0.6).length / scores.length,
      safetyPassRate:
        Array.from(validationResults.values()).filter(
          (r) => r.issues.length === 0
        ).length / validationResults.size,
      issuesPerEvaluation: totalIssues / evaluations.length,
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    demographicAnalysis: DemographicAnalysis[],
    scoreDistribution?: {
      overall: {
        mean: number;
        median: number;
        stdDev: number;
        skewness: number;
      };
    },
    sentimentAnalysis?: {
      disparities: Array<{ dimension: string; disparity: number }>;
    },
    issuePatterns?: {
      mostCommonIssues: Array<{
        type: string;
        count: number;
        percentage: number;
      }>;
    }
  ): FairnessRecommendation[] {
    const recommendations: FairnessRecommendation[] = [];

    // Check for significant demographic disparities
    for (const analysis of demographicAnalysis) {
      if (analysis.isSignificant) {
        recommendations.push({
          priority: analysis.disparity > 0.25 ? 'critical' : 'high',
          category: 'demographic_disparity',
          description: `Significant disparity detected in ${analysis.dimension} (${(analysis.disparity * 100).toFixed(1)}% difference)`,
          action: `Review evaluations for ${analysis.dimension} groups and investigate potential sources of bias`,
          expectedImpact: 'Ensures equitable feedback across all student groups',
          affectedDimensions: [analysis.dimension],
        });
      }
    }

    // Check for score distribution issues
    if (scoreDistribution) {
      const { skewness } = scoreDistribution.overall;
      if (Math.abs(skewness) > 1) {
        recommendations.push({
          priority: 'medium',
          category: 'score_distribution',
          description: `Score distribution is ${skewness > 0 ? 'positively' : 'negatively'} skewed (${skewness.toFixed(2)})`,
          action:
            skewness > 0
              ? 'Review grading criteria - scores may be too lenient'
              : 'Review grading criteria - scores may be too harsh',
          expectedImpact: 'Creates more balanced score distribution',
        });
      }
    }

    // Check for sentiment disparities
    if (sentimentAnalysis) {
      for (const disparity of sentimentAnalysis.disparities) {
        if (disparity.disparity > this.config.disparityThreshold) {
          recommendations.push({
            priority: 'high',
            category: 'sentiment_disparity',
            description: `Feedback sentiment varies significantly by ${disparity.dimension}`,
            action: `Review feedback tone consistency across ${disparity.dimension} groups`,
            expectedImpact:
              'Ensures consistently constructive feedback for all students',
            affectedDimensions: [disparity.dimension],
          });
        }
      }
    }

    // Address common issues
    if (issuePatterns) {
      for (const issue of issuePatterns.mostCommonIssues.slice(0, 3)) {
        if (issue.percentage > 10) {
          recommendations.push({
            priority: issue.percentage > 25 ? 'high' : 'medium',
            category: 'common_issue',
            description: `${issue.type} appears in ${issue.percentage.toFixed(1)}% of evaluations`,
            action: this.getIssueActionRecommendation(issue.type),
            expectedImpact: 'Reduces occurrence of problematic feedback patterns',
          });
        }
      }
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    // Add general recommendation if no issues found
    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'low',
        category: 'maintenance',
        description: 'No significant fairness issues detected',
        action: 'Continue monitoring and run periodic audits',
        expectedImpact: 'Maintains current high standards',
      });
    }

    return recommendations;
  }

  /**
   * Get action recommendation for specific issue type
   */
  private getIssueActionRecommendation(issueType: string): string {
    const recommendations: Record<string, string> = {
      discouraging_language:
        'Train evaluators on growth-oriented language and provide phrase alternatives',
      potential_bias:
        'Implement bias awareness training and review evaluation rubrics',
      accessibility:
        'Simplify feedback language and provide readability guidelines',
      non_constructive:
        'Ensure all feedback includes specific actionable suggestions',
    };

    return (
      recommendations[issueType] ??
      'Review and address the specific issue pattern'
    );
  }

  /**
   * Calculate fairness score
   */
  private calculateFairnessScore(
    demographicAnalysis: DemographicAnalysis[],
    overallStatistics: { averageSafetyScore: number; safetyPassRate: number }
  ): number {
    let score = overallStatistics.averageSafetyScore;

    // Penalize for significant disparities
    const significantDisparities = demographicAnalysis.filter(
      (a) => a.isSignificant
    );
    for (const disparity of significantDisparities) {
      score -= disparity.disparity * 20;
    }

    // Bonus for high safety pass rate
    if (overallStatistics.safetyPassRate > 0.9) {
      score += 5;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate disparity between groups
   */
  private calculateDisparity(groups: GroupStatistics[]): number {
    if (groups.length < 2) return 0;

    const passRates = groups.map((g) => g.passRate);
    const maxRate = Math.max(...passRates);
    const minRate = Math.min(...passRates);

    return maxRate - minRate;
  }

  // ============================================================================
  // STATISTICAL HELPERS
  // ============================================================================

  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private calculateStdDev(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    return Math.sqrt(
      squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length
    );
  }

  private calculateSkewness(values: number[]): number {
    if (values.length < 3) return 0;
    const mean = this.calculateMean(values);
    const stdDev = this.calculateStdDev(values);
    if (stdDev === 0) return 0;

    const n = values.length;
    const cubedDiffs = values.map((v) => Math.pow((v - mean) / stdDev, 3));
    const sumCubed = cubedDiffs.reduce((sum, v) => sum + v, 0);

    return (n / ((n - 1) * (n - 2))) * sumCubed;
  }

  // ============================================================================
  // QUICK AUDIT
  // ============================================================================

  /**
   * Run quick fairness check (critical issues only)
   */
  async quickAudit(evaluations: EvaluationWithDemographics[]): Promise<{
    passed: boolean;
    criticalIssues: number;
    averageSafetyScore: number;
    recommendations: string[];
  }> {
    let criticalIssues = 0;
    let totalSafetyScore = 0;
    const recommendations: string[] = [];

    for (const evaluation of evaluations) {
      const result = await this.validator.quickValidate(evaluation);
      criticalIssues += result.criticalIssues.length;

      const fullResult = await this.validator.validateFeedback(evaluation);
      totalSafetyScore += fullResult.score;
    }

    const averageSafetyScore = totalSafetyScore / evaluations.length;
    const passed = criticalIssues === 0 && averageSafetyScore >= 70;

    if (criticalIssues > 0) {
      recommendations.push(
        `Address ${criticalIssues} critical safety issue(s) immediately`
      );
    }

    if (averageSafetyScore < 70) {
      recommendations.push(
        `Improve overall feedback quality (current score: ${averageSafetyScore.toFixed(1)})`
      );
    }

    return { passed, criticalIssues, averageSafetyScore, recommendations };
  }

  /**
   * Get trend analysis comparing two audit reports
   */
  compareTrends(
    previousReport: FairnessAuditReport,
    currentReport: FairnessAuditReport
  ): {
    scoreChange: number;
    passRateChange: number;
    issueChange: number;
    improving: boolean;
    summary: string;
  } {
    const scoreChange =
      currentReport.fairnessScore - previousReport.fairnessScore;
    const passRateChange =
      currentReport.overallStatistics.safetyPassRate -
      previousReport.overallStatistics.safetyPassRate;
    const issueChange =
      currentReport.overallStatistics.issuesPerEvaluation -
      previousReport.overallStatistics.issuesPerEvaluation;

    const improving = scoreChange > 0 && issueChange < 0;

    let summary: string;
    if (improving) {
      summary = `Fairness improved by ${scoreChange.toFixed(1)} points with ${Math.abs(issueChange).toFixed(2)} fewer issues per evaluation`;
    } else if (scoreChange > 0) {
      summary = `Fairness score improved by ${scoreChange.toFixed(1)} points, but issue rate increased`;
    } else if (scoreChange < 0) {
      summary = `Fairness score decreased by ${Math.abs(scoreChange).toFixed(1)} points - review recommended`;
    } else {
      summary = 'Fairness metrics remained stable';
    }

    return {
      scoreChange,
      passRateChange,
      issueChange,
      improving,
      summary,
    };
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create fairness auditor
 */
export function createFairnessAuditor(
  config?: FullFairnessAuditorConfig
): FairnessAuditor {
  return new FairnessAuditor(config);
}

/**
 * Create strict fairness auditor
 */
export function createStrictFairnessAuditor(
  config?: Omit<
    FullFairnessAuditorConfig,
    'disparityThreshold' | 'significanceThreshold'
  >
): FairnessAuditor {
  return new FairnessAuditor({
    ...config,
    disparityThreshold: 0.1,
    significanceThreshold: 0.01,
  });
}

/**
 * Create lenient fairness auditor
 */
export function createLenientFairnessAuditor(
  config?: Omit<
    FullFairnessAuditorConfig,
    'disparityThreshold' | 'minSampleSize'
  >
): FairnessAuditor {
  return new FairnessAuditor({
    ...config,
    disparityThreshold: 0.25,
    minSampleSize: 10,
  });
}

// ============================================================================
// SCHEDULED AUDIT RUNNER
// ============================================================================

/**
 * Scheduled audit runner for periodic fairness checks
 */
export class ScheduledFairnessAuditRunner {
  private readonly auditor: FairnessAuditor;
  private readonly logger?: SafetyLogger;
  private auditHistory: FairnessAuditReport[] = [];

  constructor(config?: FullFairnessAuditorConfig) {
    this.auditor = new FairnessAuditor(config);
    this.logger = config?.logger;
  }

  /**
   * Run scheduled audit and store in history
   */
  async runScheduledAudit(
    evaluations: EvaluationWithDemographics[]
  ): Promise<FairnessAuditReport> {
    this.logger?.info('Running scheduled fairness audit', {
      evaluationCount: evaluations.length,
    });

    const report = await this.auditor.runFairnessAudit(evaluations);
    this.auditHistory.push(report);

    // Keep last 10 audits
    if (this.auditHistory.length > 10) {
      this.auditHistory = this.auditHistory.slice(-10);
    }

    // Compare with previous if available
    if (this.auditHistory.length >= 2) {
      const previousReport = this.auditHistory[this.auditHistory.length - 2];
      const trend = this.auditor.compareTrends(previousReport, report);

      this.logger?.info('Audit trend analysis', trend);
    }

    return report;
  }

  /**
   * Get audit history
   */
  getAuditHistory(): FairnessAuditReport[] {
    return [...this.auditHistory];
  }

  /**
   * Get latest audit report
   */
  getLatestAudit(): FairnessAuditReport | undefined {
    return this.auditHistory[this.auditHistory.length - 1];
  }

  /**
   * Get trend over time
   */
  getTrend(): {
    scores: number[];
    passRates: number[];
    dates: Date[];
    overallTrend: 'improving' | 'declining' | 'stable';
  } {
    const scores = this.auditHistory.map((r) => r.fairnessScore);
    const passRates = this.auditHistory.map(
      (r) => r.overallStatistics.safetyPassRate
    );
    const dates = this.auditHistory.map((r) => r.auditedAt);

    let overallTrend: 'improving' | 'declining' | 'stable' = 'stable';

    if (scores.length >= 3) {
      const recentAvg =
        (scores[scores.length - 1] + scores[scores.length - 2]) / 2;
      const olderAvg = (scores[0] + scores[1]) / 2;

      if (recentAvg > olderAvg + 5) {
        overallTrend = 'improving';
      } else if (recentAvg < olderAvg - 5) {
        overallTrend = 'declining';
      }
    }

    return { scores, passRates, dates, overallTrend };
  }
}
