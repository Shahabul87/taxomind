#!/usr/bin/env node

/**
 * Test Coverage Tracker
 * Helps monitor and improve test coverage over time
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Coverage thresholds
const THRESHOLDS = {
  immediate: 20,  // Week 1-3
  short: 35,      // Week 4-6
  medium: 50,     // Week 7-9
  target: 70      // Week 10-12
};

function runCoverage() {
  console.log(`${colors.cyan}Running test coverage analysis...${colors.reset}\n`);
  
  try {
    // Run tests with coverage
    const output = execSync('npm test -- --coverage --coverageReporters=json-summary --silent', {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    // Read coverage summary
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    if (!fs.existsSync(coveragePath)) {
      console.error(`${colors.red}Coverage file not found. Run tests first.${colors.reset}`);
      process.exit(1);
    }
    
    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    return coverage;
  } catch (error) {
    console.error(`${colors.red}Error running tests: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

function analyzeCoverage(coverage) {
  const total = coverage.total;
  const metrics = {
    statements: total.statements.pct,
    branches: total.branches.pct,
    functions: total.functions.pct,
    lines: total.lines.pct
  };
  
  const average = (metrics.statements + metrics.branches + metrics.functions + metrics.lines) / 4;
  
  return { metrics, average };
}

function getStatusIcon(value, threshold) {
  if (value >= threshold) return '✅';
  if (value >= threshold * 0.8) return '⚠️ ';
  return '❌';
}

function getProgressBar(value, max = 100, width = 30) {
  const filled = Math.floor((value / max) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  
  if (value >= 70) return `${colors.green}${bar}${colors.reset}`;
  if (value >= 50) return `${colors.yellow}${bar}${colors.reset}`;
  if (value >= 20) return `${colors.magenta}${bar}${colors.reset}`;
  return `${colors.red}${bar}${colors.reset}`;
}

function displayResults(metrics, average) {
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}                    TEST COVERAGE REPORT                    ${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);
  
  // Current Coverage
  console.log(`${colors.white}📊 Current Coverage:${colors.reset}\n`);
  
  Object.entries(metrics).forEach(([key, value]) => {
    const icon = getStatusIcon(value, THRESHOLDS.immediate);
    const bar = getProgressBar(value);
    console.log(`   ${icon} ${key.padEnd(12)} ${bar} ${value.toFixed(2)}%`);
  });
  
  console.log(`\n   📈 Average: ${getProgressBar(average)} ${average.toFixed(2)}%\n`);
  
  // Threshold Status
  console.log(`${colors.white}🎯 Threshold Status:${colors.reset}\n`);
  
  Object.entries(THRESHOLDS).forEach(([phase, threshold]) => {
    const status = average >= threshold ? '✅ PASSED' : '❌ FAILED';
    const color = average >= threshold ? colors.green : colors.red;
    console.log(`   ${phase.padEnd(10)} (${threshold}%): ${color}${status}${colors.reset}`);
  });
  
  // Progress to Next Goal
  const currentPhase = Object.entries(THRESHOLDS).find(([_, threshold]) => average < threshold);
  if (currentPhase) {
    const [phaseName, threshold] = currentPhase;
    const needed = threshold - average;
    console.log(`\n${colors.yellow}📍 Next Goal: ${phaseName.toUpperCase()} (${threshold}%)${colors.reset}`);
    console.log(`   Need ${needed.toFixed(2)}% more coverage\n`);
  } else {
    console.log(`\n${colors.green}🎉 Congratulations! You've reached the target coverage!${colors.reset}\n`);
  }
}

function suggestNextSteps(average) {
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}                      NEXT STEPS                            ${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);
  
  if (average < 20) {
    console.log(`${colors.yellow}Priority Actions (Week 1-3):${colors.reset}`);
    console.log('1. Fix all failing tests first');
    console.log('2. Add tests for authentication flows');
    console.log('3. Test critical business logic (get-courses, get-user-courses)');
    console.log('4. Set up CI/CD pipeline with test requirements\n');
  } else if (average < 35) {
    console.log(`${colors.yellow}Priority Actions (Week 4-6):${colors.reset}`);
    console.log('1. Add payment system tests');
    console.log('2. Test enrollment workflows');
    console.log('3. Add integration tests for critical paths');
    console.log('4. Mock external services (Stripe, AI services)\n');
  } else if (average < 50) {
    console.log(`${colors.yellow}Priority Actions (Week 7-9):${colors.reset}`);
    console.log('1. Test content management features');
    console.log('2. Add AI feature tests with mocked responses');
    console.log('3. Test analytics and reporting modules');
    console.log('4. Increase component test coverage\n');
  } else if (average < 70) {
    console.log(`${colors.yellow}Priority Actions (Week 10-12):${colors.reset}`);
    console.log('1. Complete API route testing');
    console.log('2. Add edge case tests');
    console.log('3. Test error boundaries and loading states');
    console.log('4. Add performance and security tests\n');
  } else {
    console.log(`${colors.green}Maintenance Actions:${colors.reset}`);
    console.log('1. Maintain coverage above 70%');
    console.log('2. Add tests for all new features');
    console.log('3. Refactor and optimize existing tests');
    console.log('4. Monitor and reduce test execution time\n');
  }
}

function generateCoverageHistory() {
  const historyFile = path.join(process.cwd(), '.coverage-history.json');
  let history = [];
  
  if (fs.existsSync(historyFile)) {
    history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
  }
  
  return history;
}

function saveCoverageHistory(metrics, average) {
  const historyFile = path.join(process.cwd(), '.coverage-history.json');
  let history = generateCoverageHistory();
  
  const entry = {
    date: new Date().toISOString(),
    metrics,
    average
  };
  
  history.push(entry);
  
  // Keep only last 30 entries
  if (history.length > 30) {
    history = history.slice(-30);
  }
  
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
}

function showProgress() {
  const history = generateCoverageHistory();
  
  if (history.length > 1) {
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}                    COVERAGE TREND                          ${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);
    
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    
    const change = latest.average - previous.average;
    const changeIcon = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
    const changeColor = change > 0 ? colors.green : change < 0 ? colors.red : colors.yellow;
    
    console.log(`   Previous: ${previous.average.toFixed(2)}%`);
    console.log(`   Current:  ${latest.average.toFixed(2)}%`);
    console.log(`   ${changeIcon} Change:  ${changeColor}${change >= 0 ? '+' : ''}${change.toFixed(2)}%${colors.reset}\n`);
  }
}

// Main execution
async function main() {
  console.clear();
  console.log(`${colors.cyan}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║           TAXOMIND TEST COVERAGE TRACKER v1.0             ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  const coverage = runCoverage();
  const { metrics, average } = analyzeCoverage(coverage);
  
  displayResults(metrics, average);
  saveCoverageHistory(metrics, average);
  showProgress();
  suggestNextSteps(average);
  
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`Run ${colors.green}npm run coverage:track${colors.reset} to check progress anytime`);
  console.log(`View detailed report: ${colors.blue}open coverage/lcov-report/index.html${colors.reset}\n`);
  
  // Exit with error if below minimum threshold
  if (average < THRESHOLDS.immediate) {
    console.log(`${colors.red}⚠️  Coverage below minimum threshold (${THRESHOLDS.immediate}%)${colors.reset}\n`);
    process.exit(1);
  }
}

// Run the tracker
main().catch(console.error);