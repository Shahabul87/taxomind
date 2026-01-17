/**
 * Pedagogical Evaluator Types
 *
 * Priority 5: Implement Pedagogical Evaluators
 * Types for educational effectiveness validation
 */
/**
 * Bloom's level order (lowest to highest cognitive complexity)
 */
export const BLOOMS_LEVEL_ORDER = [
    'REMEMBER',
    'UNDERSTAND',
    'APPLY',
    'ANALYZE',
    'EVALUATE',
    'CREATE',
];
/**
 * Get numeric index of a Bloom's level (0-5)
 */
export function getBloomsLevelIndex(level) {
    return BLOOMS_LEVEL_ORDER.indexOf(level);
}
/**
 * Difficulty level order
 */
export const DIFFICULTY_LEVEL_ORDER = [
    'beginner',
    'intermediate',
    'advanced',
    'expert',
];
/**
 * Get numeric index of difficulty level (0-3)
 */
export function getDifficultyLevelIndex(level) {
    return DIFFICULTY_LEVEL_ORDER.indexOf(level);
}
/**
 * Default pipeline configuration
 */
export const DEFAULT_PEDAGOGICAL_PIPELINE_CONFIG = {
    evaluators: ['blooms', 'scaffolding', 'zpd'],
    threshold: 70,
    parallel: true,
    timeoutMs: 10000,
    requireStudentProfile: false,
};
//# sourceMappingURL=types.js.map