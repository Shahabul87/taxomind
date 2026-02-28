/**
 * Unit test Jest configuration
 * Extends the primary working config but scopes execution to unit tests.
 */

const createWorkingConfig = require('./jest.config.working');

module.exports = async () => {
  const workingConfig = await createWorkingConfig();

  return {
    ...workingConfig,
    displayName: 'unit',
    testMatch: [
      '<rootDir>/__tests__/unit/**/*.{test,spec}.{js,jsx,ts,tsx}',
      '<rootDir>/__tests__/lib/**/*.{test,spec}.{js,jsx,ts,tsx}',
      '<rootDir>/__tests__/actions/**/*.{test,spec}.{js,jsx,ts,tsx}',
      '<rootDir>/__tests__/hooks/**/*.{test,spec}.{js,jsx,ts,tsx}',
      '<rootDir>/__tests__/components/**/*.{test,spec}.{js,jsx,ts,tsx}',
    ],
    testPathIgnorePatterns: [
      ...(workingConfig.testPathIgnorePatterns || []),
      '/__tests__/integration/',
      '/__tests__/api/',
      '/__tests__/performance/',
    ],
    collectCoverage: false,
  };
};
