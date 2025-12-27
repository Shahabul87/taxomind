/**
 * Common Types - Shared across multiple engines
 */

export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'ESSAY'
  | 'FILL_IN_BLANK'
  | 'MATCHING'
  | 'ORDERING';

export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type EvaluationType = 'AUTO_GRADED' | 'AI_EVALUATED' | 'TEACHER_GRADED' | 'PEER_REVIEWED';
