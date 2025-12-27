/**
 * Personalization Engine Types
 */

import type { SAMConfig, SAMDatabaseAdapter } from '@sam-ai/core';
import type { ContentRecommendation } from './blooms.types';

// ============================================================================
// PERSONALIZATION ENGINE TYPES
// ============================================================================

export interface PersonalizationEngineConfig {
  samConfig: SAMConfig;
  database?: SAMDatabaseAdapter;
}

export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing' | 'mixed';

export interface LearningBehavior {
  userId: string;
  sessionPatterns: SessionPattern[];
  contentInteractions: ContentInteraction[];
  assessmentHistory: AssessmentRecord[];
  timePreferences: TimePreference[];
  deviceUsage: DeviceUsage[];
}

export interface SessionPattern {
  startTime: Date;
  endTime: Date;
  duration: number;
  activeDuration: number;
  contentViewed: number;
  assessmentsTaken: number;
  notesCreated: number;
  focusScore: number;
}

export interface ContentInteraction {
  contentId: string;
  contentType: string;
  interactionType: string;
  timestamp: Date;
  duration: number;
  completionRate: number;
  repeatViews: number;
  engagementScore: number;
}

export interface AssessmentRecord {
  assessmentId: string;
  score: number;
  timeSpent: number;
  attempts: number;
  mistakePatterns: string[];
  strengthAreas: string[];
}

export interface TimePreference {
  dayOfWeek: number;
  hourOfDay: number;
  productivity: number;
  preferenceStrength: number;
}

export interface DeviceUsage {
  deviceType: string;
  usagePercentage: number;
  averageSessionDuration: number;
  preferredForType: string[];
}

export interface LearningStyleProfile {
  primaryStyle: LearningStyle;
  secondaryStyle?: LearningStyle;
  styleStrengths: Record<LearningStyle, number>;
  evidenceFactors: string[];
  confidence: number;
}

export interface OptimizedContent {
  originalContent: unknown;
  adaptations: ContentAdaptation[];
  presentationOrder: string[];
  emphasizedElements: string[];
  simplifiedConcepts: string[];
  additionalExplanations: string[];
}

export interface ContentAdaptation {
  type: 'visual' | 'audio' | 'interactive' | 'text' | 'example';
  content: unknown;
  reason: string;
  expectedImpact: number;
}

export interface EmotionalState {
  currentEmotion: 'motivated' | 'frustrated' | 'confused' | 'confident' | 'anxious' | 'neutral';
  confidence: number;
  indicators: EmotionIndicator[];
  trend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
}

export interface EmotionIndicator {
  type: string;
  value: unknown;
  weight: number;
  timestamp: Date;
}

export interface MotivationProfile {
  intrinsicFactors: MotivationFactor[];
  extrinsicFactors: MotivationFactor[];
  currentLevel: number;
  triggers: string[];
  barriers: string[];
  sustainabilityScore: number;
}

export interface MotivationFactor {
  factor: string;
  strength: number;
  type: 'positive' | 'negative';
  evidence: string[];
}

export interface PersonalizedPath {
  pathId: string;
  userId: string;
  startPoint: LearningNode;
  targetOutcome: string;
  nodes: LearningNode[];
  edges: LearningEdge[];
  estimatedDuration: number;
  difficultyProgression: number[];
  alternativePaths: AlternativePath[];
}

export interface LearningNode {
  id: string;
  type: 'content' | 'assessment' | 'project' | 'review' | 'break';
  content: unknown;
  estimatedTime: number;
  difficulty: number;
  prerequisites: string[];
  outcomes: string[];
}

export interface LearningEdge {
  from: string;
  to: string;
  condition?: string;
  weight: number;
}

export interface AlternativePath {
  reason: string;
  nodes: string[];
  benefit: string;
}

export interface PersonalizationContext {
  userId: string;
  currentContent: unknown;
  learningGoals: string[];
  timeConstraints?: { available: number; deadline?: Date };
  preferenceOverrides?: Record<string, unknown>;
}

export interface PersonalizationResult {
  recommendations: ContentRecommendation[];
  adaptations: ContentAdaptation[];
  learningPath: LearningNode[];
  insights: PersonalizationInsight[];
  confidence: number;
}

export interface PersonalizationInsight {
  type: string;
  description: string;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface StudentProfileInput {
  userId: string;
  skillGaps: { skill: string; score: number }[];
  careerGoals: string[];
  learningPace: 'slow' | 'normal' | 'fast';
}

export interface LearningHistory {
  userId: string;
  activities: unknown[];
  achievements: unknown[];
  progress: unknown[];
}

export interface Interaction {
  userId: string;
  type: string;
  timestamp: Date;
  responseTime: number;
  isError: boolean;
  metadata: unknown;
}

export interface StudentInfo {
  id: string;
  name?: string;
  samLearningProfile?: unknown;
}
