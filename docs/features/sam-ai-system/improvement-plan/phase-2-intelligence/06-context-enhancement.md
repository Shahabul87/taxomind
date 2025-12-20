# Initiative 6: Context Enhancement

**Timeline**: Ongoing (throughout Phase 2)
**Priority**: 🟢 Important
**Budget**: $15,000
**Status**: Not Started

---

## 📋 Overview

**The Problem**: SAM has access to multiple intelligence sources (RAG, student memory, conversation history, knowledge graph), but doesn't intelligently:
- Prioritize which context to use
- Assemble coherent context from multiple sources
- Optimize for context window limits
- Adapt context based on query type

**The Solution**: Build a context orchestration system that intelligently selects, prioritizes, and assembles context from all available sources to maximize AI response quality within context window constraints.

**Impact**:
- **Response Quality**: 30% improvement in answer relevance
- **Context Utilization**: 90%+ of retrieved context actually used
- **Cost Efficiency**: 40% reduction in wasted token usage
- **Multi-Source Coherence**: Seamless integration of all intelligence sources

---

## 🎯 Success Criteria

### Technical Metrics
- ✅ Context assembly latency <200ms (p95)
- ✅ Context window utilization 85-95% (optimal range)
- ✅ Multi-source integration success >95%
- ✅ Context compression efficiency >30%

### Quality Metrics
- ✅ Context relevance score >90%
- ✅ Source diversity >3 types per complex query
- ✅ Context coherence >85% (no contradictions)
- ✅ Priority accuracy >90% (correct source ordering)

### AI Performance Metrics
- ✅ Answer relevance improvement by 30%
- ✅ Context utilization rate >80% (used vs provided)
- ✅ Hallucination reduction by 40%
- ✅ Response latency <3 seconds (including context assembly)

### Business Metrics
- ✅ Token cost per query reduction by 40%
- ✅ User satisfaction increase to >4.5/5
- ✅ "Understood my question" rating >90%

---

## 🏗️ Architecture Design

### Context Orchestration Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Context Enhancement Pipeline                    │
└─────────────────────────────────────────────────────────────┘

User Query → Query Analysis → Multi-Source Retrieval
                 │                      │
                 │                      ▼
                 │         ┌────────────────────────┐
                 │         │  Parallel Retrieval:   │
                 │         │  • RAG chunks          │
                 │         │  • Student memory      │
                 │         │  • Conversation history│
                 │         │  • Knowledge graph     │
                 │         └────────────────────────┘
                 │                      │
                 ▼                      ▼
        ┌─────────────────┐   ┌─────────────────────┐
        │ Query Intent    │   │ Retrieved Context   │
        │ Classification  │   │ (All sources)       │
        └─────────────────┘   └─────────────────────┘
                 │                      │
                 └──────────┬───────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │  Context Prioritization  │
              │  • Relevance scoring     │
              │  • Source ranking        │
              │  • Deduplication         │
              └──────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │  Context Assembly        │
              │  • Organize by priority  │
              │  • Compress if needed    │
              │  • Ensure coherence      │
              └──────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │  Window Optimization     │
              │  • Fit to token limit    │
              │  • Truncate low priority │
              │  • Add metadata          │
              └──────────────────────────┘
                            │
                            ▼
                Optimized Context → AI Generation
```

### Context Priority Matrix

```typescript
interface ContextSource {
  type: 'RAG' | 'MEMORY' | 'CONVERSATION' | 'KNOWLEDGE_GRAPH';
  content: string;
  relevanceScore: number;
  priority: number;
  tokens: number;
}

interface QueryIntent {
  type: 'FACTUAL' | 'CONCEPTUAL' | 'PROCEDURAL' | 'DIAGNOSTIC';
  complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
  requiresContext: boolean;
}

// Priority matrix by query intent
const PRIORITY_MATRIX: Record<QueryIntent['type'], Record<ContextSource['type'], number>> = {
  FACTUAL: {
    RAG: 1,              // Highest priority for facts
    KNOWLEDGE_GRAPH: 2,
    CONVERSATION: 3,
    MEMORY: 4,
  },
  CONCEPTUAL: {
    KNOWLEDGE_GRAPH: 1,  // Highest priority for concepts
    RAG: 2,
    MEMORY: 3,
    CONVERSATION: 4,
  },
  PROCEDURAL: {
    RAG: 1,              // Highest for step-by-step
    CONVERSATION: 2,
    MEMORY: 3,
    KNOWLEDGE_GRAPH: 4,
  },
  DIAGNOSTIC: {
    MEMORY: 1,           // Highest for personalization
    CONVERSATION: 2,
    KNOWLEDGE_GRAPH: 3,
    RAG: 4,
  },
};
```

---

## 🔧 Implementation Plan

### Context Orchestrator Implementation

**File: `lib/sam/context/context-orchestrator.ts`**

```typescript
import { VectorSearch } from '../rag/vector-search';
import { StudentMemoryManager } from '../memory/student-memory';
import { ConversationWindowManager } from '../summarization/window-manager';
import { KnowledgeGraphQuery } from '../knowledge-graph/graph-query';

interface ContextRequest {
  userId: string;
  courseId: string;
  query: string;
  conversationId?: string;
  maxTokens?: number;
}

interface AssembledContext {
  content: string;
  sources: ContextSource[];
  totalTokens: number;
  metadata: {
    queryIntent: QueryIntent;
    sourcesUsed: string[];
    priorityOrder: string[];
  };
}

export class ContextOrchestrator {
  private vectorSearch: VectorSearch;
  private memoryManager: StudentMemoryManager;
  private conversationManager: ConversationWindowManager;
  private graphQuery: KnowledgeGraphQuery;

  constructor() {
    this.vectorSearch = new VectorSearch();
    this.memoryManager = new StudentMemoryManager();
    this.conversationManager = new ConversationWindowManager();
    this.graphQuery = new KnowledgeGraphQuery();
  }

  /**
   * Assemble optimized context from all sources
   */
  async assembleContext(request: ContextRequest): Promise<AssembledContext> {
    // Analyze query intent
    const intent = await this.analyzeQueryIntent(request.query);

    // Retrieve from all sources in parallel
    const [ragContext, memoryContext, conversationContext, knowledgeContext] = await Promise.all([
      this.retrieveRAGContext(request),
      this.retrieveMemoryContext(request),
      this.retrieveConversationContext(request),
      this.retrieveKnowledgeContext(request),
    ]);

    // Combine all sources
    const allSources: ContextSource[] = [
      ...ragContext,
      ...memoryContext,
      ...conversationContext,
      ...knowledgeContext,
    ];

    // Prioritize based on intent
    const prioritized = this.prioritizeSources(allSources, intent);

    // Deduplicate content
    const deduplicated = this.deduplicateSources(prioritized);

    // Optimize for context window
    const maxTokens = request.maxTokens || 8000;
    const optimized = this.optimizeForWindow(deduplicated, maxTokens);

    // Assemble final context
    const content = this.formatContext(optimized, intent);

    return {
      content,
      sources: optimized,
      totalTokens: this.estimateTokens(content),
      metadata: {
        queryIntent: intent,
        sourcesUsed: [...new Set(optimized.map(s => s.type))],
        priorityOrder: optimized.map(s => s.type),
      },
    };
  }

  /**
   * Analyze query intent
   */
  private async analyzeQueryIntent(query: string): Promise<QueryIntent> {
    // Simple heuristic-based classification
    // Can be enhanced with ML model

    const lowerQuery = query.toLowerCase();

    // Factual queries
    if (
      lowerQuery.includes('what is') ||
      lowerQuery.includes('define') ||
      lowerQuery.includes('who') ||
      lowerQuery.includes('when')
    ) {
      return {
        type: 'FACTUAL',
        complexity: query.split(' ').length > 10 ? 'MODERATE' : 'SIMPLE',
        requiresContext: true,
      };
    }

    // Conceptual queries
    if (
      lowerQuery.includes('why') ||
      lowerQuery.includes('how does') ||
      lowerQuery.includes('explain') ||
      lowerQuery.includes('concept')
    ) {
      return {
        type: 'CONCEPTUAL',
        complexity: 'MODERATE',
        requiresContext: true,
      };
    }

    // Procedural queries
    if (
      lowerQuery.includes('how to') ||
      lowerQuery.includes('steps') ||
      lowerQuery.includes('solve') ||
      lowerQuery.includes('calculate')
    ) {
      return {
        type: 'PROCEDURAL',
        complexity: 'MODERATE',
        requiresContext: true,
      };
    }

    // Diagnostic queries (about student's understanding)
    if (
      lowerQuery.includes("i don't understand") ||
      lowerQuery.includes('confused') ||
      lowerQuery.includes('help me with') ||
      lowerQuery.includes('struggling')
    ) {
      return {
        type: 'DIAGNOSTIC',
        complexity: 'COMPLEX',
        requiresContext: true,
      };
    }

    // Default
    return {
      type: 'FACTUAL',
      complexity: 'SIMPLE',
      requiresContext: false,
    };
  }

  /**
   * Retrieve RAG context
   */
  private async retrieveRAGContext(
    request: ContextRequest
  ): Promise<ContextSource[]> {
    const chunks = await this.vectorSearch.search(request.query, {
      courseId: request.courseId,
      topK: 5,
    });

    return chunks.map(chunk => ({
      type: 'RAG' as const,
      content: chunk.content,
      relevanceScore: chunk.score,
      priority: 0, // Will be set later
      tokens: this.estimateTokens(chunk.content),
    }));
  }

  /**
   * Retrieve student memory context
   */
  private async retrieveMemoryContext(
    request: ContextRequest
  ): Promise<ContextSource[]> {
    const memory = await this.memoryManager.getPersonalizationContext(
      request.userId
    );

    const content = this.formatMemoryContext(memory);

    return [
      {
        type: 'MEMORY' as const,
        content,
        relevanceScore: 0.9, // High relevance for personalization
        priority: 0,
        tokens: this.estimateTokens(content),
      },
    ];
  }

  /**
   * Retrieve conversation context
   */
  private async retrieveConversationContext(
    request: ContextRequest
  ): Promise<ContextSource[]> {
    if (!request.conversationId) return [];

    const context = await this.conversationManager.getFormattedContext(
      request.conversationId
    );

    return [
      {
        type: 'CONVERSATION' as const,
        content: context,
        relevanceScore: 0.85,
        priority: 0,
        tokens: this.estimateTokens(context),
      },
    ];
  }

  /**
   * Retrieve knowledge graph context
   */
  private async retrieveKnowledgeContext(
    request: ContextRequest
  ): Promise<ContextSource[]> {
    // Extract concepts from query
    const concepts = await this.extractConceptsFromQuery(
      request.query,
      request.courseId
    );

    if (concepts.length === 0) return [];

    // Get prerequisites and related concepts
    const contextConcepts: string[] = [];

    for (const concept of concepts) {
      const prereqs = await this.graphQuery.getPrerequisites(concept.id);
      const related = await this.graphQuery.getRelatedConcepts(concept.id);

      contextConcepts.push(
        ...prereqs.map(c => c.name),
        ...related.map(c => c.name)
      );
    }

    const content = this.formatKnowledgeContext(concepts, contextConcepts);

    return [
      {
        type: 'KNOWLEDGE_GRAPH' as const,
        content,
        relevanceScore: 0.8,
        priority: 0,
        tokens: this.estimateTokens(content),
      },
    ];
  }

  /**
   * Prioritize sources based on query intent
   */
  private prioritizeSources(
    sources: ContextSource[],
    intent: QueryIntent
  ): ContextSource[] {
    const priorityMap = PRIORITY_MATRIX[intent.type];

    return sources.map(source => ({
      ...source,
      priority: priorityMap[source.type] || 99,
    })).sort((a, b) => {
      // Sort by priority (lower = higher priority)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }

      // Within same priority, sort by relevance
      return b.relevanceScore - a.relevanceScore;
    });
  }

  /**
   * Deduplicate similar content
   */
  private deduplicateSources(sources: ContextSource[]): ContextSource[] {
    const seen = new Set<string>();
    const unique: ContextSource[] = [];

    for (const source of sources) {
      // Create fingerprint
      const fingerprint = this.createFingerprint(source.content);

      if (!seen.has(fingerprint)) {
        seen.add(fingerprint);
        unique.push(source);
      }
    }

    return unique;
  }

  /**
   * Create content fingerprint for deduplication
   */
  private createFingerprint(content: string): string {
    // Simple fingerprint: first 100 chars + length
    return content.substring(0, 100) + content.length;
  }

  /**
   * Optimize context to fit within token window
   */
  private optimizeForWindow(
    sources: ContextSource[],
    maxTokens: number
  ): ContextSource[] {
    const optimized: ContextSource[] = [];
    let usedTokens = 0;

    for (const source of sources) {
      if (usedTokens + source.tokens <= maxTokens) {
        optimized.push(source);
        usedTokens += source.tokens;
      } else {
        // Truncate source to fit
        const availableTokens = maxTokens - usedTokens;

        if (availableTokens > 100) {
          // Only include if we have at least 100 tokens available
          const truncated = this.truncateContent(
            source.content,
            availableTokens
          );

          optimized.push({
            ...source,
            content: truncated,
            tokens: availableTokens,
          });

          break; // Window full
        }
      }
    }

    return optimized;
  }

  /**
   * Truncate content to token limit
   */
  private truncateContent(content: string, maxTokens: number): string {
    const estimatedChars = maxTokens * 4; // Rough estimate
    return content.substring(0, estimatedChars) + '...';
  }

  /**
   * Format final context for AI
   */
  private formatContext(
    sources: ContextSource[],
    intent: QueryIntent
  ): string {
    const parts: string[] = [];

    // Group by type
    const byType = new Map<string, ContextSource[]>();

    for (const source of sources) {
      const existing = byType.get(source.type) || [];
      existing.push(source);
      byType.set(source.type, existing);
    }

    // Format each type
    if (byType.has('MEMORY')) {
      parts.push('STUDENT PROFILE:');
      parts.push(byType.get('MEMORY')![0].content);
      parts.push('');
    }

    if (byType.has('KNOWLEDGE_GRAPH')) {
      parts.push('CONCEPT RELATIONSHIPS:');
      parts.push(byType.get('KNOWLEDGE_GRAPH')![0].content);
      parts.push('');
    }

    if (byType.has('RAG')) {
      parts.push('RELEVANT COURSE CONTENT:');
      byType.get('RAG')!.forEach((source, i) => {
        parts.push(`[Source ${i + 1}]`);
        parts.push(source.content);
        parts.push('');
      });
    }

    if (byType.has('CONVERSATION')) {
      parts.push('CONVERSATION HISTORY:');
      parts.push(byType.get('CONVERSATION')![0].content);
    }

    return parts.join('\n');
  }

  /**
   * Estimate token count
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  // Helper methods (implementations omitted for brevity)
  private formatMemoryContext(memory: any): string {
    return `Learning style: ${memory.preferences?.learningStyle}, Known concepts: ${memory.strengths?.map(s => s.name).join(', ')}`;
  }

  private formatKnowledgeContext(concepts: any[], related: string[]): string {
    return `Concepts: ${concepts.map(c => c.name).join(', ')}, Related: ${related.join(', ')}`;
  }

  private async extractConceptsFromQuery(query: string, courseId: string): Promise<any[]> {
    return []; // Simplified
  }
}
```

---

## 📊 Metrics & Monitoring

```typescript
// lib/sam/context/metrics.ts
export const contextMetrics = {
  contextAssemblyDuration: new client.Histogram({
    name: 'sam_context_assembly_duration_seconds',
    help: 'Time to assemble context from all sources',
    buckets: [0.05, 0.1, 0.2, 0.5, 1.0],
  }),

  contextWindowUtilization: new client.Histogram({
    name: 'sam_context_window_utilization',
    help: 'Percentage of context window used',
    buckets: [0.5, 0.7, 0.8, 0.9, 0.95, 1.0],
  }),

  sourcesPerQuery: new client.Histogram({
    name: 'sam_sources_per_query',
    help: 'Number of context sources used per query',
    buckets: [1, 2, 3, 4, 5],
  }),

  contextRelevanceScore: new client.Histogram({
    name: 'sam_context_relevance_score',
    help: 'AI-evaluated context relevance (0-1)',
    buckets: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  }),
};
```

---

## ✅ Acceptance Criteria

### Technical
- [ ] Context assembly <200ms (p95)
- [ ] Window utilization 85-95%
- [ ] Multi-source integration >95%
- [ ] Compression efficiency >30%

### Quality
- [ ] Context relevance >90%
- [ ] Source diversity >3 types
- [ ] Coherence >85%
- [ ] Priority accuracy >90%

### Performance
- [ ] Answer relevance +30%
- [ ] Context utilization >80%
- [ ] Hallucination -40%
- [ ] Response latency <3s

### Business
- [ ] Token cost -40%
- [ ] Satisfaction >4.5/5
- [ ] "Understood" rating >90%

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Owner**: ML/AI Engineering Team
