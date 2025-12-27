/**
 * Content Generation Engine Types
 */

import type { SAMConfig, SAMDatabaseAdapter } from '@sam-ai/core';

// ============================================================================
// CONTENT GENERATION ENGINE TYPES
// ============================================================================

export interface ContentGenerationEngineConfig {
  samConfig: SAMConfig;
  database?: SAMDatabaseAdapter;
  defaults?: GenerationDefaults;
}

export interface GenerationDefaults {
  style: GenerationStyle;
  depth: GenerationDepth;
  includeExamples: boolean;
  includeVisuals: boolean;
  includeActivities: boolean;
}

export type GenerationStyle = 'formal' | 'conversational' | 'technical' | 'simple';
export type GenerationDepth = 'basic' | 'intermediate' | 'advanced' | 'expert';

export interface GenerationConfig {
  style: GenerationStyle;
  depth: GenerationDepth;
  includeExamples: boolean;
  includeVisuals: boolean;
  includeActivities: boolean;
  targetAudience?: string;
  constraints?: string[];
}

export interface LearningObjectiveInput {
  id: string;
  objective: string;
  bloomsLevel: string;
  skills: string[];
  assessmentCriteria: string[];
}

export interface CourseContentOutput {
  courseId?: string;
  title: string;
  description: string;
  outline: CourseOutlineOutput;
  estimatedDuration: number;
  difficulty: string;
  prerequisites: string[];
  learningOutcomes: string[];
  targetAudience: string;
}

export interface CourseOutlineOutput {
  chapters: ChapterOutlineOutput[];
  totalSections: number;
  totalLessons: number;
}

export interface ChapterOutlineOutput {
  title: string;
  description: string;
  objectives: string[];
  sections: SectionOutlineOutput[];
  estimatedDuration: number;
}

export interface SectionOutlineOutput {
  title: string;
  type: 'lesson' | 'activity' | 'assessment';
  content: string;
  duration: number;
  resources?: string[];
}

export interface TopicInput {
  id: string;
  name: string;
  keywords: string[];
}

export interface AssessmentOutput {
  id: string;
  type: 'quiz' | 'exam' | 'assignment' | 'project';
  title: string;
  description: string;
  questions: GeneratedQuestion[];
  passingScore: number;
  duration: number;
  instructions: string[];
}

export interface GeneratedQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'coding';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
  difficulty: string;
  bloomsLevel: string;
  hints?: string[];
}

export interface ConceptInput {
  id: string;
  name: string;
  description: string;
  skills?: string[];
}

export interface ExerciseOutput {
  id: string;
  type: 'practice' | 'challenge' | 'project';
  title: string;
  description: string;
  difficulty: string;
  skills: string[];
  instructions: string[];
  startingCode?: string;
  testCases?: TestCaseOutput[];
  solution?: string;
  hints: string[];
}

export interface TestCaseOutput {
  input: string;
  expectedOutput: string;
  description: string;
}

export interface CourseForStudyGuide {
  id: string;
  title: string;
  difficulty?: string;
  chapters?: Array<{
    title: string;
    sections?: Array<{
      title: string;
      content?: string;
    }>;
  }>;
}

export interface StudyGuideOutput {
  courseId: string;
  chapterId?: string;
  title: string;
  overview: string;
  keyTopics: KeyTopicOutput[];
  summaries: SummaryOutput[];
  practiceQuestions: GeneratedQuestion[];
  studyTips: string[];
  additionalResources: ResourceOutput[];
}

export interface KeyTopicOutput {
  topic: string;
  importance: 'critical' | 'important' | 'supplementary';
  explanation: string;
  examples: string[];
}

export interface SummaryOutput {
  section: string;
  bulletPoints: string[];
  keyTakeaways: string[];
}

export interface ResourceOutput {
  title: string;
  type: string;
  url?: string;
  description: string;
}

export interface ContentInput {
  title: string;
  description: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export interface LanguageInput {
  code: string;
  name: string;
  culture?: string;
}

export interface LocalizedContentOutput {
  originalContent: ContentInput;
  targetLanguage: string;
  translatedContent: ContentInput;
  culturalAdaptations: string[];
  glossary: GlossaryTermOutput[];
}

export interface GlossaryTermOutput {
  original: string;
  translated: string;
  context: string;
}

export type AssessmentType = 'quiz' | 'exam' | 'assignment' | 'project';
export type ExerciseType = 'practice' | 'challenge' | 'project';

export interface ContentGenerationEngine {
  generateCourseContent(
    objectives: LearningObjectiveInput[],
    config?: GenerationConfig
  ): Promise<CourseContentOutput>;

  createAssessments(
    topics: TopicInput[],
    assessmentType: AssessmentType,
    config?: GenerationConfig
  ): Promise<AssessmentOutput[]>;

  generateStudyGuides(course: CourseForStudyGuide): Promise<StudyGuideOutput>;

  createInteractiveExercises(
    concepts: ConceptInput[],
    exerciseType: ExerciseType
  ): Promise<ExerciseOutput[]>;

  adaptContentLanguage(
    content: ContentInput,
    targetLanguage: LanguageInput
  ): Promise<LocalizedContentOutput>;
}
