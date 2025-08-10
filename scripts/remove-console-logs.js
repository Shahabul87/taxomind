#!/usr/bin/env node

/**
 * Script to safely remove or replace console.log statements
 * This script analyzes each console.log to ensure safe removal
 */

const fs = require('fs');
const path = require('path');

// Patterns to identify different types of console statements
const patterns = {
  // Simple console.log that can be safely removed
  simpleLog: /^\s*console\.(log|debug|info)\([^)]*\);?\s*$/gm,
  
  // Console.log with return value or assignment - needs careful handling
  withReturn: /return\s+console\.(log|error|warn)\([^)]*\)/g,
  withAssignment: /(?:const|let|var)\s+\w+\s*=\s*console\.(log|error|warn)\([^)]*\)/g,
  
  // Console.error that might be important for error handling
  errorLog: /console\.error\([^)]*\)/g,
  
  // Console.log in conditional statements
  inCondition: /if\s*\([^)]*console\.(log|error|warn)[^)]*\)/g,
};

// Files to process
const directories = ['app', 'lib', 'components', 'actions', 'hooks'];
const fileExtensions = ['.ts', '.tsx', '.js', '.jsx'];

let totalRemoved = 0;
let totalReplaced = 0;
let filesProcessed = 0;
let errors = [];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let modified = false;
    
    // Skip test files and configuration files
    if (filePath.includes('.test.') || 
        filePath.includes('.spec.') || 
        filePath.includes('jest.') ||
        filePath.includes('logger.ts')) {
      return;
    }
    
    // Count console statements before processing
    const beforeCount = (content.match(/console\./g) || []).length;
    
    // Step 1: Handle console.logs that are part of return statements
    if (content.includes('return console.')) {
      // These need special handling - just remove the console.log part
      content = content.replace(/return\s+console\.(log|debug|info)\(([^)]*)\),?\s*([^;]*);/g, 
        (match, method, args, rest) => {
          // Extract the first argument if it's a simple value
          const firstArg = args.split(',')[0].trim();
          if (firstArg.startsWith('"') || firstArg.startsWith("'") || firstArg.startsWith('`')) {
            return `return ${rest || 'undefined'};`;
          }
          return `return ${firstArg};`;
        });
      modified = true;
    }
    
    // Step 2: Handle console.logs used in assignments
    if (content.includes('= console.')) {
      content = content.replace(/=\s*console\.(log|debug|info)\(([^)]*)\)/g, 
        (match, method, args) => {
          const firstArg = args.split(',')[0].trim();
          return `= ${firstArg}`;
        });
      modified = true;
    }
    
    // Step 3: Remove simple standalone console.logs (safe to remove)
    const simpleLogsBefore = content.match(patterns.simpleLog) || [];
    content = content.replace(patterns.simpleLog, '');
    if (simpleLogsBefore.length > 0) {
      modified = true;
      totalRemoved += simpleLogsBefore.length;
    }
    
    // Step 4: Replace console.error with logger.error (preserve error logging)
    if (content.includes('console.error')) {
      // First, add import if not present and file has console.error
      if (!content.includes("import { logger }") && !content.includes("logger from")) {
        const importRegex = /^(import .* from .*;\n)+/m;
        if (importRegex.test(content)) {
          content = content.replace(importRegex, (match) => {
            return match + "import { logger } from '@/lib/logger';\n";
          });
        } else {
          // Add at the beginning if no imports found
          content = "import { logger } from '@/lib/logger';\n\n" + content;
        }
      }
      
      // Replace console.error with logger.error
      content = content.replace(/console\.error\(/g, 'logger.error(');
      modified = true;
      totalReplaced++;
    }
    
    // Step 5: Handle console.warn statements
    if (content.includes('console.warn')) {
      if (!content.includes("import { logger }") && !content.includes("logger from")) {
        const importRegex = /^(import .* from .*;\n)+/m;
        if (importRegex.test(content)) {
          content = content.replace(importRegex, (match) => {
            return match + "import { logger } from '@/lib/logger';\n";
          });
        } else {
          content = "import { logger } from '@/lib/logger';\n\n" + content;
        }
      }
      content = content.replace(/console\.warn\(/g, 'logger.warn(');
      modified = true;
      totalReplaced++;
    }
    
    // Step 6: Clean up any remaining console.log/info/debug in development checks
    content = content.replace(
      /if\s*\(\s*process\.env\.NODE_ENV\s*===?\s*['"]development['"]\s*\)\s*{\s*console\.(log|debug|info)\([^)]*\);\s*}/g,
      ''
    );
    
    // Step 7: Remove empty blocks left after console.log removal
    content = content.replace(/{\s*}\s*\n/g, '{\n}\n');
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n'); // Remove extra blank lines
    
    // Count console statements after processing
    const afterCount = (content.match(/console\./g) || []).length;
    
    if (modified && content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      filesProcessed++;
      console.log(`✅ Processed: ${filePath} (Removed ${beforeCount - afterCount} console statements)`);
    }
    
  } catch (error) {
    errors.push({ file: filePath, error: error.message });
    console.error(`❌ Error processing ${filePath}: ${error.message}`);
  }
}

function processDirectory(dir) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .next directories
      if (item !== 'node_modules' && item !== '.next' && item !== '.git') {
        processDirectory(fullPath);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(fullPath);
      if (fileExtensions.includes(ext)) {
        processFile(fullPath);
      }
    }
  }
}

console.log('🔍 Starting console.log removal process...\n');

// Process each directory
for (const dir of directories) {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    console.log(`📁 Processing directory: ${dir}`);
    processDirectory(fullPath);
  }
}

console.log('\n' + '='.repeat(50));
console.log('📊 Summary:');
console.log(`✅ Files processed: ${filesProcessed}`);
console.log(`🗑️  Console statements removed: ${totalRemoved}`);
console.log(`🔄 Console statements replaced with logger: ${totalReplaced}`);

if (errors.length > 0) {
  console.log(`\n❌ Errors encountered: ${errors.length}`);
  errors.forEach(e => console.log(`   - ${e.file}: ${e.error}`));
}

console.log('\n✨ Console.log removal complete!');
console.log('💡 Tip: Run "npm run lint" to check for any syntax issues');