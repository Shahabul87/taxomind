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
    logger.debug('[MemoryRecall] Memory recall failed, proceeding without memory', {
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
  } catch {
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
// Internal Helpers
// ============================================================================

async function recallPriorConcepts(
  userId: string,
  courseCategory: string,
): Promise<PriorConcept[]> {
  const { knowledgeGraph } = getMemoryStores();

  try {
    // Query knowledge graph for concept entities created by this user
    const entities = await knowledgeGraph.queryEntities({
      type: 'concept',
      properties: { userId },
      limit: MAX_PRIOR_CONCEPTS,
    });

    if (!entities || entities.length === 0) return [];

    return entities
      .filter((e: Record<string, unknown>) => {
        const props = e.properties as Record<string, unknown> | undefined;
        return props?.courseCategory === courseCategory || !props?.courseCategory;
      })
      .slice(0, MAX_PRIOR_CONCEPTS)
      .map((e: Record<string, unknown>) => {
        const props = (e.properties ?? {}) as Record<string, unknown>;
        return {
          concept: (e.name as string) ?? 'Unknown',
          bloomsLevel: (props.bloomsLevel as string) ?? 'UNDERSTAND',
          courseTitle: (props.courseTitle as string) ?? 'Prior Course',
        };
      });
  } catch {
    return [];
  }
}

async function recallQualityPatterns(userId: string): Promise<QualityPatterns | null> {
  const { sessionContext } = getMemoryStores();

  try {
    // Query session contexts for this user's prior course creation sessions
    const sessions = await sessionContext.list(userId, { limit: 10 });

    if (!sessions || sessions.length === 0) return null;

    const allScores: number[] = [];
    const dimensionTotals: Record<string, { sum: number; count: number }> = {};
    const dimensionKeys = ['uniqueness', 'specificity', 'bloomsAlignment', 'completeness', 'depth'];

    for (const session of sessions) {
      const insights = (session.insights ?? {}) as Record<string, unknown>;

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
  } catch {
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

    // Query for entities related to the given topics
    for (const topic of topics.slice(0, 5)) {
      const entities = await knowledgeGraph.queryEntities({
        type: 'concept',
        properties: { userId },
        nameContains: topic,
        limit: 3,
      });

      if (entities) {
        for (const entity of entities) {
          const props = (entity.properties ?? {}) as Record<string, unknown>;
          // Only include concepts from OTHER courses
          if (props.courseId !== courseId) {
            results.push({
              name: (entity.name as string) ?? topic,
              relationship: 'relates_to',
            });
          }
        }
      }
    }

    return results.slice(0, MAX_RELATED_CONCEPTS);
  } catch {
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

function groupByField<T extends Record<string, unknown>>(
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
