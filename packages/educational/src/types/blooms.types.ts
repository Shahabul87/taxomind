/**
 * Blooms Analysis Engine Types
 */

import type { SAMConfig, SAMDatabaseAdapter, BloomsLevel } from '@sam-ai/core';
import type { Resource } from './exam.types';

// ============================================================================
// BLOOMS ANALYSIS ENGINE TYPES
// ============================================================================

export interface BloomsAnalysisConfig {
  samConfig: SAMConfig;
  database?: SAMDatabaseAdapter;
  analysisDepth?: 'quick' | 'standard' | 'comprehensive';
}

export interface BloomsDistribution {
  REMEMBER: number;
  UNDERSTAND: number;
  APPLY: number;
  ANALYZE: number;
  EVALUATE: number;
  CREATE: number;
}

export interface BloomsAnalysisResult {
  distribution: BloomsDistribution;
  dominantLevel: BloomsLevel;
  gaps: BloomsLevel[];
  recommendations: BloomsRecommendation[];
  cognitiveProfile: CognitiveProfile;
}

export interface BloomsRecommendation {
  level: BloomsLevel;
  action: string;
  priority: 'low' | 'medium' | 'high';
  resources?: Resource[];
}

export interface CognitiveProfile {
  overallMastery: number;
  levelMastery: Record<BloomsLevel, number>;
  learningVelocity: number;
  preferredLevels: BloomsLevel[];
  challengeAreas: BloomsLevel[];
}

export interface CognitiveProgressUpdate {
  userId: string;
  courseId: string;
  bloomsLevelUpdates: BloomsLevelUpdate[];
  overallMastery: number;
  recommendedNextSteps: LearningRecommendation[];
  strengthAreas: string[];
  improvementAreas: string[];
}

export interface BloomsLevelUpdate {
  level: BloomsLevel;
  previousScore: number;
  newScore: number;
  questionsAttempted: number;
  questionsCorrect: number;
}

export interface LearningRecommendation {
  type: 'review' | 'practice' | 'advance' | 'remediate';
  title: string;
  description: string;
  bloomsLevel: BloomsLevel;
  priority: number;
  estimatedTime?: number;
}

export interface SpacedRepetitionInput {
  userId: string;
  conceptId: string;
  performance: number;
}

export interface SpacedRepetitionResult {
  nextReviewDate: Date;
  intervalDays: number;
  easeFactor: number;
  repetitionCount: number;
}

// ============================================================================
// COURSE ANALYSIS TYPES
// ============================================================================

export interface CourseAnalysisInput {
  id: string;
  title: string;
  description?: string;
  chapters: ChapterInput[];
}

export interface ChapterInput {
  id: string;
  title: string;
  position: number;
  sections: SectionInput[];
}

export interface SectionInput {
  id: string;
  title: string;
  type?: string;
  content?: string;
  description?: string;
  learningObjectives?: string[];
  duration?: number;
  hasVideo?: boolean;
  questions?: QuestionInput[];
  exams?: ExamInput[];
}

export interface QuestionInput {
  id: string;
  text: string;
  bloomsLevel?: BloomsLevel;
}

export interface ExamInput {
  id: string;
  title: string;
  questions: QuestionInput[];
}

export interface CourseAnalysisOptions {
  depth?: 'basic' | 'detailed' | 'comprehensive';
  includeRecommendations?: boolean;
  forceReanalyze?: boolean;
}

export interface CourseBloomsAnalysisResult {
  courseId: string;
  courseLevel: {
    distribution: BloomsDistribution;
    cognitiveDepth: number;
    balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
  };
  chapterAnalysis: ChapterBloomsAnalysis[];
  learningPathway: LearningPathway;
  recommendations: CourseRecommendations;
  studentImpact: StudentImpact;
  analyzedAt: string;
}

export interface ChapterBloomsAnalysis {
  chapterId: string;
  chapterTitle: string;
  bloomsDistribution: BloomsDistribution;
  primaryLevel: BloomsLevel;
  cognitiveDepth: number;
  sections: SectionBloomsAnalysis[];
}

export interface SectionBloomsAnalysis {
  sectionId: string;
  sectionTitle: string;
  bloomsLevel: BloomsLevel;
  activities: ActivityAnalysis[];
  learningObjectives: string[];
}

export interface ActivityAnalysis {
  type: string;
  bloomsLevel: BloomsLevel;
  description: string;
}

export interface LearningPathway {
  current: CognitivePath;
  recommended: CognitivePath;
  gaps: LearningGap[];
}

export interface CognitivePath {
  stages: CognitiveStage[];
  currentStage: number;
  completionPercentage: number;
}

export interface CognitiveStage {
  level: BloomsLevel;
  mastery: number;
  activities: string[];
  timeEstimate: number;
}

export interface LearningGap {
  level: BloomsLevel;
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestions: string[];
}

export interface CourseRecommendations {
  contentAdjustments: ContentRecommendation[];
  assessmentChanges: AssessmentRecommendation[];
  activitySuggestions: ActivitySuggestion[];
}

export interface ContentRecommendation {
  type: 'add' | 'modify' | 'remove';
  targetChapter?: string;
  targetSection?: string;
  bloomsLevel: BloomsLevel;
  description: string;
  impact: 'low' | 'medium' | 'high';
}

export interface AssessmentRecommendation {
  type: string;
  bloomsLevel: BloomsLevel;
  description: string;
  examples: string[];
}

export interface ActivitySuggestion {
  bloomsLevel: BloomsLevel;
  activityType: string;
  description: string;
  implementation: string;
  expectedOutcome: string;
}

export interface StudentImpact {
  skillsDeveloped: SkillDeveloped[];
  cognitiveGrowth: GrowthProjection;
  careerAlignment: CareerPath[];
}

export interface SkillDeveloped {
  name: string;
  bloomsLevel: BloomsLevel;
  proficiency: number;
  description: string;
}

export interface GrowthProjection {
  currentLevel: number;
  projectedLevel: number;
  timeframe: string;
  keyMilestones: string[];
}

export interface CareerPath {
  role: string;
  alignment: number;
  requiredSkills: string[];
  matchedSkills: string[];
}
