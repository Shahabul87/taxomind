/**
 * Example Quality Gate
 *
 * Validates the quality and quantity of examples in AI-generated content:
 * - Minimum/maximum number of examples
 * - Example length and detail
 * - Code examples for programming content
 * - Real-world examples when appropriate
 */

import type {
  QualityGate,
  GateResult,
  GateIssue,
  GeneratedContent,
  ContentType,
  ExampleQualityGateConfig,
} from './types';
import { DEFAULT_EXAMPLE_QUALITY_CONFIG } from './types';

interface DetectedExample {
  type: 'code' | 'conceptual' | 'realWorld' | 'mathematical' | 'scenario';
  content: string;
  wordCount: number;
  startIndex: number;
  quality: 'high' | 'medium' | 'low';
}

export class ExampleQualityGate implements QualityGate {
  readonly name = 'ExampleQualityGate';
  readonly description =
    'Validates that content has adequate, high-quality examples';
  readonly defaultWeight = 1.2;
  readonly applicableTypes: ContentType[] = [
    'lesson',
    'explanation',
    'tutorial',
    'exercise',
    'example',
  ];

  private config: Required<ExampleQualityGateConfig>;

  constructor(config?: Partial<ExampleQualityGateConfig>) {
    this.config = {
      ...DEFAULT_EXAMPLE_QUALITY_CONFIG,
      ...config,
    } as Required<ExampleQualityGateConfig>;
  }

  async evaluate(content: GeneratedContent): Promise<GateResult> {
    const startTime = Date.now();
    const issues: GateIssue[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const text = content.content;
    const examples = this.detectExamples(text);

    // 1. Check minimum example count
    const expectedExamples = content.expectedExamples ?? this.config.minExamples;
    if (examples.length < expectedExamples) {
      const shortage = expectedExamples - examples.length;
      const severity = shortage > 2 ? 'critical' : 'high';
      score -= severity === 'critical' ? 35 : 20;
      issues.push({
        severity,
        description: `Content has ${examples.length} examples, but requires at least ${expectedExamples}`,
        suggestedFix: `Add ${shortage} more examples to illustrate key concepts`,
      });
      suggestions.push('Add more examples to clarify the concepts being explained');
    }

    // 2. Check maximum example count (too many can be overwhelming)
    if (examples.length > this.config.maxExamples) {
      score -= 10;
      issues.push({
        severity: 'low',
        description: `Content has ${examples.length} examples, which exceeds the recommended maximum of ${this.config.maxExamples}`,
        suggestedFix: 'Consider consolidating or removing some examples to improve focus',
      });
      suggestions.push('Consider removing less relevant examples to maintain focus');
    }

    // 3. Check example quality
    const lowQualityExamples = examples.filter((e) => e.quality === 'low');
    if (lowQualityExamples.length > examples.length * 0.3) {
      score -= 20;
      issues.push({
        severity: 'high',
        description: `${lowQualityExamples.length} of ${examples.length} examples are low quality (too short or vague)`,
        suggestedFix: 'Expand examples with more detail and context',
      });
      suggestions.push('Improve example quality by adding more context and explanation');
    }

    // 4. Check for code examples in programming content
    if (this.isProgrammingContent(content)) {
      const codeExamples = examples.filter((e) => e.type === 'code');
      if (this.config.requireCodeExamples && codeExamples.length === 0) {
        score -= 25;
        issues.push({
          severity: 'high',
          description: 'Programming content should include code examples',
          suggestedFix: 'Add code snippets demonstrating the concepts',
        });
        suggestions.push('Include executable code examples that readers can try');
      }

      // Check code example quality
      if (codeExamples.length > 0) {
        const codeIssues = this.checkCodeExampleQuality(codeExamples);
        if (codeIssues.length > 0) {
          score -= codeIssues.length * 5;
          issues.push(...codeIssues);
        }
      }
    }

    // 5. Check for real-world examples
    if (this.config.requireRealWorldExamples) {
      const realWorldExamples = examples.filter((e) => e.type === 'realWorld');
      if (realWorldExamples.length === 0) {
        score -= 15;
        issues.push({
          severity: 'medium',
          description: 'Content lacks real-world examples',
          suggestedFix: 'Add practical, real-world scenarios to make concepts relatable',
        });
        suggestions.push('Include real-world scenarios showing practical applications');
      }
    }

    // 6. Check example length
    const tooShortExamples = examples.filter(
      (e) => e.wordCount < this.config.minExampleLength
    );
    if (tooShortExamples.length > 0 && examples.length > 0) {
      const ratio = tooShortExamples.length / examples.length;
      if (ratio > 0.5) {
        score -= 15;
        issues.push({
          severity: 'medium',
          description: `${tooShortExamples.length} examples are too brief (under ${this.config.minExampleLength} words)`,
          suggestedFix: 'Expand brief examples with more detail and explanation',
        });
        suggestions.push('Make examples more detailed with step-by-step explanations');
      }
    }

    // 7. Check example variety
    if (examples.length >= 2) {
      const varietyResult = this.checkExampleVariety(examples);
      if (!varietyResult.hasVariety) {
        score -= 10;
        issues.push({
          severity: 'low',
          description: 'Examples lack variety in type or approach',
          suggestedFix: varietyResult.suggestion,
        });
        suggestions.push(varietyResult.suggestion);
      }
    }

    // 8. Check example placement (should be near related content)
    const placementIssues = this.checkExamplePlacement(text, examples);
    if (placementIssues.length > 0) {
      score -= placementIssues.length * 3;
      issues.push(...placementIssues);
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
        exampleCount: examples.length,
        exampleTypes: this.countExampleTypes(examples),
        averageExampleLength: this.calculateAverageLength(examples),
        hasCodeExamples: examples.some((e) => e.type === 'code'),
        hasRealWorldExamples: examples.some((e) => e.type === 'realWorld'),
      },
    };
  }

  /**
   * Detect examples in the content
   */
  private detectExamples(text: string): DetectedExample[] {
    const examples: DetectedExample[] = [];

    // Pattern 1: Explicit example markers
    const explicitPatterns = [
      /(?:for example|e\.g\.|such as|consider|let's say|imagine|suppose)[,:]?\s*(.{20,500}?)(?=\n\n|\.|$)/gim,
      /(?:here'?s an example|example:|for instance)[,:]?\s*(.{20,500}?)(?=\n\n|$)/gim,
    ];

    for (const pattern of explicitPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const exampleContent = match[1]?.trim();
        if (exampleContent && exampleContent.length > 20) {
          examples.push(this.createExample(exampleContent, match.index, text));
        }
      }
    }

    // Pattern 2: Code blocks
    const codeBlockPattern = /```[\w]*\n([\s\S]*?)```/gm;
    let match;
    while ((match = codeBlockPattern.exec(text)) !== null) {
      const codeContent = match[1]?.trim();
      if (codeContent && codeContent.length > 10) {
        examples.push({
          type: 'code',
          content: codeContent,
          wordCount: this.countWords(codeContent),
          startIndex: match.index,
          quality: this.assessCodeQuality(codeContent),
        });
      }
    }

    // Pattern 3: Inline code as micro-examples
    const inlineCodePattern = /`([^`]+)`/g;
    let inlineCount = 0;
    while ((match = inlineCodePattern.exec(text)) !== null) {
      inlineCount++;
      // Only add if it's a substantial inline code
      if (match[1] && match[1].length > 15) {
        examples.push({
          type: 'code',
          content: match[1],
          wordCount: this.countWords(match[1]),
          startIndex: match.index,
          quality: 'low', // Inline code is typically less detailed
        });
      }
    }

    // Pattern 4: Numbered or bulleted examples
    const listExamplePattern = /^\s*[-*\d.]+\s*(?:Example\s*\d*[:.])?\s*(.{30,300})/gim;
    while ((match = listExamplePattern.exec(text)) !== null) {
      const exampleContent = match[1]?.trim();
      if (exampleContent && this.looksLikeExample(exampleContent)) {
        examples.push(this.createExample(exampleContent, match.index, text));
      }
    }

    // Pattern 5: Scenario-based examples
    const scenarioPattern =
      /(?:scenario|case study|real-world|in practice)[:\s]*(.{50,500}?)(?=\n\n|$)/gim;
    while ((match = scenarioPattern.exec(text)) !== null) {
      const scenarioContent = match[1]?.trim();
      if (scenarioContent) {
        examples.push({
          type: 'realWorld',
          content: scenarioContent,
          wordCount: this.countWords(scenarioContent),
          startIndex: match.index,
          quality: this.assessExampleQuality(scenarioContent),
        });
      }
    }

    // Remove duplicates based on content similarity
    return this.deduplicateExamples(examples);
  }

  /**
   * Create an example object from detected content
   */
  private createExample(
    content: string,
    startIndex: number,
    fullText: string
  ): DetectedExample {
    const wordCount = this.countWords(content);
    const type = this.classifyExampleType(content, fullText);
    const quality = this.assessExampleQuality(content);

    return { type, content, wordCount, startIndex, quality };
  }

  /**
   * Classify the type of example
   */
  private classifyExampleType(
    content: string,
    _fullText: string
  ): DetectedExample['type'] {
    const lowerContent = content.toLowerCase();

    // Code detection
    if (
      /[{}\[\]();=]/.test(content) &&
      /(function|const|let|var|class|import|export|if|for|while)/.test(content)
    ) {
      return 'code';
    }

    // Mathematical detection
    if (/[\d+\-*/=×÷∑∫]/.test(content) && /\d/.test(content)) {
      return 'mathematical';
    }

    // Real-world detection
    if (
      /\b(company|business|customer|user|market|industry|organization|team)\b/i.test(
        content
      )
    ) {
      return 'realWorld';
    }

    // Scenario detection
    if (/\b(imagine|suppose|consider|scenario|case)\b/i.test(lowerContent)) {
      return 'scenario';
    }

    return 'conceptual';
  }

  /**
   * Assess the quality of an example
   */
  private assessExampleQuality(content: string): DetectedExample['quality'] {
    const wordCount = this.countWords(content);

    // Too short = low quality
    if (wordCount < 15) return 'low';

    // Check for explanation indicators
    const hasExplanation =
      /\b(because|therefore|this means|as a result|shows|demonstrates|illustrates)\b/i.test(
        content
      );

    // Check for specificity
    const hasSpecifics = /\b(\d+|specifically|particular|exact)\b/i.test(content);

    if (wordCount >= 50 && (hasExplanation || hasSpecifics)) {
      return 'high';
    } else if (wordCount >= 25 || hasExplanation || hasSpecifics) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Assess code example quality
   */
  private assessCodeQuality(code: string): DetectedExample['quality'] {
    const lines = code.split('\n').filter((l) => l.trim().length > 0);

    // Check for comments
    const hasComments = /\/\/|\/\*|#/.test(code);

    // Check for meaningful variable names (not single letters)
    const hasGoodNames = /\b[a-z][a-zA-Z0-9]{3,}\b/.test(code);

    // Check for structure
    const hasStructure = lines.length >= 3;

    if (hasComments && hasGoodNames && hasStructure) {
      return 'high';
    } else if (hasStructure || (hasGoodNames && lines.length >= 2)) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Check if text looks like an example
   */
  private looksLikeExample(text: string): boolean {
    const exampleIndicators = [
      /\b(would|could|might|can)\b/i,
      /\b(shows|demonstrates|illustrates)\b/i,
      /\b(such as|like|including)\b/i,
      /\d+/, // Contains numbers
      /"[^"]+"/,  // Contains quoted text
    ];

    return exampleIndicators.filter((pattern) => pattern.test(text)).length >= 2;
  }

  /**
   * Check code example quality issues
   */
  private checkCodeExampleQuality(examples: DetectedExample[]): GateIssue[] {
    const issues: GateIssue[] = [];

    for (const example of examples) {
      // Check for comments
      if (!/\/\/|\/\*|#/.test(example.content)) {
        issues.push({
          severity: 'low',
          description: 'Code example lacks explanatory comments',
          location: `at position ${example.startIndex}`,
          suggestedFix: 'Add comments explaining what the code does',
        });
      }

      // Check for very short code
      const lines = example.content.split('\n').filter((l) => l.trim());
      if (lines.length < 2) {
        issues.push({
          severity: 'low',
          description: 'Code example is too brief to be instructive',
          location: `at position ${example.startIndex}`,
          suggestedFix: 'Expand the code example with more context',
        });
      }
    }

    return issues;
  }

  /**
   * Check if content is programming-related
   */
  private isProgrammingContent(content: GeneratedContent): boolean {
    const programmingKeywords = [
      'code',
      'programming',
      'function',
      'variable',
      'class',
      'method',
      'algorithm',
      'syntax',
      'debug',
      'compile',
      'execute',
      'javascript',
      'python',
      'typescript',
      'java',
      'c++',
      'react',
      'nodejs',
    ];

    const text = content.content.toLowerCase();
    const topic = (content.context?.topic ?? '').toLowerCase();

    return programmingKeywords.some(
      (keyword) => text.includes(keyword) || topic.includes(keyword)
    );
  }

  /**
   * Check example variety
   */
  private checkExampleVariety(examples: DetectedExample[]): {
    hasVariety: boolean;
    suggestion: string;
  } {
    const types = new Set(examples.map((e) => e.type));

    if (types.size === 1 && examples.length >= 3) {
      const missingTypes = ['code', 'realWorld', 'scenario', 'conceptual'].filter(
        (t) => !types.has(t as DetectedExample['type'])
      );

      return {
        hasVariety: false,
        suggestion: `Add different types of examples, such as ${missingTypes.slice(0, 2).join(' or ')} examples`,
      };
    }

    return { hasVariety: true, suggestion: '' };
  }

  /**
   * Check example placement
   */
  private checkExamplePlacement(
    text: string,
    examples: DetectedExample[]
  ): GateIssue[] {
    const issues: GateIssue[] = [];
    const textLength = text.length;

    // Check if examples are clustered at the end
    const lastQuarterStart = textLength * 0.75;
    const examplesInLastQuarter = examples.filter(
      (e) => e.startIndex > lastQuarterStart
    );

    if (
      examples.length >= 3 &&
      examplesInLastQuarter.length > examples.length * 0.7
    ) {
      issues.push({
        severity: 'low',
        description: 'Most examples are clustered at the end of the content',
        suggestedFix: 'Distribute examples throughout the content near relevant concepts',
      });
    }

    return issues;
  }

  /**
   * Remove duplicate examples
   */
  private deduplicateExamples(examples: DetectedExample[]): DetectedExample[] {
    const unique: DetectedExample[] = [];

    for (const example of examples) {
      const isDuplicate = unique.some(
        (u) =>
          Math.abs(u.startIndex - example.startIndex) < 50 ||
          this.similarContent(u.content, example.content)
      );

      if (!isDuplicate) {
        unique.push(example);
      }
    }

    return unique;
  }

  /**
   * Check if two contents are similar
   */
  private similarContent(a: string, b: string): boolean {
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
    const normA = normalize(a);
    const normB = normalize(b);

    if (normA === normB) return true;
    if (normA.includes(normB) || normB.includes(normA)) return true;

    return false;
  }

  /**
   * Count words
   */
  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
  }

  /**
   * Count example types
   */
  private countExampleTypes(
    examples: DetectedExample[]
  ): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const example of examples) {
      counts[example.type] = (counts[example.type] ?? 0) + 1;
    }
    return counts;
  }

  /**
   * Calculate average example length
   */
  private calculateAverageLength(examples: DetectedExample[]): number {
    if (examples.length === 0) return 0;
    const total = examples.reduce((sum, e) => sum + e.wordCount, 0);
    return Math.round(total / examples.length);
  }
}

/**
 * Factory function to create an ExampleQualityGate
 */
export function createExampleQualityGate(
  config?: Partial<ExampleQualityGateConfig>
): ExampleQualityGate {
  return new ExampleQualityGate(config);
}
