/**
 * Example Quality Gate
 *
 * Validates the quality and quantity of examples in AI-generated content:
 * - Minimum/maximum number of examples
 * - Example length and detail
 * - Code examples for programming content
 * - Real-world examples when appropriate
 */
import type { QualityGate, GateResult, GeneratedContent, ContentType, ExampleQualityGateConfig } from './types';
export declare class ExampleQualityGate implements QualityGate {
    readonly name = "ExampleQualityGate";
    readonly description = "Validates that content has adequate, high-quality examples";
    readonly defaultWeight = 1.2;
    readonly applicableTypes: ContentType[];
    private config;
    constructor(config?: Partial<ExampleQualityGateConfig>);
    evaluate(content: GeneratedContent): Promise<GateResult>;
    /**
     * Detect examples in the content
     */
    private detectExamples;
    /**
     * Create an example object from detected content
     */
    private createExample;
    /**
     * Classify the type of example
     */
    private classifyExampleType;
    /**
     * Assess the quality of an example
     */
    private assessExampleQuality;
    /**
     * Assess code example quality
     */
    private assessCodeQuality;
    /**
     * Check if text looks like an example
     */
    private looksLikeExample;
    /**
     * Check code example quality issues
     */
    private checkCodeExampleQuality;
    /**
     * Check if content is programming-related
     */
    private isProgrammingContent;
    /**
     * Check example variety
     */
    private checkExampleVariety;
    /**
     * Check example placement
     */
    private checkExamplePlacement;
    /**
     * Remove duplicate examples
     */
    private deduplicateExamples;
    /**
     * Check if two contents are similar
     */
    private similarContent;
    /**
     * Count words
     */
    private countWords;
    /**
     * Count example types
     */
    private countExampleTypes;
    /**
     * Calculate average example length
     */
    private calculateAverageLength;
}
/**
 * Factory function to create an ExampleQualityGate
 */
export declare function createExampleQualityGate(config?: Partial<ExampleQualityGateConfig>): ExampleQualityGate;
//# sourceMappingURL=example-quality-gate.d.ts.map