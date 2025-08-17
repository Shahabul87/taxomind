#!/usr/bin/env node

/**
 * CI Test Runner Script
 * Splits tests into chunks and runs them with resource limits
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  maxMemory: '2048', // MB
  timeout: 300000, // 5 minutes per test suite
  chunks: 4, // Split tests into 4 groups
  retries: 1, // Retry failed tests once
};

// Find all test files
function findTestFiles() {
  const testPatterns = ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx'];
  const ignoreDirs = ['node_modules', '.next', 'coverage', 'dist', 'backups', 'e2e'];
  
  function walkDir(dir, files = []) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        const dirname = path.basename(fullPath);
        if (!ignoreDirs.includes(dirname) && !dirname.startsWith('.')) {
          walkDir(fullPath, files);
        }
      } else if (testPatterns.some(pattern => fullPath.endsWith(pattern))) {
        // Skip performance and stress tests in CI
        if (!fullPath.includes('.performance.') && 
            !fullPath.includes('.stress.') && 
            !fullPath.includes('/performance/') &&
            !fullPath.includes('/stress/')) {
          files.push(fullPath);
        }
      }
    }
    
    return files;
  }
  
  return walkDir(process.cwd());
}

// Split test files into chunks
function chunkTests(files, chunks) {
  const result = [];
  const chunkSize = Math.ceil(files.length / chunks);
  
  for (let i = 0; i < chunks; i++) {
    result.push(files.slice(i * chunkSize, (i + 1) * chunkSize));
  }
  
  return result.filter(chunk => chunk.length > 0);
}

// Run a test chunk with resource limits
function runTestChunk(testFiles, chunkIndex) {
  console.log(`\n🧪 Running test chunk ${chunkIndex + 1}/${CONFIG.chunks}`);
  console.log(`   Files: ${testFiles.length}`);
  
  const testPattern = testFiles.map(f => path.relative(process.cwd(), f)).join(' ');
  
  const command = [
    `NODE_OPTIONS="--max-old-space-size=${CONFIG.maxMemory}"`,
    'npx jest',
    '--config=jest.config.ci.js',
    '--runInBand', // Run tests serially within chunk
    '--no-cache',
    '--no-watchman',
    `--testTimeout=${CONFIG.timeout}`,
    testPattern
  ].join(' ');
  
  try {
    execSync(command, {
      stdio: 'inherit',
      env: {
        ...process.env,
        CI: 'true',
        NODE_ENV: 'test',
        FORCE_COLOR: '0', // Disable color output
      }
    });
    
    console.log(`✅ Chunk ${chunkIndex + 1} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Chunk ${chunkIndex + 1} failed`);
    
    if (CONFIG.retries > 0) {
      console.log(`🔄 Retrying chunk ${chunkIndex + 1}...`);
      CONFIG.retries--;
      return runTestChunk(testFiles, chunkIndex);
    }
    
    return false;
  }
}

// Main execution
function main() {
  console.log('🚀 Starting CI Test Runner');
  console.log(`   Max Memory: ${CONFIG.maxMemory}MB`);
  console.log(`   Timeout: ${CONFIG.timeout}ms`);
  console.log(`   Chunks: ${CONFIG.chunks}`);
  
  // Find all test files
  const testFiles = findTestFiles();
  console.log(`\n📁 Found ${testFiles.length} test files`);
  
  if (testFiles.length === 0) {
    console.log('⚠️  No test files found');
    process.exit(0);
  }
  
  // Split into chunks
  const chunks = chunkTests(testFiles, CONFIG.chunks);
  
  // Run each chunk
  let allPassed = true;
  for (let i = 0; i < chunks.length; i++) {
    const passed = runTestChunk(chunks[i], i);
    if (!passed) {
      allPassed = false;
      // Continue running other chunks even if one fails
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ All test chunks passed successfully');
    process.exit(0);
  } else {
    console.log('❌ Some test chunks failed');
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Run
if (require.main === module) {
  main();
}