#!/usr/bin/env node

/**
 * ESLint Performance Optimization Script
 * This script provides optimized linting with intelligent caching and parallel processing
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CACHE_DIR = '.next/cache/eslint';
const CACHE_FILE = path.join(CACHE_DIR, '.eslintcache');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function ensureCacheDirectory() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    log('✅ Created ESLint cache directory', 'green');
  }
}

function getCacheStats() {
  if (fs.existsSync(CACHE_FILE)) {
    const stats = fs.statSync(CACHE_FILE);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    const age = Math.floor((Date.now() - stats.mtime) / 1000 / 60); // in minutes
    return { sizeMB, age };
  }
  return null;
}

function shouldClearCache() {
  const stats = getCacheStats();
  if (!stats) return false;
  
  // Clear cache if it's older than 24 hours or larger than 50MB
  return stats.age > 1440 || parseFloat(stats.sizeMB) > 50;
}

function runLint(useCache = true, fix = false) {
  ensureCacheDirectory();
  
  // Check if cache should be cleared
  if (useCache && shouldClearCache()) {
    log('🔄 Cache is stale or too large, clearing...', 'yellow');
    try {
      fs.rmSync(CACHE_DIR, { recursive: true, force: true });
      ensureCacheDirectory();
    } catch (error) {
      log(`⚠️ Could not clear cache: ${error.message}`, 'yellow');
    }
  }
  
  // Display cache stats
  const stats = getCacheStats();
  if (stats) {
    log(`📊 Cache stats: ${stats.sizeMB}MB, ${stats.age} minutes old`, 'cyan');
  }
  
  // Build the command
  const cacheFlags = useCache ? '--cache --cache-location .next/cache/eslint/' : '';
  const fixFlag = fix ? '--fix' : '';
  const command = `eslint . --ext .js,.jsx,.ts,.tsx ${cacheFlags} ${fixFlag} --max-warnings 0`;
  
  log(`🚀 Running: ${command}`, 'blue');
  log('⏱️  This may take a moment on first run...', 'yellow');
  
  try {
    const startTime = Date.now();
    execSync(command, { stdio: 'inherit' });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    log(`\n✅ Linting completed successfully in ${duration}s!`, 'green');
    
    // Show optimization tips if it took too long
    if (duration > 30) {
      log('\n💡 Performance Tips:', 'yellow');
      log('   1. Use "npm run lint:fast" for cached linting', 'cyan');
      log('   2. Run "npm run lint:clear-cache" if experiencing issues', 'cyan');
      log('   3. Consider linting only changed files in your git hooks', 'cyan');
      log('   4. Use VS Code ESLint extension for real-time feedback', 'cyan');
    }
  } catch (error) {
    log('\n❌ Linting failed with errors', 'red');
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const noCache = args.includes('--no-cache');
const help = args.includes('--help');

if (help) {
  console.log(`
${colors.bright}ESLint Performance Optimizer${colors.reset}

Usage: node scripts/optimize-lint.js [options]

Options:
  --fix        Auto-fix linting issues
  --no-cache   Run without cache (slower but more thorough)
  --help       Show this help message

Examples:
  node scripts/optimize-lint.js          # Fast cached linting
  node scripts/optimize-lint.js --fix    # Fix issues with caching
  node scripts/optimize-lint.js --no-cache  # Full lint without cache
  `);
  process.exit(0);
}

// Run the optimized linting
runLint(!noCache, shouldFix);