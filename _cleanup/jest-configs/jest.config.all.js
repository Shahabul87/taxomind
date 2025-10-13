/**
 * All Tests Configuration - Intelligently handles all test types
 * This configuration automatically determines the right environment for each test
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  // Use projects to run different test types with different configs
  projects: [
    // Unit Tests - Use jsdom environment with full mocks
    {
      displayName: 'Unit Tests',
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.comprehensive.js'],
      testMatch: [
        '<rootDir>/**/__tests__/unit/**/*.{test,spec}.{js,jsx,ts,tsx}',
        '<rootDir>/**/__tests__/components/**/*.{test,spec}.{js,jsx,ts,tsx}',
        '<rootDir>/**/__tests__/hooks/**/*.{test,spec}.{js,jsx,ts,tsx}',
        '<rootDir>/**/__tests__/actions/**/*.{test,spec}.{js,jsx,ts,tsx}',
      ],
      moduleNameMapper: {
        '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
        '^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$/i': '<rootDir>/__mocks__/fileMock.js',
        '^@/(.*)$': '<rootDir>/$1',
        '@prisma/client': '<rootDir>/__mocks__/prisma.js',
        '^@/lib/db$': '<rootDir>/__mocks__/db.js',
      },
      transformIgnorePatterns: [
        'node_modules/(?!(next-auth|@auth|jose|uuid|nanoid|uncrypto|@upstash|@panva)/)',
      ],
    },
    
    // Integration Tests - Use node environment for real database
    {
      displayName: 'Integration Tests',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.integration.js'],
      testMatch: [
        '<rootDir>/**/__tests__/integration/**/*.{test,spec}.{js,jsx,ts,tsx}',
        '<rootDir>/**/__tests__/api/**/*.{test,spec}.{js,jsx,ts,tsx}',
        '<rootDir>/**/__tests__/lib/**/*.{test,spec}.{js,jsx,ts,tsx}',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      transformIgnorePatterns: [
        'node_modules/(?!(next-auth|@auth|jose|uuid|nanoid|uncrypto|@upstash|@panva)/)',
      ],
    },
  ],
  
  // Global settings
  coverageProvider: 'v8',
  collectCoverage: false,
  workerIdleMemoryLimit: '512MB',
  maxWorkers: 1,
  testTimeout: 30000,
  
  // Cleanup
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  resetModules: true,
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/dist/',
    '/backups/',
    '/e2e/',
  ],
  
  // Global settings
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      }
    }
  },
};

module.exports = createJestConfig(customJestConfig);