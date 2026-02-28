/**
 * Integration test Jest configuration
 * Extends the primary working config but scopes execution to integration tests.
 */

const createWorkingConfig = require('./jest.config.working');

module.exports = async () => {
  const workingConfig = await createWorkingConfig();

  return {
    ...workingConfig,
    displayName: 'integration',
    testMatch: [
      '<rootDir>/__tests__/integration/**/*.{test,spec}.{js,jsx,ts,tsx}',
      '<rootDir>/__tests__/**/*.integration.{test,spec}.{js,jsx,ts,tsx}',
    ],
    testPathIgnorePatterns: [
      ...(workingConfig.testPathIgnorePatterns || []),
      '/__tests__/performance/',
    ],
    collectCoverage: false,
  };
};
