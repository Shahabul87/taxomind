/**
 * Working Jest Configuration - Fixes all test issues
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Test patterns - exclude backups
  testMatch: [
    '<rootDir>/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/app/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/components/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/lib/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/actions/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/dist/',
    '/backups/',  // Critical - exclude backup folder
    '/e2e/',
    '/scripts/',
  ],
  
  // Module paths to ignore
  modulePathIgnorePatterns: [
    '<rootDir>/backups/',
    '<rootDir>/build/',
    '<rootDir>/dist/',
    '<rootDir>/.next/',
  ],
  
  // Memory optimizations
  coverageProvider: 'v8',
  workerIdleMemoryLimit: '512MB',
  maxWorkers: 1,
  testTimeout: 30000,
  
  // Cleanup
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  resetModules: true,
  
  // Module mapping - comprehensive
  moduleNameMapper: {
    // Styles
    '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',

    // Images
    '^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$/i': '<rootDir>/__mocks__/fileMock.js',

    // Lucide React - Mock to avoid ESM issues
    '^lucide-react$': '<rootDir>/__mocks__/lucide-react.js',
    '^lucide-react/dist/esm/icons/(.*)$': '<rootDir>/__mocks__/lucide-react.js',

    // Prisma - Critical for fixing jsdom issues
    '@prisma/client': '<rootDir>/__mocks__/prisma.js',
    '^@/lib/db$': '<rootDir>/__mocks__/db.js',

    // Next.js components
    '^next/image$': '<rootDir>/__mocks__/next-image.js',
    '^next/link$': '<rootDir>/__mocks__/next-link.js',

    // Path aliases
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // Transform patterns
  transformIgnorePatterns: [
    'node_modules/(?!(next-auth|@auth|jose|uuid|nanoid|uncrypto|@upstash|@panva|lucide-react)/)',
  ],
  
  // Globals
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
  
  // Coverage settings
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'actions/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/backups/**',
  ],
  
  // Disable cache for consistency
  cache: false,
};

module.exports = createJestConfig(customJestConfig);