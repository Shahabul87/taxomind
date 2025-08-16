#!/usr/bin/env node

/**
 * Bundle Size Tracker
 * Tracks and reports on bundle sizes over time
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================
// CONFIGURATION
// ============================================

const BUILD_DIR = '.next';
const REPORT_FILE = 'bundle-size-report.json';
const HISTORY_FILE = 'bundle-size-history.json';
const MAX_HISTORY_ENTRIES = 30;

// Size thresholds (in bytes)
const THRESHOLDS = {
  totalSize: 5 * 1024 * 1024,        // 5MB total
  jsSize: 2 * 1024 * 1024,           // 2MB JavaScript
  cssSize: 500 * 1024,               // 500KB CSS
  imageSize: 3 * 1024 * 1024,        // 3MB images
  firstLoadJS: 200 * 1024,           // 200KB first load JS
  chunkSize: 500 * 1024,              // 500KB per chunk
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  function calculateSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        const files = fs.readdirSync(filePath);
        files.forEach(file => {
          calculateSize(path.join(filePath, file));
        });
      } else {
        totalSize += stats.size;
      }
    } catch (error) {
      // Ignore errors for inaccessible files
    }
  }
  
  if (fs.existsSync(dirPath)) {
    calculateSize(dirPath);
  }
  
  return totalSize;
}

function getFilesByExtension(dir, extension) {
  const files = [];
  
  function traverse(currentPath) {
    try {
      const items = fs.readdirSync(currentPath);
      items.forEach(item => {
        const itemPath = path.join(currentPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          traverse(itemPath);
        } else if (item.endsWith(extension)) {
          files.push({
            path: itemPath,
            size: stats.size,
          });
        }
      });
    } catch (error) {
      // Ignore errors
    }
  }
  
  if (fs.existsSync(dir)) {
    traverse(dir);
  }
  
  return files;
}

// ============================================
// ANALYSIS FUNCTIONS
// ============================================

function analyzeBuildOutput() {
  console.log('📊 Analyzing bundle sizes...\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    commit: getGitCommit(),
    sizes: {},
    chunks: [],
    pages: [],
    warnings: [],
  };
  
  // Check if build directory exists
  if (!fs.existsSync(BUILD_DIR)) {
    console.error('❌ Build directory not found. Please run build first.');
    process.exit(1);
  }
  
  // Calculate total build size
  report.sizes.total = getDirectorySize(BUILD_DIR);
  
  // Calculate specific directory sizes
  report.sizes.static = getDirectorySize(path.join(BUILD_DIR, 'static'));
  report.sizes.server = getDirectorySize(path.join(BUILD_DIR, 'server'));
  report.sizes.chunks = getDirectorySize(path.join(BUILD_DIR, 'static', 'chunks'));
  report.sizes.css = getDirectorySize(path.join(BUILD_DIR, 'static', 'css'));
  report.sizes.media = getDirectorySize(path.join(BUILD_DIR, 'static', 'media'));
  
  // Get JavaScript files
  const jsFiles = getFilesByExtension(path.join(BUILD_DIR, 'static', 'chunks'), '.js');
  report.sizes.totalJS = jsFiles.reduce((sum, file) => sum + file.size, 0);
  
  // Get CSS files
  const cssFiles = getFilesByExtension(path.join(BUILD_DIR, 'static', 'css'), '.css');
  report.sizes.totalCSS = cssFiles.reduce((sum, file) => sum + file.size, 0);
  
  // Analyze chunks
  report.chunks = jsFiles
    .map(file => ({
      name: path.basename(file.path),
      size: file.size,
      path: file.path.replace(BUILD_DIR, ''),
    }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 10); // Top 10 largest chunks
  
  // Check for threshold violations
  checkThresholds(report);
  
  return report;
}

function checkThresholds(report) {
  const { sizes, warnings } = report;
  
  if (sizes.total > THRESHOLDS.totalSize) {
    warnings.push({
      type: 'TOTAL_SIZE',
      message: `Total bundle size (${formatBytes(sizes.total)}) exceeds threshold (${formatBytes(THRESHOLDS.totalSize)})`,
      severity: 'high',
    });
  }
  
  if (sizes.totalJS > THRESHOLDS.jsSize) {
    warnings.push({
      type: 'JS_SIZE',
      message: `JavaScript size (${formatBytes(sizes.totalJS)}) exceeds threshold (${formatBytes(THRESHOLDS.jsSize)})`,
      severity: 'high',
    });
  }
  
  if (sizes.totalCSS > THRESHOLDS.cssSize) {
    warnings.push({
      type: 'CSS_SIZE',
      message: `CSS size (${formatBytes(sizes.totalCSS)}) exceeds threshold (${formatBytes(THRESHOLDS.cssSize)})`,
      severity: 'medium',
    });
  }
  
  // Check individual chunks
  report.chunks.forEach(chunk => {
    if (chunk.size > THRESHOLDS.chunkSize) {
      warnings.push({
        type: 'CHUNK_SIZE',
        message: `Chunk "${chunk.name}" (${formatBytes(chunk.size)}) exceeds threshold (${formatBytes(THRESHOLDS.chunkSize)})`,
        severity: 'medium',
      });
    }
  });
}

function getGitCommit() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch (error) {
    return 'unknown';
  }
}

// ============================================
// HISTORY MANAGEMENT
// ============================================

function loadHistory() {
  if (fs.existsSync(HISTORY_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    } catch (error) {
      console.warn('⚠️  Failed to load history file');
      return [];
    }
  }
  return [];
}

function saveHistory(history) {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('❌ Failed to save history:', error);
  }
}

function updateHistory(report) {
  let history = loadHistory();
  
  // Add new entry
  history.push({
    timestamp: report.timestamp,
    commit: report.commit,
    totalSize: report.sizes.total,
    jsSize: report.sizes.totalJS,
    cssSize: report.sizes.totalCSS,
  });
  
  // Keep only recent entries
  if (history.length > MAX_HISTORY_ENTRIES) {
    history = history.slice(-MAX_HISTORY_ENTRIES);
  }
  
  saveHistory(history);
  
  return history;
}

// ============================================
// REPORTING
// ============================================

function generateReport(report) {
  console.log('📋 Bundle Size Report');
  console.log('====================\n');
  
  console.log(`📅 Date: ${new Date(report.timestamp).toLocaleString()}`);
  console.log(`🔖 Commit: ${report.commit}\n`);
  
  console.log('📦 Bundle Sizes:');
  console.log(`  Total: ${formatBytes(report.sizes.total)}`);
  console.log(`  JavaScript: ${formatBytes(report.sizes.totalJS)}`);
  console.log(`  CSS: ${formatBytes(report.sizes.totalCSS)}`);
  console.log(`  Static: ${formatBytes(report.sizes.static)}`);
  console.log(`  Server: ${formatBytes(report.sizes.server)}\n`);
  
  console.log('📊 Top 5 Largest Chunks:');
  report.chunks.slice(0, 5).forEach((chunk, index) => {
    console.log(`  ${index + 1}. ${chunk.name}: ${formatBytes(chunk.size)}`);
  });
  
  if (report.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    report.warnings.forEach(warning => {
      const icon = warning.severity === 'high' ? '🔴' : '🟡';
      console.log(`  ${icon} ${warning.message}`);
    });
  } else {
    console.log('\n✅ All bundle sizes within thresholds');
  }
  
  // Save report to file
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`\n📄 Full report saved to ${REPORT_FILE}`);
}

function compareWithPrevious(current, history) {
  if (history.length < 2) return;
  
  const previous = history[history.length - 2];
  const sizeDiff = current.sizes.total - previous.totalSize;
  const jsDiff = current.sizes.totalJS - previous.jsSize;
  const cssDiff = current.sizes.totalCSS - previous.cssSize;
  
  console.log('\n📈 Size Changes from Previous Build:');
  console.log(`  Total: ${formatDiff(sizeDiff)}`);
  console.log(`  JavaScript: ${formatDiff(jsDiff)}`);
  console.log(`  CSS: ${formatDiff(cssDiff)}`);
}

function formatDiff(bytes) {
  const formatted = formatBytes(Math.abs(bytes));
  if (bytes > 0) {
    return `+${formatted} 📈`;
  } else if (bytes < 0) {
    return `-${formatted} 📉`;
  }
  return `${formatted} ➡️`;
}

// ============================================
// CI/CD INTEGRATION
// ============================================

function checkForCI() {
  const isCI = process.env.CI === 'true';
  
  if (isCI) {
    console.log('🤖 Running in CI environment\n');
    return true;
  }
  
  return false;
}

function exitWithError(report) {
  const hasHighSeverity = report.warnings.some(w => w.severity === 'high');
  
  if (hasHighSeverity) {
    console.error('\n❌ Build failed due to bundle size violations');
    process.exit(1);
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  try {
    const isCI = checkForCI();
    
    // Analyze build output
    const report = analyzeBuildOutput();
    
    // Update history
    const history = updateHistory(report);
    
    // Generate report
    generateReport(report);
    
    // Compare with previous build
    compareWithPrevious(report, history);
    
    // Exit with error in CI if thresholds exceeded
    if (isCI) {
      exitWithError(report);
    }
    
    console.log('\n✅ Bundle size analysis complete');
    
  } catch (error) {
    console.error('❌ Error during bundle size analysis:', error);
    process.exit(1);
  }
}

// Run the script
main();