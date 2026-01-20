/**
 * Evidence Module Exports
 * Enhanced Depth Analysis - January 2026
 *
 * Exports for confidence and evidence tracking:
 * - Evidence Service
 * - Confidence Calculator
 * - Keyword Analyzer
 * - Prisma store adapter
 */

// ═══════════════════════════════════════════════════════════════
// EVIDENCE SERVICE
// ═══════════════════════════════════════════════════════════════

export {
  EvidenceService,
  ConfidenceCalculator,
  KeywordAnalyzer,
  createEvidenceService,
  createConfidenceCalculator,
  createKeywordAnalyzer,
  EVIDENCE_SERVICE_VERSION,
} from './evidence-service';

// ═══════════════════════════════════════════════════════════════
// PRISMA STORE
// ═══════════════════════════════════════════════════════════════

export {
  PrismaAnalysisEvidenceStore,
  createPrismaAnalysisEvidenceStore,
} from './prisma-evidence-store';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type {
  // Source types
  EvidenceSourceType,
  ContentContext,

  // Text position
  TextPosition,

  // Confidence
  ConfidenceBreakdown,
  KeywordMatch,

  // Sentence-level analysis
  SentenceLevelEvidence,
  SentenceAnalysis,

  // Evidence
  AnalysisEvidenceInput,
  AnalysisEvidenceData,

  // Service interfaces
  EvidenceServiceOptions,
  EvidenceLogger,
  EvidenceQuery,
  EvidenceSummary,

  // Store interface
  AnalysisEvidenceStore,

  // Confidence calculator
  ConfidenceCalculatorOptions,
  ConfidenceCalculationResult,

  // Keyword analysis
  KeywordWeight,
  KeywordAnalysisResult,

  // Aggregation
  AggregatedEvidence,
  EvidenceAggregationResult,
  EvidenceConflict,
} from './types';
