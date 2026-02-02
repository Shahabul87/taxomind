/**
 * Cognitive Load Analyzer
 *
 * Phase 3: Cognitive Load Integration
 * Analyzes content for cognitive load factors based on Cognitive Load Theory (CLT)
 *
 * Three types of cognitive load:
 * - Intrinsic: Inherent complexity of the material
 * - Extraneous: Unnecessary processing burden (poor design, confusing presentation)
 * - Germane: Learning-productive processing (schema building, deep understanding)
 */
import type { BloomsLevel } from './types';
/**
 * Cognitive load types based on Cognitive Load Theory
 */
export type CognitiveLoadType = 'intrinsic' | 'extraneous' | 'germane';
/**
 * Individual cognitive load measurement
 */
export interface CognitiveLoadMeasurement {
    /**
     * Type of cognitive load
     */
    type: CognitiveLoadType;
    /**
     * Load score (0-100)
     * Higher = more load
     */
    score: number;
    /**
     * Factors contributing to this load
     */
    factors: CognitiveLoadFactor[];
    /**
     * Confidence in the measurement (0-1)
     */
    confidence: number;
}
/**
 * Factor contributing to cognitive load
 */
export interface CognitiveLoadFactor {
    /**
     * Factor name
     */
    name: string;
    /**
     * Factor contribution to load (0-100)
     */
    contribution: number;
    /**
     * Evidence for this factor
     */
    evidence: string;
    /**
     * Whether this factor can be optimized
     */
    optimizable: boolean;
}
/**
 * Complete cognitive load analysis result
 */
export interface CognitiveLoadResult {
    /**
     * Overall cognitive load score (0-100)
     * Weighted combination of all load types
     */
    totalLoad: number;
    /**
     * Load category based on total load
     */
    loadCategory: 'low' | 'moderate' | 'high' | 'overload';
    /**
     * Individual load measurements
     */
    measurements: {
        intrinsic: CognitiveLoadMeasurement;
        extraneous: CognitiveLoadMeasurement;
        germane: CognitiveLoadMeasurement;
    };
    /**
     * Balance assessment
     * Ideal: low extraneous, appropriate intrinsic, high germane
     */
    balance: CognitiveLoadBalance;
    /**
     * Recommendations for optimizing cognitive load
     */
    recommendations: CognitiveLoadRecommendation[];
    /**
     * Bloom's level compatibility
     * Higher Bloom's levels require more cognitive capacity
     */
    bloomsCompatibility: BloomsCompatibility;
    /**
     * Processing metadata
     */
    metadata: {
        processingTimeMs: number;
        timestamp: string;
        contentLength: number;
    };
}
/**
 * Balance assessment of cognitive load distribution
 */
export interface CognitiveLoadBalance {
    /**
     * Overall balance status
     */
    status: 'optimal' | 'suboptimal' | 'problematic';
    /**
     * Whether extraneous load is minimized
     */
    extraneousMinimized: boolean;
    /**
     * Whether germane load is maximized
     */
    germaneMaximized: boolean;
    /**
     * Whether intrinsic load matches learner level
     */
    intrinsicAppropriate: boolean;
    /**
     * Balance score (0-100)
     */
    score: number;
}
/**
 * Recommendation for optimizing cognitive load
 */
export interface CognitiveLoadRecommendation {
    /**
     * Target load type
     */
    targetType: CognitiveLoadType;
    /**
     * Recommendation action
     */
    action: string;
    /**
     * Expected improvement
     */
    expectedImprovement: string;
    /**
     * Priority (1-5, 1 = highest)
     */
    priority: number;
    /**
     * Specific techniques to apply
     */
    techniques?: string[];
}
/**
 * Bloom's level compatibility with cognitive load
 */
export interface BloomsCompatibility {
    /**
     * Maximum recommended Bloom's level given current load
     */
    maxRecommendedLevel: BloomsLevel;
    /**
     * Whether current load supports the target Bloom's level
     */
    supportsTargetLevel: boolean;
    /**
     * Cognitive capacity remaining after current load (0-100)
     */
    remainingCapacity: number;
    /**
     * Adjustment suggestions
     */
    adjustments?: string[];
}
/**
 * Intrinsic load indicators (content complexity)
 */
export declare const INTRINSIC_LOAD_INDICATORS: {
    high: string[];
    moderate: string[];
    low: string[];
};
/**
 * Extraneous load indicators (poor design/presentation)
 */
export declare const EXTRANEOUS_LOAD_INDICATORS: {
    high: string[];
    moderate: string[];
    low: string[];
};
/**
 * Germane load indicators (schema building)
 */
export declare const GERMANE_LOAD_INDICATORS: {
    high: string[];
    moderate: string[];
    low: string[];
};
/**
 * Cognitive Load Analyzer
 * Analyzes content for cognitive load and provides optimization recommendations
 */
export declare class CognitiveLoadAnalyzer {
    /**
     * Analyze content for cognitive load
     */
    analyze(content: string, targetBloomsLevel?: BloomsLevel): CognitiveLoadResult;
    /**
     * Measure intrinsic cognitive load
     */
    private measureIntrinsicLoad;
    /**
     * Measure extraneous cognitive load
     */
    private measureExtraneousLoad;
    /**
     * Measure germane cognitive load
     */
    private measureGermaneLoad;
    /**
     * Count indicator matches in text
     */
    private countIndicators;
    /**
     * Calculate score based on indicator matches
     */
    private calculateIndicatorScore;
    /**
     * Calculate total cognitive load
     */
    private calculateTotalLoad;
    /**
     * Categorize total load
     */
    private categorizeLoad;
    /**
     * Assess cognitive load balance
     */
    private assessBalance;
    /**
     * Generate recommendations for optimizing cognitive load
     */
    private generateRecommendations;
    /**
     * Assess compatibility with Bloom's taxonomy levels
     */
    private assessBloomsCompatibility;
}
/**
 * Create a cognitive load analyzer instance
 */
export declare function createCognitiveLoadAnalyzer(): CognitiveLoadAnalyzer;
//# sourceMappingURL=cognitive-load-analyzer.d.ts.map