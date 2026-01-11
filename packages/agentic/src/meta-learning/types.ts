/**
 * @sam-ai/agentic - Meta-Learning Types
 * Types for meta-learning analytics, pattern recognition, and system optimization
 */

import { z } from 'zod';

// ============================================================================
// LEARNING PATTERN TYPES
// ============================================================================

/**
 * Learning pattern categories
 */
export const PatternCategory = {
  TEACHING_STRATEGY: 'teaching_strategy',
  STUDENT_BEHAVIOR: 'student_behavior',
  CONTENT_EFFECTIVENESS: 'content_effectiveness',
  ENGAGEMENT_PATTERN: 'engagement_pattern',
  ERROR_PATTERN: 'error_pattern',
  SUCCESS_PATTERN: 'success_pattern',
  INTERACTION_STYLE: 'interaction_style',
} as const;

export type PatternCategory = (typeof PatternCategory)[keyof typeof PatternCategory];

/**
 * Pattern confidence levels
 */
export const PatternConfidence = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  EMERGING: 'emerging',
} as const;

export type PatternConfidence = (typeof PatternConfidence)[keyof typeof PatternConfidence];

/**
 * Identified learning pattern
 */
export interface LearningPattern {
  id: string;
  category: PatternCategory;
  name: string;
  description: string;
  confidence: PatternConfidence;
  confidenceScore: number; // 0-1

  // Evidence
  occurrenceCount: number;
  sampleSize: number;
  significanceLevel: number; // Statistical significance

  // Context
  contexts: PatternContext[];
  triggers: string[];
  outcomes: PatternOutcome[];

  // Metrics
  successRate: number; // 0-1
  avgImpact: number; // -1 to 1
  consistency: number; // 0-1

  // Time
  firstObserved: Date;
  lastObserved: Date;
  trend: 'increasing' | 'stable' | 'decreasing';
}

/**
 * Pattern context - when/where pattern occurs
 */
export interface PatternContext {
  dimension: string;
  value: string;
  frequency: number;
  correlation: number;
}

/**
 * Pattern outcome - what happens when pattern is applied
 */
export interface PatternOutcome {
  metric: string;
  avgChange: number;
  stdDev: number;
  sampleCount: number;
}

// ============================================================================
// INSIGHT TYPES
// ============================================================================

/**
 * Insight types
 */
export const InsightType = {
  OPTIMIZATION: 'optimization',
  WARNING: 'warning',
  RECOMMENDATION: 'recommendation',
  TREND: 'trend',
  ANOMALY: 'anomaly',
  CORRELATION: 'correlation',
  PREDICTION: 'prediction',
} as const;

export type InsightType = (typeof InsightType)[keyof typeof InsightType];

/**
 * Insight priority
 */
export const InsightPriority = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info',
} as const;

export type InsightPriority = (typeof InsightPriority)[keyof typeof InsightPriority];

/**
 * Meta-learning insight
 */
export interface MetaLearningInsight {
  id: string;
  type: InsightType;
  priority: InsightPriority;

  // Content
  title: string;
  description: string;
  evidence: string[];

  // Recommendations
  recommendations: InsightRecommendation[];

  // Metrics
  confidence: number; // 0-1
  expectedImpact: number; // Estimated improvement

  // Scope
  affectedAreas: string[];
  timeframe: 'immediate' | 'short_term' | 'long_term';

  // Timestamps
  generatedAt: Date;
  validUntil?: Date;
}

/**
 * Recommendation from insight
 */
export interface InsightRecommendation {
  id: string;
  action: string;
  rationale: string;
  priority: number;
  effort: 'low' | 'medium' | 'high';
  expectedOutcome: string;
  metrics?: string[];
}

// ============================================================================
// STRATEGY TYPES
// ============================================================================

/**
 * Teaching/learning strategy
 */
export interface LearningStrategy {
  id: string;
  name: string;
  description: string;

  // Effectiveness
  effectivenessScore: number; // 0-100
  successRate: number; // 0-1
  engagementImpact: number; // -1 to 1

  // Applicability
  bestFor: StrategyCondition[];
  notRecommendedFor: StrategyCondition[];

  // Usage
  usageCount: number;
  lastUsed: Date;
  trend: 'increasing' | 'stable' | 'decreasing';

  // Metrics
  avgOutcome: number;
  stdDevOutcome: number;
}

/**
 * Condition for strategy applicability
 */
export interface StrategyCondition {
  dimension: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
  value: string | number | string[];
  weight: number;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

/**
 * Time period for analytics
 */
export const AnalyticsPeriod = {
  HOUR: 'hour',
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  ALL_TIME: 'all_time',
} as const;

export type AnalyticsPeriod = (typeof AnalyticsPeriod)[keyof typeof AnalyticsPeriod];

/**
 * Meta-learning analytics summary
 */
export interface MetaLearningAnalytics {
  id: string;
  userId?: string; // null for global
  period: AnalyticsPeriod;
  periodStart: Date;
  periodEnd: Date;

  // Pattern summary
  patternsIdentified: number;
  highConfidencePatterns: number;
  newPatterns: number;
  patternsByCategory: Record<PatternCategory, number>;

  // Strategy effectiveness
  strategiesEvaluated: number;
  topStrategies: StrategyRanking[];
  underperformingStrategies: StrategyRanking[];

  // System performance
  overallEffectiveness: number; // 0-100
  improvementFromBaseline: number;
  calibrationAccuracy: number;

  // Insights
  insightsGenerated: number;
  criticalInsights: number;
  actionableRecommendations: number;

  // Trends
  effectivenessTrend: TrendData;
  engagementTrend: TrendData;
  errorRateTrend: TrendData;

  // Generated
  generatedAt: Date;
}

/**
 * Strategy ranking
 */
export interface StrategyRanking {
  strategyId: string;
  strategyName: string;
  score: number;
  usageCount: number;
  trend: 'up' | 'stable' | 'down';
}

/**
 * Trend data
 */
export interface TrendData {
  direction: 'improving' | 'stable' | 'declining';
  changeRate: number; // Percentage change
  dataPoints: TrendPoint[];
  forecast?: number;
  confidence: number;
}

/**
 * Single trend data point
 */
export interface TrendPoint {
  timestamp: Date;
  value: number;
}

// ============================================================================
// LEARNING EVENT TYPES
// ============================================================================

/**
 * Learning event for tracking
 */
export interface LearningEvent {
  id: string;
  userId: string;
  sessionId: string;

  // Event details
  eventType: LearningEventType;
  timestamp: Date;

  // Context
  courseId?: string;
  sectionId?: string;
  topic?: string;

  // Metrics
  duration?: number; // milliseconds
  outcome?: 'success' | 'partial' | 'failure';
  confidence?: number;

  // Strategy used
  strategyId?: string;
  strategyApplied?: string;

  // Response quality
  responseQuality?: number;
  studentSatisfaction?: number;

  // Metadata
  metadata: Record<string, unknown>;
}

/**
 * Learning event types
 */
export const LearningEventType = {
  QUESTION_ASKED: 'question_asked',
  EXPLANATION_PROVIDED: 'explanation_provided',
  HINT_GIVEN: 'hint_given',
  FEEDBACK_DELIVERED: 'feedback_delivered',
  ASSESSMENT_COMPLETED: 'assessment_completed',
  CONCEPT_INTRODUCED: 'concept_introduced',
  PRACTICE_SESSION: 'practice_session',
  REVIEW_SESSION: 'review_session',
  ERROR_CORRECTION: 'error_correction',
  STRATEGY_APPLIED: 'strategy_applied',
} as const;

export type LearningEventType = (typeof LearningEventType)[keyof typeof LearningEventType];

// ============================================================================
// STORE INTERFACES
// ============================================================================

/**
 * Learning pattern store
 */
export interface LearningPatternStore {
  get(id: string): Promise<LearningPattern | null>;
  getByCategory(category: PatternCategory): Promise<LearningPattern[]>;
  getHighConfidence(minConfidence?: number): Promise<LearningPattern[]>;
  create(pattern: Omit<LearningPattern, 'id'>): Promise<LearningPattern>;
  update(id: string, updates: Partial<LearningPattern>): Promise<LearningPattern>;
  getRecent(limit?: number): Promise<LearningPattern[]>;
}

/**
 * Meta-learning insight store
 */
export interface MetaLearningInsightStore {
  get(id: string): Promise<MetaLearningInsight | null>;
  getByType(type: InsightType): Promise<MetaLearningInsight[]>;
  getByPriority(priority: InsightPriority): Promise<MetaLearningInsight[]>;
  getActive(): Promise<MetaLearningInsight[]>;
  create(insight: Omit<MetaLearningInsight, 'id'>): Promise<MetaLearningInsight>;
  markProcessed(id: string): Promise<void>;
}

/**
 * Learning strategy store
 */
export interface LearningStrategyStore {
  get(id: string): Promise<LearningStrategy | null>;
  getAll(): Promise<LearningStrategy[]>;
  getTopPerforming(limit?: number): Promise<LearningStrategy[]>;
  create(strategy: Omit<LearningStrategy, 'id'>): Promise<LearningStrategy>;
  update(id: string, updates: Partial<LearningStrategy>): Promise<LearningStrategy>;
  recordUsage(id: string, outcome: number): Promise<void>;
}

/**
 * Learning event store
 */
export interface LearningEventStore {
  get(id: string): Promise<LearningEvent | null>;
  getByUser(userId: string, since?: Date): Promise<LearningEvent[]>;
  getBySession(sessionId: string): Promise<LearningEvent[]>;
  create(event: Omit<LearningEvent, 'id'>): Promise<LearningEvent>;
  getStats(userId?: string, period?: AnalyticsPeriod): Promise<EventStats>;
}

/**
 * Event statistics
 */
export interface EventStats {
  totalEvents: number;
  eventsByType: Record<LearningEventType, number>;
  avgDuration: number;
  successRate: number;
  avgQuality: number;
}

// ============================================================================
// LOGGER INTERFACE
// ============================================================================

export interface MetaLearningLogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const LearningEventSchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().min(1),
  eventType: z.enum([
    'question_asked',
    'explanation_provided',
    'hint_given',
    'feedback_delivered',
    'assessment_completed',
    'concept_introduced',
    'practice_session',
    'review_session',
    'error_correction',
    'strategy_applied',
  ]),
  courseId: z.string().optional(),
  sectionId: z.string().optional(),
  topic: z.string().optional(),
  duration: z.number().optional(),
  outcome: z.enum(['success', 'partial', 'failure']).optional(),
  confidence: z.number().min(0).max(1).optional(),
  strategyId: z.string().optional(),
  strategyApplied: z.string().optional(),
  responseQuality: z.number().min(0).max(100).optional(),
  studentSatisfaction: z.number().min(1).max(5).optional(),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const GetInsightsSchema = z.object({
  userId: z.string().optional(),
  type: z.enum([
    'optimization',
    'warning',
    'recommendation',
    'trend',
    'anomaly',
    'correlation',
    'prediction',
  ]).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low', 'info']).optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  activeOnly: z.boolean().optional().default(true),
});

export const GetAnalyticsSchema = z.object({
  userId: z.string().optional(),
  period: z.enum(['hour', 'day', 'week', 'month', 'quarter', 'all_time']).optional().default('week'),
  includePatterns: z.boolean().optional().default(true),
  includeStrategies: z.boolean().optional().default(true),
  includeTrends: z.boolean().optional().default(true),
});
