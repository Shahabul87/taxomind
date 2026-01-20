/**
 * Alignment Engine Types
 * Enhanced Depth Analysis - January 2026
 *
 * Types and interfaces for course alignment analysis:
 * - Objectives → Sections → Assessments mapping
 * - Coverage and redundancy scoring
 * - Gap identification and recommendations
 */

import type { BloomsLevel } from '@sam-ai/core';
import type { BloomsDistribution, WebbDOKLevel } from '../types/depth-analysis.types';

// ═══════════════════════════════════════════════════════════════
// ALIGNMENT TYPE ENUMS
// ═══════════════════════════════════════════════════════════════

export type AlignmentType = 'direct' | 'partial' | 'contextual';
export type AssessmentType = 'exam' | 'quiz' | 'assignment';
export type GapType =
  | 'objective_no_content'
  | 'objective_no_assessment'
  | 'blooms_mismatch'
  | 'dok_mismatch'
  | 'redundant_coverage';
export type GapSeverity = 'critical' | 'warning' | 'info';

// ═══════════════════════════════════════════════════════════════
// OBJECTIVE ALIGNMENT
// ═══════════════════════════════════════════════════════════════

export interface LinkedSection {
  sectionId: string;
  sectionTitle: string;
  alignmentScore: number; // 0-1 how well it aligns
  alignmentType: AlignmentType;
  evidence: string[]; // Matched keywords/phrases
}

export interface LinkedAssessment {
  assessmentId: string;
  assessmentType: AssessmentType;
  questionIds: string[];
  coverageScore: number;
  bloomsMatch: boolean;
  dokMatch: boolean;
}

export interface ObjectiveAlignment {
  objectiveId: string;
  objectiveText: string;
  bloomsLevel: BloomsLevel;
  dokLevel: WebbDOKLevel;

  /** Linked sections */
  linkedSections: LinkedSection[];

  /** Linked assessments */
  linkedAssessments: LinkedAssessment[];

  /** Coverage status */
  hasSectionCoverage: boolean;
  hasAssessmentCoverage: boolean;
  isFullyCovered: boolean;
  coverageGaps: string[];
}

// ═══════════════════════════════════════════════════════════════
// SECTION ALIGNMENT
// ═══════════════════════════════════════════════════════════════

export interface SectionAlignment {
  sectionId: string;
  sectionTitle: string;
  chapterId: string;

  /** Content analysis */
  bloomsDistribution: BloomsDistribution;
  primaryBloomsLevel: BloomsLevel;
  dokLevel: WebbDOKLevel;

  /** Objectives covered */
  coveredObjectives: string[];
  partialObjectives: string[];

  /** Assessment coverage */
  hasAssessment: boolean;
  assessmentIds: string[];
  assessmentBloomsMatch: boolean;
}

// ═══════════════════════════════════════════════════════════════
// ASSESSMENT ALIGNMENT
// ═══════════════════════════════════════════════════════════════

export interface QuestionAlignment {
  questionId: string;
  questionText: string;
  bloomsLevel: BloomsLevel;
  dokLevel: WebbDOKLevel;
  linkedObjectives: string[];
  alignmentConfidence: number;
}

export interface AssessmentAlignment {
  assessmentId: string;
  assessmentType: AssessmentType;
  sectionId: string;

  /** Question-level alignment */
  questionAlignments: QuestionAlignment[];

  /** Coverage metrics */
  objectivesCovered: string[];
  bloomsCoverage: BloomsDistribution;
  overallAlignmentScore: number;
}

// ═══════════════════════════════════════════════════════════════
// ALIGNMENT GAPS
// ═══════════════════════════════════════════════════════════════

export interface AlignmentGap {
  type: GapType;
  severity: GapSeverity;
  objectiveId?: string;
  sectionId?: string;
  assessmentId?: string;
  description: string;
  recommendation: string;
}

// ═══════════════════════════════════════════════════════════════
// ALIGNMENT ENGINE OPTIONS AND RESULTS
// ═══════════════════════════════════════════════════════════════

export interface AlignmentEngineOptions {
  /** Minimum score to consider alignment valid (0-1) */
  alignmentThreshold?: number;

  /** Include assessment alignment analysis */
  includeAssessments?: boolean;

  /** Include detailed evidence tracking */
  includeEvidence?: boolean;

  /** Maximum keywords to use for matching */
  maxKeywords?: number;

  /** Logger for debugging */
  logger?: AlignmentLogger;
}

export interface AlignmentLogger {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  debug?: (message: string, ...args: unknown[]) => void;
}

export interface AlignmentAnalysisResult {
  courseId: string;
  objectiveAlignments: ObjectiveAlignment[];
  sectionAlignments: SectionAlignment[];
  assessmentAlignments: AssessmentAlignment[];

  /** Scores */
  coverageScore: number; // 0-100
  redundancyScore: number; // 0-100 (lower is better)
  alignmentScore: number; // 0-100

  /** Gaps */
  gaps: AlignmentGap[];
  criticalGapCount: number;

  /** Summary */
  summary: AlignmentSummary;

  /** Metadata */
  analysisVersion: string;
  analyzedAt: Date;
}

export interface AlignmentSummary {
  totalObjectives: number;
  fullyCoveredObjectives: number;
  partialObjectives: number;
  uncoveredObjectives: number;
  assessmentCoverage: number;
}

// ═══════════════════════════════════════════════════════════════
// COURSE DATA FOR ALIGNMENT
// ═══════════════════════════════════════════════════════════════

export interface CourseObjective {
  id: string;
  text: string;
  bloomsLevel?: BloomsLevel;
  dokLevel?: WebbDOKLevel;
}

export interface CourseSection {
  id: string;
  title: string;
  chapterId: string;
  description?: string | null;
  extractedText?: string | null;
  bloomsDistribution?: BloomsDistribution | null;
  primaryBloomsLevel?: BloomsLevel | null;
  dokLevel?: WebbDOKLevel | null;
}

export interface CourseAssessment {
  id: string;
  type: AssessmentType;
  sectionId: string;
  title: string;
  questions: CourseQuestion[];
}

export interface CourseQuestion {
  id: string;
  text: string;
  type: string;
  bloomsLevel?: BloomsLevel;
  dokLevel?: WebbDOKLevel;
}

export interface CourseForAlignment {
  id: string;
  title: string;
  objectives: CourseObjective[];
  sections: CourseSection[];
  assessments: CourseAssessment[];
}

// ═══════════════════════════════════════════════════════════════
// ALIGNMENT MATRIX STORE INTERFACE
// ═══════════════════════════════════════════════════════════════

export interface AlignmentMatrixData {
  id: string;
  courseId: string;
  objectiveAlignments: ObjectiveAlignment[];
  sectionAlignments: SectionAlignment[];
  assessmentAlignments: AssessmentAlignment[];
  coverageScore: number;
  redundancyScore: number;
  alignmentScore: number;
  gaps: AlignmentGap[] | null;
  gapCount: number;
  criticalGapCount: number;
  totalObjectives: number;
  fullyCoveredObjectives: number;
  partialObjectives: number;
  uncoveredObjectives: number;
  analysisVersion: string;
  analyzedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlignmentMatrixCreateInput {
  courseId: string;
  objectiveAlignments: ObjectiveAlignment[];
  sectionAlignments: SectionAlignment[];
  assessmentAlignments: AssessmentAlignment[];
  coverageScore: number;
  redundancyScore: number;
  alignmentScore: number;
  gaps?: AlignmentGap[];
  gapCount: number;
  criticalGapCount: number;
  totalObjectives: number;
  fullyCoveredObjectives: number;
  partialObjectives: number;
  uncoveredObjectives: number;
  analysisVersion: string;
}

export interface AlignmentMatrixUpdateInput {
  objectiveAlignments?: ObjectiveAlignment[];
  sectionAlignments?: SectionAlignment[];
  assessmentAlignments?: AssessmentAlignment[];
  coverageScore?: number;
  redundancyScore?: number;
  alignmentScore?: number;
  gaps?: AlignmentGap[];
  gapCount?: number;
  criticalGapCount?: number;
  totalObjectives?: number;
  fullyCoveredObjectives?: number;
  partialObjectives?: number;
  uncoveredObjectives?: number;
  analysisVersion?: string;
  analyzedAt?: Date;
}

export interface AlignmentMatrixStore {
  /** Create a new alignment matrix record */
  create(input: AlignmentMatrixCreateInput): Promise<AlignmentMatrixData>;

  /** Update an existing alignment matrix */
  update(id: string, input: AlignmentMatrixUpdateInput): Promise<AlignmentMatrixData>;

  /** Upsert alignment matrix (create or update by courseId) */
  upsert(
    courseId: string,
    input: AlignmentMatrixCreateInput
  ): Promise<AlignmentMatrixData>;

  /** Get alignment matrix by ID */
  getById(id: string): Promise<AlignmentMatrixData | null>;

  /** Get alignment matrix by course ID */
  getByCourseId(courseId: string): Promise<AlignmentMatrixData | null>;

  /** Delete alignment matrix */
  delete(id: string): Promise<void>;

  /** Delete alignment matrix by course ID */
  deleteByCourseId(courseId: string): Promise<void>;
}

// ═══════════════════════════════════════════════════════════════
// TEXT MATCHING UTILITIES
// ═══════════════════════════════════════════════════════════════

export interface TextMatchResult {
  score: number;
  matchedKeywords: string[];
  matchedPhrases: string[];
}

export interface KeywordExtraction {
  keywords: string[];
  phrases: string[];
  bloomsIndicators: string[];
  dokIndicators: string[];
}
