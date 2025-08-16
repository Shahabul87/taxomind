#!/usr/bin/env node

/**
 * Fix migration errors in API routes
 * This script fixes parsing errors from incomplete migration
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'app/api/comment-reaction/route.ts',
  'app/api/learning-analytics/personal/route.ts',
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

console.log('🔧 Fixing migration errors...\n');

function fixFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }
  
  console.log(`📝 Fixing: ${filePath}`);
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Fix broken lines
  // Remove orphaned lines like ", { status: 401 });"
  content = content.replace(/^\s*,\s*{\s*status:\s*\d+\s*}\s*\);?\s*$/gm, '');
  
  // Fix broken if statements
  content = content.replace(/^\s*}\s*$/gm, (match, offset) => {
    // Check if this is an orphaned closing brace
    const before = content.substring(Math.max(0, offset - 100), offset);
    if (before.includes('// Authenticate the user') || before.includes('// Check rate limiting')) {
      return ''; // Remove orphaned closing brace
    }
    return match;
  });
  
  // Fix req vs request inconsistencies
  content = content.replace(/const body = await req\.json\(\);/g, 'const body = await request.json();');
  
  // Remove duplicate auth checks that were left behind
  content = content.replace(/\/\/ Authenticate the user\s*$/gm, '');
  
  // Fix broken function bodies
  content = content.replace(/export const (\w+) = withAuth\(async \(\s*request: NextRequest,\s*context: APIAuthContext,\s*props\?: any\s*\) => \{\s*try \{\s*$/gm, (match) => {
    return match.replace(/try \{\s*$/, 'try {');
  });
  
  // Ensure proper closing of functions
  if (!content.includes('});') && content.includes('export const')) {
    // Add closing if missing
    content = content.trimEnd() + '\n});';
  }
  
  fs.writeFileSync(fullPath, content);
  console.log(`✅ Fixed: ${filePath}`);
}

// Process all files
for (const file of filesToFix) {
  try {
    fixFile(file);
  } catch (error) {
    console.log(`❌ Error fixing ${file}: ${error.message}`);
  }
}

console.log('\n✅ Migration error fixes complete!');
console.log('Run "npm run lint" to verify');