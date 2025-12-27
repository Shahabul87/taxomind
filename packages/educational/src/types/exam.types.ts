/**
 * Exam Engine Types
 */

import type { SAMConfig, SAMDatabaseAdapter, BloomsLevel } from '@sam-ai/core';
import type { QuestionType, QuestionDifficulty } from './common';

// ============================================================================
// EXAM ENGINE TYPES
// ============================================================================

export interface ExamEngineConfig {
  samConfig: SAMConfig;
  database?: SAMDatabaseAdapter;
  defaults?: ExamGenerationDefaults;
}

export interface ExamGenerationDefaults {
  totalQuestions: number;
  duration: number;
  adaptiveMode: boolean;
  strictBloomsAlignment: boolean;
}

export interface ExamGenerationConfig {
  totalQuestions: number;
  duration: number;
  bloomsDistribution: Record<BloomsLevel, number>;
  difficultyDistribution: Record<QuestionDifficulty, number>;
  questionTypes: QuestionType[];
  adaptiveMode: boolean;
  timeLimit?: number;
  passingScore?: number;
}

export interface EnhancedQuestion {
  id: string;
  text: string;
  questionType: QuestionType;
  bloomsLevel: BloomsLevel;
  difficulty: QuestionDifficulty;
  options?: QuestionOption[];
  correctAnswer: unknown;
  explanation: string;
  hints?: string[];
  timeEstimate: number;
  points: number;
  tags: string[];
  metadata: QuestionMetadata;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuestionMetadata {
  createdAt: string;
  isAdaptive: boolean;
  learningObjective?: string;
  cognitiveProcess?: string;
  relatedConcepts?: string[];
}

export interface ExamMetadata {
  totalQuestions: number;
  totalPoints: number;
  estimatedDuration: number;
  bloomsDistribution: Record<BloomsLevel, number>;
  difficultyDistribution: Record<QuestionDifficulty, number>;
  topicsCovered: string[];
  learningObjectives: string[];
}

export interface BloomsComparison {
  target: Record<BloomsLevel, number>;
  actual: Record<BloomsLevel, number>;
  deviation: Record<BloomsLevel, number>;
  alignmentScore: number;
}

export interface AdaptiveSettings {
  startingQuestionDifficulty: QuestionDifficulty;
  adjustmentRules: AdaptiveRule[];
  performanceThresholds: PerformanceThreshold[];
  minQuestions: number;
  maxQuestions: number;
}

export interface AdaptiveRule {
  condition: string;
  action: string;
  threshold: number;
}

export interface PerformanceThreshold {
  level: string;
  minScore: number;
  action: string;
}

export interface ExamGenerationResponse {
  exam: {
    id: string;
    questions: EnhancedQuestion[];
    metadata: ExamMetadata;
  };
  bloomsAnalysis: {
    targetVsActual: BloomsComparison;
    cognitiveProgression: string[];
    skillsCovered: Skill[];
  };
  adaptiveSettings?: AdaptiveSettings;
  studyGuide: {
    focusAreas: string[];
    recommendedResources: Resource[];
    practiceQuestions: EnhancedQuestion[];
  };
}

export interface Skill {
  name: string;
  bloomsLevel: BloomsLevel;
  coverage: number;
}

export interface Resource {
  type: string;
  title: string;
  url?: string;
  description: string;
  relevance: number;
}

export interface StudentProfile {
  userId: string;
  currentLevel: string;
  learningStyle: string;
  strengths?: BloomsLevel[];
  weaknesses?: BloomsLevel[];
}

// ============================================================================
// QUESTION BANK TYPES
// ============================================================================

export interface QuestionBankEntry {
  id?: string;
  courseId?: string;
  subject: string;
  topic: string;
  subtopic?: string;
  question: string;
  questionType: QuestionType;
  bloomsLevel: BloomsLevel;
  difficulty: QuestionDifficulty;
  options?: QuestionOption[];
  correctAnswer: unknown;
  explanation: string;
  hints?: string[];
  tags: string[];
  usageCount?: number;
  successRate?: number;
  avgTimeSpent?: number;
  metadata?: Record<string, unknown>;
}

export interface QuestionBankQuery {
  courseId?: string;
  subject?: string;
  topic?: string;
  bloomsLevel?: BloomsLevel;
  difficulty?: QuestionDifficulty;
  questionType?: QuestionType;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface QuestionBankStats {
  totalQuestions: number;
  bloomsDistribution: Record<BloomsLevel, number>;
  difficultyDistribution: Record<QuestionDifficulty, number>;
  typeDistribution: Record<QuestionType, number>;
  averageDifficulty: number;
  totalUsage: number;
}
