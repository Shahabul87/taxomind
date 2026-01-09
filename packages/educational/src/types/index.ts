/**
 * SAM AI Educational Package - Type Definitions
 * 
 * This barrel file re-exports all types from individual engine type files.
 * Import types from this file for a unified import experience.
 */

// Common types shared across engines
export * from './common';

// Engine interfaces
export * from './interfaces';

// Engine-specific types
export * from './exam.types';
export * from './evaluation.types';
export * from './blooms.types';
export * from './personalization.types';
export * from './content.types';
export * from './resource.types';
export * from './multimedia.types';
export * from './financial.types';
export * from './predictive.types';
export * from './analytics.types';
export * from './memory.types';
export * from './research.types';
export * from './trends.types';
export * from './achievement.types';
export * from './integrity.types';
export * from './course-guide.types';
export * from './collaboration.types';
export * from './social.types';
export * from './innovation.types';
export * from './market.types';
export * from './unified-blooms.types';

// Phase 2 Engines
export * from './practice-problems.types';
export * from './adaptive-content.types';
export * from './socratic-teaching.types';

// Knowledge Graph Engine (New)
export * from './knowledge-graph.types';

// Microlearning Engine (New)
export * from './microlearning.types';

// Metacognition Engine (New)
export * from './metacognition.types';

// Competency Engine (New)
export * from './competency.types';

// Peer Learning Engine (New)
export * from './peer-learning.types';

// Multimodal Input Engine (New)
export * from './multimodal-input.types';

// SkillBuildTrack Engine (New - January 2026)
// Using explicit exports to avoid naming conflicts with competency.types and microlearning.types
export {
  // Configuration
  type SkillBuildTrackEngineConfig,
  type CompositeScoreWeights,
  // Enums and basic types
  type SkillBuildProficiencyLevel,
  type SkillBuildFramework,
  type SkillBuildCategory,
  type SkillBuildTrend,
  type SkillBuildEvidenceType,
  type SkillBuildRoadmapStatus,
  type SkillBuildMilestoneStatus,
  type SkillBuildBenchmarkSource,
  PROFICIENCY_THRESHOLDS,
  DEFAULT_DECAY_RATES,
  // Skill definition types
  type SkillBuildDefinition,
  type SkillBuildFrameworkMapping,
  type SkillLearningCurve,
  type SkillMarketDemand,
  // Profile types
  type SkillBuildProfile,
  type SkillBuildDimensions,
  type SkillBuildVelocity,
  type SkillBuildDecayInfo,
  type DecayCurvePoint,
  type SkillBuildEvidence,
  type SkillPracticeHistory,
  type SkillLevelChange,
  // Roadmap types
  type SkillBuildRoadmap,
  type RoadmapTargetOutcome,
  type RoadmapTargetSkill,
  type SkillBuildRoadmapMilestone,
  type RoadmapMilestoneSkill,
  type RoadmapResource,
  type RoadmapAdjustment,
  // Benchmark types
  type SkillBuildBenchmark,
  type BenchmarkDistribution,
  type BenchmarkPosition,
  type RoleBuildBenchmark,
  type RoleSkillBenchmark,
  type RoleMatchAssessment,
  // Portfolio types (aliased to avoid conflict with competency.types)
  type SkillBuildPortfolio,
  type PortfolioSummary as SkillBuildPortfolioSummary,
  type CategoryStats as SkillBuildCategoryStats,
  type EmployabilityAnalysis,
  type RoleEmployabilityMatch,
  type InDemandSkillMatch,
  type SkillGapInfo,
  type MarketPosition as SkillBuildMarketPosition,
  type SalaryRange as SkillBuildSalaryRange,
  type EmployabilityImprovement,
  // Insights types (aliased to avoid conflict with microlearning.types)
  type SkillBuildInsights,
  type ProgressSummary as SkillBuildProgressSummary,
  type LearningPatterns as SkillBuildLearningPatterns,
  type DecayRiskSummary,
  type SkillDecayRisk,
  type UpcomingReview,
  type VelocityAnalysis,
  type VelocitySkillInfo,
  type ProjectedCompletion,
  type SkillBuildRecommendation,
  type NextAction as SkillBuildNextAction,
  type SkillBuildAchievement,
  // API input/output types
  type GetSkillProfileInput,
  type GetUserSkillProfilesInput,
  type GetUserSkillProfilesResult,
  type RecordPracticeInput,
  type RecordPracticeResult,
  type GetDecayPredictionsInput,
  type GetDecayPredictionsResult,
  type SkillDecayPrediction,
  type ReviewScheduleItem,
  type GenerateRoadmapInput,
  type RoadmapPreferences,
  type GenerateRoadmapResult,
  type UpdateRoadmapProgressInput,
  type GetSkillBenchmarkInput,
  type GetRoleBenchmarkInput,
  type GetPortfolioInput,
  type AddEvidenceInput,
  type AddEvidenceResult,
  type GetInsightsInput,
  // Store interface
  type SkillBuildTrackStore,
  type SkillDefinitionFilters,
  type ProfileFilters,
  type PracticeLog,
  // Utility types
  type DimensionsUpdate,
  type DimensionScoreUpdate,
} from './skill-build-track.types';

// Note: depth-analysis.types are exported directly from the enhanced-depth-engine
// to avoid naming conflicts with blooms.types and other type files.
