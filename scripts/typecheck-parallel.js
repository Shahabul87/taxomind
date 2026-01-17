#!/usr/bin/env node
/**
 * Parallel TypeScript Type Checking Script
 * 
 * Industry-standard solution for large TypeScript codebases:
 * 1. Uses TypeScript Project References for incremental builds
 * 2. Only re-checks changed packages
 * 3. Caches results in .tsbuildinfo files
 * 4. Can run in parallel with build
 * 
 * Usage:
 *   npm run typecheck:parallel         # Incremental check
 *   npm run typecheck:parallel:force   # Full rebuild
 *   npm run typecheck:parallel:watch   # Watch mode
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const BUILD_CONFIG = path.join(ROOT, 'tsconfig.build.json');

const args = process.argv.slice(2);
const isForce = args.includes('--force') || args.includes('-f');
const isWatch = args.includes('--watch') || args.includes('-w');
const isClean = args.includes('--clean') || args.includes('-c');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(cmd, options = {}) {
  try {
    execSync(cmd, { 
      cwd: ROOT, 
      stdio: 'inherit',
      ...options 
    });
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  log('\n🔍 TypeScript Parallel Type Checker', colors.cyan);
  log('━'.repeat(50), colors.cyan);

  // Check if tsconfig.build.json exists
  if (!fs.existsSync(BUILD_CONFIG)) {
    log('\n❌ tsconfig.build.json not found!', colors.red);
    log('Run: npm run setup:typecheck to create it', colors.yellow);
    process.exit(1);
  }

  if (isClean) {
    log('\n🧹 Cleaning build cache...', colors.yellow);
    runCommand('tsc --build tsconfig.build.json --clean');
    log('✅ Cache cleaned', colors.green);
    return;
  }

  const buildArgs = ['--build', 'tsconfig.build.json'];
  
  if (isForce) {
    buildArgs.push('--force');
    log('\n⚡ Running FULL type check (forced rebuild)...', colors.yellow);
  } else if (isWatch) {
    buildArgs.push('--watch');
    log('\n👀 Starting watch mode...', colors.yellow);
  } else {
    log('\n⚡ Running INCREMENTAL type check...', colors.yellow);
    log('   (Only changed packages will be checked)', colors.cyan);
  }

  const startTime = Date.now();
  const success = runCommand(`tsc ${buildArgs.join(' ')}`);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  if (success) {
    log(`\n✅ Type check passed in ${duration}s`, colors.green);
    
    // Show cache info
    const cacheFiles = execSync('find packages -name ".tsbuildinfo" 2>/dev/null | wc -l', { cwd: ROOT }).toString().trim();
    log(`   📦 ${cacheFiles} package caches active`, colors.cyan);
  } else {
    log(`\n❌ Type check failed after ${duration}s`, colors.red);
    process.exit(1);
  }
}

main().catch(err => {
  log(`\n❌ Error: ${err.message}`, colors.red);
  process.exit(1);
});
