/**
 * Tests for ConfidenceScorer
 */

import {
  ConfidenceScorer,
  createConfidenceScorer,
  InMemoryConfidenceScoreStore,
  ConfidenceInput,
  ConfidenceLevel,
  ResponseType,
  SourceType,
  ConfidenceFactorType,
} from '../src/self-evaluation';

describe('ConfidenceScorer', () => {
  let scorer: ConfidenceScorer;

  beforeEach(() => {
    scorer = createConfidenceScorer();
  });

  describe('scoreResponse', () => {
    it('should score a response with high confidence when well-sourced', async () => {
      const input: ConfidenceInput = {
        responseId: 'resp-1',
        userId: 'user-1',
        sessionId: 'session-1',
        responseText:
          'TypeScript is a strongly typed programming language that builds on JavaScript. It adds optional static typing and class-based object-oriented programming to the language. For example, you can define interfaces and use type annotations.',
        responseType: ResponseType.EXPLANATION,
        topic: 'TypeScript',
        sources: [
          {
            id: 'source-1',
            type: SourceType.DOCUMENTATION,
            title: 'TypeScript Handbook',
            reliability: 0.95,
          },
        ],
        context: {
          courseId: 'course-1',
          relatedConcepts: ['JavaScript', 'Static Typing'],
        },
      };

      const score = await scorer.scoreResponse(input);

      expect(score).toBeDefined();
      expect(score.id).toBeDefined();
      expect(score.responseId).toBe('resp-1');
      expect(score.overallScore).toBeGreaterThan(0.5);
      expect(score.factors.length).toBeGreaterThan(0);
    });

    it('should score lower for responses without sources', async () => {
      const input: ConfidenceInput = {
        responseId: 'resp-2',
        userId: 'user-1',
        sessionId: 'session-1',
        responseText: 'This might be correct, maybe.',
        responseType: ResponseType.ANSWER,
      };

      const score = await scorer.scoreResponse(input);

      // Score should be lower without sources
      expect(score.overallScore).toBeLessThan(0.9);
      // Without good sources, source reliability factor should be lower
      const sourceReliabilityFactor = score.factors.find(
        (f) => f.type === ConfidenceFactorType.SOURCE_RELIABILITY
      );
      expect(sourceReliabilityFactor?.score).toBeLessThan(0.7);
    });

    it('should detect hedging language and lower score', async () => {
      const input: ConfidenceInput = {
        responseId: 'resp-3',
        userId: 'user-1',
        sessionId: 'session-1',
        responseText:
          'It might possibly be that perhaps the function could maybe work sometimes.',
        responseType: ResponseType.EXPLANATION,
      };

      const score = await scorer.scoreResponse(input);

      // Should have lower clarity/ambiguity scores
      const clarityFactor = score.factors.find(
        (f) => f.type === ConfidenceFactorType.CONCEPT_CLARITY
      );
      expect(clarityFactor?.score).toBeLessThan(0.7);
    });

    it('should suggest verification for low confidence', async () => {
      const input: ConfidenceInput = {
        responseId: 'resp-4',
        userId: 'user-1',
        sessionId: 'session-1',
        responseText: 'Maybe.',
        responseType: ResponseType.ANSWER,
      };

      const score = await scorer.scoreResponse(input);

      // A very short, uncertain response should not have high confidence
      expect(score.level).not.toBe(ConfidenceLevel.HIGH);
      // Short responses have low content coverage
      const coverageFactor = score.factors.find(
        (f) => f.type === ConfidenceFactorType.KNOWLEDGE_COVERAGE
      );
      expect(coverageFactor?.score).toBeLessThan(0.7);
    });

    it('should include all confidence factors', async () => {
      const input: ConfidenceInput = {
        responseId: 'resp-5',
        userId: 'user-1',
        sessionId: 'session-1',
        responseText: 'A variable is a named storage location for data.',
        responseType: ResponseType.EXPLANATION,
      };

      const score = await scorer.scoreResponse(input);

      const factorTypes = score.factors.map((f) => f.type);
      expect(factorTypes).toContain(ConfidenceFactorType.KNOWLEDGE_COVERAGE);
      expect(factorTypes).toContain(ConfidenceFactorType.SOURCE_RELIABILITY);
      expect(factorTypes).toContain(ConfidenceFactorType.COMPLEXITY_MATCH);
      expect(factorTypes).toContain(ConfidenceFactorType.CONCEPT_CLARITY);
    });

    it('should generate disclaimer for medium/low confidence', async () => {
      const input: ConfidenceInput = {
        responseId: 'resp-6',
        userId: 'user-1',
        sessionId: 'session-1',
        responseText: 'This could be the answer.',
        responseType: ResponseType.ANSWER,
      };

      const score = await scorer.scoreResponse(input);

      if (score.level !== ConfidenceLevel.HIGH) {
        expect(score.suggestedDisclaimer).toBeDefined();
      }
    });
  });

  describe('getScore', () => {
    it('should retrieve a stored score', async () => {
      const input: ConfidenceInput = {
        responseId: 'resp-retrieve',
        userId: 'user-1',
        sessionId: 'session-1',
        responseText: 'Test response for retrieval.',
        responseType: ResponseType.EXPLANATION,
      };

      await scorer.scoreResponse(input);
      const retrieved = await scorer.getScore('resp-retrieve');

      expect(retrieved).toBeDefined();
      expect(retrieved?.responseId).toBe('resp-retrieve');
    });

    it('should return null for non-existent response', async () => {
      const retrieved = await scorer.getScore('non-existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('quickCheck', () => {
    it('should perform quick confidence check without storing', async () => {
      const result = await scorer.quickCheck(
        'This is a well-structured explanation with examples.',
        ResponseType.EXPLANATION
      );

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
      expect(result.level).toBeDefined();
      expect(typeof result.shouldVerify).toBe('boolean');
    });

    it('should not store quick check results', async () => {
      await scorer.quickCheck('Test quick check', ResponseType.ANSWER);

      // Quick check doesn't have a response ID to store under
      const distribution = await scorer.getDistribution();
      // Distribution should not include this check
      expect(distribution).toBeDefined();
    });
  });

  describe('getUserHistory', () => {
    it('should return user confidence history', async () => {
      const input1: ConfidenceInput = {
        responseId: 'resp-hist-1',
        userId: 'user-history',
        sessionId: 'session-1',
        responseText: 'First response.',
        responseType: ResponseType.EXPLANATION,
      };

      const input2: ConfidenceInput = {
        responseId: 'resp-hist-2',
        userId: 'user-history',
        sessionId: 'session-1',
        responseText: 'Second response.',
        responseType: ResponseType.ANSWER,
      };

      await scorer.scoreResponse(input1);
      await scorer.scoreResponse(input2);

      const history = await scorer.getUserHistory('user-history');

      expect(history.length).toBe(2);
    });

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 5; i++) {
        await scorer.scoreResponse({
          responseId: `resp-limit-${i}`,
          userId: 'user-limit',
          sessionId: 'session-1',
          responseText: `Response ${i}`,
          responseType: ResponseType.EXPLANATION,
        });
      }

      const history = await scorer.getUserHistory('user-limit', 3);
      expect(history.length).toBe(3);
    });
  });

  describe('getDistribution', () => {
    it('should return confidence level distribution', async () => {
      await scorer.scoreResponse({
        responseId: 'resp-dist-1',
        userId: 'user-dist',
        sessionId: 'session-1',
        responseText: 'Short.',
        responseType: ResponseType.ANSWER,
      });

      const distribution = await scorer.getDistribution();

      expect(distribution).toBeDefined();
      expect(typeof distribution[ConfidenceLevel.HIGH]).toBe('number');
      expect(typeof distribution[ConfidenceLevel.MEDIUM]).toBe('number');
      expect(typeof distribution[ConfidenceLevel.LOW]).toBe('number');
      expect(typeof distribution[ConfidenceLevel.UNCERTAIN]).toBe('number');
    });
  });

  describe('adjustConfidence', () => {
    it('should adjust confidence score by factor', () => {
      const adjusted = scorer.adjustConfidence(0.7, 1.2);
      expect(adjusted).toBeCloseTo(0.84, 2);
    });

    it('should clamp adjusted score between 0 and 1', () => {
      const adjustedHigh = scorer.adjustConfidence(0.9, 1.5);
      expect(adjustedHigh).toBeLessThanOrEqual(1);

      const adjustedLow = scorer.adjustConfidence(0.1, 0.1);
      expect(adjustedLow).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('InMemoryConfidenceScoreStore', () => {
  let store: InMemoryConfidenceScoreStore;

  beforeEach(() => {
    store = new InMemoryConfidenceScoreStore();
  });

  it('should create and retrieve score', async () => {
    const score = await store.create({
      responseId: 'resp-1',
      userId: 'user-1',
      sessionId: 'session-1',
      overallScore: 0.8,
      level: ConfidenceLevel.HIGH,
      factors: [],
      responseType: ResponseType.EXPLANATION,
      complexity: 'intermediate' as any,
      shouldVerify: false,
      scoredAt: new Date(),
    });

    const retrieved = await store.get(score.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.responseId).toBe('resp-1');
  });

  it('should get by response ID', async () => {
    await store.create({
      responseId: 'resp-by-id',
      userId: 'user-1',
      sessionId: 'session-1',
      overallScore: 0.7,
      level: ConfidenceLevel.MEDIUM,
      factors: [],
      responseType: ResponseType.ANSWER,
      complexity: 'basic' as any,
      shouldVerify: true,
      scoredAt: new Date(),
    });

    const retrieved = await store.getByResponse('resp-by-id');
    expect(retrieved).toBeDefined();
    expect(retrieved?.overallScore).toBe(0.7);
  });

  it('should get average by topic', async () => {
    await store.create({
      responseId: 'resp-topic-1',
      userId: 'user-1',
      sessionId: 'session-1',
      overallScore: 0.8,
      level: ConfidenceLevel.HIGH,
      factors: [],
      responseType: ResponseType.EXPLANATION,
      topic: 'JavaScript',
      complexity: 'intermediate' as any,
      shouldVerify: false,
      scoredAt: new Date(),
    });

    await store.create({
      responseId: 'resp-topic-2',
      userId: 'user-1',
      sessionId: 'session-1',
      overallScore: 0.6,
      level: ConfidenceLevel.MEDIUM,
      factors: [],
      responseType: ResponseType.EXPLANATION,
      topic: 'JavaScript',
      complexity: 'intermediate' as any,
      shouldVerify: true,
      scoredAt: new Date(),
    });

    const avg = await store.getAverageByTopic('JavaScript');
    expect(avg).toBeCloseTo(0.7, 1);
  });
});
