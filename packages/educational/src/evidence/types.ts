/**
 * Evidence Tracking Types
 * Enhanced Depth Analysis - January 2026
 *
 * Types and interfaces for confidence and evidence tracking:
 * - Sentence-level analysis evidence
 * - Confidence scoring breakdowns
 * - Text position tracking for UI highlighting
 */

import type { BloomsLevel } from '@sam-ai/core';
import type { WebbDOKLevel } from '../types/depth-analysis.types';

// ═══════════════════════════════════════════════════════════════
// EVIDENCE SOURCE TYPES
// ═══════════════════════════════════════════════════════════════

export type EvidenceSourceType =
  | 'section_content'
  | 'objective'
  | 'assessment'
  | 'transcript'
  | 'attachment'
  | 'quiz_question'
  | 'assignment';

export type ContentContext =
  | 'instructional'
  | 'assessment'
  | 'activity'
  | 'discussion'
  | 'reflection'
  | 'project'
  | 'example'
  | 'definition';

// ═══════════════════════════════════════════════════════════════
// TEXT POSITION TRACKING
// ═══════════════════════════════════════════════════════════════

export interface TextPosition {
  /** Start character index in the source text */
  start: number;
  /** End character index in the source text */
  end: number;
  /** Paragraph index (0-based) */
  paragraphIndex: number;
  /** Sentence index within paragraph (0-based) */
  sentenceIndex?: number;
}

// ═══════════════════════════════════════════════════════════════
// CONFIDENCE BREAKDOWN
// ═══════════════════════════════════════════════════════════════

export interface ConfidenceBreakdown {
  /** Score from keyword matching (0-1) */
  keywordScore: number;
  /** Score from context analysis (0-1) */
  contextScore: number;
  /** Score from position analysis (0-1) */
  positionScore: number;
  /** Additional factors */
  factors?: Record<string, number>;
}

export interface KeywordMatch {
  /** The keyword that matched */
  keyword: string;
  /** Weight assigned to this keyword */
  weight: number;
  /** Which Bloom's level this keyword indicates */
  bloomsLevel: BloomsLevel;
  /** Position in the text where it was found */
  position?: number;
}

// ═══════════════════════════════════════════════════════════════
// SENTENCE-LEVEL ANALYSIS
// ═══════════════════════════════════════════════════════════════

export interface SentenceLevelEvidence {
  /** The matched keywords in this sentence */
  matchedKeywords: KeywordMatch[];
  /** Keyword weights used */
  keywordWeights: Record<string, number>;
  /** Context multiplier applied */
  contextMultiplier: number;
  /** Position multiplier applied */
  positionMultiplier: number;
  /** Detailed confidence breakdown */
  confidenceBreakdown: ConfidenceBreakdown;
}

export interface SentenceAnalysis {
  /** The sentence text */
  sentence: string;
  /** Predicted Bloom's level */
  predictedBloomsLevel: BloomsLevel;
  /** Predicted DOK level */
  predictedDOKLevel: WebbDOKLevel;
  /** Overall confidence (0-1) */
  confidence: number;
  /** Patterns that triggered this classification */
  triggerPatterns: string[];
  /** Content context */
  context: ContentContext;
  /** Position in document */
  position: 'beginning' | 'middle' | 'end';
  /** Detailed evidence */
  evidence: SentenceLevelEvidence;
  /** Text position for highlighting */
  textPosition: TextPosition;
}

// ═══════════════════════════════════════════════════════════════
// ANALYSIS EVIDENCE
// ═══════════════════════════════════════════════════════════════

export interface AnalysisEvidenceInput {
  /** Source type (section_content, objective, assessment, etc.) */
  sourceType: EvidenceSourceType;
  /** The specific source ID (sectionId, questionId, etc.) */
  sourceId: string;
  /** The determined classification level */
  classification: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Patterns that triggered this classification */
  triggerPatterns: string[];
  /** The highlighted text that triggered classification */
  highlightedText?: string;
  /** Position in source text */
  textPosition?: TextPosition;
  /** Content context */
  context?: ContentContext;
}

export interface AnalysisEvidenceData {
  id: string;
  analysisId: string;
  sourceType: string;
  sourceId: string;
  classification: string;
  confidence: number;
  triggerPatterns: string[];
  highlightedText: string | null;
  textPosition: TextPosition | null;
  context: string | null;
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════════
// EVIDENCE SERVICE INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface EvidenceServiceOptions {
  /** Storage adapter */
  store: AnalysisEvidenceStore;
  /** Logger for debugging */
  logger?: EvidenceLogger;
}

export interface EvidenceLogger {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  debug?: (message: string, ...args: unknown[]) => void;
}

export interface EvidenceQuery {
  analysisId?: string;
  sourceType?: EvidenceSourceType;
  sourceId?: string;
  classification?: string;
  minConfidence?: number;
  limit?: number;
}

export interface EvidenceSummary {
  totalEvidence: number;
  byClassification: Record<string, number>;
  bySourceType: Record<EvidenceSourceType, number>;
  averageConfidence: number;
  highConfidenceCount: number; // confidence >= 0.8
  lowConfidenceCount: number;  // confidence < 0.5
}

// ═══════════════════════════════════════════════════════════════
// EVIDENCE STORE INTERFACE
// ═══════════════════════════════════════════════════════════════

export interface AnalysisEvidenceStore {
  /**
   * Store multiple evidence records for an analysis
   */
  storeEvidence(
    analysisId: string,
    evidence: AnalysisEvidenceInput[]
  ): Promise<AnalysisEvidenceData[]>;

  /**
   * Get all evidence for an analysis
   */
  getEvidenceForAnalysis(analysisId: string): Promise<AnalysisEvidenceData[]>;

  /**
   * Get evidence by classification (e.g., all REMEMBER evidence)
   */
  getEvidenceByClassification(
    analysisId: string,
    classification: string
  ): Promise<AnalysisEvidenceData[]>;

  /**
   * Get evidence for a specific source
   */
  getEvidenceForSource(
    sourceType: EvidenceSourceType,
    sourceId: string
  ): Promise<AnalysisEvidenceData[]>;

  /**
   * Query evidence with filters
   */
  queryEvidence(query: EvidenceQuery): Promise<AnalysisEvidenceData[]>;

  /**
   * Get evidence summary for an analysis
   */
  getSummary(analysisId: string): Promise<EvidenceSummary>;

  /**
   * Delete evidence for an analysis
   */
  deleteEvidenceForAnalysis(analysisId: string): Promise<number>;

  /**
   * Get evidence by ID
   */
  getById(id: string): Promise<AnalysisEvidenceData | null>;
}

// ═══════════════════════════════════════════════════════════════
// CONFIDENCE CALCULATOR TYPES
// ═══════════════════════════════════════════════════════════════

export interface ConfidenceCalculatorOptions {
  /** Base weight for keyword matches */
  keywordBaseWeight?: number;
  /** Multiplier for context (0-1) */
  contextWeight?: number;
  /** Multiplier for position (0-1) */
  positionWeight?: number;
  /** Minimum confidence threshold */
  minConfidence?: number;
  /** Maximum confidence cap */
  maxConfidence?: number;
}

export interface ConfidenceCalculationResult {
  /** Final confidence score (0-1) */
  confidence: number;
  /** Detailed breakdown */
  breakdown: ConfidenceBreakdown;
  /** Factors that contributed */
  contributingFactors: string[];
  /** Factors that reduced confidence */
  reducingFactors: string[];
}

// ═══════════════════════════════════════════════════════════════
// KEYWORD ANALYSIS TYPES
// ═══════════════════════════════════════════════════════════════

export interface KeywordWeight {
  keyword: string;
  bloomsLevel: BloomsLevel;
  weight: number;
  isVerb: boolean;
  isNoun: boolean;
  isPrimary: boolean; // Primary indicator for this level
}

export interface KeywordAnalysisResult {
  /** All matched keywords */
  matches: KeywordMatch[];
  /** Primary Bloom's level based on keywords */
  primaryBloomsLevel: BloomsLevel;
  /** Secondary levels detected */
  secondaryLevels: BloomsLevel[];
  /** Overall keyword confidence */
  keywordConfidence: number;
  /** DOK level inferred from Bloom's */
  inferredDOKLevel: WebbDOKLevel;
}

// ═══════════════════════════════════════════════════════════════
// EVIDENCE AGGREGATION
// ═══════════════════════════════════════════════════════════════

export interface AggregatedEvidence {
  /** Classification level */
  classification: string;
  /** Number of evidence items */
  count: number;
  /** Average confidence */
  averageConfidence: number;
  /** Highest confidence evidence */
  topEvidence: AnalysisEvidenceData[];
  /** Most common trigger patterns */
  commonPatterns: Array<{ pattern: string; count: number }>;
  /** Sources contributing to this classification */
  sources: Array<{ sourceType: EvidenceSourceType; sourceId: string; confidence: number }>;
}

export interface EvidenceAggregationResult {
  /** Aggregated evidence by classification */
  byClassification: Record<string, AggregatedEvidence>;
  /** Overall confidence in the analysis */
  overallConfidence: number;
  /** Conflicting evidence detected */
  conflicts: EvidenceConflict[];
}

export interface EvidenceConflict {
  /** Evidence items that conflict */
  evidenceIds: string[];
  /** Description of the conflict */
  description: string;
  /** Severity of conflict */
  severity: 'minor' | 'moderate' | 'major';
  /** Suggested resolution */
  resolution?: string;
}
