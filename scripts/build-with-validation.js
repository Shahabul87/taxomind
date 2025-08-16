#!/usr/bin/env node

/**
 * Build Script with Environment Validation
 * This script runs environment validation before building the application
 * and provides detailed feedback on any issues found.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function logSection(title) {
  console.log('\n' + colorize('='.repeat(50), 'cyan'));
  console.log(colorize(title, 'bright'));
  console.log(colorize('='.repeat(50), 'cyan'));
}

function logStep(step, status = 'info') {
  const icons = {
    info: '🔍',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    building: '🏗️',
  };
  console.log(`${icons[status]} ${step}`);
}

async function runCommand(command, description) {
  logStep(description, 'info');
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    return true;
  } catch (error) {
    logStep(`Failed: ${description}`, 'error');
    return false;
  }
}

async function checkPrerequisites() {
  logSection('Checking Build Prerequisites');
  
  // Check if node_modules exists
  if (!fs.existsSync('node_modules')) {
    logStep('node_modules not found - run npm install first', 'error');
    return false;
  }
  
  // Check if .next directory exists and remove it for clean build
  if (fs.existsSync('.next')) {
    logStep('Removing previous build artifacts', 'info');
    fs.rmSync('.next', { recursive: true, force: true });
  }
  
  // Check if environment file exists
  const envFiles = ['.env.local', '.env', '.env.development'];
  const hasEnvFile = envFiles.some(file => fs.existsSync(file));
  
  if (!hasEnvFile) {
    logStep('No environment file found - using process.env only', 'warning');
  } else {
    logStep('Environment file found', 'success');
  }
  
  return true;
}

async function validateEnvironment() {
  logSection('Environment Validation');
  
  const success = await runCommand(
    'node scripts/validate-env.js',
    'Running comprehensive environment validation'
  );
  
  if (!success) {
    console.log('\n' + colorize('Environment validation failed!', 'red'));
    console.log(colorize('Please fix the environment issues before building.', 'red'));
    console.log('\n' + colorize('Troubleshooting tips:', 'yellow'));
    console.log('• Check your .env.local file against .env.example');
    console.log('• Ensure all required variables are set');
    console.log('• Run "npm run validate:env" for detailed validation');
    return false;
  }
  
  logStep('Environment validation passed', 'success');
  return true;
}

async function runTypeCheck() {
  logSection('TypeScript Validation');
  
  const success = await runCommand(
    'NODE_OPTIONS=\'--max-old-space-size=8192\' npx tsc --noEmit',
    'Checking TypeScript types'
  );
  
  if (!success) {
    console.log('\n' + colorize('TypeScript validation failed!', 'red'));
    console.log(colorize('Please fix type errors before building.', 'red'));
    return false;
  }
  
  logStep('TypeScript validation passed', 'success');
  return true;
}

async function runLinting() {
  logSection('Code Linting');
  
  const success = await runCommand(
    'npm run lint',
    'Running ESLint checks'
  );
  
  if (!success) {
    console.log('\n' + colorize('Linting failed!', 'red'));
    console.log(colorize('Please fix linting errors before building.', 'red'));
    return false;
  }
  
  logStep('Linting passed', 'success');
  return true;
}

async function buildApplication() {
  logSection('Building Application');
  
  // Always use increased memory for builds to prevent heap issues
  const buildCommand = 'NODE_OPTIONS=\'--max-old-space-size=8192\' next build';
    
  logStep('Building Next.js application...', 'building');
  
  const success = await runCommand(buildCommand, 'Building application');
  
  if (!success) {
    console.log('\n' + colorize('Build failed!', 'red'));
    return false;
  }
  
  logStep('Build completed successfully', 'success');
  return true;
}

async function postBuildValidation() {
  logSection('Post-Build Validation');
  
  // Check if build output exists
  if (!fs.existsSync('.next')) {
    logStep('Build output directory not found', 'error');
    return false;
  }
  
  // Check for critical build files
  const criticalFiles = [
    '.next/build-manifest.json',
    '.next/static',
  ];
  
  for (const file of criticalFiles) {
    if (!fs.existsSync(file)) {
      logStep(`Critical build file missing: ${file}`, 'error');
      return false;
    }
  }
  
  logStep('Build output validation passed', 'success');
  
  // Generate build summary
  try {
    const buildId = fs.readFileSync('.next/BUILD_ID', 'utf8').trim();
    logStep(`Build ID: ${buildId}`, 'info');
  } catch (error) {
    logStep('Could not read build ID', 'warning');
  }
  
  return true;
}

async function main() {
  const startTime = Date.now();
  
  console.log(colorize('\n🚀 Taxomind LMS - Production Build', 'bright'));
  console.log(colorize(`Environment: ${process.env.NODE_ENV || 'development'}`, 'blue'));
  console.log(colorize(`Started at: ${new Date().toISOString()}`, 'blue'));
  
  try {
    // Step 1: Check prerequisites
    if (!(await checkPrerequisites())) {
      process.exit(1);
    }
    
    // Step 2: Validate environment
    if (!(await validateEnvironment())) {
      process.exit(1);
    }
    
    // Step 3: TypeScript validation (optional, can be skipped with SKIP_TYPE_CHECK)
    if (!process.env.SKIP_TYPE_CHECK) {
      if (!(await runTypeCheck())) {
        if (process.env.NODE_ENV === 'production') {
          process.exit(1);
        } else {
          logStep('TypeScript errors ignored in development', 'warning');
        }
      }
    }
    
    // Step 4: Linting (optional, can be skipped with SKIP_LINT)
    if (!process.env.SKIP_LINT) {
      if (!(await runLinting())) {
        if (process.env.NODE_ENV === 'production') {
          process.exit(1);
        } else {
          logStep('Linting errors ignored in development', 'warning');
        }
      }
    }
    
    // Step 5: Build application
    if (!(await buildApplication())) {
      process.exit(1);
    }
    
    // Step 6: Post-build validation
    if (!(await postBuildValidation())) {
      process.exit(1);
    }
    
    // Success!
    const duration = Math.round((Date.now() - startTime) / 1000);
    logSection('Build Completed Successfully');
    console.log(colorize(`✅ Build completed in ${duration}s`, 'green'));
    console.log(colorize(`🎉 Ready for deployment!`, 'green'));
    
    // Show deployment tips
    console.log('\n' + colorize('Next steps:', 'yellow'));
    console.log('• Run "npm start" to test the production build locally');
    console.log('• Deploy the .next directory and package.json to your hosting provider');
    console.log('• Ensure production environment variables are configured');
    
  } catch (error) {
    console.error('\n' + colorize('❌ Build failed with unexpected error:', 'red'));
    console.error(colorize(error.message, 'red'));
    console.error('\n' + colorize('Stack trace:', 'yellow'));
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n' + colorize('Build interrupted by user', 'yellow'));
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n' + colorize('Build terminated', 'yellow'));
  process.exit(143);
});

// Run the main function
main();