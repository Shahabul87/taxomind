/**
 * Memory Recall for Agentic Course Creation
 *
 * Reads from SAM's KnowledgeGraph and SessionContext stores to provide
 * the pipeline with bidirectional memory: not just writing concepts and
 * quality scores, but READING them back to inform new generations.
 *
 * - Prior concepts: What has this user taught before in related domains?
 * - Quality patterns: Which dimensions consistently score low?
 * - Related concepts: Cross-referencing for curriculum coherence.
 *
 * All queries have a 3-second timeout. Empty results = skip the block.
 * First-time users see no change.
 */

import 'server-only';

import { logger } from '@/lib/logger';
import { getMemoryStores } from '@/lib/sam/taxomind-context';

// ============================================================================
// Types
// ============================================================================

export interface PriorConcept {
  concept: string;
  bloomsLevel: string;
  courseTitle: string;
}

export interface QualityPatterns {
  averageScore: number;
  weakDimensions: string[];
}

export interface RelatedConcept {
  name: string;
  relationship: string;
}

export interface RecalledMemory {
  /** Concepts from prior courses by this user in related domains */
  priorConcepts: PriorConcept[];
  /** Quality patterns from prior course creations */
  qualityPatterns: QualityPatterns | null;
  /** Related concepts from KnowledgeGraph for cross-referencing */
  relatedConcepts: RelatedConcept[];
}

// ============================================================================
// Constants
// ============================================================================

/** Timeout for individual recall queries (ms) */
const RECALL_TIMEOUT_MS = 3000;

/** Maximum concepts to recall from prior courses */
const MAX_PRIOR_CONCEPTS = 20;

/** Maximum related concepts to return */
const MAX_RELATED_CONCEPTS = 10;

// ============================================================================
// Public API
// ============================================================================

/**
 * Recall course creation memory before the pipeline starts.
 *
 * Queries KnowledgeGraph for prior concepts in the same domain and
 * SessionContext for quality patterns from previous course creations.
 *
 * Returns empty RecalledMemory on timeout or error (safe fallback).
 */
export async function recallCourseCreationMemory(
  userId: string,
  courseCategory: string,
  courseTitle: string,
): Promise<RecalledMemory> {
  const empty: RecalledMemory = {
    priorConcepts: [],
    qualityPatterns: null,
    relatedConcepts: [],
  };

  try {
    const [priorConcepts, qualityPatterns] = await Promise.allSettled([
      withTimeout(recallPriorConcepts(userId, courseCategory), RECALL_TIMEOUT_MS),
      withTimeout(recallQualityPatterns(userId), RECALL_TIMEOUT_MS),
    ]);

    const result: RecalledMemory = {
      priorConcepts: priorConcepts.status === 'fulfilled' ? priorConcepts.value : [],
      qualityPatterns: qualityPatterns.status === 'fulfilled' ? qualityPatterns.value : null,
      relatedConcepts: [],
    };

    const totalRecalled = result.priorConcepts.length + (result.qualityPatterns ? 1 : 0);
    if (totalRecalled > 0) {
      logger.info('[MemoryRecall] Recalled prior course creation memory', {
        userId,
        courseCategory,
        priorConceptCount: result.priorConcepts.length,
        hasQualityPatterns: !!result.qualityPatterns,
      });
    }

    return result;
  } catch (error) {
    logger.warn('[MemoryRecall] Memory recall failed, proceeding without memory', {
      userId,
      courseCategory,
      error: error instanceof Error ? error.message : String(error),
    });
    return empty;
  }
}

/**
 * Recall related concepts between chapters for cross-referencing.
 *
 * Called between chapters to find knowledge graph relationships.
 */
export async function recallChapterContext(
  userId: string,
  courseId: string,
  chapterTopics: string[],
): Promise<RelatedConcept[]> {
  try {
    return await withTimeout(
      doRecallRelatedConcepts(userId, courseId, chapterTopics),
      RECALL_TIMEOUT_MS,
    );
  } catch (error) {
    logger.warn('[MemoryRecall] Chapter context recall failed', {
      userId,
      courseId,
      topicCount: chapterTopics.length,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * Build a prompt augmentation block from recalled memory.
 *
 * Returns empty string if no meaningful memory was recalled.
 */
export function buildMemoryRecallBlock(memory: RecalledMemory): string {
  const hasContent =
    memory.priorConcepts.length > 0 ||
    memory.qualityPatterns !== null ||
    memory.relatedConcepts.length > 0;

  if (!hasContent) return '';

  const lines: string[] = [
    '\n## MEMORY RECALL (From Your Prior Courses)',
    '',
  ];

  // Prior concepts
  if (memory.priorConcepts.length > 0) {
    lines.push('### Previously Taught Concepts:');
    const grouped = groupByField(memory.priorConcepts, 'courseTitle');
    for (const [courseTitle, concepts] of Object.entries(grouped)) {
      const conceptList = concepts
        .map(c => `${c.concept} (${c.bloomsLevel})`)
        .join(', ');
      lines.push(`- **${courseTitle}**: ${conceptList}`);
    }
    lines.push('Cross-reference with these concepts where appropriate for consistency.');
    lines.push('');
  }

  // Quality patterns
  if (memory.qualityPatterns) {
    lines.push('### Historical Quality Patterns:');
    lines.push(`- Average score from prior courses: ${memory.qualityPatterns.averageScore}/100`);
    if (memory.qualityPatterns.weakDimensions.length > 0) {
      lines.push(`- Areas needing attention: ${memory.qualityPatterns.weakDimensions.join(', ')}`);
      lines.push('Pay extra attention to these dimensions in this generation.');
    }
    lines.push('');
  }

  // Related concepts
  if (memory.relatedConcepts.length > 0) {
    lines.push('### Related Concepts in Knowledge Graph:');
    for (const rc of memory.relatedConcepts) {
      lines.push(`- ${rc.name} (${rc.relationship})`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ============================================================================
// Related Categories Map
// ============================================================================

/** Groups of related domain categories — substring-matched, case-insensitive */
const RELATED_CATEGORY_GROUPS: string[][] = [
  ['programming', 'computer-science', 'web-development', 'software', 'coding', 'web-dev'],
  ['data-science', 'machine-learning', 'artificial-intelligence', 'deep-learning', 'ai', 'ml', 'data-analytics'],
  ['business', 'finance', 'marketing', 'economics', 'management', 'entrepreneurship'],
  ['design', 'ux', 'ui', 'graphic-design', 'user-experience', 'user-interface'],
  ['engineering', 'electrical', 'mechanical', 'civil', 'chemical'],
  ['mathematics', 'statistics', 'algebra', 'calculus', 'geometry'],
  ['science', 'physics', 'chemistry', 'biology'],
  ['language', 'writing', 'literature', 'communication', 'linguistics'],
];

/**
 * Get a set of related categories for the given category.
 * Uses case-insensitive substring matching against predefined groups.
 */
function getRelatedCategories(category: string): Set<string> {
  const lower = category.toLowerCase();
  const related = new Set<string>([lower]);

  for (const group of RELATED_CATEGORY_GROUPS) {
    const match = group.some(g => lower.includes(g) || g.includes(lower));
    if (match) {
      for (const g of group) {
        related.add(g);
      }
    }
  }

  return related;
}

// ============================================================================
// Relevance Scoring
// ============================================================================

/**
 * Score concept relevance to the current chapter context.
 * Uses keyword overlap between concept topics and chapter keywords.
 * Returns 0.0-1.0 score.
 */
function scoreConceptRelevance(
  concept: { name: string; keywords?: string[]; description?: string },
  chapterKeywords: string[],
): number {
  if (chapterKeywords.length === 0) return 0.5; // No context = neutral score

  const conceptTerms = new Set([
    concept.name.toLowerCase(),
    ...(concept.keywords ?? []).map(k => k.toLowerCase()),
    ...(concept.description ?? '').toLowerCase().split(/\s+/).filter(w => w.length > 3),
  ]);

  const matches = chapterKeywords.filter(kw => conceptTerms.has(kw.toLowerCase()));
  const overlapRatio = matches.length / Math.max(1, chapterKeywords.length);

  // Boost for exact name match
  const nameMatch = chapterKeywords.some(
    kw => kw.toLowerCase() === concept.name.toLowerCase(),
  );

  return Math.min(1.0, overlapRatio + (nameMatch ? 0.3 : 0));
}

// ============================================================================
// Internal Helpers
// ============================================================================

async function recallPriorConcepts(
  userId: string,
  courseCategory: string,
): Promise<PriorConcept[]> {
  const { knowledgeGraph } = getMemoryStores();

  try {
    // Query knowledge graph for concept entities using findEntities
    const entities = await knowledgeGraph.findEntities('concept', undefined, MAX_PRIOR_CONCEPTS * 3);

    if (!entities || entities.length === 0) return [];

    const relatedCategories = getRelatedCategories(courseCategory);

    // Filter by userId and category in-memory (findEntities doesn't support property filters)
    return entities
      .filter((e) => {
        const props = e.properties as Record<string, unknown> | undefined;
        const entityUserId = props?.userId as string | undefined;
        if (entityUserId && entityUserId !== userId) return false;
        const entityCategory = props?.courseCategory as string | undefined;
        // Include entities without a category, or whose category is in the related set
        if (!entityCategory) return true;
        return relatedCategories.has(entityCategory.toLowerCase());
      })
      .slice(0, MAX_PRIOR_CONCEPTS)
      .map((e) => {
        const props = (e.properties ?? {}) as Record<string, unknown>;
        return {
          concept: e.name ?? 'Unknown',
          bloomsLevel: (props.bloomsLevel as string) ?? 'UNDERSTAND',
          courseTitle: (props.courseTitle as string) ?? 'Prior Course',
        };
      });
  } catch (error) {
    logger.debug('[MemoryRecall] recallPriorConcepts failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

async function recallQualityPatterns(userId: string): Promise<QualityPatterns | null> {
  const { sessionContext } = getMemoryStores();

  try {
    // Query session context for this user's prior course creation session
    // SessionContextStore.get returns a single session per userId+courseId
    const session = await sessionContext.get(userId);

    if (!session) return null;

    const allScores: number[] = [];
    const dimensionTotals: Record<string, { sum: number; count: number }> = {};
    const dimensionKeys = ['uniqueness', 'specificity', 'bloomsAlignment', 'completeness', 'depth'];

    const insights = session.insights as unknown as Record<string, unknown>;

    // Look for stage quality data
    for (const key of Object.keys(insights)) {
      if (key.startsWith('stage') && key.endsWith('Quality')) {
        const stageData = insights[key] as Record<string, unknown> | undefined;
        if (stageData?.averageScore) {
          allScores.push(stageData.averageScore as number);
        }
        const scores = stageData?.scores as Array<Record<string, number>> | undefined;
        if (scores) {
          for (const score of scores) {
            for (const dim of dimensionKeys) {
              if (score[dim] !== undefined) {
                if (!dimensionTotals[dim]) dimensionTotals[dim] = { sum: 0, count: 0 };
                dimensionTotals[dim].sum += score[dim];
                dimensionTotals[dim].count++;
              }
            }
          }
        }
      }
    }

    if (allScores.length === 0) return null;

    const averageScore = Math.round(
      allScores.reduce((a, b) => a + b, 0) / allScores.length,
    );

    // Find dimensions averaging below 65
    const weakDimensions: string[] = [];
    for (const [dim, totals] of Object.entries(dimensionTotals)) {
      if (totals.count > 0) {
        const avg = totals.sum / totals.count;
        if (avg < 65) {
          weakDimensions.push(dim);
        }
      }
    }

    return { averageScore, weakDimensions };
  } catch (error) {
    logger.debug('[MemoryRecall] recallQualityPatterns failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function doRecallRelatedConcepts(
  userId: string,
  courseId: string,
  topics: string[],
): Promise<RelatedConcept[]> {
  const { knowledgeGraph } = getMemoryStores();

  try {
    const results: RelatedConcept[] = [];

    // Query for entities related to the given topics using findEntities(type, query, limit)
    for (const topic of topics.slice(0, 5)) {
      const entities = await knowledgeGraph.findEntities('concept', topic, 10);

      if (entities) {
        for (const entity of entities) {
          const props = (entity.properties ?? {}) as Record<string, unknown>;
          // Only include concepts from this user and from OTHER courses
          if (props.userId && props.userId !== userId) continue;
          if (props.courseId !== courseId) {
            results.push({
              name: entity.name ?? topic,
              relationship: 'relates_to',
            });
          }
        }
      }
    }

    // Score and sort by relevance before truncation
    const scored = results.map(r => ({
      ...r,
      relevance: scoreConceptRelevance(
        { name: r.name },
        topics,
      ),
    }));
    scored.sort((a, b) => b.relevance - a.relevance);

    return scored.slice(0, MAX_RELATED_CONCEPTS);
  } catch (error) {
    logger.debug('[MemoryRecall] doRecallRelatedConcepts failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Recall timed out after ${ms}ms`)), ms);
    promise
      .then(result => { clearTimeout(timer); resolve(result); })
      .catch(err => { clearTimeout(timer); reject(err); });
  });
}

function groupByField<T>(
  items: T[],
  field: keyof T,
): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const key = String(item[field]);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}
