/**
 * Self-Evaluation Service
 *
 * Confidence scoring, response verification, and quality tracking.
 * Provides the self-assessment layer that determines when SAM
 * should flag low-confidence or unverified responses.
 */

import {
  ConfidenceScorer,
  ResponseVerifier,
  QualityTracker,
  createConfidenceScorer,
  createResponseVerifier,
  createQualityTracker,
  type ConfidenceScore,
  type VerificationResult,
  ConfidenceLevel,
} from '@sam-ai/agentic';

import { getTaxomindContext } from '../taxomind-context';
import type { AgenticLogger } from './types';

// ============================================================================
// SERVICE
// ============================================================================

export class SelfEvaluationService {
  private confidenceScorer?: ConfidenceScorer;
  private responseVerifier?: ResponseVerifier;
  private qualityTracker?: QualityTracker;

  constructor(
    private readonly userId: string,
    private readonly logger: AgenticLogger,
    private readonly usePrismaStores: boolean,
  ) {}

  /** Initialize self-evaluation components */
  initialize(): void {
    const stores = this.usePrismaStores ? getTaxomindContext().stores : undefined;

    this.confidenceScorer = createConfidenceScorer({
      logger: this.logger,
      store: stores?.confidenceScore,
    });
    this.responseVerifier = createResponseVerifier({
      logger: this.logger,
      store: stores?.verificationResult,
    });
    this.qualityTracker = createQualityTracker({
      logger: this.logger,
      qualityStore: stores?.qualityRecord,
      calibrationStore: stores?.calibration,
    });

    this.logger.debug('Self-Evaluation initialized');
  }

  // --------------------------------------------------------------------------
  // Public methods
  // --------------------------------------------------------------------------

  async scoreConfidence(
    responseText: string,
    context?: {
      responseId?: string;
      sessionId?: string;
      topic?: string;
      responseType?: 'explanation' | 'answer' | 'hint' | 'feedback' | 'assessment' | 'recommendation' | 'clarification';
    },
  ): Promise<ConfidenceScore> {
    if (!this.confidenceScorer) {
      throw new Error('Self-Evaluation not enabled');
    }

    const score = await this.confidenceScorer.scoreResponse({
      responseId: context?.responseId ?? `response_${Date.now()}`,
      userId: this.userId,
      sessionId: context?.sessionId ?? `session_${Date.now()}`,
      responseText,
      responseType: context?.responseType ?? 'explanation',
      topic: context?.topic,
    });

    this.logger.debug('Confidence scored', {
      level: score.level,
      score: score.overallScore,
    });

    return score;
  }

  async verifyResponse(
    responseText: string,
    context?: {
      responseId?: string;
      claims?: string[];
      strictMode?: boolean;
    },
  ): Promise<VerificationResult> {
    if (!this.responseVerifier) {
      throw new Error('Self-Evaluation not enabled');
    }

    const result = await this.responseVerifier.verifyResponse({
      responseId: context?.responseId ?? `response_${Date.now()}`,
      userId: this.userId,
      responseText,
      claims: context?.claims,
      strictMode: context?.strictMode,
    });

    this.logger.debug('Response verified', {
      status: result.status,
      issueCount: result.issues?.length ?? 0,
    });

    return result;
  }

  async checkQuality(response: string): Promise<boolean> {
    if (!this.confidenceScorer) {
      throw new Error('Self-Evaluation not enabled');
    }

    const score = await this.scoreConfidence(response);
    return score.level !== ConfidenceLevel.LOW;
  }

  // --------------------------------------------------------------------------
  // Capability checks
  // --------------------------------------------------------------------------

  hasConfidenceScorer(): boolean {
    return !!this.confidenceScorer;
  }

  hasResponseVerifier(): boolean {
    return !!this.responseVerifier;
  }

  isEnabled(): boolean {
    return !!this.confidenceScorer;
  }
}
