/**
 * Course Analysis Input Types
 *
 * Shared type definitions for course analysis across standards evaluators
 * (OLC Scorecard, QM Evaluator) and the deterministic rubric engine.
 *
 * Originally defined in deterministic-rubric-engine.ts, extracted here
 * for reuse without circular dependencies.
 */

// ═══════════════════════════════════════════════════════════════
// COURSE ANALYSIS INPUT TYPES
// ═══════════════════════════════════════════════════════════════

export interface CourseAnalysisInput {
  courseId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  objectives: string[];
  chapters: ChapterInput[];
  assessments: AssessmentInput[];
  attachments?: AttachmentInput[];
  contentAnalysis?: ContentAnalysisInput;
  courseType?: string;
}

export interface ChapterInput {
  id: string;
  title: string;
  position: number;
  learningOutcome?: string;
  sections?: SectionInput[];
}

export interface SectionInput {
  id: string;
  title: string;
  position: number;
  videoUrl?: string;
  description?: string;
}

export interface AssessmentInput {
  id: string;
  title?: string;
  type: 'quiz' | 'exam' | 'assignment' | 'project' | 'practice' | 'other';
  questions?: QuestionInput[];
}

export interface QuestionInput {
  id: string;
  text: string;
  type?: string;
  difficulty?: number;
  bloomsLevel?: string;
  explanation?: string;
  feedback?: string;
  options?: OptionInput[];
}

export interface OptionInput {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface AttachmentInput {
  id: string;
  name: string;
  url: string;
}

export interface ContentAnalysisInput {
  bloomsDistribution: Record<string, number>;
  dokDistribution?: Record<string, number>;
}
