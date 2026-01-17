/**
 * Learning Pathway Calculator
 *
 * Priority 7: Close the Loop with Memory + Personalization
 * Calculates and adjusts learning pathways based on evaluation outcomes
 */
import { v4 as uuidv4 } from 'uuid';
/**
 * Default pathway calculator configuration
 */
export const DEFAULT_PATHWAY_CALCULATOR_CONFIG = {
    skipAheadThreshold: 90,
    remediationThreshold: 50,
    maxSkipSteps: 3,
    maxRemediationSteps: 2,
    skipMasteryLevel: 'proficient',
    bloomsProgression: [
        'REMEMBER',
        'UNDERSTAND',
        'APPLY',
        'ANALYZE',
        'EVALUATE',
        'CREATE',
    ],
};
/**
 * Learning Pathway Calculator
 * Adjusts learning pathways based on evaluation outcomes
 */
export class PathwayCalculator {
    config;
    profileStore;
    constructor(profileStore, config = {}) {
        this.config = { ...DEFAULT_PATHWAY_CALCULATOR_CONFIG, ...config };
        this.profileStore = profileStore;
    }
    /**
     * Calculate pathway adjustment based on evaluation outcome
     */
    async calculateAdjustment(studentId, pathwayId, outcome) {
        // Get current pathway
        const pathways = await this.profileStore.getActivePathways(studentId);
        const pathway = pathways.find((p) => p.id === pathwayId);
        if (!pathway) {
            throw new Error(`Pathway not found: ${pathwayId}`);
        }
        // Get student mastery
        const mastery = await this.profileStore.getMastery(studentId, outcome.topicId);
        // Determine adjustment type
        const adjustmentType = this.determineAdjustmentType(outcome, mastery);
        let adjustment;
        let explanation;
        const stepsAdded = [];
        const stepsRemoved = [];
        const stepsSkipped = [];
        switch (adjustmentType) {
            case 'skip_ahead': {
                const skipResult = this.calculateSkipAhead(pathway, outcome, mastery);
                adjustment = skipResult.adjustment;
                stepsSkipped.push(...skipResult.skippedSteps);
                explanation = `Excellent performance! Skipping ${stepsSkipped.length} steps.`;
                break;
            }
            case 'add_remediation': {
                const remediationResult = this.calculateRemediation(pathway, outcome, mastery);
                adjustment = remediationResult.adjustment;
                stepsAdded.push(...remediationResult.addedSteps);
                explanation = `Adding ${stepsAdded.length} remediation steps to strengthen understanding.`;
                break;
            }
            case 'add_challenge': {
                const challengeResult = this.calculateChallenge(pathway, outcome, mastery);
                adjustment = challengeResult.adjustment;
                stepsAdded.push(...challengeResult.addedSteps);
                explanation = `Adding ${stepsAdded.length} challenge steps to deepen learning.`;
                break;
            }
            default:
                adjustment = {
                    type: 'no_change',
                    reason: 'Performance within expected range',
                };
                explanation = 'Pathway remains unchanged.';
        }
        // Apply adjustment to pathway
        const updatedPathway = this.applyAdjustment(pathway, adjustment);
        // Calculate new estimated time
        const newEstimatedTime = updatedPathway.steps.reduce((sum, step) => sum + step.estimatedDuration, 0);
        return {
            adjustment,
            updatedPathway,
            stepsAdded,
            stepsRemoved,
            stepsSkipped,
            newEstimatedTime,
            explanation,
        };
    }
    /**
     * Recalculate entire pathway based on current mastery
     */
    async recalculatePathway(studentId, pathwayId) {
        const pathways = await this.profileStore.getActivePathways(studentId);
        const pathway = pathways.find((p) => p.id === pathwayId);
        if (!pathway) {
            throw new Error(`Pathway not found: ${pathwayId}`);
        }
        // Get mastery for all topics in pathway
        const masteryMap = new Map();
        for (const step of pathway.steps) {
            const mastery = await this.profileStore.getMastery(studentId, step.topicId);
            if (mastery) {
                masteryMap.set(step.topicId, mastery);
            }
        }
        // Recalculate step statuses
        const updatedSteps = [];
        let currentStepIndex = 0;
        let foundCurrent = false;
        for (let i = 0; i < pathway.steps.length; i++) {
            const step = pathway.steps[i];
            const mastery = masteryMap.get(step.topicId);
            let newStatus = step.status;
            let masteryAchieved = step.masteryAchieved;
            if (mastery) {
                if (this.shouldMarkCompleted(mastery, step.targetBloomsLevel)) {
                    newStatus = 'completed';
                    masteryAchieved = mastery.level;
                }
                else if (this.shouldSkip(mastery)) {
                    newStatus = 'skipped';
                }
            }
            // Find first non-completed step as current
            if (!foundCurrent && newStatus !== 'completed' && newStatus !== 'skipped') {
                currentStepIndex = updatedSteps.length;
                newStatus = 'in_progress';
                foundCurrent = true;
            }
            updatedSteps.push({
                ...step,
                status: newStatus,
                masteryAchieved,
            });
        }
        // Calculate progress
        const completedSteps = updatedSteps.filter((s) => s.status === 'completed' || s.status === 'skipped').length;
        const progress = updatedSteps.length > 0
            ? (completedSteps / updatedSteps.length) * 100
            : 0;
        // Update pathway status
        let status = pathway.status;
        if (completedSteps === updatedSteps.length) {
            status = 'completed';
        }
        return {
            ...pathway,
            steps: updatedSteps,
            currentStepIndex,
            progress,
            status,
            updatedAt: new Date(),
        };
    }
    /**
     * Create a new pathway for a course
     */
    async createPathway(studentId, courseId, topics) {
        const steps = topics.map((topic, index) => ({
            id: uuidv4(),
            topicId: topic.topicId,
            targetBloomsLevel: topic.targetBloomsLevel,
            order: index,
            status: index === 0 ? 'in_progress' : 'not_started',
            prerequisites: index > 0 ? [topics[index - 1].topicId] : [],
            estimatedDuration: topic.estimatedDuration,
        }));
        const pathway = {
            id: uuidv4(),
            studentId,
            courseId,
            steps,
            currentStepIndex: 0,
            progress: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'active',
        };
        return pathway;
    }
    /**
     * Determine adjustment type based on outcome
     */
    determineAdjustmentType(outcome, mastery) {
        const scorePercent = (outcome.score / outcome.maxScore) * 100;
        // High score - consider skipping ahead
        if (scorePercent >= this.config.skipAheadThreshold &&
            mastery &&
            this.masteryLevelIndex(mastery.level) >=
                this.masteryLevelIndex(this.config.skipMasteryLevel)) {
            return 'skip_ahead';
        }
        // Low score - add remediation
        if (scorePercent < this.config.remediationThreshold) {
            return 'add_remediation';
        }
        // Good score with high Bloom's - add challenge
        if (scorePercent >= 80 &&
            this.bloomsLevelIndex(outcome.bloomsLevel) >= 3 // ANALYZE or higher
        ) {
            return 'add_challenge';
        }
        return 'no_change';
    }
    /**
     * Calculate skip ahead adjustment
     */
    calculateSkipAhead(pathway, outcome, mastery) {
        const currentIndex = pathway.currentStepIndex;
        const remainingSteps = pathway.steps.slice(currentIndex + 1);
        const skippedSteps = [];
        // Find steps that can be skipped (same topic or lower Bloom's level)
        let skipCount = 0;
        for (const step of remainingSteps) {
            if (skipCount >= this.config.maxSkipSteps)
                break;
            const stepBloomsIndex = this.bloomsLevelIndex(step.targetBloomsLevel);
            const masteryBloomsIndex = mastery
                ? this.bloomsLevelIndex(mastery.bloomsLevel)
                : -1;
            if (step.topicId === outcome.topicId ||
                stepBloomsIndex <= masteryBloomsIndex) {
                skippedSteps.push(step);
                skipCount++;
            }
            else {
                break;
            }
        }
        const newIndex = currentIndex + skipCount + 1;
        return {
            adjustment: {
                type: 'skip_ahead',
                reason: `Mastery demonstrated at ${mastery?.level} level`,
                newCurrentStepIndex: Math.min(newIndex, pathway.steps.length - 1),
            },
            skippedSteps,
        };
    }
    /**
     * Calculate remediation adjustment
     */
    calculateRemediation(pathway, outcome, _mastery) {
        const currentStep = pathway.steps[pathway.currentStepIndex];
        const addedSteps = [];
        // Determine what Bloom's levels need remediation
        const currentBloomsIndex = this.bloomsLevelIndex(currentStep?.targetBloomsLevel ?? 'REMEMBER');
        // Add steps for lower Bloom's levels
        const remediationLevels = this.config.bloomsProgression.slice(0, Math.max(0, currentBloomsIndex));
        for (let i = 0; i < Math.min(remediationLevels.length, this.config.maxRemediationSteps); i++) {
            const level = remediationLevels[remediationLevels.length - 1 - i];
            addedSteps.push({
                id: uuidv4(),
                topicId: outcome.topicId,
                targetBloomsLevel: level,
                order: pathway.currentStepIndex + i,
                status: 'not_started',
                prerequisites: i > 0 ? [addedSteps[i - 1].topicId] : currentStep?.prerequisites ?? [],
                estimatedDuration: 15, // Default remediation duration
            });
        }
        return {
            adjustment: {
                type: 'add_remediation',
                reason: `Score ${outcome.score}% below threshold`,
                stepsToAdd: addedSteps,
            },
            addedSteps,
        };
    }
    /**
     * Calculate challenge adjustment
     */
    calculateChallenge(pathway, outcome, mastery) {
        const currentStep = pathway.steps[pathway.currentStepIndex];
        const addedSteps = [];
        // Determine next Bloom's levels for challenge
        const currentBloomsIndex = this.bloomsLevelIndex(mastery?.bloomsLevel ?? currentStep?.targetBloomsLevel ?? 'REMEMBER');
        const challengeLevels = this.config.bloomsProgression.slice(currentBloomsIndex + 1);
        // Add one challenge step at next Bloom's level
        if (challengeLevels.length > 0) {
            addedSteps.push({
                id: uuidv4(),
                topicId: outcome.topicId,
                targetBloomsLevel: challengeLevels[0],
                order: pathway.currentStepIndex + 1,
                status: 'not_started',
                prerequisites: [outcome.topicId],
                estimatedDuration: 20, // Default challenge duration
            });
        }
        return {
            adjustment: {
                type: 'add_challenge',
                reason: `High performance (${outcome.score}%) ready for challenge`,
                stepsToAdd: addedSteps,
            },
            addedSteps,
        };
    }
    /**
     * Apply adjustment to pathway
     */
    applyAdjustment(pathway, adjustment) {
        const updatedPathway = { ...pathway, steps: [...pathway.steps] };
        switch (adjustment.type) {
            case 'skip_ahead':
                if (adjustment.newCurrentStepIndex !== undefined) {
                    // Mark skipped steps
                    for (let i = updatedPathway.currentStepIndex; i < adjustment.newCurrentStepIndex; i++) {
                        if (updatedPathway.steps[i]) {
                            updatedPathway.steps[i] = {
                                ...updatedPathway.steps[i],
                                status: 'skipped',
                            };
                        }
                    }
                    updatedPathway.currentStepIndex = adjustment.newCurrentStepIndex;
                    if (updatedPathway.steps[updatedPathway.currentStepIndex]) {
                        updatedPathway.steps[updatedPathway.currentStepIndex] = {
                            ...updatedPathway.steps[updatedPathway.currentStepIndex],
                            status: 'in_progress',
                        };
                    }
                }
                break;
            case 'add_remediation':
            case 'add_challenge':
                if (adjustment.stepsToAdd && adjustment.stepsToAdd.length > 0) {
                    // Insert steps at current position
                    updatedPathway.steps = [
                        ...updatedPathway.steps.slice(0, updatedPathway.currentStepIndex),
                        ...adjustment.stepsToAdd,
                        ...updatedPathway.steps.slice(updatedPathway.currentStepIndex),
                    ];
                    // Reorder
                    updatedPathway.steps = updatedPathway.steps.map((step, index) => ({
                        ...step,
                        order: index,
                    }));
                }
                break;
            case 'no_change':
                // Do nothing
                break;
        }
        // Remove steps if specified
        if (adjustment.stepsToRemove && adjustment.stepsToRemove.length > 0) {
            const removeSet = new Set(adjustment.stepsToRemove);
            updatedPathway.steps = updatedPathway.steps.filter((s) => !removeSet.has(s.id));
        }
        // Recalculate progress
        const completedSteps = updatedPathway.steps.filter((s) => s.status === 'completed' || s.status === 'skipped').length;
        updatedPathway.progress =
            updatedPathway.steps.length > 0
                ? (completedSteps / updatedPathway.steps.length) * 100
                : 0;
        updatedPathway.updatedAt = new Date();
        return updatedPathway;
    }
    /**
     * Check if step should be marked completed based on mastery
     */
    shouldMarkCompleted(mastery, targetBloomsLevel) {
        const masteryBloomsIndex = this.bloomsLevelIndex(mastery.bloomsLevel);
        const targetBloomsIndex = this.bloomsLevelIndex(targetBloomsLevel);
        return (masteryBloomsIndex >= targetBloomsIndex &&
            (mastery.level === 'proficient' || mastery.level === 'expert'));
    }
    /**
     * Check if step should be skipped based on mastery
     */
    shouldSkip(mastery) {
        return (mastery.level === 'expert' &&
            mastery.confidence > 0.8 &&
            mastery.assessmentCount >= 3);
    }
    /**
     * Get mastery level index
     */
    masteryLevelIndex(level) {
        const levels = [
            'novice',
            'beginner',
            'intermediate',
            'proficient',
            'expert',
        ];
        return levels.indexOf(level);
    }
    /**
     * Get Bloom's level index
     */
    bloomsLevelIndex(level) {
        return this.config.bloomsProgression.indexOf(level);
    }
}
// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================
/**
 * Create a pathway calculator
 */
export function createPathwayCalculator(profileStore, config) {
    return new PathwayCalculator(profileStore, config);
}
//# sourceMappingURL=pathway-calculator.js.map