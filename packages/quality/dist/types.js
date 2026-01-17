/**
 * Quality Gates Types
 *
 * Priority 2: Content Quality Gates
 * Validates all AI-generated content before delivery
 */
// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================
export const DEFAULT_PIPELINE_CONFIG = {
    threshold: 75,
    maxIterations: 2,
    parallel: true,
    timeoutMs: 10000,
    enableEnhancement: true,
};
export const DEFAULT_COMPLETENESS_CONFIG = {
    minWordCount: 100,
    minSections: 2,
    requireIntroduction: true,
    requireConclusion: false,
    objectiveCoverageThreshold: 0.7,
};
export const DEFAULT_EXAMPLE_QUALITY_CONFIG = {
    minExamples: 1,
    maxExamples: 5,
    requireCodeExamples: false,
    requireRealWorldExamples: false,
    minExampleLength: 20,
};
export const DEFAULT_DIFFICULTY_MATCH_CONFIG = {
    tolerance: 0.2,
    checkVocabulary: true,
    checkConceptComplexity: true,
    checkSentenceComplexity: true,
};
export const DEFAULT_STRUCTURE_CONFIG = {
    minHeadingDepth: 1,
    maxHeadingDepth: 4,
    requireLists: false,
    maxParagraphLength: 8,
    requireMarkdown: true,
};
export const DEFAULT_DEPTH_CONFIG = {
    minDepthScore: 60,
    checkExplanationDepth: true,
    checkConceptConnections: true,
    checkCriticalThinking: true,
};
//# sourceMappingURL=types.js.map