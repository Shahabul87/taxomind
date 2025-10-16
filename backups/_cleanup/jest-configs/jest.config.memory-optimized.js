/**
 * Memory-Optimized Jest Configuration
 * Use this when experiencing memory issues in CI/CD
 */

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  // Minimal setup to reduce memory overhead
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node', // Use node instead of jsdom to save memory
  
  // ============================================
  // AGGRESSIVE MEMORY OPTIMIZATIONS
  // ============================================
  
  // Run tests sequentially to minimize memory usage
  maxWorkers: 1,
  maxConcurrency: 1,
  
  // Shorter timeout to prevent hanging tests
  testTimeout: 20000,
  
  // Don't collect coverage to save memory
  collectCoverage: false,
  
  // Minimal output
  verbose: false,
  silent: true,
  
  // Force exit to prevent memory leaks
  detectOpenHandles: false,
  forceExit: true,
  
  // Test patterns - exclude heavy tests
  testMatch: [
    '<rootDir>/**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/dist/',
    '/backups/',
    '/e2e/',
    // Exclude heavy test files
    '\\.performance\\.test\\.',
    '\\.stress\\.test\\.',
    '\\.integration\\.test\\.',
    '/__tests__/performance/',
    '/__tests__/stress/',
    '/__tests__/integration/',
    // Exclude tests with known memory issues
    'email-queue.test.ts',
    'blooms-analysis/route.test.ts',
  ],
  
  // Module mapper
  moduleNameMapper: {
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    '^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$/i': '<rootDir>/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/$1'
  },
  
  // Aggressive memory cleanup
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  resetModules: true,
  
  // Worker memory limit - restart if exceeds
  workerIdleMemoryLimit: '256MB',
  
  // Disable caching to reduce memory
  cache: false,
  
  // Transform settings
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|uncrypto|@upstash|next-auth|@auth|jose|uuid|nanoid|@panva))'
  ],
  
  // Module paths to ignore
  modulePathIgnorePatterns: [
    '<rootDir>/backups/',
    '<rootDir>/.*\\.backup',
    '<rootDir>/.*\\.old',
    '<rootDir>/build/',
    '<rootDir>/dist/',
    '<rootDir>/.next/',
  ],
  
  // Globals
  globals: {
    'ts-jest': {
      isolatedModules: true, // Faster compilation, less memory
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      }
    }
  },
  
  // Setup files
  setupFiles: ['<rootDir>/jest.polyfills.js'],
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // Disable watch plugins
  watchPlugins: [],
  
  // Disable watch mode
  watch: false,
  watchAll: false,
  
  // Heap snapshot on OOM for debugging
  detectLeaks: false, // Set to true only when debugging memory leaks
}

module.exports = createJestConfig(customJestConfig)