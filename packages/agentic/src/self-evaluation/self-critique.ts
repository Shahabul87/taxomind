/**
 * @sam-ai/agentic - Self-Critique Module
 *
 * Enables AI responses to critique and improve themselves iteratively.
 * Implements a self-critique loop for response refinement.
 *
 * Features:
 * - Multi-dimensional critique analysis
 * - Iterative improvement loops
 * - Quality gate integration
 * - Pedagogical effectiveness evaluation
 * - Improvement tracking
 */

import { z } from 'zod';
import type {
  ResponseType,
  ResponseContext,
  SelfEvaluationLogger,
} from './types';

// ============================================================================
// SELF-CRITIQUE TYPES
// ============================================================================

/**
 * Critique dimension types
 */
export const CritiqueDimension = {
  ACCURACY: 'accuracy',
  CLARITY: 'clarity',
  COMPLETENESS: 'completeness',
  PEDAGOGY: 'pedagogy',
  ENGAGEMENT: 'engagement',
  SAFETY: 'safety',
  RELEVANCE: 'relevance',
  STRUCTURE: 'structure',
} as const;

export type CritiqueDimension = (typeof CritiqueDimension)[keyof typeof CritiqueDimension];

/**
 * Critique severity levels
 */
export const CritiqueSeverity = {
  CRITICAL: 'critical',
  MAJOR: 'major',
  MINOR: 'minor',
  SUGGESTION: 'suggestion',
} as const;

export type CritiqueSeverity = (typeof CritiqueSeverity)[keyof typeof CritiqueSeverity];

/**
 * Single critique finding
 */
export interface CritiqueFinding {
  id: string;
  dimension: CritiqueDimension;
  severity: CritiqueSeverity;
  description: string;
  location?: string; // Specific part of response
  originalText?: string;
  suggestedFix?: string;
  reasoning: string;
  confidence: number; // 0-1
}

/**
 * Dimension score in critique
 */
export interface DimensionScore {
  dimension: CritiqueDimension;
  score: number; // 0-100
  weight: number; // Contribution to overall
  findings: CritiqueFinding[];
  strengths: string[];
  improvements: string[];
}

/**
 * Improvement suggestion
 */
export interface ImprovementSuggestion {
  id: string;
  priority: number; // 1 = highest
  dimension: CritiqueDimension;
  description: string;
  originalText?: string;
  improvedText?: string;
  estimatedImpact: number; // 0-100 improvement potential
  effort: 'low' | 'medium' | 'high';
}

/**
 * Self-critique result
 */
export interface SelfCritiqueResult {
  id: string;
  responseId: string;
  userId: string;

  // Scores
  overallScore: number; // 0-100
  dimensionScores: DimensionScore[];

  // Findings
  findings: CritiqueFinding[];
  criticalFindings: number;
  majorFindings: number;
  minorFindings: number;

  // Improvements
  improvements: ImprovementSuggestion[];
  topImprovements: ImprovementSuggestion[]; // Top 3

  // Iteration info
  iteration: number;
  previousScore?: number;
  scoreImprovement?: number;

  // Verdict
  passed: boolean;
  passThreshold: number;
  requiresRevision: boolean;

  // Timestamps
  critiquedAt: Date;
  processingTimeMs: number;
}

/**
 * Iteration result for improvement loop
 */
export interface CritiqueIterationResult {
  iteration: number;
  originalResponse: string;
  improvedResponse: string;
  critique: SelfCritiqueResult;
  improvements: string[];
  converged: boolean;
  reason?: string;
}

/**
 * Self-critique loop result
 */
export interface SelfCritiqueLoopResult {
  responseId: string;
  userId: string;

  // Final result
  finalResponse: string;
  finalScore: number;
  passed: boolean;

  // Iterations
  iterations: CritiqueIterationResult[];
  totalIterations: number;
  maxIterationsReached: boolean;

  // Improvement tracking
  initialScore: number;
  scoreImprovement: number;
  improvementPercentage: number;

  // Summary
  allFindings: CritiqueFinding[];
  resolvedFindings: CritiqueFinding[];
  unresolvedFindings: CritiqueFinding[];

  // Timing
  totalProcessingTimeMs: number;
  averageIterationTimeMs: number;

  // Metadata
  startedAt: Date;
  completedAt: Date;
}

/**
 * Input for self-critique
 */
export interface SelfCritiqueInput {
  responseId: string;
  userId: string;
  sessionId: string;
  responseText: string;
  responseType: ResponseType;
  topic?: string;
  context?: ResponseContext;
  targetAudience?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  learningObjectives?: string[];
  enabledDimensions?: CritiqueDimension[];
  passThreshold?: number;
  iteration?: number;
  previousScore?: number;
}

/**
 * Input for self-critique loop
 */
export interface SelfCritiqueLoopInput extends SelfCritiqueInput {
  maxIterations?: number;
  minImprovement?: number; // Minimum score improvement to continue
  improvementCallback?: (response: string, critique: SelfCritiqueResult) => Promise<string>;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Default dimension weights
 */
export const DEFAULT_DIMENSION_WEIGHTS: Record<CritiqueDimension, number> = {
  [CritiqueDimension.ACCURACY]: 0.20,
  [CritiqueDimension.CLARITY]: 0.15,
  [CritiqueDimension.COMPLETENESS]: 0.15,
  [CritiqueDimension.PEDAGOGY]: 0.15,
  [CritiqueDimension.ENGAGEMENT]: 0.10,
  [CritiqueDimension.SAFETY]: 0.10,
  [CritiqueDimension.RELEVANCE]: 0.10,
  [CritiqueDimension.STRUCTURE]: 0.05,
};

/**
 * Self-critique configuration
 */
export interface SelfCritiqueConfig {
  /** Pass threshold (0-100) */
  passThreshold?: number;
  /** Enabled critique dimensions */
  enabledDimensions?: CritiqueDimension[];
  /** Dimension weights */
  dimensionWeights?: Partial<Record<CritiqueDimension, number>>;
  /** Maximum findings to return */
  maxFindings?: number;
  /** Maximum improvements to suggest */
  maxImprovements?: number;
  /** Logger */
  logger?: SelfEvaluationLogger;
  /** Store for persisting results */
  store?: SelfCritiqueStore;
}

/**
 * Self-critique loop configuration
 */
export interface SelfCritiqueLoopConfig extends SelfCritiqueConfig {
  /** Maximum iterations */
  maxIterations?: number;
  /** Minimum improvement to continue (0-100) */
  minImprovementThreshold?: number;
  /** Convergence threshold - stop if score change is below this */
  convergenceThreshold?: number;
}

// ============================================================================
// STORE INTERFACE
// ============================================================================

/**
 * Store for self-critique results
 */
export interface SelfCritiqueStore {
  get(id: string): Promise<SelfCritiqueResult | null>;
  getByResponse(responseId: string): Promise<SelfCritiqueResult[]>;
  getByUser(userId: string, limit?: number): Promise<SelfCritiqueResult[]>;
  create(result: Omit<SelfCritiqueResult, 'id'>): Promise<SelfCritiqueResult>;
  getLoopResult(responseId: string): Promise<SelfCritiqueLoopResult | null>;
  saveLoopResult(result: SelfCritiqueLoopResult): Promise<void>;
}

// ============================================================================
// IN-MEMORY STORE
// ============================================================================

/**
 * In-memory implementation of SelfCritiqueStore
 */
export class InMemorySelfCritiqueStore implements SelfCritiqueStore {
  private results = new Map<string, SelfCritiqueResult>();
  private loopResults = new Map<string, SelfCritiqueLoopResult>();
  private idCounter = 0;

  async get(id: string): Promise<SelfCritiqueResult | null> {
    return this.results.get(id) ?? null;
  }

  async getByResponse(responseId: string): Promise<SelfCritiqueResult[]> {
    return Array.from(this.results.values()).filter(
      (r) => r.responseId === responseId
    );
  }

  async getByUser(userId: string, limit = 50): Promise<SelfCritiqueResult[]> {
    return Array.from(this.results.values())
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.critiquedAt.getTime() - a.critiquedAt.getTime())
      .slice(0, limit);
  }

  async create(result: Omit<SelfCritiqueResult, 'id'>): Promise<SelfCritiqueResult> {
    const id = `critique_${++this.idCounter}_${Date.now()}`;
    const fullResult: SelfCritiqueResult = { id, ...result };
    this.results.set(id, fullResult);
    return fullResult;
  }

  async getLoopResult(responseId: string): Promise<SelfCritiqueLoopResult | null> {
    return this.loopResults.get(responseId) ?? null;
  }

  async saveLoopResult(result: SelfCritiqueLoopResult): Promise<void> {
    this.loopResults.set(result.responseId, result);
  }
}

// ============================================================================
// SELF-CRITIQUE ENGINE
// ============================================================================

/**
 * Self-Critique Engine
 * Analyzes responses and suggests improvements
 */
export class SelfCritiqueEngine {
  private readonly config: Required<Omit<SelfCritiqueConfig, 'logger' | 'store'>>;
  private readonly logger?: SelfEvaluationLogger;
  private readonly store: SelfCritiqueStore;

  constructor(config: SelfCritiqueConfig = {}) {
    this.config = {
      passThreshold: config.passThreshold ?? 75,
      enabledDimensions: config.enabledDimensions ?? Object.values(CritiqueDimension),
      dimensionWeights: { ...DEFAULT_DIMENSION_WEIGHTS, ...config.dimensionWeights },
      maxFindings: config.maxFindings ?? 20,
      maxImprovements: config.maxImprovements ?? 10,
    };
    this.logger = config.logger;
    this.store = config.store ?? new InMemorySelfCritiqueStore();
  }

  /**
   * Perform self-critique on a response
   */
  async critique(input: SelfCritiqueInput): Promise<SelfCritiqueResult> {
    const startTime = Date.now();

    this.logger?.info('Starting self-critique', {
      responseId: input.responseId,
      responseType: input.responseType,
      iteration: input.iteration ?? 1,
    });

    const enabledDimensions = input.enabledDimensions ?? this.config.enabledDimensions;
    const passThreshold = input.passThreshold ?? this.config.passThreshold;

    // Analyze each dimension
    const dimensionScores: DimensionScore[] = [];
    const allFindings: CritiqueFinding[] = [];

    for (const dimension of enabledDimensions) {
      const dimensionResult = await this.analyzeDimension(
        input.responseText,
        dimension,
        input
      );
      dimensionScores.push(dimensionResult);
      allFindings.push(...dimensionResult.findings);
    }

    // Calculate overall score
    const overallScore = this.calculateOverallScore(dimensionScores);

    // Count findings by severity
    const criticalFindings = allFindings.filter(
      (f) => f.severity === CritiqueSeverity.CRITICAL
    ).length;
    const majorFindings = allFindings.filter(
      (f) => f.severity === CritiqueSeverity.MAJOR
    ).length;
    const minorFindings = allFindings.filter(
      (f) => f.severity === CritiqueSeverity.MINOR
    ).length;

    // Generate improvement suggestions
    const improvements = this.generateImprovements(allFindings, input);
    const topImprovements = improvements.slice(0, 3);

    // Determine verdict
    const passed = overallScore >= passThreshold && criticalFindings === 0;
    const requiresRevision = criticalFindings > 0 || majorFindings > 2;

    const scoreImprovement = input.previousScore
      ? overallScore - input.previousScore
      : undefined;

    const result: Omit<SelfCritiqueResult, 'id'> = {
      responseId: input.responseId,
      userId: input.userId,
      overallScore,
      dimensionScores,
      findings: allFindings.slice(0, this.config.maxFindings),
      criticalFindings,
      majorFindings,
      minorFindings,
      improvements: improvements.slice(0, this.config.maxImprovements),
      topImprovements,
      iteration: input.iteration ?? 1,
      previousScore: input.previousScore,
      scoreImprovement,
      passed,
      passThreshold,
      requiresRevision,
      critiquedAt: new Date(),
      processingTimeMs: Date.now() - startTime,
    };

    const savedResult = await this.store.create(result);

    this.logger?.info('Self-critique complete', {
      responseId: input.responseId,
      overallScore,
      passed,
      criticalFindings,
      processingTimeMs: result.processingTimeMs,
    });

    return savedResult;
  }

  /**
   * Run iterative self-critique loop
   */
  async runCritiqueLoop(input: SelfCritiqueLoopInput): Promise<SelfCritiqueLoopResult> {
    const startedAt = new Date();
    const maxIterations = input.maxIterations ?? 3;
    const minImprovement = input.minImprovement ?? 5;

    this.logger?.info('Starting self-critique loop', {
      responseId: input.responseId,
      maxIterations,
      minImprovement,
    });

    const iterations: CritiqueIterationResult[] = [];
    let currentResponse = input.responseText;
    let currentScore = 0;
    let converged = false;
    let convergedReason: string | undefined;

    for (let i = 1; i <= maxIterations; i++) {
      // Critique current response
      const critique = await this.critique({
        ...input,
        responseText: currentResponse,
        iteration: i,
        previousScore: i > 1 ? currentScore : undefined,
      });

      const previousScore = currentScore;
      currentScore = critique.overallScore;

      // Check for convergence
      if (critique.passed && critique.criticalFindings === 0) {
        converged = true;
        convergedReason = 'Passed quality threshold';
      } else if (i > 1 && currentScore - previousScore < minImprovement) {
        converged = true;
        convergedReason = 'Improvement below threshold';
      }

      // Get improved response if callback provided and not converged
      let improvedResponse = currentResponse;
      const improvementsMade: string[] = [];

      if (!converged && input.improvementCallback && critique.topImprovements.length > 0) {
        improvedResponse = await input.improvementCallback(currentResponse, critique);
        improvementsMade.push(...critique.topImprovements.map((imp) => imp.description));
      } else if (!converged && critique.topImprovements.length > 0) {
        // Apply simple text improvements if no callback
        improvedResponse = this.applySimpleImprovements(currentResponse, critique.topImprovements);
        improvementsMade.push(...critique.topImprovements.map((imp) => imp.description));
      }

      iterations.push({
        iteration: i,
        originalResponse: currentResponse,
        improvedResponse,
        critique,
        improvements: improvementsMade,
        converged,
        reason: convergedReason,
      });

      currentResponse = improvedResponse;

      if (converged) {
        break;
      }
    }

    const completedAt = new Date();
    const initialScore = iterations[0]?.critique.overallScore ?? 0;
    const finalScore = iterations[iterations.length - 1]?.critique.overallScore ?? 0;

    // Collect all findings
    const allFindings = iterations.flatMap((it) => it.critique.findings);
    const resolvedFindings = allFindings.filter((f) =>
      !iterations[iterations.length - 1]?.critique.findings.some((ff) => ff.id === f.id)
    );
    const unresolvedFindings = iterations[iterations.length - 1]?.critique.findings ?? [];

    const result: SelfCritiqueLoopResult = {
      responseId: input.responseId,
      userId: input.userId,
      finalResponse: currentResponse,
      finalScore,
      passed: iterations[iterations.length - 1]?.critique.passed ?? false,
      iterations,
      totalIterations: iterations.length,
      maxIterationsReached: iterations.length >= maxIterations && !converged,
      initialScore,
      scoreImprovement: finalScore - initialScore,
      improvementPercentage: initialScore > 0 ? ((finalScore - initialScore) / initialScore) * 100 : 0,
      allFindings,
      resolvedFindings,
      unresolvedFindings,
      totalProcessingTimeMs: completedAt.getTime() - startedAt.getTime(),
      averageIterationTimeMs:
        (completedAt.getTime() - startedAt.getTime()) / iterations.length,
      startedAt,
      completedAt,
    };

    await this.store.saveLoopResult(result);

    this.logger?.info('Self-critique loop complete', {
      responseId: input.responseId,
      totalIterations: result.totalIterations,
      initialScore,
      finalScore,
      scoreImprovement: result.scoreImprovement,
      passed: result.passed,
    });

    return result;
  }

  /**
   * Analyze a specific dimension
   */
  private async analyzeDimension(
    responseText: string,
    dimension: CritiqueDimension,
    input: SelfCritiqueInput
  ): Promise<DimensionScore> {
    const findings: CritiqueFinding[] = [];
    const strengths: string[] = [];
    const improvements: string[] = [];

    // Dimension-specific analysis
    switch (dimension) {
      case CritiqueDimension.ACCURACY:
        this.analyzeAccuracy(responseText, findings, strengths, improvements, input);
        break;
      case CritiqueDimension.CLARITY:
        this.analyzeClarity(responseText, findings, strengths, improvements);
        break;
      case CritiqueDimension.COMPLETENESS:
        this.analyzeCompleteness(responseText, findings, strengths, improvements, input);
        break;
      case CritiqueDimension.PEDAGOGY:
        this.analyzePedagogy(responseText, findings, strengths, improvements, input);
        break;
      case CritiqueDimension.ENGAGEMENT:
        this.analyzeEngagement(responseText, findings, strengths, improvements);
        break;
      case CritiqueDimension.SAFETY:
        this.analyzeSafety(responseText, findings, strengths, improvements);
        break;
      case CritiqueDimension.RELEVANCE:
        this.analyzeRelevance(responseText, findings, strengths, improvements, input);
        break;
      case CritiqueDimension.STRUCTURE:
        this.analyzeStructure(responseText, findings, strengths, improvements);
        break;
    }

    // Calculate dimension score
    const score = this.calculateDimensionScore(findings, strengths);
    const weight = this.config.dimensionWeights[dimension] ?? 0.1;

    return {
      dimension,
      score,
      weight,
      findings,
      strengths,
      improvements,
    };
  }

  /**
   * Analyze accuracy dimension
   */
  private analyzeAccuracy(
    text: string,
    findings: CritiqueFinding[],
    strengths: string[],
    improvements: string[],
    _input: SelfCritiqueInput
  ): void {
    // Check for hedging language that might indicate uncertainty
    const hedgingPatterns = [
      /\b(might|may|could|possibly|perhaps|probably|likely|approximately|around|about)\b/gi,
    ];

    let hedgeCount = 0;
    for (const pattern of hedgingPatterns) {
      const matches = text.match(pattern);
      hedgeCount += matches?.length ?? 0;
    }

    if (hedgeCount > 5) {
      findings.push({
        id: `accuracy_${Date.now()}_1`,
        dimension: CritiqueDimension.ACCURACY,
        severity: CritiqueSeverity.MINOR,
        description: 'Excessive hedging language may undermine confidence in accuracy',
        reasoning: `Found ${hedgeCount} hedging words/phrases`,
        confidence: 0.7,
      });
      improvements.push('Reduce hedging language where facts are certain');
    }

    // Check for specific, concrete statements (positive)
    const specificPatterns = [
      /\d+%/g, // Percentages
      /\d+\s*(years?|days?|hours?|minutes?)/gi, // Time measurements
      /specifically|precisely|exactly|clearly defined/gi,
    ];

    let specificCount = 0;
    for (const pattern of specificPatterns) {
      const matches = text.match(pattern);
      specificCount += matches?.length ?? 0;
    }

    if (specificCount > 2) {
      strengths.push('Contains specific, measurable information');
    }
  }

  /**
   * Analyze clarity dimension
   */
  private analyzeClarity(
    text: string,
    findings: CritiqueFinding[],
    strengths: string[],
    improvements: string[]
  ): void {
    // Check sentence length
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const avgSentenceLength =
      sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;

    if (avgSentenceLength > 25) {
      findings.push({
        id: `clarity_${Date.now()}_1`,
        dimension: CritiqueDimension.CLARITY,
        severity: CritiqueSeverity.MINOR,
        description: 'Sentences are too long on average',
        reasoning: `Average sentence length is ${avgSentenceLength.toFixed(1)} words`,
        suggestedFix: 'Break long sentences into shorter, more digestible ones',
        confidence: 0.8,
      });
      improvements.push('Shorten sentences for better readability');
    } else if (avgSentenceLength >= 12 && avgSentenceLength <= 20) {
      strengths.push('Good sentence length for readability');
    }

    // Check for jargon without explanation
    const jargonPatterns = [
      /\b(paradigm|synergy|leverage|utilize|optimize|implement|methodology)\b/gi,
    ];

    for (const pattern of jargonPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 2) {
        findings.push({
          id: `clarity_${Date.now()}_2`,
          dimension: CritiqueDimension.CLARITY,
          severity: CritiqueSeverity.MINOR,
          description: 'Contains jargon that may need explanation',
          reasoning: `Found ${matches.length} instances of technical jargon`,
          confidence: 0.6,
        });
        improvements.push('Consider explaining technical terms for beginners');
        break;
      }
    }

    // Check for clear structure markers
    const structureMarkers = text.match(/\b(first|second|third|finally|in summary|to conclude|for example|such as)\b/gi);
    if (structureMarkers && structureMarkers.length >= 2) {
      strengths.push('Uses clear structural markers');
    }
  }

  /**
   * Analyze completeness dimension
   */
  private analyzeCompleteness(
    text: string,
    findings: CritiqueFinding[],
    strengths: string[],
    improvements: string[],
    input: SelfCritiqueInput
  ): void {
    const wordCount = text.split(/\s+/).length;

    // Check minimum length
    if (wordCount < 50) {
      findings.push({
        id: `completeness_${Date.now()}_1`,
        dimension: CritiqueDimension.COMPLETENESS,
        severity: CritiqueSeverity.MAJOR,
        description: 'Response may be too brief',
        reasoning: `Only ${wordCount} words`,
        suggestedFix: 'Expand with more detail and examples',
        confidence: 0.8,
      });
      improvements.push('Add more detailed explanation');
    } else if (wordCount >= 100 && wordCount <= 300) {
      strengths.push('Good length for comprehensive yet focused response');
    }

    // Check if learning objectives are covered
    if (input.learningObjectives && input.learningObjectives.length > 0) {
      const coveredObjectives = input.learningObjectives.filter((obj) =>
        text.toLowerCase().includes(obj.toLowerCase().split(' ')[0])
      );

      if (coveredObjectives.length < input.learningObjectives.length * 0.5) {
        findings.push({
          id: `completeness_${Date.now()}_2`,
          dimension: CritiqueDimension.COMPLETENESS,
          severity: CritiqueSeverity.MAJOR,
          description: 'Not all learning objectives are addressed',
          reasoning: `Only ${coveredObjectives.length} of ${input.learningObjectives.length} objectives appear to be covered`,
          confidence: 0.6,
        });
        improvements.push('Ensure all learning objectives are addressed');
      } else {
        strengths.push('Covers learning objectives well');
      }
    }

    // Check for examples
    const exampleMarkers = text.match(/\b(for example|such as|for instance|e\.g\.|like|consider)\b/gi);
    if (!exampleMarkers || exampleMarkers.length === 0) {
      findings.push({
        id: `completeness_${Date.now()}_3`,
        dimension: CritiqueDimension.COMPLETENESS,
        severity: CritiqueSeverity.MINOR,
        description: 'No examples provided',
        reasoning: 'Examples help reinforce understanding',
        suggestedFix: 'Add concrete examples to illustrate concepts',
        confidence: 0.7,
      });
      improvements.push('Add examples to reinforce concepts');
    } else if (exampleMarkers.length >= 2) {
      strengths.push('Includes helpful examples');
    }
  }

  /**
   * Analyze pedagogy dimension
   */
  private analyzePedagogy(
    text: string,
    findings: CritiqueFinding[],
    strengths: string[],
    improvements: string[],
    input: SelfCritiqueInput
  ): void {
    // Check for scaffolding elements
    const scaffoldingMarkers = [
      /\b(let&apos;s start|first, let&apos;s|begin by|before we|building on)\b/gi,
      /\b(now that we|next, we|moving on|with this in mind)\b/gi,
    ];

    let scaffoldingCount = 0;
    for (const pattern of scaffoldingMarkers) {
      const matches = text.match(pattern);
      scaffoldingCount += matches?.length ?? 0;
    }

    if (scaffoldingCount === 0 && text.length > 200) {
      findings.push({
        id: `pedagogy_${Date.now()}_1`,
        dimension: CritiqueDimension.PEDAGOGY,
        severity: CritiqueSeverity.MINOR,
        description: 'Missing scaffolding elements',
        reasoning: 'Scaffolding helps guide learners through complex topics',
        suggestedFix: 'Add transitional phrases that build upon previous concepts',
        confidence: 0.6,
      });
      improvements.push('Add scaffolding to guide learning progression');
    } else if (scaffoldingCount >= 2) {
      strengths.push('Good use of pedagogical scaffolding');
    }

    // Check audience appropriateness
    if (input.targetAudience === 'beginner') {
      const complexTerms = text.match(/\b\w{12,}\b/g);
      if (complexTerms && complexTerms.length > 5) {
        findings.push({
          id: `pedagogy_${Date.now()}_2`,
          dimension: CritiqueDimension.PEDAGOGY,
          severity: CritiqueSeverity.MINOR,
          description: 'May be too complex for beginner audience',
          reasoning: `Found ${complexTerms.length} long/complex terms`,
          confidence: 0.5,
        });
        improvements.push('Simplify language for beginner audience');
      }
    }

    // Check for questioning/reflection prompts
    const questionMarkers = text.match(/\?/g);
    if (questionMarkers && questionMarkers.length >= 1) {
      strengths.push('Includes questions to prompt reflection');
    }
  }

  /**
   * Analyze engagement dimension
   */
  private analyzeEngagement(
    text: string,
    findings: CritiqueFinding[],
    strengths: string[],
    improvements: string[]
  ): void {
    // Check for active voice
    const passivePatterns = [
      /\b(is|are|was|were|been|being)\s+(being\s+)?\w+ed\b/gi,
    ];

    let passiveCount = 0;
    for (const pattern of passivePatterns) {
      const matches = text.match(pattern);
      passiveCount += matches?.length ?? 0;
    }

    const sentenceCount = text.split(/[.!?]+/).filter((s) => s.trim()).length;
    const passiveRatio = passiveCount / sentenceCount;

    if (passiveRatio > 0.4) {
      findings.push({
        id: `engagement_${Date.now()}_1`,
        dimension: CritiqueDimension.ENGAGEMENT,
        severity: CritiqueSeverity.MINOR,
        description: 'Too much passive voice reduces engagement',
        reasoning: `${(passiveRatio * 100).toFixed(0)}% passive voice usage`,
        suggestedFix: 'Rewrite passive sentences in active voice',
        confidence: 0.7,
      });
      improvements.push('Use more active voice for better engagement');
    } else if (passiveRatio < 0.2) {
      strengths.push('Good use of active voice');
    }

    // Check for personal pronouns (engagement indicator)
    const engagementPronouns = text.match(/\b(you|your|we|our|let&apos;s)\b/gi);
    if (engagementPronouns && engagementPronouns.length >= 2) {
      strengths.push('Direct, engaging tone with personal pronouns');
    }
  }

  /**
   * Analyze safety dimension
   */
  private analyzeSafety(
    text: string,
    findings: CritiqueFinding[],
    strengths: string[],
    improvements: string[]
  ): void {
    // Check for discouraging language
    const discouragingPatterns = [
      /\b(wrong|incorrect|failed|mistake|error|bad|poor|terrible|awful)\b/gi,
      /\b(you should have|you failed to|you didn&apos;t)\b/gi,
    ];

    let discouragingCount = 0;
    for (const pattern of discouragingPatterns) {
      const matches = text.match(pattern);
      discouragingCount += matches?.length ?? 0;
    }

    if (discouragingCount > 2) {
      findings.push({
        id: `safety_${Date.now()}_1`,
        dimension: CritiqueDimension.SAFETY,
        severity: CritiqueSeverity.MAJOR,
        description: 'Contains potentially discouraging language',
        reasoning: `Found ${discouragingCount} instances of negative/discouraging terms`,
        suggestedFix: 'Reframe feedback using growth-oriented language',
        confidence: 0.8,
      });
      improvements.push('Replace discouraging language with constructive feedback');
    }

    // Check for constructive framing
    const constructivePatterns = [
      /\b(try|consider|explore|practice|improve|develop|grow|learn)\b/gi,
      /\b(great|good|excellent|well done|keep|progress)\b/gi,
    ];

    let constructiveCount = 0;
    for (const pattern of constructivePatterns) {
      const matches = text.match(pattern);
      constructiveCount += matches?.length ?? 0;
    }

    if (constructiveCount >= 3) {
      strengths.push('Uses constructive and encouraging language');
    }
  }

  /**
   * Analyze relevance dimension
   */
  private analyzeRelevance(
    text: string,
    findings: CritiqueFinding[],
    strengths: string[],
    improvements: string[],
    input: SelfCritiqueInput
  ): void {
    // Check topic relevance if topic is provided
    if (input.topic) {
      const topicWords = input.topic.toLowerCase().split(/\s+/);
      const textLower = text.toLowerCase();

      const topicMentions = topicWords.filter((word) =>
        textLower.includes(word)
      ).length;

      const topicCoverage = topicMentions / topicWords.length;

      if (topicCoverage < 0.3) {
        findings.push({
          id: `relevance_${Date.now()}_1`,
          dimension: CritiqueDimension.RELEVANCE,
          severity: CritiqueSeverity.MAJOR,
          description: 'Response may not be focused on the topic',
          reasoning: `Only ${(topicCoverage * 100).toFixed(0)}% of topic keywords appear`,
          confidence: 0.6,
        });
        improvements.push('Focus more directly on the requested topic');
      } else if (topicCoverage > 0.7) {
        strengths.push('Highly relevant to the topic');
      }
    }

    // Check for tangential content
    const tangentialMarkers = [
      /\b(by the way|incidentally|unrelated|off topic|speaking of)\b/gi,
    ];

    for (const pattern of tangentialMarkers) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        findings.push({
          id: `relevance_${Date.now()}_2`,
          dimension: CritiqueDimension.RELEVANCE,
          severity: CritiqueSeverity.MINOR,
          description: 'Contains potentially off-topic content',
          reasoning: 'Found tangential content markers',
          confidence: 0.5,
        });
        improvements.push('Remove or minimize tangential content');
        break;
      }
    }
  }

  /**
   * Analyze structure dimension
   */
  private analyzeStructure(
    text: string,
    findings: CritiqueFinding[],
    strengths: string[],
    improvements: string[]
  ): void {
    // Check for paragraphs
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

    if (paragraphs.length === 1 && text.length > 500) {
      findings.push({
        id: `structure_${Date.now()}_1`,
        dimension: CritiqueDimension.STRUCTURE,
        severity: CritiqueSeverity.MINOR,
        description: 'Long response without paragraph breaks',
        reasoning: 'Large blocks of text are hard to read',
        suggestedFix: 'Break content into logical paragraphs',
        confidence: 0.9,
      });
      improvements.push('Add paragraph breaks for better readability');
    } else if (paragraphs.length >= 2) {
      strengths.push('Well-organized into paragraphs');
    }

    // Check for headings/sections
    const headings = text.match(/^#{1,6}\s.+$/gm) ?? [];
    const bullets = text.match(/^[-*]\s.+$/gm) ?? [];
    const numberedLists = text.match(/^\d+\.\s.+$/gm) ?? [];

    if (headings.length > 0 || bullets.length >= 3 || numberedLists.length >= 3) {
      strengths.push('Uses formatting elements for organization');
    } else if (text.length > 300) {
      findings.push({
        id: `structure_${Date.now()}_2`,
        dimension: CritiqueDimension.STRUCTURE,
        severity: CritiqueSeverity.SUGGESTION,
        description: 'Could benefit from headings or lists',
        reasoning: 'Formatting helps readers navigate content',
        suggestedFix: 'Consider adding headings or bullet points',
        confidence: 0.5,
      });
      improvements.push('Consider adding headings or lists');
    }
  }

  /**
   * Calculate dimension score based on findings and strengths
   */
  private calculateDimensionScore(
    findings: CritiqueFinding[],
    strengths: string[]
  ): number {
    let score = 70; // Base score

    // Deduct for findings
    for (const finding of findings) {
      switch (finding.severity) {
        case CritiqueSeverity.CRITICAL:
          score -= 25;
          break;
        case CritiqueSeverity.MAJOR:
          score -= 15;
          break;
        case CritiqueSeverity.MINOR:
          score -= 8;
          break;
        case CritiqueSeverity.SUGGESTION:
          score -= 3;
          break;
      }
    }

    // Add for strengths
    score += strengths.length * 8;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate overall score from dimension scores
   */
  private calculateOverallScore(dimensionScores: DimensionScore[]): number {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const ds of dimensionScores) {
      weightedSum += ds.score * ds.weight;
      totalWeight += ds.weight;
    }

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }

  /**
   * Generate improvement suggestions from findings
   */
  private generateImprovements(
    findings: CritiqueFinding[],
    _input: SelfCritiqueInput
  ): ImprovementSuggestion[] {
    const improvements: ImprovementSuggestion[] = [];

    // Sort findings by severity
    const sortedFindings = [...findings].sort((a, b) => {
      const severityOrder = {
        [CritiqueSeverity.CRITICAL]: 0,
        [CritiqueSeverity.MAJOR]: 1,
        [CritiqueSeverity.MINOR]: 2,
        [CritiqueSeverity.SUGGESTION]: 3,
      };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    for (let i = 0; i < sortedFindings.length; i++) {
      const finding = sortedFindings[i];

      improvements.push({
        id: `imp_${Date.now()}_${i}`,
        priority: i + 1,
        dimension: finding.dimension,
        description: finding.suggestedFix ?? finding.description,
        originalText: finding.originalText,
        improvedText: finding.suggestedFix,
        estimatedImpact: this.estimateImpact(finding),
        effort: this.estimateEffort(finding),
      });
    }

    return improvements;
  }

  /**
   * Estimate impact of addressing a finding
   */
  private estimateImpact(finding: CritiqueFinding): number {
    switch (finding.severity) {
      case CritiqueSeverity.CRITICAL:
        return 25;
      case CritiqueSeverity.MAJOR:
        return 15;
      case CritiqueSeverity.MINOR:
        return 8;
      case CritiqueSeverity.SUGGESTION:
        return 3;
      default:
        return 5;
    }
  }

  /**
   * Estimate effort to address a finding
   */
  private estimateEffort(finding: CritiqueFinding): 'low' | 'medium' | 'high' {
    // Structural changes are higher effort
    if (finding.dimension === CritiqueDimension.STRUCTURE) {
      return 'medium';
    }

    // Accuracy issues need careful review
    if (finding.dimension === CritiqueDimension.ACCURACY) {
      return 'high';
    }

    // Most other issues are relatively quick to fix
    switch (finding.severity) {
      case CritiqueSeverity.CRITICAL:
        return 'high';
      case CritiqueSeverity.MAJOR:
        return 'medium';
      default:
        return 'low';
    }
  }

  /**
   * Apply simple text improvements (when no callback provided)
   */
  private applySimpleImprovements(
    text: string,
    improvements: ImprovementSuggestion[]
  ): string {
    let improvedText = text;

    for (const imp of improvements) {
      if (imp.originalText && imp.improvedText) {
        improvedText = improvedText.replace(imp.originalText, imp.improvedText);
      }
    }

    return improvedText;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a self-critique engine
 */
export function createSelfCritiqueEngine(
  config?: SelfCritiqueConfig
): SelfCritiqueEngine {
  return new SelfCritiqueEngine(config);
}

/**
 * Create a strict self-critique engine (higher standards)
 */
export function createStrictSelfCritiqueEngine(
  config?: Omit<SelfCritiqueConfig, 'passThreshold'>
): SelfCritiqueEngine {
  return new SelfCritiqueEngine({
    ...config,
    passThreshold: 85,
  });
}

/**
 * Create a lenient self-critique engine (lower standards)
 */
export function createLenientSelfCritiqueEngine(
  config?: Omit<SelfCritiqueConfig, 'passThreshold'>
): SelfCritiqueEngine {
  return new SelfCritiqueEngine({
    ...config,
    passThreshold: 60,
  });
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const SelfCritiqueInputSchema = z.object({
  responseId: z.string().min(1),
  userId: z.string().min(1),
  sessionId: z.string().min(1),
  responseText: z.string().min(10),
  responseType: z.enum([
    'explanation',
    'answer',
    'hint',
    'feedback',
    'assessment',
    'recommendation',
    'clarification',
  ]),
  topic: z.string().optional(),
  context: z
    .object({
      courseId: z.string().optional(),
      chapterId: z.string().optional(),
      sectionId: z.string().optional(),
      questionText: z.string().optional(),
      studentLevel: z.string().optional(),
      previousAttempts: z.number().optional(),
      relatedConcepts: z.array(z.string()).optional(),
    })
    .optional(),
  targetAudience: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  learningObjectives: z.array(z.string()).optional(),
  enabledDimensions: z
    .array(
      z.enum([
        'accuracy',
        'clarity',
        'completeness',
        'pedagogy',
        'engagement',
        'safety',
        'relevance',
        'structure',
      ])
    )
    .optional(),
  passThreshold: z.number().min(0).max(100).optional(),
  iteration: z.number().int().positive().optional(),
  previousScore: z.number().min(0).max(100).optional(),
});

export const SelfCritiqueLoopInputSchema = SelfCritiqueInputSchema.extend({
  maxIterations: z.number().int().min(1).max(10).optional(),
  minImprovement: z.number().min(0).max(100).optional(),
});
