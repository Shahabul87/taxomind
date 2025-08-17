#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript files
const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
  ignore: ['node_modules/**', '.next/**', 'dist/**', 'coverage/**']
});

let fixedFiles = 0;
let totalFixes = 0;

console.log(`🔧 Fixing import statements with HTML entities...`);

files.forEach(filePath => {
  const fullPath = path.resolve(filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;
  let fileFixes = 0;

  // Fix import statements specifically - these should never have HTML entities
  const importFixes = [
    // Fix import statements with &apos;
    {
      regex: /import\s*{[^}]*}\s*from\s*&apos;([^&]+)&apos;/g,
      replacement: (match, path) => match.replace(/&apos;/g, "'")
    },
    {
      regex: /import\s+\w+\s+from\s*&apos;([^&]+)&apos;/g,
      replacement: (match, path) => match.replace(/&apos;/g, "'")
    },
    {
      regex: /import\s*\*\s*as\s*\w+\s*from\s*&apos;([^&]+)&apos;/g,
      replacement: (match, path) => match.replace(/&apos;/g, "'")
    },
    // Fix export statements
    {
      regex: /export\s*{[^}]*}\s*from\s*&apos;([^&]+)&apos;/g,
      replacement: (match, path) => match.replace(/&apos;/g, "'")
    },
    {
      regex: /export\s*\*\s*from\s*&apos;([^&]+)&apos;/g,
      replacement: (match, path) => match.replace(/&apos;/g, "'")
    },
    // Fix require statements
    {
      regex: /require\s*\(\s*&apos;([^&]+)&apos;\s*\)/g,
      replacement: (match, path) => match.replace(/&apos;/g, "'")
    },
    // Fix dynamic imports
    {
      regex: /import\s*\(\s*&apos;([^&]+)&apos;\s*\)/g,
      replacement: (match, path) => match.replace(/&apos;/g, "'")
    }
  ];

  importFixes.forEach(fix => {
    const newContent = content.replace(fix.regex, fix.replacement);
    if (newContent !== content) {
      const matches = content.match(fix.regex);
      if (matches) {
        fileFixes += matches.length;
      }
      content = newContent;
    }
  });

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    fixedFiles++;
    totalFixes += fileFixes;
    console.log(`✅ Fixed ${fileFixes} import statements in ${filePath}`);
  }
});

console.log(`\n🎉 Fixed import statement HTML entities!`);
console.log(`📊 Fixed ${totalFixes} import statements in ${fixedFiles} files.`);