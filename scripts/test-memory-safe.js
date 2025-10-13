#!/usr/bin/env node

/**
 * Memory-safe test runner for CI environments
 * Runs tests in batches to prevent memory exhaustion
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BATCH_SIZE = 20; // Number of test files per batch
const MEMORY_LIMIT = '2048'; // MB per batch
const TEST_PATTERNS = [
  '__tests__/**/*.test.{ts,tsx,js,jsx}',
  '**/*.spec.{ts,tsx,js,jsx}'
];

// Function to find all test files
function findTestFiles() {
  const glob = require('glob');
  const testFiles = [];
  
  TEST_PATTERNS.forEach(pattern => {
    const files = glob.sync(pattern, {
      cwd: process.cwd(),
      ignore: [
        '**/node_modules/**',
        '**/.next/**',
        '**/coverage/**',
        '**/dist/**',
        '**/backups/**'
      ]
    });
    testFiles.push(...files);
  });
  
  return testFiles;
}

// Function to run tests in batch
async function runTestBatch(files, batchIndex, totalBatches) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 Running batch ${batchIndex + 1}/${totalBatches} (${files.length} files)`);
    console.log(`   Memory limit: ${MEMORY_LIMIT}MB`);
    
    const args = [
      '--config', 'jest.config.ci.js',
      '--ci',
      '--watchAll=false',
      '--runInBand',
      '--logHeapUsage',
      '--forceExit',
      '--detectOpenHandles',
      ...files
    ];
    
    const env = {
      ...process.env,
      NODE_OPTIONS: `--max-old-space-size=${MEMORY_LIMIT}`,
      CI: 'true'
    };
    
    const jest = spawn('npx', ['jest', ...args], {
      env,
      stdio: 'inherit'
    });
    
    jest.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Batch ${batchIndex + 1} completed successfully`);
        resolve();
      } else {
        console.error(`❌ Batch ${batchIndex + 1} failed with code ${code}`);
        reject(new Error(`Test batch failed with code ${code}`));
      }
    });
    
    jest.on('error', (err) => {
      console.error(`❌ Failed to run batch ${batchIndex + 1}:`, err);
      reject(err);
    });
  });
}

// Main function
async function main() {
  console.log('🔍 Finding test files...');
  const testFiles = findTestFiles();
  
  if (testFiles.length === 0) {
    console.log('No test files found');
    process.exit(0);
  }
  
  console.log(`📊 Found ${testFiles.length} test files`);
  
  // Split files into batches
  const batches = [];
  for (let i = 0; i < testFiles.length; i += BATCH_SIZE) {
    batches.push(testFiles.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`📦 Split into ${batches.length} batches of up to ${BATCH_SIZE} files each`);
  
  // Run batches sequentially
  let failedBatches = [];
  for (let i = 0; i < batches.length; i++) {
    try {
      await runTestBatch(batches[i], i, batches.length);
      
      // Force garbage collection between batches if available
      if (global.gc) {
        console.log('🧹 Running garbage collection...');
        global.gc();
      }
      
      // Small delay between batches to allow memory to settle
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      failedBatches.push(i + 1);
      // Continue with other batches even if one fails
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  if (failedBatches.length === 0) {
    console.log('✅ All test batches completed successfully!');
    process.exit(0);
  } else {
    console.error(`❌ ${failedBatches.length} batch(es) failed: ${failedBatches.join(', ')}`);
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Check if glob is installed
try {
  require('glob');
} catch (e) {
  console.error('glob package is required. Installing...');
  const { execSync } = require('child_process');
  execSync('npm install glob', { stdio: 'inherit' });
}

// Run main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});