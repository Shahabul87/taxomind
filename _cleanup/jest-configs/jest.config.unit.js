/**
 * Unit Test Configuration - For isolated component and function tests
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  displayName: 'Unit Tests',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.comprehensive.js'],
  
  // Only run unit tests
  testMatch: [
    '<rootDir>/**/__tests__/unit/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/**/__tests__/components/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/**/__tests__/hooks/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/**/__tests__/actions/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/integration/',
    '/e2e/',
  ],
  
  // Memory optimizations
  coverageProvider: 'v8',
  workerIdleMemoryLimit: '512MB',
  maxWorkers: 1,
  
  // Cleanup
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  resetModules: true,
  
  moduleNameMapper: {
    '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    '^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$/i': '<rootDir>/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/$1',
    '^next/image$': '<rootDir>/__mocks__/next-image.js',
    '^next/link$': '<rootDir>/__mocks__/next-link.js',
    // Force Prisma to use mock
    '@prisma/client': '<rootDir>/__mocks__/prisma.js',
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