/**
 * Assessment Studio Components
 *
 * Phase 1 of the engine merge plan - integrating ExamEngine and EvaluationEngine
 * into a cohesive assessment hub.
 *
 * @module components/sam/assessment-studio
 */

export { AssessmentStudio } from "./AssessmentStudio";
export type { AssessmentStudioProps } from "./AssessmentStudio";

export { AIExamFeedbackPanel } from "./AIExamFeedbackPanel";
export type { AIExamFeedbackPanelProps } from "./AIExamFeedbackPanel";

// Re-export related components for convenience
export { ExamBuilder } from "../exam-builder";
export type { ExamBuilderProps } from "../exam-builder";

export { StudyGuideGenerator } from "../study-guide/StudyGuideGenerator";
export type { StudyGuideGeneratorProps, StudyGuide } from "../study-guide/StudyGuideGenerator";
