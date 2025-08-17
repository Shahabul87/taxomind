#!/usr/bin/env node
/**
 * Script to fix CSS 404 errors in Next.js development
 * This script cleans up cache and ensures proper CSS loading
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

// Helper function to log with colors
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Main function to fix CSS issues
async function fixCSSIssues() {
  log('\n🔧 Fixing Next.js CSS 404 Errors...', colors.bright + colors.blue);
  
  try {
    // Step 1: Check for duplicate Node processes
    log('\n1. Checking for duplicate Node processes...', colors.yellow);
    try {
      const { stdout } = await execPromise('lsof -i :3000 | grep LISTEN || true');
      if (stdout && stdout.trim()) {
        log('Found process on port 3000:', colors.yellow);
        console.log(stdout);
        
        // Ask user if they want to kill the process
        log('Killing existing process...', colors.yellow);
        await execPromise("lsof -ti :3000 | xargs kill -9 2>/dev/null || true");
        log('✅ Killed existing process', colors.green);
      } else {
        log('✅ No duplicate processes found', colors.green);
      }
    } catch (error) {
      log('✅ No duplicate processes found', colors.green);
    }
    
    // Step 2: Clear .next cache
    log('\n2. Clearing .next cache directory...', colors.yellow);
    const nextDir = path.join(process.cwd(), '.next');
    
    if (fs.existsSync(nextDir)) {
      // Remove .next directory
      await execPromise('rm -rf .next');
      log('✅ Cleared .next cache', colors.green);
    } else {
      log('✅ No .next cache to clear', colors.green);
    }
    
    // Step 3: Clear node_modules/.cache if it exists
    log('\n3. Clearing node_modules cache...', colors.yellow);
    const nodeCacheDir = path.join(process.cwd(), 'node_modules', '.cache');
    
    if (fs.existsSync(nodeCacheDir)) {
      await execPromise('rm -rf node_modules/.cache');
      log('✅ Cleared node_modules cache', colors.green);
    } else {
      log('✅ No node_modules cache to clear', colors.green);
    }
    
    // Step 4: Clear browser cache hint
    log('\n4. Browser cache:', colors.yellow);
    log('   If issues persist, clear your browser cache:', colors.yellow);
    log('   - Chrome/Edge: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)', colors.blue);
    log('   - Safari: Cmd+Option+E then Cmd+R', colors.blue);
    log('   - Firefox: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)', colors.blue);
    
    // Step 5: Create/update .env.local with CSS optimization flags
    log('\n5. Setting CSS optimization flags...', colors.yellow);
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Add CSS optimization flags if not present
    const cssFlags = [
      '# CSS Optimization Flags',
      'NEXT_TELEMETRY_DISABLED=1',
      'NODE_OPTIONS="--max-old-space-size=4096"',
    ];
    
    let updated = false;
    cssFlags.forEach(flag => {
      const [key] = flag.split('=');
      if (!envContent.includes(key) && flag.includes('=')) {
        envContent += `\n${flag}`;
        updated = true;
      }
    });
    
    if (updated) {
      fs.writeFileSync(envPath, envContent.trim() + '\n');
      log('✅ Updated .env.local with optimization flags', colors.green);
    } else {
      log('✅ Optimization flags already set', colors.green);
    }
    
    // Step 6: Verify package.json scripts
    log('\n6. Verifying package.json scripts...', colors.yellow);
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add fix-css script if not present
    if (!packageJson.scripts['fix-css']) {
      packageJson.scripts['fix-css'] = 'node scripts/fix-css-dev.js';
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      log('✅ Added fix-css script to package.json', colors.green);
    } else {
      log('✅ fix-css script already in package.json', colors.green);
    }
    
    // Step 7: Instructions for preventing future issues
    log('\n✨ CSS Fix Complete!', colors.bright + colors.green);
    log('\n📋 To prevent future CSS 404 errors:', colors.bright + colors.blue);
    log('   1. Always stop dev server with Ctrl+C (not by closing terminal)', colors.blue);
    log('   2. Run "npm run fix-css" if you see CSS 404 errors', colors.blue);
    log('   3. Use "npm run dev" to start development server', colors.blue);
    log('   4. Clear browser cache if CSS changes don\'t appear', colors.blue);
    
    log('\n🚀 You can now run "npm run dev" to start the development server', colors.bright + colors.green);
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Run the script
fixCSSIssues().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, colors.red);
  process.exit(1);
});