#!/usr/bin/env node

/**
 * Complete API migration fix
 * Fixes all remaining issues in migrated API files
 */

const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '../app/api');

const fixes = [
  {
    file: 'posts/[postId]/comments/[commentId]/react/route.ts',
    fixes: [
      { from: /context\.context\.user/g, to: 'context.user' }
    ]
  },
  {
    file: 'posts/[postId]/comments/[commentId]/reactions/route.ts',
    fixes: [
      { from: /}\s*}\s*\);\s*$/g, to: '}\n});' },
      { from: /194 No newline at end of file\s*195.*196.*197.*/g, to: '' }
    ]
  },
  {
    file: 'posts/[postId]/comments/[commentId]/replies/route.ts',
    fixes: [
      { from: /context\.context\.user/g, to: 'context.user' }
    ]
  },
  {
    file: 'posts/[postId]/comments/[commentId]/route.ts',
    fixes: [
      { from: /\{ status: 404 \}\s*\n\s*return/g, to: '{ status: 404 });\n    }\n\n    return' },
      { from: /\{ status: 400 \}\s*\n\s*\/\//g, to: '{ status: 400 });\n    }\n\n    //' },
      { from: /\{ status: 500 \}\s*\n\s*}\s*\);\s*$/g, to: '{ status: 500 });\n  }\n});' },
      { from: /context\.user\.id/g, to: 'context.user.id' }
    ]
  },
  {
    file: 'posts/[postId]/comments/route.ts',
    fixes: [
      { from: /context\.context\.user/g, to: 'context.user' }
    ]
  },
  {
    file: 'posts/[postId]/unpublish/route.ts',
    fixes: [
      { from: /context\.context\.user/g, to: 'context.user' }
    ]
  },
  {
    file: 'posts/route.ts',
    fixes: [
      { from: /context\.context\.user/g, to: 'context.user' },
      { from: /\{ status: 500 \}\s*\n\s*}\s*\);\s*$/g, to: '{ status: 500 });\n  }\n});' }
    ]
  },
  {
    file: 'sections/analyze-content/route.ts',
    fixes: [
      { from: /context\.context\.user/g, to: 'context.user' },
      { from: /444 No newline.*445.*446.*447.*/g, to: '}\n});' }
    ]
  },
  {
    file: 'sections/generate-content/route.ts',
    fixes: [
      { from: /context\.context\.user/g, to: 'context.user' },
      { from: /900 No newline.*901.*902.*903.*/g, to: '}\n});' }
    ]
  },
  {
    file: 'teacher-analytics/course-overview/route.ts',
    fixes: [
      { from: /context\.context\.user/g, to: 'context.user' },
      { from: /\{ status: 400 \}\s*\n\s*const/g, to: '{ status: 400 });\n    }\n\n    const' },
      { from: /\{ status: 404 \}\s*\n\s*\/\//g, to: '{ status: 404 });\n    }\n\n    //' },
      { from: /\{ status: 500 \}\s*\n\s*}\s*\);\s*$/g, to: '{ status: 500 });\n  }\n});' },
      { from: /627 No newline.*628.*629.*630.*/g, to: '}\n' },
      { from: /attempt\.context\.user/g, to: 'attempt.user' }
    ]
  },
  {
    file: 'teacher-analytics/student-profile/route.ts',
    fixes: [
      { from: /context\.context\.user/g, to: 'context.user' },
      { from: /\{ status: 400 \}\s*\n\s*const/g, to: '{ status: 400 });\n    }\n\n    const' },
      { from: /\{ status: 404 \}\s*\n\s*\/\//g, to: '{ status: 404 });\n    }\n\n    //' },
      { from: /\{ status: 500 \}\s*\n\s*}\s*\);\s*$/g, to: '{ status: 500 });\n  }\n});' },
      { from: /570 No newline.*571.*572.*573.*/g, to: '}\n' }
    ]
  }
];

console.log('🔧 Complete API Fix\n');

for (const fix of fixes) {
  const filePath = path.join(apiDir, fix.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${fix.file}`);
    continue;
  }
  
  console.log(`📝 Fixing: ${fix.file}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  for (const replacement of fix.fixes) {
    const before = content;
    content = content.replace(replacement.from, replacement.to);
    if (before !== content) {
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`  ✅ Fixed`);
  } else {
    console.log(`  ⏭️  No changes needed`);
  }
}

console.log('\n✨ Complete!');