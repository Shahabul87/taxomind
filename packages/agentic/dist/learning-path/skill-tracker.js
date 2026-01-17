/**
 * @sam-ai/agentic - SkillTracker
 * Tracks user skill progression and mastery levels
 */
// ============================================================================
// SKILL TRACKER
// ============================================================================
export class SkillTracker {
    store;
    logger;
    masteryThreshold;
    struggleThreshold;
    decayRatePerDay;
    maxMasteryGain;
    minMasteryLoss;
    constructor(config) {
        this.store = config.store;
        this.logger = config.logger;
        this.masteryThreshold = config.masteryThreshold ?? 80;
        this.struggleThreshold = config.struggleThreshold ?? 40;
        this.decayRatePerDay = config.decayRatePerDay ?? 0.02;
        this.maxMasteryGain = config.maxMasteryGain ?? 20;
        this.minMasteryLoss = config.minMasteryLoss ?? 5;
    }
    /**
     * Get user's complete skill profile
     */
    async getSkillProfile(userId) {
        const existing = await this.store.getSkillProfile(userId);
        if (existing) {
            // Apply decay to skills that haven't been practiced recently
            const updatedSkills = existing.skills.map((skill) => this.applySkillDecay(skill));
            return {
                ...existing,
                skills: updatedSkills,
                masteredConcepts: updatedSkills
                    .filter((s) => s.masteryLevel >= this.masteryThreshold)
                    .map((s) => s.conceptId),
                inProgressConcepts: updatedSkills
                    .filter((s) => s.masteryLevel >= this.struggleThreshold &&
                    s.masteryLevel < this.masteryThreshold)
                    .map((s) => s.conceptId),
                strugglingConcepts: updatedSkills
                    .filter((s) => s.masteryLevel < this.struggleThreshold)
                    .map((s) => s.conceptId),
            };
        }
        // Create new profile
        const newProfile = {
            userId,
            skills: [],
            masteredConcepts: [],
            inProgressConcepts: [],
            strugglingConcepts: [],
            totalLearningTimeMinutes: 0,
            streakDays: 0,
            lastActivityAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await this.store.saveSkillProfile(newProfile);
        return newProfile;
    }
    /**
     * Record performance and update skill mastery
     */
    async recordPerformance(performance) {
        const { userId, conceptId } = performance;
        // Get existing skill or create new one
        let skill = await this.store.getSkill(userId, conceptId);
        const previousMastery = skill?.masteryLevel ?? 0;
        if (!skill) {
            skill = this.createNewSkill(conceptId, performance);
        }
        else {
            skill = this.updateExistingSkill(skill, performance);
        }
        // Save updated skill
        await this.store.updateSkill(userId, skill);
        // Update profile totals
        const profile = await this.getSkillProfile(userId);
        profile.totalLearningTimeMinutes += performance.timeSpentMinutes ?? 0;
        profile.lastActivityAt = new Date();
        profile.updatedAt = new Date();
        // Update streak
        profile.streakDays = this.calculateStreak(profile.lastActivityAt);
        await this.store.saveSkillProfile(profile);
        // Determine unlocked concepts and recommendations
        const unlockedConcepts = await this.getNewlyUnlockedConcepts(userId, conceptId, skill.masteryLevel);
        const recommendedNext = await this.getRecommendedNextConcepts(userId, conceptId);
        this.logger?.debug('Skill updated', {
            userId,
            conceptId,
            previousMastery,
            newMastery: skill.masteryLevel,
        });
        return {
            conceptId,
            previousMastery,
            newMastery: skill.masteryLevel,
            masteryChange: skill.masteryLevel - previousMastery,
            newTrend: skill.strengthTrend,
            unlockedConcepts,
            recommendedNext,
        };
    }
    /**
     * Get concepts that are due for spaced repetition review
     */
    async getConceptsDueForReview(userId, limit = 10) {
        return this.store.getConceptsDueForReview(userId, limit);
    }
    /**
     * Get concepts the user is struggling with
     */
    async getStrugglingConcepts(userId, limit = 5) {
        return this.store.getStrugglingConcepts(userId, limit);
    }
    /**
     * Calculate spaced repetition schedule using SM-2 algorithm
     */
    calculateSpacedRepetition(schedule, quality) {
        let { interval, easeFactor, consecutiveCorrect } = schedule;
        if (quality < 3) {
            // Incorrect response - reset interval
            consecutiveCorrect = 0;
            interval = 1;
        }
        else {
            // Correct response
            consecutiveCorrect++;
            if (consecutiveCorrect === 1) {
                interval = 1;
            }
            else if (consecutiveCorrect === 2) {
                interval = 6;
            }
            else {
                interval = Math.round(interval * easeFactor);
            }
        }
        // Update ease factor using SM-2 formula
        easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
        const nextReviewAt = new Date();
        nextReviewAt.setDate(nextReviewAt.getDate() + interval);
        return {
            ...schedule,
            interval,
            easeFactor,
            consecutiveCorrect,
            nextReviewAt,
            lastReviewAt: new Date(),
            reviewCount: schedule.reviewCount + 1,
        };
    }
    /**
     * Check if user has mastered prerequisites for a concept
     */
    async checkPrerequisitesMet(userId, _conceptId, prerequisites) {
        const profile = await this.getSkillProfile(userId);
        const masteredSet = new Set(profile.masteredConcepts);
        const missing = prerequisites.filter((prereq) => !masteredSet.has(prereq));
        return {
            met: missing.length === 0,
            missing,
        };
    }
    /**
     * Get mastery level for a specific concept
     */
    async getMasteryLevel(userId, conceptId) {
        const skill = await this.store.getSkill(userId, conceptId);
        return skill?.masteryLevel ?? 0;
    }
    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================
    createNewSkill(conceptId, performance) {
        const now = new Date();
        const baseMastery = this.calculateInitialMastery(performance);
        return {
            conceptId,
            conceptName: '', // Will be filled by the adapter
            masteryLevel: baseMastery,
            confidenceScore: performance.score ? performance.score / 100 : 0.5,
            practiceCount: 1,
            correctCount: performance.completed && (performance.score ?? 0) >= 60 ? 1 : 0,
            lastPracticedAt: now,
            firstLearnedAt: now,
            strengthTrend: 'new',
            nextReviewAt: this.calculateNextReview(baseMastery),
            retentionScore: baseMastery,
        };
    }
    updateExistingSkill(skill, performance) {
        const masteryDelta = this.calculateMasteryDelta(skill, performance);
        const newMastery = Math.max(0, Math.min(100, skill.masteryLevel + masteryDelta));
        const isCorrect = performance.completed && (performance.score ?? 0) >= 60;
        return {
            ...skill,
            masteryLevel: newMastery,
            confidenceScore: this.updateConfidence(skill.confidenceScore, performance),
            practiceCount: skill.practiceCount + 1,
            correctCount: skill.correctCount + (isCorrect ? 1 : 0),
            lastPracticedAt: new Date(),
            strengthTrend: this.determineStrengthTrend(skill.masteryLevel, newMastery, skill.strengthTrend),
            nextReviewAt: this.calculateNextReview(newMastery),
            retentionScore: this.calculateRetention(skill, newMastery),
        };
    }
    calculateInitialMastery(performance) {
        let mastery = 0;
        if (performance.completed) {
            mastery += 30;
        }
        if (performance.score !== undefined) {
            mastery += (performance.score / 100) * 40;
        }
        if (performance.struggled) {
            mastery -= 15;
        }
        return Math.max(0, Math.min(100, mastery));
    }
    calculateMasteryDelta(skill, performance) {
        let delta = 0;
        if (performance.completed) {
            if (performance.score !== undefined) {
                // Score-based adjustment
                if (performance.score >= 90) {
                    delta = this.maxMasteryGain;
                }
                else if (performance.score >= 70) {
                    delta = this.maxMasteryGain * 0.7;
                }
                else if (performance.score >= 50) {
                    delta = this.maxMasteryGain * 0.3;
                }
                else {
                    delta = -this.minMasteryLoss;
                }
            }
            else {
                // Completion without score
                delta = this.maxMasteryGain * 0.5;
            }
        }
        else if (performance.struggled) {
            delta = -this.minMasteryLoss * 1.5;
        }
        // Diminishing returns at high mastery
        if (skill.masteryLevel >= 80) {
            delta *= 0.5;
        }
        else if (skill.masteryLevel >= 60) {
            delta *= 0.75;
        }
        return delta;
    }
    updateConfidence(currentConfidence, performance) {
        const performanceConfidence = performance.score
            ? performance.score / 100
            : performance.completed
                ? 0.6
                : 0.3;
        // Weighted average favoring recent performance
        return currentConfidence * 0.6 + performanceConfidence * 0.4;
    }
    determineStrengthTrend(previousMastery, newMastery, currentTrend) {
        const delta = newMastery - previousMastery;
        if (delta > 5)
            return 'improving';
        if (delta < -5)
            return 'declining';
        return currentTrend === 'new' ? 'stable' : currentTrend;
    }
    applySkillDecay(skill) {
        const daysSinceLastPractice = Math.floor((Date.now() - skill.lastPracticedAt.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceLastPractice <= 1) {
            return skill;
        }
        // Apply decay only if not practiced recently
        const decayAmount = daysSinceLastPractice * this.decayRatePerDay * skill.masteryLevel;
        const decayedMastery = Math.max(0, skill.masteryLevel - decayAmount);
        // Update retention score
        const retentionScore = Math.max(0, (skill.retentionScore ?? skill.masteryLevel) - decayAmount * 0.5);
        return {
            ...skill,
            masteryLevel: decayedMastery,
            retentionScore,
            strengthTrend: decayedMastery < skill.masteryLevel - 10 ? 'declining' : skill.strengthTrend,
        };
    }
    calculateNextReview(masteryLevel) {
        const now = new Date();
        let daysUntilReview;
        if (masteryLevel >= 90) {
            daysUntilReview = 14;
        }
        else if (masteryLevel >= 70) {
            daysUntilReview = 7;
        }
        else if (masteryLevel >= 50) {
            daysUntilReview = 3;
        }
        else {
            daysUntilReview = 1;
        }
        now.setDate(now.getDate() + daysUntilReview);
        return now;
    }
    calculateRetention(skill, newMastery) {
        const baseRetention = skill.retentionScore ?? skill.masteryLevel;
        const practiceBonus = Math.min(10, skill.practiceCount * 2);
        return Math.min(100, (baseRetention + newMastery) / 2 + practiceBonus);
    }
    calculateStreak(lastActivityAt) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastActivity = new Date(lastActivityAt);
        lastActivity.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 1) {
            return 1; // Streak continues or starts
        }
        return 0; // Streak broken
    }
    async getNewlyUnlockedConcepts(_userId, _conceptId, newMasteryLevel) {
        // This would typically check prerequisites in the course graph
        // For now, return empty - will be implemented by adapter
        if (newMasteryLevel >= this.masteryThreshold) {
            return []; // Adapter should override this
        }
        return [];
    }
    async getRecommendedNextConcepts(_userId, _completedConceptId) {
        // This would typically get next concepts from the course graph
        // For now, return empty - will be implemented by adapter
        return [];
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
export function createSkillTracker(config) {
    return new SkillTracker(config);
}
//# sourceMappingURL=skill-tracker.js.map