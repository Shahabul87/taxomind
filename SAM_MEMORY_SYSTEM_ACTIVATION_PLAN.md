# SAM Memory System - Full Activation Plan

## Executive Summary

**Good News**: The memory system is ~70% integrated, not 5% as initially analyzed!

### What's Already Working ✅
| Component | Status | Integration |
|-----------|--------|-------------|
| OpenAI Embeddings | ✅ Built | `lib/sam/providers/openai-embedding-provider.ts` |
| Vector Store (Prisma) | ✅ Built | `lib/sam/stores/prisma-memory-stores.ts` |
| Knowledge Graph (Prisma) | ✅ Built | `lib/sam/stores/prisma-memory-stores.ts` |
| Session Context (Prisma) | ✅ Built | `lib/sam/stores/prisma-memory-stores.ts` |
| PgVector Search | ✅ Built | `lib/sam/services/pgvector-search.ts` |
| Memory Retriever | ✅ Active | Called in `/api/sam/unified/route.ts` |
| Chat Memory Storage | ✅ Active | `lib/sam/services/chat-memory-integration.ts` |

### What's Underutilized ⚠️
| Component | Issue | Impact |
|-----------|-------|--------|
| Knowledge Graph | Not being populated | No concept relationship tracking |
| Journey Timeline | Not recording events | No learning milestone history |
| Memory Extraction | Heuristic-only | Could use AI for smarter extraction |
| Cross-Session Summaries | Basic implementation | Could be richer |

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SAM Unified API Route                           │
│                   /api/sam/unified/route.ts                             │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │  getAgenticMemorySystem()  │ ← Called at lines 629, 833
                    │  lib/sam/agentic-memory.ts │
                    └───────────┬───────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  VectorStore  │     │ KnowledgeGraph│     │SessionContext │
│   (Prisma)    │     │   (Prisma)    │     │   (Prisma)    │
│  ✅ Active    │     │  ⚠️ Empty     │     │  ✅ Active    │
└───────────────┘     └───────────────┘     └───────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   MemoryRetriever     │ ← Called at line 842
                    │ retrieveForContext()  │
                    └───────────────────────┘
```

---

## Phase 1: Knowledge Graph Population (HIGH IMPACT)

### Problem
The Knowledge Graph tables exist (`SAMKnowledgeNode`, `SAMKnowledgeEdge`) but are never populated.

### Solution
Create a Knowledge Graph Builder that:
1. Extracts concepts from user learning sessions
2. Creates entity nodes for concepts, topics, skills
3. Creates relationships (prerequisites, related_to, part_of)

### Implementation

**New File**: `lib/sam/services/knowledge-graph-builder.ts`

```typescript
/**
 * Knowledge Graph Builder
 * Populates the knowledge graph from learning interactions
 */

import { db } from '@/lib/db';
import { getAgenticMemorySystem } from '../agentic-memory';
import { logger } from '@/lib/logger';

export interface ConceptExtraction {
  name: string;
  type: 'concept' | 'topic' | 'skill';
  description?: string;
  relatedTo?: string[];
  prerequisiteOf?: string[];
}

/**
 * Extract concepts from assistant response using pattern matching
 */
export function extractConceptsFromResponse(
  response: string,
  userMessage: string
): ConceptExtraction[] {
  const concepts: ConceptExtraction[] = [];

  // Pattern 1: Code block headers often indicate concepts
  const codeBlockPattern = /```(\w+)?\n.*?```/gs;
  const codeMatches = response.matchAll(codeBlockPattern);
  for (const match of codeMatches) {
    if (match[1]) {
      concepts.push({
        name: match[1],
        type: 'skill',
        description: `Programming language/technology: ${match[1]}`,
      });
    }
  }

  // Pattern 2: Headers in markdown responses
  const headerPattern = /#{1,3}\s+\*?\*?([^*\n]+)\*?\*?/g;
  const headers = response.matchAll(headerPattern);
  for (const match of headers) {
    const conceptName = match[1].trim();
    if (conceptName.length > 3 && conceptName.length < 100) {
      concepts.push({
        name: conceptName,
        type: 'topic',
      });
    }
  }

  // Pattern 3: Bolded terms often represent key concepts
  const boldPattern = /\*\*([^*]+)\*\*/g;
  const boldMatches = response.matchAll(boldPattern);
  for (const match of boldMatches) {
    const term = match[1].trim();
    if (term.length > 2 && term.length < 50 && !term.includes(':')) {
      concepts.push({
        name: term,
        type: 'concept',
      });
    }
  }

  // Deduplicate by name
  const seen = new Set<string>();
  return concepts.filter(c => {
    const key = c.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Add concepts to knowledge graph
 */
export async function addConceptsToKnowledgeGraph(
  userId: string,
  concepts: ConceptExtraction[],
  courseId?: string
): Promise<void> {
  if (concepts.length === 0) return;

  const memorySystem = getAgenticMemorySystem();

  for (const concept of concepts) {
    try {
      // Check if entity already exists
      const existing = await memorySystem.knowledgeGraph.findEntities(
        concept.type as 'concept' | 'topic' | 'skill',
        concept.name,
        1
      );

      let entityId: string;

      if (existing.length > 0) {
        entityId = existing[0].id;
      } else {
        // Create new entity
        const entity = await memorySystem.knowledgeGraph.createEntity({
          type: concept.type as 'concept' | 'topic' | 'skill',
          name: concept.name,
          description: concept.description,
          properties: {
            userId,
            courseId,
            learnedAt: new Date().toISOString(),
          },
        });
        entityId = entity.id;
      }

      // Create relationships for related concepts
      if (concept.relatedTo) {
        for (const relatedName of concept.relatedTo) {
          const related = await memorySystem.knowledgeGraph.findEntities(
            'concept',
            relatedName,
            1
          );
          if (related.length > 0) {
            await memorySystem.knowledgeGraph.createRelationship({
              type: 'related_to',
              sourceId: entityId,
              targetId: related[0].id,
              weight: 0.7,
              properties: {},
            });
          }
        }
      }

      logger.debug('[KnowledgeGraph] Added concept', { name: concept.name, type: concept.type });
    } catch (error) {
      logger.warn('[KnowledgeGraph] Failed to add concept', { concept, error });
    }
  }
}

/**
 * Record that a user has learned/interacted with a concept
 */
export async function recordConceptInteraction(
  userId: string,
  conceptName: string,
  interactionType: 'learned' | 'struggled' | 'mastered' | 'reviewed'
): Promise<void> {
  const memorySystem = getAgenticMemorySystem();

  // Find or create user node
  let userNodes = await memorySystem.knowledgeGraph.findEntities('user', userId, 1);
  let userNodeId: string;

  if (userNodes.length === 0) {
    const userNode = await memorySystem.knowledgeGraph.createEntity({
      type: 'user',
      name: userId,
      properties: { userId },
    });
    userNodeId = userNode.id;
  } else {
    userNodeId = userNodes[0].id;
  }

  // Find concept node
  const conceptNodes = await memorySystem.knowledgeGraph.findEntities('concept', conceptName, 1);
  if (conceptNodes.length === 0) return;

  // Create relationship based on interaction type
  const relationshipType = interactionType === 'mastered' ? 'mastered_by'
    : interactionType === 'struggled' ? 'struggled_with'
    : 'completed';

  await memorySystem.knowledgeGraph.createRelationship({
    type: relationshipType as 'mastered_by' | 'struggled_with' | 'completed',
    sourceId: conceptNodes[0].id,
    targetId: userNodeId,
    weight: interactionType === 'mastered' ? 1.0 : interactionType === 'struggled' ? 0.3 : 0.7,
    properties: {
      timestamp: new Date().toISOString(),
      interactionType,
    },
  });
}
```

### Integration Point
Add to `/api/sam/unified/route.ts` after LLM response (around line 1020):

```typescript
// After successful response, extract and store concepts
try {
  const concepts = extractConceptsFromResponse(fullResponse, message);
  if (concepts.length > 0) {
    await addConceptsToKnowledgeGraph(user.id, concepts, entityContext.course?.id);
    logger.debug('[SAM_UNIFIED] Extracted concepts to knowledge graph', { count: concepts.length });
  }
} catch (kgError) {
  logger.warn('[SAM_UNIFIED] Failed to extract concepts', kgError);
}
```

---

## Phase 2: Journey Timeline Recording (MEDIUM IMPACT)

### Problem
Learning events and milestones aren't being tracked in the Journey Timeline.

### Solution
Create a Journey Timeline Service that records key learning events.

### Implementation

**File**: `lib/sam/journey-timeline-service.ts` (already exists, enhance it)

Add these tracking calls to unified route:

```typescript
// Record when user starts a learning session
await recordJourneyEvent(userId, {
  type: 'session_start',
  data: { courseId, chapterId, topic: currentTopic },
  impact: { sessionCount: 1 },
});

// Record when user asks a question
await recordJourneyEvent(userId, {
  type: 'asked_question',
  data: { question: message, topic: extractedTopic },
  impact: { engagementScore: 1 },
});

// Record when user receives help (after response)
await recordJourneyEvent(userId, {
  type: 'received_help',
  data: { topic: extractedTopic, responseQuality: confidenceScore },
  impact: { xpGained: 10 },
});

// Record concept mastery (after orchestration evaluation shows completion)
if (evaluation?.stepComplete) {
  await recordJourneyEvent(userId, {
    type: 'mastered_concept',
    data: { concept: currentStep.title },
    impact: { xpGained: 50, skillsAffected: [currentStep.title] },
  });
}
```

---

## Phase 3: Enhanced Memory Retrieval (OPTIMIZATION)

### Problem
Memory retrieval works but could be smarter with hybrid search.

### Solution
Enhance `MemoryRetriever` to combine:
1. Vector similarity search
2. Knowledge graph traversal
3. Recency boosting
4. User context filtering

### Current Code Location
`packages/agentic/src/memory/memory-retriever.ts`

### Enhancement

```typescript
// In retrieveForContext(), add knowledge graph context
async retrieveForContext(
  query: string,
  userId: string,
  courseId?: string,
  maxResults: number = 5
): Promise<string[]> {
  const results: string[] = [];

  // 1. Vector similarity search (existing)
  const vectorResults = await this.vectorStore.search(query, {
    topK: maxResults,
    minScore: 0.7,
    filter: { userIds: [userId], courseIds: courseId ? [courseId] : undefined },
  });

  // 2. Knowledge graph context (NEW)
  const conceptsInQuery = await this.extractConceptsFromQuery(query);
  for (const concept of conceptsInQuery) {
    const neighbors = await this.knowledgeGraph.getNeighbors(concept.id, {
      relationshipTypes: ['prerequisite_of', 'related_to'],
      maxDepth: 2,
    });
    for (const neighbor of neighbors.slice(0, 3)) {
      results.push(`Related concept: ${neighbor.name} - ${neighbor.description || ''}`);
    }
  }

  // 3. Session context (existing, enhanced)
  const sessionContext = await this.sessionContext.get(userId, courseId);
  if (sessionContext) {
    // Add mastered concepts as context
    if (sessionContext.insights.masteredConcepts.length > 0) {
      results.push(`You've already mastered: ${sessionContext.insights.masteredConcepts.slice(0, 5).join(', ')}`);
    }
    // Add struggling concepts to focus on
    if (sessionContext.insights.strugglingConcepts.length > 0) {
      results.push(`Areas to review: ${sessionContext.insights.strugglingConcepts.slice(0, 3).join(', ')}`);
    }
  }

  return results.slice(0, maxResults);
}
```

---

## Phase 4: AI-Powered Memory Extraction (ENHANCEMENT)

### Problem
`analyzeForMemoryExtraction()` in `chat-memory-integration.ts` uses heuristics only.

### Solution
Add optional AI-powered extraction using Claude.

### Implementation

**File**: `lib/sam/services/ai-memory-extractor.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';
import type { MemoryExtractionResult } from './chat-memory-integration';

const anthropic = new Anthropic();

export async function extractMemoryWithAI(
  userMessage: string,
  assistantResponse: string,
  context?: { emotion?: string; bloomsLevel?: string }
): Promise<MemoryExtractionResult> {
  const prompt = `Analyze this learning interaction and determine if it should be stored as a long-term memory.

User message: "${userMessage}"
Assistant response: "${assistantResponse.slice(0, 500)}..."
${context?.emotion ? `User emotion: ${context.emotion}` : ''}
${context?.bloomsLevel ? `Bloom's level: ${context.bloomsLevel}` : ''}

Respond in JSON format:
{
  "shouldStore": boolean,
  "memoryType": "INTERACTION" | "LEARNING_EVENT" | "STRUGGLE_POINT" | "PREFERENCE" | "FEEDBACK" | null,
  "title": "short descriptive title" | null,
  "importance": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "tags": ["tag1", "tag2"],
  "reasoning": "why this should/shouldn't be stored"
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const result = JSON.parse(text);

    return {
      shouldStore: result.shouldStore,
      memoryType: result.memoryType,
      title: result.title,
      content: result.shouldStore ? `${userMessage}\n\n${assistantResponse.slice(0, 500)}` : undefined,
      importance: result.importance,
      tags: result.tags,
    };
  } catch {
    // Fallback to heuristic extraction
    return { shouldStore: false };
  }
}
```

---

## Implementation Checklist

### Phase 1: Knowledge Graph (Week 1)
- [ ] Create `lib/sam/services/knowledge-graph-builder.ts`
- [ ] Add concept extraction to unified route
- [ ] Test with real learning sessions
- [ ] Verify nodes/edges in database

### Phase 2: Journey Timeline (Week 1)
- [ ] Enhance `lib/sam/journey-timeline-service.ts`
- [ ] Add event recording to unified route
- [ ] Add milestone tracking
- [ ] Test event recording

### Phase 3: Enhanced Retrieval (Week 2)
- [ ] Update `packages/agentic/src/memory/memory-retriever.ts`
- [ ] Add knowledge graph traversal
- [ ] Add recency boosting
- [ ] Test retrieval quality

### Phase 4: AI Extraction (Week 2)
- [ ] Create `lib/sam/services/ai-memory-extractor.ts`
- [ ] Integrate into chat-memory-integration
- [ ] Add feature flag for AI vs heuristic
- [ ] Test extraction accuracy

---

## Files to Create/Modify

| File | Action | Priority |
|------|--------|----------|
| `lib/sam/services/knowledge-graph-builder.ts` | CREATE | P1 |
| `app/api/sam/unified/route.ts` | MODIFY | P1 |
| `lib/sam/journey-timeline-service.ts` | ENHANCE | P2 |
| `packages/agentic/src/memory/memory-retriever.ts` | ENHANCE | P2 |
| `lib/sam/services/ai-memory-extractor.ts` | CREATE | P3 |
| `lib/sam/services/chat-memory-integration.ts` | MODIFY | P3 |

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Knowledge Graph Nodes | 0 | 100+ per active user |
| Knowledge Graph Edges | 0 | 200+ per active user |
| Journey Events/Day | 0 | 10+ per active user |
| Memory Retrieval Relevance | ~60% | 85%+ |
| Cross-Session Context | Basic | Rich insights |

---

## Notes

1. **OpenAI API Key Required**: Memory system uses OpenAI for embeddings
2. **Prisma Models Exist**: `SAMKnowledgeNode`, `SAMKnowledgeEdge`, `SAMSessionContext` are ready
3. **Non-Blocking**: All memory operations should be wrapped in try/catch to not break main flow
4. **Gradual Rollout**: Can be feature-flagged for testing

---

*Created: January 2025*
*Status: Ready for Implementation*
