/**
 * SAM Sequential Course Creation Module
 *
 * Exports all types, prompts, and utilities for the 3-stage
 * course creation process.
 */

// Types
export * from './types';

// Prompts
export {
  buildStage1Prompt,
  buildStage2Prompt,
  buildStage3Prompt,
  getBloomsLevelForChapter,
  getContentAwareBloomsLevel,
  suggestContentType,
  getStage3DesignExpertise,
} from './prompts';
export type { Stage3PromptOptions } from './prompts';

// Orchestrator (coordinator)
export { orchestrateCourseCreation } from './orchestrator';
export type { OrchestrateOptions } from './orchestrator';

// Chapter Generator (extracted from orchestrator for modularity)
export { generateSingleChapter } from './chapter-generator';
export type { ChapterGenerationCallbacks } from './chapter-generator';

// Checkpoint / Resume
export { resumeCourseCreation, saveCheckpoint, saveCheckpointWithRetry } from './checkpoint-manager';
export type { SaveCheckpointInput } from './checkpoint-manager';

// Chapter Regeneration
export { regenerateChapter, regenerateSectionsOnly, regenerateDetailsOnly } from './chapter-regenerator';
export type { RegenerateChapterOptions, RegenerateChapterResult } from './chapter-regenerator';

// Response Parsers
export { parseChapterResponse, parseSectionResponse, parseDetailsResponse } from './response-parsers';

// Agentic Modules
export { extractQualityFeedback, buildQualityFeedbackBlock } from './quality-feedback';
export type { QualityFeedback } from './quality-feedback';
export { recallCourseCreationMemory, recallChapterContext, buildMemoryRecallBlock } from './memory-recall';
export type { RecalledMemory } from './memory-recall';
export { critiqueGeneration } from './self-critique';
export type { GenerationCritique } from './self-critique';
export { AdaptiveStrategyMonitor } from './adaptive-strategy';
export type { GenerationStrategy, GenerationPerformance, DegradationReport } from './adaptive-strategy';

// Course Planning (Phase 7: Agentic Planning)
export { planCourseBlueprint, buildBlueprintBlock, replanRemainingChapters } from './course-planner';

// Agentic Decisions (Phase 7: Between-Chapter Decision Engine)
export {
  evaluateChapterOutcome,
  evaluateChapterOutcomeEnhanced,
  evaluateChapterOutcomeWithAI,
  analyzeQualityTrend,
  buildAdaptiveGuidance,
  applyAgenticDecision,
  generateBridgeContent,
} from './agentic-decisions';

// Course Reflection (Phase 7: Post-Generation Analysis)
export { reflectOnCourse, reflectOnCourseWithAI } from './course-reflector';

// Healing Loop (Phase 8: Autonomous Healing)
export { runHealingLoop, diagnoseChapterIssues } from './healing-loop';

// Chapter Critic (Multi-Agent Review)
export { reviewChapterWithCritic, registerCriticAgent } from './chapter-critic';
export type { CriticVerdict, ChapterCritique } from './chapter-critic';

// Dynamic Section Selection
export { selectTemplateSections } from './chapter-templates';

// State Machine (Phase 1: Agentic Foundation)
export { CourseCreationStateMachine } from './course-state-machine';
export type { CourseStateMachineConfig, SharedPipelineState } from './course-state-machine';
