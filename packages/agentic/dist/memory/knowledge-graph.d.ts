/**
 * @sam-ai/agentic - KnowledgeGraphManager
 * Entity relationships and graph traversal for knowledge organization
 */
import type { KnowledgeGraphStore, GraphEntity, GraphRelationship, GraphPath, TraversalResult, GraphQueryOptions, EntityType, RelationshipType, MemoryLogger } from './types';
export interface KnowledgeGraphConfig {
    graphStore?: KnowledgeGraphStore;
    logger?: MemoryLogger;
    maxTraversalDepth?: number;
    defaultRelationshipWeight?: number;
}
export declare class InMemoryGraphStore implements KnowledgeGraphStore {
    private entities;
    private relationships;
    private outgoingIndex;
    private incomingIndex;
    createEntity(entity: Omit<GraphEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<GraphEntity>;
    getEntity(id: string): Promise<GraphEntity | null>;
    updateEntity(id: string, updates: Partial<GraphEntity>): Promise<GraphEntity>;
    deleteEntity(id: string): Promise<boolean>;
    findEntities(type: EntityType, query?: string, limit?: number): Promise<GraphEntity[]>;
    createRelationship(relationship: Omit<GraphRelationship, 'id' | 'createdAt'>): Promise<GraphRelationship>;
    getRelationship(id: string): Promise<GraphRelationship | null>;
    deleteRelationship(id: string): Promise<boolean>;
    getRelationships(entityId: string, options?: GraphQueryOptions): Promise<GraphRelationship[]>;
    traverse(startId: string, options: GraphQueryOptions): Promise<TraversalResult>;
    findPath(sourceId: string, targetId: string, options?: GraphQueryOptions): Promise<GraphPath | null>;
    getNeighbors(entityId: string, options?: GraphQueryOptions): Promise<GraphEntity[]>;
    clear(): void;
    getEntityCount(): number;
    getRelationshipCount(): number;
}
export declare class KnowledgeGraphManager {
    private readonly store;
    private readonly logger;
    private readonly maxTraversalDepth;
    private readonly defaultWeight;
    constructor(config?: KnowledgeGraphConfig);
    createEntity(type: EntityType, name: string, options?: {
        description?: string;
        properties?: Record<string, unknown>;
        embeddings?: string[];
    }): Promise<GraphEntity>;
    getEntity(id: string): Promise<GraphEntity | null>;
    updateEntity(id: string, updates: {
        name?: string;
        description?: string;
        properties?: Record<string, unknown>;
        embeddings?: string[];
    }): Promise<GraphEntity>;
    deleteEntity(id: string): Promise<boolean>;
    findEntities(type: EntityType, query?: string, limit?: number): Promise<GraphEntity[]>;
    createRelationship(sourceId: string, targetId: string, type: RelationshipType, options?: {
        weight?: number;
        properties?: Record<string, unknown>;
    }): Promise<GraphRelationship>;
    getRelationship(id: string): Promise<GraphRelationship | null>;
    deleteRelationship(id: string): Promise<boolean>;
    getRelationships(entityId: string, options?: GraphQueryOptions): Promise<GraphRelationship[]>;
    traverse(startId: string, options?: Partial<GraphQueryOptions>): Promise<TraversalResult>;
    findPath(sourceId: string, targetId: string, options?: Partial<GraphQueryOptions>): Promise<GraphPath | null>;
    getNeighbors(entityId: string, options?: Partial<GraphQueryOptions>): Promise<GraphEntity[]>;
    /**
     * Get all prerequisites for a concept/topic
     */
    getPrerequisites(entityId: string, maxDepth?: number): Promise<GraphEntity[]>;
    /**
     * Get all topics that depend on this concept
     */
    getDependents(entityId: string, maxDepth?: number): Promise<GraphEntity[]>;
    /**
     * Get related concepts for a topic
     */
    getRelatedConcepts(entityId: string, limit?: number): Promise<GraphEntity[]>;
    /**
     * Get learning path between two concepts
     */
    getLearningPath(fromId: string, toId: string): Promise<LearningPath | null>;
    /**
     * Find common ancestors between two concepts
     */
    findCommonAncestors(entityId1: string, entityId2: string): Promise<GraphEntity[]>;
    /**
     * Get mastery dependencies for a user
     */
    getMasteryDependencies(userId: string, conceptId: string): Promise<{
        mastered: GraphEntity[];
        notMastered: GraphEntity[];
        readyToLearn: GraphEntity[];
    }>;
    /**
     * Build a concept map around an entity
     */
    buildConceptMap(centerId: string, depth?: number): Promise<ConceptMap>;
    private estimateDuration;
    /**
     * Get statistics about the knowledge graph
     */
    getStats(): Promise<KnowledgeGraphStats>;
}
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
export declare function createKnowledgeGraphManager(config?: KnowledgeGraphConfig): KnowledgeGraphManager;
//# sourceMappingURL=knowledge-graph.d.ts.map