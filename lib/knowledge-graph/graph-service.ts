// Knowledge Graph Service - Main interface for graph operations

import { db } from '@/lib/db';
import { redis } from '@/lib/redis';
import { KnowledgeGraphBuilder } from './graph-builder';
import { KnowledgeGraphAnalyzer } from './graph-analyzer';
import { 
  KnowledgeGraph, 
  KnowledgeNode, 
  KnowledgeEdge,
  GraphQuery,
  GraphAnalytics,
  LearningPath,
  ConceptMap,
  GraphValidation,
  GraphUpdate
} from './types';

export class KnowledgeGraphService {
  private graphCache = new Map<string, KnowledgeGraph>();
  private analyzerCache = new Map<string, KnowledgeGraphAnalyzer>();

  // Get or build knowledge graph for a course
  async getKnowledgeGraph(courseId: string, forceRebuild = false): Promise<KnowledgeGraph> {
    // Check cache first
    if (!forceRebuild && this.graphCache.has(courseId)) {
      return this.graphCache.get(courseId)!;
    }

    // Try to load from Redis cache
    if (!forceRebuild) {
      const cachedGraph = await this.loadGraphFromCache(courseId);
      if (cachedGraph) {
        this.graphCache.set(courseId, cachedGraph);
        return cachedGraph;
      }
    }

    // Build new graph
    console.log(`Building knowledge graph for course: ${courseId}`);
    const builder = new KnowledgeGraphBuilder();
    const graph = await builder.buildFromCourseStructure(courseId);
    
    // Cache the graph
    this.graphCache.set(courseId, graph);
    await this.saveGraphToCache(courseId, graph);
    
    return graph;
  }

  // Get graph analyzer
  async getGraphAnalyzer(courseId: string): Promise<KnowledgeGraphAnalyzer> {
    if (this.analyzerCache.has(courseId)) {
      return this.analyzerCache.get(courseId)!;
    }

    const graph = await this.getKnowledgeGraph(courseId);
    const analyzer = new KnowledgeGraphAnalyzer(graph);
    this.analyzerCache.set(courseId, analyzer);
    
    return analyzer;
  }

  // Query the knowledge graph
  async queryGraph(courseId: string, query: GraphQuery): Promise<any> {
    const graph = await this.getKnowledgeGraph(courseId);
    const analyzer = await this.getGraphAnalyzer(courseId);

    switch (query.type) {
      case 'find_path':
        return this.findPath(graph, query.parameters.sourceId!, query.parameters.targetId!);
      
      case 'find_prerequisites':
        return this.findPrerequisites(graph, query.parameters.targetId!);
      
      case 'find_dependents':
        return this.findDependents(graph, query.parameters.sourceId!);
      
      case 'find_similar':
        return this.findSimilarNodes(graph, query.parameters.sourceId!);
      
      case 'find_clusters':
        const analytics = await analyzer.analyzeGraph();
        return analytics.clusteringMetrics.communities;
      
      case 'find_gaps':
        return this.findLearningGaps(courseId, query.parameters.studentId!);
      
      case 'recommend_next':
        return this.recommendNextNodes(courseId, query.parameters.studentId!, query.parameters.context);
      
      case 'analyze_difficulty':
        return this.analyzeDifficultyProgression(graph, query.parameters.sourceId!);
      
      default:
        throw new Error(`Unsupported query type: ${query.type}`);
    }
  }

  // Generate learning path for student
  async generateLearningPath(
    courseId: string,
    studentId: string,
    targetNodeId: string
  ): Promise<LearningPath> {
    const analyzer = await this.getGraphAnalyzer(courseId);
    
    // Get student's completed nodes
    const completedNodes = await this.getStudentCompletedNodes(studentId, courseId);
    
    // Generate optimized learning path
    const learningPath = analyzer.generateLearningPath(studentId, targetNodeId, completedNodes);
    
    // Save learning path to database
    await this.saveLearningPath(learningPath);
    
    return learningPath;
  }

  // Get adaptive recommendations for student
  async getAdaptiveRecommendations(
    courseId: string,
    studentId: string,
    currentNodeId?: string
  ): Promise<{
    recommendedNodes: KnowledgeNode[];
    reasoning: string[];
    difficulty: string;
    estimatedTime: number;
  }> {
    const graph = await this.getKnowledgeGraph(courseId);
    const analyzer = await this.getGraphAnalyzer(courseId);
    
    // Get student progress and performance
    const studentData = await this.getStudentLearningData(studentId, courseId);
    
    // Find suitable next nodes
    const recommendations = await this.findSuitableNextNodes(
      graph,
      studentData,
      currentNodeId
    );
    
    return recommendations;
  }

  // Create concept map visualization
  async createConceptMap(
    courseId: string,
    rootConceptId: string,
    depth = 2
  ): Promise<ConceptMap> {
    const graph = await this.getKnowledgeGraph(courseId);
    
    // Find nodes within specified depth from root
    const includedNodes = this.findNodesAtDepth(graph, rootConceptId, depth);
    
    // Create layout
    const layout = this.createHierarchicalLayout(graph, includedNodes, rootConceptId);
    
    const conceptMap: ConceptMap = {
      id: `map_${courseId}_${rootConceptId}_${Date.now()}`,
      name: `Concept Map: ${graph.nodes.get(rootConceptId)?.title}`,
      rootConceptId,
      includedNodeIds: includedNodes,
      layout,
      visualizations: [],
      interactions: []
    };
    
    return conceptMap;
  }

  // Validate graph structure
  async validateGraph(courseId: string): Promise<GraphValidation> {
    const graph = await this.getKnowledgeGraph(courseId);
    const validation: GraphValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Check for orphaned nodes
    const orphanedNodes = this.findOrphanedNodes(graph);
    if (orphanedNodes.length > 0) {
      validation.warnings.push({
        type: 'orphaned_nodes',
        message: `Found ${orphanedNodes.length} orphaned nodes`,
        affectedNodes: orphanedNodes,
        recommendation: 'Consider connecting these nodes to the main graph'
      });
    }

    // Check for circular dependencies
    const circularDependencies = this.findCircularDependencies(graph);
    if (circularDependencies.length > 0) {
      validation.errors.push({
        type: 'circular_dependency',
        message: 'Circular dependencies detected',
        nodeId: circularDependencies[0],
        severity: 'high'
      });
      validation.isValid = false;
    }

    // Check for missing prerequisites
    const missingPrerequisites = this.findMissingPrerequisites(graph);
    if (missingPrerequisites.length > 0) {
      validation.warnings.push({
        type: 'missing_prerequisites',
        message: `Found ${missingPrerequisites.length} nodes with potential missing prerequisites`,
        affectedNodes: missingPrerequisites,
        recommendation: 'Review prerequisite relationships'
      });
    }

    return validation;
  }

  // Update graph with new information
  async updateGraph(courseId: string, update: GraphUpdate): Promise<void> {
    const graph = await this.getKnowledgeGraph(courseId);
    
    switch (update.type) {
      case 'create_node':
        graph.nodes.set(update.nodeId!, update.data);
        break;
      
      case 'update_node':
        const existingNode = graph.nodes.get(update.nodeId!);
        if (existingNode) {
          Object.assign(existingNode, update.data);
          existingNode.updatedAt = new Date();
        }
        break;
      
      case 'delete_node':
        graph.nodes.delete(update.nodeId!);
        // Remove related edges
        graph.edges.forEach((edge, edgeId) => {
          if (edge.sourceId === update.nodeId || edge.targetId === update.nodeId) {
            graph.edges.delete(edgeId);
          }
        });
        break;
      
      case 'create_edge':
        graph.edges.set(update.edgeId!, update.data);
        break;
      
      case 'update_edge':
        const existingEdge = graph.edges.get(update.edgeId!);
        if (existingEdge) {
          Object.assign(existingEdge, update.data);
          existingEdge.updatedAt = new Date();
        }
        break;
      
      case 'delete_edge':
        graph.edges.delete(update.edgeId!);
        break;
    }

    // Update cache
    this.graphCache.set(courseId, graph);
    await this.saveGraphToCache(courseId, graph);
    
    // Clear analyzer cache to force recalculation
    this.analyzerCache.delete(courseId);
  }

  // Private helper methods
  private async loadGraphFromCache(courseId: string): Promise<KnowledgeGraph | null> {
    try {
      const cached = await redis.get(`knowledge_graph:${courseId}`);
      if (cached) {
        const data = JSON.parse(cached);
        return {
          nodes: new Map(data.nodes),
          edges: new Map(data.edges),
          metadata: data.metadata
        };
      }
    } catch (error) {
      console.error('Failed to load graph from cache:', error);
    }
    return null;
  }

  private async saveGraphToCache(courseId: string, graph: KnowledgeGraph): Promise<void> {
    try {
      const data = {
        nodes: Array.from(graph.nodes.entries()),
        edges: Array.from(graph.edges.entries()),
        metadata: graph.metadata
      };
      
      await redis.setex(
        `knowledge_graph:${courseId}`,
        3600, // 1 hour TTL
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Failed to save graph to cache:', error);
    }
  }

  private findPath(graph: KnowledgeGraph, sourceId: string, targetId: string): string[] {
    // Breadth-first search for shortest path
    const queue = [{ node: sourceId, path: [sourceId] }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { node, path } = queue.shift()!;

      if (node === targetId) {
        return path;
      }

      if (!visited.has(node)) {
        visited.add(node);

        graph.edges.forEach(edge => {
          let nextNode: string | null = null;
          
          if (edge.sourceId === node) {
            nextNode = edge.targetId;
          } else if (edge.targetId === node) {
            nextNode = edge.sourceId;
          }

          if (nextNode && !visited.has(nextNode)) {
            queue.push({ node: nextNode, path: [...path, nextNode] });
          }
        });
      }
    }

    return []; // No path found
  }

  private findPrerequisites(graph: KnowledgeGraph, nodeId: string): string[] {
    const prerequisites: string[] = [];
    const visited = new Set<string>();

    const collectPrerequisites = (currentNodeId: string) => {
      if (visited.has(currentNodeId)) return;
      visited.add(currentNodeId);

      graph.edges.forEach(edge => {
        if (edge.targetId === currentNodeId && edge.type === 'prerequisite') {
          prerequisites.push(edge.sourceId);
          collectPrerequisites(edge.sourceId);
        }
      });
    };

    collectPrerequisites(nodeId);
    return prerequisites;
  }

  private findDependents(graph: KnowledgeGraph, nodeId: string): string[] {
    const dependents: string[] = [];

    graph.edges.forEach(edge => {
      if (edge.sourceId === nodeId && (edge.type === 'prerequisite' || edge.type === 'depends_on')) {
        dependents.push(edge.targetId);
      }
    });

    return dependents;
  }

  private findSimilarNodes(graph: KnowledgeGraph, nodeId: string): KnowledgeNode[] {
    const targetNode = graph.nodes.get(nodeId);
    if (!targetNode) return [];

    const similarNodes: Array<{ node: KnowledgeNode; similarity: number }> = [];

    graph.nodes.forEach(node => {
      if (node.id !== nodeId) {
        const similarity = this.calculateNodeSimilarity(targetNode, node);
        if (similarity > 0.5) {
          similarNodes.push({ node, similarity });
        }
      }
    });

    return similarNodes
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .map(item => item.node);
  }

  private calculateNodeSimilarity(node1: KnowledgeNode, node2: KnowledgeNode): number {
    // Calculate similarity based on metadata
    let similarity = 0;

    // Type similarity
    if (node1.type === node2.type) similarity += 0.3;

    // Difficulty similarity
    const difficultyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const diff1Index = difficultyLevels.indexOf(node1.metadata.difficulty);
    const diff2Index = difficultyLevels.indexOf(node2.metadata.difficulty);
    similarity += Math.max(0, 0.2 - Math.abs(diff1Index - diff2Index) * 0.1);

    // Keyword similarity
    const keywords1 = new Set(node1.metadata.keywords);
    const keywords2 = new Set(node2.metadata.keywords);
    const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
    const union = new Set([...keywords1, ...keywords2]);
    
    if (union.size > 0) {
      similarity += (intersection.size / union.size) * 0.5;
    }

    return Math.min(1, similarity);
  }

  private async findLearningGaps(courseId: string, studentId: string): Promise<any[]> {
    // Find concepts the student should know but doesn't
    const studentProgress = await this.getStudentProgress(studentId, courseId);
    const graph = await this.getKnowledgeGraph(courseId);
    
    const gaps = [];
    
    // Find nodes student is trying to access without prerequisites
    studentProgress.strugglingNodes.forEach(nodeId => {
      const prerequisites = this.findPrerequisites(graph, nodeId);
      const missingPrerequisites = prerequisites.filter(
        prereqId => !studentProgress.completedNodes.includes(prereqId)
      );
      
      if (missingPrerequisites.length > 0) {
        gaps.push({
          nodeId,
          missingPrerequisites,
          severity: missingPrerequisites.length > 2 ? 'high' : 'medium'
        });
      }
    });
    
    return gaps;
  }

  private async recommendNextNodes(
    courseId: string,
    studentId: string,
    context?: string
  ): Promise<KnowledgeNode[]> {
    const graph = await this.getKnowledgeGraph(courseId);
    const studentProgress = await this.getStudentProgress(studentId, courseId);
    
    const recommendations = [];
    
    // Find nodes where all prerequisites are met
    graph.nodes.forEach(node => {
      if (!studentProgress.completedNodes.includes(node.id)) {
        const prerequisites = this.findPrerequisites(graph, node.id);
        const prerequisitesMet = prerequisites.every(
          prereqId => studentProgress.completedNodes.includes(prereqId)
        );
        
        if (prerequisitesMet) {
          recommendations.push(node);
        }
      }
    });
    
    // Sort by difficulty and student performance
    return recommendations
      .sort((a, b) => {
        const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4 };
        return difficultyOrder[a.metadata.difficulty] - difficultyOrder[b.metadata.difficulty];
      })
      .slice(0, 5);
  }

  private analyzeDifficultyProgression(graph: KnowledgeGraph, startNodeId: string): any {
    const startNode = graph.nodes.get(startNodeId);
    if (!startNode) return null;

    const progression = {
      currentDifficulty: startNode.metadata.difficulty,
      nextLevels: this.findNextDifficultyLevels(graph, startNodeId),
      suggestedPath: this.findOptimalDifficultyPath(graph, startNodeId)
    };

    return progression;
  }

  private findNextDifficultyLevels(graph: KnowledgeGraph, nodeId: string): string[] {
    const currentNode = graph.nodes.get(nodeId);
    if (!currentNode) return [];

    const nextNodes = this.findDependents(graph, nodeId);
    const difficulties = nextNodes
      .map(nextNodeId => graph.nodes.get(nextNodeId)?.metadata.difficulty)
      .filter(Boolean);
    
    return [...new Set(difficulties)];
  }

  private findOptimalDifficultyPath(graph: KnowledgeGraph, startNodeId: string): string[] {
    // Find a path that gradually increases difficulty
    const path = [startNodeId];
    const visited = new Set([startNodeId]);
    
    let currentNode = startNodeId;
    const difficultyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    
    while (path.length < 10) { // Limit path length
      const currentDifficulty = graph.nodes.get(currentNode)?.metadata.difficulty;
      const currentIndex = difficultyLevels.indexOf(currentDifficulty || 'beginner');
      
      // Find next node with appropriate difficulty progression
      const nextNodes = this.findDependents(graph, currentNode)
        .filter(nodeId => !visited.has(nodeId))
        .map(nodeId => ({
          id: nodeId,
          difficulty: graph.nodes.get(nodeId)?.metadata.difficulty || 'beginner'
        }))
        .filter(node => {
          const nodeIndex = difficultyLevels.indexOf(node.difficulty);
          return nodeIndex <= currentIndex + 1; // Allow same or one level higher
        });
      
      if (nextNodes.length === 0) break;
      
      // Choose the best next node (prefer gradual progression)
      const bestNext = nextNodes.sort((a, b) => {
        const aIndex = difficultyLevels.indexOf(a.difficulty);
        const bIndex = difficultyLevels.indexOf(b.difficulty);
        return Math.abs(aIndex - currentIndex - 1) - Math.abs(bIndex - currentIndex - 1);
      })[0];
      
      path.push(bestNext.id);
      visited.add(bestNext.id);
      currentNode = bestNext.id;
    }
    
    return path;
  }

  // Helper methods for student data
  private async getStudentCompletedNodes(studentId: string, courseId: string): Promise<string[]> {
    const completedSections = await db.studentInteraction.findMany({
      where: {
        studentId,
        courseId,
        eventName: 'section_complete'
      },
      distinct: ['sectionId']
    });

    return completedSections
      .map(interaction => `lesson_${interaction.sectionId}`)
      .filter(Boolean);
  }

  private async getStudentLearningData(studentId: string, courseId: string): Promise<any> {
    const [interactions, metrics, flags] = await Promise.all([
      db.studentInteraction.findMany({
        where: { studentId, courseId },
        orderBy: { timestamp: 'desc' },
        take: 100
      }),
      db.learningMetric.findMany({
        where: { studentId, courseId },
        orderBy: { date: 'desc' },
        take: 7 // Last 7 days
      }),
      db.contentFlag.findMany({
        where: {
          flagType: 'struggle_point',
          metadata: {
            path: ['studentId'],
            equals: studentId
          }
        }
      })
    ]);

    return {
      interactions,
      metrics,
      strugglingContent: flags.map(f => f.contentId),
      averageEngagement: metrics.reduce((sum, m) => sum + m.engagementScore, 0) / metrics.length || 0,
      learningVelocity: this.calculateLearningVelocity(interactions)
    };
  }

  private async getStudentProgress(studentId: string, courseId: string): Promise<any> {
    const completedNodes = await this.getStudentCompletedNodes(studentId, courseId);
    
    const strugglingFlags = await db.contentFlag.findMany({
      where: {
        flagType: 'struggle_point',
        metadata: {
          path: ['studentId'],
          equals: studentId
        }
      }
    });

    return {
      completedNodes,
      strugglingNodes: strugglingFlags.map(f => `lesson_${f.contentId}`)
    };
  }

  private calculateLearningVelocity(interactions: any[]): number {
    if (interactions.length < 2) return 0;
    
    const timeSpan = new Date(interactions[0].timestamp).getTime() - 
                    new Date(interactions[interactions.length - 1].timestamp).getTime();
    const days = timeSpan / (1000 * 60 * 60 * 24);
    
    return days > 0 ? interactions.length / days : 0;
  }

  // Validation helpers
  private findOrphanedNodes(graph: KnowledgeGraph): string[] {
    const connectedNodes = new Set<string>();
    
    graph.edges.forEach(edge => {
      connectedNodes.add(edge.sourceId);
      connectedNodes.add(edge.targetId);
    });
    
    const orphanedNodes: string[] = [];
    graph.nodes.forEach((node, nodeId) => {
      if (!connectedNodes.has(nodeId)) {
        orphanedNodes.push(nodeId);
      }
    });
    
    return orphanedNodes;
  }

  private findCircularDependencies(graph: KnowledgeGraph): string[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;
      
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      // Check prerequisite edges
      const dependentEdges = Array.from(graph.edges.values())
        .filter(edge => edge.sourceId === nodeId && edge.type === 'prerequisite');
      
      for (const edge of dependentEdges) {
        if (hasCycle(edge.targetId)) {
          return true;
        }
      }
      
      recursionStack.delete(nodeId);
      return false;
    };
    
    const cyclicNodes: string[] = [];
    graph.nodes.forEach((node, nodeId) => {
      if (!visited.has(nodeId) && hasCycle(nodeId)) {
        cyclicNodes.push(nodeId);
      }
    });
    
    return cyclicNodes;
  }

  private findMissingPrerequisites(graph: KnowledgeGraph): string[] {
    const missingPrereqs: string[] = [];
    
    graph.nodes.forEach((node, nodeId) => {
      if (node.metadata.difficulty !== 'beginner') {
        const explicitPrereqs = Array.from(graph.edges.values())
          .filter(edge => edge.targetId === nodeId && edge.type === 'prerequisite')
          .length;
        
        if (explicitPrereqs === 0) {
          missingPrereqs.push(nodeId);
        }
      }
    });
    
    return missingPrereqs;
  }

  // Layout helpers
  private findNodesAtDepth(graph: KnowledgeGraph, rootId: string, maxDepth: number): string[] {
    const nodes = new Set<string>([rootId]);
    const queue = [{ nodeId: rootId, depth: 0 }];
    const visited = new Set<string>([rootId]);

    while (queue.length > 0) {
      const { nodeId, depth } = queue.shift()!;
      
      if (depth >= maxDepth) continue;

      graph.edges.forEach(edge => {
        let nextNode: string | null = null;
        
        if (edge.sourceId === nodeId) {
          nextNode = edge.targetId;
        } else if (edge.targetId === nodeId) {
          nextNode = edge.sourceId;
        }

        if (nextNode && !visited.has(nextNode)) {
          visited.add(nextNode);
          nodes.add(nextNode);
          queue.push({ nodeId: nextNode, depth: depth + 1 });
        }
      });
    }

    return Array.from(nodes);
  }

  private createHierarchicalLayout(graph: KnowledgeGraph, nodeIds: string[], rootId: string): any {
    // Create a simple hierarchical layout
    const positions: Record<string, { x: number; y: number }> = {};
    const levels = new Map<string, number>();
    
    // Assign levels using BFS
    const queue = [{ nodeId: rootId, level: 0 }];
    const visited = new Set<string>([rootId]);
    levels.set(rootId, 0);
    
    while (queue.length > 0) {
      const { nodeId, level } = queue.shift()!;
      
      graph.edges.forEach(edge => {
        let nextNode: string | null = null;
        
        if (edge.sourceId === nodeId && nodeIds.includes(edge.targetId)) {
          nextNode = edge.targetId;
        }
        
        if (nextNode && !visited.has(nextNode)) {
          visited.add(nextNode);
          levels.set(nextNode, level + 1);
          queue.push({ nodeId: nextNode, level: level + 1 });
        }
      });
    }
    
    // Calculate positions
    const levelGroups = new Map<number, string[]>();
    levels.forEach((level, nodeId) => {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(nodeId);
    });
    
    levelGroups.forEach((nodes, level) => {
      const y = level * 100;
      const spacing = 800 / (nodes.length + 1);
      
      nodes.forEach((nodeId, index) => {
        positions[nodeId] = {
          x: (index + 1) * spacing - 400,
          y
        };
      });
    });

    return {
      type: 'hierarchical' as const,
      parameters: { rootId, maxDepth: Math.max(...levels.values()) },
      positions,
      clusters: []
    };
  }

  private async saveLearningPath(learningPath: LearningPath): Promise<void> {
    // In a real implementation, save to database
    console.log('Saving learning path:', learningPath.id);
  }

  private async findSuitableNextNodes(
    graph: KnowledgeGraph,
    studentData: any,
    currentNodeId?: string
  ): Promise<any> {
    // Implementation for finding suitable next nodes based on student data
    return {
      recommendedNodes: [],
      reasoning: ['Based on your current progress'],
      difficulty: 'intermediate',
      estimatedTime: 60
    };
  }
}