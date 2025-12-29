/**
 * @sam-ai/educational - Practice Problems Engine Types
 * Types for generating adaptive practice problems and exercises
 */

import type { BloomsLevel } from '@sam-ai/core';

/**
 * Types of practice problems
 */
export type PracticeProblemType =
  | 'multiple_choice'
  | 'short_answer'
  | 'coding'
  | 'essay'
  | 'fill_blank'
  | 'matching'
  | 'ordering'
  | 'diagram'
  | 'calculation'
  | 'case_study';

/**
 * Difficulty levels for practice problems
 */
export type ProblemDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/**
 * Hint types for guided practice
 */
export type HintType = 'conceptual' | 'procedural' | 'example' | 'partial_solution' | 'resource_link';

/**
 * Configuration for practice problem generation
 */
export interface PracticeProblemConfig {
  /** AI adapter for generation */
  aiAdapter?: {
    chat(params: { messages: { role: string; content: string }[] }): Promise<{ content: string }>;
  };
  /** Database adapter for storing problems */
  database?: PracticeProblemDatabaseAdapter;
  /** Maximum number of hints per problem */
  maxHintsPerProblem?: number;
  /** Enable adaptive difficulty */
  adaptiveDifficulty?: boolean;
  /** Enable spaced repetition */
  spacedRepetition?: boolean;
  /** Time limit defaults in minutes */
  defaultTimeLimit?: number;
}

/**
 * Input for generating practice problems
 */
export interface PracticeProblemInput {
  /** Topic or concept to practice */
  topic: string;
  /** Bloom's taxonomy level */
  bloomsLevel?: BloomsLevel;
  /** Difficulty level */
  difficulty?: ProblemDifficulty;
  /** Types of problems to generate */
  problemTypes?: PracticeProblemType[];
  /** Number of problems to generate */
  count?: number;
  /** User's current skill level (0-100) */
  userSkillLevel?: number;
  /** Previous problem IDs to avoid repetition */
  excludeProblemIds?: string[];
  /** Course context */
  courseId?: string;
  /** Section context */
  sectionId?: string;
  /** Learning objectives to align with */
  learningObjectives?: string[];
  /** Time limit for the problem set in minutes */
  timeLimit?: number;
}

/**
 * A single hint for a practice problem
 */
export interface ProblemHint {
  /** Hint ID */
  id: string;
  /** Type of hint */
  type: HintType;
  /** Hint content */
  content: string;
  /** Order in which to reveal */
  order: number;
  /** Points deducted for using this hint */
  penaltyPoints?: number;
}

/**
 * Answer option for multiple choice problems
 */
export interface ProblemOption {
  /** Option ID */
  id: string;
  /** Option text */
  text: string;
  /** Whether this is the correct answer */
  isCorrect: boolean;
  /** Explanation for why this is correct/incorrect */
  explanation?: string;
}

/**
 * Test case for coding problems
 */
export interface CodeTestCase {
  /** Test case ID */
  id: string;
  /** Input values */
  input: string;
  /** Expected output */
  expectedOutput: string;
  /** Whether this test is visible to the student */
  isVisible: boolean;
  /** Description of what this test checks */
  description?: string;
}

/**
 * Solution step for worked examples
 */
export interface SolutionStep {
  /** Step number */
  step: number;
  /** Step description */
  description: string;
  /** Detailed explanation */
  explanation: string;
  /** Code or formula if applicable */
  code?: string;
}

/**
 * A generated practice problem
 */
export interface PracticeProblem {
  /** Unique problem ID */
  id: string;
  /** Problem type */
  type: PracticeProblemType;
  /** Problem title */
  title: string;
  /** Problem statement */
  statement: string;
  /** Difficulty level */
  difficulty: ProblemDifficulty;
  /** Bloom's taxonomy level */
  bloomsLevel: BloomsLevel;
  /** Points value */
  points: number;
  /** Time limit in minutes */
  timeLimit?: number;
  /** Options for multiple choice */
  options?: ProblemOption[];
  /** Correct answer (for non-MCQ) */
  correctAnswer?: string;
  /** Test cases for coding problems */
  testCases?: CodeTestCase[];
  /** Starter code for coding problems */
  starterCode?: string;
  /** Hints for guided practice */
  hints: ProblemHint[];
  /** Worked solution steps */
  solution?: SolutionStep[];
  /** Detailed explanation of the solution */
  solutionExplanation: string;
  /** Related concepts */
  relatedConcepts: string[];
  /** Prerequisite skills */
  prerequisites: string[];
  /** Tags for categorization */
  tags: string[];
  /** Learning objectives this problem addresses */
  learningObjectives: string[];
  /** Created timestamp */
  createdAt: Date;
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Result of a practice problem attempt
 */
export interface ProblemAttempt {
  /** Attempt ID */
  id: string;
  /** Problem ID */
  problemId: string;
  /** User ID */
  userId: string;
  /** User's answer */
  userAnswer: string;
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** Partial credit score (0-1) */
  partialCredit: number;
  /** Points earned */
  pointsEarned: number;
  /** Hints used */
  hintsUsed: string[];
  /** Time spent in seconds */
  timeSpent: number;
  /** Attempt timestamp */
  attemptedAt: Date;
  /** Feedback provided */
  feedback?: string;
}

/**
 * Evaluation of a problem attempt
 */
export interface ProblemEvaluation {
  /** Whether the answer is correct */
  isCorrect: boolean;
  /** Partial credit score (0-1) */
  partialCredit: number;
  /** Points earned */
  pointsEarned: number;
  /** Detailed feedback */
  feedback: string;
  /** Specific errors identified */
  errors: string[];
  /** Suggestions for improvement */
  suggestions: string[];
  /** Related concepts to review */
  conceptsToReview: string[];
  /** Next recommended problem difficulty */
  nextDifficulty?: ProblemDifficulty;
  /** Next recommended Bloom's level */
  nextBloomsLevel?: BloomsLevel;
}

/**
 * Practice session statistics
 */
export interface PracticeSessionStats {
  /** Total problems attempted */
  totalAttempts: number;
  /** Correct answers */
  correctAnswers: number;
  /** Average score */
  averageScore: number;
  /** Total points earned */
  totalPoints: number;
  /** Total time spent in minutes */
  totalTime: number;
  /** Hints used count */
  hintsUsed: number;
  /** Performance by difficulty */
  byDifficulty: Record<ProblemDifficulty, { attempts: number; correct: number }>;
  /** Performance by Bloom's level */
  byBloomsLevel: Record<BloomsLevel, { attempts: number; correct: number }>;
  /** Performance by problem type */
  byProblemType: Record<PracticeProblemType, { attempts: number; correct: number }>;
  /** Concepts mastered */
  masteredConcepts: string[];
  /** Concepts needing review */
  conceptsNeedingReview: string[];
  /** Current streak */
  currentStreak: number;
  /** Best streak */
  bestStreak: number;
}

/**
 * Adaptive difficulty recommendation
 */
export interface DifficultyRecommendation {
  /** Recommended difficulty */
  recommended: ProblemDifficulty;
  /** Recommended Bloom's level */
  bloomsLevel: BloomsLevel;
  /** Confidence score (0-1) */
  confidence: number;
  /** Reasoning for recommendation */
  reasoning: string;
  /** Performance trend */
  trend: 'improving' | 'stable' | 'declining';
}

/**
 * Spaced repetition schedule
 */
export interface SpacedRepetitionSchedule {
  /** Problem ID */
  problemId: string;
  /** Next review date */
  nextReviewDate: Date;
  /** Current interval in days */
  intervalDays: number;
  /** Ease factor */
  easeFactor: number;
  /** Review count */
  reviewCount: number;
  /** Last review performance (0-5 scale) */
  lastPerformance: number;
}

/**
 * Output from practice problem generation
 */
export interface PracticeProblemOutput {
  /** Generated problems */
  problems: PracticeProblem[];
  /** Total count */
  totalCount: number;
  /** Estimated time to complete */
  estimatedTime: number;
  /** Difficulty distribution */
  difficultyDistribution: Record<ProblemDifficulty, number>;
  /** Bloom's level distribution */
  bloomsDistribution: Record<BloomsLevel, number>;
  /** Covered learning objectives */
  coveredObjectives: string[];
  /** Generation metadata */
  metadata: {
    generatedAt: Date;
    topic: string;
    model?: string;
  };
}

/**
 * Database adapter for practice problems
 */
export interface PracticeProblemDatabaseAdapter {
  /** Get problems for a topic */
  getProblems(
    topic: string,
    options?: {
      difficulty?: ProblemDifficulty;
      bloomsLevel?: BloomsLevel;
      limit?: number;
    }
  ): Promise<PracticeProblem[]>;

  /** Save a generated problem */
  saveProblem(problem: PracticeProblem): Promise<string>;

  /** Save multiple problems */
  saveProblems(problems: PracticeProblem[]): Promise<string[]>;

  /** Get user attempts for a problem */
  getAttempts(userId: string, problemId: string): Promise<ProblemAttempt[]>;

  /** Save an attempt */
  saveAttempt(attempt: Omit<ProblemAttempt, 'id'>): Promise<string>;

  /** Get user session stats */
  getSessionStats(userId: string, sessionId?: string): Promise<PracticeSessionStats>;

  /** Get spaced repetition schedule */
  getRepetitionSchedule(userId: string): Promise<SpacedRepetitionSchedule[]>;

  /** Update spaced repetition schedule */
  updateRepetitionSchedule(
    userId: string,
    problemId: string,
    schedule: Partial<SpacedRepetitionSchedule>
  ): Promise<void>;
}

/**
 * Practice Problems Engine interface
 */
export interface PracticeProblemsEngine {
  /** Generate practice problems */
  generateProblems(input: PracticeProblemInput): Promise<PracticeProblemOutput>;

  /** Evaluate a problem attempt */
  evaluateAttempt(
    problem: PracticeProblem,
    userAnswer: string,
    options?: { partialCredit?: boolean }
  ): Promise<ProblemEvaluation>;

  /** Get next hint for a problem */
  getNextHint(problem: PracticeProblem, hintsUsed: string[]): ProblemHint | null;

  /** Get adaptive difficulty recommendation */
  getAdaptiveDifficulty(userId: string, topic: string): Promise<DifficultyRecommendation>;

  /** Update spaced repetition based on attempt */
  updateSpacedRepetition(
    userId: string,
    problemId: string,
    performance: number
  ): Promise<SpacedRepetitionSchedule>;

  /** Get problems due for review */
  getProblemsForReview(userId: string, limit?: number): Promise<PracticeProblem[]>;

  /** Get session statistics */
  getSessionStats(userId: string, sessionId?: string): Promise<PracticeSessionStats>;
}
