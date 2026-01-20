/**
 * Attachment Router
 * Enhanced Depth Analysis - January 2026
 *
 * Routes attachments and files to the appropriate content extractor
 * based on file type, MIME type, and content inspection.
 */

import type {
  ContentExtractor,
  RawContentSource,
  ExtractedContent,
  ExtractionOptions,
  ContentSourceType,
  ExtractionIssue,
} from '../types';

import { PDFExtractor } from './pdf-extractor';
import { SlideExtractor } from './slide-extractor';
import { TextExtractor } from './text-extractor';

const ATTACHMENT_ROUTER_VERSION = '1.0.0';

/**
 * MIME type to content source type mapping
 */
const MIME_TYPE_MAP: Record<string, ContentSourceType> = {
  // PDF
  'application/pdf': 'PDF_DOCUMENT',

  // PowerPoint
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'SLIDE_DECK',
  'application/vnd.ms-powerpoint': 'SLIDE_DECK',

  // Text formats
  'text/plain': 'TEXT_BLOCK',
  'text/html': 'TEXT_BLOCK',
  'text/markdown': 'TEXT_BLOCK',
  'text/x-markdown': 'TEXT_BLOCK',
  'application/json': 'TEXT_BLOCK',

  // Word documents (treated as attachment for now)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'ATTACHMENT',
  'application/msword': 'ATTACHMENT',

  // Excel (treated as attachment)
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'ATTACHMENT',
  'application/vnd.ms-excel': 'ATTACHMENT',

  // Images (not extractable as text)
  'image/jpeg': 'ATTACHMENT',
  'image/png': 'ATTACHMENT',
  'image/gif': 'ATTACHMENT',
  'image/webp': 'ATTACHMENT',

  // Video (transcript extraction deferred)
  'video/mp4': 'VIDEO_TRANSCRIPT',
  'video/webm': 'VIDEO_TRANSCRIPT',
  'video/quicktime': 'VIDEO_TRANSCRIPT',
};

/**
 * File extension to content source type mapping
 */
const EXTENSION_TYPE_MAP: Record<string, ContentSourceType> = {
  // PDF
  '.pdf': 'PDF_DOCUMENT',

  // PowerPoint
  '.pptx': 'SLIDE_DECK',
  '.ppt': 'SLIDE_DECK',

  // Text
  '.txt': 'TEXT_BLOCK',
  '.md': 'TEXT_BLOCK',
  '.markdown': 'TEXT_BLOCK',
  '.html': 'TEXT_BLOCK',
  '.htm': 'TEXT_BLOCK',
  '.json': 'TEXT_BLOCK',

  // Word
  '.docx': 'ATTACHMENT',
  '.doc': 'ATTACHMENT',

  // Excel
  '.xlsx': 'ATTACHMENT',
  '.xls': 'ATTACHMENT',
  '.csv': 'TEXT_BLOCK',

  // Images
  '.jpg': 'ATTACHMENT',
  '.jpeg': 'ATTACHMENT',
  '.png': 'ATTACHMENT',
  '.gif': 'ATTACHMENT',
  '.webp': 'ATTACHMENT',
  '.svg': 'ATTACHMENT',

  // Video
  '.mp4': 'VIDEO_TRANSCRIPT',
  '.webm': 'VIDEO_TRANSCRIPT',
  '.mov': 'VIDEO_TRANSCRIPT',
};

/**
 * Content types that can be extracted
 */
const EXTRACTABLE_TYPES: ContentSourceType[] = [
  'PDF_DOCUMENT',
  'SLIDE_DECK',
  'TEXT_BLOCK',
  'QUIZ_CONTENT',
  'ASSIGNMENT_CONTENT',
];

/**
 * Attachment Router
 * Routes files to appropriate extractors
 */
export class AttachmentRouter implements ContentExtractor {
  readonly supportedTypes = ['ATTACHMENT' as const];
  readonly name = 'Attachment Router';
  readonly version = ATTACHMENT_ROUTER_VERSION;

  private extractors: ContentExtractor[];
  private pdfExtractor: PDFExtractor;
  private slideExtractor: SlideExtractor;
  private textExtractor: TextExtractor;

  constructor() {
    this.pdfExtractor = new PDFExtractor();
    this.slideExtractor = new SlideExtractor();
    this.textExtractor = new TextExtractor();

    this.extractors = [
      this.pdfExtractor,
      this.slideExtractor,
      this.textExtractor,
    ];
  }

  /**
   * Check if this router can process the given source
   * The router can attempt to process any attachment
   */
  canProcess(source: RawContentSource): boolean {
    // Can process any attachment type
    if (source.type === 'ATTACHMENT') {
      return true;
    }

    // Check if any child extractor can process it
    return this.extractors.some((e) => e.canProcess(source));
  }

  /**
   * Detect content type from source
   */
  detectContentType(source: RawContentSource): ContentSourceType {
    // Check explicit type first
    if (source.type && source.type !== 'ATTACHMENT') {
      return source.type;
    }

    // Check MIME type
    if (source.mimeType && MIME_TYPE_MAP[source.mimeType]) {
      return MIME_TYPE_MAP[source.mimeType];
    }

    // Check file extension
    const fileName = source.fileName?.toLowerCase() || '';
    const url = source.url?.toLowerCase() || '';
    const path = source.filePath?.toLowerCase() || '';

    for (const [ext, type] of Object.entries(EXTENSION_TYPE_MAP)) {
      if (fileName.endsWith(ext) || url.endsWith(ext) || path.endsWith(ext)) {
        return type;
      }
    }

    // Default to attachment (unsupported)
    return 'ATTACHMENT';
  }

  /**
   * Check if a content type is extractable
   */
  isExtractable(type: ContentSourceType): boolean {
    return EXTRACTABLE_TYPES.includes(type);
  }

  /**
   * Get the appropriate extractor for a source
   */
  getExtractorForSource(source: RawContentSource): ContentExtractor | null {
    // Update source type based on detection
    const detectedType = this.detectContentType(source);
    const updatedSource = { ...source, type: detectedType };

    // Find matching extractor
    for (const extractor of this.extractors) {
      if (extractor.canProcess(updatedSource)) {
        return extractor;
      }
    }

    return null;
  }

  /**
   * Extract content from attachment by routing to appropriate extractor
   */
  async extract(
    source: RawContentSource,
    options: ExtractionOptions = {}
  ): Promise<ExtractedContent> {
    const issues: ExtractionIssue[] = [];

    // Detect content type
    const detectedType = this.detectContentType(source);

    // Check if extractable
    if (!this.isExtractable(detectedType)) {
      issues.push({
        type: 'warning',
        code: 'NOT_EXTRACTABLE',
        message: `Content type ${detectedType} is not extractable as text`,
      });

      return {
        text: '',
        wordCount: 0,
        metadata: {
          mimeType: source.mimeType,
          fileSize: source.fileSize,
          extra: {
            detectedType,
            originalFileName: source.fileName,
          },
        },
        quality: {
          score: 0,
          usedOCR: false,
          coveragePercent: 0,
          confidence: 1,
          issues,
        },
      };
    }

    // Update source with detected type
    const updatedSource: RawContentSource = {
      ...source,
      type: detectedType,
    };

    // Find appropriate extractor
    const extractor = this.getExtractorForSource(updatedSource);

    if (!extractor) {
      issues.push({
        type: 'error',
        code: 'NO_EXTRACTOR',
        message: `No extractor available for type ${detectedType}`,
      });

      return {
        text: '',
        wordCount: 0,
        metadata: {
          mimeType: source.mimeType,
          extra: {
            detectedType,
          },
        },
        quality: {
          score: 0,
          usedOCR: false,
          coveragePercent: 0,
          confidence: 0,
          issues,
        },
      };
    }

    // Extract using the appropriate extractor
    try {
      const result = await extractor.extract(updatedSource, options);

      // Add routing metadata
      result.metadata.extra = {
        ...result.metadata.extra,
        routedFrom: 'ATTACHMENT',
        routedTo: detectedType,
        extractorUsed: extractor.name,
        extractorVersion: extractor.version,
      };

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      issues.push({
        type: 'error',
        code: 'EXTRACTION_FAILED',
        message: `${extractor.name} failed: ${errorMessage}`,
      });

      return {
        text: '',
        wordCount: 0,
        metadata: {
          mimeType: source.mimeType,
          extra: {
            detectedType,
            extractorUsed: extractor.name,
          },
        },
        quality: {
          score: 0,
          usedOCR: false,
          coveragePercent: 0,
          confidence: 0,
          issues,
        },
      };
    }
  }

  /**
   * Get all registered extractors
   */
  getExtractors(): ContentExtractor[] {
    return [...this.extractors];
  }

  /**
   * Get supported file extensions
   */
  getSupportedExtensions(): string[] {
    return Object.entries(EXTENSION_TYPE_MAP)
      .filter(([_, type]) => EXTRACTABLE_TYPES.includes(type))
      .map(([ext]) => ext);
  }

  /**
   * Get supported MIME types
   */
  getSupportedMimeTypes(): string[] {
    return Object.entries(MIME_TYPE_MAP)
      .filter(([_, type]) => EXTRACTABLE_TYPES.includes(type))
      .map(([mime]) => mime);
  }
}

/**
 * Singleton instance of attachment router
 */
export const attachmentRouter = new AttachmentRouter();

/**
 * Utility functions for content type detection
 */
export const contentTypeUtils = {
  /**
   * Detect content type from filename
   */
  detectFromFilename(filename: string): ContentSourceType {
    const lower = filename.toLowerCase();
    for (const [ext, type] of Object.entries(EXTENSION_TYPE_MAP)) {
      if (lower.endsWith(ext)) {
        return type;
      }
    }
    return 'ATTACHMENT';
  },

  /**
   * Detect content type from MIME type
   */
  detectFromMimeType(mimeType: string): ContentSourceType {
    return MIME_TYPE_MAP[mimeType] || 'ATTACHMENT';
  },

  /**
   * Check if a file is extractable
   */
  isFileExtractable(filename: string): boolean {
    const type = contentTypeUtils.detectFromFilename(filename);
    return EXTRACTABLE_TYPES.includes(type);
  },

  /**
   * Get all extractable extensions
   */
  getExtractableExtensions(): string[] {
    return Object.entries(EXTENSION_TYPE_MAP)
      .filter(([_, type]) => EXTRACTABLE_TYPES.includes(type))
      .map(([ext]) => ext);
  },
};
