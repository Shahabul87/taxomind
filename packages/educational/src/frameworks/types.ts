/**
 * Multi-Framework Taxonomy Types
 * Enhanced Depth Analysis - January 2026
 *
 * Types and interfaces for multiple taxonomy frameworks:
 * - Bloom's Taxonomy (Revised)
 * - Webb's Depth of Knowledge (DOK)
 * - SOLO Taxonomy
 * - Fink's Significant Learning
 * - Marzano's New Taxonomy
 */

import type { BloomsLevel } from '@sam-ai/core';
import type { WebbDOKLevel, CourseType, BloomsDistribution, WebbDOKDistribution } from '../types/depth-analysis.types';

// ═══════════════════════════════════════════════════════════════
// FRAMEWORK TYPES
// ═══════════════════════════════════════════════════════════════

export type FrameworkType = 'blooms' | 'dok' | 'solo' | 'fink' | 'marzano';

export type SOLOLevel = 'prestructural' | 'unistructural' | 'multistructural' | 'relational' | 'extended_abstract';

export type FinkLevel =
  | 'foundational_knowledge'
  | 'application'
  | 'integration'
  | 'human_dimension'
  | 'caring'
  | 'learning_how_to_learn';

export type MarzanoLevel =
  | 'retrieval'
  | 'comprehension'
  | 'analysis'
  | 'knowledge_utilization'
  | 'metacognition'
  | 'self_system';

// ═══════════════════════════════════════════════════════════════
// TAXONOMY LEVEL DEFINITION
// ═══════════════════════════════════════════════════════════════

export interface TaxonomyLevel {
  /** Unique identifier for this level */
  id: string;
  /** Human-readable name */
  name: string;
  /** Cognitive complexity weight (1 = lowest) */
  weight: number;
  /** Description of what this level represents */
  description?: string;
  /** Keywords that indicate this level */
  keywords?: string[];
  /** Example verbs for this level */
  verbs?: string[];
}

// ═══════════════════════════════════════════════════════════════
// FRAMEWORK MAPPING
// ═══════════════════════════════════════════════════════════════

export interface FrameworkMapping {
  /** Level in the source framework */
  fromLevel: string;
  /** Corresponding level(s) in target framework */
  toLevel: string | string[];
  /** Confidence in this mapping (0-1) */
  confidence: number;
  /** Notes about the mapping */
  notes?: string;
}

export interface CrossFrameworkMapping {
  /** Source framework */
  fromFramework: FrameworkType;
  /** Target framework */
  toFramework: FrameworkType;
  /** Level mappings */
  mappings: FrameworkMapping[];
}

// ═══════════════════════════════════════════════════════════════
// TAXONOMY FRAMEWORK DEFINITION
// ═══════════════════════════════════════════════════════════════

export interface TaxonomyFramework {
  /** Framework type identifier */
  type: FrameworkType;
  /** Human-readable name */
  name: string;
  /** Academic citation */
  citation: string;
  /** Description of the framework */
  description?: string;
  /** The levels in this taxonomy */
  levels: TaxonomyLevel[];
  /** Mappings to other frameworks */
  mappings: FrameworkMapping[];
  /** Ideal distribution for different course types */
  idealDistributions?: Record<CourseType, Record<string, number>>;
}

// ═══════════════════════════════════════════════════════════════
// FRAMEWORK DISTRIBUTIONS
// ═══════════════════════════════════════════════════════════════

export interface SOLODistribution {
  prestructural: number;
  unistructural: number;
  multistructural: number;
  relational: number;
  extended_abstract: number;
}

export interface FinkDistribution {
  foundational_knowledge: number;
  application: number;
  integration: number;
  human_dimension: number;
  caring: number;
  learning_how_to_learn: number;
}

export interface MarzanoDistribution {
  retrieval: number;
  comprehension: number;
  analysis: number;
  knowledge_utilization: number;
  metacognition: number;
  self_system: number;
}

export type FrameworkDistribution =
  | BloomsDistribution
  | WebbDOKDistribution
  | SOLODistribution
  | FinkDistribution
  | MarzanoDistribution
  | Record<string, number>;

// ═══════════════════════════════════════════════════════════════
// FRAMEWORK WEIGHTS
// ═══════════════════════════════════════════════════════════════

export interface FrameworkWeights {
  blooms: number;
  dok: number;
  solo?: number;
  fink?: number;
  marzano?: number;
}

// ═══════════════════════════════════════════════════════════════
// EVALUATOR OPTIONS AND RESULTS
// ═══════════════════════════════════════════════════════════════

export interface MultiFrameworkEvaluatorOptions {
  /** Which frameworks to use for evaluation */
  frameworks?: FrameworkType[];
  /** Course-type specific weights */
  courseTypeWeights?: Record<CourseType, FrameworkWeights>;
  /** Primary framework for reporting */
  primaryFramework?: FrameworkType;
  /** Minimum confidence threshold */
  minConfidence?: number;
  /** Logger for debugging */
  logger?: FrameworkLogger;
}

export interface FrameworkLogger {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  debug?: (message: string, ...args: unknown[]) => void;
}

export interface FrameworkAnalysis {
  /** Which framework was used */
  framework: FrameworkType;
  /** Distribution across levels */
  distribution: Record<string, number>;
  /** Dominant level */
  dominantLevel: string;
  /** How balanced is the distribution */
  balanceScore: number;
  /** Alignment with ideal distribution for course type */
  alignmentWithIdeal: number;
  /** Confidence in this analysis */
  confidence: number;
  /** Detailed level analysis */
  levelAnalysis?: LevelAnalysisDetail[];
}

export interface LevelAnalysisDetail {
  level: string;
  percentage: number;
  deviation: number; // From ideal
  status: 'under' | 'on-target' | 'over';
  recommendation?: string;
}

export interface FrameworkRecommendation {
  framework: FrameworkType;
  type: 'add_content' | 'reduce_content' | 'rebalance' | 'align_assessments';
  priority: 'high' | 'medium' | 'low';
  level?: string;
  description: string;
  actionItems?: string[];
}

export interface MultiFrameworkResult {
  /** Primary framework analysis (usually Bloom's) */
  primary: FrameworkAnalysis;
  /** Additional framework analyses */
  secondary: FrameworkAnalysis[];
  /** How well frameworks agree with each other */
  crossFrameworkAlignment: number;
  /** Recommendations based on analysis */
  recommendations: FrameworkRecommendation[];
  /** Composite score across all frameworks */
  compositeScore: number;
  /** Method used to calculate composite */
  compositeMethod: 'weighted_average' | 'min_score' | 'custom';
  /** Course type detected */
  courseType?: CourseType;
  /** Overall analysis metadata */
  metadata: {
    analysisVersion: string;
    analyzedAt: Date;
    frameworksUsed: FrameworkType[];
    totalContentAnalyzed: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// ANALYZABLE CONTENT
// ═══════════════════════════════════════════════════════════════

export interface AnalyzableContent {
  /** Unique identifier */
  id: string;
  /** Text content to analyze */
  text: string;
  /** Type of content */
  type: 'objective' | 'section' | 'assessment' | 'mixed';
  /** Pre-analyzed Bloom's level (if available) */
  bloomsLevel?: BloomsLevel;
  /** Pre-analyzed DOK level (if available) */
  dokLevel?: WebbDOKLevel;
  /** Pre-analyzed distribution (if available) */
  bloomsDistribution?: BloomsDistribution;
  /** Context for better analysis */
  context?: string;
}

export interface ContentForMultiFrameworkAnalysis {
  courseId: string;
  courseType?: CourseType;
  content: AnalyzableContent[];
  /** Existing Bloom's analysis to incorporate */
  existingBloomsAnalysis?: {
    distribution: BloomsDistribution;
    dominantLevel: BloomsLevel;
  };
  /** Existing DOK analysis to incorporate */
  existingDOKAnalysis?: {
    distribution: WebbDOKDistribution;
    dominantLevel: WebbDOKLevel;
  };
}
