/**
 * Completeness Gate
 *
 * Validates that AI-generated content is complete:
 * - Minimum word count
 * - Required sections present
 * - Introduction and conclusion (if required)
 * - Learning objectives coverage
 */
import type { QualityGate, GateResult, GeneratedContent, ContentType, CompletenessGateConfig } from './types';
export declare class CompletenessGate implements QualityGate {
    readonly name = "CompletenessGate";
    readonly description = "Validates that content is complete with required sections and minimum length";
    readonly defaultWeight = 1.5;
    readonly applicableTypes: ContentType[];
    private config;
    constructor(config?: Partial<CompletenessGateConfig>);
    evaluate(content: GeneratedContent): Promise<GateResult>;
    /**
     * Count words in text
     */
    private countWords;
    /**
     * Get minimum word count based on content type
     */
    private getMinWordCount;
    /**
     * Check if content has an introduction
     */
    private hasIntroduction;
    /**
     * Check if content has a conclusion
     */
    private hasConclusion;
    /**
     * Find sections that are required but missing
     */
    private findMissingSections;
    /**
     * Check if section topic is covered in content
     */
    private hasSectionContent;
    /**
     * Count the number of sections/headings in content
     */
    private countSections;
    /**
     * Check coverage of learning objectives
     */
    private checkObjectiveCoverage;
    /**
     * Extract keywords from text
     */
    private extractKeywords;
    /**
     * Check if content ends abruptly
     */
    private hasAbruptEnding;
}
/**
 * Factory function to create a CompletenessGate
 */
export declare function createCompletenessGate(config?: Partial<CompletenessGateConfig>): CompletenessGate;
//# sourceMappingURL=completeness-gate.d.ts.map