/**
 * Webb's Depth of Knowledge (DOK) Analyzer
 * Provides complementary cognitive depth analysis alongside Bloom's Taxonomy
 */
import type { BloomsLevel } from '@sam-ai/core';
import { WebbDOKLevel, WebbDOKAnalysis, WebbDOKDistribution } from '../types/depth-analysis.types';
export declare class WebbDOKAnalyzer {
    /**
     * Analyze content to determine Webb's DOK level
     */
    analyzeContent(content: string, bloomsLevel?: BloomsLevel): WebbDOKAnalysis;
    /**
     * Analyze multiple content pieces and return distribution
     */
    analyzeDistribution(contents: Array<{
        content: string;
        bloomsLevel?: BloomsLevel;
    }>): WebbDOKDistribution;
    /**
     * Calculate DOK depth score (0-100)
     */
    calculateDOKDepth(distribution: WebbDOKDistribution): number;
    /**
     * Determine DOK balance
     */
    determineDOKBalance(distribution: WebbDOKDistribution): 'recall-heavy' | 'skill-focused' | 'strategic' | 'well-balanced';
    /**
     * Get recommendations based on DOK analysis
     */
    getRecommendations(distribution: WebbDOKDistribution): string[];
    /**
     * Convert Bloom's distribution to estimated DOK distribution
     */
    bloomsToEstimatedDOK(bloomsDistribution: Record<string, number>): WebbDOKDistribution;
    /**
     * Validate alignment between Bloom's and DOK
     */
    validateBloomsDOKAlignment(bloomsLevel: BloomsLevel, dokLevel: WebbDOKLevel): {
        aligned: boolean;
        expectedDOK: WebbDOKLevel;
        message: string;
    };
    /**
     * Escape special regex characters
     */
    private escapeRegex;
}
export declare const webbDOKAnalyzer: WebbDOKAnalyzer;
//# sourceMappingURL=webb-dok-analyzer.d.ts.map