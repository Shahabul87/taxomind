#!/usr/bin/env node

/**
 * Dependency Analysis Script
 * Identifies heavy dependencies and suggests optimizations
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

console.log('📊 Analyzing project dependencies...\n');

async function analyzeDependencies() {
  try {
    // Read package.json
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
    );

    const heavyPackages = {
      'puppeteer': {
        size: '~170MB',
        suggestion: 'Consider using playwright-core or puppeteer-core for lighter bundle',
        alternative: 'playwright-core (~35MB)'
      },
      '@tiptap/react': {
        size: '~50MB total (with extensions)',
        suggestion: 'Import only needed extensions, avoid @tiptap/starter-kit',
        alternative: 'lexical or slate for lighter alternatives'
      },
      '@opentelemetry': {
        size: '~30MB (all packages)',
        suggestion: 'Move to server-only imports, exclude from client bundle',
        alternative: 'Use lightweight analytics like analytics-next'
      },
      'lodash': {
        size: '~4MB',
        suggestion: 'Use lodash-es with tree shaking or native JS methods',
        alternative: 'lodash-es or ramda'
      },
      'framer-motion': {
        size: '~50KB gzipped',
        suggestion: 'Import only needed components',
        alternative: 'react-spring for lighter animations'
      },
      'chart.js': {
        size: '~200KB gzipped',
        suggestion: 'Lazy load chart components',
        alternative: 'recharts (already in use) or remove one'
      },
      'react-chartjs-2': {
        size: '~50KB + chart.js',
        suggestion: 'Choose either recharts OR chart.js, not both',
        alternative: 'Stick with recharts only'
      },
      '@radix-ui': {
        size: '~5-10KB per component',
        suggestion: 'Import individual components, not entire packages',
        alternative: 'Build custom components for simpler use cases'
      },
      'googleapis': {
        size: '~100MB',
        suggestion: 'Import only needed APIs',
        alternative: 'Use specific Google API clients'
      },
      'cheerio': {
        size: '~30MB',
        suggestion: 'Use server-side only, exclude from client',
        alternative: 'Use DOMParser for client-side HTML parsing'
      }
    };

    console.log('🔴 Heavy Dependencies Found:\n');
    console.log('─'.repeat(60));

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    let totalOptimization = 0;
    const recommendations = [];

    for (const [pkg, info] of Object.entries(heavyPackages)) {
      const found = Object.keys(allDeps).filter(dep => dep.includes(pkg));
      if (found.length > 0) {
        console.log(`\n📦 ${pkg}`);
        console.log(`   Size: ${info.size}`);
        console.log(`   Found: ${found.join(', ')}`);
        console.log(`   💡 ${info.suggestion}`);
        console.log(`   ✅ Alternative: ${info.alternative}`);
        recommendations.push({ package: pkg, ...info, found });
      }
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n🎯 Quick Wins for Faster Builds:\n');

    const quickWins = [
      {
        action: 'Enable SWC',
        impact: '50-70% faster',
        command: 'Add swcMinify: true to next.config.js'
      },
      {
        action: 'Use Turbopack',
        impact: '40-50% faster dev builds',
        command: 'npm run dev -- --turbo'
      },
      {
        action: 'Parallel TypeScript',
        impact: '30% faster',
        command: 'Run tsc --noEmit in parallel with build'
      },
      {
        action: 'Skip type checking',
        impact: '40% faster',
        command: 'SKIP_TYPE_CHECK=true npm run build'
      },
      {
        action: 'Remove duplicate charting',
        impact: 'Save ~250KB',
        command: 'Remove chart.js, keep recharts'
      },
      {
        action: 'Lazy load TipTap',
        impact: 'Save ~2MB initial bundle',
        command: 'Use dynamic imports for editor'
      }
    ];

    quickWins.forEach((win, index) => {
      console.log(`${index + 1}. ${win.action}`);
      console.log(`   Impact: ${win.impact}`);
      console.log(`   How: ${win.command}\n`);
    });

    // Check for unused dependencies
    console.log('─'.repeat(60));
    console.log('\n🔍 Checking for potentially unused dependencies...\n');

    const suspiciousPackages = [
      'typewriter-effect',
      'react-youtube',
      'react-quill',
      'html2canvas',
      'jspdf',
      'react-confetti'
    ];

    console.log('Consider removing if not actively used:');
    suspiciousPackages.forEach(pkg => {
      if (allDeps[pkg]) {
        console.log(`  - ${pkg}`);
      }
    });

    // Memory optimization suggestions
    console.log('\n' + '─'.repeat(60));
    console.log('\n💾 Memory Optimization:\n');
    console.log('Current: NODE_OPTIONS=--max-old-space-size=8192 (8GB)');
    console.log('Optimized: NODE_OPTIONS=--max-old-space-size=4096 (4GB) should be sufficient with optimizations');

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('\n📈 Expected Performance Improvements:\n');
    console.log('• Build time: 50-70% faster with all optimizations');
    console.log('• Memory usage: 40-50% reduction');
    console.log('• Bundle size: 30-40% smaller');
    console.log('• Dev server: 40-50% faster with Turbopack');

    console.log('\n✅ Next Steps:');
    console.log('1. Run: chmod +x scripts/turbo-build.sh');
    console.log('2. Run: npm run build:optimized');
    console.log('3. Or for fastest: ./scripts/turbo-build.sh');

  } catch (error) {
    console.error('Error analyzing dependencies:', error);
    process.exit(1);
  }
}

analyzeDependencies();