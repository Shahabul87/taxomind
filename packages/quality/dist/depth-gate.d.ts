/**
 * Depth Gate
 *
 * Validates the cognitive depth of AI-generated content:
 * - Explanation depth
 * - Concept connections
 * - Critical thinking prompts
 * - Bloom's taxonomy alignment
 */
import type { QualityGate, GateResult, GeneratedContent, ContentType, DepthGateConfig } from './types';
export declare class DepthGate implements QualityGate {
    readonly name = "DepthGate";
    readonly description = "Validates cognitive depth including explanations, connections, and critical thinking";
    readonly defaultWeight = 1.4;
    readonly applicableTypes: ContentType[];
    private config;
    constructor(config?: Partial<DepthGateConfig>);
    evaluate(content: GeneratedContent): Promise<GateResult>;
    /**
     * Analyze cognitive depth of content
     */
    private analyzeDepth;
    /**
     * Measure explanation depth
     */
    private measureExplanationDepth;
    /**
     * Count concept connections
     */
    private countConceptConnections;
    /**
     * Count critical thinking prompts
     */
    private countCriticalThinkingPrompts;
    /**
     * Analyze Bloom's taxonomy indicators
     */
    private analyzeBloomsIndicators;
    /**
     * Count reasoning patterns
     */
    private countReasoningPatterns;
    /**
     * Check if content has evidence
     */
    private hasEvidence;
    /**
     * Check for multiple perspectives
     */
    private hasMultiplePerspectives;
    /**
     * Calculate overall depth score
     */
    private calculateDepthScore;
    /**
     * Get depth improvement suggestion
     */
    private getDepthImprovementSuggestion;
    /**
     * Check explanation depth
     */
    private checkExplanationDepth;
    /**
     * Check concept connections
     */
    private checkConceptConnections;
    /**
     * Check critical thinking
     */
    private checkCriticalThinking;
    /**
     * Detect shallow content patterns
     */
    private detectShallowPatterns;
    /**
     * Check Bloom's alignment
     */
    private checkBloomsAlignment;
    /**
     * Check if content requires evidence
     */
    private requiresEvidence;
    /**
     * Check if content benefits from multiple perspectives
     */
    private benefitsFromPerspectives;
    /**
     * Check for superficial treatment
     */
    private checkSuperficialTreatment;
}
/**
 * Factory function to create a DepthGate
 */
export declare function createDepthGate(config?: Partial<DepthGateConfig>): DepthGate;
//# sourceMappingURL=depth-gate.d.ts.map