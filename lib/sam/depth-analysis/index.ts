/**
 * Agentic Depth Analysis V3 - Public API
 *
 * Re-exports the public interface for the depth analysis system.
 */

// Main orchestrator
export { orchestrateDepthAnalysis, generateIssueFingerprint } from './orchestrator';

// Controller (non-blocking goal/plan lifecycle)
export {
  initializeAnalysisGoal,
  advanceAnalysisStage,
  completeAnalysisStage,
  initializeChapterSubGoal,
  completeChapterSubGoal,
  completeAnalysis,
  failAnalysis,
  reactivateAnalysis,
  storeDecisionInPlan,
  storeReflectionInGoal,
} from './analysis-controller';

// Memory persistence
export {
  persistQualityPatternsBackground,
  persistAnalysisScoresBackground,
  recallAnalysisMemory,
} from './memory-persistence';

// Chapter analyzer
export { analyzeChapter } from './chapter-analyzer';

// Cross-chapter analyzer
export { runCrossChapterAnalysis } from './cross-chapter-analyzer';

// Post-processor
export { runPostProcessing } from './post-processor';

// Quality integration (Phase 5)
export {
  validateAnalysisQuality,
  runQualityGateOnSection,
  runPedagogicalGateOnSection,
} from './quality-integration';
export type { AnalysisQualityValidation } from './quality-integration';

// Framework evaluators (Phase 5)
export {
  evaluateBloomsRuleBased,
  blendFrameworkResults,
} from './framework-evaluators';
export type { MultiFrameworkResult, BlendConfig } from './framework-evaluators';

// Decision engine (Phase 6)
export { evaluateChapterOutcome, getModeBudget } from './decision-engine';
export type { BudgetState, DecisionContext } from './decision-engine';

// Healing engine (Phase 6)
export { healChapter } from './healing-engine';
export type { HealingResult } from './healing-engine';

// Types (re-export everything)
export type {
  AnalysisMode,
  AnalysisFramework,
  BloomsLevel,
  ScoreDimension,
  BloomsDistribution,
  DokDistribution,
  FrameworkScores,
  GagneEventCheck,
  PrerequisiteConcept,
  SectionAnalysisResult,
  ChapterAnalysisResult,
  CrossChapterResult,
  KnowledgeFlowIssue,
  ProgressionIssue,
  ConceptDependency,
  IssueType,
  IssueSeverity,
  IssueStatus,
  IssueEvidence,
  IssueImpact,
  IssueFix,
  AnalysisIssue,
  AnalysisOptions,
  AnalysisStepContext,
  ChapterContentData,
  SectionContentData,
  CourseDataForAnalysis,
  ModelInfo,
  AnalysisMemoryContext,
  AnalysisCheckpointData,
  AgenticDecision,
  DepthAnalysisSSEEventType,
  SSEEmitter,
  AnalysisStats,
  AnalysisReflection,
  ResumeState,
} from './types';

export { BLOOMS_DEPTH_WEIGHTS, SCORING_WEIGHTS } from './types';
