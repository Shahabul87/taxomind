#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 CSS Setup Diagnostic Tool\n');

// Check if key files exist
const filesToCheck = [
  'app/globals.css',
  'tailwind.config.js',
  'postcss.config.js',
  'package.json',
  '.next/static/css'
];

console.log('📁 Checking required files:');
filesToCheck.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// Check package.json for required dependencies
console.log('\n📦 Checking dependencies:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = [
    'tailwindcss',
    'postcss',
    'autoprefixer',
    'next'
  ];
  
  requiredDeps.forEach(dep => {
    const installed = deps[dep];
    console.log(`  ${installed ? '✅' : '❌'} ${dep}${installed ? ` (${installed})` : ''}`);
  });
} catch (e) {
  console.error('  ❌ Could not read package.json');
}

// Check Tailwind config
console.log('\n⚙️  Checking Tailwind configuration:');
try {
  const tailwindConfig = require(path.join(process.cwd(), 'tailwind.config.js'));
  console.log(`  ✅ Config loaded successfully`);
  console.log(`  📝 Content paths: ${tailwindConfig.content.length} patterns defined`);
  console.log(`  🎨 Dark mode: ${tailwindConfig.darkMode || 'not configured'}`);
} catch (e) {
  console.error('  ❌ Could not load tailwind.config.js');
}

// Check CSS file content
console.log('\n📄 Checking globals.css:');
try {
  const cssContent = fs.readFileSync('app/globals.css', 'utf8');
  const hasTailwindBase = cssContent.includes('@tailwind base');
  const hasTailwindComponents = cssContent.includes('@tailwind components');
  const hasTailwindUtilities = cssContent.includes('@tailwind utilities');
  
  console.log(`  ${hasTailwindBase ? '✅' : '❌'} @tailwind base`);
  console.log(`  ${hasTailwindComponents ? '✅' : '❌'} @tailwind components`);
  console.log(`  ${hasTailwindUtilities ? '✅' : '❌'} @tailwind utilities`);
} catch (e) {
  console.error('  ❌ Could not read app/globals.css');
}

// Check for CSS files in .next directory
console.log('\n🏗️  Checking build output:');
try {
  const cssDir = path.join(process.cwd(), '.next/static/css');
  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir);
    console.log(`  ✅ Found ${cssFiles.length} CSS files in build`);
    cssFiles.slice(0, 3).forEach(file => {
      const stats = fs.statSync(path.join(cssDir, file));
      console.log(`     - ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
    });
  } else {
    console.log('  ❌ No CSS build output found - run "npm run dev" first');
  }
} catch (e) {
  console.error('  ❌ Could not check build output');
}

console.log('\n✨ Diagnostic complete!');
console.log('\nNext steps:');
console.log('1. Make sure the dev server is running: npm run dev');
console.log('2. Visit http://localhost:3000/test-css');
console.log('3. Check browser DevTools for any CSS loading errors');
console.log('4. Try clearing Next.js cache: rm -rf .next && npm run dev');