/**
 * Depth Gate
 *
 * Validates the cognitive depth of AI-generated content:
 * - Explanation depth
 * - Concept connections
 * - Critical thinking prompts
 * - Bloom's taxonomy alignment
 */

import type {
  QualityGate,
  GateResult,
  GateIssue,
  GeneratedContent,
  ContentType,
  DepthGateConfig,
} from './types';
import { DEFAULT_DEPTH_CONFIG } from './types';

interface DepthMetrics {
  depthScore: number;
  explanationDepth: number;
  conceptConnections: number;
  criticalThinkingPrompts: number;
  bloomsIndicators: Record<string, number>;
  reasoningPatterns: number;
  evidencePresent: boolean;
  multiPerspective: boolean;
}

export class DepthGate implements QualityGate {
  readonly name = 'DepthGate';
  readonly description =
    'Validates cognitive depth including explanations, connections, and critical thinking';
  readonly defaultWeight = 1.4;
  readonly applicableTypes: ContentType[] = [
    'lesson',
    'explanation',
    'tutorial',
    'assessment',
    'exercise',
  ];

  private config: Required<DepthGateConfig>;

  constructor(config?: Partial<DepthGateConfig>) {
    this.config = {
      ...DEFAULT_DEPTH_CONFIG,
      ...config,
    } as Required<DepthGateConfig>;
  }

  async evaluate(content: GeneratedContent): Promise<GateResult> {
    const startTime = Date.now();
    const issues: GateIssue[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const text = content.content;
    const metrics = this.analyzeDepth(text);

    // 1. Check overall depth score
    if (metrics.depthScore < this.config.minDepthScore) {
      const shortfall = this.config.minDepthScore - metrics.depthScore;
      const severity = shortfall > 30 ? 'critical' : shortfall > 15 ? 'high' : 'medium';
      score -= severity === 'critical' ? 35 : severity === 'high' ? 25 : 15;

      issues.push({
        severity,
        description: `Cognitive depth score is ${Math.round(metrics.depthScore)}, below minimum of ${this.config.minDepthScore}`,
        suggestedFix: this.getDepthImprovementSuggestion(metrics),
      });
      suggestions.push(this.getDepthImprovementSuggestion(metrics));
    }

    // 2. Check explanation depth
    if (this.config.checkExplanationDepth) {
      const explanationResult = this.checkExplanationDepth(metrics);
      if (!explanationResult.adequate) {
        score -= 15;
        issues.push({
          severity: 'high',
          description: explanationResult.issue,
          suggestedFix: explanationResult.suggestion,
        });
        suggestions.push(explanationResult.suggestion);
      }
    }

    // 3. Check concept connections
    if (this.config.checkConceptConnections) {
      const connectionResult = this.checkConceptConnections(metrics, text);
      if (!connectionResult.adequate) {
        score -= 12;
        issues.push({
          severity: 'medium',
          description: connectionResult.issue,
          suggestedFix: connectionResult.suggestion,
        });
        suggestions.push(connectionResult.suggestion);
      }
    }

    // 4. Check critical thinking prompts
    if (this.config.checkCriticalThinking) {
      const criticalResult = this.checkCriticalThinking(metrics, content);
      if (!criticalResult.adequate) {
        score -= 10;
        issues.push({
          severity: 'medium',
          description: criticalResult.issue,
          suggestedFix: criticalResult.suggestion,
        });
        suggestions.push(criticalResult.suggestion);
      }
    }

    // 5. Check for shallow content patterns
    const shallowPatterns = this.detectShallowPatterns(text);
    if (shallowPatterns.length > 0) {
      score -= shallowPatterns.length * 5;
      for (const pattern of shallowPatterns) {
        issues.push({
          severity: 'medium',
          description: pattern.description,
          location: pattern.location,
          suggestedFix: pattern.fix,
        });
      }
    }

    // 6. Check Bloom's taxonomy alignment
    if (content.targetBloomsLevel) {
      const bloomsResult = this.checkBloomsAlignment(metrics, content.targetBloomsLevel);
      if (!bloomsResult.aligned) {
        score -= 15;
        issues.push({
          severity: 'high',
          description: bloomsResult.issue,
          suggestedFix: bloomsResult.suggestion,
        });
        suggestions.push(bloomsResult.suggestion);
      }
    }

    // 7. Check for reasoning and evidence
    if (!metrics.evidencePresent && this.requiresEvidence(content)) {
      score -= 10;
      issues.push({
        severity: 'medium',
        description: 'Content lacks supporting evidence or references',
        suggestedFix: 'Add examples, data, or references to support claims',
      });
    }

    // 8. Check for multiple perspectives
    if (!metrics.multiPerspective && this.benefitsFromPerspectives(content)) {
      score -= 5;
      issues.push({
        severity: 'low',
        description: 'Content presents only one perspective',
        suggestedFix: 'Consider presenting alternative viewpoints or approaches',
      });
    }

    // 9. Check for superficial treatment
    const superficialResult = this.checkSuperficialTreatment(text, content);
    if (superficialResult.isSuperficial) {
      score -= 15;
      issues.push({
        severity: 'high',
        description: superficialResult.issue,
        suggestedFix: superficialResult.suggestion,
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
        depthScore: Math.round(metrics.depthScore),
        explanationDepth: Math.round(metrics.explanationDepth),
        conceptConnections: metrics.conceptConnections,
        criticalThinkingPrompts: metrics.criticalThinkingPrompts,
        bloomsIndicators: metrics.bloomsIndicators,
        reasoningPatterns: metrics.reasoningPatterns,
        evidencePresent: metrics.evidencePresent,
        multiPerspective: metrics.multiPerspective,
      },
    };
  }

  /**
   * Analyze cognitive depth of content
   */
  private analyzeDepth(text: string): DepthMetrics {
    const explanationDepth = this.measureExplanationDepth(text);
    const conceptConnections = this.countConceptConnections(text);
    const criticalThinkingPrompts = this.countCriticalThinkingPrompts(text);
    const bloomsIndicators = this.analyzeBloomsIndicators(text);
    const reasoningPatterns = this.countReasoningPatterns(text);
    const evidencePresent = this.hasEvidence(text);
    const multiPerspective = this.hasMultiplePerspectives(text);

    // Calculate overall depth score (0-100)
    const depthScore = this.calculateDepthScore({
      explanationDepth,
      conceptConnections,
      criticalThinkingPrompts,
      reasoningPatterns,
      evidencePresent,
      multiPerspective,
    });

    return {
      depthScore,
      explanationDepth,
      conceptConnections,
      criticalThinkingPrompts,
      bloomsIndicators,
      reasoningPatterns,
      evidencePresent,
      multiPerspective,
    };
  }

  /**
   * Measure explanation depth
   */
  private measureExplanationDepth(text: string): number {
    let depth = 0;

    // Causal explanations (why/how)
    const causalPatterns = [
      /\b(because|since|as a result|therefore|consequently|thus)\b/gi,
      /\b(due to|owing to|leads to|causes|results in)\b/gi,
      /\b(the reason|this means|this implies|this suggests)\b/gi,
    ];

    for (const pattern of causalPatterns) {
      const matches = text.match(pattern);
      depth += (matches?.length ?? 0) * 5;
    }

    // Elaboration markers
    const elaborationPatterns = [
      /\b(in other words|that is to say|specifically|namely)\b/gi,
      /\b(to elaborate|more precisely|in particular)\b/gi,
      /\b(let me explain|to understand this|to clarify)\b/gi,
    ];

    for (const pattern of elaborationPatterns) {
      const matches = text.match(pattern);
      depth += (matches?.length ?? 0) * 4;
    }

    // Multi-step explanations
    const stepPatterns = /\b(first|second|third|then|next|finally|step)\b/gi;
    const stepMatches = text.match(stepPatterns);
    depth += (stepMatches?.length ?? 0) * 3;

    // Normalize to 0-100
    const wordCount = text.split(/\s+/).length;
    const normalizedDepth = (depth / Math.max(wordCount, 100)) * 500;

    return Math.min(100, normalizedDepth);
  }

  /**
   * Count concept connections
   */
  private countConceptConnections(text: string): number {
    const connectionPatterns = [
      /\b(relates to|connected to|associated with|linked to)\b/gi,
      /\b(similar to|differs from|in contrast to|compared to)\b/gi,
      /\b(builds on|extends|combines with|integrates)\b/gi,
      /\b(is a type of|is part of|consists of|includes)\b/gi,
      /\b(depends on|requires|enables|supports)\b/gi,
    ];

    let connections = 0;
    for (const pattern of connectionPatterns) {
      const matches = text.match(pattern);
      connections += matches?.length ?? 0;
    }

    return connections;
  }

  /**
   * Count critical thinking prompts
   */
  private countCriticalThinkingPrompts(text: string): number {
    const criticalPatterns = [
      /\b(consider|think about|reflect on|ask yourself)\b/gi,
      /\b(what if|how would|why might|could this)\b/gi,
      /\b(analyze|evaluate|critique|assess|examine)\b/gi,
      /\b(implications|consequences|assumptions|limitations)\b/gi,
      /\?\s*(?=\n|$)/g, // Questions
    ];

    let prompts = 0;
    for (const pattern of criticalPatterns) {
      const matches = text.match(pattern);
      prompts += matches?.length ?? 0;
    }

    return prompts;
  }

  /**
   * Analyze Bloom's taxonomy indicators
   */
  private analyzeBloomsIndicators(text: string): Record<string, number> {
    const indicators: Record<string, number> = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    // REMEMBER keywords
    const rememberPatterns = /\b(define|list|identify|recall|name|state|recognize)\b/gi;
    indicators.REMEMBER = (text.match(rememberPatterns) ?? []).length;

    // UNDERSTAND keywords
    const understandPatterns =
      /\b(explain|describe|summarize|interpret|paraphrase|discuss|illustrate)\b/gi;
    indicators.UNDERSTAND = (text.match(understandPatterns) ?? []).length;

    // APPLY keywords
    const applyPatterns =
      /\b(apply|demonstrate|use|implement|solve|execute|practice)\b/gi;
    indicators.APPLY = (text.match(applyPatterns) ?? []).length;

    // ANALYZE keywords
    const analyzePatterns =
      /\b(analyze|compare|contrast|differentiate|examine|investigate|categorize)\b/gi;
    indicators.ANALYZE = (text.match(analyzePatterns) ?? []).length;

    // EVALUATE keywords
    const evaluatePatterns =
      /\b(evaluate|judge|critique|assess|justify|argue|defend|recommend)\b/gi;
    indicators.EVALUATE = (text.match(evaluatePatterns) ?? []).length;

    // CREATE keywords
    const createPatterns =
      /\b(create|design|develop|construct|compose|formulate|generate|synthesize)\b/gi;
    indicators.CREATE = (text.match(createPatterns) ?? []).length;

    return indicators;
  }

  /**
   * Count reasoning patterns
   */
  private countReasoningPatterns(text: string): number {
    const reasoningPatterns = [
      /\b(if|when)\s+.+\s+(then|will|would)\b/gi, // Conditional reasoning
      /\b(premise|conclusion|argument|evidence|proof)\b/gi, // Logical terms
      /\b(assumption|hypothesis|theory|principle)\b/gi, // Theoretical terms
      /\b(data|statistics|research|study|experiment)\b/gi, // Empirical terms
    ];

    let patterns = 0;
    for (const pattern of reasoningPatterns) {
      const matches = text.match(pattern);
      patterns += matches?.length ?? 0;
    }

    return patterns;
  }

  /**
   * Check if content has evidence
   */
  private hasEvidence(text: string): boolean {
    const evidencePatterns = [
      /\b(according to|research shows|studies indicate|data suggests)\b/i,
      /\b(for example|for instance|such as|e\.g\.)\b/i,
      /\b(evidence|proof|demonstration|illustration)\b/i,
      /\d+%/, // Statistics
      /\b[A-Z][a-z]+ et al\.?/i, // Citations
      /\(\d{4}\)/, // Year citations
    ];

    return evidencePatterns.some((p) => p.test(text));
  }

  /**
   * Check for multiple perspectives
   */
  private hasMultiplePerspectives(text: string): boolean {
    const perspectivePatterns = [
      /\b(on the other hand|alternatively|another view|different perspective)\b/i,
      /\b(however|conversely|in contrast|whereas)\b/i,
      /\b(some argue|others believe|one approach|another approach)\b/i,
      /\b(pros and cons|advantages and disadvantages|benefits and drawbacks)\b/i,
    ];

    return perspectivePatterns.some((p) => p.test(text));
  }

  /**
   * Calculate overall depth score
   */
  private calculateDepthScore(metrics: {
    explanationDepth: number;
    conceptConnections: number;
    criticalThinkingPrompts: number;
    reasoningPatterns: number;
    evidencePresent: boolean;
    multiPerspective: boolean;
  }): number {
    // Weighted components
    let score = 0;

    // Explanation depth (40%)
    score += metrics.explanationDepth * 0.4;

    // Concept connections (20%)
    const connectionScore = Math.min(100, metrics.conceptConnections * 10);
    score += connectionScore * 0.2;

    // Critical thinking (20%)
    const criticalScore = Math.min(100, metrics.criticalThinkingPrompts * 8);
    score += criticalScore * 0.2;

    // Reasoning patterns (10%)
    const reasoningScore = Math.min(100, metrics.reasoningPatterns * 10);
    score += reasoningScore * 0.1;

    // Evidence bonus (5%)
    if (metrics.evidencePresent) score += 5;

    // Multiple perspectives bonus (5%)
    if (metrics.multiPerspective) score += 5;

    return Math.min(100, score);
  }

  /**
   * Get depth improvement suggestion
   */
  private getDepthImprovementSuggestion(metrics: DepthMetrics): string {
    if (metrics.explanationDepth < 30) {
      return 'Add more causal explanations (why/how) and elaborate on key points';
    }
    if (metrics.conceptConnections < 3) {
      return 'Connect concepts to related ideas and show relationships between topics';
    }
    if (metrics.criticalThinkingPrompts < 2) {
      return 'Include questions or prompts that encourage critical thinking';
    }
    return 'Increase overall depth by adding explanations, examples, and analysis';
  }

  /**
   * Check explanation depth
   */
  private checkExplanationDepth(
    metrics: DepthMetrics
  ): { adequate: boolean; issue: string; suggestion: string } {
    if (metrics.explanationDepth < 30) {
      return {
        adequate: false,
        issue: 'Explanations lack depth - missing causal reasoning and elaboration',
        suggestion:
          'Explain why things work, not just what they are. Add "because", "therefore", and "this means" explanations',
      };
    }
    return { adequate: true, issue: '', suggestion: '' };
  }

  /**
   * Check concept connections
   */
  private checkConceptConnections(
    metrics: DepthMetrics,
    text: string
  ): { adequate: boolean; issue: string; suggestion: string } {
    const wordCount = text.split(/\s+/).length;
    const expectedConnections = Math.max(2, Math.floor(wordCount / 200));

    if (metrics.conceptConnections < expectedConnections) {
      return {
        adequate: false,
        issue: `Content has only ${metrics.conceptConnections} concept connections (expected: ${expectedConnections}+)`,
        suggestion:
          'Show how concepts relate to each other and to prior knowledge',
      };
    }
    return { adequate: true, issue: '', suggestion: '' };
  }

  /**
   * Check critical thinking
   */
  private checkCriticalThinking(
    metrics: DepthMetrics,
    content: GeneratedContent
  ): { adequate: boolean; issue: string; suggestion: string } {
    // Educational content should have critical thinking prompts
    const educationalTypes: ContentType[] = ['lesson', 'tutorial', 'exercise'];

    if (educationalTypes.includes(content.type)) {
      if (metrics.criticalThinkingPrompts < 2) {
        return {
          adequate: false,
          issue: 'Content lacks critical thinking prompts',
          suggestion:
            'Add questions like "What if...?", "Why might...?", or "Consider..."',
        };
      }
    }

    return { adequate: true, issue: '', suggestion: '' };
  }

  /**
   * Detect shallow content patterns
   */
  private detectShallowPatterns(
    text: string
  ): Array<{ description: string; location?: string; fix: string }> {
    const patterns: Array<{ description: string; location?: string; fix: string }> = [];

    // Generic statements without specifics
    if (/\b(important|useful|helpful|necessary)\b/gi.test(text)) {
      const hasSpecific = /\b(specifically|because|for example)\b/i.test(text);
      if (!hasSpecific) {
        patterns.push({
          description: 'Uses generic statements without explaining why',
          fix: 'Explain why something is important/useful with specific reasons',
        });
      }
    }

    // Listing without explanation
    const listItems = text.match(/^\s*[-*\d]+\.\s+.+$/gm) ?? [];
    const shortLists = listItems.filter((item) => item.split(/\s+/).length < 8);
    if (shortLists.length > 3 && shortLists.length > listItems.length * 0.7) {
      patterns.push({
        description: 'Contains lists without adequate explanations',
        fix: 'Expand list items with explanations or combine into prose',
      });
    }

    // Oversimplification markers
    const oversimplificationPatterns = [
      /\b(simply|just|only need to|all you have to do)\b/gi,
      /\b(easy|simple|straightforward|basic)\b/gi,
    ];

    for (const pattern of oversimplificationPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 3) {
        patterns.push({
          description: 'May be oversimplifying complex topics',
          fix: 'Acknowledge complexity and provide nuanced explanations',
        });
        break;
      }
    }

    return patterns;
  }

  /**
   * Check Bloom's alignment
   */
  private checkBloomsAlignment(
    metrics: DepthMetrics,
    targetLevel: string
  ): { aligned: boolean; issue: string; suggestion: string } {
    const levelOrder = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
    const targetIndex = levelOrder.indexOf(targetLevel.toUpperCase());

    if (targetIndex === -1) {
      return { aligned: true, issue: '', suggestion: '' };
    }

    // Get dominant level in content
    let maxLevel = 'REMEMBER';
    let maxCount = 0;
    for (const [level, count] of Object.entries(metrics.bloomsIndicators)) {
      if (count > maxCount) {
        maxCount = count;
        maxLevel = level;
      }
    }

    const actualIndex = levelOrder.indexOf(maxLevel);
    const diff = Math.abs(targetIndex - actualIndex);

    if (diff > 1) {
      const isBelow = actualIndex < targetIndex;
      return {
        aligned: false,
        issue: `Content operates at ${maxLevel} level, but targets ${targetLevel}`,
        suggestion: isBelow
          ? `Add more ${targetLevel}-level activities and language`
          : `Include more foundational content before advancing to higher-order thinking`,
      };
    }

    return { aligned: true, issue: '', suggestion: '' };
  }

  /**
   * Check if content requires evidence
   */
  private requiresEvidence(content: GeneratedContent): boolean {
    const evidenceTypes: ContentType[] = ['lesson', 'explanation', 'assessment'];
    const wordCount = content.content.split(/\s+/).length;
    return evidenceTypes.includes(content.type) && wordCount > 200;
  }

  /**
   * Check if content benefits from multiple perspectives
   */
  private benefitsFromPerspectives(content: GeneratedContent): boolean {
    const perspectiveTypes: ContentType[] = ['lesson', 'explanation'];
    const wordCount = content.content.split(/\s+/).length;
    return perspectiveTypes.includes(content.type) && wordCount > 300;
  }

  /**
   * Check for superficial treatment
   */
  private checkSuperficialTreatment(
    text: string,
    content: GeneratedContent
  ): { isSuperficial: boolean; issue: string; suggestion: string } {
    const wordCount = text.split(/\s+/).length;

    // Check for thin content relative to topic complexity
    if (content.context?.learningObjectives) {
      const objectiveCount = content.context.learningObjectives.length;
      const wordsPerObjective = wordCount / Math.max(objectiveCount, 1);

      if (objectiveCount > 2 && wordsPerObjective < 100) {
        return {
          isSuperficial: true,
          issue: `Content covers ${objectiveCount} objectives in only ${wordCount} words (${Math.round(wordsPerObjective)} words per objective)`,
          suggestion: 'Expand coverage of each learning objective with more depth',
        };
      }
    }

    // Check for drive-by mentions
    const driveByPattern = /\b(we will cover|we'll discuss|we will see|we'll learn)\b/gi;
    const driveByMatches = text.match(driveByPattern) ?? [];
    const actualCoverage = text.match(/\b(here's how|let's explore|to understand|specifically)\b/gi) ?? [];

    if (driveByMatches.length > actualCoverage.length * 2) {
      return {
        isSuperficial: true,
        issue: 'Content promises to cover topics but doesn\'t deliver adequate depth',
        suggestion: 'Follow through on promises to cover topics with actual content',
      };
    }

    return { isSuperficial: false, issue: '', suggestion: '' };
  }
}

/**
 * Factory function to create a DepthGate
 */
export function createDepthGate(config?: Partial<DepthGateConfig>): DepthGate {
  return new DepthGate(config);
}
