/**
 * LLM Response Parsers
 * Enhanced Depth Analysis - January 2026
 *
 * Parse and validate LLM responses into typed objects.
 */

import type { BloomsLevel } from '@sam-ai/core';
import type { WebbDOKLevel, BloomsDistribution, WebbDOKDistribution } from '../types/depth-analysis.types';
import type {
  BloomsClassificationResult,
  BloomsEvidence,
  BloomsAlternative,
  DOKClassificationResult,
  DOKEvidence,
  DOKAlternative,
  MultiFrameworkClassificationResult,
  FrameworkClassificationDetail,
  KeywordExtractionResult,
  ExtractedKeywordGroup,
  AlignmentAnalysisResult,
  ObjectiveAlignmentDetail,
  AssessmentAlignmentDetail,
  AlignmentGapDetail,
  AlignmentSummaryStats,
  RecommendationResult,
  GeneratedRecommendation,
} from './types';

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Extract JSON from LLM response (handles markdown code blocks)
 */
function extractJson(response: string): string {
  // Try to extract from markdown code block
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }

  // Try to find JSON object/array directly
  const jsonObjectMatch = response.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    return jsonObjectMatch[0];
  }

  return response.trim();
}

/**
 * Safe JSON parse with fallback
 */
function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    const json = extractJson(text);
    return JSON.parse(json) as T;
  } catch {
    console.warn('Failed to parse LLM response as JSON:', text.substring(0, 200));
    return fallback;
  }
}

/**
 * Clamp number to range
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Normalize distribution to sum to 1
 */
function normalizeDistribution(dist: Record<string, number>): Record<string, number> {
  const sum = Object.values(dist).reduce((a, b) => a + b, 0);
  if (sum === 0) return dist;

  const normalized: Record<string, number> = {};
  for (const [key, value] of Object.entries(dist)) {
    normalized[key] = value / sum;
  }
  return normalized;
}

// ═══════════════════════════════════════════════════════════════
// BLOOM'S PARSER
// ═══════════════════════════════════════════════════════════════

interface RawBloomsResponse {
  level?: string;
  confidence?: number;
  distribution?: Record<string, number>;
  evidence?: Array<{
    text?: string;
    keywords?: string[];
    supportsLevel?: string;
    weight?: number;
  }>;
  alternatives?: Array<{
    level?: string;
    confidence?: number;
    reason?: string;
  }>;
}

const VALID_BLOOMS_LEVELS: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];

// Map from lowercase/variations to canonical level
const BLOOMS_LEVEL_MAP: Record<string, BloomsLevel> = {
  remember: 'REMEMBER',
  understand: 'UNDERSTAND',
  apply: 'APPLY',
  analyze: 'ANALYZE',
  evaluate: 'EVALUATE',
  create: 'CREATE',
  knowledge: 'REMEMBER',
  comprehension: 'UNDERSTAND',
  application: 'APPLY',
  analysis: 'ANALYZE',
  synthesis: 'CREATE',
  evaluation: 'EVALUATE',
};

const DEFAULT_BLOOMS_DISTRIBUTION: BloomsDistribution = {
  REMEMBER: 0,
  UNDERSTAND: 0,
  APPLY: 0,
  ANALYZE: 0,
  EVALUATE: 0,
  CREATE: 0,
};

/**
 * Parse Bloom's classification response
 */
export function parseBloomsResult(
  response: string,
  model: string,
  processingTimeMs: number
): BloomsClassificationResult {
  const raw = safeJsonParse<RawBloomsResponse>(response, {});

  // Parse level
  const level = parseBloomsLevel(raw.level);

  // Parse confidence
  const confidence = clamp(raw.confidence ?? 0.8, 0, 1);

  // Parse distribution
  const distribution = parseBloomsDistribution(raw.distribution, level);

  // Parse evidence
  const evidence = parseBloomsEvidence(raw.evidence);

  // Parse alternatives
  const alternatives = parseBloomsAlternatives(raw.alternatives);

  return {
    level,
    confidence,
    distribution,
    evidence,
    alternatives,
    model,
    processingTimeMs,
  };
}

function parseBloomsLevel(level?: string): BloomsLevel {
  if (!level) return 'UNDERSTAND';
  const normalized = level.toLowerCase().trim();

  // Direct uppercase match
  if (VALID_BLOOMS_LEVELS.includes(level.toUpperCase() as BloomsLevel)) {
    return level.toUpperCase() as BloomsLevel;
  }

  // Lookup in map
  if (BLOOMS_LEVEL_MAP[normalized]) {
    return BLOOMS_LEVEL_MAP[normalized];
  }

  return 'UNDERSTAND';
}

function parseBloomsDistribution(
  dist?: Record<string, number>,
  primaryLevel?: BloomsLevel
): BloomsDistribution {
  const result = { ...DEFAULT_BLOOMS_DISTRIBUTION };

  if (dist) {
    for (const [key, value] of Object.entries(dist)) {
      const level = parseBloomsLevel(key);
      if (VALID_BLOOMS_LEVELS.includes(level)) {
        result[level] = clamp(value, 0, 1);
      }
    }
  }

  // If no distribution provided, use primary level
  const sum = Object.values(result).reduce((a, b) => a + b, 0);
  if (sum === 0 && primaryLevel) {
    result[primaryLevel] = 1;
  }

  return normalizeDistribution(result) as BloomsDistribution;
}

function parseBloomsEvidence(evidence?: RawBloomsResponse['evidence']): BloomsEvidence[] {
  if (!evidence || !Array.isArray(evidence)) return [];

  return evidence
    .filter(e => e.text)
    .map(e => ({
      text: e.text ?? '',
      keywords: e.keywords ?? [],
      supportsLevel: parseBloomsLevel(e.supportsLevel),
      weight: clamp(e.weight ?? 0.5, 0, 1),
    }));
}

function parseBloomsAlternatives(alternatives?: RawBloomsResponse['alternatives']): BloomsAlternative[] {
  if (!alternatives || !Array.isArray(alternatives)) return [];

  return alternatives
    .filter(a => a.level)
    .map(a => ({
      level: parseBloomsLevel(a.level),
      confidence: clamp(a.confidence ?? 0.5, 0, 1),
      reason: a.reason ?? '',
    }));
}

// ═══════════════════════════════════════════════════════════════
// DOK PARSER
// ═══════════════════════════════════════════════════════════════

interface RawDOKResponse {
  level?: string | number;
  confidence?: number;
  distribution?: Record<string, number>;
  evidence?: Array<{
    text?: string;
    indicators?: string[];
    supportsLevel?: string | number;
    weight?: number;
  }>;
  alternatives?: Array<{
    level?: string | number;
    confidence?: number;
    reason?: string;
  }>;
}

const VALID_DOK_LEVELS: WebbDOKLevel[] = [1, 2, 3, 4];

// Map from names to numeric levels
const DOK_LEVEL_MAP: Record<string, WebbDOKLevel> = {
  recall: 1,
  level1: 1,
  '1': 1,
  skills_concepts: 2,
  skill_concept: 2,
  level2: 2,
  '2': 2,
  strategic_thinking: 3,
  strategic: 3,
  level3: 3,
  '3': 3,
  extended_thinking: 4,
  extended: 4,
  level4: 4,
  '4': 4,
};

const DEFAULT_DOK_DISTRIBUTION: WebbDOKDistribution = {
  level1: 0,
  level2: 0,
  level3: 0,
  level4: 0,
};

/**
 * Parse DOK classification response
 */
export function parseDOKResult(
  response: string,
  model: string,
  processingTimeMs: number
): DOKClassificationResult {
  const raw = safeJsonParse<RawDOKResponse>(response, {});

  const level = parseDOKLevel(raw.level);
  const confidence = clamp(raw.confidence ?? 0.8, 0, 1);
  const distribution = parseDOKDistribution(raw.distribution, level);
  const evidence = parseDOKEvidence(raw.evidence);
  const alternatives = parseDOKAlternatives(raw.alternatives);

  return {
    level,
    confidence,
    distribution,
    evidence,
    alternatives,
    model,
    processingTimeMs,
  };
}

function parseDOKLevel(level?: string | number): WebbDOKLevel {
  if (level === undefined || level === null) return 2;

  // Direct numeric match
  if (typeof level === 'number' && VALID_DOK_LEVELS.includes(level as WebbDOKLevel)) {
    return level as WebbDOKLevel;
  }

  // String to number
  const normalized = String(level).toLowerCase().trim().replace(/\s+/g, '_');

  if (DOK_LEVEL_MAP[normalized] !== undefined) {
    return DOK_LEVEL_MAP[normalized];
  }

  // Partial matching
  if (normalized.includes('recall')) return 1;
  if (normalized.includes('skill') || normalized.includes('concept')) return 2;
  if (normalized.includes('strategic')) return 3;
  if (normalized.includes('extended')) return 4;

  return 2;
}

function parseDOKDistribution(
  dist?: Record<string, number>,
  primaryLevel?: WebbDOKLevel
): WebbDOKDistribution {
  const result = { ...DEFAULT_DOK_DISTRIBUTION };

  if (dist) {
    for (const [key, value] of Object.entries(dist)) {
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');

      // Map to level1-4 keys
      if (normalizedKey === 'recall' || normalizedKey === 'level1' || normalizedKey === '1') {
        result.level1 = clamp(value, 0, 1);
      } else if (normalizedKey === 'skills_concepts' || normalizedKey === 'level2' || normalizedKey === '2') {
        result.level2 = clamp(value, 0, 1);
      } else if (normalizedKey === 'strategic_thinking' || normalizedKey === 'level3' || normalizedKey === '3') {
        result.level3 = clamp(value, 0, 1);
      } else if (normalizedKey === 'extended_thinking' || normalizedKey === 'level4' || normalizedKey === '4') {
        result.level4 = clamp(value, 0, 1);
      }
    }
  }

  const sum = Object.values(result).reduce((a, b) => a + b, 0);
  if (sum === 0 && primaryLevel) {
    result[`level${primaryLevel}` as keyof WebbDOKDistribution] = 1;
  }

  return normalizeDistribution(result) as unknown as WebbDOKDistribution;
}

function parseDOKEvidence(evidence?: RawDOKResponse['evidence']): DOKEvidence[] {
  if (!evidence || !Array.isArray(evidence)) return [];

  return evidence
    .filter(e => e.text)
    .map(e => ({
      text: e.text ?? '',
      indicators: e.indicators ?? [],
      supportsLevel: parseDOKLevel(e.supportsLevel),
      weight: clamp(e.weight ?? 0.5, 0, 1),
    }));
}

function parseDOKAlternatives(alternatives?: RawDOKResponse['alternatives']): DOKAlternative[] {
  if (!alternatives || !Array.isArray(alternatives)) return [];

  return alternatives
    .filter(a => a.level !== undefined)
    .map(a => ({
      level: parseDOKLevel(a.level),
      confidence: clamp(a.confidence ?? 0.5, 0, 1),
      reason: a.reason ?? '',
    }));
}

// ═══════════════════════════════════════════════════════════════
// MULTI-FRAMEWORK PARSER
// ═══════════════════════════════════════════════════════════════

interface RawMultiFrameworkResponse {
  frameworks?: Array<{
    framework?: string;
    level?: string;
    confidence?: number;
    distribution?: Record<string, number>;
    evidence?: Array<{
      text?: string;
      indicators?: string[];
      level?: string;
      weight?: number;
    }>;
  }>;
  crossFrameworkAlignment?: number;
  compositeScore?: number;
}

/**
 * Parse multi-framework classification response
 */
export function parseMultiFrameworkResult(
  response: string,
  model: string,
  processingTimeMs: number
): MultiFrameworkClassificationResult {
  const raw = safeJsonParse<RawMultiFrameworkResponse>(response, {});

  const frameworks = parseFrameworkDetails(raw.frameworks);
  const crossFrameworkAlignment = clamp(raw.crossFrameworkAlignment ?? 0.8, 0, 1);
  const compositeScore = clamp(raw.compositeScore ?? 0.5, 0, 1);

  return {
    frameworks,
    crossFrameworkAlignment,
    compositeScore,
    model,
    processingTimeMs,
  };
}

function parseFrameworkDetails(
  frameworks?: RawMultiFrameworkResponse['frameworks']
): FrameworkClassificationDetail[] {
  if (!frameworks || !Array.isArray(frameworks)) return [];

  return frameworks
    .filter(f => f.framework)
    .map(f => ({
      framework: f.framework as FrameworkClassificationDetail['framework'],
      level: f.level ?? 'unknown',
      confidence: clamp(f.confidence ?? 0.8, 0, 1),
      distribution: f.distribution ?? {},
      evidence: f.evidence?.map(e => ({
        text: e.text ?? '',
        indicators: e.indicators ?? [],
        level: e.level ?? '',
        weight: clamp(e.weight ?? 0.5, 0, 1),
      })),
    }));
}

// ═══════════════════════════════════════════════════════════════
// KEYWORD EXTRACTION PARSER
// ═══════════════════════════════════════════════════════════════

interface RawKeywordResponse {
  keywords?: Array<{
    type?: string;
    keywords?: Array<{
      text?: string;
      relevance?: number;
      position?: { start?: number; end?: number };
      associatedLevel?: string;
      context?: string;
    }>;
  }>;
  totalCount?: number;
}

/**
 * Parse keyword extraction response
 */
export function parseKeywordResult(
  response: string,
  model: string,
  processingTimeMs: number
): KeywordExtractionResult {
  const raw = safeJsonParse<RawKeywordResponse>(response, {});

  const keywords = parseKeywordGroups(raw.keywords);
  const totalCount = raw.totalCount ?? keywords.reduce((sum, g) => sum + g.keywords.length, 0);

  return {
    keywords,
    totalCount,
    model,
    processingTimeMs,
  };
}

function parseKeywordGroups(groups?: RawKeywordResponse['keywords']): ExtractedKeywordGroup[] {
  if (!groups || !Array.isArray(groups)) return [];

  return groups
    .filter(g => g.type && g.keywords)
    .map(g => ({
      type: g.type as ExtractedKeywordGroup['type'],
      keywords: (g.keywords ?? [])
        .filter(k => k.text)
        .map(k => ({
          text: k.text ?? '',
          relevance: clamp(k.relevance ?? 0.5, 0, 1),
          position: k.position ? {
            start: k.position.start ?? 0,
            end: k.position.end ?? 0,
          } : undefined,
          associatedLevel: k.associatedLevel,
          context: k.context,
        })),
    }));
}

// ═══════════════════════════════════════════════════════════════
// ALIGNMENT ANALYSIS PARSER
// ═══════════════════════════════════════════════════════════════

interface RawAlignmentResponse {
  objectiveAlignments?: Array<{
    objectiveId?: string;
    alignedSections?: Array<{ id?: string; strength?: number; evidence?: string }>;
    alignmentStrength?: number;
    missingCoverage?: string;
  }>;
  assessmentAlignments?: Array<{
    assessmentId?: string;
    alignedSections?: Array<{ id?: string; strength?: number; evidence?: string }>;
    alignedObjectives?: Array<{ id?: string; strength?: number; evidence?: string }>;
    alignmentStrength?: number;
  }>;
  gaps?: Array<{
    type?: string;
    severity?: string;
    description?: string;
    affectedItems?: string[];
    recommendation?: string;
  }>;
  overallScore?: number;
  summary?: {
    totalObjectives?: number;
    coveredObjectives?: number;
    totalSections?: number;
    assessedSections?: number;
    averageAlignment?: number;
    gapsCount?: number;
  };
}

/**
 * Parse alignment analysis response
 */
export function parseAlignmentResult(
  response: string,
  model: string,
  processingTimeMs: number
): AlignmentAnalysisResult {
  const raw = safeJsonParse<RawAlignmentResponse>(response, {});

  const objectiveAlignments = parseObjectiveAlignments(raw.objectiveAlignments);
  const assessmentAlignments = parseAssessmentAlignments(raw.assessmentAlignments);
  const gaps = parseAlignmentGaps(raw.gaps);
  const overallScore = clamp(raw.overallScore ?? 0.8, 0, 1);
  const summary = parseAlignmentSummary(raw.summary, objectiveAlignments, assessmentAlignments, gaps);

  return {
    objectiveAlignments,
    assessmentAlignments,
    gaps,
    overallScore,
    summary,
    model,
    processingTimeMs,
  };
}

function parseObjectiveAlignments(
  alignments?: RawAlignmentResponse['objectiveAlignments']
): ObjectiveAlignmentDetail[] {
  if (!alignments || !Array.isArray(alignments)) return [];

  return alignments
    .filter(a => a.objectiveId)
    .map(a => ({
      objectiveId: a.objectiveId ?? '',
      alignedSections: (a.alignedSections ?? []).map(s => ({
        id: s.id ?? '',
        strength: clamp(s.strength ?? 0.5, 0, 1),
        evidence: s.evidence ?? '',
      })),
      alignmentStrength: clamp(a.alignmentStrength ?? 0.5, 0, 1),
      missingCoverage: a.missingCoverage,
    }));
}

function parseAssessmentAlignments(
  alignments?: RawAlignmentResponse['assessmentAlignments']
): AssessmentAlignmentDetail[] {
  if (!alignments || !Array.isArray(alignments)) return [];

  return alignments
    .filter(a => a.assessmentId)
    .map(a => ({
      assessmentId: a.assessmentId ?? '',
      alignedSections: (a.alignedSections ?? []).map(s => ({
        id: s.id ?? '',
        strength: clamp(s.strength ?? 0.5, 0, 1),
        evidence: s.evidence ?? '',
      })),
      alignedObjectives: (a.alignedObjectives ?? []).map(o => ({
        id: o.id ?? '',
        strength: clamp(o.strength ?? 0.5, 0, 1),
        evidence: o.evidence ?? '',
      })),
      alignmentStrength: clamp(a.alignmentStrength ?? 0.5, 0, 1),
    }));
}

function parseAlignmentGaps(gaps?: RawAlignmentResponse['gaps']): AlignmentGapDetail[] {
  if (!gaps || !Array.isArray(gaps)) return [];

  return gaps
    .filter(g => g.type && g.description)
    .map(g => ({
      type: g.type as AlignmentGapDetail['type'],
      severity: (g.severity as AlignmentGapDetail['severity']) ?? 'medium',
      description: g.description ?? '',
      affectedItems: g.affectedItems ?? [],
      recommendation: g.recommendation ?? '',
    }));
}

function parseAlignmentSummary(
  summary: RawAlignmentResponse['summary'],
  objectives: ObjectiveAlignmentDetail[],
  assessments: AssessmentAlignmentDetail[],
  gaps: AlignmentGapDetail[]
): AlignmentSummaryStats {
  if (summary) {
    return {
      totalObjectives: summary.totalObjectives ?? objectives.length,
      coveredObjectives: summary.coveredObjectives ?? objectives.filter(o => o.alignedSections.length > 0).length,
      totalSections: summary.totalSections ?? 0,
      assessedSections: summary.assessedSections ?? 0,
      averageAlignment: clamp(summary.averageAlignment ?? 0.8, 0, 1),
      gapsCount: summary.gapsCount ?? gaps.length,
    };
  }

  // Calculate from data if no summary provided
  const coveredObjectives = objectives.filter(o => o.alignedSections.length > 0).length;
  const avgStrength = objectives.length > 0
    ? objectives.reduce((sum, o) => sum + o.alignmentStrength, 0) / objectives.length
    : 0;

  return {
    totalObjectives: objectives.length,
    coveredObjectives,
    totalSections: 0,
    assessedSections: 0,
    averageAlignment: avgStrength,
    gapsCount: gaps.length,
  };
}

// ═══════════════════════════════════════════════════════════════
// RECOMMENDATIONS PARSER
// ═══════════════════════════════════════════════════════════════

interface RawRecommendationResponse {
  recommendations?: Array<{
    id?: string;
    priority?: string;
    category?: string;
    title?: string;
    description?: string;
    actionItems?: string[];
    expectedImpact?: string;
    affectedAreas?: string[];
  }>;
  currentStateSummary?: string;
}

/**
 * Parse recommendations response
 */
export function parseRecommendationResult(
  response: string,
  model: string,
  processingTimeMs: number
): RecommendationResult {
  const raw = safeJsonParse<RawRecommendationResponse>(response, {});

  const recommendations = parseRecommendations(raw.recommendations);
  const currentStateSummary = raw.currentStateSummary ?? 'Analysis complete.';

  return {
    recommendations,
    currentStateSummary,
    model,
    processingTimeMs,
  };
}

function parseRecommendations(
  recs?: RawRecommendationResponse['recommendations']
): GeneratedRecommendation[] {
  if (!recs || !Array.isArray(recs)) return [];

  return recs
    .filter(r => r.title && r.description)
    .map((r, index) => ({
      id: r.id ?? `rec_${index + 1}`,
      priority: (r.priority as GeneratedRecommendation['priority']) ?? 'medium',
      category: (r.category as GeneratedRecommendation['category']) ?? 'improve_alignment',
      title: r.title ?? '',
      description: r.description ?? '',
      actionItems: r.actionItems ?? [],
      expectedImpact: r.expectedImpact ?? '',
      affectedAreas: r.affectedAreas ?? [],
    }));
}
