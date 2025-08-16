#!/usr/bin/env ts-node

/**
 * Build Optimization Script for Taxomind LMS
 * This script helps identify and fix common build issues
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function executeCommand(command: string, description: string): string | null {
  try {
    log(`\n${description}...`, colors.cyan);
    const result = execSync(command, { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 10 });
    return result;
  } catch (error: any) {
    log(`Error: ${error.message}`, colors.red);
    return null;
  }
}

async function main() {
  log('\n========================================', colors.magenta);
  log('   Taxomind Build Optimization Script   ', colors.magenta);
  log('========================================\n', colors.magenta);

  // Step 1: Clean build artifacts
  log('Step 1: Cleaning build artifacts', colors.blue);
  executeCommand('rm -rf .next', 'Removing .next directory');
  executeCommand('rm -rf node_modules/.cache', 'Clearing node_modules cache');

  // Step 2: Ensure Prisma client is generated
  log('\nStep 2: Generating Prisma Client', colors.blue);
  executeCommand('npx prisma generate', 'Generating Prisma client');

  // Step 3: Check for TypeScript errors
  log('\nStep 3: Analyzing TypeScript Errors', colors.blue);
  const tsErrors = executeCommand('npx tsc --noEmit 2>&1 | grep -E "error TS" | wc -l', 'Counting TypeScript errors');
  if (tsErrors) {
    const errorCount = parseInt(tsErrors.trim());
    log(`Found ${errorCount} TypeScript errors`, errorCount > 0 ? colors.yellow : colors.green);
    
    if (errorCount > 0) {
      // Get top error patterns
      const patterns = executeCommand(
        'npx tsc --noEmit 2>&1 | grep -E "error TS" | sed \'s/.*error TS/TS/\' | cut -d: -f1 | sort | uniq -c | sort -rn | head -10',
        'Analyzing error patterns'
      );
      
      if (patterns) {
        log('\nTop TypeScript Error Patterns:', colors.yellow);
        console.log(patterns);
        
        log('\nCommon fixes:', colors.green);
        log('• TS2339 (Property does not exist): Check object types and interfaces', colors.reset);
        log('• TS2304 (Cannot find name): Import missing modules or declare types', colors.reset);
        log('• TS2322 (Type not assignable): Fix type mismatches', colors.reset);
        log('• TS2345 (Argument type mismatch): Update function parameters', colors.reset);
        log('• TS7006 (Parameter implicitly any): Add explicit types', colors.reset);
      }
    }
  }

  // Step 4: Check for ESLint issues
  log('\nStep 4: Checking ESLint Issues', colors.blue);
  const lintResult = executeCommand('npm run lint 2>&1 | tail -20', 'Running ESLint');
  if (lintResult && lintResult.includes('error')) {
    log('ESLint errors found. Common fixes:', colors.yellow);
    log('• Use &apos; instead of apostrophes in JSX', colors.reset);
    log('• Import Image from next/image instead of using <img>', colors.reset);
    log('• Include all dependencies in useEffect/useCallback', colors.reset);
  }

  // Step 5: Create optimized build configuration
  log('\nStep 5: Creating Optimized Build Configuration', colors.blue);
  
  const buildConfig = {
    recommendations: [
      'Add missing dependencies with: npm install <package-name>',
      'Fix TypeScript errors in test files first (they account for many errors)',
      'Update import statements for deleted files (theme-provider)',
      'Consider temporarily skipping tests with: npm run build -- --no-lint',
      'Use incremental TypeScript compilation for faster builds',
    ],
    scripts: {
      'build:clean': 'rm -rf .next && npm run build',
      'build:fast': 'SKIP_ENV_VALIDATION=true npm run build',
      'build:analyze': 'ANALYZE=true npm run build',
      'type-check': 'tsc --noEmit --incremental',
      'lint:fix': 'next lint --fix',
    }
  };

  // Step 6: Suggest environment optimizations
  log('\nStep 6: Environment Optimizations', colors.blue);
  log('Checking Node.js memory settings...', colors.cyan);
  
  const currentMemory = process.env.NODE_OPTIONS?.includes('max-old-space-size') 
    ? process.env.NODE_OPTIONS 
    : 'Not set';
  
  log(`Current NODE_OPTIONS: ${currentMemory}`, colors.reset);
  log('Recommended for large builds:', colors.green);
  log('export NODE_OPTIONS="--max-old-space-size=8192"', colors.reset);

  // Step 7: Create a build report
  log('\nStep 7: Creating Build Report', colors.blue);
  
  const report = {
    timestamp: new Date().toISOString(),
    typeScriptErrors: tsErrors ? parseInt(tsErrors.trim()) : 0,
    recommendations: buildConfig.recommendations,
    nextSteps: [
      '1. Fix TypeScript errors in test files',
      '2. Update or remove broken imports',
      '3. Run: npm run build:clean',
      '4. If build still fails, use: NODE_OPTIONS="--max-old-space-size=8192" npm run build',
    ]
  };

  fs.writeFileSync(
    path.join(process.cwd(), 'build-report.json'),
    JSON.stringify(report, null, 2)
  );

  log('\n========================================', colors.magenta);
  log('   Build Optimization Complete!         ', colors.magenta);
  log('========================================\n', colors.magenta);
  
  log('Next Steps:', colors.green);
  report.nextSteps.forEach((step, index) => {
    log(step, colors.reset);
  });
  
  log('\nBuild report saved to: build-report.json', colors.cyan);
  log('\nTo attempt a build now, run:', colors.yellow);
  log('NODE_OPTIONS="--max-old-space-size=8192" npm run build', colors.reset);
}

main().catch(console.error);