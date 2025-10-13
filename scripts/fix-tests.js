#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Get all test files
function getTestFiles() {
  try {
    const output = execSync('find . -type f \\( -name "*.test.ts" -o -name "*.test.tsx" \\) ! -path "./node_modules/*" ! -path "./backups/*" ! -path "./.next/*"', {
      encoding: 'utf8',
    });
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    log('Error finding test files', 'red');
    return [];
  }
}

// Run tests and get results
function runTests(files) {
  const fileList = files.join(' ');
  try {
    const output = execSync(`npm run test:ci -- ${fileList} --json --outputFile=test-results.json`, {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return JSON.parse(fs.readFileSync('test-results.json', 'utf8'));
  } catch (error) {
    // Even if tests fail, we should have the JSON output
    if (fs.existsSync('test-results.json')) {
      return JSON.parse(fs.readFileSync('test-results.json', 'utf8'));
    }
    return null;
  }
}

// Analyze test failures
function analyzeFailures(results) {
  if (!results || !results.testResults) return [];
  
  const failures = [];
  
  results.testResults.forEach(suite => {
    if (suite.status === 'failed') {
      const failure = {
        file: suite.name,
        errors: [],
        failedTests: [],
      };
      
      if (suite.message) {
        failure.errors.push(suite.message);
      }
      
      if (suite.assertionResults) {
        suite.assertionResults.forEach(test => {
          if (test.status === 'failed') {
            failure.failedTests.push({
              title: test.title,
              message: test.failureMessages ? test.failureMessages[0] : 'Unknown error',
            });
          }
        });
      }
      
      failures.push(failure);
    }
  });
  
  return failures;
}

// Categorize failures
function categorizeFailures(failures) {
  const categories = {
    typeErrors: [],
    importErrors: [],
    mockErrors: [],
    renderErrors: [],
    databaseErrors: [],
    authErrors: [],
    other: [],
  };
  
  failures.forEach(failure => {
    let categorized = false;
    
    const allErrors = [
      ...failure.errors,
      ...failure.failedTests.map(t => t.message),
    ].join(' ');
    
    if (allErrors.includes('Cannot find module') || allErrors.includes('Module not found')) {
      categories.importErrors.push(failure);
      categorized = true;
    } else if (allErrors.includes('TypeError') || allErrors.includes('Property') || allErrors.includes('undefined')) {
      categories.typeErrors.push(failure);
      categorized = true;
    } else if (allErrors.includes('mock') || allErrors.includes('Mock')) {
      categories.mockErrors.push(failure);
      categorized = true;
    } else if (allErrors.includes('render') || allErrors.includes('ReactDOM') || allErrors.includes('addEventListener')) {
      categories.renderErrors.push(failure);
      categorized = true;
    } else if (allErrors.includes('prisma') || allErrors.includes('database') || allErrors.includes('db')) {
      categories.databaseErrors.push(failure);
      categorized = true;
    } else if (allErrors.includes('auth') || allErrors.includes('session') || allErrors.includes('token')) {
      categories.authErrors.push(failure);
      categorized = true;
    }
    
    if (!categorized) {
      categories.other.push(failure);
    }
  });
  
  return categories;
}

// Generate fix recommendations
function generateFixRecommendations(categories) {
  const recommendations = [];
  
  if (categories.importErrors.length > 0) {
    recommendations.push({
      category: 'Import Errors',
      count: categories.importErrors.length,
      fixes: [
        'Check that all imported modules exist',
        'Verify module paths are correct',
        'Add missing mock implementations in jest.setup.enhanced.js',
        'Check transformIgnorePatterns in jest.config.ci.js',
      ],
    });
  }
  
  if (categories.typeErrors.length > 0) {
    recommendations.push({
      category: 'Type Errors',
      count: categories.typeErrors.length,
      fixes: [
        'Add proper TypeScript types to test files',
        'Mock missing properties on objects',
        'Check for undefined values before accessing properties',
        'Ensure all required props are passed to components',
      ],
    });
  }
  
  if (categories.mockErrors.length > 0) {
    recommendations.push({
      category: 'Mock Errors',
      count: categories.mockErrors.length,
      fixes: [
        'Verify all jest.mock() calls are properly configured',
        'Ensure mock implementations match expected interfaces',
        'Check that mocked functions return expected values',
      ],
    });
  }
  
  if (categories.renderErrors.length > 0) {
    recommendations.push({
      category: 'Render Errors',
      count: categories.renderErrors.length,
      fixes: [
        'Add window/document mocks for browser APIs',
        'Mock framer-motion and other animation libraries',
        'Ensure React Testing Library is properly configured',
      ],
    });
  }
  
  if (categories.databaseErrors.length > 0) {
    recommendations.push({
      category: 'Database Errors',
      count: categories.databaseErrors.length,
      fixes: [
        'Mock Prisma client properly',
        'Add mock implementations for all database models',
        'Ensure transaction mocks are configured',
      ],
    });
  }
  
  if (categories.authErrors.length > 0) {
    recommendations.push({
      category: 'Auth Errors',
      count: categories.authErrors.length,
      fixes: [
        'Mock NextAuth properly',
        'Add session and token mocks',
        'Configure auth provider mocks',
      ],
    });
  }
  
  return recommendations;
}

// Main execution
async function main() {
  log('\n=== Test Failure Analysis Tool ===\n', 'cyan');
  
  log('Finding test files...', 'yellow');
  const testFiles = getTestFiles();
  log(`Found ${testFiles.length} test files`, 'green');
  
  log('\nRunning tests to identify failures...', 'yellow');
  const results = runTests(testFiles);
  
  if (!results) {
    log('Could not get test results', 'red');
    return;
  }
  
  log('\nAnalyzing failures...', 'yellow');
  const failures = analyzeFailures(results);
  log(`Found ${failures.length} failing test suites`, failures.length > 0 ? 'red' : 'green');
  
  if (failures.length === 0) {
    log('\nAll tests are passing! 🎉', 'green');
    return;
  }
  
  log('\nCategorizing failures...', 'yellow');
  const categories = categorizeFailures(failures);
  
  log('\n=== Failure Summary ===\n', 'cyan');
  Object.entries(categories).forEach(([category, files]) => {
    if (files.length > 0) {
      log(`${category}: ${files.length} suites`, 'yellow');
    }
  });
  
  log('\n=== Recommendations ===\n', 'cyan');
  const recommendations = generateFixRecommendations(categories);
  recommendations.forEach(rec => {
    log(`\n${rec.category} (${rec.count} suites):`, 'yellow');
    rec.fixes.forEach(fix => {
      log(`  • ${fix}`, 'white');
    });
  });
  
  // Save detailed report
  const report = {
    summary: {
      total: results.numTotalTestSuites,
      passed: results.numPassedTestSuites,
      failed: results.numFailedTestSuites,
      pending: results.numPendingTestSuites,
    },
    failures,
    categories,
    recommendations,
  };
  
  fs.writeFileSync('test-failure-report.json', JSON.stringify(report, null, 2));
  log('\nDetailed report saved to test-failure-report.json', 'green');
  
  // Output specific files that need fixing
  log('\n=== Files to Fix (Priority Order) ===\n', 'cyan');
  
  // Priority 1: Import/Module errors (blocks everything)
  if (categories.importErrors.length > 0) {
    log('Priority 1 - Import/Module Errors:', 'red');
    categories.importErrors.slice(0, 5).forEach(f => {
      log(`  ${f.file}`, 'white');
    });
  }
  
  // Priority 2: Mock errors
  if (categories.mockErrors.length > 0) {
    log('\nPriority 2 - Mock Errors:', 'yellow');
    categories.mockErrors.slice(0, 5).forEach(f => {
      log(`  ${f.file}`, 'white');
    });
  }
  
  // Priority 3: Type errors
  if (categories.typeErrors.length > 0) {
    log('\nPriority 3 - Type Errors:', 'yellow');
    categories.typeErrors.slice(0, 5).forEach(f => {
      log(`  ${f.file}`, 'white');
    });
  }
}

main().catch(error => {
  log(`Error: ${error.message}`, 'red');
  process.exit(1);
});