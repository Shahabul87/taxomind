/**
 * Fairness Auditor
 *
 * Priority 10: Safety + Fairness Checks
 * Performs periodic fairness audits across multiple evaluations
 */
import type { FairnessAuditReport, FairnessAuditConfig, EvaluationFeedback, SafetyLogger } from './types';
import { type FullFairnessValidatorConfig } from './fairness-validator';
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
export declare const DEFAULT_AUDIT_CONFIG: Required<Omit<FairnessAuditConfig, 'logger'>>;
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
/**
 * Fairness Auditor
 * Performs comprehensive fairness audits across evaluation sets
 */
export declare class FairnessAuditor {
    private readonly config;
    private readonly validator;
    private readonly logger?;
    constructor(config?: FullFairnessAuditorConfig);
    /**
     * Run comprehensive fairness audit
     */
    runFairnessAudit(evaluations: EvaluationWithDemographics[]): Promise<FairnessAuditReport>;
    /**
     * Validate all evaluations
     */
    private validateAllEvaluations;
    /**
     * Group evaluations by demographic indicators
     */
    private groupByDemographics;
    /**
     * Analyze demographics for disparities
     */
    private analyzeDemographics;
    /**
     * Analyze score distribution
     */
    private analyzeScoreDistribution;
    /**
     * Analyze feedback sentiment by group
     */
    private analyzeFeedbackSentiment;
    /**
     * Analyze issue patterns
     */
    private analyzeIssuePatterns;
    /**
     * Calculate overall statistics
     */
    private calculateOverallStatistics;
    /**
     * Generate recommendations
     */
    private generateRecommendations;
    /**
     * Get action recommendation for specific issue type
     */
    private getIssueActionRecommendation;
    /**
     * Calculate fairness score
     */
    private calculateFairnessScore;
    /**
     * Calculate disparity between groups
     */
    private calculateDisparity;
    private calculateMean;
    private calculateMedian;
    private calculateStdDev;
    private calculateSkewness;
    /**
     * Run quick fairness check (critical issues only)
     */
    quickAudit(evaluations: EvaluationWithDemographics[]): Promise<{
        passed: boolean;
        criticalIssues: number;
        averageSafetyScore: number;
        recommendations: string[];
    }>;
    /**
     * Get trend analysis comparing two audit reports
     */
    compareTrends(previousReport: FairnessAuditReport, currentReport: FairnessAuditReport): {
        scoreChange: number;
        passRateChange: number;
        issueChange: number;
        improving: boolean;
        summary: string;
    };
}
/**
 * Create fairness auditor
 */
export declare function createFairnessAuditor(config?: FullFairnessAuditorConfig): FairnessAuditor;
/**
 * Create strict fairness auditor
 */
export declare function createStrictFairnessAuditor(config?: Omit<FullFairnessAuditorConfig, 'disparityThreshold' | 'significanceThreshold'>): FairnessAuditor;
/**
 * Create lenient fairness auditor
 */
export declare function createLenientFairnessAuditor(config?: Omit<FullFairnessAuditorConfig, 'disparityThreshold' | 'minSampleSize'>): FairnessAuditor;
/**
 * Scheduled audit runner for periodic fairness checks
 */
export declare class ScheduledFairnessAuditRunner {
    private readonly auditor;
    private readonly logger?;
    private auditHistory;
    constructor(config?: FullFairnessAuditorConfig);
    /**
     * Run scheduled audit and store in history
     */
    runScheduledAudit(evaluations: EvaluationWithDemographics[]): Promise<FairnessAuditReport>;
    /**
     * Get audit history
     */
    getAuditHistory(): FairnessAuditReport[];
    /**
     * Get latest audit report
     */
    getLatestAudit(): FairnessAuditReport | undefined;
    /**
     * Get trend over time
     */
    getTrend(): {
        scores: number[];
        passRates: number[];
        dates: Date[];
        overallTrend: 'improving' | 'declining' | 'stable';
    };
}
//# sourceMappingURL=fairness-auditor.d.ts.map