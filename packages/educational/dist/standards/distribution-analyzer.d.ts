/**
 * Distribution Analyzer
 * Comprehensive analysis of Bloom's Taxonomy distributions
 * with research-backed validation and cognitive rigor assessment
 *
 * Based on:
 * - Hess Cognitive Rigor Matrix (2009)
 * - Anderson & Krathwohl's Revised Taxonomy (2001)
 * - Webb's Depth of Knowledge (2002)
 */
import type { BloomsLevel } from '@sam-ai/core';
import { BloomsDistribution, WebbDOKDistribution, CourseType } from '../types/depth-analysis.types';
import { ValidatedDistribution } from './validated-distributions';
export type { BloomsLevel };
export type DOKLevel = 1 | 2 | 3 | 4;
export interface DistributionAnalysisResult {
    courseType: CourseType | 'general' | 'STEM';
    detectedType: CourseType | 'general' | 'STEM';
    typeConfidence: number;
    actualDistribution: BloomsDistribution;
    targetDistribution: BloomsDistribution;
    alignmentScore: number;
    cognitiveRigorScore: number;
    cognitiveRigorMatrix: CognitiveRigorMatrix;
    balanceAssessment: BalanceAssessment;
    levelAnalysis: LevelAnalysis[];
    dokAnalysis: DOKAnalysis;
    statisticalConfidence: StatisticalConfidence;
    recommendations: DistributionRecommendation[];
    researchBasis: ResearchBasis;
    timestamp: string;
}
export interface CognitiveRigorMatrix {
    cells: CognitiveRigorCell[][];
    dominantQuadrant: 'recall' | 'skills' | 'strategic' | 'extended';
    coverage: number;
    balance: number;
    recommendations: string[];
}
export interface CognitiveRigorCell {
    bloomsLevel: BloomsLevel;
    dokLevel: DOKLevel;
    percentage: number;
    expected: number;
    status: 'under' | 'optimal' | 'over';
    examples: string[];
}
export interface BalanceAssessment {
    type: 'well-balanced' | 'bottom-heavy' | 'top-heavy' | 'application-focused' | 'analysis-focused';
    lowerOrder: number;
    middleOrder: number;
    higherOrder: number;
    idealRatio: {
        lower: number;
        middle: number;
        higher: number;
    };
    deviation: number;
    recommendation: string;
}
export interface LevelAnalysis {
    level: BloomsLevel;
    actual: number;
    target: number;
    deviation: number;
    status: 'significantly_under' | 'under' | 'optimal' | 'over' | 'significantly_over';
    percentile: number;
    researchContext: string;
    actionRequired: boolean;
    suggestedActions: string[];
}
export interface DOKAnalysis {
    distribution: WebbDOKDistribution;
    targetDistribution: WebbDOKDistribution;
    alignmentScore: number;
    dominantLevel: DOKLevel;
    strategicThinkingPercent: number;
    recommendations: string[];
}
export interface StatisticalConfidence {
    sampleBasis: string;
    confidenceLevel: number;
    marginOfError: number;
    effectSize?: number;
    pValue?: number;
    interpretation: string;
}
export interface DistributionRecommendation {
    priority: 'critical' | 'high' | 'medium' | 'low';
    level: BloomsLevel | 'overall';
    type: 'increase' | 'decrease' | 'rebalance' | 'maintain';
    currentValue: number;
    targetValue: number;
    change: number;
    description: string;
    actionSteps: string[];
    researchSupport: string;
    estimatedImpact: 'high' | 'medium' | 'low';
}
export interface ResearchBasis {
    primarySource: ValidatedDistribution;
    citation: string;
    applicability: string;
    limitations: string[];
    alternativeSources: Array<{
        name: string;
        citation: string;
    }>;
}
export declare class DistributionAnalyzer {
    private readonly VERSION;
    /**
     * Perform comprehensive distribution analysis
     */
    analyze(actualDistribution: BloomsDistribution, courseType?: CourseType | string, dokDistribution?: WebbDOKDistribution): DistributionAnalysisResult;
    /**
     * Get analyzer version
     */
    getVersion(): string;
    private normalizeType;
    private detectCourseType;
    private calculateTypeConfidence;
    private calculateAlignment;
    private analyzeCognitiveRigor;
    private inferDOKFromBlooms;
    private getDOKPercent;
    private getCellStatus;
    private getDominantQuadrant;
    private calculateMatrixBalance;
    private generateMatrixRecommendations;
    private calculateCognitiveRigorScore;
    private assessBalance;
    private getBalanceRecommendation;
    private analyzeLevels;
    private getLevelActions;
    private calculatePercentile;
    private analyzeDOK;
    private calculateDOKAlignment;
    private calculateStatisticalConfidence;
    private generateRecommendations;
    private compileResearchBasis;
}
export declare const distributionAnalyzer: DistributionAnalyzer;
//# sourceMappingURL=distribution-analyzer.d.ts.map