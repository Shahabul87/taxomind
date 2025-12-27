/**
 * Predictive Engine Types
 */

import type { SAMConfig, SAMDatabaseAdapter } from '@sam-ai/core';

// ============================================================================
// PREDICTIVE ENGINE TYPES
// ============================================================================

export interface PredictiveEngineConfig {
  samConfig: SAMConfig;
  database?: SAMDatabaseAdapter;
}

export interface PredictiveStudentProfile {
  userId: string;
  courseId?: string;
  learningHistory: PredictiveLearningHistory;
  performanceMetrics: PredictivePerformanceMetrics;
  behaviorPatterns: PredictiveBehaviorPatterns;
  demographicData?: DemographicData;
}

export interface PredictiveLearningHistory {
  coursesCompleted: number;
  averageScore: number;
  timeSpentLearning: number;
  lastActivityDate: Date;
  learningStreak: number;
  preferredLearningTime: string;
  strongSubjects: string[];
  weakSubjects: string[];
}

export interface PredictivePerformanceMetrics {
  overallProgress: number;
  assessmentScores: number[];
  averageScore: number;
  improvementRate: number;
  consistencyScore: number;
  engagementLevel: number;
  participationRate: number;
}

export interface PredictiveBehaviorPatterns {
  studyFrequency: 'daily' | 'weekly' | 'sporadic';
  sessionDuration: number;
  contentPreferences: string[];
  interactionPatterns: string[];
  strugglingIndicators: string[];
}

export interface DemographicData {
  educationLevel?: string;
  learningGoals?: string[];
  timeConstraints?: string[];
  preferredLanguage?: string;
}

export interface OutcomePrediction {
  successProbability: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  predictedCompletionDate: Date;
  predictedFinalScore: number;
  riskFactors: PredictiveRiskFactor[];
  successFactors: SuccessFactor[];
  recommendedActions: PredictiveAction[];
}

export interface PredictiveRiskFactor {
  factor: string;
  severity: 'low' | 'medium' | 'high';
  impact: number;
  description: string;
}

export interface SuccessFactor {
  factor: string;
  strength: 'weak' | 'moderate' | 'strong';
  contribution: number;
  description: string;
}

export interface PredictiveAction {
  type: 'immediate' | 'short-term' | 'long-term';
  priority: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  expectedImpact: number;
  resources: string[];
}

export interface StudentCohort {
  courseId: string;
  students: PredictiveStudentProfile[];
  timeframe: {
    start: Date;
    end: Date;
  };
}

export interface RiskAnalysis {
  atRiskStudents: AtRiskStudent[];
  riskDistribution: {
    high: number;
    medium: number;
    low: number;
    safe: number;
  };
  commonRiskFactors: PredictiveRiskFactor[];
  cohortHealth: number;
  interventionRecommendations: InterventionRecommendation[];
}

export interface AtRiskStudent {
  userId: string;
  riskLevel: 'high' | 'medium' | 'low';
  riskScore: number;
  primaryRisks: string[];
  lastActive: Date;
  predictedDropoutDate?: Date;
  interventionHistory: Intervention[];
}

export interface Intervention {
  type: string;
  date: Date;
  outcome: 'successful' | 'pending' | 'failed';
  impact?: number;
}

export interface InterventionRecommendation {
  targetGroup: string;
  interventionType: string;
  timing: 'immediate' | 'within-24h' | 'within-week';
  expectedEffectiveness: number;
  implementation: string[];
}

export interface InterventionPlan {
  studentId: string;
  interventions: PlannedIntervention[];
  sequencing: 'parallel' | 'sequential';
  totalExpectedImpact: number;
  timeline: InterventionTimeline;
}

export interface PlannedIntervention {
  id: string;
  type: 'email' | 'notification' | 'content-recommendation' | 'tutor-assignment' | 'peer-connection' | 'schedule-adjustment';
  timing: Date;
  content: string;
  expectedResponse: string;
  successCriteria: string[];
  fallbackPlan?: PlannedIntervention;
}

export interface InterventionTimeline {
  start: Date;
  milestones: InterventionMilestone[];
  end: Date;
}

export interface InterventionMilestone {
  date: Date;
  goal: string;
  metric: string;
  target: number;
}

export interface VelocityOptimization {
  currentVelocity: number;
  optimalVelocity: number;
  recommendations: VelocityRecommendation[];
  personalizedSchedule: PredictiveLearningSchedule;
  expectedImprovement: number;
}

export interface VelocityRecommendation {
  area: string;
  currentApproach: string;
  optimizedApproach: string;
  timeImpact: number;
  difficultyAdjustment: number;
}

export interface PredictiveLearningSchedule {
  dailyGoals: DailyGoal[];
  weeklyMilestones: string[];
  flexibilityScore: number;
  adaptationTriggers: string[];
}

export interface DailyGoal {
  day: string;
  duration: number;
  topics: string[];
  activities: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface PredictiveLearningContext {
  studentProfile: PredictiveStudentProfile;
  courseContext: PredictiveCourseContext;
  environmentFactors: EnvironmentFactors;
}

export interface PredictiveCourseContext {
  courseId: string;
  difficulty: string;
  duration: number;
  prerequisites: string[];
  assessmentTypes: string[];
}

export interface EnvironmentFactors {
  deviceType: string;
  networkQuality: string;
  distractionLevel: string;
  timeOfDay: string;
}

export interface ProbabilityScore {
  probability: number;
  confidence: number;
  factors: {
    positive: string[];
    negative: string[];
  };
  modelVersion: string;
  calculatedAt: Date;
}

export interface PredictiveEngine {
  predictLearningOutcomes(
    student: PredictiveStudentProfile
  ): Promise<OutcomePrediction>;

  identifyAtRiskStudents(cohort: StudentCohort): Promise<RiskAnalysis>;

  recommendInterventions(
    student: PredictiveStudentProfile
  ): Promise<InterventionPlan>;

  optimizeLearningVelocity(
    student: PredictiveStudentProfile
  ): Promise<VelocityOptimization>;

  calculateSuccessProbability(
    context: PredictiveLearningContext
  ): Promise<ProbabilityScore>;
}
