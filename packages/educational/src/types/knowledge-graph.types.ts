/**
 * Knowledge Graph Engine Types
 *
 * Types for concept extraction, prerequisite tracking, and knowledge dependency graphs
 */

import type { SAMConfig, SAMDatabaseAdapter, BloomsLevel } from '@sam-ai/core';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface KnowledgeGraphEngineConfig {
  samConfig: SAMConfig;
  database?: SAMDatabaseAdapter;
  /** Enable AI-powered concept extraction */
  enableAIExtraction?: boolean;
  /** Minimum confidence threshold for concept relationships (0-1) */
  confidenceThreshold?: number;
  /** Maximum depth for prerequisite chain analysis */
  maxPrerequisiteDepth?: number;
}

// ============================================================================
// CORE CONCEPT TYPES
// ============================================================================

export type ConceptType =
  | 'FOUNDATIONAL'    // Basic building blocks
  | 'PROCEDURAL'      // How-to knowledge
  | 'CONCEPTUAL'      // Understanding of principles
  | 'METACOGNITIVE';  // Self-awareness of learning

export type RelationType =
  | 'PREREQUISITE'    // Must learn A before B
  | 'SUPPORTS'        // A helps understand B
  | 'EXTENDS'         // B builds on A
  | 'RELATED'         // A and B are connected
  | 'CONTRASTS';      // A differs from B

export type ConceptMasteryLevel =
  | 'NOT_STARTED'
  | 'INTRODUCED'
  | 'PRACTICING'
  | 'PROFICIENT'
  | 'MASTERED';

/**
 * A concept node in the knowledge graph
 */
export interface Concept {
  id: string;
  name: string;
  description: string;
  type: ConceptType;
  bloomsLevel: BloomsLevel;
  /** Keywords associated with this concept */
  keywords: string[];
  /** Course/chapter/section where this concept is taught */
  sourceContext?: {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
  };
  /** Confidence score from extraction (0-1) */
  confidence: number;
  /** Metadata for extensions */
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * A relationship between two concepts
 */
export interface ConceptRelation {
  id: string;
  sourceConceptId: string;
  targetConceptId: string;
  relationType: RelationType;
  /** How strong is this relationship (0-1) */
  strength: number;
  /** Confidence in this relationship (0-1) */
  confidence: number;
  /** Optional explanation of the relationship */
  description?: string;
  createdAt: Date;
}

/**
 * Student's mastery of a specific concept
 */
export interface ConceptMastery {
  userId: string;
  conceptId: string;
  masteryLevel: ConceptMasteryLevel;
  /** Score from 0-100 */
  score: number;
  /** Number of times practiced */
  practiceCount: number;
  /** Last time this concept was practiced */
  lastPracticedAt?: Date;
  /** Evidence of mastery (quiz scores, assignments, etc.) */
  evidence: MasteryEvidence[];
  updatedAt: Date;
}

export interface MasteryEvidence {
  type: 'QUIZ' | 'ASSIGNMENT' | 'PRACTICE' | 'INTERACTION';
  score: number;
  timestamp: Date;
  sourceId?: string;
}

// ============================================================================
// KNOWLEDGE GRAPH TYPES
// ============================================================================

/**
 * Full knowledge graph for a course or topic
 */
export interface KnowledgeGraph {
  id: string;
  courseId: string;
  concepts: Concept[];
  relations: ConceptRelation[];
  /** Root concepts (no prerequisites) */
  rootConcepts: string[];
  /** Terminal concepts (nothing builds on them) */
  terminalConcepts: string[];
  /** Graph statistics */
  stats: GraphStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface GraphStats {
  totalConcepts: number;
  totalRelations: number;
  averageConnections: number;
  maxDepth: number;
  conceptsByType: Record<ConceptType, number>;
  conceptsByBloomsLevel: Record<BloomsLevel, number>;
}

// ============================================================================
// EXTRACTION TYPES
// ============================================================================

export interface ConceptExtractionInput {
  content: string;
  contentType: 'COURSE_DESCRIPTION' | 'CHAPTER' | 'SECTION' | 'LEARNING_OBJECTIVE' | 'QUIZ';
  context?: {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    existingConcepts?: Concept[];
  };
}

export interface ConceptExtractionResult {
  concepts: ExtractedConcept[];
  relations: ExtractedRelation[];
  confidence: number;
  processingTimeMs: number;
}

export interface ExtractedConcept {
  name: string;
  description: string;
  type: ConceptType;
  bloomsLevel: BloomsLevel;
  keywords: string[];
  confidence: number;
}

export interface ExtractedRelation {
  sourceConcept: string;
  targetConcept: string;
  relationType: RelationType;
  strength: number;
  confidence: number;
  reasoning?: string;
}

// ============================================================================
// PREREQUISITE ANALYSIS TYPES
// ============================================================================

export interface PrerequisiteAnalysisInput {
  conceptId: string;
  userId?: string;
  /** Include mastery status in analysis */
  includeMastery?: boolean;
  /** Maximum depth to traverse */
  maxDepth?: number;
}

export interface PrerequisiteAnalysisResult {
  concept: Concept;
  /** Direct prerequisites */
  directPrerequisites: PrerequisiteNode[];
  /** All prerequisites in order (topological sort) */
  prerequisiteChain: PrerequisiteNode[];
  /** Total estimated learning time in minutes */
  estimatedLearningTime: number;
  /** Concepts that depend on this one */
  dependentConcepts: Concept[];
  /** Gap analysis for user if userId provided */
  gapAnalysis?: PrerequisiteGapAnalysis;
}

export interface PrerequisiteNode {
  concept: Concept;
  depth: number;
  relationStrength: number;
  /** User's mastery if userId provided */
  mastery?: ConceptMastery;
  /** Is this a bottleneck (many things depend on it)? */
  isBottleneck: boolean;
}

export interface PrerequisiteGapAnalysis {
  userId: string;
  /** Concepts the user hasn't mastered that are prerequisites */
  gaps: ConceptGap[];
  /** Recommended learning sequence */
  recommendedSequence: string[];
  /** Ready to learn (prerequisites met) */
  readyToLearn: boolean;
  /** Percentage of prerequisites mastered */
  readinessScore: number;
}

export interface ConceptGap {
  concept: Concept;
  currentMastery: ConceptMasteryLevel;
  requiredMastery: ConceptMasteryLevel;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  /** Suggested resources to close the gap */
  suggestions: GapSuggestion[];
}

export interface GapSuggestion {
  type: 'REVIEW' | 'PRACTICE' | 'QUIZ' | 'VIDEO' | 'READING';
  title: string;
  description: string;
  estimatedTimeMinutes: number;
  resourceId?: string;
}

// ============================================================================
// LEARNING PATH TYPES
// ============================================================================

export interface LearningPathInput {
  userId: string;
  targetConceptIds: string[];
  /** Optimize for speed or thoroughness */
  strategy: 'FASTEST' | 'THOROUGH' | 'BALANCED';
  /** Skip concepts already mastered */
  skipMastered?: boolean;
}

export interface LearningPath {
  id: string;
  userId: string;
  targetConcepts: Concept[];
  /** Ordered sequence of concepts to learn */
  sequence: LearningPathNode[];
  /** Total estimated time in minutes */
  totalEstimatedTime: number;
  /** Progress tracking */
  progress: LearningPathProgress;
  createdAt: Date;
}

export interface LearningPathNode {
  concept: Concept;
  position: number;
  estimatedTimeMinutes: number;
  /** Why this concept is in the path */
  reason: 'TARGET' | 'PREREQUISITE' | 'REINFORCEMENT';
  /** Suggested activities */
  activities: PathActivity[];
  /** Is this node completed? */
  completed: boolean;
  completedAt?: Date;
}

export interface PathActivity {
  type: 'LEARN' | 'PRACTICE' | 'ASSESS';
  title: string;
  description: string;
  resourceId?: string;
  estimatedTimeMinutes: number;
}

export interface LearningPathProgress {
  completedConcepts: number;
  totalConcepts: number;
  completedTimeMinutes: number;
  estimatedRemainingMinutes: number;
  percentComplete: number;
}

// ============================================================================
// COURSE ANALYSIS TYPES
// ============================================================================

export interface CourseKnowledgeAnalysisInput {
  courseId: string;
  /** Include all chapters and sections */
  includeFullContent?: boolean;
  /** Regenerate graph even if cached */
  forceRegenerate?: boolean;
}

export interface CourseKnowledgeAnalysisResult {
  courseId: string;
  graph: KnowledgeGraph;
  /** Quality assessment of the course structure */
  structureQuality: CourseStructureQuality;
  /** Recommendations for improving the course */
  recommendations: KnowledgeGraphRecommendation[];
  /** Coverage analysis */
  coverage: ConceptCoverage;
  analyzedAt: Date;
}

export interface CourseStructureQuality {
  /** How well are prerequisites ordered (0-100) */
  prerequisiteOrdering: number;
  /** Are there gaps in the learning sequence (0-100) */
  conceptContinuity: number;
  /** Is the depth appropriate (0-100) */
  depthBalance: number;
  /** Overall quality score (0-100) */
  overallScore: number;
  issues: StructureIssue[];
}

export interface StructureIssue {
  type: 'MISSING_PREREQUISITE' | 'CIRCULAR_DEPENDENCY' | 'ORPHAN_CONCEPT' | 'TOO_DEEP' | 'UNBALANCED';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  affectedConcepts: string[];
  suggestion: string;
}

export interface KnowledgeGraphRecommendation {
  type: 'ADD_CONTENT' | 'REORDER' | 'ADD_PRACTICE' | 'ADD_PREREQUISITE' | 'SIMPLIFY';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedConcepts: string[];
  estimatedImpact: number;
}

export interface ConceptCoverage {
  /** Concepts covered by the course */
  coveredConcepts: Concept[];
  /** Standard concepts not covered (if comparing to curriculum) */
  uncoveredConcepts?: string[];
  /** Bloom's level distribution */
  bloomsDistribution: Record<BloomsLevel, number>;
  /** Concept type distribution */
  typeDistribution: Record<ConceptType, number>;
}
