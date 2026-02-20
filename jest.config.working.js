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
  
  // Cleanup - disabled resetMocks/resetModules for proper test isolation
  clearMocks: true,
  restoreMocks: true,
  // resetMocks: true,  // Disabled - breaks mock implementations
  // resetModules: true, // Disabled - causes module caching issues
  
  // Module mapping - comprehensive
  // ORDER MATTERS: More specific patterns must come BEFORE general ones
  moduleNameMapper: {
    // SAM AI packages - MUST come first to intercept before path alias resolution
    // These map to manual mocks to allow test-specific behavior
    // We need to mock both the import path AND the resolved symlink path
    '^@sam-ai/agentic$': '<rootDir>/__mocks__/@sam-ai/agentic/index.js',
    '^@sam-ai/agentic/(.*)$': '<rootDir>/__mocks__/@sam-ai/agentic/$1.js',
    '^@sam-ai/quality$': '<rootDir>/__mocks__/@sam-ai/quality/index.js',
    '^@sam-ai/quality/(.*)$': '<rootDir>/__mocks__/@sam-ai/quality/$1.js',
    '^@sam-ai/pedagogy$': '<rootDir>/__mocks__/@sam-ai/pedagogy/index.js',
    '^@sam-ai/pedagogy/(.*)$': '<rootDir>/__mocks__/@sam-ai/pedagogy/$1.js',
    // Also mock the direct package paths (for pnpm workspace symlinks)
    '<rootDir>/packages/agentic/src/index.ts': '<rootDir>/__mocks__/@sam-ai/agentic/index.js',
    '<rootDir>/packages/agentic/dist/index.js': '<rootDir>/__mocks__/@sam-ai/agentic/index.js',
    // Mock resolved TS paths for symlinked packages (SWC resolves tsconfig paths before Jest)
    '.*/packages/quality/src/index\\.ts$': '<rootDir>/__mocks__/@sam-ai/quality/index.js',
    '.*/packages/quality/dist/index\\.js$': '<rootDir>/__mocks__/@sam-ai/quality/index.js',
    '.*/packages/pedagogy/src/index\\.ts$': '<rootDir>/__mocks__/@sam-ai/pedagogy/index.js',
    '.*/packages/pedagogy/dist/index\\.js$': '<rootDir>/__mocks__/@sam-ai/pedagogy/index.js',

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

    // Path aliases - MUST come after specific package mocks
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