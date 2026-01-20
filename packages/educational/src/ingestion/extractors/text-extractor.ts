/**
 * Text Content Extractor
 * Enhanced Depth Analysis - January 2026
 *
 * Extracts and normalizes text content from various text-based formats:
 * - Plain text
 * - HTML content
 * - Markdown
 * - Section descriptions
 * - Quiz/assignment content
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

const TEXT_EXTRACTOR_VERSION = '1.0.0';

/**
 * Text Content Extractor
 * Handles plain text, HTML, and markdown content
 */
export class TextExtractor implements ContentExtractor {
  readonly supportedTypes = [
    'TEXT_BLOCK' as const,
    'QUIZ_CONTENT' as const,
    'ASSIGNMENT_CONTENT' as const,
  ];
  readonly name = 'Text Extractor';
  readonly version = TEXT_EXTRACTOR_VERSION;

  /**
   * Check if this extractor can process the given source
   */
  canProcess(source: RawContentSource): boolean {
    // Check by type
    if (this.supportedTypes.includes(source.type as 'TEXT_BLOCK' | 'QUIZ_CONTENT' | 'ASSIGNMENT_CONTENT')) {
      return true;
    }

    // Check by MIME type
    const textMimeTypes = [
      'text/plain',
      'text/html',
      'text/markdown',
      'text/x-markdown',
      'application/json',
    ];

    if (source.mimeType && textMimeTypes.includes(source.mimeType)) {
      return true;
    }

    // Check by file extension
    const fileName = source.fileName?.toLowerCase() || source.url?.toLowerCase() || '';
    const textExtensions = ['.txt', '.md', '.markdown', '.html', '.htm', '.json'];

    if (textExtensions.some((ext) => fileName.endsWith(ext))) {
      return true;
    }

    return false;
  }

  /**
   * Extract content from text source
   */
  async extract(
    source: RawContentSource,
    options: ExtractionOptions = {}
  ): Promise<ExtractedContent> {
    const issues: ExtractionIssue[] = [];

    try {
      // Get raw text content
      let rawText = await this.getRawText(source);

      if (!rawText || rawText.trim().length === 0) {
        issues.push({
          type: 'warning',
          code: 'EMPTY_CONTENT',
          message: 'Source contains no text content',
        });

        return {
          text: '',
          wordCount: 0,
          metadata: {
            mimeType: source.mimeType || 'text/plain',
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

      // Detect content type and process accordingly
      const contentType = this.detectContentType(rawText, source);
      let processedText: string;

      switch (contentType) {
        case 'html':
          processedText = this.extractFromHTML(rawText);
          break;
        case 'markdown':
          processedText = this.extractFromMarkdown(rawText);
          break;
        case 'json':
          processedText = this.extractFromJSON(rawText);
          break;
        default:
          processedText = rawText;
      }

      // Clean and normalize
      const cleanedText = this.cleanText(processedText);
      const wordCount = this.countWords(cleanedText);

      // Extract sections if requested
      let sections: ExtractedSection[] | undefined;
      if (options.extractStructure) {
        sections = this.extractSections(cleanedText, contentType);
      }

      // Extract headings
      const headings = this.extractHeadings(cleanedText, contentType);

      const quality = this.calculateQuality(cleanedText, issues);

      return {
        text: cleanedText,
        wordCount,
        metadata: {
          mimeType: source.mimeType || this.getMimeType(contentType),
          fileSize: Buffer.from(rawText).length,
          headings,
          extra: {
            detectedType: contentType,
            originalLength: rawText.length,
          },
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
          mimeType: source.mimeType || 'text/plain',
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
   * Get raw text from source
   */
  private async getRawText(source: RawContentSource): Promise<string> {
    if (source.buffer) {
      return source.buffer.toString('utf-8');
    }

    if (source.filePath) {
      const fs = await import('fs/promises');
      return fs.readFile(source.filePath, 'utf-8');
    }

    if (source.url) {
      const response = await fetch(source.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch text: ${response.status}`);
      }
      return response.text();
    }

    throw new Error('No valid source provided');
  }

  /**
   * Detect content type from content and source
   */
  private detectContentType(
    content: string,
    source: RawContentSource
  ): 'html' | 'markdown' | 'json' | 'plain' {
    // Check MIME type first
    if (source.mimeType) {
      if (source.mimeType.includes('html')) return 'html';
      if (source.mimeType.includes('markdown')) return 'markdown';
      if (source.mimeType.includes('json')) return 'json';
    }

    // Check file extension
    const fileName = source.fileName?.toLowerCase() || '';
    if (fileName.endsWith('.html') || fileName.endsWith('.htm')) return 'html';
    if (fileName.endsWith('.md') || fileName.endsWith('.markdown')) return 'markdown';
    if (fileName.endsWith('.json')) return 'json';

    // Detect from content
    const trimmed = content.trim();

    // Check for HTML
    if (/<(!DOCTYPE|html|head|body|div|p|span|a|img|table|ul|ol|li|h[1-6])/i.test(trimmed)) {
      return 'html';
    }

    // Check for JSON
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        JSON.parse(trimmed);
        return 'json';
      } catch {
        // Not valid JSON
      }
    }

    // Check for Markdown patterns
    if (/^#{1,6}\s|^\*\*|^-\s|\[.*\]\(.*\)|```/m.test(trimmed)) {
      return 'markdown';
    }

    return 'plain';
  }

  /**
   * Extract text from HTML content
   */
  private extractFromHTML(html: string): string {
    // Remove script and style tags first
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Remove HTML comments
    text = text.replace(/<!--[\s\S]*?-->/g, '');

    // Convert block elements to newlines
    text = text.replace(/<\/(p|div|h[1-6]|li|tr|br)>/gi, '\n');
    text = text.replace(/<br\s*\/?>/gi, '\n');

    // Convert list items to bullets
    text = text.replace(/<li[^>]*>/gi, '• ');

    // Remove remaining tags
    text = text.replace(/<[^>]+>/g, ' ');

    // Decode HTML entities
    text = this.decodeHTMLEntities(text);

    return text;
  }

  /**
   * Extract text from Markdown content
   */
  private extractFromMarkdown(markdown: string): string {
    let text = markdown;

    // Remove code blocks
    text = text.replace(/```[\s\S]*?```/g, '\n[code block]\n');
    text = text.replace(/`[^`]+`/g, '');

    // Convert headers to plain text
    text = text.replace(/^#{1,6}\s+(.+)$/gm, '$1');

    // Remove bold/italic markers
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
    text = text.replace(/\*([^*]+)\*/g, '$1');
    text = text.replace(/__([^_]+)__/g, '$1');
    text = text.replace(/_([^_]+)_/g, '$1');

    // Convert links to just text
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    // Convert images to description
    text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '[image: $1]');

    // Remove horizontal rules
    text = text.replace(/^[-*_]{3,}$/gm, '');

    // Convert list items
    text = text.replace(/^[-*+]\s+/gm, '• ');
    text = text.replace(/^\d+\.\s+/gm, '');

    return text;
  }

  /**
   * Extract text from JSON content
   */
  private extractFromJSON(json: string): string {
    try {
      const parsed = JSON.parse(json);
      return this.extractTextFromObject(parsed);
    } catch {
      return json;
    }
  }

  /**
   * Recursively extract text values from JSON object
   */
  private extractTextFromObject(obj: unknown, depth = 0): string {
    if (depth > 10) return ''; // Prevent infinite recursion

    if (typeof obj === 'string') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.extractTextFromObject(item, depth + 1)).join('\n');
    }

    if (typeof obj === 'object' && obj !== null) {
      const record = obj as Record<string, unknown>;
      const texts: string[] = [];

      // Prioritize certain keys
      const priorityKeys = ['text', 'content', 'description', 'title', 'question', 'answer', 'explanation'];

      for (const key of priorityKeys) {
        if (key in record) {
          const text = this.extractTextFromObject(record[key], depth + 1);
          if (text) texts.push(text);
        }
      }

      // Then other string values
      for (const [key, value] of Object.entries(record)) {
        if (!priorityKeys.includes(key)) {
          const text = this.extractTextFromObject(value, depth + 1);
          if (text) texts.push(text);
        }
      }

      return texts.join('\n');
    }

    return '';
  }

  /**
   * Decode HTML entities
   */
  private decodeHTMLEntities(text: string): string {
    const entities: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&apos;': "'",
      '&nbsp;': ' ',
      '&ndash;': '\u2013',
      '&mdash;': '\u2014',
      '&lsquo;': '\u2018',
      '&rsquo;': '\u2019',
      '&ldquo;': '\u201c',
      '&rdquo;': '\u201d',
      '&hellip;': '\u2026',
      '&copy;': '\u00A9',
      '&reg;': '\u00AE',
      '&trade;': '\u2122',
    };

    let result = text;
    for (const [entity, char] of Object.entries(entities)) {
      result = result.replace(new RegExp(entity, 'gi'), char);
    }

    // Decode numeric entities
    result = result.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
    result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));

    return result;
  }

  /**
   * Clean and normalize text
   */
  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[\t ]+/g, ' ')
      .replace(/\n /g, '\n')
      .replace(/ \n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
      .trim();
  }

  /**
   * Count words
   */
  private countWords(text: string): number {
    if (!text) return 0;
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }

  /**
   * Extract headings from text
   */
  private extractHeadings(
    text: string,
    contentType: 'html' | 'markdown' | 'json' | 'plain'
  ): string[] {
    const headings: string[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length > 100) continue;

      // For markdown-like content
      if (contentType === 'markdown') {
        const headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
        if (headerMatch) {
          headings.push(headerMatch[2]);
          continue;
        }
      }

      // General heuristics
      if (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed) && trimmed.length > 3) {
        headings.push(trimmed);
      } else if (/^(\d+\.)+\s*.+/.test(trimmed) && !trimmed.endsWith('.')) {
        headings.push(trimmed);
      }
    }

    return [...new Set(headings)].slice(0, 50);
  }

  /**
   * Extract sections from text
   */
  private extractSections(
    text: string,
    contentType: 'html' | 'markdown' | 'json' | 'plain'
  ): ExtractedSection[] {
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

    if (paragraphs.length <= 1) {
      return [
        {
          content: text,
          position: 0,
          wordCount: this.countWords(text),
        },
      ];
    }

    return paragraphs.map((paragraph, index) => {
      const trimmed = paragraph.trim();
      const lines = trimmed.split('\n');
      const firstLine = lines[0]?.trim() || '';

      // Check if first line looks like a heading
      const isHeading =
        firstLine.length < 80 &&
        (firstLine === firstLine.toUpperCase() ||
          /^(\d+\.)+\s*.+/.test(firstLine) ||
          (contentType === 'markdown' && /^#{1,6}\s+/.test(firstLine)));

      return {
        title: isHeading ? firstLine : undefined,
        content: isHeading && lines.length > 1 ? lines.slice(1).join('\n').trim() : trimmed,
        position: index,
        wordCount: this.countWords(trimmed),
      };
    });
  }

  /**
   * Get MIME type for content type
   */
  private getMimeType(contentType: 'html' | 'markdown' | 'json' | 'plain'): string {
    switch (contentType) {
      case 'html':
        return 'text/html';
      case 'markdown':
        return 'text/markdown';
      case 'json':
        return 'application/json';
      default:
        return 'text/plain';
    }
  }

  /**
   * Calculate extraction quality
   */
  private calculateQuality(text: string, issues: ExtractionIssue[]): ExtractionQuality {
    const hasErrors = issues.some((i) => i.type === 'error');

    if (hasErrors) {
      return {
        score: 0,
        usedOCR: false,
        coveragePercent: 0,
        confidence: 0,
        issues,
      };
    }

    const wordCount = this.countWords(text);
    const hasContent = wordCount > 0;

    // Text extraction is generally high confidence
    const confidence = hasContent ? 0.95 : 0;
    const coveragePercent = hasContent ? 100 : 0;

    const warningCount = issues.filter((i) => i.type === 'warning').length;
    const score = Math.max(0, confidence - warningCount * 0.1);

    return {
      score,
      usedOCR: false,
      coveragePercent,
      confidence,
      issues,
    };
  }
}

/**
 * Singleton instance of text extractor
 */
export const textExtractor = new TextExtractor();
