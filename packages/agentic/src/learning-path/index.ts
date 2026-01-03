/**
 * @sam-ai/agentic - Learning Path Module
 *
 * Portable skill tracking and learning path recommendation system.
 * Integrates with knowledge graphs for intelligent prerequisite management.
 */

// Types
export type {
  // Course & Concept Types
  CourseNode,
  ConceptNode,
  DifficultyLevel,
  PrerequisiteRelation,
  PrerequisiteImportance,
  CourseGraph,
  // User Skill Types
  UserSkillProfile,
  UserSkill,
  SkillTrend,
  ConceptPerformance,
  SkillUpdateResult,
  // Learning Path Types
  LearningPath,
  PathStep,
  LearningAction,
  StepPriority,
  LearningResource,
  ResourceType,
  LearningPathOptions,
  LearningStyle,
  // Spaced Repetition
  SpacedRepetitionSchedule,
  ReviewQuality,
  // Store Interfaces
  SkillStore,
  LearningPathStore,
  CourseGraphStore,
  // Analytics
  LearningAnalytics,
  ProgressSnapshot,
} from './types';

// Skill Tracker
export {
  SkillTracker,
  createSkillTracker,
  type SkillTrackerConfig,
} from './skill-tracker';

// Learning Path Recommender
export {
  LearningPathRecommender,
  createPathRecommender,
  type PathRecommenderConfig,
} from './path-recommender';
