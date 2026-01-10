/**
 * @sam-ai/agentic - Check-In Scheduler
 * Proactive check-in scheduling and trigger evaluation
 */

import { v4 as uuidv4 } from 'uuid';
import { EmotionalState } from '../memory/types';
import {
  ScheduledCheckIn,
  CheckInStore,
  CheckInStatus,
  CheckInType,
  TriggerCondition,
  TriggerType,
  NotificationChannel,
  TriggeredCheckIn,
  CheckInResult,
  CheckInResponse,
  CheckInResponseSchema,
  QuestionType,
  ActionType,
  ProactiveLogger,
} from './types';

// ============================================================================
// IN-MEMORY STORE
// ============================================================================

/**
 * In-memory implementation of CheckInStore
 */
export class InMemoryCheckInStore implements CheckInStore {
  private checkIns: Map<string, ScheduledCheckIn> = new Map();
  private responses: Map<string, CheckInResponse[]> = new Map();

  async get(id: string): Promise<ScheduledCheckIn | null> {
    return this.checkIns.get(id) ?? null;
  }

  async getByUser(userId: string, status?: CheckInStatus): Promise<ScheduledCheckIn[]> {
    return Array.from(this.checkIns.values()).filter(
      (checkIn) =>
        checkIn.userId === userId && (status === undefined || checkIn.status === status)
    );
  }

  async getScheduled(userId: string, from: Date, to: Date): Promise<ScheduledCheckIn[]> {
    return Array.from(this.checkIns.values()).filter(
      (checkIn) =>
        checkIn.userId === userId &&
        checkIn.status === CheckInStatus.SCHEDULED &&
        checkIn.scheduledTime >= from &&
        checkIn.scheduledTime <= to
    );
  }

  async getAllScheduled(from: Date, to: Date): Promise<ScheduledCheckIn[]> {
    return Array.from(this.checkIns.values()).filter(
      (checkIn) =>
        checkIn.scheduledTime >= from &&
        checkIn.scheduledTime <= to
    );
  }

  async create(
    checkIn: Omit<ScheduledCheckIn, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ScheduledCheckIn> {
    const now = new Date();
    const newCheckIn: ScheduledCheckIn = {
      ...checkIn,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    this.checkIns.set(newCheckIn.id, newCheckIn);
    return newCheckIn;
  }

  async update(id: string, updates: Partial<ScheduledCheckIn>): Promise<ScheduledCheckIn> {
    const checkIn = this.checkIns.get(id);
    if (!checkIn) {
      throw new Error(`Check-in not found: ${id}`);
    }
    const updatedCheckIn: ScheduledCheckIn = {
      ...checkIn,
      ...updates,
      id: checkIn.id,
      createdAt: checkIn.createdAt,
      updatedAt: new Date(),
    };
    this.checkIns.set(id, updatedCheckIn);
    return updatedCheckIn;
  }

  async updateStatus(id: string, status: CheckInStatus): Promise<void> {
    const checkIn = this.checkIns.get(id);
    if (!checkIn) {
      throw new Error(`Check-in not found: ${id}`);
    }
    checkIn.status = status;
    checkIn.updatedAt = new Date();
    this.checkIns.set(id, checkIn);
  }

  async delete(id: string): Promise<boolean> {
    return this.checkIns.delete(id);
  }

  async recordResponse(id: string, response: CheckInResponse): Promise<void> {
    const responses = this.responses.get(id) ?? [];
    responses.push(response);
    this.responses.set(id, responses);
  }

  async getResponses(checkInId: string): Promise<CheckInResponse[]> {
    return this.responses.get(checkInId) ?? [];
  }
}

// ============================================================================
// DEFAULT LOGGER
// ============================================================================

const defaultLogger: ProactiveLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

// ============================================================================
// TRIGGER EVALUATOR
// ============================================================================

/**
 * User context for trigger evaluation
 */
export interface UserContext {
  userId: string;
  lastSessionAt?: Date;
  currentStreak?: number;
  streakAtRisk?: boolean;
  masteryScore?: number;
  masteryTrend?: 'improving' | 'stable' | 'declining';
  frustrationLevel?: number;
  goalProgress?: number;
  goalDeadline?: Date;
  lastAssessmentPassed?: boolean;
  daysSinceLastSession?: number;
}

/**
 * Evaluates trigger conditions against user context
 */
export class TriggerEvaluator {
  evaluateCondition(condition: TriggerCondition, context: UserContext): boolean {
    const value = this.getValueForTrigger(condition.type, context);
    if (value === undefined) return false;

    const threshold = condition.threshold;

    switch (condition.comparison) {
      case 'gt':
        return value > threshold;
      case 'lt':
        return value < threshold;
      case 'eq':
        return value === threshold;
      case 'gte':
        return value >= threshold;
      case 'lte':
        return value <= threshold;
      default:
        return false;
    }
  }

  evaluateAllConditions(conditions: TriggerCondition[], context: UserContext): TriggerCondition[] {
    return conditions.map((condition) => ({
      ...condition,
      currentValue: this.getValueForTrigger(condition.type, context),
      met: this.evaluateCondition(condition, context),
    }));
  }

  shouldTrigger(conditions: TriggerCondition[], context: UserContext): boolean {
    if (conditions.length === 0) return true;
    return conditions.some((condition) => this.evaluateCondition(condition, context));
  }

  private getValueForTrigger(type: TriggerType, context: UserContext): number | undefined {
    switch (type) {
      case TriggerType.DAYS_INACTIVE:
        return context.daysSinceLastSession;
      case TriggerType.STREAK_AT_RISK:
        return context.streakAtRisk ? 1 : 0;
      case TriggerType.MASTERY_PLATEAU:
        return context.masteryTrend === 'stable' ? 1 : 0;
      case TriggerType.FRUSTRATION_DETECTED:
        return context.frustrationLevel;
      case TriggerType.GOAL_BEHIND_SCHEDULE:
        return this.calculateBehindSchedule(context);
      case TriggerType.ASSESSMENT_FAILED:
        return context.lastAssessmentPassed === false ? 1 : 0;
      case TriggerType.TIME_SINCE_LAST_SESSION:
        return context.daysSinceLastSession;
      case TriggerType.MILESTONE_APPROACHING:
        return this.calculateMilestoneDistance(context);
      case TriggerType.WEEKLY_REVIEW_DUE:
        return this.calculateWeeklyReviewDue(context);
      default:
        return undefined;
    }
  }

  private calculateBehindSchedule(context: UserContext): number {
    if (!context.goalProgress || !context.goalDeadline) return 0;

    const now = new Date();
    const totalDays =
      (context.goalDeadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
    const expectedProgress = Math.min(100, Math.max(0, 100 - (totalDays / 30) * 100));
    const behindBy = expectedProgress - context.goalProgress;

    return Math.max(0, behindBy);
  }

  private calculateMilestoneDistance(context: UserContext): number {
    if (!context.goalProgress) return 100;

    // Check if close to next 25% milestone
    const nextMilestone = Math.ceil(context.goalProgress / 25) * 25;
    return nextMilestone - context.goalProgress;
  }

  private calculateWeeklyReviewDue(context: UserContext): number {
    if (!context.lastSessionAt) return 7;

    const now = new Date();
    const daysSinceSession = Math.floor(
      (now.getTime() - context.lastSessionAt.getTime()) / (24 * 60 * 60 * 1000)
    );

    // Weekly review is due every 7 days
    return daysSinceSession % 7 === 0 ? 1 : 0;
  }
}

// ============================================================================
// CHECK-IN SCHEDULER
// ============================================================================

/**
 * Configuration for CheckInScheduler
 */
export interface CheckInSchedulerConfig {
  store?: CheckInStore;
  logger?: ProactiveLogger;
  defaultChannel?: NotificationChannel;
  defaultPriority?: 'high' | 'medium' | 'low';
  checkInExpirationHours?: number;
}

/**
 * Check-In Scheduler
 * Schedules and manages proactive check-ins with trigger-based execution
 */
export class CheckInScheduler {
  private store: CheckInStore;
  private logger: ProactiveLogger;
  private triggerEvaluator: TriggerEvaluator;
  private defaultChannel: NotificationChannel;
  private checkInExpirationHours: number;

  constructor(config: CheckInSchedulerConfig = {}) {
    this.store = config.store ?? new InMemoryCheckInStore();
    this.logger = config.logger ?? defaultLogger;
    this.triggerEvaluator = new TriggerEvaluator();
    this.defaultChannel = config.defaultChannel ?? NotificationChannel.IN_APP;
    this.checkInExpirationHours = config.checkInExpirationHours ?? 24;
  }

  /**
   * Schedule a new check-in
   */
  async scheduleCheckIn(checkIn: Omit<ScheduledCheckIn, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<ScheduledCheckIn> {
    this.logger.info('Scheduling check-in', { userId: checkIn.userId, type: checkIn.type });

    const expiresAt = new Date(checkIn.scheduledTime);
    expiresAt.setHours(expiresAt.getHours() + this.checkInExpirationHours);

    return this.store.create({
      ...checkIn,
      status: CheckInStatus.SCHEDULED,
      expiresAt: checkIn.expiresAt ?? expiresAt,
    });
  }

  /**
   * Get scheduled check-ins for a user
   */
  async getScheduledCheckIns(userId: string): Promise<ScheduledCheckIn[]> {
    return this.store.getByUser(userId, CheckInStatus.SCHEDULED);
  }

  /**
   * Get all check-ins for a user
   */
  async getUserCheckIns(userId: string, status?: CheckInStatus): Promise<ScheduledCheckIn[]> {
    return this.store.getByUser(userId, status);
  }

  /**
   * Evaluate triggers and return check-ins that should be triggered
   */
  async evaluateTriggers(userId: string, context: UserContext): Promise<TriggeredCheckIn[]> {
    this.logger.debug('Evaluating triggers', { userId });

    const scheduledCheckIns = await this.store.getByUser(userId, CheckInStatus.SCHEDULED);
    const triggeredCheckIns: TriggeredCheckIn[] = [];

    for (const checkIn of scheduledCheckIns) {
      const evaluatedConditions = this.triggerEvaluator.evaluateAllConditions(
        checkIn.triggerConditions,
        context
      );

      const shouldTrigger = this.triggerEvaluator.shouldTrigger(
        checkIn.triggerConditions,
        context
      );

      if (shouldTrigger) {
        triggeredCheckIns.push({
          checkInId: checkIn.id,
          triggeredAt: new Date(),
          triggerConditions: evaluatedConditions,
          urgency: this.calculateUrgency(checkIn, evaluatedConditions),
        });

        // Update check-in status to pending
        await this.store.update(checkIn.id, { status: CheckInStatus.PENDING });
      }
    }

    this.logger.info('Triggers evaluated', {
      userId,
      triggered: triggeredCheckIns.length,
      total: scheduledCheckIns.length,
    });

    return triggeredCheckIns;
  }

  /**
   * Execute a check-in (send notification)
   */
  async executeCheckIn(checkInId: string): Promise<CheckInResult> {
    const checkIn = await this.store.get(checkInId);
    if (!checkIn) {
      throw new Error(`Check-in not found: ${checkInId}`);
    }

    this.logger.info('Executing check-in', { checkInId, type: checkIn.type });

    try {
      // In a real implementation, this would send the notification
      // through the appropriate channel (push, email, etc.)
      const success = await this.sendNotification(checkIn);

      if (success) {
        await this.store.update(checkInId, { status: CheckInStatus.SENT });
      }

      return {
        checkInId,
        executedAt: new Date(),
        deliveredVia: checkIn.channel,
        success,
      };
    } catch (error) {
      this.logger.error('Failed to execute check-in', {
        checkInId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        checkInId,
        executedAt: new Date(),
        deliveredVia: checkIn.channel,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle a response to a check-in
   */
  async handleResponse(checkInId: string, response: CheckInResponse): Promise<void> {
    const validated = CheckInResponseSchema.parse(response);

    const checkIn = await this.store.get(checkInId);
    if (!checkIn) {
      throw new Error(`Check-in not found: ${checkInId}`);
    }

    this.logger.info('Handling check-in response', {
      checkInId,
      answers: validated.answers.length,
      selectedActions: validated.selectedActions.length,
    });

    await this.store.recordResponse(checkInId, {
      ...validated,
      emotionalState: validated.emotionalState as EmotionalState | undefined,
    });
    await this.store.update(checkInId, { status: CheckInStatus.RESPONDED });
  }

  /**
   * Get a check-in by ID
   */
  async getCheckIn(checkInId: string): Promise<ScheduledCheckIn | null> {
    return this.store.get(checkInId);
  }

  /**
   * Cancel a scheduled check-in
   */
  async cancelCheckIn(checkInId: string): Promise<ScheduledCheckIn> {
    const checkIn = await this.store.get(checkInId);
    if (!checkIn) {
      throw new Error(`Check-in not found: ${checkInId}`);
    }

    return this.store.update(checkInId, { status: CheckInStatus.CANCELLED });
  }

  /**
   * Process expired check-ins
   */
  async processExpiredCheckIns(): Promise<number> {
    const allCheckIns = await this.getAllPendingCheckIns();
    const now = new Date();
    let expiredCount = 0;

    for (const checkIn of allCheckIns) {
      if (checkIn.expiresAt && checkIn.expiresAt < now) {
        await this.store.update(checkIn.id, { status: CheckInStatus.EXPIRED });
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      this.logger.info('Processed expired check-ins', { count: expiredCount });
    }

    return expiredCount;
  }

  /**
   * Create a standard daily reminder check-in
   */
  async createDailyReminder(
    userId: string,
    scheduledTime: Date,
    planId?: string
  ): Promise<ScheduledCheckIn> {
    return this.scheduleCheckIn({
      userId,
      type: CheckInType.DAILY_REMINDER,
      scheduledTime,
      triggerConditions: [],
      message: "Time for today's learning session! Your personalized practice is ready.",
      questions: [
        {
          id: uuidv4(),
          question: 'How are you feeling about learning today?',
          type: QuestionType.EMOJI,
          options: ['😊 Great', '😐 Okay', '😔 Not great'],
          required: false,
          order: 1,
        },
      ],
      suggestedActions: [
        {
          id: uuidv4(),
          title: 'Start Learning',
          description: 'Begin your daily practice session',
          type: ActionType.START_ACTIVITY,
          priority: 'high',
        },
        {
          id: uuidv4(),
          title: 'Quick Review',
          description: 'Review concepts from previous sessions',
          type: ActionType.COMPLETE_REVIEW,
          priority: 'medium',
        },
      ],
      channel: this.defaultChannel,
      planId,
      priority: 'medium',
    });
  }

  /**
   * Create a progress check-in
   */
  async createProgressCheck(
    userId: string,
    scheduledTime: Date,
    planId?: string
  ): Promise<ScheduledCheckIn> {
    return this.scheduleCheckIn({
      userId,
      type: CheckInType.PROGRESS_CHECK,
      scheduledTime,
      triggerConditions: [],
      message: "Let's check in on your progress! You've been making great strides.",
      questions: [
        {
          id: uuidv4(),
          question: 'How is the difficulty level for you?',
          type: QuestionType.SINGLE_CHOICE,
          options: ['Too easy', 'Just right', 'A bit challenging', 'Too difficult'],
          required: true,
          order: 1,
        },
        {
          id: uuidv4(),
          question: 'Are you enjoying the content?',
          type: QuestionType.SCALE,
          required: true,
          order: 2,
        },
      ],
      suggestedActions: [
        {
          id: uuidv4(),
          title: 'View Progress',
          description: 'See your detailed progress report',
          type: ActionType.VIEW_PROGRESS,
          priority: 'high',
        },
        {
          id: uuidv4(),
          title: 'Adjust Goal',
          description: 'Modify your learning plan if needed',
          type: ActionType.ADJUST_GOAL,
          priority: 'medium',
        },
      ],
      channel: this.defaultChannel,
      planId,
      priority: 'medium',
    });
  }

  /**
   * Create a struggle detection check-in
   */
  async createStruggleCheckIn(
    userId: string,
    triggerConditions: TriggerCondition[]
  ): Promise<ScheduledCheckIn> {
    return this.scheduleCheckIn({
      userId,
      type: CheckInType.STRUGGLE_DETECTION,
      scheduledTime: new Date(),
      triggerConditions,
      message: "I noticed you might be having some difficulty. Let's work through this together!",
      questions: [
        {
          id: uuidv4(),
          question: 'What are you finding most challenging?',
          type: QuestionType.TEXT,
          required: false,
          order: 1,
        },
        {
          id: uuidv4(),
          question: 'Would you like some additional help?',
          type: QuestionType.YES_NO,
          required: true,
          order: 2,
        },
      ],
      suggestedActions: [
        {
          id: uuidv4(),
          title: 'Get Help',
          description: 'Connect with a mentor for personalized support',
          type: ActionType.CONTACT_MENTOR,
          priority: 'high',
        },
        {
          id: uuidv4(),
          title: 'Review Basics',
          description: 'Go back to foundational concepts',
          type: ActionType.REVIEW_CONTENT,
          priority: 'medium',
        },
        {
          id: uuidv4(),
          title: 'Take a Break',
          description: 'Sometimes a short break helps',
          type: ActionType.TAKE_BREAK,
          priority: 'low',
        },
      ],
      channel: this.defaultChannel,
      priority: 'high',
    });
  }

  /**
   * Create a milestone celebration check-in
   */
  async createMilestoneCelebration(
    userId: string,
    milestoneName: string,
    planId?: string
  ): Promise<ScheduledCheckIn> {
    return this.scheduleCheckIn({
      userId,
      type: CheckInType.MILESTONE_CELEBRATION,
      scheduledTime: new Date(),
      triggerConditions: [],
      message: `Congratulations! You've reached a milestone: ${milestoneName}! 🎉`,
      questions: [
        {
          id: uuidv4(),
          question: 'How does it feel to reach this milestone?',
          type: QuestionType.EMOJI,
          options: ['🎉 Amazing', '😊 Good', '😌 Relieved'],
          required: false,
          order: 1,
        },
      ],
      suggestedActions: [
        {
          id: uuidv4(),
          title: 'Share Achievement',
          description: 'Share your success with others',
          type: ActionType.VIEW_PROGRESS,
          priority: 'medium',
        },
        {
          id: uuidv4(),
          title: 'Continue Learning',
          description: 'Keep the momentum going',
          type: ActionType.START_ACTIVITY,
          priority: 'high',
        },
      ],
      channel: this.defaultChannel,
      planId,
      priority: 'low',
    });
  }

  /**
   * Create an inactivity re-engagement check-in
   */
  async createInactivityCheckIn(
    userId: string,
    daysSinceLastActivity: number
  ): Promise<ScheduledCheckIn> {
    return this.scheduleCheckIn({
      userId,
      type: CheckInType.INACTIVITY_REENGAGEMENT,
      scheduledTime: new Date(),
      triggerConditions: [
        {
          type: TriggerType.DAYS_INACTIVE,
          threshold: daysSinceLastActivity,
          comparison: 'gte',
          met: true,
        },
      ],
      message: `We miss you! It's been ${daysSinceLastActivity} days since your last session. Ready to jump back in?`,
      questions: [
        {
          id: uuidv4(),
          question: "What's been keeping you away?",
          type: QuestionType.SINGLE_CHOICE,
          options: ['Too busy', 'Lost motivation', 'Content too difficult', 'Other priorities'],
          required: false,
          order: 1,
        },
      ],
      suggestedActions: [
        {
          id: uuidv4(),
          title: 'Quick Session',
          description: 'Start with a short 5-minute refresher',
          type: ActionType.START_ACTIVITY,
          priority: 'high',
        },
        {
          id: uuidv4(),
          title: 'Review Progress',
          description: 'See how far you have come',
          type: ActionType.VIEW_PROGRESS,
          priority: 'medium',
        },
        {
          id: uuidv4(),
          title: 'Adjust Plan',
          description: 'Modify your learning schedule',
          type: ActionType.ADJUST_GOAL,
          priority: 'medium',
        },
      ],
      channel: this.defaultChannel,
      priority: 'high',
    });
  }

  /**
   * Create a streak risk check-in
   */
  async createStreakRiskCheckIn(
    userId: string,
    currentStreak: number
  ): Promise<ScheduledCheckIn> {
    return this.scheduleCheckIn({
      userId,
      type: CheckInType.STREAK_RISK,
      scheduledTime: new Date(),
      triggerConditions: [
        {
          type: TriggerType.STREAK_AT_RISK,
          threshold: 1,
          comparison: 'eq',
          met: true,
        },
      ],
      message: `Your ${currentStreak}-day streak is at risk! A quick session will keep it going.`,
      questions: [],
      suggestedActions: [
        {
          id: uuidv4(),
          title: 'Save Streak',
          description: 'Complete a quick activity to maintain your streak',
          type: ActionType.START_ACTIVITY,
          priority: 'high',
        },
      ],
      channel: NotificationChannel.PUSH, // Push for urgency
      priority: 'high',
    });
  }

  /**
   * Create a weekly summary check-in
   */
  async createWeeklySummary(
    userId: string,
    scheduledTime: Date,
    planId?: string
  ): Promise<ScheduledCheckIn> {
    return this.scheduleCheckIn({
      userId,
      type: CheckInType.WEEKLY_SUMMARY,
      scheduledTime,
      triggerConditions: [],
      message: "Here's your weekly learning summary! Let's reflect on your progress.",
      questions: [
        {
          id: uuidv4(),
          question: 'How satisfied are you with this week?',
          type: QuestionType.SCALE,
          required: true,
          order: 1,
        },
        {
          id: uuidv4(),
          question: 'What would you like to focus on next week?',
          type: QuestionType.TEXT,
          required: false,
          order: 2,
        },
      ],
      suggestedActions: [
        {
          id: uuidv4(),
          title: 'View Report',
          description: 'See your detailed weekly progress',
          type: ActionType.VIEW_PROGRESS,
          priority: 'high',
        },
        {
          id: uuidv4(),
          title: 'Plan Next Week',
          description: 'Set goals for the coming week',
          type: ActionType.ADJUST_GOAL,
          priority: 'medium',
        },
      ],
      channel: this.defaultChannel,
      planId,
      priority: 'medium',
    });
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private calculateUrgency(
    checkIn: ScheduledCheckIn,
    conditions: TriggerCondition[]
  ): 'immediate' | 'soon' | 'routine' {
    // High priority check-ins are immediate
    if (checkIn.priority === 'high') {
      return 'immediate';
    }

    // Check if any critical conditions are met
    const criticalTypes: TriggerType[] = [
      TriggerType.STREAK_AT_RISK,
      TriggerType.FRUSTRATION_DETECTED,
      TriggerType.ASSESSMENT_FAILED,
    ];

    const hasCriticalCondition = conditions.some(
      (c) => c.met && criticalTypes.includes(c.type as TriggerType)
    );

    if (hasCriticalCondition) {
      return 'immediate';
    }

    // Medium priority is "soon"
    if (checkIn.priority === 'medium') {
      return 'soon';
    }

    return 'routine';
  }

  private async sendNotification(checkIn: ScheduledCheckIn): Promise<boolean> {
    // In a real implementation, this would integrate with:
    // - Push notification service
    // - Email service
    // - SMS service
    // - In-app notification system

    this.logger.info('Sending notification', {
      checkInId: checkIn.id,
      channel: checkIn.channel,
      type: checkIn.type,
    });

    // Simulate successful send
    return true;
  }

  private async getAllPendingCheckIns(): Promise<ScheduledCheckIn[]> {
    // Get all check-ins with SCHEDULED or SENT status
    // In a real implementation, this would be a more efficient query
    const scheduled = await this.store.getByUser('', CheckInStatus.SCHEDULED);
    const sent = await this.store.getByUser('', CheckInStatus.SENT);
    return [...scheduled, ...sent];
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new CheckInScheduler instance
 */
export function createCheckInScheduler(config?: CheckInSchedulerConfig): CheckInScheduler {
  return new CheckInScheduler(config);
}
