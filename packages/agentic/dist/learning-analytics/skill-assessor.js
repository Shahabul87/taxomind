/**
 * @sam-ai/agentic - Skill Assessor
 * Assesses and tracks skill development and mastery
 */
import { v4 as uuidv4 } from 'uuid';
import { MasteryLevel, AssessmentSource, SkillAssessmentInputSchema, } from './types';
// ============================================================================
// IN-MEMORY STORE
// ============================================================================
/**
 * In-memory implementation of SkillAssessmentStore
 */
export class InMemorySkillAssessmentStore {
    assessments = new Map();
    userSkillIndex = new Map(); // `userId:skillId` -> assessmentId
    getKey(userId, skillId) {
        return `${userId}:${skillId}`;
    }
    async create(assessment) {
        const newAssessment = {
            ...assessment,
            id: uuidv4(),
        };
        // Store the previous assessment info before updating
        const previousKey = this.getKey(assessment.userId, assessment.skillId);
        const previousId = this.userSkillIndex.get(previousKey);
        if (previousId) {
            const previous = this.assessments.get(previousId);
            if (previous) {
                newAssessment.previousLevel = previous.level;
                newAssessment.previousScore = previous.score;
            }
        }
        this.assessments.set(newAssessment.id, newAssessment);
        this.userSkillIndex.set(previousKey, newAssessment.id);
        return newAssessment;
    }
    async get(id) {
        return this.assessments.get(id) ?? null;
    }
    async getByUserAndSkill(userId, skillId) {
        const key = this.getKey(userId, skillId);
        const id = this.userSkillIndex.get(key);
        if (!id)
            return null;
        return this.assessments.get(id) ?? null;
    }
    async getByUser(userId) {
        const userAssessments = [];
        const seen = new Set();
        for (const [key, id] of this.userSkillIndex.entries()) {
            if (key.startsWith(`${userId}:`)) {
                const assessment = this.assessments.get(id);
                if (assessment && !seen.has(assessment.skillId)) {
                    userAssessments.push(assessment);
                    seen.add(assessment.skillId);
                }
            }
        }
        return userAssessments.sort((a, b) => b.assessedAt.getTime() - a.assessedAt.getTime());
    }
    async getHistory(userId, skillId, limit) {
        const history = Array.from(this.assessments.values())
            .filter((a) => a.userId === userId && a.skillId === skillId)
            .sort((a, b) => a.assessedAt.getTime() - b.assessedAt.getTime()); // Ascending order (oldest first)
        return limit ? history.slice(0, limit) : history;
    }
}
// ============================================================================
// DEFAULT LOGGER
// ============================================================================
const defaultLogger = {
    debug: () => { },
    info: () => { },
    warn: () => { },
    error: () => { },
};
// ============================================================================
// MASTERY LEVEL THRESHOLDS
// ============================================================================
const DEFAULT_MASTERY_THRESHOLDS = {
    [MasteryLevel.NOVICE]: 0,
    [MasteryLevel.BEGINNER]: 20,
    [MasteryLevel.INTERMEDIATE]: 40,
    [MasteryLevel.PROFICIENT]: 70,
    [MasteryLevel.EXPERT]: 90,
};
/**
 * Skill Assessor
 * Tracks and assesses skill development and mastery
 */
export class SkillAssessor {
    store;
    logger;
    skills = new Map();
    masteryThresholds;
    decayRatePerDay;
    assessmentValidityDays;
    constructor(config = {}) {
        this.store = config.store ?? new InMemorySkillAssessmentStore();
        this.logger = config.logger ?? defaultLogger;
        this.masteryThresholds = { ...DEFAULT_MASTERY_THRESHOLDS, ...config.masteryThresholds };
        this.decayRatePerDay = config.decayRatePerDay ?? 0.5;
        this.assessmentValidityDays = config.assessmentValidityDays ?? 30;
        // Register skills
        if (config.skills) {
            for (const skill of config.skills) {
                this.skills.set(skill.id, skill);
            }
        }
    }
    /**
     * Register a skill
     */
    registerSkill(skill) {
        this.skills.set(skill.id, skill);
        this.logger.debug('Skill registered', { skillId: skill.id, name: skill.name });
    }
    /**
     * Get a registered skill
     */
    getSkill(skillId) {
        return this.skills.get(skillId);
    }
    /**
     * List all registered skills, optionally filtered by category
     */
    listSkills(category) {
        const skills = Array.from(this.skills.values());
        if (category) {
            return skills.filter((s) => s.category === category);
        }
        return skills;
    }
    /**
     * Assess a skill
     */
    async assessSkill(input) {
        const validated = SkillAssessmentInputSchema.parse(input);
        this.logger.info('Assessing skill', {
            userId: validated.userId,
            skillId: validated.skillId,
            score: validated.score,
        });
        // Get skill name from registered skill if not provided
        let skillName = validated.skillName;
        if (!skillName) {
            const skill = this.skills.get(validated.skillId);
            skillName = skill?.name ?? validated.skillId;
        }
        const level = this.scoreToLevel(validated.score);
        const confidence = this.calculateConfidence(validated.source, validated.evidence);
        const assessment = await this.store.create({
            userId: validated.userId,
            skillId: validated.skillId,
            skillName,
            level,
            score: validated.score,
            confidence,
            source: validated.source,
            evidence: validated.evidence ?? [],
            assessedAt: new Date(),
            validUntil: new Date(Date.now() + this.assessmentValidityDays * 24 * 60 * 60 * 1000),
        });
        this.logger.info('Skill assessed', {
            userId: validated.userId,
            skillId: validated.skillId,
            level,
            score: validated.score,
        });
        return assessment;
    }
    /**
     * Get current assessment for a skill
     */
    async getAssessment(userId, skillId) {
        return this.store.getByUserAndSkill(userId, skillId);
    }
    /**
     * Get all assessments for a user
     */
    async getUserAssessments(userId) {
        return this.store.getByUser(userId);
    }
    /**
     * Get assessment history for a skill
     */
    async getAssessmentHistory(userId, skillId, limit) {
        return this.store.getHistory(userId, skillId, limit);
    }
    /**
     * Generate skill map for a user
     */
    async generateSkillMap(userId) {
        this.logger.info('Generating skill map', { userId });
        const assessments = await this.store.getByUser(userId);
        const assessmentMap = new Map(assessments.map((a) => [a.skillId, a]));
        const nodes = [];
        let overallScore = 0;
        let assessedCount = 0;
        for (const skill of this.skills.values()) {
            const assessment = assessmentMap.get(skill.id);
            // Check if skill is unlocked (all prerequisites met)
            const isUnlocked = skill.prerequisites.every((prereqId) => {
                const prereqAssessment = assessmentMap.get(prereqId);
                return prereqAssessment && prereqAssessment.score >= this.masteryThresholds[MasteryLevel.BEGINNER];
            });
            const node = {
                skillId: skill.id,
                skillName: skill.name,
                category: skill.category,
                level: assessment?.level ?? MasteryLevel.NOVICE,
                score: assessment?.score ?? 0,
                isUnlocked,
                dependencies: skill.prerequisites,
                dependents: this.findDependents(skill.id),
                lastAssessed: assessment?.assessedAt,
            };
            nodes.push(node);
            if (assessment) {
                overallScore += assessment.score;
                assessedCount++;
            }
        }
        const avgScore = assessedCount > 0 ? overallScore / assessedCount : 0;
        const overallLevel = this.scoreToLevel(avgScore);
        // Find strongest and weakest skills
        const sortedByScore = [...nodes]
            .filter((n) => n.score > 0)
            .sort((a, b) => b.score - a.score);
        const strongestSkills = sortedByScore.slice(0, 3).map((n) => n.skillId);
        const weakestSkills = sortedByScore
            .slice(-3)
            .reverse()
            .filter((n) => n.score > 0)
            .map((n) => n.skillId);
        // Suggest focus areas
        const suggestedFocus = this.suggestFocusAreas(nodes, assessments);
        const skillMap = {
            userId,
            skills: nodes,
            lastUpdated: new Date(),
            overallLevel,
            strongestSkills,
            weakestSkills,
            suggestedFocus,
        };
        this.logger.info('Skill map generated', {
            userId,
            skillCount: nodes.length,
            overallLevel,
        });
        return skillMap;
    }
    /**
     * Predict skill decay
     */
    async predictDecay(userId) {
        this.logger.info('Predicting skill decay', { userId });
        const assessments = await this.store.getByUser(userId);
        const decayPredictions = [];
        const now = new Date();
        for (const assessment of assessments) {
            const daysSinceAssessment = Math.floor((now.getTime() - assessment.assessedAt.getTime()) / (24 * 60 * 60 * 1000));
            if (daysSinceAssessment < 1)
                continue;
            const decayAmount = daysSinceAssessment * this.decayRatePerDay;
            const predictedScore = Math.max(0, assessment.score - decayAmount);
            const decayRate = this.calculateDecayRate(assessment);
            let riskLevel = 'low';
            if (decayAmount > 20)
                riskLevel = 'high';
            else if (decayAmount > 10)
                riskLevel = 'medium';
            // Calculate suggested review date
            const daysUntilSignificantDecay = Math.ceil((assessment.score * 0.2) / this.decayRatePerDay);
            const suggestedReviewDate = new Date(assessment.assessedAt.getTime() + daysUntilSignificantDecay * 24 * 60 * 60 * 1000);
            decayPredictions.push({
                skillId: assessment.skillId,
                skillName: assessment.skillName,
                userId,
                currentScore: assessment.score,
                predictedScore,
                decayRate,
                daysSinceLastPractice: daysSinceAssessment,
                riskLevel,
                suggestedReviewDate,
            });
        }
        return decayPredictions.sort((a, b) => b.decayRate - a.decayRate);
    }
    /**
     * Compare user skills with benchmarks
     */
    async compareSkills(userId, benchmarkData) {
        this.logger.info('Comparing skills', { userId });
        const assessments = await this.store.getByUser(userId);
        const comparisons = [];
        for (const assessment of assessments) {
            // Use provided benchmark data or defaults
            const averageScore = benchmarkData?.get(assessment.skillId) ?? 50;
            const topPerformersScore = averageScore * 1.5; // Assume top performers are 50% above average
            // Calculate percentile (simplified)
            let percentile = 50;
            if (assessment.score > averageScore) {
                percentile = 50 + ((assessment.score - averageScore) / (100 - averageScore)) * 50;
            }
            else if (assessment.score < averageScore) {
                percentile = (assessment.score / averageScore) * 50;
            }
            comparisons.push({
                skillId: assessment.skillId,
                skillName: assessment.skillName,
                userScore: assessment.score,
                userLevel: assessment.level,
                averageScore,
                percentile: Math.round(percentile),
                topPerformersScore: Math.min(100, topPerformersScore),
                gap: averageScore - assessment.score,
            });
        }
        return comparisons.sort((a, b) => b.gap - a.gap);
    }
    /**
     * Get skill prerequisites status
     */
    async getPrerequisiteStatus(userId, skillId) {
        const skill = this.skills.get(skillId);
        if (!skill) {
            return { met: [], unmet: [], partiallyMet: [] };
        }
        const met = [];
        const unmet = [];
        const partiallyMet = [];
        for (const prereqId of skill.prerequisites) {
            const assessment = await this.store.getByUserAndSkill(userId, prereqId);
            if (!assessment) {
                unmet.push(prereqId);
            }
            else if (assessment.score >= this.masteryThresholds[MasteryLevel.INTERMEDIATE]) {
                met.push(prereqId);
            }
            else if (assessment.score >= this.masteryThresholds[MasteryLevel.BEGINNER]) {
                partiallyMet.push(prereqId);
            }
            else {
                unmet.push(prereqId);
            }
        }
        return { met, unmet, partiallyMet };
    }
    /**
     * Calculate skill improvement rate
     */
    async getImprovementRate(userId, skillId) {
        const history = await this.store.getHistory(userId, skillId, 5);
        if (history.length < 2)
            return 0;
        // Calculate average improvement per assessment
        let totalImprovement = 0;
        for (let i = 0; i < history.length - 1; i++) {
            totalImprovement += history[i].score - history[i + 1].score;
        }
        return totalImprovement / (history.length - 1);
    }
    /**
     * Get skills by mastery level
     */
    async getSkillsByLevel(userId, level) {
        const assessments = await this.store.getByUser(userId);
        return assessments.filter((a) => a.level === level);
    }
    /**
     * Estimate time to reach target level
     */
    async estimateTimeToLevel(userId, skillId, targetLevel) {
        const assessment = await this.store.getByUserAndSkill(userId, skillId);
        if (!assessment)
            return null;
        const targetScore = this.masteryThresholds[targetLevel];
        if (assessment.score >= targetScore)
            return 0;
        const improvementRate = await this.getImprovementRate(userId, skillId);
        if (improvementRate <= 0)
            return null;
        const scoreGap = targetScore - assessment.score;
        const estimatedSessions = Math.ceil(scoreGap / improvementRate);
        // Assume 1 session per day
        return estimatedSessions;
    }
    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================
    scoreToLevel(score) {
        if (score >= this.masteryThresholds[MasteryLevel.EXPERT])
            return MasteryLevel.EXPERT;
        if (score >= this.masteryThresholds[MasteryLevel.PROFICIENT])
            return MasteryLevel.PROFICIENT;
        if (score >= this.masteryThresholds[MasteryLevel.INTERMEDIATE])
            return MasteryLevel.INTERMEDIATE;
        if (score >= this.masteryThresholds[MasteryLevel.BEGINNER])
            return MasteryLevel.BEGINNER;
        return MasteryLevel.NOVICE;
    }
    calculateConfidence(source, evidence) {
        // Base confidence from source
        const sourceConfidence = {
            [AssessmentSource.QUIZ]: 0.7,
            [AssessmentSource.EXERCISE]: 0.65,
            [AssessmentSource.PROJECT]: 0.85,
            [AssessmentSource.PEER_REVIEW]: 0.75,
            [AssessmentSource.SELF_ASSESSMENT]: 0.5,
            [AssessmentSource.AI_EVALUATION]: 0.8,
        };
        let confidence = sourceConfidence[source] ?? 0.6;
        // Boost confidence based on evidence
        if (evidence && evidence.length > 0) {
            const evidenceWeight = evidence.reduce((sum, e) => sum + e.weight, 0) / evidence.length;
            confidence = confidence * 0.7 + evidenceWeight * 0.3;
        }
        return Math.min(1, confidence);
    }
    calculateDecayRate(assessment) {
        // Decay rate varies by mastery level - higher levels decay slower
        const levelMultiplier = {
            [MasteryLevel.NOVICE]: 1.5,
            [MasteryLevel.BEGINNER]: 1.2,
            [MasteryLevel.INTERMEDIATE]: 1.0,
            [MasteryLevel.PROFICIENT]: 0.8,
            [MasteryLevel.EXPERT]: 0.5,
        };
        return this.decayRatePerDay * (levelMultiplier[assessment.level] ?? 1);
    }
    findDependents(skillId) {
        const dependents = [];
        for (const skill of this.skills.values()) {
            if (skill.prerequisites.includes(skillId)) {
                dependents.push(skill.id);
            }
        }
        return dependents;
    }
    suggestFocusAreas(nodes, _assessments) {
        const suggestions = [];
        for (const node of nodes) {
            if (!node.isUnlocked)
                continue;
            let priority = 0;
            // Prioritize skills that are unlocked but not yet started
            if (node.score === 0) {
                priority += 10;
            }
            // Prioritize skills at intermediate level (room for growth)
            if (node.level === MasteryLevel.INTERMEDIATE) {
                priority += 15;
            }
            // Prioritize skills with many dependents (unlock more skills)
            priority += node.dependents.length * 5;
            // Prioritize recently practiced skills (maintain momentum)
            if (node.lastAssessed) {
                const daysSince = Math.floor((Date.now() - node.lastAssessed.getTime()) / (24 * 60 * 60 * 1000));
                if (daysSince < 7)
                    priority += 5;
            }
            if (priority > 0) {
                suggestions.push({ skillId: node.skillId, priority });
            }
        }
        return suggestions
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 5)
            .map((s) => s.skillId);
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
/**
 * Create a new SkillAssessor instance
 */
export function createSkillAssessor(config) {
    return new SkillAssessor(config);
}
//# sourceMappingURL=skill-assessor.js.map