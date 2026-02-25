/**
 * Tests for lib/sam/gamification.ts
 *
 * Verifies GamificationEngine, XP awards, leveling, streaks,
 * achievements, and createGamificationHooks.
 */

import {
  GamificationEngine,
  createGamificationEngine,
  createGamificationHooks,
  XP_VALUES,
  LEVELS,
  ACHIEVEMENTS_CONFIG,
  type UserProgress,
} from '@/lib/sam/gamification';

describe('GamificationEngine', () => {
  let engine: GamificationEngine;

  beforeEach(() => {
    engine = new GamificationEngine('user-1');
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const progress = engine.getProgress();
      expect(progress.userId).toBe('user-1');
      expect(progress.xp).toBe(0);
      expect(progress.level).toBe(1);
      expect(progress.streak).toBe(0);
    });

    it('should accept initial progress', () => {
      const custom = new GamificationEngine('user-2', { xp: 500, level: 4 });
      const progress = custom.getProgress();
      expect(progress.xp).toBe(500);
      expect(progress.level).toBe(4);
    });
  });

  describe('awardXP', () => {
    it('should add XP for a question asked event', () => {
      const event = engine.awardXP('question_asked');
      expect(event.amount).toBe(XP_VALUES.question_asked);
      expect(engine.getProgress().xp).toBe(XP_VALUES.question_asked);
    });

    it('should trigger level up when XP threshold is crossed', () => {
      const events: string[] = [];
      engine.subscribe((evt) => events.push(evt.type));

      // Award enough XP to reach level 2 (100 XP)
      const needed = LEVELS[1].minXP;
      while (engine.getProgress().xp < needed) {
        engine.awardXP('course_completed');
      }
      expect(events).toContain('level_up');
    });

    it('should update stats for relevant event types', () => {
      engine.awardXP('question_asked');
      expect(engine.getProgress().stats.totalQuestions).toBe(1);

      engine.awardXP('question_answered');
      expect(engine.getProgress().stats.correctAnswers).toBe(1);

      engine.awardXP('quiz_completed');
      expect(engine.getProgress().stats.quizzesTaken).toBe(1);

      engine.awardXP('section_completed');
      expect(engine.getProgress().stats.sectionsCompleted).toBe(1);
    });

    it('should unlock first_question achievement on first question', () => {
      engine.awardXP('question_asked');
      const achievements = engine.getProgress().achievements;
      expect(achievements.some((a) => a.id === 'first_question')).toBe(true);
    });
  });

  describe('checkStreak', () => {
    it('should maintain streak on same day', () => {
      const result = engine.checkStreak();
      expect(result.maintained).toBe(true);
      expect(result.streak).toBe(0);
    });

    it('should break streak after missing a day', () => {
      // Set lastActiveDate to 2 days ago
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const engine2 = new GamificationEngine('user-2', {
        lastActiveDate: twoDaysAgo.toISOString().split('T')[0],
        streak: 5,
      });
      const result = engine2.checkStreak();
      expect(result.maintained).toBe(false);
      expect(result.streak).toBe(1);
    });
  });

  describe('getCurrentLevelInfo', () => {
    it('should return correct level info', () => {
      const info = engine.getCurrentLevelInfo();
      expect(info.level).toBe(1);
      expect(info.name).toBe('Novice Learner');
    });
  });

  describe('getXPToNextLevel', () => {
    it('should return correct XP progress', () => {
      const xpInfo = engine.getXPToNextLevel();
      expect(xpInfo.current).toBe(0);
      expect(xpInfo.needed).toBe(100);
      expect(xpInfo.percentage).toBe(0);
    });
  });

  describe('getPendingXP', () => {
    it('should return pending events and clear them', () => {
      engine.awardXP('question_asked');
      engine.awardXP('daily_login');
      const pending = engine.getPendingXP();
      expect(pending).toHaveLength(2);
      expect(engine.getPendingXP()).toHaveLength(0);
    });
  });

  describe('subscribe', () => {
    it('should emit events to subscribers', () => {
      const events: string[] = [];
      engine.subscribe((evt) => events.push(evt.type));
      engine.awardXP('question_asked');
      expect(events).toContain('xp_gained');
    });

    it('should allow unsubscribing', () => {
      const events: string[] = [];
      const unsub = engine.subscribe((evt) => events.push(evt.type));
      unsub();
      engine.awardXP('question_asked');
      expect(events).toHaveLength(0);
    });
  });
});

describe('createGamificationEngine', () => {
  it('should create a new engine instance', () => {
    const engine = createGamificationEngine('user-1');
    expect(engine).toBeInstanceOf(GamificationEngine);
  });
});

describe('createGamificationHooks', () => {
  let engine: GamificationEngine;
  let hooks: ReturnType<typeof createGamificationHooks>;

  beforeEach(() => {
    engine = new GamificationEngine('user-1');
    hooks = createGamificationHooks(engine);
  });

  it('should provide onQuestionAsked hook', () => {
    hooks.onQuestionAsked();
    expect(engine.getProgress().stats.totalQuestions).toBe(1);
  });

  it('should provide onQuizComplete hook', () => {
    hooks.onQuizComplete(5, 5);
    const progress = engine.getProgress();
    expect(progress.stats.quizzesTaken).toBe(1);
    // Perfect score awards quiz_perfect too
    expect(progress.xp).toBe(XP_VALUES.quiz_completed + XP_VALUES.quiz_perfect);
  });

  it('should provide practice session hooks', () => {
    hooks.onPracticeSessionComplete({
      sessionType: 'DELIBERATE',
      focusLevel: 'DEEP_FLOW',
      rawHours: 1,
      qualityHours: 0.8,
    });
    const stats = engine.getProgress().stats;
    expect(stats.practiceSessionsCompleted).toBe(1);
    expect(stats.practiceDeliberateSessions).toBe(1);
    expect(stats.practiceDeepFlowSessions).toBe(1);
  });

  it('should provide onPracticeMilestone hook', () => {
    hooks.onPracticeMilestone(100, 'Python');
    expect(engine.getProgress().xp).toBeGreaterThan(0);
  });

  it('should return progress from getProgress hook', () => {
    const progress = hooks.getProgress();
    expect(progress.userId).toBe('user-1');
  });
});

describe('XP_VALUES', () => {
  it('should have positive values for all event types', () => {
    for (const [key, value] of Object.entries(XP_VALUES)) {
      expect(value).toBeGreaterThan(0);
    }
  });
});

describe('LEVELS', () => {
  it('should have 10 levels', () => {
    expect(LEVELS).toHaveLength(10);
  });

  it('should have ascending minXP values', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].minXP).toBeGreaterThan(LEVELS[i - 1].minXP);
    }
  });
});
