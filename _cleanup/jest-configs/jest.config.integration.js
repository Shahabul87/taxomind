/**
 * Integration Test Configuration - For tests that need database and external services
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  displayName: 'Integration Tests',
  testEnvironment: 'node', // Use node for Prisma compatibility
  setupFilesAfterEnv: ['<rootDir>/jest.setup.integration.js'],
  
  // Only run integration tests
  testMatch: [
    '<rootDir>/**/__tests__/integration/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/**/__tests__/api/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/**/__tests__/lib/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/unit/',
    '/components/',
    '/e2e/',
  ],
  
  // Memory optimizations
  coverageProvider: 'v8',
  workerIdleMemoryLimit: '512MB',
  maxWorkers: 1,
  testTimeout: 30000, // Longer timeout for integration tests
  
  // Cleanup
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  resetModules: true,
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Don't mock Prisma for integration tests
  },
  
  transformIgnorePatterns: [
    'node_modules/(?!(next-auth|@auth|jose|uuid|nanoid|uncrypto|@upstash|@panva)/)',
  ],
  
  globals: {
    'ts-jest': {
      isolatedModules: true,
    }
  },
};

module.exports = createJestConfig(customJestConfig);