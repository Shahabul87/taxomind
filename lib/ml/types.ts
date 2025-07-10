// ML Model Types and Interfaces

export interface StudentFeatures {
  // Engagement metrics
  engagementScore: number;
  averageSessionDuration: number;
  totalInteractions: number;
  clickRate: number;
  scrollDepth: number;
  
  // Video metrics
  videoCompletionRate: number;
  averageWatchTime: number;
  pauseFrequency: number;
  seekCount: number;
  replayCount: number;
  
  // Learning metrics
  quizScore: number;
  assignmentCompletionRate: number;
  timeToComplete: number;
  strugglingTopicsCount: number;
  
  // Behavioral patterns
  preferredStudyTime: number[]; // 24-hour distribution
  studyFrequency: number;
  contentTypePreference: ContentPreference;
  learningStyle: LearningStyle;
  
  // Progress metrics
  courseProgress: number;
  moduleCompletionRate: number;
  consistencyScore: number;
}

export interface ContentPreference {
  video: number;
  text: number;
  interactive: number;
  quiz: number;
}

export interface LearningStyle {
  visual: number;
  auditory: number;
  kinesthetic: number;
  reading: number;
}

export interface PredictionOutput {
  // Completion prediction
  willComplete: number; // 0-1 probability
  estimatedCompletionDate: Date;
  
  // Performance prediction
  predictedFinalScore: number;
  performanceLevel: 'low' | 'medium' | 'high';
  
  // Risk assessment
  dropoutRisk: number; // 0-1 probability
  strugglingProbability: number;
  
  // Recommendations
  recommendedContent: string[];
  suggestedInterventions: Intervention[];
  optimalStudyTime: number[]; // Hours of day
  
  // Personalization
  adaptiveDifficulty: number; // 0-1 scale
  recommendedPace: 'slow' | 'normal' | 'fast';
  nextBestAction: string;
}

export interface Intervention {
  type: 'content' | 'support' | 'motivation' | 'remedial';
  priority: 'low' | 'medium' | 'high';
  action: string;
  reason: string;
  timing: 'immediate' | 'next_session' | 'scheduled';
}

export interface MLModel {
  id: string;
  name: string;
  version: string;
  type: ModelType;
  accuracy: number;
  trainedAt: Date;
  parameters: ModelParameters;
  status: 'training' | 'ready' | 'deprecated';
}

export type ModelType = 
  | 'completion_prediction'
  | 'performance_prediction'
  | 'dropout_detection'
  | 'content_recommendation'
  | 'difficulty_adaptation'
  | 'learning_path_optimization';

export interface ModelParameters {
  epochs: number;
  batchSize: number;
  learningRate: number;
  hiddenLayers: number[];
  optimizer: string;
  lossFunction: string;
  metrics: string[];
}

export interface TrainingData {
  features: StudentFeatures;
  labels: {
    completed: boolean;
    finalScore: number;
    droppedOut: boolean;
    timeToComplete: number;
  };
  metadata: {
    studentId: string;
    courseId: string;
    timestamp: Date;
  };
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  confusionMatrix: number[][];
  featureImportance: Record<string, number>;
}