import type { BloomsLevel, QuestionType, QuestionDifficulty, AttemptStatus, EvaluationType } from "@prisma/client";

/** Dashboard list item — summary for practice set cards */
export interface PracticeProblemSetSummary {
  id: string;
  title: string | null;
  topic: string;
  status: string;
  difficulty: string | null;
  bloomsLevel: BloomsLevel | null;
  questionCount: number;
  totalAttempts: number;
  bestScore: number | null;
  avgScore: number | null;
  lastAttemptedAt: string | null;
  createdAt: string;
  _count: {
    questions: number;
    attempts: number;
  };
}

/** Full set with questions for solving */
export interface PracticeProblemSetWithQuestions {
  id: string;
  title: string | null;
  topic: string;
  status: string;
  difficulty: string | null;
  bloomsLevel: BloomsLevel | null;
  questionCount: number;
  createdAt: string;
  questions: PracticeQuestionForSolving[];
}

/** Question without correctAnswer — safe for client */
export interface PracticeQuestionForSolving {
  id: string;
  questionType: QuestionType;
  question: string;
  options: PracticeQuestionOption[] | null;
  bloomsLevel: BloomsLevel;
  difficulty: QuestionDifficulty;
  points: number;
  order: number;
  hints: PracticeHint[] | null;
  relatedConcepts: string[];
  estimatedTime: number | null;
}

export interface PracticeQuestionOption {
  id: string;
  text: string;
}

export interface PracticeHint {
  id: string;
  content: string;
  order: number;
  penaltyPoints: number;
}

/** Student answer submission */
export interface PracticeAnswerInput {
  questionId: string;
  answer: string;
  timeSpent?: number;
  hintsUsed?: number;
}

/** Full graded results */
export interface PracticeAttemptResults {
  id: string;
  attemptNumber: number;
  status: AttemptStatus;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number | null;
  earnedPoints: number;
  totalPoints: number;
  timeSpent: number | null;
  bloomsPerformance: BloomsPerformanceMap | null;
  weakAreas: string[];
  strongAreas: string[];
  recommendations: PracticeRecommendation[] | null;
  startedAt: string;
  submittedAt: string | null;
  answers: PracticeQuestionResult[];
}

/** Per-question result with AI feedback */
export interface PracticeQuestionResult {
  id: string;
  questionId: string;
  question: string;
  questionType: QuestionType;
  answer: string;
  correctAnswer: string;
  explanation: string | null;
  isCorrect: boolean | null;
  pointsEarned: number;
  evaluationType: EvaluationType;
  aiFeedback: string | null;
  aiScore: number | null;
  targetBloomsLevel: BloomsLevel | null;
  demonstratedLevel: BloomsLevel | null;
  misconceptions: string[];
  knowledgeGaps: string[];
  hintsUsed: number;
  options: PracticeQuestionOptionWithAnswer[] | null;
}

export interface PracticeQuestionOptionWithAnswer extends PracticeQuestionOption {
  isCorrect: boolean;
  explanation?: string;
}

export interface BloomsPerformanceMap {
  [level: string]: {
    correct: number;
    total: number;
    percentage: number;
  };
}

export interface PracticeRecommendation {
  type: string;
  message: string;
  bloomsLevel?: BloomsLevel;
}

/** Stats for the dashboard */
export interface PracticeStats {
  totalSets: number;
  totalAttempts: number;
  avgScore: number;
  problemsSolved: number;
  bloomsDistribution: BloomsPerformanceMap;
}
