/**
 * @sam-ai/integration - Vector Store Adapter Interface
 * Abstract vector database operations for portability
 */
import { z } from 'zod';
// ============================================================================
// ZOD SCHEMAS
// ============================================================================
export const VectorMetadataSchema = z.object({
    sourceType: z.string().min(1),
    sourceId: z.string().min(1),
    userId: z.string().optional(),
    courseId: z.string().optional(),
    chapterId: z.string().optional(),
    sectionId: z.string().optional(),
    tags: z.array(z.string()).default([]),
    language: z.string().optional(),
    contentHash: z.string().optional(),
    custom: z.record(z.unknown()).optional(),
});
export const VectorSearchFilterSchema = z.object({
    sourceTypes: z.array(z.string()).optional(),
    userIds: z.array(z.string()).optional(),
    courseIds: z.array(z.string()).optional(),
    chapterIds: z.array(z.string()).optional(),
    sectionIds: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    dateRange: z
        .object({
        start: z.date().optional(),
        end: z.date().optional(),
    })
        .optional(),
    custom: z.record(z.unknown()).optional(),
});
export const VectorSearchOptionsSchema = z.object({
    topK: z.number().min(1).max(100).default(10),
    minScore: z.number().min(0).max(1).optional(),
    maxDistance: z.number().min(0).optional(),
    filter: VectorSearchFilterSchema.optional(),
    includeMetadata: z.boolean().default(true),
    includeVectors: z.boolean().default(false),
    rerank: z.boolean().default(false),
});
export const VectorUpsertInputSchema = z.object({
    id: z.string().optional(),
    content: z.string().min(1),
    vector: z.array(z.number()).optional(),
    metadata: VectorMetadataSchema.omit({ contentHash: true }),
});
//# sourceMappingURL=vector.js.map