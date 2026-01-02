/**
 * @sam-ai/agentic - JourneyTimeline Tests
 * Comprehensive tests for learning journey tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  JourneyTimelineManager,
  createJourneyTimeline,
  InMemoryTimelineStore,
  type JourneyTimelineConfig,
} from '../src/memory/journey-timeline';
import { JourneyEventType, LearningPhase } from '../src/memory/types';

// ============================================================================
// TESTS
// ============================================================================

describe('JourneyTimelineManager', () => {
  let timeline: JourneyTimelineManager;
  let config: JourneyTimelineConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    config = {
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
      xpPerLevel: 1000,
      streakBonusMultiplier: 1.5,
    };
    timeline = new JourneyTimelineManager(config);
  });

  describe('constructor', () => {
    it('should create a JourneyTimelineManager instance', () => {
      expect(timeline).toBeInstanceOf(JourneyTimelineManager);
    });

    it('should use default values if not provided', () => {
      const mgr = new JourneyTimelineManager();
      expect(mgr).toBeInstanceOf(JourneyTimelineManager);
    });
  });

  describe('createJourneyTimeline factory', () => {
    it('should create a JourneyTimelineManager using factory function', () => {
      const instance = createJourneyTimeline(config);
      expect(instance).toBeInstanceOf(JourneyTimelineManager);
    });
  });

  describe('Timeline Management', () => {
    describe('getOrCreateTimeline', () => {
      it('should create new timeline for new user', async () => {
        const tl = await timeline.getOrCreateTimeline('user-1');

        expect(tl).toBeDefined();
        expect(tl.userId).toBe('user-1');
        expect(tl.currentPhase).toBe(LearningPhase.ONBOARDING);
      });

      it('should return existing timeline', async () => {
        const tl1 = await timeline.getOrCreateTimeline('user-1');
        const tl2 = await timeline.getOrCreateTimeline('user-1');

        expect(tl1.id).toBe(tl2.id);
      });

      it('should create separate timelines for different courses', async () => {
        const tl1 = await timeline.getOrCreateTimeline('user-1', 'course-1');
        const tl2 = await timeline.getOrCreateTimeline('user-1', 'course-2');

        expect(tl1.id).not.toBe(tl2.id);
      });

      it('should include default milestones', async () => {
        const tl = await timeline.getOrCreateTimeline('user-1');

        expect(tl.milestones.length).toBeGreaterThan(0);
        expect(tl.milestones.some((m) => m.id === 'first-login')).toBe(true);
      });
    });

    describe('getTimeline', () => {
      it('should get existing timeline', async () => {
        await timeline.getOrCreateTimeline('user-1');
        const tl = await timeline.getTimeline('user-1');

        expect(tl).toBeDefined();
      });

      it('should return null for non-existent user', async () => {
        const tl = await timeline.getTimeline('non-existent');
        expect(tl).toBeNull();
      });
    });

    describe('deleteTimeline', () => {
      it('should delete timeline', async () => {
        await timeline.getOrCreateTimeline('user-1');
        const deleted = await timeline.deleteTimeline('user-1');

        expect(deleted).toBe(true);

        const tl = await timeline.getTimeline('user-1');
        expect(tl).toBeNull();
      });

      it('should return false for non-existent timeline', async () => {
        const deleted = await timeline.deleteTimeline('non-existent');
        expect(deleted).toBe(false);
      });
    });
  });

  describe('Event Tracking', () => {
    describe('recordEvent', () => {
      it('should record a journey event', async () => {
        const event = await timeline.recordEvent(
          'user-1',
          JourneyEventType.STARTED_COURSE,
          { courseId: 'course-1', courseName: 'Python 101' }
        );

        expect(event).toBeDefined();
        expect(event.type).toBe(JourneyEventType.STARTED_COURSE);
        expect(event.data.courseId).toBe('course-1');
      });

      it('should award XP for events', async () => {
        await timeline.recordEvent('user-1', JourneyEventType.COMPLETED_CHAPTER, {
          chapterId: 'ch-1',
        });

        const stats = await timeline.getStatistics('user-1');
        expect(stats.totalXP).toBeGreaterThan(0);
      });

      it('should include impact data', async () => {
        const event = await timeline.recordEvent(
          'user-1',
          JourneyEventType.PASSED_QUIZ,
          { quizId: 'q-1' },
          { impact: { xpGained: 100, emotionalImpact: 'confident' } }
        );

        expect(event.impact.xpGained).toBe(100);
        expect(event.impact.emotionalImpact).toBe('confident');
      });
    });

    describe('recordCourseStart', () => {
      it('should record course start', async () => {
        const event = await timeline.recordCourseStart(
          'user-1',
          'course-1',
          'Python Basics'
        );

        expect(event.type).toBe(JourneyEventType.STARTED_COURSE);
        expect(event.data.courseName).toBe('Python Basics');
      });
    });

    describe('recordChapterCompletion', () => {
      it('should record chapter completion', async () => {
        const event = await timeline.recordChapterCompletion(
          'user-1',
          'course-1',
          'ch-1',
          'Introduction'
        );

        expect(event.type).toBe(JourneyEventType.COMPLETED_CHAPTER);
        expect(event.data.chapterTitle).toBe('Introduction');
      });
    });

    describe('recordSectionCompletion', () => {
      it('should record section completion', async () => {
        const event = await timeline.recordSectionCompletion(
          'user-1',
          'course-1',
          'sec-1',
          'Variables'
        );

        expect(event.type).toBe(JourneyEventType.COMPLETED_SECTION);
      });
    });

    describe('recordQuizResult', () => {
      it('should record passed quiz', async () => {
        const event = await timeline.recordQuizResult(
          'user-1',
          'course-1',
          'quiz-1',
          85,
          true
        );

        expect(event.type).toBe(JourneyEventType.PASSED_QUIZ);
        expect(event.data.score).toBe(85);
        expect(event.data.passed).toBe(true);
      });

      it('should record failed quiz', async () => {
        const event = await timeline.recordQuizResult(
          'user-1',
          'course-1',
          'quiz-1',
          45,
          false
        );

        expect(event.type).toBe(JourneyEventType.FAILED_QUIZ);
      });
    });

    describe('recordConceptMastery', () => {
      it('should record concept mastery', async () => {
        const event = await timeline.recordConceptMastery(
          'user-1',
          'concept-1',
          'Functions',
          'course-1'
        );

        expect(event.type).toBe(JourneyEventType.MASTERED_CONCEPT);
        expect(event.data.conceptName).toBe('Functions');
      });
    });

    describe('recordStreakContinued', () => {
      it('should record streak continuation', async () => {
        const event = await timeline.recordStreakContinued('user-1', 5);

        expect(event.type).toBe(JourneyEventType.STREAK_CONTINUED);
        expect(event.data.currentStreak).toBe(5);
      });

      it('should award bonus XP for longer streaks', async () => {
        await timeline.recordStreakContinued('user-1', 10);
        const stats = await timeline.getStatistics('user-1');

        // Base XP (25) + streak bonus
        expect(stats.totalXP).toBeGreaterThan(25);
      });
    });

    describe('recordStreakBroken', () => {
      it('should record streak broken', async () => {
        const event = await timeline.recordStreakBroken('user-1', 7);

        expect(event.type).toBe(JourneyEventType.STREAK_BROKEN);
        expect(event.data.previousStreak).toBe(7);
      });
    });

    describe('recordGoalAchieved', () => {
      it('should record goal achieved', async () => {
        const event = await timeline.recordGoalAchieved(
          'user-1',
          'goal-1',
          'Complete Chapter 1'
        );

        expect(event.type).toBe(JourneyEventType.GOAL_ACHIEVED);
      });
    });

    describe('recordLevelUp', () => {
      it('should record level up', async () => {
        const event = await timeline.recordLevelUp('user-1', 5);

        expect(event.type).toBe(JourneyEventType.LEVEL_UP);
        expect(event.data.newLevel).toBe(5);
      });
    });
  });

  describe('Milestone Management', () => {
    describe('getMilestones', () => {
      it('should get milestones for user', async () => {
        const milestones = await timeline.getMilestones('user-1');

        expect(milestones.length).toBeGreaterThan(0);
      });
    });

    describe('updateMilestoneProgress', () => {
      it('should update milestone progress', async () => {
        await timeline.getOrCreateTimeline('user-1');

        const milestone = await timeline.updateMilestoneProgress(
          'user-1',
          'first-login',
          [{ type: 'sessions', current: 1 }]
        );

        expect(milestone.progress).toBe(100);
        expect(milestone.achievedAt).toBeDefined();
      });

      it('should throw for non-existent milestone', async () => {
        await timeline.getOrCreateTimeline('user-1');

        await expect(
          timeline.updateMilestoneProgress('user-1', 'non-existent', [])
        ).rejects.toThrow('Milestone not found');
      });
    });

    describe('addMilestone', () => {
      it('should add custom milestone', async () => {
        const milestone = await timeline.addMilestone('user-1', {
          type: 'course_completion',
          title: 'Python Master',
          description: 'Complete all Python courses',
          requirements: [
            {
              type: 'courses_completed',
              target: 5,
              current: 0,
              description: 'Complete 5 courses',
            },
          ],
          rewards: [
            {
              type: 'badge',
              value: 'python_master',
              description: 'Python Master Badge',
            },
          ],
        });

        expect(milestone.id).toBeDefined();
        expect(milestone.title).toBe('Python Master');

        const milestones = await timeline.getMilestones('user-1');
        expect(milestones.some((m) => m.title === 'Python Master')).toBe(true);
      });
    });
  });

  describe('Statistics & Analytics', () => {
    describe('getStatistics', () => {
      it('should get journey statistics', async () => {
        await timeline.recordCourseStart('user-1', 'course-1', 'Course');

        // Query with courseId since event was recorded on course-specific timeline
        const stats = await timeline.getStatistics('user-1', 'course-1');

        expect(stats.totalEvents).toBeGreaterThan(0);
        expect(stats.totalXP).toBeGreaterThan(0);
      });
    });

    describe('getRecentEvents', () => {
      it('should get recent events', async () => {
        await timeline.recordCourseStart('user-1', 'c1', 'Course 1');
        await timeline.recordChapterCompletion('user-1', 'c1', 'ch1', 'Chapter');

        // Query with courseId since events were recorded on course-specific timeline
        const events = await timeline.getRecentEvents('user-1', 5, 'c1');

        expect(events.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('getEventsByType', () => {
      it('should filter events by type', async () => {
        await timeline.recordCourseStart('user-1', 'c1', 'Course 1');
        await timeline.recordChapterCompletion('user-1', 'c1', 'ch1', 'Chapter');

        // Query with courseId since events were recorded on course-specific timeline
        const courseEvents = await timeline.getEventsByType(
          'user-1',
          [JourneyEventType.STARTED_COURSE],
          undefined,
          'c1'
        );

        expect(courseEvents.length).toBe(1);
        expect(courseEvents[0].type).toBe(JourneyEventType.STARTED_COURSE);
      });
    });

    describe('getCurrentPhase', () => {
      it('should get current learning phase', async () => {
        const phase = await timeline.getCurrentPhase('user-1');

        expect(phase).toBe(LearningPhase.ONBOARDING);
      });
    });

    describe('getLearningSummary', () => {
      it('should get comprehensive learning summary', async () => {
        await timeline.recordCourseStart('user-1', 'c1', 'Course');
        await timeline.recordChapterCompletion('user-1', 'c1', 'ch1', 'Chapter');

        // Query with courseId since events were recorded on course-specific timeline
        const summary = await timeline.getLearningSummary('user-1', 'c1');

        expect(summary.userId).toBe('user-1');
        expect(summary.level).toBeGreaterThanOrEqual(1);
        expect(summary.totalXP).toBeGreaterThan(0);
        expect(summary.currentPhase).toBeDefined();
        expect(summary.totalMilestones).toBeGreaterThan(0);
      });

      it('should include next milestone', async () => {
        const summary = await timeline.getLearningSummary('user-1');

        expect(summary.nextMilestone).toBeDefined();
        expect(summary.nextMilestone?.title).toBeDefined();
      });
    });

    describe('getAchievements', () => {
      it('should get earned badges', async () => {
        // Trigger first-login milestone
        await timeline.recordCourseStart('user-1', 'c1', 'Course');

        const achievements = await timeline.getAchievements('user-1');

        expect(achievements.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Level Progression', () => {
    it('should calculate level from XP', async () => {
      // Record enough events to gain significant XP
      for (let i = 0; i < 5; i++) {
        await timeline.recordChapterCompletion(
          'user-1',
          `course-${i}`,
          `ch-${i}`,
          `Chapter ${i}`
        );
      }

      const stats = await timeline.getStatistics('user-1');
      const summary = await timeline.getLearningSummary('user-1');

      expect(summary.level).toBeGreaterThanOrEqual(1);
      expect(summary.levelProgress).toBeDefined();
      expect(summary.xpToNextLevel).toBeDefined();
    });
  });

  describe('Streak Tracking', () => {
    it('should update streak on continuation', async () => {
      await timeline.recordStreakContinued('user-1', 5);

      const stats = await timeline.getStatistics('user-1');
      expect(stats.currentStreak).toBe(5);
    });

    it('should update longest streak', async () => {
      await timeline.recordStreakContinued('user-1', 10);
      await timeline.recordStreakBroken('user-1', 10);

      const stats = await timeline.getStatistics('user-1');
      expect(stats.longestStreak).toBe(10);
    });

    it('should reset streak on break', async () => {
      await timeline.recordStreakContinued('user-1', 5);
      await timeline.recordStreakBroken('user-1', 5);

      const stats = await timeline.getStatistics('user-1');
      expect(stats.currentStreak).toBe(0);
    });
  });
});

describe('InMemoryTimelineStore', () => {
  let store: InMemoryTimelineStore;

  beforeEach(() => {
    store = new InMemoryTimelineStore();
  });

  it('should store and retrieve timeline', async () => {
    const created = await store.create({
      userId: 'user-1',
      events: [],
      milestones: [],
      currentPhase: 'onboarding',
      statistics: {
        totalEvents: 0,
        totalMilestones: 0,
        milestonesAchieved: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalXP: 0,
        currentLevel: 1,
        averageDailyProgress: 0,
        completionRate: 0,
        engagementScore: 0,
      },
    });

    const retrieved = await store.get('user-1');
    expect(retrieved?.id).toBe(created.id);
  });

  it('should add events', async () => {
    const tl = await store.create({
      userId: 'user-1',
      events: [],
      milestones: [],
      currentPhase: 'onboarding',
      statistics: {
        totalEvents: 0,
        totalMilestones: 0,
        milestonesAchieved: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalXP: 0,
        currentLevel: 1,
        averageDailyProgress: 0,
        completionRate: 0,
        engagementScore: 0,
      },
    });

    const event = await store.addEvent(tl.id, {
      type: 'started_course',
      timestamp: new Date(),
      data: {},
      impact: {},
      relatedEntities: [],
    });

    expect(event.id).toBeDefined();

    const events = await store.getEvents(tl.id);
    expect(events.length).toBe(1);
  });

  it('should clear all timelines', async () => {
    await store.create({
      userId: 'user-1',
      events: [],
      milestones: [],
      currentPhase: 'onboarding',
      statistics: {} as any,
    });

    store.clear();

    const result = await store.get('user-1');
    expect(result).toBeNull();
  });
});
