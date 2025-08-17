#!/usr/bin/env node

/**
 * Script to replace console.log statements with proper logger calls
 * This script will:
 * 1. Find all TypeScript/JavaScript files
 * 2. Replace console.* calls with logger.* calls
 * 3. Add import statement for logger if needed
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to ignore
const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/.next/**',
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/backups/**',
  '**/scripts/**',
  '**/lib/logger.ts',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  '**/*.spec.tsx',
];

// Mapping of console methods to logger methods
const METHOD_MAPPING = {
  'console.log': 'logger.info',
  'console.info': 'logger.info',
  'console.warn': 'logger.warn',
  'console.error': 'logger.error',
  'console.debug': 'logger.debug',
};

/**
 * Check if file already imports logger
 */
function hasLoggerImport(content) {
  return content.includes("from '@/lib/logger'") || 
         content.includes('from "@/lib/logger"') ||
         content.includes("from '../lib/logger'") ||
         content.includes('from "../lib/logger"');
}

/**
 * Add logger import to file
 */
function addLoggerImport(content) {
  // Check if file already has logger import
  if (hasLoggerImport(content)) {
    return content;
  }

  // Find the best place to add import
  const lines = content.split('\n');
  let importIndex = 0;
  
  // Find last import statement
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) {
      importIndex = i + 1;
    } else if (importIndex > 0 && !lines[i].startsWith('import ')) {
      // Found end of imports
      break;
    }
  }

  // Add logger import
  const importStatement = "import { logger } from '@/lib/logger';";
  
  if (importIndex === 0) {
    // No imports found, add at the beginning
    return importStatement + '\n\n' + content;
  } else {
    // Add after last import
    lines.splice(importIndex, 0, importStatement);
    return lines.join('\n');
  }
}

/**
 * Replace console statements in content
 */
function replaceConsoleStatements(content, filePath) {
  let modified = false;
  let newContent = content;

  // Replace each console method
  Object.entries(METHOD_MAPPING).forEach(([consoleMethod, loggerMethod]) => {
    const regex = new RegExp(`\\b${consoleMethod.replace('.', '\\.')}\\(`, 'g');
    
    if (regex.test(newContent)) {
      modified = true;
      newContent = newContent.replace(regex, `${loggerMethod}(`);
    }
  });

  // If we modified the content and it's not a test file, add logger import
  if (modified && !filePath.includes('.test.') && !filePath.includes('.spec.')) {
    newContent = addLoggerImport(newContent);
  }

  return { content: newContent, modified };
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: newContent, modified } = replaceConsoleStatements(content, filePath);

    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Searching for TypeScript/JavaScript files...');

  // Find all TypeScript and JavaScript files
  const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
    ignore: IGNORE_PATTERNS,
    absolute: false,
  });

  console.log(`📁 Found ${files.length} files to process`);

  let updatedCount = 0;
  let errorCount = 0;

  // Process each file
  files.forEach((file) => {
    if (processFile(file)) {
      updatedCount++;
    }
  });

  console.log('\n📊 Summary:');
  console.log(`✅ Updated ${updatedCount} files`);
  console.log(`📁 Total files processed: ${files.length}`);
  
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount}`);
  }

  // Create ESLint configuration to prevent future console.log usage
  const eslintConfig = {
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  };

  // Update .eslintrc.json if it exists
  const eslintPath = '.eslintrc.json';
  if (fs.existsSync(eslintPath)) {
    try {
      const eslintContent = JSON.parse(fs.readFileSync(eslintPath, 'utf8'));
      eslintContent.rules = eslintContent.rules || {};
      eslintContent.rules['no-console'] = ['error', { allow: [] }];
      fs.writeFileSync(eslintPath, JSON.stringify(eslintContent, null, 2), 'utf8');
      console.log('\n✅ Updated ESLint configuration to prevent console usage');
    } catch (error) {
      console.error('❌ Failed to update ESLint configuration:', error.message);
    }
  }

  console.log('\n✨ Console replacement complete!');
  console.log('💡 Tip: Run "npm run lint" to check for any remaining issues');
}

// Run the script
main().catch(console.error);