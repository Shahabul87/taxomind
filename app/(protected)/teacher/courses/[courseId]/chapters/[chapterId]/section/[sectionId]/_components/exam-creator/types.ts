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
  initialData?: {
    section?: {
      title: string;
    };
    chapter?: {
      title: string;
    };
    course?: {
      title: string;
    };
  };
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