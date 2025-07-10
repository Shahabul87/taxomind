// Knowledge Graph Types and Interfaces

export interface KnowledgeNode {
  id: string;
  type: NodeType;
  title: string;
  description?: string;
  metadata: NodeMetadata;
  attributes: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type NodeType = 
  | 'concept'
  | 'skill'
  | 'topic'
  | 'lesson'
  | 'course'
  | 'assignment'
  | 'quiz'
  | 'video'
  | 'document'
  | 'prerequisite'
  | 'learning_objective'
  | 'competency';

export interface NodeMetadata {
  difficulty: DifficultyLevel;
  estimatedTime: number; // minutes
  bloomsLevel: BloomsLevel;
  cognitiveLoad: CognitiveLoad;
  prerequisites: string[]; // Node IDs
  tags: string[];
  keywords: string[];
  learningObjectives: string[];
}

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type BloomsLevel = 
  | 'remember'
  | 'understand'
  | 'apply'
  | 'analyze'
  | 'evaluate'
  | 'create';

export type CognitiveLoad = 'low' | 'medium' | 'high';

export interface KnowledgeEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: EdgeType;
  weight: number; // 0-1 strength of relationship
  metadata: EdgeMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export type EdgeType =
  | 'prerequisite'      // A requires B
  | 'builds_on'         // A builds upon B
  | 'related_to'        // A is related to B
  | 'part_of'          // A is part of B
  | 'similar_to'       // A is similar to B
  | 'contradicts'      // A contradicts B
  | 'applies_to'       // A applies to B
  | 'exemplifies'      // A exemplifies B
  | 'reinforces'       // A reinforces B
  | 'leads_to'         // A leads to B
  | 'depends_on'       // A depends on B
  | 'sequence'         // A follows B in sequence
  | 'alternative'      // A is alternative to B
  | 'supports';        // A supports B

export interface EdgeMetadata {
  strength: number; // 0-1
  confidence: number; // 0-1
  source: RelationshipSource;
  verified: boolean;
  learningPathRelevance: number; // 0-1
  conceptualDistance: number; // 0-1
}

export type RelationshipSource = 
  | 'manual'           // Manually defined
  | 'content_analysis' // Extracted from content
  | 'behavior_analysis'// Inferred from student behavior
  | 'ml_prediction'    // ML-generated relationship
  | 'curriculum_design'// From curriculum structure
  | 'expert_knowledge';// Subject matter expert input

export interface KnowledgeGraph {
  nodes: Map<string, KnowledgeNode>;
  edges: Map<string, KnowledgeEdge>;
  metadata: GraphMetadata;
}

export interface GraphMetadata {
  version: string;
  lastUpdated: Date;
  nodeCount: number;
  edgeCount: number;
  density: number; // edges / possible_edges
  averageClusteringCoefficient: number;
  longestPath: number;
  domains: string[]; // Subject domains represented
}

export interface LearningPath {
  id: string;
  studentId?: string;
  name: string;
  description?: string;
  nodes: LearningPathNode[];
  totalEstimatedTime: number;
  difficulty: DifficultyLevel;
  completionRate: number;
  adaptations: PathAdaptation[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningPathNode {
  nodeId: string;
  order: number;
  isRequired: boolean;
  isCompleted: boolean;
  estimatedTime: number;
  actualTime?: number;
  completedAt?: Date;
  adaptiveAdjustments: AdaptiveAdjustment[];
}

export interface PathAdaptation {
  reason: AdaptationReason;
  originalNodeId: string;
  adaptedNodeId?: string;
  action: AdaptationAction;
  timestamp: Date;
  effectiveness?: number; // 0-1, measured later
}

export type AdaptationReason =
  | 'difficulty_mismatch'
  | 'prerequisite_gap'
  | 'learning_style'
  | 'time_constraint'
  | 'performance_issue'
  | 'interest_level'
  | 'cognitive_overload';

export type AdaptationAction =
  | 'skip'
  | 'substitute'
  | 'add_prerequisite'
  | 'simplify'
  | 'extend'
  | 'reorder'
  | 'add_practice'
  | 'change_modality';

export interface AdaptiveAdjustment {
  type: AdaptationAction;
  reason: string;
  parameters: Record<string, any>;
  appliedAt: Date;
}

export interface ConceptMap {
  id: string;
  name: string;
  rootConceptId: string;
  includedNodeIds: string[];
  layout: ConceptMapLayout;
  visualizations: ConceptVisualization[];
  interactions: ConceptInteraction[];
}

export interface ConceptMapLayout {
  type: LayoutType;
  parameters: Record<string, any>;
  positions: Record<string, Position>;
  clusters: ConceptCluster[];
}

export type LayoutType = 
  | 'hierarchical'
  | 'force_directed'
  | 'circular'
  | 'grid'
  | 'custom';

export interface Position {
  x: number;
  y: number;
  z?: number; // For 3D layouts
}

export interface ConceptCluster {
  id: string;
  nodeIds: string[];
  centroid: Position;
  theme: string;
  color: string;
}

export interface ConceptVisualization {
  type: VisualizationType;
  data: any;
  configuration: Record<string, any>;
}

export type VisualizationType =
  | 'node_link'
  | 'matrix'
  | 'treemap'
  | 'sankey'
  | 'chord'
  | 'network_3d'
  | 'timeline';

export interface ConceptInteraction {
  type: InteractionType;
  nodeId: string;
  timestamp: Date;
  duration: number;
  studentId: string;
  data: Record<string, any>;
}

export type InteractionType =
  | 'view'
  | 'explore'
  | 'navigate'
  | 'annotate'
  | 'bookmark'
  | 'rate'
  | 'connect'
  | 'question';

export interface GraphAnalytics {
  centralityMeasures: CentralityMeasures;
  clusteringMetrics: ClusteringMetrics;
  pathMetrics: PathMetrics;
  learningMetrics: LearningMetrics;
}

export interface CentralityMeasures {
  betweenness: Record<string, number>;
  closeness: Record<string, number>;
  eigenvector: Record<string, number>;
  pagerank: Record<string, number>;
  degreeCentrality: Record<string, number>;
}

export interface ClusteringMetrics {
  clusteringCoefficient: Record<string, number>;
  communities: Community[];
  modularityScore: number;
  silhouetteScore: number;
}

export interface Community {
  id: string;
  nodeIds: string[];
  coherenceScore: number;
  theme: string;
  keywords: string[];
}

export interface PathMetrics {
  shortestPaths: Record<string, Record<string, string[]>>;
  averagePathLength: number;
  diameter: number;
  criticalPaths: CriticalPath[];
}

export interface CriticalPath {
  nodes: string[];
  importance: number;
  bottlenecks: string[];
  alternatives: string[][];
}

export interface LearningMetrics {
  conceptMastery: Record<string, number>;
  prerequisiteGaps: PrerequisiteGap[];
  learningEfficiency: Record<string, number>;
  knowledgeRetention: Record<string, number>;
}

export interface PrerequisiteGap {
  studentId: string;
  conceptId: string;
  missingPrerequisites: string[];
  severity: 'low' | 'medium' | 'high';
  suggestedRemediation: string[];
}

export interface GraphQuery {
  type: QueryType;
  parameters: QueryParameters;
  filters?: GraphFilter[];
  limit?: number;
  offset?: number;
}

export type QueryType =
  | 'find_path'
  | 'find_prerequisites'
  | 'find_dependents'
  | 'find_similar'
  | 'find_clusters'
  | 'find_gaps'
  | 'recommend_next'
  | 'analyze_difficulty';

export interface QueryParameters {
  sourceId?: string;
  targetId?: string;
  nodeType?: NodeType;
  edgeType?: EdgeType;
  maxDepth?: number;
  minWeight?: number;
  studentId?: string;
  context?: string;
}

export interface GraphFilter {
  field: string;
  operator: FilterOperator;
  value: any;
}

export type FilterOperator = 
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'contains'
  | 'starts_with'
  | 'in'
  | 'not_in';

export interface GraphUpdate {
  type: UpdateType;
  nodeId?: string;
  edgeId?: string;
  data: any;
  timestamp: Date;
  source: string;
}

export type UpdateType =
  | 'create_node'
  | 'update_node'
  | 'delete_node'
  | 'create_edge'
  | 'update_edge'
  | 'delete_edge'
  | 'batch_update';

export interface GraphValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
}

export interface ValidationError {
  type: string;
  nodeId?: string;
  edgeId?: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ValidationWarning {
  type: string;
  message: string;
  affectedNodes: string[];
  recommendation?: string;
}

export interface ValidationSuggestion {
  type: string;
  description: string;
  potentialImpact: string;
  effort: 'low' | 'medium' | 'high';
}