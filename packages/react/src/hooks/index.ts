/**
 * @sam-ai/react - Hooks exports
 */

export { useSAM } from './useSAM';
export { useSAMChat } from './useSAMChat';
export { useSAMActions } from './useSAMActions';
export { useSAMPageContext, useSAMAutoContext } from './useSAMPageContext';
export { useSAMAnalysis } from './useSAMAnalysis';
export { useSAMForm, useSAMFormSync } from './useSAMForm';
export { useSAMPageLinks } from './useSAMPageLinks';
export { useSAMFormDataSync } from './useSAMFormDataSync';
export { useSAMFormDataEvents } from './useSAMFormDataEvents';
export { useSAMFormAutoDetect } from './useSAMFormAutoDetect';
export { useSAMFormAutoFill } from './useSAMFormAutoFill';

// Phase 2 Hooks - Practice Problems, Adaptive Content, Socratic Teaching
export { useSAMPracticeProblems } from './useSAMPracticeProblems';
export type { UseSAMPracticeProblemsOptions, UseSAMPracticeProblemsReturn } from './useSAMPracticeProblems';

export { useSAMAdaptiveContent } from './useSAMAdaptiveContent';
export type { UseSAMAdaptiveContentOptions, UseSAMAdaptiveContentReturn } from './useSAMAdaptiveContent';

export { useSAMSocraticDialogue } from './useSAMSocraticDialogue';
export type { UseSAMSocraticDialogueOptions, UseSAMSocraticDialogueReturn } from './useSAMSocraticDialogue';

// Phase 5 Hooks - Agentic AI Capabilities
export { useAgentic } from './useAgentic';
export type {
  UseAgenticOptions,
  UseAgenticReturn,
  Goal,
  SubGoal,
  Plan,
  PlanStep,
  Recommendation,
  RecommendationBatch,
  ProgressReport,
  SkillAssessment,
  CheckIn,
  CreateGoalData,
  CheckInResponse,
} from './useAgentic';
