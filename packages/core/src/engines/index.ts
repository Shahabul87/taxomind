/**
 * @sam-ai/core - Engines
 */

export { BaseEngine } from './base';
export type { BaseEngineOptions } from './base';

export { ContextEngine, createContextEngine } from './context';
export type { ContextEngineOutput, QueryIntent } from './context';

export { BloomsEngine, createBloomsEngine } from './blooms';
export type { BloomsEngineInput, BloomsEngineOutput } from './blooms';

export { ContentEngine, createContentEngine } from './content';
export type {
  ContentEngineOutput,
  ContentMetrics,
  ContentSuggestion,
  GeneratedContent,
} from './content';

export { AssessmentEngine, createAssessmentEngine } from './assessment';
export type {
  AssessmentEngineOutput,
  AssessmentConfig,
  AssessmentAnalysis,
  GeneratedQuestion,
  StudyGuide,
} from './assessment';

export { PersonalizationEngine, createPersonalizationEngine } from './personalization';
export type {
  PersonalizationEngineOutput,
  LearningStyleProfile,
  EmotionalProfile,
  EmotionalState,
  CognitiveLoadProfile,
  CognitiveLoad,
  MotivationProfile,
  ContentAdaptation,
  PersonalizedLearningPath,
  LearningPathNode,
} from './personalization';

export { ResponseEngine, createResponseEngine } from './response';
export type { ResponseEngineOutput } from './response';
