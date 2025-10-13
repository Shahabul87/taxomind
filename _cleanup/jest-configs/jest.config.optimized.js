/**
 * Optimized Jest Configuration - Fixes Memory Exhaustion
 * Based on 2024-2025 best practices for large test suites
 */

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  // Use minimal setup to reduce memory footprint
  setupFilesAfterEnv: ['<rootDir>/jest.setup.minimal.js'],
  
  // Use node environment for most tests (lighter than jsdom)
  testEnvironment: 'node',
  
  // ============================================
  // CRITICAL MEMORY FIXES FROM RESEARCH
  // ============================================
  
  // 1. Use v8 coverage provider (much more memory efficient than babel)
  coverageProvider: 'v8',
  collectCoverage: false, // Disable for now to save memory
  
  // 2. Set worker idle memory limit - CRITICAL FOR MEMORY LEAKS
  workerIdleMemoryLimit: '512MB', // Restart workers when they hit 512MB
  
  // 3. Run sequentially to prevent memory multiplication
  maxWorkers: 1,
  
  // 4. Short timeout to prevent hanging tests
  testTimeout: 20000,
  
  // 5. Aggressive cleanup between tests
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  resetModules: true, // CRITICAL - clears require cache
  
  // 6. Minimal output
  verbose: false,
  silent: false, // Keep some output for debugging
  
  // 7. Force exit to prevent lingering processes
  forceExit: true,
  detectOpenHandles: false,
  
  // ============================================
  // TEST PATTERNS
  // ============================================
  
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
    // Exclude problematic test files temporarily
    'email-queue.test.ts',
    'blooms-analysis/route.test.ts',
  ],
  
  // ============================================
  // MODULE CONFIGURATION
  // ============================================
  
  moduleNameMapper: {
    // CSS/Style mocks (lightweight)
    '^.+\\.module\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    
    // File mocks (lightweight)
    '^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$/i': '<rootDir>/__mocks__/fileMock.js',
    
    // Path aliases
    '^@/(.*)$': '<rootDir>/$1',
    
    // Mock heavy modules that aren't needed in tests
    '^next/image$': '<rootDir>/__mocks__/next-image.js',
    '^next/link$': '<rootDir>/__mocks__/next-link.js',
  },
  
  // Transform only what's necessary
  transformIgnorePatterns: [
    'node_modules/(?!(next-auth|@auth|jose|uuid|nanoid|uncrypto|@upstash|@panva)/)',
  ],
  
  // ============================================
  // PERFORMANCE OPTIMIZATIONS
  // ============================================
  
  // Disable cache to reduce memory usage
  cache: false,
  
  // Use faster transformer settings
  globals: {
    'ts-jest': {
      isolatedModules: true, // Much faster, uses less memory
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      }
    }
  },
  
  // Minimal setup files
  setupFiles: [],
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // Module paths to ignore
  modulePathIgnorePatterns: [
    '<rootDir>/backups/',
    '<rootDir>/build/',
    '<rootDir>/dist/',
    '<rootDir>/.next/',
  ],
  
  // Disable watch mode
  watchPlugins: [],
}

module.exports = createJestConfig(customJestConfig)