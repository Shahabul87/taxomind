#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes bundle size and provides optimization recommendations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Starting Bundle Analysis...\n');

// Step 1: Build with bundle analyzer
console.log('📦 Building application with bundle analyzer...');
try {
  execSync('ANALYZE=true npm run build', { 
    stdio: 'inherit',
    env: { ...process.env, ANALYZE: 'true' }
  });
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 2: Analyze build output
console.log('\n📊 Analyzing build output...');

const buildDir = path.join(process.cwd(), '.next');
const staticDir = path.join(buildDir, 'static');

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeDirectory(dir, extensions = ['.js', '.css']) {
  const files = [];
  
  function walkDir(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          walkDir(fullPath);
        } else if (extensions.some(ext => item.endsWith(ext))) {
          files.push({
            name: path.relative(staticDir, fullPath),
            size: stats.size,
            type: path.extname(item)
          });
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
  }
  
  walkDir(dir);
  return files;
}

// Analyze JavaScript bundles
const jsFiles = analyzeDirectory(staticDir, ['.js']);
const cssFiles = analyzeDirectory(staticDir, ['.css']);

// Sort by size
jsFiles.sort((a, b) => b.size - a.size);
cssFiles.sort((a, b) => b.size - a.size);

// Calculate totals
const totalJSSize = jsFiles.reduce((sum, file) => sum + file.size, 0);
const totalCSSSize = cssFiles.reduce((sum, file) => sum + file.size, 0);
const totalSize = totalJSSize + totalCSSSize;

console.log('\n📈 Bundle Analysis Results:');
console.log('=' .repeat(50));

console.log(`\n💼 JavaScript Bundles (${formatSize(totalJSSize)}):`);
jsFiles.slice(0, 10).forEach((file, index) => {
  const percentage = ((file.size / totalJSSize) * 100).toFixed(1);
  console.log(`${(index + 1).toString().padStart(2)}. ${file.name.padEnd(40)} ${formatSize(file.size).padStart(8)} (${percentage}%)`);
});

console.log(`\n🎨 CSS Files (${formatSize(totalCSSSize)}):`);
cssFiles.slice(0, 5).forEach((file, index) => {
  const percentage = ((file.size / totalCSSSize) * 100).toFixed(1);
  console.log(`${(index + 1).toString().padStart(2)}. ${file.name.padEnd(40)} ${formatSize(file.size).padStart(8)} (${percentage}%)`);
});

console.log(`\n📊 Summary:`);
console.log(`Total Bundle Size: ${formatSize(totalSize)}`);
console.log(`JavaScript: ${formatSize(totalJSSize)} (${((totalJSSize / totalSize) * 100).toFixed(1)}%)`);
console.log(`CSS: ${formatSize(totalCSSSize)} (${((totalCSSSize / totalSize) * 100).toFixed(1)}%)`);

// Performance recommendations
console.log('\n🚀 Optimization Recommendations:');
console.log('=' .repeat(50));

const recommendations = [];

// Large bundle warnings
const largeJSFiles = jsFiles.filter(file => file.size > 500 * 1024); // > 500KB
if (largeJSFiles.length > 0) {
  recommendations.push('📦 Large JavaScript bundles detected (>500KB):');
  largeJSFiles.forEach(file => {
    recommendations.push(`   - ${file.name}: ${formatSize(file.size)}`);
  });
  recommendations.push('   Consider code splitting or lazy loading for these chunks.');
}

// Framework chunk analysis
const frameworkChunks = jsFiles.filter(file => 
  file.name.includes('framework') || 
  file.name.includes('react') || 
  file.name.includes('next')
);
if (frameworkChunks.length > 0) {
  const frameworkSize = frameworkChunks.reduce((sum, file) => sum + file.size, 0);
  if (frameworkSize > 300 * 1024) { // > 300KB
    recommendations.push(`🔧 Framework chunks are large (${formatSize(frameworkSize)})`);
    recommendations.push('   Consider optimizing React/Next.js imports.');
  }
}

// Vendor chunk analysis
const vendorChunks = jsFiles.filter(file => 
  file.name.includes('vendor') || 
  file.name.includes('node_modules')
);
if (vendorChunks.length > 0) {
  const vendorSize = vendorChunks.reduce((sum, file) => sum + file.size, 0);
  if (vendorSize > 800 * 1024) { // > 800KB
    recommendations.push(`📚 Vendor chunks are large (${formatSize(vendorSize)})`);
    recommendations.push('   Consider tree shaking or removing unused dependencies.');
  }
}

// CSS optimization
if (totalCSSSize > 200 * 1024) { // > 200KB
  recommendations.push(`🎨 CSS bundle is large (${formatSize(totalCSSSize)})`);
  recommendations.push('   Consider CSS optimization and unused CSS removal.');
}

// Bundle count
if (jsFiles.length > 20) {
  recommendations.push(`📁 Many JavaScript chunks (${jsFiles.length})`);
  recommendations.push('   Consider consolidating smaller chunks.');
}

// Performance targets
const performanceTargets = {
  excellent: 200 * 1024, // 200KB
  good: 500 * 1024,      // 500KB
  fair: 1000 * 1024,     // 1MB
};

let performanceRating = 'Poor';
if (totalJSSize <= performanceTargets.excellent) {
  performanceRating = 'Excellent';
} else if (totalJSSize <= performanceTargets.good) {
  performanceRating = 'Good';
} else if (totalJSSize <= performanceTargets.fair) {
  performanceRating = 'Fair';
}

recommendations.push(`\n🎯 Performance Rating: ${performanceRating}`);
recommendations.push(`   Target: <${formatSize(performanceTargets.good)} (Current: ${formatSize(totalJSSize)})`);

if (recommendations.length === 1) { // Only performance rating
  recommendations.push('✅ Bundle size looks good!');
  recommendations.push('✅ No major optimizations needed.');
}

recommendations.forEach(rec => console.log(rec));

// Save analysis results
const analysisResult = {
  timestamp: new Date().toISOString(),
  totalSize,
  totalJSSize,
  totalCSSSize,
  performanceRating,
  jsFiles: jsFiles.slice(0, 10),
  cssFiles: cssFiles.slice(0, 5),
  recommendations: recommendations.filter(r => !r.startsWith('🎯'))
};

const resultPath = path.join(process.cwd(), 'bundle-analysis.json');
fs.writeFileSync(resultPath, JSON.stringify(analysisResult, null, 2));

console.log(`\n💾 Analysis saved to: ${resultPath}`);
console.log('\n🔗 Open http://localhost:8888 to view the bundle analyzer report');
console.log('   (if the analyzer opened in your browser)');

console.log('\n✅ Bundle analysis complete!');

// Exit with appropriate code
process.exit(performanceRating === 'Poor' ? 1 : 0);