#!/usr/bin/env node

/**
 * Memory Diagnostic Tool for Jest Tests
 * Identifies which tests are consuming excessive memory
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Starting Memory Diagnostic...\n');

// Configuration
const MEMORY_THRESHOLD = 100; // MB - tests using more than this are flagged
const memoryUsage = [];

// Function to run a single test and measure memory
async function runTestWithMemory(testFile) {
  return new Promise((resolve) => {
    const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    
    const args = [
      '--config', 'jest.config.optimized.js',
      '--runInBand',
      '--logHeapUsage',
      testFile
    ];
    
    const env = {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=2048 --expose-gc',
      CI: 'true'
    };
    
    const jest = spawn('npx', ['jest', ...args], {
      env,
      stdio: 'pipe'
    });
    
    let output = '';
    let heapSize = 0;
    
    jest.stdout.on('data', (data) => {
      output += data.toString();
      // Extract heap size from output
      const match = data.toString().match(/(\d+) MB heap size/);
      if (match) {
        heapSize = parseInt(match[1]);
      }
    });
    
    jest.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    jest.on('close', (code) => {
      const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      const memoryDiff = endMemory - startMemory;
      
      resolve({
        file: testFile,
        passed: code === 0,
        heapSize: heapSize || memoryDiff,
        memoryDiff: Math.round(memoryDiff)
      });
    });
  });
}

// Main diagnostic function
async function diagnose() {
  // Find all test files
  const glob = require('glob');
  const testFiles = glob.sync('**/*.{test,spec}.{js,jsx,ts,tsx}', {
    cwd: process.cwd(),
    ignore: [
      '**/node_modules/**',
      '**/.next/**',
      '**/coverage/**',
      '**/dist/**',
      '**/backups/**'
    ]
  });
  
  console.log(`Found ${testFiles.length} test files to analyze\n`);
  
  // Test each file
  for (let i = 0; i < Math.min(testFiles.length, 10); i++) { // Test first 10 files
    console.log(`Testing ${i + 1}/${Math.min(testFiles.length, 10)}: ${testFiles[i]}`);
    
    // Force garbage collection before each test
    if (global.gc) {
      global.gc();
    }
    
    const result = await runTestWithMemory(testFiles[i]);
    memoryUsage.push(result);
    
    if (result.heapSize > MEMORY_THRESHOLD) {
      console.log(`  ⚠️  High memory usage: ${result.heapSize}MB`);
    } else {
      console.log(`  ✅ Memory usage: ${result.heapSize}MB`);
    }
  }
  
  // Generate report
  console.log('\n' + '='.repeat(60));
  console.log('MEMORY USAGE REPORT');
  console.log('='.repeat(60));
  
  // Sort by memory usage
  memoryUsage.sort((a, b) => b.heapSize - a.heapSize);
  
  console.log('\nTop Memory Consumers:');
  memoryUsage.slice(0, 5).forEach((test, index) => {
    console.log(`${index + 1}. ${test.file}`);
    console.log(`   Heap Size: ${test.heapSize}MB`);
    console.log(`   Status: ${test.passed ? '✅ Passed' : '❌ Failed'}`);
  });
  
  const avgMemory = memoryUsage.reduce((acc, t) => acc + t.heapSize, 0) / memoryUsage.length;
  console.log(`\nAverage Memory Usage: ${Math.round(avgMemory)}MB`);
  
  const highMemoryTests = memoryUsage.filter(t => t.heapSize > MEMORY_THRESHOLD);
  if (highMemoryTests.length > 0) {
    console.log(`\n⚠️  ${highMemoryTests.length} tests exceed ${MEMORY_THRESHOLD}MB threshold`);
    console.log('Consider refactoring these tests or mocking heavy dependencies');
  }
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    totalTests: testFiles.length,
    analyzed: memoryUsage.length,
    averageMemory: Math.round(avgMemory),
    threshold: MEMORY_THRESHOLD,
    highMemoryTests: highMemoryTests.map(t => ({
      file: t.file,
      memory: t.heapSize
    }))
  };
  
  fs.writeFileSync(
    path.join(process.cwd(), 'jest-memory-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('\nDetailed report saved to jest-memory-report.json');
}

// Check if glob is installed
try {
  require('glob');
} catch (e) {
  console.log('Installing required dependency...');
  const { execSync } = require('child_process');
  execSync('npm install glob', { stdio: 'inherit' });
}

// Run diagnostic
diagnose().catch(error => {
  console.error('Diagnostic failed:', error);
  process.exit(1);
});