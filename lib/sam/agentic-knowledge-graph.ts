/**
 * SAM Agentic Knowledge Graph Integration
 * Unified API for agentic tools to access knowledge graph capabilities
 */

import { logger } from '@/lib/logger';
import { getAgenticMemorySystem } from '@/lib/sam/agentic-memory';
import {
  buildCourseGraph,
  getUserSkillProfile,
  updateUserSkill,
  generateLearningPath,
  getRelatedConcepts,
  findConceptPath,
  type CourseGraphData,
  type UserSkillProfile,
  type LearningPathRecommendation,
  type ConceptConnection,
  type PathStep,
} from '@/lib/sam/services/knowledge-graph-service';
import {
  EntityType,
  RelationshipType,
  type GraphEntity,
  type GraphPath,
} from '@sam-ai/agentic';

// ============================================================================
// TYPES
// ============================================================================

export interface ContentRecommendation {
  id: string;
  title: string;
  type: 'course' | 'chapter' | 'section';
  relevanceScore: number;
  reason: string;
  prerequisites?: string[];
  estimatedMinutes?: number;
}

export interface KnowledgeGraphContext {
  userId: string;
  courseId?: string;
  currentSectionId?: string;
}

export interface RelatedContentResult {
  content: ContentRecommendation[];
  learningPath?: PathStep[];
  userProgress: {
    masteredCount: number;
    inProgressCount: number;
    strugglingCount: number;
  };
}

export interface ConceptGraphResult {
  conceptId: string;
  conceptName: string;
  connections: ConceptConnection[];
  pathToTarget?: GraphPath | null;
}

// ============================================================================
// KNOWLEDGE GRAPH SINGLETON ACCESS
// ============================================================================

/**
 * Gets the knowledge graph manager from the memory system
 */
export async function getKnowledgeGraphManager() {
  const memorySystem = await getAgenticMemorySystem();
  return memorySystem.knowledgeGraph;
}

// ============================================================================
// CONTENT RECOMMENDATION FUNCTIONS
// ============================================================================

/**
 * Get content recommendations based on knowledge graph traversal
 */
export async function getKGContentRecommendations(
  context: KnowledgeGraphContext,
  options: {
    limit?: number;
    includePrerequisites?: boolean;
    focusOnWeakAreas?: boolean;
  } = {}
): Promise<ContentRecommendation[]> {
  const limit = options.limit ?? 5;

  try {
    const recommendations: ContentRecommendation[] = [];

    // Get user skill profile for personalization
    const skillProfile = await getUserSkillProfile(context.userId);

    // If we have a course context, get related concepts
    if (context.courseId) {
      const courseGraph = await buildCourseGraph(context.courseId);
      if (courseGraph) {
        // Prioritize concepts based on user progress
        const rankedConcepts = rankConceptsByRelevance(
          courseGraph.concepts,
          skillProfile,
          options.focusOnWeakAreas ?? true
        );

        for (const concept of rankedConcepts.slice(0, limit)) {
          recommendations.push({
            id: concept.id,
            title: concept.name,
            type: 'section',
            relevanceScore: concept.score,
            reason: concept.reason,
            estimatedMinutes: concept.estimatedMinutes,
          });
        }
      }
    }

    // If we have a current section, get related content
    if (context.currentSectionId && recommendations.length < limit) {
      const relatedConcepts = await getRelatedConcepts(context.currentSectionId, {
        limit: limit - recommendations.length,
        includePrerequisites: options.includePrerequisites,
      });

      for (const connection of relatedConcepts) {
        if (!recommendations.find((r) => r.id === connection.targetConceptId)) {
          const entity = await findEntityById(connection.targetConceptId);
          if (entity) {
            recommendations.push({
              id: connection.targetConceptId,
              title: entity.name,
              type: mapEntityTypeToContentType(entity.type),
              relevanceScore: connection.strength,
              reason: `Related via ${connection.relationshipType}`,
            });
          }
        }
      }
    }

    logger.debug('[AgenticKG] Content recommendations generated', {
      userId: context.userId,
      courseId: context.courseId,
      count: recommendations.length,
    });

    return recommendations;
  } catch (error) {
    logger.error('[AgenticKG] Failed to get content recommendations', {
      context,
      error,
    });
    return [];
  }
}

/**
 * Get related content for a specific section/concept
 */
export async function getKGRelatedContent(
  sectionId: string,
  userId: string,
  options: {
    limit?: number;
    maxDepth?: number;
  } = {}
): Promise<RelatedContentResult> {
  try {
    const limit = options.limit ?? 5;

    // Get related concepts from knowledge graph
    const connections = await getRelatedConcepts(sectionId, {
      limit,
      maxDepth: options.maxDepth ?? 2,
    });

    // Get user skill profile
    const skillProfile = await getUserSkillProfile(userId);

    // Build content recommendations from connections
    const content: ContentRecommendation[] = [];

    for (const connection of connections) {
      const entity = await findEntityById(connection.targetConceptId);
      if (entity) {
        // Check if user has mastered this concept
        const isMastered = skillProfile.masteredConcepts.includes(connection.targetConceptId);
        const isStruggling = skillProfile.strugglingConcepts.includes(connection.targetConceptId);

        content.push({
          id: connection.targetConceptId,
          title: entity.name,
          type: mapEntityTypeToContentType(entity.type),
          relevanceScore: adjustScoreByUserProgress(
            connection.strength,
            isMastered,
            isStruggling
          ),
          reason: generateConnectionReason(connection, isMastered, isStruggling),
        });
      }
    }

    // Sort by adjusted relevance score
    content.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return {
      content: content.slice(0, limit),
      userProgress: {
        masteredCount: skillProfile.masteredConcepts.length,
        inProgressCount: skillProfile.inProgressConcepts.length,
        strugglingCount: skillProfile.strugglingConcepts.length,
      },
    };
  } catch (error) {
    logger.error('[AgenticKG] Failed to get related content', { sectionId, userId, error });
    return {
      content: [],
      userProgress: {
        masteredCount: 0,
        inProgressCount: 0,
        strugglingCount: 0,
      },
    };
  }
}

// ============================================================================
// LEARNING PATH FUNCTIONS
// ============================================================================

/**
 * Generate a personalized learning path for a user
 */
export async function getKGLearningPath(
  userId: string,
  options: {
    courseId?: string;
    targetConceptId?: string;
    maxSteps?: number;
    focusOnWeakAreas?: boolean;
  } = {}
): Promise<LearningPathRecommendation> {
  return generateLearningPath(userId, options);
}

/**
 * Find the optimal learning path from current position to target concept
 */
export async function findKGLearningPath(
  userId: string,
  fromConceptId: string,
  toConceptId: string
): Promise<ConceptGraphResult> {
  try {
    // Get connections from source concept
    const connections = await getRelatedConcepts(fromConceptId, {
      limit: 10,
      includePrerequisites: true,
      includeFollowing: true,
    });

    // Find path to target
    const path = await findConceptPath(fromConceptId, toConceptId);

    // Get source concept details
    const entity = await findEntityById(fromConceptId);

    return {
      conceptId: fromConceptId,
      conceptName: entity?.name ?? 'Unknown',
      connections,
      pathToTarget: path,
    };
  } catch (error) {
    logger.error('[AgenticKG] Failed to find learning path', {
      fromConceptId,
      toConceptId,
      error,
    });
    return {
      conceptId: fromConceptId,
      conceptName: 'Unknown',
      connections: [],
      pathToTarget: null,
    };
  }
}

// ============================================================================
// USER SKILL FUNCTIONS
// ============================================================================

/**
 * Get user's skill profile for personalization
 */
export async function getKGUserProfile(userId: string): Promise<UserSkillProfile> {
  return getUserSkillProfile(userId);
}

/**
 * Update user skill after completing content
 */
export async function updateKGUserSkill(
  userId: string,
  conceptId: string,
  performance: {
    completed: boolean;
    score?: number;
    timeSpent?: number;
    struggled?: boolean;
  }
): Promise<void> {
  return updateUserSkill(userId, conceptId, performance);
}

// ============================================================================
// GRAPH BUILDING FUNCTIONS
// ============================================================================

/**
 * Build or refresh knowledge graph for a course
 */
export async function buildKGForCourse(courseId: string): Promise<CourseGraphData | null> {
  return buildCourseGraph(courseId);
}

/**
 * Get concepts for a course without rebuilding
 */
export async function getKGCourseGraph(courseId: string): Promise<CourseGraphData | null> {
  return buildCourseGraph(courseId);
}

// ============================================================================
// ENTITY LOOKUP FUNCTIONS
// ============================================================================

/**
 * Find entity by ID in knowledge graph
 */
async function findEntityById(entityId: string): Promise<GraphEntity | null> {
  try {
    const kg = await getKnowledgeGraphManager();

    // Try each entity type
    for (const entityType of [EntityType.SECTION, EntityType.CHAPTER, EntityType.COURSE]) {
      const entities = await kg.findEntities(entityType, entityId, 1);
      if (entities.length > 0) {
        return entities[0];
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Find entities by name pattern
 */
export async function searchKGEntities(
  query: string,
  options: {
    entityType?: typeof EntityType[keyof typeof EntityType];
    limit?: number;
  } = {}
): Promise<GraphEntity[]> {
  try {
    const kg = await getKnowledgeGraphManager();
    const limit = options.limit ?? 10;
    const entityType = options.entityType ?? EntityType.SECTION;

    return await kg.findEntities(entityType, query, limit);
  } catch (error) {
    logger.error('[AgenticKG] Failed to search entities', { query, error });
    return [];
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface RankedConcept {
  id: string;
  name: string;
  score: number;
  reason: string;
  estimatedMinutes?: number;
}

function rankConceptsByRelevance(
  concepts: Array<{ id: string; name: string; difficulty: string; estimatedMinutes?: number }>,
  skillProfile: UserSkillProfile,
  focusOnWeakAreas: boolean
): RankedConcept[] {
  const ranked: RankedConcept[] = [];

  for (const concept of concepts) {
    let score = 0.5; // Base score
    let reason = 'Continue learning';

    // Check user progress
    const isMastered = skillProfile.masteredConcepts.includes(concept.id);
    const isInProgress = skillProfile.inProgressConcepts.includes(concept.id);
    const isStruggling = skillProfile.strugglingConcepts.includes(concept.id);

    if (focusOnWeakAreas && isStruggling) {
      score = 1.0;
      reason = 'Needs review - previously struggled';
    } else if (isInProgress) {
      score = 0.8;
      reason = 'Continue where you left off';
    } else if (isMastered) {
      score = 0.2;
      reason = 'Already mastered';
    } else {
      // New concept - score by difficulty match
      const userLevel = determineUserLevel(skillProfile);
      const conceptLevel = concept.difficulty;
      if (userLevel === conceptLevel) {
        score = 0.7;
        reason = 'Matches your current level';
      } else if (
        (userLevel === 'beginner' && conceptLevel === 'intermediate') ||
        (userLevel === 'intermediate' && conceptLevel === 'advanced')
      ) {
        score = 0.6;
        reason = 'Next step in progression';
      }
    }

    ranked.push({
      id: concept.id,
      name: concept.name,
      score,
      reason,
      estimatedMinutes: concept.estimatedMinutes,
    });
  }

  // Sort by score descending
  ranked.sort((a, b) => b.score - a.score);

  return ranked;
}

function determineUserLevel(skillProfile: UserSkillProfile): 'beginner' | 'intermediate' | 'advanced' {
  const totalConcepts =
    skillProfile.masteredConcepts.length +
    skillProfile.inProgressConcepts.length +
    skillProfile.strugglingConcepts.length;

  if (totalConcepts < 5) return 'beginner';
  if (skillProfile.masteredConcepts.length > 10) return 'advanced';
  return 'intermediate';
}

function mapEntityTypeToContentType(entityType: string): 'course' | 'chapter' | 'section' {
  switch (entityType) {
    case EntityType.COURSE:
      return 'course';
    case EntityType.CHAPTER:
      return 'chapter';
    case EntityType.SECTION:
    default:
      return 'section';
  }
}

function adjustScoreByUserProgress(
  baseScore: number,
  isMastered: boolean,
  isStruggling: boolean
): number {
  if (isStruggling) {
    return Math.min(baseScore * 1.5, 1.0); // Boost struggling concepts
  }
  if (isMastered) {
    return baseScore * 0.5; // Reduce mastered concepts
  }
  return baseScore;
}

function generateConnectionReason(
  connection: ConceptConnection,
  isMastered: boolean,
  isStruggling: boolean
): string {
  if (isStruggling) {
    return `Review recommended - ${connection.relationshipType.toLowerCase()}`;
  }
  if (isMastered) {
    return `Already mastered - ${connection.relationshipType.toLowerCase()}`;
  }

  switch (connection.relationshipType) {
    case RelationshipType.FOLLOWS:
      return 'Next in sequence';
    case RelationshipType.PREREQUISITE_OF:
      return 'Build on this concept';
    case RelationshipType.RELATED_TO:
      return 'Related concept';
    case RelationshipType.SIMILAR_TO:
      return 'Similar topic';
    default:
      return 'Connected concept';
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  type CourseGraphData,
  type UserSkillProfile,
  type LearningPathRecommendation,
  type ConceptConnection,
  type PathStep,
};
