/**
 * Learning Objective Analyzer
 * Comprehensive analysis of learning objectives with SMART criteria and deduplication
 */
import type { BloomsLevel } from '@sam-ai/core';
import { ObjectiveAnalysis, ObjectiveDeduplicationResult } from '../types/depth-analysis.types';
export interface ActionVerbAnalysis {
    verb: string;
    bloomsLevel: BloomsLevel;
    strength: 'weak' | 'moderate' | 'strong';
    alternatives: string[];
}
export declare class ObjectiveAnalyzer {
    private readonly STRONG_VERBS;
    private readonly WEAK_VERBS;
    private readonly MEASURABLE_INDICATORS;
    private readonly TIME_INDICATORS;
    /**
     * Analyze a single learning objective
     */
    analyzeObjective(objective: string): ObjectiveAnalysis;
    /**
     * Analyze multiple objectives and detect duplicates
     */
    analyzeAndDeduplicate(objectives: string[]): ObjectiveDeduplicationResult;
    /**
     * Analyze the action verb in an objective
     */
    private analyzeActionVerb;
    /**
     * Determine Webb's DOK level
     */
    private determineDOKLevel;
    /**
     * Analyze SMART criteria compliance
     */
    private analyzeSMARTCriteria;
    private analyzeSpecific;
    private analyzeMeasurable;
    private analyzeAchievable;
    private analyzeRelevant;
    private analyzeTimeBound;
    /**
     * Analyze measurability in detail
     */
    private analyzeMeasurability;
    /**
     * Calculate clarity score
     */
    private calculateClarityScore;
    /**
     * Generate improvement suggestions
     */
    private generateSuggestions;
    /**
     * Generate improved version of objective
     */
    private generateImprovedVersion;
    /**
     * Cluster similar objectives for deduplication
     */
    private clusterSimilarObjectives;
    /**
     * Calculate similarity between two objectives
     */
    private calculateSimilarity;
    /**
     * Generate merged objective from similar ones
     */
    private generateMergedObjective;
    /**
     * Generate recommendations for deduplication
     */
    private generateDeduplicationRecommendations;
    /**
     * Generate optimized list of objectives
     */
    private generateOptimizedObjectives;
}
export declare const objectiveAnalyzer: ObjectiveAnalyzer;
//# sourceMappingURL=objective-analyzer.d.ts.map