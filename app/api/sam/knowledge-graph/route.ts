/**
 * SAM Knowledge Graph API
 *
 * Provides endpoints for knowledge graph traversal, concept relationships,
 * and learning path recommendations.
 *
 * Endpoints:
 * - GET: Fetch knowledge graph data for a course or concept
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import {
  getKnowledgeGraphManager,
  getKGCourseGraph,
  getKGRelatedContent,
  getKGUserProfile,
  searchKGEntities,
  type ContentRecommendation,
} from '@/lib/sam/agentic-knowledge-graph';
import {
  EntityType,
  RelationshipType,
  type GraphEntity,
  type GraphRelationship,
} from '@sam-ai/agentic';

// ============================================================================
// TYPES
// ============================================================================

interface GraphNode {
  id: string;
  name: string;
  type: string;
  description?: string;
  properties: Record<string, unknown>;
  masteryLevel?: number;
  status?: 'mastered' | 'in_progress' | 'not_started' | 'struggling';
  position?: { x: number; y: number };
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
  label?: string;
}

interface GraphVisualizationData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    masteredCount: number;
    inProgressCount: number;
    notStartedCount: number;
  };
}

interface ConceptDetails {
  entity: GraphEntity;
  neighbors: GraphEntity[];
  relationships: GraphRelationship[];
  userProgress?: {
    masteryLevel: number;
    status: string;
    lastAccessedAt?: Date;
  };
  recommendations?: ContentRecommendation[];
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetGraphQuerySchema = z.object({
  action: z.enum(['course', 'concept', 'traverse', 'search', 'user-profile']).default('course'),
  courseId: z.string().optional(),
  conceptId: z.string().optional(),
  query: z.string().optional(),
  entityType: z.string().optional(),
  maxDepth: z.coerce.number().int().min(1).max(5).optional().default(2),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  includeUserProgress: z.coerce.boolean().optional().default(true),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Maps entity type to display label
 */
function getEntityLabel(type: string): string {
  const labels: Record<string, string> = {
    [EntityType.COURSE]: 'Course',
    [EntityType.CHAPTER]: 'Chapter',
    [EntityType.SECTION]: 'Section',
    [EntityType.CONCEPT]: 'Concept',
    [EntityType.TOPIC]: 'Topic',
    [EntityType.SKILL]: 'Skill',
    [EntityType.USER]: 'User',
    [EntityType.QUESTION]: 'Question',
    [EntityType.RESOURCE]: 'Resource',
    [EntityType.PREREQUISITE]: 'Prerequisite',
    [EntityType.LEARNING_OBJECTIVE]: 'Learning Objective',
  };
  return labels[type] ?? type;
}

/**
 * Maps relationship type to display label
 */
function getRelationshipLabel(type: string): string {
  const labels: Record<string, string> = {
    [RelationshipType.PREREQUISITE_OF]: 'prerequisite of',
    [RelationshipType.PART_OF]: 'part of',
    [RelationshipType.RELATED_TO]: 'related to',
    [RelationshipType.TEACHES]: 'teaches',
    [RelationshipType.REQUIRES]: 'requires',
    [RelationshipType.FOLLOWS]: 'follows',
    [RelationshipType.SIMILAR_TO]: 'similar to',
    [RelationshipType.MASTERED_BY]: 'mastered by',
    [RelationshipType.STRUGGLED_WITH]: 'struggled with',
    [RelationshipType.COMPLETED]: 'completed',
    [RelationshipType.REFERENCES]: 'references',
  };
  return labels[type] ?? type;
}

/**
 * Calculate layout positions for graph nodes using a simple force-directed approach
 */
function calculateNodePositions(
  entities: GraphEntity[],
  relationships: GraphRelationship[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const nodeCount = entities.length;

  if (nodeCount === 0) return positions;

  // Group nodes by type for layered layout
  const nodesByType = new Map<string, GraphEntity[]>();
  for (const entity of entities) {
    const existing = nodesByType.get(entity.type) ?? [];
    existing.push(entity);
    nodesByType.set(entity.type, existing);
  }

  // Layer ordering (top to bottom)
  const layerOrder: EntityType[] = [
    EntityType.COURSE,
    EntityType.CHAPTER,
    EntityType.SECTION,
    EntityType.CONCEPT,
    EntityType.TOPIC,
    EntityType.SKILL,
  ];
  const layerOrderSet = new Set(layerOrder);

  let yOffset = 50;
  const layerHeight = 120;
  const horizontalSpacing = 150;

  for (const layerType of layerOrder) {
    const nodesInLayer = nodesByType.get(layerType) ?? [];
    if (nodesInLayer.length === 0) continue;

    const layerWidth = nodesInLayer.length * horizontalSpacing;
    let xOffset = 400 - layerWidth / 2; // Center the layer

    for (const node of nodesInLayer) {
      positions.set(node.id, {
        x: xOffset + Math.random() * 20 - 10, // Add small random offset
        y: yOffset + Math.random() * 20 - 10,
      });
      xOffset += horizontalSpacing;
    }

    yOffset += layerHeight;
  }

  // Handle any remaining nodes not in standard layers
  for (const [type, nodes] of nodesByType) {
    if (layerOrderSet.has(type as EntityType)) continue;

    for (const node of nodes) {
      if (!positions.has(node.id)) {
        positions.set(node.id, {
          x: 200 + Math.random() * 400,
          y: yOffset + Math.random() * 100,
        });
      }
    }
    yOffset += layerHeight;
  }

  return positions;
}

/**
 * Determine user status for a concept
 */
function determineUserStatus(
  conceptId: string,
  masteredConcepts: string[],
  inProgressConcepts: string[],
  strugglingConcepts: string[]
): 'mastered' | 'in_progress' | 'not_started' | 'struggling' {
  if (strugglingConcepts.includes(conceptId)) return 'struggling';
  if (masteredConcepts.includes(conceptId)) return 'mastered';
  if (inProgressConcepts.includes(conceptId)) return 'in_progress';
  return 'not_started';
}

/**
 * Convert entities and relationships to visualization format
 */
async function buildVisualizationData(
  entities: GraphEntity[],
  relationships: GraphRelationship[],
  userId?: string
): Promise<GraphVisualizationData> {
  // Get user progress if userId provided
  let masteredConcepts: string[] = [];
  let inProgressConcepts: string[] = [];
  let strugglingConcepts: string[] = [];

  if (userId) {
    try {
      const userProfile = await getKGUserProfile(userId);
      masteredConcepts = userProfile.masteredConcepts;
      inProgressConcepts = userProfile.inProgressConcepts;
      strugglingConcepts = userProfile.strugglingConcepts;
    } catch (error) {
      logger.warn('[KnowledgeGraphAPI] Failed to get user profile', { userId, error });
    }
  }

  // Calculate positions
  const positions = calculateNodePositions(entities, relationships);

  // Build nodes
  const nodes: GraphNode[] = entities.map((entity) => {
    const status = determineUserStatus(
      entity.id,
      masteredConcepts,
      inProgressConcepts,
      strugglingConcepts
    );

    const masteryLevel =
      status === 'mastered' ? 100 :
      status === 'in_progress' ? 50 :
      status === 'struggling' ? 25 : 0;

    return {
      id: entity.id,
      name: entity.name,
      type: getEntityLabel(entity.type),
      description: entity.description,
      properties: entity.properties,
      masteryLevel,
      status,
      position: positions.get(entity.id),
    };
  });

  // Build edges
  const edges: GraphEdge[] = relationships.map((rel) => ({
    id: rel.id,
    source: rel.sourceId,
    target: rel.targetId,
    type: rel.type,
    weight: rel.weight,
    label: getRelationshipLabel(rel.type),
  }));

  // Calculate stats
  const stats = {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    masteredCount: nodes.filter((n) => n.status === 'mastered').length,
    inProgressCount: nodes.filter((n) => n.status === 'in_progress').length,
    notStartedCount: nodes.filter((n) => n.status === 'not_started').length,
  };

  return { nodes, edges, stats };
}

// ============================================================================
// GET - Fetch knowledge graph data
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = GetGraphQuerySchema.parse({
      action: searchParams.get('action') ?? undefined,
      courseId: searchParams.get('courseId') ?? undefined,
      conceptId: searchParams.get('conceptId') ?? undefined,
      query: searchParams.get('query') ?? undefined,
      entityType: searchParams.get('entityType') ?? undefined,
      maxDepth: searchParams.get('maxDepth') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      includeUserProgress: searchParams.get('includeUserProgress') ?? undefined,
    });

    const userId = query.includeUserProgress ? session.user.id : undefined;

    // Lazy-load knowledge graph manager only when needed (requires OPENAI_API_KEY)
    const getKG = () => {
      try {
        return getKnowledgeGraphManager();
      } catch (error) {
        logger.warn('[KnowledgeGraphAPI] Knowledge graph manager not available', { error });
        return null;
      }
    };

    switch (query.action) {
      // =============================================
      // Get course knowledge graph
      // =============================================
      case 'course': {
        if (!query.courseId) {
          return NextResponse.json(
            { error: 'courseId is required for action=course' },
            { status: 400 }
          );
        }

        const courseGraph = await getKGCourseGraph(query.courseId);
        if (!courseGraph) {
          return NextResponse.json(
            { error: 'Course not found or graph could not be built' },
            { status: 404 }
          );
        }

        // Build full graph from course data
        const entities: GraphEntity[] = courseGraph.concepts.map((concept) => ({
          id: concept.id,
          type: EntityType.SECTION,
          name: concept.name,
          description: concept.description,
          properties: {
            difficulty: concept.difficulty,
            estimatedMinutes: concept.estimatedMinutes,
            tags: concept.tags,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        const relationships: GraphRelationship[] = courseGraph.prerequisites.map((prereq, index) => ({
          id: `prereq-${index}`,
          type: RelationshipType.PREREQUISITE_OF,
          sourceId: prereq.requiresConceptId,
          targetId: prereq.conceptId,
          weight: prereq.importance === 'required' ? 1.0 : prereq.importance === 'recommended' ? 0.7 : 0.3,
          properties: { importance: prereq.importance },
          createdAt: new Date(),
        }));

        const visualizationData = await buildVisualizationData(
          entities,
          relationships,
          userId
        );

        return NextResponse.json({
          success: true,
          data: {
            courseId: courseGraph.courseId,
            title: courseGraph.title,
            learningObjectives: courseGraph.learningObjectives,
            graph: visualizationData,
          },
        });
      }

      // =============================================
      // Get concept details with neighbors
      // =============================================
      case 'concept': {
        if (!query.conceptId) {
          return NextResponse.json(
            { error: 'conceptId is required for action=concept' },
            { status: 400 }
          );
        }

        const kg = getKG();
        if (!kg) {
          return NextResponse.json(
            { error: 'Knowledge graph not available - OPENAI_API_KEY required' },
            { status: 503 }
          );
        }

        const entity = await kg.getEntity(query.conceptId);
        if (!entity) {
          return NextResponse.json(
            { error: 'Concept not found' },
            { status: 404 }
          );
        }

        const neighbors = await kg.getNeighbors(query.conceptId, {
          limit: query.limit,
        });

        const relationships = await kg.getRelationships(query.conceptId, {
          direction: 'both',
          limit: query.limit,
        });

        // Get related content recommendations
        const relatedContent = await getKGRelatedContent(
          query.conceptId,
          session.user.id,
          { limit: 5 }
        );

        // Get user progress for this concept
        let userProgress: ConceptDetails['userProgress'];
        if (userId) {
          const userProfile = await getKGUserProfile(userId);
          const status = determineUserStatus(
            query.conceptId,
            userProfile.masteredConcepts,
            userProfile.inProgressConcepts,
            userProfile.strugglingConcepts
          );
          const skill = userProfile.skills.find((s) => s.conceptId === query.conceptId);

          userProgress = {
            masteryLevel: skill?.masteryLevel ?? 0,
            status,
            lastAccessedAt: skill?.lastPracticedAt,
          };
        }

        const conceptDetails: ConceptDetails = {
          entity,
          neighbors,
          relationships,
          userProgress,
          recommendations: relatedContent.content,
        };

        return NextResponse.json({
          success: true,
          data: conceptDetails,
        });
      }

      // =============================================
      // Traverse graph from a starting point
      // =============================================
      case 'traverse': {
        if (!query.conceptId) {
          return NextResponse.json(
            { error: 'conceptId is required for action=traverse' },
            { status: 400 }
          );
        }

        const kgTraverse = getKG();
        if (!kgTraverse) {
          return NextResponse.json(
            { error: 'Knowledge graph not available - OPENAI_API_KEY required' },
            { status: 503 }
          );
        }

        const traversalResult = await kgTraverse.traverse(query.conceptId, {
          maxDepth: query.maxDepth,
          limit: query.limit,
          direction: 'both',
        });

        const visualizationData = await buildVisualizationData(
          traversalResult.entities,
          traversalResult.relationships,
          userId
        );

        return NextResponse.json({
          success: true,
          data: {
            startConceptId: query.conceptId,
            depth: traversalResult.depth,
            pathCount: traversalResult.paths.length,
            graph: visualizationData,
          },
        });
      }

      // =============================================
      // Search for entities
      // =============================================
      case 'search': {
        if (!query.query) {
          return NextResponse.json(
            { error: 'query is required for action=search' },
            { status: 400 }
          );
        }

        const entityType = query.entityType
          ? (query.entityType as EntityType)
          : undefined;

        const entities = await searchKGEntities(query.query, {
          entityType,
          limit: query.limit,
        });

        // For search results, include user progress
        const nodes: GraphNode[] = [];
        let masteredConcepts: string[] = [];
        let inProgressConcepts: string[] = [];
        let strugglingConcepts: string[] = [];

        if (userId) {
          const userProfile = await getKGUserProfile(userId);
          masteredConcepts = userProfile.masteredConcepts;
          inProgressConcepts = userProfile.inProgressConcepts;
          strugglingConcepts = userProfile.strugglingConcepts;
        }

        for (const entity of entities) {
          const status = determineUserStatus(
            entity.id,
            masteredConcepts,
            inProgressConcepts,
            strugglingConcepts
          );

          nodes.push({
            id: entity.id,
            name: entity.name,
            type: getEntityLabel(entity.type),
            description: entity.description,
            properties: entity.properties,
            status,
          });
        }

        return NextResponse.json({
          success: true,
          data: {
            query: query.query,
            results: nodes,
            count: nodes.length,
          },
        });
      }

      // =============================================
      // Get user profile with skill graph
      // =============================================
      case 'user-profile': {
        const userProfile = await getKGUserProfile(session.user.id);

        // Build a mini-graph of user skills
        const skillNodes: GraphNode[] = userProfile.skills.map((skill) => ({
          id: skill.conceptId,
          name: skill.conceptName,
          type: 'Skill',
          properties: {
            practiceCount: skill.practiceCount,
            strengthTrend: skill.strengthTrend,
          },
          masteryLevel: skill.masteryLevel,
          status: skill.masteryLevel >= 80 ? 'mastered' :
                  skill.masteryLevel >= 30 ? 'in_progress' : 'not_started',
        }));

        return NextResponse.json({
          success: true,
          data: {
            userId: userProfile.userId,
            summary: {
              totalSkills: userProfile.skills.length,
              masteredCount: userProfile.masteredConcepts.length,
              inProgressCount: userProfile.inProgressConcepts.length,
              strugglingCount: userProfile.strugglingConcepts.length,
              totalLearningTime: userProfile.totalLearningTime,
              lastActivityAt: userProfile.lastActivityAt,
            },
            skills: skillNodes,
            masteredConcepts: userProfile.masteredConcepts,
            inProgressConcepts: userProfile.inProgressConcepts,
            strugglingConcepts: userProfile.strugglingConcepts,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${query.action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('[KnowledgeGraphAPI] Error processing request:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch knowledge graph data' },
      { status: 500 }
    );
  }
}
