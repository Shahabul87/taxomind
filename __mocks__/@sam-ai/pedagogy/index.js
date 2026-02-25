/**
 * Manual mock for @sam-ai/pedagogy
 *
 * Provides configurable mock for createPedagogicalPipeline and evaluatePedagogically.
 * Tests can reconfigure via:
 *   const { evaluatePedagogically } = require('@sam-ai/pedagogy');
 *   evaluatePedagogically.mockResolvedValue({ overallScore: 90, ... });
 */

const defaultResult = {
  overallScore: 80,
  passed: true,
  evaluatorResults: {
    blooms: {
      passed: true, score: 80, confidence: 0.9,
      dominantLevel: 'ANALYZE', targetLevel: 'ANALYZE',
      alignmentStatus: 'aligned', levelDistance: 0,
      detectedDistribution: {}, verbAnalysis: {}, activityAnalysis: {},
    },
    scaffolding: null,
    zpd: null,
  },
  allIssues: [],
  allRecommendations: [],
  metadata: { evaluatorsRun: ['blooms', 'scaffolding'], totalTimeMs: 100, studentProfileUsed: false },
};

const mockEvaluate = jest.fn().mockResolvedValue(defaultResult);

const evaluatePedagogically = jest.fn().mockResolvedValue(defaultResult);

const createPedagogicalPipeline = jest.fn(() => ({
  evaluate: mockEvaluate,
}));

const createBloomsPipeline = jest.fn();
const createScaffoldingPipeline = jest.fn();
const createZPDPipeline = jest.fn();

module.exports = {
  createPedagogicalPipeline,
  evaluatePedagogically,
  createBloomsPipeline,
  createScaffoldingPipeline,
  createZPDPipeline,
  mockEvaluate,
};
