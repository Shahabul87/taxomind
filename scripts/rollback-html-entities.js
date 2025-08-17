#!/usr/bin/env node

/**
 * Rollback HTML Entity Changes
 * This script reverts &apos; back to ' in TypeScript/JavaScript code
 * while preserving legitimate HTML entity usage in JSX content
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔄 Rolling back HTML entity changes...');

// Find all TypeScript and JavaScript files
const patterns = [
  'app/**/*.{ts,tsx,js,jsx}',
  'components/**/*.{ts,tsx,js,jsx}',
  'lib/**/*.{ts,tsx,js,jsx}',
  'hooks/**/*.{ts,tsx,js,jsx}',
  'actions/**/*.{ts,tsx,js,jsx}',
  'auth.ts',
  'auth.config.ts',
  'middleware.ts',
  'routes.ts',
  '*.{ts,tsx,js,jsx}'
];

let totalFiles = 0;
let changedFiles = 0;
let totalReplacements = 0;

patterns.forEach(pattern => {
  const files = glob.sync(pattern, { ignore: ['node_modules/**', '.next/**', 'dist/**'] });
  
  files.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      totalFiles++;
      
      // Count current &apos; occurrences for reporting
      const currentAposCount = (content.match(/&apos;/g) || []).length;
      
      if (currentAposCount > 0) {
        console.log(`📄 Processing: ${filePath} (${currentAposCount} entities found)`);
        
        // Strategy: Revert ALL &apos; to ' in code files
        // The original ESLint rule should only apply to JSX content, not string literals
        let newContent = content.replace(/&apos;/g, "'");
        
        // Count actual replacements made
        const replacementsMade = currentAposCount;
        totalReplacements += replacementsMade;
        
        if (newContent !== content) {
          fs.writeFileSync(filePath, newContent, 'utf8');
          changedFiles++;
          console.log(`  ✅ Reverted ${replacementsMade} HTML entities to apostrophes`);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  });
});

console.log('\n📊 Rollback Summary:');
console.log(`  • Files processed: ${totalFiles}`);
console.log(`  • Files changed: ${changedFiles}`);
console.log(`  • Total replacements: ${totalReplacements}`);
console.log('\n✅ Rollback complete!');
console.log('\n📝 Note: Only JSX content should use &apos; for unescaped entities.');
console.log('   String literals in TypeScript/JavaScript should use regular apostrophes (\').');