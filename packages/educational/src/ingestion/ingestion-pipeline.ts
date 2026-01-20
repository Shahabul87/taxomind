/**
 * Content Ingestion Pipeline
 * Enhanced Depth Analysis - January 2026
 *
 * Orchestrates the extraction of content from course materials
 * for comprehensive depth analysis.
 */

import type {
  ContentExtractor,
  ContentSourceStore,
  RawContentSource,
  ExtractedContent,
  ExtractionOptions,
  IngestionPipelineOptions,
  IngestionResult,
  IngestionError,
  IngestionStatus,
  IngestionLogger,
  ContentSourceType,
  ContentSourceCreateInput,
  CourseForIngestion,
  SectionForIngestion,
  ExamForIngestion,
  QuestionForIngestion,
} from './types';

import { AttachmentRouter, attachmentRouter, contentTypeUtils } from './extractors';

const PIPELINE_VERSION = '1.0.0';

/**
 * Default logger that does nothing
 */
const noopLogger: IngestionLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
};

/**
 * Content Ingestion Pipeline
 * Coordinates extraction of content from course materials
 */
export class ContentIngestionPipeline {
  private extractors: ContentExtractor[];
  private storage: ContentSourceStore;
  private router: AttachmentRouter;
  private concurrency: number;
  private retryAttempts: number;
  private retryDelay: number;
  private defaultOptions: ExtractionOptions;
  private logger: IngestionLogger;

  // Status tracking
  private isRunning = false;
  private currentTarget: string | null = null;
  private progress = 0;
  private startedAt: Date | null = null;
  private abortController: AbortController | null = null;

  constructor(options: IngestionPipelineOptions) {
    this.extractors = options.extractors;
    this.storage = options.storage;
    this.concurrency = options.concurrency ?? 3;
    this.retryAttempts = options.retryAttempts ?? 2;
    this.retryDelay = options.retryDelay ?? 1000;
    this.defaultOptions = options.defaultExtractionOptions ?? {};
    this.logger = options.logger ?? noopLogger;

    // Initialize router with extractors
    this.router = new AttachmentRouter();
  }

  /**
   * Get current ingestion status
   */
  getStatus(): IngestionStatus {
    return {
      isRunning: this.isRunning,
      progress: this.progress,
      currentSource: this.currentTarget ?? undefined,
      startedAt: this.startedAt ?? undefined,
    };
  }

  /**
   * Abort current ingestion
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Ingest all content from a course
   */
  async ingestCourse(course: CourseForIngestion): Promise<IngestionResult> {
    this.startIngestion(course.id);

    const startTime = Date.now();
    const errors: IngestionError[] = [];
    const byType: IngestionResult['byType'] = this.initializeByType();

    let totalSources = 0;
    let processedSources = 0;
    let failedSources = 0;
    let skippedSources = 0;
    let totalWords = 0;

    try {
      // Collect all sections
      const allSections: SectionForIngestion[] = [];
      for (const chapter of course.chapters) {
        allSections.push(...chapter.sections);
      }

      totalSources = this.countTotalSources(allSections);
      this.logger.info(`Starting ingestion for course ${course.id} with ${totalSources} sources`);

      // Process sections in batches based on concurrency
      const sectionBatches = this.batchArray(allSections, this.concurrency);
      let processedCount = 0;

      for (const batch of sectionBatches) {
        if (this.abortController?.signal.aborted) {
          this.logger.info('Ingestion aborted');
          break;
        }

        // Process batch in parallel
        const batchResults = await Promise.all(
          batch.map((section) => this.ingestSection(section))
        );

        // Aggregate results
        for (const result of batchResults) {
          processedSources += result.processedSources;
          failedSources += result.failedSources;
          skippedSources += result.skippedSources;
          totalWords += result.totalWords;
          errors.push(...result.errors);

          // Merge byType stats
          for (const [type, stats] of Object.entries(result.byType)) {
            const typeKey = type as ContentSourceType;
            byType[typeKey].total += stats.total;
            byType[typeKey].processed += stats.processed;
            byType[typeKey].failed += stats.failed;
            byType[typeKey].words += stats.words;
          }
        }

        processedCount += batch.length;
        this.progress = Math.round((processedCount / allSections.length) * 100);
      }

      this.logger.info(
        `Course ingestion complete: ${processedSources} processed, ${failedSources} failed, ${skippedSources} skipped`
      );

      return {
        targetId: course.id,
        targetType: 'course',
        totalSources,
        processedSources,
        failedSources,
        skippedSources,
        totalWords,
        durationMs: Date.now() - startTime,
        byType,
        errors,
      };
    } finally {
      this.endIngestion();
    }
  }

  /**
   * Ingest content from a single section
   */
  async ingestSection(section: SectionForIngestion): Promise<IngestionResult> {
    const startTime = Date.now();
    const errors: IngestionError[] = [];
    const byType: IngestionResult['byType'] = this.initializeByType();

    let totalSources = 0;
    let processedSources = 0;
    let failedSources = 0;
    let skippedSources = 0;
    let totalWords = 0;

    // Collect raw content sources from section
    const rawSources = this.collectSectionSources(section);
    totalSources = rawSources.length;

    this.logger.debug?.(`Processing section ${section.id} with ${totalSources} sources`);

    for (const rawSource of rawSources) {
      this.currentTarget = rawSource.fileName || rawSource.url || rawSource.type;

      try {
        // Check if already processed
        const existing = await this.storage.getBySectionId(section.id);
        const existingSource = existing.find(
          (e) =>
            e.originalUrl === rawSource.url ||
            (e.fileName === rawSource.fileName && e.sourceType === rawSource.type)
        );

        if (existingSource && existingSource.status === 'COMPLETED') {
          this.logger.debug?.(`Skipping already processed source: ${rawSource.fileName || rawSource.url}`);
          skippedSources++;
          byType[rawSource.type].total++;
          continue;
        }

        // Detect content type
        const detectedType = this.router.detectContentType(rawSource);
        byType[detectedType].total++;

        // Check if extractable
        if (!this.router.isExtractable(detectedType)) {
          this.logger.debug?.(`Skipping non-extractable type: ${detectedType}`);
          skippedSources++;
          continue;
        }

        // Create or update content source record
        const sourceRecord = existingSource
          ? existingSource
          : await this.storage.create({
              sectionId: section.id,
              sourceType: detectedType,
              originalUrl: rawSource.url,
              fileName: rawSource.fileName,
              mimeType: rawSource.mimeType,
              fileSize: rawSource.fileSize,
              status: 'PENDING',
            });

        // Mark as processing
        await this.storage.markProcessing(sourceRecord.id);

        // Extract content with retries
        let extracted: ExtractedContent | null = null;
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
          try {
            extracted = await this.router.extract(
              { ...rawSource, type: detectedType },
              this.defaultOptions
            );

            if (extracted.quality.score > 0 || extracted.wordCount > 0) {
              break;
            }
          } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            this.logger.warn(`Extraction attempt ${attempt + 1} failed: ${lastError.message}`);

            if (attempt < this.retryAttempts) {
              await this.delay(this.retryDelay * (attempt + 1));
            }
          }
        }

        if (extracted && (extracted.quality.score > 0 || extracted.wordCount > 0)) {
          // Mark as completed
          await this.storage.markCompleted(sourceRecord.id, extracted);
          processedSources++;
          totalWords += extracted.wordCount;
          byType[detectedType].processed++;
          byType[detectedType].words += extracted.wordCount;

          this.logger.debug?.(`Extracted ${extracted.wordCount} words from ${rawSource.fileName || rawSource.url}`);
        } else {
          // Mark as failed
          const errorMsg = lastError?.message || 'Extraction produced no content';
          await this.storage.markFailed(sourceRecord.id, errorMsg);
          failedSources++;
          byType[detectedType].failed++;

          errors.push({
            sourceId: sourceRecord.id,
            sourceType: detectedType,
            error: errorMsg,
          });

          this.logger.warn(`Failed to extract from ${rawSource.fileName || rawSource.url}: ${errorMsg}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        failedSources++;
        byType[rawSource.type].failed++;

        errors.push({
          sourceId: rawSource.id || 'unknown',
          sourceType: rawSource.type,
          error: errorMsg,
          stack: error instanceof Error ? error.stack : undefined,
        });

        this.logger.error(`Error processing source: ${errorMsg}`);
      }
    }

    return {
      targetId: section.id,
      targetType: 'section',
      totalSources,
      processedSources,
      failedSources,
      skippedSources,
      totalWords,
      durationMs: Date.now() - startTime,
      byType,
      errors,
    };
  }

  /**
   * Reprocess failed content sources for a course
   */
  async reprocessFailed(courseId: string): Promise<IngestionResult> {
    this.startIngestion(courseId);

    const startTime = Date.now();
    const errors: IngestionError[] = [];
    const byType: IngestionResult['byType'] = this.initializeByType();

    let totalSources = 0;
    let processedSources = 0;
    let failedSources = 0;
    const skippedSources = 0;
    let totalWords = 0;

    try {
      // Get all failed sources for the course
      const failedItems = await this.storage.getByStatus('FAILED', 100);
      const courseFailedItems = failedItems.filter(
        (item) => item.sectionId // TODO: Filter by courseId via section lookup
      );

      totalSources = courseFailedItems.length;
      this.logger.info(`Reprocessing ${totalSources} failed sources for course ${courseId}`);

      for (const source of courseFailedItems) {
        if (this.abortController?.signal.aborted) break;

        this.currentTarget = source.fileName || source.originalUrl || source.sourceType;
        byType[source.sourceType].total++;

        try {
          // Build raw source from stored data
          const rawSource: RawContentSource = {
            id: source.id,
            sectionId: source.sectionId,
            type: source.sourceType,
            url: source.originalUrl ?? undefined,
            fileName: source.fileName ?? undefined,
            mimeType: source.mimeType ?? undefined,
            fileSize: source.fileSize ?? undefined,
          };

          // Reset retry count and try again
          await this.storage.update(source.id, { retryCount: 0, status: 'PROCESSING' });

          const extracted = await this.router.extract(rawSource, this.defaultOptions);

          if (extracted.quality.score > 0 || extracted.wordCount > 0) {
            await this.storage.markCompleted(source.id, extracted);
            processedSources++;
            totalWords += extracted.wordCount;
            byType[source.sourceType].processed++;
            byType[source.sourceType].words += extracted.wordCount;
          } else {
            await this.storage.markFailed(source.id, 'Reprocessing produced no content');
            failedSources++;
            byType[source.sourceType].failed++;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          await this.storage.markFailed(source.id, errorMsg);
          failedSources++;
          byType[source.sourceType].failed++;

          errors.push({
            sourceId: source.id,
            sourceType: source.sourceType,
            error: errorMsg,
          });
        }

        this.progress = Math.round(
          ((processedSources + failedSources) / totalSources) * 100
        );
      }

      return {
        targetId: courseId,
        targetType: 'course',
        totalSources,
        processedSources,
        failedSources,
        skippedSources,
        totalWords,
        durationMs: Date.now() - startTime,
        byType,
        errors,
      };
    } finally {
      this.endIngestion();
    }
  }

  /**
   * Get ingestion statistics for a course
   */
  async getIngestionStats(courseId: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    pending: number;
    totalWords: number;
    byType: Record<ContentSourceType, number>;
  }> {
    const sources = await this.storage.getByCourseId(courseId);

    const stats = {
      total: sources.length,
      completed: 0,
      failed: 0,
      pending: 0,
      totalWords: 0,
      byType: this.initializeTypeCount(),
    };

    for (const source of sources) {
      stats.byType[source.sourceType]++;

      switch (source.status) {
        case 'COMPLETED':
          stats.completed++;
          stats.totalWords += source.wordCount;
          break;
        case 'FAILED':
          stats.failed++;
          break;
        case 'PENDING':
        case 'PROCESSING':
          stats.pending++;
          break;
      }
    }

    return stats;
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Start ingestion tracking
   */
  private startIngestion(targetId: string): void {
    this.isRunning = true;
    this.currentTarget = targetId;
    this.progress = 0;
    this.startedAt = new Date();
    this.abortController = new AbortController();
  }

  /**
   * End ingestion tracking
   */
  private endIngestion(): void {
    this.isRunning = false;
    this.currentTarget = null;
    this.progress = 100;
    this.abortController = null;
  }

  /**
   * Collect raw content sources from a section
   */
  private collectSectionSources(section: SectionForIngestion): RawContentSource[] {
    const sources: RawContentSource[] = [];

    // Section description as text block
    if (section.description && section.description.trim().length > 0) {
      sources.push({
        sectionId: section.id,
        type: 'TEXT_BLOCK',
        buffer: Buffer.from(section.description, 'utf-8'),
        fileName: `${section.title}-description.txt`,
        mimeType: 'text/plain',
      });
    }

    // Attachments
    if (section.attachments) {
      for (const attachment of section.attachments) {
        sources.push({
          sectionId: section.id,
          type: 'ATTACHMENT',
          url: attachment.url,
          fileName: attachment.name,
        });
      }
    }

    // Quiz content
    if (section.exams) {
      for (const exam of section.exams) {
        const quizContent = this.buildQuizContent(exam);
        sources.push({
          sectionId: section.id,
          type: 'QUIZ_CONTENT',
          buffer: Buffer.from(quizContent, 'utf-8'),
          fileName: `${exam.title}-quiz.json`,
          mimeType: 'application/json',
        });
      }
    }

    return sources;
  }

  /**
   * Build quiz content JSON
   */
  private buildQuizContent(exam: ExamForIngestion): string {
    const content = {
      title: exam.title,
      questions: exam.questions.map((q: QuestionForIngestion) => ({
        text: q.text,
        type: q.type,
        options: q.options?.map((o: { id: string; text: string; isCorrect: boolean }) => o.text),
        explanation: q.explanation,
      })),
    };

    return JSON.stringify(content, null, 2);
  }

  /**
   * Count total sources in sections
   */
  private countTotalSources(sections: SectionForIngestion[]): number {
    let count = 0;

    for (const section of sections) {
      // Description
      if (section.description && section.description.trim().length > 0) {
        count++;
      }

      // Attachments
      if (section.attachments) {
        count += section.attachments.length;
      }

      // Exams
      if (section.exams) {
        count += section.exams.length;
      }
    }

    return count;
  }

  /**
   * Initialize byType stats object
   */
  private initializeByType(): IngestionResult['byType'] {
    return {
      VIDEO_TRANSCRIPT: { total: 0, processed: 0, failed: 0, words: 0 },
      PDF_DOCUMENT: { total: 0, processed: 0, failed: 0, words: 0 },
      SLIDE_DECK: { total: 0, processed: 0, failed: 0, words: 0 },
      TEXT_BLOCK: { total: 0, processed: 0, failed: 0, words: 0 },
      ATTACHMENT: { total: 0, processed: 0, failed: 0, words: 0 },
      QUIZ_CONTENT: { total: 0, processed: 0, failed: 0, words: 0 },
      ASSIGNMENT_CONTENT: { total: 0, processed: 0, failed: 0, words: 0 },
    };
  }

  /**
   * Initialize type count object
   */
  private initializeTypeCount(): Record<ContentSourceType, number> {
    return {
      VIDEO_TRANSCRIPT: 0,
      PDF_DOCUMENT: 0,
      SLIDE_DECK: 0,
      TEXT_BLOCK: 0,
      ATTACHMENT: 0,
      QUIZ_CONTENT: 0,
      ASSIGNMENT_CONTENT: 0,
    };
  }

  /**
   * Batch array into chunks
   */
  private batchArray<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Delay for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a content ingestion pipeline with default extractors
 */
export function createContentIngestionPipeline(
  storage: ContentSourceStore,
  options?: Partial<Omit<IngestionPipelineOptions, 'storage' | 'extractors'>>
): ContentIngestionPipeline {
  return new ContentIngestionPipeline({
    storage,
    extractors: attachmentRouter.getExtractors(),
    ...options,
  });
}

export { PIPELINE_VERSION };
