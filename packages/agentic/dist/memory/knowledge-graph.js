/**
 * @sam-ai/agentic - KnowledgeGraphManager
 * Entity relationships and graph traversal for knowledge organization
 */
import { v4 as uuidv4 } from 'uuid';
// ============================================================================
// IN-MEMORY GRAPH STORE
// ============================================================================
export class InMemoryGraphStore {
    entities = new Map();
    relationships = new Map();
    outgoingIndex = new Map(); // entity -> relationship IDs
    incomingIndex = new Map(); // entity -> relationship IDs
    async createEntity(entity) {
        const now = new Date();
        const newEntity = {
            ...entity,
            id: uuidv4(),
            createdAt: now,
            updatedAt: now,
        };
        this.entities.set(newEntity.id, newEntity);
        return newEntity;
    }
    async getEntity(id) {
        return this.entities.get(id) ?? null;
    }
    async updateEntity(id, updates) {
        const existing = this.entities.get(id);
        if (!existing) {
            throw new Error(`Entity not found: ${id}`);
        }
        const updated = {
            ...existing,
            ...updates,
            id: existing.id,
            createdAt: existing.createdAt,
            updatedAt: new Date(),
        };
        this.entities.set(id, updated);
        return updated;
    }
    async deleteEntity(id) {
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
    async findEntities(type, query, limit) {
        let results = Array.from(this.entities.values()).filter((e) => e.type === type);
        if (query) {
            const lowerQuery = query.toLowerCase();
            results = results.filter((e) => e.name.toLowerCase().includes(lowerQuery) ||
                e.description?.toLowerCase().includes(lowerQuery));
        }
        if (limit) {
            results = results.slice(0, limit);
        }
        return results;
    }
    async createRelationship(relationship) {
        const newRel = {
            ...relationship,
            id: uuidv4(),
            createdAt: new Date(),
        };
        this.relationships.set(newRel.id, newRel);
        // Update indexes
        if (!this.outgoingIndex.has(relationship.sourceId)) {
            this.outgoingIndex.set(relationship.sourceId, new Set());
        }
        this.outgoingIndex.get(relationship.sourceId).add(newRel.id);
        if (!this.incomingIndex.has(relationship.targetId)) {
            this.incomingIndex.set(relationship.targetId, new Set());
        }
        this.incomingIndex.get(relationship.targetId).add(newRel.id);
        return newRel;
    }
    async getRelationship(id) {
        return this.relationships.get(id) ?? null;
    }
    async deleteRelationship(id) {
        const rel = this.relationships.get(id);
        if (!rel)
            return false;
        this.outgoingIndex.get(rel.sourceId)?.delete(id);
        this.incomingIndex.get(rel.targetId)?.delete(id);
        return this.relationships.delete(id);
    }
    async getRelationships(entityId, options) {
        const relIds = new Set();
        const direction = options?.direction ?? 'both';
        if (direction === 'outgoing' || direction === 'both') {
            const outgoing = this.outgoingIndex.get(entityId) ?? new Set();
            for (const id of outgoing)
                relIds.add(id);
        }
        if (direction === 'incoming' || direction === 'both') {
            const incoming = this.incomingIndex.get(entityId) ?? new Set();
            for (const id of incoming)
                relIds.add(id);
        }
        let results = [];
        for (const id of relIds) {
            const rel = this.relationships.get(id);
            if (rel)
                results.push(rel);
        }
        // Apply filters
        if (options?.relationshipTypes?.length) {
            results = results.filter((r) => options.relationshipTypes.includes(r.type));
        }
        if (options?.minWeight !== undefined) {
            results = results.filter((r) => r.weight >= options.minWeight);
        }
        if (options?.limit) {
            results = results.slice(0, options.limit);
        }
        return results;
    }
    async traverse(startId, options) {
        const visited = new Set();
        const entities = [];
        const relationships = [];
        const paths = [];
        const maxDepth = options.maxDepth ?? 3;
        const startEntity = await this.getEntity(startId);
        if (!startEntity) {
            return { entities: [], relationships: [], paths: [], depth: 0 };
        }
        // BFS traversal
        const queue = [
            {
                entityId: startId,
                depth: 0,
                path: { nodes: [startEntity], edges: [], totalWeight: 0 },
            },
        ];
        while (queue.length > 0) {
            const { entityId, depth, path } = queue.shift();
            if (visited.has(entityId))
                continue;
            visited.add(entityId);
            const entity = await this.getEntity(entityId);
            if (!entity)
                continue;
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
                        if (options.entityTypes?.length &&
                            !options.entityTypes.includes(nextEntity.type)) {
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
    async findPath(sourceId, targetId, options) {
        const visited = new Set();
        const maxDepth = options?.maxDepth ?? 10;
        const queue = [];
        const sourceEntity = await this.getEntity(sourceId);
        if (!sourceEntity)
            return null;
        queue.push({
            entityId: sourceId,
            path: { nodes: [sourceEntity], edges: [], totalWeight: 0 },
        });
        while (queue.length > 0) {
            const { entityId, path } = queue.shift();
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
    async getNeighbors(entityId, options) {
        const rels = await this.getRelationships(entityId, options);
        const neighborIds = new Set();
        for (const rel of rels) {
            if (rel.sourceId === entityId) {
                neighborIds.add(rel.targetId);
            }
            else {
                neighborIds.add(rel.sourceId);
            }
        }
        const neighbors = [];
        for (const id of neighborIds) {
            const entity = await this.getEntity(id);
            if (entity) {
                // Apply entity type filter
                if (options?.entityTypes?.length &&
                    !options.entityTypes.includes(entity.type)) {
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
    clear() {
        this.entities.clear();
        this.relationships.clear();
        this.outgoingIndex.clear();
        this.incomingIndex.clear();
    }
    getEntityCount() {
        return this.entities.size;
    }
    getRelationshipCount() {
        return this.relationships.size;
    }
}
// ============================================================================
// KNOWLEDGE GRAPH MANAGER
// ============================================================================
export class KnowledgeGraphManager {
    store;
    logger;
    maxTraversalDepth;
    defaultWeight;
    constructor(config = {}) {
        this.store = config.graphStore ?? new InMemoryGraphStore();
        this.logger = config.logger ?? console;
        this.maxTraversalDepth = config.maxTraversalDepth ?? 5;
        this.defaultWeight = config.defaultRelationshipWeight ?? 1.0;
    }
    // ============================================================================
    // ENTITY MANAGEMENT
    // ============================================================================
    async createEntity(type, name, options) {
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
    async getEntity(id) {
        return this.store.getEntity(id);
    }
    async updateEntity(id, updates) {
        this.logger.debug('Updating entity', { id });
        return this.store.updateEntity(id, updates);
    }
    async deleteEntity(id) {
        this.logger.debug('Deleting entity', { id });
        return this.store.deleteEntity(id);
    }
    async findEntities(type, query, limit) {
        return this.store.findEntities(type, query, limit);
    }
    // ============================================================================
    // RELATIONSHIP MANAGEMENT
    // ============================================================================
    async createRelationship(sourceId, targetId, type, options) {
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
    async getRelationship(id) {
        return this.store.getRelationship(id);
    }
    async deleteRelationship(id) {
        this.logger.debug('Deleting relationship', { id });
        return this.store.deleteRelationship(id);
    }
    async getRelationships(entityId, options) {
        return this.store.getRelationships(entityId, options);
    }
    // ============================================================================
    // GRAPH TRAVERSAL
    // ============================================================================
    async traverse(startId, options) {
        this.logger.debug('Traversing graph', { startId, options });
        const fullOptions = {
            maxDepth: options?.maxDepth ?? this.maxTraversalDepth,
            ...options,
        };
        return this.store.traverse(startId, fullOptions);
    }
    async findPath(sourceId, targetId, options) {
        this.logger.debug('Finding path', { sourceId, targetId });
        const fullOptions = {
            maxDepth: options?.maxDepth ?? this.maxTraversalDepth,
            ...options,
        };
        return this.store.findPath(sourceId, targetId, fullOptions);
    }
    async getNeighbors(entityId, options) {
        return this.store.getNeighbors(entityId, options);
    }
    // ============================================================================
    // HIGHER-LEVEL OPERATIONS
    // ============================================================================
    /**
     * Get all prerequisites for a concept/topic
     */
    async getPrerequisites(entityId, maxDepth) {
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
    async getDependents(entityId, maxDepth) {
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
    async getRelatedConcepts(entityId, limit) {
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
    async getLearningPath(fromId, toId) {
        const path = await this.findPath(fromId, toId, {
            relationshipTypes: ['prerequisite_of', 'follows', 'part_of'],
        });
        if (!path)
            return null;
        return {
            steps: path.nodes.map((node, index) => ({
                order: index + 1,
                entity: node,
                relationship: index > 0 ? path.edges[index - 1].type : undefined,
            })),
            totalWeight: path.totalWeight,
            estimatedDuration: this.estimateDuration(path),
        };
    }
    /**
     * Find common ancestors between two concepts
     */
    async findCommonAncestors(entityId1, entityId2) {
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
    async getMasteryDependencies(userId, conceptId) {
        // Get all prerequisites
        const prerequisites = await this.getPrerequisites(conceptId, 3);
        // Get user's mastered concepts (would typically query user progress)
        // For now, return structure
        const mastered = [];
        const notMastered = [];
        const readyToLearn = [];
        for (const prereq of prerequisites) {
            const rels = await this.store.getRelationships(prereq.id, {
                relationshipTypes: ['mastered_by'],
            });
            const isMastered = rels.some((r) => r.targetId === userId || r.properties.userId === userId);
            if (isMastered) {
                mastered.push(prereq);
            }
            else {
                notMastered.push(prereq);
                // Check if all prerequisites of this concept are mastered
                const subPrereqs = await this.getPrerequisites(prereq.id, 1);
                const allSubMastered = subPrereqs.every((sp) => mastered.some((m) => m.id === sp.id));
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
    async buildConceptMap(centerId, depth) {
        const result = await this.traverse(centerId, {
            maxDepth: depth ?? 2,
            direction: 'both',
        });
        const center = await this.getEntity(centerId);
        if (!center) {
            throw new Error(`Entity not found: ${centerId}`);
        }
        // Organize by relationship type
        const clusters = new Map();
        for (const rel of result.relationships) {
            if (!clusters.has(rel.type)) {
                clusters.set(rel.type, []);
            }
            const otherId = rel.sourceId === centerId ? rel.targetId : rel.sourceId;
            const other = result.entities.find((e) => e.id === otherId);
            if (other) {
                clusters.get(rel.type).push(other);
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
    estimateDuration(path) {
        // Simple estimation based on number of steps
        // More sophisticated estimation could use entity properties
        return path.nodes.length * 30; // 30 minutes per step
    }
    /**
     * Get statistics about the knowledge graph
     */
    async getStats() {
        const store = this.store;
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
// FACTORY FUNCTION
// ============================================================================
export function createKnowledgeGraphManager(config) {
    return new KnowledgeGraphManager(config);
}
//# sourceMappingURL=knowledge-graph.js.map