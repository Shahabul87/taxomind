/**
 * Slide Deck Content Extractor
 * Enhanced Depth Analysis - January 2026
 *
 * Extracts text content from PowerPoint presentations (.pptx) for depth analysis.
 * Uses JSZip to read the OOXML format and extracts text from slides.
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

const SLIDE_EXTRACTOR_VERSION = '1.0.0';

/**
 * Slide Deck Content Extractor
 * Extracts text and metadata from PowerPoint presentations
 */
// JSZip interface for type safety without importing the module
interface JSZipFile {
  async(type: 'string'): Promise<string>;
  async(type: 'arraybuffer'): Promise<ArrayBuffer>;
}

interface JSZipInstance {
  files: Record<string, JSZipFile>;
  file(name: string): JSZipFile | null;
  loadAsync(data: Buffer | ArrayBuffer): Promise<JSZipInstance>;
}

interface JSZipConstructor {
  new (): JSZipInstance;
  loadAsync(data: Buffer | ArrayBuffer): Promise<JSZipInstance>;
}

export class SlideExtractor implements ContentExtractor {
  readonly supportedTypes = ['SLIDE_DECK' as const];
  readonly name = 'Slide Deck Extractor';
  readonly version = SLIDE_EXTRACTOR_VERSION;

  private JSZip: JSZipConstructor | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize JSZip library (lazy load)
   */
  private async initJSZip(): Promise<void> {
    if (this.JSZip) return;

    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = (async () => {
      try {
        // Dynamic import to handle missing dependency
        const jszip = await (Function('return import("jszip")')() as Promise<{ default: JSZipConstructor }>);
        this.JSZip = jszip.default || jszip;
      } catch {
        this.JSZip = null;
      }
    })();

    await this.initPromise;
  }

  /**
   * Check if this extractor can process the given source
   */
  canProcess(source: RawContentSource): boolean {
    if (source.type === 'SLIDE_DECK') {
      return true;
    }

    const pptxMimeTypes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
    ];

    if (source.mimeType && pptxMimeTypes.includes(source.mimeType)) {
      return true;
    }

    const fileName = source.fileName?.toLowerCase() || source.url?.toLowerCase() || '';
    if (fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) {
      return true;
    }

    return false;
  }

  /**
   * Extract content from slide deck
   */
  async extract(
    source: RawContentSource,
    options: ExtractionOptions = {}
  ): Promise<ExtractedContent> {
    const issues: ExtractionIssue[] = [];

    try {
      const buffer = await this.getBuffer(source);

      if (!buffer || buffer.length === 0) {
        throw new Error('Empty or invalid presentation buffer');
      }

      await this.initJSZip();

      if (!this.JSZip) {
        throw new Error('JSZip library not available');
      }

      const zip = await this.JSZip.loadAsync(buffer);

      // Extract slides
      const slides = await this.extractSlides(zip, options.maxPages);

      // Extract presentation metadata
      const metadata = await this.extractMetadata(zip);

      // Combine all slide text
      const allText = slides.map((s) => s.content).join('\n\n');
      const cleanedText = this.cleanText(allText);
      const wordCount = this.countWords(cleanedText);

      // Build sections from slides
      const sections: ExtractedSection[] = slides.map((slide, index) => ({
        title: slide.title || `Slide ${index + 1}`,
        content: slide.content,
        position: index,
        wordCount: this.countWords(slide.content),
        startPage: index + 1,
        endPage: index + 1,
      }));

      // Check for limited slides
      if (options.maxPages && slides.length >= options.maxPages) {
        const totalSlides = await this.countTotalSlides(zip);
        if (totalSlides > options.maxPages) {
          issues.push({
            type: 'warning',
            code: 'SLIDES_LIMITED',
            message: `Only first ${options.maxPages} of ${totalSlides} slides extracted`,
          });
        }
      }

      const quality = this.calculateQuality(cleanedText, slides.length, issues);

      return {
        text: cleanedText,
        wordCount,
        metadata: {
          slideCount: slides.length,
          fileSize: buffer.length,
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          title: metadata.title,
          author: metadata.author,
          createdDate: metadata.created,
          headings: slides.map((s) => s.title).filter(Boolean) as string[],
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
          slideCount: 0,
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
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
   * Get presentation buffer from various source types
   */
  private async getBuffer(source: RawContentSource): Promise<Buffer> {
    if (source.buffer) {
      return source.buffer;
    }

    if (source.filePath) {
      const fs = await import('fs/promises');
      return fs.readFile(source.filePath);
    }

    if (source.url) {
      const response = await fetch(source.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch presentation: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }

    throw new Error('No valid source provided');
  }

  /**
   * Extract slides from PPTX ZIP
   */
  private async extractSlides(
    zip: JSZipInstance,
    maxSlides?: number
  ): Promise<Array<{ title: string | null; content: string }>> {
    const slides: Array<{ title: string | null; content: string }> = [];

    // Get all slide files (slide1.xml, slide2.xml, etc.)
    const slideFiles = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
        const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
        return numA - numB;
      });

    const limit = maxSlides || slideFiles.length;

    for (let i = 0; i < Math.min(slideFiles.length, limit); i++) {
      const file = slideFiles[i];
      const content = await zip.file(file)?.async('string');

      if (content) {
        const slideData = this.parseSlideXML(content);
        slides.push(slideData);
      }
    }

    return slides;
  }

  /**
   * Parse slide XML to extract text
   */
  private parseSlideXML(xml: string): { title: string | null; content: string } {
    const texts: string[] = [];
    let title: string | null = null;

    // Extract all text from <a:t> tags
    const textRegex = /<a:t>([^<]*)<\/a:t>/g;
    let match;

    while ((match = textRegex.exec(xml)) !== null) {
      const text = this.decodeXMLEntities(match[1]).trim();
      if (text) {
        texts.push(text);

        // First substantial text is likely the title
        if (!title && text.length > 3) {
          title = text;
        }
      }
    }

    // Check for title in shape with title placeholder
    const titleMatch = xml.match(/<p:ph type="title"[^>]*>[\s\S]*?<a:t>([^<]*)<\/a:t>/);
    if (titleMatch) {
      title = this.decodeXMLEntities(titleMatch[1]).trim() || title;
    }

    // Also extract from <p:txBody> structures
    const txBodyRegex = /<p:txBody>[\s\S]*?<\/p:txBody>/g;
    while ((match = txBodyRegex.exec(xml)) !== null) {
      const innerTexts = match[0].match(/<a:t>([^<]*)<\/a:t>/g);
      if (innerTexts) {
        for (const innerText of innerTexts) {
          const textMatch = innerText.match(/<a:t>([^<]*)<\/a:t>/);
          if (textMatch) {
            const text = this.decodeXMLEntities(textMatch[1]).trim();
            if (text && !texts.includes(text)) {
              texts.push(text);
            }
          }
        }
      }
    }

    return {
      title,
      content: texts.join('\n'),
    };
  }

  /**
   * Extract presentation metadata
   */
  private async extractMetadata(
    zip: JSZipInstance
  ): Promise<{ title?: string; author?: string; created?: Date }> {
    try {
      // Core properties are in docProps/core.xml
      const coreXml = await zip.file('docProps/core.xml')?.async('string');

      if (!coreXml) {
        return {};
      }

      const titleMatch = coreXml.match(/<dc:title>([^<]*)<\/dc:title>/);
      const authorMatch = coreXml.match(/<dc:creator>([^<]*)<\/dc:creator>/);
      const createdMatch = coreXml.match(/<dcterms:created[^>]*>([^<]*)<\/dcterms:created>/);

      return {
        title: titleMatch ? this.decodeXMLEntities(titleMatch[1]) : undefined,
        author: authorMatch ? this.decodeXMLEntities(authorMatch[1]) : undefined,
        created: createdMatch ? new Date(createdMatch[1]) : undefined,
      };
    } catch {
      return {};
    }
  }

  /**
   * Count total slides in presentation
   */
  private async countTotalSlides(zip: JSZipInstance): Promise<number> {
    return Object.keys(zip.files).filter((name) =>
      /^ppt\/slides\/slide\d+\.xml$/.test(name)
    ).length;
  }

  /**
   * Decode XML entities
   */
  private decodeXMLEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
  }

  /**
   * Clean and normalize text
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
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
   * Calculate extraction quality
   */
  private calculateQuality(
    text: string,
    slideCount: number,
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

    // Estimate expected words per slide (~50 words/slide average)
    const expectedWords = slideCount * 50;
    const actualWords = this.countWords(text);

    const coveragePercent = Math.min(100, (actualWords / Math.max(1, expectedWords)) * 100);

    let confidence = Math.min(1, coveragePercent / 100);

    const warningCount = issues.filter((i) => i.type === 'warning').length;
    confidence = Math.max(0, confidence - warningCount * 0.1);

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
 * Singleton instance of slide extractor
 */
export const slideExtractor = new SlideExtractor();
