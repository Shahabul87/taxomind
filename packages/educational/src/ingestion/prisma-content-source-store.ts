/**
 * Prisma Content Source Store
 * Enhanced Depth Analysis - January 2026
 *
 * Implements ContentSourceStore interface using Prisma for persistence.
 * This file should be used at the app level where the Prisma client is available.
 *
 * Note: This module uses a generic database interface to avoid circular
 * dependency with Prisma generated types. The actual Prisma client
 * should be passed when instantiating the store.
 */

import type {
  ContentSourceStore,
  ContentSourceData,
  ContentSourceCreateInput,
  ContentSourceUpdateInput,
  ExtractedContent,
  ContentSourceType,
  ContentProcessingStatus,
} from './types';

/**
 * Generic database interface for ContentSource operations
 * This allows the store to work with any Prisma-compatible client
 */
interface ContentSourceModel {
  create(args: { data: Record<string, unknown> }): Promise<ContentSourceRecord>;
  update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<ContentSourceRecord>;
  findUnique(args: { where: { id: string } }): Promise<ContentSourceRecord | null>;
  findMany(args: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, string> | Array<Record<string, string>>;
    take?: number;
  }): Promise<ContentSourceRecord[]>;
  delete(args: { where: { id: string } }): Promise<ContentSourceRecord>;
  deleteMany(args: { where: Record<string, unknown> }): Promise<{ count: number }>;
}

interface ContentSourceRecord {
  id: string;
  sectionId: string;
  sourceType: string;
  originalUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  extractedText: string | null;
  wordCount: number;
  pageCount: number | null;
  slideCount: number | null;
  duration: number | null;
  metadata: unknown;
  status: string;
  processedAt: Date | null;
  errorMessage: string | null;
  retryCount: number;
  bloomsAnalysis: unknown;
  dokAnalysis: unknown;
  analysisVersion: string | null;
  analyzedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DatabaseClient {
  contentSource: ContentSourceModel;
}

/**
 * Prisma Content Source Store Implementation
 */
export class PrismaContentSourceStore implements ContentSourceStore {
  private db: DatabaseClient;

  constructor(prismaClient: unknown) {
    // Cast to our interface - the actual Prisma client will satisfy this
    this.db = prismaClient as DatabaseClient;
  }

  /**
   * Create a new content source record
   */
  async create(input: ContentSourceCreateInput): Promise<ContentSourceData> {
    const record = await this.db.contentSource.create({
      data: {
        sectionId: input.sectionId,
        sourceType: input.sourceType,
        originalUrl: input.originalUrl ?? null,
        fileName: input.fileName ?? null,
        mimeType: input.mimeType ?? null,
        fileSize: input.fileSize ?? null,
        extractedText: input.extractedText ?? null,
        wordCount: input.wordCount ?? 0,
        pageCount: input.pageCount ?? null,
        slideCount: input.slideCount ?? null,
        duration: input.duration ?? null,
        metadata: input.metadata ?? null,
        status: input.status ?? 'PENDING',
      },
    });

    return this.mapToData(record);
  }

  /**
   * Update an existing content source
   */
  async update(id: string, input: ContentSourceUpdateInput): Promise<ContentSourceData> {
    const data: Record<string, unknown> = {};

    if (input.extractedText !== undefined) data.extractedText = input.extractedText;
    if (input.wordCount !== undefined) data.wordCount = input.wordCount;
    if (input.pageCount !== undefined) data.pageCount = input.pageCount;
    if (input.slideCount !== undefined) data.slideCount = input.slideCount;
    if (input.duration !== undefined) data.duration = input.duration;
    if (input.metadata !== undefined) data.metadata = input.metadata;
    if (input.status !== undefined) data.status = input.status;
    if (input.processedAt !== undefined) data.processedAt = input.processedAt;
    if (input.errorMessage !== undefined) data.errorMessage = input.errorMessage;
    if (input.retryCount !== undefined) data.retryCount = input.retryCount;
    if (input.bloomsAnalysis !== undefined) data.bloomsAnalysis = input.bloomsAnalysis;
    if (input.dokAnalysis !== undefined) data.dokAnalysis = input.dokAnalysis;
    if (input.analysisVersion !== undefined) data.analysisVersion = input.analysisVersion;
    if (input.analyzedAt !== undefined) data.analyzedAt = input.analyzedAt;

    const record = await this.db.contentSource.update({
      where: { id },
      data,
    });

    return this.mapToData(record);
  }

  /**
   * Get content source by ID
   */
  async getById(id: string): Promise<ContentSourceData | null> {
    const record = await this.db.contentSource.findUnique({
      where: { id },
    });

    return record ? this.mapToData(record) : null;
  }

  /**
   * Get all content sources for a section
   */
  async getBySectionId(sectionId: string): Promise<ContentSourceData[]> {
    const records = await this.db.contentSource.findMany({
      where: { sectionId },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((r) => this.mapToData(r));
  }

  /**
   * Get all content sources for a course
   */
  async getByCourseId(courseId: string): Promise<ContentSourceData[]> {
    const records = await this.db.contentSource.findMany({
      where: {
        section: {
          chapter: {
            courseId,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return records.map((r) => this.mapToData(r));
  }

  /**
   * Get content sources by status
   */
  async getByStatus(
    status: ContentProcessingStatus,
    limit?: number
  ): Promise<ContentSourceData[]> {
    const records = await this.db.contentSource.findMany({
      where: { status },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return records.map((r) => this.mapToData(r));
  }

  /**
   * Get pending content sources for processing
   */
  async getPendingForProcessing(limit: number): Promise<ContentSourceData[]> {
    const records = await this.db.contentSource.findMany({
      where: {
        OR: [
          { status: 'PENDING' },
          {
            status: 'FAILED',
            retryCount: { lt: 3 },
          },
        ],
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
      take: limit,
    });

    return records.map((r) => this.mapToData(r));
  }

  /**
   * Mark content source as processing
   */
  async markProcessing(id: string): Promise<void> {
    await this.db.contentSource.update({
      where: { id },
      data: {
        status: 'PROCESSING',
        processedAt: null,
        errorMessage: null,
      },
    });
  }

  /**
   * Mark content source as completed with extracted content
   */
  async markCompleted(id: string, content: ExtractedContent): Promise<void> {
    await this.db.contentSource.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        extractedText: content.text,
        wordCount: content.wordCount,
        pageCount: content.metadata.pageCount ?? null,
        slideCount: content.metadata.slideCount ?? null,
        duration: content.metadata.duration ?? null,
        metadata: content.metadata as Record<string, unknown>,
        processedAt: new Date(),
        errorMessage: null,
      },
    });
  }

  /**
   * Mark content source as failed
   */
  async markFailed(id: string, error: string): Promise<void> {
    // Get current retry count first
    const current = await this.db.contentSource.findUnique({
      where: { id },
    });

    await this.db.contentSource.update({
      where: { id },
      data: {
        status: 'FAILED',
        errorMessage: error,
        processedAt: new Date(),
        retryCount: (current?.retryCount ?? 0) + 1,
      },
    });
  }

  /**
   * Delete content source
   */
  async delete(id: string): Promise<void> {
    await this.db.contentSource.delete({
      where: { id },
    });
  }

  /**
   * Delete all content sources for a section
   */
  async deleteBySectionId(sectionId: string): Promise<number> {
    const result = await this.db.contentSource.deleteMany({
      where: { sectionId },
    });

    return result.count;
  }

  /**
   * Map database record to ContentSourceData
   */
  private mapToData(record: ContentSourceRecord): ContentSourceData {
    return {
      id: record.id,
      sectionId: record.sectionId,
      sourceType: record.sourceType as ContentSourceType,
      originalUrl: record.originalUrl,
      fileName: record.fileName,
      mimeType: record.mimeType,
      fileSize: record.fileSize,
      extractedText: record.extractedText,
      wordCount: record.wordCount,
      pageCount: record.pageCount,
      slideCount: record.slideCount,
      duration: record.duration,
      metadata: record.metadata as Record<string, unknown> | null,
      status: record.status as ContentProcessingStatus,
      processedAt: record.processedAt,
      errorMessage: record.errorMessage,
      retryCount: record.retryCount,
      bloomsAnalysis: record.bloomsAnalysis as Record<string, unknown> | null,
      dokAnalysis: record.dokAnalysis as Record<string, unknown> | null,
      analysisVersion: record.analysisVersion,
      analyzedAt: record.analyzedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

/**
 * Create a Prisma content source store
 * @param prismaClient The Prisma client instance (db from @/lib/db)
 */
export function createPrismaContentSourceStore(prismaClient: unknown): PrismaContentSourceStore {
  return new PrismaContentSourceStore(prismaClient);
}
