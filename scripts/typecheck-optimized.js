#!/usr/bin/env node

/**
 * Optimized TypeScript type checking script
 * Solves memory issues with large projects
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Configuration options
const configs = {
  fast: {
    name: 'Fast Check (App only)',
    args: ['--noEmit', '--incremental', '--tsBuildInfoFile', '.tsbuildinfo.fast', '--project', 'tsconfig.json'],
    memory: '6144'
  },
  standard: {
    name: 'Standard Check',
    args: ['--noEmit', '--incremental', '--project', 'tsconfig.build.json'],
    memory: '12288'
  },
  full: {
    name: 'Full Check (All files)',
    args: ['--noEmit', '--incremental'],
    memory: '16384'
  },
  watch: {
    name: 'Watch Mode',
    args: ['--noEmit', '--incremental', '--watch', '--preserveWatchOutput'],
    memory: '6144'
  }
};

function runTypeCheck(mode = 'standard', additionalArgs = []) {
  const config = configs[mode];
  
  if (!config) {
    log(`❌ Invalid mode: ${mode}`, 'red');
    log('Available modes: fast, standard, full, watch', 'yellow');
    process.exit(1);
  }

  log(`\n🔍 Running TypeScript ${config.name}...`, 'cyan');
  log(`📊 Memory allocated: ${config.memory}MB`, 'blue');
  
  // Set up environment with increased memory
  const env = {
    ...process.env,
    NODE_OPTIONS: `--max-old-space-size=${config.memory}`
  };

  // Build command arguments
  let args = [...config.args, ...additionalArgs];

  log(`⚡ Command: tsc ${args.join(' ')}`, 'magenta');
  log('⏳ This may take a moment...\n', 'yellow');

  const startTime = Date.now();
  
  // Spawn TypeScript compiler with increased memory
  const tsc = spawn('npx', ['tsc', ...args], {
    env,
    stdio: 'inherit',
    shell: true
  });

  tsc.on('error', (error) => {
    log(`\n❌ Failed to start TypeScript compiler: ${error.message}`, 'red');
    process.exit(1);
  });

  tsc.on('close', (code) => {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (code === 0) {
      log(`\n✅ TypeScript check completed successfully in ${duration}s!`, 'green');
      
      // Show tips for faster checking
      if (duration > 30 && mode !== 'fast') {
        log('\n💡 Performance Tips:', 'yellow');
        log('   1. Use "npm run typecheck:fast" for quick checks', 'cyan');
        log('   2. Use "npm run typecheck:watch" for continuous checking', 'cyan');
        log('   3. VS Code provides real-time TypeScript feedback', 'cyan');
        log('   4. Consider splitting large files to improve performance', 'cyan');
      }
    } else if (code !== null) {
      log(`\n❌ TypeScript check failed with ${code} error(s)`, 'red');
      process.exit(code);
    }
  });
}

// Clean up old build info files
function cleanBuildInfo() {
  const files = ['.tsbuildinfo', '.tsbuildinfo.fast', 'tsconfig.tsbuildinfo'];
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
        log(`🧹 Cleaned ${file}`, 'green');
      } catch (error) {
        log(`⚠️ Could not clean ${file}: ${error.message}`, 'yellow');
      }
    }
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const mode = args[0] || 'standard';
const additionalArgs = args.slice(1);

// Handle special commands
if (mode === '--help' || mode === '-h') {
  console.log(`
${colors.bright}TypeScript Optimized Type Checker${colors.reset}

Usage: node scripts/typecheck-optimized.js [mode] [additional tsc flags]

Modes:
  fast      Quick check of app directory only (4GB memory)
  standard  Standard check with optimized config (6GB memory) [default]
  full      Full project check (8GB memory)
  watch     Watch mode for continuous checking (4GB memory)
  clean     Clean build info files

Examples:
  node scripts/typecheck-optimized.js              # Standard check
  node scripts/typecheck-optimized.js fast         # Fast app-only check
  node scripts/typecheck-optimized.js watch        # Watch mode
  node scripts/typecheck-optimized.js full --strict  # Full check with strict mode
  node scripts/typecheck-optimized.js clean        # Clean cache files

Performance Tips:
  - Use 'fast' mode for quick iteration during development
  - Use 'standard' mode for pre-commit checks
  - Use 'full' mode for CI/CD pipelines
  - Use 'watch' mode for continuous feedback
  `);
  process.exit(0);
}

if (mode === 'clean') {
  cleanBuildInfo();
  log('✨ Build info files cleaned!', 'green');
  process.exit(0);
}

// Run the type checker
runTypeCheck(mode, additionalArgs);