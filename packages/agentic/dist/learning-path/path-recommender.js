/**
 * @sam-ai/agentic - LearningPathRecommender
 * Generates personalized learning path recommendations
 */
import { v4 as uuidv4 } from 'uuid';
// ============================================================================
// LEARNING PATH RECOMMENDER
// ============================================================================
export class LearningPathRecommender {
    pathStore;
    courseGraphStore;
    skillTracker;
    logger;
    defaultMaxSteps;
    defaultMaxMinutes;
    pathExpirationHours;
    constructor(config) {
        this.pathStore = config.pathStore;
        this.courseGraphStore = config.courseGraphStore;
        this.skillTracker = config.skillTracker;
        this.logger = config.logger;
        this.defaultMaxSteps = config.defaultMaxSteps ?? 10;
        this.defaultMaxMinutes = config.defaultMaxMinutes ?? 60;
        this.pathExpirationHours = config.pathExpirationHours ?? 24;
    }
    /**
     * Generate a personalized learning path
     */
    async generatePath(userId, options = {}) {
        const maxSteps = options.maxSteps ?? this.defaultMaxSteps;
        const maxMinutes = options.maxMinutes ?? this.defaultMaxMinutes;
        // Get user's skill profile
        const skillProfile = await this.skillTracker.getSkillProfile(userId);
        // Get course graph if specified
        let courseGraph = null;
        if (options.courseId) {
            courseGraph = await this.courseGraphStore.getCourseGraph(options.courseId);
        }
        const steps = [];
        let totalMinutes = 0;
        // Priority 1: Address struggling concepts
        if (options.focusOnWeakAreas !== false) {
            const strugglingSteps = await this.buildStrugglingConceptSteps(skillProfile, courseGraph?.concepts ?? [], maxSteps - steps.length, maxMinutes - totalMinutes);
            for (const step of strugglingSteps) {
                if (steps.length >= maxSteps || totalMinutes >= maxMinutes)
                    break;
                steps.push({ ...step, order: steps.length + 1 });
                totalMinutes += step.estimatedMinutes;
            }
        }
        // Priority 2: Continue in-progress concepts
        const inProgressSteps = await this.buildInProgressSteps(skillProfile, courseGraph?.concepts ?? [], maxSteps - steps.length, maxMinutes - totalMinutes);
        for (const step of inProgressSteps) {
            if (steps.length >= maxSteps || totalMinutes >= maxMinutes)
                break;
            steps.push({ ...step, order: steps.length + 1 });
            totalMinutes += step.estimatedMinutes;
        }
        // Priority 3: New concepts (respecting prerequisites)
        if (courseGraph) {
            const newConceptSteps = await this.buildNewConceptSteps(userId, skillProfile, courseGraph.concepts, courseGraph.prerequisites, maxSteps - steps.length, maxMinutes - totalMinutes, options.difficultyPreference);
            for (const step of newConceptSteps) {
                if (steps.length >= maxSteps || totalMinutes >= maxMinutes)
                    break;
                steps.push({ ...step, order: steps.length + 1 });
                totalMinutes += step.estimatedMinutes;
            }
        }
        // Priority 4: Spaced repetition review
        if (options.includeReview !== false) {
            const reviewSteps = await this.buildReviewSteps(userId, skillProfile, courseGraph?.concepts ?? [], maxSteps - steps.length, maxMinutes - totalMinutes);
            for (const step of reviewSteps) {
                if (steps.length >= maxSteps || totalMinutes >= maxMinutes)
                    break;
                steps.push({ ...step, order: steps.length + 1 });
                totalMinutes += step.estimatedMinutes;
            }
        }
        // Calculate overall difficulty
        const difficulty = this.calculatePathDifficulty(steps, courseGraph?.concepts ?? []);
        // Calculate confidence
        const confidence = this.calculateConfidence(skillProfile, steps.length, courseGraph);
        // Build the learning path
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + this.pathExpirationHours);
        const path = {
            id: uuidv4(),
            userId,
            courseId: options.courseId,
            targetConceptId: options.targetConceptId,
            steps,
            totalEstimatedMinutes: totalMinutes,
            difficulty,
            confidence,
            reason: this.generatePathReason(steps, skillProfile),
            createdAt: new Date(),
            expiresAt,
        };
        // Save the path
        await this.pathStore.saveLearningPath(path);
        this.logger?.info('Learning path generated', {
            userId,
            courseId: options.courseId,
            stepCount: steps.length,
            totalMinutes,
            confidence,
        });
        return path;
    }
    /**
     * Get active learning path for a user
     */
    async getActivePath(userId, courseId) {
        if (courseId) {
            return this.pathStore.getPathForCourse(userId, courseId);
        }
        const paths = await this.pathStore.getActiveLearningPaths(userId);
        return paths[0] ?? null;
    }
    /**
     * Mark a step as completed
     */
    async completeStep(pathId, stepOrder) {
        await this.pathStore.markStepCompleted(pathId, stepOrder);
    }
    /**
     * Generate a path to reach a specific target concept
     */
    async generatePathToTarget(userId, targetConceptId, courseId) {
        const skillProfile = await this.skillTracker.getSkillProfile(userId);
        const courseGraph = await this.courseGraphStore.getCourseGraph(courseId);
        if (!courseGraph) {
            throw new Error(`Course graph not found for courseId: ${courseId}`);
        }
        // Find all prerequisites recursively
        const requiredConcepts = await this.findAllPrerequisites(targetConceptId, courseGraph.prerequisites, new Set());
        // Filter to only concepts not yet mastered
        const masteredSet = new Set(skillProfile.masteredConcepts);
        const neededConcepts = Array.from(requiredConcepts).filter((id) => !masteredSet.has(id));
        // Add the target concept itself
        if (!masteredSet.has(targetConceptId)) {
            neededConcepts.push(targetConceptId);
        }
        // Build steps in prerequisite order
        const steps = await this.buildOrderedSteps(neededConcepts, courseGraph.concepts, courseGraph.prerequisites, skillProfile);
        const totalMinutes = steps.reduce((sum, s) => sum + s.estimatedMinutes, 0);
        const difficulty = this.calculatePathDifficulty(steps, courseGraph.concepts);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + this.pathExpirationHours * 2); // Longer for target paths
        const path = {
            id: uuidv4(),
            userId,
            courseId,
            targetConceptId,
            steps,
            totalEstimatedMinutes: totalMinutes,
            difficulty,
            confidence: 0.8,
            reason: `Path to master "${this.getConceptName(targetConceptId, courseGraph.concepts)}" including ${neededConcepts.length} prerequisite concepts.`,
            createdAt: new Date(),
            expiresAt,
        };
        await this.pathStore.saveLearningPath(path);
        return path;
    }
    // ============================================================================
    // PRIVATE METHODS - STEP BUILDERS
    // ============================================================================
    async buildStrugglingConceptSteps(profile, concepts, maxSteps, maxMinutes) {
        const steps = [];
        let totalMinutes = 0;
        const strugglingSkills = profile.skills.filter((s) => profile.strugglingConcepts.includes(s.conceptId));
        // Sort by lowest mastery first
        strugglingSkills.sort((a, b) => a.masteryLevel - b.masteryLevel);
        for (const skill of strugglingSkills) {
            if (steps.length >= maxSteps || totalMinutes >= maxMinutes)
                break;
            const concept = concepts.find((c) => c.id === skill.conceptId);
            const estimatedMinutes = concept?.estimatedMinutes ?? 15;
            if (totalMinutes + estimatedMinutes > maxMinutes)
                continue;
            steps.push({
                conceptId: skill.conceptId,
                conceptName: skill.conceptName || concept?.name || 'Unknown Concept',
                action: 'review',
                priority: 'critical',
                estimatedMinutes,
                reason: `Struggling area (${skill.masteryLevel}% mastery) - focused review needed`,
                prerequisites: [],
            });
            totalMinutes += estimatedMinutes;
        }
        return steps;
    }
    async buildInProgressSteps(profile, concepts, maxSteps, maxMinutes) {
        const steps = [];
        let totalMinutes = 0;
        const inProgressSkills = profile.skills.filter((s) => profile.inProgressConcepts.includes(s.conceptId));
        // Sort by highest mastery first (closest to completion)
        inProgressSkills.sort((a, b) => b.masteryLevel - a.masteryLevel);
        for (const skill of inProgressSkills) {
            if (steps.length >= maxSteps || totalMinutes >= maxMinutes)
                break;
            const concept = concepts.find((c) => c.id === skill.conceptId);
            const estimatedMinutes = concept?.estimatedMinutes ?? 20;
            if (totalMinutes + estimatedMinutes > maxMinutes)
                continue;
            const action = skill.masteryLevel >= 60 ? 'practice' : 'learn';
            steps.push({
                conceptId: skill.conceptId,
                conceptName: skill.conceptName || concept?.name || 'Unknown Concept',
                action,
                priority: 'high',
                estimatedMinutes,
                reason: `Continue learning (${skill.masteryLevel}% complete)`,
                prerequisites: [],
            });
            totalMinutes += estimatedMinutes;
        }
        return steps;
    }
    async buildNewConceptSteps(userId, profile, concepts, prerequisites, maxSteps, maxMinutes, difficultyPreference) {
        const steps = [];
        let totalMinutes = 0;
        // Find concepts not started yet
        const knownConceptIds = new Set([
            ...profile.masteredConcepts,
            ...profile.inProgressConcepts,
            ...profile.strugglingConcepts,
        ]);
        const newConcepts = concepts.filter((c) => !knownConceptIds.has(c.id));
        // Sort by difficulty if preference specified
        if (difficultyPreference) {
            const difficultyOrder = {
                beginner: 0,
                intermediate: 1,
                advanced: 2,
                expert: 3,
            };
            const prefOrder = difficultyOrder[difficultyPreference];
            newConcepts.sort((a, b) => {
                const aDiff = Math.abs(difficultyOrder[a.difficulty] - prefOrder);
                const bDiff = Math.abs(difficultyOrder[b.difficulty] - prefOrder);
                return aDiff - bDiff;
            });
        }
        else {
            // Default: easiest first
            newConcepts.sort((a, b) => {
                const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2, expert: 3 };
                return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
            });
        }
        for (const concept of newConcepts) {
            if (steps.length >= maxSteps || totalMinutes >= maxMinutes)
                break;
            // Check prerequisites
            const conceptPrereqs = prerequisites
                .filter((p) => p.conceptId === concept.id)
                .map((p) => p.requiresConceptId);
            const prereqCheck = await this.skillTracker.checkPrerequisitesMet(userId, concept.id, conceptPrereqs);
            if (!prereqCheck.met)
                continue;
            const estimatedMinutes = concept.estimatedMinutes ?? 25;
            if (totalMinutes + estimatedMinutes > maxMinutes)
                continue;
            steps.push({
                conceptId: concept.id,
                conceptName: concept.name,
                action: 'learn',
                priority: 'medium',
                estimatedMinutes,
                reason: 'Next concept in learning sequence',
                prerequisites: conceptPrereqs,
            });
            totalMinutes += estimatedMinutes;
        }
        return steps;
    }
    async buildReviewSteps(userId, _profile, concepts, maxSteps, maxMinutes) {
        const steps = [];
        let totalMinutes = 0;
        // Get concepts due for review
        const dueForReview = await this.skillTracker.getConceptsDueForReview(userId, maxSteps);
        for (const skill of dueForReview) {
            if (steps.length >= maxSteps || totalMinutes >= maxMinutes)
                break;
            const concept = concepts.find((c) => c.id === skill.conceptId);
            const estimatedMinutes = 10; // Reviews are shorter
            if (totalMinutes + estimatedMinutes > maxMinutes)
                continue;
            const daysSinceLastPractice = Math.floor((Date.now() - skill.lastPracticedAt.getTime()) / (1000 * 60 * 60 * 24));
            steps.push({
                conceptId: skill.conceptId,
                conceptName: skill.conceptName || concept?.name || 'Unknown Concept',
                action: 'assess',
                priority: 'low',
                estimatedMinutes,
                reason: `Spaced repetition review (${daysSinceLastPractice} days since last practice)`,
                prerequisites: [],
            });
            totalMinutes += estimatedMinutes;
        }
        return steps;
    }
    async buildOrderedSteps(conceptIds, concepts, prerequisites, profile) {
        // Topological sort based on prerequisites
        const sorted = this.topologicalSort(conceptIds, prerequisites);
        const steps = [];
        for (let i = 0; i < sorted.length; i++) {
            const conceptId = sorted[i];
            const concept = concepts.find((c) => c.id === conceptId);
            const skill = profile.skills.find((s) => s.conceptId === conceptId);
            const conceptPrereqs = prerequisites
                .filter((p) => p.conceptId === conceptId)
                .map((p) => p.requiresConceptId);
            let action = 'learn';
            let priority = 'medium';
            if (skill) {
                if (skill.masteryLevel < 40) {
                    action = 'review';
                    priority = 'high';
                }
                else if (skill.masteryLevel < 80) {
                    action = 'practice';
                    priority = 'medium';
                }
                else {
                    action = 'assess';
                    priority = 'low';
                }
            }
            steps.push({
                order: i + 1,
                conceptId,
                conceptName: concept?.name || 'Unknown Concept',
                action,
                priority,
                estimatedMinutes: concept?.estimatedMinutes ?? 20,
                reason: skill
                    ? `Continue from ${skill.masteryLevel}% mastery`
                    : 'New concept to learn',
                prerequisites: conceptPrereqs,
            });
        }
        return steps;
    }
    // ============================================================================
    // PRIVATE METHODS - UTILITIES
    // ============================================================================
    async findAllPrerequisites(conceptId, prerequisites, visited) {
        const result = new Set();
        visited.add(conceptId);
        const directPrereqs = prerequisites
            .filter((p) => p.conceptId === conceptId)
            .map((p) => p.requiresConceptId);
        for (const prereqId of directPrereqs) {
            if (!visited.has(prereqId)) {
                result.add(prereqId);
                const transitive = await this.findAllPrerequisites(prereqId, prerequisites, visited);
                for (const id of transitive) {
                    result.add(id);
                }
            }
        }
        return result;
    }
    topologicalSort(conceptIds, prerequisites) {
        const graph = new Map();
        const inDegree = new Map();
        // Initialize
        for (const id of conceptIds) {
            graph.set(id, []);
            inDegree.set(id, 0);
        }
        // Build graph
        for (const prereq of prerequisites) {
            if (conceptIds.includes(prereq.conceptId) && conceptIds.includes(prereq.requiresConceptId)) {
                const neighbors = graph.get(prereq.requiresConceptId) ?? [];
                neighbors.push(prereq.conceptId);
                graph.set(prereq.requiresConceptId, neighbors);
                inDegree.set(prereq.conceptId, (inDegree.get(prereq.conceptId) ?? 0) + 1);
            }
        }
        // Kahn's algorithm
        const queue = [];
        const result = [];
        for (const [id, degree] of inDegree) {
            if (degree === 0) {
                queue.push(id);
            }
        }
        while (queue.length > 0) {
            const current = queue.shift();
            result.push(current);
            for (const neighbor of graph.get(current) ?? []) {
                const newDegree = (inDegree.get(neighbor) ?? 0) - 1;
                inDegree.set(neighbor, newDegree);
                if (newDegree === 0) {
                    queue.push(neighbor);
                }
            }
        }
        // Add any remaining (in case of cycles)
        for (const id of conceptIds) {
            if (!result.includes(id)) {
                result.push(id);
            }
        }
        return result;
    }
    calculatePathDifficulty(steps, concepts) {
        if (steps.length === 0)
            return 'beginner';
        const difficulties = steps.map((step) => {
            const concept = concepts.find((c) => c.id === step.conceptId);
            return concept?.difficulty ?? 'intermediate';
        });
        const difficultyWeights = {
            beginner: 1,
            intermediate: 2,
            advanced: 3,
            expert: 4,
        };
        const avgWeight = difficulties.reduce((sum, d) => sum + difficultyWeights[d], 0) / difficulties.length;
        if (avgWeight <= 1.5)
            return 'beginner';
        if (avgWeight <= 2.5)
            return 'intermediate';
        if (avgWeight <= 3.5)
            return 'advanced';
        return 'expert';
    }
    calculateConfidence(profile, stepCount, courseGraph) {
        let confidence = 0.5;
        // More user data = higher confidence
        if (profile.skills.length > 10)
            confidence += 0.2;
        else if (profile.skills.length > 5)
            confidence += 0.1;
        // Good coverage of concepts
        if (courseGraph && courseGraph.concepts.length > 0) {
            const coverage = profile.skills.length / courseGraph.concepts.length;
            confidence += coverage * 0.2;
        }
        // Generated meaningful recommendations
        if (stepCount >= 3)
            confidence += 0.1;
        return Math.min(confidence, 1.0);
    }
    generatePathReason(steps, profile) {
        const parts = [];
        const reviewSteps = steps.filter((s) => s.action === 'review').length;
        const learnSteps = steps.filter((s) => s.action === 'learn').length;
        const practiceSteps = steps.filter((s) => s.action === 'practice').length;
        const assessSteps = steps.filter((s) => s.action === 'assess').length;
        if (reviewSteps > 0) {
            parts.push(`${reviewSteps} to review`);
        }
        if (learnSteps > 0) {
            parts.push(`${learnSteps} to learn`);
        }
        if (practiceSteps > 0) {
            parts.push(`${practiceSteps} to practice`);
        }
        if (assessSteps > 0) {
            parts.push(`${assessSteps} to assess`);
        }
        if (profile.strugglingConcepts.length > 0) {
            parts.push('focusing on areas needing improvement');
        }
        return parts.length > 0
            ? `Personalized path: ${parts.join(', ')}.`
            : 'Continue your learning journey.';
    }
    getConceptName(conceptId, concepts) {
        const concept = concepts.find((c) => c.id === conceptId);
        return concept?.name ?? 'Unknown Concept';
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
export function createPathRecommender(config) {
    return new LearningPathRecommender(config);
}
//# sourceMappingURL=path-recommender.js.map