/**
 * Tests for QualityTracker
 */

import {
  QualityTracker,
  createQualityTracker,
  InMemoryQualityRecordStore,
  InMemoryCalibrationStore,
  QualityMetric,
  QualityMetricType,
  MetricSource,
  StudentFeedback,
  ExpertReview,
  LearningOutcome,
  ConfidenceLevel,
} from '../src/self-evaluation';

describe('QualityTracker', () => {
  let tracker: QualityTracker;

  beforeEach(() => {
    tracker = createQualityTracker();
  });

  describe('recordQuality', () => {
    it('should record quality metrics for a response', async () => {
      const metrics: QualityMetric[] = [
        {
          type: QualityMetricType.ACCURACY,
          score: 0.85,
          source: MetricSource.AUTOMATED,
          confidence: 0.8,
        },
        {
          type: QualityMetricType.CLARITY,
          score: 0.9,
          source: MetricSource.AUTOMATED,
          confidence: 0.7,
        },
      ];

      const record = await tracker.recordQuality(
        'resp-1',
        'user-1',
        'session-1',
        metrics,
        0.8
      );

      expect(record).toBeDefined();
      expect(record.id).toBeDefined();
      expect(record.responseId).toBe('resp-1');
      expect(record.metrics.length).toBe(2);
      expect(record.overallQuality).toBeGreaterThan(0);
      expect(record.confidenceScore).toBe(0.8);
    });

    it('should calculate confidence accuracy', async () => {
      const metrics: QualityMetric[] = [
        {
          type: QualityMetricType.ACCURACY,
          score: 0.9,
          source: MetricSource.AUTOMATED,
          confidence: 0.8,
        },
      ];

      const record = await tracker.recordQuality(
        'resp-2',
        'user-1',
        'session-1',
        metrics,
        0.85
      );

      expect(record.confidenceAccuracy).toBeDefined();
      // confidenceAccuracy = 1 - |confidenceScore - overallQuality|
      expect(record.confidenceAccuracy).toBeGreaterThan(0);
    });

    it('should handle records without confidence score', async () => {
      const metrics: QualityMetric[] = [
        {
          type: QualityMetricType.ACCURACY,
          score: 0.75,
          source: MetricSource.AUTOMATED,
          confidence: 0.6,
        },
      ];

      const record = await tracker.recordQuality(
        'resp-3',
        'user-1',
        'session-1',
        metrics
      );

      expect(record.confidenceScore).toBeUndefined();
      expect(record.confidenceAccuracy).toBeUndefined();
    });
  });

  describe('recordFeedback', () => {
    it('should record student feedback', async () => {
      // First create a quality record
      await tracker.recordQuality(
        'resp-feedback',
        'user-1',
        'session-1',
        [
          {
            type: QualityMetricType.ACCURACY,
            score: 0.8,
            source: MetricSource.AUTOMATED,
            confidence: 0.7,
          },
        ]
      );

      const feedback: StudentFeedback = {
        responseId: 'resp-feedback',
        userId: 'user-1',
        helpful: true,
        rating: 4,
        didUnderstand: true,
        needMoreHelp: false,
        submittedAt: new Date(),
      };

      await tracker.recordFeedback(feedback);

      const record = await tracker.getQualityRecord('resp-feedback');
      expect(record?.studentFeedback).toBeDefined();
      expect(record?.studentFeedback?.helpful).toBe(true);
    });

    it('should update quality metrics based on feedback', async () => {
      await tracker.recordQuality(
        'resp-feedback-update',
        'user-1',
        'session-1',
        [
          {
            type: QualityMetricType.ACCURACY,
            score: 0.8,
            source: MetricSource.AUTOMATED,
            confidence: 0.7,
          },
        ]
      );

      const feedback: StudentFeedback = {
        responseId: 'resp-feedback-update',
        userId: 'user-1',
        helpful: true,
        rating: 5,
        clarity: 5,
        didUnderstand: true,
        needMoreHelp: false,
        submittedAt: new Date(),
      };

      await tracker.recordFeedback(feedback);

      const record = await tracker.getQualityRecord('resp-feedback-update');

      // Should have added helpfulness and other feedback-derived metrics
      const helpfulnessMetric = record?.metrics.find(
        (m) => m.type === QualityMetricType.HELPFULNESS
      );
      expect(helpfulnessMetric).toBeDefined();
    });
  });

  describe('recordExpertReview', () => {
    it('should record expert review', async () => {
      await tracker.recordQuality(
        'resp-expert',
        'user-1',
        'session-1',
        [
          {
            type: QualityMetricType.ACCURACY,
            score: 0.7,
            source: MetricSource.AUTOMATED,
            confidence: 0.6,
          },
        ]
      );

      const review: ExpertReview = {
        id: 'review-1',
        reviewerId: 'expert-1',
        approved: true,
        accuracyScore: 0.95,
        pedagogyScore: 0.9,
        appropriatenessScore: 0.85,
        reviewedAt: new Date(),
      };

      await tracker.recordExpertReview('resp-expert', review);

      const record = await tracker.getQualityRecord('resp-expert');
      expect(record?.expertReview).toBeDefined();
      expect(record?.expertReview?.approved).toBe(true);
    });

    it('should update quality metrics based on expert review', async () => {
      await tracker.recordQuality(
        'resp-expert-update',
        'user-1',
        'session-1',
        [
          {
            type: QualityMetricType.ACCURACY,
            score: 0.7,
            source: MetricSource.AUTOMATED,
            confidence: 0.6,
          },
        ]
      );

      const review: ExpertReview = {
        id: 'review-2',
        reviewerId: 'expert-1',
        approved: true,
        accuracyScore: 0.95,
        pedagogyScore: 0.9,
        appropriatenessScore: 0.85,
        reviewedAt: new Date(),
      };

      await tracker.recordExpertReview('resp-expert-update', review);

      const record = await tracker.getQualityRecord('resp-expert-update');

      // Should have added expert-sourced metrics
      const expertMetrics = record?.metrics.filter(
        (m) => m.source === MetricSource.EXPERT_REVIEW
      );
      expect(expertMetrics?.length).toBeGreaterThan(0);
    });
  });

  describe('recordOutcome', () => {
    it('should record learning outcome', async () => {
      await tracker.recordQuality(
        'resp-outcome',
        'user-1',
        'session-1',
        [
          {
            type: QualityMetricType.ACCURACY,
            score: 0.8,
            source: MetricSource.AUTOMATED,
            confidence: 0.7,
          },
        ]
      );

      const outcome: LearningOutcome = {
        responseId: 'resp-outcome',
        userId: 'user-1',
        conceptId: 'concept-1',
        subsequentAttempts: 5,
        successfulAttempts: 4,
        timeSpentLearning: 25,
        masteryImprovement: 15,
        measuredAt: new Date(),
      };

      await tracker.recordOutcome('resp-outcome', outcome);

      const record = await tracker.getQualityRecord('resp-outcome');
      expect(record?.learningOutcome).toBeDefined();
      expect(record?.learningOutcome?.masteryImprovement).toBe(15);
    });

    it('should derive metrics from learning outcome', async () => {
      await tracker.recordQuality(
        'resp-outcome-metrics',
        'user-1',
        'session-1',
        [
          {
            type: QualityMetricType.ACCURACY,
            score: 0.8,
            source: MetricSource.AUTOMATED,
            confidence: 0.7,
          },
        ]
      );

      const outcome: LearningOutcome = {
        responseId: 'resp-outcome-metrics',
        userId: 'user-1',
        conceptId: 'concept-1',
        subsequentAttempts: 10,
        successfulAttempts: 8,
        timeSpentLearning: 30,
        masteryImprovement: 20,
        measuredAt: new Date(),
      };

      await tracker.recordOutcome('resp-outcome-metrics', outcome);

      const record = await tracker.getQualityRecord('resp-outcome-metrics');

      // Should have outcome-based metrics
      const outcomeMetrics = record?.metrics.filter(
        (m) => m.source === MetricSource.OUTCOME_BASED
      );
      expect(outcomeMetrics?.length).toBeGreaterThan(0);
    });
  });

  describe('getSummary', () => {
    it('should return quality summary for user', async () => {
      // Create some quality records
      for (let i = 0; i < 3; i++) {
        await tracker.recordQuality(
          `resp-summary-${i}`,
          'user-summary',
          'session-1',
          [
            {
              type: QualityMetricType.ACCURACY,
              score: 0.7 + i * 0.1,
              source: MetricSource.AUTOMATED,
              confidence: 0.8,
            },
          ],
          0.75
        );
      }

      const summary = await tracker.getSummary('user-summary');

      expect(summary).toBeDefined();
      expect(summary.totalResponses).toBe(3);
      expect(summary.averageQuality).toBeGreaterThan(0);
      expect(summary.averageConfidence).toBeGreaterThan(0);
      expect(summary.qualityTrend).toBeDefined();
      expect(summary.confidenceTrend).toBeDefined();
    });

    it('should respect period parameters', async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000); // 60 days ago

      await tracker.recordQuality(
        'resp-period',
        'user-period',
        'session-1',
        [
          {
            type: QualityMetricType.ACCURACY,
            score: 0.8,
            source: MetricSource.AUTOMATED,
            confidence: 0.7,
          },
        ]
      );

      const futureStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const summary = await tracker.getSummary('user-period', futureStart);

      expect(summary.totalResponses).toBe(0);
    });
  });

  describe('calculateCalibration', () => {
    it('should calculate calibration when sufficient samples', async () => {
      // Create enough samples for calibration
      for (let i = 0; i < 15; i++) {
        await tracker.recordQuality(
          `resp-calibration-${i}`,
          'user-calibration',
          'session-1',
          [
            {
              type: QualityMetricType.ACCURACY,
              score: 0.7 + Math.random() * 0.2,
              source: MetricSource.AUTOMATED,
              confidence: 0.8,
            },
          ],
          0.75 + Math.random() * 0.1
        );
      }

      const calibration = await tracker.calculateCalibration('user-calibration');

      expect(calibration).toBeDefined();
      expect(calibration?.expectedAccuracy).toBeGreaterThan(0);
      expect(calibration?.actualAccuracy).toBeGreaterThan(0);
      expect(calibration?.calibrationError).toBeGreaterThanOrEqual(0);
      expect(calibration?.adjustmentFactor).toBeGreaterThan(0);
    });

    it('should return null when insufficient samples', async () => {
      // Create fewer samples than required
      for (let i = 0; i < 3; i++) {
        await tracker.recordQuality(
          `resp-few-${i}`,
          'user-few',
          'session-1',
          [
            {
              type: QualityMetricType.ACCURACY,
              score: 0.8,
              source: MetricSource.AUTOMATED,
              confidence: 0.7,
            },
          ],
          0.75
        );
      }

      const calibration = await tracker.calculateCalibration('user-few');

      expect(calibration).toBeNull();
    });
  });

  describe('getCalibrationHistory', () => {
    it('should return calibration history', async () => {
      // Create enough samples and calculate calibration
      for (let i = 0; i < 15; i++) {
        await tracker.recordQuality(
          `resp-hist-cal-${i}`,
          'user-hist-cal',
          'session-1',
          [
            {
              type: QualityMetricType.ACCURACY,
              score: 0.8,
              source: MetricSource.AUTOMATED,
              confidence: 0.8,
            },
          ],
          0.8
        );
      }

      await tracker.calculateCalibration('user-hist-cal');

      const history = await tracker.getCalibrationHistory('user-hist-cal');

      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('getLatestCalibration', () => {
    it('should return latest calibration for user', async () => {
      // Create samples and calculate calibration
      for (let i = 0; i < 15; i++) {
        await tracker.recordQuality(
          `resp-latest-${i}`,
          'user-latest',
          'session-1',
          [
            {
              type: QualityMetricType.ACCURACY,
              score: 0.85,
              source: MetricSource.AUTOMATED,
              confidence: 0.8,
            },
          ],
          0.8
        );
      }

      const created = await tracker.calculateCalibration('user-latest');
      const latest = await tracker.getLatestCalibration('user-latest');

      expect(latest?.id).toBe(created?.id);
    });

    it('should return null when no calibration exists', async () => {
      const latest = await tracker.getLatestCalibration('non-existent-user');
      expect(latest).toBeNull();
    });
  });

  describe('getQualityRecord', () => {
    it('should retrieve quality record by response ID', async () => {
      await tracker.recordQuality(
        'resp-get',
        'user-1',
        'session-1',
        [
          {
            type: QualityMetricType.ACCURACY,
            score: 0.9,
            source: MetricSource.AUTOMATED,
            confidence: 0.85,
          },
        ]
      );

      const record = await tracker.getQualityRecord('resp-get');

      expect(record).toBeDefined();
      expect(record?.responseId).toBe('resp-get');
    });

    it('should return null for non-existent response', async () => {
      const record = await tracker.getQualityRecord('non-existent');
      expect(record).toBeNull();
    });
  });

  describe('getUserHistory', () => {
    it('should return user quality history', async () => {
      for (let i = 0; i < 5; i++) {
        await tracker.recordQuality(
          `resp-user-hist-${i}`,
          'user-with-history',
          'session-1',
          [
            {
              type: QualityMetricType.ACCURACY,
              score: 0.8,
              source: MetricSource.AUTOMATED,
              confidence: 0.7,
            },
          ]
        );
      }

      const history = await tracker.getUserHistory('user-with-history');
      expect(history.length).toBe(5);
    });

    it('should respect limit parameter', async () => {
      for (let i = 0; i < 10; i++) {
        await tracker.recordQuality(
          `resp-limit-hist-${i}`,
          'user-limit-history',
          'session-1',
          [
            {
              type: QualityMetricType.ACCURACY,
              score: 0.8,
              source: MetricSource.AUTOMATED,
              confidence: 0.7,
            },
          ]
        );
      }

      const history = await tracker.getUserHistory('user-limit-history', 5);
      expect(history.length).toBe(5);
    });
  });

  describe('createAutomatedMetrics', () => {
    it('should create automated metrics from response text', () => {
      const responseText = `
        TypeScript is a programming language that adds static typing to JavaScript.
        For example, you can define interfaces and type annotations.
        Therefore, it helps catch errors at compile time.
      `;

      const metrics = tracker.createAutomatedMetrics(responseText, 0.85, 0.8);

      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics.every((m) => m.source === MetricSource.AUTOMATED)).toBe(true);
    });

    it('should include accuracy metric when verification accuracy provided', () => {
      const metrics = tracker.createAutomatedMetrics('Test response', 0.9, 0.8);

      const accuracyMetric = metrics.find((m) => m.type === QualityMetricType.ACCURACY);
      expect(accuracyMetric).toBeDefined();
      expect(accuracyMetric?.score).toBe(0.9);
    });

    it('should analyze clarity and completeness', () => {
      const wellStructuredText = `
        Introduction to the concept:
        - Point one: explanation
        - Point two: explanation

        For example, consider this case.
        Therefore, we can conclude that the approach works.
        In summary, this provides a complete solution.
      `;

      const metrics = tracker.createAutomatedMetrics(wellStructuredText);

      const clarityMetric = metrics.find((m) => m.type === QualityMetricType.CLARITY);
      const completenessMetric = metrics.find((m) => m.type === QualityMetricType.COMPLETENESS);

      expect(clarityMetric).toBeDefined();
      expect(completenessMetric).toBeDefined();
    });
  });
});

describe('InMemoryQualityRecordStore', () => {
  let store: InMemoryQualityRecordStore;

  beforeEach(() => {
    store = new InMemoryQualityRecordStore();
  });

  it('should create and retrieve quality record', async () => {
    const record = await store.create({
      responseId: 'resp-1',
      userId: 'user-1',
      sessionId: 'session-1',
      metrics: [
        {
          type: QualityMetricType.ACCURACY,
          score: 0.8,
          source: MetricSource.AUTOMATED,
          confidence: 0.7,
        },
      ],
      overallQuality: 0.8,
      recordedAt: new Date(),
      updatedAt: new Date(),
    });

    const retrieved = await store.get(record.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.responseId).toBe('resp-1');
  });

  it('should get by response ID', async () => {
    await store.create({
      responseId: 'resp-by-id',
      userId: 'user-1',
      sessionId: 'session-1',
      metrics: [],
      overallQuality: 0.75,
      recordedAt: new Date(),
      updatedAt: new Date(),
    });

    const retrieved = await store.getByResponse('resp-by-id');
    expect(retrieved).toBeDefined();
    expect(retrieved?.overallQuality).toBe(0.75);
  });

  it('should update quality record', async () => {
    const record = await store.create({
      responseId: 'resp-update',
      userId: 'user-1',
      sessionId: 'session-1',
      metrics: [],
      overallQuality: 0.7,
      recordedAt: new Date(),
      updatedAt: new Date(),
    });

    const updated = await store.update(record.id, {
      overallQuality: 0.9,
    });

    expect(updated.overallQuality).toBe(0.9);
  });

  it('should throw error when updating non-existent record', async () => {
    await expect(
      store.update('non-existent', { overallQuality: 0.9 })
    ).rejects.toThrow('Quality record not found');
  });

  it('should record and link feedback', async () => {
    await store.create({
      responseId: 'resp-feedback',
      userId: 'user-1',
      sessionId: 'session-1',
      metrics: [],
      overallQuality: 0.8,
      recordedAt: new Date(),
      updatedAt: new Date(),
    });

    const feedback: StudentFeedback = {
      responseId: 'resp-feedback',
      userId: 'user-1',
      helpful: true,
      rating: 5,
      didUnderstand: true,
      needMoreHelp: false,
      submittedAt: new Date(),
    };

    await store.recordFeedback('resp-feedback', feedback);

    const record = await store.getByResponse('resp-feedback');
    expect(record?.studentFeedback).toBeDefined();
    expect(record?.studentFeedback?.rating).toBe(5);
  });

  it('should record and link learning outcome', async () => {
    await store.create({
      responseId: 'resp-outcome',
      userId: 'user-1',
      sessionId: 'session-1',
      metrics: [],
      overallQuality: 0.8,
      recordedAt: new Date(),
      updatedAt: new Date(),
    });

    const outcome: LearningOutcome = {
      responseId: 'resp-outcome',
      userId: 'user-1',
      conceptId: 'concept-1',
      subsequentAttempts: 10,
      successfulAttempts: 8,
      timeSpentLearning: 20,
      masteryImprovement: 10,
      measuredAt: new Date(),
    };

    await store.recordOutcome('resp-outcome', outcome);

    const record = await store.getByResponse('resp-outcome');
    expect(record?.learningOutcome).toBeDefined();
    expect(record?.learningOutcome?.masteryImprovement).toBe(10);
  });

  it('should generate summary with trends', async () => {
    const now = new Date();

    // Create records to test trends
    for (let i = 0; i < 4; i++) {
      await store.create({
        responseId: `resp-trend-${i}`,
        userId: 'user-trend',
        sessionId: 'session-1',
        metrics: [
          {
            type: QualityMetricType.ACCURACY,
            score: 0.6 + i * 0.1,
            source: MetricSource.AUTOMATED,
            confidence: 0.8,
          },
        ],
        overallQuality: 0.6 + i * 0.1,
        confidenceScore: 0.7 + i * 0.05,
        recordedAt: new Date(now.getTime() - (4 - i) * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      });
    }

    const summary = await store.getSummary('user-trend');

    expect(summary.totalResponses).toBe(4);
    expect(summary.averageQuality).toBeGreaterThan(0);
    expect(['improving', 'declining', 'stable']).toContain(summary.qualityTrend);
  });
});

describe('InMemoryCalibrationStore', () => {
  let store: InMemoryCalibrationStore;

  beforeEach(() => {
    store = new InMemoryCalibrationStore();
  });

  it('should create and retrieve calibration data', async () => {
    const calibration = await store.create({
      userId: 'user-1',
      totalResponses: 20,
      expectedAccuracy: 0.8,
      actualAccuracy: 0.75,
      calibrationError: 0.05,
      byConfidenceLevel: [
        {
          level: ConfidenceLevel.HIGH,
          count: 10,
          expectedAccuracy: 0.9,
          actualAccuracy: 0.85,
          isOverconfident: true,
          isUnderconfident: false,
        },
      ],
      adjustmentFactor: 0.95,
      adjustmentDirection: 'decrease',
      periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(),
      calculatedAt: new Date(),
    });

    const retrieved = await store.get(calibration.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.userId).toBe('user-1');
  });

  it('should get latest calibration for user', async () => {
    // Create older calibration
    await store.create({
      userId: 'user-latest',
      totalResponses: 15,
      expectedAccuracy: 0.7,
      actualAccuracy: 0.7,
      calibrationError: 0,
      byConfidenceLevel: [],
      adjustmentFactor: 1,
      adjustmentDirection: 'none',
      periodStart: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      calculatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    });

    // Create newer calibration
    const newer = await store.create({
      userId: 'user-latest',
      totalResponses: 20,
      expectedAccuracy: 0.8,
      actualAccuracy: 0.85,
      calibrationError: 0.05,
      byConfidenceLevel: [],
      adjustmentFactor: 1.05,
      adjustmentDirection: 'increase',
      periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(),
      calculatedAt: new Date(),
    });

    const latest = await store.getLatest('user-latest');
    expect(latest?.id).toBe(newer.id);
  });

  it('should get calibration history with limit', async () => {
    for (let i = 0; i < 5; i++) {
      await store.create({
        userId: 'user-history',
        totalResponses: 15 + i,
        expectedAccuracy: 0.7 + i * 0.02,
        actualAccuracy: 0.7 + i * 0.02,
        calibrationError: 0,
        byConfidenceLevel: [],
        adjustmentFactor: 1,
        adjustmentDirection: 'none',
        periodStart: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000),
        periodEnd: new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000),
        calculatedAt: new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000),
      });
    }

    const history = await store.getHistory('user-history', 3);
    expect(history.length).toBe(3);
  });

  it('should filter by topic', async () => {
    await store.create({
      userId: 'user-topic',
      topic: 'JavaScript',
      totalResponses: 10,
      expectedAccuracy: 0.8,
      actualAccuracy: 0.75,
      calibrationError: 0.05,
      byConfidenceLevel: [],
      adjustmentFactor: 0.95,
      adjustmentDirection: 'decrease',
      periodStart: new Date(),
      periodEnd: new Date(),
      calculatedAt: new Date(),
    });

    await store.create({
      userId: 'user-topic',
      topic: 'TypeScript',
      totalResponses: 10,
      expectedAccuracy: 0.85,
      actualAccuracy: 0.9,
      calibrationError: 0.05,
      byConfidenceLevel: [],
      adjustmentFactor: 1.05,
      adjustmentDirection: 'increase',
      periodStart: new Date(),
      periodEnd: new Date(),
      calculatedAt: new Date(),
    });

    const jsCalibration = await store.getLatest('user-topic', 'JavaScript');
    expect(jsCalibration?.topic).toBe('JavaScript');

    const tsCalibration = await store.getLatest('user-topic', 'TypeScript');
    expect(tsCalibration?.topic).toBe('TypeScript');
  });
});
