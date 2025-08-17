#!/usr/bin/env node

/**
 * Script to fix logger.error calls that have incorrect parameter order
 * Changes from: logger.error("message", error)
 * To: logger.error(error as Error, "message")
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to fix
const patterns = [
  {
    // logger.error with string first, then error object
    regex: /logger\.error\((['"`])([^'"`]+)\1,\s*(\w+)\)/g,
    replacement: 'logger.error($3 as Error, "$2")'
  },
  {
    // logger.error with template literal first, then error
    regex: /logger\.error\(`([^`]+)`\s*,\s*(\w+)\)/g,
    replacement: 'logger.error($2 as Error, "$1")'
  },
  {
    // logger.error with complex string concatenation
    regex: /logger\.error\(\[([^\]]+)\],\s*(\w+)\)/g,
    replacement: 'logger.error($2 as Error, $1)'
  },
  {
    // logger.warn with similar pattern
    regex: /logger\.warn\((['"`])([^'"`]+)\1,\s*(\w+)\)/g,
    replacement: 'logger.warn("$2", $3)'
  },
  {
    // logger.error with object literal (need to stringify)
    regex: /logger\.error\((['"`])([^'"`]+)\1,\s*\{([^}]+)\}\)/g,
    replacement: 'logger.error("$2", JSON.stringify({$3}))'
  }
];

// Directories to process
const directories = [
  'actions',
  'app/api',
  'app/(course)',
  'app/(homepage)',
  'app/(protected)',
  'lib',
  'components',
  'hooks'
];

let totalFixed = 0;
let filesModified = 0;

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let fixCount = 0;

  patterns.forEach(pattern => {
    const matches = content.match(pattern.regex);
    if (matches) {
      content = content.replace(pattern.regex, pattern.replacement);
      fixCount += matches.length;
    }
  });

  // Additional manual fixes for specific patterns
  // Fix: logger.error("message:", error) to logger.error(error as Error, "message")
  content = content.replace(
    /logger\.error\("([^"]+):",\s*error\)/g,
    'logger.error(error as Error, "$1")'
  );

  // Fix: logger.error('message:', error) to logger.error(error as Error, 'message')
  content = content.replace(
    /logger\.error\('([^']+):',\s*error\)/g,
    "logger.error(error as Error, '$1')"
  );

  // Fix: logger.error(`message`, error) to logger.error(error as Error, `message`)
  content = content.replace(
    /logger\.error\(`([^`]+)`,\s*error\)/g,
    'logger.error(error as Error, `$1`)'
  );

  // Fix: logger.error("message", someError) to logger.error(someError as Error, "message")
  content = content.replace(
    /logger\.error\("([^"]+)",\s*(\w+Error|\w+\.error|\w+)\)/g,
    'logger.error($2 as Error, "$1")'
  );

  // Fix: logger.error('[TAG]', error) to logger.error(error as Error, '[TAG]')
  content = content.replace(
    /logger\.error\('\[([^\]]+)\]',\s*error\)/g,
    "logger.error(error as Error, '[$1]')"
  );

  // Fix similar pattern with any variable name (not just 'error')
  content = content.replace(
    /logger\.error\("([^"]+):",\s*(\w+)\)/g,
    function(match, message, varName) {
      // Only fix if the variable name looks like an error variable
      if (varName.toLowerCase().includes('error') || 
          varName.toLowerCase().includes('err') || 
          varName === 'e' || 
          varName.toLowerCase().includes('exception')) {
        return `logger.error(${varName} as Error, "${message}")`;
      }
      return match;
    }
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    filesModified++;
    totalFixed += fixCount;
    console.log(`✅ Fixed ${fixCount} logger calls in ${filePath}`);
    return true;
  }
  return false;
}

console.log('🔍 Searching for files with incorrect logger.error calls...\n');

directories.forEach(dir => {
  const pattern = path.join(dir, '**/*.{ts,tsx}');
  const files = glob.sync(pattern, {
    ignore: ['**/node_modules/**', '**/__tests__/**', '**/dist/**', '**/build/**']
  });

  files.forEach(file => {
    fixFile(file);
  });
});

console.log('\n📊 Summary:');
console.log(`   Files modified: ${filesModified}`);
console.log(`   Total fixes: ${totalFixed}`);
console.log('\n✨ Logger error calls have been fixed!');