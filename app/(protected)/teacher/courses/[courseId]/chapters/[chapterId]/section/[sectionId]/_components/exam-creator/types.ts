import type { BloomsLevel as PrismaBloomsLevel, QuestionType as PrismaQuestionType, QuestionDifficulty as PrismaQuestionDifficulty } from "@prisma/client";

// ============================================================================
// LEGACY TYPES (kept for backward compatibility with existing components)
// ============================================================================

export interface Question {
  id: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  bloomsLevel?: BloomsLevel;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
  // SAM-enhanced fields (optional for backward compatibility)
  timeEstimate?: number;
  cognitiveLoad?: number;
  bloomsAlignment?: number;
  safetyScore?: number;
  qualityScore?: number;
}

export type QuestionType = "multiple-choice" | "true-false" | "short-answer";
export type DifficultyLevel = "easy" | "medium" | "hard";
export type BloomsLevel = "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";

export interface Exam {
  id: string;
  title: string;
  description: string;
  timeLimit?: number;
  questions: ExamQuestion[];
  totalPoints: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    userAttempts: number;
  };
}

export interface ExamQuestion {
  id: string;
  examId: string;
  questionType: string;
  difficulty: string;
  bloomsLevel?: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
  orderIndex: number;
}

export interface ExamCreationFormProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  initialData?: SectionInitialData;
}

export interface ExamFormData {
  title: string;
  description: string;
  timeLimit?: string;
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  feedback: string[];
  suggestions: string[];
}

export interface CourseContext {
  courseId: string;
  chapterId: string;
  sectionId: string;
  courseTitle: string;
  chapterTitle: string;
  sectionTitle: string;
}

// ============================================================================
// UNIFIED EXAM BUILDER TYPES (new system)
// ============================================================================

/** Exam builder mode toggle */
export type ExamBuilderMode = "manual" | "ai";

/** Answer visibility state per question */
export type AnswerVisibility = "hidden" | "revealed";

/** Section initial data passed from parent */
export interface SectionInitialData {
  section?: { title: string };
  chapter?: { title: string };
  course?: { title: string };
}

/** Question option for MCQ/True-False (mirrors enhanced-exam-creator) */
export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

/** Unified question that works across manual and AI modes */
export interface UnifiedQuestion {
  id: string;
  question: string;
  questionType: PrismaQuestionType;
  bloomsLevel: PrismaBloomsLevel;
  difficulty: PrismaQuestionDifficulty;
  points: number;
  estimatedTime: number; // seconds
  options?: QuestionOption[];
  correctAnswer: string;
  acceptableVariations?: string[];
  hint?: string;
  explanation: string;
  commonMisconceptions?: string[];
  cognitiveSkills?: string[];
  relatedConcepts?: string[];
  learningObjectiveId?: string;
  // Generation metadata
  generationMode?: "MANUAL" | "AI_QUICK" | "AI_GUIDED" | "AI_ADAPTIVE" | "AI_GAP_FILLING";
  confidence?: number;
  needsReview?: boolean;
  // Answer visibility
  answerVisibility: AnswerVisibility;
  // Evaluation results (filled after AI evaluation)
  evaluationData?: QuestionEvaluationData;
}

/** Per-question AI evaluation results */
export interface QuestionEvaluationData {
  detectedBloomsLevel: PrismaBloomsLevel;
  bloomsAlignmentScore: number; // 0-100
  qualityScore: number; // 0-100
  clarityScore: number; // 0-100
  cognitiveRigorScore: number; // 0-100
  issues: EvaluationIssue[];
  suggestions: string[];
  suggestedRewrite?: string;
}

/** Issue found during evaluation */
export interface EvaluationIssue {
  type: "error" | "warning" | "info";
  message: string;
  field?: string;
}

/** Bloom&apos;s distribution config for AI generation */
export interface BloomsDistribution {
  REMEMBER: number;
  UNDERSTAND: number;
  APPLY: number;
  ANALYZE: number;
  EVALUATE: number;
  CREATE: number;
}

/** Full exam evaluation report from SAM */
export interface ExamEvaluationReport {
  /** Overall pedagogical effectiveness score (0-100) */
  overallScore: number;
  /** Grade label (A, B, C, D, F) */
  grade: string;
  /** Bloom&apos;s taxonomy distribution analysis */
  bloomsAnalysis: {
    targetDistribution: BloomsDistribution;
    actualDistribution: BloomsDistribution;
    alignmentScore: number; // 0-100
    missingLevels: PrismaBloomsLevel[];
    overrepresentedLevels: PrismaBloomsLevel[];
  };
  /** Per-question analysis */
  questionAnalyses: QuestionEvaluationData[];
  /** Coverage gaps in cognitive skills */
  coverageGaps: CoverageGap[];
  /** Correction suggestions for the exam as a whole */
  examSuggestions: string[];
  /** Summary text */
  summary: string;
  /** Timestamp */
  evaluatedAt: string;
}

/** Coverage gap in Bloom&apos;s taxonomy or cognitive skills */
export interface CoverageGap {
  area: string;
  severity: "low" | "medium" | "high";
  recommendation: string;
}

/** Exam metadata (title, description, settings) */
export interface ExamMetadata {
  title: string;
  description: string;
  timeLimit: number | null;
  passingScore: number;
  attempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResults: boolean;
  showCorrectAnswers: boolean;
  showExplanations: boolean;
  allowReview: boolean;
  isPublished: boolean;
  proctoring: boolean;
  randomizeFromPool: boolean;
  poolSize: number | null;
}

/** AI generation config */
export interface AIGenerationConfig {
  questionCount: number;
  bloomsDistribution: BloomsDistribution;
  questionTypes: PrismaQuestionType[];
  difficulty: PrismaQuestionDifficulty;
  includeHints: boolean;
  includeExplanations: boolean;
  includeMisconceptions: boolean;
  creativity: number; // 1-10
  realWorldContext: boolean;
}

/** Section context for API calls */
export interface SectionContext {
  courseId: string;
  chapterId: string;
  sectionId: string;
  courseTitle: string;
  chapterTitle: string;
  sectionTitle: string;
  sectionContent?: string;
  learningObjectives?: string[];
}

/** Props for the unified exam builder */
export interface UnifiedExamBuilderProps {
  courseId: string;
  chapterId: string;
  sectionId: string;
  initialData?: SectionInitialData;
  sectionContent?: string;
  learningObjectives?: string[];
}

/** Default Bloom&apos;s distribution */
export const DEFAULT_BLOOMS_DISTRIBUTION: BloomsDistribution = {
  REMEMBER: 10,
  UNDERSTAND: 20,
  APPLY: 30,
  ANALYZE: 20,
  EVALUATE: 15,
  CREATE: 5,
};

/** Default exam metadata */
export const DEFAULT_EXAM_METADATA: ExamMetadata = {
  title: "",
  description: "",
  timeLimit: 60,
  passingScore: 70,
  attempts: 3,
  shuffleQuestions: true,
  shuffleOptions: true,
  showResults: true,
  showCorrectAnswers: true,
  showExplanations: true,
  allowReview: true,
  isPublished: false,
  proctoring: false,
  randomizeFromPool: false,
  poolSize: null,
};
