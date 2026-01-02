/**
 * @sam-ai/agentic - Response Verifier
 * Verifies AI responses against knowledge base and detects issues
 */

import { v4 as uuidv4 } from 'uuid';
import {
  VerificationResult,
  VerificationResultStore,
  VerificationInput,
  VerificationInputSchema,
  VerificationStatus,
  FactCheck,
  FactCheckStatus,
  SourceValidation,
  VerificationIssue,
  IssueType,
  IssueSeverity,
  CorrectionSuggestion,
  SourceReference,
  SourceType,
  SelfEvaluationLogger,
} from './types';

// ============================================================================
// IN-MEMORY STORE
// ============================================================================

/**
 * In-memory implementation of VerificationResultStore
 */
export class InMemoryVerificationResultStore implements VerificationResultStore {
  private results: Map<string, VerificationResult> = new Map();
  private responseIndex: Map<string, string> = new Map();

  async get(id: string): Promise<VerificationResult | null> {
    return this.results.get(id) ?? null;
  }

  async getByResponse(responseId: string): Promise<VerificationResult | null> {
    const resultId = this.responseIndex.get(responseId);
    if (!resultId) return null;
    return this.results.get(resultId) ?? null;
  }

  async getByUser(userId: string, limit?: number): Promise<VerificationResult[]> {
    const userResults = Array.from(this.results.values())
      .filter((result) => result.userId === userId)
      .sort((a, b) => b.verifiedAt.getTime() - a.verifiedAt.getTime());

    return limit ? userResults.slice(0, limit) : userResults;
  }

  async create(result: Omit<VerificationResult, 'id'>): Promise<VerificationResult> {
    const newResult: VerificationResult = {
      ...result,
      id: uuidv4(),
    };
    this.results.set(newResult.id, newResult);
    this.responseIndex.set(newResult.responseId, newResult.id);
    return newResult;
  }

  async update(id: string, updates: Partial<VerificationResult>): Promise<VerificationResult> {
    const result = this.results.get(id);
    if (!result) {
      throw new Error(`Verification result not found: ${id}`);
    }
    const updatedResult: VerificationResult = {
      ...result,
      ...updates,
      id: result.id,
    };
    this.results.set(id, updatedResult);
    return updatedResult;
  }

  async getIssuesByType(type: IssueType, since?: Date): Promise<VerificationIssue[]> {
    const issues: VerificationIssue[] = [];

    for (const result of this.results.values()) {
      if (since && result.verifiedAt < since) continue;

      for (const issue of result.issues) {
        if (issue.type === type) {
          issues.push(issue);
        }
      }
    }

    return issues;
  }
}

// ============================================================================
// DEFAULT LOGGER
// ============================================================================

const defaultLogger: SelfEvaluationLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

// ============================================================================
// RESPONSE VERIFIER
// ============================================================================

/**
 * Configuration for ResponseVerifier
 */
export interface ResponseVerifierConfig {
  store?: VerificationResultStore;
  logger?: SelfEvaluationLogger;
  strictModeThreshold?: number;
  claimExtractionPatterns?: RegExp[];
  issueThresholds?: Partial<Record<IssueType, number>>;
}

/**
 * Knowledge base entry for verification
 */
export interface KnowledgeBaseEntry {
  id: string;
  content: string;
  topic: string;
  reliability: number;
  lastUpdated: Date;
}

/**
 * Response Verifier
 * Verifies AI responses against knowledge and detects issues
 */
export class ResponseVerifier {
  private store: VerificationResultStore;
  private logger: SelfEvaluationLogger;
  private claimExtractionPatterns: RegExp[];

  constructor(config: ResponseVerifierConfig = {}) {
    this.store = config.store ?? new InMemoryVerificationResultStore();
    this.logger = config.logger ?? defaultLogger;
    this.claimExtractionPatterns = config.claimExtractionPatterns ?? [
      // Factual statements
      /(?:is|are|was|were|has|have|can|will|must)\s+[^.!?]+[.!?]/gi,
      // Definitions
      /(?:means?|refers?\s+to|is\s+defined\s+as|is\s+known\s+as)\s+[^.!?]+[.!?]/gi,
      // Cause and effect
      /(?:because|therefore|thus|hence|causes?|results?\s+in)\s+[^.!?]+[.!?]/gi,
    ];
  }

  /**
   * Verify a response
   */
  async verifyResponse(input: VerificationInput): Promise<VerificationResult> {
    const validated = VerificationInputSchema.parse(input);

    this.logger.info('Verifying response', {
      responseId: validated.responseId,
      strictMode: validated.strictMode,
    });

    // Cast sources to proper type after Zod validation
    const typedSources: SourceReference[] | undefined = validated.sources?.map((s) => ({
      ...s,
      type: s.type as SourceType,
    }));

    // Extract claims if not provided
    const claims = validated.claims ?? this.extractClaims(validated.responseText);

    // Perform fact checks
    const factChecks = await this.performFactChecks(claims, typedSources);

    // Validate sources
    const sourceValidations = this.validateSources(typedSources);

    // Detect issues
    const issues = await this.detectIssues(
      validated.responseText,
      factChecks,
      validated.strictMode
    );

    // Generate correction suggestions for issues
    const corrections = this.generateCorrections(issues, validated.responseText);

    // Calculate overall accuracy
    const verifiedCount = factChecks.filter(
      (fc) =>
        fc.status === FactCheckStatus.CONFIRMED ||
        fc.status === FactCheckStatus.LIKELY_CORRECT
    ).length;
    const contradictedCount = factChecks.filter(
      (fc) =>
        fc.status === FactCheckStatus.INCORRECT ||
        fc.status === FactCheckStatus.LIKELY_INCORRECT
    ).length;

    const overallAccuracy =
      claims.length > 0 ? (verifiedCount - contradictedCount * 0.5) / claims.length : 1;

    // Determine status
    const status = this.determineStatus(overallAccuracy, issues, contradictedCount);

    const result: VerificationResult = {
      id: '',
      responseId: validated.responseId,
      userId: validated.userId,
      status,
      overallAccuracy: Math.max(0, Math.min(1, overallAccuracy)),
      factChecks,
      totalClaims: claims.length,
      verifiedClaims: verifiedCount,
      contradictedClaims: contradictedCount,
      sourceValidations,
      issues,
      corrections: corrections.length > 0 ? corrections : undefined,
      verifiedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    const savedResult = await this.store.create(result);

    this.logger.info('Verification complete', {
      responseId: validated.responseId,
      status,
      accuracy: overallAccuracy.toFixed(2),
      issues: issues.length,
    });

    return savedResult;
  }

  /**
   * Get verification result for a response
   */
  async getVerification(responseId: string): Promise<VerificationResult | null> {
    return this.store.getByResponse(responseId);
  }

  /**
   * Get user's verification history
   */
  async getUserHistory(userId: string, limit?: number): Promise<VerificationResult[]> {
    return this.store.getByUser(userId, limit);
  }

  /**
   * Get issues by type
   */
  async getIssuesByType(type: IssueType, since?: Date): Promise<VerificationIssue[]> {
    return this.store.getIssuesByType(type, since);
  }

  /**
   * Quick verification check without storing
   */
  async quickVerify(
    responseText: string,
    sources?: SourceReference[]
  ): Promise<{
    status: VerificationStatus;
    accuracy: number;
    issueCount: number;
    criticalIssues: number;
  }> {
    const claims = this.extractClaims(responseText);
    const factChecks = await this.performFactChecks(claims, sources);
    const issues = await this.detectIssues(responseText, factChecks, false);

    const verifiedCount = factChecks.filter(
      (fc) =>
        fc.status === FactCheckStatus.CONFIRMED ||
        fc.status === FactCheckStatus.LIKELY_CORRECT
    ).length;
    const contradictedCount = factChecks.filter(
      (fc) =>
        fc.status === FactCheckStatus.INCORRECT ||
        fc.status === FactCheckStatus.LIKELY_INCORRECT
    ).length;

    const accuracy =
      claims.length > 0 ? (verifiedCount - contradictedCount * 0.5) / claims.length : 1;
    const status = this.determineStatus(accuracy, issues, contradictedCount);
    const criticalIssues = issues.filter(
      (i) => i.severity === IssueSeverity.CRITICAL || i.severity === IssueSeverity.HIGH
    ).length;

    return {
      status,
      accuracy: Math.max(0, Math.min(1, accuracy)),
      issueCount: issues.length,
      criticalIssues,
    };
  }

  /**
   * Validate a single claim
   */
  async validateClaim(
    claim: string,
    sources?: SourceReference[]
  ): Promise<FactCheck> {
    const factChecks = await this.performFactChecks([claim], sources);
    return factChecks[0];
  }

  /**
   * Extract claims from text
   */
  extractClaims(text: string): string[] {
    const claims = new Set<string>();

    // Split into sentences
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);

    for (const sentence of sentences) {
      const trimmed = sentence.trim();

      // Check if sentence matches claim patterns
      for (const pattern of this.claimExtractionPatterns) {
        const matches = trimmed.match(pattern);
        if (matches) {
          for (const match of matches) {
            if (match.length > 15 && match.length < 300) {
              claims.add(match.trim());
            }
          }
        }
      }

      // Also add sentences that look like factual statements
      if (this.looksFactual(trimmed) && trimmed.length > 15 && trimmed.length < 300) {
        claims.add(trimmed);
      }
    }

    return Array.from(claims).slice(0, 20); // Limit to 20 claims
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async performFactChecks(
    claims: string[],
    sources?: SourceReference[]
  ): Promise<FactCheck[]> {
    const factChecks: FactCheck[] = [];

    for (const claim of claims) {
      const factCheck = await this.checkFact(claim, sources);
      factChecks.push(factCheck);
    }

    return factChecks;
  }

  private async checkFact(claim: string, sources?: SourceReference[]): Promise<FactCheck> {
    // Analyze claim characteristics
    const analysis = this.analyzeClaim(claim);

    // Calculate confidence based on sources and claim type
    let confidence = 0.5; // Base confidence
    let status: FactCheckStatus = FactCheckStatus.UNCERTAIN;
    const supportingEvidence: string[] = [];
    const contradictingEvidence: string[] = [];
    const sourceIds: string[] = [];

    if (sources && sources.length > 0) {
      // Check against sources
      for (const source of sources) {
        sourceIds.push(source.id);

        // Weight by source reliability and type
        const sourceWeight = source.reliability * this.getSourceTypeWeight(source.type);

        // In a real implementation, this would use semantic similarity
        // to compare claim against source content
        if (sourceWeight > 0.7) {
          supportingEvidence.push(`Supported by ${source.title}`);
          confidence += sourceWeight * 0.2;
        }
      }
    }

    // Adjust based on claim characteristics
    if (analysis.containsNumbers) {
      // Numerical claims need more verification
      confidence -= 0.1;
    }

    if (analysis.isDefinition) {
      // Definitions are usually more verifiable
      confidence += 0.1;
    }

    if (analysis.containsHedging) {
      // Hedged claims are harder to verify
      status = FactCheckStatus.NOT_VERIFIABLE;
    } else if (analysis.isAbsolute) {
      // Absolute claims need strong evidence
      confidence -= 0.15;
    }

    // Determine status based on confidence
    if (status !== FactCheckStatus.NOT_VERIFIABLE) {
      if (confidence >= 0.8) {
        status = FactCheckStatus.CONFIRMED;
      } else if (confidence >= 0.65) {
        status = FactCheckStatus.LIKELY_CORRECT;
      } else if (confidence >= 0.4) {
        status = FactCheckStatus.UNCERTAIN;
      } else if (confidence >= 0.25) {
        status = FactCheckStatus.LIKELY_INCORRECT;
      } else {
        status = FactCheckStatus.INCORRECT;
      }
    }

    return {
      id: uuidv4(),
      claim,
      status,
      confidence: Math.max(0, Math.min(1, confidence)),
      supportingEvidence: supportingEvidence.length > 0 ? supportingEvidence : undefined,
      contradictingEvidence: contradictingEvidence.length > 0 ? contradictingEvidence : undefined,
      sources: sourceIds,
    };
  }

  private analyzeClaim(claim: string): {
    containsNumbers: boolean;
    isDefinition: boolean;
    containsHedging: boolean;
    isAbsolute: boolean;
  } {
    const lowerClaim = claim.toLowerCase();

    return {
      containsNumbers: /\d+/.test(claim),
      isDefinition: /(?:is defined as|means|refers to|is known as)/.test(lowerClaim),
      containsHedging: /(?:might|maybe|perhaps|possibly|could|may|sometimes|often)/.test(
        lowerClaim
      ),
      isAbsolute: /(?:always|never|all|none|every|must|definitely|certainly)/.test(lowerClaim),
    };
  }

  private getSourceTypeWeight(type: SourceType | string): number {
    const weights: Record<string, number> = {
      [SourceType.ACADEMIC_PAPER]: 1.0,
      [SourceType.TEXTBOOK]: 0.95,
      [SourceType.DOCUMENTATION]: 0.9,
      [SourceType.EXPERT_REVIEW]: 0.9,
      [SourceType.COURSE_CONTENT]: 0.85,
      [SourceType.KNOWLEDGE_BASE]: 0.8,
      [SourceType.GENERATED]: 0.5,
    };
    return weights[type] ?? 0.5;
  }

  private validateSources(sources?: SourceReference[]): SourceValidation[] {
    if (!sources || sources.length === 0) {
      return [];
    }

    return sources.map((source) => ({
      sourceId: source.id,
      isValid: source.reliability >= 0.5,
      reliability: source.reliability,
      lastChecked: new Date(),
      issues: source.reliability < 0.5 ? ['Low reliability score'] : undefined,
    }));
  }

  private async detectIssues(
    responseText: string,
    factChecks: FactCheck[],
    strictMode?: boolean
  ): Promise<VerificationIssue[]> {
    const issues: VerificationIssue[] = [];

    // Check for factual errors from fact checks
    for (const factCheck of factChecks) {
      if (
        factCheck.status === FactCheckStatus.INCORRECT ||
        factCheck.status === FactCheckStatus.LIKELY_INCORRECT
      ) {
        issues.push({
          id: uuidv4(),
          type: IssueType.FACTUAL_ERROR,
          severity:
            factCheck.status === FactCheckStatus.INCORRECT
              ? IssueSeverity.CRITICAL
              : IssueSeverity.HIGH,
          description: `Potential factual error: "${factCheck.claim.substring(0, 100)}..."`,
          relatedClaims: [factCheck.id],
          suggestedFix: 'Review and correct this claim against authoritative sources',
        });
      }
    }

    // Check for oversimplification
    if (this.detectOversimplification(responseText)) {
      issues.push({
        id: uuidv4(),
        type: IssueType.OVERSIMPLIFICATION,
        severity: IssueSeverity.MEDIUM,
        description: 'Response may oversimplify complex concepts',
        suggestedFix: 'Consider adding nuance or acknowledging complexity',
      });
    }

    // Check for ambiguous statements
    const ambiguousStatements = this.detectAmbiguity(responseText);
    for (const statement of ambiguousStatements) {
      issues.push({
        id: uuidv4(),
        type: IssueType.AMBIGUOUS_STATEMENT,
        severity: IssueSeverity.LOW,
        description: `Ambiguous statement: "${statement.substring(0, 80)}..."`,
        location: statement,
        suggestedFix: 'Provide more specific or concrete information',
      });
    }

    // Check for potential misconceptions
    const misconceptions = this.detectPotentialMisconceptions(responseText);
    for (const misconception of misconceptions) {
      issues.push({
        id: uuidv4(),
        type: IssueType.POTENTIAL_MISCONCEPTION,
        severity: IssueSeverity.HIGH,
        description: misconception.description,
        location: misconception.text,
        suggestedFix: misconception.fix,
      });
    }

    // Check for incomplete explanations (strict mode)
    if (strictMode) {
      if (this.detectIncompleteExplanation(responseText)) {
        issues.push({
          id: uuidv4(),
          type: IssueType.INCOMPLETE_EXPLANATION,
          severity: IssueSeverity.MEDIUM,
          description: 'Explanation may be incomplete or missing important context',
          suggestedFix: 'Consider adding more context or prerequisite information',
        });
      }

      // Check for logical inconsistencies
      const inconsistencies = this.detectLogicalInconsistencies(responseText);
      for (const inconsistency of inconsistencies) {
        issues.push({
          id: uuidv4(),
          type: IssueType.LOGICAL_INCONSISTENCY,
          severity: IssueSeverity.HIGH,
          description: inconsistency,
          suggestedFix: 'Review logic and ensure statements are consistent',
        });
      }
    }

    return issues;
  }

  private detectOversimplification(text: string): boolean {
    // Check for oversimplification indicators
    const simplificationMarkers = [
      'simply',
      'just',
      'only',
      'always',
      'never',
      'all you need',
      'the only way',
    ];

    const markerCount = simplificationMarkers.filter((marker) =>
      text.toLowerCase().includes(marker)
    ).length;

    // Also check for very short explanations of complex topics
    const wordCount = text.split(/\s+/).length;
    const hasTechnicalTerms = /(?:algorithm|function|variable|interface|protocol|architecture)/i.test(
      text
    );

    return markerCount >= 2 || (hasTechnicalTerms && wordCount < 50);
  }

  private detectAmbiguity(text: string): string[] {
    const ambiguousStatements: string[] = [];
    const sentences = text.split(/[.!?]+/);

    const ambiguityPatterns = [
      /\b(?:it|this|that|these|those)\s+(?:is|are|can|will|should)\b/i,
      /\b(?:sometimes|often|usually|generally|typically)\b/i,
      /\b(?:some|many|few|several)\s+\w+s?\b/i,
    ];

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length < 10) continue;

      for (const pattern of ambiguityPatterns) {
        if (pattern.test(trimmed)) {
          ambiguousStatements.push(trimmed);
          break;
        }
      }
    }

    return ambiguousStatements.slice(0, 3); // Limit to 3
  }

  private detectPotentialMisconceptions(
    text: string
  ): Array<{ text: string; description: string; fix: string }> {
    const misconceptions: Array<{ text: string; description: string; fix: string }> = [];

    // Common programming misconceptions
    const misconceptionPatterns: Array<{
      pattern: RegExp;
      description: string;
      fix: string;
    }> = [
      {
        pattern: /\bpass(?:ed)?\s+by\s+reference\b/i,
        description: 'Potential confusion about pass-by-reference semantics',
        fix: 'Clarify whether language uses pass-by-value or pass-by-reference',
      },
      {
        pattern: /\bequal(?:s)?\s+null\b/i,
        description: 'Potential null comparison issue',
        fix: 'Consider mentioning null safety practices',
      },
      {
        pattern: /\bfloating\s+point.*(?:exact|precise|accurate)\b/i,
        description: 'Potential floating-point precision misconception',
        fix: 'Clarify limitations of floating-point arithmetic',
      },
    ];

    for (const mp of misconceptionPatterns) {
      const match = text.match(mp.pattern);
      if (match) {
        misconceptions.push({
          text: match[0],
          description: mp.description,
          fix: mp.fix,
        });
      }
    }

    return misconceptions;
  }

  private detectIncompleteExplanation(text: string): boolean {
    // Check for incomplete explanation indicators
    const wordCount = text.split(/\s+/).length;

    // Very short responses are often incomplete
    if (wordCount < 30) return true;

    // Check if explanation lacks examples
    const hasExamples = /(?:for example|such as|e\.g\.|like|consider)/i.test(text);

    // Check if explanation lacks reasoning
    const hasReasoning = /(?:because|therefore|since|due to|as a result)/i.test(text);

    // An explanation without examples AND reasoning is likely incomplete
    return !hasExamples && !hasReasoning && wordCount < 100;
  }

  private detectLogicalInconsistencies(text: string): string[] {
    const inconsistencies: string[] = [];
    const sentences = text.split(/[.!?]+/).map((s) => s.trim().toLowerCase());

    // Check for contradictory statements
    for (let i = 0; i < sentences.length; i++) {
      for (let j = i + 1; j < sentences.length; j++) {
        if (this.areContradictory(sentences[i], sentences[j])) {
          inconsistencies.push(
            `Potential contradiction between statements at positions ${i + 1} and ${j + 1}`
          );
        }
      }
    }

    return inconsistencies.slice(0, 2); // Limit to 2
  }

  private areContradictory(s1: string, s2: string): boolean {
    // Simple contradiction detection
    // In a real implementation, this would use more sophisticated NLP

    // Check for negation patterns
    const negationPairs = [
      ['is', 'is not'],
      ['can', 'cannot'],
      ['will', 'will not'],
      ['should', 'should not'],
      ['always', 'never'],
      ['true', 'false'],
    ];

    for (const [positive, negative] of negationPairs) {
      if (
        (s1.includes(positive) && s2.includes(negative)) ||
        (s1.includes(negative) && s2.includes(positive))
      ) {
        // Check if they're about the same subject (simple word overlap)
        const words1 = new Set(s1.split(/\s+/).filter((w) => w.length > 4));
        const words2 = new Set(s2.split(/\s+/).filter((w) => w.length > 4));
        const overlap = [...words1].filter((w) => words2.has(w)).length;

        if (overlap >= 2) {
          return true;
        }
      }
    }

    return false;
  }

  private generateCorrections(
    issues: VerificationIssue[],
    _responseText: string
  ): CorrectionSuggestion[] {
    const corrections: CorrectionSuggestion[] = [];

    for (const issue of issues) {
      if (
        issue.severity === IssueSeverity.CRITICAL ||
        issue.severity === IssueSeverity.HIGH
      ) {
        if (issue.location && issue.suggestedFix) {
          corrections.push({
            id: uuidv4(),
            issueId: issue.id,
            originalText: issue.location.substring(0, 200),
            suggestedText: `[Needs revision: ${issue.suggestedFix}]`,
            reasoning: issue.description,
            confidence: issue.severity === IssueSeverity.CRITICAL ? 0.9 : 0.7,
          });
        }
      }
    }

    return corrections;
  }

  private looksFactual(sentence: string): boolean {
    const factualIndicators = [
      /^[A-Z][a-z]+\s+(?:is|are|was|were|has|have)\s/,
      /\b(?:defined|known|called|named|referred)\b/i,
      /\b(?:consists?|contains?|includes?|comprises?)\b/i,
      /\b(?:causes?|results?\s+in|leads?\s+to)\b/i,
    ];

    return factualIndicators.some((pattern) => pattern.test(sentence));
  }

  private determineStatus(
    accuracy: number,
    issues: VerificationIssue[],
    contradictedCount: number
  ): VerificationStatus {
    const criticalIssues = issues.filter(
      (i) => i.severity === IssueSeverity.CRITICAL
    ).length;
    const highIssues = issues.filter((i) => i.severity === IssueSeverity.HIGH).length;

    if (contradictedCount > 0 || criticalIssues > 0) {
      return VerificationStatus.CONTRADICTED;
    }

    if (accuracy >= 0.9 && highIssues === 0) {
      return VerificationStatus.VERIFIED;
    }

    if (accuracy >= 0.7) {
      return VerificationStatus.PARTIALLY_VERIFIED;
    }

    return VerificationStatus.UNVERIFIED;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new ResponseVerifier instance
 */
export function createResponseVerifier(config?: ResponseVerifierConfig): ResponseVerifier {
  return new ResponseVerifier(config);
}
