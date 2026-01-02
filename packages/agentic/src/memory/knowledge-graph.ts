/**
 * @sam-ai/agentic - KnowledgeGraphManager
 * Entity relationships and graph traversal for knowledge organization
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  KnowledgeGraphStore,
  GraphEntity,
  GraphRelationship,
  GraphPath,
  TraversalResult,
  GraphQueryOptions,
  EntityType,
  RelationshipType,
  MemoryLogger,
} from './types';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface KnowledgeGraphConfig {
  graphStore?: KnowledgeGraphStore;
  logger?: MemoryLogger;
  maxTraversalDepth?: number;
  defaultRelationshipWeight?: number;
}

// ============================================================================
// IN-MEMORY GRAPH STORE
// ============================================================================

export class InMemoryGraphStore implements KnowledgeGraphStore {
  private entities: Map<string, GraphEntity> = new Map();
  private relationships: Map<string, GraphRelationship> = new Map();
  private outgoingIndex: Map<string, Set<string>> = new Map(); // entity -> relationship IDs
  private incomingIndex: Map<string, Set<string>> = new Map(); // entity -> relationship IDs

  async createEntity(
    entity: Omit<GraphEntity, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<GraphEntity> {
    const now = new Date();
    const newEntity: GraphEntity = {
      ...entity,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    this.entities.set(newEntity.id, newEntity);
    return newEntity;
  }

  async getEntity(id: string): Promise<GraphEntity | null> {
    return this.entities.get(id) ?? null;
  }

  async updateEntity(id: string, updates: Partial<GraphEntity>): Promise<GraphEntity> {
    const existing = this.entities.get(id);
    if (!existing) {
      throw new Error(`Entity not found: ${id}`);
    }

    const updated: GraphEntity = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    };
    this.entities.set(id, updated);
    return updated;
  }

  async deleteEntity(id: string): Promise<boolean> {
    // Also delete all relationships involving this entity
    const outgoing = this.outgoingIndex.get(id) ?? new Set();
    const incoming = this.incomingIndex.get(id) ?? new Set();

    for (const relId of [...outgoing, ...incoming]) {
      await this.deleteRelationship(relId);
    }

    this.outgoingIndex.delete(id);
    this.incomingIndex.delete(id);

    return this.entities.delete(id);
  }

  async findEntities(
    type: EntityType,
    query?: string,
    limit?: number
  ): Promise<GraphEntity[]> {
    let results = Array.from(this.entities.values()).filter((e) => e.type === type);

    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(
        (e) =>
          e.name.toLowerCase().includes(lowerQuery) ||
          e.description?.toLowerCase().includes(lowerQuery)
      );
    }

    if (limit) {
      results = results.slice(0, limit);
    }

    return results;
  }

  async createRelationship(
    relationship: Omit<GraphRelationship, 'id' | 'createdAt'>
  ): Promise<GraphRelationship> {
    const newRel: GraphRelationship = {
      ...relationship,
      id: uuidv4(),
      createdAt: new Date(),
    };

    this.relationships.set(newRel.id, newRel);

    // Update indexes
    if (!this.outgoingIndex.has(relationship.sourceId)) {
      this.outgoingIndex.set(relationship.sourceId, new Set());
    }
    this.outgoingIndex.get(relationship.sourceId)!.add(newRel.id);

    if (!this.incomingIndex.has(relationship.targetId)) {
      this.incomingIndex.set(relationship.targetId, new Set());
    }
    this.incomingIndex.get(relationship.targetId)!.add(newRel.id);

    return newRel;
  }

  async getRelationship(id: string): Promise<GraphRelationship | null> {
    return this.relationships.get(id) ?? null;
  }

  async deleteRelationship(id: string): Promise<boolean> {
    const rel = this.relationships.get(id);
    if (!rel) return false;

    this.outgoingIndex.get(rel.sourceId)?.delete(id);
    this.incomingIndex.get(rel.targetId)?.delete(id);

    return this.relationships.delete(id);
  }

  async getRelationships(
    entityId: string,
    options?: GraphQueryOptions
  ): Promise<GraphRelationship[]> {
    const relIds = new Set<string>();
    const direction = options?.direction ?? 'both';

    if (direction === 'outgoing' || direction === 'both') {
      const outgoing = this.outgoingIndex.get(entityId) ?? new Set();
      for (const id of outgoing) relIds.add(id);
    }

    if (direction === 'incoming' || direction === 'both') {
      const incoming = this.incomingIndex.get(entityId) ?? new Set();
      for (const id of incoming) relIds.add(id);
    }

    let results: GraphRelationship[] = [];
    for (const id of relIds) {
      const rel = this.relationships.get(id);
      if (rel) results.push(rel);
    }

    // Apply filters
    if (options?.relationshipTypes?.length) {
      results = results.filter((r) =>
        options.relationshipTypes!.includes(r.type as RelationshipType)
      );
    }

    if (options?.minWeight !== undefined) {
      results = results.filter((r) => r.weight >= options.minWeight!);
    }

    if (options?.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  async traverse(
    startId: string,
    options: GraphQueryOptions
  ): Promise<TraversalResult> {
    const visited = new Set<string>();
    const entities: GraphEntity[] = [];
    const relationships: GraphRelationship[] = [];
    const paths: GraphPath[] = [];
    const maxDepth = options.maxDepth ?? 3;

    const startEntity = await this.getEntity(startId);
    if (!startEntity) {
      return { entities: [], relationships: [], paths: [], depth: 0 };
    }

    // BFS traversal
    const queue: Array<{ entityId: string; depth: number; path: GraphPath }> = [
      {
        entityId: startId,
        depth: 0,
        path: { nodes: [startEntity], edges: [], totalWeight: 0 },
      },
    ];

    while (queue.length > 0) {
      const { entityId, depth, path } = queue.shift()!;

      if (visited.has(entityId)) continue;
      visited.add(entityId);

      const entity = await this.getEntity(entityId);
      if (!entity) continue;

      if (!entities.find((e) => e.id === entity.id)) {
        entities.push(entity);
      }

      if (depth >= maxDepth) {
        paths.push(path);
        continue;
      }

      const rels = await this.getRelationships(entityId, options);

      for (const rel of rels) {
        if (!relationships.find((r) => r.id === rel.id)) {
          relationships.push(rel);
        }

        const nextId = rel.sourceId === entityId ? rel.targetId : rel.sourceId;

        if (!visited.has(nextId)) {
          const nextEntity = await this.getEntity(nextId);
          if (nextEntity) {
            // Check entity type filter
            if (
              options.entityTypes?.length &&
              !options.entityTypes.includes(nextEntity.type as EntityType)
            ) {
              continue;
            }

            queue.push({
              entityId: nextId,
              depth: depth + 1,
              path: {
                nodes: [...path.nodes, nextEntity],
                edges: [...path.edges, rel],
                totalWeight: path.totalWeight + rel.weight,
              },
            });
          }
        }
      }

      if (depth === maxDepth - 1 || rels.length === 0) {
        paths.push(path);
      }
    }

    return {
      entities,
      relationships,
      paths,
      depth: maxDepth,
    };
  }

  async findPath(
    sourceId: string,
    targetId: string,
    options?: GraphQueryOptions
  ): Promise<GraphPath | null> {
    const visited = new Set<string>();
    const maxDepth = options?.maxDepth ?? 10;

    const queue: Array<{ entityId: string; path: GraphPath }> = [];

    const sourceEntity = await this.getEntity(sourceId);
    if (!sourceEntity) return null;

    queue.push({
      entityId: sourceId,
      path: { nodes: [sourceEntity], edges: [], totalWeight: 0 },
    });

    while (queue.length > 0) {
      const { entityId, path } = queue.shift()!;

      if (entityId === targetId) {
        return path;
      }

      if (visited.has(entityId) || path.nodes.length > maxDepth) {
        continue;
      }
      visited.add(entityId);

      const rels = await this.getRelationships(entityId, options);

      for (const rel of rels) {
        const nextId = rel.sourceId === entityId ? rel.targetId : rel.sourceId;

        if (!visited.has(nextId)) {
          const nextEntity = await this.getEntity(nextId);
          if (nextEntity) {
            queue.push({
              entityId: nextId,
              path: {
                nodes: [...path.nodes, nextEntity],
                edges: [...path.edges, rel],
                totalWeight: path.totalWeight + rel.weight,
              },
            });
          }
        }
      }
    }

    return null;
  }

  async getNeighbors(
    entityId: string,
    options?: GraphQueryOptions
  ): Promise<GraphEntity[]> {
    const rels = await this.getRelationships(entityId, options);
    const neighborIds = new Set<string>();

    for (const rel of rels) {
      if (rel.sourceId === entityId) {
        neighborIds.add(rel.targetId);
      } else {
        neighborIds.add(rel.sourceId);
      }
    }

    const neighbors: GraphEntity[] = [];
    for (const id of neighborIds) {
      const entity = await this.getEntity(id);
      if (entity) {
        // Apply entity type filter
        if (
          options?.entityTypes?.length &&
          !options.entityTypes.includes(entity.type as EntityType)
        ) {
          continue;
        }
        neighbors.push(entity);
      }
    }

    if (options?.limit) {
      return neighbors.slice(0, options.limit);
    }

    return neighbors;
  }

  // Utility methods for testing
  clear(): void {
    this.entities.clear();
    this.relationships.clear();
    this.outgoingIndex.clear();
    this.incomingIndex.clear();
  }

  getEntityCount(): number {
    return this.entities.size;
  }

  getRelationshipCount(): number {
    return this.relationships.size;
  }
}

// ============================================================================
// KNOWLEDGE GRAPH MANAGER
// ============================================================================

export class KnowledgeGraphManager {
  private readonly store: KnowledgeGraphStore;
  private readonly logger: MemoryLogger;
  private readonly maxTraversalDepth: number;
  private readonly defaultWeight: number;

  constructor(config: KnowledgeGraphConfig = {}) {
    this.store = config.graphStore ?? new InMemoryGraphStore();
    this.logger = config.logger ?? console;
    this.maxTraversalDepth = config.maxTraversalDepth ?? 5;
    this.defaultWeight = config.defaultRelationshipWeight ?? 1.0;
  }

  // ============================================================================
  // ENTITY MANAGEMENT
  // ============================================================================

  async createEntity(
    type: EntityType,
    name: string,
    options?: {
      description?: string;
      properties?: Record<string, unknown>;
      embeddings?: string[];
    }
  ): Promise<GraphEntity> {
    this.logger.debug('Creating entity', { type, name });

    const entity = await this.store.createEntity({
      type,
      name,
      description: options?.description,
      properties: options?.properties ?? {},
      embeddings: options?.embeddings,
    });

    this.logger.info('Entity created', { id: entity.id, type, name });
    return entity;
  }

  async getEntity(id: string): Promise<GraphEntity | null> {
    return this.store.getEntity(id);
  }

  async updateEntity(
    id: string,
    updates: {
      name?: string;
      description?: string;
      properties?: Record<string, unknown>;
      embeddings?: string[];
    }
  ): Promise<GraphEntity> {
    this.logger.debug('Updating entity', { id });
    return this.store.updateEntity(id, updates);
  }

  async deleteEntity(id: string): Promise<boolean> {
    this.logger.debug('Deleting entity', { id });
    return this.store.deleteEntity(id);
  }

  async findEntities(
    type: EntityType,
    query?: string,
    limit?: number
  ): Promise<GraphEntity[]> {
    return this.store.findEntities(type, query, limit);
  }

  // ============================================================================
  // RELATIONSHIP MANAGEMENT
  // ============================================================================

  async createRelationship(
    sourceId: string,
    targetId: string,
    type: RelationshipType,
    options?: {
      weight?: number;
      properties?: Record<string, unknown>;
    }
  ): Promise<GraphRelationship> {
    this.logger.debug('Creating relationship', { sourceId, targetId, type });

    // Verify both entities exist
    const [source, target] = await Promise.all([
      this.store.getEntity(sourceId),
      this.store.getEntity(targetId),
    ]);

    if (!source) {
      throw new Error(`Source entity not found: ${sourceId}`);
    }
    if (!target) {
      throw new Error(`Target entity not found: ${targetId}`);
    }

    const relationship = await this.store.createRelationship({
      type,
      sourceId,
      targetId,
      weight: options?.weight ?? this.defaultWeight,
      properties: options?.properties ?? {},
    });

    this.logger.info('Relationship created', {
      id: relationship.id,
      type,
      source: source.name,
      target: target.name,
    });

    return relationship;
  }

  async getRelationship(id: string): Promise<GraphRelationship | null> {
    return this.store.getRelationship(id);
  }

  async deleteRelationship(id: string): Promise<boolean> {
    this.logger.debug('Deleting relationship', { id });
    return this.store.deleteRelationship(id);
  }

  async getRelationships(
    entityId: string,
    options?: GraphQueryOptions
  ): Promise<GraphRelationship[]> {
    return this.store.getRelationships(entityId, options);
  }

  // ============================================================================
  // GRAPH TRAVERSAL
  // ============================================================================

  async traverse(
    startId: string,
    options?: Partial<GraphQueryOptions>
  ): Promise<TraversalResult> {
    this.logger.debug('Traversing graph', { startId, options });

    const fullOptions: GraphQueryOptions = {
      maxDepth: options?.maxDepth ?? this.maxTraversalDepth,
      ...options,
    };

    return this.store.traverse(startId, fullOptions);
  }

  async findPath(
    sourceId: string,
    targetId: string,
    options?: Partial<GraphQueryOptions>
  ): Promise<GraphPath | null> {
    this.logger.debug('Finding path', { sourceId, targetId });

    const fullOptions: GraphQueryOptions = {
      maxDepth: options?.maxDepth ?? this.maxTraversalDepth,
      ...options,
    };

    return this.store.findPath(sourceId, targetId, fullOptions);
  }

  async getNeighbors(
    entityId: string,
    options?: Partial<GraphQueryOptions>
  ): Promise<GraphEntity[]> {
    return this.store.getNeighbors(entityId, options);
  }

  // ============================================================================
  // HIGHER-LEVEL OPERATIONS
  // ============================================================================

  /**
   * Get all prerequisites for a concept/topic
   */
  async getPrerequisites(
    entityId: string,
    maxDepth?: number
  ): Promise<GraphEntity[]> {
    const result = await this.traverse(entityId, {
      maxDepth: maxDepth ?? 3,
      relationshipTypes: ['prerequisite_of'],
      direction: 'incoming',
    });

    return result.entities.filter((e) => e.id !== entityId);
  }

  /**
   * Get all topics that depend on this concept
   */
  async getDependents(entityId: string, maxDepth?: number): Promise<GraphEntity[]> {
    const result = await this.traverse(entityId, {
      maxDepth: maxDepth ?? 3,
      relationshipTypes: ['prerequisite_of'],
      direction: 'outgoing',
    });

    return result.entities.filter((e) => e.id !== entityId);
  }

  /**
   * Get related concepts for a topic
   */
  async getRelatedConcepts(
    entityId: string,
    limit?: number
  ): Promise<GraphEntity[]> {
    const result = await this.traverse(entityId, {
      maxDepth: 2,
      relationshipTypes: ['related_to', 'similar_to'],
      direction: 'both',
      limit,
    });

    return result.entities.filter((e) => e.id !== entityId);
  }

  /**
   * Get learning path between two concepts
   */
  async getLearningPath(
    fromId: string,
    toId: string
  ): Promise<LearningPath | null> {
    const path = await this.findPath(fromId, toId, {
      relationshipTypes: ['prerequisite_of', 'follows', 'part_of'],
    });

    if (!path) return null;

    return {
      steps: path.nodes.map((node, index) => ({
        order: index + 1,
        entity: node,
        relationship:
          index > 0 ? path.edges[index - 1].type : undefined,
      })),
      totalWeight: path.totalWeight,
      estimatedDuration: this.estimateDuration(path),
    };
  }

  /**
   * Find common ancestors between two concepts
   */
  async findCommonAncestors(
    entityId1: string,
    entityId2: string
  ): Promise<GraphEntity[]> {
    const [ancestors1, ancestors2] = await Promise.all([
      this.getPrerequisites(entityId1, 5),
      this.getPrerequisites(entityId2, 5),
    ]);

    const ancestorIds1 = new Set(ancestors1.map((a) => a.id));
    return ancestors2.filter((a) => ancestorIds1.has(a.id));
  }

  /**
   * Get mastery dependencies for a user
   */
  async getMasteryDependencies(
    userId: string,
    conceptId: string
  ): Promise<{
    mastered: GraphEntity[];
    notMastered: GraphEntity[];
    readyToLearn: GraphEntity[];
  }> {
    // Get all prerequisites
    const prerequisites = await this.getPrerequisites(conceptId, 3);

    // Get user's mastered concepts (would typically query user progress)
    // For now, return structure
    const mastered: GraphEntity[] = [];
    const notMastered: GraphEntity[] = [];
    const readyToLearn: GraphEntity[] = [];

    for (const prereq of prerequisites) {
      const rels = await this.store.getRelationships(prereq.id, {
        relationshipTypes: ['mastered_by'],
      });

      const isMastered = rels.some(
        (r) => r.targetId === userId || r.properties.userId === userId
      );

      if (isMastered) {
        mastered.push(prereq);
      } else {
        notMastered.push(prereq);

        // Check if all prerequisites of this concept are mastered
        const subPrereqs = await this.getPrerequisites(prereq.id, 1);
        const allSubMastered = subPrereqs.every((sp) =>
          mastered.some((m) => m.id === sp.id)
        );

        if (allSubMastered || subPrereqs.length === 0) {
          readyToLearn.push(prereq);
        }
      }
    }

    return { mastered, notMastered, readyToLearn };
  }

  /**
   * Build a concept map around an entity
   */
  async buildConceptMap(
    centerId: string,
    depth?: number
  ): Promise<ConceptMap> {
    const result = await this.traverse(centerId, {
      maxDepth: depth ?? 2,
      direction: 'both',
    });

    const center = await this.getEntity(centerId);
    if (!center) {
      throw new Error(`Entity not found: ${centerId}`);
    }

    // Organize by relationship type
    const clusters = new Map<string, GraphEntity[]>();
    for (const rel of result.relationships) {
      if (!clusters.has(rel.type)) {
        clusters.set(rel.type, []);
      }

      const otherId = rel.sourceId === centerId ? rel.targetId : rel.sourceId;
      const other = result.entities.find((e) => e.id === otherId);
      if (other) {
        clusters.get(rel.type)!.push(other);
      }
    }

    return {
      center,
      entities: result.entities,
      relationships: result.relationships,
      clusters: Object.fromEntries(clusters),
      depth: result.depth,
    };
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private estimateDuration(path: GraphPath): number {
    // Simple estimation based on number of steps
    // More sophisticated estimation could use entity properties
    return path.nodes.length * 30; // 30 minutes per step
  }

  /**
   * Get statistics about the knowledge graph
   */
  async getStats(): Promise<KnowledgeGraphStats> {
    const store = this.store as InMemoryGraphStore;

    // Only available for in-memory store
    if (typeof store.getEntityCount !== 'function') {
      return {
        entityCount: 0,
        relationshipCount: 0,
        entityTypes: {},
        relationshipTypes: {},
      };
    }

    return {
      entityCount: store.getEntityCount(),
      relationshipCount: store.getRelationshipCount(),
      entityTypes: {},
      relationshipTypes: {},
    };
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface LearningPath {
  steps: Array<{
    order: number;
    entity: GraphEntity;
    relationship?: string;
  }>;
  totalWeight: number;
  estimatedDuration: number;
}

export interface ConceptMap {
  center: GraphEntity;
  entities: GraphEntity[];
  relationships: GraphRelationship[];
  clusters: Record<string, GraphEntity[]>;
  depth: number;
}

export interface KnowledgeGraphStats {
  entityCount: number;
  relationshipCount: number;
  entityTypes: Record<string, number>;
  relationshipTypes: Record<string, number>;
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createKnowledgeGraphManager(
  config?: KnowledgeGraphConfig
): KnowledgeGraphManager {
  return new KnowledgeGraphManager(config);
}
