/**
 * RAG Retriever — Retrieves relevant domain knowledge for course content generation
 *
 * Queries the vector store (populated by rag-indexer.ts) to find relevant
 * existing course content that can ground Stage 3 detail generation in
 * established knowledge rather than relying solely on LLM parametric memory.
 *
 * Uses existing searchContent() from agentic-vector-search.ts with
 * relevance threshold filtering (cosine similarity > 0.75).
 *
 * Gated by ENABLE_RAG_RETRIEVAL=true env var.
 */

import 'server-only';

import { logger } from '@/lib/logger';
import { searchContent, type ContentSearchOptions } from '@/lib/sam/agentic-vector-search';

const RAG_ENABLED = process.env.ENABLE_RAG_RETRIEVAL === 'true';

// ============================================================================
// Types
// ============================================================================

export interface RAGRetrievalOptions {
  /** Number of results to retrieve (default: 5) */
  topK?: number;
  /** Minimum cosine similarity score (default: 0.75) */
  minScore?: number;
  /** Filter to a specific course category */
  courseCategory?: string;
  /** Exclude results from this course (avoid self-referencing during generation) */
  excludeCourseId?: string;
  /** Max total characters for the combined context block */
  maxContextChars?: number;
}

export interface RAGContextBlock {
  /** Formatted context string ready for prompt injection */
  formattedContext: string;
  /** Number of chunks retrieved */
  chunksUsed: number;
  /** Average similarity score */
  averageScore: number;
  /** Source course IDs referenced */
  sourceCourseIds: string[];
}

interface RetrievedChunk {
  content: string;
  score: number;
  sourceId: string;
  courseId?: string;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Retrieve relevant domain context for a section being generated.
 *
 * Builds a query from the section title + key topics, searches the vector store,
 * filters by relevance threshold, and formats results with source attribution.
 *
 * When ENABLE_RAG_RETRIEVAL is false, returns null (no-op).
 *
 * @param query - Search query (typically section title + key topics)
 * @param options - Retrieval options
 * @returns Formatted context block or null if disabled/no results
 */
export async function retrieveRelevantContext(
  query: string,
  options: RAGRetrievalOptions = {},
): Promise<RAGContextBlock | null> {
  if (!RAG_ENABLED) {
    return null;
  }

  const {
    topK = 5,
    minScore = 0.75,
    excludeCourseId,
    courseCategory,
    maxContextChars = 3000,
  } = options;

  const startTime = Date.now();

  try {
    const searchOptions: ContentSearchOptions = {
      topK: topK + 2, // Fetch a few extra to account for filtering
      minScore,
      tags: courseCategory ? [`category:${courseCategory}`] : ['rag'],
    };

    const results = await searchContent(query, searchOptions);

    // Filter out self-referencing results
    let filtered = results;
    if (excludeCourseId) {
      filtered = results.filter(r => r.courseId !== excludeCourseId);
    }

    // Take only topK after filtering
    const topResults = filtered.slice(0, topK);

    if (topResults.length === 0) {
      logger.debug('[RAG_RETRIEVER] No relevant context found', {
        query: query.slice(0, 100),
        resultsBeforeFilter: results.length,
        elapsedMs: Date.now() - startTime,
      });
      return null;
    }

    // Build formatted context with character budget
    const chunks: RetrievedChunk[] = topResults.map(r => ({
      content: r.content,
      score: r.score,
      sourceId: r.sourceId,
      courseId: r.courseId,
    }));

    const formattedContext = formatContextBlock(chunks, maxContextChars);
    const sourceCourseIds = [...new Set(chunks.map(c => c.courseId).filter(Boolean))] as string[];
    const averageScore = chunks.reduce((sum, c) => sum + c.score, 0) / chunks.length;

    const elapsedMs = Date.now() - startTime;
    logger.info('[RAG_RETRIEVER] Context retrieved', {
      query: query.slice(0, 100),
      chunksUsed: chunks.length,
      averageScore: Math.round(averageScore * 100) / 100,
      sourceCourses: sourceCourseIds.length,
      elapsedMs,
    });

    return {
      formattedContext,
      chunksUsed: chunks.length,
      averageScore,
      sourceCourseIds,
    };
  } catch (error) {
    logger.warn('[RAG_RETRIEVER] Retrieval failed, proceeding without RAG context', {
      query: query.slice(0, 100),
      error: error instanceof Error ? error.message : String(error),
      elapsedMs: Date.now() - startTime,
    });
    return null;
  }
}

/**
 * Build a search query from section metadata.
 * Combines section title, topic focus, and key topics for better retrieval.
 */
export function buildRAGQuery(sectionTitle: string, topicFocus: string, keyTopics?: string[]): string {
  const parts = [sectionTitle, topicFocus];
  if (keyTopics && keyTopics.length > 0) {
    parts.push(keyTopics.join(', '));
  }
  return parts.join(' — ');
}

// ============================================================================
// Internal: Formatting
// ============================================================================

/**
 * Format retrieved chunks into a prompt-ready context block.
 * Respects a character budget to avoid bloating the prompt.
 */
function formatContextBlock(chunks: RetrievedChunk[], maxChars: number): string {
  const header = '## Reference Material (from existing courses)\n\nUse these references to ground your content in established knowledge. Cite specific concepts where applicable. Do not copy verbatim — adapt and build upon these references.\n';
  let remaining = maxChars - header.length;
  const lines: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const relevance = Math.round(chunk.score * 100);
    const entry = `### Reference ${i + 1} (${relevance}% relevance)\n${chunk.content}\n`;

    if (entry.length > remaining) {
      // Truncate last entry if it partially fits
      if (remaining > 100) {
        const truncated = chunk.content.slice(0, remaining - 80);
        const lastSentence = truncated.lastIndexOf('. ');
        const cutPoint = lastSentence > truncated.length * 0.5 ? lastSentence + 1 : truncated.length;
        lines.push(`### Reference ${i + 1} (${relevance}% relevance)\n${chunk.content.slice(0, cutPoint)}...\n`);
      }
      break;
    }

    lines.push(entry);
    remaining -= entry.length;
  }

  if (lines.length === 0) return '';
  return header + lines.join('\n');
}
