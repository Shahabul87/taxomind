/**
 * Knowledge Graph Builder
 * Populates the knowledge graph from learning interactions
 *
 * Supports two modes:
 * 1. Full memory system (requires OPENAI_API_KEY for embeddings)
 * 2. Prisma fallback (works without OpenAI, stores nodes/edges directly)
 */

import { getAgenticMemorySystem } from '../agentic-memory';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import type { EntityType, RelationshipType } from '@sam-ai/agentic';

// ============================================================================
// TYPES
// ============================================================================

export interface ConceptExtraction {
  name: string;
  type: 'concept' | 'topic' | 'skill';
  description?: string;
  relatedTo?: string[];
  prerequisiteOf?: string[];
}

export interface KnowledgeGraphBuildResult {
  conceptsExtracted: number;
  entitiesCreated: number;
  relationshipsCreated: number;
}

// ============================================================================
// CONCEPT EXTRACTION
// ============================================================================

/**
 * Extract concepts from assistant response using pattern matching
 */
export function extractConceptsFromResponse(
  response: string,
  userMessage: string
): ConceptExtraction[] {
  const concepts: ConceptExtraction[] = [];

  // Pattern 1: Code block language identifiers (programming skills)
  const codeBlockPattern = /```(\w+)\n/g;
  let codeMatch: RegExpExecArray | null;
  while ((codeMatch = codeBlockPattern.exec(response)) !== null) {
    const lang = codeMatch[1];
    if (lang && lang.length > 1 && lang.length < 20) {
      // Filter common non-language identifiers
      const nonLanguages = ['bash', 'shell', 'sh', 'text', 'json', 'yaml', 'yml', 'xml', 'html', 'css', 'md', 'markdown'];
      if (!nonLanguages.includes(lang.toLowerCase())) {
        concepts.push({
          name: lang,
          type: 'skill',
          description: `Programming language/technology: ${lang}`,
        });
      }
    }
  }

  // Pattern 2: Markdown headers (topics)
  const headerPattern = /^#{1,3}\s+\*?\*?([^*\n#]+)\*?\*?\s*$/gm;
  let headerMatch: RegExpExecArray | null;
  while ((headerMatch = headerPattern.exec(response)) !== null) {
    const topicName = headerMatch[1]?.trim();
    if (topicName && topicName.length > 3 && topicName.length < 80) {
      // Filter out common non-topic headers
      const nonTopics = ['example', 'examples', 'note', 'notes', 'tip', 'tips', 'warning', 'summary', 'conclusion'];
      if (!nonTopics.includes(topicName.toLowerCase())) {
        concepts.push({
          name: topicName,
          type: 'topic',
        });
      }
    }
  }

  // Pattern 3: Bolded terms (key concepts)
  const boldPattern = /\*\*([A-Z][^*]+)\*\*/g;
  let boldMatch: RegExpExecArray | null;
  while ((boldMatch = boldPattern.exec(response)) !== null) {
    const term = boldMatch[1]?.trim();
    if (term && term.length > 2 && term.length < 50) {
      // Filter out common phrases that aren't concepts
      const lowerTerm = term.toLowerCase();
      if (!lowerTerm.includes(':') &&
          !lowerTerm.startsWith('note') &&
          !lowerTerm.startsWith('example') &&
          !lowerTerm.startsWith('important')) {
        concepts.push({
          name: term,
          type: 'concept',
        });
      }
    }
  }

  // Pattern 4: Extract from user question keywords
  const questionKeywords = extractKeywordsFromQuestion(userMessage);
  for (const keyword of questionKeywords) {
    concepts.push({
      name: keyword,
      type: 'topic',
      description: `Topic from user question`,
    });
  }

  // Deduplicate by normalized name
  const seen = new Set<string>();
  return concepts.filter(c => {
    const key = c.name.toLowerCase().trim();
    if (seen.has(key) || key.length < 3) return false;
    seen.add(key);
    return true;
  }).slice(0, 10); // Limit to 10 concepts per interaction
}

/**
 * Extract keywords from user question
 */
function extractKeywordsFromQuestion(question: string): string[] {
  const keywords: string[] = [];

  // Common learning question patterns
  const patterns = [
    /(?:what is|what are|explain|understand|learn about|help with)\s+([^?.!]+)/i,
    /(?:how do I|how to|how can I)\s+([^?.!]+)/i,
    /(?:working on|studying|learning)\s+([^?.!]+)/i,
  ];

  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match && match[1]) {
      const extracted = match[1].trim();
      if (extracted.length > 3 && extracted.length < 60) {
        keywords.push(extracted);
      }
    }
  }

  return keywords.slice(0, 3);
}

// ============================================================================
// KNOWLEDGE GRAPH OPERATIONS
// ============================================================================

/**
 * Add concepts to knowledge graph using Prisma fallback
 * This works without OpenAI embeddings
 */
async function addConceptsWithPrismaFallback(
  userId: string,
  concepts: ConceptExtraction[],
  courseId?: string
): Promise<KnowledgeGraphBuildResult> {
  const result: KnowledgeGraphBuildResult = {
    conceptsExtracted: concepts.length,
    entitiesCreated: 0,
    relationshipsCreated: 0,
  };

  const createdEntityIds: Map<string, string> = new Map();

  for (const concept of concepts) {
    try {
      // Check if entity already exists
      const existing = await db.sAMKnowledgeNode.findFirst({
        where: {
          name: concept.name,
          type: concept.type,
        },
      });

      let entityId: string;

      if (existing) {
        entityId = existing.id;
        logger.debug('[KnowledgeGraph:Prisma] Found existing entity', { name: concept.name, id: entityId });
      } else {
        // Create new entity
        const entity = await db.sAMKnowledgeNode.create({
          data: {
            type: concept.type,
            name: concept.name,
            description: concept.description,
            properties: {
              userId,
              courseId,
              learnedAt: new Date().toISOString(),
              source: 'auto_extraction',
            },
          },
        });
        entityId = entity.id;
        result.entitiesCreated++;
        logger.debug('[KnowledgeGraph:Prisma] Created new entity', { name: concept.name, id: entityId });
      }

      createdEntityIds.set(concept.name.toLowerCase(), entityId);
    } catch (error) {
      logger.warn('[KnowledgeGraph:Prisma] Failed to add concept', { concept: concept.name, error });
    }
  }

  // Create relationships between concepts extracted in the same interaction
  const entityEntries = Array.from(createdEntityIds.entries());
  for (let i = 0; i < entityEntries.length; i++) {
    for (let j = i + 1; j < entityEntries.length; j++) {
      const [, sourceId] = entityEntries[i];
      const [, targetId] = entityEntries[j];

      if (!sourceId || !targetId) continue;

      try {
        // Check if relationship already exists
        const existingEdge = await db.sAMKnowledgeEdge.findFirst({
          where: {
            OR: [
              { sourceId, targetId },
              { sourceId: targetId, targetId: sourceId },
            ],
          },
        });

        if (!existingEdge) {
          await db.sAMKnowledgeEdge.create({
            data: {
              type: 'related_to',
              sourceId,
              targetId,
              weight: 0.5,
              properties: {
                extractedTogether: true,
                timestamp: new Date().toISOString(),
              },
            },
          });
          result.relationshipsCreated++;
        }
      } catch {
        // Relationship might already exist, ignore
      }
    }
  }

  logger.info('[KnowledgeGraph:Prisma] Build complete', result);
  return result;
}

/**
 * Add concepts to knowledge graph
 * Uses memory system if available, falls back to Prisma if not
 */
export async function addConceptsToKnowledgeGraph(
  userId: string,
  concepts: ConceptExtraction[],
  courseId?: string
): Promise<KnowledgeGraphBuildResult> {
  if (concepts.length === 0) {
    return { conceptsExtracted: 0, entitiesCreated: 0, relationshipsCreated: 0 };
  }

  // Try memory system first
  let memorySystem;
  try {
    memorySystem = getAgenticMemorySystem();
  } catch {
    // Memory system not available, use Prisma fallback
    logger.info('[KnowledgeGraph] Using Prisma fallback (OpenAI not configured)');
    return addConceptsWithPrismaFallback(userId, concepts, courseId);
  }

  const result: KnowledgeGraphBuildResult = {
    conceptsExtracted: concepts.length,
    entitiesCreated: 0,
    relationshipsCreated: 0,
  };

  const createdEntityIds: Map<string, string> = new Map();

  for (const concept of concepts) {
    try {
      // Check if entity already exists
      const existing = await memorySystem.knowledgeGraph.findEntities(
        concept.type as EntityType,
        concept.name,
        1
      );

      let entityId: string;

      if (existing.length > 0) {
        entityId = existing[0].id;
        logger.debug('[KnowledgeGraph] Found existing entity', { name: concept.name, id: entityId });
      } else {
        // Create new entity
        const entity = await memorySystem.knowledgeGraph.createEntity(
          concept.type as EntityType,
          concept.name,
          {
            description: concept.description,
            properties: {
              userId,
              courseId,
              learnedAt: new Date().toISOString(),
              source: 'auto_extraction',
            },
          }
        );
        entityId = entity.id;
        result.entitiesCreated++;
        logger.debug('[KnowledgeGraph] Created new entity', { name: concept.name, id: entityId });
      }

      createdEntityIds.set(concept.name.toLowerCase(), entityId);
    } catch (error) {
      logger.warn('[KnowledgeGraph] Failed to add concept', { concept: concept.name, error });
    }
  }

  // Create relationships between concepts extracted in the same interaction
  const entityEntries = Array.from(createdEntityIds.entries());
  for (let i = 0; i < entityEntries.length; i++) {
    for (let j = i + 1; j < entityEntries.length; j++) {
      const [, sourceId] = entityEntries[i];
      const [, targetId] = entityEntries[j];

      if (!sourceId || !targetId) continue;

      try {
        await memorySystem.knowledgeGraph.createRelationship(
          sourceId,
          targetId,
          'related_to' as RelationshipType,
          {
            weight: 0.5,
            properties: {
              extractedTogether: true,
              timestamp: new Date().toISOString(),
            },
          }
        );
        result.relationshipsCreated++;
      } catch {
        // Relationship might already exist, ignore
      }
    }
  }

  logger.info('[KnowledgeGraph] Build complete', result);
  return result;
}

/**
 * Record concept interaction using Prisma fallback
 */
async function recordConceptInteractionWithPrisma(
  userId: string,
  conceptName: string,
  interactionType: 'learned' | 'struggled' | 'mastered' | 'reviewed',
  courseId?: string
): Promise<void> {
  try {
    // Find or create user node
    let userNode = await db.sAMKnowledgeNode.findFirst({
      where: {
        type: 'user',
        properties: {
          path: ['userId'],
          equals: userId,
        },
      },
    });

    if (!userNode) {
      userNode = await db.sAMKnowledgeNode.create({
        data: {
          type: 'user',
          name: `User: ${userId.slice(0, 8)}`,
          properties: { userId },
        },
      });
    }

    // Find concept node
    const conceptNode = await db.sAMKnowledgeNode.findFirst({
      where: {
        name: conceptName,
        type: { in: ['concept', 'topic', 'skill'] },
      },
    });

    if (!conceptNode) {
      logger.debug('[KnowledgeGraph:Prisma] Concept not found for interaction', { conceptName });
      return;
    }

    // Determine relationship type
    const relationshipType = interactionType === 'mastered' ? 'mastered_by'
      : interactionType === 'struggled' ? 'struggled_with'
      : 'completed';

    // Calculate weight based on interaction type
    const weight = interactionType === 'mastered' ? 1.0
      : interactionType === 'struggled' ? 0.3
      : interactionType === 'reviewed' ? 0.6
      : 0.7;

    await db.sAMKnowledgeEdge.create({
      data: {
        type: relationshipType,
        sourceId: conceptNode.id,
        targetId: userNode.id,
        weight,
        properties: {
          timestamp: new Date().toISOString(),
          interactionType,
          courseId,
        },
      },
    });

    logger.debug('[KnowledgeGraph:Prisma] Recorded concept interaction', {
      conceptName,
      interactionType,
      userId: userId.slice(0, 8),
    });
  } catch (error) {
    logger.warn('[KnowledgeGraph:Prisma] Failed to record concept interaction', { error, conceptName });
  }
}

/**
 * Record that a user has interacted with a concept
 */
export async function recordConceptInteraction(
  userId: string,
  conceptName: string,
  interactionType: 'learned' | 'struggled' | 'mastered' | 'reviewed',
  courseId?: string
): Promise<void> {
  let memorySystem;
  try {
    memorySystem = getAgenticMemorySystem();
  } catch {
    // Use Prisma fallback
    return recordConceptInteractionWithPrisma(userId, conceptName, interactionType, courseId);
  }

  try {
    // Find or create user node
    const userNodes = await memorySystem.knowledgeGraph.findEntities('user' as EntityType, userId, 1);
    let userNodeId: string;

    if (userNodes.length === 0) {
      const userNode = await memorySystem.knowledgeGraph.createEntity(
        'user' as EntityType,
        `User: ${userId.slice(0, 8)}`,
        { properties: { userId } }
      );
      userNodeId = userNode.id;
    } else {
      userNodeId = userNodes[0].id;
    }

    // Find concept node
    const conceptNodes = await memorySystem.knowledgeGraph.findEntities('concept' as EntityType, conceptName, 1);
    if (conceptNodes.length === 0) {
      logger.debug('[KnowledgeGraph] Concept not found for interaction', { conceptName });
      return;
    }

    // Determine relationship type
    const relationshipType = interactionType === 'mastered' ? 'mastered_by'
      : interactionType === 'struggled' ? 'struggled_with'
      : 'completed';

    // Calculate weight based on interaction type
    const weight = interactionType === 'mastered' ? 1.0
      : interactionType === 'struggled' ? 0.3
      : interactionType === 'reviewed' ? 0.6
      : 0.7;

    await memorySystem.knowledgeGraph.createRelationship(
      conceptNodes[0].id,
      userNodeId,
      relationshipType as RelationshipType,
      {
        weight,
        properties: {
          timestamp: new Date().toISOString(),
          interactionType,
          courseId,
        },
      }
    );

    logger.debug('[KnowledgeGraph] Recorded concept interaction', {
      conceptName,
      interactionType,
      userId: userId.slice(0, 8),
    });
  } catch (error) {
    logger.warn('[KnowledgeGraph] Failed to record concept interaction', { error, conceptName });
  }
}

/**
 * Get related concepts for a given concept
 */
export async function getRelatedConcepts(
  conceptName: string,
  maxDepth: number = 2
): Promise<string[]> {
  let memorySystem;
  try {
    memorySystem = getAgenticMemorySystem();
  } catch {
    return [];
  }

  try {
    const concepts = await memorySystem.knowledgeGraph.findEntities('concept' as EntityType, conceptName, 1);
    if (concepts.length === 0) return [];

    const neighbors = await memorySystem.knowledgeGraph.getNeighbors(concepts[0].id, {
      maxDepth,
      relationshipTypes: ['related_to', 'prerequisite_of'],
    });

    return neighbors.map(n => n.name);
  } catch {
    return [];
  }
}

/**
 * Get user's learning graph summary
 */
export async function getUserLearningGraphSummary(
  userId: string
): Promise<{
  masteredConcepts: string[];
  strugglingConcepts: string[];
  totalConceptsEncountered: number;
}> {
  let memorySystem;
  try {
    memorySystem = getAgenticMemorySystem();
  } catch {
    return { masteredConcepts: [], strugglingConcepts: [], totalConceptsEncountered: 0 };
  }

  try {
    // Find user node
    const userNodes = await memorySystem.knowledgeGraph.findEntities('user' as EntityType, userId, 1);
    if (userNodes.length === 0) {
      return { masteredConcepts: [], strugglingConcepts: [], totalConceptsEncountered: 0 };
    }

    const relationships = await memorySystem.knowledgeGraph.getRelationships(userNodes[0].id, {
      direction: 'incoming',
    });

    const masteredConcepts: string[] = [];
    const strugglingConcepts: string[] = [];

    for (const rel of relationships) {
      const concept = await memorySystem.knowledgeGraph.getEntity(rel.sourceId);
      if (!concept) continue;

      if (rel.type === 'mastered_by') {
        masteredConcepts.push(concept.name);
      } else if (rel.type === 'struggled_with') {
        strugglingConcepts.push(concept.name);
      }
    }

    return {
      masteredConcepts,
      strugglingConcepts,
      totalConceptsEncountered: relationships.length,
    };
  } catch {
    return { masteredConcepts: [], strugglingConcepts: [], totalConceptsEncountered: 0 };
  }
}
