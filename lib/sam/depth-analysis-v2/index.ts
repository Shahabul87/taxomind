/**
 * Course Depth Analysis V2 - Main Entry Point
 *
 * Enhanced 8-step AI-powered course analysis system.
 */

// Main analyzer
export {
  EnhancedCourseAnalyzerV2,
  createEnhancedAnalyzerV2,
  generateContentHash,
} from './enhanced-analyzer';

// AI-powered analyzer
export {
  runAIAnalysis,
  type AIAnalysisProgress,
  type AIAnalyzerOptions,
  type AIAnalysisResult,
} from './ai-analyzer';

// Token estimation
export {
  TOKEN_LIMITS,
  estimateCourseTokens,
  estimateChapterTokens,
  determineAnalysisMode,
  buildChapterPreview,
  getTokenUsageSummary,
  type AnalysisMode,
} from './token-estimator';

// AI Prompts
export {
  buildCourseOverviewContext,
  buildCourseOverviewPrompt,
  parseCourseOverviewResponse,
  buildChapterContext,
  buildChapterAnalysisPrompt,
  parseChapterAnalysisResponse,
  buildCrossChapterContext,
  buildCrossChapterPrompt,
  parseCrossChapterResponse,
  type CourseOverviewContext,
  type CourseOverviewResult,
  type ChapterContext,
  type ChapterSummary,
  type ChapterAnalysisResult,
  type CrossChapterContext,
  type CrossChapterAnalysisResult,
} from './prompts';

// Individual analyzers
export { analyzeStructure } from './analyzers/structure-analyzer';
export { classifyBlooms } from './analyzers/blooms-classifier';
export { analyzeFlow } from './analyzers/flow-analyzer';
export { checkConsistency } from './analyzers/consistency-checker';
export { analyzeContent } from './analyzers/content-analyzer';
export { analyzeOutcomes } from './analyzers/outcomes-analyzer';
export { generateIssues } from './analyzers/issue-generator';
export { generateFixes } from './analyzers/fix-generator';
export { detectFallbacks } from './analyzers/fallback-detector';
export { analyzeFactualClaims } from './analyzers/factual-analyzer';
export { simulateLearner } from './analyzers/learner-simulator';

// Constants
export { BLOOMS_DEPTH_WEIGHTS } from './types';

// Types
export type {
  // Enums
  DepthAnalysisStatus,
  IssueSeverity,
  IssueType,
  IssueStatus,
  BloomsLevel,
  FixAction,

  // Input types
  CourseInput,
  ChapterInput,
  SectionInput,
  ExamInput,
  QuestionInput,

  // Analysis results
  BloomsDistribution,
  StructureAnalysisResult,
  SectionBloomsResult,
  ChapterBloomsResult,
  BloomsAnalysisResult,
  FlowAnalysisResult,
  ConsistencyAnalysisResult,
  DuplicateContent,
  ThinSection,
  ContentAnalysisResult,
  LearningOutcome,
  OutcomesAnalysisResult,

  // Issues
  AnalysisIssue,

  // Final result
  CourseDepthAnalysisV2Result,

  // Progress
  AnalysisProgress,
  ProgressCallback,

  // Options
  AnalyzerOptions,
} from './types';
