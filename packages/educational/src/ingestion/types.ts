/**
 * Content Ingestion Pipeline - Types and Interfaces
 * Enhanced Depth Analysis - January 2026
 *
 * Defines the types for content extraction, normalization, and storage
 * for comprehensive course depth analysis.
 */

// ═══════════════════════════════════════════════════════════════
// CONTENT SOURCE TYPES (mirror Prisma enums)
// ═══════════════════════════════════════════════════════════════

export type ContentSourceType =
  | 'VIDEO_TRANSCRIPT'
  | 'PDF_DOCUMENT'
  | 'SLIDE_DECK'
  | 'TEXT_BLOCK'
  | 'ATTACHMENT'
  | 'QUIZ_CONTENT'
  | 'ASSIGNMENT_CONTENT';

export type ContentProcessingStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED';

// ═══════════════════════════════════════════════════════════════
// RAW CONTENT SOURCE (input to extractors)
// ═══════════════════════════════════════════════════════════════

export interface RawContentSource {
  /** Unique identifier for this content source */
  id?: string;

  /** Section this content belongs to */
  sectionId: string;

  /** Type of content */
  type: ContentSourceType;

  /** URL to the content (for remote files) */
  url?: string;

  /** File path (for local files) */
  filePath?: string;

  /** Raw content buffer (for in-memory content) */
  buffer?: Buffer;

  /** Original filename */
  fileName?: string;

  /** MIME type */
  mimeType?: string;

  /** File size in bytes */
  fileSize?: number;

  /** Additional metadata from the source */
  sourceMetadata?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════
// EXTRACTED CONTENT (output from extractors)
// ═══════════════════════════════════════════════════════════════

export interface ExtractedContent {
  /** Full extracted text content */
  text: string;

  /** Word count of extracted text */
  wordCount: number;

  /** Extraction metadata */
  metadata: ExtractedMetadata;

  /** Structured sections (if applicable) */
  sections?: ExtractedSection[];

  /** Extraction quality indicators */
  quality: ExtractionQuality;
}

export interface ExtractedMetadata {
  /** Page count (for PDFs) */
  pageCount?: number;

  /** Slide count (for presentations) */
  slideCount?: number;

  /** Duration in seconds (for video/audio) */
  duration?: number;

  /** File size in bytes */
  fileSize?: number;

  /** MIME type */
  mimeType?: string;

  /** Document title (if found in metadata) */
  title?: string;

  /** Document author (if found in metadata) */
  author?: string;

  /** Creation date (if found in metadata) */
  createdDate?: Date;

  /** Language detected */
  language?: string;

  /** Headings found in document */
  headings?: string[];

  /** Table of contents (if applicable) */
  tableOfContents?: TableOfContentsEntry[];

  /** Images found (count and descriptions) */
  images?: ImageInfo[];

  /** Tables found (count) */
  tableCount?: number;

  /** Code blocks found (count) */
  codeBlockCount?: number;

  /** Additional type-specific metadata */
  extra?: Record<string, unknown>;
}

export interface ExtractedSection {
  /** Section title (if available) */
  title?: string;

  /** Section content */
  content: string;

  /** Position in document (0-indexed) */
  position: number;

  /** Nesting level (for hierarchical documents) */
  level?: number;

  /** Word count for this section */
  wordCount: number;

  /** Page/slide number where this section starts */
  startPage?: number;

  /** Page/slide number where this section ends */
  endPage?: number;
}

export interface TableOfContentsEntry {
  title: string;
  level: number;
  page?: number;
}

export interface ImageInfo {
  /** Description or alt text */
  description?: string;

  /** Page/slide number */
  page?: number;

  /** Caption text (if available) */
  caption?: string;
}

export interface ExtractionQuality {
  /** Overall quality score (0-1) */
  score: number;

  /** Was OCR used? */
  usedOCR: boolean;

  /** Percentage of content successfully extracted */
  coveragePercent: number;

  /** Any issues encountered */
  issues: ExtractionIssue[];

  /** Confidence in the extraction */
  confidence: number;
}

export interface ExtractionIssue {
  type: 'warning' | 'error';
  code: string;
  message: string;
  page?: number;
}

// ═══════════════════════════════════════════════════════════════
// CONTENT EXTRACTOR INTERFACE
// ═══════════════════════════════════════════════════════════════

export interface ContentExtractor {
  /** Content type(s) this extractor handles */
  readonly supportedTypes: ContentSourceType[];

  /** Human-readable name for this extractor */
  readonly name: string;

  /** Version of this extractor */
  readonly version: string;

  /**
   * Check if this extractor can process the given source
   * @param source The raw content source to check
   * @returns true if this extractor can handle the source
   */
  canProcess(source: RawContentSource): boolean;

  /**
   * Extract content from the source
   * @param source The raw content source to extract from
   * @param options Optional extraction options
   * @returns Extracted content with metadata
   */
  extract(source: RawContentSource, options?: ExtractionOptions): Promise<ExtractedContent>;
}

export interface ExtractionOptions {
  /** Maximum pages/slides to extract (for large documents) */
  maxPages?: number;

  /** Include images in extraction? */
  includeImages?: boolean;

  /** Include tables in extraction? */
  includeTables?: boolean;

  /** Enable OCR for scanned documents? */
  enableOCR?: boolean;

  /** Language hint for OCR */
  ocrLanguage?: string;

  /** Timeout in milliseconds */
  timeout?: number;

  /** Extract sections/structure? */
  extractStructure?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// CONTENT SOURCE STORE INTERFACE
// ═══════════════════════════════════════════════════════════════

export interface ContentSourceData {
  id: string;
  sectionId: string;
  sourceType: ContentSourceType;
  originalUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  extractedText: string | null;
  wordCount: number;
  pageCount: number | null;
  slideCount: number | null;
  duration: number | null;
  metadata: Record<string, unknown> | null;
  status: ContentProcessingStatus;
  processedAt: Date | null;
  errorMessage: string | null;
  retryCount: number;
  bloomsAnalysis: Record<string, unknown> | null;
  dokAnalysis: Record<string, unknown> | null;
  analysisVersion: string | null;
  analyzedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentSourceCreateInput {
  sectionId: string;
  sourceType: ContentSourceType;
  originalUrl?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  extractedText?: string;
  wordCount?: number;
  pageCount?: number;
  slideCount?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
  status?: ContentProcessingStatus;
}

export interface ContentSourceUpdateInput {
  extractedText?: string;
  wordCount?: number;
  pageCount?: number;
  slideCount?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
  status?: ContentProcessingStatus;
  processedAt?: Date;
  errorMessage?: string;
  retryCount?: number;
  bloomsAnalysis?: Record<string, unknown>;
  dokAnalysis?: Record<string, unknown>;
  analysisVersion?: string;
  analyzedAt?: Date;
}

export interface ContentSourceStore {
  /**
   * Create a new content source record
   */
  create(input: ContentSourceCreateInput): Promise<ContentSourceData>;

  /**
   * Update an existing content source
   */
  update(id: string, input: ContentSourceUpdateInput): Promise<ContentSourceData>;

  /**
   * Get content source by ID
   */
  getById(id: string): Promise<ContentSourceData | null>;

  /**
   * Get all content sources for a section
   */
  getBySectionId(sectionId: string): Promise<ContentSourceData[]>;

  /**
   * Get all content sources for a course (via sections)
   */
  getByCourseId(courseId: string): Promise<ContentSourceData[]>;

  /**
   * Get content sources by status
   */
  getByStatus(status: ContentProcessingStatus, limit?: number): Promise<ContentSourceData[]>;

  /**
   * Get pending content sources for processing
   */
  getPendingForProcessing(limit: number): Promise<ContentSourceData[]>;

  /**
   * Mark content source as processing
   */
  markProcessing(id: string): Promise<void>;

  /**
   * Mark content source as completed with extracted content
   */
  markCompleted(id: string, content: ExtractedContent): Promise<void>;

  /**
   * Mark content source as failed
   */
  markFailed(id: string, error: string): Promise<void>;

  /**
   * Delete content source
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all content sources for a section
   */
  deleteBySectionId(sectionId: string): Promise<number>;
}

// ═══════════════════════════════════════════════════════════════
// INGESTION PIPELINE TYPES
// ═══════════════════════════════════════════════════════════════

export interface IngestionPipelineOptions {
  /** Content extractors to use */
  extractors: ContentExtractor[];

  /** Storage adapter */
  storage: ContentSourceStore;

  /** Maximum concurrent extractions */
  concurrency?: number;

  /** Number of retry attempts for failed extractions */
  retryAttempts?: number;

  /** Delay between retries in milliseconds */
  retryDelay?: number;

  /** Default extraction options */
  defaultExtractionOptions?: ExtractionOptions;

  /** Logger for debugging */
  logger?: IngestionLogger;
}

export interface IngestionLogger {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  debug?: (message: string, ...args: unknown[]) => void;
}

export interface IngestionResult {
  /** Course or section ID that was ingested */
  targetId: string;

  /** Type of target (course or section) */
  targetType: 'course' | 'section';

  /** Total content sources found */
  totalSources: number;

  /** Successfully processed sources */
  processedSources: number;

  /** Failed sources */
  failedSources: number;

  /** Skipped sources (not supported) */
  skippedSources: number;

  /** Total words extracted */
  totalWords: number;

  /** Processing duration in milliseconds */
  durationMs: number;

  /** Breakdown by content type */
  byType: Record<ContentSourceType, {
    total: number;
    processed: number;
    failed: number;
    words: number;
  }>;

  /** Errors encountered */
  errors: IngestionError[];
}

export interface IngestionError {
  sourceId: string;
  sourceType: ContentSourceType;
  error: string;
  stack?: string;
}

export interface IngestionStatus {
  /** Is ingestion currently running? */
  isRunning: boolean;

  /** Current progress (0-100) */
  progress: number;

  /** Current source being processed */
  currentSource?: string;

  /** Started at timestamp */
  startedAt?: Date;

  /** Estimated completion time */
  estimatedCompletion?: Date;

  /** Partial results */
  partialResult?: Partial<IngestionResult>;
}

// ═══════════════════════════════════════════════════════════════
// COURSE DATA TYPES (for ingestion input)
// ═══════════════════════════════════════════════════════════════

export interface CourseForIngestion {
  id: string;
  title: string;
  chapters: ChapterForIngestion[];
}

export interface ChapterForIngestion {
  id: string;
  title: string;
  sections: SectionForIngestion[];
}

export interface SectionForIngestion {
  id: string;
  title: string;
  description?: string | null;
  videoUrl?: string | null;

  /** Existing content sources */
  contentSources?: ContentSourceData[];

  /** Attachments linked to this section */
  attachments?: AttachmentForIngestion[];

  /** Exams in this section (for quiz content extraction) */
  exams?: ExamForIngestion[];
}

export interface AttachmentForIngestion {
  id: string;
  name: string;
  url: string;
}

export interface ExamForIngestion {
  id: string;
  title: string;
  questions: QuestionForIngestion[];
}

export interface QuestionForIngestion {
  id: string;
  text: string;
  type: string;
  options?: Array<{ id: string; text: string; isCorrect: boolean }>;
  explanation?: string | null;
}
