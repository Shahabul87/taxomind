#!/usr/bin/env node

/**
 * Memory diagnostic tool for identifying and resolving Node.js memory issues
 */

const os = require('os');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Memory Diagnostic Tool for Taxomind Project\n');
console.log('=' .repeat(60));

// System Information
console.log('\n📊 System Information:');
console.log(`  • Platform: ${os.platform()}`);
console.log(`  • Architecture: ${os.arch()}`);
console.log(`  • Node.js Version: ${process.version}`);
console.log(`  • Total Memory: ${(os.totalmem() / (1024 ** 3)).toFixed(2)} GB`);
console.log(`  • Free Memory: ${(os.freemem() / (1024 ** 3)).toFixed(2)} GB`);
console.log(`  • CPU Cores: ${os.cpus().length}`);

// Current Node.js Memory Settings
console.log('\n⚙️  Current Node.js Memory Settings:');
const currentOptions = process.env.NODE_OPTIONS || 'Not set';
console.log(`  • NODE_OPTIONS: ${currentOptions}`);

// Check Node.js heap statistics
if (process.memoryUsage) {
  const usage = process.memoryUsage();
  console.log('\n💾 Current Process Memory Usage:');
  console.log(`  • RSS: ${(usage.rss / (1024 ** 2)).toFixed(2)} MB`);
  console.log(`  • Heap Total: ${(usage.heapTotal / (1024 ** 2)).toFixed(2)} MB`);
  console.log(`  • Heap Used: ${(usage.heapUsed / (1024 ** 2)).toFixed(2)} MB`);
  console.log(`  • External: ${(usage.external / (1024 ** 2)).toFixed(2)} MB`);
}

// Check for large files that might cause memory issues
console.log('\n📁 Checking for large files in the project:');
const checkLargeFiles = () => {
  try {
    const files = execSync('find . -type f -size +10M -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./.next/*" 2>/dev/null || true', {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10
    }).trim();
    
    if (files) {
      console.log('  Large files found (>10MB):');
      files.split('\n').forEach(file => {
        if (file) {
          try {
            const stats = fs.statSync(file);
            console.log(`    • ${file}: ${(stats.size / (1024 ** 2)).toFixed(2)} MB`);
          } catch (e) {
            // Ignore errors for individual files
          }
        }
      });
    } else {
      console.log('  ✅ No large files found');
    }
  } catch (error) {
    console.log('  ⚠️  Could not check for large files');
  }
};
checkLargeFiles();

// Check cache directories
console.log('\n🗑️  Cache Directories:');
const cacheDirectories = [
  'node_modules/.cache',
  '.next/cache',
  '.next/cache/eslint',
  '.turbo',
  'dist',
  'build',
];

cacheDirectories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    try {
      const size = execSync(`du -sh "${fullPath}" 2>/dev/null | cut -f1`, { encoding: 'utf8' }).trim();
      console.log(`  • ${dir}: ${size}`);
    } catch (e) {
      console.log(`  • ${dir}: exists (size unknown)`);
    }
  }
});

// Recommendations
console.log('\n💡 Recommendations:');
console.log('  1. Clear all caches:');
console.log('     rm -rf node_modules/.cache .next/cache');
console.log('');
console.log('  2. Use memory-optimized commands:');
console.log('     npm run tsc:noEmit       # TypeScript check with 8GB memory');
console.log('     npm run lint             # ESLint with 8GB memory');
console.log('     npm run test:ci          # Tests with 8GB memory');
console.log('');
console.log('  3. For immediate testing, run with explicit memory:');
console.log('     NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit');
console.log('');
console.log('  4. If issues persist, try:');
console.log('     • Close other applications to free memory');
console.log('     • Restart your terminal/IDE');
console.log('     • Clear TypeScript cache: npx tsc --build --clean');
console.log('     • Reinstall dependencies: rm -rf node_modules && npm install');

// Test memory allocation
console.log('\n🧪 Testing memory allocation...');
try {
  const testCommand = 'NODE_OPTIONS="--max-old-space-size=8192" node -e "console.log(process.memoryUsage())"';
  const result = execSync(testCommand, { encoding: 'utf8' });
  console.log('  ✅ Memory allocation test successful');
} catch (error) {
  console.log('  ❌ Memory allocation test failed');
  console.log('     Error:', error.message);
}

console.log('\n' + '=' .repeat(60));
console.log('Diagnostic complete!\n');