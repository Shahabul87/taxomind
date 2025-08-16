#!/usr/bin/env node

/**
 * Final comprehensive fix for API migration errors
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'app/api/posts/[postId]/comments/[commentId]/react/route.ts',
  'app/api/posts/[postId]/comments/[commentId]/reactions/route.ts',
  'app/api/posts/[postId]/comments/[commentId]/replies/route.ts',
  'app/api/posts/[postId]/comments/[commentId]/route.ts',
  'app/api/posts/[postId]/comments/route.ts',
  'app/api/posts/[postId]/unpublish/route.ts',
  'app/api/posts/route.ts',
  'app/api/sections/analyze-content/route.ts',
  'app/api/sections/generate-content/route.ts',
  'app/api/teacher-analytics/course-overview/route.ts',
  'app/api/teacher-analytics/student-profile/route.ts',
];

console.log('🔧 Final API error fixes...\n');

function fixFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }
  
  console.log(`📝 Fixing: ${filePath}`);
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;
  
  // Fix common patterns
  // 1. Remove orphaned lines
  content = content.replace(/^\s*\);\s*}\s*$/gm, '');
  content = content.replace(/^\s*,\s*{\s*status:\s*\d+\s*}\s*\);\s*$/gm, '');
  
  // 2. Fix broken try blocks
  content = content.replace(/\) => \{\s*try \{\s*\);\s*\}/gm, ') => {\n  try {');
  content = content.replace(/\) => \{\s*try \{\s*};/gm, ') => {\n  try {');
  
  // 3. Fix req vs request
  content = content.replace(/await req\.json\(\)/g, 'await request.json()');
  content = content.replace(/const body = await req\./g, 'const body = await request.');
  
  // 4. Fix user references
  content = content.replace(/user\.name\s*\|\|/g, 'context.user.name ||');
  content = content.replace(/user\.id([^a-zA-Z])/g, 'context.user.id$1');
  content = content.replace(/user\.email/g, 'context.user.email');
  content = content.replace(/user\.role/g, 'context.user.role');
  
  // 5. Remove duplicate or orphaned auth checks
  content = content.replace(/\/\/ Authenticate the user\s*$/gm, '');
  content = content.replace(/\/\/ Check rate limiting\s*$/gm, '');
  
  // 6. Fix incomplete returns
  content = content.replace(/return createSuccessResponse\(\s*$/gm, 'return createSuccessResponse(');
  content = content.replace(/return createErrorResponse\(\s*$/gm, 'return createErrorResponse(');
  
  // 7. Remove empty lines that shouldn't be there
  content = content.replace(/^\s*}\s*$/gm, (match, offset) => {
    const before = content.substring(Math.max(0, offset - 50), offset);
    if (before.includes('try {') && !before.includes('catch')) {
      return ''; // Remove orphaned closing brace after try
    }
    return match;
  });
  
  // 8. Ensure functions are properly closed
  if (content.includes('export const') && !content.trim().endsWith('});')) {
    content = content.trimEnd() + '\n});';
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed: ${filePath}`);
  } else {
    console.log(`⏭️  No changes needed: ${filePath}`);
  }
}

// Process all files
for (const file of filesToFix) {
  try {
    fixFile(file);
  } catch (error) {
    console.log(`❌ Error fixing ${file}: ${error.message}`);
  }
}

console.log('\n✨ Final fixes complete!');
console.log('Running lint check...\n');

// Run lint check
const { execSync } = require('child_process');
try {
  execSync('npm run lint', { stdio: 'inherit' });
  console.log('\n✅ All lint errors fixed!');
} catch (error) {
  console.log('\n⚠️  Some lint errors remain. Please check manually.');
}