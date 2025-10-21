# Initiative 5: Knowledge Graph Foundation

**Timeline**: Weeks 23-24 (2 weeks)
**Priority**: 🟢 Important
**Budget**: $25,000
**Status**: Not Started

---

## 📋 Overview

**The Problem**: Current SAM treats concepts as isolated entities without understanding:
- Prerequisites (what to learn first)
- Relationships between concepts
- Concept hierarchies (parent/child)
- Learning paths (optimal sequence)

**The Solution**: Build a knowledge graph that maps relationships between course concepts, enabling SAM to:
- Recommend prerequisites before advanced topics
- Suggest related concepts for deeper learning
- Generate optimal learning paths
- Understand concept dependencies

**Impact**:
- **Learning Efficiency**: 30% faster learning through proper sequencing
- **Recommendation Quality**: "Learn this first" suggestions
- **Concept Discovery**: "Related topics" recommendations
- **Path Optimization**: Personalized learning sequences

---

## 🎯 Success Criteria

### Technical Metrics
- ✅ Knowledge graph coverage >70% of course concepts
- ✅ Relationship extraction accuracy >80%
- ✅ Graph query latency <50ms (p95)
- ✅ Prerequisite detection accuracy >85%

### Quality Metrics
- ✅ Concept similarity accuracy >80%
- ✅ Learning path coherence >90%
- ✅ Relationship type accuracy >85%
- ✅ No orphaned concepts (<5% disconnected nodes)

### User Experience Metrics
- ✅ "Prerequisites helpful" rating >85%
- ✅ "Related concepts" click rate >50%
- ✅ Learning path follow-through >70%
- ✅ Concept discovery increase by 40%

### Business Metrics
- ✅ Course completion rate increase by 25%
- ✅ Student engagement with suggestions >60%
- ✅ Learning efficiency improvement by 30%

---

## 🏗️ Architecture Design

### Knowledge Graph Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Knowledge Graph Schema                    │
└─────────────────────────────────────────────────────────────┘

         [Course: Algebra]
                │
        ┌───────┴───────┐
        │               │
   [Chapter 1]    [Chapter 2: Quadratics]
        │               │
        │       ┌───────┴───────┐
        │       │               │
  [Linear    [Quadratic    [Factoring]
  Equations]  Formula]          │
        │       │               │
        └───────┼───────────────┘
                │
         PREREQUISITE relationships
         RELATED_TO relationships
         PART_OF relationships
         ENABLES relationships

Relationship Types:
• PREREQUISITE: Must learn A before B
• RELATED_TO: Concepts are connected
• PART_OF: Concept hierarchy
• ENABLES: Learning A enables understanding B
• SIMILAR_TO: Concepts are similar
```

### Knowledge Graph Schema

```prisma
model Concept {
  id              String   @id @default(uuid())
  courseId        String
  name            String
  description     String?  @db.Text
  conceptType     ConceptType @default(TOPIC)

  // Embeddings for similarity
  embedding       Json?    // Vector representation

  // Learning metadata
  difficulty      Difficulty @default(MEDIUM)
  estimatedMinutes Int?
  bloomLevel      BloomLevel @default(UNDERSTAND)

  // Relationships (as source)
  outgoingEdges   ConceptEdge[] @relation("SourceConcept")
  incomingEdges   ConceptEdge[] @relation("TargetConcept")

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([courseId, name])
  @@index([courseId])
}

model ConceptEdge {
  id              String   @id @default(uuid())

  // Source → Target
  sourceId        String
  source          Concept  @relation("SourceConcept", fields: [sourceId], references: [id])

  targetId        String
  target          Concept  @relation("TargetConcept", fields: [targetId], references: [id])

  // Relationship metadata
  relationshipType RelationshipType
  strength        Float    @default(0.5) // 0-1 confidence
  isVerified      Boolean  @default(false) // Human-verified

  createdAt       DateTime @default(now())

  @@unique([sourceId, targetId, relationshipType])
  @@index([sourceId])
  @@index([targetId])
  @@index([relationshipType])
}

enum ConceptType {
  COURSE         // Top-level course
  CHAPTER        // Chapter/module
  TOPIC          // Main concept/topic
  SUBTOPIC       // Sub-concept
  SKILL          // Specific skill
  TOOL           // Tool or technique
}

enum RelationshipType {
  PREREQUISITE   // A must be learned before B
  RELATED_TO     // A and B are related
  PART_OF        // A is part of B (hierarchy)
  ENABLES        // Learning A enables understanding B
  SIMILAR_TO     // A and B are similar concepts
  EXAMPLE_OF     // A is an example of B
}

enum Difficulty {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}

enum BloomLevel {
  REMEMBER
  UNDERSTAND
  APPLY
  ANALYZE
  EVALUATE
  CREATE
}
```

---

## 🔧 Implementation Plan

### Week 23: Concept Extraction & Graph Construction

#### Day 1-2: Concept Extractor

**File: `lib/sam/knowledge-graph/concept-extractor.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';

interface ExtractedConcept {
  name: string;
  description: string;
  conceptType: 'TOPIC' | 'SUBTOPIC' | 'SKILL';
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  bloomLevel: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
  estimatedMinutes?: number;
}

interface ExtractedRelationship {
  source: string;
  target: string;
  type: 'PREREQUISITE' | 'RELATED_TO' | 'PART_OF' | 'ENABLES';
  strength: number;
}

interface ConceptExtractionResult {
  concepts: ExtractedConcept[];
  relationships: ExtractedRelationship[];
}

export class ConceptExtractor {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Extract concepts from course content
   */
  async extractFromCourse(courseId: string): Promise<ConceptExtractionResult> {
    // Get all course content
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          include: {
            sections: true,
          },
        },
      },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    const allConcepts: ExtractedConcept[] = [];
    const allRelationships: ExtractedRelationship[] = [];

    // Extract from each chapter
    for (const chapter of course.chapters) {
      const chapterContent = this.formatChapterContent(chapter);

      const result = await this.extractConceptsFromText(
        chapterContent,
        'CHAPTER'
      );

      allConcepts.push(...result.concepts);
      allRelationships.push(...result.relationships);
    }

    // Extract inter-chapter relationships
    const interChapterRelationships = await this.extractChapterRelationships(
      course.chapters
    );

    allRelationships.push(...interChapterRelationships);

    return {
      concepts: allConcepts,
      relationships: allRelationships,
    };
  }

  /**
   * Extract concepts from text using Claude
   */
  private async extractConceptsFromText(
    content: string,
    contextType: 'COURSE' | 'CHAPTER' | 'SECTION'
  ): Promise<ConceptExtractionResult> {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `You are an expert at extracting educational concepts from course materials.

Analyze the following ${contextType} content and extract:
1. Main concepts/topics (5-15 concepts)
2. Relationships between concepts (PREREQUISITE, RELATED_TO, PART_OF, ENABLES)

For each concept, provide:
- name: Clear, concise name
- description: 1-2 sentence description
- conceptType: TOPIC, SUBTOPIC, or SKILL
- difficulty: BEGINNER, INTERMEDIATE, or ADVANCED
- bloomLevel: REMEMBER, UNDERSTAND, APPLY, ANALYZE, EVALUATE, or CREATE
- estimatedMinutes: Estimated learning time (optional)

For each relationship, provide:
- source: Source concept name
- target: Target concept name
- type: PREREQUISITE, RELATED_TO, PART_OF, or ENABLES
- strength: Confidence 0.0-1.0

Return ONLY valid JSON:
{
  "concepts": [
    {
      "name": "Quadratic Formula",
      "description": "Formula for solving quadratic equations",
      "conceptType": "TOPIC",
      "difficulty": "INTERMEDIATE",
      "bloomLevel": "APPLY",
      "estimatedMinutes": 30
    }
  ],
  "relationships": [
    {
      "source": "Basic Algebra",
      "target": "Quadratic Formula",
      "type": "PREREQUISITE",
      "strength": 0.9
    }
  ]
}

CONTENT:
${content.substring(0, 10000)}

Return ONLY the JSON, no other text.`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '{}';

    try {
      return JSON.parse(text);
    } catch (error) {
      console.error('Failed to parse concept extraction:', error);
      return { concepts: [], relationships: [] };
    }
  }

  /**
   * Extract relationships between chapters
   */
  private async extractChapterRelationships(
    chapters: any[]
  ): Promise<ExtractedRelationship[]> {
    const chapterTitles = chapters.map(c => c.title);

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: `Given these course chapters in order, identify PREREQUISITE relationships (which chapters should be learned before others):

${chapterTitles.map((title, i) => `${i + 1}. ${title}`).join('\n')}

Return JSON array:
[
  {
    "source": "Chapter Title A",
    "target": "Chapter Title B",
    "type": "PREREQUISITE",
    "strength": 0.9
  }
]

Return ONLY the JSON array.`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '[]';

    try {
      return JSON.parse(text);
    } catch {
      return [];
    }
  }

  /**
   * Format chapter content for extraction
   */
  private formatChapterContent(chapter: any): string {
    const parts: string[] = [];

    parts.push(`Chapter: ${chapter.title}`);

    if (chapter.description) {
      parts.push(`Description: ${chapter.description}`);
    }

    for (const section of chapter.sections || []) {
      parts.push(`\nSection: ${section.title}`);

      if (section.description) {
        parts.push(section.description);
      }
    }

    return parts.join('\n');
  }
}
```

#### Day 3-4: Knowledge Graph Builder

**File: `lib/sam/knowledge-graph/graph-builder.ts`**

```typescript
import { db } from '@/lib/db';
import { ConceptExtractor } from './concept-extractor';
import OpenAI from 'openai';

export class KnowledgeGraphBuilder {
  private conceptExtractor: ConceptExtractor;
  private openai: OpenAI;

  constructor() {
    this.conceptExtractor = new ConceptExtractor();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Build knowledge graph for a course
   */
  async buildGraphForCourse(courseId: string): Promise<void> {
    console.log(`Building knowledge graph for course ${courseId}...`);

    // Extract concepts and relationships
    const { concepts, relationships } = await this.conceptExtractor.extractFromCourse(
      courseId
    );

    console.log(`Extracted ${concepts.length} concepts, ${relationships.length} relationships`);

    // Create concept nodes with embeddings
    const conceptIds = new Map<string, string>();

    for (const concept of concepts) {
      const embedding = await this.generateEmbedding(
        `${concept.name}: ${concept.description}`
      );

      const created = await db.concept.create({
        data: {
          courseId,
          name: concept.name,
          description: concept.description,
          conceptType: concept.conceptType,
          difficulty: concept.difficulty,
          bloomLevel: concept.bloomLevel,
          estimatedMinutes: concept.estimatedMinutes,
          embedding,
        },
      });

      conceptIds.set(concept.name, created.id);
    }

    // Create relationship edges
    for (const relationship of relationships) {
      const sourceId = conceptIds.get(relationship.source);
      const targetId = conceptIds.get(relationship.target);

      if (!sourceId || !targetId) {
        console.warn(`Skipping relationship: ${relationship.source} → ${relationship.target}`);
        continue;
      }

      await db.conceptEdge.create({
        data: {
          sourceId,
          targetId,
          relationshipType: relationship.type,
          strength: relationship.strength,
        },
      });
    }

    console.log('Knowledge graph built successfully');
  }

  /**
   * Generate embedding for concept
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  }

  /**
   * Find similar concepts using embeddings
   */
  async findSimilarConcepts(
    conceptId: string,
    topK: number = 5
  ): Promise<Array<{ concept: Concept; similarity: number }>> {
    const sourceConcept = await db.concept.findUnique({
      where: { id: conceptId },
    });

    if (!sourceConcept || !sourceConcept.embedding) {
      return [];
    }

    // Get all concepts in course
    const allConcepts = await db.concept.findMany({
      where: {
        courseId: sourceConcept.courseId,
        id: { not: conceptId },
        embedding: { not: null },
      },
    });

    // Calculate similarities
    const similarities = allConcepts.map(concept => ({
      concept,
      similarity: this.cosineSimilarity(
        sourceConcept.embedding as number[],
        concept.embedding as number[]
      ),
    }));

    // Sort by similarity
    similarities.sort((a, b) => b.similarity - a.similarity);

    return similarities.slice(0, topK);
  }

  /**
   * Calculate cosine similarity between vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    return dotProduct / (magnitudeA * magnitudeB);
  }
}
```

### Week 24: Query Engine & Integration

#### Day 1-2: Graph Query Engine

**File: `lib/sam/knowledge-graph/graph-query.ts`**

```typescript
import { db } from '@/lib/db';

interface LearningPath {
  concepts: Concept[];
  totalMinutes: number;
  difficulty: string;
}

export class KnowledgeGraphQuery {
  /**
   * Get prerequisites for a concept
   */
  async getPrerequisites(conceptId: string): Promise<Concept[]> {
    const edges = await db.conceptEdge.findMany({
      where: {
        targetId: conceptId,
        relationshipType: 'PREREQUISITE',
      },
      include: {
        source: true,
      },
      orderBy: {
        strength: 'desc',
      },
    });

    return edges.map(edge => edge.source);
  }

  /**
   * Get related concepts
   */
  async getRelatedConcepts(conceptId: string): Promise<Concept[]> {
    const edges = await db.conceptEdge.findMany({
      where: {
        OR: [
          { sourceId: conceptId, relationshipType: 'RELATED_TO' },
          { targetId: conceptId, relationshipType: 'RELATED_TO' },
        ],
      },
      include: {
        source: true,
        target: true,
      },
      orderBy: {
        strength: 'desc',
      },
    });

    return edges.map(edge =>
      edge.sourceId === conceptId ? edge.target : edge.source
    );
  }

  /**
   * Generate learning path from concept A to B
   */
  async generateLearningPath(
    startConceptId: string,
    endConceptId: string
  ): Promise<LearningPath> {
    // Get all prerequisites for end concept (recursive)
    const allPrereqs = await this.getAllPrerequisites(endConceptId);

    // Build dependency graph
    const path = this.findShortestPath(startConceptId, endConceptId, allPrereqs);

    // Calculate metadata
    const totalMinutes = path.reduce(
      (sum, concept) => sum + (concept.estimatedMinutes || 0),
      0
    );

    const maxDifficulty = this.getMaxDifficulty(path);

    return {
      concepts: path,
      totalMinutes,
      difficulty: maxDifficulty,
    };
  }

  /**
   * Get all prerequisites recursively
   */
  private async getAllPrerequisites(
    conceptId: string,
    visited: Set<string> = new Set()
  ): Promise<Concept[]> {
    if (visited.has(conceptId)) return [];

    visited.add(conceptId);

    const directPrereqs = await this.getPrerequisites(conceptId);
    const allPrereqs: Concept[] = [...directPrereqs];

    for (const prereq of directPrereqs) {
      const nestedPrereqs = await this.getAllPrerequisites(prereq.id, visited);
      allPrereqs.push(...nestedPrereqs);
    }

    return allPrereqs;
  }

  /**
   * Find shortest path using BFS
   */
  private findShortestPath(
    start: string,
    end: string,
    concepts: Concept[]
  ): Concept[] {
    // Simple implementation - can be enhanced with actual graph traversal
    return concepts;
  }

  /**
   * Get maximum difficulty in path
   */
  private getMaxDifficulty(concepts: Concept[]): string {
    const levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

    let maxLevel = 0;

    for (const concept of concepts) {
      const level = levels.indexOf(concept.difficulty);
      if (level > maxLevel) maxLevel = level;
    }

    return levels[maxLevel];
  }

  /**
   * Recommend next concepts to learn
   */
  async recommendNextConcepts(
    userId: string,
    courseId: string
  ): Promise<Concept[]> {
    // Get user's mastered concepts
    const masteredConcepts = await db.conceptMastery.findMany({
      where: {
        userId,
        masteryLevel: { gte: 0.8 },
      },
      select: { conceptId: true },
    });

    const masteredIds = new Set(masteredConcepts.map(c => c.conceptId));

    // Find concepts where prerequisites are met
    const allConcepts = await db.concept.findMany({
      where: { courseId },
      include: {
        incomingEdges: {
          where: { relationshipType: 'PREREQUISITE' },
          include: { source: true },
        },
      },
    });

    const recommendations: Concept[] = [];

    for (const concept of allConcepts) {
      // Skip if already mastered
      if (masteredIds.has(concept.id)) continue;

      // Check if all prerequisites are met
      const prereqs = concept.incomingEdges.map(edge => edge.source.id);
      const allPrereqsMet = prereqs.every(id => masteredIds.has(id));

      if (allPrereqsMet || prereqs.length === 0) {
        recommendations.push(concept);
      }
    }

    // Sort by difficulty (easiest first)
    const difficultyOrder = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
    recommendations.sort((a, b) => {
      return difficultyOrder.indexOf(a.difficulty) - difficultyOrder.indexOf(b.difficulty);
    });

    return recommendations.slice(0, 5);
  }
}
```

#### Day 3-4: SAM Integration

**File: `lib/sam/engines/knowledge-aware-engine.ts`**

```typescript
import { SAMBaseEngine } from './base-engine';
import { KnowledgeGraphQuery } from '../knowledge-graph/graph-query';

export class KnowledgeAwareEngine extends SAMBaseEngine {
  private graphQuery: KnowledgeGraphQuery;

  constructor() {
    super();
    this.graphQuery = new KnowledgeGraphQuery();
  }

  /**
   * Generate response with knowledge graph context
   */
  async generateWithKnowledge(
    userId: string,
    courseId: string,
    question: string
  ): Promise<string> {
    // Identify concepts mentioned in question
    const mentionedConcepts = await this.identifyConceptsInQuestion(
      courseId,
      question
    );

    // Get prerequisites and related concepts
    const contextConcepts: Concept[] = [];

    for (const concept of mentionedConcepts) {
      const prereqs = await this.graphQuery.getPrerequisites(concept.id);
      const related = await this.graphQuery.getRelatedConcepts(concept.id);

      contextConcepts.push(...prereqs, ...related);
    }

    // Build context from knowledge graph
    const knowledgeContext = this.formatKnowledgeContext(
      mentionedConcepts,
      contextConcepts
    );

    // Generate response with knowledge context
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are SAM, an adaptive AI tutor with access to a knowledge graph.

KNOWLEDGE CONTEXT:
${knowledgeContext}

Student question: ${question}

Provide a helpful response that:
1. Uses the knowledge graph context
2. Mentions prerequisites if the student might be missing them
3. Suggests related concepts for further learning`,
        },
      ],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  /**
   * Recommend learning path
   */
  async recommendLearningPath(
    userId: string,
    targetConceptId: string
  ): Promise<LearningPath> {
    // Get user's current knowledge
    const masteredConcepts = await db.conceptMastery.findMany({
      where: { userId, masteryLevel: { gte: 0.7 } },
      orderBy: { updatedAt: 'desc' },
      take: 1,
    });

    const startConceptId = masteredConcepts[0]?.conceptId;

    if (!startConceptId) {
      // No mastered concepts - start from beginning
      return await this.graphQuery.generateLearningPath(
        targetConceptId,
        targetConceptId
      );
    }

    // Generate path from current to target
    return await this.graphQuery.generateLearningPath(
      startConceptId,
      targetConceptId
    );
  }
}
```

---

## ✅ Acceptance Criteria

### Technical
- [ ] Graph coverage >70% of concepts
- [ ] Relationship accuracy >80%
- [ ] Query latency <50ms
- [ ] Prerequisite detection >85%

### Quality
- [ ] Concept similarity >80%
- [ ] Path coherence >90%
- [ ] <5% orphaned concepts

### UX
- [ ] "Prerequisites helpful" >85%
- [ ] Related concepts click >50%
- [ ] Path follow-through >70%

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Owner**: ML/AI Engineering Team
