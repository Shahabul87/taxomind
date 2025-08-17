#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript files that had syntax broken
const files = glob.sync('**/*.{ts,tsx}', {
  ignore: ['node_modules/**', '.next/**', 'dist/**', '__tests__/**', 'coverage/**']
});

let fixedFiles = 0;
let totalFixes = 0;

console.log(`🔧 Fixing TypeScript syntax errors caused by HTML entity replacement...`);

files.forEach(filePath => {
  const fullPath = path.resolve(filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;
  let fileFixes = 0;

  // Fix broken string literals - revert &apos; back to ' in TypeScript string contexts
  const fixes = [
    // Fix string literals in replace calls
    {
      regex: /&apos; &apos;/g,
      replacement: "' '"
    },
    {
      regex: /&apos;&/g,
      replacement: "'&"
    },
    {
      regex: /&apos;<&apos;/g,
      replacement: "'<'"
    },
    {
      regex: /&apos;>&apos;/g,
      replacement: "'>'"
    },
    {
      regex: /&apos;"&apos;/g,
      replacement: "'\"'"
    },
    {
      regex: /&apos; &apos;/g,
      replacement: "' '"
    },
    // Fix function calls and method calls
    {
      regex: /\.replace\([^)]*&apos;[^)]*\)/g,
      replacement: (match) => match.replace(/&apos;/g, "'")
    },
    // Fix template literals and object properties in non-JSX context
    {
      regex: /:\s*&apos;([^&]*)&apos;/g,
      replacement: ": '$1'"
    },
    // Fix array and object values
    {
      regex: /=\s*&apos;([^&]*)&apos;/g,
      replacement: "= '$1'"
    }
  ];

  fixes.forEach(fix => {
    const newContent = content.replace(fix.regex, fix.replacement);
    if (newContent !== content) {
      const matches = content.match(fix.regex);
      if (matches) {
        fileFixes += matches.length;
      }
      content = newContent;
    }
  });

  // Specific fixes for known problematic patterns
  // Fix the utils.ts file specifically
  if (filePath.includes('utils.ts')) {
    content = content.replace(/&apos; &apos;/g, "' '");
    content = content.replace(/&apos;&/g, "'&");
    content = content.replace(/&apos;<&apos;/g, "'<'");
    content = content.replace(/&apos;>&apos;/g, "'>'");
    content = content.replace(/&apos;"&apos;/g, "'\"'");
  }

  // Fix arrow function syntax and other common patterns
  content = content.replace(/=>\s*&apos;/g, "=> '");
  content = content.replace(/\(\s*&apos;/g, "('");
  content = content.replace(/&apos;\s*\)/g, "')");
  content = content.replace(/\[\s*&apos;/g, "['");
  content = content.replace(/&apos;\s*\]/g, "']");

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    fixedFiles++;
    totalFixes += fileFixes;
    console.log(`✅ Fixed TypeScript syntax in ${filePath}`);
  }
});

console.log(`\n🎉 Fixed TypeScript syntax errors!`);
console.log(`📊 Fixed ${totalFixes} syntax issues in ${fixedFiles} files.`);