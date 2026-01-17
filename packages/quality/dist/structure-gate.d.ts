/**
 * Structure Gate
 *
 * Validates the structural quality of AI-generated content:
 * - Heading hierarchy
 * - List usage
 * - Paragraph length
 * - Markdown formatting
 * - Logical flow
 */
import type { QualityGate, GateResult, GeneratedContent, ContentType, StructureGateConfig } from './types';
export declare class StructureGate implements QualityGate {
    readonly name = "StructureGate";
    readonly description = "Validates content structure including headings, lists, and formatting";
    readonly defaultWeight = 1;
    readonly applicableTypes: ContentType[];
    private config;
    constructor(config?: Partial<StructureGateConfig>);
    evaluate(content: GeneratedContent): Promise<GateResult>;
    /**
     * Analyze content structure
     */
    private analyzeStructure;
    /**
     * Get paragraphs from text
     */
    private getParagraphs;
    /**
     * Count sentences in a paragraph
     */
    private countSentences;
    /**
     * Check heading hierarchy
     */
    private checkHeadingHierarchy;
    /**
     * Detect markdown elements used
     */
    private detectMarkdownElements;
    /**
     * Check if content should have headings
     */
    private shouldHaveHeadings;
    /**
     * Check if content is a wall of text
     */
    private isWallOfText;
    /**
     * Check for logical flow indicators
     */
    private checkLogicalFlow;
    /**
     * Check markdown formatting
     */
    private checkMarkdownFormatting;
    /**
     * Check formatting consistency
     */
    private checkFormattingConsistency;
    /**
     * Check if content is technical
     */
    private isTechnicalContent;
}
/**
 * Factory function to create a StructureGate
 */
export declare function createStructureGate(config?: Partial<StructureGateConfig>): StructureGate;
//# sourceMappingURL=structure-gate.d.ts.map