/**
 * SAM Agentic Proactive Scheduler
 * Integrates CheckInScheduler with BehaviorMonitor for automatic proactive interventions
 *
 * This service provides:
 * 1. Automatic check-in scheduling based on user behavior
 * 2. Behavior-triggered check-ins (frustration, inactivity, streak risk)
 * 3. Scheduled recurring check-ins (daily, weekly)
 * 4. Milestone and celebration triggers
 */

import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { createPrismaCheckInStore } from '@/lib/sam/stores';
import {
  createCheckInScheduler,
  createBehaviorMonitor,
  CheckInScheduler,
  BehaviorMonitor,
  CheckInType,
  CheckInStatus,
  NotificationChannel,
  TriggerType,
  BehaviorEventType,
  type UserContext,
  type ScheduledCheckIn,
  type TriggeredCheckIn,
  type BehaviorEvent,
  type ChurnPrediction,
  type StrugglePrediction,
  type Intervention,
} from '@sam-ai/agentic';

// ============================================================================
// TYPES
// ============================================================================

export interface ProactiveSchedulerConfig {
  defaultChannel?: NotificationChannel;
  enableDailyReminders?: boolean;
  enableWeeklySummary?: boolean;
  enableStreakProtection?: boolean;
  enableInactivityReengagement?: boolean;
  enableStruggleDetection?: boolean;
  inactivityThresholdDays?: number;
  streakRiskHours?: number;
}

export interface UserActivityContext {
  userId: string;
  lastSessionAt?: Date;
  currentStreak: number;
  streakAtRisk: boolean;
  daysSinceLastSession: number;
  totalSessions: number;
  averageSessionMinutes: number;
  recentPerformance: 'excellent' | 'good' | 'struggling' | 'unknown';
}

export interface ProactiveCheckInResult {
  scheduled: ScheduledCheckIn[];
  triggered: TriggeredCheckIn[];
  interventions: Intervention[];
  predictions: {
    churn?: ChurnPrediction;
    struggle?: StrugglePrediction;
  };
}

// ============================================================================
// PROACTIVE SCHEDULER
// ============================================================================

export class ProactiveScheduler {
  private checkInScheduler: CheckInScheduler;
  private behaviorMonitor: BehaviorMonitor;
  private config: Required<ProactiveSchedulerConfig>;

  constructor(config: ProactiveSchedulerConfig = {}) {
    this.config = {
      defaultChannel: config.defaultChannel ?? NotificationChannel.IN_APP,
      enableDailyReminders: config.enableDailyReminders ?? true,
      enableWeeklySummary: config.enableWeeklySummary ?? true,
      enableStreakProtection: config.enableStreakProtection ?? true,
      enableInactivityReengagement: config.enableInactivityReengagement ?? true,
      enableStruggleDetection: config.enableStruggleDetection ?? true,
      inactivityThresholdDays: config.inactivityThresholdDays ?? 3,
      streakRiskHours: config.streakRiskHours ?? 20,
    };

    // Initialize scheduler with Prisma store
    this.checkInScheduler = createCheckInScheduler({
      store: createPrismaCheckInStore(),
      logger,
      defaultChannel: this.config.defaultChannel,
    });

    // Initialize behavior monitor
    this.behaviorMonitor = createBehaviorMonitor({
      logger,
      frustrationThreshold: 0.7,
      churnPredictionWindow: 14,
    });
  }

  // ============================================================================
  // PROACTIVE CHECK-IN SCHEDULING
  // ============================================================================

  /**
   * Evaluate user and schedule proactive check-ins based on context
   */
  async evaluateAndSchedule(userId: string): Promise<ProactiveCheckInResult> {
    const result: ProactiveCheckInResult = {
      scheduled: [],
      triggered: [],
      interventions: [],
      predictions: {},
    };

    try {
      // Build user context
      const context = await this.buildUserContext(userId);
      const activityContext = await this.buildActivityContext(userId);

      // 1. Evaluate existing check-in triggers
      const triggered = await this.checkInScheduler.evaluateTriggers(userId, context);
      result.triggered = triggered;

      // Execute immediate triggers
      for (const trigger of triggered) {
        if (trigger.urgency === 'immediate') {
          await this.checkInScheduler.executeCheckIn(trigger.checkInId);
        }
      }

      // 2. Schedule proactive check-ins based on behavior
      if (this.config.enableStreakProtection && activityContext.streakAtRisk) {
        const streakCheckIn = await this.scheduleStreakProtection(userId, activityContext);
        if (streakCheckIn) result.scheduled.push(streakCheckIn);
      }

      if (
        this.config.enableInactivityReengagement &&
        activityContext.daysSinceLastSession >= this.config.inactivityThresholdDays
      ) {
        const reengageCheckIn = await this.scheduleInactivityReengagement(
          userId,
          activityContext.daysSinceLastSession
        );
        if (reengageCheckIn) result.scheduled.push(reengageCheckIn);
      }

      // 3. Detect behavior patterns and predict issues
      await this.behaviorMonitor.detectPatterns(userId);

      if (this.config.enableStruggleDetection) {
        const strugglePrediction = await this.behaviorMonitor.predictStruggle(userId);
        result.predictions.struggle = strugglePrediction;

        if (strugglePrediction.struggleProbability > 0.6) {
          const struggleCheckIn = await this.scheduleStruggleIntervention(
            userId,
            strugglePrediction
          );
          if (struggleCheckIn) result.scheduled.push(struggleCheckIn);
        }
      }

      // 4. Predict churn risk
      const churnPrediction = await this.behaviorMonitor.predictChurn(userId);
      result.predictions.churn = churnPrediction;

      if (churnPrediction.riskLevel === 'high' || churnPrediction.riskLevel === 'critical') {
        const createdInterventions: Intervention[] = [];

        for (const intervention of churnPrediction.recommendedInterventions) {
          try {
            const { id: _id, createdAt: _createdAt, ...payload } = intervention;
            const created = await this.behaviorMonitor.createIntervention(userId, {
              ...payload,
              timing: payload.timing ?? { type: 'immediate' },
            });
            createdInterventions.push(created);
          } catch (error) {
            logger.warn('[ProactiveScheduler] Failed to persist churn intervention', {
              userId,
              type: intervention.type,
              error,
            });
          }
        }

        result.interventions = createdInterventions;
      }

      logger.info('[ProactiveScheduler] Evaluation complete', {
        userId,
        scheduled: result.scheduled.length,
        triggered: result.triggered.length,
        interventions: result.interventions.length,
      });

      return result;
    } catch (error) {
      logger.error('[ProactiveScheduler] Evaluation failed', { userId, error });
      return result;
    }
  }

  /**
   * Track a behavior event and trigger immediate checks if needed
   */
  async trackBehaviorEvent(
    event: Omit<BehaviorEvent, 'id' | 'processed' | 'processedAt'>
  ): Promise<{
    event: BehaviorEvent;
    immediateActions: Intervention[];
  }> {
    // Track the event
    const trackedEvent = await this.behaviorMonitor.trackEvent(event);

    // Check for immediate interventions
    const immediateActions: Intervention[] = [];

    // Check for frustration signals
    if (event.emotionalSignals?.some((s) => s.type === 'frustration' && s.intensity > 0.7)) {
      const intervention = await this.behaviorMonitor.createIntervention(event.userId, {
        type: 'break_suggestion' as const,
        priority: 'high',
        message: 'It looks like you might be feeling frustrated. Would you like to take a short break?',
        suggestedActions: [
          {
            id: `action-${Date.now()}`,
            title: 'Take a Break',
            description: 'A 5-minute break can help refresh your mind',
            type: 'take_break' as const,
            priority: 'high',
          },
          {
            id: `action-${Date.now() + 1}`,
            title: 'Get Help',
            description: 'Connect with SAM for personalized support',
            type: 'contact_mentor' as const,
            priority: 'medium',
          },
        ],
        timing: { type: 'immediate' },
      });
      immediateActions.push(intervention);
    }

    // Check for repeated failures
    if (
      event.type === BehaviorEventType.ASSESSMENT_ATTEMPT &&
      (event.data as Record<string, unknown>).passed === false
    ) {
      const recentFailures = await this.behaviorMonitor.getEvents(event.userId, {
        types: [BehaviorEventType.ASSESSMENT_ATTEMPT],
        since: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
        includeProcessed: true,
      });

      const consecutiveFailures = recentFailures.filter(
        (e) => (e.data as Record<string, unknown>).passed === false
      ).length;

      if (consecutiveFailures >= 3) {
        const intervention = await this.behaviorMonitor.createIntervention(event.userId, {
          type: 'content_recommendation' as const,
          priority: 'high',
          message:
            "You've had a few challenging attempts. Let's review the foundational concepts.",
          suggestedActions: [
            {
              id: `action-${Date.now()}`,
              title: 'Review Basics',
              description: 'Go back to earlier content for a quick refresher',
              type: 'review_content' as const,
              priority: 'high',
            },
          ],
          timing: { type: 'immediate' },
        });
        immediateActions.push(intervention);
      }
    }

    return { event: trackedEvent, immediateActions };
  }

  // ============================================================================
  // SCHEDULED CHECK-IN CREATION
  // ============================================================================

  /**
   * Schedule daily reminder for a user
   */
  async scheduleDailyReminder(userId: string, preferredTime?: Date): Promise<ScheduledCheckIn> {
    const scheduledTime = preferredTime ?? this.getNextDailyReminderTime();

    return this.checkInScheduler.createDailyReminder(userId, scheduledTime);
  }

  /**
   * Schedule weekly summary for a user
   */
  async scheduleWeeklySummary(userId: string, dayOfWeek: number = 0): Promise<ScheduledCheckIn> {
    const scheduledTime = this.getNextWeeklyTime(dayOfWeek, 18); // 6 PM on specified day

    return this.checkInScheduler.createWeeklySummary(userId, scheduledTime);
  }

  /**
   * Schedule progress check for a user
   */
  async scheduleProgressCheck(
    userId: string,
    scheduledTime?: Date,
    planId?: string
  ): Promise<ScheduledCheckIn> {
    const time = scheduledTime ?? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

    return this.checkInScheduler.createProgressCheck(userId, time, planId);
  }

  /**
   * Schedule milestone celebration
   */
  async scheduleMilestoneCelebration(
    userId: string,
    milestoneName: string,
    planId?: string
  ): Promise<ScheduledCheckIn> {
    return this.checkInScheduler.createMilestoneCelebration(userId, milestoneName, planId);
  }

  // ============================================================================
  // USER ONBOARDING CHECK-INS
  // ============================================================================

  /**
   * Set up initial check-ins for a new user
   */
  async setupNewUserCheckIns(userId: string): Promise<ScheduledCheckIn[]> {
    const checkIns: ScheduledCheckIn[] = [];

    // Day 1: Welcome check-in (immediate)
    const welcomeCheckIn = await this.checkInScheduler.scheduleCheckIn({
      userId,
      type: CheckInType.ENCOURAGEMENT,
      scheduledTime: new Date(),
      triggerConditions: [],
      message: 'Welcome to your learning journey! Ready to get started?',
      questions: [
        {
          id: 'welcome-1',
          question: 'What are you most excited to learn?',
          type: 'text' as const,
          required: false,
          order: 1,
        },
      ],
      suggestedActions: [
        {
          id: 'welcome-action-1',
          title: 'Start Learning',
          description: 'Begin your first lesson',
          type: 'start_activity' as const,
          priority: 'high',
        },
        {
          id: 'welcome-action-2',
          title: 'Set Your Goals',
          description: 'Define what you want to achieve',
          type: 'adjust_goal' as const,
          priority: 'medium',
        },
      ],
      channel: this.config.defaultChannel,
      priority: 'high',
    });
    checkIns.push(welcomeCheckIn);

    // Day 2: Follow-up check-in
    const followUpCheckIn = await this.checkInScheduler.scheduleCheckIn({
      userId,
      type: CheckInType.PROGRESS_CHECK,
      scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      triggerConditions: [],
      message: 'How was your first day of learning?',
      questions: [
        {
          id: 'day2-1',
          question: 'How was the difficulty level?',
          type: 'single_choice' as const,
          options: ['Too easy', 'Just right', 'A bit challenging', 'Too difficult'],
          required: true,
          order: 1,
        },
      ],
      suggestedActions: [
        {
          id: 'day2-action-1',
          title: 'Continue Learning',
          description: 'Pick up where you left off',
          type: 'start_activity' as const,
          priority: 'high',
        },
      ],
      channel: this.config.defaultChannel,
      priority: 'medium',
    });
    checkIns.push(followUpCheckIn);

    // Day 7: First week summary
    const weekSummaryCheckIn = await this.scheduleWeeklySummary(userId);
    checkIns.push(weekSummaryCheckIn);

    logger.info('[ProactiveScheduler] New user check-ins created', {
      userId,
      count: checkIns.length,
    });

    return checkIns;
  }

  // ============================================================================
  // INTERNAL SCHEDULING METHODS
  // ============================================================================

  private async scheduleStreakProtection(
    userId: string,
    context: UserActivityContext
  ): Promise<ScheduledCheckIn | null> {
    // Check if streak risk check-in already exists
    const existingCheckIns = await this.checkInScheduler.getUserCheckIns(
      userId,
      CheckInStatus.SCHEDULED
    );
    const hasStreakCheckIn = existingCheckIns.some(
      (c) => c.type === CheckInType.STREAK_RISK
    );

    if (hasStreakCheckIn) return null;

    return this.checkInScheduler.createStreakRiskCheckIn(userId, context.currentStreak);
  }

  private async scheduleInactivityReengagement(
    userId: string,
    daysSinceLastActivity: number
  ): Promise<ScheduledCheckIn | null> {
    // Check if re-engagement check-in already exists
    const existingCheckIns = await this.checkInScheduler.getUserCheckIns(
      userId,
      CheckInStatus.SCHEDULED
    );
    const hasReengagementCheckIn = existingCheckIns.some(
      (c) => c.type === CheckInType.INACTIVITY_REENGAGEMENT
    );

    if (hasReengagementCheckIn) return null;

    return this.checkInScheduler.createInactivityCheckIn(userId, daysSinceLastActivity);
  }

  private async scheduleStruggleIntervention(
    userId: string,
    prediction: StrugglePrediction
  ): Promise<ScheduledCheckIn | null> {
    // Check if struggle check-in already exists
    const existingCheckIns = await this.checkInScheduler.getUserCheckIns(
      userId,
      CheckInStatus.SCHEDULED
    );
    const hasStruggleCheckIn = existingCheckIns.some(
      (c) => c.type === CheckInType.STRUGGLE_DETECTION
    );

    if (hasStruggleCheckIn) return null;

    const severestArea = prediction.areas.sort((a, b) => {
      const severity = { severe: 3, moderate: 2, mild: 1 };
      return severity[b.severity] - severity[a.severity];
    })[0];

    return this.checkInScheduler.createStruggleCheckIn(userId, [
      {
        type: TriggerType.FRUSTRATION_DETECTED,
        threshold: 0.6,
        comparison: 'gte',
        currentValue: prediction.struggleProbability,
        met: true,
      },
    ]);
  }

  // ============================================================================
  // CONTEXT BUILDING
  // ============================================================================

  private async buildUserContext(userId: string): Promise<UserContext> {
    // Get streak info
    const streak = await db.sAMStreak.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    // Get last interaction
    const lastSession = await db.sAMInteraction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate days since last session
    const daysSinceLastSession = lastSession
      ? Math.floor((Date.now() - lastSession.createdAt.getTime()) / (24 * 60 * 60 * 1000))
      : undefined;

    // Get learning profile
    const profile = await db.sAMLearningProfile.findUnique({
      where: { userId },
    });

    // Calculate streak at risk (20 hours since last session)
    const hoursSinceLastSession = lastSession
      ? (Date.now() - lastSession.createdAt.getTime()) / (60 * 60 * 1000)
      : undefined;
    const streakAtRisk =
      streak &&
      hoursSinceLastSession !== undefined &&
      hoursSinceLastSession >= this.config.streakRiskHours;

    return {
      userId,
      lastSessionAt: lastSession?.createdAt,
      currentStreak: streak?.currentStreak ?? 0,
      streakAtRisk: streakAtRisk ?? false,
      masteryScore: profile?.preferences
        ? ((profile.preferences as Record<string, unknown>).masteryScore as number | undefined)
        : undefined,
      daysSinceLastSession,
    };
  }

  private async buildActivityContext(userId: string): Promise<UserActivityContext> {
    const context = await this.buildUserContext(userId);

    // Get session count
    const sessionCount = await db.sAMInteraction.count({
      where: { userId },
    });

    // Calculate average session time (from analytics)
    const analytics = await db.sAMAnalytics.findMany({
      where: {
        userId,
        metricType: 'CHAT_ENGAGEMENT_TIME', // Using engagement time as proxy for session duration
      },
      take: 10,
      orderBy: { recordedAt: 'desc' },
    });

    const avgSessionMinutes =
      analytics.length > 0
        ? analytics.reduce((sum, a) => sum + a.metricValue, 0) / analytics.length
        : 0;

    // Determine recent performance
    let recentPerformance: UserActivityContext['recentPerformance'] = 'unknown';
    if (context.masteryScore !== undefined) {
      if (context.masteryScore >= 0.8) recentPerformance = 'excellent';
      else if (context.masteryScore >= 0.6) recentPerformance = 'good';
      else recentPerformance = 'struggling';
    }

    return {
      userId,
      lastSessionAt: context.lastSessionAt,
      currentStreak: context.currentStreak ?? 0,
      streakAtRisk: context.streakAtRisk ?? false,
      daysSinceLastSession: context.daysSinceLastSession ?? 0,
      totalSessions: sessionCount,
      averageSessionMinutes: avgSessionMinutes,
      recentPerformance,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private getNextDailyReminderTime(): Date {
    const now = new Date();
    const reminderTime = new Date(now);

    // Set to 9 AM next day if past 9 AM today
    reminderTime.setHours(9, 0, 0, 0);
    if (now.getHours() >= 9) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    return reminderTime;
  }

  private getNextWeeklyTime(dayOfWeek: number, hour: number): Date {
    const now = new Date();
    const result = new Date(now);

    // Find next occurrence of the day
    const daysUntil = (dayOfWeek - now.getDay() + 7) % 7 || 7;
    result.setDate(result.getDate() + daysUntil);
    result.setHours(hour, 0, 0, 0);

    return result;
  }

  // ============================================================================
  // ACCESSORS
  // ============================================================================

  getCheckInScheduler(): CheckInScheduler {
    return this.checkInScheduler;
  }

  getBehaviorMonitor(): BehaviorMonitor {
    return this.behaviorMonitor;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let proactiveSchedulerInstance: ProactiveScheduler | null = null;

export function getProactiveScheduler(
  config?: ProactiveSchedulerConfig
): ProactiveScheduler {
  if (!proactiveSchedulerInstance) {
    proactiveSchedulerInstance = new ProactiveScheduler(config);
  }
  return proactiveSchedulerInstance;
}

export function createProactiveScheduler(
  config?: ProactiveSchedulerConfig
): ProactiveScheduler {
  return new ProactiveScheduler(config);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  CheckInScheduler,
  BehaviorMonitor,
  CheckInType,
  CheckInStatus,
  NotificationChannel,
  TriggerType,
  BehaviorEventType,
  type UserContext,
  type ScheduledCheckIn,
  type TriggeredCheckIn,
  type BehaviorEvent,
  type ChurnPrediction,
  type StrugglePrediction,
  type Intervention,
};
