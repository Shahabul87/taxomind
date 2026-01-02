/**
 * @sam-ai/agentic - Progress Analyzer
 * Analyzes learning progress, identifies trends, and detects learning gaps
 */

import { v4 as uuidv4 } from 'uuid';
import {
  LearningSession,
  LearningSessionStore,
  TopicProgress,
  TopicProgressStore,
  LearningGap,
  LearningGapStore,
  ProgressSnapshot,
  ProgressTrend,
  ProgressReport,
  ProgressSummary,
  Achievement,
  TrendDirection,
  MasteryLevel,
  TimePeriod,
  TrendDataPoint,
  GapEvidence,
  AnalyticsLogger,
  LearningSessionInput,
  LearningSessionInputSchema,
} from './types';

// ============================================================================
// IN-MEMORY STORES
// ============================================================================

/**
 * In-memory implementation of LearningSessionStore
 */
export class InMemoryLearningSessionStore implements LearningSessionStore {
  private sessions: Map<string, LearningSession> = new Map();

  async create(session: Omit<LearningSession, 'id'>): Promise<LearningSession> {
    const newSession: LearningSession = {
      ...session,
      id: uuidv4(),
    };
    this.sessions.set(newSession.id, newSession);
    return newSession;
  }

  async get(id: string): Promise<LearningSession | null> {
    return this.sessions.get(id) ?? null;
  }

  async getByUser(userId: string, limit?: number): Promise<LearningSession[]> {
    const userSessions = Array.from(this.sessions.values())
      .filter((s) => s.userId === userId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    return limit ? userSessions.slice(0, limit) : userSessions;
  }

  async getByUserAndTopic(userId: string, topicId: string): Promise<LearningSession[]> {
    return Array.from(this.sessions.values())
      .filter((s) => s.userId === userId && s.topicId === topicId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  async getByPeriod(userId: string, start: Date, end: Date): Promise<LearningSession[]> {
    return Array.from(this.sessions.values())
      .filter(
        (s) =>
          s.userId === userId &&
          s.startTime >= start &&
          s.startTime <= end
      )
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  async update(id: string, updates: Partial<LearningSession>): Promise<LearningSession> {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error(`Learning session not found: ${id}`);
    }
    const updated = { ...session, ...updates, id: session.id };
    this.sessions.set(id, updated);
    return updated;
  }
}

/**
 * In-memory implementation of TopicProgressStore
 */
export class InMemoryTopicProgressStore implements TopicProgressStore {
  private progress: Map<string, TopicProgress> = new Map();

  private getKey(userId: string, topicId: string): string {
    return `${userId}:${topicId}`;
  }

  async get(userId: string, topicId: string): Promise<TopicProgress | null> {
    return this.progress.get(this.getKey(userId, topicId)) ?? null;
  }

  async getByUser(userId: string): Promise<TopicProgress[]> {
    return Array.from(this.progress.values()).filter((p) => p.userId === userId);
  }

  async upsert(progress: TopicProgress): Promise<TopicProgress> {
    this.progress.set(this.getKey(progress.userId, progress.topicId), progress);
    return progress;
  }

  async getByMasteryLevel(userId: string, level: MasteryLevel): Promise<TopicProgress[]> {
    return Array.from(this.progress.values()).filter(
      (p) => p.userId === userId && p.masteryLevel === level
    );
  }
}

/**
 * In-memory implementation of LearningGapStore
 */
export class InMemoryLearningGapStore implements LearningGapStore {
  private gaps: Map<string, LearningGap> = new Map();

  async create(gap: Omit<LearningGap, 'id'>): Promise<LearningGap> {
    const newGap: LearningGap = {
      ...gap,
      id: uuidv4(),
    };
    this.gaps.set(newGap.id, newGap);
    return newGap;
  }

  async get(id: string): Promise<LearningGap | null> {
    return this.gaps.get(id) ?? null;
  }

  async getByUser(userId: string, includeResolved = false): Promise<LearningGap[]> {
    return Array.from(this.gaps.values()).filter(
      (g) => g.userId === userId && (includeResolved || !g.isResolved)
    );
  }

  async resolve(id: string): Promise<LearningGap> {
    const gap = this.gaps.get(id);
    if (!gap) {
      throw new Error(`Learning gap not found: ${id}`);
    }
    const resolved = { ...gap, isResolved: true, resolvedAt: new Date() };
    this.gaps.set(id, resolved);
    return resolved;
  }

  async getBySeverity(userId: string, severity: LearningGap['severity']): Promise<LearningGap[]> {
    return Array.from(this.gaps.values()).filter(
      (g) => g.userId === userId && g.severity === severity && !g.isResolved
    );
  }
}

// ============================================================================
// DEFAULT LOGGER
// ============================================================================

const defaultLogger: AnalyticsLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

// ============================================================================
// PROGRESS ANALYZER
// ============================================================================

/**
 * Configuration for ProgressAnalyzer
 */
export interface ProgressAnalyzerConfig {
  sessionStore?: LearningSessionStore;
  progressStore?: TopicProgressStore;
  gapStore?: LearningGapStore;
  logger?: AnalyticsLogger;
  masteryThresholds?: Partial<Record<MasteryLevel, number>>;
  gapDetectionThreshold?: number;
  trendWindowDays?: number;
}

/**
 * Default mastery thresholds
 */
const DEFAULT_MASTERY_THRESHOLDS: Record<MasteryLevel, number> = {
  [MasteryLevel.NOVICE]: 0,
  [MasteryLevel.BEGINNER]: 20,
  [MasteryLevel.INTERMEDIATE]: 40,
  [MasteryLevel.PROFICIENT]: 70,
  [MasteryLevel.EXPERT]: 90,
};

/**
 * Progress Analyzer
 * Analyzes learning progress, trends, and identifies gaps
 */
export class ProgressAnalyzer {
  private sessionStore: LearningSessionStore;
  private progressStore: TopicProgressStore;
  private gapStore: LearningGapStore;
  private logger: AnalyticsLogger;
  private masteryThresholds: Record<MasteryLevel, number>;
  private gapDetectionThreshold: number;

  constructor(config: ProgressAnalyzerConfig = {}) {
    this.sessionStore = config.sessionStore ?? new InMemoryLearningSessionStore();
    this.progressStore = config.progressStore ?? new InMemoryTopicProgressStore();
    this.gapStore = config.gapStore ?? new InMemoryLearningGapStore();
    this.logger = config.logger ?? defaultLogger;
    this.masteryThresholds = { ...DEFAULT_MASTERY_THRESHOLDS, ...config.masteryThresholds };
    this.gapDetectionThreshold = config.gapDetectionThreshold ?? 0.4;
  }

  /**
   * Record a learning session
   */
  async recordSession(input: LearningSessionInput): Promise<LearningSession> {
    const validated = LearningSessionInputSchema.parse(input);

    this.logger.info('Recording learning session', {
      userId: validated.userId,
      topicId: validated.topicId,
    });

    const session = await this.sessionStore.create({
      userId: validated.userId,
      topicId: validated.topicId,
      startTime: validated.startTime ?? new Date(),
      duration: validated.duration ?? 0,
      activitiesCompleted: validated.activitiesCompleted ?? 0,
      questionsAnswered: validated.questionsAnswered ?? 0,
      correctAnswers: validated.correctAnswers ?? 0,
      conceptsCovered: validated.conceptsCovered ?? [],
      focusScore: validated.focusScore,
    });

    // Update topic progress
    await this.updateTopicProgress(validated.userId, validated.topicId);

    return session;
  }

  /**
   * End a learning session
   */
  async endSession(sessionId: string): Promise<LearningSession> {
    const session = await this.sessionStore.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const endTime = new Date();
    const duration = session.startTime
      ? Math.round((endTime.getTime() - session.startTime.getTime()) / 60000)
      : session.duration;

    const updated = await this.sessionStore.update(sessionId, {
      endTime,
      duration,
    });

    // Update topic progress
    await this.updateTopicProgress(session.userId, session.topicId);

    this.logger.info('Session ended', { sessionId, duration });

    return updated;
  }

  /**
   * Get topic progress for a user
   */
  async getTopicProgress(userId: string, topicId: string): Promise<TopicProgress | null> {
    return this.progressStore.get(userId, topicId);
  }

  /**
   * Get all topic progress for a user
   */
  async getAllProgress(userId: string): Promise<TopicProgress[]> {
    return this.progressStore.getByUser(userId);
  }

  /**
   * Detect learning gaps for a user
   */
  async detectGaps(userId: string): Promise<LearningGap[]> {
    this.logger.info('Detecting learning gaps', { userId });

    const allProgress = await this.progressStore.getByUser(userId);
    const existingGaps = await this.gapStore.getByUser(userId, false);
    const existingGapConcepts = new Set(existingGaps.map((g) => g.conceptId));

    const newGaps: LearningGap[] = [];

    for (const progress of allProgress) {
      // Check for concepts with low mastery
      for (const concept of progress.conceptsInProgress) {
        if (existingGapConcepts.has(concept)) continue;

        const sessions = await this.sessionStore.getByUserAndTopic(userId, progress.topicId);
        const gapAnalysis = this.analyzeConceptGap(concept, sessions, progress);

        if (gapAnalysis.isGap) {
          const gap = await this.gapStore.create({
            userId,
            conceptId: concept,
            conceptName: concept, // In real implementation, would lookup name
            topicId: progress.topicId,
            severity: gapAnalysis.severity,
            detectedAt: new Date(),
            evidence: gapAnalysis.evidence,
            suggestedActions: this.generateGapActions(gapAnalysis.severity),
            isResolved: false,
          });
          newGaps.push(gap);
        }
      }

      // Check for declining topics
      if (progress.trend === TrendDirection.DECLINING && progress.masteryScore < 50) {
        const conceptsToCheck = progress.conceptsLearned.slice(-3);
        for (const concept of conceptsToCheck) {
          if (existingGapConcepts.has(concept)) continue;

          const gap = await this.gapStore.create({
            userId,
            conceptId: concept,
            conceptName: concept,
            topicId: progress.topicId,
            severity: 'moderate',
            detectedAt: new Date(),
            evidence: [
              {
                type: 'low_confidence',
                description: 'Declining progress trend detected',
                timestamp: new Date(),
              },
            ],
            suggestedActions: ['Review recent material', 'Practice exercises'],
            isResolved: false,
          });
          newGaps.push(gap);
        }
      }
    }

    this.logger.info('Gap detection complete', {
      userId,
      newGapsFound: newGaps.length,
    });

    return newGaps;
  }

  /**
   * Get learning gaps for a user
   */
  async getGaps(userId: string, includeResolved = false): Promise<LearningGap[]> {
    return this.gapStore.getByUser(userId, includeResolved);
  }

  /**
   * Resolve a learning gap
   */
  async resolveGap(gapId: string): Promise<LearningGap> {
    return this.gapStore.resolve(gapId);
  }

  /**
   * Analyze progress trends
   */
  async analyzeTrends(
    userId: string,
    period: TimePeriod = TimePeriod.WEEKLY
  ): Promise<ProgressTrend[]> {
    this.logger.info('Analyzing progress trends', { userId, period });

    const periodDays = this.getPeriodDays(period);
    const now = new Date();
    const start = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const sessions = await this.sessionStore.getByPeriod(userId, start, now);
    const trends: ProgressTrend[] = [];

    // Mastery trend
    const masteryTrend = this.calculateTrend(
      sessions,
      'mastery',
      (s) => (s.correctAnswers / Math.max(1, s.questionsAnswered)) * 100,
      period
    );
    trends.push(masteryTrend);

    // Time spent trend
    const timeTrend = this.calculateTrend(
      sessions,
      'time_spent',
      (s) => s.duration,
      period
    );
    trends.push(timeTrend);

    // Engagement trend
    const engagementTrend = this.calculateTrend(
      sessions,
      'engagement',
      (s) => s.focusScore ?? 0.5,
      period
    );
    trends.push(engagementTrend);

    return trends;
  }

  /**
   * Generate a progress report
   */
  async generateReport(
    userId: string,
    period: TimePeriod = TimePeriod.WEEKLY
  ): Promise<ProgressReport> {
    this.logger.info('Generating progress report', { userId, period });

    const periodDays = this.getPeriodDays(period);
    const now = new Date();
    const start = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const sessions = await this.sessionStore.getByPeriod(userId, start, now);
    const allProgress = await this.progressStore.getByUser(userId);
    const gaps = await this.gapStore.getByUser(userId, false);
    const trends = await this.analyzeTrends(userId, period);

    const summary = this.calculateSummary(sessions, allProgress);
    const achievements = this.detectAchievements(sessions, allProgress, summary);

    const report: ProgressReport = {
      id: uuidv4(),
      userId,
      generatedAt: now,
      period,
      periodStart: start,
      periodEnd: now,
      summary,
      topicBreakdown: allProgress,
      trends,
      gaps,
      achievements,
      recommendations: this.generateRecommendations(summary, gaps, trends),
    };

    this.logger.info('Report generated', { userId, reportId: report.id });

    return report;
  }

  /**
   * Get a progress snapshot
   */
  async getSnapshot(
    userId: string,
    period: TimePeriod = TimePeriod.WEEKLY
  ): Promise<ProgressSnapshot> {
    const periodDays = this.getPeriodDays(period);
    const now = new Date();
    const start = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const sessions = await this.sessionStore.getByPeriod(userId, start, now);

    const totalTimeSpent = sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalQuestions = sessions.reduce((sum, s) => sum + s.questionsAnswered, 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + s.correctAnswers, 0);
    const uniqueTopics = new Set(sessions.map((s) => s.topicId));
    const allConcepts = new Set(sessions.flatMap((s) => s.conceptsCovered));

    const snapshot: ProgressSnapshot = {
      id: uuidv4(),
      userId,
      period,
      periodStart: start,
      periodEnd: now,
      totalTimeSpent,
      sessionsCount: sessions.length,
      topicsProgressed: uniqueTopics.size,
      conceptsLearned: allConcepts.size,
      averageQuizScore: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
      streakDays: this.calculateStreak(sessions),
      engagementScore: this.calculateEngagement(sessions),
      productivityScore: this.calculateProductivity(sessions, totalTimeSpent),
      createdAt: now,
    };

    return snapshot;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async updateTopicProgress(userId: string, topicId: string): Promise<void> {
    const sessions = await this.sessionStore.getByUserAndTopic(userId, topicId);
    if (sessions.length === 0) return;

    const existing = await this.progressStore.get(userId, topicId);

    const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalQuestions = sessions.reduce((sum, s) => sum + s.questionsAnswered, 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + s.correctAnswers, 0);
    const allConcepts = new Set(sessions.flatMap((s) => s.conceptsCovered));

    const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    const masteryScore = this.calculateMasteryScore(accuracy, totalTime, sessions.length);
    const masteryLevel = this.scoreToLevel(masteryScore);

    // Calculate trend
    const recentSessions = sessions.slice(0, Math.min(5, sessions.length));
    const olderSessions = sessions.slice(5, 10);
    const trend = this.determineTrend(recentSessions, olderSessions);

    const progress: TopicProgress = {
      topicId,
      topicName: topicId, // In real implementation, would lookup name
      userId,
      masteryLevel,
      masteryScore,
      completionPercentage: Math.min(100, (allConcepts.size / 10) * 100), // Assuming 10 concepts per topic
      timeSpent: totalTime,
      sessionsCount: sessions.length,
      lastAccessedAt: sessions[0]?.startTime ?? new Date(),
      startedAt: existing?.startedAt ?? sessions[sessions.length - 1]?.startTime ?? new Date(),
      conceptsLearned: Array.from(allConcepts).slice(0, 10),
      conceptsInProgress: [],
      conceptsNotStarted: [],
      trend,
      trendScore: this.calculateTrendScore(recentSessions, olderSessions),
    };

    await this.progressStore.upsert(progress);
  }

  private calculateMasteryScore(accuracy: number, totalTime: number, sessionCount: number): number {
    // Weighted formula considering accuracy, time investment, and consistency
    const accuracyWeight = 0.5;
    const timeWeight = 0.3;
    const consistencyWeight = 0.2;

    const normalizedTime = Math.min(1, totalTime / 300) * 100; // 5 hours = 100%
    const normalizedConsistency = Math.min(1, sessionCount / 10) * 100; // 10 sessions = 100%

    return Math.round(
      accuracy * accuracyWeight +
        normalizedTime * timeWeight +
        normalizedConsistency * consistencyWeight
    );
  }

  private scoreToLevel(score: number): MasteryLevel {
    if (score >= this.masteryThresholds[MasteryLevel.EXPERT]) return MasteryLevel.EXPERT;
    if (score >= this.masteryThresholds[MasteryLevel.PROFICIENT]) return MasteryLevel.PROFICIENT;
    if (score >= this.masteryThresholds[MasteryLevel.INTERMEDIATE]) return MasteryLevel.INTERMEDIATE;
    if (score >= this.masteryThresholds[MasteryLevel.BEGINNER]) return MasteryLevel.BEGINNER;
    return MasteryLevel.NOVICE;
  }

  private determineTrend(recent: LearningSession[], older: LearningSession[]): TrendDirection {
    if (older.length === 0) return TrendDirection.STABLE;

    const recentAvg = this.calculateSessionAccuracy(recent);
    const olderAvg = this.calculateSessionAccuracy(older);

    const diff = recentAvg - olderAvg;
    if (diff > 10) return TrendDirection.IMPROVING;
    if (diff < -10) return TrendDirection.DECLINING;

    // Check for fluctuation
    const recentVariance = this.calculateVariance(recent.map((s) =>
      s.questionsAnswered > 0 ? (s.correctAnswers / s.questionsAnswered) * 100 : 0
    ));
    if (recentVariance > 400) return TrendDirection.FLUCTUATING; // SD > 20%

    return TrendDirection.STABLE;
  }

  private calculateSessionAccuracy(sessions: LearningSession[]): number {
    const total = sessions.reduce((sum, s) => sum + s.questionsAnswered, 0);
    const correct = sessions.reduce((sum, s) => sum + s.correctAnswers, 0);
    return total > 0 ? (correct / total) * 100 : 0;
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }

  private calculateTrendScore(recent: LearningSession[], older: LearningSession[]): number {
    if (older.length === 0) return 0;
    const recentAvg = this.calculateSessionAccuracy(recent);
    const olderAvg = this.calculateSessionAccuracy(older);
    return recentAvg - olderAvg;
  }

  private analyzeConceptGap(
    concept: string,
    sessions: LearningSession[],
    _progress: TopicProgress
  ): { isGap: boolean; severity: LearningGap['severity']; evidence: GapEvidence[] } {
    const evidence: GapEvidence[] = [];
    let gapScore = 0;

    // Check for repeated mistakes
    const conceptSessions = sessions.filter((s) => s.conceptsCovered.includes(concept));
    const avgAccuracy = this.calculateSessionAccuracy(conceptSessions);
    if (avgAccuracy < 50) {
      evidence.push({
        type: 'repeated_mistakes',
        description: `Low accuracy (${avgAccuracy.toFixed(0)}%) on concept`,
        score: avgAccuracy,
        timestamp: new Date(),
      });
      gapScore += 0.4;
    }

    // Check for time struggle
    const avgDuration = conceptSessions.reduce((sum, s) => sum + s.duration, 0) /
      Math.max(1, conceptSessions.length);
    if (avgDuration > 30 && avgAccuracy < 70) {
      evidence.push({
        type: 'time_struggle',
        description: 'Long time spent with low accuracy indicates struggle',
        timestamp: new Date(),
      });
      gapScore += 0.3;
    }

    // Determine severity
    let severity: LearningGap['severity'] = 'minor';
    if (gapScore >= 0.6) severity = 'critical';
    else if (gapScore >= 0.3) severity = 'moderate';

    return {
      isGap: gapScore >= this.gapDetectionThreshold,
      severity,
      evidence,
    };
  }

  private generateGapActions(severity: LearningGap['severity']): string[] {
    switch (severity) {
      case 'critical':
        return [
          'Review foundational concepts',
          'Complete practice exercises',
          'Watch tutorial videos',
          'Seek mentor support',
        ];
      case 'moderate':
        return [
          'Review recent material',
          'Practice with examples',
          'Take a quiz to assess understanding',
        ];
      case 'minor':
        return ['Quick review recommended', 'Try a few practice problems'];
      default:
        return ['Continue learning'];
    }
  }

  private calculateTrend(
    sessions: LearningSession[],
    metric: 'mastery' | 'time_spent' | 'engagement' | 'accuracy' | 'completion',
    valueExtractor: (s: LearningSession) => number,
    period: TimePeriod
  ): ProgressTrend {
    const dataPoints: TrendDataPoint[] = [];
    const dailyData: Map<string, number[]> = new Map();

    for (const session of sessions) {
      const dateKey = session.startTime.toISOString().split('T')[0];
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, []);
      }
      dailyData.get(dateKey)!.push(valueExtractor(session));
    }

    for (const [date, values] of dailyData.entries()) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      dataPoints.push({ date: new Date(date), value: avg });
    }

    dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate trend direction
    let direction = TrendDirection.STABLE;
    let changePercentage = 0;

    if (dataPoints.length >= 2) {
      const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2));
      const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2));

      const firstAvg = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;

      changePercentage = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

      if (changePercentage > 10) direction = TrendDirection.IMPROVING;
      else if (changePercentage < -10) direction = TrendDirection.DECLINING;
      else direction = TrendDirection.STABLE;
    }

    const insight = this.generateTrendInsight(metric, direction, changePercentage);

    return {
      userId: sessions[0]?.userId ?? '',
      metric,
      direction,
      changePercentage,
      dataPoints,
      period,
      analysisDate: new Date(),
      insight,
    };
  }

  private generateTrendInsight(
    metric: string,
    direction: TrendDirection,
    change: number
  ): string {
    const absChange = Math.abs(change).toFixed(0);
    switch (direction) {
      case TrendDirection.IMPROVING:
        return `Your ${metric.replace('_', ' ')} has improved by ${absChange}%`;
      case TrendDirection.DECLINING:
        return `Your ${metric.replace('_', ' ')} has declined by ${absChange}%`;
      case TrendDirection.STABLE:
        return `Your ${metric.replace('_', ' ')} has remained stable`;
      case TrendDirection.FLUCTUATING:
        return `Your ${metric.replace('_', ' ')} has been fluctuating`;
      default:
        return '';
    }
  }

  private getPeriodDays(period: TimePeriod): number {
    switch (period) {
      case TimePeriod.DAILY:
        return 1;
      case TimePeriod.WEEKLY:
        return 7;
      case TimePeriod.MONTHLY:
        return 30;
      case TimePeriod.QUARTERLY:
        return 90;
      case TimePeriod.ALL_TIME:
        return 365 * 5; // 5 years
      default:
        return 7;
    }
  }

  private calculateSummary(sessions: LearningSession[], progress: TopicProgress[]): ProgressSummary {
    const totalTimeSpent = sessions.reduce((sum, s) => sum + s.duration, 0);
    const avgSessionDuration = sessions.length > 0 ? totalTimeSpent / sessions.length : 0;
    const totalQuestions = sessions.reduce((sum, s) => sum + s.questionsAnswered, 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + s.correctAnswers, 0);

    const completedTopics = progress.filter((p) => p.completionPercentage >= 100).length;
    const inProgressTopics = progress.filter(
      (p) => p.completionPercentage > 0 && p.completionPercentage < 100
    ).length;

    const overallMastery =
      progress.length > 0
        ? progress.reduce((sum, p) => sum + p.masteryScore, 0) / progress.length
        : 0;

    const engagementScore = this.calculateEngagement(sessions);
    let engagementLevel: 'high' | 'medium' | 'low' = 'medium';
    if (engagementScore > 0.7) engagementLevel = 'high';
    else if (engagementScore < 0.4) engagementLevel = 'low';

    return {
      totalTimeSpent,
      averageSessionDuration: Math.round(avgSessionDuration),
      topicsCompleted: completedTopics,
      topicsInProgress: inProgressTopics,
      overallMastery: Math.round(overallMastery),
      quizzesCompleted: sessions.filter((s) => s.questionsAnswered > 0).length,
      averageQuizScore: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
      currentStreak: this.calculateStreak(sessions),
      longestStreak: this.calculateLongestStreak(sessions),
      engagementLevel,
    };
  }

  private calculateStreak(sessions: LearningSession[]): number {
    if (sessions.length === 0) return 0;

    const dates = new Set(sessions.map((s) => s.startTime.toISOString().split('T')[0]));
    const sortedDates = Array.from(dates).sort().reverse();

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];

      if (sortedDates.includes(expectedDateStr)) {
        streak++;
      } else if (i === 0 && sortedDates[0] !== today) {
        // If no session today, check if yesterday continues the streak
        continue;
      } else {
        break;
      }
    }

    return streak;
  }

  private calculateLongestStreak(sessions: LearningSession[]): number {
    if (sessions.length === 0) return 0;

    const dates = Array.from(
      new Set(sessions.map((s) => s.startTime.toISOString().split('T')[0]))
    ).sort();

    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffDays = (curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000);

      if (diffDays === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return longestStreak;
  }

  private calculateEngagement(sessions: LearningSession[]): number {
    if (sessions.length === 0) return 0;

    const focusScores = sessions.filter((s) => s.focusScore !== undefined).map((s) => s.focusScore!);
    const avgFocus = focusScores.length > 0
      ? focusScores.reduce((a, b) => a + b, 0) / focusScores.length
      : 0.5;

    const avgActivities = sessions.reduce((sum, s) => sum + s.activitiesCompleted, 0) / sessions.length;
    const normalizedActivities = Math.min(1, avgActivities / 5);

    return (avgFocus * 0.6 + normalizedActivities * 0.4);
  }

  private calculateProductivity(sessions: LearningSession[], totalTime: number): number {
    if (totalTime === 0) return 0;

    const totalConcepts = new Set(sessions.flatMap((s) => s.conceptsCovered)).size;
    const totalActivities = sessions.reduce((sum, s) => sum + s.activitiesCompleted, 0);

    // Concepts per hour * activities per hour, normalized
    const conceptsPerHour = (totalConcepts / (totalTime / 60));
    const activitiesPerHour = (totalActivities / (totalTime / 60));

    return Math.min(1, (conceptsPerHour / 2 + activitiesPerHour / 10) / 2);
  }

  private detectAchievements(
    sessions: LearningSession[],
    allProgress: TopicProgress[],
    summary: ProgressSummary
  ): Achievement[] {
    const achievements: Achievement[] = [];
    const now = new Date();

    // Streak achievements
    if (summary.currentStreak >= 7) {
      achievements.push({
        id: uuidv4(),
        userId: sessions[0]?.userId ?? '',
        type: 'streak',
        title: 'Week Warrior',
        description: '7-day learning streak',
        earnedAt: now,
        points: 100,
      });
    }

    // Mastery achievements
    const expertTopics = allProgress.filter((p) => p.masteryLevel === MasteryLevel.EXPERT);
    if (expertTopics.length > 0) {
      achievements.push({
        id: uuidv4(),
        userId: sessions[0]?.userId ?? '',
        type: 'mastery',
        title: 'Topic Master',
        description: `Achieved expert level in ${expertTopics[0].topicName}`,
        earnedAt: now,
        points: 500,
      });
    }

    // Time commitment
    if (summary.totalTimeSpent >= 600) {
      achievements.push({
        id: uuidv4(),
        userId: sessions[0]?.userId ?? '',
        type: 'dedication',
        title: 'Dedicated Learner',
        description: '10+ hours of learning',
        earnedAt: now,
        points: 200,
      });
    }

    return achievements;
  }

  private generateRecommendations(
    summary: ProgressSummary,
    gaps: LearningGap[],
    trends: ProgressTrend[]
  ): string[] {
    const recommendations: string[] = [];

    // Gap-based recommendations
    const criticalGaps = gaps.filter((g) => g.severity === 'critical');
    if (criticalGaps.length > 0) {
      recommendations.push(
        `Focus on resolving ${criticalGaps.length} critical knowledge gap(s)`
      );
    }

    // Trend-based recommendations
    const decliningTrends = trends.filter((t) => t.direction === TrendDirection.DECLINING);
    for (const trend of decliningTrends) {
      recommendations.push(`Work on improving your ${trend.metric.replace('_', ' ')}`);
    }

    // Engagement-based
    if (summary.engagementLevel === 'low') {
      recommendations.push('Try to increase your daily learning engagement');
    }

    // Streak-based
    if (summary.currentStreak === 0) {
      recommendations.push('Start a new learning streak today!');
    }

    // Completion-based
    if (summary.topicsInProgress > 3) {
      recommendations.push('Consider completing some topics before starting new ones');
    }

    return recommendations.slice(0, 5);
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new ProgressAnalyzer instance
 */
export function createProgressAnalyzer(config?: ProgressAnalyzerConfig): ProgressAnalyzer {
  return new ProgressAnalyzer(config);
}
