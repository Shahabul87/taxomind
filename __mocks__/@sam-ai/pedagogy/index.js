/**
 * Manual mock for @sam-ai/pedagogy
 *
 * Provides configurable mock for createPedagogicalPipeline.
 * Tests can reconfigure mockEvaluate via:
 *   const { mockEvaluate } = require('@sam-ai/pedagogy');
 *   mockEvaluate.mockResolvedValue({ overallScore: 90, ... });
 */

const mockEvaluate = jest.fn().mockResolvedValue({
  overallScore: 80,
  passed: true,
  allIssues: [],
  allRecommendations: [],
  metadata: { evaluatorsRun: ['blooms', 'scaffolding'] },
});

const createPedagogicalPipeline = jest.fn(() => ({
  evaluate: mockEvaluate,
}));

module.exports = {
  createPedagogicalPipeline,
  mockEvaluate,
};
