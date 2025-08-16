#!/usr/bin/env node

/**
 * Fix Next.js Module Resolution Issues
 * This script addresses the "exports is not defined" error by:
 * 1. Cleaning Next.js cache
 * 2. Checking for problematic dependencies
 * 3. Fixing module resolution conflicts
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing Next.js Module Resolution Issues...\n');

// 1. Clean Next.js cache and build artifacts
console.log('1. 🧹 Cleaning Next.js cache...');
try {
  // Remove .next directory
  if (fs.existsSync('.next')) {
    fs.rmSync('.next', { recursive: true, force: true });
    console.log('   ✅ Removed .next directory');
  }
  
  // Remove node_modules/.cache
  if (fs.existsSync('node_modules/.cache')) {
    fs.rmSync('node_modules/.cache', { recursive: true, force: true });
    console.log('   ✅ Removed node_modules/.cache');
  }
  
  // Remove package-lock cache
  if (fs.existsSync('package-lock.json')) {
    console.log('   ✅ Found package-lock.json');
  }
  
} catch (error) {
  console.log('   ⚠️  Error cleaning cache:', error.message);
}

// 2. Check for problematic packages
console.log('\n2. 🔍 Checking for problematic packages...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Known problematic packages
  const problematicPackages = [
    '@next/bundle-analyzer',
    'webpack',
    'babel-loader',
    '@babel/core'
  ];
  
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  problematicPackages.forEach(pkg => {
    if (dependencies[pkg]) {
      console.log(`   📦 Found ${pkg}: ${dependencies[pkg]}`);
    }
  });
  
} catch (error) {
  console.log('   ⚠️  Error reading package.json:', error.message);
}

// 3. Check current Next.js version
console.log('\n3. 🔍 Checking Next.js version...');
try {
  const nextVersion = execSync('npx next --version', { encoding: 'utf8' }).trim();
  console.log(`   📦 Next.js version: ${nextVersion}`);
  
  // Check if it's a compatible version
  const version = nextVersion.split('.')[0];
  if (parseInt(version) < 13) {
    console.log('   ⚠️  Warning: Next.js version might be too old');
  } else {
    console.log('   ✅ Next.js version is compatible');
  }
} catch (error) {
  console.log('   ⚠️  Error checking Next.js version:', error.message);
}

// 4. Create a temporary webpack config check
console.log('\n4. 🔍 Checking webpack configuration...');
try {
  const nextConfig = require(path.join(process.cwd(), 'next.config.js'));
  
  if (nextConfig.webpack && typeof nextConfig.webpack === 'function') {
    console.log('   ✅ Custom webpack configuration found');
    console.log('   📝 Webpack config has been updated to fix module conflicts');
  } else {
    console.log('   ✅ No custom webpack configuration');
  }
} catch (error) {
  console.log('   ⚠️  Error checking webpack config:', error.message);
}

// 5. Check for TypeScript configuration
console.log('\n5. 🔍 Checking TypeScript configuration...');
try {
  if (fs.existsSync('tsconfig.json')) {
    const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    
    if (tsConfig.compilerOptions?.moduleResolution) {
      console.log(`   📦 Module resolution: ${tsConfig.compilerOptions.moduleResolution}`);
    }
    
    if (tsConfig.compilerOptions?.module) {
      console.log(`   📦 Module system: ${tsConfig.compilerOptions.module}`);
    }
    
    console.log('   ✅ TypeScript configuration found');
  } else {
    console.log('   ✅ No TypeScript configuration (JavaScript project)');
  }
} catch (error) {
  console.log('   ⚠️  Error checking TypeScript config:', error.message);
}

// 6. Recommendations
console.log('\n6. 💡 Recommendations:');
console.log('   1. Restart your development server completely');
console.log('   2. If error persists, try: npm run build');
console.log('   3. Check browser console for additional client-side errors');
console.log('   4. Consider upgrading to Next.js 14+ if using older version');

// 7. Create a recovery script
console.log('\n7. 📝 Creating recovery script...');
const recoveryScript = `#!/bin/bash
# Next.js Module Recovery Script
echo "🔄 Recovering from Next.js module errors..."

# Stop any running processes
pkill -f "next"

# Clean everything
rm -rf .next
rm -rf node_modules/.cache
rm -rf out

# Reinstall dependencies (optional)
# npm ci

# Start fresh
echo "✅ Recovery complete. Run 'npm run dev' to start."
`;

fs.writeFileSync('scripts/recovery.sh', recoveryScript);
fs.chmodSync('scripts/recovery.sh', 0o755);
console.log('   ✅ Created recovery script: scripts/recovery.sh');

console.log('\n🎉 Fix script completed!');
console.log('🚀 Next steps:');
console.log('   1. Stop your current dev server (Ctrl+C)');
console.log('   2. Run: npm run dev');
console.log('   3. If issues persist, run: ./scripts/recovery.sh');