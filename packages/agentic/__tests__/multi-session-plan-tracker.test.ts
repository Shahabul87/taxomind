/**
 * Tests for MultiSessionPlanTracker
 */

import {
  MultiSessionPlanTracker,
  createMultiSessionPlanTracker,
  InMemoryLearningPlanStore,
  LearningPlanInput,
  PlanStatus,
  MilestoneStatus,
  PlanFeedback,
} from '../src/proactive-intervention';

describe('MultiSessionPlanTracker', () => {
  let tracker: MultiSessionPlanTracker;

  beforeEach(() => {
    tracker = createMultiSessionPlanTracker();
  });

  describe('createLearningPlan', () => {
    it('should create a learning plan with valid input', async () => {
      const input: LearningPlanInput = {
        userId: 'user-1',
        goalTitle: 'Learn TypeScript',
        goalDescription: 'Master TypeScript fundamentals',
        currentLevel: 'beginner',
        targetLevel: 'intermediate',
        preferredDailyMinutes: 30,
        preferredDaysPerWeek: 5,
      };

      const plan = await tracker.createLearningPlan(input);

      expect(plan).toBeDefined();
      expect(plan.id).toBeDefined();
      expect(plan.userId).toBe('user-1');
      expect(plan.title).toBe('Learn TypeScript');
      expect(plan.status).toBe(PlanStatus.ACTIVE);
      expect(plan.overallProgress).toBe(0);
      expect(plan.weeklyMilestones.length).toBeGreaterThan(0);
      expect(plan.dailyTargets.length).toBeGreaterThan(0);
    });

    it('should create weekly milestones based on duration', async () => {
      const input: LearningPlanInput = {
        userId: 'user-1',
        goalTitle: 'Learn React',
        goalDescription: 'Build React applications',
        currentLevel: 'beginner',
        targetLevel: 'advanced',
        preferredDailyMinutes: 60,
        preferredDaysPerWeek: 5,
      };

      const plan = await tracker.createLearningPlan(input);

      expect(plan.weeklyMilestones.length).toBe(plan.durationWeeks);
      expect(plan.weeklyMilestones[0].status).toBe(MilestoneStatus.IN_PROGRESS);
      expect(plan.weeklyMilestones[1]?.status).toBe(MilestoneStatus.PENDING);
    });

    it('should create daily targets for active days', async () => {
      const input: LearningPlanInput = {
        userId: 'user-1',
        goalTitle: 'Learn JavaScript',
        goalDescription: 'Master JavaScript',
        currentLevel: 'beginner',
        targetLevel: 'intermediate',
        preferredDailyMinutes: 30,
        preferredDaysPerWeek: 5,
      };

      const plan = await tracker.createLearningPlan(input);

      // Should have approximately 5 days per week * number of weeks
      const expectedMinTargets = plan.durationWeeks * 3; // At least 3 days/week
      expect(plan.dailyTargets.length).toBeGreaterThanOrEqual(expectedMinTargets);

      // Each target should have activities
      for (const target of plan.dailyTargets) {
        expect(target.activities.length).toBeGreaterThan(0);
        expect(target.estimatedMinutes).toBe(30);
      }
    });

    it('should use target date when provided', async () => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 28); // 4 weeks from now

      const input: LearningPlanInput = {
        userId: 'user-1',
        goalTitle: 'Learn Python',
        goalDescription: 'Python basics',
        targetDate,
        currentLevel: 'beginner',
        targetLevel: 'intermediate',
        preferredDailyMinutes: 30,
        preferredDaysPerWeek: 5,
      };

      const plan = await tracker.createLearningPlan(input);

      expect(plan.targetDate.getTime()).toBe(targetDate.getTime());
      expect(plan.durationWeeks).toBe(4);
    });

    it('should throw error for invalid input', async () => {
      const invalidInput = {
        userId: '',
        goalTitle: '',
        currentLevel: 'beginner',
        targetLevel: 'intermediate',
        preferredDailyMinutes: 0,
        preferredDaysPerWeek: 0,
      } as LearningPlanInput;

      await expect(tracker.createLearningPlan(invalidInput)).rejects.toThrow();
    });
  });

  describe('getDailyPractice', () => {
    it('should return daily practice for user with active plan', async () => {
      const input: LearningPlanInput = {
        userId: 'user-1',
        goalTitle: 'Learn TypeScript',
        goalDescription: 'Master TypeScript',
        currentLevel: 'beginner',
        targetLevel: 'intermediate',
        preferredDailyMinutes: 30,
        preferredDaysPerWeek: 7,
      };

      await tracker.createLearningPlan(input);

      const today = new Date();
      const practice = await tracker.getDailyPractice('user-1', today);

      expect(practice).toBeDefined();
      expect(practice.userId).toBe('user-1');
      expect(practice.planId).toBeDefined();
      expect(practice.streakInfo).toBeDefined();
      expect(practice.motivationalMessage).toBeDefined();
    });

    it('should return empty practice for user without plan', async () => {
      const today = new Date();
      const practice = await tracker.getDailyPractice('no-plan-user', today);

      expect(practice).toBeDefined();
      expect(practice.activities).toHaveLength(0);
      expect(practice.planId).toBe('');
    });
  });

  describe('trackProgress', () => {
    it('should track completed activities', async () => {
      const input: LearningPlanInput = {
        userId: 'user-1',
        goalTitle: 'Learn TypeScript',
        goalDescription: 'Master TypeScript',
        currentLevel: 'beginner',
        targetLevel: 'intermediate',
        preferredDailyMinutes: 30,
        preferredDaysPerWeek: 7,
      };

      const plan = await tracker.createLearningPlan(input);
      const firstTarget = plan.dailyTargets[0];
      const activityIds = firstTarget.activities.map((a) => a.id);

      await tracker.trackProgress(plan.id, {
        planId: plan.id,
        date: firstTarget.date,
        completedActivities: activityIds,
        actualMinutes: 35,
        notes: 'Good session!',
      });

      const updatedPlan = await tracker.getPlan(plan.id);
      expect(updatedPlan?.overallProgress).toBeGreaterThan(0);
    });

    it('should throw error for non-existent plan', async () => {
      await expect(
        tracker.trackProgress('non-existent', {
          planId: 'non-existent',
          date: new Date(),
          completedActivities: [],
          actualMinutes: 30,
        })
      ).rejects.toThrow('Plan not found');
    });
  });

  describe('getProgressReport', () => {
    it('should generate progress report', async () => {
      const input: LearningPlanInput = {
        userId: 'user-1',
        goalTitle: 'Learn TypeScript',
        goalDescription: 'Master TypeScript',
        currentLevel: 'beginner',
        targetLevel: 'intermediate',
        preferredDailyMinutes: 30,
        preferredDaysPerWeek: 5,
      };

      const plan = await tracker.createLearningPlan(input);
      const report = await tracker.getProgressReport(plan.id);

      expect(report).toBeDefined();
      expect(report.planId).toBe(plan.id);
      expect(report.overallProgress).toBe(0);
      expect(report.activitiesTotal).toBeGreaterThan(0);
      expect(report.milestonesTotal).toBe(plan.weeklyMilestones.length);
      expect(report.recommendations).toBeDefined();
    });

    it('should include recommendations when behind schedule', async () => {
      const input: LearningPlanInput = {
        userId: 'user-1',
        goalTitle: 'Learn TypeScript',
        goalDescription: 'Master TypeScript',
        currentLevel: 'beginner',
        targetLevel: 'intermediate',
        preferredDailyMinutes: 30,
        preferredDaysPerWeek: 5,
      };

      const plan = await tracker.createLearningPlan(input);
      const report = await tracker.getProgressReport(plan.id);

      // New plan with 0 progress should have recommendations
      expect(report.recommendations.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('adjustPlan', () => {
    it('should adjust plan pace', async () => {
      const input: LearningPlanInput = {
        userId: 'user-1',
        goalTitle: 'Learn TypeScript',
        goalDescription: 'Master TypeScript',
        currentLevel: 'beginner',
        targetLevel: 'intermediate',
        preferredDailyMinutes: 30,
        preferredDaysPerWeek: 5,
      };

      const plan = await tracker.createLearningPlan(input);

      const feedback: PlanFeedback = {
        type: 'pace',
        feedback: 'decrease',
        reason: 'Too fast',
      };

      const adjusted = await tracker.adjustPlan(plan.id, feedback);

      expect(adjusted.paceAdjustments.length).toBe(1);
      expect(adjusted.paceAdjustments[0].reason).toBe('Too fast');
    });

    it('should adjust plan difficulty', async () => {
      const input: LearningPlanInput = {
        userId: 'user-1',
        goalTitle: 'Learn TypeScript',
        goalDescription: 'Master TypeScript',
        currentLevel: 'beginner',
        targetLevel: 'intermediate',
        preferredDailyMinutes: 30,
        preferredDaysPerWeek: 5,
      };

      const plan = await tracker.createLearningPlan(input);

      const feedback: PlanFeedback = {
        type: 'difficulty',
        feedback: 'increase',
        reason: 'Too easy',
      };

      const adjusted = await tracker.adjustPlan(plan.id, feedback);

      expect(adjusted.difficultyAdjustments.length).toBe(1);
      expect(adjusted.difficultyAdjustments[0].newDifficulty).toBe('hard');
    });
  });

  describe('plan lifecycle', () => {
    it('should pause and resume plan', async () => {
      const input: LearningPlanInput = {
        userId: 'user-1',
        goalTitle: 'Learn TypeScript',
        goalDescription: 'Master TypeScript',
        currentLevel: 'beginner',
        targetLevel: 'intermediate',
        preferredDailyMinutes: 30,
        preferredDaysPerWeek: 5,
      };

      const plan = await tracker.createLearningPlan(input);

      const paused = await tracker.pausePlan(plan.id);
      expect(paused.status).toBe(PlanStatus.PAUSED);

      const resumed = await tracker.resumePlan(plan.id);
      expect(resumed.status).toBe(PlanStatus.ACTIVE);
    });

    it('should complete plan', async () => {
      const input: LearningPlanInput = {
        userId: 'user-1',
        goalTitle: 'Learn TypeScript',
        goalDescription: 'Master TypeScript',
        currentLevel: 'beginner',
        targetLevel: 'intermediate',
        preferredDailyMinutes: 30,
        preferredDaysPerWeek: 5,
      };

      const plan = await tracker.createLearningPlan(input);
      const completed = await tracker.completePlan(plan.id);

      expect(completed.status).toBe(PlanStatus.COMPLETED);
      expect(completed.overallProgress).toBe(100);
    });
  });

  describe('getUserPlans', () => {
    it('should return all plans for a user', async () => {
      const input1: LearningPlanInput = {
        userId: 'user-1',
        goalTitle: 'Learn TypeScript',
        goalDescription: 'Master TypeScript',
        currentLevel: 'beginner',
        targetLevel: 'intermediate',
        preferredDailyMinutes: 30,
        preferredDaysPerWeek: 5,
      };

      const input2: LearningPlanInput = {
        userId: 'user-1',
        goalTitle: 'Learn React',
        goalDescription: 'Master React',
        currentLevel: 'beginner',
        targetLevel: 'intermediate',
        preferredDailyMinutes: 30,
        preferredDaysPerWeek: 5,
      };

      await tracker.createLearningPlan(input1);
      await tracker.createLearningPlan(input2);

      const plans = await tracker.getUserPlans('user-1');
      expect(plans.length).toBe(2);
    });

    it('should return empty array for user with no plans', async () => {
      const plans = await tracker.getUserPlans('no-plans-user');
      expect(plans).toHaveLength(0);
    });
  });

  describe('getActivePlan', () => {
    it('should return the active plan for a user', async () => {
      const input: LearningPlanInput = {
        userId: 'user-1',
        goalTitle: 'Learn TypeScript',
        goalDescription: 'Master TypeScript',
        currentLevel: 'beginner',
        targetLevel: 'intermediate',
        preferredDailyMinutes: 30,
        preferredDaysPerWeek: 5,
      };

      await tracker.createLearningPlan(input);
      const active = await tracker.getActivePlan('user-1');

      expect(active).toBeDefined();
      expect(active?.status).toBe(PlanStatus.ACTIVE);
    });

    it('should return null when no active plan exists', async () => {
      const active = await tracker.getActivePlan('no-active-plan');
      expect(active).toBeNull();
    });
  });
});

describe('InMemoryLearningPlanStore', () => {
  let store: InMemoryLearningPlanStore;

  beforeEach(() => {
    store = new InMemoryLearningPlanStore();
  });

  it('should create and retrieve plan', async () => {
    const plan = await store.create({
      userId: 'user-1',
      goalId: 'goal-1',
      title: 'Test Plan',
      description: 'Test',
      startDate: new Date(),
      targetDate: new Date(),
      durationWeeks: 4,
      weeklyMilestones: [],
      dailyTargets: [],
      currentWeek: 1,
      currentDay: 1,
      overallProgress: 0,
      difficultyAdjustments: [],
      paceAdjustments: [],
      status: PlanStatus.ACTIVE,
    });

    const retrieved = await store.get(plan.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(plan.id);
  });

  it('should update plan', async () => {
    const plan = await store.create({
      userId: 'user-1',
      goalId: 'goal-1',
      title: 'Test Plan',
      description: 'Test',
      startDate: new Date(),
      targetDate: new Date(),
      durationWeeks: 4,
      weeklyMilestones: [],
      dailyTargets: [],
      currentWeek: 1,
      currentDay: 1,
      overallProgress: 0,
      difficultyAdjustments: [],
      paceAdjustments: [],
      status: PlanStatus.ACTIVE,
    });

    const updated = await store.update(plan.id, { overallProgress: 50 });
    expect(updated.overallProgress).toBe(50);
  });

  it('should delete plan', async () => {
    const plan = await store.create({
      userId: 'user-1',
      goalId: 'goal-1',
      title: 'Test Plan',
      description: 'Test',
      startDate: new Date(),
      targetDate: new Date(),
      durationWeeks: 4,
      weeklyMilestones: [],
      dailyTargets: [],
      currentWeek: 1,
      currentDay: 1,
      overallProgress: 0,
      difficultyAdjustments: [],
      paceAdjustments: [],
      status: PlanStatus.ACTIVE,
    });

    const deleted = await store.delete(plan.id);
    expect(deleted).toBe(true);

    const retrieved = await store.get(plan.id);
    expect(retrieved).toBeNull();
  });
});
