#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all React/TypeScript files
const files = glob.sync('**/*.{ts,tsx,jsx}', {
  ignore: [
    'node_modules/**', 
    '.next/**', 
    'dist/**', 
    '__tests__/**',
    'coverage/**',
    'build/**',
    '.git/**'
  ]
});

let fixedFiles = 0;
let totalFixes = 0;

console.log(`🔍 Found ${files.length} files to check for unescaped HTML entities...`);

// Patterns to fix unescaped apostrophes
const patterns = [
  // Pattern 1: Apostrophes in JSX text content (between > and <)
  {
    regex: />(.[^<]*?[^&])'([^<]*?)</g,
    replacement: (match, before, after) => `>${before}&apos;${after}<`
  },
  // Pattern 2: Apostrophes in string attributes (like "don't" -> "don&apos;t")
  {
    regex: /="([^"]*?[^&])'([^"]*?)"/g,
    replacement: (match, before, after) => `="${before}&apos;${after}"`
  },
  // Pattern 3: Apostrophes in single-quoted attributes
  {
    regex: /='([^']*?[^&])'([^']*?)'/g,
    replacement: (match, before, after) => `='${before}&apos;${after}'`
  },
  // Pattern 4: Apostrophes in template literals
  {
    regex: /`([^`]*?[^&])'([^`]*?)`/g,
    replacement: (match, before, after) => `\`${before}&apos;${after}\``
  }
];

// More specific patterns for common cases
const specificPatterns = [
  // Common contractions
  { regex: /\bdon't\b/g, replacement: "don&apos;t" },
  { regex: /\bcan't\b/g, replacement: "can&apos;t" },
  { regex: /\bwon't\b/g, replacement: "won&apos;t" },
  { regex: /\bisn't\b/g, replacement: "isn&apos;t" },
  { regex: /\baren't\b/g, replacement: "aren&apos;t" },
  { regex: /\bwasn't\b/g, replacement: "wasn&apos;t" },
  { regex: /\bweren't\b/g, replacement: "weren&apos;t" },
  { regex: /\bhasn't\b/g, replacement: "hasn&apos;t" },
  { regex: /\bhaven't\b/g, replacement: "haven&apos;t" },
  { regex: /\bhadn't\b/g, replacement: "hadn&apos;t" },
  { regex: /\bwouldn't\b/g, replacement: "wouldn&apos;t" },
  { regex: /\bshouldn't\b/g, replacement: "shouldn&apos;t" },
  { regex: /\bcouldn't\b/g, replacement: "couldn&apos;t" },
  { regex: /\bdiddn't\b/g, replacement: "didn&apos;t" },
  { regex: /\bdoesn't\b/g, replacement: "doesn&apos;t" },
  { regex: /\bI'm\b/g, replacement: "I&apos;m" },
  { regex: /\byou're\b/g, replacement: "you&apos;re" },
  { regex: /\bhe's\b/g, replacement: "he&apos;s" },
  { regex: /\bshe's\b/g, replacement: "she&apos;s" },
  { regex: /\bit's\b/g, replacement: "it&apos;s" },
  { regex: /\bwe're\b/g, replacement: "we&apos;re" },
  { regex: /\bthey're\b/g, replacement: "they&apos;re" },
  { regex: /\bthat's\b/g, replacement: "that&apos;s" },
  { regex: /\bwhat's\b/g, replacement: "what&apos;s" },
  { regex: /\bwhere's\b/g, replacement: "where&apos;s" },
  { regex: /\bwho's\b/g, replacement: "who&apos;s" },
  { regex: /\bwhen's\b/g, replacement: "when&apos;s" },
  { regex: /\bhow's\b/g, replacement: "how&apos;s" },
  { regex: /\blet's\b/g, replacement: "let&apos;s" },
  { regex: /\bthere's\b/g, replacement: "there&apos;s" },
  { regex: /\bhere's\b/g, replacement: "here&apos;s" },
  // Possessives
  { regex: /\b(\w+)'s\b/g, replacement: "$1&apos;s" },
  { regex: /\b(\w+)s'\b/g, replacement: "$1s&apos;" },
];

files.forEach(filePath => {
  const fullPath = path.resolve(filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;
  let fileFixes = 0;

  // Skip files that are primarily code imports/exports
  if (content.includes('import ') && content.includes('export ') && !content.includes('<') && !content.includes('jsx')) {
    return;
  }

  // Apply specific contraction patterns first
  specificPatterns.forEach(pattern => {
    // Only apply in JSX context (between quotes or in JSX text)
    const jsxTextMatches = content.match(/>([^<]*)</g);
    if (jsxTextMatches) {
      jsxTextMatches.forEach(match => {
        const originalMatch = match;
        const newMatch = match.replace(pattern.regex, pattern.replacement);
        if (newMatch !== originalMatch) {
          content = content.replace(originalMatch, newMatch);
          fileFixes++;
        }
      });
    }

    // Check for matches in string attributes
    const attributeMatches = content.match(/="[^"]*"/g);
    if (attributeMatches) {
      attributeMatches.forEach(match => {
        const originalMatch = match;
        const newMatch = match.replace(pattern.regex, pattern.replacement);
        if (newMatch !== originalMatch) {
          content = content.replace(originalMatch, newMatch);
          fileFixes++;
        }
      });
    }
  });

  // Apply general patterns
  patterns.forEach(pattern => {
    const newContent = content.replace(pattern.regex, pattern.replacement);
    if (newContent !== content) {
      const matches = content.match(pattern.regex);
      if (matches) {
        fileFixes += matches.length;
      }
      content = newContent;
    }
  });

  // Save the file if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    fixedFiles++;
    totalFixes += fileFixes;
    console.log(`✅ Fixed ${fileFixes} HTML entity issues in ${filePath}`);
  }
});

console.log(`\n🎉 Completed HTML entity fixes!`);
console.log(`📊 Fixed ${totalFixes} unescaped apostrophes in ${fixedFiles} files.`);
console.log(`\n💡 You can now run 'npm run lint:dev' to verify the fixes.`);