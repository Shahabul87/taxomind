/**
 * Journey Timeline Service
 *
 * Provides a singleton JourneyTimelineManager for tracking user learning journeys.
 * Wires timeline events to goal completions, plan progress, and learning milestones.
 */

import {
  JourneyTimelineManager,
  createJourneyTimeline,
  type JourneyTimelineConfig,
  type LearningSummary,
} from '@sam-ai/agentic';
import type { JourneyEvent, JourneyMilestone } from '@sam-ai/agentic';

// JourneyTimelineManager Achievement type (distinct from learning-analytics Achievement)
interface JourneyAchievement {
  id: string;
  badgeId: string;
  title: string;
  description: string;
  achievedAt: Date;
  milestoneId: string;
}
import { logger } from '@/lib/logger';
import { getTaxomindContext } from '@/lib/sam/taxomind-context';

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let journeyTimelineManager: JourneyTimelineManager | null = null;

/**
 * Get or create the JourneyTimelineManager singleton
 */
export function getJourneyTimelineManager(): JourneyTimelineManager {
  if (!journeyTimelineManager) {
    let timelineStore: JourneyTimelineConfig['timelineStore'];
    try {
      timelineStore = getTaxomindContext().stores.journeyTimeline;
    } catch (error) {
      logger.warn('[JourneyTimeline] Prisma store unavailable, using in-memory store', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    journeyTimelineManager = createJourneyTimeline({
      timelineStore,
      logger: {
        debug: (msg, data) => logger.debug(`[JourneyTimeline] ${msg}`, data),
        info: (msg, data) => logger.info(`[JourneyTimeline] ${msg}`, data),
        warn: (msg, data) => logger.warn(`[JourneyTimeline] ${msg}`, data),
        error: (msg, data) => logger.error(`[JourneyTimeline] ${msg}`, data),
      },
      xpPerLevel: 1000,
      streakBonusMultiplier: 1.5,
    });
    logger.info('[JourneyTimeline] Manager initialized');
  }
  return journeyTimelineManager;
}

// ============================================================================
// GOAL EVENTS
// ============================================================================

/**
 * Record when a goal is created
 */
export async function recordGoalCreated(
  userId: string,
  goalId: string,
  goalTitle: string,
  courseId?: string
): Promise<JourneyEvent> {
  const manager = getJourneyTimelineManager();
  return manager.recordEvent(
    userId,
    'goal_achieved', // Using goal_achieved type for creation tracking
    {
      eventSubtype: 'goal_created',
      goalId,
      goalTitle,
    },
    {
      courseId,
      impact: { xpGained: 50, emotionalImpact: 'engaged' },
      relatedEntities: [goalId],
    }
  );
}

/**
 * Record when a goal is completed
 */
export async function recordGoalCompleted(
  userId: string,
  goalId: string,
  goalTitle: string,
  courseId?: string
): Promise<JourneyEvent> {
  const manager = getJourneyTimelineManager();
  return manager.recordGoalAchieved(userId, goalId, goalTitle, courseId);
}

/**
 * Record when goal progress is updated
 */
export async function recordGoalProgressUpdated(
  userId: string,
  goalId: string,
  progress: number,
  courseId?: string
): Promise<JourneyEvent> {
  const manager = getJourneyTimelineManager();
  return manager.recordEvent(
    userId,
    'reviewed_content', // Closest match for progress update
    {
      eventSubtype: 'goal_progress_updated',
      goalId,
      progress,
    },
    {
      courseId,
      impact: { xpGained: 10, progressDelta: progress },
      relatedEntities: [goalId],
    }
  );
}

// ============================================================================
// PLAN EVENTS
// ============================================================================

/**
 * Record when an execution plan is created
 */
export async function recordPlanCreated(
  userId: string,
  planId: string,
  goalId: string,
  courseId?: string
): Promise<JourneyEvent> {
  const manager = getJourneyTimelineManager();
  return manager.recordEvent(
    userId,
    'created_artifact',
    {
      eventSubtype: 'plan_created',
      planId,
      goalId,
    },
    {
      courseId,
      impact: { xpGained: 75 },
      relatedEntities: [planId, goalId],
    }
  );
}

/**
 * Record when a plan is started/activated
 */
export async function recordPlanStarted(
  userId: string,
  planId: string,
  goalId: string,
  courseId?: string
): Promise<JourneyEvent> {
  const manager = getJourneyTimelineManager();
  return manager.recordEvent(
    userId,
    'started_course', // Closest match for starting learning
    {
      eventSubtype: 'plan_started',
      planId,
      goalId,
    },
    {
      courseId,
      impact: { xpGained: 100, emotionalImpact: 'engaged' },
      relatedEntities: [planId, goalId],
    }
  );
}

/**
 * Record when a plan step is completed
 */
export async function recordPlanStepCompleted(
  userId: string,
  planId: string,
  stepId: string,
  stepTitle: string,
  stepProgress: number,
  courseId?: string
): Promise<JourneyEvent> {
  const manager = getJourneyTimelineManager();
  return manager.recordEvent(
    userId,
    'completed_section', // Plan steps are similar to sections
    {
      eventSubtype: 'plan_step_completed',
      planId,
      stepId,
      stepTitle,
      stepProgress,
    },
    {
      courseId,
      impact: { xpGained: 100, progressDelta: stepProgress, emotionalImpact: 'confident' },
      relatedEntities: [planId, stepId],
    }
  );
}

/**
 * Record when a plan is completed
 */
export async function recordPlanCompleted(
  userId: string,
  planId: string,
  goalId: string,
  courseId?: string
): Promise<JourneyEvent> {
  const manager = getJourneyTimelineManager();
  return manager.recordEvent(
    userId,
    'reached_milestone',
    {
      eventSubtype: 'plan_completed',
      planId,
      goalId,
    },
    {
      courseId,
      impact: { xpGained: 500, emotionalImpact: 'confident' },
      relatedEntities: [planId, goalId],
    }
  );
}

// ============================================================================
// LEARNING EVENTS
// ============================================================================

/**
 * Record a learning session (daily activity)
 */
export async function recordLearningSession(
  userId: string,
  sessionDurationMinutes: number,
  courseId?: string
): Promise<JourneyEvent> {
  const manager = getJourneyTimelineManager();
  const xp = Math.min(100, sessionDurationMinutes * 2); // 2 XP per minute, max 100

  return manager.recordEvent(
    userId,
    'reviewed_content',
    {
      eventSubtype: 'learning_session',
      durationMinutes: sessionDurationMinutes,
    },
    {
      courseId,
      impact: { xpGained: xp, emotionalImpact: 'engaged' },
    }
  );
}

/**
 * Record a question asked to SAM
 */
export async function recordQuestionAsked(
  userId: string,
  question: string,
  courseId?: string
): Promise<JourneyEvent> {
  const manager = getJourneyTimelineManager();
  return manager.recordEvent(
    userId,
    'asked_question',
    {
      questionLength: question.length,
      questionPreview: question.substring(0, 100),
    },
    {
      courseId,
      impact: { xpGained: 25 },
    }
  );
}

/**
 * Record when SAM provides help
 */
export async function recordHelpReceived(
  userId: string,
  helpType: string,
  courseId?: string
): Promise<JourneyEvent> {
  const manager = getJourneyTimelineManager();
  return manager.recordEvent(
    userId,
    'received_help',
    { helpType },
    {
      courseId,
      impact: { xpGained: 15 },
    }
  );
}

// ============================================================================
// STREAK MANAGEMENT
// ============================================================================

/**
 * Update user streak (call daily when user is active)
 */
export async function updateStreak(
  userId: string,
  courseId?: string
): Promise<{ streakContinued: boolean; currentStreak: number }> {
  const manager = getJourneyTimelineManager();
  const timeline = await manager.getOrCreateTimeline(userId, courseId);
  const stats = timeline.statistics;

  // Simple streak logic: if there's activity today, continue streak
  // In production, this should check lastActivityDate
  const currentStreak = stats.currentStreak + 1;

  await manager.recordStreakContinued(userId, currentStreak, courseId);

  return { streakContinued: true, currentStreak };
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get user&apos;s learning summary
 */
export async function getLearningSummary(
  userId: string,
  courseId?: string
): Promise<LearningSummary> {
  const manager = getJourneyTimelineManager();
  return manager.getLearningSummary(userId, courseId);
}

/**
 * Get user&apos;s achievements
 */
export async function getAchievements(
  userId: string,
  courseId?: string
): Promise<JourneyAchievement[]> {
  const manager = getJourneyTimelineManager();
  return manager.getAchievements(userId, courseId);
}

/**
 * Get user&apos;s milestones
 */
export async function getMilestones(
  userId: string,
  courseId?: string
): Promise<JourneyMilestone[]> {
  const manager = getJourneyTimelineManager();
  return manager.getMilestones(userId, courseId);
}

/**
 * Get recent journey events
 */
export async function getRecentEvents(
  userId: string,
  limit: number = 20,
  courseId?: string
): Promise<JourneyEvent[]> {
  const manager = getJourneyTimelineManager();
  return manager.getRecentEvents(userId, limit, courseId);
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  JourneyEvent,
  JourneyMilestone,
  LearningSummary,
  JourneyAchievement,
};
