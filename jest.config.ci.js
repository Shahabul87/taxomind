/**
 * Jest Configuration for CI/CD Environments
 * Optimized to prevent runner timeouts and memory issues
 */

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  
  // ============================================
  // PERFORMANCE OPTIMIZATIONS FOR CI
  // ============================================
  
  // Limit parallel workers to prevent CPU starvation and memory issues
  // Using runInBand is more memory efficient than maxWorkers: 1
  maxWorkers: process.env.TEST_WORKERS || 1,
  
  // Maximum number of concurrent test files
  maxConcurrency: 1,
  
  // Test timeout to prevent hanging tests (30 seconds)
  testTimeout: 30000,
  
  // Don't fail fast - run all tests
  bail: false,
  
  // Disable coverage collection for speed (run separately if needed)
  collectCoverage: false,
  
  // Less verbose output for smaller logs
  verbose: false,
  
  // Silent mode to reduce console output
  silent: true,
  
  // Detect open handles that might prevent Jest from exiting
  detectOpenHandles: true,
  
  // Force exit after tests complete
  forceExit: true,
  
  // Limit test runs to specific patterns (exclude heavy integration tests)
  testMatch: [
    '<rootDir>/**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  
  // Ignore patterns - exclude performance tests and stress tests
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/dist/',
    '/backups/',
    '/e2e/',
    '\\.performance\\.test\\.',
    '\\.stress\\.test\\.',
    '\\.integration\\.test\\.',
    '/__tests__/performance/',
    '/__tests__/stress/'
  ],
  
  // Module name mapper for path aliases
  moduleNameMapper: {
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    '^.+\\.(css|sass|scss)$': 'identity-obj-proxy',
    '^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$/i': 'jest-transform-stub',
    '^@/(.*)$': '<rootDir>/$1'
  },
  
  // Clear all mocks between tests to prevent memory leaks
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  resetModules: true, // Clear module registry between tests
  
  // Memory optimization settings
  workerIdleMemoryLimit: '512MB', // Restart workers if they exceed memory
  
  // Garbage collection settings for Node
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      }
    }
  },
  
  // Transform ignore patterns - include modules that need transformation
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|uncrypto|@upstash|next-auth|@auth|jose|uuid|nanoid|@panva))'
  ],
  
  // Module paths to ignore
  modulePathIgnorePatterns: [
    '<rootDir>/backups/',
    '<rootDir>/.*\\.backup',
    '<rootDir>/.*\\.old',
    '<rootDir>/build/',
    '<rootDir>/dist/'
  ],
  
  // Setup files
  setupFiles: ['<rootDir>/jest.polyfills.js'],
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // Watch plugins disabled for CI
  watchPlugins: [],
  
  // Cache directory
  cacheDirectory: '/tmp/jest_cache',
  
  // Disable cache in CI to reduce memory usage
  cache: false,
  
  // Disable watch mode
  watch: false,
  watchAll: false,
}

module.exports = createJestConfig(customJestConfig)