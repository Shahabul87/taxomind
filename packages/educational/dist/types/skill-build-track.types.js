/**
 * SkillBuildTrack Engine Types
 *
 * Comprehensive skill development and tracking system with:
 * - 7-level proficiency framework (Dreyfus + SFIA hybrid)
 * - Multi-dimensional scoring (mastery, retention, application, confidence, calibration)
 * - Velocity metrics and learning speed tracking
 * - Decay prediction using forgetting curves
 * - Personalized roadmap generation with milestones
 * - Industry benchmarking
 * - Evidence and portfolio tracking
 * - Employability analysis
 */
/**
 * Level thresholds for score-to-level mapping
 */
export const PROFICIENCY_THRESHOLDS = {
    NOVICE: 0,
    BEGINNER: 15,
    COMPETENT: 35,
    PROFICIENT: 55,
    ADVANCED: 70,
    EXPERT: 85,
    STRATEGIST: 95,
};
/**
 * Default decay rates per day by proficiency level
 */
export const DEFAULT_DECAY_RATES = {
    NOVICE: 0.05, // 5% per day
    BEGINNER: 0.04, // 4% per day
    COMPETENT: 0.03, // 3% per day
    PROFICIENT: 0.02, // 2% per day
    ADVANCED: 0.015, // 1.5% per day
    EXPERT: 0.01, // 1% per day
    STRATEGIST: 0.005, // 0.5% per day
};
