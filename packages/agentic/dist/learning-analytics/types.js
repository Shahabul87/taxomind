/**
 * @sam-ai/agentic - Learning Analytics Types
 * Type definitions for learning analytics, skill assessment, and recommendations
 */
import { z } from 'zod';
// ============================================================================
// ENUMS
// ============================================================================
/**
 * Learning progress trend direction
 */
export var TrendDirection;
(function (TrendDirection) {
    TrendDirection["IMPROVING"] = "improving";
    TrendDirection["STABLE"] = "stable";
    TrendDirection["DECLINING"] = "declining";
    TrendDirection["FLUCTUATING"] = "fluctuating";
})(TrendDirection || (TrendDirection = {}));
/**
 * Skill mastery levels
 */
export var MasteryLevel;
(function (MasteryLevel) {
    MasteryLevel["NOVICE"] = "novice";
    MasteryLevel["BEGINNER"] = "beginner";
    MasteryLevel["INTERMEDIATE"] = "intermediate";
    MasteryLevel["PROFICIENT"] = "proficient";
    MasteryLevel["EXPERT"] = "expert";
})(MasteryLevel || (MasteryLevel = {}));
/**
 * Learning style types
 */
export var LearningStyle;
(function (LearningStyle) {
    LearningStyle["VISUAL"] = "visual";
    LearningStyle["AUDITORY"] = "auditory";
    LearningStyle["READING_WRITING"] = "reading_writing";
    LearningStyle["KINESTHETIC"] = "kinesthetic";
})(LearningStyle || (LearningStyle = {}));
/**
 * Content type for recommendations
 */
export var ContentType;
(function (ContentType) {
    ContentType["VIDEO"] = "video";
    ContentType["ARTICLE"] = "article";
    ContentType["EXERCISE"] = "exercise";
    ContentType["QUIZ"] = "quiz";
    ContentType["PROJECT"] = "project";
    ContentType["TUTORIAL"] = "tutorial";
    ContentType["DOCUMENTATION"] = "documentation";
})(ContentType || (ContentType = {}));
/**
 * Recommendation priority
 */
export var RecommendationPriority;
(function (RecommendationPriority) {
    RecommendationPriority["CRITICAL"] = "critical";
    RecommendationPriority["HIGH"] = "high";
    RecommendationPriority["MEDIUM"] = "medium";
    RecommendationPriority["LOW"] = "low";
})(RecommendationPriority || (RecommendationPriority = {}));
/**
 * Recommendation reason types
 */
export var RecommendationReason;
(function (RecommendationReason) {
    RecommendationReason["KNOWLEDGE_GAP"] = "knowledge_gap";
    RecommendationReason["SKILL_DECAY"] = "skill_decay";
    RecommendationReason["PREREQUISITE"] = "prerequisite";
    RecommendationReason["REINFORCEMENT"] = "reinforcement";
    RecommendationReason["EXPLORATION"] = "exploration";
    RecommendationReason["CHALLENGE"] = "challenge";
    RecommendationReason["REVIEW"] = "review";
})(RecommendationReason || (RecommendationReason = {}));
/**
 * Time period for analytics
 */
export var TimePeriod;
(function (TimePeriod) {
    TimePeriod["DAILY"] = "daily";
    TimePeriod["WEEKLY"] = "weekly";
    TimePeriod["MONTHLY"] = "monthly";
    TimePeriod["QUARTERLY"] = "quarterly";
    TimePeriod["ALL_TIME"] = "all_time";
})(TimePeriod || (TimePeriod = {}));
/**
 * Assessment source types
 */
export var AssessmentSource;
(function (AssessmentSource) {
    AssessmentSource["QUIZ"] = "quiz";
    AssessmentSource["EXERCISE"] = "exercise";
    AssessmentSource["PROJECT"] = "project";
    AssessmentSource["PEER_REVIEW"] = "peer_review";
    AssessmentSource["SELF_ASSESSMENT"] = "self_assessment";
    AssessmentSource["AI_EVALUATION"] = "ai_evaluation";
})(AssessmentSource || (AssessmentSource = {}));
// ============================================================================
// ZOD SCHEMAS
// ============================================================================
/**
 * Schema for learning session input
 */
export const LearningSessionInputSchema = z.object({
    userId: z.string().min(1),
    topicId: z.string().min(1),
    startTime: z.date().optional(),
    duration: z.number().min(0).optional(),
    activitiesCompleted: z.number().min(0).optional(),
    questionsAnswered: z.number().min(0).optional(),
    correctAnswers: z.number().min(0).optional(),
    conceptsCovered: z.array(z.string()).optional(),
    focusScore: z.number().min(0).max(1).optional(),
});
/**
 * Schema for skill assessment input
 */
export const SkillAssessmentInputSchema = z.object({
    userId: z.string().min(1),
    skillId: z.string().min(1),
    skillName: z.string().min(1).optional(),
    score: z.number().min(0).max(100),
    maxScore: z.number().min(1).optional().default(100),
    source: z.nativeEnum(AssessmentSource),
    duration: z.number().min(0).optional(),
    questionsAnswered: z.number().min(0).optional(),
    correctAnswers: z.number().min(0).optional(),
    evidence: z
        .array(z.object({
        type: z.string(),
        description: z.string(),
        score: z.number().optional(),
        timestamp: z.date(),
        weight: z.number().min(0).max(1),
    }))
        .optional(),
});
/**
 * Schema for recommendation feedback
 */
export const RecommendationFeedbackSchema = z.object({
    recommendationId: z.string().min(1),
    userId: z.string().min(1),
    isHelpful: z.boolean(),
    rating: z.number().min(1).max(5).optional(),
    comment: z.string().optional(),
    timeSpent: z.number().min(0).optional(),
    completed: z.boolean().optional(),
});
//# sourceMappingURL=types.js.map