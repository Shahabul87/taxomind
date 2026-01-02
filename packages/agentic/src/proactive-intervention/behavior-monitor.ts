/**
 * @sam-ai/agentic - Behavior Monitor
 * Tracks user behavior, detects patterns, and suggests interventions
 */

import { v4 as uuidv4 } from 'uuid';
import {
  BehaviorEvent,
  BehaviorEventStore,
  BehaviorEventType,
  BehaviorEventSchema,
  BehaviorPattern,
  PatternStore,
  PatternType,
  PatternContext,
  BehaviorAnomaly,
  AnomalyType,
  ChurnPrediction,
  ChurnFactor,
  StrugglePrediction,
  StruggleArea,
  SupportRecommendation,
  Intervention,
  InterventionStore,
  InterventionType,
  InterventionResult,
  EmotionalSignal,
  EmotionalSignalType,
  EventQueryOptions,
  ActionType,
  ProactiveLogger,
} from './types';

// ============================================================================
// IN-MEMORY STORES
// ============================================================================

/**
 * In-memory implementation of BehaviorEventStore
 */
export class InMemoryBehaviorEventStore implements BehaviorEventStore {
  private events: Map<string, BehaviorEvent> = new Map();

  async add(
    event: Omit<BehaviorEvent, 'id' | 'processed' | 'processedAt'>
  ): Promise<BehaviorEvent> {
    const newEvent: BehaviorEvent = {
      ...event,
      id: uuidv4(),
      processed: false,
    };
    this.events.set(newEvent.id, newEvent);
    return newEvent;
  }

  async addBatch(
    events: Array<Omit<BehaviorEvent, 'id' | 'processed' | 'processedAt'>>
  ): Promise<BehaviorEvent[]> {
    const newEvents: BehaviorEvent[] = [];
    for (const event of events) {
      const newEvent = await this.add(event);
      newEvents.push(newEvent);
    }
    return newEvents;
  }

  async get(id: string): Promise<BehaviorEvent | null> {
    return this.events.get(id) ?? null;
  }

  async getByUser(userId: string, options?: EventQueryOptions): Promise<BehaviorEvent[]> {
    let events = Array.from(this.events.values()).filter(
      (event) => event.userId === userId
    );

    if (options?.types && options.types.length > 0) {
      events = events.filter((e) => options.types?.includes(e.type));
    }

    if (options?.since) {
      events = events.filter((e) => e.timestamp >= options.since!);
    }

    if (options?.until) {
      events = events.filter((e) => e.timestamp <= options.until!);
    }

    if (!options?.includeProcessed) {
      events = events.filter((e) => !e.processed);
    }

    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (options?.offset) {
      events = events.slice(options.offset);
    }

    if (options?.limit) {
      events = events.slice(0, options.limit);
    }

    return events;
  }

  async getBySession(sessionId: string): Promise<BehaviorEvent[]> {
    return Array.from(this.events.values())
      .filter((event) => event.sessionId === sessionId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async getUnprocessed(limit: number): Promise<BehaviorEvent[]> {
    return Array.from(this.events.values())
      .filter((event) => !event.processed)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(0, limit);
  }

  async markProcessed(ids: string[]): Promise<void> {
    const now = new Date();
    for (const id of ids) {
      const event = this.events.get(id);
      if (event) {
        this.events.set(id, { ...event, processed: true, processedAt: now });
      }
    }
  }

  async count(userId: string, type?: BehaviorEventType, since?: Date): Promise<number> {
    let events = Array.from(this.events.values()).filter(
      (event) => event.userId === userId
    );

    if (type) {
      events = events.filter((e) => e.type === type);
    }

    if (since) {
      events = events.filter((e) => e.timestamp >= since);
    }

    return events.length;
  }
}

/**
 * In-memory implementation of PatternStore
 */
export class InMemoryPatternStore implements PatternStore {
  private patterns: Map<string, BehaviorPattern> = new Map();

  async get(id: string): Promise<BehaviorPattern | null> {
    return this.patterns.get(id) ?? null;
  }

  async getByUser(userId: string): Promise<BehaviorPattern[]> {
    return Array.from(this.patterns.values()).filter((pattern) => pattern.userId === userId);
  }

  async getByType(userId: string, type: PatternType): Promise<BehaviorPattern[]> {
    return Array.from(this.patterns.values()).filter(
      (pattern) => pattern.userId === userId && pattern.type === type
    );
  }

  async create(pattern: Omit<BehaviorPattern, 'id'>): Promise<BehaviorPattern> {
    const newPattern: BehaviorPattern = {
      ...pattern,
      id: uuidv4(),
    };
    this.patterns.set(newPattern.id, newPattern);
    return newPattern;
  }

  async update(id: string, updates: Partial<BehaviorPattern>): Promise<BehaviorPattern> {
    const pattern = this.patterns.get(id);
    if (!pattern) {
      throw new Error(`Pattern not found: ${id}`);
    }
    const updatedPattern: BehaviorPattern = {
      ...pattern,
      ...updates,
      id: pattern.id,
    };
    this.patterns.set(id, updatedPattern);
    return updatedPattern;
  }

  async delete(id: string): Promise<boolean> {
    return this.patterns.delete(id);
  }

  async recordOccurrence(id: string): Promise<void> {
    const pattern = this.patterns.get(id);
    if (pattern) {
      this.patterns.set(id, {
        ...pattern,
        occurrences: pattern.occurrences + 1,
        lastObservedAt: new Date(),
      });
    }
  }
}

/**
 * In-memory implementation of InterventionStore
 */
export class InMemoryInterventionStore implements InterventionStore {
  private interventions: Map<string, Intervention> = new Map();
  private userInterventions: Map<string, string[]> = new Map();

  async get(id: string): Promise<Intervention | null> {
    return this.interventions.get(id) ?? null;
  }

  async getByUser(userId: string, pending?: boolean): Promise<Intervention[]> {
    const interventionIds = this.userInterventions.get(userId) ?? [];
    let interventions = interventionIds
      .map((id) => this.interventions.get(id))
      .filter((i): i is Intervention => i !== undefined);

    if (pending !== undefined) {
      interventions = interventions.filter((i) =>
        pending ? !i.executedAt : i.executedAt !== undefined
      );
    }

    return interventions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async create(
    intervention: Omit<Intervention, 'id' | 'createdAt'>,
    userId?: string
  ): Promise<Intervention> {
    const newIntervention: Intervention = {
      ...intervention,
      id: uuidv4(),
      createdAt: new Date(),
    };
    this.interventions.set(newIntervention.id, newIntervention);

    if (userId) {
      const userIds = this.userInterventions.get(userId) ?? [];
      userIds.push(newIntervention.id);
      this.userInterventions.set(userId, userIds);
    }

    return newIntervention;
  }

  async update(id: string, updates: Partial<Intervention>): Promise<Intervention> {
    const intervention = this.interventions.get(id);
    if (!intervention) {
      throw new Error(`Intervention not found: ${id}`);
    }
    const updatedIntervention: Intervention = {
      ...intervention,
      ...updates,
      id: intervention.id,
      createdAt: intervention.createdAt,
    };
    this.interventions.set(id, updatedIntervention);
    return updatedIntervention;
  }

  async recordResult(id: string, result: InterventionResult): Promise<void> {
    const intervention = this.interventions.get(id);
    if (intervention) {
      this.interventions.set(id, { ...intervention, result });
    }
  }

  async getHistory(userId: string, limit?: number): Promise<Intervention[]> {
    const interventions = await this.getByUser(userId, false);
    return limit ? interventions.slice(0, limit) : interventions;
  }

  setUserIntervention(userId: string, interventionId: string): void {
    const userIds = this.userInterventions.get(userId) ?? [];
    userIds.push(interventionId);
    this.userInterventions.set(userId, userIds);
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
// BEHAVIOR MONITOR
// ============================================================================

/**
 * Configuration for BehaviorMonitor
 */
export interface BehaviorMonitorConfig {
  eventStore?: BehaviorEventStore;
  patternStore?: PatternStore;
  interventionStore?: InterventionStore;
  logger?: ProactiveLogger;
  patternDetectionThreshold?: number;
  churnPredictionWindow?: number; // days
  frustrationThreshold?: number;
}

/**
 * Behavior Monitor
 * Tracks events, detects patterns, and suggests interventions
 */
export class BehaviorMonitor {
  private eventStore: BehaviorEventStore;
  private patternStore: PatternStore;
  private interventionStore: InMemoryInterventionStore;
  private logger: ProactiveLogger;
  private patternDetectionThreshold: number;
  private churnPredictionWindow: number;
  private frustrationThreshold: number;

  constructor(config: BehaviorMonitorConfig = {}) {
    this.eventStore = config.eventStore ?? new InMemoryBehaviorEventStore();
    this.patternStore = config.patternStore ?? new InMemoryPatternStore();
    this.interventionStore =
      (config.interventionStore as InMemoryInterventionStore) ?? new InMemoryInterventionStore();
    this.logger = config.logger ?? defaultLogger;
    this.patternDetectionThreshold = config.patternDetectionThreshold ?? 3;
    this.churnPredictionWindow = config.churnPredictionWindow ?? 14;
    this.frustrationThreshold = config.frustrationThreshold ?? 0.7;
  }

  /**
   * Track a behavior event
   */
  async trackEvent(
    event: Omit<BehaviorEvent, 'id' | 'processed' | 'processedAt'>
  ): Promise<BehaviorEvent> {
    const validated = BehaviorEventSchema.parse(event);

    this.logger.debug('Tracking event', { type: validated.type, userId: validated.userId });

    const storedEvent = await this.eventStore.add({
      ...validated,
      type: validated.type as BehaviorEventType,
      timestamp: new Date(validated.timestamp),
      emotionalSignals: validated.emotionalSignals?.map((s) => ({
        ...s,
        type: s.type as EmotionalSignalType,
      })),
    });

    // Process emotional signals if present
    if (validated.emotionalSignals && validated.emotionalSignals.length > 0) {
      await this.processEmotionalSignals(
        validated.userId,
        validated.emotionalSignals.map((s) => ({
          ...s,
          type: s.type as EmotionalSignalType,
        }))
      );
    }

    return storedEvent;
  }

  /**
   * Track multiple events at once
   */
  async trackEvents(
    events: Array<Omit<BehaviorEvent, 'id' | 'processed' | 'processedAt'>>
  ): Promise<BehaviorEvent[]> {
    return this.eventStore.addBatch(events);
  }

  /**
   * Detect patterns in user behavior
   */
  async detectPatterns(userId: string): Promise<BehaviorPattern[]> {
    this.logger.info('Detecting patterns', { userId });

    const events = await this.eventStore.getByUser(userId, {
      includeProcessed: true,
      limit: 1000,
    });

    if (events.length < this.patternDetectionThreshold) {
      return [];
    }

    const patterns: BehaviorPattern[] = [];

    // Detect time preference patterns
    const timePattern = this.detectTimePreference(userId, events);
    if (timePattern) patterns.push(timePattern);

    // Detect learning habit patterns
    const habitPattern = this.detectLearningHabit(userId, events);
    if (habitPattern) patterns.push(habitPattern);

    // Detect struggle patterns
    const strugglePatterns = this.detectStrugglePatterns(userId, events);
    patterns.push(...strugglePatterns);

    // Detect success patterns
    const successPattern = this.detectSuccessPattern(userId, events);
    if (successPattern) patterns.push(successPattern);

    // Store detected patterns
    for (const pattern of patterns) {
      const existing = await this.patternStore.getByType(userId, pattern.type);
      if (existing.length === 0) {
        await this.patternStore.create(pattern);
      } else {
        await this.patternStore.update(existing[0].id, {
          occurrences: existing[0].occurrences + 1,
          lastObservedAt: new Date(),
          confidence: Math.min(1, existing[0].confidence + 0.05),
        });
      }
    }

    return patterns;
  }

  /**
   * Detect anomalies in user behavior
   */
  async detectAnomalies(userId: string): Promise<BehaviorAnomaly[]> {
    this.logger.info('Detecting anomalies', { userId });

    const anomalies: BehaviorAnomaly[] = [];
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get recent and historical events
    const recentEvents = await this.eventStore.getByUser(userId, {
      since: weekAgo,
      includeProcessed: true,
    });

    const historicalEvents = await this.eventStore.getByUser(userId, {
      since: twoWeeksAgo,
      until: weekAgo,
      includeProcessed: true,
    });

    // Check for sudden disengagement
    const recentSessions = recentEvents.filter(
      (e) => e.type === BehaviorEventType.SESSION_START
    ).length;
    const historicalSessions = historicalEvents.filter(
      (e) => e.type === BehaviorEventType.SESSION_START
    ).length;

    if (historicalSessions > 0 && recentSessions < historicalSessions * 0.5) {
      anomalies.push({
        id: uuidv4(),
        userId,
        type: AnomalyType.SUDDEN_DISENGAGEMENT,
        severity: recentSessions === 0 ? 'high' : 'medium',
        description: 'Significant decrease in session frequency detected',
        detectedAt: now,
        expectedValue: historicalSessions,
        actualValue: recentSessions,
        deviation: ((historicalSessions - recentSessions) / historicalSessions) * 100,
        relatedEvents: recentEvents.slice(0, 5).map((e) => e.id),
        suggestedAction: 'Consider sending a re-engagement check-in',
      });
    }

    // Check for repeated failures
    const failures = recentEvents.filter(
      (e) =>
        e.type === BehaviorEventType.ASSESSMENT_ATTEMPT &&
        (e.data as Record<string, unknown>).passed === false
    );

    if (failures.length >= 3) {
      anomalies.push({
        id: uuidv4(),
        userId,
        type: AnomalyType.REPEATED_FAILURES,
        severity: failures.length >= 5 ? 'high' : 'medium',
        description: 'Multiple failed assessment attempts detected',
        detectedAt: now,
        expectedValue: 0,
        actualValue: failures.length,
        deviation: failures.length * 20,
        relatedEvents: failures.map((e) => e.id),
        suggestedAction: 'Suggest review materials or easier content',
      });
    }

    // Check for frustration signals
    const frustrationSignals = recentEvents.filter(
      (e) =>
        e.emotionalSignals?.some(
          (s) =>
            s.type === EmotionalSignalType.FRUSTRATION && s.intensity >= this.frustrationThreshold
        )
    );

    if (frustrationSignals.length >= 2) {
      anomalies.push({
        id: uuidv4(),
        userId,
        type: AnomalyType.PERFORMANCE_DROP,
        severity: 'high',
        description: 'High frustration levels detected',
        detectedAt: now,
        expectedValue: 0,
        actualValue: frustrationSignals.length,
        deviation: frustrationSignals.length * 30,
        relatedEvents: frustrationSignals.map((e) => e.id),
        suggestedAction: 'Offer immediate support or break suggestion',
      });
    }

    return anomalies;
  }

  /**
   * Predict churn risk for a user
   */
  async predictChurn(userId: string): Promise<ChurnPrediction> {
    this.logger.info('Predicting churn', { userId });

    const now = new Date();
    const windowStart = new Date(
      now.getTime() - this.churnPredictionWindow * 24 * 60 * 60 * 1000
    );

    const events = await this.eventStore.getByUser(userId, {
      since: windowStart,
      includeProcessed: true,
    });

    const factors: ChurnFactor[] = [];
    let totalRisk = 0;

    // Factor 1: Session frequency
    const sessions = events.filter((e) => e.type === BehaviorEventType.SESSION_START).length;
    const expectedSessions = this.churnPredictionWindow * 0.7; // Expect ~5 sessions/week
    const sessionRisk = Math.max(0, 1 - sessions / expectedSessions);
    totalRisk += sessionRisk * 0.3;
    factors.push({
      name: 'Session Frequency',
      contribution: sessionRisk * 0.3,
      trend: sessions < expectedSessions * 0.5 ? 'decreasing' : 'stable',
      description: `${sessions} sessions in the last ${this.churnPredictionWindow} days`,
    });

    // Factor 2: Content engagement
    const interactions = events.filter(
      (e) => e.type === BehaviorEventType.CONTENT_INTERACTION
    ).length;
    const expectedInteractions = sessions * 3;
    const engagementRisk = sessions > 0 ? Math.max(0, 1 - interactions / expectedInteractions) : 1;
    totalRisk += engagementRisk * 0.25;
    factors.push({
      name: 'Content Engagement',
      contribution: engagementRisk * 0.25,
      trend: interactions < expectedInteractions * 0.5 ? 'decreasing' : 'stable',
      description: `${interactions} content interactions across sessions`,
    });

    // Factor 3: Frustration signals
    const frustrationEvents = events.filter((e) =>
      e.emotionalSignals?.some((s) => s.type === EmotionalSignalType.FRUSTRATION)
    );
    const frustrationRisk = Math.min(1, frustrationEvents.length / 5);
    totalRisk += frustrationRisk * 0.25;
    factors.push({
      name: 'Frustration Level',
      contribution: frustrationRisk * 0.25,
      trend: frustrationEvents.length > 2 ? 'increasing' : 'stable',
      description: `${frustrationEvents.length} frustration signals detected`,
    });

    // Factor 4: Goal abandonment
    const abandonedGoals = events.filter(
      (e) => e.type === BehaviorEventType.GOAL_ABANDONED
    ).length;
    const goalRisk = Math.min(1, abandonedGoals / 2);
    totalRisk += goalRisk * 0.2;
    factors.push({
      name: 'Goal Abandonment',
      contribution: goalRisk * 0.2,
      trend: abandonedGoals > 0 ? 'increasing' : 'stable',
      description: `${abandonedGoals} goals abandoned`,
    });

    // Calculate risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (totalRisk >= 0.8) riskLevel = 'critical';
    else if (totalRisk >= 0.6) riskLevel = 'high';
    else if (totalRisk >= 0.4) riskLevel = 'medium';
    else riskLevel = 'low';

    // Estimate time to churn
    const timeToChurn =
      riskLevel === 'critical'
        ? 3
        : riskLevel === 'high'
          ? 7
          : riskLevel === 'medium'
            ? 14
            : undefined;

    // Generate interventions
    const interventions = await this.suggestInterventions(
      await this.patternStore.getByUser(userId)
    );

    return {
      userId,
      predictedAt: now,
      churnProbability: totalRisk,
      riskLevel,
      factors,
      recommendedInterventions: interventions,
      timeToChurn,
    };
  }

  /**
   * Predict struggle areas for a user
   */
  async predictStruggle(userId: string): Promise<StrugglePrediction> {
    this.logger.info('Predicting struggle', { userId });

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const events = await this.eventStore.getByUser(userId, {
      since: weekAgo,
      includeProcessed: true,
    });

    const areas: StruggleArea[] = [];
    const support: SupportRecommendation[] = [];

    // Analyze by content area
    const contentAreas = new Map<
      string,
      { failures: number; hints: number; time: number; total: number }
    >();

    for (const event of events) {
      const courseId = event.pageContext.courseId;
      const chapterId = event.pageContext.chapterId;
      const areaKey = `${courseId}:${chapterId}`;

      if (!contentAreas.has(areaKey)) {
        contentAreas.set(areaKey, { failures: 0, hints: 0, time: 0, total: 0 });
      }

      const area = contentAreas.get(areaKey)!;
      area.total++;

      if (
        event.type === BehaviorEventType.ASSESSMENT_ATTEMPT &&
        (event.data as Record<string, unknown>).passed === false
      ) {
        area.failures++;
      }

      if (event.type === BehaviorEventType.HINT_REQUEST) {
        area.hints++;
      }

      if (event.pageContext.timeOnPage) {
        area.time += event.pageContext.timeOnPage;
      }
    }

    // Identify struggle areas
    for (const [areaKey, stats] of contentAreas.entries()) {
      const failureRate = stats.total > 0 ? stats.failures / stats.total : 0;
      const hintRate = stats.total > 0 ? stats.hints / stats.total : 0;
      const avgTime = stats.total > 0 ? stats.time / stats.total : 0;

      // High failure or hint rate indicates struggle
      if (failureRate > 0.3 || hintRate > 0.5 || avgTime > 600) {
        // 10+ min avg
        const severity: 'mild' | 'moderate' | 'severe' =
          failureRate > 0.5 || hintRate > 0.7 ? 'severe' : failureRate > 0.3 ? 'moderate' : 'mild';

        areas.push({
          topic: areaKey,
          severity,
          indicators: [
            `${Math.round(failureRate * 100)}% failure rate`,
            `${stats.hints} hint requests`,
            `${Math.round(avgTime / 60)} min average time`,
          ],
          suggestedRemediation: 'Review foundational concepts and try practice exercises',
        });
      }
    }

    // Generate support recommendations based on struggle areas
    if (areas.some((a) => a.severity === 'severe')) {
      support.push({
        type: 'tutoring',
        description: 'One-on-one tutoring session recommended',
        priority: 'high',
        resources: ['Mentor session', 'Office hours'],
      });
    }

    if (areas.length > 0) {
      support.push({
        type: 'content',
        description: 'Review supplementary materials',
        priority: 'medium',
        resources: areas.map((a) => `Review: ${a.topic}`),
      });

      support.push({
        type: 'practice',
        description: 'Additional practice exercises',
        priority: 'medium',
      });
    }

    // Calculate overall struggle probability
    const struggleProbability =
      areas.length > 0
        ? Math.min(
            1,
            areas.reduce(
              (sum, a) => sum + (a.severity === 'severe' ? 0.4 : a.severity === 'moderate' ? 0.2 : 0.1),
              0
            )
          )
        : 0;

    return {
      userId,
      predictedAt: now,
      struggleProbability,
      areas,
      recommendedSupport: support,
    };
  }

  /**
   * Suggest interventions based on patterns
   */
  async suggestInterventions(patterns: BehaviorPattern[]): Promise<Intervention[]> {
    const interventions: Intervention[] = [];

    for (const pattern of patterns) {
      const intervention = this.createInterventionForPattern(pattern);
      if (intervention) {
        interventions.push(intervention);
      }
    }

    return interventions;
  }

  /**
   * Get behavior events for a user
   */
  async getEvents(userId: string, options?: EventQueryOptions): Promise<BehaviorEvent[]> {
    return this.eventStore.getByUser(userId, options);
  }

  /**
   * Get events for a session
   */
  async getSessionEvents(sessionId: string): Promise<BehaviorEvent[]> {
    return this.eventStore.getBySession(sessionId);
  }

  /**
   * Get patterns for a user
   */
  async getPatterns(userId: string): Promise<BehaviorPattern[]> {
    return this.patternStore.getByUser(userId);
  }

  /**
   * Get pending interventions for a user
   */
  async getPendingInterventions(userId: string): Promise<Intervention[]> {
    return this.interventionStore.getByUser(userId, true);
  }

  /**
   * Execute an intervention
   */
  async executeIntervention(interventionId: string): Promise<Intervention> {
    const intervention = await this.interventionStore.get(interventionId);
    if (!intervention) {
      throw new Error(`Intervention not found: ${interventionId}`);
    }

    this.logger.info('Executing intervention', { interventionId, type: intervention.type });

    return this.interventionStore.update(interventionId, {
      executedAt: new Date(),
    });
  }

  /**
   * Record intervention result
   */
  async recordInterventionResult(
    interventionId: string,
    result: InterventionResult
  ): Promise<void> {
    await this.interventionStore.recordResult(interventionId, result);
  }

  /**
   * Create an intervention for a user
   */
  async createIntervention(
    userId: string,
    intervention: Omit<Intervention, 'id' | 'createdAt'>
  ): Promise<Intervention> {
    const created = await this.interventionStore.create(intervention);
    this.interventionStore.setUserIntervention(userId, created.id);
    return created;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async processEmotionalSignals(
    userId: string,
    signals: EmotionalSignal[]
  ): Promise<void> {
    const frustrationSignals = signals.filter(
      (s) => s.type === EmotionalSignalType.FRUSTRATION && s.intensity >= this.frustrationThreshold
    );

    if (frustrationSignals.length > 0) {
      this.logger.warn('High frustration detected', {
        userId,
        intensity: frustrationSignals[0].intensity,
      });

      // Create an intervention for high frustration
      await this.createIntervention(userId, {
        type: InterventionType.BREAK_SUGGESTION,
        priority: 'high',
        message: 'It looks like you might be feeling frustrated. Would you like to take a short break?',
        suggestedActions: [
          {
            id: uuidv4(),
            title: 'Take a Break',
            description: '5-minute break to refresh',
            type: ActionType.TAKE_BREAK,
            priority: 'high',
          },
          {
            id: uuidv4(),
            title: 'Get Help',
            description: 'Connect with a mentor',
            type: ActionType.CONTACT_MENTOR,
            priority: 'medium',
          },
        ],
        timing: {
          type: 'immediate',
        },
      });
    }
  }

  private detectTimePreference(userId: string, events: BehaviorEvent[]): BehaviorPattern | null {
    const hourCounts = new Map<number, number>();

    for (const event of events) {
      if (event.type === BehaviorEventType.SESSION_START) {
        const hour = event.timestamp.getHours();
        hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
      }
    }

    if (hourCounts.size === 0) return null;

    // Find peak hours
    let maxCount = 0;
    let peakHour = 0;
    for (const [hour, count] of hourCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        peakHour = hour;
      }
    }

    const totalSessions = Array.from(hourCounts.values()).reduce((a, b) => a + b, 0);
    const confidence = maxCount / totalSessions;

    if (confidence < 0.3) return null;

    const timeOfDay =
      peakHour < 12 ? 'morning' : peakHour < 17 ? 'afternoon' : peakHour < 21 ? 'evening' : 'night';

    return {
      id: '',
      userId,
      type: PatternType.TIME_PREFERENCE,
      name: `${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} Learner`,
      description: `Prefers to study during ${timeOfDay} hours (around ${peakHour}:00)`,
      frequency: maxCount,
      duration: 0,
      confidence,
      contexts: [{ timeOfDay }],
      firstObservedAt: events[events.length - 1]?.timestamp ?? new Date(),
      lastObservedAt: events[0]?.timestamp ?? new Date(),
      occurrences: maxCount,
    };
  }

  private detectLearningHabit(userId: string, events: BehaviorEvent[]): BehaviorPattern | null {
    const sessionStarts = events.filter((e) => e.type === BehaviorEventType.SESSION_START);
    if (sessionStarts.length < 3) return null;

    // Calculate average session duration
    const sessionDurations: number[] = [];
    const sessionEndEvents = events.filter((e) => e.type === BehaviorEventType.SESSION_END);

    for (const start of sessionStarts) {
      const end = sessionEndEvents.find(
        (e) => e.sessionId === start.sessionId && e.timestamp > start.timestamp
      );
      if (end) {
        sessionDurations.push(
          (end.timestamp.getTime() - start.timestamp.getTime()) / (60 * 1000)
        );
      }
    }

    if (sessionDurations.length === 0) return null;

    const avgDuration =
      sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length;

    // Check for consistent daily learning
    const daySet = new Set(
      sessionStarts.map((e) => e.timestamp.toISOString().split('T')[0])
    );
    const daysActive = daySet.size;
    const firstDay = new Date(
      Math.min(...sessionStarts.map((e) => e.timestamp.getTime()))
    );
    const lastDay = new Date(
      Math.max(...sessionStarts.map((e) => e.timestamp.getTime()))
    );
    const totalDays = Math.max(
      1,
      Math.ceil((lastDay.getTime() - firstDay.getTime()) / (24 * 60 * 60 * 1000))
    );
    const consistency = daysActive / totalDays;

    if (consistency < 0.3) return null;

    return {
      id: '',
      userId,
      type: PatternType.LEARNING_HABIT,
      name: consistency > 0.7 ? 'Consistent Learner' : 'Regular Learner',
      description: `Studies ${Math.round(avgDuration)} minutes on average, active ${daysActive} out of ${totalDays} days`,
      frequency: daysActive,
      duration: avgDuration,
      confidence: consistency,
      contexts: [],
      firstObservedAt: firstDay,
      lastObservedAt: lastDay,
      occurrences: sessionStarts.length,
    };
  }

  private detectStrugglePatterns(userId: string, events: BehaviorEvent[]): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = [];

    // Detect hint-seeking pattern
    const hintRequests = events.filter((e) => e.type === BehaviorEventType.HINT_REQUEST);
    if (hintRequests.length >= 5) {
      const contentAreas = new Set(hintRequests.map((e) => e.pageContext.chapterId).filter(Boolean));

      patterns.push({
        id: '',
        userId,
        type: PatternType.HELP_SEEKING,
        name: 'Hint Seeker',
        description: `Frequently requests hints (${hintRequests.length} times across ${contentAreas.size} areas)`,
        frequency: hintRequests.length,
        duration: 0,
        confidence: Math.min(1, hintRequests.length / 10),
        contexts: Array.from(contentAreas).map((chapterId) => ({ chapterId })) as PatternContext[],
        firstObservedAt: hintRequests[hintRequests.length - 1]?.timestamp ?? new Date(),
        lastObservedAt: hintRequests[0]?.timestamp ?? new Date(),
        occurrences: hintRequests.length,
      });
    }

    // Detect struggle with specific content
    const failedAttempts = events.filter(
      (e) =>
        e.type === BehaviorEventType.ASSESSMENT_ATTEMPT &&
        (e.data as Record<string, unknown>).passed === false
    );

    if (failedAttempts.length >= 3) {
      patterns.push({
        id: '',
        userId,
        type: PatternType.STRUGGLE_PATTERN,
        name: 'Assessment Challenges',
        description: `Experiencing difficulty with assessments (${failedAttempts.length} failed attempts)`,
        frequency: failedAttempts.length,
        duration: 0,
        confidence: Math.min(1, failedAttempts.length / 5),
        contexts: [],
        firstObservedAt: failedAttempts[failedAttempts.length - 1]?.timestamp ?? new Date(),
        lastObservedAt: failedAttempts[0]?.timestamp ?? new Date(),
        occurrences: failedAttempts.length,
      });
    }

    return patterns;
  }

  private detectSuccessPattern(userId: string, events: BehaviorEvent[]): BehaviorPattern | null {
    const successSignals = events.filter(
      (e) =>
        e.type === BehaviorEventType.SUCCESS_SIGNAL ||
        (e.type === BehaviorEventType.ASSESSMENT_ATTEMPT &&
          (e.data as Record<string, unknown>).passed === true)
    );

    if (successSignals.length < 3) return null;

    return {
      id: '',
      userId,
      type: PatternType.SUCCESS_PATTERN,
      name: 'Achievement Oriented',
      description: `Regular success signals (${successSignals.length} achievements)`,
      frequency: successSignals.length,
      duration: 0,
      confidence: Math.min(1, successSignals.length / 10),
      contexts: [],
      firstObservedAt: successSignals[successSignals.length - 1]?.timestamp ?? new Date(),
      lastObservedAt: successSignals[0]?.timestamp ?? new Date(),
      occurrences: successSignals.length,
    };
  }

  private createInterventionForPattern(pattern: BehaviorPattern): Intervention | null {
    const now = new Date();

    switch (pattern.type) {
      case PatternType.STRUGGLE_PATTERN:
        return {
          id: uuidv4(),
          type: InterventionType.CONTENT_RECOMMENDATION,
          priority: 'high',
          message:
            'We noticed you might be struggling with some content. Here are some resources that might help.',
          suggestedActions: [
            {
              id: uuidv4(),
              title: 'Review Basics',
              description: 'Go back to foundational concepts',
              type: ActionType.REVIEW_CONTENT,
              priority: 'high',
            },
            {
              id: uuidv4(),
              title: 'Get Help',
              description: 'Connect with a mentor',
              type: ActionType.CONTACT_MENTOR,
              priority: 'medium',
            },
          ],
          timing: { type: 'on_next_session' },
          createdAt: now,
        };

      case PatternType.HELP_SEEKING:
        return {
          id: uuidv4(),
          type: InterventionType.CONTENT_RECOMMENDATION,
          priority: 'medium',
          message:
            'We see you have been asking for hints frequently. Would you like some additional support?',
          suggestedActions: [
            {
              id: uuidv4(),
              title: 'Easier Content',
              description: 'Try simpler exercises first',
              type: ActionType.START_ACTIVITY,
              priority: 'high',
            },
          ],
          timing: { type: 'on_next_session' },
          createdAt: now,
        };

      case PatternType.FATIGUE_PATTERN:
        return {
          id: uuidv4(),
          type: InterventionType.BREAK_SUGGESTION,
          priority: 'medium',
          message:
            'You have been working hard! Consider taking a short break to refresh your mind.',
          suggestedActions: [
            {
              id: uuidv4(),
              title: 'Take a Break',
              description: '5-10 minute break',
              type: ActionType.TAKE_BREAK,
              priority: 'high',
            },
          ],
          timing: { type: 'immediate' },
          createdAt: now,
        };

      case PatternType.SUCCESS_PATTERN:
        return {
          id: uuidv4(),
          type: InterventionType.ENCOURAGEMENT,
          priority: 'low',
          message: 'Great job! You are making excellent progress. Keep up the good work!',
          suggestedActions: [
            {
              id: uuidv4(),
              title: 'Challenge Yourself',
              description: 'Try more advanced content',
              type: ActionType.START_ACTIVITY,
              priority: 'medium',
            },
          ],
          timing: { type: 'on_next_session' },
          createdAt: now,
        };

      default:
        return null;
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new BehaviorMonitor instance
 */
export function createBehaviorMonitor(config?: BehaviorMonitorConfig): BehaviorMonitor {
  return new BehaviorMonitor(config);
}
