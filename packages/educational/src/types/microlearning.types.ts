/**
 * Microlearning Engine Types
 *
 * Types for bite-sized learning modules, content chunking, spaced delivery,
 * and mobile-optimized learning experiences.
 */

import type { SAMConfig, SAMDatabaseAdapter, BloomsLevel } from '@sam-ai/core';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface MicrolearningEngineConfig {
  samConfig: SAMConfig;
  database?: SAMDatabaseAdapter;
  /** Target duration for micro-modules in minutes (default: 5) */
  targetDurationMinutes?: number;
  /** Maximum duration for any module (default: 10) */
  maxDurationMinutes?: number;
  /** Enable AI-powered content chunking */
  enableAIChunking?: boolean;
  /** Default delivery schedule type */
  defaultScheduleType?: DeliveryScheduleType;
}

// ============================================================================
// CONTENT TYPES
// ============================================================================

export type MicroModuleType =
  | 'CONCEPT'        // Single concept explanation
  | 'PRACTICE'       // Quick practice exercise
  | 'QUIZ'           // Mini assessment
  | 'FLASHCARD'      // Flashcard-style review
  | 'VIDEO_SNIPPET'  // Short video clip
  | 'INTERACTIVE'    // Interactive element
  | 'SUMMARY'        // Key points recap
  | 'REFLECTION';    // Self-reflection prompt

export type MicrolearningContentFormat =
  | 'TEXT'
  | 'RICH_TEXT'
  | 'MARKDOWN'
  | 'HTML'
  | 'VIDEO'
  | 'AUDIO'
  | 'IMAGE'
  | 'INTERACTIVE';

export type DeviceType = 'MOBILE' | 'TABLET' | 'DESKTOP';

export type DeliveryScheduleType =
  | 'SPACED_REPETITION'  // SM-2 algorithm based
  | 'DAILY_DIGEST'       // Fixed daily delivery
  | 'ADAPTIVE'           // Based on user patterns
  | 'ON_DEMAND'          // User-initiated
  | 'NOTIFICATION';      // Push notification triggered

export type MicroModuleStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'NEEDS_REVIEW';

// ============================================================================
// MICRO MODULE TYPES
// ============================================================================

/**
 * A single micro-learning module (bite-sized content)
 */
export interface MicroModule {
  id: string;
  title: string;
  description: string;
  type: MicroModuleType;
  /** Duration in minutes */
  durationMinutes: number;
  /** Bloom's taxonomy level */
  bloomsLevel: BloomsLevel;
  /** Content in various formats for different devices */
  content: MicroModuleContent;
  /** Learning objectives covered */
  learningObjectives: string[];
  /** Keywords for search/categorization */
  keywords: string[];
  /** Prerequisites (other module IDs) */
  prerequisites: string[];
  /** Source content reference */
  sourceContext?: {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    position?: number;
  };
  /** Engagement metrics */
  metrics?: MicroModuleMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export interface MicroModuleContent {
  /** Primary content */
  primary: ContentBlock;
  /** Mobile-optimized version */
  mobile?: ContentBlock;
  /** Summary/TL;DR version */
  summary?: string;
  /** Key takeaways (bullet points) */
  keyTakeaways: string[];
  /** Optional media attachments */
  media?: MediaAttachment[];
  /** Interactive elements */
  interactions?: InteractionElement[];
}

export interface ContentBlock {
  format: MicrolearningContentFormat;
  content: string;
  /** Estimated reading/viewing time in seconds */
  estimatedTimeSeconds: number;
  /** Word count for text content */
  wordCount?: number;
  /** Character count for mobile optimization */
  characterCount?: number;
}

export interface MediaAttachment {
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'GIF';
  url: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  altText?: string;
  caption?: string;
}

export interface InteractionElement {
  type: 'QUIZ_QUESTION' | 'POLL' | 'REFLECTION' | 'DRAG_DROP' | 'FILL_BLANK' | 'HIGHLIGHT';
  id: string;
  prompt: string;
  options?: string[];
  correctAnswer?: string | string[];
  explanation?: string;
}

export interface MicroModuleMetrics {
  completionRate: number;
  averageTimeSpent: number;
  engagementScore: number;
  retentionScore: number;
  totalViews: number;
  totalCompletions: number;
}

// ============================================================================
// CHUNKING TYPES
// ============================================================================

export interface ChunkingInput {
  content: string;
  contentType: 'COURSE' | 'CHAPTER' | 'SECTION' | 'ARTICLE' | 'DOCUMENT';
  /** Target duration per chunk in minutes */
  targetDuration: number;
  /** Maximum duration per chunk */
  maxDuration: number;
  /** Preserve paragraph boundaries */
  preserveParagraphs?: boolean;
  /** Include context from surrounding chunks */
  includeContext?: boolean;
  /** Source metadata */
  sourceContext?: {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    title?: string;
  };
}

export interface ChunkingResult {
  chunks: ContentChunk[];
  totalChunks: number;
  totalDurationMinutes: number;
  averageDurationMinutes: number;
  coverage: ChunkingCoverage;
  processingTimeMs: number;
}

export interface ContentChunk {
  id: string;
  position: number;
  title: string;
  content: string;
  /** Estimated duration in minutes */
  durationMinutes: number;
  /** Word count */
  wordCount: number;
  /** Main concept covered */
  mainConcept: string;
  /** Related concepts */
  relatedConcepts: string[];
  /** Bloom's level detected */
  bloomsLevel: BloomsLevel;
  /** Type of content in this chunk */
  suggestedType: MicroModuleType;
  /** Context from previous chunk */
  previousContext?: string;
  /** Preview of next chunk */
  nextPreview?: string;
}

export interface ChunkingCoverage {
  /** Percentage of original content included */
  contentCoverage: number;
  /** Key concepts extracted */
  conceptsExtracted: number;
  /** Learning objectives covered */
  objectivesCovered: string[];
  /** Content that was condensed/summarized */
  condensedSections: string[];
}

// ============================================================================
// DELIVERY SCHEDULE TYPES
// ============================================================================

export interface DeliverySchedule {
  id: string;
  userId: string;
  courseId?: string;
  /** Schedule type */
  type: DeliveryScheduleType;
  /** Modules to deliver */
  modules: ScheduledModule[];
  /** User preferences */
  preferences: DeliveryPreferences;
  /** Current position in schedule */
  currentPosition: number;
  /** Schedule status */
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledModule {
  moduleId: string;
  /** Scheduled delivery time */
  scheduledAt: Date;
  /** Actual delivery time (if sent) */
  deliveredAt?: Date;
  /** User completion time (if completed) */
  completedAt?: Date;
  /** Spaced repetition interval (days) */
  interval?: number;
  /** Ease factor for SM-2 */
  easeFactor?: number;
  /** Number of repetitions */
  repetitions?: number;
  /** Status */
  status: MicroModuleStatus;
  /** Performance on this module */
  performance?: ModulePerformance;
}

export interface DeliveryPreferences {
  /** Preferred delivery times (hours in user's timezone) */
  preferredHours: number[];
  /** Days of week (0=Sunday, 6=Saturday) */
  preferredDays: number[];
  /** Maximum modules per day */
  maxModulesPerDay: number;
  /** Minimum gap between modules (minutes) */
  minGapMinutes: number;
  /** Preferred device */
  preferredDevice: DeviceType;
  /** Enable notifications */
  enableNotifications: boolean;
  /** Notification channels */
  notificationChannels: ('PUSH' | 'EMAIL' | 'SMS')[];
  /** Time zone */
  timezone: string;
}

export interface ModulePerformance {
  /** Score (0-100) */
  score: number;
  /** Time spent in seconds */
  timeSpentSeconds: number;
  /** Number of attempts */
  attempts: number;
  /** Interactions completed */
  interactionsCompleted: number;
  /** Retention quiz score (if applicable) */
  retentionScore?: number;
}

// ============================================================================
// LEARNING SESSION TYPES
// ============================================================================

export interface MicrolearningSession {
  id: string;
  userId: string;
  /** Modules in this session */
  modules: SessionModule[];
  /** Session duration limit in minutes */
  durationLimit: number;
  /** Device type */
  deviceType: DeviceType;
  /** Session status */
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED';
  /** Start time */
  startedAt: Date;
  /** End time */
  endedAt?: Date;
  /** Session performance */
  performance: SessionPerformance;
}

export interface SessionModule {
  module: MicroModule;
  position: number;
  status: MicroModuleStatus;
  startedAt?: Date;
  completedAt?: Date;
  performance?: ModulePerformance;
}

export interface SessionPerformance {
  modulesCompleted: number;
  totalModules: number;
  averageScore: number;
  totalTimeSeconds: number;
  engagementScore: number;
  conceptsMastered: string[];
  conceptsNeedingReview: string[];
}

// ============================================================================
// MOBILE OPTIMIZATION TYPES
// ============================================================================

export interface MobileOptimizationInput {
  content: MicroModule;
  deviceType: DeviceType;
  /** Screen width in pixels */
  screenWidth?: number;
  /** Network conditions */
  networkCondition?: 'FAST' | 'SLOW' | 'OFFLINE';
  /** User's reading speed preference */
  readingSpeed?: 'SLOW' | 'NORMAL' | 'FAST';
}

export interface MobileOptimizedContent {
  moduleId: string;
  deviceType: DeviceType;
  /** Optimized primary content */
  content: ContentBlock;
  /** Optimized media (lower resolution, etc.) */
  media?: MediaAttachment[];
  /** Offline-available content */
  offlineContent?: ContentBlock;
  /** Estimated data size in KB */
  dataSizeKB: number;
  /** Swipeable cards for mobile */
  cards?: MobileCard[];
  /** Progressive loading chunks */
  loadingChunks?: LoadingChunk[];
}

export interface MobileCard {
  id: string;
  position: number;
  type: 'CONTENT' | 'QUESTION' | 'SUMMARY' | 'ACTION';
  content: string;
  /** Media for this card */
  media?: MediaAttachment;
  /** Action button */
  action?: {
    label: string;
    type: 'NEXT' | 'QUIZ' | 'BOOKMARK' | 'SHARE';
  };
}

export interface LoadingChunk {
  position: number;
  content: string;
  /** Priority for loading (1 = highest) */
  priority: number;
  /** Size in bytes */
  sizeBytes: number;
}

// ============================================================================
// SPACED REPETITION TYPES
// ============================================================================

export interface SpacedRepetitionConfig {
  /** Initial interval in days */
  initialInterval: number;
  /** Minimum ease factor */
  minEaseFactor: number;
  /** Maximum interval in days */
  maxInterval: number;
  /** Learning steps (minutes) */
  learningSteps: number[];
  /** Graduating interval (days) */
  graduatingInterval: number;
  /** Easy bonus multiplier */
  easyBonus: number;
  /** Interval modifier */
  intervalModifier: number;
}

export interface SpacedRepetitionUpdate {
  moduleId: string;
  userId: string;
  /** User's self-assessment (1-5, 1=forgot, 5=easy) */
  quality: 1 | 2 | 3 | 4 | 5;
  /** Time taken in seconds */
  responseTimeSeconds: number;
}

export interface MicrolearningSRResult {
  moduleId: string;
  nextReviewDate: Date;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  /** Predicted retention at next review */
  predictedRetention: number;
  /** Is this card graduated from learning? */
  isGraduated: boolean;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface MicrolearningAnalytics {
  userId: string;
  courseId?: string;
  /** Overall stats */
  overall: OverallStats;
  /** Daily streak */
  streak: StreakStats;
  /** Learning patterns */
  patterns: LearningPatterns;
  /** Module performance breakdown */
  moduleBreakdown: ModuleBreakdown[];
  /** Recommendations */
  recommendations: MicrolearningRecommendation[];
}

export interface OverallStats {
  totalModulesCompleted: number;
  totalTimeSpentMinutes: number;
  averageSessionDuration: number;
  averageScore: number;
  conceptsMastered: number;
  retentionRate: number;
  completionRate: number;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  streakFreezes: number;
}

export interface LearningPatterns {
  /** Most active hours */
  peakHours: number[];
  /** Most active days */
  peakDays: number[];
  /** Average modules per day */
  avgModulesPerDay: number;
  /** Preferred session length */
  preferredSessionLength: number;
  /** Preferred content types */
  preferredTypes: MicroModuleType[];
  /** Best performing Bloom's levels */
  strongBloomsLevels: BloomsLevel[];
  /** Weak Bloom's levels needing practice */
  weakBloomsLevels: BloomsLevel[];
}

export interface ModuleBreakdown {
  type: MicroModuleType;
  count: number;
  completionRate: number;
  averageScore: number;
  averageTimeMinutes: number;
}

export interface MicrolearningRecommendation {
  type: 'SCHEDULE' | 'CONTENT' | 'PACE' | 'REVIEW' | 'STREAK';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: {
    type: string;
    label: string;
    data?: Record<string, unknown>;
  };
}

// ============================================================================
// API INPUT/OUTPUT TYPES
// ============================================================================

export interface GenerateModulesInput {
  content: string;
  contentType: ChunkingInput['contentType'];
  /** Target number of modules */
  targetModules?: number;
  /** Module types to generate */
  moduleTypes?: MicroModuleType[];
  /** Include practice questions */
  includePractice?: boolean;
  /** Include summary modules */
  includeSummaries?: boolean;
  sourceContext?: ChunkingInput['sourceContext'];
}

export interface GenerateModulesResult {
  modules: MicroModule[];
  totalModules: number;
  totalDurationMinutes: number;
  bloomsDistribution: Record<BloomsLevel, number>;
  typeDistribution: Record<MicroModuleType, number>;
  suggestedSchedule: ScheduleSuggestion;
}

export interface ScheduleSuggestion {
  type: DeliveryScheduleType;
  totalDays: number;
  modulesPerDay: number;
  estimatedCompletionDate: Date;
  rationale: string;
}

export interface CreateSessionInput {
  userId: string;
  courseId?: string;
  /** Maximum session duration in minutes */
  maxDuration?: number;
  /** Module types to include */
  moduleTypes?: MicroModuleType[];
  /** Include review modules */
  includeReview?: boolean;
  /** Device type */
  deviceType?: DeviceType;
  /** Focus on specific concepts */
  focusConcepts?: string[];
}

export interface UpdateProgressInput {
  userId: string;
  moduleId: string;
  status: MicroModuleStatus;
  score?: number;
  timeSpentSeconds?: number;
  /** For spaced repetition */
  selfAssessment?: 1 | 2 | 3 | 4 | 5;
}

export interface GetAnalyticsInput {
  userId: string;
  courseId?: string;
  /** Date range */
  startDate?: Date;
  endDate?: Date;
  /** Include recommendations */
  includeRecommendations?: boolean;
}
