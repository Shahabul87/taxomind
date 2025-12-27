import { BloomsLevel } from '@sam-ai/core';

/**
 * Quality Gates Types
 *
 * Priority 2: Content Quality Gates
 * Validates all AI-generated content before delivery
 */

/**
 * Result from a single quality gate evaluation
 */
interface GateResult {
    /**
     * Name of the gate that ran
     */
    gateName: string;
    /**
     * Whether the content passed this gate
     */
    passed: boolean;
    /**
     * Score from 0-100
     */
    score: number;
    /**
     * Weight of this gate in overall scoring (default: 1.0)
     */
    weight: number;
    /**
     * Specific issues found by this gate
     */
    issues: GateIssue[];
    /**
     * Suggestions for improvement
     */
    suggestions: string[];
    /**
     * Processing time in milliseconds
     */
    processingTimeMs: number;
    /**
     * Additional metadata specific to the gate
     */
    metadata?: Record<string, unknown>;
}
/**
 * Specific issue found by a gate
 */
interface GateIssue {
    /**
     * Issue severity
     */
    severity: 'critical' | 'high' | 'medium' | 'low';
    /**
     * Human-readable description
     */
    description: string;
    /**
     * Location in content (if applicable)
     */
    location?: string;
    /**
     * Suggested fix
     */
    suggestedFix?: string;
}
/**
 * Content to be validated by quality gates
 */
interface GeneratedContent {
    /**
     * The main content text or structured data
     */
    content: string;
    /**
     * Type of content being validated
     */
    type: ContentType;
    /**
     * Target Bloom's level for educational content
     */
    targetBloomsLevel?: BloomsLevel;
    /**
     * Target difficulty level
     */
    targetDifficulty?: DifficultyLevel;
    /**
     * Expected examples in content
     */
    expectedExamples?: number;
    /**
     * Expected sections in content
     */
    expectedSections?: string[];
    /**
     * Context about the content
     */
    context?: ContentContext;
    /**
     * Original request that generated this content
     */
    originalRequest?: string;
    /**
     * Metadata about generation
     */
    generationMetadata?: {
        model?: string;
        promptVersion?: string;
        timestamp?: string;
    };
}
type ContentType = 'lesson' | 'explanation' | 'exercise' | 'quiz' | 'assessment' | 'summary' | 'tutorial' | 'example' | 'feedback' | 'answer';
type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
interface ContentContext {
    /**
     * Course/module this content belongs to
     */
    courseId?: string;
    /**
     * Chapter/section ID
     */
    sectionId?: string;
    /**
     * Topic being covered
     */
    topic?: string;
    /**
     * Prerequisites the learner should have
     */
    prerequisites?: string[];
    /**
     * Learning objectives to cover
     */
    learningObjectives?: string[];
    /**
     * Student's current proficiency level
     */
    studentLevel?: DifficultyLevel;
}
/**
 * Configuration for the quality gate pipeline
 */
interface QualityGatePipelineConfig {
    /**
     * Minimum score to pass (default: 75)
     */
    threshold: number;
    /**
     * Maximum enhancement iterations (default: 2)
     */
    maxIterations: number;
    /**
     * Run gates in parallel vs sequential
     */
    parallel: boolean;
    /**
     * Timeout for all gates in milliseconds
     */
    timeoutMs: number;
    /**
     * Gates to include (all by default)
     */
    enabledGates?: string[];
    /**
     * Gates to skip
     */
    disabledGates?: string[];
    /**
     * Custom weights for gates (overrides defaults)
     */
    gateWeights?: Record<string, number>;
    /**
     * Whether to attempt enhancement on failure
     */
    enableEnhancement: boolean;
}
/**
 * Result of pipeline validation
 */
interface ValidationResult {
    /**
     * Whether content passed all gates
     */
    passed: boolean;
    /**
     * Overall weighted score (0-100)
     */
    overallScore: number;
    /**
     * The validated/enhanced content
     */
    content: GeneratedContent;
    /**
     * Results from each gate
     */
    gateResults: GateResult[];
    /**
     * Gates that failed
     */
    failedGates: string[];
    /**
     * Number of enhancement iterations performed
     */
    iterations: number;
    /**
     * Total processing time in milliseconds
     */
    totalProcessingTimeMs: number;
    /**
     * Aggregated suggestions from all gates
     */
    allSuggestions: string[];
    /**
     * Critical issues that must be addressed
     */
    criticalIssues: GateIssue[];
    /**
     * Validation metadata
     */
    metadata: ValidationMetadata;
}
interface ValidationMetadata {
    /**
     * Timestamp of validation
     */
    timestamp: string;
    /**
     * Pipeline configuration used
     */
    config: QualityGatePipelineConfig;
    /**
     * Whether enhancement was attempted
     */
    enhancementAttempted: boolean;
    /**
     * Reason for pass/fail
     */
    reason: string;
}
/**
 * Base interface for all quality gates
 */
interface QualityGate {
    /**
     * Unique name of the gate
     */
    readonly name: string;
    /**
     * Description of what this gate checks
     */
    readonly description: string;
    /**
     * Default weight for this gate (1.0 = normal, 2.0 = double weight)
     */
    readonly defaultWeight: number;
    /**
     * Content types this gate applies to
     */
    readonly applicableTypes: ContentType[];
    /**
     * Evaluate content against this gate's criteria
     */
    evaluate(content: GeneratedContent): Promise<GateResult>;
    /**
     * Attempt to enhance content to pass this gate
     */
    enhance?(content: GeneratedContent, issues: GateIssue[]): Promise<GeneratedContent>;
}
/**
 * Configuration for CompletenessGate
 */
interface CompletenessGateConfig {
    /**
     * Minimum word count for content
     */
    minWordCount?: number;
    /**
     * Minimum sections expected
     */
    minSections?: number;
    /**
     * Required sections by name
     */
    requiredSections?: string[];
    /**
     * Whether introduction is required
     */
    requireIntroduction?: boolean;
    /**
     * Whether conclusion is required
     */
    requireConclusion?: boolean;
    /**
     * Minimum coverage of learning objectives (0-1)
     */
    objectiveCoverageThreshold?: number;
}
/**
 * Configuration for ExampleQualityGate
 */
interface ExampleQualityGateConfig {
    /**
     * Minimum number of examples
     */
    minExamples?: number;
    /**
     * Maximum number of examples
     */
    maxExamples?: number;
    /**
     * Require code examples for programming content
     */
    requireCodeExamples?: boolean;
    /**
     * Require real-world examples
     */
    requireRealWorldExamples?: boolean;
    /**
     * Minimum example word count
     */
    minExampleLength?: number;
}
/**
 * Configuration for DifficultyMatchGate
 */
interface DifficultyMatchGateConfig {
    /**
     * Tolerance for difficulty mismatch (0-1)
     * 0 = exact match required, 1 = any difficulty accepted
     */
    tolerance?: number;
    /**
     * Whether to check vocabulary complexity
     */
    checkVocabulary?: boolean;
    /**
     * Whether to check concept complexity
     */
    checkConceptComplexity?: boolean;
    /**
     * Whether to check sentence complexity
     */
    checkSentenceComplexity?: boolean;
}
/**
 * Configuration for StructureGate
 */
interface StructureGateConfig {
    /**
     * Minimum heading depth (h1, h2, etc.)
     */
    minHeadingDepth?: number;
    /**
     * Maximum heading depth
     */
    maxHeadingDepth?: number;
    /**
     * Require bullet points/lists
     */
    requireLists?: boolean;
    /**
     * Maximum paragraph length in sentences
     */
    maxParagraphLength?: number;
    /**
     * Require proper markdown formatting
     */
    requireMarkdown?: boolean;
}
/**
 * Configuration for DepthGate
 */
interface DepthGateConfig {
    /**
     * Minimum cognitive depth score (0-100)
     */
    minDepthScore?: number;
    /**
     * Whether to check for explanation depth
     */
    checkExplanationDepth?: boolean;
    /**
     * Whether to check for concept connections
     */
    checkConceptConnections?: boolean;
    /**
     * Whether to check for critical thinking prompts
     */
    checkCriticalThinking?: boolean;
}
declare const DEFAULT_PIPELINE_CONFIG: QualityGatePipelineConfig;
declare const DEFAULT_COMPLETENESS_CONFIG: CompletenessGateConfig;
declare const DEFAULT_EXAMPLE_QUALITY_CONFIG: ExampleQualityGateConfig;
declare const DEFAULT_DIFFICULTY_MATCH_CONFIG: DifficultyMatchGateConfig;
declare const DEFAULT_STRUCTURE_CONFIG: StructureGateConfig;
declare const DEFAULT_DEPTH_CONFIG: DepthGateConfig;

/**
 * Completeness Gate
 *
 * Validates that AI-generated content is complete:
 * - Minimum word count
 * - Required sections present
 * - Introduction and conclusion (if required)
 * - Learning objectives coverage
 */

declare class CompletenessGate implements QualityGate {
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
declare function createCompletenessGate(config?: Partial<CompletenessGateConfig>): CompletenessGate;

/**
 * Example Quality Gate
 *
 * Validates the quality and quantity of examples in AI-generated content:
 * - Minimum/maximum number of examples
 * - Example length and detail
 * - Code examples for programming content
 * - Real-world examples when appropriate
 */

declare class ExampleQualityGate implements QualityGate {
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
declare function createExampleQualityGate(config?: Partial<ExampleQualityGateConfig>): ExampleQualityGate;

/**
 * Difficulty Match Gate
 *
 * Validates that AI-generated content matches the target difficulty level:
 * - Vocabulary complexity
 * - Concept complexity
 * - Sentence complexity
 * - Readability metrics
 */

declare class DifficultyMatchGate implements QualityGate {
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
declare function createDifficultyMatchGate(config?: Partial<DifficultyMatchGateConfig>): DifficultyMatchGate;

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

declare class StructureGate implements QualityGate {
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
declare function createStructureGate(config?: Partial<StructureGateConfig>): StructureGate;

/**
 * Depth Gate
 *
 * Validates the cognitive depth of AI-generated content:
 * - Explanation depth
 * - Concept connections
 * - Critical thinking prompts
 * - Bloom's taxonomy alignment
 */

declare class DepthGate implements QualityGate {
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
declare function createDepthGate(config?: Partial<DepthGateConfig>): DepthGate;

/**
 * Quality Gate Pipeline
 *
 * Orchestrates all quality gates, runs them in parallel/sequential,
 * calculates weighted scores, and handles enhancement attempts.
 */

/**
 * Content Quality Gate Pipeline
 *
 * Validates AI-generated content through multiple quality gates.
 * Gates run in parallel by default and results are aggregated.
 */
declare class ContentQualityGatePipeline {
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
declare function createQualityGatePipeline(config?: Partial<QualityGatePipelineConfig>): ContentQualityGatePipeline;
/**
 * Validate content using default pipeline configuration
 */
declare function validateContent(content: GeneratedContent, config?: Partial<QualityGatePipelineConfig>): Promise<ValidationResult>;
/**
 * Quick validation for content
 */
declare function quickValidateContent(content: GeneratedContent): Promise<{
    passed: boolean;
    score: number;
    criticalIssues: GateIssue[];
}>;

export { CompletenessGate, type CompletenessGateConfig, type ContentContext, ContentQualityGatePipeline, type ContentType, DEFAULT_COMPLETENESS_CONFIG, DEFAULT_DEPTH_CONFIG, DEFAULT_DIFFICULTY_MATCH_CONFIG, DEFAULT_EXAMPLE_QUALITY_CONFIG, DEFAULT_PIPELINE_CONFIG, DEFAULT_STRUCTURE_CONFIG, DepthGate, type DepthGateConfig, type DifficultyLevel, DifficultyMatchGate, type DifficultyMatchGateConfig, ExampleQualityGate, type ExampleQualityGateConfig, type GateIssue, type GateResult, type GeneratedContent, type QualityGate, type QualityGatePipelineConfig, StructureGate, type StructureGateConfig, type ValidationMetadata, type ValidationResult, createCompletenessGate, createDepthGate, createDifficultyMatchGate, createExampleQualityGate, createQualityGatePipeline, createStructureGate, quickValidateContent, validateContent };
