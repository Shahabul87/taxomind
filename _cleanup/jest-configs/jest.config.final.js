/**
 * FINAL OPTIMIZED Jest Configuration
 * Solves "FATAL ERROR: Reached heap limit" with comprehensive fixes
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  // Use minimal setup file
  setupFilesAfterEnv: ['<rootDir>/jest.setup.minimal.js'],
  
  // Use jsdom only when necessary, node is lighter
  testEnvironment: 'jsdom',
  
  // ============================================
  // CRITICAL MEMORY FIXES (Based on 2024-2025 Research)
  // ============================================
  
  // 1. V8 Coverage Provider - MUCH more memory efficient than babel
  coverageProvider: 'v8',
  collectCoverage: false,
  
  // 2. Worker Idle Memory Limit - CRITICAL FIX
  // Restarts workers when they exceed 512MB
  workerIdleMemoryLimit: '512MB',
  
  // 3. Force single worker to prevent memory multiplication
  maxWorkers: 1,
  
  // 4. Timeout to prevent hanging tests
  testTimeout: 30000,
  
  // 5. AGGRESSIVE memory cleanup
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  resetModules: true, // CRITICAL - clears module cache
  
  // 6. Logging configuration
  verbose: false,
  silent: false,
  
  // 7. Force exit to prevent memory leaks from lingering processes
  forceExit: true,
  detectOpenHandles: false,
  
  // ============================================
  // TEST FILE PATTERNS
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
  ],
  
  // ============================================
  // MINIMAL MODULE MAPPING
  // ============================================
  
  moduleNameMapper: {
    // Lightweight style mocks
    '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    '^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$/i': '<rootDir>/__mocks__/fileMock.js',
    
    // Path aliases
    '^@/(.*)$': '<rootDir>/$1',
    
    // Lightweight Next.js mocks
    '^next/image$': '<rootDir>/__mocks__/next-image.js',
    '^next/link$': '<rootDir>/__mocks__/next-link.js',
  },
  
  // Only transform what's absolutely necessary
  transformIgnorePatterns: [
    'node_modules/(?!(next-auth|@auth|jose|uuid|nanoid|uncrypto|@upstash|@panva)/)',
  ],
  
  // ============================================
  // PERFORMANCE SETTINGS
  // ============================================
  
  // Disable cache to save memory
  cache: false,
  
  // Use isolated modules for faster compilation
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
  
  // Minimal polyfills
  setupFiles: ['<rootDir>/jest.polyfills.js'],
  
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  modulePathIgnorePatterns: [
    '<rootDir>/backups/',
    '<rootDir>/build/',
    '<rootDir>/dist/',
    '<rootDir>/.next/',
  ],
  
  // No watch mode in CI
  watchPlugins: [],
};

module.exports = createJestConfig(customJestConfig);