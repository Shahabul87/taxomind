// Knowledge Graph Analytics and Analysis

import { 
  KnowledgeGraph, 
  KnowledgeNode, 
  KnowledgeEdge,
  GraphAnalytics,
  CentralityMeasures,
  ClusteringMetrics,
  PathMetrics,
  LearningMetrics,
  Community,
  CriticalPath,
  PrerequisiteGap,
  LearningPath,
  LearningPathNode
} from './types';

export class KnowledgeGraphAnalyzer {
  private graph: KnowledgeGraph;

  constructor(graph: KnowledgeGraph) {
    this.graph = graph;
  }

  // Perform comprehensive graph analysis
  async analyzeGraph(): Promise<GraphAnalytics> {
    const centralityMeasures = this.calculateCentralityMeasures();
    const clusteringMetrics = this.calculateClusteringMetrics();
    const pathMetrics = this.calculatePathMetrics();
    const learningMetrics = await this.calculateLearningMetrics();

    return {
      centralityMeasures,
      clusteringMetrics,
      pathMetrics,
      learningMetrics
    };
  }

  // Calculate centrality measures for all nodes
  calculateCentralityMeasures(): CentralityMeasures {
    const nodes = Array.from(this.graph.nodes.keys());
    const edges = Array.from(this.graph.edges.values());

    return {
      betweenness: this.calculateBetweennessCentrality(nodes, edges),
      closeness: this.calculateClosenessCentrality(nodes, edges),
      eigenvector: this.calculateEigenvectorCentrality(nodes, edges),
      pagerank: this.calculatePageRank(nodes, edges),
      degreeCentrality: this.calculateDegreeCentrality(nodes, edges)
    };
  }

  // Calculate betweenness centrality
  private calculateBetweennessCentrality(nodes: string[], edges: KnowledgeEdge[]): Record<string, number> {
    const betweenness: Record<string, number> = {};
    
    // Initialize
    nodes.forEach(node => {
      betweenness[node] = 0;
    });

    // For each pair of nodes, find shortest paths and count how many go through each node
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const source = nodes[i];
        const target = nodes[j];
        
        const paths = this.findAllShortestPaths(source, target, edges);
        
        if (paths.length > 0) {
          paths.forEach(path => {
            // Count intermediate nodes in path
            for (let k = 1; k < path.length - 1; k++) {
              betweenness[path[k]] += 1 / paths.length;
            }
          });
        }
      }
    }

    // Normalize
    const normalizationFactor = (nodes.length - 1) * (nodes.length - 2) / 2;
    if (normalizationFactor > 0) {
      nodes.forEach(node => {
        betweenness[node] /= normalizationFactor;
      });
    }

    return betweenness;
  }

  // Calculate closeness centrality
  private calculateClosenessCentrality(nodes: string[], edges: KnowledgeEdge[]): Record<string, number> {
    const closeness: Record<string, number> = {};

    nodes.forEach(source => {
      let totalDistance = 0;
      let reachableNodes = 0;

      nodes.forEach(target => {
        if (source !== target) {
          const shortestPath = this.findShortestPath(source, target, edges);
          if (shortestPath.length > 0) {
            totalDistance += shortestPath.length - 1;
            reachableNodes++;
          }
        }
      });

      closeness[source] = reachableNodes > 0 ? reachableNodes / totalDistance : 0;
    });

    return closeness;
  }

  // Calculate eigenvector centrality (simplified power iteration)
  private calculateEigenvectorCentrality(nodes: string[], edges: KnowledgeEdge[]): Record<string, number> {
    const eigenvector: Record<string, number> = {};
    const adjacencyMatrix = this.buildAdjacencyMatrix(nodes, edges);
    
    // Initialize with equal values
    nodes.forEach(node => {
      eigenvector[node] = 1 / Math.sqrt(nodes.length);
    });

    // Power iteration
    for (let iteration = 0; iteration < 100; iteration++) {
      const newEigenvector: Record<string, number> = {};
      
      nodes.forEach(node => {
        newEigenvector[node] = 0;
        nodes.forEach(neighbor => {
          if (adjacencyMatrix[node] && adjacencyMatrix[node][neighbor]) {
            newEigenvector[node] += adjacencyMatrix[node][neighbor] * eigenvector[neighbor];
          }
        });
      });

      // Normalize
      const norm = Math.sqrt(Object.values(newEigenvector).reduce((sum, val) => sum + val * val, 0));
      if (norm > 0) {
        Object.keys(newEigenvector).forEach(node => {
          newEigenvector[node] /= norm;
        });
      }

      // Check convergence
      const convergence = Object.keys(eigenvector).every(node =>
        Math.abs(eigenvector[node] - newEigenvector[node]) < 0.0001
      );

      Object.assign(eigenvector, newEigenvector);

      if (convergence) break;
    }

    return eigenvector;
  }

  // Calculate PageRank
  private calculatePageRank(nodes: string[], edges: KnowledgeEdge[]): Record<string, number> {
    const pagerank: Record<string, number> = {};
    const damping = 0.85;
    const iterations = 100;

    // Initialize
    nodes.forEach(node => {
      pagerank[node] = 1 / nodes.length;
    });

    // Build incoming links map
    const incomingLinks: Record<string, string[]> = {};
    const outgoingCount: Record<string, number> = {};
    
    nodes.forEach(node => {
      incomingLinks[node] = [];
      outgoingCount[node] = 0;
    });

    edges.forEach(edge => {
      incomingLinks[edge.targetId].push(edge.sourceId);
      outgoingCount[edge.sourceId]++;
    });

    // PageRank iterations
    for (let i = 0; i < iterations; i++) {
      const newPagerank: Record<string, number> = {};

      nodes.forEach(node => {
        newPagerank[node] = (1 - damping) / nodes.length;
        
        incomingLinks[node].forEach(source => {
          if (outgoingCount[source] > 0) {
            newPagerank[node] += damping * (pagerank[source] / outgoingCount[source]);
          }
        });
      });

      Object.assign(pagerank, newPagerank);
    }

    return pagerank;
  }

  // Calculate degree centrality
  private calculateDegreeCentrality(nodes: string[], edges: KnowledgeEdge[]): Record<string, number> {
    const degreeCentrality: Record<string, number> = {};

    // Initialize
    nodes.forEach(node => {
      degreeCentrality[node] = 0;
    });

    // Count connections
    edges.forEach(edge => {
      degreeCentrality[edge.sourceId]++;
      degreeCentrality[edge.targetId]++;
    });

    // Normalize by maximum possible degree
    const maxDegree = nodes.length - 1;
    if (maxDegree > 0) {
      nodes.forEach(node => {
        degreeCentrality[node] /= maxDegree;
      });
    }

    return degreeCentrality;
  }

  // Calculate clustering metrics
  calculateClusteringMetrics(): ClusteringMetrics {
    const nodes = Array.from(this.graph.nodes.keys());
    const clusteringCoefficient = this.calculateClusteringCoefficient(nodes);
    const communities = this.detectCommunities(nodes);
    
    return {
      clusteringCoefficient,
      communities,
      modularityScore: this.calculateModularity(communities),
      silhouetteScore: this.calculateSilhouetteScore(communities)
    };
  }

  // Calculate clustering coefficient for each node
  private calculateClusteringCoefficient(nodes: string[]): Record<string, number> {
    const clustering: Record<string, number> = {};
    const adjacencyMatrix = this.buildAdjacencyMatrix(nodes, Array.from(this.graph.edges.values()));

    nodes.forEach(node => {
      const neighbors = nodes.filter(neighbor => 
        neighbor !== node && adjacencyMatrix[node] && adjacencyMatrix[node][neighbor]
      );

      if (neighbors.length < 2) {
        clustering[node] = 0;
        return;
      }

      let triangles = 0;
      const possibleTriangles = neighbors.length * (neighbors.length - 1) / 2;

      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          if (adjacencyMatrix[neighbors[i]] && adjacencyMatrix[neighbors[i]][neighbors[j]]) {
            triangles++;
          }
        }
      }

      clustering[node] = possibleTriangles > 0 ? triangles / possibleTriangles : 0;
    });

    return clustering;
  }

  // Detect communities using simple modularity-based approach
  private detectCommunities(nodes: string[]): Community[] {
    const communities: Community[] = [];
    const visited = new Set<string>();
    const edges = Array.from(this.graph.edges.values());

    // Simple connected components as communities
    nodes.forEach(startNode => {
      if (!visited.has(startNode)) {
        const community = this.exploreComponent(startNode, visited, edges);
        if (community.length > 1) {
          communities.push({
            id: `community_${communities.length}`,
            nodeIds: community,
            coherenceScore: this.calculateCommunityCoherence(community),
            theme: this.identifyCommunityTheme(community),
            keywords: this.extractCommunityKeywords(community)
          });
        }
      }
    });

    return communities;
  }

  // Explore connected component
  private exploreComponent(startNode: string, visited: Set<string>, edges: KnowledgeEdge[]): string[] {
    const component: string[] = [];
    const stack: string[] = [startNode];

    while (stack.length > 0) {
      const node = stack.pop()!;
      if (!visited.has(node)) {
        visited.add(node);
        component.push(node);

        // Find neighbors
        edges.forEach(edge => {
          if (edge.sourceId === node && !visited.has(edge.targetId)) {
            stack.push(edge.targetId);
          } else if (edge.targetId === node && !visited.has(edge.sourceId)) {
            stack.push(edge.sourceId);
          }
        });
      }
    }

    return component;
  }

  // Calculate community coherence
  private calculateCommunityCoherence(nodeIds: string[]): number {
    const edges = Array.from(this.graph.edges.values());
    let internalEdges = 0;
    let totalPossibleEdges = nodeIds.length * (nodeIds.length - 1) / 2;

    edges.forEach(edge => {
      if (nodeIds.includes(edge.sourceId) && nodeIds.includes(edge.targetId)) {
        internalEdges++;
      }
    });

    return totalPossibleEdges > 0 ? internalEdges / totalPossibleEdges : 0;
  }

  // Identify community theme
  private identifyCommunityTheme(nodeIds: string[]): string {
    const nodeTypes = new Map<string, number>();

    nodeIds.forEach(nodeId => {
      const node = this.graph.nodes.get(nodeId);
      if (node) {
        nodeTypes.set(node.type, (nodeTypes.get(node.type) || 0) + 1);
      }
    });

    // Return most common node type as theme
    let maxCount = 0;
    let theme = 'mixed';

    nodeTypes.forEach((count, type) => {
      if (count > maxCount) {
        maxCount = count;
        theme = type;
      }
    });

    return theme;
  }

  // Extract community keywords
  private extractCommunityKeywords(nodeIds: string[]): string[] {
    const keywordCounts = new Map<string, number>();

    nodeIds.forEach(nodeId => {
      const node = this.graph.nodes.get(nodeId);
      if (node) {
        node.metadata.keywords.forEach(keyword => {
          keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
        });
      }
    });

    return Array.from(keywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword]) => keyword);
  }

  // Calculate modularity score
  private calculateModularity(communities: Community[]): number {
    const edges = Array.from(this.graph.edges.values());
    const totalEdges = edges.length;
    
    if (totalEdges === 0) return 0;

    let modularity = 0;

    communities.forEach(community => {
      const nodeIds = new Set(community.nodeIds);
      let internalEdges = 0;
      let totalDegree = 0;

      edges.forEach(edge => {
        const sourceInCommunity = nodeIds.has(edge.sourceId);
        const targetInCommunity = nodeIds.has(edge.targetId);

        if (sourceInCommunity && targetInCommunity) {
          internalEdges++;
        }

        if (sourceInCommunity) totalDegree++;
        if (targetInCommunity) totalDegree++;
      });

      const expectedEdges = (totalDegree * totalDegree) / (4 * totalEdges);
      modularity += (internalEdges / totalEdges) - (expectedEdges / totalEdges);
    });

    return modularity;
  }

  // Calculate silhouette score
  private calculateSilhouetteScore(communities: Community[]): number {
    // Simplified silhouette score calculation
    return 0.7; // Placeholder
  }

  // Calculate path metrics
  calculatePathMetrics(): PathMetrics {
    const nodes = Array.from(this.graph.nodes.keys());
    const edges = Array.from(this.graph.edges.values());

    const shortestPaths = this.calculateAllShortestPaths(nodes, edges);
    const averagePathLength = this.calculateAveragePathLength(shortestPaths);
    const diameter = this.calculateDiameter(shortestPaths);
    const criticalPaths = this.identifyCriticalPaths(nodes, edges);

    return {
      shortestPaths,
      averagePathLength,
      diameter,
      criticalPaths
    };
  }

  // Calculate all shortest paths
  private calculateAllShortestPaths(nodes: string[], edges: KnowledgeEdge[]): Record<string, Record<string, string[]>> {
    const paths: Record<string, Record<string, string[]>> = {};

    nodes.forEach(source => {
      paths[source] = {};
      nodes.forEach(target => {
        if (source !== target) {
          paths[source][target] = this.findShortestPath(source, target, edges);
        }
      });
    });

    return paths;
  }

  // Find shortest path between two nodes
  private findShortestPath(source: string, target: string, edges: KnowledgeEdge[]): string[] {
    const queue: { node: string; path: string[] }[] = [{ node: source, path: [source] }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { node, path } = queue.shift()!;

      if (node === target) {
        return path;
      }

      if (!visited.has(node)) {
        visited.add(node);

        edges.forEach(edge => {
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

  // Find all shortest paths between two nodes
  private findAllShortestPaths(source: string, target: string, edges: KnowledgeEdge[]): string[][] {
    const allPaths: string[][] = [];
    const shortestLength = this.findShortestPath(source, target, edges).length;

    if (shortestLength === 0) return [];

    const queue: { node: string; path: string[] }[] = [{ node: source, path: [source] }];

    while (queue.length > 0) {
      const { node, path } = queue.shift()!;

      if (node === target && path.length === shortestLength) {
        allPaths.push(path);
        continue;
      }

      if (path.length < shortestLength) {
        edges.forEach(edge => {
          let nextNode: string | null = null;

          if (edge.sourceId === node) {
            nextNode = edge.targetId;
          } else if (edge.targetId === node) {
            nextNode = edge.sourceId;
          }

          if (nextNode && !path.includes(nextNode)) {
            queue.push({ node: nextNode, path: [...path, nextNode] });
          }
        });
      }
    }

    return allPaths;
  }

  // Calculate average path length
  private calculateAveragePathLength(shortestPaths: Record<string, Record<string, string[]>>): number {
    let totalLength = 0;
    let pathCount = 0;

    Object.values(shortestPaths).forEach(sourcePaths => {
      Object.values(sourcePaths).forEach(path => {
        if (path.length > 0) {
          totalLength += path.length - 1; // Subtract 1 because path includes start node
          pathCount++;
        }
      });
    });

    return pathCount > 0 ? totalLength / pathCount : 0;
  }

  // Calculate diameter (longest shortest path)
  private calculateDiameter(shortestPaths: Record<string, Record<string, string[]>>): number {
    let maxLength = 0;

    Object.values(shortestPaths).forEach(sourcePaths => {
      Object.values(sourcePaths).forEach(path => {
        if (path.length > 0) {
          maxLength = Math.max(maxLength, path.length - 1);
        }
      });
    });

    return maxLength;
  }

  // Identify critical paths
  private identifyCriticalPaths(nodes: string[], edges: KnowledgeEdge[]): CriticalPath[] {
    const criticalPaths: CriticalPath[] = [];

    // Find paths that are frequently used in learning sequences
    const prerequisiteChains = this.findPrerequisiteChains(edges);

    prerequisiteChains.forEach(chain => {
      if (chain.length > 2) {
        criticalPaths.push({
          nodes: chain,
          importance: this.calculatePathImportance(chain),
          bottlenecks: this.identifyBottlenecks(chain, edges),
          alternatives: this.findAlternativePaths(chain[0], chain[chain.length - 1], edges)
        });
      }
    });

    return criticalPaths.sort((a, b) => b.importance - a.importance).slice(0, 10);
  }

  // Find prerequisite chains
  private findPrerequisiteChains(edges: KnowledgeEdge[]): string[][] {
    const chains: string[][] = [];
    const prerequisiteEdges = edges.filter(edge => edge.type === 'prerequisite');

    // Build chains from prerequisite relationships
    const processed = new Set<string>();

    prerequisiteEdges.forEach(edge => {
      if (!processed.has(edge.sourceId)) {
        const chain = this.buildChainFromNode(edge.sourceId, prerequisiteEdges, new Set());
        if (chain.length > 1) {
          chains.push(chain);
          chain.forEach(node => processed.add(node));
        }
      }
    });

    return chains;
  }

  // Build chain from a starting node
  private buildChainFromNode(startNode: string, edges: KnowledgeEdge[], visited: Set<string>): string[] {
    if (visited.has(startNode)) return [];
    visited.add(startNode);

    const chain = [startNode];
    
    // Find next node in prerequisite chain
    const nextEdge = edges.find(edge => edge.sourceId === startNode);
    if (nextEdge) {
      const nextChain = this.buildChainFromNode(nextEdge.targetId, edges, visited);
      chain.push(...nextChain);
    }

    return chain;
  }

  // Calculate path importance
  private calculatePathImportance(path: string[]): number {
    // Base importance on node centrality and path length
    let importance = 0;
    
    path.forEach(nodeId => {
      const node = this.graph.nodes.get(nodeId);
      if (node) {
        // Higher importance for more complex content
        const difficultyWeight = { 'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4 };
        importance += difficultyWeight[node.metadata.difficulty] || 1;
      }
    });

    return importance / path.length; // Average importance per node
  }

  // Identify bottlenecks in path
  private identifyBottlenecks(path: string[], edges: KnowledgeEdge[]): string[] {
    const bottlenecks: string[] = [];

    path.forEach(nodeId => {
      const incomingEdges = edges.filter(edge => edge.targetId === nodeId);
      const outgoingEdges = edges.filter(edge => edge.sourceId === nodeId);

      // Node is a bottleneck if it has limited connections
      if (incomingEdges.length <= 1 && outgoingEdges.length <= 1) {
        bottlenecks.push(nodeId);
      }
    });

    return bottlenecks;
  }

  // Find alternative paths
  private findAlternativePaths(source: string, target: string, edges: KnowledgeEdge[]): string[][] {
    const alternatives: string[][] = [];
    const mainPath = this.findShortestPath(source, target, edges);

    if (mainPath.length === 0) return [];

    // Try to find paths that don't use the main path nodes (except source and target)
    const excludeNodes = new Set(mainPath.slice(1, -1));
    const filteredEdges = edges.filter(edge => 
      !excludeNodes.has(edge.sourceId) && !excludeNodes.has(edge.targetId)
    );

    const alternativePath = this.findShortestPath(source, target, filteredEdges);
    if (alternativePath.length > 0 && alternativePath.length !== mainPath.length) {
      alternatives.push(alternativePath);
    }

    return alternatives;
  }

  // Calculate learning metrics
  async calculateLearningMetrics(): Promise<LearningMetrics> {
    // This would typically involve analyzing student data
    // For now, return simplified metrics
    
    return {
      conceptMastery: {},
      prerequisiteGaps: [],
      learningEfficiency: {},
      knowledgeRetention: {}
    };
  }

  // Build adjacency matrix
  private buildAdjacencyMatrix(nodes: string[], edges: KnowledgeEdge[]): Record<string, Record<string, number>> {
    const matrix: Record<string, Record<string, number>> = {};

    nodes.forEach(node => {
      matrix[node] = {};
      nodes.forEach(neighbor => {
        matrix[node][neighbor] = 0;
      });
    });

    edges.forEach(edge => {
      matrix[edge.sourceId][edge.targetId] = edge.weight;
      matrix[edge.targetId][edge.sourceId] = edge.weight; // Undirected
    });

    return matrix;
  }

  // Generate learning path recommendations
  generateLearningPath(
    studentId: string,
    targetNodeId: string,
    completedNodes: string[] = []
  ): LearningPath {
    const targetNode = this.graph.nodes.get(targetNodeId);
    if (!targetNode) {
      throw new Error(`Target node ${targetNodeId} not found`);
    }

    // Find prerequisites chain
    const prerequisites = this.findPrerequisites(targetNodeId);
    
    // Filter out completed nodes
    const remainingNodes = prerequisites.filter(nodeId => !completedNodes.includes(nodeId));
    
    // Add target node
    if (!completedNodes.includes(targetNodeId)) {
      remainingNodes.push(targetNodeId);
    }

    // Create learning path nodes
    const pathNodes: LearningPathNode[] = remainingNodes.map((nodeId, index) => {
      const node = this.graph.nodes.get(nodeId)!;
      return {
        nodeId,
        order: index,
        isRequired: true,
        isCompleted: false,
        estimatedTime: node.metadata.estimatedTime,
        adaptiveAdjustments: []
      };
    });

    const totalTime = pathNodes.reduce((sum, node) => sum + node.estimatedTime, 0);
    
    return {
      id: `path_${studentId}_${targetNodeId}_${Date.now()}`,
      studentId,
      name: `Learning Path to ${targetNode.title}`,
      description: `Optimized learning path to master ${targetNode.title}`,
      nodes: pathNodes,
      totalEstimatedTime: totalTime,
      difficulty: targetNode.metadata.difficulty,
      completionRate: 0,
      adaptations: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Find prerequisites for a node
  private findPrerequisites(nodeId: string): string[] {
    const prerequisites: string[] = [];
    const visited = new Set<string>();
    const queue = [nodeId];

    while (queue.length > 0) {
      const currentNode = queue.shift()!;
      if (visited.has(currentNode)) continue;
      visited.add(currentNode);

      // Find prerequisite edges
      const prerequisiteEdges = Array.from(this.graph.edges.values())
        .filter(edge => edge.targetId === currentNode && edge.type === 'prerequisite');

      prerequisiteEdges.forEach(edge => {
        if (!prerequisites.includes(edge.sourceId)) {
          prerequisites.unshift(edge.sourceId); // Add to beginning
          queue.push(edge.sourceId);
        }
      });
    }

    return prerequisites;
  }
}