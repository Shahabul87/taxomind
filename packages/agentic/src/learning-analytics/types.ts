/**
 * @sam-ai/agentic - Learning Analytics Types
 * Type definitions for learning analytics, skill assessment, and recommendations
 */

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Learning progress trend direction
 */
export enum TrendDirection {
  IMPROVING = 'improving',
  STABLE = 'stable',
  DECLINING = 'declining',
  FLUCTUATING = 'fluctuating',
}

/**
 * Skill mastery levels
 */
export enum MasteryLevel {
  NOVICE = 'novice',
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  PROFICIENT = 'proficient',
  EXPERT = 'expert',
}

/**
 * Learning style types
 */
export enum LearningStyle {
  VISUAL = 'visual',
  AUDITORY = 'auditory',
  READING_WRITING = 'reading_writing',
  KINESTHETIC = 'kinesthetic',
}

/**
 * Content type for recommendations
 */
export enum ContentType {
  VIDEO = 'video',
  ARTICLE = 'article',
  EXERCISE = 'exercise',
  QUIZ = 'quiz',
  PROJECT = 'project',
  TUTORIAL = 'tutorial',
  DOCUMENTATION = 'documentation',
}

/**
 * Recommendation priority
 */
export enum RecommendationPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * Recommendation reason types
 */
export enum RecommendationReason {
  KNOWLEDGE_GAP = 'knowledge_gap',
  SKILL_DECAY = 'skill_decay',
  PREREQUISITE = 'prerequisite',
  REINFORCEMENT = 'reinforcement',
  EXPLORATION = 'exploration',
  CHALLENGE = 'challenge',
  REVIEW = 'review',
}

/**
 * Time period for analytics
 */
export enum TimePeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ALL_TIME = 'all_time',
}

/**
 * Assessment source types
 */
export enum AssessmentSource {
  QUIZ = 'quiz',
  EXERCISE = 'exercise',
  PROJECT = 'project',
  PEER_REVIEW = 'peer_review',
  SELF_ASSESSMENT = 'self_assessment',
  AI_EVALUATION = 'ai_evaluation',
}

// ============================================================================
// PROGRESS ANALYTICS TYPES
// ============================================================================

/**
 * Learning session data
 */
export interface LearningSession {
  id: string;
  userId: string;
  topicId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // minutes
  activitiesCompleted: number;
  questionsAnswered: number;
  correctAnswers: number;
  conceptsCovered: string[];
  focusScore?: number; // 0-1, based on engagement
}

/**
 * Topic progress data
 */
export interface TopicProgress {
  topicId: string;
  topicName: string;
  userId: string;
  masteryLevel: MasteryLevel;
  masteryScore: number; // 0-100
  completionPercentage: number;
  timeSpent: number; // total minutes
  sessionsCount: number;
  lastAccessedAt: Date;
  startedAt: Date;
  conceptsLearned: string[];
  conceptsInProgress: string[];
  conceptsNotStarted: string[];
  trend: TrendDirection;
  trendScore: number; // rate of change
}

/**
 * Learning gap identified
 */
export interface LearningGap {
  id: string;
  userId: string;
  conceptId: string;
  conceptName: string;
  topicId: string;
  severity: 'critical' | 'moderate' | 'minor';
  detectedAt: Date;
  evidence: GapEvidence[];
  suggestedActions: string[];
  isResolved: boolean;
  resolvedAt?: Date;
}

/**
 * Evidence for a learning gap
 */
export interface GapEvidence {
  type: 'failed_quiz' | 'low_confidence' | 'repeated_mistakes' | 'skipped_content' | 'time_struggle';
  description: string;
  timestamp: Date;
  score?: number;
}

/**
 * Progress snapshot for a period
 */
export interface ProgressSnapshot {
  id: string;
  userId: string;
  period: TimePeriod;
  periodStart: Date;
  periodEnd: Date;
  totalTimeSpent: number;
  sessionsCount: number;
  topicsProgressed: number;
  conceptsLearned: number;
  averageQuizScore: number;
  streakDays: number;
  engagementScore: number;
  productivityScore: number;
  createdAt: Date;
}

/**
 * Progress trend analysis
 */
export interface ProgressTrend {
  userId: string;
  metric: 'mastery' | 'time_spent' | 'accuracy' | 'engagement' | 'completion';
  direction: TrendDirection;
  changePercentage: number;
  dataPoints: TrendDataPoint[];
  period: TimePeriod;
  analysisDate: Date;
  insight: string;
}

/**
 * Data point for trend
 */
export interface TrendDataPoint {
  date: Date;
  value: number;
  label?: string;
}

/**
 * Comprehensive progress report
 */
export interface ProgressReport {
  id: string;
  userId: string;
  generatedAt: Date;
  period: TimePeriod;
  periodStart: Date;
  periodEnd: Date;
  summary: ProgressSummary;
  topicBreakdown: TopicProgress[];
  trends: ProgressTrend[];
  gaps: LearningGap[];
  achievements: Achievement[];
  recommendations: string[];
}

/**
 * Progress summary
 */
export interface ProgressSummary {
  totalTimeSpent: number;
  averageSessionDuration: number;
  topicsCompleted: number;
  topicsInProgress: number;
  overallMastery: number;
  quizzesCompleted: number;
  averageQuizScore: number;
  currentStreak: number;
  longestStreak: number;
  engagementLevel: 'high' | 'medium' | 'low';
}

/**
 * Achievement earned
 */
export interface Achievement {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  earnedAt: Date;
  points?: number;
  badge?: string;
}

// ============================================================================
// SKILL ASSESSMENT TYPES
// ============================================================================

/**
 * Skill definition
 */
export interface Skill {
  id: string;
  name: string;
  category: string;
  description: string;
  prerequisites: string[];
  relatedConcepts: string[];
  assessmentCriteria: string[];
}

/**
 * User skill assessment
 */
export interface SkillAssessment {
  id: string;
  userId: string;
  skillId: string;
  skillName: string;
  level: MasteryLevel;
  score: number; // 0-100
  confidence: number; // 0-1, confidence in the assessment
  source: AssessmentSource;
  evidence: AssessmentEvidence[];
  assessedAt: Date;
  validUntil?: Date;
  previousLevel?: MasteryLevel;
  previousScore?: number;
}

/**
 * Evidence supporting an assessment
 */
export interface AssessmentEvidence {
  type: string;
  description: string;
  score?: number;
  timestamp: Date;
  weight: number; // importance 0-1
}

/**
 * Skill map for a user
 */
export interface SkillMap {
  userId: string;
  skills: SkillNode[];
  lastUpdated: Date;
  overallLevel: MasteryLevel;
  strongestSkills: string[];
  weakestSkills: string[];
  suggestedFocus: string[];
}

/**
 * Node in the skill map
 */
export interface SkillNode {
  skillId: string;
  skillName: string;
  category: string;
  level: MasteryLevel;
  score: number;
  isUnlocked: boolean;
  dependencies: string[];
  dependents: string[];
  lastAssessed?: Date;
}

/**
 * Skill decay prediction
 */
export interface SkillDecay {
  skillId: string;
  skillName: string;
  userId: string;
  currentScore: number;
  predictedScore: number;
  decayRate: number; // per day
  daysSinceLastPractice: number;
  riskLevel: 'high' | 'medium' | 'low';
  suggestedReviewDate: Date;
}

/**
 * Skill comparison (for benchmarking)
 */
export interface SkillComparison {
  skillId: string;
  skillName: string;
  userScore: number;
  userLevel: MasteryLevel;
  averageScore: number;
  percentile: number;
  topPerformersScore: number;
  gap: number;
}

// ============================================================================
// RECOMMENDATION TYPES
// ============================================================================

/**
 * Learning recommendation
 */
export interface Recommendation {
  id: string;
  userId: string;
  type: ContentType;
  priority: RecommendationPriority;
  reason: RecommendationReason;
  title: string;
  description: string;
  targetSkillId?: string;
  targetConceptId?: string;
  estimatedDuration: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  confidence: number; // 0-1
  resourceUrl?: string;
  resourceId?: string;
  prerequisites?: string[];
  createdAt: Date;
  expiresAt?: Date;
  isViewed: boolean;
  isCompleted: boolean;
  userRating?: number;
}

/**
 * Recommendation batch for a user
 */
export interface RecommendationBatch {
  id: string;
  userId: string;
  recommendations: Recommendation[];
  generatedAt: Date;
  basedOn: RecommendationContext;
  totalEstimatedTime: number;
}

/**
 * Context used for generating recommendations
 */
export interface RecommendationContext {
  recentTopics: string[];
  learningGaps: string[];
  skillsToImprove: string[];
  preferredContentTypes: ContentType[];
  availableTime: number; // minutes
  learningStyle?: LearningStyle;
  currentGoals: string[];
}

/**
 * Learning path recommendation
 */
export interface LearningPath {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetSkills: string[];
  steps: LearningPathStep[];
  totalDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
  progress: number; // 0-100
  currentStep: number;
}

/**
 * Step in a learning path
 */
export interface LearningPathStep {
  order: number;
  title: string;
  description: string;
  contentType: ContentType;
  resourceId?: string;
  estimatedDuration: number;
  skillsGained: string[];
  isCompleted: boolean;
  completedAt?: Date;
}

/**
 * Content item for recommendations
 */
export interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  topicId: string;
  skillIds: string[];
  conceptIds: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number;
  url?: string;
  rating?: number;
  completionRate?: number;
  tags: string[];
}

// ============================================================================
// STORE INTERFACES
// ============================================================================

/**
 * Store for learning sessions
 */
export interface LearningSessionStore {
  create(session: Omit<LearningSession, 'id'>): Promise<LearningSession>;
  get(id: string): Promise<LearningSession | null>;
  getByUser(userId: string, limit?: number): Promise<LearningSession[]>;
  getByUserAndTopic(userId: string, topicId: string): Promise<LearningSession[]>;
  getByPeriod(userId: string, start: Date, end: Date): Promise<LearningSession[]>;
  update(id: string, updates: Partial<LearningSession>): Promise<LearningSession>;
}

/**
 * Store for topic progress
 */
export interface TopicProgressStore {
  get(userId: string, topicId: string): Promise<TopicProgress | null>;
  getByUser(userId: string): Promise<TopicProgress[]>;
  upsert(progress: TopicProgress): Promise<TopicProgress>;
  getByMasteryLevel(userId: string, level: MasteryLevel): Promise<TopicProgress[]>;
}

/**
 * Store for learning gaps
 */
export interface LearningGapStore {
  create(gap: Omit<LearningGap, 'id'>): Promise<LearningGap>;
  get(id: string): Promise<LearningGap | null>;
  getByUser(userId: string, includeResolved?: boolean): Promise<LearningGap[]>;
  resolve(id: string): Promise<LearningGap>;
  getBySeverity(userId: string, severity: LearningGap['severity']): Promise<LearningGap[]>;
}

/**
 * Store for skill assessments
 */
export interface SkillAssessmentStore {
  create(assessment: Omit<SkillAssessment, 'id'>): Promise<SkillAssessment>;
  get(id: string): Promise<SkillAssessment | null>;
  getByUserAndSkill(userId: string, skillId: string): Promise<SkillAssessment | null>;
  getByUser(userId: string): Promise<SkillAssessment[]>;
  getHistory(userId: string, skillId: string, limit?: number): Promise<SkillAssessment[]>;
}

/**
 * Store for recommendations
 */
export interface RecommendationStore {
  create(recommendation: Omit<Recommendation, 'id'>): Promise<Recommendation>;
  get(id: string): Promise<Recommendation | null>;
  getByUser(userId: string, limit?: number): Promise<Recommendation[]>;
  getActive(userId: string): Promise<Recommendation[]>;
  markViewed(id: string): Promise<Recommendation>;
  markCompleted(id: string, rating?: number): Promise<Recommendation>;
  expire(id: string): Promise<void>;
}

/**
 * Store for content items
 */
export interface ContentStore {
  get(id: string): Promise<ContentItem | null>;
  getByTopic(topicId: string): Promise<ContentItem[]>;
  getBySkill(skillId: string): Promise<ContentItem[]>;
  getByType(type: ContentType): Promise<ContentItem[]>;
  search(query: string, filters?: ContentFilters): Promise<ContentItem[]>;
}

/**
 * Filters for content search
 */
export interface ContentFilters {
  types?: ContentType[];
  difficulty?: ('easy' | 'medium' | 'hard')[];
  minDuration?: number;
  maxDuration?: number;
  topicIds?: string[];
  skillIds?: string[];
}

// ============================================================================
// LOGGER INTERFACE
// ============================================================================

/**
 * Logger for analytics
 */
export interface AnalyticsLogger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

/**
 * Schema for learning session input
 */
export const LearningSessionInputSchema = z.object({
  userId: z.string().min(1),
  topicId: z.string().min(1),
  startTime: z.date().optional(),
  duration: z.number().min(0).optional(),
  activitiesCompleted: z.number().min(0).optional(),
  questionsAnswered: z.number().min(0).optional(),
  correctAnswers: z.number().min(0).optional(),
  conceptsCovered: z.array(z.string()).optional(),
  focusScore: z.number().min(0).max(1).optional(),
});

export type LearningSessionInput = z.infer<typeof LearningSessionInputSchema>;

/**
 * Schema for skill assessment input
 */
export const SkillAssessmentInputSchema = z.object({
  userId: z.string().min(1),
  skillId: z.string().min(1),
  skillName: z.string().min(1).optional(),
  score: z.number().min(0).max(100),
  maxScore: z.number().min(1).optional().default(100),
  source: z.nativeEnum(AssessmentSource),
  duration: z.number().min(0).optional(),
  questionsAnswered: z.number().min(0).optional(),
  correctAnswers: z.number().min(0).optional(),
  evidence: z
    .array(
      z.object({
        type: z.string(),
        description: z.string(),
        score: z.number().optional(),
        timestamp: z.date(),
        weight: z.number().min(0).max(1),
      })
    )
    .optional(),
});

export type SkillAssessmentInput = z.infer<typeof SkillAssessmentInputSchema>;

/**
 * Schema for recommendation feedback
 */
export const RecommendationFeedbackSchema = z.object({
  recommendationId: z.string().min(1),
  userId: z.string().min(1),
  isHelpful: z.boolean(),
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
  timeSpent: z.number().min(0).optional(),
  completed: z.boolean().optional(),
});

export type RecommendationFeedback = z.infer<typeof RecommendationFeedbackSchema>;
