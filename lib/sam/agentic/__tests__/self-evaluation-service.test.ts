/**
 * Unit tests for SelfEvaluationService
 *
 * Tests confidence scoring, response verification, and quality checking.
 * Mock collaborators are injected directly into private fields to bypass
 * workspace ESM resolution issues with @sam-ai/agentic factories.
 */

import { ConfidenceLevel } from '@sam-ai/agentic';
import type { ConfidenceScore, VerificationResult } from '@sam-ai/agentic';
import type { AgenticLogger } from '../types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../../taxomind-context', () => ({
  getTaxomindContext: jest.fn(() => ({
    stores: {
      confidenceScore: {},
      verificationResult: {},
      qualityRecord: {},
      calibration: {},
    },
  })),
}));

import { SelfEvaluationService } from '../self-evaluation-service';

// ---------------------------------------------------------------------------
// Service accessor type -- used to inject mock collaborators
// ---------------------------------------------------------------------------

const mockScoreResponse = jest.fn();
const mockVerifyResponse = jest.fn();

interface ServiceInternals {
  confidenceScorer?: { scoreResponse: jest.Mock };
  responseVerifier?: { verifyResponse: jest.Mock };
  qualityTracker?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createLogger(): AgenticLogger {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

function createServiceWithMocks(
  userId: string,
  logger: AgenticLogger,
  options: { withScorer?: boolean; withVerifier?: boolean } = {},
): SelfEvaluationService {
  const svc = new SelfEvaluationService(userId, logger, false);
  const internals = svc as unknown as ServiceInternals;

  if (options.withScorer !== false) {
    internals.confidenceScorer = { scoreResponse: mockScoreResponse };
  }
  if (options.withVerifier !== false) {
    internals.responseVerifier = { verifyResponse: mockVerifyResponse };
  }
  internals.qualityTracker = {};

  return svc;
}

function buildConfidenceScore(overrides: Partial<ConfidenceScore> = {}): ConfidenceScore {
  return {
    id: 'cs_1',
    responseId: 'response_1',
    userId: 'user_1',
    sessionId: 'session_1',
    overallScore: 0.85,
    level: ConfidenceLevel.HIGH,
    factors: [],
    responseType: 'explanation',
    complexity: 'intermediate',
    shouldVerify: false,
    scoredAt: new Date('2025-01-15'),
    ...overrides,
  };
}

function buildVerificationResult(overrides: Partial<VerificationResult> = {}): VerificationResult {
  return {
    id: 'vr_1',
    responseId: 'response_1',
    userId: 'user_1',
    status: 'verified',
    overallAccuracy: 0.95,
    factChecks: [],
    totalClaims: 3,
    verifiedClaims: 3,
    contradictedClaims: 0,
    sourceValidations: [],
    issues: [],
    verifiedAt: new Date('2025-01-15'),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SelfEvaluationService', () => {
  let service: SelfEvaluationService;
  let logger: AgenticLogger;

  beforeEach(() => {
    jest.clearAllMocks();
    logger = createLogger();
    service = createServiceWithMocks('user_1', logger);
  });

  // ========================================================================
  // scoreConfidence
  // ========================================================================

  describe('scoreConfidence', () => {
    it('returns a confidence score with overallScore between 0 and 1', async () => {
      const score = buildConfidenceScore({ overallScore: 0.72 });
      mockScoreResponse.mockResolvedValue(score);

      const result = await service.scoreConfidence('TypeScript is a typed superset of JavaScript.');

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(1);
      expect(result.overallScore).toBe(0.72);
    });

    it('passes correct fields to the underlying scorer', async () => {
      const score = buildConfidenceScore();
      mockScoreResponse.mockResolvedValue(score);

      await service.scoreConfidence('Some response text', {
        responseId: 'resp_42',
        sessionId: 'sess_7',
        topic: 'TypeScript Generics',
        responseType: 'answer',
      });

      expect(mockScoreResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          responseId: 'resp_42',
          userId: 'user_1',
          sessionId: 'sess_7',
          responseText: 'Some response text',
          responseType: 'answer',
          topic: 'TypeScript Generics',
        }),
      );
    });

    it('generates default responseId and sessionId when context is omitted', async () => {
      const score = buildConfidenceScore();
      mockScoreResponse.mockResolvedValue(score);

      await service.scoreConfidence('A response without context');

      const callArg = mockScoreResponse.mock.calls[0][0] as Record<string, unknown>;
      expect(callArg.responseId).toMatch(/^response_/);
      expect(callArg.sessionId).toMatch(/^session_/);
      expect(callArg.responseType).toBe('EXPLANATION');
    });

    it('handles empty response text by delegating to the scorer', async () => {
      const lowScore = buildConfidenceScore({
        overallScore: 0.1,
        level: ConfidenceLevel.LOW,
      });
      mockScoreResponse.mockResolvedValue(lowScore);

      const result = await service.scoreConfidence('');

      expect(result.level).toBe(ConfidenceLevel.LOW);
      expect(result.overallScore).toBe(0.1);
    });

    it('logs the confidence level and score', async () => {
      const score = buildConfidenceScore({
        level: ConfidenceLevel.MEDIUM,
        overallScore: 0.6,
      });
      mockScoreResponse.mockResolvedValue(score);

      await service.scoreConfidence('Test text');

      expect(logger.debug).toHaveBeenCalledWith(
        'Confidence scored',
        expect.objectContaining({ level: ConfidenceLevel.MEDIUM, score: 0.6 }),
      );
    });

    it('throws when the service has no confidenceScorer', async () => {
      const uninitService = createServiceWithMocks('user_1', logger, {
        withScorer: false,
      });
      (uninitService as unknown as ServiceInternals).confidenceScorer = undefined;

      await expect(uninitService.scoreConfidence('text')).rejects.toThrow(
        'Self-Evaluation not enabled',
      );
    });
  });

  // ========================================================================
  // verifyResponse
  // ========================================================================

  describe('verifyResponse', () => {
    it('returns verified status for a high-accuracy response', async () => {
      const result = buildVerificationResult({
        status: 'verified',
        overallAccuracy: 0.95,
      });
      mockVerifyResponse.mockResolvedValue(result);

      const verification = await service.verifyResponse(
        'TypeScript supports type inference.',
      );

      expect(verification.status).toBe('verified');
      expect(verification.overallAccuracy).toBeGreaterThanOrEqual(0.9);
    });

    it('returns contradicted status for a low-accuracy response', async () => {
      const result = buildVerificationResult({
        status: 'contradicted',
        overallAccuracy: 0.2,
        contradictedClaims: 2,
        issues: [
          {
            type: 'factual_error',
            severity: 'high',
            description: 'Incorrect claim about runtime behavior',
            location: 'sentence 2',
          },
        ],
      });
      mockVerifyResponse.mockResolvedValue(result);

      const verification = await service.verifyResponse(
        'JavaScript variables are always block-scoped by default.',
      );

      expect(verification.status).toBe('contradicted');
      expect(verification.contradictedClaims).toBeGreaterThan(0);
      expect(verification.issues).toHaveLength(1);
    });

    it('passes claims and strictMode from context to the verifier', async () => {
      const result = buildVerificationResult();
      mockVerifyResponse.mockResolvedValue(result);

      await service.verifyResponse('Some text with claims', {
        responseId: 'resp_99',
        claims: ['Claim A', 'Claim B'],
        strictMode: true,
      });

      expect(mockVerifyResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          responseId: 'resp_99',
          userId: 'user_1',
          responseText: 'Some text with claims',
          claims: ['Claim A', 'Claim B'],
          strictMode: true,
        }),
      );
    });

    it('logs status and issue count after verification', async () => {
      const result = buildVerificationResult({
        status: 'partially_verified',
        issues: [
          {
            type: 'factual_error',
            severity: 'medium',
            description: 'Unclear phrasing',
            location: 'paragraph 1',
          },
          {
            type: 'factual_error',
            severity: 'low',
            description: 'Minor inaccuracy',
            location: 'paragraph 2',
          },
        ],
      });
      mockVerifyResponse.mockResolvedValue(result);

      await service.verifyResponse('Partially correct text');

      expect(logger.debug).toHaveBeenCalledWith(
        'Response verified',
        expect.objectContaining({ status: 'partially_verified', issueCount: 2 }),
      );
    });

    it('throws when the service has no responseVerifier', async () => {
      const uninitService = createServiceWithMocks('user_1', logger, {
        withVerifier: false,
      });
      (uninitService as unknown as ServiceInternals).responseVerifier = undefined;

      await expect(uninitService.verifyResponse('text')).rejects.toThrow(
        'Self-Evaluation not enabled',
      );
    });
  });

  // ========================================================================
  // checkQuality
  // ========================================================================

  describe('checkQuality', () => {
    it('returns true when confidence level is HIGH', async () => {
      const score = buildConfidenceScore({ level: ConfidenceLevel.HIGH });
      mockScoreResponse.mockResolvedValue(score);

      const quality = await service.checkQuality('High quality explanation.');

      expect(quality).toBe(true);
    });

    it('returns true when confidence level is MEDIUM', async () => {
      const score = buildConfidenceScore({ level: ConfidenceLevel.MEDIUM });
      mockScoreResponse.mockResolvedValue(score);

      const quality = await service.checkQuality('Decent explanation.');

      expect(quality).toBe(true);
    });

    it('returns false when confidence level is LOW', async () => {
      const score = buildConfidenceScore({ level: ConfidenceLevel.LOW });
      mockScoreResponse.mockResolvedValue(score);

      const quality = await service.checkQuality('Poor quality text.');

      expect(quality).toBe(false);
    });

    it('returns true when confidence level is UNCERTAIN (not LOW)', async () => {
      const score = buildConfidenceScore({ level: ConfidenceLevel.UNCERTAIN });
      mockScoreResponse.mockResolvedValue(score);

      const quality = await service.checkQuality('Uncertain quality text.');

      expect(quality).toBe(true);
    });

    it('throws when the service has no confidenceScorer', async () => {
      const uninitService = createServiceWithMocks('user_1', logger, {
        withScorer: false,
      });
      (uninitService as unknown as ServiceInternals).confidenceScorer = undefined;

      await expect(uninitService.checkQuality('text')).rejects.toThrow(
        'Self-Evaluation not enabled',
      );
    });
  });

  // ========================================================================
  // Capability checks
  // ========================================================================

  describe('capability checks', () => {
    it('hasConfidenceScorer returns true when scorer is present', () => {
      expect(service.hasConfidenceScorer()).toBe(true);
    });

    it('hasResponseVerifier returns true when verifier is present', () => {
      expect(service.hasResponseVerifier()).toBe(true);
    });

    it('isEnabled returns true when confidenceScorer is present', () => {
      expect(service.isEnabled()).toBe(true);
    });

    it('isEnabled returns false when service has no scorer', () => {
      const uninitService = new SelfEvaluationService('user_1', logger, false);
      expect(uninitService.isEnabled()).toBe(false);
    });
  });
});
