import { BloomsLevel, QuestionType, QuestionDifficulty } from "@prisma/client";

// Enhanced Question Types
export interface EnhancedQuestionFormData {
  question: string;
  questionType: QuestionType;
  bloomsLevel: BloomsLevel;
  difficulty: QuestionDifficulty;
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
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface BloomsGuidance {
  level: BloomsLevel;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  questionStarters: string[];
  verbsToUse: string[];
  exampleQuestions: string[];
  appropriateQuestionTypes: QuestionType[];
  difficultyRange: { min: number; max: number };
  typicalPoints: number;
  estimatedTimeRange: { min: number; max: number };
}

export interface BloomsDistribution {
  REMEMBER: number;
  UNDERSTAND: number;
  APPLY: number;
  ANALYZE: number;
  EVALUATE: number;
  CREATE: number;
}

export interface AIGenerationConfig {
  questionCount: number;
  bloomsDistribution: BloomsDistribution;
  questionTypes: QuestionType[];
  difficulty: QuestionDifficulty;
  includeHints: boolean;
  includeExplanations: boolean;
  includeMisconceptions: boolean;
  creativity: number; // 1-10
  realWorldContext: boolean;
}

export interface GeneratedQuestion extends EnhancedQuestionFormData {
  id: string;
  generationMode: "AI_QUICK" | "AI_GUIDED" | "AI_ADAPTIVE" | "AI_GAP_FILLING";
  confidence: number;
  needsReview: boolean;
}

export interface QuestionBankFilters {
  search: string;
  bloomsLevels: BloomsLevel[];
  questionTypes: QuestionType[];
  difficulties: QuestionDifficulty[];
  minPoints: number;
  maxPoints: number;
  hasHints: boolean | null;
  sortBy: "newest" | "oldest" | "points" | "difficulty" | "bloomsLevel";
}

export interface QuestionBankItem {
  id: string;
  question: string;
  questionType: QuestionType;
  bloomsLevel: BloomsLevel;
  difficulty: QuestionDifficulty;
  points: number;
  usageCount: number;
  successRate: number | null;
  createdAt: Date;
  tags: string[];
}

export interface ExamCreationState {
  mode: "manual" | "ai" | "bank" | "settings";
  questions: GeneratedQuestion[];
  selectedQuestions: string[];
  aiConfig: AIGenerationConfig;
  bankFilters: QuestionBankFilters;
  isGenerating: boolean;
  validationResults: Map<string, QuestionValidation>;
}

export interface QuestionValidation {
  isValid: boolean;
  bloomsScore: number;
  clarityScore: number;
  difficultyAccuracy: number;
  issues: ValidationIssue[];
  suggestions: string[];
}

export interface ValidationIssue {
  type: "error" | "warning" | "info";
  message: string;
  field?: string;
}

// Bloom's Level Constants
export const BLOOMS_GUIDANCE: Record<BloomsLevel, BloomsGuidance> = {
  REMEMBER: {
    level: "REMEMBER",
    name: "Remember",
    description: "Recall facts and basic concepts",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
    icon: "brain",
    questionStarters: [
      "What is...",
      "Define...",
      "List...",
      "Name...",
      "Identify...",
      "Which of the following...",
    ],
    verbsToUse: ["define", "identify", "list", "name", "recall", "recognize", "state", "match"],
    exampleQuestions: [
      "What is the capital of France?",
      "Define the term 'photosynthesis'.",
      "List the primary colors.",
    ],
    appropriateQuestionTypes: ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_IN_BLANK", "MATCHING"],
    difficultyRange: { min: 1, max: 3 },
    typicalPoints: 1,
    estimatedTimeRange: { min: 15, max: 45 },
  },
  UNDERSTAND: {
    level: "UNDERSTAND",
    name: "Understand",
    description: "Explain ideas or concepts",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-800",
    icon: "lightbulb",
    questionStarters: [
      "Explain...",
      "Describe...",
      "Summarize...",
      "Compare...",
      "What is the difference between...",
      "Why does...",
    ],
    verbsToUse: [
      "describe",
      "explain",
      "summarize",
      "paraphrase",
      "classify",
      "interpret",
      "compare",
    ],
    exampleQuestions: [
      "Explain why photosynthesis is important for life on Earth.",
      "Describe the water cycle in your own words.",
      "Summarize the main points of the article.",
    ],
    appropriateQuestionTypes: ["SHORT_ANSWER", "MULTIPLE_CHOICE", "MATCHING", "TRUE_FALSE"],
    difficultyRange: { min: 2, max: 5 },
    typicalPoints: 2,
    estimatedTimeRange: { min: 30, max: 90 },
  },
  APPLY: {
    level: "APPLY",
    name: "Apply",
    description: "Use information in new situations",
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    icon: "wrench",
    questionStarters: [
      "How would you use...",
      "Solve...",
      "Apply...",
      "Demonstrate...",
      "Calculate...",
      "What would happen if...",
    ],
    verbsToUse: ["apply", "demonstrate", "solve", "use", "implement", "execute", "calculate"],
    exampleQuestions: [
      "Calculate the area of a triangle with base 5cm and height 3cm.",
      "Apply the formula to solve this problem.",
      "Demonstrate how to balance this chemical equation.",
    ],
    appropriateQuestionTypes: ["SHORT_ANSWER", "MULTIPLE_CHOICE", "ORDERING", "FILL_IN_BLANK"],
    difficultyRange: { min: 3, max: 7 },
    typicalPoints: 3,
    estimatedTimeRange: { min: 45, max: 120 },
  },
  ANALYZE: {
    level: "ANALYZE",
    name: "Analyze",
    description: "Draw connections among ideas",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
    icon: "search",
    questionStarters: [
      "Why...",
      "What is the relationship...",
      "Compare and contrast...",
      "What evidence supports...",
      "How does X relate to Y...",
      "Examine...",
    ],
    verbsToUse: [
      "analyze",
      "compare",
      "contrast",
      "differentiate",
      "examine",
      "investigate",
      "categorize",
    ],
    exampleQuestions: [
      "Compare and contrast aerobic and anaerobic respiration.",
      "Analyze the factors that led to the event.",
      "What is the relationship between supply and demand?",
    ],
    appropriateQuestionTypes: ["ESSAY", "SHORT_ANSWER", "MATCHING"],
    difficultyRange: { min: 5, max: 8 },
    typicalPoints: 4,
    estimatedTimeRange: { min: 90, max: 180 },
  },
  EVALUATE: {
    level: "EVALUATE",
    name: "Evaluate",
    description: "Justify a decision or course of action",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    icon: "scale",
    questionStarters: [
      "Do you agree...",
      "What is your opinion...",
      "Evaluate...",
      "Assess...",
      "Judge the effectiveness...",
      "Defend your position...",
    ],
    verbsToUse: ["evaluate", "assess", "judge", "critique", "justify", "argue", "defend", "rate"],
    exampleQuestions: [
      "Evaluate the effectiveness of renewable energy sources.",
      "Do you agree with the author's conclusion? Justify your answer.",
      "Assess the impact of social media on modern communication.",
    ],
    appropriateQuestionTypes: ["ESSAY", "SHORT_ANSWER"],
    difficultyRange: { min: 6, max: 9 },
    typicalPoints: 5,
    estimatedTimeRange: { min: 120, max: 240 },
  },
  CREATE: {
    level: "CREATE",
    name: "Create",
    description: "Produce new or original work",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
    icon: "sparkles",
    questionStarters: [
      "Design...",
      "Create...",
      "Propose...",
      "Develop...",
      "Invent...",
      "Formulate a plan...",
    ],
    verbsToUse: [
      "create",
      "design",
      "develop",
      "formulate",
      "construct",
      "produce",
      "propose",
      "invent",
    ],
    exampleQuestions: [
      "Design an experiment to test plant growth under different light conditions.",
      "Create a solution for reducing plastic waste in your community.",
      "Propose a new business model for sustainable fashion.",
    ],
    appropriateQuestionTypes: ["ESSAY", "SHORT_ANSWER"],
    difficultyRange: { min: 7, max: 10 },
    typicalPoints: 6,
    estimatedTimeRange: { min: 180, max: 360 },
  },
};

export const DEFAULT_BLOOMS_DISTRIBUTION: BloomsDistribution = {
  REMEMBER: 10,
  UNDERSTAND: 20,
  APPLY: 30,
  ANALYZE: 20,
  EVALUATE: 15,
  CREATE: 5,
};

export const COGNITIVE_SKILL_OPTIONS = [
  { value: "CRITICAL_THINKING", label: "Critical Thinking" },
  { value: "PROBLEM_SOLVING", label: "Problem Solving" },
  { value: "CREATIVE_THINKING", label: "Creative Thinking" },
  { value: "ANALYTICAL_THINKING", label: "Analytical Thinking" },
  { value: "LOGICAL_REASONING", label: "Logical Reasoning" },
  { value: "METACOGNITION", label: "Metacognition" },
  { value: "INFORMATION_PROCESSING", label: "Information Processing" },
  { value: "DECISION_MAKING", label: "Decision Making" },
];

export const QUESTION_TYPE_INFO: Record<
  QuestionType,
  { label: string; description: string; icon: string }
> = {
  MULTIPLE_CHOICE: {
    label: "Multiple Choice",
    description: "Select one correct answer from options",
    icon: "list",
  },
  TRUE_FALSE: {
    label: "True/False",
    description: "Determine if statement is true or false",
    icon: "check-circle",
  },
  SHORT_ANSWER: {
    label: "Short Answer",
    description: "Brief text response (1-3 sentences)",
    icon: "edit-3",
  },
  ESSAY: {
    label: "Essay",
    description: "Extended written response",
    icon: "file-text",
  },
  FILL_IN_BLANK: {
    label: "Fill in the Blank",
    description: "Complete the missing word(s)",
    icon: "minus-square",
  },
  MATCHING: {
    label: "Matching",
    description: "Match items from two columns",
    icon: "link",
  },
  ORDERING: {
    label: "Ordering",
    description: "Arrange items in correct sequence",
    icon: "list-ordered",
  },
};
