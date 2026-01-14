/**
 * Prisma Multimodal Store Adapter
 * Provides database persistence for SAM Multimodal Input Engine
 */

import { db } from '@/lib/db';
import type { SAMInputType, SAMProcessingStatus } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface MultimodalInput {
  id: string;
  userId: string;
  inputType: SAMInputType;
  content: string;
  contentSize: number;
  mimeType: string | null;
  courseId: string | null;
  topicId: string | null;
  questionId: string | null;
  status: SAMProcessingStatus;
  processedAt: Date | null;
  extractedText: string | null;
  analysis: InputAnalysis | null;
  confidence: number | null;
  transcription: string | null;
  altText: string | null;
  error: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InputAnalysis {
  summary?: string;
  keyPoints?: string[];
  entities?: ExtractedEntity[];
  sentiment?: string;
  topics?: string[];
  quality?: {
    clarity: number;
    completeness: number;
    relevance: number;
  };
}

export interface ExtractedEntity {
  type: string;
  value: string;
  confidence: number;
  position?: {
    start: number;
    end: number;
  };
}

export interface CreateMultimodalInput {
  userId: string;
  inputType: SAMInputType;
  content: string;
  contentSize: number;
  mimeType?: string;
  courseId?: string;
  topicId?: string;
  questionId?: string;
}

export interface MultimodalStore {
  create(input: CreateMultimodalInput): Promise<MultimodalInput>;
  getById(id: string): Promise<MultimodalInput | null>;
  getByUserId(userId: string, limit?: number): Promise<MultimodalInput[]>;
  getByType(userId: string, type: SAMInputType): Promise<MultimodalInput[]>;
  getPending(): Promise<MultimodalInput[]>;
  updateStatus(id: string, status: SAMProcessingStatus): Promise<MultimodalInput>;
  updateExtractedText(id: string, text: string): Promise<MultimodalInput>;
  updateTranscription(id: string, transcription: string, confidence: number): Promise<MultimodalInput>;
  updateAnalysis(id: string, analysis: InputAnalysis): Promise<MultimodalInput>;
  updateAltText(id: string, altText: string): Promise<MultimodalInput>;
  setError(id: string, error: string): Promise<MultimodalInput>;
  delete(id: string): Promise<void>;
}

// ============================================================================
// PRISMA MULTIMODAL STORE
// ============================================================================

export class PrismaMultimodalStore implements MultimodalStore {
  /**
   * Create a new multimodal input record
   */
  async create(input: CreateMultimodalInput): Promise<MultimodalInput> {
    const record = await db.sAMMultimodalInput.create({
      data: {
        userId: input.userId,
        inputType: input.inputType,
        content: input.content,
        contentSize: input.contentSize,
        mimeType: input.mimeType ?? null,
        courseId: input.courseId ?? null,
        topicId: input.topicId ?? null,
        questionId: input.questionId ?? null,
        status: 'PENDING',
        metadata: {},
      },
    });

    return this.mapToInput(record);
  }

  /**
   * Get a multimodal input by ID
   */
  async getById(id: string): Promise<MultimodalInput | null> {
    const record = await db.sAMMultimodalInput.findUnique({
      where: { id },
    });

    return record ? this.mapToInput(record) : null;
  }

  /**
   * Get all multimodal inputs for a user
   */
  async getByUserId(userId: string, limit: number = 20): Promise<MultimodalInput[]> {
    const records = await db.sAMMultimodalInput.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return records.map((r) => this.mapToInput(r));
  }

  /**
   * Get inputs by type
   */
  async getByType(userId: string, type: SAMInputType): Promise<MultimodalInput[]> {
    const records = await db.sAMMultimodalInput.findMany({
      where: { userId, inputType: type },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => this.mapToInput(r));
  }

  /**
   * Get pending inputs for processing
   */
  async getPending(): Promise<MultimodalInput[]> {
    const records = await db.sAMMultimodalInput.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    return records.map((r) => this.mapToInput(r));
  }

  /**
   * Update processing status
   */
  async updateStatus(id: string, status: SAMProcessingStatus): Promise<MultimodalInput> {
    const record = await db.sAMMultimodalInput.update({
      where: { id },
      data: {
        status,
        processedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });

    return this.mapToInput(record);
  }

  /**
   * Update extracted text (for images/documents)
   */
  async updateExtractedText(id: string, text: string): Promise<MultimodalInput> {
    const record = await db.sAMMultimodalInput.update({
      where: { id },
      data: { extractedText: text },
    });

    return this.mapToInput(record);
  }

  /**
   * Update transcription (for audio/video)
   */
  async updateTranscription(
    id: string,
    transcription: string,
    confidence: number
  ): Promise<MultimodalInput> {
    const record = await db.sAMMultimodalInput.update({
      where: { id },
      data: {
        transcription,
        confidence,
      },
    });

    return this.mapToInput(record);
  }

  /**
   * Update analysis results
   */
  async updateAnalysis(id: string, analysis: InputAnalysis): Promise<MultimodalInput> {
    const record = await db.sAMMultimodalInput.update({
      where: { id },
      data: {
        analysis: analysis as unknown as Record<string, unknown>,
      },
    });

    return this.mapToInput(record);
  }

  /**
   * Update alt text (for images)
   */
  async updateAltText(id: string, altText: string): Promise<MultimodalInput> {
    const record = await db.sAMMultimodalInput.update({
      where: { id },
      data: { altText },
    });

    return this.mapToInput(record);
  }

  /**
   * Set processing error
   */
  async setError(id: string, error: string): Promise<MultimodalInput> {
    const record = await db.sAMMultimodalInput.update({
      where: { id },
      data: {
        status: 'FAILED',
        error,
      },
    });

    return this.mapToInput(record);
  }

  /**
   * Delete a multimodal input
   */
  async delete(id: string): Promise<void> {
    await db.sAMMultimodalInput.delete({
      where: { id },
    });
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private mapToInput(
    record: Awaited<ReturnType<typeof db.sAMMultimodalInput.findUnique>>
  ): MultimodalInput {
    if (!record) {
      throw new Error('MultimodalInput record is null');
    }

    return {
      id: record.id,
      userId: record.userId,
      inputType: record.inputType,
      content: record.content,
      contentSize: record.contentSize,
      mimeType: record.mimeType,
      courseId: record.courseId,
      topicId: record.topicId,
      questionId: record.questionId,
      status: record.status,
      processedAt: record.processedAt,
      extractedText: record.extractedText,
      analysis: record.analysis as unknown as InputAnalysis | null,
      confidence: record.confidence,
      transcription: record.transcription,
      altText: record.altText,
      error: record.error,
      metadata: record.metadata as Record<string, unknown>,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPrismaMultimodalStore(): PrismaMultimodalStore {
  return new PrismaMultimodalStore();
}
