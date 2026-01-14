/**
 * Manual mock for @sam-ai/agentic
 *
 * This mock provides a simple interface where tests can directly configure
 * the mock behavior via mockGetPatterns and mockDetectPatterns exports.
 */

// Mock functions that tests can configure
const mockGetPatterns = jest.fn();
const mockDetectPatterns = jest.fn();

// Mock createBehaviorMonitor to return our configurable mocks
const createBehaviorMonitor = jest.fn((config) => {
  return {
    getPatterns: mockGetPatterns,
    detectPatterns: mockDetectPatterns,
  };
});

// Export everything tests might need
module.exports = {
  createBehaviorMonitor,
  mockGetPatterns,
  mockDetectPatterns,
  // Also export common types as jest mocks
  BehaviorMonitor: jest.fn(),
  InMemoryBehaviorEventStore: jest.fn(),
  InMemoryPatternStore: jest.fn(),
  InMemoryInterventionStore: jest.fn(),
};
