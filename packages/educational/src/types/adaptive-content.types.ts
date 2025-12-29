/**
 * @sam-ai/educational - Adaptive Content Engine Types
 * Types for personalized content adaptation based on learning styles and progress
 */

import type { BloomsLevel } from '@sam-ai/core';

/**
 * Learning style types based on VARK model
 */
export type AdaptiveLearningStyle = 'visual' | 'auditory' | 'reading' | 'kinesthetic' | 'multimodal';

/**
 * Content format types
 */
export type ContentFormat =
  | 'text'
  | 'video'
  | 'audio'
  | 'diagram'
  | 'infographic'
  | 'interactive'
  | 'simulation'
  | 'quiz'
  | 'code_example'
  | 'case_study';

/**
 * Content complexity levels
 */
export type ContentComplexity = 'simplified' | 'standard' | 'detailed' | 'expert';

/**
 * Reading pace preferences
 */
export type ReadingPace = 'slow' | 'moderate' | 'fast';

/**
 * Configuration for the Adaptive Content Engine
 */
export interface AdaptiveContentConfig {
  /** AI adapter for content transformation */
  aiAdapter?: {
    chat(params: { messages: { role: string; content: string }[] }): Promise<{ content: string }>;
  };
  /** Database adapter for storing preferences and history */
  database?: AdaptiveContentDatabaseAdapter;
  /** Enable automatic style detection */
  autoDetectStyle?: boolean;
  /** Minimum interactions before adapting */
  minInteractionsForAdaptation?: number;
  /** Enable content caching */
  enableCaching?: boolean;
  /** Cache TTL in seconds */
  cacheTTL?: number;
}

/**
 * User's learning profile for content adaptation
 */
export interface AdaptiveLearnerProfile {
  /** User ID */
  userId: string;
  /** Primary learning style */
  primaryStyle: AdaptiveLearningStyle;
  /** Secondary learning style */
  secondaryStyle?: AdaptiveLearningStyle;
  /** Style scores (0-100) */
  styleScores: {
    visual: number;
    auditory: number;
    reading: number;
    kinesthetic: number;
  };
  /** Preferred content formats */
  preferredFormats: ContentFormat[];
  /** Preferred complexity level */
  preferredComplexity: ContentComplexity;
  /** Reading pace */
  readingPace: ReadingPace;
  /** Preferred session duration in minutes */
  preferredSessionDuration: number;
  /** Best learning time (0-23 hour) */
  bestLearningTime?: number;
  /** Known concepts (for scaffolding) */
  knownConcepts: string[];
  /** Concepts in progress */
  conceptsInProgress: string[];
  /** Struggling areas */
  strugglingAreas: string[];
  /** Detection confidence (0-1) */
  confidence: number;
  /** Last updated */
  lastUpdated: Date;
}

/**
 * Content to be adapted
 */
export interface ContentToAdapt {
  /** Original content ID */
  id: string;
  /** Content type */
  type: 'lesson' | 'section' | 'concept' | 'explanation' | 'example';
  /** Original content */
  content: string;
  /** Content title */
  title?: string;
  /** Topic */
  topic: string;
  /** Bloom's level */
  bloomsLevel?: BloomsLevel;
  /** Current format */
  currentFormat: ContentFormat;
  /** Associated concepts */
  concepts: string[];
  /** Prerequisites */
  prerequisites: string[];
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Adaptation options
 */
export interface AdaptationOptions {
  /** Target learning style */
  targetStyle?: AdaptiveLearningStyle;
  /** Target complexity */
  targetComplexity?: ContentComplexity;
  /** Target format */
  targetFormat?: ContentFormat;
  /** Include supplementary content */
  includeSupplementary?: boolean;
  /** Include knowledge checks */
  includeKnowledgeChecks?: boolean;
  /** Personalize examples */
  personalizeExamples?: boolean;
  /** Add scaffolding for prerequisites */
  addScaffolding?: boolean;
  /** Maximum content length */
  maxLength?: number;
}

/**
 * Adapted content chunk
 */
export interface AdaptedChunk {
  /** Chunk ID */
  id: string;
  /** Chunk type */
  type: 'main' | 'summary' | 'example' | 'diagram_description' | 'practice' | 'scaffold';
  /** Chunk content */
  content: string;
  /** Content format */
  format: ContentFormat;
  /** Order in sequence */
  order: number;
  /** Estimated reading time in minutes */
  estimatedTime: number;
  /** Whether this is essential or supplementary */
  isEssential: boolean;
}

/**
 * Knowledge check question embedded in content
 */
export interface EmbeddedKnowledgeCheck {
  /** Check ID */
  id: string;
  /** Question */
  question: string;
  /** Correct answer */
  correctAnswer: string;
  /** Options for MCQ */
  options?: string[];
  /** Concept being checked */
  concept: string;
  /** Position in content (after which chunk) */
  afterChunkId: string;
}

/**
 * Supplementary resource suggestion
 */
export interface SupplementaryResource {
  /** Resource ID */
  id: string;
  /** Resource type */
  type: 'video' | 'article' | 'interactive' | 'practice';
  /** Resource title */
  title: string;
  /** Resource description */
  description: string;
  /** Resource URL or content */
  resource: string;
  /** Relevance score (0-1) */
  relevance: number;
  /** Target learning style */
  targetStyle: AdaptiveLearningStyle;
}

/**
 * Result of content adaptation
 */
export interface AdaptedContent {
  /** Original content ID */
  originalId: string;
  /** Adapted chunks */
  chunks: AdaptedChunk[];
  /** Adaptation summary */
  summary: string;
  /** Key takeaways */
  keyTakeaways: string[];
  /** Knowledge checks */
  knowledgeChecks: EmbeddedKnowledgeCheck[];
  /** Supplementary resources */
  supplementaryResources: SupplementaryResource[];
  /** Scaffolding for prerequisites */
  scaffolding?: {
    concept: string;
    explanation: string;
    examples: string[];
  }[];
  /** Total estimated time in minutes */
  estimatedTotalTime: number;
  /** Adaptation metadata */
  adaptationInfo: {
    targetStyle: AdaptiveLearningStyle;
    targetComplexity: ContentComplexity;
    adaptedAt: Date;
    confidence: number;
  };
}

/**
 * Interaction data for style detection
 */
export interface ContentInteractionData {
  /** Interaction ID */
  id: string;
  /** User ID */
  userId: string;
  /** Content ID */
  contentId: string;
  /** Content format */
  format: ContentFormat;
  /** Time spent in seconds */
  timeSpent: number;
  /** Scroll depth (0-100) */
  scrollDepth: number;
  /** Replay count (for video/audio) */
  replayCount?: number;
  /** Pause count */
  pauseCount?: number;
  /** Notes taken */
  notesTaken?: boolean;
  /** Completion status */
  completed: boolean;
  /** Quiz/check performance (0-100) */
  checkPerformance?: number;
  /** Timestamp */
  timestamp: Date;
}

/**
 * Style detection result
 */
export interface StyleDetectionResult {
  /** Detected primary style */
  primaryStyle: AdaptiveLearningStyle;
  /** Detected secondary style */
  secondaryStyle?: AdaptiveLearningStyle;
  /** Style scores */
  scores: {
    visual: number;
    auditory: number;
    reading: number;
    kinesthetic: number;
  };
  /** Detection confidence (0-1) */
  confidence: number;
  /** Evidence for detection */
  evidence: {
    factor: string;
    weight: number;
    contribution: AdaptiveLearningStyle;
  }[];
  /** Recommendations */
  recommendations: string[];
}

/**
 * Database adapter for adaptive content
 */
export interface AdaptiveContentDatabaseAdapter {
  /** Get learner profile */
  getLearnerProfile(userId: string): Promise<AdaptiveLearnerProfile | null>;

  /** Save or update learner profile */
  saveLearnerProfile(profile: AdaptiveLearnerProfile): Promise<void>;

  /** Record content interaction */
  recordInteraction(interaction: Omit<ContentInteractionData, 'id'>): Promise<string>;

  /** Get user interactions */
  getInteractions(
    userId: string,
    options?: { contentId?: string; limit?: number; since?: Date }
  ): Promise<ContentInteractionData[]>;

  /** Get cached adapted content */
  getCachedContent(originalId: string, style: AdaptiveLearningStyle): Promise<AdaptedContent | null>;

  /** Cache adapted content */
  cacheContent(content: AdaptedContent): Promise<void>;
}

/**
 * Adaptive Content Engine interface
 */
export interface AdaptiveContentEngine {
  /** Adapt content for a user */
  adaptContent(
    content: ContentToAdapt,
    profile: AdaptiveLearnerProfile,
    options?: AdaptationOptions
  ): Promise<AdaptedContent>;

  /** Detect learning style from interactions */
  detectLearningStyle(userId: string): Promise<StyleDetectionResult>;

  /** Get or create learner profile */
  getLearnerProfile(userId: string): Promise<AdaptiveLearnerProfile>;

  /** Update learner profile from interactions */
  updateProfileFromInteractions(userId: string): Promise<AdaptiveLearnerProfile>;

  /** Record a content interaction */
  recordInteraction(interaction: Omit<ContentInteractionData, 'id'>): Promise<void>;

  /** Get content recommendations based on profile */
  getContentRecommendations(
    profile: AdaptiveLearnerProfile,
    currentTopic: string,
    count?: number
  ): Promise<SupplementaryResource[]>;

  /** Get style-specific tips */
  getStyleTips(style: AdaptiveLearningStyle): string[];
}
