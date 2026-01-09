/**
 * SAM Proactive Intervention Integration
 * Integrates the BehaviorMonitor, CheckInScheduler, and MultiSessionPlanTracker
 * with the unified API route for proactive user engagement.
 *
 * ARCHITECTURE NOTE: This module uses the TaxomindContext to get Prisma stores
 * for persistent storage. All data is stored in the database, not in-memory.
 */

import { logger } from '@/lib/logger';

import {
  BehaviorMonitor,
  createBehaviorMonitor,
  CheckInScheduler,
  createCheckInScheduler,
  MultiSessionPlanTracker,
  createMultiSessionPlanTracker,
  type BehaviorEvent,
  type BehaviorEventType,
  type ChurnPrediction,
  type StrugglePrediction,
  type Intervention,
  type ScheduledCheckIn,
  type TriggeredCheckIn,
  type UserContext,
  type ProactiveLogger,
  TriggerType,
  BehaviorEventType as EventType,
  InterventionType,
} from '@sam-ai/agentic';

// Import the centralized context for Prisma stores
import { getProactiveStores } from './taxomind-context';
import {
  createPrismaCheckInStore,
  createPrismaLearningPlanStore,
} from './stores';

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

let behaviorMonitor: BehaviorMonitor | null = null;
let checkInScheduler: CheckInScheduler | null = null;
let planTracker: MultiSessionPlanTracker | null = null;

// ============================================================================
// PROACTIVE INTERVENTION LOGGER
// ============================================================================

const proactiveLogger: ProactiveLogger = {
  debug: (message: string, data?: Record<string, unknown>) => {
    logger.debug(`[SAM_PROACTIVE] ${message}`, data);
  },
  info: (message: string, data?: Record<string, unknown>) => {
    logger.info(`[SAM_PROACTIVE] ${message}`, data);
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    logger.warn(`[SAM_PROACTIVE] ${message}`, data);
  },
  error: (message: string, data?: Record<string, unknown>) => {
    logger.error(`[SAM_PROACTIVE] ${message}`, data);
  },
};

// ============================================================================
// INITIALIZATION
// ============================================================================

export interface ProactiveInterventionConfig {
  patternDetectionThreshold?: number;
  churnPredictionWindow?: number;
  frustrationThreshold?: number;
  checkInExpirationHours?: number;
  defaultDailyMinutes?: number;
  streakGracePeriodDays?: number;
}

/**
 * Initialize the proactive intervention subsystem
 */
export function initializeProactiveInterventions(
  config: ProactiveInterventionConfig = {}
): ProactiveInterventionSubsystems {
  if (behaviorMonitor && checkInScheduler && planTracker) {
    return {
      behaviorMonitor,
      checkInScheduler,
      planTracker,
    };
  }

  // Get Prisma stores from the centralized context
  const proactiveStores = getProactiveStores();

  // Initialize Behavior Monitor with Prisma stores for persistent storage
  behaviorMonitor = createBehaviorMonitor({
    eventStore: proactiveStores.behaviorEvent,
    patternStore: proactiveStores.pattern,
    interventionStore: proactiveStores.intervention,
    logger: proactiveLogger,
    patternDetectionThreshold: config.patternDetectionThreshold ?? 3,
    churnPredictionWindow: config.churnPredictionWindow ?? 14,
    frustrationThreshold: config.frustrationThreshold ?? 0.7,
  });

  // Initialize Check-In Scheduler with Prisma store for persistent storage
  checkInScheduler = createCheckInScheduler({
    store: createPrismaCheckInStore(),
    logger: proactiveLogger,
    checkInExpirationHours: config.checkInExpirationHours ?? 24,
  });

  // Initialize Multi-Session Plan Tracker with Prisma store for persistent storage
  planTracker = createMultiSessionPlanTracker({
    store: createPrismaLearningPlanStore(),
    logger: proactiveLogger,
    defaultDailyMinutes: config.defaultDailyMinutes ?? 30,
    streakGracePeriodDays: config.streakGracePeriodDays ?? 1,
  });

  proactiveLogger.info('Proactive intervention subsystems initialized');

  return {
    behaviorMonitor,
    checkInScheduler,
    planTracker,
  };
}

export interface ProactiveInterventionSubsystems {
  behaviorMonitor: BehaviorMonitor;
  checkInScheduler: CheckInScheduler;
  planTracker: MultiSessionPlanTracker;
}

/**
 * Get the current proactive intervention subsystems
 */
export function getProactiveSubsystems(): ProactiveInterventionSubsystems | null {
  if (!behaviorMonitor || !checkInScheduler || !planTracker) {
    return null;
  }
  return {
    behaviorMonitor,
    checkInScheduler,
    planTracker,
  };
}

// ============================================================================
// BEHAVIOR TRACKING
// ============================================================================

/**
 * Track a user behavior event
 * Call this during API requests to log user interactions
 */
export async function trackBehaviorEvent(
  event: Omit<BehaviorEvent, 'id' | 'processed' | 'processedAt'>
): Promise<BehaviorEvent | null> {
  if (!behaviorMonitor) {
    proactiveLogger.warn('Behavior monitor not initialized');
    return null;
  }

  try {
    return await behaviorMonitor.trackEvent(event);
  } catch (error) {
    proactiveLogger.error('Failed to track behavior event', {
      error: error instanceof Error ? error.message : 'Unknown error',
      eventType: event.type,
    });
    return null;
  }
}

/**
 * Track a session start event
 */
export async function trackSessionStart(
  userId: string,
  sessionId: string,
  pageContext: {
    path: string;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
  }
): Promise<BehaviorEvent | null> {
  return trackBehaviorEvent({
    userId,
    sessionId,
    type: EventType.SESSION_START,
    timestamp: new Date(),
    pageContext: {
      url: pageContext.path,
      courseId: pageContext.courseId,
      chapterId: pageContext.chapterId,
      sectionId: pageContext.sectionId,
    },
    data: {},
  });
}

/**
 * Track a content interaction event
 */
export async function trackContentInteraction(
  userId: string,
  sessionId: string,
  pageContext: {
    path: string;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    timeOnPage?: number;
  },
  interactionType: 'view' | 'read' | 'complete' | 'skip'
): Promise<BehaviorEvent | null> {
  return trackBehaviorEvent({
    userId,
    sessionId,
    type: EventType.CONTENT_INTERACTION,
    timestamp: new Date(),
    pageContext: {
      url: pageContext.path,
      contentType: 'content',
      courseId: pageContext.courseId,
      chapterId: pageContext.chapterId,
      sectionId: pageContext.sectionId,
      timeOnPage: pageContext.timeOnPage,
    },
    data: {
      interactionType,
    },
  });
}

/**
 * Track a question asked event
 */
export async function trackQuestionAsked(
  userId: string,
  sessionId: string,
  pageContext: {
    path: string;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
  },
  questionData: {
    question: string;
    bloomsLevel?: string;
    topic?: string;
  }
): Promise<BehaviorEvent | null> {
  return trackBehaviorEvent({
    userId,
    sessionId,
    type: EventType.QUESTION_ASKED,
    timestamp: new Date(),
    pageContext: {
      url: pageContext.path,
      contentType: 'sam-chat',
      courseId: pageContext.courseId,
      chapterId: pageContext.chapterId,
      sectionId: pageContext.sectionId,
    },
    data: questionData,
  });
}

/**
 * Track a hint request event
 */
export async function trackHintRequest(
  userId: string,
  sessionId: string,
  pageContext: {
    path: string;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
  },
  topic: string
): Promise<BehaviorEvent | null> {
  return trackBehaviorEvent({
    userId,
    sessionId,
    type: EventType.HINT_REQUEST,
    timestamp: new Date(),
    pageContext: {
      url: pageContext.path,
      contentType: 'content',
      courseId: pageContext.courseId,
      chapterId: pageContext.chapterId,
      sectionId: pageContext.sectionId,
    },
    data: { topic },
  });
}

/**
 * Track an assessment attempt event
 */
export async function trackAssessmentAttempt(
  userId: string,
  sessionId: string,
  pageContext: {
    path: string;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
  },
  assessmentData: {
    assessmentId: string;
    passed: boolean;
    score: number;
    maxScore: number;
    timeSpentMinutes: number;
  }
): Promise<BehaviorEvent | null> {
  return trackBehaviorEvent({
    userId,
    sessionId,
    type: EventType.ASSESSMENT_ATTEMPT,
    timestamp: new Date(),
    pageContext: {
      url: pageContext.path,
      contentType: 'assessment',
      courseId: pageContext.courseId,
      chapterId: pageContext.chapterId,
      sectionId: pageContext.sectionId,
    },
    data: assessmentData,
  });
}

/**
 * Track frustration signal
 */
export async function trackFrustrationSignal(
  userId: string,
  sessionId: string,
  pageContext: {
    path: string;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
  },
  intensity: number,
  source: string
): Promise<BehaviorEvent | null> {
  return trackBehaviorEvent({
    userId,
    sessionId,
    type: EventType.CONTENT_INTERACTION,
    timestamp: new Date(),
    pageContext: {
      url: pageContext.path,
      contentType: 'content',
      courseId: pageContext.courseId,
      chapterId: pageContext.chapterId,
      sectionId: pageContext.sectionId,
    },
    data: { source },
    emotionalSignals: [
      {
        type: 'frustration',
        intensity,
        source: source as 'text' | 'timing' | 'pattern' | 'behavior',
        timestamp: new Date(),
      },
    ],
  });
}

// ============================================================================
// PATTERN DETECTION & PREDICTION
// ============================================================================

/**
 * Detect behavior patterns for a user
 */
export async function detectPatterns(userId: string): Promise<{
  patterns: Array<{
    type: string;
    name: string;
    description: string;
    confidence: number;
    occurrences: number;
  }>;
} | null> {
  if (!behaviorMonitor) {
    proactiveLogger.warn('Behavior monitor not initialized');
    return null;
  }

  try {
    const patterns = await behaviorMonitor.detectPatterns(userId);
    return {
      patterns: patterns.map((p) => ({
        type: p.type,
        name: p.name,
        description: p.description,
        confidence: p.confidence,
        occurrences: p.occurrences,
      })),
    };
  } catch (error) {
    proactiveLogger.error('Failed to detect patterns', { error });
    return null;
  }
}

/**
 * Predict churn risk for a user
 */
export async function predictChurnRisk(userId: string): Promise<{
  probability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: Array<{ name: string; contribution: number; trend: string }>;
  timeToChurn?: number;
  recommendedInterventions: Array<{ type: string; priority: string; message: string }>;
} | null> {
  if (!behaviorMonitor) {
    proactiveLogger.warn('Behavior monitor not initialized');
    return null;
  }

  try {
    const prediction = await behaviorMonitor.predictChurn(userId);
    return {
      probability: prediction.churnProbability,
      riskLevel: prediction.riskLevel,
      factors: prediction.factors.map((f) => ({
        name: f.name,
        contribution: f.contribution,
        trend: f.trend,
      })),
      timeToChurn: prediction.timeToChurn,
      recommendedInterventions: prediction.recommendedInterventions.map((i) => ({
        type: i.type,
        priority: i.priority,
        message: i.message,
      })),
    };
  } catch (error) {
    proactiveLogger.error('Failed to predict churn', { error });
    return null;
  }
}

/**
 * Predict struggle areas for a user
 */
export async function predictStruggleAreas(userId: string): Promise<{
  probability: number;
  areas: Array<{
    topic: string;
    severity: 'mild' | 'moderate' | 'severe';
    indicators: string[];
    suggestedRemediation: string;
  }>;
  recommendedSupport: Array<{
    type: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
} | null> {
  if (!behaviorMonitor) {
    proactiveLogger.warn('Behavior monitor not initialized');
    return null;
  }

  try {
    const prediction = await behaviorMonitor.predictStruggle(userId);
    return {
      probability: prediction.struggleProbability,
      areas: prediction.areas.map((a) => ({
        topic: a.topic,
        severity: a.severity,
        indicators: a.indicators,
        suggestedRemediation: a.suggestedRemediation,
      })),
      recommendedSupport: prediction.recommendedSupport.map((s) => ({
        type: s.type,
        description: s.description,
        priority: s.priority,
      })),
    };
  } catch (error) {
    proactiveLogger.error('Failed to predict struggle', { error });
    return null;
  }
}

// ============================================================================
// INTERVENTION MANAGEMENT
// ============================================================================

/**
 * Get pending interventions for a user
 */
export async function getPendingInterventions(
  userId: string
): Promise<Array<{
  id: string;
  type: string;
  priority: string;
  message: string;
  suggestedActions: Array<{ id: string; title: string; type: string }>;
}>> {
  if (!behaviorMonitor) {
    proactiveLogger.warn('Behavior monitor not initialized');
    return [];
  }

  try {
    const interventions = await behaviorMonitor.getPendingInterventions(userId);
    return interventions.map((i) => ({
      id: i.id,
      type: i.type,
      priority: i.priority,
      message: i.message,
      suggestedActions: i.suggestedActions.map((a) => ({
        id: a.id,
        title: a.title,
        type: a.type,
      })),
    }));
  } catch (error) {
    proactiveLogger.error('Failed to get pending interventions', { error });
    return [];
  }
}

/**
 * Create an intervention for a user
 */
export async function createIntervention(
  userId: string,
  intervention: {
    type: string;
    priority: 'high' | 'medium' | 'low';
    message: string;
    suggestedActions?: Array<{
      title: string;
      description: string;
      type: string;
      priority: string;
    }>;
  }
): Promise<{ id: string; type: string } | null> {
  if (!behaviorMonitor) {
    proactiveLogger.warn('Behavior monitor not initialized');
    return null;
  }

  try {
    const result = await behaviorMonitor.createIntervention(userId, {
      type: intervention.type as InterventionType,
      priority: intervention.priority,
      message: intervention.message,
      suggestedActions: (intervention.suggestedActions ?? []).map((a, idx) => ({
        id: `action-${idx}`,
        title: a.title,
        description: a.description,
        type: a.type as 'start_activity' | 'review_content' | 'take_break' | 'adjust_goal' | 'contact_mentor' | 'view_progress' | 'complete_review',
        priority: a.priority as 'high' | 'medium' | 'low',
      })),
      timing: { type: 'immediate' },
    });

    return {
      id: result.id,
      type: result.type,
    };
  } catch (error) {
    proactiveLogger.error('Failed to create intervention', { error });
    return null;
  }
}

// ============================================================================
// CHECK-IN MANAGEMENT
// ============================================================================

/**
 * Evaluate triggers and get check-ins that should fire
 */
export async function evaluateCheckInTriggers(
  userId: string,
  context: {
    lastSessionAt?: Date;
    currentStreak?: number;
    streakAtRisk?: boolean;
    masteryScore?: number;
    frustrationLevel?: number;
    goalProgress?: number;
    goalDeadline?: Date;
    lastAssessmentPassed?: boolean;
    daysSinceLastSession?: number;
  }
): Promise<Array<{
  checkInId: string;
  urgency: 'immediate' | 'soon' | 'routine';
  triggeredConditions: Array<{ type: string; threshold: number; met: boolean }>;
}>> {
  if (!checkInScheduler) {
    proactiveLogger.warn('Check-in scheduler not initialized');
    return [];
  }

  try {
    const userContext: UserContext = {
      userId,
      ...context,
    };

    const triggered = await checkInScheduler.evaluateTriggers(userId, userContext);
    return triggered.map((t) => ({
      checkInId: t.checkInId,
      urgency: t.urgency,
      triggeredConditions: t.triggerConditions.map((c) => ({
        type: c.type,
        threshold: c.threshold,
        met: c.met ?? false,
      })),
    }));
  } catch (error) {
    proactiveLogger.error('Failed to evaluate check-in triggers', { error });
    return [];
  }
}

/**
 * Get scheduled check-ins for a user
 */
export async function getScheduledCheckIns(
  userId: string
): Promise<Array<{
  id: string;
  type: string;
  scheduledTime: Date;
  message: string;
  priority: string;
}>> {
  if (!checkInScheduler) {
    proactiveLogger.warn('Check-in scheduler not initialized');
    return [];
  }

  try {
    const checkIns = await checkInScheduler.getScheduledCheckIns(userId);
    return checkIns.map((c) => ({
      id: c.id,
      type: c.type,
      scheduledTime: c.scheduledTime,
      message: c.message,
      priority: c.priority,
    }));
  } catch (error) {
    proactiveLogger.error('Failed to get scheduled check-ins', { error });
    return [];
  }
}

/**
 * Create a struggle detection check-in
 */
export async function createStruggleCheckIn(
  userId: string,
  frustrationLevel: number
): Promise<{ id: string; type: string } | null> {
  if (!checkInScheduler) {
    proactiveLogger.warn('Check-in scheduler not initialized');
    return null;
  }

  try {
    const checkIn = await checkInScheduler.createStruggleCheckIn(userId, [
      {
        type: TriggerType.FRUSTRATION_DETECTED,
        threshold: 0.7,
        comparison: 'gte',
        currentValue: frustrationLevel,
        met: frustrationLevel >= 0.7,
      },
    ]);

    return {
      id: checkIn.id,
      type: checkIn.type,
    };
  } catch (error) {
    proactiveLogger.error('Failed to create struggle check-in', { error });
    return null;
  }
}

/**
 * Create an inactivity re-engagement check-in
 */
export async function createInactivityCheckIn(
  userId: string,
  daysSinceLastActivity: number
): Promise<{ id: string; type: string } | null> {
  if (!checkInScheduler) {
    proactiveLogger.warn('Check-in scheduler not initialized');
    return null;
  }

  try {
    const checkIn = await checkInScheduler.createInactivityCheckIn(userId, daysSinceLastActivity);
    return {
      id: checkIn.id,
      type: checkIn.type,
    };
  } catch (error) {
    proactiveLogger.error('Failed to create inactivity check-in', { error });
    return null;
  }
}

/**
 * Create a streak risk check-in
 */
export async function createStreakRiskCheckIn(
  userId: string,
  currentStreak: number
): Promise<{ id: string; type: string } | null> {
  if (!checkInScheduler) {
    proactiveLogger.warn('Check-in scheduler not initialized');
    return null;
  }

  try {
    const checkIn = await checkInScheduler.createStreakRiskCheckIn(userId, currentStreak);
    return {
      id: checkIn.id,
      type: checkIn.type,
    };
  } catch (error) {
    proactiveLogger.error('Failed to create streak risk check-in', { error });
    return null;
  }
}

/**
 * Create a milestone celebration check-in
 */
export async function createMilestoneCelebration(
  userId: string,
  milestoneName: string,
  planId?: string
): Promise<{ id: string; type: string } | null> {
  if (!checkInScheduler) {
    proactiveLogger.warn('Check-in scheduler not initialized');
    return null;
  }

  try {
    const checkIn = await checkInScheduler.createMilestoneCelebration(
      userId,
      milestoneName,
      planId
    );
    return {
      id: checkIn.id,
      type: checkIn.type,
    };
  } catch (error) {
    proactiveLogger.error('Failed to create milestone celebration', { error });
    return null;
  }
}

// ============================================================================
// UNIFIED ROUTE INTEGRATION
// ============================================================================

/**
 * Process proactive interventions during a request
 * Call this in the unified route to track behavior and check for interventions
 */
export async function processProactiveInterventions(
  userId: string,
  sessionId: string,
  message: string,
  pageContext: {
    path: string;
    type: string;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
  },
  analysisData?: {
    bloomsLevel?: string;
    confidence?: number;
    topic?: string;
    frustrationDetected?: boolean;
    frustrationLevel?: number;
  }
): Promise<ProactiveInterventionResult> {
  const result: ProactiveInterventionResult = {
    eventsTracked: [],
    patternsDetected: [],
    interventionsTriggered: [],
    checkInsTriggered: [],
    predictions: null,
  };

  try {
    const subsystems = initializeProactiveInterventions();

    // Track the question asked event
    const questionEvent = await trackQuestionAsked(userId, sessionId, pageContext, {
      question: message,
      bloomsLevel: analysisData?.bloomsLevel,
      topic: analysisData?.topic,
    });

    if (questionEvent) {
      result.eventsTracked.push({
        id: questionEvent.id,
        type: questionEvent.type,
      });
    }

    // Track frustration if detected
    if (analysisData?.frustrationDetected && analysisData.frustrationLevel) {
      const frustrationEvent = await trackFrustrationSignal(
        userId,
        sessionId,
        pageContext,
        analysisData.frustrationLevel,
        'confidence_analysis'
      );

      if (frustrationEvent) {
        result.eventsTracked.push({
          id: frustrationEvent.id,
          type: frustrationEvent.type,
        });
      }

      // Create struggle check-in for high frustration
      if (analysisData.frustrationLevel >= 0.7) {
        const checkIn = await createStruggleCheckIn(userId, analysisData.frustrationLevel);
        if (checkIn) {
          result.checkInsTriggered.push(checkIn);
        }
      }
    }

    // Get pending interventions
    const interventions = await getPendingInterventions(userId);
    result.interventionsTriggered = interventions;

    // Predict churn and struggle (less frequently - only if patterns exist)
    const patterns = await detectPatterns(userId);
    if (patterns && patterns.patterns.length > 0) {
      result.patternsDetected = patterns.patterns;

      // Get predictions if concerning patterns detected
      const concerningPatterns = patterns.patterns.filter(
        (p) => p.type === 'struggle_pattern' || p.type === 'help_seeking'
      );

      if (concerningPatterns.length > 0) {
        const churnPrediction = await predictChurnRisk(userId);
        const strugglePrediction = await predictStruggleAreas(userId);

        result.predictions = {
          churn: churnPrediction,
          struggle: strugglePrediction,
        };
      }
    }

    proactiveLogger.info('Proactive interventions processed', {
      userId,
      eventsTracked: result.eventsTracked.length,
      patternsDetected: result.patternsDetected.length,
      interventionsTriggered: result.interventionsTriggered.length,
      checkInsTriggered: result.checkInsTriggered.length,
      hasPredictions: !!result.predictions,
    });
  } catch (error) {
    proactiveLogger.error('Failed to process proactive interventions', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });
  }

  return result;
}

export interface ProactiveInterventionResult {
  eventsTracked: Array<{ id: string; type: string }>;
  patternsDetected: Array<{
    type: string;
    name: string;
    description: string;
    confidence: number;
    occurrences: number;
  }>;
  interventionsTriggered: Array<{
    id: string;
    type: string;
    priority: string;
    message: string;
    suggestedActions: Array<{ id: string; title: string; type: string }>;
  }>;
  checkInsTriggered: Array<{ id: string; type: string }>;
  predictions: {
    churn: {
      probability: number;
      riskLevel: string;
      factors: Array<{ name: string; contribution: number; trend: string }>;
      timeToChurn?: number;
      recommendedInterventions: Array<{ type: string; priority: string; message: string }>;
    } | null;
    struggle: {
      probability: number;
      areas: Array<{
        topic: string;
        severity: string;
        indicators: string[];
        suggestedRemediation: string;
      }>;
      recommendedSupport: Array<{
        type: string;
        description: string;
        priority: string;
      }>;
    } | null;
  } | null;
}

/**
 * Format proactive intervention results for API response
 */
export function formatProactiveResponse(
  result: ProactiveInterventionResult
): ProactiveResponseData {
  return {
    eventsTracked: result.eventsTracked.length,
    patterns: result.patternsDetected.length > 0
      ? {
          count: result.patternsDetected.length,
          types: result.patternsDetected.map((p) => p.type),
          topPattern: result.patternsDetected[0]
            ? {
                name: result.patternsDetected[0].name,
                confidence: result.patternsDetected[0].confidence,
              }
            : undefined,
        }
      : undefined,
    interventions: result.interventionsTriggered.length > 0
      ? result.interventionsTriggered.map((i) => ({
          id: i.id,
          type: i.type,
          priority: i.priority,
          message: i.message,
          actionCount: i.suggestedActions.length,
        }))
      : undefined,
    checkIns: result.checkInsTriggered.length > 0
      ? result.checkInsTriggered.map((c) => ({
          id: c.id,
          type: c.type,
        }))
      : undefined,
    predictions: result.predictions
      ? {
          churnRisk: result.predictions.churn
            ? {
                level: result.predictions.churn.riskLevel,
                probability: result.predictions.churn.probability,
                timeToChurn: result.predictions.churn.timeToChurn,
              }
            : undefined,
          struggleRisk: result.predictions.struggle
            ? {
                probability: result.predictions.struggle.probability,
                areaCount: result.predictions.struggle.areas.length,
                topArea: result.predictions.struggle.areas[0]?.topic,
              }
            : undefined,
        }
      : undefined,
  };
}

export interface ProactiveResponseData {
  eventsTracked: number;
  patterns?: {
    count: number;
    types: string[];
    topPattern?: {
      name: string;
      confidence: number;
    };
  };
  interventions?: Array<{
    id: string;
    type: string;
    priority: string;
    message: string;
    actionCount: number;
  }>;
  checkIns?: Array<{
    id: string;
    type: string;
  }>;
  predictions?: {
    churnRisk?: {
      level: string;
      probability: number;
      timeToChurn?: number;
    };
    struggleRisk?: {
      probability: number;
      areaCount: number;
      topArea?: string;
    };
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  type BehaviorEvent,
  type BehaviorEventType,
  type ChurnPrediction,
  type StrugglePrediction,
  type Intervention,
  type ScheduledCheckIn,
  type TriggeredCheckIn,
  type UserContext,
};
