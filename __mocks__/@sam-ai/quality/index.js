/**
 * Manual mock for @sam-ai/quality
 *
 * Provides configurable mock for createQualityGatePipeline.
 * Tests can reconfigure mockValidate via:
 *   const { mockValidate } = require('@sam-ai/quality');
 *   mockValidate.mockResolvedValue({ overallScore: 90, ... });
 */

const mockValidate = jest.fn().mockResolvedValue({
  overallScore: 80,
  passed: true,
  criticalIssues: [],
  allSuggestions: [],
  failedGates: [],
});

const createQualityGatePipeline = jest.fn(() => ({
  validate: mockValidate,
}));

module.exports = {
  createQualityGatePipeline,
  mockValidate,
  // Re-export common types/constants as stubs
  DEFAULT_PIPELINE_CONFIG: {},
  DEFAULT_COMPLETENESS_CONFIG: {},
  DEFAULT_EXAMPLE_QUALITY_CONFIG: {},
  DEFAULT_DIFFICULTY_MATCH_CONFIG: {},
  DEFAULT_STRUCTURE_CONFIG: {},
  DEFAULT_DEPTH_CONFIG: {},
  CompletenessGate: jest.fn(),
  ExampleQualityGate: jest.fn(),
  DifficultyMatchGate: jest.fn(),
  StructureGate: jest.fn(),
  DepthGate: jest.fn(),
  createCompletenessGate: jest.fn(),
  createExampleQualityGate: jest.fn(),
  createDifficultyMatchGate: jest.fn(),
  createStructureGate: jest.fn(),
  createDepthGate: jest.fn(),
  ContentQualityGatePipeline: jest.fn(),
  validateContent: jest.fn(),
  quickValidateContent: jest.fn(),
};
