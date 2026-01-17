/**
 * @sam-ai/agentic - Memory Normalizer
 * Standardizes memory outputs for consistent LLM context injection
 */
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_NORMALIZER_CONFIG } from './types';
// ============================================================================
// MEMORY NORMALIZER IMPLEMENTATION
// ============================================================================
export class MemoryNormalizer {
    config;
    logger;
    constructor(options) {
        this.config = { ...DEFAULT_NORMALIZER_CONFIG, ...options?.config };
        this.logger = options?.logger ?? console;
    }
    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------
    getConfig() {
        return { ...this.config };
    }
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
    // -------------------------------------------------------------------------
    // Normalization
    // -------------------------------------------------------------------------
    async normalize(input) {
        const startTime = Date.now();
        const sources = [];
        const strategies = [];
        const segments = [];
        let totalItemsFound = 0;
        this.logger.debug('Normalizing memory input', {
            userId: input.userId,
            courseId: input.courseId,
            hasQuery: !!input.query,
        });
        // Process vector results
        if (input.vectorResults?.length) {
            const vectorStartTime = Date.now();
            const vectorSegments = this.processVectorResults(input.vectorResults, input.courseId);
            segments.push(...vectorSegments);
            totalItemsFound += input.vectorResults.length;
            sources.push({
                type: 'vector_store',
                id: 'primary',
                name: 'Vector Store',
            });
            strategies.push({
                type: 'semantic_search',
                durationMs: Date.now() - vectorStartTime,
                resultsCount: input.vectorResults.length,
                avgRelevance: this.calculateAvgRelevance(input.vectorResults.map((r) => r.score)),
            });
        }
        // Process graph results
        if (input.graphResults?.length) {
            const graphStartTime = Date.now();
            const graphSegments = this.processGraphResults(input.graphResults);
            segments.push(...graphSegments);
            totalItemsFound += input.graphResults.length;
            sources.push({
                type: 'knowledge_graph',
                id: 'primary',
                name: 'Knowledge Graph',
            });
            strategies.push({
                type: 'graph_traversal',
                durationMs: Date.now() - graphStartTime,
                resultsCount: input.graphResults.length,
                avgRelevance: 0.7, // Default relevance for graph results
            });
        }
        // Process session context
        if (input.sessionContext) {
            const sessionSegment = this.processSessionContext(input.sessionContext);
            if (sessionSegment.items.length > 0) {
                segments.push(sessionSegment);
                totalItemsFound += sessionSegment.items.length;
                sources.push({
                    type: 'session_context',
                    id: 'current',
                    name: 'Current Session',
                });
            }
        }
        // Process journey events
        if (input.journeyEvents?.length) {
            const journeySegment = this.processJourneyEvents(input.journeyEvents);
            if (journeySegment.items.length > 0) {
                segments.push(journeySegment);
                totalItemsFound += input.journeyEvents.length;
                sources.push({
                    type: 'journey_timeline',
                    id: 'user',
                    name: 'Learning Journey',
                });
            }
        }
        // Sort segments by priority
        segments.sort((a, b) => b.priority - a.priority);
        // Apply token budget and truncation
        const { truncatedSegments, truncated, estimatedTokens } = this.applyTokenBudget(segments);
        // Calculate overall relevance
        const relevanceScore = this.calculateOverallRelevance(truncatedSegments);
        const context = {
            id: uuidv4(),
            userId: input.userId,
            courseId: input.courseId,
            generatedAt: new Date(),
            generationTimeMs: Date.now() - startTime,
            segments: truncatedSegments,
            relevanceScore,
            sources,
            strategies,
            metadata: {
                query: input.query,
                totalItemsFound,
                filteredItems: this.countItems(truncatedSegments),
                estimatedTokens,
                truncated,
            },
        };
        this.logger.info('Memory normalization complete', {
            contextId: context.id,
            segmentCount: context.segments.length,
            itemCount: context.metadata.filteredItems,
            estimatedTokens: context.metadata.estimatedTokens,
            durationMs: context.generationTimeMs,
        });
        return context;
    }
    // -------------------------------------------------------------------------
    // Processing Methods
    // -------------------------------------------------------------------------
    processVectorResults(results, _courseId) {
        if (!results?.length)
            return [];
        // Group by source type
        const groups = {};
        for (const result of results) {
            const sourceType = result.metadata.sourceType || 'unknown';
            const segmentType = this.mapSourceToSegmentType(sourceType);
            if (!groups[segmentType]) {
                groups[segmentType] = [];
            }
            // Check minimum relevance
            if (result.score < this.config.minRelevanceScore) {
                continue;
            }
            const item = {
                id: result.id,
                type: this.mapToItemType(sourceType),
                content: this.truncateContent(result.content),
                summary: this.config.includeSummaries
                    ? this.generateSummary(result.content)
                    : undefined,
                relevanceScore: result.score,
                source: {
                    type: 'vector_store',
                    id: result.id,
                    name: result.metadata.title || undefined,
                },
                createdAt: new Date(result.metadata.createdAt || Date.now()),
                metadata: result.metadata,
            };
            groups[segmentType].push(item);
        }
        // Create segments
        const segments = [];
        for (const [type, items] of Object.entries(groups)) {
            // Sort by relevance and limit
            const sortedItems = items
                .sort((a, b) => b.relevanceScore - a.relevanceScore)
                .slice(0, this.config.maxItemsPerSegment);
            if (sortedItems.length > 0) {
                segments.push({
                    type: type,
                    title: this.getSegmentTitle(type),
                    items: sortedItems,
                    relevanceScore: this.calculateAvgRelevance(sortedItems.map((i) => i.relevanceScore)),
                    priority: this.getSegmentPriority(type),
                });
            }
        }
        return segments;
    }
    processGraphResults(results) {
        if (!results?.length)
            return [];
        const items = results.map((result) => ({
            id: result.entity.id,
            type: 'concept',
            content: `${result.entity.name}: ${JSON.stringify(result.entity.properties)}`,
            relevanceScore: 0.7, // Default for graph results
            source: {
                type: 'knowledge_graph',
                id: result.entity.id,
                name: result.entity.name,
            },
            createdAt: new Date(),
            metadata: {
                entityType: result.entity.type,
                relationships: result.relationships,
                depth: result.depth,
            },
        }));
        return [
            {
                type: 'related_concepts',
                title: 'Related Concepts',
                items: items.slice(0, this.config.maxItemsPerSegment),
                relevanceScore: 0.7,
                priority: this.getSegmentPriority('related_concepts'),
            },
        ];
    }
    processSessionContext(context) {
        const items = [];
        if (context?.currentTopic) {
            items.push({
                id: 'current-topic',
                type: 'text',
                content: `Current topic: ${context.currentTopic}`,
                relevanceScore: 0.9,
                source: { type: 'session_context', id: 'topic' },
                createdAt: new Date(),
                metadata: {},
            });
        }
        if (context?.recentConcepts?.length) {
            items.push({
                id: 'recent-concepts',
                type: 'concept',
                content: `Recently discussed: ${context.recentConcepts.join(', ')}`,
                relevanceScore: 0.8,
                source: { type: 'session_context', id: 'concepts' },
                createdAt: new Date(),
                metadata: { concepts: context.recentConcepts },
            });
        }
        if (context?.pendingQuestions?.length) {
            items.push({
                id: 'pending-questions',
                type: 'question',
                content: `Pending questions: ${context.pendingQuestions.join('; ')}`,
                relevanceScore: 0.85,
                source: { type: 'session_context', id: 'questions' },
                createdAt: new Date(),
                metadata: { questions: context.pendingQuestions },
            });
        }
        return {
            type: 'user_history',
            title: 'Current Session',
            items,
            relevanceScore: items.length > 0 ? 0.85 : 0,
            priority: this.getSegmentPriority('user_history'),
        };
    }
    processJourneyEvents(events) {
        if (!events?.length) {
            return {
                type: 'recent_activity',
                title: 'Recent Activity',
                items: [],
                relevanceScore: 0,
                priority: this.getSegmentPriority('recent_activity'),
            };
        }
        const items = events
            .slice(0, this.config.maxItemsPerSegment)
            .map((event) => ({
            id: `journey-${event.timestamp.getTime()}`,
            type: 'progress',
            content: `${event.type}: ${JSON.stringify(event.data)}`,
            relevanceScore: 0.6,
            source: { type: 'journey_timeline', id: event.type },
            createdAt: event.timestamp,
            metadata: event.data,
        }));
        return {
            type: 'recent_activity',
            title: 'Recent Activity',
            items,
            relevanceScore: items.length > 0 ? 0.6 : 0,
            priority: this.getSegmentPriority('recent_activity'),
        };
    }
    // -------------------------------------------------------------------------
    // Formatting Methods
    // -------------------------------------------------------------------------
    formatForPrompt(context) {
        const lines = ['## Relevant Context'];
        for (const segment of context.segments) {
            if (segment.items.length === 0)
                continue;
            lines.push(`\n### ${segment.title}`);
            for (const item of segment.items) {
                const content = item.summary ?? item.content;
                lines.push(`- ${content}`);
            }
        }
        if (context.metadata.truncated) {
            lines.push('\n*Note: Context has been summarized due to length constraints.*');
        }
        return lines.join('\n');
    }
    formatAsStructuredData(context) {
        const segments = context.segments.map((segment) => ({
            type: segment.type,
            title: segment.title,
            itemCount: segment.items.length,
            topItems: segment.items.slice(0, 3).map((item) => ({
                content: item.summary ?? item.content.substring(0, 200),
                relevance: item.relevanceScore,
            })),
        }));
        const allItems = context.segments.flatMap((s) => s.items);
        const avgRelevance = this.calculateAvgRelevance(allItems.map((i) => i.relevanceScore));
        return {
            summary: this.generateContextSummary(context),
            segments,
            sources: context.sources.map((s) => s.name ?? s.type),
            stats: {
                totalItems: allItems.length,
                avgRelevance,
                tokenEstimate: context.metadata.estimatedTokens,
            },
        };
    }
    // -------------------------------------------------------------------------
    // Helper Methods
    // -------------------------------------------------------------------------
    mapSourceToSegmentType(sourceType) {
        const mapping = {
            course_content: 'course_content',
            chapter_content: 'course_content',
            section_content: 'course_content',
            conversation: 'previous_conversations',
            user_note: 'user_notes',
            question: 'previous_conversations',
            answer: 'previous_conversations',
            external_resource: 'external_knowledge',
        };
        return mapping[sourceType] ?? 'course_content';
    }
    mapToItemType(sourceType) {
        const mapping = {
            conversation: 'conversation_turn',
            question: 'question',
            answer: 'answer',
            user_note: 'note',
            artifact: 'artifact',
        };
        return mapping[sourceType] ?? 'text';
    }
    getSegmentTitle(type) {
        const titles = {
            course_content: 'Course Content',
            user_history: 'Your History',
            previous_conversations: 'Previous Discussions',
            related_concepts: 'Related Concepts',
            learning_progress: 'Learning Progress',
            user_notes: 'Your Notes',
            external_knowledge: 'Additional Resources',
            recent_activity: 'Recent Activity',
        };
        return titles[type] ?? type;
    }
    getSegmentPriority(type) {
        const index = this.config.segmentPriority.indexOf(type);
        return index >= 0 ? this.config.segmentPriority.length - index : 0;
    }
    truncateContent(content) {
        if (content.length <= this.config.maxContentLength) {
            return content;
        }
        return content.substring(0, this.config.maxContentLength - 3) + '...';
    }
    generateSummary(content) {
        if (content.length <= this.config.maxSummaryLength) {
            return undefined;
        }
        // Simple summary: first sentence or truncated
        const firstSentence = content.match(/^[^.!?]*[.!?]/)?.[0];
        if (firstSentence && firstSentence.length <= this.config.maxSummaryLength) {
            return firstSentence;
        }
        return content.substring(0, this.config.maxSummaryLength - 3) + '...';
    }
    generateContextSummary(context) {
        const segmentNames = context.segments
            .filter((s) => s.items.length > 0)
            .map((s) => s.title)
            .join(', ');
        const itemCount = this.countItems(context.segments);
        return `Context includes ${itemCount} items from: ${segmentNames}`;
    }
    calculateAvgRelevance(scores) {
        if (scores.length === 0)
            return 0;
        return scores.reduce((sum, s) => sum + s, 0) / scores.length;
    }
    calculateOverallRelevance(segments) {
        if (segments.length === 0)
            return 0;
        const weightedSum = segments.reduce((sum, seg) => sum + seg.relevanceScore * seg.priority, 0);
        const totalWeight = segments.reduce((sum, seg) => sum + seg.priority, 0);
        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }
    countItems(segments) {
        return segments.reduce((sum, seg) => sum + seg.items.length, 0);
    }
    applyTokenBudget(segments) {
        let totalChars = 0;
        const truncatedSegments = [];
        let truncated = false;
        for (const segment of segments) {
            const segmentChars = segment.items.reduce((sum, item) => sum + (item.summary ?? item.content).length, 0);
            if (totalChars + segmentChars <= this.config.tokenBudget * this.config.charsPerToken) {
                truncatedSegments.push(segment);
                totalChars += segmentChars;
            }
            else {
                // Partial inclusion
                const remainingBudget = this.config.tokenBudget * this.config.charsPerToken - totalChars;
                if (remainingBudget > 200) {
                    // Only include if we have meaningful space
                    let includedChars = 0;
                    const includedItems = [];
                    for (const item of segment.items) {
                        const itemChars = (item.summary ?? item.content).length;
                        if (includedChars + itemChars <= remainingBudget) {
                            includedItems.push(item);
                            includedChars += itemChars;
                        }
                    }
                    if (includedItems.length > 0) {
                        truncatedSegments.push({
                            ...segment,
                            items: includedItems,
                        });
                        totalChars += includedChars;
                    }
                }
                truncated = true;
                break;
            }
        }
        return {
            truncatedSegments,
            truncated,
            estimatedTokens: Math.ceil(totalChars / this.config.charsPerToken),
        };
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
export function createMemoryNormalizer(options) {
    return new MemoryNormalizer(options);
}
//# sourceMappingURL=memory-normalizer.js.map