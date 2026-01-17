/**
 * Difficulty Match Gate
 *
 * Validates that AI-generated content matches the target difficulty level:
 * - Vocabulary complexity
 * - Concept complexity
 * - Sentence complexity
 * - Readability metrics
 */
import type { QualityGate, GateResult, GeneratedContent, ContentType, DifficultyMatchGateConfig } from './types';
export declare class DifficultyMatchGate implements QualityGate {
    readonly name = "DifficultyMatchGate";
    readonly description = "Validates that content difficulty matches the target level";
    readonly defaultWeight = 1.3;
    readonly applicableTypes: ContentType[];
    private config;
    private readonly difficultyOrder;
    constructor(config?: Partial<DifficultyMatchGateConfig>);
    evaluate(content: GeneratedContent): Promise<GateResult>;
    /**
     * Calculate difficulty metrics for the content
     */
    private calculateDifficultyMetrics;
    /**
     * Get words from text
     */
    private getWords;
    /**
     * Get sentences from text
     */
    private getSentences;
    /**
     * Count complex words (3+ syllables)
     */
    private countComplexWords;
    /**
     * Count technical terms
     */
    private countTechnicalTerms;
    /**
     * Count syllables in all words
     */
    private countSyllables;
    /**
     * Count syllables in a single word
     */
    private countWordSyllables;
    /**
     * Calculate readability score (0-100, higher = easier)
     */
    private calculateReadability;
    /**
     * Get vocabulary difficulty level
     */
    private getVocabularyLevel;
    /**
     * Get sentence complexity level
     */
    private getSentenceLevel;
    /**
     * Get concept complexity level
     */
    private getConceptLevel;
    /**
     * Calculate overall difficulty level
     */
    private calculateOverallLevel;
    /**
     * Get level difference (normalized 0-1)
     */
    private getLevelDifference;
    /**
     * Get suggestion for difficulty mismatch
     */
    private getSuggestionForMismatch;
    /**
     * Check vocabulary match
     */
    private checkVocabularyMatch;
    /**
     * Check concept match
     */
    private checkConceptMatch;
    /**
     * Check sentence match
     */
    private checkSentenceMatch;
    /**
     * Check accessibility for beginner level
     */
    private checkBeginnerAccessibility;
    /**
     * Check depth for expert level
     */
    private checkExpertDepth;
}
/**
 * Factory function to create a DifficultyMatchGate
 */
export declare function createDifficultyMatchGate(config?: Partial<DifficultyMatchGateConfig>): DifficultyMatchGate;
//# sourceMappingURL=difficulty-gate.d.ts.map