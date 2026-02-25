/**
 * RAG Indexer — Chunks and indexes completed course content for retrieval
 *
 * After course creation completes, this module:
 * 1. Loads the course content (chapter summaries, section key topics, detail text)
 * 2. Chunks it into ~500-token segments with overlap
 * 3. Generates embeddings via the existing getEmbeddingProvider()
 * 4. Stores them via existing indexContentBatch() from agentic-vector-search.ts
 *
 * Wired into runPostCreationEnrichmentBackground() in completion-handler.ts
 * so indexing happens automatically after every course is created.
 *
 * Gated by ENABLE_RAG_RETRIEVAL=true env var.
 */

import 'server-only';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { indexContentBatch } from '@/lib/sam/agentic-vector-search';
import type { EmbeddingSourceType } from '@sam-ai/agentic';

const RAG_ENABLED = process.env.ENABLE_RAG_RETRIEVAL === 'true';

// ============================================================================
// Types
// ============================================================================

interface ContentChunk {
  text: string;
  sourceId: string;
  sourceType: EmbeddingSourceType;
  courseId: string;
  chapterId?: string;
  sectionId?: string;
  tags: string[];
}

// ============================================================================
// Chunking
// ============================================================================

const CHUNK_SIZE_CHARS = 2000; // ~500 tokens (4 chars/token estimate)
const CHUNK_OVERLAP_CHARS = 200; // ~50 token overlap

/**
 * Split text into overlapping chunks of approximately CHUNK_SIZE_CHARS.
 * Tries to break at paragraph boundaries to preserve semantic coherence.
 */
function chunkText(text: string): string[] {
  if (!text || text.length <= CHUNK_SIZE_CHARS) {
    return text ? [text.trim()] : [];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + CHUNK_SIZE_CHARS;

    if (end >= text.length) {
      chunks.push(text.slice(start).trim());
      break;
    }

    // Try to break at paragraph boundary
    const paragraphBreak = text.lastIndexOf('\n\n', end);
    if (paragraphBreak > start + CHUNK_SIZE_CHARS * 0.5) {
      end = paragraphBreak;
    } else {
      // Try sentence boundary
      const sentenceBreak = text.lastIndexOf('. ', end);
      if (sentenceBreak > start + CHUNK_SIZE_CHARS * 0.5) {
        end = sentenceBreak + 1;
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - CHUNK_OVERLAP_CHARS;
  }

  return chunks.filter(c => c.length > 50); // Drop tiny fragments
}

/**
 * Strip HTML tags to get plain text for embedding.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// Course Content Extraction
// ============================================================================

/**
 * Load course content from DB and produce chunks for indexing.
 */
async function extractCourseChunks(courseId: string): Promise<ContentChunk[]> {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      description: true,
      categoryId: true,
      Chapter: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          position: true,
          Section: {
            orderBy: { position: 'asc' },
            select: {
              id: true,
              title: true,
              description: true,
              position: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    logger.warn('[RAG_INDEXER] Course not found for indexing', { courseId });
    return [];
  }

  const chunks: ContentChunk[] = [];
  const categoryTag = course.categoryId ? `category:${course.categoryId}` : 'category:general';

  // Course-level description chunk
  if (course.description) {
    const descText = stripHtml(course.description);
    for (const chunk of chunkText(descText)) {
      chunks.push({
        text: `Course: ${course.title}\n\n${chunk}`,
        sourceId: `course:${course.id}:description`,
        sourceType: 'course_content' as EmbeddingSourceType,
        courseId: course.id,
        tags: ['rag', 'course-description', categoryTag],
      });
    }
  }

  // Chapter-level chunks
  for (const chapter of course.Chapter) {
    // Chapter summary/description
    if (chapter.description) {
      const chapterText = stripHtml(chapter.description);
      const contextPrefix = `Course: ${course.title} > Chapter ${chapter.position}: ${chapter.title}`;

      for (const chunk of chunkText(chapterText)) {
        chunks.push({
          text: `${contextPrefix}\n\n${chunk}`,
          sourceId: `chapter:${chapter.id}:description`,
          sourceType: 'course_content' as EmbeddingSourceType,
          courseId: course.id,
          chapterId: chapter.id,
          tags: ['rag', 'chapter-content', categoryTag],
        });
      }
    }

    // Section-level chunks
    for (const section of chapter.Section) {
      if (section.description) {
        const sectionText = stripHtml(section.description);
        const contextPrefix = `Course: ${course.title} > Chapter ${chapter.position}: ${chapter.title} > Section ${section.position}: ${section.title}`;

        for (const chunk of chunkText(sectionText)) {
          chunks.push({
            text: `${contextPrefix}\n\n${chunk}`,
            sourceId: `section:${section.id}:description`,
            sourceType: 'course_content' as EmbeddingSourceType,
            courseId: course.id,
            chapterId: chapter.id,
            sectionId: section.id,
            tags: ['rag', 'section-content', categoryTag],
          });
        }
      }
    }
  }

  return chunks;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Index a completed course's content for RAG retrieval.
 * Called by runPostCreationEnrichmentBackground() after course creation.
 *
 * When ENABLE_RAG_RETRIEVAL is false, this is a no-op.
 *
 * @returns Number of chunks indexed, or 0 if disabled/failed
 */
export async function indexCourseForRAG(courseId: string): Promise<number> {
  if (!RAG_ENABLED) {
    return 0;
  }

  const startTime = Date.now();

  try {
    const chunks = await extractCourseChunks(courseId);

    if (chunks.length === 0) {
      logger.info('[RAG_INDEXER] No content to index', { courseId });
      return 0;
    }

    // Batch index in groups of 20 to avoid overwhelming the embedding API
    const BATCH_SIZE = 20;
    let totalIndexed = 0;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);

      const ids = await indexContentBatch(
        batch.map(chunk => ({
          content: chunk.text,
          metadata: {
            sourceId: chunk.sourceId,
            sourceType: chunk.sourceType,
            courseId: chunk.courseId,
            chapterId: chunk.chapterId,
            sectionId: chunk.sectionId,
            tags: chunk.tags,
          },
        })),
      );

      totalIndexed += ids.length;
    }

    const elapsed = Date.now() - startTime;
    logger.info('[RAG_INDEXER] Course indexed successfully', {
      courseId,
      chunksIndexed: totalIndexed,
      totalChunks: chunks.length,
      elapsedMs: elapsed,
    });

    return totalIndexed;
  } catch (error) {
    logger.error('[RAG_INDEXER] Failed to index course', {
      courseId,
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
}
