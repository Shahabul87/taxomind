import { getDb } from './db-provider';
import {
  cosineSimilarity,
  euclideanDistance,
} from '@sam-ai/agentic';
import type {
  VectorEmbedding,
  VectorFilter,
  VectorPersistenceAdapter,
  VectorSearchOptions,
  SimilarityResult,
  KnowledgeGraphStore,
  GraphEntity,
  GraphRelationship,
  GraphQueryOptions,
  GraphPath,
  TraversalResult,
  SessionContextStore,
  SessionContext,
  ContextHistoryEntry,
} from '@sam-ai/agentic';
import { isPgvectorAvailable, pgvectorSearch, writeEmbeddingVector } from './pgvector-adapter';

const mapVectorEmbedding = (record: {
  id: string;
  embedding: unknown;
  dimensions: number;
  sourceId: string;
  sourceType: string;
  userId: string | null;
  courseId: string | null;
  chapterId: string | null;
  sectionId: string | null;
  contentHash: string;
  tags: string[];
  language: string | null;
  customMetadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): VectorEmbedding => ({
  id: record.id,
  vector: Array.isArray(record.embedding) ? (record.embedding as number[]) : [],
  dimensions: record.dimensions,
  metadata: {
    sourceId: record.sourceId,
    sourceType: record.sourceType as VectorEmbedding['metadata']['sourceType'],
    userId: record.userId ?? undefined,
    courseId: record.courseId ?? undefined,
    chapterId: record.chapterId ?? undefined,
    sectionId: record.sectionId ?? undefined,
    contentHash: record.contentHash,
    tags: record.tags,
    language: record.language ?? undefined,
    customMetadata: record.customMetadata as Record<string, unknown> | undefined,
  },
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

const applyVectorFilter = (filter?: VectorFilter): Record<string, unknown> => {
  if (!filter) return {};

  const where: Record<string, unknown> = {};

  if (filter.sourceTypes?.length) {
    where.sourceType = { in: filter.sourceTypes };
  }
  if (filter.userIds?.length) {
    where.userId = { in: filter.userIds };
  }
  if (filter.courseIds?.length) {
    where.courseId = { in: filter.courseIds };
  }
  if (filter.tags?.length) {
    where.tags = { hasSome: filter.tags };
  }
  if (filter.dateRange) {
    where.createdAt = {};
    if (filter.dateRange.start) {
      (where.createdAt as Record<string, unknown>).gte = filter.dateRange.start;
    }
    if (filter.dateRange.end) {
      (where.createdAt as Record<string, unknown>).lte = filter.dateRange.end;
    }
  }
  if (filter.customFilters) {
    Object.assign(where, filter.customFilters);
  }

  return where;
};

const VECTOR_INDEX_TTL_MS = 5 * 60 * 1000;
const VECTOR_INDEX_MODE = process.env.SAM_VECTOR_INDEX_MODE ?? 'cache';
const vectorIndexCache = new Map<string, { embeddings: VectorEmbedding[]; updatedAt: number }>();

const cacheKeyForFilter = (filter?: VectorFilter) => JSON.stringify(filter ?? {});

const shouldUseVectorCache = () => VECTOR_INDEX_MODE !== 'off';

const refreshVectorCache = (key: string, embeddings: VectorEmbedding[]) => {
  vectorIndexCache.set(key, { embeddings, updatedAt: Date.now() });
};

const getCachedEmbeddings = (key: string): VectorEmbedding[] | null => {
  const cached = vectorIndexCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.updatedAt > VECTOR_INDEX_TTL_MS) {
    vectorIndexCache.delete(key);
    return null;
  }
  return cached.embeddings;
};

const clearVectorCache = () => {
  vectorIndexCache.clear();
};

export class PrismaVectorAdapter implements VectorPersistenceAdapter {
  async save(vectorEmbedding: VectorEmbedding): Promise<void> {
    await getDb().sAMVectorEmbedding.create({
      data: {
        id: vectorEmbedding.id,
        embedding: vectorEmbedding.vector,
        dimensions: vectorEmbedding.dimensions,
        sourceId: vectorEmbedding.metadata.sourceId,
        sourceType: vectorEmbedding.metadata.sourceType,
        userId: vectorEmbedding.metadata.userId ?? undefined,
        courseId: vectorEmbedding.metadata.courseId ?? undefined,
        chapterId: vectorEmbedding.metadata.chapterId ?? undefined,
        sectionId: vectorEmbedding.metadata.sectionId ?? undefined,
        contentHash: vectorEmbedding.metadata.contentHash,
        tags: vectorEmbedding.metadata.tags ?? [],
        language: vectorEmbedding.metadata.language ?? undefined,
        customMetadata: vectorEmbedding.metadata.customMetadata ?? undefined,
      },
    });
    // Dual-write: also populate the native pgvector column
    if (vectorEmbedding.vector.length > 0) {
      await writeEmbeddingVector(vectorEmbedding.id, vectorEmbedding.vector, 'sam_vector_embeddings');
    }
    clearVectorCache();
  }

  async saveBatch(vectorEmbeddings: VectorEmbedding[]): Promise<void> {
    if (vectorEmbeddings.length === 0) return;
    await getDb().sAMVectorEmbedding.createMany({
      data: vectorEmbeddings.map((vectorEmbedding) => ({
        id: vectorEmbedding.id,
        embedding: vectorEmbedding.vector,
        dimensions: vectorEmbedding.dimensions,
        sourceId: vectorEmbedding.metadata.sourceId,
        sourceType: vectorEmbedding.metadata.sourceType,
        userId: vectorEmbedding.metadata.userId ?? undefined,
        courseId: vectorEmbedding.metadata.courseId ?? undefined,
        chapterId: vectorEmbedding.metadata.chapterId ?? undefined,
        sectionId: vectorEmbedding.metadata.sectionId ?? undefined,
        contentHash: vectorEmbedding.metadata.contentHash,
        tags: vectorEmbedding.metadata.tags ?? [],
        language: vectorEmbedding.metadata.language ?? undefined,
        customMetadata: vectorEmbedding.metadata.customMetadata ?? undefined,
      })),
      skipDuplicates: true,
    });
    clearVectorCache();
  }

  async load(id: string): Promise<VectorEmbedding | null> {
    const record = await getDb().sAMVectorEmbedding.findUnique({ where: { id } });
    return record ? mapVectorEmbedding(record) : null;
  }

  async loadAll(filter?: VectorFilter): Promise<VectorEmbedding[]> {
    const records = await getDb().sAMVectorEmbedding.findMany({
      where: applyVectorFilter(filter),
    });
    return records.map(mapVectorEmbedding);
  }

  async searchByVector(vector: number[], options: VectorSearchOptions): Promise<SimilarityResult[]> {
    // Try native pgvector search first (O(log n) vs O(n*d))
    const usePgvector = process.env.USE_PGVECTOR !== 'false' && (await isPgvectorAvailable());
    if (usePgvector) {
      try {
        return await pgvectorSearch(vector, options);
      } catch {
        // Fall through to in-memory search on pgvector failure
      }
    }

    // In-memory fallback: load all embeddings and compute cosine similarity
    const key = cacheKeyForFilter(options.filter);
    let embeddings = shouldUseVectorCache() ? getCachedEmbeddings(key) : null;

    if (!embeddings) {
      embeddings = await this.loadAll(options.filter);
      if (shouldUseVectorCache()) {
        refreshVectorCache(key, embeddings);
      }
    }

    const results: SimilarityResult[] = [];

    for (const embedding of embeddings) {
      if (embedding.vector.length !== vector.length) {
        continue;
      }

      const score = cosineSimilarity(vector, embedding.vector);
      const distance = euclideanDistance(vector, embedding.vector);

      if (options.minScore !== undefined && score < options.minScore) {
        continue;
      }
      if (options.maxDistance !== undefined && distance > options.maxDistance) {
        continue;
      }

      results.push({
        embedding: options.includeMetadata !== false ? embedding : { ...embedding, vector: [] },
        score,
        distance,
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, options.topK);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await getDb().sAMVectorEmbedding.delete({ where: { id } });
      clearVectorCache();
      return true;
    } catch {
      return false;
    }
  }

  async deleteBatch(ids: string[]): Promise<number> {
    const result = await getDb().sAMVectorEmbedding.deleteMany({
      where: { id: { in: ids } },
    });
    clearVectorCache();
    return result.count;
  }

  async deleteByFilter(filter: VectorFilter): Promise<number> {
    const result = await getDb().sAMVectorEmbedding.deleteMany({
      where: applyVectorFilter(filter),
    });
    clearVectorCache();
    return result.count;
  }

  async update(id: string, updates: Partial<VectorEmbedding>): Promise<VectorEmbedding | null> {
    const record = await getDb().sAMVectorEmbedding.update({
      where: { id },
      data: {
        sourceId: updates.metadata?.sourceId,
        sourceType: updates.metadata?.sourceType,
        userId: updates.metadata?.userId ?? undefined,
        courseId: updates.metadata?.courseId ?? undefined,
        chapterId: updates.metadata?.chapterId ?? undefined,
        sectionId: updates.metadata?.sectionId ?? undefined,
        contentHash: updates.metadata?.contentHash,
        tags: updates.metadata?.tags,
        language: updates.metadata?.language ?? undefined,
        customMetadata: updates.metadata?.customMetadata ?? undefined,
      },
    });

    clearVectorCache();
    return mapVectorEmbedding(record);
  }

  async count(filter?: VectorFilter): Promise<number> {
    return getDb().sAMVectorEmbedding.count({ where: applyVectorFilter(filter) });
  }
}

const mapKnowledgeNode = (record: {
  id: string;
  type: string;
  name: string;
  description: string | null;
  properties: unknown;
  embeddings: string[];
  createdAt: Date;
  updatedAt: Date;
}): GraphEntity => ({
  id: record.id,
  type: record.type as GraphEntity['type'],
  name: record.name,
  description: record.description ?? undefined,
  properties: (record.properties as Record<string, unknown>) ?? {},
  embeddings: record.embeddings,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

const mapKnowledgeEdge = (record: {
  id: string;
  type: string;
  sourceId: string;
  targetId: string;
  weight: number;
  properties: unknown;
  createdAt: Date;
}): GraphRelationship => ({
  id: record.id,
  type: record.type as GraphRelationship['type'],
  sourceId: record.sourceId,
  targetId: record.targetId,
  weight: record.weight,
  properties: (record.properties as Record<string, unknown>) ?? {},
  createdAt: record.createdAt,
});

export class PrismaKnowledgeGraphStore implements KnowledgeGraphStore {
  async createEntity(entity: Omit<GraphEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<GraphEntity> {
    const record = await getDb().sAMKnowledgeNode.create({
      data: {
        type: entity.type,
        name: entity.name,
        description: entity.description ?? null,
        properties: entity.properties ?? {},
        embeddings: entity.embeddings ?? [],
      },
    });

    return mapKnowledgeNode(record);
  }

  async getEntity(id: string): Promise<GraphEntity | null> {
    const record = await getDb().sAMKnowledgeNode.findUnique({ where: { id } });
    return record ? mapKnowledgeNode(record) : null;
  }

  async updateEntity(id: string, updates: Partial<GraphEntity>): Promise<GraphEntity> {
    const record = await getDb().sAMKnowledgeNode.update({
      where: { id },
      data: {
        type: updates.type,
        name: updates.name,
        description: updates.description ?? undefined,
        properties: updates.properties ?? undefined,
        embeddings: updates.embeddings ?? undefined,
      },
    });
    return mapKnowledgeNode(record);
  }

  async deleteEntity(id: string): Promise<boolean> {
    try {
      await getDb().sAMKnowledgeNode.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async findEntities(type: GraphEntity['type'], query?: string, limit?: number): Promise<GraphEntity[]> {
    const where: Record<string, unknown> = { type };
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }
    const records = await getDb().sAMKnowledgeNode.findMany({
      where,
      take: limit,
    });
    return records.map(mapKnowledgeNode);
  }

  async createRelationship(relationship: Omit<GraphRelationship, 'id' | 'createdAt'>): Promise<GraphRelationship> {
    const record = await getDb().sAMKnowledgeEdge.create({
      data: {
        type: relationship.type,
        sourceId: relationship.sourceId,
        targetId: relationship.targetId,
        weight: relationship.weight,
        properties: relationship.properties ?? {},
      },
    });
    return mapKnowledgeEdge(record);
  }

  async getRelationship(id: string): Promise<GraphRelationship | null> {
    const record = await getDb().sAMKnowledgeEdge.findUnique({ where: { id } });
    return record ? mapKnowledgeEdge(record) : null;
  }

  async deleteRelationship(id: string): Promise<boolean> {
    try {
      await getDb().sAMKnowledgeEdge.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async getRelationships(entityId: string, options?: GraphQueryOptions): Promise<GraphRelationship[]> {
    const direction = options?.direction ?? 'both';
    const filters: Record<string, unknown> = {};
    if (direction === 'outgoing') {
      filters.sourceId = entityId;
    } else if (direction === 'incoming') {
      filters.targetId = entityId;
    } else {
      filters.OR = [{ sourceId: entityId }, { targetId: entityId }];
    }

    if (options?.relationshipTypes?.length) {
      filters.type = { in: options.relationshipTypes };
    }
    if (options?.minWeight !== undefined) {
      filters.weight = { gte: options.minWeight };
    }

    const records = await getDb().sAMKnowledgeEdge.findMany({
      where: filters,
      take: options?.limit,
    });
    return records.map(mapKnowledgeEdge);
  }

  async traverse(startId: string, options: GraphQueryOptions): Promise<TraversalResult> {
    const maxDepth = options.maxDepth ?? 3;
    const visited = new Set<string>();
    const entities: GraphEntity[] = [];
    const relationships: GraphRelationship[] = [];
    const paths: GraphPath[] = [];

    const start = await this.getEntity(startId);
    if (!start) {
      return { entities: [], relationships: [], paths: [], depth: 0 };
    }

    const queue: Array<{ entity: GraphEntity; depth: number; path: GraphPath }> = [
      { entity: start, depth: 0, path: { nodes: [start], edges: [], totalWeight: 0 } },
    ];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;
      const { entity, depth, path } = current;
      if (visited.has(entity.id) || depth > maxDepth) continue;
      visited.add(entity.id);
      entities.push(entity);
      paths.push(path);

      const rels = await this.getRelationships(entity.id, options);
      for (const rel of rels) {
        relationships.push(rel);
        const neighborId = rel.sourceId === entity.id ? rel.targetId : rel.sourceId;
        if (visited.has(neighborId)) continue;
        const neighbor = await this.getEntity(neighborId);
        if (!neighbor) continue;
        queue.push({
          entity: neighbor,
          depth: depth + 1,
          path: {
            nodes: [...path.nodes, neighbor],
            edges: [...path.edges, rel],
            totalWeight: path.totalWeight + rel.weight,
          },
        });
      }
    }

    return { entities, relationships, paths, depth: maxDepth };
  }

  async findPath(sourceId: string, targetId: string, options?: GraphQueryOptions): Promise<GraphPath | null> {
    const maxDepth = options?.maxDepth ?? 3;
    const visited = new Set<string>();
    const queue: Array<{ id: string; path: GraphPath }> = [];

    const source = await this.getEntity(sourceId);
    if (!source) return null;

    queue.push({ id: sourceId, path: { nodes: [source], edges: [], totalWeight: 0 } });

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;
      if (current.id === targetId) return current.path;
      if (visited.has(current.id)) continue;
      visited.add(current.id);

      const rels = await this.getRelationships(current.id, options);
      for (const rel of rels) {
        const neighborId = rel.sourceId === current.id ? rel.targetId : rel.sourceId;
        if (visited.has(neighborId)) continue;
        const neighbor = await this.getEntity(neighborId);
        if (!neighbor) continue;
        if (current.path.nodes.length >= maxDepth + 1) continue;
        queue.push({
          id: neighborId,
          path: {
            nodes: [...current.path.nodes, neighbor],
            edges: [...current.path.edges, rel],
            totalWeight: current.path.totalWeight + rel.weight,
          },
        });
      }
    }

    return null;
  }

  async getNeighbors(entityId: string, options?: GraphQueryOptions): Promise<GraphEntity[]> {
    const relationships = await this.getRelationships(entityId, options);
    const neighbors: GraphEntity[] = [];
    const seen = new Set<string>();

    for (const rel of relationships) {
      const neighborId = rel.sourceId === entityId ? rel.targetId : rel.sourceId;
      if (seen.has(neighborId)) continue;
      const neighbor = await this.getEntity(neighborId);
      if (neighbor) {
        neighbors.push(neighbor);
        seen.add(neighborId);
      }
    }

    return neighbors;
  }
}

const mapSessionContext = (record: {
  id: string;
  userId: string;
  courseId: string | null;
  lastActiveAt: Date;
  currentState: unknown;
  history: unknown;
  preferences: unknown;
  insights: unknown;
  createdAt: Date;
  updatedAt: Date;
}): SessionContext => ({
  id: record.id,
  userId: record.userId,
  courseId: record.courseId ?? undefined,
  lastActiveAt: record.lastActiveAt,
  currentState: record.currentState as SessionContext['currentState'],
  history: (record.history as SessionContext['history']) ?? [],
  preferences: record.preferences as SessionContext['preferences'],
  insights: record.insights as SessionContext['insights'],
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

export class PrismaSessionContextStore implements SessionContextStore {
  async get(userId: string, courseId?: string): Promise<SessionContext | null> {
    const record = await getDb().sAMSessionContext.findFirst({
      where: {
        userId,
        courseId: courseId || null,
      },
    });
    return record ? mapSessionContext(record) : null;
  }

  async create(context: Omit<SessionContext, 'id' | 'createdAt' | 'updatedAt'>): Promise<SessionContext> {
    const record = await getDb().sAMSessionContext.create({
      data: {
        userId: context.userId,
        courseId: context.courseId || null,
        lastActiveAt: context.lastActiveAt,
        currentState: context.currentState,
        history: context.history ?? [],
        preferences: context.preferences,
        insights: context.insights,
      },
    });
    return mapSessionContext(record);
  }

  async update(id: string, updates: Partial<SessionContext>): Promise<SessionContext> {
    const record = await getDb().sAMSessionContext.update({
      where: { id },
      data: {
        lastActiveAt: updates.lastActiveAt,
        currentState: updates.currentState ?? undefined,
        history: updates.history ?? undefined,
        preferences: updates.preferences ?? undefined,
        insights: updates.insights ?? undefined,
      },
    });
    return mapSessionContext(record);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await getDb().sAMSessionContext.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async addHistoryEntry(id: string, entry: Omit<ContextHistoryEntry, 'timestamp'>): Promise<void> {
    const record = await getDb().sAMSessionContext.findUnique({ where: { id } });
    if (!record) {
      throw new Error(`Session context not found: ${id}`);
    }

    const history = (record.history as unknown as ContextHistoryEntry[]) ?? [];
    history.push({ ...entry, timestamp: new Date() });

    await getDb().sAMSessionContext.update({
      where: { id },
      data: {
        history,
        lastActiveAt: new Date(),
      },
    });
  }

  async getRecentHistory(id: string, limit: number): Promise<ContextHistoryEntry[]> {
    const record = await getDb().sAMSessionContext.findUnique({ where: { id } });
    if (!record) return [];
    const history = (record.history as unknown as ContextHistoryEntry[]) ?? [];
    return history.slice(-limit).reverse();
  }
}

export function createPrismaVectorAdapter(): PrismaVectorAdapter {
  return new PrismaVectorAdapter();
}

export function createPrismaKnowledgeGraphStore(): PrismaKnowledgeGraphStore {
  return new PrismaKnowledgeGraphStore();
}

export function createPrismaSessionContextStore(): PrismaSessionContextStore {
  return new PrismaSessionContextStore();
}
