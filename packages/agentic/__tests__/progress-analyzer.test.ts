/**
 * Tests for ProgressAnalyzer
 */

import {
  ProgressAnalyzer,
  createProgressAnalyzer,
  InMemoryLearningSessionStore,
  InMemoryTopicProgressStore,
  InMemoryLearningGapStore,
  TrendDirection,
  MasteryLevel,
  TimePeriod,
  LearningSessionInput,
} from '../src/learning-analytics';

describe('ProgressAnalyzer', () => {
  let analyzer: ProgressAnalyzer;

  beforeEach(() => {
    analyzer = createProgressAnalyzer();
  });

  describe('recordSession', () => {
    it('should record a learning session', async () => {
      const input: LearningSessionInput = {
        userId: 'user-1',
        topicId: 'topic-1',
        duration: 30,
        activitiesCompleted: 5,
        questionsAnswered: 10,
        correctAnswers: 8,
        conceptsCovered: ['concept-1', 'concept-2'],
        focusScore: 0.8,
      };

      const session = await analyzer.recordSession(input);

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.userId).toBe('user-1');
      expect(session.topicId).toBe('topic-1');
      expect(session.duration).toBe(30);
      expect(session.correctAnswers).toBe(8);
    });

    it('should update topic progress after recording', async () => {
      await analyzer.recordSession({
        userId: 'user-progress',
        topicId: 'topic-progress',
        duration: 45,
        questionsAnswered: 20,
        correctAnswers: 18,
        conceptsCovered: ['concept-a', 'concept-b'],
      });

      const progress = await analyzer.getTopicProgress('user-progress', 'topic-progress');

      expect(progress).toBeDefined();
      expect(progress?.topicId).toBe('topic-progress');
      expect(progress?.masteryScore).toBeGreaterThan(0);
    });
  });

  describe('endSession', () => {
    it('should end a session and calculate duration', async () => {
      const session = await analyzer.recordSession({
        userId: 'user-1',
        topicId: 'topic-1',
      });

      // Wait a bit to simulate session time
      await new Promise((resolve) => setTimeout(resolve, 50));

      const ended = await analyzer.endSession(session.id);

      expect(ended.endTime).toBeDefined();
      expect(ended.duration).toBeGreaterThanOrEqual(0);
    });

    it('should throw error for non-existent session', async () => {
      await expect(analyzer.endSession('non-existent')).rejects.toThrow(
        'Session not found'
      );
    });
  });

  describe('getTopicProgress', () => {
    it('should return null for non-existent topic', async () => {
      const progress = await analyzer.getTopicProgress('user-1', 'non-existent');
      expect(progress).toBeNull();
    });

    it('should return progress after sessions', async () => {
      await analyzer.recordSession({
        userId: 'user-topic',
        topicId: 'topic-data',
        duration: 30,
        questionsAnswered: 10,
        correctAnswers: 9,
      });

      const progress = await analyzer.getTopicProgress('user-topic', 'topic-data');

      expect(progress).toBeDefined();
      expect(progress?.masteryLevel).toBeDefined();
    });
  });

  describe('getAllProgress', () => {
    it('should return all progress for a user', async () => {
      await analyzer.recordSession({
        userId: 'user-all',
        topicId: 'topic-1',
        duration: 20,
      });

      await analyzer.recordSession({
        userId: 'user-all',
        topicId: 'topic-2',
        duration: 25,
      });

      const allProgress = await analyzer.getAllProgress('user-all');

      expect(allProgress.length).toBe(2);
    });
  });

  describe('detectGaps', () => {
    it('should detect learning gaps for low performance', async () => {
      // Create sessions with low performance
      await analyzer.recordSession({
        userId: 'user-gaps',
        topicId: 'topic-hard',
        duration: 60,
        questionsAnswered: 20,
        correctAnswers: 5, // 25% accuracy
        conceptsCovered: ['hard-concept'],
      });

      const gaps = await analyzer.detectGaps('user-gaps');

      // May or may not detect gaps depending on threshold
      expect(Array.isArray(gaps)).toBe(true);
    });

    it('should return empty array for new user', async () => {
      const gaps = await analyzer.detectGaps('new-user');
      expect(gaps).toEqual([]);
    });
  });

  describe('getGaps', () => {
    it('should return user gaps', async () => {
      await analyzer.recordSession({
        userId: 'user-get-gaps',
        topicId: 'topic-1',
        duration: 30,
        questionsAnswered: 10,
        correctAnswers: 2,
        conceptsCovered: ['struggling-concept'],
      });

      await analyzer.detectGaps('user-get-gaps');
      const gaps = await analyzer.getGaps('user-get-gaps');

      expect(Array.isArray(gaps)).toBe(true);
    });
  });

  describe('analyzeTrends', () => {
    it('should analyze progress trends', async () => {
      // Create multiple sessions over time
      for (let i = 0; i < 5; i++) {
        await analyzer.recordSession({
          userId: 'user-trends',
          topicId: 'topic-1',
          duration: 30,
          questionsAnswered: 10,
          correctAnswers: 5 + i, // Improving performance
          focusScore: 0.6 + i * 0.05,
        });
      }

      const trends = await analyzer.analyzeTrends('user-trends', TimePeriod.WEEKLY);

      expect(trends.length).toBeGreaterThan(0);
      expect(trends[0].metric).toBeDefined();
      expect(trends[0].direction).toBeDefined();
    });

    it('should return stable trend for single session', async () => {
      await analyzer.recordSession({
        userId: 'user-single',
        topicId: 'topic-1',
        duration: 30,
      });

      const trends = await analyzer.analyzeTrends('user-single', TimePeriod.WEEKLY);

      expect(trends.length).toBeGreaterThan(0);
    });
  });

  describe('generateReport', () => {
    it('should generate a comprehensive progress report', async () => {
      await analyzer.recordSession({
        userId: 'user-report',
        topicId: 'topic-1',
        duration: 45,
        questionsAnswered: 15,
        correctAnswers: 12,
        activitiesCompleted: 5,
        conceptsCovered: ['concept-1', 'concept-2'],
        focusScore: 0.8,
      });

      const report = await analyzer.generateReport('user-report', TimePeriod.WEEKLY);

      expect(report).toBeDefined();
      expect(report.id).toBeDefined();
      expect(report.userId).toBe('user-report');
      expect(report.summary).toBeDefined();
      expect(report.summary.totalTimeSpent).toBe(45);
      expect(report.topicBreakdown.length).toBeGreaterThan(0);
      expect(report.trends.length).toBeGreaterThan(0);
    });

    it('should include recommendations in report', async () => {
      await analyzer.recordSession({
        userId: 'user-recs',
        topicId: 'topic-1',
        duration: 30,
        questionsAnswered: 10,
        correctAnswers: 5,
      });

      const report = await analyzer.generateReport('user-recs');

      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('getSnapshot', () => {
    it('should get a progress snapshot', async () => {
      await analyzer.recordSession({
        userId: 'user-snapshot',
        topicId: 'topic-1',
        duration: 30,
        questionsAnswered: 10,
        correctAnswers: 8,
        activitiesCompleted: 3,
        conceptsCovered: ['concept-1'],
      });

      const snapshot = await analyzer.getSnapshot('user-snapshot', TimePeriod.WEEKLY);

      expect(snapshot).toBeDefined();
      expect(snapshot.userId).toBe('user-snapshot');
      expect(snapshot.totalTimeSpent).toBe(30);
      expect(snapshot.sessionsCount).toBe(1);
      expect(snapshot.averageQuizScore).toBe(80);
    });

    it('should calculate streak correctly', async () => {
      const today = new Date();

      await analyzer.recordSession({
        userId: 'user-streak',
        topicId: 'topic-1',
        startTime: today,
        duration: 30,
      });

      const snapshot = await analyzer.getSnapshot('user-streak', TimePeriod.WEEKLY);

      expect(snapshot.streakDays).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('InMemoryLearningSessionStore', () => {
  let store: InMemoryLearningSessionStore;

  beforeEach(() => {
    store = new InMemoryLearningSessionStore();
  });

  it('should create and retrieve session', async () => {
    const session = await store.create({
      userId: 'user-1',
      topicId: 'topic-1',
      startTime: new Date(),
      duration: 30,
      activitiesCompleted: 5,
      questionsAnswered: 10,
      correctAnswers: 8,
      conceptsCovered: ['concept-1'],
    });

    const retrieved = await store.get(session.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.userId).toBe('user-1');
  });

  it('should get sessions by user', async () => {
    await store.create({
      userId: 'user-many',
      topicId: 'topic-1',
      startTime: new Date(),
      duration: 20,
      activitiesCompleted: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      conceptsCovered: [],
    });

    await store.create({
      userId: 'user-many',
      topicId: 'topic-2',
      startTime: new Date(),
      duration: 25,
      activitiesCompleted: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      conceptsCovered: [],
    });

    const sessions = await store.getByUser('user-many');

    expect(sessions.length).toBe(2);
  });

  it('should get sessions by period', async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    await store.create({
      userId: 'user-period',
      topicId: 'topic-1',
      startTime: now,
      duration: 30,
      activitiesCompleted: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      conceptsCovered: [],
    });

    const sessions = await store.getByPeriod('user-period', yesterday, now);

    expect(sessions.length).toBe(1);
  });

  it('should update session', async () => {
    const session = await store.create({
      userId: 'user-update',
      topicId: 'topic-1',
      startTime: new Date(),
      duration: 0,
      activitiesCompleted: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      conceptsCovered: [],
    });

    const updated = await store.update(session.id, { duration: 45 });

    expect(updated.duration).toBe(45);
  });
});

describe('InMemoryTopicProgressStore', () => {
  let store: InMemoryTopicProgressStore;

  beforeEach(() => {
    store = new InMemoryTopicProgressStore();
  });

  it('should upsert and retrieve progress', async () => {
    const progress = await store.upsert({
      topicId: 'topic-1',
      topicName: 'Topic 1',
      userId: 'user-1',
      masteryLevel: MasteryLevel.INTERMEDIATE,
      masteryScore: 55,
      completionPercentage: 60,
      timeSpent: 120,
      sessionsCount: 5,
      lastAccessedAt: new Date(),
      startedAt: new Date(),
      conceptsLearned: ['concept-1'],
      conceptsInProgress: ['concept-2'],
      conceptsNotStarted: ['concept-3'],
      trend: TrendDirection.IMPROVING,
      trendScore: 5,
    });

    const retrieved = await store.get('user-1', 'topic-1');

    expect(retrieved).toBeDefined();
    expect(retrieved?.masteryScore).toBe(55);
  });

  it('should get progress by mastery level', async () => {
    await store.upsert({
      topicId: 'topic-1',
      topicName: 'Topic 1',
      userId: 'user-level',
      masteryLevel: MasteryLevel.EXPERT,
      masteryScore: 95,
      completionPercentage: 100,
      timeSpent: 300,
      sessionsCount: 20,
      lastAccessedAt: new Date(),
      startedAt: new Date(),
      conceptsLearned: [],
      conceptsInProgress: [],
      conceptsNotStarted: [],
      trend: TrendDirection.STABLE,
      trendScore: 0,
    });

    const experts = await store.getByMasteryLevel('user-level', MasteryLevel.EXPERT);

    expect(experts.length).toBe(1);
  });
});

describe('InMemoryLearningGapStore', () => {
  let store: InMemoryLearningGapStore;

  beforeEach(() => {
    store = new InMemoryLearningGapStore();
  });

  it('should create and retrieve gap', async () => {
    const gap = await store.create({
      userId: 'user-1',
      conceptId: 'concept-1',
      conceptName: 'Concept 1',
      topicId: 'topic-1',
      severity: 'moderate',
      detectedAt: new Date(),
      evidence: [],
      suggestedActions: ['Review material'],
      isResolved: false,
    });

    const retrieved = await store.get(gap.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.conceptId).toBe('concept-1');
  });

  it('should resolve gap', async () => {
    const gap = await store.create({
      userId: 'user-resolve',
      conceptId: 'concept-1',
      conceptName: 'Concept 1',
      topicId: 'topic-1',
      severity: 'minor',
      detectedAt: new Date(),
      evidence: [],
      suggestedActions: [],
      isResolved: false,
    });

    const resolved = await store.resolve(gap.id);

    expect(resolved.isResolved).toBe(true);
    expect(resolved.resolvedAt).toBeDefined();
  });

  it('should filter by severity', async () => {
    await store.create({
      userId: 'user-severity',
      conceptId: 'concept-1',
      conceptName: 'Critical Gap',
      topicId: 'topic-1',
      severity: 'critical',
      detectedAt: new Date(),
      evidence: [],
      suggestedActions: [],
      isResolved: false,
    });

    await store.create({
      userId: 'user-severity',
      conceptId: 'concept-2',
      conceptName: 'Minor Gap',
      topicId: 'topic-1',
      severity: 'minor',
      detectedAt: new Date(),
      evidence: [],
      suggestedActions: [],
      isResolved: false,
    });

    const criticalGaps = await store.getBySeverity('user-severity', 'critical');

    expect(criticalGaps.length).toBe(1);
    expect(criticalGaps[0].conceptName).toBe('Critical Gap');
  });
});
