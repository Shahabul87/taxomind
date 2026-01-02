/**
 * @sam-ai/agentic - CrossSessionContext Tests
 * Comprehensive tests for session continuity and context management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CrossSessionContext,
  createCrossSessionContext,
  InMemoryContextStore,
  type CrossSessionContextConfig,
} from '../src/memory/cross-session-context';
import {
  EmotionalState,
  LearningStyle,
  ContentType,
  ContextAction,
} from '../src/memory/types';

// ============================================================================
// TESTS
// ============================================================================

describe('CrossSessionContext', () => {
  let context: CrossSessionContext;
  let config: CrossSessionContextConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    config = {
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
      maxHistoryEntries: 100,
      defaultSessionLength: 30,
    };
    context = new CrossSessionContext(config);
  });

  describe('constructor', () => {
    it('should create a CrossSessionContext instance', () => {
      expect(context).toBeInstanceOf(CrossSessionContext);
    });

    it('should use default values if not provided', () => {
      const ctx = new CrossSessionContext();
      expect(ctx).toBeInstanceOf(CrossSessionContext);
    });
  });

  describe('createCrossSessionContext factory', () => {
    it('should create a CrossSessionContext using factory function', () => {
      const instance = createCrossSessionContext(config);
      expect(instance).toBeInstanceOf(CrossSessionContext);
    });
  });

  describe('Session Management', () => {
    describe('getOrCreateContext', () => {
      it('should create new context for new user', async () => {
        const ctx = await context.getOrCreateContext('user-1');

        expect(ctx).toBeDefined();
        expect(ctx.userId).toBe('user-1');
        expect(ctx.currentState.sessionCount).toBe(0);
      });

      it('should return existing context', async () => {
        const ctx1 = await context.getOrCreateContext('user-1');
        const ctx2 = await context.getOrCreateContext('user-1');

        expect(ctx1.id).toBe(ctx2.id);
      });

      it('should create separate contexts for different courses', async () => {
        const ctx1 = await context.getOrCreateContext('user-1', 'course-1');
        const ctx2 = await context.getOrCreateContext('user-1', 'course-2');

        expect(ctx1.id).not.toBe(ctx2.id);
        expect(ctx1.courseId).toBe('course-1');
        expect(ctx2.courseId).toBe('course-2');
      });
    });

    describe('startSession', () => {
      it('should increment session count', async () => {
        await context.startSession('user-1');
        const ctx = await context.getOrCreateContext('user-1');

        expect(ctx.currentState.sessionCount).toBe(1);
      });

      it('should add history entry', async () => {
        await context.startSession('user-1', undefined, 'session-123');
        const history = await context.getRecentHistory('user-1');

        expect(history.length).toBeGreaterThan(0);
        expect(history[0].action).toBe('session_start');
      });
    });

    describe('endSession', () => {
      it('should add history entry for session end', async () => {
        await context.startSession('user-1');
        await context.endSession('user-1', undefined, { duration: 30 });

        const history = await context.getRecentHistory('user-1');
        const endEntry = history.find((h) => h.action === 'session_end');

        expect(endEntry).toBeDefined();
        expect(endEntry?.data.duration).toBe(30);
      });

      it('should update average session duration', async () => {
        await context.startSession('user-1');
        await context.endSession('user-1', undefined, { duration: 60 });

        const ctx = await context.getOrCreateContext('user-1');
        expect(ctx.insights.totalLearningTime).toBe(60);
      });
    });
  });

  describe('Context State Management', () => {
    describe('setCurrentTopic', () => {
      it('should set current topic', async () => {
        await context.setCurrentTopic('user-1', 'Machine Learning');
        const ctx = await context.getOrCreateContext('user-1');

        expect(ctx.currentState.currentTopic).toBe('Machine Learning');
      });

      it('should add to recent concepts', async () => {
        await context.setCurrentTopic('user-1', 'ML');
        const ctx = await context.getOrCreateContext('user-1');

        expect(ctx.currentState.recentConcepts).toContain('ML');
      });

      it('should add history entry', async () => {
        await context.setCurrentTopic('user-1', 'NLP');
        const history = await context.getRecentHistory('user-1');

        expect(history[0].action).toBe('topic_change');
      });
    });

    describe('setCurrentGoal', () => {
      it('should set current goal', async () => {
        await context.setCurrentGoal('user-1', 'Master Python');
        const ctx = await context.getOrCreateContext('user-1');

        expect(ctx.currentState.currentGoal).toBe('Master Python');
      });

      it('should add history entry', async () => {
        await context.setCurrentGoal('user-1', 'Learn React');
        const history = await context.getRecentHistory('user-1');

        expect(history[0].action).toBe('goal_set');
      });
    });

    describe('completeGoal', () => {
      it('should clear current goal', async () => {
        await context.setCurrentGoal('user-1', 'Complete Chapter 1');
        await context.completeGoal('user-1');

        const ctx = await context.getOrCreateContext('user-1');
        expect(ctx.currentState.currentGoal).toBeUndefined();
      });

      it('should add history entry', async () => {
        await context.setCurrentGoal('user-1', 'Goal');
        await context.completeGoal('user-1');

        const history = await context.getRecentHistory('user-1');
        expect(history[0].action).toBe('goal_completed');
      });
    });

    describe('recordConceptLearned', () => {
      it('should add to mastered concepts', async () => {
        await context.recordConceptLearned('user-1', 'Variables');
        const ctx = await context.getOrCreateContext('user-1');

        expect(ctx.insights.masteredConcepts).toContain('Variables');
      });

      it('should remove from struggling concepts', async () => {
        await context.recordStruggle('user-1', 'Loops');
        await context.recordConceptLearned('user-1', 'Loops');

        const ctx = await context.getOrCreateContext('user-1');
        expect(ctx.insights.strugglingConcepts).not.toContain('Loops');
      });
    });

    describe('recordQuestion', () => {
      it('should add to pending questions', async () => {
        await context.recordQuestion('user-1', 'What is recursion?');
        const ctx = await context.getOrCreateContext('user-1');

        expect(ctx.currentState.pendingQuestions).toContain('What is recursion?');
      });
    });

    describe('recordArtifact', () => {
      it('should add to active artifacts', async () => {
        await context.recordArtifact('user-1', 'artifact-1', 'code');
        const ctx = await context.getOrCreateContext('user-1');

        expect(ctx.currentState.activeArtifacts).toContain('artifact-1');
      });
    });

    describe('updateEmotionalState', () => {
      it('should update emotional state', async () => {
        await context.updateEmotionalState('user-1', EmotionalState.CONFIDENT);
        const ctx = await context.getOrCreateContext('user-1');

        expect(ctx.currentState.emotionalState).toBe(EmotionalState.CONFIDENT);
      });
    });

    describe('updateFocusLevel', () => {
      it('should update focus level', async () => {
        await context.updateFocusLevel('user-1', 75);
        const ctx = await context.getOrCreateContext('user-1');

        expect(ctx.currentState.focusLevel).toBe(75);
      });

      it('should clamp focus level to 0-100', async () => {
        await context.updateFocusLevel('user-1', 150);
        const ctx1 = await context.getOrCreateContext('user-1');
        expect(ctx1.currentState.focusLevel).toBe(100);

        await context.updateFocusLevel('user-1', -20);
        const ctx2 = await context.getOrCreateContext('user-1');
        expect(ctx2.currentState.focusLevel).toBe(0);
      });
    });
  });

  describe('Preferences Management', () => {
    describe('updatePreferences', () => {
      it('should update preferences', async () => {
        await context.updatePreferences('user-1', {
          learningStyle: LearningStyle.VISUAL,
          preferredPace: 'fast',
        });

        const ctx = await context.getOrCreateContext('user-1');
        expect(ctx.preferences.learningStyle).toBe(LearningStyle.VISUAL);
        expect(ctx.preferences.preferredPace).toBe('fast');
      });

      it('should merge nested preferences', async () => {
        await context.updatePreferences('user-1', {
          notificationPreferences: {
            enabled: true,
            channels: ['email'],
            frequency: 'daily',
          },
        });

        const ctx = await context.getOrCreateContext('user-1');
        expect(ctx.preferences.notificationPreferences.enabled).toBe(true);
        expect(ctx.preferences.notificationPreferences.channels).toContain('email');
      });
    });

    describe('setLearningStyle', () => {
      it('should set learning style', async () => {
        await context.setLearningStyle('user-1', LearningStyle.KINESTHETIC);
        const ctx = await context.getOrCreateContext('user-1');

        expect(ctx.preferences.learningStyle).toBe(LearningStyle.KINESTHETIC);
      });
    });

    describe('setPreferredContentTypes', () => {
      it('should set preferred content types', async () => {
        await context.setPreferredContentTypes('user-1', [
          ContentType.VIDEO,
          ContentType.INTERACTIVE,
        ]);

        const ctx = await context.getOrCreateContext('user-1');
        expect(ctx.preferences.preferredContentTypes).toContain(ContentType.VIDEO);
        expect(ctx.preferences.preferredContentTypes).toContain(
          ContentType.INTERACTIVE
        );
      });
    });
  });

  describe('Insights Management', () => {
    describe('updateInsights', () => {
      it('should update insights', async () => {
        await context.updateInsights('user-1', {
          engagementScore: 85,
          completionRate: 60,
        });

        const ctx = await context.getOrCreateContext('user-1');
        expect(ctx.insights.engagementScore).toBe(85);
        expect(ctx.insights.completionRate).toBe(60);
      });
    });

    describe('addStrength', () => {
      it('should add a strength', async () => {
        await context.addStrength('user-1', 'Problem Solving');
        const ctx = await context.getOrCreateContext('user-1');

        expect(ctx.insights.strengths).toContain('Problem Solving');
      });

      it('should not duplicate strengths', async () => {
        await context.addStrength('user-1', 'Logic');
        await context.addStrength('user-1', 'Logic');

        const ctx = await context.getOrCreateContext('user-1');
        const logicCount = ctx.insights.strengths.filter((s) => s === 'Logic').length;
        expect(logicCount).toBe(1);
      });
    });

    describe('addWeakness', () => {
      it('should add a weakness', async () => {
        await context.addWeakness('user-1', 'Time Management');
        const ctx = await context.getOrCreateContext('user-1');

        expect(ctx.insights.weaknesses).toContain('Time Management');
      });
    });

    describe('recordStruggle', () => {
      it('should record struggling concept', async () => {
        await context.recordStruggle('user-1', 'Recursion');
        const ctx = await context.getOrCreateContext('user-1');

        expect(ctx.insights.strugglingConcepts).toContain('Recursion');
      });
    });

    describe('updateEngagementScore', () => {
      it('should update engagement score', async () => {
        await context.updateEngagementScore('user-1', 90);
        const ctx = await context.getOrCreateContext('user-1');

        expect(ctx.insights.engagementScore).toBe(90);
      });

      it('should clamp score to 0-100', async () => {
        await context.updateEngagementScore('user-1', 150);
        const ctx1 = await context.getOrCreateContext('user-1');
        expect(ctx1.insights.engagementScore).toBe(100);

        await context.updateEngagementScore('user-1', -10);
        const ctx2 = await context.getOrCreateContext('user-1');
        expect(ctx2.insights.engagementScore).toBe(0);
      });
    });
  });

  describe('History & Analytics', () => {
    describe('getRecentHistory', () => {
      it('should get recent history', async () => {
        await context.startSession('user-1');
        await context.setCurrentTopic('user-1', 'Topic 1');
        await context.setCurrentGoal('user-1', 'Goal 1');

        const history = await context.getRecentHistory('user-1', 10);

        expect(history.length).toBeGreaterThanOrEqual(3);
      });

      it('should return empty for non-existent user', async () => {
        const history = await context.getRecentHistory('non-existent');
        expect(history).toEqual([]);
      });
    });

    describe('getHistoryByAction', () => {
      it('should filter history by action', async () => {
        await context.setCurrentTopic('user-1', 'Topic 1');
        await context.setCurrentTopic('user-1', 'Topic 2');
        await context.setCurrentGoal('user-1', 'Goal 1');

        const topicChanges = await context.getHistoryByAction(
          'user-1',
          ContextAction.TOPIC_CHANGE
        );

        expect(topicChanges).toHaveLength(2);
        topicChanges.forEach((h) =>
          expect(h.action).toBe(ContextAction.TOPIC_CHANGE)
        );
      });
    });

    describe('getSessionSummary', () => {
      it('should return summary for existing user', async () => {
        await context.startSession('user-1');
        await context.recordConceptLearned('user-1', 'Concept 1');

        const summary = await context.getSessionSummary('user-1');

        expect(summary.exists).toBe(true);
        expect(summary.userId).toBe('user-1');
        expect(summary.totalSessions).toBe(1);
        expect(summary.masteredConceptCount).toBe(1);
      });

      it('should return empty summary for non-existent user', async () => {
        const summary = await context.getSessionSummary('non-existent');

        expect(summary.exists).toBe(false);
        expect(summary.totalSessions).toBe(0);
      });
    });

    describe('getContextForPrompt', () => {
      it('should return context for AI prompting', async () => {
        await context.setCurrentTopic('user-1', 'Python');
        await context.setCurrentGoal('user-1', 'Learn basics');
        await context.updateEmotionalState('user-1', EmotionalState.CURIOUS);

        const promptContext = await context.getContextForPrompt('user-1');

        expect(promptContext.hasContext).toBe(true);
        expect(promptContext.currentTopic).toBe('Python');
        expect(promptContext.currentGoal).toBe('Learn basics');
        expect(promptContext.emotionalState).toBe(EmotionalState.CURIOUS);
      });

      it('should return default context for non-existent user', async () => {
        const promptContext = await context.getContextForPrompt('non-existent');

        expect(promptContext.hasContext).toBe(false);
        expect(promptContext.currentTopic).toBeNull();
      });
    });
  });

  describe('Configuration Getters', () => {
    it('should return max history entries', () => {
      expect(context.getMaxHistoryEntries()).toBe(100);
    });

    it('should return default session length', () => {
      expect(context.getDefaultSessionLength()).toBe(30);
    });
  });

  describe('deleteContext', () => {
    it('should delete user context', async () => {
      await context.getOrCreateContext('user-1');
      const deleted = await context.deleteContext('user-1');

      expect(deleted).toBe(true);

      const summary = await context.getSessionSummary('user-1');
      expect(summary.exists).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      const deleted = await context.deleteContext('non-existent');
      expect(deleted).toBe(false);
    });
  });
});

describe('InMemoryContextStore', () => {
  let store: InMemoryContextStore;

  beforeEach(() => {
    store = new InMemoryContextStore();
  });

  it('should store and retrieve context', async () => {
    const created = await store.create({
      userId: 'user-1',
      lastActiveAt: new Date(),
      currentState: {
        recentConcepts: [],
        pendingQuestions: [],
        activeArtifacts: [],
        sessionCount: 0,
      },
      history: [],
      preferences: {
        learningStyle: 'mixed',
        preferredPace: 'moderate',
        preferredContentTypes: ['text'],
        preferredSessionLength: 30,
        notificationPreferences: {
          enabled: true,
          channels: ['in_app'],
          frequency: 'daily',
        },
        accessibilitySettings: {
          fontSize: 'medium',
          highContrast: false,
          reduceMotion: false,
          screenReaderOptimized: false,
          captionsEnabled: false,
        },
      },
      insights: {
        strengths: [],
        weaknesses: [],
        recommendedTopics: [],
        masteredConcepts: [],
        strugglingConcepts: [],
        averageSessionDuration: 0,
        totalLearningTime: 0,
        completionRate: 0,
        engagementScore: 0,
      },
    });

    const retrieved = await store.get('user-1');
    expect(retrieved?.id).toBe(created.id);
  });

  it('should clear all contexts', async () => {
    await store.create({
      userId: 'user-1',
      lastActiveAt: new Date(),
      currentState: {
        recentConcepts: [],
        pendingQuestions: [],
        activeArtifacts: [],
        sessionCount: 0,
      },
      history: [],
      preferences: {} as any,
      insights: {} as any,
    });

    store.clear();

    const result = await store.get('user-1');
    expect(result).toBeNull();
  });
});
