/**
 * Alignment Module Exports
 * Enhanced Depth Analysis - January 2026
 *
 * Exports for course alignment analysis:
 * - Alignment Engine
 * - Types and interfaces
 * - Prisma store adapter
 */

// ═══════════════════════════════════════════════════════════════
// ALIGNMENT ENGINE
// ═══════════════════════════════════════════════════════════════

export { AlignmentEngine, createAlignmentEngine } from './alignment-engine';

// ═══════════════════════════════════════════════════════════════
// PRISMA STORE
// ═══════════════════════════════════════════════════════════════

export {
  PrismaAlignmentMatrixStore,
  createPrismaAlignmentMatrixStore,
} from './prisma-alignment-store';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type {
  // Enums
  AlignmentType,
  AssessmentType,
  GapType,
  GapSeverity,

  // Objective Alignment
  LinkedSection,
  LinkedAssessment,
  ObjectiveAlignment,

  // Section Alignment
  SectionAlignment,

  // Assessment Alignment
  QuestionAlignment,
  AssessmentAlignment,

  // Gaps
  AlignmentGap,

  // Engine Options and Results
  AlignmentEngineOptions,
  AlignmentLogger,
  AlignmentAnalysisResult,
  AlignmentSummary,

  // Course Data for Alignment
  CourseObjective,
  CourseSection,
  CourseAssessment,
  CourseQuestion,
  CourseForAlignment,

  // Store Interface
  AlignmentMatrixData,
  AlignmentMatrixCreateInput,
  AlignmentMatrixUpdateInput,
  AlignmentMatrixStore,

  // Utilities
  TextMatchResult,
  KeywordExtraction,
} from './types';
