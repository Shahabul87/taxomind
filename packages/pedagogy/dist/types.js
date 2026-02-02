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
 * Order of sub-levels from lowest to highest complexity
 */
export const BLOOMS_SUB_LEVEL_ORDER = [
    'BASIC',
    'INTERMEDIATE',
    'ADVANCED',
];
/**
 * Get numeric index of a sub-level (0-2)
 */
export function getBloomsSubLevelIndex(subLevel) {
    return BLOOMS_SUB_LEVEL_ORDER.indexOf(subLevel);
}
/**
 * Calculate numeric score from level and sub-level
 * @param level - Bloom's level (1-6)
 * @param subLevel - Sub-level
 * @returns Numeric score (1.0 - 6.9)
 */
export function calculateBloomsNumericScore(levelOrName, subLevel) {
    const level = typeof levelOrName === 'string'
        ? getBloomsLevelIndex(levelOrName) + 1
        : levelOrName;
    const subLevelIndex = getBloomsSubLevelIndex(subLevel);
    // BASIC = +0.0, INTERMEDIATE = +0.3, ADVANCED = +0.7
    const subLevelOffset = subLevelIndex === 0 ? 0 : subLevelIndex === 1 ? 0.3 : 0.7;
    return Math.round((level + subLevelOffset) * 10) / 10;
}
/**
 * Determine sub-level from indicator scores
 * @param indicators - Array of sub-level indicators
 * @returns The determined sub-level
 */
export function determineSubLevelFromIndicators(indicators) {
    if (indicators.length === 0) {
        return 'BASIC';
    }
    // Calculate average indicator score
    const avgScore = indicators.reduce((sum, i) => sum + i.score, 0) / indicators.length;
    if (avgScore >= 0.67) {
        return 'ADVANCED';
    }
    else if (avgScore >= 0.34) {
        return 'INTERMEDIATE';
    }
    else {
        return 'BASIC';
    }
}
/**
 * Create a human-readable label for the Bloom's level and sub-level
 */
export function createBloomsLabel(level, subLevel) {
    const levelName = level.charAt(0) + level.slice(1).toLowerCase();
    const subLevelName = subLevel.charAt(0) + subLevel.slice(1).toLowerCase();
    return `${levelName} - ${subLevelName}`;
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