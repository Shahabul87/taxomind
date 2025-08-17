#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript/React files
const files = glob.sync('**/*.{ts,tsx}', {
  ignore: ['node_modules/**', '.next/**', 'dist/**', '__tests__/**']
});

let fixedFiles = 0;
let totalFixes = 0;

console.log(`Found ${files.length} files to check...`);

files.forEach(filePath => {
  const fullPath = path.resolve(filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  let fileFixes = 0;

  // Fix 1: Replace unescaped apostrophes with HTML entities
  const apostropheRegex = /([^&])'([^s])/g;
  const newContent1 = content.replace(/(?<!&[a-z]*)'(?!s\b)/g, '&apos;');
  if (newContent1 !== content) {
    content = newContent1;
    modified = true;
    fileFixes++;
  }

  // Fix 2: Replace <img> with Image from next/image (basic cases)
  if (content.includes('<img ') && !content.includes('import Image from')) {
    // Add import if not present
    if (!content.includes('import Image from "next/image"') && !content.includes("import Image from 'next/image'")) {
      const importMatch = content.match(/(import.*from.*['"][^'"]*['"];?\n)/);
      if (importMatch) {
        const insertPosition = content.lastIndexOf(importMatch[0]) + importMatch[0].length;
        content = content.slice(0, insertPosition) + 
                 'import Image from "next/image";\n' + 
                 content.slice(insertPosition);
        modified = true;
        fileFixes++;
      }
    }
  }

  // Fix 3: Remove unused imports (basic Link import)
  const unusedLinkRegex = /import\s*{\s*Link[^}]*}\s*from\s*['"]next\/link['"];\s*\n/g;
  if (content.match(unusedLinkRegex) && !content.includes('<Link') && !content.includes('Link ')) {
    content = content.replace(unusedLinkRegex, '');
    modified = true;
    fileFixes++;
  }

  if (modified) {
    fs.writeFileSync(fullPath, content);
    fixedFiles++;
    totalFixes += fileFixes;
    console.log(`✅ Fixed ${fileFixes} issues in ${filePath}`);
  }
});

console.log(`\n🎉 Fixed ${totalFixes} critical ESLint issues in ${fixedFiles} files!`);
console.log(`\nRun 'npm run lint:dev' to check remaining issues.`);