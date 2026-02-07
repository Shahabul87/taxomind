/**
 * @sam-ai/educational - KnowledgeGraphEngine
 *
 * Engine for concept extraction, prerequisite tracking, and knowledge dependency graphs.
 * Enables adaptive learning paths based on concept relationships.
 */

import type { SAMConfig, SAMDatabaseAdapter, BloomsLevel } from '@sam-ai/core';
import type {
  KnowledgeGraphEngineConfig,
  Concept,
  ConceptType,
  ConceptRelation,
  RelationType,
  ConceptMastery,
  ConceptMasteryLevel,
  KnowledgeGraph,
  GraphStats,
  ConceptExtractionInput,
  ConceptExtractionResult,
  ExtractedConcept,
  ExtractedRelation,
  PrerequisiteAnalysisInput,
  PrerequisiteAnalysisResult,
  PrerequisiteNode,
  PrerequisiteGapAnalysis,
  ConceptGap,
  LearningPathInput,
  LearningPath,
  LearningPathNode,
  PathActivity,
  CourseKnowledgeAnalysisInput,
  CourseKnowledgeAnalysisResult,
  CourseStructureQuality,
  StructureIssue,
  KnowledgeGraphRecommendation,
  ConceptCoverage,
} from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

const BLOOMS_HIERARCHY: BloomsLevel[] = [
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
];

const CONCEPT_TYPE_KEYWORDS: Record<ConceptType, string[]> = {
  FOUNDATIONAL: ['basic', 'fundamental', 'core', 'essential', 'introduction', 'definition'],
  PROCEDURAL: ['how to', 'step', 'process', 'procedure', 'method', 'technique', 'implement'],
  CONCEPTUAL: ['understand', 'principle', 'theory', 'concept', 'relationship', 'framework'],
  METACOGNITIVE: ['reflect', 'evaluate', 'strategy', 'self-assess', 'plan', 'monitor'],
};

const RELATION_KEYWORDS: Record<RelationType, string[]> = {
  PREREQUISITE: ['requires', 'before', 'first', 'foundation', 'must know'],
  SUPPORTS: ['helps', 'supports', 'aids', 'assists', 'facilitates'],
  EXTENDS: ['builds on', 'extends', 'expands', 'advances', 'deepens'],
  RELATED: ['related', 'connected', 'linked', 'associated', 'similar'],
  CONTRASTS: ['differs', 'contrasts', 'opposite', 'unlike', 'versus'],
};

// ============================================================================
// KNOWLEDGE GRAPH ENGINE IMPLEMENTATION
// ============================================================================

export class KnowledgeGraphEngine {
  private config: SAMConfig;
  private database?: SAMDatabaseAdapter;
  private logger: SAMConfig['logger'];
  private enableAIExtraction: boolean;
  private confidenceThreshold: number;
  private maxPrerequisiteDepth: number;

  // In-memory graph cache
  private graphCache: Map<string, KnowledgeGraph> = new Map();
  private conceptCache: Map<string, Concept> = new Map();
  private masteryCache: Map<string, ConceptMastery> = new Map();

  constructor(engineConfig: KnowledgeGraphEngineConfig) {
    this.config = engineConfig.samConfig;
    this.database = engineConfig.database ?? engineConfig.samConfig.database;
    this.logger = this.config.logger ?? console;
    this.enableAIExtraction = engineConfig.enableAIExtraction ?? true;
    this.confidenceThreshold = engineConfig.confidenceThreshold ?? 0.7;
    this.maxPrerequisiteDepth = engineConfig.maxPrerequisiteDepth ?? 10;
  }

  // ============================================================================
  // CONCEPT EXTRACTION
  // ============================================================================

  /**
   * Extract concepts from educational content
   */
  async extractConcepts(input: ConceptExtractionInput): Promise<ConceptExtractionResult> {
    this.logger?.info?.('[KnowledgeGraphEngine] Extracting concepts', {
      contentType: input.contentType,
    });

    const startTime = Date.now();

    if (this.enableAIExtraction && this.config.ai) {
      return this.extractConceptsWithAI(input, startTime);
    }

    return this.extractConceptsWithKeywords(input, startTime);
  }

  private async extractConceptsWithAI(
    input: ConceptExtractionInput,
    startTime: number
  ): Promise<ConceptExtractionResult> {
    try {
      const existingConceptNames = input.context?.existingConcepts?.map((c) => c.name) ?? [];

      const response = await this.config.ai.chat({
        messages: [
          {
            role: 'system',
            content: `You are an expert educational content analyzer specializing in knowledge graphs.
Extract key concepts and their relationships from educational content.

Concept Types:
- FOUNDATIONAL: Basic building blocks and definitions
- PROCEDURAL: How-to knowledge and processes
- CONCEPTUAL: Understanding of principles and theories
- METACOGNITIVE: Self-awareness and learning strategies

Relation Types:
- PREREQUISITE: Must learn A before B
- SUPPORTS: A helps understand B
- EXTENDS: B builds on A
- RELATED: A and B are connected
- CONTRASTS: A differs from B

Return ONLY valid JSON matching the specified format.`,
          },
          {
            role: 'user',
            content: `Extract concepts and relationships from this ${input.contentType} content:

${input.content.slice(0, 4000)}${input.content.length > 4000 ? '...' : ''}

${existingConceptNames.length > 0 ? `Existing concepts in this course: ${existingConceptNames.join(', ')}` : ''}

Return JSON:
{
  "concepts": [
    {
      "name": "concept name",
      "description": "brief description",
      "type": "FOUNDATIONAL|PROCEDURAL|CONCEPTUAL|METACOGNITIVE",
      "bloomsLevel": "REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE",
      "keywords": ["keyword1", "keyword2"],
      "confidence": 0.0-1.0
    }
  ],
  "relations": [
    {
      "sourceConcept": "concept name",
      "targetConcept": "concept name",
      "relationType": "PREREQUISITE|SUPPORTS|EXTENDS|RELATED|CONTRASTS",
      "strength": 0.0-1.0,
      "confidence": 0.0-1.0,
      "reasoning": "why this relationship exists"
    }
  ]
}`,
          },
        ],
        temperature: 0.3,
        maxTokens: 2000,
      });

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON in response');
      }

      const parsed = JSON.parse(jsonMatch[0]) as {
        concepts: ExtractedConcept[];
        relations: ExtractedRelation[];
      };

      // Filter by confidence threshold
      const filteredConcepts = parsed.concepts.filter(
        (c) => c.confidence >= this.confidenceThreshold
      );
      const filteredRelations = parsed.relations.filter(
        (r) => r.confidence >= this.confidenceThreshold
      );

      const overallConfidence =
        filteredConcepts.length > 0
          ? filteredConcepts.reduce((sum, c) => sum + c.confidence, 0) / filteredConcepts.length
          : 0;

      return {
        concepts: filteredConcepts,
        relations: filteredRelations,
        confidence: overallConfidence,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      this.logger?.warn?.('[KnowledgeGraphEngine] AI extraction failed, falling back to keywords', error);
      return this.extractConceptsWithKeywords(input, startTime);
    }
  }

  private extractConceptsWithKeywords(
    input: ConceptExtractionInput,
    startTime: number
  ): ConceptExtractionResult {
    const content = input.content.toLowerCase();
    const concepts: ExtractedConcept[] = [];
    const relations: ExtractedRelation[] = [];

    // Extract sentences as potential concept sources
    const sentences = input.content.split(/[.!?]+/).filter((s) => s.trim().length > 10);

    for (const sentence of sentences.slice(0, 20)) {
      const type = this.detectConceptType(sentence);
      const bloomsLevel = this.detectBloomsLevel(sentence);

      // Extract noun phrases as potential concepts
      const nounPhrases = this.extractNounPhrases(sentence);

      for (const phrase of nounPhrases) {
        if (phrase.length > 3 && phrase.length < 100) {
          concepts.push({
            name: this.titleCase(phrase),
            description: `Concept extracted from: "${sentence.trim().slice(0, 100)}..."`,
            type,
            bloomsLevel,
            keywords: phrase.toLowerCase().split(/\s+/).filter((w) => w.length > 3),
            confidence: 0.6,
          });
        }
      }
    }

    // Deduplicate concepts by name similarity
    const uniqueConcepts = this.deduplicateConcepts(concepts);

    // Infer basic relations between sequential concepts
    for (let i = 0; i < uniqueConcepts.length - 1; i++) {
      relations.push({
        sourceConcept: uniqueConcepts[i].name,
        targetConcept: uniqueConcepts[i + 1].name,
        relationType: 'SUPPORTS',
        strength: 0.5,
        confidence: 0.5,
      });
    }

    return {
      concepts: uniqueConcepts,
      relations,
      confidence: 0.5,
      processingTimeMs: Date.now() - startTime,
    };
  }

  private detectConceptType(text: string): ConceptType {
    const lowerText = text.toLowerCase();

    for (const [type, keywords] of Object.entries(CONCEPT_TYPE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          return type as ConceptType;
        }
      }
    }

    return 'CONCEPTUAL';
  }

  private detectBloomsLevel(text: string): BloomsLevel {
    const lowerText = text.toLowerCase();

    const bloomsKeywords: Record<BloomsLevel, string[]> = {
      REMEMBER: ['define', 'list', 'recall', 'identify', 'name', 'state'],
      UNDERSTAND: ['explain', 'describe', 'summarize', 'interpret', 'classify'],
      APPLY: ['apply', 'use', 'implement', 'solve', 'demonstrate'],
      ANALYZE: ['analyze', 'compare', 'contrast', 'differentiate', 'examine'],
      EVALUATE: ['evaluate', 'judge', 'critique', 'justify', 'assess'],
      CREATE: ['create', 'design', 'develop', 'construct', 'produce'],
    };

    for (const level of [...BLOOMS_HIERARCHY].reverse()) {
      for (const keyword of bloomsKeywords[level]) {
        if (lowerText.includes(keyword)) {
          return level;
        }
      }
    }

    return 'UNDERSTAND';
  }

  private extractNounPhrases(text: string): string[] {
    // Simple noun phrase extraction using common patterns
    const patterns = [
      /\b(?:the|a|an)\s+(\w+(?:\s+\w+){0,3})\b/gi,
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
    ];

    const phrases: string[] = [];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          phrases.push(match[1].trim());
        }
      }
    }

    return phrases;
  }

  private deduplicateConcepts(concepts: ExtractedConcept[]): ExtractedConcept[] {
    const seen = new Map<string, ExtractedConcept>();

    for (const concept of concepts) {
      const key = concept.name.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, concept);
      } else {
        // Keep the one with higher confidence
        const existing = seen.get(key);
        if (existing && concept.confidence > existing.confidence) {
          seen.set(key, concept);
        }
      }
    }

    return Array.from(seen.values());
  }

  private titleCase(str: string): string {
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // ============================================================================
  // KNOWLEDGE GRAPH BUILDING
  // ============================================================================

  /**
   * Build a knowledge graph from extracted concepts
   */
  buildGraph(
    courseId: string,
    concepts: Concept[],
    relations: ConceptRelation[]
  ): KnowledgeGraph {
    this.logger?.info?.('[KnowledgeGraphEngine] Building knowledge graph', {
      courseId,
      conceptCount: concepts.length,
      relationCount: relations.length,
    });

    // Find root concepts (no prerequisites pointing to them)
    const targetIds = new Set(
      relations
        .filter((r) => r.relationType === 'PREREQUISITE')
        .map((r) => r.targetConceptId)
    );
    const rootConcepts = concepts
      .filter((c) => !targetIds.has(c.id))
      .map((c) => c.id);

    // Find terminal concepts (not prerequisites for anything)
    const sourceIds = new Set(
      relations
        .filter((r) => r.relationType === 'PREREQUISITE')
        .map((r) => r.sourceConceptId)
    );
    const terminalConcepts = concepts
      .filter((c) => !sourceIds.has(c.id))
      .map((c) => c.id);

    // Calculate stats
    const stats = this.calculateGraphStats(concepts, relations);

    const graph: KnowledgeGraph = {
      id: `graph-${courseId}-${Date.now()}`,
      courseId,
      concepts,
      relations,
      rootConcepts,
      terminalConcepts,
      stats,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Cache the graph
    this.graphCache.set(courseId, graph);

    // Cache individual concepts
    for (const concept of concepts) {
      this.conceptCache.set(concept.id, concept);
    }

    return graph;
  }

  private calculateGraphStats(
    concepts: Concept[],
    relations: ConceptRelation[]
  ): GraphStats {
    const connectionCounts = new Map<string, number>();

    for (const relation of relations) {
      connectionCounts.set(
        relation.sourceConceptId,
        (connectionCounts.get(relation.sourceConceptId) ?? 0) + 1
      );
      connectionCounts.set(
        relation.targetConceptId,
        (connectionCounts.get(relation.targetConceptId) ?? 0) + 1
      );
    }

    const totalConnections = Array.from(connectionCounts.values()).reduce(
      (sum, c) => sum + c,
      0
    );

    const conceptsByType: Record<ConceptType, number> = {
      FOUNDATIONAL: 0,
      PROCEDURAL: 0,
      CONCEPTUAL: 0,
      METACOGNITIVE: 0,
    };

    const conceptsByBloomsLevel: Record<BloomsLevel, number> = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    for (const concept of concepts) {
      conceptsByType[concept.type]++;
      conceptsByBloomsLevel[concept.bloomsLevel]++;
    }

    return {
      totalConcepts: concepts.length,
      totalRelations: relations.length,
      averageConnections:
        concepts.length > 0 ? totalConnections / concepts.length : 0,
      maxDepth: this.calculateMaxDepth(concepts, relations),
      conceptsByType,
      conceptsByBloomsLevel,
    };
  }

  private calculateMaxDepth(
    concepts: Concept[],
    relations: ConceptRelation[]
  ): number {
    const prerequisiteRels = relations.filter(
      (r) => r.relationType === 'PREREQUISITE'
    );

    if (prerequisiteRels.length === 0) return 0;

    // Build adjacency list
    const adjacency = new Map<string, string[]>();
    for (const rel of prerequisiteRels) {
      const existing = adjacency.get(rel.sourceConceptId) ?? [];
      existing.push(rel.targetConceptId);
      adjacency.set(rel.sourceConceptId, existing);
    }

    // BFS to find max depth
    let maxDepth = 0;
    const visited = new Set<string>();

    const dfs = (nodeId: string, depth: number): void => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      maxDepth = Math.max(maxDepth, depth);

      const children = adjacency.get(nodeId) ?? [];
      for (const child of children) {
        dfs(child, depth + 1);
      }
    };

    for (const concept of concepts) {
      visited.clear();
      dfs(concept.id, 0);
    }

    return maxDepth;
  }

  // ============================================================================
  // PREREQUISITE ANALYSIS
  // ============================================================================

  /**
   * Analyze prerequisites for a concept
   */
  async analyzePrerequisites(
    input: PrerequisiteAnalysisInput
  ): Promise<PrerequisiteAnalysisResult> {
    this.logger?.info?.('[KnowledgeGraphEngine] Analyzing prerequisites', {
      conceptId: input.conceptId,
    });

    const concept = this.conceptCache.get(input.conceptId);
    if (!concept) {
      throw new Error(`Concept not found: ${input.conceptId}`);
    }

    // Find the graph containing this concept
    const graph = this.findGraphForConcept(input.conceptId);
    if (!graph) {
      return {
        concept,
        directPrerequisites: [],
        prerequisiteChain: [],
        estimatedLearningTime: 15,
        dependentConcepts: [],
      };
    }

    // Get direct prerequisites
    const directPrereqs = graph.relations
      .filter(
        (r) =>
          r.targetConceptId === input.conceptId &&
          r.relationType === 'PREREQUISITE'
      )
      .map((r) => {
        const prereqConcept = graph.concepts.find(
          (c) => c.id === r.sourceConceptId
        );
        return prereqConcept
          ? {
              concept: prereqConcept,
              depth: 1,
              relationStrength: r.strength,
              isBottleneck: this.isBottleneck(r.sourceConceptId, graph),
            }
          : null;
      })
      .filter((p): p is PrerequisiteNode => p !== null);

    // Build full prerequisite chain (topological sort)
    const chain = this.buildPrerequisiteChain(
      input.conceptId,
      graph,
      input.maxDepth ?? this.maxPrerequisiteDepth
    );

    // Find dependent concepts
    const dependentConcepts = graph.relations
      .filter(
        (r) =>
          r.sourceConceptId === input.conceptId &&
          r.relationType === 'PREREQUISITE'
      )
      .map((r) => graph.concepts.find((c) => c.id === r.targetConceptId))
      .filter((c): c is Concept => c !== undefined);

    // Estimate learning time (15 min per concept base + Bloom's level modifier)
    const estimatedTime = chain.reduce((total, node) => {
      const bloomsMultiplier =
        (BLOOMS_HIERARCHY.indexOf(node.concept.bloomsLevel) + 1) * 0.2;
      return total + 15 * (1 + bloomsMultiplier);
    }, 15);

    const result: PrerequisiteAnalysisResult = {
      concept,
      directPrerequisites: directPrereqs,
      prerequisiteChain: chain,
      estimatedLearningTime: Math.round(estimatedTime),
      dependentConcepts,
    };

    // Add gap analysis if user ID provided
    if (input.userId && input.includeMastery) {
      result.gapAnalysis = await this.analyzePrerequisiteGaps(
        input.userId,
        chain,
        concept
      );
    }

    return result;
  }

  private buildPrerequisiteChain(
    conceptId: string,
    graph: KnowledgeGraph,
    maxDepth: number
  ): PrerequisiteNode[] {
    const visited = new Set<string>();
    const chain: PrerequisiteNode[] = [];

    const traverse = (nodeId: string, depth: number): void => {
      if (visited.has(nodeId) || depth > maxDepth) return;
      visited.add(nodeId);

      const concept = graph.concepts.find((c) => c.id === nodeId);
      if (!concept) return;

      // Find prerequisites of this node
      const prereqs = graph.relations.filter(
        (r) => r.targetConceptId === nodeId && r.relationType === 'PREREQUISITE'
      );

      // Traverse prerequisites first (for topological order)
      for (const prereq of prereqs) {
        traverse(prereq.sourceConceptId, depth + 1);
      }

      // Add this node to chain
      chain.push({
        concept,
        depth,
        relationStrength: prereqs.length > 0 ? prereqs[0].strength : 1,
        isBottleneck: this.isBottleneck(nodeId, graph),
      });
    };

    // Get direct prerequisites and traverse
    const directPrereqs = graph.relations.filter(
      (r) => r.targetConceptId === conceptId && r.relationType === 'PREREQUISITE'
    );

    for (const prereq of directPrereqs) {
      traverse(prereq.sourceConceptId, 1);
    }

    return chain;
  }

  private isBottleneck(conceptId: string, graph: KnowledgeGraph): boolean {
    // A concept is a bottleneck if many things depend on it
    const dependentCount = graph.relations.filter(
      (r) => r.sourceConceptId === conceptId && r.relationType === 'PREREQUISITE'
    ).length;

    return dependentCount >= 3;
  }

  private async analyzePrerequisiteGaps(
    userId: string,
    chain: PrerequisiteNode[],
    targetConcept: Concept
  ): Promise<PrerequisiteGapAnalysis> {
    const gaps: ConceptGap[] = [];
    let masteredCount = 0;

    for (const node of chain) {
      const mastery = await this.getConceptMastery(userId, node.concept.id);

      if (mastery.masteryLevel === 'MASTERED' || mastery.masteryLevel === 'PROFICIENT') {
        masteredCount++;
      } else {
        gaps.push({
          concept: node.concept,
          currentMastery: mastery.masteryLevel,
          requiredMastery: node.isBottleneck ? 'PROFICIENT' : 'PRACTICING',
          priority: node.isBottleneck ? 'HIGH' : node.depth <= 2 ? 'MEDIUM' : 'LOW',
          suggestions: this.generateGapSuggestions(node.concept, mastery.masteryLevel),
        });
      }
    }

    const readinessScore =
      chain.length > 0 ? (masteredCount / chain.length) * 100 : 100;

    return {
      userId,
      gaps,
      recommendedSequence: gaps
        .sort((a, b) => {
          const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        })
        .map((g) => g.concept.id),
      readyToLearn: gaps.filter((g) => g.priority === 'HIGH').length === 0,
      readinessScore,
    };
  }

  private generateGapSuggestions(
    concept: Concept,
    currentMastery: ConceptMasteryLevel
  ): ConceptGap['suggestions'] {
    const suggestions: ConceptGap['suggestions'] = [];

    if (currentMastery === 'NOT_STARTED') {
      suggestions.push({
        type: 'READING',
        title: `Introduction to ${concept.name}`,
        description: `Start with foundational material about ${concept.name}`,
        estimatedTimeMinutes: 15,
      });
    }

    if (currentMastery === 'INTRODUCED' || currentMastery === 'NOT_STARTED') {
      suggestions.push({
        type: 'VIDEO',
        title: `${concept.name} Explained`,
        description: `Watch explanatory content about ${concept.name}`,
        estimatedTimeMinutes: 10,
      });
    }

    suggestions.push({
      type: 'PRACTICE',
      title: `Practice ${concept.name}`,
      description: `Apply your knowledge of ${concept.name}`,
      estimatedTimeMinutes: 20,
    });

    if (currentMastery !== 'NOT_STARTED') {
      suggestions.push({
        type: 'QUIZ',
        title: `${concept.name} Assessment`,
        description: `Test your understanding of ${concept.name}`,
        estimatedTimeMinutes: 10,
      });
    }

    return suggestions;
  }

  // ============================================================================
  // LEARNING PATH GENERATION
  // ============================================================================

  /**
   * Generate an optimal learning path to target concepts
   */
  async generateLearningPath(input: LearningPathInput): Promise<LearningPath> {
    this.logger?.info?.('[KnowledgeGraphEngine] Generating learning path', {
      userId: input.userId,
      targetCount: input.targetConceptIds.length,
      strategy: input.strategy,
    });

    const targetConcepts: Concept[] = [];
    const allPrereqs = new Set<string>();

    // Gather all target concepts and their prerequisites
    for (const targetId of input.targetConceptIds) {
      const concept = this.conceptCache.get(targetId);
      if (concept) {
        targetConcepts.push(concept);
      }

      const prereqAnalysis = await this.analyzePrerequisites({
        conceptId: targetId,
        userId: input.userId,
        includeMastery: input.skipMastered,
        maxDepth: this.maxPrerequisiteDepth,
      });

      for (const prereq of prereqAnalysis.prerequisiteChain) {
        allPrereqs.add(prereq.concept.id);
      }
    }

    // Build sequence
    const sequence: LearningPathNode[] = [];
    let position = 0;

    // Add prerequisites first
    for (const prereqId of allPrereqs) {
      const concept = this.conceptCache.get(prereqId);
      if (!concept) continue;

      // Skip mastered concepts if requested
      if (input.skipMastered) {
        const mastery = await this.getConceptMastery(input.userId, prereqId);
        if (
          mastery.masteryLevel === 'MASTERED' ||
          mastery.masteryLevel === 'PROFICIENT'
        ) {
          continue;
        }
      }

      sequence.push(
        this.createLearningPathNode(concept, position++, 'PREREQUISITE')
      );
    }

    // Add target concepts
    for (const target of targetConcepts) {
      if (input.skipMastered) {
        const mastery = await this.getConceptMastery(input.userId, target.id);
        if (
          mastery.masteryLevel === 'MASTERED' ||
          mastery.masteryLevel === 'PROFICIENT'
        ) {
          continue;
        }
      }

      sequence.push(this.createLearningPathNode(target, position++, 'TARGET'));
    }

    // Apply strategy adjustments
    const adjustedSequence = this.applyPathStrategy(sequence, input.strategy);

    // Calculate totals
    const totalTime = adjustedSequence.reduce(
      (sum, node) => sum + node.estimatedTimeMinutes,
      0
    );

    return {
      id: `path-${input.userId}-${Date.now()}`,
      userId: input.userId,
      targetConcepts,
      sequence: adjustedSequence,
      totalEstimatedTime: totalTime,
      progress: {
        completedConcepts: 0,
        totalConcepts: adjustedSequence.length,
        completedTimeMinutes: 0,
        estimatedRemainingMinutes: totalTime,
        percentComplete: 0,
      },
      createdAt: new Date(),
    };
  }

  private createLearningPathNode(
    concept: Concept,
    position: number,
    reason: LearningPathNode['reason']
  ): LearningPathNode {
    const bloomsIndex = BLOOMS_HIERARCHY.indexOf(concept.bloomsLevel);
    const baseTime = 15 + bloomsIndex * 5;

    const activities: PathActivity[] = [
      {
        type: 'LEARN',
        title: `Learn ${concept.name}`,
        description: concept.description,
        estimatedTimeMinutes: Math.round(baseTime * 0.4),
      },
      {
        type: 'PRACTICE',
        title: `Practice ${concept.name}`,
        description: `Apply your knowledge of ${concept.name}`,
        estimatedTimeMinutes: Math.round(baseTime * 0.4),
      },
      {
        type: 'ASSESS',
        title: `${concept.name} Check`,
        description: `Verify understanding of ${concept.name}`,
        estimatedTimeMinutes: Math.round(baseTime * 0.2),
      },
    ];

    return {
      concept,
      position,
      estimatedTimeMinutes: baseTime,
      reason,
      activities,
      completed: false,
    };
  }

  private applyPathStrategy(
    sequence: LearningPathNode[],
    strategy: LearningPathInput['strategy']
  ): LearningPathNode[] {
    switch (strategy) {
      case 'FASTEST':
        // Remove REINFORCEMENT nodes and reduce time estimates
        return sequence
          .filter((n) => n.reason !== 'REINFORCEMENT')
          .map((n) => ({
            ...n,
            estimatedTimeMinutes: Math.round(n.estimatedTimeMinutes * 0.8),
            activities: n.activities.slice(0, 2),
          }));

      case 'THOROUGH':
        // Add extra practice time
        return sequence.map((n) => ({
          ...n,
          estimatedTimeMinutes: Math.round(n.estimatedTimeMinutes * 1.3),
          activities: [
            ...n.activities,
            {
              type: 'PRACTICE' as const,
              title: `Extra Practice: ${n.concept.name}`,
              description: `Additional exercises for ${n.concept.name}`,
              estimatedTimeMinutes: 10,
            },
          ],
        }));

      case 'BALANCED':
      default:
        return sequence;
    }
  }

  // ============================================================================
  // COURSE ANALYSIS
  // ============================================================================

  /**
   * Analyze a course for knowledge graph quality
   */
  async analyzeCourse(
    input: CourseKnowledgeAnalysisInput
  ): Promise<CourseKnowledgeAnalysisResult> {
    this.logger?.info?.('[KnowledgeGraphEngine] Analyzing course', {
      courseId: input.courseId,
    });

    // Check cache
    if (!input.forceRegenerate && this.graphCache.has(input.courseId)) {
      const cachedGraph = this.graphCache.get(input.courseId);
      if (cachedGraph) {
        return {
          courseId: input.courseId,
          graph: cachedGraph,
          structureQuality: this.assessStructureQuality(cachedGraph),
          recommendations: this.generateCourseRecommendations(cachedGraph),
          coverage: this.assessCoverage(cachedGraph),
          analyzedAt: new Date(),
        };
      }
    }

    // Fetch course data
    if (!this.database) {
      throw new Error('Database adapter required for course analysis');
    }

    const course = await this.database.findCourse(input.courseId, {
      include: { chapters: true },
    });

    if (!course) {
      throw new Error(`Course not found: ${input.courseId}`);
    }

    // Extract concepts from course content
    const allConcepts: Concept[] = [];
    const allRelations: ConceptRelation[] = [];

    // Extract from course description
    if (course.description) {
      const extraction = await this.extractConcepts({
        content: course.description,
        contentType: 'COURSE_DESCRIPTION',
        context: { courseId: input.courseId },
      });

      for (const extracted of extraction.concepts) {
        allConcepts.push(this.convertToFullConcept(extracted, input.courseId));
      }
    }

    // Extract from chapters if full content requested
    if (input.includeFullContent && course.chapters) {
      for (const chapter of course.chapters) {
        const chapterContent = [chapter.title, chapter.description ?? ''].join('\n');

        const extraction = await this.extractConcepts({
          content: chapterContent,
          contentType: 'CHAPTER',
          context: {
            courseId: input.courseId,
            chapterId: chapter.id,
            existingConcepts: allConcepts,
          },
        });

        for (const extracted of extraction.concepts) {
          allConcepts.push(
            this.convertToFullConcept(extracted, input.courseId, chapter.id)
          );
        }

        for (const relation of extraction.relations) {
          const sourceId = allConcepts.find(
            (c) => c.name.toLowerCase() === relation.sourceConcept.toLowerCase()
          )?.id;
          const targetId = allConcepts.find(
            (c) => c.name.toLowerCase() === relation.targetConcept.toLowerCase()
          )?.id;

          if (sourceId && targetId) {
            allRelations.push({
              id: `rel-${sourceId}-${targetId}`,
              sourceConceptId: sourceId,
              targetConceptId: targetId,
              relationType: relation.relationType,
              strength: relation.strength,
              confidence: relation.confidence,
              description: relation.reasoning,
              createdAt: new Date(),
            });
          }
        }
      }
    }

    // Build the graph
    const graph = this.buildGraph(input.courseId, allConcepts, allRelations);

    return {
      courseId: input.courseId,
      graph,
      structureQuality: this.assessStructureQuality(graph),
      recommendations: this.generateCourseRecommendations(graph),
      coverage: this.assessCoverage(graph),
      analyzedAt: new Date(),
    };
  }

  private convertToFullConcept(
    extracted: ExtractedConcept,
    courseId: string,
    chapterId?: string
  ): Concept {
    const id = `concept-${courseId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    return {
      id,
      name: extracted.name,
      description: extracted.description,
      type: extracted.type,
      bloomsLevel: extracted.bloomsLevel,
      keywords: extracted.keywords,
      sourceContext: {
        courseId,
        chapterId,
      },
      confidence: extracted.confidence,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private assessStructureQuality(graph: KnowledgeGraph): CourseStructureQuality {
    const issues: StructureIssue[] = [];
    let prerequisiteOrdering = 100;
    let conceptContinuity = 100;
    let depthBalance = 100;

    // Check for circular dependencies
    if (this.hasCircularDependencies(graph)) {
      issues.push({
        type: 'CIRCULAR_DEPENDENCY',
        severity: 'HIGH',
        description: 'Circular prerequisite dependency detected',
        affectedConcepts: [],
        suggestion: 'Review and break circular prerequisite chains',
      });
      prerequisiteOrdering -= 30;
    }

    // Check for orphan concepts (no connections)
    const orphans = graph.concepts.filter((c) => {
      const hasRelations = graph.relations.some(
        (r) => r.sourceConceptId === c.id || r.targetConceptId === c.id
      );
      return !hasRelations;
    });

    if (orphans.length > 0) {
      issues.push({
        type: 'ORPHAN_CONCEPT',
        severity: 'MEDIUM',
        description: `${orphans.length} concepts have no connections to other concepts`,
        affectedConcepts: orphans.map((c) => c.id),
        suggestion: 'Connect orphan concepts to related concepts',
      });
      conceptContinuity -= Math.min(30, orphans.length * 5);
    }

    // Check depth balance
    if (graph.stats.maxDepth > 8) {
      issues.push({
        type: 'TOO_DEEP',
        severity: 'MEDIUM',
        description: `Prerequisite chain is very deep (${graph.stats.maxDepth} levels)`,
        affectedConcepts: [],
        suggestion: 'Consider breaking down complex prerequisite chains',
      });
      depthBalance -= 20;
    }

    // Check for missing foundational concepts
    const foundationalCount = graph.stats.conceptsByType.FOUNDATIONAL;
    if (foundationalCount < graph.concepts.length * 0.2) {
      issues.push({
        type: 'UNBALANCED',
        severity: 'LOW',
        description: 'Few foundational concepts defined',
        affectedConcepts: [],
        suggestion: 'Add more foundational/introductory concepts',
      });
      depthBalance -= 10;
    }

    const overallScore = Math.round(
      (prerequisiteOrdering + conceptContinuity + depthBalance) / 3
    );

    return {
      prerequisiteOrdering,
      conceptContinuity,
      depthBalance,
      overallScore,
      issues,
    };
  }

  private hasCircularDependencies(graph: KnowledgeGraph): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recStack.add(nodeId);

      const children = graph.relations
        .filter(
          (r) => r.sourceConceptId === nodeId && r.relationType === 'PREREQUISITE'
        )
        .map((r) => r.targetConceptId);

      for (const child of children) {
        if (!visited.has(child)) {
          if (hasCycle(child)) return true;
        } else if (recStack.has(child)) {
          return true;
        }
      }

      recStack.delete(nodeId);
      return false;
    };

    for (const concept of graph.concepts) {
      if (!visited.has(concept.id)) {
        if (hasCycle(concept.id)) return true;
      }
    }

    return false;
  }

  private generateCourseRecommendations(graph: KnowledgeGraph): KnowledgeGraphRecommendation[] {
    const recommendations: KnowledgeGraphRecommendation[] = [];

    // Check Bloom's level distribution
    const bloomsTotal = Object.values(graph.stats.conceptsByBloomsLevel).reduce(
      (sum, c) => sum + c,
      0
    );

    if (bloomsTotal > 0) {
      const applyAndAbove =
        graph.stats.conceptsByBloomsLevel.APPLY +
        graph.stats.conceptsByBloomsLevel.ANALYZE +
        graph.stats.conceptsByBloomsLevel.EVALUATE +
        graph.stats.conceptsByBloomsLevel.CREATE;

      if (applyAndAbove / bloomsTotal < 0.3) {
        recommendations.push({
          type: 'ADD_CONTENT',
          priority: 'high',
          title: 'Add Higher-Order Thinking Activities',
          description:
            'Course is heavy on lower-level concepts. Add more application, analysis, and creation activities.',
          affectedConcepts: [],
          estimatedImpact: 25,
        });
      }
    }

    // Check for concepts without practice
    if (graph.stats.conceptsByType.PROCEDURAL < graph.concepts.length * 0.15) {
      recommendations.push({
        type: 'ADD_PRACTICE',
        priority: 'medium',
        title: 'Add Procedural Practice',
        description: 'Few procedural concepts found. Add hands-on exercises and demonstrations.',
        affectedConcepts: [],
        estimatedImpact: 20,
      });
    }

    // Check for weak prerequisite chains
    if (graph.stats.averageConnections < 1.5) {
      recommendations.push({
        type: 'ADD_PREREQUISITE',
        priority: 'medium',
        title: 'Strengthen Concept Connections',
        description: 'Many concepts lack clear relationships. Define prerequisites more explicitly.',
        affectedConcepts: [],
        estimatedImpact: 15,
      });
    }

    return recommendations;
  }

  private assessCoverage(graph: KnowledgeGraph): ConceptCoverage {
    return {
      coveredConcepts: graph.concepts,
      bloomsDistribution: graph.stats.conceptsByBloomsLevel,
      typeDistribution: graph.stats.conceptsByType,
    };
  }

  // ============================================================================
  // MASTERY TRACKING
  // ============================================================================

  /**
   * Get or create concept mastery for a user
   */
  async getConceptMastery(userId: string, conceptId: string): Promise<ConceptMastery> {
    const cacheKey = `${userId}-${conceptId}`;

    if (this.masteryCache.has(cacheKey)) {
      return this.masteryCache.get(cacheKey)!;
    }

    // Default mastery
    const defaultMastery: ConceptMastery = {
      userId,
      conceptId,
      masteryLevel: 'NOT_STARTED',
      score: 0,
      practiceCount: 0,
      evidence: [],
      updatedAt: new Date(),
    };

    this.masteryCache.set(cacheKey, defaultMastery);
    return defaultMastery;
  }

  /**
   * Update concept mastery based on performance
   */
  async updateConceptMastery(
    userId: string,
    conceptId: string,
    score: number,
    evidenceType: 'QUIZ' | 'ASSIGNMENT' | 'PRACTICE' | 'INTERACTION'
  ): Promise<ConceptMastery> {
    const mastery = await this.getConceptMastery(userId, conceptId);

    // Add evidence
    mastery.evidence.push({
      type: evidenceType,
      score,
      timestamp: new Date(),
    });

    // Update practice count
    mastery.practiceCount++;
    mastery.lastPracticedAt = new Date();

    // Calculate new score (weighted average of recent evidence)
    const recentEvidence = mastery.evidence.slice(-5);
    const avgScore =
      recentEvidence.reduce((sum, e) => sum + e.score, 0) / recentEvidence.length;
    mastery.score = Math.round(avgScore);

    // Determine mastery level
    mastery.masteryLevel = this.determineMasteryLevel(
      mastery.score,
      mastery.practiceCount
    );
    mastery.updatedAt = new Date();

    // Update cache
    const cacheKey = `${userId}-${conceptId}`;
    this.masteryCache.set(cacheKey, mastery);

    return mastery;
  }

  private determineMasteryLevel(
    score: number,
    practiceCount: number
  ): ConceptMasteryLevel {
    if (practiceCount === 0) return 'NOT_STARTED';
    if (practiceCount === 1) return 'INTRODUCED';
    if (score >= 90 && practiceCount >= 3) return 'MASTERED';
    if (score >= 70 && practiceCount >= 2) return 'PROFICIENT';
    return 'PRACTICING';
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private findGraphForConcept(conceptId: string): KnowledgeGraph | undefined {
    for (const graph of this.graphCache.values()) {
      if (graph.concepts.some((c) => c.id === conceptId)) {
        return graph;
      }
    }
    return undefined;
  }

  /**
   * Get a cached concept by ID
   */
  getConcept(conceptId: string): Concept | undefined {
    return this.conceptCache.get(conceptId);
  }

  /**
   * Get a cached graph by course ID
   */
  getGraph(courseId: string): KnowledgeGraph | undefined {
    return this.graphCache.get(courseId);
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.graphCache.clear();
    this.conceptCache.clear();
    this.masteryCache.clear();
  }

  // ============================================================================
  // GRAPH TRAVERSAL ALGORITHMS (No AI calls needed)
  // ============================================================================

  /**
   * Find the prerequisite chain for a concept using BFS traversal.
   * Returns all prerequisite concepts in topological order (deepest prerequisites first).
   */
  findPrerequisiteChain(
    conceptId: string,
    graph: KnowledgeGraph
  ): Concept[] {
    const visited = new Set<string>();
    const chain: Concept[] = [];
    const queue: string[] = [conceptId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId || visited.has(currentId)) continue;
      visited.add(currentId);

      // Find prerequisite relations where this concept is the target
      const prereqRelations = graph.relations.filter(
        (rel) => rel.targetConceptId === currentId && rel.relationType === 'PREREQUISITE'
      );

      for (const rel of prereqRelations) {
        const prereqConcept = graph.concepts.find((c) => c.id === rel.sourceConceptId);
        if (prereqConcept && !visited.has(prereqConcept.id)) {
          chain.push(prereqConcept);
          queue.push(prereqConcept.id);
        }
      }
    }

    // Return in reverse order: deepest prerequisites first
    return chain.reverse();
  }

  /**
   * Find related concepts within a bounded depth using DFS.
   * Returns concepts reachable within the specified number of hops.
   */
  findRelatedConcepts(
    conceptId: string,
    graph: KnowledgeGraph,
    maxDepth: number = 3
  ): Array<{ concept: Concept; depth: number; relationTypes: string[] }> {
    const visited = new Set<string>();
    const results: Array<{ concept: Concept; depth: number; relationTypes: string[] }> = [];
    const maxTraversalDepth = Math.min(maxDepth, this.maxPrerequisiteDepth);

    const dfs = (currentId: string, depth: number, relationPath: string[]): void => {
      if (depth > maxTraversalDepth || visited.has(currentId)) return;
      visited.add(currentId);

      // Find all relations involving this concept
      const relations = graph.relations.filter(
        (rel) => rel.sourceConceptId === currentId || rel.targetConceptId === currentId
      );

      for (const rel of relations) {
        const neighborId = rel.sourceConceptId === currentId
          ? rel.targetConceptId
          : rel.sourceConceptId;

        if (visited.has(neighborId)) continue;

        const neighbor = graph.concepts.find((c) => c.id === neighborId);
        if (!neighbor) continue;

        const updatedPath = [...relationPath, rel.relationType];
        results.push({
          concept: neighbor,
          depth: depth + 1,
          relationTypes: updatedPath,
        });

        dfs(neighborId, depth + 1, updatedPath);
      }
    };

    dfs(conceptId, 0, []);
    return results;
  }

  /**
   * Calculate degree centrality for a concept.
   * Higher centrality = more connected = more important in the knowledge graph.
   */
  calculateConceptCentrality(
    conceptId: string,
    graph: KnowledgeGraph
  ): {
    inDegree: number;
    outDegree: number;
    totalDegree: number;
    normalizedCentrality: number;
  } {
    const totalConcepts = Math.max(graph.concepts.length - 1, 1);

    const inDegree = graph.relations.filter(
      (rel) => rel.targetConceptId === conceptId
    ).length;

    const outDegree = graph.relations.filter(
      (rel) => rel.sourceConceptId === conceptId
    ).length;

    const totalDegree = inDegree + outDegree;

    return {
      inDegree,
      outDegree,
      totalDegree,
      normalizedCentrality: totalDegree / (2 * totalConcepts),
    };
  }

  /**
   * Find all concepts sorted by centrality (most connected first).
   * Useful for identifying key concepts in a course.
   */
  rankConceptsByCentrality(
    graph: KnowledgeGraph
  ): Array<{ concept: Concept; centrality: number }> {
    return graph.concepts
      .map((concept) => ({
        concept,
        centrality: this.calculateConceptCentrality(concept.id, graph).normalizedCentrality,
      }))
      .sort((a, b) => b.centrality - a.centrality);
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createKnowledgeGraphEngine(
  config: KnowledgeGraphEngineConfig
): KnowledgeGraphEngine {
  return new KnowledgeGraphEngine(config);
}
