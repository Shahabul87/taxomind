/**
 * Quality Gate Pipeline
 *
 * Orchestrates all quality gates, runs them in parallel/sequential,
 * calculates weighted scores, and handles enhancement attempts.
 */
import type { QualityGate, QualityGatePipelineConfig, GeneratedContent, ValidationResult, GateIssue } from './types';
/**
 * Content Quality Gate Pipeline
 *
 * Validates AI-generated content through multiple quality gates.
 * Gates run in parallel by default and results are aggregated.
 */
export declare class ContentQualityGatePipeline {
    private gates;
    private config;
    private iterationCount;
    constructor(config?: Partial<QualityGatePipelineConfig>);
    /**
     * Initialize default quality gates
     */
    private initializeDefaultGates;
    /**
     * Add a custom gate to the pipeline
     */
    addGate(gate: QualityGate): void;
    /**
     * Remove a gate from the pipeline
     */
    removeGate(gateName: string): boolean;
    /**
     * Get a gate by name
     */
    getGate(gateName: string): QualityGate | undefined;
    /**
     * Get all gate names
     */
    getGateNames(): string[];
    /**
     * Validate content through all quality gates
     */
    validate(content: GeneratedContent): Promise<ValidationResult>;
    /**
     * Validate with retry/enhancement logic
     */
    private validateWithRetry;
    /**
     * Get gates applicable to the content type
     */
    private getApplicableGates;
    /**
     * Run gates on content
     */
    private runGates;
    /**
     * Run a single gate with timeout
     */
    private runGateWithTimeout;
    /**
     * Calculate weighted overall score
     */
    private calculateWeightedScore;
    /**
     * Attempt to enhance content based on gate failures
     */
    private enhanceContent;
    /**
     * Build validation metadata
     */
    private buildMetadata;
    /**
     * Quick validation - runs only essential gates
     */
    quickValidate(content: GeneratedContent): Promise<{
        passed: boolean;
        score: number;
        criticalIssues: GateIssue[];
    }>;
    /**
     * Get pipeline statistics
     */
    getStats(): {
        gateCount: number;
        gateNames: string[];
        config: QualityGatePipelineConfig;
    };
    /**
     * Update pipeline configuration
     */
    updateConfig(config: Partial<QualityGatePipelineConfig>): void;
}
/**
 * Factory function to create a ContentQualityGatePipeline
 */
export declare function createQualityGatePipeline(config?: Partial<QualityGatePipelineConfig>): ContentQualityGatePipeline;
/**
 * Validate content using default pipeline configuration
 */
export declare function validateContent(content: GeneratedContent, config?: Partial<QualityGatePipelineConfig>): Promise<ValidationResult>;
/**
 * Quick validation for content
 */
export declare function quickValidateContent(content: GeneratedContent): Promise<{
    passed: boolean;
    score: number;
    criticalIssues: GateIssue[];
}>;
//# sourceMappingURL=pipeline.d.ts.map