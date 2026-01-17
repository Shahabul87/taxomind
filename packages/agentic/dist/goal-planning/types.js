/**
 * @sam-ai/agentic - Goal Planning Types
 * Core types for autonomous goal tracking, task decomposition, and planning
 */
import { z } from 'zod';
// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================
export const GoalPriority = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
};
export const GoalStatus = {
    DRAFT: 'draft',
    ACTIVE: 'active',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    ABANDONED: 'abandoned',
};
export const SubGoalType = {
    LEARN: 'learn',
    PRACTICE: 'practice',
    ASSESS: 'assess',
    REVIEW: 'review',
    REFLECT: 'reflect',
    CREATE: 'create',
};
export const PlanStatus = {
    DRAFT: 'draft',
    ACTIVE: 'active',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
};
export const StepStatus = {
    PENDING: 'pending',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed',
    SKIPPED: 'skipped',
    BLOCKED: 'blocked',
};
export const StepType = {
    READ_CONTENT: 'read_content',
    WATCH_VIDEO: 'watch_video',
    COMPLETE_EXERCISE: 'complete_exercise',
    TAKE_QUIZ: 'take_quiz',
    REFLECT: 'reflect',
    PRACTICE_PROBLEM: 'practice_problem',
    SOCRATIC_DIALOGUE: 'socratic_dialogue',
    SPACED_REVIEW: 'spaced_review',
    CREATE_SUMMARY: 'create_summary',
    PEER_DISCUSSION: 'peer_discussion',
    PROJECT_WORK: 'project_work',
    RESEARCH: 'research',
};
export const MasteryLevel = {
    NOVICE: 'novice',
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced',
    EXPERT: 'expert',
};
// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================
export const GoalPrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export const GoalStatusSchema = z.enum(['draft', 'active', 'paused', 'completed', 'abandoned']);
export const SubGoalTypeSchema = z.enum(['learn', 'practice', 'assess', 'review', 'reflect', 'create']);
export const PlanStatusSchema = z.enum(['draft', 'active', 'paused', 'completed', 'failed', 'cancelled']);
export const StepStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'failed', 'skipped', 'blocked']);
export const MasteryLevelSchema = z.enum(['novice', 'beginner', 'intermediate', 'advanced', 'expert']);
export const GoalContextSchema = z.object({
    courseId: z.string().optional(),
    chapterId: z.string().optional(),
    sectionId: z.string().optional(),
    topicIds: z.array(z.string()).optional(),
    skillIds: z.array(z.string()).optional(),
});
export const CreateGoalInputSchema = z.object({
    userId: z.string().min(1),
    title: z.string().min(1).max(500),
    description: z.string().max(2000).optional(),
    targetDate: z.date().optional(),
    priority: GoalPrioritySchema.optional().default('medium'),
    context: GoalContextSchema.partial().optional(),
    currentMastery: MasteryLevelSchema.optional(),
    targetMastery: MasteryLevelSchema.optional(),
    tags: z.array(z.string()).optional(),
});
export const UpdateGoalInputSchema = z.object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(2000).optional(),
    targetDate: z.date().optional(),
    priority: GoalPrioritySchema.optional(),
    status: GoalStatusSchema.optional(),
    context: GoalContextSchema.partial().optional(),
    targetMastery: MasteryLevelSchema.optional(),
    tags: z.array(z.string()).optional(),
});
export const DecompositionOptionsSchema = z.object({
    maxSubGoals: z.number().int().min(1).max(20).optional().default(10),
    minSubGoals: z.number().int().min(1).max(10).optional().default(2),
    includeAssessments: z.boolean().optional().default(true),
    includeReviews: z.boolean().optional().default(true),
    preferredLearningStyle: z.string().optional(),
    availableTimePerDay: z.number().int().min(5).max(480).optional(),
    targetCompletionDate: z.date().optional(),
});
//# sourceMappingURL=types.js.map