/**
 * PDF Content Extractor
 * Enhanced Depth Analysis - January 2026
 *
 * Extracts text content from PDF documents for depth analysis.
 * Uses pdf-parse for text extraction with fallback to simpler methods.
 */

import type {
  ContentExtractor,
  RawContentSource,
  ExtractedContent,
  ExtractionOptions,
  ExtractedSection,
  ExtractionQuality,
  ExtractionIssue,
} from '../types';

// PDF parsing will be dynamically imported to handle missing dependency gracefully
interface PDFParseResult {
  numpages: number;
  text: string;
  info: {
    Title?: string;
    Author?: string;
    CreationDate?: string;
    [key: string]: unknown;
  };
  metadata?: {
    _metadata?: Record<string, unknown>;
  };
}

const PDF_EXTRACTOR_VERSION = '1.0.0';

/**
 * PDF Content Extractor
 * Extracts text and metadata from PDF documents
 */
export class PDFExtractor implements ContentExtractor {
  readonly supportedTypes = ['PDF_DOCUMENT' as const];
  readonly name = 'PDF Extractor';
  readonly version = PDF_EXTRACTOR_VERSION;

  private pdfParse: ((buffer: Buffer) => Promise<PDFParseResult>) | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize pdf-parse library (lazy load)
   */
  private async initPDFParse(): Promise<void> {
    if (this.pdfParse) return;

    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = (async () => {
      try {
        // Dynamic import to handle missing dependency
        const pdfParseModule = await (Function('return import("pdf-parse")')() as Promise<{ default: (buffer: Buffer) => Promise<PDFParseResult> }>);
        this.pdfParse = pdfParseModule.default || pdfParseModule;
      } catch {
        // pdf-parse not available, will use fallback
        this.pdfParse = null;
      }
    })();

    await this.initPromise;
  }

  /**
   * Check if this extractor can process the given source
   */
  canProcess(source: RawContentSource): boolean {
    // Check by type
    if (source.type === 'PDF_DOCUMENT') {
      return true;
    }

    // Check by MIME type
    if (source.mimeType === 'application/pdf') {
      return true;
    }

    // Check by file extension
    if (source.fileName?.toLowerCase().endsWith('.pdf')) {
      return true;
    }

    if (source.url?.toLowerCase().endsWith('.pdf')) {
      return true;
    }

    return false;
  }

  /**
   * Extract content from PDF
   */
  async extract(
    source: RawContentSource,
    options: ExtractionOptions = {}
  ): Promise<ExtractedContent> {
    const issues: ExtractionIssue[] = [];
    let text = '';
    let pageCount = 0;
    let title: string | undefined;
    let author: string | undefined;
    let createdDate: Date | undefined;

    try {
      // Get PDF buffer
      const buffer = await this.getBuffer(source);

      if (!buffer || buffer.length === 0) {
        throw new Error('Empty or invalid PDF buffer');
      }

      // Initialize pdf-parse
      await this.initPDFParse();

      if (this.pdfParse) {
        // Use pdf-parse library
        const result = await this.pdfParse(buffer);

        text = result.text || '';
        pageCount = result.numpages || 0;

        // Extract metadata
        if (result.info) {
          title = result.info.Title as string | undefined;
          author = result.info.Author as string | undefined;

          if (result.info.CreationDate) {
            try {
              createdDate = this.parsePDFDate(result.info.CreationDate as string);
            } catch {
              // Ignore date parsing errors
            }
          }
        }

        // Apply max pages limit if specified
        if (options.maxPages && pageCount > options.maxPages) {
          text = this.limitToPages(text, options.maxPages, pageCount);
          issues.push({
            type: 'warning',
            code: 'PAGES_LIMITED',
            message: `Only first ${options.maxPages} of ${pageCount} pages extracted`,
          });
        }
      } else {
        // Fallback: basic text extraction attempt
        text = this.fallbackExtract(buffer);
        issues.push({
          type: 'warning',
          code: 'FALLBACK_EXTRACTION',
          message: 'pdf-parse not available, using fallback extraction',
        });
      }

      // Clean and normalize text
      text = this.cleanText(text);

      // Calculate word count
      const wordCount = this.countWords(text);

      // Extract sections if requested
      let sections: ExtractedSection[] | undefined;
      if (options.extractStructure) {
        sections = this.extractSections(text);
      }

      // Calculate quality metrics
      const quality = this.calculateQuality(text, pageCount, issues);

      return {
        text,
        wordCount,
        metadata: {
          pageCount,
          fileSize: buffer.length,
          mimeType: 'application/pdf',
          title,
          author,
          createdDate,
          headings: this.extractHeadings(text),
        },
        sections,
        quality,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      issues.push({
        type: 'error',
        code: 'EXTRACTION_FAILED',
        message: errorMessage,
      });

      return {
        text: '',
        wordCount: 0,
        metadata: {
          pageCount: 0,
          mimeType: 'application/pdf',
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
   * Get PDF buffer from various source types
   */
  private async getBuffer(source: RawContentSource): Promise<Buffer> {
    // If buffer is provided directly
    if (source.buffer) {
      return source.buffer;
    }

    // If file path is provided
    if (source.filePath) {
      const fs = await import('fs/promises');
      return fs.readFile(source.filePath);
    }

    // If URL is provided
    if (source.url) {
      return this.fetchFromUrl(source.url);
    }

    throw new Error('No valid source provided (buffer, filePath, or url required)');
  }

  /**
   * Fetch PDF from URL
   */
  private async fetchFromUrl(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown fetch error';
      throw new Error(`Failed to fetch PDF from URL: ${message}`);
    }
  }

  /**
   * Parse PDF date format (D:YYYYMMDDHHmmSS)
   */
  private parsePDFDate(dateStr: string): Date | undefined {
    // PDF date format: D:YYYYMMDDHHmmSSOHH'mm'
    const match = dateStr.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/);

    if (match) {
      const [, year, month, day, hour = '00', minute = '00', second = '00'] = match;
      return new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        parseInt(second)
      );
    }

    return undefined;
  }

  /**
   * Fallback text extraction for when pdf-parse is not available
   */
  private fallbackExtract(buffer: Buffer): string {
    // Very basic extraction - look for text streams
    const content = buffer.toString('latin1');
    const textMatches: string[] = [];

    // Match text between BT and ET markers (PDF text objects)
    const btEtRegex = /BT\s*([\s\S]*?)\s*ET/g;
    let match;

    while ((match = btEtRegex.exec(content)) !== null) {
      const textContent = match[1];
      // Extract text from Tj and TJ operators
      const tjRegex = /\((.*?)\)\s*Tj|\[(.*?)\]\s*TJ/g;
      let tjMatch;

      while ((tjMatch = tjRegex.exec(textContent)) !== null) {
        const text = tjMatch[1] || tjMatch[2];
        if (text) {
          // Basic cleanup
          textMatches.push(text.replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8))));
        }
      }
    }

    return textMatches.join(' ');
  }

  /**
   * Limit text to approximately the first N pages
   */
  private limitToPages(text: string, maxPages: number, totalPages: number): string {
    const ratio = maxPages / totalPages;
    const targetLength = Math.floor(text.length * ratio);
    return text.substring(0, targetLength);
  }

  /**
   * Clean and normalize extracted text
   */
  private cleanText(text: string): string {
    return (
      text
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        // Remove excessive newlines
        .replace(/\n{3,}/g, '\n\n')
        // Remove control characters
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
        // Trim
        .trim()
    );
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    if (!text) return 0;
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }

  /**
   * Extract headings from text (heuristic-based)
   */
  private extractHeadings(text: string): string[] {
    const headings: string[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) continue;

      // Heuristics for detecting headings:
      // 1. All caps lines (likely headings)
      // 2. Lines that start with numbers (like "1.", "1.1", etc.)
      // 3. Short lines (< 100 chars) that don't end with period

      if (trimmed.length < 100) {
        // Check if all caps
        if (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
          headings.push(trimmed);
          continue;
        }

        // Check if numbered section
        if (/^(\d+\.)+\s*.+/.test(trimmed) && !trimmed.endsWith('.')) {
          headings.push(trimmed);
          continue;
        }

        // Check if title-like (starts with capital, no ending punctuation)
        if (
          /^[A-Z][a-zA-Z\s]+$/.test(trimmed) &&
          trimmed.length > 5 &&
          trimmed.length < 60
        ) {
          headings.push(trimmed);
        }
      }
    }

    // Deduplicate and limit
    return [...new Set(headings)].slice(0, 50);
  }

  /**
   * Extract sections from text based on headings
   */
  private extractSections(text: string): ExtractedSection[] {
    const sections: ExtractedSection[] = [];
    const headings = this.extractHeadings(text);

    if (headings.length === 0) {
      // No headings found, return whole text as one section
      return [
        {
          content: text,
          position: 0,
          wordCount: this.countWords(text),
        },
      ];
    }

    // Split text by headings
    let lastIndex = 0;
    let position = 0;

    for (const heading of headings) {
      const headingIndex = text.indexOf(heading, lastIndex);

      if (headingIndex === -1) continue;

      // Add content before this heading as previous section
      if (headingIndex > lastIndex && sections.length > 0) {
        const prevContent = text.substring(lastIndex, headingIndex).trim();
        if (prevContent) {
          sections[sections.length - 1].content = prevContent;
          sections[sections.length - 1].wordCount = this.countWords(prevContent);
        }
      }

      // Start new section
      sections.push({
        title: heading,
        content: '',
        position: position++,
        wordCount: 0,
      });

      lastIndex = headingIndex + heading.length;
    }

    // Add remaining content to last section
    if (sections.length > 0 && lastIndex < text.length) {
      const remainingContent = text.substring(lastIndex).trim();
      sections[sections.length - 1].content = remainingContent;
      sections[sections.length - 1].wordCount = this.countWords(remainingContent);
    }

    return sections.filter((s) => s.wordCount > 0);
  }

  /**
   * Calculate extraction quality metrics
   */
  private calculateQuality(
    text: string,
    pageCount: number,
    issues: ExtractionIssue[]
  ): ExtractionQuality {
    const hasErrors = issues.some((i) => i.type === 'error');

    if (hasErrors || !text) {
      return {
        score: 0,
        usedOCR: false,
        coveragePercent: 0,
        confidence: 0,
        issues,
      };
    }

    // Estimate expected words per page (average ~300 words/page)
    const expectedWords = pageCount * 300;
    const actualWords = this.countWords(text);

    // Coverage: ratio of actual to expected words
    const coveragePercent = Math.min(100, (actualWords / expectedWords) * 100);

    // Confidence based on coverage
    let confidence = coveragePercent / 100;

    // Reduce confidence if there are warnings
    const warningCount = issues.filter((i) => i.type === 'warning').length;
    confidence = Math.max(0, confidence - warningCount * 0.1);

    // Overall score
    const score = confidence * (1 - warningCount * 0.05);

    return {
      score: Math.max(0, Math.min(1, score)),
      usedOCR: false,
      coveragePercent: Math.min(100, coveragePercent),
      confidence: Math.max(0, Math.min(1, confidence)),
      issues,
    };
  }
}

/**
 * Singleton instance of PDF extractor
 */
export const pdfExtractor = new PDFExtractor();
