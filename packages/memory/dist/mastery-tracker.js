/**
 * Mastery Tracker
 *
 * Priority 7: Close the Loop with Memory + Personalization
 * Tracks and updates student mastery levels based on evaluations
 */
/**
 * Default mastery tracker configuration
 */
export const DEFAULT_MASTERY_TRACKER_CONFIG = {
    recencyWeight: 0.7,
    minAssessmentsForStability: 3,
    levelThresholds: {
        beginner: 50,
        intermediate: 70,
        proficient: 80,
        expert: 90,
    },
    bloomsWeights: {
        REMEMBER: 0.5,
        UNDERSTAND: 0.7,
        APPLY: 0.85,
        ANALYZE: 0.95,
        EVALUATE: 1.0,
        CREATE: 1.1,
    },
    decayRatePerDay: 0.5, // 0.5% per day (deprecated, use bloomsDecayRates)
    decayStartDays: 30,
    // Phase 6: Enhanced Mastery Decay with Bloom's Weighting
    // Higher cognitive levels decay faster - complex skills need more practice to maintain
    bloomsDecayRates: {
        REMEMBER: 0.2, // Facts stick longer (0.2%/day)
        UNDERSTAND: 0.3, // Concepts retain well (0.3%/day)
        APPLY: 0.4, // Procedures need practice (0.4%/day)
        ANALYZE: 0.5, // Baseline decay (0.5%/day)
        EVALUATE: 0.6, // Judgment skills fade (0.6%/day)
        CREATE: 0.7, // Complex skills decay fastest (0.7%/day)
    },
    // Sub-level modifiers: ADVANCED decays 20% faster than BASIC
    subLevelDecayModifiers: {
        BASIC: 0.85, // 15% slower decay
        INTERMEDIATE: 1.0, // Baseline
        ADVANCED: 1.2, // 20% faster decay
    },
};
/**
 * Mastery Tracker
 * Tracks and updates student mastery levels
 */
export class MasteryTracker {
    config;
    profileStore;
    constructor(profileStore, config = {}) {
        this.config = { ...DEFAULT_MASTERY_TRACKER_CONFIG, ...config };
        this.profileStore = profileStore;
    }
    /**
     * Process an evaluation outcome and update mastery
     */
    async processEvaluation(outcome) {
        // Get previous mastery
        const previousMastery = await this.profileStore.getMastery(outcome.studentId, outcome.topicId);
        // Calculate score with Bloom's weight
        const bloomsWeight = this.config.bloomsWeights[outcome.bloomsLevel];
        const weightedScore = Math.min(100, outcome.score * bloomsWeight);
        // Create mastery update
        const update = {
            topicId: outcome.topicId,
            bloomsLevel: outcome.bloomsLevel,
            score: weightedScore,
            maxScore: outcome.maxScore,
            timestamp: outcome.evaluatedAt,
            context: {
                courseId: outcome.courseId,
                chapterId: outcome.chapterId,
                sectionId: outcome.sectionId,
                assessmentType: outcome.assessmentType,
            },
        };
        // Update mastery in store
        const currentMastery = await this.profileStore.updateMastery(outcome.studentId, update);
        // Calculate results
        const levelChanged = previousMastery
            ? previousMastery.level !== currentMastery.level
            : true;
        const scoreDifference = previousMastery
            ? currentMastery.score - previousMastery.score
            : currentMastery.score;
        const changeDirection = this.determineChangeDirection(previousMastery?.level, currentMastery.level);
        const isStable = currentMastery.assessmentCount >= this.config.minAssessmentsForStability;
        const recommendations = this.generateRecommendations(currentMastery, outcome, changeDirection);
        return {
            previousMastery: previousMastery ?? undefined,
            currentMastery,
            levelChanged,
            changeDirection,
            scoreDifference,
            isStable,
            recommendations,
        };
    }
    /**
     * Get mastery for a topic
     */
    async getMastery(studentId, topicId) {
        return this.profileStore.getMastery(studentId, topicId);
    }
    /**
     * Calculate mastery level from score
     */
    calculateMasteryLevel(score) {
        const thresholds = this.config.levelThresholds;
        if (score >= thresholds.expert)
            return 'expert';
        if (score >= thresholds.proficient)
            return 'proficient';
        if (score >= thresholds.intermediate)
            return 'intermediate';
        if (score >= thresholds.beginner)
            return 'beginner';
        return 'novice';
    }
    /**
     * Apply decay to unused topics
     * Phase 6: Enhanced with Bloom's-weighted decay rates
     *
     * @param studentId - Student identifier
     * @param topicId - Topic identifier
     * @param currentDate - Current date for decay calculation
     * @param subLevel - Optional sub-level for more granular decay (BASIC/INTERMEDIATE/ADVANCED)
     */
    async applyDecay(studentId, topicId, currentDate = new Date(), subLevel) {
        const mastery = await this.profileStore.getMastery(studentId, topicId);
        if (!mastery) {
            return null;
        }
        const daysSinceLastAssessment = Math.floor((currentDate.getTime() - mastery.lastAssessedAt.getTime()) /
            (1000 * 60 * 60 * 24));
        if (daysSinceLastAssessment <= this.config.decayStartDays) {
            return mastery;
        }
        const decayDays = daysSinceLastAssessment - this.config.decayStartDays;
        // Phase 6: Get Bloom's-level specific decay rate
        const baseDecayRate = this.getBloomsDecayRate(mastery.bloomsLevel);
        // Apply sub-level modifier if provided
        const subLevelModifier = subLevel
            ? this.config.subLevelDecayModifiers[subLevel]
            : 1.0;
        const effectiveDecayRate = baseDecayRate * subLevelModifier;
        const decayAmount = decayDays * effectiveDecayRate;
        const decayedScore = Math.max(0, mastery.score - decayAmount);
        // Only update if score actually changed
        if (decayedScore < mastery.score) {
            const update = {
                topicId,
                bloomsLevel: mastery.bloomsLevel,
                score: decayedScore,
                maxScore: 100,
                timestamp: currentDate,
            };
            return this.profileStore.updateMastery(studentId, update);
        }
        return mastery;
    }
    /**
     * Get the Bloom's-level specific decay rate (Phase 6)
     * Higher cognitive levels decay faster as they require more practice to maintain
     *
     * @param bloomsLevel - The Bloom's taxonomy level
     * @returns Decay rate per day as a percentage
     */
    getBloomsDecayRate(bloomsLevel) {
        return this.config.bloomsDecayRates[bloomsLevel];
    }
    /**
     * Calculate effective decay rate including sub-level modifier (Phase 6)
     *
     * @param bloomsLevel - The Bloom's taxonomy level
     * @param subLevel - Optional sub-level (BASIC/INTERMEDIATE/ADVANCED)
     * @returns Effective decay rate per day as a percentage
     */
    getEffectiveDecayRate(bloomsLevel, subLevel) {
        const baseRate = this.getBloomsDecayRate(bloomsLevel);
        const modifier = subLevel
            ? this.config.subLevelDecayModifiers[subLevel]
            : 1.0;
        return baseRate * modifier;
    }
    /**
     * Estimate days until mastery decays to a target score (Phase 6)
     *
     * @param currentScore - Current mastery score
     * @param targetScore - Target score to decay to
     * @param bloomsLevel - The Bloom's taxonomy level
     * @param subLevel - Optional sub-level for more precise estimation
     * @returns Estimated days until decay reaches target (after grace period)
     */
    estimateDaysUntilDecay(currentScore, targetScore, bloomsLevel, subLevel) {
        if (currentScore <= targetScore) {
            return 0;
        }
        const effectiveRate = this.getEffectiveDecayRate(bloomsLevel, subLevel);
        const scoreDifference = currentScore - targetScore;
        const decayDays = Math.ceil(scoreDifference / effectiveRate);
        // Add grace period
        return decayDays + this.config.decayStartDays;
    }
    /**
     * Get topics needing review (mastery below threshold)
     */
    async getTopicsNeedingReview(studentId, threshold = 70) {
        const profile = await this.profileStore.get(studentId);
        if (!profile) {
            return [];
        }
        return Object.values(profile.masteryByTopic).filter((m) => m.score < threshold);
    }
    /**
     * Get mastery summary for a student
     */
    async getMasterySummary(studentId) {
        const profile = await this.profileStore.get(studentId);
        if (!profile) {
            return {
                totalTopics: 0,
                averageMastery: 0,
                levelDistribution: {
                    novice: 0,
                    beginner: 0,
                    intermediate: 0,
                    proficient: 0,
                    expert: 0,
                },
                bloomsDistribution: {
                    REMEMBER: 0,
                    UNDERSTAND: 0,
                    APPLY: 0,
                    ANALYZE: 0,
                    EVALUATE: 0,
                    CREATE: 0,
                },
                recentTrend: 'stable',
                topicsNeedingAttention: [],
                strengths: [],
            };
        }
        const masteryRecords = Object.values(profile.masteryByTopic);
        const totalTopics = masteryRecords.length;
        if (totalTopics === 0) {
            return {
                totalTopics: 0,
                averageMastery: 0,
                levelDistribution: {
                    novice: 0,
                    beginner: 0,
                    intermediate: 0,
                    proficient: 0,
                    expert: 0,
                },
                bloomsDistribution: {
                    REMEMBER: 0,
                    UNDERSTAND: 0,
                    APPLY: 0,
                    ANALYZE: 0,
                    EVALUATE: 0,
                    CREATE: 0,
                },
                recentTrend: 'stable',
                topicsNeedingAttention: [],
                strengths: [],
            };
        }
        // Calculate averages
        const averageMastery = masteryRecords.reduce((sum, m) => sum + m.score, 0) / totalTopics;
        // Calculate level distribution
        const levelDistribution = {
            novice: 0,
            beginner: 0,
            intermediate: 0,
            proficient: 0,
            expert: 0,
        };
        for (const m of masteryRecords) {
            levelDistribution[m.level]++;
        }
        // Calculate Bloom's distribution
        const bloomsDistribution = {
            REMEMBER: 0,
            UNDERSTAND: 0,
            APPLY: 0,
            ANALYZE: 0,
            EVALUATE: 0,
            CREATE: 0,
        };
        for (const m of masteryRecords) {
            bloomsDistribution[m.bloomsLevel]++;
        }
        // Determine recent trend
        const recentRecords = masteryRecords
            .filter((m) => m.lastAssessedAt.getTime() >
            Date.now() - 7 * 24 * 60 * 60 * 1000)
            .sort((a, b) => b.lastAssessedAt.getTime() - a.lastAssessedAt.getTime());
        let recentTrend = 'stable';
        if (recentRecords.length >= 2) {
            const improvingCount = recentRecords.filter((m) => m.trend === 'improving').length;
            const decliningCount = recentRecords.filter((m) => m.trend === 'declining').length;
            if (improvingCount > decliningCount) {
                recentTrend = 'improving';
            }
            else if (decliningCount > improvingCount) {
                recentTrend = 'declining';
            }
        }
        // Find topics needing attention (low mastery or declining)
        const topicsNeedingAttention = masteryRecords
            .filter((m) => m.level === 'novice' ||
            m.level === 'beginner' ||
            m.trend === 'declining')
            .map((m) => m.topicId);
        // Find strengths (high mastery)
        const strengths = masteryRecords
            .filter((m) => m.level === 'expert' || m.level === 'proficient')
            .map((m) => m.topicId);
        return {
            totalTopics,
            averageMastery,
            levelDistribution,
            bloomsDistribution,
            recentTrend,
            topicsNeedingAttention,
            strengths,
        };
    }
    /**
     * Determine change direction between mastery levels
     */
    determineChangeDirection(previous, current) {
        if (!previous) {
            return 'unchanged';
        }
        const levels = [
            'novice',
            'beginner',
            'intermediate',
            'proficient',
            'expert',
        ];
        const prevIndex = levels.indexOf(previous);
        const currIndex = levels.indexOf(current);
        if (currIndex > prevIndex)
            return 'improved';
        if (currIndex < prevIndex)
            return 'declined';
        return 'unchanged';
    }
    /**
     * Generate recommendations based on mastery
     */
    generateRecommendations(mastery, outcome, changeDirection) {
        const recommendations = [];
        // Low mastery recommendations
        if (mastery.level === 'novice' || mastery.level === 'beginner') {
            recommendations.push({
                type: 'review_basics',
                message: `Consider reviewing foundational concepts for "${outcome.topicId}"`,
                priority: 1,
                action: 'Review introductory materials and practice basic exercises',
            });
        }
        // Declining trend
        if (mastery.trend === 'declining' || changeDirection === 'declined') {
            recommendations.push({
                type: 'practice_more',
                message: `Performance in "${outcome.topicId}" is declining. More practice recommended.`,
                priority: 2,
                action: 'Schedule additional practice sessions',
            });
        }
        // High mastery - ready for challenge
        if ((mastery.level === 'proficient' || mastery.level === 'expert') &&
            mastery.confidence > 0.7) {
            recommendations.push({
                type: 'challenge_increase',
                message: `Ready for more challenging content in "${outcome.topicId}"`,
                priority: 3,
                action: 'Explore advanced topics or higher Bloom\'s levels',
            });
        }
        // Stable high performance - maintain
        if (mastery.level === 'expert' &&
            mastery.trend === 'stable' &&
            changeDirection === 'unchanged') {
            recommendations.push({
                type: 'maintain',
                message: `Excellent mastery of "${outcome.topicId}". Periodic review recommended.`,
                priority: 4,
                action: 'Schedule periodic reviews to maintain mastery',
            });
        }
        // Improved - ready to advance
        if (changeDirection === 'improved' && outcome.score >= 80) {
            recommendations.push({
                type: 'advance_level',
                message: `Great improvement in "${outcome.topicId}"! Ready for the next level.`,
                priority: 2,
                action: 'Move to more advanced content',
            });
        }
        return recommendations.sort((a, b) => a.priority - b.priority);
    }
}
// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================
/**
 * Create a mastery tracker
 */
export function createMasteryTracker(profileStore, config) {
    return new MasteryTracker(profileStore, config);
}
//# sourceMappingURL=mastery-tracker.js.map