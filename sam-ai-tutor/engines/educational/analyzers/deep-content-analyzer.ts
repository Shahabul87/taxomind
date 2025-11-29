/**
 * Deep Content Analyzer
 * Phase 4: Analyzes actual lesson content including transcripts, documents, and quiz text
 *
 * Key Features:
 * - Sentence-level Bloom's Taxonomy classification
 * - Webb's DOK correlation
 * - Context-aware pattern matching
 * - Confidence scoring for each classification
 *
 * Research Basis:
 * - Anderson & Krathwohl (2001): Revised Bloom's Taxonomy
 * - Webb (2002): Depth of Knowledge Framework
 * - Hess et al. (2009): Cognitive Rigor Matrix
 */

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

// Define BloomsLevel locally for this module (string union type)
export type BloomsLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';

export type ContentSourceType =
  | 'video_transcript'
  | 'document'
  | 'quiz'
  | 'discussion'
  | 'assignment'
  | 'text'
  | 'lesson_content';

export type ContentContext =
  | 'instructional'
  | 'assessment'
  | 'activity'
  | 'example'
  | 'introduction'
  | 'summary';

export type WebbDOKLevel = 1 | 2 | 3 | 4;

export interface ContentSource {
  type: ContentSourceType;
  content: string;
  metadata: {
    sourceId: string;
    sectionId?: string;
    chapterId?: string;
    title: string;
    wordCount: number;
    duration?: number; // For video content (seconds)
  };
}

export interface SentenceLevelAnalysis {
  sentence: string;
  predictedBloomsLevel: BloomsLevel;
  predictedDOKLevel: WebbDOKLevel;
  confidence: number;
  triggerPatterns: string[];
  context: ContentContext;
  position: 'beginning' | 'middle' | 'end';
}

export interface BloomsDistribution {
  REMEMBER: number;
  UNDERSTAND: number;
  APPLY: number;
  ANALYZE: number;
  EVALUATE: number;
  CREATE: number;
  [key: string]: number; // Index signature for dynamic access
}

export interface WebbDOKDistribution {
  level1: number;
  level2: number;
  level3: number;
  level4: number;
}

export interface VerbFrequencyEntry {
  verb: string;
  count: number;
  level: BloomsLevel;
  contexts: ContentContext[];
}

export interface ContentCoverage {
  totalSources: number;
  analyzedSources: number;
  skippedSources: number;
  totalWords: number;
  totalSentences: number;
  averageWordsPerSentence: number;
  contentTypes: Record<ContentSourceType, number>;
}

export interface ContentGap {
  type: 'missing_level' | 'underrepresented' | 'overrepresented' | 'context_imbalance';
  level?: BloomsLevel | WebbDOKLevel;
  context?: ContentContext;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
}

export interface DeepContentAnalysisResult {
  // Core distributions
  bloomsDistribution: BloomsDistribution;
  dokDistribution: WebbDOKDistribution;

  // Weighted distributions (by confidence)
  weightedBloomsDistribution: BloomsDistribution;

  // Analysis metadata
  overallConfidence: number;
  analysisMethod: 'keyword' | 'pattern' | 'hybrid';
  analysisVersion: string;
  timestamp: string;

  // Coverage statistics
  contentCoverage: ContentCoverage;

  // Detailed breakdowns
  sentenceAnalyses: SentenceLevelAnalysis[];
  verbFrequency: VerbFrequencyEntry[];
  contextDistribution: Record<ContentContext, number>;

  // Gaps and recommendations
  contentGaps: ContentGap[];
  recommendations: string[];

  // Research basis
  researchBasis: {
    framework: string;
    citation: string;
    methodology: string;
  };
}

// ═══════════════════════════════════════════════════════════════
// BLOOM'S TAXONOMY PATTERNS
// ═══════════════════════════════════════════════════════════════

interface BloomPattern {
  level: BloomsLevel;
  weight: number;
  patterns: RegExp[];
  contextBonus: Partial<Record<ContentContext, number>>;
}

const BLOOM_PATTERNS: BloomPattern[] = [
  {
    level: 'REMEMBER',
    weight: 1,
    patterns: [
      // Action verbs
      /\b(define|list|name|recall|identify|recognize|describe|state|match|select|label|locate|memorize|repeat|reproduce)\b/gi,
      // Question patterns
      /\b(what is|who is|when did|where is|how many|which one|what are|who was|when was)\b/gi,
      // Instructional patterns
      /\b(the definition of|known as|refers to|is called|means|is defined as)\b/gi,
      // Assessment patterns
      /\b(choose the correct|select the right|identify which|name the|list all)\b/gi,
    ],
    contextBonus: { assessment: 0.1, instructional: 0.05 },
  },
  {
    level: 'UNDERSTAND',
    weight: 2,
    patterns: [
      // Action verbs
      /\b(explain|summarize|interpret|paraphrase|classify|compare|contrast|discuss|predict|translate|describe|distinguish|estimate|generalize|infer)\b/gi,
      // Question patterns
      /\b(why does|how does|what does .{1,30} mean|in other words|what is the difference|how would you explain)\b/gi,
      // Instructional patterns
      /\b(the main idea|the difference between|an example of|this means that|in summary|to summarize|essentially|basically)\b/gi,
      // Comprehension indicators
      /\b(shows that|demonstrates that|indicates|suggests|implies|represents)\b/gi,
    ],
    contextBonus: { instructional: 0.1, example: 0.15 },
  },
  {
    level: 'APPLY',
    weight: 3,
    patterns: [
      // Action verbs
      /\b(apply|demonstrate|solve|use|implement|calculate|execute|practice|compute|show|illustrate|operate|schedule|sketch|employ|utilize)\b/gi,
      // Problem-solving patterns
      /\b(solve for|calculate the|build a|use .{1,30} to|apply .{1,30} to|how would you use|using this method)\b/gi,
      // Practice patterns
      /\b(in this scenario|given the following|let's practice|try this|now you try|work through|complete the following)\b/gi,
      // Implementation patterns
      /\b(implement the|put into practice|carry out|execute the|perform the)\b/gi,
    ],
    contextBonus: { activity: 0.15, assessment: 0.1 },
  },
  {
    level: 'ANALYZE',
    weight: 4,
    patterns: [
      // Action verbs
      /\b(analyze|examine|investigate|differentiate|organize|attribute|deconstruct|outline|structure|integrate|distinguish|compare|contrast|categorize)\b/gi,
      // Analysis patterns
      /\b(what are the reasons|what evidence|how does .{1,30} relate|break down|identify the components|what is the relationship)\b/gi,
      // Comparison patterns
      /\b(compare and contrast|categorize the|distinguish between|analyze the relationship|examine how|investigate why)\b/gi,
      // Critical thinking indicators
      /\b(the underlying|the root cause|contributing factors|key components|structural elements)\b/gi,
    ],
    contextBonus: { assessment: 0.15, activity: 0.1 },
  },
  {
    level: 'EVALUATE',
    weight: 5,
    patterns: [
      // Action verbs
      /\b(evaluate|judge|critique|justify|defend|prioritize|assess|recommend|conclude|appraise|argue|rate|support|validate|verify)\b/gi,
      // Evaluation patterns
      /\b(do you agree|is this valid|what is the best|justify your|argue for|argue against|which is more effective|rate the)\b/gi,
      // Opinion/judgment patterns
      /\b(in your opinion|based on the evidence|evaluate the|assess whether|determine if|judge the quality|critique the)\b/gi,
      // Value judgment indicators
      /\b(the most effective|the best approach|superior to|preferable|optimal|most appropriate)\b/gi,
    ],
    contextBonus: { assessment: 0.2, activity: 0.1 },
  },
  {
    level: 'CREATE',
    weight: 6,
    patterns: [
      // Action verbs
      /\b(create|design|develop|formulate|construct|propose|invent|compose|generate|produce|plan|devise|originate|author|synthesize)\b/gi,
      // Creation patterns
      /\b(design a solution|develop a plan|propose an alternative|create your own|write your own|build your own)\b/gi,
      // Innovation patterns
      /\b(what if|imagine|generate a|compose a|devise a|formulate a new|invent a)\b/gi,
      // Synthesis indicators
      /\b(combine .{1,30} to create|synthesize|integrate .{1,30} into|merge|blend|fuse)\b/gi,
    ],
    contextBonus: { activity: 0.2, assessment: 0.15 },
  },
];

// ═══════════════════════════════════════════════════════════════
// DEEP CONTENT ANALYZER CLASS
// ═══════════════════════════════════════════════════════════════

export class DeepContentAnalyzer {
  private readonly VERSION = '1.0.0';
  private readonly MIN_SENTENCE_LENGTH = 15;
  private readonly MIN_WORD_COUNT = 4;
  private readonly MIN_CONTENT_LENGTH = 50;

  /**
   * Analyze multiple content sources for cognitive depth
   */
  async analyzeContent(sources: ContentSource[]): Promise<DeepContentAnalysisResult> {
    const sentenceAnalyses: SentenceLevelAnalysis[] = [];
    const verbFrequencyMap = new Map<string, VerbFrequencyEntry>();
    const contextCounts: Record<ContentContext, number> = {
      instructional: 0,
      assessment: 0,
      activity: 0,
      example: 0,
      introduction: 0,
      summary: 0,
    };
    const contentTypeCounts: Record<ContentSourceType, number> = {
      video_transcript: 0,
      document: 0,
      quiz: 0,
      discussion: 0,
      assignment: 0,
      text: 0,
      lesson_content: 0,
    };

    let totalWords = 0;
    let analyzedSources = 0;
    let skippedSources = 0;

    for (const source of sources) {
      // Skip empty or very short content
      if (!source.content || source.content.length < this.MIN_CONTENT_LENGTH) {
        skippedSources++;
        continue;
      }

      analyzedSources++;
      totalWords += source.metadata.wordCount;
      contentTypeCounts[source.type]++;

      const sentences = this.splitIntoSentences(source.content);
      const baseContext = this.determineContext(source.type);

      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        const position = this.determinePosition(i, sentences.length);
        const context = this.refineContext(baseContext, sentence, position);

        const analysis = this.analyzeSentence(sentence, context, position);
        sentenceAnalyses.push(analysis);

        // Track context distribution
        contextCounts[analysis.context]++;

        // Track verb frequency
        for (const pattern of analysis.triggerPatterns) {
          const key = pattern.toLowerCase();
          const existing = verbFrequencyMap.get(key);
          if (existing) {
            existing.count++;
            if (!existing.contexts.includes(context)) {
              existing.contexts.push(context);
            }
          } else {
            verbFrequencyMap.set(key, {
              verb: key,
              count: 1,
              level: analysis.predictedBloomsLevel,
              contexts: [context],
            });
          }
        }
      }
    }

    // Calculate distributions
    const bloomsDistribution = this.calculateBloomsDistribution(sentenceAnalyses);
    const weightedBloomsDistribution = this.calculateWeightedBloomsDistribution(sentenceAnalyses);
    const dokDistribution = this.calculateDOKDistribution(sentenceAnalyses);
    const overallConfidence = this.calculateOverallConfidence(sentenceAnalyses);

    // Convert verb frequency map to array
    const verbFrequency = Array.from(verbFrequencyMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 50); // Top 50 verbs

    // Normalize context distribution to percentages
    const totalContexts = Object.values(contextCounts).reduce((a, b) => a + b, 0);
    const contextDistribution: Record<ContentContext, number> = {} as Record<ContentContext, number>;
    for (const [ctx, count] of Object.entries(contextCounts)) {
      contextDistribution[ctx as ContentContext] = totalContexts > 0
        ? Math.round((count / totalContexts) * 100)
        : 0;
    }

    // Identify content gaps
    const contentGaps = this.identifyContentGaps(
      bloomsDistribution,
      dokDistribution,
      contextDistribution
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      bloomsDistribution,
      dokDistribution,
      contentGaps,
      overallConfidence
    );

    return {
      bloomsDistribution,
      dokDistribution,
      weightedBloomsDistribution,
      overallConfidence,
      analysisMethod: 'hybrid',
      analysisVersion: this.VERSION,
      timestamp: new Date().toISOString(),
      contentCoverage: {
        totalSources: sources.length,
        analyzedSources,
        skippedSources,
        totalWords,
        totalSentences: sentenceAnalyses.length,
        averageWordsPerSentence: sentenceAnalyses.length > 0
          ? Math.round(totalWords / sentenceAnalyses.length)
          : 0,
        contentTypes: contentTypeCounts,
      },
      sentenceAnalyses,
      verbFrequency,
      contextDistribution,
      contentGaps,
      recommendations,
      researchBasis: {
        framework: 'Anderson & Krathwohl Revised Taxonomy + Webb DOK',
        citation: 'Anderson, L.W. & Krathwohl, D.R. (2001). A Taxonomy for Learning, Teaching, and Assessing. Webb, N.L. (2002). Depth-of-Knowledge Levels.',
        methodology: 'Pattern-based sentence classification with context-aware weighting',
      },
    };
  }

  /**
   * Analyze a single content source
   */
  async analyzeSingleSource(source: ContentSource): Promise<DeepContentAnalysisResult> {
    return this.analyzeContent([source]);
  }

  /**
   * Split text into analyzable sentences
   */
  private splitIntoSentences(text: string): string[] {
    // Clean the text
    const cleaned = text
      .replace(/\r\n/g, '\n')
      .replace(/\n{2,}/g, '\n')
      .replace(/\s{2,}/g, ' ');

    // Split on sentence boundaries
    const rawSentences = cleaned
      .replace(/([.!?])\s+/g, '$1\n')
      .replace(/([.!?])$/g, '$1\n')
      .split('\n')
      .map(s => s.trim());

    // Filter and validate sentences
    return rawSentences.filter(s =>
      s.length >= this.MIN_SENTENCE_LENGTH &&
      s.split(/\s+/).length >= this.MIN_WORD_COUNT &&
      !/^[•\-\*\d]+\.?\s*$/.test(s) // Skip bullet points and numbers
    );
  }

  /**
   * Determine base context from content type
   */
  private determineContext(type: ContentSourceType): ContentContext {
    switch (type) {
      case 'quiz':
        return 'assessment';
      case 'assignment':
        return 'activity';
      case 'discussion':
        return 'activity';
      case 'video_transcript':
        return 'instructional';
      case 'document':
        return 'instructional';
      default:
        return 'instructional';
    }
  }

  /**
   * Refine context based on sentence content and position
   */
  private refineContext(
    baseContext: ContentContext,
    sentence: string,
    position: 'beginning' | 'middle' | 'end'
  ): ContentContext {
    const lower = sentence.toLowerCase();

    // Check for example indicators
    if (/\b(for example|for instance|such as|e\.g\.|consider this|let's say)\b/i.test(lower)) {
      return 'example';
    }

    // Check for introduction indicators
    if (position === 'beginning' && /\b(in this|we will|you will learn|this lesson|objectives|overview)\b/i.test(lower)) {
      return 'introduction';
    }

    // Check for summary indicators
    if (position === 'end' && /\b(in summary|to summarize|in conclusion|key takeaways|remember that|main points)\b/i.test(lower)) {
      return 'summary';
    }

    // Check for activity indicators
    if (/\b(try this|practice|exercise|your turn|complete the|work through)\b/i.test(lower)) {
      return 'activity';
    }

    // Check for assessment indicators
    if (/\b(question|quiz|test|exam|answer|correct|incorrect|true or false|multiple choice)\b/i.test(lower)) {
      return 'assessment';
    }

    return baseContext;
  }

  /**
   * Determine sentence position in content
   */
  private determinePosition(index: number, total: number): 'beginning' | 'middle' | 'end' {
    const position = index / total;
    if (position < 0.15) return 'beginning';
    if (position > 0.85) return 'end';
    return 'middle';
  }

  /**
   * Analyze a single sentence for cognitive level
   */
  private analyzeSentence(
    sentence: string,
    context: ContentContext,
    position: 'beginning' | 'middle' | 'end'
  ): SentenceLevelAnalysis {
    const matches: Array<{
      level: BloomsLevel;
      patterns: string[];
      score: number;
    }> = [];

    // Check each Bloom's level pattern set
    for (const bloomPattern of BLOOM_PATTERNS) {
      const foundPatterns: string[] = [];
      let score = 0;

      for (const pattern of bloomPattern.patterns) {
        const matchResults = sentence.match(pattern);
        if (matchResults) {
          foundPatterns.push(...matchResults.map(m => m.toLowerCase()));
          score += matchResults.length * bloomPattern.weight;
        }
      }

      // Apply context bonus
      const contextBonus = bloomPattern.contextBonus[context] ?? 0;
      score *= (1 + contextBonus);

      if (foundPatterns.length > 0) {
        matches.push({
          level: bloomPattern.level,
          patterns: [...new Set(foundPatterns)], // Dedupe
          score,
        });
      }
    }

    // Sort by score, prefer higher levels if tied
    matches.sort((a, b) => {
      if (Math.abs(b.score - a.score) > 0.5) return b.score - a.score;
      return this.getBloomsWeight(b.level) - this.getBloomsWeight(a.level);
    });

    const best = matches[0];
    const bloomsLevel = best?.level ?? 'UNDERSTAND'; // Default to UNDERSTAND
    const confidence = this.calculateSentenceConfidence(best, matches, sentence);

    return {
      sentence,
      predictedBloomsLevel: bloomsLevel,
      predictedDOKLevel: this.bloomsToDOK(bloomsLevel),
      confidence,
      triggerPatterns: best?.patterns ?? [],
      context,
      position,
    };
  }

  /**
   * Calculate confidence score for a sentence analysis
   */
  private calculateSentenceConfidence(
    best: { level: BloomsLevel; patterns: string[]; score: number } | undefined,
    allMatches: Array<{ level: BloomsLevel; patterns: string[]; score: number }>,
    sentence: string
  ): number {
    if (!best) {
      // No patterns matched - low confidence default
      return 25;
    }

    let confidence = 0;

    // Base confidence from pattern matches
    const patternCount = best.patterns.length;
    if (patternCount >= 3) confidence += 40;
    else if (patternCount >= 2) confidence += 30;
    else confidence += 20;

    // Boost for high score
    if (best.score >= 10) confidence += 25;
    else if (best.score >= 5) confidence += 15;
    else confidence += 10;

    // Boost for clear winner (significant gap to second place)
    if (allMatches.length >= 2) {
      const gap = best.score - allMatches[1].score;
      if (gap > 3) confidence += 20;
      else if (gap > 1) confidence += 10;
    } else if (allMatches.length === 1) {
      confidence += 15; // Only one match is fairly certain
    }

    // Sentence length consideration
    const wordCount = sentence.split(/\s+/).length;
    if (wordCount >= 10 && wordCount <= 30) confidence += 5; // Optimal length

    return Math.min(confidence, 100);
  }

  /**
   * Get Bloom's level weight
   */
  private getBloomsWeight(level: BloomsLevel): number {
    const weights: Record<BloomsLevel, number> = {
      REMEMBER: 1,
      UNDERSTAND: 2,
      APPLY: 3,
      ANALYZE: 4,
      EVALUATE: 5,
      CREATE: 6,
    };
    return weights[level];
  }

  /**
   * Map Bloom's level to Webb's DOK
   */
  private bloomsToDOK(level: BloomsLevel): WebbDOKLevel {
    const mapping: Record<BloomsLevel, WebbDOKLevel> = {
      REMEMBER: 1,
      UNDERSTAND: 2,
      APPLY: 2,
      ANALYZE: 3,
      EVALUATE: 3,
      CREATE: 4,
    };
    return mapping[level];
  }

  /**
   * Calculate Bloom's distribution from sentence analyses
   */
  private calculateBloomsDistribution(analyses: SentenceLevelAnalysis[]): BloomsDistribution {
    const counts: Record<BloomsLevel, number> = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    for (const analysis of analyses) {
      counts[analysis.predictedBloomsLevel]++;
    }

    const total = analyses.length || 1;
    return {
      REMEMBER: Math.round((counts.REMEMBER / total) * 100),
      UNDERSTAND: Math.round((counts.UNDERSTAND / total) * 100),
      APPLY: Math.round((counts.APPLY / total) * 100),
      ANALYZE: Math.round((counts.ANALYZE / total) * 100),
      EVALUATE: Math.round((counts.EVALUATE / total) * 100),
      CREATE: Math.round((counts.CREATE / total) * 100),
    };
  }

  /**
   * Calculate weighted Bloom's distribution (by confidence)
   */
  private calculateWeightedBloomsDistribution(
    analyses: SentenceLevelAnalysis[]
  ): BloomsDistribution {
    const weightedCounts: Record<BloomsLevel, number> = {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    let totalWeight = 0;

    for (const analysis of analyses) {
      const weight = analysis.confidence / 100;
      weightedCounts[analysis.predictedBloomsLevel] += weight;
      totalWeight += weight;
    }

    if (totalWeight === 0) {
      return {
        REMEMBER: 0,
        UNDERSTAND: 0,
        APPLY: 0,
        ANALYZE: 0,
        EVALUATE: 0,
        CREATE: 0,
      };
    }

    return {
      REMEMBER: Math.round((weightedCounts.REMEMBER / totalWeight) * 100),
      UNDERSTAND: Math.round((weightedCounts.UNDERSTAND / totalWeight) * 100),
      APPLY: Math.round((weightedCounts.APPLY / totalWeight) * 100),
      ANALYZE: Math.round((weightedCounts.ANALYZE / totalWeight) * 100),
      EVALUATE: Math.round((weightedCounts.EVALUATE / totalWeight) * 100),
      CREATE: Math.round((weightedCounts.CREATE / totalWeight) * 100),
    };
  }

  /**
   * Calculate DOK distribution from sentence analyses
   */
  private calculateDOKDistribution(analyses: SentenceLevelAnalysis[]): WebbDOKDistribution {
    const counts: Record<WebbDOKLevel, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

    for (const analysis of analyses) {
      counts[analysis.predictedDOKLevel]++;
    }

    const total = analyses.length || 1;
    return {
      level1: Math.round((counts[1] / total) * 100),
      level2: Math.round((counts[2] / total) * 100),
      level3: Math.round((counts[3] / total) * 100),
      level4: Math.round((counts[4] / total) * 100),
    };
  }

  /**
   * Calculate overall analysis confidence
   */
  private calculateOverallConfidence(analyses: SentenceLevelAnalysis[]): number {
    if (analyses.length === 0) return 0;

    const avgConfidence =
      analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;

    // Boost confidence if we have sufficient sample size
    let sampleBonus = 0;
    if (analyses.length >= 100) sampleBonus = 10;
    else if (analyses.length >= 50) sampleBonus = 5;

    return Math.min(Math.round(avgConfidence + sampleBonus), 100);
  }

  /**
   * Identify content gaps based on distributions
   */
  private identifyContentGaps(
    blooms: BloomsDistribution,
    dok: WebbDOKDistribution,
    contexts: Record<ContentContext, number>
  ): ContentGap[] {
    const gaps: ContentGap[] = [];

    // Check for missing Bloom's levels
    const bloomsLevels: BloomsLevel[] = [
      'REMEMBER',
      'UNDERSTAND',
      'APPLY',
      'ANALYZE',
      'EVALUATE',
      'CREATE',
    ];
    for (const level of bloomsLevels) {
      if (blooms[level] === 0) {
        gaps.push({
          type: 'missing_level',
          level,
          severity: level === 'REMEMBER' || level === 'UNDERSTAND' ? 'low' : 'medium',
          description: `No content at ${level} level detected`,
          recommendation: `Add ${level.toLowerCase()}-level activities or content`,
        });
      }
    }

    // Check for bottom-heavy distribution
    const lowerOrder = blooms.REMEMBER + blooms.UNDERSTAND;
    if (lowerOrder > 60) {
      gaps.push({
        type: 'overrepresented',
        severity: 'high',
        description: `${lowerOrder}% of content is at lower-order thinking levels (Remember/Understand)`,
        recommendation: 'Add more application, analysis, and evaluation activities',
      });
    }

    // Check for insufficient higher-order thinking
    const higherOrder = blooms.ANALYZE + blooms.EVALUATE + blooms.CREATE;
    if (higherOrder < 20) {
      gaps.push({
        type: 'underrepresented',
        severity: 'high',
        description: `Only ${higherOrder}% of content targets higher-order thinking`,
        recommendation:
          'Increase analytical, evaluative, and creative content to at least 25%',
      });
    }

    // Check DOK distribution
    const strategicThinking = dok.level3 + dok.level4;
    if (strategicThinking < 15) {
      gaps.push({
        type: 'underrepresented',
        severity: 'medium',
        description: `Only ${strategicThinking}% of content at DOK Level 3-4 (Strategic/Extended Thinking)`,
        recommendation: 'Add strategic thinking tasks and extended projects',
      });
    }

    // Check context balance
    if (contexts.activity < 10 && contexts.assessment < 10) {
      gaps.push({
        type: 'context_imbalance',
        context: 'activity',
        severity: 'medium',
        description: 'Limited practice opportunities detected',
        recommendation: 'Add more hands-on activities and practice exercises',
      });
    }

    if (contexts.example < 5) {
      gaps.push({
        type: 'context_imbalance',
        context: 'example',
        severity: 'low',
        description: 'Few examples detected in content',
        recommendation: 'Add more concrete examples to illustrate concepts',
      });
    }

    return gaps;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    blooms: BloomsDistribution,
    dok: WebbDOKDistribution,
    gaps: ContentGap[],
    confidence: number
  ): string[] {
    const recommendations: string[] = [];

    // High-priority gap-based recommendations
    const highSeverityGaps = gaps.filter(g => g.severity === 'high');
    for (const gap of highSeverityGaps) {
      recommendations.push(`[Critical] ${gap.recommendation}`);
    }

    // Distribution-based recommendations
    if (blooms.REMEMBER + blooms.UNDERSTAND > 50) {
      recommendations.push(
        'Reduce recall-focused content; transform definitions into application exercises'
      );
    }

    if (blooms.CREATE < 5) {
      recommendations.push('Add creative projects or synthesis activities');
    }

    if (blooms.EVALUATE < 10) {
      recommendations.push('Include more critical evaluation and judgment tasks');
    }

    if (blooms.APPLY < 15) {
      recommendations.push('Add more hands-on application exercises and problem-solving');
    }

    // DOK recommendations
    if (dok.level4 < 5) {
      recommendations.push('Add extended thinking projects requiring sustained investigation');
    }

    // Confidence-based recommendations
    if (confidence < 50) {
      recommendations.push(
        '[Note] Analysis confidence is low. Consider adding more structured content with clear learning objectives'
      );
    }

    // Medium severity gap recommendations
    const mediumGaps = gaps.filter(g => g.severity === 'medium');
    for (const gap of mediumGaps.slice(0, 3)) {
      recommendations.push(gap.recommendation);
    }

    // Deduplicate and limit
    return [...new Set(recommendations)].slice(0, 10);
  }

  /**
   * Get a summary of the analysis
   */
  getSummary(result: DeepContentAnalysisResult): {
    overallRating: 'excellent' | 'good' | 'needs_improvement' | 'poor';
    keyStrengths: string[];
    keyWeaknesses: string[];
    priorityActions: string[];
  } {
    const { bloomsDistribution, dokDistribution, contentGaps, overallConfidence } = result;

    // Calculate overall rating
    const higherOrder =
      bloomsDistribution.ANALYZE + bloomsDistribution.EVALUATE + bloomsDistribution.CREATE;
    const strategicThinking = dokDistribution.level3 + dokDistribution.level4;
    const criticalGaps = contentGaps.filter(g => g.severity === 'high').length;

    let overallRating: 'excellent' | 'good' | 'needs_improvement' | 'poor';
    if (higherOrder >= 30 && strategicThinking >= 25 && criticalGaps === 0) {
      overallRating = 'excellent';
    } else if (higherOrder >= 20 && strategicThinking >= 15 && criticalGaps <= 1) {
      overallRating = 'good';
    } else if (higherOrder >= 10 || criticalGaps <= 2) {
      overallRating = 'needs_improvement';
    } else {
      overallRating = 'poor';
    }

    // Identify strengths
    const keyStrengths: string[] = [];
    if (bloomsDistribution.APPLY >= 20) {
      keyStrengths.push('Strong application-focused content');
    }
    if (higherOrder >= 25) {
      keyStrengths.push('Good higher-order thinking coverage');
    }
    if (overallConfidence >= 70) {
      keyStrengths.push('Clear, well-structured content');
    }
    if (bloomsDistribution.CREATE >= 10) {
      keyStrengths.push('Creative activities present');
    }

    // Identify weaknesses
    const keyWeaknesses: string[] = [];
    for (const gap of contentGaps.filter(g => g.severity === 'high')) {
      keyWeaknesses.push(gap.description);
    }

    // Priority actions (first 3 recommendations)
    const priorityActions = result.recommendations.slice(0, 3);

    return {
      overallRating,
      keyStrengths: keyStrengths.slice(0, 4),
      keyWeaknesses: keyWeaknesses.slice(0, 4),
      priorityActions,
    };
  }
}

// Export singleton instance
export const deepContentAnalyzer = new DeepContentAnalyzer();
