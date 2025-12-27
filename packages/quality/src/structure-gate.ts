/**
 * Structure Gate
 *
 * Validates the structural quality of AI-generated content:
 * - Heading hierarchy
 * - List usage
 * - Paragraph length
 * - Markdown formatting
 * - Logical flow
 */

import type {
  QualityGate,
  GateResult,
  GateIssue,
  GeneratedContent,
  ContentType,
  StructureGateConfig,
} from './types';
import { DEFAULT_STRUCTURE_CONFIG } from './types';

interface StructureMetrics {
  headingCount: number;
  headingLevels: number[];
  listCount: number;
  codeBlockCount: number;
  paragraphCount: number;
  averageParagraphLength: number;
  longestParagraphLength: number;
  hasProperHierarchy: boolean;
  markdownElements: string[];
}

export class StructureGate implements QualityGate {
  readonly name = 'StructureGate';
  readonly description =
    'Validates content structure including headings, lists, and formatting';
  readonly defaultWeight = 1.0;
  readonly applicableTypes: ContentType[] = [
    'lesson',
    'explanation',
    'tutorial',
    'summary',
    'assessment',
  ];

  private config: Required<StructureGateConfig>;

  constructor(config?: Partial<StructureGateConfig>) {
    this.config = {
      ...DEFAULT_STRUCTURE_CONFIG,
      ...config,
    } as Required<StructureGateConfig>;
  }

  async evaluate(content: GeneratedContent): Promise<GateResult> {
    const startTime = Date.now();
    const issues: GateIssue[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const text = content.content;
    const metrics = this.analyzeStructure(text);

    // 1. Check heading presence
    if (metrics.headingCount === 0 && this.shouldHaveHeadings(content)) {
      score -= 20;
      issues.push({
        severity: 'high',
        description: 'Content lacks section headings',
        suggestedFix: 'Add headings to organize the content into logical sections',
      });
      suggestions.push('Add section headings (## Heading) to organize the content');
    }

    // 2. Check heading hierarchy
    if (!metrics.hasProperHierarchy && metrics.headingCount > 1) {
      score -= 15;
      issues.push({
        severity: 'medium',
        description: 'Heading hierarchy is inconsistent (e.g., jumping from h1 to h3)',
        suggestedFix: 'Use a consistent heading hierarchy (h1 > h2 > h3)',
      });
      suggestions.push('Fix heading levels to follow proper hierarchy');
    }

    // 3. Check heading depth
    const maxHeadingLevel = Math.max(...metrics.headingLevels, 0);
    const minHeadingLevel = Math.min(...metrics.headingLevels.filter((l) => l > 0), 6);

    if (minHeadingLevel < this.config.minHeadingDepth) {
      score -= 5;
      issues.push({
        severity: 'low',
        description: `Content uses h${minHeadingLevel}, but h${this.config.minHeadingDepth} or deeper is recommended`,
        suggestedFix: `Start with h${this.config.minHeadingDepth} or deeper headings`,
      });
    }

    if (maxHeadingLevel > this.config.maxHeadingDepth) {
      score -= 5;
      issues.push({
        severity: 'low',
        description: `Content uses h${maxHeadingLevel}, which is too deep (max: h${this.config.maxHeadingDepth})`,
        suggestedFix: 'Reduce heading depth to improve readability',
      });
    }

    // 4. Check list usage
    if (this.config.requireLists && metrics.listCount === 0) {
      score -= 10;
      issues.push({
        severity: 'medium',
        description: 'Content lacks bullet points or numbered lists',
        suggestedFix: 'Use lists to present related items or steps clearly',
      });
      suggestions.push('Add bullet points or numbered lists where appropriate');
    }

    // 5. Check paragraph length
    if (metrics.longestParagraphLength > this.config.maxParagraphLength) {
      const severity =
        metrics.longestParagraphLength > this.config.maxParagraphLength * 2
          ? 'high'
          : 'medium';
      score -= severity === 'high' ? 15 : 10;
      issues.push({
        severity,
        description: `Some paragraphs are too long (${metrics.longestParagraphLength} sentences, max: ${this.config.maxParagraphLength})`,
        suggestedFix: 'Break long paragraphs into smaller, focused ones',
      });
      suggestions.push('Split long paragraphs into smaller chunks');
    }

    // 6. Check for markdown formatting (if required)
    if (this.config.requireMarkdown) {
      const markdownIssues = this.checkMarkdownFormatting(text, metrics);
      if (markdownIssues.length > 0) {
        score -= markdownIssues.length * 3;
        issues.push(...markdownIssues);
      }
    }

    // 7. Check for wall of text
    if (this.isWallOfText(text, metrics)) {
      score -= 20;
      issues.push({
        severity: 'high',
        description: 'Content appears as a wall of text without visual breaks',
        suggestedFix: 'Add headings, lists, and whitespace to improve readability',
      });
      suggestions.push('Break up the content with headings, lists, and shorter paragraphs');
    }

    // 8. Check for logical flow indicators
    const flowResult = this.checkLogicalFlow(text);
    if (!flowResult.hasGoodFlow) {
      score -= 10;
      issues.push({
        severity: 'medium',
        description: flowResult.issue,
        suggestedFix: flowResult.suggestion,
      });
      suggestions.push(flowResult.suggestion);
    }

    // 9. Check for consistent formatting
    const consistencyIssues = this.checkFormattingConsistency(text);
    if (consistencyIssues.length > 0) {
      score -= consistencyIssues.length * 3;
      issues.push(...consistencyIssues);
    }

    // 10. Check code blocks (for technical content)
    if (this.isTechnicalContent(content) && metrics.codeBlockCount === 0) {
      const hasInlineCode = /`[^`]+`/.test(text);
      if (!hasInlineCode) {
        score -= 10;
        issues.push({
          severity: 'medium',
          description: 'Technical content lacks code formatting',
          suggestedFix: 'Use code blocks (```) or inline code (`) for code snippets',
        });
      }
    }

    // Ensure score stays within bounds
    score = Math.max(0, Math.min(100, score));

    const passed = score >= 75 && !issues.some((i) => i.severity === 'critical');

    return {
      gateName: this.name,
      passed,
      score,
      weight: this.defaultWeight,
      issues,
      suggestions,
      processingTimeMs: Date.now() - startTime,
      metadata: {
        headingCount: metrics.headingCount,
        headingLevels: metrics.headingLevels,
        listCount: metrics.listCount,
        codeBlockCount: metrics.codeBlockCount,
        paragraphCount: metrics.paragraphCount,
        averageParagraphLength: Math.round(metrics.averageParagraphLength * 10) / 10,
        longestParagraphLength: metrics.longestParagraphLength,
        hasProperHierarchy: metrics.hasProperHierarchy,
        markdownElements: metrics.markdownElements,
      },
    };
  }

  /**
   * Analyze content structure
   */
  private analyzeStructure(text: string): StructureMetrics {
    // Count headings
    const headingMatches = text.match(/^#{1,6}\s+.+/gm) ?? [];
    const headingLevels = headingMatches.map((h) => {
      const match = h.match(/^(#+)/);
      return match ? match[1].length : 0;
    });

    // Count lists
    const bulletListItems = (text.match(/^\s*[-*+]\s+.+/gm) ?? []).length;
    const numberedListItems = (text.match(/^\s*\d+\.\s+.+/gm) ?? []).length;
    const listCount = bulletListItems + numberedListItems;

    // Count code blocks
    const codeBlockCount = (text.match(/```[\s\S]*?```/g) ?? []).length;

    // Analyze paragraphs
    const paragraphs = this.getParagraphs(text);
    const paragraphLengths = paragraphs.map((p) => this.countSentences(p));
    const averageParagraphLength =
      paragraphLengths.length > 0
        ? paragraphLengths.reduce((a, b) => a + b, 0) / paragraphLengths.length
        : 0;
    const longestParagraphLength = Math.max(...paragraphLengths, 0);

    // Check heading hierarchy
    const hasProperHierarchy = this.checkHeadingHierarchy(headingLevels);

    // Detect markdown elements
    const markdownElements = this.detectMarkdownElements(text);

    return {
      headingCount: headingMatches.length,
      headingLevels,
      listCount,
      codeBlockCount,
      paragraphCount: paragraphs.length,
      averageParagraphLength,
      longestParagraphLength,
      hasProperHierarchy,
      markdownElements,
    };
  }

  /**
   * Get paragraphs from text
   */
  private getParagraphs(text: string): string[] {
    // Remove code blocks first
    const withoutCode = text.replace(/```[\s\S]*?```/g, '');

    // Split by double newlines
    return withoutCode
      .split(/\n\s*\n/)
      .filter((p) => {
        const trimmed = p.trim();
        // Exclude headings, lists, and very short content
        return (
          trimmed.length > 50 &&
          !trimmed.startsWith('#') &&
          !trimmed.match(/^[-*+\d]/)
        );
      });
  }

  /**
   * Count sentences in a paragraph
   */
  private countSentences(paragraph: string): number {
    const sentences = paragraph.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    return sentences.length;
  }

  /**
   * Check heading hierarchy
   */
  private checkHeadingHierarchy(levels: number[]): boolean {
    if (levels.length <= 1) return true;

    for (let i = 1; i < levels.length; i++) {
      const current = levels[i];
      const previous = levels[i - 1];

      // Allow same level or one level deeper, or going back up
      if (current !== undefined && previous !== undefined) {
        if (current > previous && current - previous > 1) {
          return false; // Skipped a level
        }
      }
    }

    return true;
  }

  /**
   * Detect markdown elements used
   */
  private detectMarkdownElements(text: string): string[] {
    const elements: string[] = [];

    if (/^#{1,6}\s+/m.test(text)) elements.push('headings');
    if (/^\s*[-*+]\s+/m.test(text)) elements.push('bullet-list');
    if (/^\s*\d+\.\s+/m.test(text)) elements.push('numbered-list');
    if (/```[\s\S]*?```/.test(text)) elements.push('code-block');
    if (/`[^`]+`/.test(text)) elements.push('inline-code');
    if (/\*\*[^*]+\*\*/.test(text)) elements.push('bold');
    if (/\*[^*]+\*/.test(text) || /_[^_]+_/.test(text)) elements.push('italic');
    if (/\[.+\]\(.+\)/.test(text)) elements.push('link');
    if (/!\[.+\]\(.+\)/.test(text)) elements.push('image');
    if (/^\s*>\s+/m.test(text)) elements.push('blockquote');
    if (/\|.+\|/.test(text) && /[-:]+\|/.test(text)) elements.push('table');

    return elements;
  }

  /**
   * Check if content should have headings
   */
  private shouldHaveHeadings(content: GeneratedContent): boolean {
    // Short content doesn't need headings
    const wordCount = content.content.split(/\s+/).length;
    if (wordCount < 150) return false;

    // Certain content types need headings
    const needsHeadings: ContentType[] = ['lesson', 'tutorial', 'explanation'];
    return needsHeadings.includes(content.type);
  }

  /**
   * Check if content is a wall of text
   */
  private isWallOfText(text: string, metrics: StructureMetrics): boolean {
    const wordCount = text.split(/\s+/).length;

    // Short content is fine
    if (wordCount < 200) return false;

    // No structural elements = wall of text
    if (
      metrics.headingCount === 0 &&
      metrics.listCount === 0 &&
      metrics.codeBlockCount === 0
    ) {
      return true;
    }

    // Very few breaks for the content length
    const totalBreaks = metrics.headingCount + metrics.listCount + metrics.codeBlockCount;
    const breakRatio = wordCount / Math.max(totalBreaks, 1);

    // Should have a break every ~150 words
    return breakRatio > 200;
  }

  /**
   * Check for logical flow indicators
   */
  private checkLogicalFlow(text: string): {
    hasGoodFlow: boolean;
    issue: string;
    suggestion: string;
  } {
    // Look for transition words and phrases
    const transitionPatterns = [
      /\b(first|second|third|finally|next|then|after|before)\b/gi,
      /\b(however|therefore|moreover|furthermore|additionally|consequently)\b/gi,
      /\b(for example|for instance|such as|specifically)\b/gi,
      /\b(in conclusion|to summarize|in summary|overall)\b/gi,
    ];

    const wordCount = text.split(/\s+/).length;
    let transitionCount = 0;

    for (const pattern of transitionPatterns) {
      const matches = text.match(pattern);
      transitionCount += matches ? matches.length : 0;
    }

    // Expect at least 1 transition per 200 words for longer content
    const expectedTransitions = Math.floor(wordCount / 200);

    if (wordCount > 300 && transitionCount < expectedTransitions) {
      return {
        hasGoodFlow: false,
        issue: 'Content lacks transition words to guide the reader',
        suggestion:
          'Add transition phrases like "first", "however", "for example" to improve flow',
      };
    }

    return { hasGoodFlow: true, issue: '', suggestion: '' };
  }

  /**
   * Check markdown formatting
   */
  private checkMarkdownFormatting(text: string, metrics: StructureMetrics): GateIssue[] {
    const issues: GateIssue[] = [];

    // Check for plain text URLs
    const urlPattern = /(?<![(\[])(https?:\/\/[^\s\)]+)(?![)\]])/g;
    const plainUrls = text.match(urlPattern);
    if (plainUrls && plainUrls.length > 0) {
      issues.push({
        severity: 'low',
        description: 'Contains plain URLs that should be markdown links',
        suggestedFix: 'Convert URLs to markdown links: [link text](url)',
      });
    }

    // Check for emphasis opportunities
    if (metrics.markdownElements.length < 2) {
      const hasLongContent = text.split(/\s+/).length > 200;
      if (hasLongContent) {
        issues.push({
          severity: 'low',
          description: 'Content lacks text formatting (bold, italic)',
          suggestedFix: 'Use **bold** for key terms and *italic* for emphasis',
        });
      }
    }

    // Check for broken markdown
    const brokenPatterns = [
      { pattern: /\*\*[^*]+$/, issue: 'Unclosed bold formatting' },
      { pattern: /\*[^*]+$/, issue: 'Unclosed italic formatting' },
      { pattern: /\[[^\]]+\]\([^)]+$/, issue: 'Unclosed markdown link' },
      { pattern: /```[^`]*$/, issue: 'Unclosed code block' },
    ];

    for (const { pattern, issue } of brokenPatterns) {
      if (pattern.test(text)) {
        issues.push({
          severity: 'medium',
          description: issue,
          suggestedFix: 'Close all markdown formatting properly',
        });
      }
    }

    return issues;
  }

  /**
   * Check formatting consistency
   */
  private checkFormattingConsistency(text: string): GateIssue[] {
    const issues: GateIssue[] = [];

    // Check for mixed list styles
    const hasMixedBullets = /^\s*-\s+/m.test(text) && /^\s*\*\s+/m.test(text);

    if (hasMixedBullets) {
      issues.push({
        severity: 'low',
        description: 'Uses mixed bullet styles (- and *)',
        suggestedFix: 'Use consistent bullet style throughout',
      });
    }

    // Check for inconsistent heading style
    const hashHeadings = text.match(/^#{1,6}\s+/gm) ?? [];
    const underlineH1 = text.match(/^.+\n=+$/gm) ?? [];
    const underlineH2 = text.match(/^.+\n-+$/gm) ?? [];

    if (hashHeadings.length > 0 && (underlineH1.length > 0 || underlineH2.length > 0)) {
      issues.push({
        severity: 'low',
        description: 'Uses mixed heading styles (# and underline)',
        suggestedFix: 'Use consistent heading style (prefer # style)',
      });
    }

    return issues;
  }

  /**
   * Check if content is technical
   */
  private isTechnicalContent(content: GeneratedContent): boolean {
    const technicalKeywords = [
      'code',
      'function',
      'variable',
      'algorithm',
      'api',
      'database',
      'query',
      'syntax',
      'command',
      'terminal',
      'script',
    ];

    const text = content.content.toLowerCase();
    const topic = (content.context?.topic ?? '').toLowerCase();

    return technicalKeywords.some((kw) => text.includes(kw) || topic.includes(kw));
  }
}

/**
 * Factory function to create a StructureGate
 */
export function createStructureGate(config?: Partial<StructureGateConfig>): StructureGate {
  return new StructureGate(config);
}
