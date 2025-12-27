/**
 * Completeness Gate
 *
 * Validates that AI-generated content is complete:
 * - Minimum word count
 * - Required sections present
 * - Introduction and conclusion (if required)
 * - Learning objectives coverage
 */

import type {
  QualityGate,
  GateResult,
  GateIssue,
  GeneratedContent,
  ContentType,
  CompletenessGateConfig,
} from './types';
import { DEFAULT_COMPLETENESS_CONFIG } from './types';

export class CompletenessGate implements QualityGate {
  readonly name = 'CompletenessGate';
  readonly description =
    'Validates that content is complete with required sections and minimum length';
  readonly defaultWeight = 1.5; // Higher weight - completeness is critical
  readonly applicableTypes: ContentType[] = [
    'lesson',
    'explanation',
    'tutorial',
    'summary',
    'assessment',
  ];

  private config: Required<CompletenessGateConfig>;

  constructor(config?: Partial<CompletenessGateConfig>) {
    this.config = {
      ...DEFAULT_COMPLETENESS_CONFIG,
      ...config,
    } as Required<CompletenessGateConfig>;
  }

  async evaluate(content: GeneratedContent): Promise<GateResult> {
    const startTime = Date.now();
    const issues: GateIssue[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const text = content.content;

    // 1. Check word count
    const wordCount = this.countWords(text);
    const minWords = this.getMinWordCount(content);

    if (wordCount < minWords) {
      const shortfall = minWords - wordCount;
      const severity = shortfall > minWords * 0.5 ? 'critical' : 'high';
      score -= severity === 'critical' ? 40 : 25;
      issues.push({
        severity,
        description: `Content has ${wordCount} words, but requires at least ${minWords} words`,
        suggestedFix: `Add approximately ${shortfall} more words to meet the minimum requirement`,
      });
      suggestions.push(`Expand the content by adding more detail and examples`);
    }

    // 2. Check for introduction
    if (this.config.requireIntroduction) {
      const hasIntro = this.hasIntroduction(text);
      if (!hasIntro) {
        score -= 15;
        issues.push({
          severity: 'high',
          description: 'Content is missing an introduction',
          location: 'beginning',
          suggestedFix: 'Add an introductory paragraph that sets context and previews the content',
        });
        suggestions.push('Start with an introduction that explains what will be covered');
      }
    }

    // 3. Check for conclusion
    if (this.config.requireConclusion) {
      const hasConclusion = this.hasConclusion(text);
      if (!hasConclusion) {
        score -= 10;
        issues.push({
          severity: 'medium',
          description: 'Content is missing a conclusion',
          location: 'end',
          suggestedFix: 'Add a concluding section that summarizes key points',
        });
        suggestions.push('End with a conclusion that summarizes the main takeaways');
      }
    }

    // 4. Check required sections
    if (content.expectedSections && content.expectedSections.length > 0) {
      const missingSections = this.findMissingSections(text, content.expectedSections);
      if (missingSections.length > 0) {
        const severity = missingSections.length > 2 ? 'critical' : 'high';
        score -= missingSections.length * 10;
        issues.push({
          severity,
          description: `Missing required sections: ${missingSections.join(', ')}`,
          suggestedFix: `Add the following sections: ${missingSections.join(', ')}`,
        });
        suggestions.push(`Include sections for: ${missingSections.join(', ')}`);
      }
    }

    // 5. Check section count
    const sectionCount = this.countSections(text);
    if (sectionCount < this.config.minSections) {
      score -= 15;
      issues.push({
        severity: 'medium',
        description: `Content has ${sectionCount} sections, but requires at least ${this.config.minSections}`,
        suggestedFix: `Add ${this.config.minSections - sectionCount} more sections to organize the content better`,
      });
      suggestions.push('Break the content into more distinct sections with headings');
    }

    // 6. Check learning objectives coverage
    if (content.context?.learningObjectives && content.context.learningObjectives.length > 0) {
      const coverageResult = this.checkObjectiveCoverage(
        text,
        content.context.learningObjectives
      );

      if (coverageResult.coverage < this.config.objectiveCoverageThreshold) {
        const severity = coverageResult.coverage < 0.5 ? 'critical' : 'high';
        score -= Math.round((1 - coverageResult.coverage) * 30);
        issues.push({
          severity,
          description: `Only ${Math.round(coverageResult.coverage * 100)}% of learning objectives are covered`,
          suggestedFix: `Address the following objectives: ${coverageResult.missing.join(', ')}`,
        });
        suggestions.push(
          `Add content covering: ${coverageResult.missing.slice(0, 3).join(', ')}`
        );
      }
    }

    // 7. Check for abrupt ending
    if (this.hasAbruptEnding(text)) {
      score -= 10;
      issues.push({
        severity: 'medium',
        description: 'Content appears to end abruptly',
        location: 'end',
        suggestedFix: 'Ensure the content has a proper ending that wraps up the topic',
      });
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
        wordCount,
        sectionCount,
        hasIntroduction: this.hasIntroduction(text),
        hasConclusion: this.hasConclusion(text),
      },
    };
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  /**
   * Get minimum word count based on content type
   */
  private getMinWordCount(content: GeneratedContent): number {
    // Content type specific minimums
    const typeMinimums: Record<ContentType, number> = {
      lesson: 300,
      explanation: 150,
      exercise: 100,
      quiz: 50,
      assessment: 100,
      summary: 100,
      tutorial: 400,
      example: 50,
      feedback: 50,
      answer: 30,
    };

    const typeMin = typeMinimums[content.type] ?? 100;
    return Math.max(typeMin, this.config.minWordCount);
  }

  /**
   * Check if content has an introduction
   */
  private hasIntroduction(text: string): boolean {
    const introPatterns = [
      /^#\s+\w+/m, // Heading at start
      /^##?\s*(introduction|overview|about|getting started)/im,
      /^(in this|this (lesson|tutorial|guide|section)|welcome|let's|we will)/im,
      /^(today|here|this document)/im,
    ];

    const firstParagraph = text.split(/\n\n/)[0] ?? '';

    return introPatterns.some((pattern) => pattern.test(firstParagraph));
  }

  /**
   * Check if content has a conclusion
   */
  private hasConclusion(text: string): boolean {
    const conclusionPatterns = [
      /##?\s*(conclusion|summary|wrap up|key takeaways|in summary)/im,
      /(in conclusion|to summarize|in summary|to wrap up|key points)/im,
      /(we (have |)(learned|covered|explored)|remember that)/im,
      /##?\s*(next steps|what's next|further reading)/im,
    ];

    const lastParagraphs = text.split(/\n\n/).slice(-3).join('\n\n');

    return conclusionPatterns.some((pattern) => pattern.test(lastParagraphs));
  }

  /**
   * Find sections that are required but missing
   */
  private findMissingSections(text: string, requiredSections: string[]): string[] {
    const textLower = text.toLowerCase();
    const missing: string[] = [];

    for (const section of requiredSections) {
      const sectionLower = section.toLowerCase();
      // Check for heading or mention of section
      const hasSection =
        textLower.includes(`# ${sectionLower}`) ||
        textLower.includes(`## ${sectionLower}`) ||
        textLower.includes(`### ${sectionLower}`) ||
        this.hasSectionContent(textLower, sectionLower);

      if (!hasSection) {
        missing.push(section);
      }
    }

    return missing;
  }

  /**
   * Check if section topic is covered in content
   */
  private hasSectionContent(text: string, sectionName: string): boolean {
    // Generate keywords from section name
    const keywords = sectionName
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .map((word) => word.toLowerCase());

    if (keywords.length === 0) return true;

    // Check if most keywords appear in text
    const foundCount = keywords.filter((kw) => text.includes(kw)).length;
    return foundCount >= Math.ceil(keywords.length * 0.7);
  }

  /**
   * Count the number of sections/headings in content
   */
  private countSections(text: string): number {
    const headingPattern = /^#{1,4}\s+\w/gm;
    const matches = text.match(headingPattern);
    return matches ? matches.length : 0;
  }

  /**
   * Check coverage of learning objectives
   */
  private checkObjectiveCoverage(
    text: string,
    objectives: string[]
  ): { coverage: number; missing: string[] } {
    const textLower = text.toLowerCase();
    const missing: string[] = [];

    for (const objective of objectives) {
      const objectiveKeywords = this.extractKeywords(objective);
      const keywordMatches = objectiveKeywords.filter((kw) => textLower.includes(kw)).length;
      const coverageRatio = keywordMatches / objectiveKeywords.length;

      if (coverageRatio < 0.5) {
        missing.push(objective);
      }
    }

    const coverage = (objectives.length - missing.length) / objectives.length;
    return { coverage, missing };
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'must',
      'shall',
      'can',
      'need',
      'this',
      'that',
      'these',
      'those',
      'what',
      'which',
      'who',
      'how',
      'why',
      'when',
      'where',
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));
  }

  /**
   * Check if content ends abruptly
   */
  private hasAbruptEnding(text: string): boolean {
    const trimmed = text.trim();
    const lastChar = trimmed[trimmed.length - 1];

    // Check for incomplete sentences
    if (lastChar && !['.', '!', '?', ':', '"', "'", ')'].includes(lastChar)) {
      return true;
    }

    // Check for common incomplete patterns
    const lastLine = trimmed.split('\n').pop() ?? '';
    const incompletePatterns = [/and\s*$/i, /or\s*$/i, /with\s*$/i, /for\s*$/i, /:\s*$/];

    return incompletePatterns.some((pattern) => pattern.test(lastLine));
  }
}

/**
 * Factory function to create a CompletenessGate
 */
export function createCompletenessGate(config?: Partial<CompletenessGateConfig>): CompletenessGate {
  return new CompletenessGate(config);
}
