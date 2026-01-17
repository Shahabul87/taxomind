/**
 * @sam-ai/agentic - Memory System Types
 * Type definitions for long-term memory and retrieval
 */
import { z } from 'zod';
/**
 * Types of content that can be embedded
 */
export const EmbeddingSourceType = {
    COURSE_CONTENT: 'course_content',
    CHAPTER_CONTENT: 'chapter_content',
    SECTION_CONTENT: 'section_content',
    USER_NOTE: 'user_note',
    CONVERSATION: 'conversation',
    QUESTION: 'question',
    ANSWER: 'answer',
    SUMMARY: 'summary',
    ARTIFACT: 'artifact',
    EXTERNAL_RESOURCE: 'external_resource',
};
/**
 * Types of entities in the graph
 */
export const EntityType = {
    CONCEPT: 'concept',
    TOPIC: 'topic',
    SKILL: 'skill',
    COURSE: 'course',
    CHAPTER: 'chapter',
    SECTION: 'section',
    USER: 'user',
    QUESTION: 'question',
    RESOURCE: 'resource',
    PREREQUISITE: 'prerequisite',
    LEARNING_OBJECTIVE: 'learning_objective',
};
/**
 * Types of relationships
 */
export const RelationshipType = {
    PREREQUISITE_OF: 'prerequisite_of',
    PART_OF: 'part_of',
    RELATED_TO: 'related_to',
    TEACHES: 'teaches',
    REQUIRES: 'requires',
    FOLLOWS: 'follows',
    SIMILAR_TO: 'similar_to',
    MASTERED_BY: 'mastered_by',
    STRUGGLED_WITH: 'struggled_with',
    COMPLETED: 'completed',
    REFERENCES: 'references',
};
/**
 * Emotional state tracking
 */
export const EmotionalState = {
    CONFIDENT: 'confident',
    CURIOUS: 'curious',
    FRUSTRATED: 'frustrated',
    ENGAGED: 'engaged',
    BORED: 'bored',
    OVERWHELMED: 'overwhelmed',
    NEUTRAL: 'neutral',
};
/**
 * Types of context actions
 */
export const ContextAction = {
    SESSION_START: 'session_start',
    SESSION_END: 'session_end',
    TOPIC_CHANGE: 'topic_change',
    GOAL_SET: 'goal_set',
    GOAL_COMPLETED: 'goal_completed',
    CONCEPT_LEARNED: 'concept_learned',
    QUESTION_ASKED: 'question_asked',
    ARTIFACT_CREATED: 'artifact_created',
    PREFERENCE_UPDATED: 'preference_updated',
    INSIGHT_GENERATED: 'insight_generated',
};
/**
 * Learning style
 */
export const LearningStyle = {
    VISUAL: 'visual',
    AUDITORY: 'auditory',
    READING_WRITING: 'reading_writing',
    KINESTHETIC: 'kinesthetic',
    MIXED: 'mixed',
};
/**
 * Content types
 */
export const ContentType = {
    TEXT: 'text',
    VIDEO: 'video',
    INTERACTIVE: 'interactive',
    QUIZ: 'quiz',
    EXERCISE: 'exercise',
    DISCUSSION: 'discussion',
    DIAGRAM: 'diagram',
    CODE: 'code',
};
/**
 * Types of memories
 */
export const MemoryType = {
    FACTUAL: 'factual',
    PROCEDURAL: 'procedural',
    EPISODIC: 'episodic',
    SEMANTIC: 'semantic',
    CONTEXTUAL: 'contextual',
};
/**
 * Retrieval strategies used
 */
export const RetrievalStrategy = {
    VECTOR_SEARCH: 'vector_search',
    GRAPH_TRAVERSAL: 'graph_traversal',
    KEYWORD_MATCH: 'keyword_match',
    RECENCY_BOOST: 'recency_boost',
    USER_CONTEXT: 'user_context',
    HYBRID: 'hybrid',
};
/**
 * Types of journey events
 */
export const JourneyEventType = {
    STARTED_COURSE: 'started_course',
    COMPLETED_CHAPTER: 'completed_chapter',
    COMPLETED_SECTION: 'completed_section',
    PASSED_QUIZ: 'passed_quiz',
    FAILED_QUIZ: 'failed_quiz',
    EARNED_BADGE: 'earned_badge',
    REACHED_MILESTONE: 'reached_milestone',
    MASTERED_CONCEPT: 'mastered_concept',
    ASKED_QUESTION: 'asked_question',
    RECEIVED_HELP: 'received_help',
    CREATED_ARTIFACT: 'created_artifact',
    REVIEWED_CONTENT: 'reviewed_content',
    STREAK_CONTINUED: 'streak_continued',
    STREAK_BROKEN: 'streak_broken',
    GOAL_ACHIEVED: 'goal_achieved',
    LEVEL_UP: 'level_up',
};
/**
 * Types of milestones
 */
export const MilestoneType = {
    COURSE_COMPLETION: 'course_completion',
    CHAPTER_MASTERY: 'chapter_mastery',
    SKILL_ACQUISITION: 'skill_acquisition',
    STREAK: 'streak',
    ENGAGEMENT: 'engagement',
    HELPING_OTHERS: 'helping_others',
    EXPLORATION: 'exploration',
    CONSISTENCY: 'consistency',
};
/**
 * Learning phase
 */
export const LearningPhase = {
    ONBOARDING: 'onboarding',
    EXPLORATION: 'exploration',
    BUILDING_FOUNDATION: 'building_foundation',
    DEEPENING: 'deepening',
    MASTERY: 'mastery',
    MAINTENANCE: 'maintenance',
};
// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================
export const VectorSearchOptionsSchema = z.object({
    topK: z.number().min(1).max(100),
    minScore: z.number().min(0).max(1).optional(),
    maxDistance: z.number().min(0).optional(),
    filter: z
        .object({
        sourceTypes: z.array(z.string()).optional(),
        userIds: z.array(z.string()).optional(),
        courseIds: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        dateRange: z
            .object({
            start: z.date().optional(),
            end: z.date().optional(),
        })
            .optional(),
    })
        .optional(),
    includeMetadata: z.boolean().optional(),
});
export const GraphQueryOptionsSchema = z.object({
    maxDepth: z.number().min(1).max(10).optional(),
    relationshipTypes: z.array(z.string()).optional(),
    entityTypes: z.array(z.string()).optional(),
    minWeight: z.number().min(0).max(1).optional(),
    limit: z.number().min(1).max(1000).optional(),
    direction: z.enum(['outgoing', 'incoming', 'both']).optional(),
});
export const RetrievalQuerySchema = z.object({
    query: z.string().min(1),
    userId: z.string().optional(),
    courseId: z.string().optional(),
    memoryTypes: z.array(z.string()).optional(),
    sourceTypes: z.array(z.string()).optional(),
    timeRange: z
        .object({
        start: z.date().optional(),
        end: z.date().optional(),
    })
        .optional(),
    limit: z.number().min(1).max(100).optional(),
    minRelevance: z.number().min(0).max(1).optional(),
    includeRelated: z.boolean().optional(),
    hybridSearch: z.boolean().optional(),
});
//# sourceMappingURL=types.js.map