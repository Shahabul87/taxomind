/**
 * @sam-ai/educational - Course Guide Engine Tests
 * Tests for course analytics and teacher insights
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CourseGuideEngine, createCourseGuideEngine } from '../engines/course-guide-engine';
import type { CourseGuideEngineConfig, CourseGuideInput } from '../types';

// ============================================================================
// SAMPLE DATA FACTORIES
// ============================================================================

function createGuideEngineConfig(
  overrides: Partial<CourseGuideEngineConfig> = {}
): CourseGuideEngineConfig {
  return {
    ...overrides,
  };
}

function createSampleCourse(): CourseGuideInput {
  return {
    id: 'course-1',
    title: 'Introduction to Programming',
    price: 49.99,
    chapters: [
      {
        id: 'chapter-1',
        sections: [
          {
            id: 'section-1',
            exams: [{ id: 'exam-1' }],
            questions: [
              { id: 'q-1' },
              { id: 'q-2' },
            ],
          },
        ],
      },
      {
        id: 'chapter-2',
        sections: [
          {
            id: 'section-2',
            exams: [],
            questions: [{ id: 'q-3' }],
          },
        ],
      },
    ],
    enrollments: [
      {
        userId: 'user-1',
        progress: {
          percentage: 50,
          isCompleted: false,
          lastAccessedAt: new Date(),
        },
      },
      {
        userId: 'user-2',
        progress: {
          percentage: 100,
          isCompleted: true,
          lastAccessedAt: new Date(),
        },
      },
    ],
    reviews: [
      { rating: 4 },
      { rating: 5 },
    ],
    purchases: [
      { createdAt: new Date() },
      { createdAt: new Date() },
    ],
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe('CourseGuideEngine', () => {
  let engine: CourseGuideEngine;
  let config: CourseGuideEngineConfig;

  beforeEach(() => {
    config = createGuideEngineConfig();
    engine = new CourseGuideEngine(config);
  });

  // ============================================================================
  // CONSTRUCTOR TESTS
  // ============================================================================

  describe('constructor', () => {
    it('should create engine with valid config', () => {
      expect(engine).toBeInstanceOf(CourseGuideEngine);
    });

    it('should create engine without database adapter', () => {
      const noDatabaseEngine = new CourseGuideEngine({});
      expect(noDatabaseEngine).toBeInstanceOf(CourseGuideEngine);
    });

    it('should create engine using factory function', () => {
      const factoryEngine = createCourseGuideEngine();
      expect(factoryEngine).toBeInstanceOf(CourseGuideEngine);
    });
  });

  // ============================================================================
  // GENERATE COURSE GUIDE TESTS (Requires Database)
  // ============================================================================

  describe('generateCourseGuide', () => {
    it('should throw error without database adapter', async () => {
      await expect(engine.generateCourseGuide('course-1')).rejects.toThrow(
        'Database adapter is required for course guide generation'
      );
    });

    it('should throw error without database adapter with options', async () => {
      await expect(engine.generateCourseGuide('course-1', true, true)).rejects.toThrow(
        'Database adapter is required for course guide generation'
      );
    });
  });

  // ============================================================================
  // CALCULATE METRICS TESTS (Works without Database)
  // ============================================================================

  describe('calculateMetrics', () => {
    it('should calculate depth metrics', async () => {
      const course = createSampleCourse();
      const metrics = await engine.calculateMetrics(course);

      expect(metrics).toBeDefined();
      expect(metrics.depth).toBeDefined();
      expect(metrics.depth.contentRichness).toBeDefined();
      expect(metrics.depth.topicCoverage).toBeDefined();
    });

    it('should calculate engagement metrics', async () => {
      const course = createSampleCourse();
      const metrics = await engine.calculateMetrics(course);

      expect(metrics.engagement).toBeDefined();
      expect(metrics.engagement.completionRate).toBeDefined();
      expect(metrics.engagement.averageProgress).toBeDefined();
    });

    it('should calculate market acceptance metrics', async () => {
      const course = createSampleCourse();
      const metrics = await engine.calculateMetrics(course);

      expect(metrics.marketAcceptance).toBeDefined();
      expect(metrics.marketAcceptance.reviewScore).toBeDefined();
      expect(metrics.marketAcceptance.recommendationRate).toBeDefined();
    });

    it('should return overall depth score', async () => {
      const course = createSampleCourse();
      const metrics = await engine.calculateMetrics(course);

      expect(metrics.depth.overallDepth).toBeDefined();
      expect(typeof metrics.depth.overallDepth).toBe('number');
    });

    it('should handle course with no enrollments', async () => {
      const course = createSampleCourse();
      course.enrollments = [];

      const metrics = await engine.calculateMetrics(course);

      expect(metrics.engagement.completionRate).toBe(0);
      expect(metrics.engagement.averageProgress).toBe(0);
    });

    it('should handle course with no reviews', async () => {
      const course = createSampleCourse();
      course.reviews = [];

      const metrics = await engine.calculateMetrics(course);

      expect(metrics.marketAcceptance.reviewScore).toBe(0);
    });
  });

  // ============================================================================
  // GENERATE INSIGHTS TESTS (Works without Database)
  // ============================================================================

  describe('generateInsights', () => {
    it('should generate insights from course and metrics', async () => {
      const course = createSampleCourse();
      const metrics = await engine.calculateMetrics(course);
      const insights = await engine.generateInsights(course, metrics);

      expect(insights).toBeDefined();
      expect(insights.strengths).toBeDefined();
      expect(insights.improvements).toBeDefined();
      expect(insights.opportunities).toBeDefined();
    });

    it('should include action plan', async () => {
      const course = createSampleCourse();
      const metrics = await engine.calculateMetrics(course);
      const insights = await engine.generateInsights(course, metrics);

      expect(insights.actionPlan).toBeDefined();
      expect(Array.isArray(insights.actionPlan)).toBe(true);
    });

    it('should identify strengths for high depth', async () => {
      const course = createSampleCourse();
      // Add more content to increase depth
      course.chapters.push({
        id: 'chapter-3',
        sections: [
          {
            id: 'section-3',
            exams: [{ id: 'exam-2' }],
            questions: Array(10)
              .fill(null)
              .map((_, i) => ({ id: `q-${i + 10}` })),
          },
        ],
      });

      const metrics = await engine.calculateMetrics(course);
      const insights = await engine.generateInsights(course, metrics);

      expect(insights.strengths).toBeDefined();
      expect(Array.isArray(insights.strengths)).toBe(true);
    });
  });

  // ============================================================================
  // PREDICT SUCCESS TESTS (Works without Database)
  // ============================================================================

  describe('predictSuccess', () => {
    it('should predict success for a course', async () => {
      const course = createSampleCourse();
      const metrics = await engine.calculateMetrics(course);
      const prediction = await engine.predictSuccess(course, metrics);

      expect(prediction).toBeDefined();
      expect(prediction.currentTrajectory).toBeDefined();
      expect(prediction.successProbability).toBeDefined();
    });

    it('should include projected enrollments', async () => {
      const course = createSampleCourse();
      const metrics = await engine.calculateMetrics(course);
      const prediction = await engine.predictSuccess(course, metrics);

      expect(prediction.projectedEnrollments).toBeDefined();
      expect(typeof prediction.projectedEnrollments).toBe('number');
    });

    it('should include risk factors', async () => {
      const course = createSampleCourse();
      const metrics = await engine.calculateMetrics(course);
      const prediction = await engine.predictSuccess(course, metrics);

      expect(prediction.riskFactors).toBeDefined();
      expect(Array.isArray(prediction.riskFactors)).toBe(true);
    });

    it('should return trajectory as growing, stable, or declining', async () => {
      const course = createSampleCourse();
      const metrics = await engine.calculateMetrics(course);
      const prediction = await engine.predictSuccess(course, metrics);

      expect(['growing', 'stable', 'declining']).toContain(prediction.currentTrajectory);
    });
  });

  // ============================================================================
  // EXPORT COURSE GUIDE TESTS (Requires Database)
  // ============================================================================

  describe('exportCourseGuide', () => {
    it('should throw error without database adapter', async () => {
      await expect(engine.exportCourseGuide('course-1')).rejects.toThrow(
        'Database adapter is required for course guide generation'
      );
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('edge cases', () => {
    it('should handle empty config', () => {
      const emptyEngine = new CourseGuideEngine({});
      expect(emptyEngine).toBeInstanceOf(CourseGuideEngine);
    });

    it('should handle undefined config', () => {
      const undefinedEngine = new CourseGuideEngine();
      expect(undefinedEngine).toBeInstanceOf(CourseGuideEngine);
    });

    it('should handle course with empty chapters', async () => {
      const course = createSampleCourse();
      course.chapters = [];

      const metrics = await engine.calculateMetrics(course);
      expect(metrics.depth.overallDepth).toBeDefined();
    });

    it('should handle course with empty purchases', async () => {
      const course = createSampleCourse();
      course.purchases = [];

      const metrics = await engine.calculateMetrics(course);
      expect(metrics.marketAcceptance).toBeDefined();
    });

    it('should handle course with zero price', async () => {
      const course = createSampleCourse();
      course.price = 0;

      const metrics = await engine.calculateMetrics(course);
      expect(metrics.marketAcceptance.pricingOptimality).toBeDefined();
    });
  });
});
