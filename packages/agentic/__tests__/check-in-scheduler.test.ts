/**
 * Tests for CheckInScheduler
 */

import {
  CheckInScheduler,
  createCheckInScheduler,
  InMemoryCheckInStore,
  TriggerEvaluator,
  CheckInType,
  CheckInStatus,
  TriggerType,
  TriggerCondition,
  NotificationChannel,
  UserContext,
} from '../src/proactive-intervention';

describe('CheckInScheduler', () => {
  let scheduler: CheckInScheduler;

  beforeEach(() => {
    scheduler = createCheckInScheduler();
  });

  describe('scheduleCheckIn', () => {
    it('should schedule a check-in', async () => {
      const scheduledTime = new Date();
      scheduledTime.setHours(scheduledTime.getHours() + 1);

      const checkIn = await scheduler.scheduleCheckIn({
        userId: 'user-1',
        type: CheckInType.DAILY_REMINDER,
        scheduledTime,
        triggerConditions: [],
        message: 'Time to learn!',
        questions: [],
        suggestedActions: [],
        channel: NotificationChannel.IN_APP,
        priority: 'medium',
      });

      expect(checkIn).toBeDefined();
      expect(checkIn.id).toBeDefined();
      expect(checkIn.userId).toBe('user-1');
      expect(checkIn.status).toBe(CheckInStatus.SCHEDULED);
      expect(checkIn.type).toBe(CheckInType.DAILY_REMINDER);
    });

    it('should set expiration time', async () => {
      const scheduledTime = new Date();

      const checkIn = await scheduler.scheduleCheckIn({
        userId: 'user-1',
        type: CheckInType.DAILY_REMINDER,
        scheduledTime,
        triggerConditions: [],
        message: 'Test',
        questions: [],
        suggestedActions: [],
        channel: NotificationChannel.IN_APP,
        priority: 'medium',
      });

      expect(checkIn.expiresAt).toBeDefined();
      expect(checkIn.expiresAt!.getTime()).toBeGreaterThan(scheduledTime.getTime());
    });
  });

  describe('getScheduledCheckIns', () => {
    it('should return scheduled check-ins for user', async () => {
      const scheduledTime = new Date();

      await scheduler.scheduleCheckIn({
        userId: 'user-1',
        type: CheckInType.DAILY_REMINDER,
        scheduledTime,
        triggerConditions: [],
        message: 'Check-in 1',
        questions: [],
        suggestedActions: [],
        channel: NotificationChannel.IN_APP,
        priority: 'medium',
      });

      await scheduler.scheduleCheckIn({
        userId: 'user-1',
        type: CheckInType.PROGRESS_CHECK,
        scheduledTime,
        triggerConditions: [],
        message: 'Check-in 2',
        questions: [],
        suggestedActions: [],
        channel: NotificationChannel.IN_APP,
        priority: 'medium',
      });

      const checkIns = await scheduler.getScheduledCheckIns('user-1');
      expect(checkIns.length).toBe(2);
    });

    it('should return empty array for user with no check-ins', async () => {
      const checkIns = await scheduler.getScheduledCheckIns('no-checkins');
      expect(checkIns).toHaveLength(0);
    });
  });

  describe('evaluateTriggers', () => {
    it('should trigger check-ins when conditions are met', async () => {
      const scheduledTime = new Date();

      await scheduler.scheduleCheckIn({
        userId: 'user-1',
        type: CheckInType.INACTIVITY_REENGAGEMENT,
        scheduledTime,
        triggerConditions: [
          {
            type: TriggerType.DAYS_INACTIVE,
            threshold: 3,
            comparison: 'gte',
            met: false,
          },
        ],
        message: 'We miss you!',
        questions: [],
        suggestedActions: [],
        channel: NotificationChannel.IN_APP,
        priority: 'high',
      });

      const context: UserContext = {
        userId: 'user-1',
        daysSinceLastSession: 5,
      };

      const triggered = await scheduler.evaluateTriggers('user-1', context);
      expect(triggered.length).toBe(1);
      expect(triggered[0].triggerConditions[0].met).toBe(true);
    });

    it('should not trigger when conditions are not met', async () => {
      const scheduledTime = new Date();

      await scheduler.scheduleCheckIn({
        userId: 'user-1',
        type: CheckInType.INACTIVITY_REENGAGEMENT,
        scheduledTime,
        triggerConditions: [
          {
            type: TriggerType.DAYS_INACTIVE,
            threshold: 7,
            comparison: 'gte',
            met: false,
          },
        ],
        message: 'We miss you!',
        questions: [],
        suggestedActions: [],
        channel: NotificationChannel.IN_APP,
        priority: 'high',
      });

      const context: UserContext = {
        userId: 'user-1',
        daysSinceLastSession: 3,
      };

      const triggered = await scheduler.evaluateTriggers('user-1', context);
      expect(triggered.length).toBe(0);
    });

    it('should calculate urgency based on priority', async () => {
      const scheduledTime = new Date();

      await scheduler.scheduleCheckIn({
        userId: 'user-1',
        type: CheckInType.STREAK_RISK,
        scheduledTime,
        triggerConditions: [
          {
            type: TriggerType.STREAK_AT_RISK,
            threshold: 1,
            comparison: 'eq',
            met: false,
          },
        ],
        message: 'Streak at risk!',
        questions: [],
        suggestedActions: [],
        channel: NotificationChannel.PUSH,
        priority: 'high',
      });

      const context: UserContext = {
        userId: 'user-1',
        streakAtRisk: true,
      };

      const triggered = await scheduler.evaluateTriggers('user-1', context);
      expect(triggered[0].urgency).toBe('immediate');
    });
  });

  describe('executeCheckIn', () => {
    it('should execute a check-in successfully', async () => {
      const scheduledTime = new Date();

      const checkIn = await scheduler.scheduleCheckIn({
        userId: 'user-1',
        type: CheckInType.DAILY_REMINDER,
        scheduledTime,
        triggerConditions: [],
        message: 'Time to learn!',
        questions: [],
        suggestedActions: [],
        channel: NotificationChannel.IN_APP,
        priority: 'medium',
      });

      const result = await scheduler.executeCheckIn(checkIn.id);

      expect(result.success).toBe(true);
      expect(result.checkInId).toBe(checkIn.id);
      expect(result.deliveredVia).toBe(NotificationChannel.IN_APP);

      const updated = await scheduler.getCheckIn(checkIn.id);
      expect(updated?.status).toBe(CheckInStatus.SENT);
    });

    it('should throw error for non-existent check-in', async () => {
      await expect(scheduler.executeCheckIn('non-existent')).rejects.toThrow(
        'Check-in not found'
      );
    });
  });

  describe('handleResponse', () => {
    it('should handle check-in response', async () => {
      const scheduledTime = new Date();

      const checkIn = await scheduler.scheduleCheckIn({
        userId: 'user-1',
        type: CheckInType.PROGRESS_CHECK,
        scheduledTime,
        triggerConditions: [],
        message: 'How are you?',
        questions: [
          {
            id: 'q1',
            question: 'How is the difficulty?',
            type: 'single_choice' as const,
            options: ['Too easy', 'Just right', 'Too hard'],
            required: true,
            order: 1,
          },
        ],
        suggestedActions: [],
        channel: NotificationChannel.IN_APP,
        priority: 'medium',
      });

      await scheduler.handleResponse(checkIn.id, {
        checkInId: checkIn.id,
        respondedAt: new Date(),
        answers: [{ questionId: 'q1', answer: 'Just right' }],
        selectedActions: [],
      });

      const updated = await scheduler.getCheckIn(checkIn.id);
      expect(updated?.status).toBe(CheckInStatus.RESPONDED);
    });
  });

  describe('cancelCheckIn', () => {
    it('should cancel a scheduled check-in', async () => {
      const scheduledTime = new Date();

      const checkIn = await scheduler.scheduleCheckIn({
        userId: 'user-1',
        type: CheckInType.DAILY_REMINDER,
        scheduledTime,
        triggerConditions: [],
        message: 'Test',
        questions: [],
        suggestedActions: [],
        channel: NotificationChannel.IN_APP,
        priority: 'medium',
      });

      const cancelled = await scheduler.cancelCheckIn(checkIn.id);
      expect(cancelled.status).toBe(CheckInStatus.CANCELLED);
    });
  });

  describe('helper methods', () => {
    it('should create daily reminder', async () => {
      const checkIn = await scheduler.createDailyReminder(
        'user-1',
        new Date(),
        'plan-1'
      );

      expect(checkIn.type).toBe(CheckInType.DAILY_REMINDER);
      expect(checkIn.planId).toBe('plan-1');
      expect(checkIn.suggestedActions.length).toBeGreaterThan(0);
    });

    it('should create progress check', async () => {
      const checkIn = await scheduler.createProgressCheck('user-1', new Date());

      expect(checkIn.type).toBe(CheckInType.PROGRESS_CHECK);
      expect(checkIn.questions.length).toBeGreaterThan(0);
    });

    it('should create struggle check-in', async () => {
      const conditions: TriggerCondition[] = [
        {
          type: TriggerType.FRUSTRATION_DETECTED,
          threshold: 0.7,
          comparison: 'gte',
          met: true,
        },
      ];

      const checkIn = await scheduler.createStruggleCheckIn('user-1', conditions);

      expect(checkIn.type).toBe(CheckInType.STRUGGLE_DETECTION);
      expect(checkIn.priority).toBe('high');
      expect(checkIn.triggerConditions.length).toBe(1);
    });

    it('should create milestone celebration', async () => {
      const checkIn = await scheduler.createMilestoneCelebration(
        'user-1',
        'Completed Chapter 1',
        'plan-1'
      );

      expect(checkIn.type).toBe(CheckInType.MILESTONE_CELEBRATION);
      expect(checkIn.message).toContain('Completed Chapter 1');
    });

    it('should create inactivity check-in', async () => {
      const checkIn = await scheduler.createInactivityCheckIn('user-1', 7);

      expect(checkIn.type).toBe(CheckInType.INACTIVITY_REENGAGEMENT);
      expect(checkIn.message).toContain('7 days');
      expect(checkIn.priority).toBe('high');
    });

    it('should create streak risk check-in', async () => {
      const checkIn = await scheduler.createStreakRiskCheckIn('user-1', 10);

      expect(checkIn.type).toBe(CheckInType.STREAK_RISK);
      expect(checkIn.message).toContain('10-day streak');
      expect(checkIn.channel).toBe(NotificationChannel.PUSH);
    });

    it('should create weekly summary', async () => {
      const checkIn = await scheduler.createWeeklySummary('user-1', new Date());

      expect(checkIn.type).toBe(CheckInType.WEEKLY_SUMMARY);
      expect(checkIn.questions.length).toBeGreaterThan(0);
    });
  });
});

describe('TriggerEvaluator', () => {
  let evaluator: TriggerEvaluator;

  beforeEach(() => {
    evaluator = new TriggerEvaluator();
  });

  describe('evaluateCondition', () => {
    it('should evaluate greater than condition', () => {
      const condition: TriggerCondition = {
        type: TriggerType.DAYS_INACTIVE,
        threshold: 3,
        comparison: 'gt',
        met: false,
      };

      const context: UserContext = {
        userId: 'user-1',
        daysSinceLastSession: 5,
      };

      expect(evaluator.evaluateCondition(condition, context)).toBe(true);
    });

    it('should evaluate less than condition', () => {
      const condition: TriggerCondition = {
        type: TriggerType.DAYS_INACTIVE,
        threshold: 7,
        comparison: 'lt',
        met: false,
      };

      const context: UserContext = {
        userId: 'user-1',
        daysSinceLastSession: 3,
      };

      expect(evaluator.evaluateCondition(condition, context)).toBe(true);
    });

    it('should evaluate equal condition', () => {
      const condition: TriggerCondition = {
        type: TriggerType.STREAK_AT_RISK,
        threshold: 1,
        comparison: 'eq',
        met: false,
      };

      const context: UserContext = {
        userId: 'user-1',
        streakAtRisk: true,
      };

      expect(evaluator.evaluateCondition(condition, context)).toBe(true);
    });

    it('should evaluate greater than or equal condition', () => {
      const condition: TriggerCondition = {
        type: TriggerType.FRUSTRATION_DETECTED,
        threshold: 0.7,
        comparison: 'gte',
        met: false,
      };

      const context: UserContext = {
        userId: 'user-1',
        frustrationLevel: 0.7,
      };

      expect(evaluator.evaluateCondition(condition, context)).toBe(true);
    });

    it('should evaluate less than or equal condition', () => {
      const condition: TriggerCondition = {
        type: TriggerType.TIME_SINCE_LAST_SESSION,
        threshold: 5,
        comparison: 'lte',
        met: false,
      };

      const context: UserContext = {
        userId: 'user-1',
        daysSinceLastSession: 3,
      };

      expect(evaluator.evaluateCondition(condition, context)).toBe(true);
    });

    it('should return false when context value is undefined', () => {
      const condition: TriggerCondition = {
        type: TriggerType.DAYS_INACTIVE,
        threshold: 3,
        comparison: 'gt',
        met: false,
      };

      const context: UserContext = {
        userId: 'user-1',
        // daysSinceLastSession not provided
      };

      expect(evaluator.evaluateCondition(condition, context)).toBe(false);
    });
  });

  describe('evaluateAllConditions', () => {
    it('should evaluate all conditions and update met status', () => {
      const conditions: TriggerCondition[] = [
        {
          type: TriggerType.DAYS_INACTIVE,
          threshold: 3,
          comparison: 'gt',
          met: false,
        },
        {
          type: TriggerType.STREAK_AT_RISK,
          threshold: 1,
          comparison: 'eq',
          met: false,
        },
      ];

      const context: UserContext = {
        userId: 'user-1',
        daysSinceLastSession: 5,
        streakAtRisk: true,
      };

      const evaluated = evaluator.evaluateAllConditions(conditions, context);

      expect(evaluated[0].met).toBe(true);
      expect(evaluated[0].currentValue).toBe(5);
      expect(evaluated[1].met).toBe(true);
      expect(evaluated[1].currentValue).toBe(1);
    });
  });

  describe('shouldTrigger', () => {
    it('should return true if any condition is met', () => {
      const conditions: TriggerCondition[] = [
        {
          type: TriggerType.DAYS_INACTIVE,
          threshold: 10,
          comparison: 'gt',
          met: false,
        },
        {
          type: TriggerType.STREAK_AT_RISK,
          threshold: 1,
          comparison: 'eq',
          met: false,
        },
      ];

      const context: UserContext = {
        userId: 'user-1',
        daysSinceLastSession: 5, // Does not meet first condition
        streakAtRisk: true, // Meets second condition
      };

      expect(evaluator.shouldTrigger(conditions, context)).toBe(true);
    });

    it('should return true if no conditions (always trigger)', () => {
      const conditions: TriggerCondition[] = [];

      const context: UserContext = {
        userId: 'user-1',
      };

      expect(evaluator.shouldTrigger(conditions, context)).toBe(true);
    });

    it('should return false if no conditions are met', () => {
      const conditions: TriggerCondition[] = [
        {
          type: TriggerType.DAYS_INACTIVE,
          threshold: 10,
          comparison: 'gt',
          met: false,
        },
      ];

      const context: UserContext = {
        userId: 'user-1',
        daysSinceLastSession: 5,
      };

      expect(evaluator.shouldTrigger(conditions, context)).toBe(false);
    });
  });
});

describe('InMemoryCheckInStore', () => {
  let store: InMemoryCheckInStore;

  beforeEach(() => {
    store = new InMemoryCheckInStore();
  });

  it('should create and retrieve check-in', async () => {
    const checkIn = await store.create({
      userId: 'user-1',
      type: CheckInType.DAILY_REMINDER,
      scheduledTime: new Date(),
      status: CheckInStatus.SCHEDULED,
      triggerConditions: [],
      message: 'Test',
      questions: [],
      suggestedActions: [],
      channel: NotificationChannel.IN_APP,
      priority: 'medium',
    });

    const retrieved = await store.get(checkIn.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(checkIn.id);
  });

  it('should update check-in', async () => {
    const checkIn = await store.create({
      userId: 'user-1',
      type: CheckInType.DAILY_REMINDER,
      scheduledTime: new Date(),
      status: CheckInStatus.SCHEDULED,
      triggerConditions: [],
      message: 'Test',
      questions: [],
      suggestedActions: [],
      channel: NotificationChannel.IN_APP,
      priority: 'medium',
    });

    const updated = await store.update(checkIn.id, { status: CheckInStatus.SENT });
    expect(updated.status).toBe(CheckInStatus.SENT);
  });

  it('should delete check-in', async () => {
    const checkIn = await store.create({
      userId: 'user-1',
      type: CheckInType.DAILY_REMINDER,
      scheduledTime: new Date(),
      status: CheckInStatus.SCHEDULED,
      triggerConditions: [],
      message: 'Test',
      questions: [],
      suggestedActions: [],
      channel: NotificationChannel.IN_APP,
      priority: 'medium',
    });

    const deleted = await store.delete(checkIn.id);
    expect(deleted).toBe(true);

    const retrieved = await store.get(checkIn.id);
    expect(retrieved).toBeNull();
  });

  it('should record and retrieve responses', async () => {
    const checkIn = await store.create({
      userId: 'user-1',
      type: CheckInType.DAILY_REMINDER,
      scheduledTime: new Date(),
      status: CheckInStatus.SCHEDULED,
      triggerConditions: [],
      message: 'Test',
      questions: [],
      suggestedActions: [],
      channel: NotificationChannel.IN_APP,
      priority: 'medium',
    });

    await store.recordResponse(checkIn.id, {
      checkInId: checkIn.id,
      respondedAt: new Date(),
      answers: [],
      selectedActions: [],
    });

    const responses = await store.getResponses(checkIn.id);
    expect(responses.length).toBe(1);
  });
});
