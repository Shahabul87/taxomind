/**
 * @sam-ai/agentic - MemoryRetriever
 * RAG-based retrieval system for relevant context
 */
// ============================================================================
// MEMORY RETRIEVER
// ============================================================================
export class MemoryRetriever {
    vectorStore;
    knowledgeGraph;
    sessionContext;
    logger;
    defaultLimit;
    minRelevanceScore;
    recencyBoostFactor;
    userContextBoostFactor;
    hybridSearchWeight;
    constructor(config) {
        this.vectorStore = config.vectorStore;
        this.knowledgeGraph = config.knowledgeGraph;
        this.sessionContext = config.sessionContext;
        this.logger = config.logger ?? console;
        this.defaultLimit = config.defaultLimit ?? 10;
        this.minRelevanceScore = config.minRelevanceScore ?? 0.5;
        this.recencyBoostFactor = config.recencyBoostFactor ?? 0.1;
        this.userContextBoostFactor = config.userContextBoostFactor ?? 0.15;
        this.hybridSearchWeight = config.hybridSearchWeight ?? 0.7;
    }
    // ============================================================================
    // MAIN RETRIEVAL METHODS
    // ============================================================================
    /**
     * Retrieve relevant memories for a query
     */
    async retrieve(query) {
        const startTime = Date.now();
        this.logger.debug('Starting memory retrieval', { query: query.query });
        const strategies = [];
        let memories = [];
        // Strategy 1: Vector search
        if (!query.hybridSearch || query.hybridSearch) {
            const vectorResults = await this.vectorSearch(query);
            memories.push(...vectorResults);
            strategies.push('vector_search');
        }
        // Strategy 2: Graph traversal (if available and requested)
        if (this.knowledgeGraph && query.includeRelated) {
            const graphResults = await this.graphSearch(query);
            memories.push(...graphResults);
            strategies.push('graph_traversal');
        }
        // Strategy 3: User context boost
        if (this.sessionContext && query.userId) {
            memories = await this.applyUserContextBoost(query.userId, memories, query.courseId);
            strategies.push('user_context');
        }
        // Strategy 4: Recency boost
        memories = this.applyRecencyBoost(memories);
        strategies.push('recency_boost');
        // Deduplicate and sort by relevance
        memories = this.deduplicateAndSort(memories);
        // Apply filters
        if (query.memoryTypes?.length) {
            memories = memories.filter((m) => query.memoryTypes.includes(m.type));
        }
        if (query.sourceTypes?.length) {
            memories = memories.filter((m) => query.sourceTypes.includes(m.source.type));
        }
        if (query.timeRange) {
            memories = memories.filter((m) => {
                if (query.timeRange.start && m.timestamp < query.timeRange.start)
                    return false;
                if (query.timeRange.end && m.timestamp > query.timeRange.end)
                    return false;
                return true;
            });
        }
        // Apply minimum relevance filter
        const minRelevance = query.minRelevance ?? this.minRelevanceScore;
        memories = memories.filter((m) => m.relevanceScore >= minRelevance);
        // Limit results
        const limit = query.limit ?? this.defaultLimit;
        memories = memories.slice(0, limit);
        const queryTime = Date.now() - startTime;
        this.logger.info('Memory retrieval completed', {
            resultCount: memories.length,
            queryTime,
            strategies,
        });
        return {
            memories,
            totalCount: memories.length,
            queryTime,
            strategies,
        };
    }
    /**
     * Retrieve memories specifically for RAG context
     */
    async retrieveForContext(query, userId, courseId, limit) {
        const result = await this.retrieve({
            query,
            userId,
            courseId,
            limit: limit ?? 5,
            hybridSearch: true,
            includeRelated: true,
        });
        return result.memories.map((m) => m.content);
    }
    /**
     * Retrieve memories for a specific topic
     */
    async retrieveByTopic(topic, userId, courseId, limit) {
        const result = await this.retrieve({
            query: topic,
            userId,
            courseId,
            limit: limit ?? 10,
            includeRelated: true,
        });
        return result.memories;
    }
    /**
     * Retrieve recent memories
     */
    async retrieveRecent(userId, limit, courseId) {
        const options = {
            topK: limit ?? 20,
            filter: {
                userIds: [userId],
                courseIds: courseId ? [courseId] : undefined,
            },
        };
        // Get all user embeddings and sort by recency
        const results = await this.vectorStore.searchByVector(new Array(384).fill(0), // Dummy vector
        options);
        // Sort by creation date
        results.sort((a, b) => b.embedding.createdAt.getTime() - a.embedding.createdAt.getTime());
        return results.slice(0, limit ?? 20).map((r) => this.convertToMemoryItem(r));
    }
    /**
     * Retrieve related concepts
     */
    async retrieveRelatedConcepts(conceptId, limit) {
        if (!this.knowledgeGraph) {
            return [];
        }
        const related = await this.knowledgeGraph.getRelatedConcepts(conceptId, limit ?? 10);
        return related.map((entity) => ({
            id: entity.id,
            type: 'semantic',
            content: `${entity.name}: ${entity.description ?? ''}`,
            relevanceScore: 0.8,
            source: {
                type: 'course_content',
                id: entity.id,
                title: entity.name,
            },
            context: {
                relatedEntities: entity.embeddings ?? [],
                tags: [],
            },
            timestamp: entity.createdAt,
        }));
    }
    // ============================================================================
    // SEARCH STRATEGIES
    // ============================================================================
    async vectorSearch(query) {
        const searchOptions = {
            topK: (query.limit ?? this.defaultLimit) * 2, // Get more for re-ranking
            minScore: query.minRelevance ?? this.minRelevanceScore * 0.8,
            filter: {
                userIds: query.userId ? [query.userId] : undefined,
                courseIds: query.courseId ? [query.courseId] : undefined,
                sourceTypes: query.sourceTypes,
                dateRange: query.timeRange,
            },
            includeMetadata: true,
        };
        const results = await this.vectorStore.search(query.query, searchOptions);
        return results.map((r) => this.convertToMemoryItem(r));
    }
    async graphSearch(query) {
        if (!this.knowledgeGraph) {
            return [];
        }
        // Find entities matching query terms
        const entities = await this.knowledgeGraph.findEntities('concept', query.query, 10);
        if (entities.length === 0) {
            return [];
        }
        const memories = [];
        // For each matching entity, get related concepts
        for (const entity of entities) {
            const options = {
                maxDepth: 2,
                limit: 5,
                direction: 'both',
            };
            const neighbors = await this.knowledgeGraph.getNeighbors(entity.id, options);
            for (const neighbor of neighbors) {
                memories.push({
                    id: neighbor.id,
                    type: 'semantic',
                    content: `${neighbor.name}: ${neighbor.description ?? ''}`,
                    relevanceScore: 0.7, // Lower base score for graph results
                    source: {
                        type: 'course_content',
                        id: neighbor.id,
                        title: neighbor.name,
                    },
                    context: {
                        relatedEntities: [entity.id],
                        tags: [],
                    },
                    timestamp: neighbor.createdAt,
                });
            }
        }
        return memories;
    }
    async applyUserContextBoost(userId, memories, courseId) {
        if (!this.sessionContext) {
            return memories;
        }
        const context = await this.sessionContext.getContextForPrompt(userId, courseId);
        if (!context.hasContext) {
            return memories;
        }
        return memories.map((memory) => {
            let boost = 0;
            // Boost if related to current topic
            if (context.currentTopic &&
                memory.content.toLowerCase().includes(context.currentTopic.toLowerCase())) {
                boost += this.userContextBoostFactor;
            }
            // Boost if related to current goal
            if (context.currentGoal &&
                memory.content.toLowerCase().includes(context.currentGoal.toLowerCase())) {
                boost += this.userContextBoostFactor;
            }
            // Boost if related to recent concepts
            for (const concept of context.recentConcepts) {
                if (memory.content.toLowerCase().includes(concept.toLowerCase())) {
                    boost += this.userContextBoostFactor * 0.5;
                    break;
                }
            }
            // Boost if related to struggling concepts (user needs help)
            for (const concept of context.weaknesses) {
                if (memory.content.toLowerCase().includes(concept.toLowerCase())) {
                    boost += this.userContextBoostFactor;
                    break;
                }
            }
            return {
                ...memory,
                relevanceScore: Math.min(1, memory.relevanceScore + boost),
            };
        });
    }
    applyRecencyBoost(memories) {
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        return memories.map((memory) => {
            const ageInDays = (now - memory.timestamp.getTime()) / dayMs;
            // Exponential decay: recent items get a boost
            const recencyMultiplier = Math.exp(-ageInDays / 30); // 30-day half-life
            const boost = this.recencyBoostFactor * recencyMultiplier;
            return {
                ...memory,
                relevanceScore: Math.min(1, memory.relevanceScore + boost),
            };
        });
    }
    // ============================================================================
    // SPECIALIZED RETRIEVAL
    // ============================================================================
    /**
     * Retrieve prerequisites for a topic
     */
    async retrievePrerequisites(topicId, userId) {
        if (!this.knowledgeGraph) {
            return [];
        }
        const prerequisites = await this.knowledgeGraph.getPrerequisites(topicId);
        return prerequisites.map((prereq) => ({
            id: prereq.id,
            type: 'procedural',
            content: `Prerequisite: ${prereq.name} - ${prereq.description ?? ''}`,
            relevanceScore: 0.9,
            source: {
                type: 'course_content',
                id: prereq.id,
                title: prereq.name,
            },
            context: {
                userId,
                relatedEntities: [topicId],
                tags: ['prerequisite'],
            },
            timestamp: prereq.createdAt,
        }));
    }
    /**
     * Retrieve learning path context
     */
    async retrieveLearningPathContext(fromTopicId, toTopicId) {
        if (!this.knowledgeGraph) {
            return [];
        }
        const path = await this.knowledgeGraph.getLearningPath(fromTopicId, toTopicId);
        if (!path) {
            return [];
        }
        return path.steps.map((step, index) => ({
            id: step.entity.id,
            type: 'procedural',
            content: `Step ${step.order}: ${step.entity.name} - ${step.entity.description ?? ''}`,
            relevanceScore: 1 - index * 0.05, // Decrease relevance for later steps
            source: {
                type: 'course_content',
                id: step.entity.id,
                title: step.entity.name,
            },
            context: {
                relatedEntities: [fromTopicId, toTopicId],
                tags: ['learning_path', `step_${step.order}`],
            },
            timestamp: step.entity.createdAt,
        }));
    }
    /**
     * Retrieve conversation history
     * @param sessionId - Optional session filter (reserved for future use)
     */
    async retrieveConversationHistory(userId, _sessionId, limit) {
        // Note: _sessionId is reserved for future session-based filtering
        const options = {
            topK: limit ?? 10,
            filter: {
                userIds: [userId],
                sourceTypes: ['conversation', 'question', 'answer'],
            },
        };
        // Use empty query to get all matching embeddings
        const results = await this.vectorStore.searchByVector(new Array(384).fill(0), // Dummy vector
        options);
        return results.map((r) => this.convertToMemoryItem(r));
    }
    /**
     * Find similar questions/answers
     */
    async findSimilarQA(question, courseId, limit) {
        const result = await this.retrieve({
            query: question,
            courseId,
            sourceTypes: ['question', 'answer'],
            limit: limit ?? 5,
            minRelevance: 0.7,
        });
        return result.memories;
    }
    // ============================================================================
    // HYBRID SEARCH
    // ============================================================================
    /**
     * Perform hybrid search combining vector and keyword search
     */
    async hybridSearch(query, options) {
        const vectorWeight = options?.vectorWeight ?? this.hybridSearchWeight;
        const keywordWeight = 1 - vectorWeight;
        // Get vector search results
        const vectorResults = await this.vectorSearch({
            query,
            userId: options?.userId,
            courseId: options?.courseId,
            limit: (options?.limit ?? 10) * 2,
        });
        // Get keyword matches (simple implementation)
        const keywordResults = await this.keywordSearch(query, options);
        // Combine and re-rank
        const combinedMap = new Map();
        for (const item of vectorResults) {
            combinedMap.set(item.id, {
                ...item,
                relevanceScore: item.relevanceScore * vectorWeight,
            });
        }
        for (const item of keywordResults) {
            const existing = combinedMap.get(item.id);
            if (existing) {
                existing.relevanceScore += item.relevanceScore * keywordWeight;
            }
            else {
                combinedMap.set(item.id, {
                    ...item,
                    relevanceScore: item.relevanceScore * keywordWeight,
                });
            }
        }
        const memories = Array.from(combinedMap.values());
        memories.sort((a, b) => b.relevanceScore - a.relevanceScore);
        return {
            memories: memories.slice(0, options?.limit ?? 10),
            totalCount: memories.length,
            queryTime: 0,
            strategies: ['vector_search', 'keyword_match', 'hybrid'],
        };
    }
    async keywordSearch(query, options) {
        // Simple keyword matching on metadata
        // In production, this would use a full-text search engine
        const allEmbeddings = await this.vectorStore.searchByVector(new Array(384).fill(0), {
            topK: 100,
            filter: {
                userIds: options?.userId ? [options.userId] : undefined,
                courseIds: options?.courseId ? [options.courseId] : undefined,
            },
        });
        const queryTerms = query.toLowerCase().split(/\s+/);
        const results = [];
        for (const result of allEmbeddings) {
            const content = result.embedding.metadata.sourceId.toLowerCase();
            const tags = result.embedding.metadata.tags.map((t) => t.toLowerCase());
            let matchScore = 0;
            for (const term of queryTerms) {
                if (content.includes(term) || tags.some((t) => t.includes(term))) {
                    matchScore += 1 / queryTerms.length;
                }
            }
            if (matchScore > 0) {
                results.push({
                    ...this.convertToMemoryItem(result),
                    relevanceScore: matchScore,
                });
            }
        }
        return results.slice(0, options?.limit ?? 20);
    }
    // ============================================================================
    // UTILITIES
    // ============================================================================
    convertToMemoryItem(result) {
        const metadata = result.embedding.metadata;
        return {
            id: result.embedding.id,
            type: this.inferMemoryType(metadata.sourceType),
            content: metadata.sourceId, // Would typically store content separately
            relevanceScore: result.score,
            source: {
                type: metadata.sourceType,
                id: metadata.sourceId,
            },
            context: {
                userId: metadata.userId,
                courseId: metadata.courseId,
                relatedEntities: [],
                tags: metadata.tags,
            },
            timestamp: result.embedding.createdAt,
        };
    }
    inferMemoryType(sourceType) {
        switch (sourceType) {
            case 'course_content':
            case 'chapter_content':
            case 'section_content':
                return 'factual';
            case 'conversation':
            case 'question':
            case 'answer':
                return 'episodic';
            case 'summary':
                return 'semantic';
            case 'artifact':
            case 'external_resource':
                return 'contextual';
            default:
                return 'semantic';
        }
    }
    deduplicateAndSort(memories) {
        const seen = new Set();
        const unique = [];
        for (const memory of memories) {
            if (!seen.has(memory.id)) {
                seen.add(memory.id);
                unique.push(memory);
            }
            else {
                // Keep the one with higher relevance
                const existingIndex = unique.findIndex((m) => m.id === memory.id);
                if (existingIndex >= 0 &&
                    memory.relevanceScore > unique[existingIndex].relevanceScore) {
                    unique[existingIndex] = memory;
                }
            }
        }
        return unique.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    /**
     * Get retriever statistics
     */
    async getStats() {
        const vectorStats = await this.vectorStore.getStats();
        const graphStats = this.knowledgeGraph
            ? await this.knowledgeGraph.getStats()
            : null;
        return {
            vectorStore: vectorStats,
            knowledgeGraph: graphStats,
            configuration: {
                defaultLimit: this.defaultLimit,
                minRelevanceScore: this.minRelevanceScore,
                recencyBoostFactor: this.recencyBoostFactor,
                userContextBoostFactor: this.userContextBoostFactor,
                hybridSearchWeight: this.hybridSearchWeight,
            },
        };
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
export function createMemoryRetriever(config) {
    return new MemoryRetriever(config);
}
//# sourceMappingURL=memory-retriever.js.map