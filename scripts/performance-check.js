#!/usr/bin/env node

/**
 * Performance Check Script
 * Analyzes build output and provides recommendations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Performance Analysis Tool');
console.log('============================\n');

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  function calculateSize(filePath) {
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      const files = fs.readdirSync(filePath);
      files.forEach(file => {
        calculateSize(path.join(filePath, file));
      });
    } else {
      totalSize += stats.size;
    }
  }
  
  if (fs.existsSync(dirPath)) {
    calculateSize(dirPath);
  }
  
  return totalSize;
}

function checkLargeModules() {
  console.log('📦 Checking for large node_modules...\n');
  
  const largeModules = [
    'googleapis',
    '@tabler',
    'monaco-editor',
    'react-icons',
    'puppeteer',
    '@sentry',
    '@opentelemetry',
    '@tiptap',
  ];
  
  const moduleSizes = [];
  
  largeModules.forEach(module => {
    const modulePath = path.join('node_modules', module);
    if (fs.existsSync(modulePath)) {
      const size = getDirectorySize(modulePath);
      moduleSizes.push({ module, size });
    }
  });
  
  moduleSizes.sort((a, b) => b.size - a.size);
  
  console.log('Top Heavy Dependencies:');
  moduleSizes.forEach(({ module, size }) => {
    const formatted = formatBytes(size);
    const warning = size > 50 * 1024 * 1024 ? ' ⚠️' : '';
    console.log(`  - ${module}: ${formatted}${warning}`);
  });
  
  return moduleSizes;
}

function checkBuildOutput() {
  console.log('\n📊 Analyzing build output...\n');
  
  const buildManifest = path.join('.next', 'build-manifest.json');
  
  if (!fs.existsSync(buildManifest)) {
    console.log('❌ Build manifest not found. Please run build first.');
    return null;
  }
  
  const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'));
  const pages = Object.keys(manifest.pages);
  
  console.log(`Total pages: ${pages.length}`);
  
  // Check static directory size
  const staticSize = getDirectorySize('.next/static');
  console.log(`Static assets size: ${formatBytes(staticSize)}`);
  
  // Check server directory size
  const serverSize = getDirectorySize('.next/server');
  console.log(`Server bundle size: ${formatBytes(serverSize)}`);
  
  return { staticSize, serverSize, totalPages: pages.length };
}

function checkChunkSizes() {
  console.log('\n📈 Checking chunk sizes...\n');
  
  const chunksDir = path.join('.next', 'static', 'chunks');
  
  if (!fs.existsSync(chunksDir)) {
    console.log('❌ Chunks directory not found.');
    return [];
  }
  
  const chunks = fs.readdirSync(chunksDir);
  const chunkSizes = [];
  
  chunks.forEach(chunk => {
    const chunkPath = path.join(chunksDir, chunk);
    const stats = fs.statSync(chunkPath);
    if (stats.isFile()) {
      chunkSizes.push({
        name: chunk,
        size: stats.size
      });
    }
  });
  
  chunkSizes.sort((a, b) => b.size - a.size);
  
  console.log('Largest chunks:');
  chunkSizes.slice(0, 10).forEach(({ name, size }) => {
    const formatted = formatBytes(size);
    const warning = size > 500 * 1024 ? ' ⚠️ (Consider splitting)' : '';
    console.log(`  - ${name}: ${formatted}${warning}`);
  });
  
  return chunkSizes;
}

function generateRecommendations(moduleSizes, buildStats, chunkSizes) {
  console.log('\n💡 Recommendations:\n');
  
  const recommendations = [];
  
  // Check for oversized dependencies
  const oversizedModules = moduleSizes.filter(m => m.size > 50 * 1024 * 1024);
  if (oversizedModules.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'Oversized dependencies detected',
      solution: `Consider lazy loading or replacing: ${oversizedModules.map(m => m.module).join(', ')}`
    });
  }
  
  // Check for large chunks
  const largeChunks = chunkSizes.filter(c => c.size > 500 * 1024);
  if (largeChunks.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      issue: `${largeChunks.length} chunks exceed 500KB`,
      solution: 'Implement code splitting with dynamic imports'
    });
  }
  
  // Check total build size
  if (buildStats) {
    const totalSize = buildStats.staticSize + buildStats.serverSize;
    if (totalSize > 100 * 1024 * 1024) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'Total build size exceeds 100MB',
        solution: 'Review and optimize imports, enable tree-shaking'
      });
    }
  }
  
  // Check for duplicate icon libraries
  const hasReactIcons = fs.existsSync('node_modules/react-icons');
  const hasTablerIcons = fs.existsSync('node_modules/@tabler/icons-react');
  const hasLucideIcons = fs.existsSync('node_modules/lucide-react');
  
  const iconLibraries = [hasReactIcons, hasTablerIcons, hasLucideIcons].filter(Boolean).length;
  if (iconLibraries > 1) {
    recommendations.push({
      priority: 'MEDIUM',
      issue: 'Multiple icon libraries detected',
      solution: 'Standardize on one icon library to reduce bundle size'
    });
  }
  
  // Display recommendations
  recommendations.forEach(({ priority, issue, solution }) => {
    const priorityColor = priority === 'HIGH' ? '🔴' : '🟡';
    console.log(`${priorityColor} [${priority}] ${issue}`);
    console.log(`   Solution: ${solution}\n`);
  });
  
  return recommendations;
}

function checkMemoryUsage() {
  console.log('\n💾 Memory Usage:\n');
  
  const usage = process.memoryUsage();
  console.log(`  - RSS: ${formatBytes(usage.rss)}`);
  console.log(`  - Heap Total: ${formatBytes(usage.heapTotal)}`);
  console.log(`  - Heap Used: ${formatBytes(usage.heapUsed)}`);
  console.log(`  - External: ${formatBytes(usage.external)}`);
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  try {
    // Check for large modules
    const moduleSizes = checkLargeModules();
    
    // Check build output
    const buildStats = checkBuildOutput();
    
    // Check chunk sizes
    const chunkSizes = checkChunkSizes();
    
    // Generate recommendations
    generateRecommendations(moduleSizes, buildStats, chunkSizes);
    
    // Check memory usage
    checkMemoryUsage();
    
    // Summary
    console.log('\n============================');
    console.log('✅ Performance check complete');
    
    // Exit with appropriate code
    const hasHighPriorityIssues = moduleSizes.some(m => m.size > 100 * 1024 * 1024);
    process.exit(hasHighPriorityIssues ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Error during performance check:', error);
    process.exit(1);
  }
}

// Run the script
main();