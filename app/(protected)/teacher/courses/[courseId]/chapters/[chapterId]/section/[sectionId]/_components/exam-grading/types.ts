import { BloomsLevel, QuestionType, QuestionDifficulty, EvaluationType } from "@prisma/client";

// Evaluation Result Types
export interface ExamAttemptResult {
  id: string;
  examId: string;
  examTitle: string;
  status: "IN_PROGRESS" | "SUBMITTED" | "GRADED";
  scorePercentage: number;
  isPassed: boolean;
  passingScore: number;
  startedAt: string;
  submittedAt: string | null;
  timeSpent: number | null;
  totalQuestions: number;
  correctAnswers: number;
  answers: AnswerResult[];
  bloomsBreakdown: BloomsBreakdown;
  cognitiveProfile: CognitiveProfile;
}

export interface AnswerResult {
  id: string;
  questionId: string;
  question: QuestionData;
  studentAnswer: string;
  isCorrect: boolean | null;
  pointsEarned: number;
  maxPoints: number;
  evaluationType: EvaluationType;
  feedback: string;
  aiEvaluation?: AIEvaluationData;
  teacherOverride?: TeacherOverride;
}

export interface QuestionData {
  id: string;
  question: string;
  questionType: QuestionType;
  bloomsLevel: BloomsLevel;
  difficulty: QuestionDifficulty;
  points: number;
  correctAnswer: string;
  explanation?: string;
  hint?: string;
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface AIEvaluationData {
  accuracy: number;
  completeness: number;
  relevance: number;
  depth: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  nextSteps: string[];
  demonstratedLevel: BloomsLevel;
  targetLevel: BloomsLevel;
  conceptsUnderstood: string[];
  misconceptions: Misconception[];
  knowledgeGaps: string[];
  confidence: number;
  flaggedForReview: boolean;
}

export interface Misconception {
  concept: string;
  incorrectUnderstanding: string;
  correctUnderstanding: string;
  remediation: string;
}

export interface TeacherOverride {
  teacherId: string;
  teacherName: string;
  originalScore: number;
  overrideScore: number;
  reason: string;
  timestamp: string;
}

export interface BloomsBreakdown {
  REMEMBER: LevelPerformance;
  UNDERSTAND: LevelPerformance;
  APPLY: LevelPerformance;
  ANALYZE: LevelPerformance;
  EVALUATE: LevelPerformance;
  CREATE: LevelPerformance;
}

export interface LevelPerformance {
  questionsCount: number;
  correctCount: number;
  scorePercentage: number;
  averageTime: number;
}

export interface CognitiveProfile {
  overallMastery: number;
  strengths: BloomsLevel[];
  weaknesses: BloomsLevel[];
  recommendedFocus: BloomsLevel[];
  learningPath: LearningRecommendation[];
}

export interface LearningRecommendation {
  type: "review" | "practice" | "advance";
  title: string;
  description: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  relatedConcepts: string[];
}

// Grading Dashboard Types
export interface GradingQueueItem {
  attemptId: string;
  studentId: string;
  studentName: string;
  studentImage?: string;
  examTitle: string;
  submittedAt: string;
  questionsToReview: number;
  autoScore: number;
  status: "pending" | "in_review" | "completed";
}

export interface GradingSession {
  attemptId: string;
  currentQuestionIndex: number;
  answers: AnswerForGrading[];
  totalGraded: number;
  totalToGrade: number;
  startedAt: string;
}

export interface AnswerForGrading {
  id: string;
  questionId: string;
  question: QuestionData;
  studentAnswer: string;
  aiEvaluation: AIEvaluationData;
  currentScore: number;
  maxScore: number;
  status: "pending" | "approved" | "modified";
  teacherScore?: number;
  teacherFeedback?: string;
}

// Rubric Types
export interface GradingRubric {
  id: string;
  name: string;
  bloomsLevel: BloomsLevel;
  criteria: RubricCriterion[];
  maxScore: number;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  levels: RubricLevel[];
}

export interface RubricLevel {
  score: number;
  label: string;
  description: string;
  examples?: string[];
}

// Color mappings for Bloom's levels
export const BLOOMS_COLORS: Record<BloomsLevel, { bg: string; text: string; border: string; gradient: string }> = {
  REMEMBER: {
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
    gradient: "from-red-500 to-rose-500",
  },
  UNDERSTAND: {
    bg: "bg-orange-50 dark:bg-orange-950/30",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
    gradient: "from-orange-500 to-amber-500",
  },
  APPLY: {
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    text: "text-yellow-600 dark:text-yellow-400",
    border: "border-yellow-200 dark:border-yellow-800",
    gradient: "from-yellow-500 to-lime-500",
  },
  ANALYZE: {
    bg: "bg-green-50 dark:bg-green-950/30",
    text: "text-green-600 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
    gradient: "from-green-500 to-emerald-500",
  },
  EVALUATE: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    gradient: "from-blue-500 to-cyan-500",
  },
  CREATE: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
    gradient: "from-purple-500 to-violet-500",
  },
};

export const BLOOMS_LABELS: Record<BloomsLevel, string> = {
  REMEMBER: "Remember",
  UNDERSTAND: "Understand",
  APPLY: "Apply",
  ANALYZE: "Analyze",
  EVALUATE: "Evaluate",
  CREATE: "Create",
};

export const EVALUATION_TYPE_LABELS: Record<EvaluationType, { label: string; color: string }> = {
  AUTO_GRADED: { label: "Auto-Graded", color: "bg-blue-100 text-blue-700" },
  AI_EVALUATED: { label: "AI Evaluated", color: "bg-purple-100 text-purple-700" },
  TEACHER_GRADED: { label: "Teacher Graded", color: "bg-green-100 text-green-700" },
  PEER_REVIEWED: { label: "Peer Reviewed", color: "bg-amber-100 text-amber-700" },
  HYBRID: { label: "Hybrid", color: "bg-teal-100 text-teal-700" },
};
