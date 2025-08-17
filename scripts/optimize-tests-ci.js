#!/usr/bin/env node

/**
 * Script to optimize tests for CI environment
 * Identifies and excludes resource-intensive tests
 */

const fs = require('fs');
const path = require('path');

// List of test files that are known to be resource-intensive
const HEAVY_TESTS = [
  '__tests__/performance/stress-test.ts',
  '__tests__/performance/**',
  '**/*.stress.test.*',
  '**/*.performance.test.*',
  '**/*.integration.test.*',
  '__tests__/e2e/**',
];

// Memory-intensive test patterns to exclude
const MEMORY_INTENSIVE_PATTERNS = [
  'stress',
  'performance',
  'load',
  'benchmark',
  'e2e',
  'integration',
];

/**
 * Generate test exclusion patterns for CI
 */
function generateTestExclusions() {
  const exclusions = [
    ...HEAVY_TESTS,
    ...MEMORY_INTENSIVE_PATTERNS.map(pattern => `**/*${pattern}*/**`),
  ];
  
  return exclusions;
}

/**
 * Create optimized Jest configuration for CI
 */
function createOptimizedConfig() {
  const config = {
    // Resource limits
    maxWorkers: 2,
    maxConcurrency: 5,
    testTimeout: 30000,
    
    // Memory management
    workerIdleMemoryLimit: '512MB',
    
    // Test exclusions
    testPathIgnorePatterns: [
      '<rootDir>/.next/',
      '<rootDir>/node_modules/',
      '<rootDir>/coverage/',
      '<rootDir>/dist/',
      '<rootDir>/backups/',
      '<rootDir>/e2e/',
      ...generateTestExclusions(),
    ],
    
    // Performance optimizations
    bail: 1,
    verbose: false,
    silent: true,
    detectOpenHandles: false,
    detectLeaks: false,
    cache: false,
    collectCoverage: false,
    forceExit: true,
  };
  
  return config;
}

/**
 * Main function
 */
function main() {
  console.log('🚀 Optimizing tests for CI environment...\n');
  
  const exclusions = generateTestExclusions();
  console.log('📝 Test exclusions for CI:');
  exclusions.forEach(pattern => {
    console.log(`  - ${pattern}`);
  });
  
  console.log('\n💡 Recommended CI test command:');
  console.log('  NODE_OPTIONS="--max-old-space-size=2048" \\');
  console.log('  jest --config jest.config.ci.js \\');
  console.log('       --ci \\');
  console.log('       --watchAll=false \\');
  console.log('       --maxWorkers=2 \\');
  console.log('       --bail \\');
  console.log('       --silent\n');
  
  console.log('✅ CI test optimization recommendations generated!');
  
  // Check for existing heavy test files
  const heavyTestsFound = [];
  HEAVY_TESTS.forEach(pattern => {
    const cleanPattern = pattern.replace('**/', '').replace('*', '');
    if (fs.existsSync(path.join(process.cwd(), cleanPattern))) {
      heavyTestsFound.push(cleanPattern);
    }
  });
  
  if (heavyTestsFound.length > 0) {
    console.log('\n⚠️  Warning: Found resource-intensive test files:');
    heavyTestsFound.forEach(file => {
      console.log(`  - ${file}`);
    });
    console.log('These will be excluded from CI runs to prevent timeouts.');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  generateTestExclusions,
  createOptimizedConfig,
};