/**
 * SAM AI - Prerequisite Graph API
 *
 * Provides course and skill prerequisite dependencies visualization.
 * Shows learning pathways, dependency chains, and optimal learning order.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { getStore, getLearningPathStores } from '@/lib/sam/taxomind-context';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetPrerequisiteGraphSchema = z.object({
  courseId: z.string().uuid().optional(),
  skillId: z.string().uuid().optional(),
  depth: z.coerce.number().min(1).max(5).optional().default(3),
  includeUserProgress: z.coerce.boolean().optional().default(true),
});

// ============================================================================
// TYPES
// ============================================================================

interface GraphNode {
  id: string;
  name: string;
  type: 'course' | 'chapter' | 'section' | 'skill' | 'concept';
  difficulty: string;
  estimatedMinutes?: number;
  userProgress?: {
    completed: boolean;
    masteryLevel?: number;
    lastAccessed?: Date;
  };
  metadata?: Record<string, unknown>;
}

interface GraphEdge {
  from: string;
  to: string;
  importance: 'required' | 'recommended' | 'optional';
  description?: string;
}

interface LearningPath {
  nodes: GraphNode[];
  suggestedOrder: string[];
  totalEstimatedMinutes: number;
  completedCount: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function topologicalSort(nodes: GraphNode[], edges: GraphEdge[]): string[] {
  const inDegree = new Map<string, number>();
  const adjacencyList = new Map<string, string[]>();

  // Initialize
  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacencyList.set(node.id, []);
  }

  // Build adjacency list and calculate in-degrees
  for (const edge of edges) {
    const neighbors = adjacencyList.get(edge.from) || [];
    neighbors.push(edge.to);
    adjacencyList.set(edge.from, neighbors);
    inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
  }

  // Find all nodes with no incoming edges
  const queue: string[] = [];
  const inDegreeEntries = Array.from(inDegree.entries());
  for (const [nodeId, degree] of inDegreeEntries) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  const sortedOrder: string[] = [];

  while (queue.length > 0) {
    // Sort queue by difficulty to prefer easier concepts first
    queue.sort((a, b) => {
      const nodeA = nodes.find((n) => n.id === a);
      const nodeB = nodes.find((n) => n.id === b);
      const difficultyOrder: Record<string, number> = {
        beginner: 0,
        intermediate: 1,
        advanced: 2,
        expert: 3,
      };
      return (
        (difficultyOrder[nodeA?.difficulty || 'intermediate'] || 1) -
        (difficultyOrder[nodeB?.difficulty || 'intermediate'] || 1)
      );
    });

    const current = queue.shift()!;
    sortedOrder.push(current);

    const neighbors = adjacencyList.get(current) || [];
    for (const neighbor of neighbors) {
      inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }

  return sortedOrder;
}

function buildSkillPrerequisiteGraph(
  skillId: string,
  skills: Map<string, { name: string; prerequisites: string[]; difficulty: number }>,
  depth: number,
  visited: Set<string> = new Set()
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (depth <= 0 || visited.has(skillId)) {
    return { nodes: [], edges: [] };
  }

  visited.add(skillId);
  const skill = skills.get(skillId);
  if (!skill) {
    return { nodes: [], edges: [] };
  }

  const nodes: GraphNode[] = [
    {
      id: `skill-${skillId}`,
      name: skill.name,
      type: 'skill',
      difficulty: skill.difficulty <= 3 ? 'beginner' : skill.difficulty <= 6 ? 'intermediate' : 'advanced',
    },
  ];
  const edges: GraphEdge[] = [];

  for (const prereqId of skill.prerequisites) {
    edges.push({
      from: `skill-${prereqId}`,
      to: `skill-${skillId}`,
      importance: 'required',
    });

    const subGraph = buildSkillPrerequisiteGraph(prereqId, skills, depth - 1, visited);
    nodes.push(...subGraph.nodes);
    edges.push(...subGraph.edges);
  }

  return { nodes, edges };
}

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * GET - Get prerequisite graph for a course or skill
 */
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const validatedParams = GetPrerequisiteGraphSchema.parse({
      courseId: searchParams.get('courseId') || undefined,
      skillId: searchParams.get('skillId') || undefined,
      depth: searchParams.get('depth') || '3',
      includeUserProgress: searchParams.get('includeUserProgress') || 'true',
    });

    if (!validatedParams.courseId && !validatedParams.skillId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Either courseId or skillId is required' },
        },
        { status: 400 }
      );
    }

    const { courseGraph } = getLearningPathStores();
    const skillBuildTrackStore = getStore('skillBuildTrack');

    let nodes: GraphNode[] = [];
    let edges: GraphEdge[] = [];

    // Get course-based graph
    if (validatedParams.courseId) {
      const graph = await courseGraph.getCourseGraph(validatedParams.courseId);

      if (!graph) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Course not found' } },
          { status: 404 }
        );
      }

      // Convert course graph to our node/edge format
      nodes = graph.concepts.map((concept) => ({
        id: concept.id,
        name: concept.name,
        type: (concept.id.startsWith('chapter-')
          ? 'chapter'
          : concept.id.startsWith('section-')
            ? 'section'
            : concept.id.startsWith('skill-')
              ? 'skill'
              : 'concept') as GraphNode['type'],
        difficulty: concept.difficulty,
        estimatedMinutes: concept.estimatedMinutes,
      }));

      edges = graph.prerequisites.map((prereq) => ({
        from: prereq.requiresConceptId,
        to: prereq.conceptId,
        importance: prereq.importance,
      }));
    }

    // Get skill-based graph
    if (validatedParams.skillId) {
      // Get all skills for prerequisite lookup
      const skillDefinitions = await skillBuildTrackStore.getSkillDefinitions();
      const skillsMap = new Map<string, { name: string; prerequisites: string[]; difficulty: number }>(
        skillDefinitions.map((s) => [
          s.id,
          { name: s.name, prerequisites: s.prerequisites ?? [], difficulty: s.learningCurve.difficultyFactor },
        ])
      );

      const skillGraph = buildSkillPrerequisiteGraph(
        validatedParams.skillId,
        skillsMap,
        validatedParams.depth
      );

      // Merge with existing nodes/edges if course was also specified
      const existingNodeIds = new Set(nodes.map((n) => n.id));
      for (const node of skillGraph.nodes) {
        if (!existingNodeIds.has(node.id)) {
          nodes.push(node);
        }
      }
      edges.push(...skillGraph.edges);
    }

    // Add user progress if requested
    if (validatedParams.includeUserProgress && nodes.length > 0) {
      const userProfiles = await skillBuildTrackStore.getUserSkillProfiles(user.id);

      // Create a type-safe map
      interface SkillProfile {
        skillId: string;
        compositeScore: number;
        lastPracticedAt?: Date;
      }
      const profileMap = new Map<string, SkillProfile>();
      for (const p of userProfiles) {
        profileMap.set(p.skillId, {
          skillId: p.skillId,
          compositeScore: p.compositeScore,
          lastPracticedAt: p.lastPracticedAt,
        });
      }

      nodes = nodes.map((node) => {
        if (node.type === 'skill') {
          const skillId = node.id.replace('skill-', '');
          const profile = profileMap.get(skillId);
          if (profile) {
            return {
              ...node,
              userProgress: {
                completed: profile.compositeScore >= 80,
                masteryLevel: profile.compositeScore,
                lastAccessed: profile.lastPracticedAt,
              },
            };
          }
        }
        return node;
      });
    }

    // Remove duplicate edges
    const edgeSet = new Set<string>();
    edges = edges.filter((edge) => {
      const key = `${edge.from}->${edge.to}`;
      if (edgeSet.has(key)) return false;
      edgeSet.add(key);
      return true;
    });

    // Calculate suggested learning order using topological sort
    const suggestedOrder = topologicalSort(nodes, edges);

    // Build learning path with stats
    const completedNodes = nodes.filter((n) => n.userProgress?.completed);
    const totalEstimatedMinutes = nodes.reduce((sum, n) => sum + (n.estimatedMinutes || 0), 0);

    const learningPath: LearningPath = {
      nodes,
      suggestedOrder,
      totalEstimatedMinutes,
      completedCount: completedNodes.length,
    };

    // Find critical path (longest dependency chain)
    const nodeDepths = new Map<string, number>();
    for (const nodeId of suggestedOrder) {
      let maxParentDepth = -1;
      for (const edge of edges) {
        if (edge.to === nodeId && nodeDepths.has(edge.from)) {
          maxParentDepth = Math.max(maxParentDepth, nodeDepths.get(edge.from)!);
        }
      }
      nodeDepths.set(nodeId, maxParentDepth + 1);
    }

    const depthValues = Array.from(nodeDepths.values());
    const maxDepth = depthValues.length > 0 ? Math.max(...depthValues) : 0;
    const criticalPath = suggestedOrder.filter((id) => nodeDepths.get(id) === maxDepth);

    // Calculate graph statistics
    const stats = {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      completedCount: completedNodes.length,
      completionPercentage:
        nodes.length > 0 ? Math.round((completedNodes.length / nodes.length) * 100) : 0,
      maxDepth,
      criticalPathLength: criticalPath.length,
      nodesByType: nodes.reduce(
        (acc, n) => {
          acc[n.type] = (acc[n.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      edgesByImportance: edges.reduce(
        (acc, e) => {
          acc[e.importance] = (acc[e.importance] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    // Generate next steps recommendations
    const nextSteps: Array<{ nodeId: string; nodeName: string; reason: string }> = [];

    // Find nodes with all prerequisites completed
    for (const nodeId of suggestedOrder) {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node || node.userProgress?.completed) continue;

      const incomingEdges = edges.filter((e) => e.to === nodeId && e.importance === 'required');
      const prerequisitesComplete = incomingEdges.every((e) => {
        const prereqNode = nodes.find((n) => n.id === e.from);
        return prereqNode?.userProgress?.completed;
      });

      if (prerequisitesComplete) {
        nextSteps.push({
          nodeId: node.id,
          nodeName: node.name,
          reason: incomingEdges.length > 0 ? 'All prerequisites completed' : 'No prerequisites required',
        });
      }

      if (nextSteps.length >= 5) break;
    }

    return NextResponse.json({
      success: true,
      data: {
        graph: {
          nodes,
          edges,
        },
        learningPath,
        criticalPath,
        stats,
        nextSteps,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('[PREREQUISITE GRAPH] Get error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid parameters', details: error.errors },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get prerequisite graph' } },
      { status: 500 }
    );
  }
}
