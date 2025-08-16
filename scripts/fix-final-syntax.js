#!/usr/bin/env node

/**
 * Fix final syntax errors in API files
 */

const fs = require('fs');
const path = require('path');

const fixes = [
  {
    file: 'app/api/posts/[postId]/comments/[commentId]/reactions/route.ts',
    pattern: /}\s*}\s*\);\s*$/,
    replacement: '  }\n});'
  },
  {
    file: 'app/api/posts/route.ts',
    pattern: /{ status: 500 }\s*\n\s*}\);\s*$/,
    replacement: '{ status: 500 }\n    );\n  }\n});'
  },
  {
    file: 'app/api/sections/analyze-content/route.ts',
    pattern: /}\s*}\);\s*$/,
    replacement: '}\n});'
  },
  {
    file: 'app/api/sections/generate-content/route.ts',
    pattern: /}\s*}\);\s*$/,
    replacement: '}\n});'
  },
  {
    file: 'app/api/teacher-analytics/course-overview/route.ts',
    pattern: /{ status: 500 }\s*\n\s*}\);\s*$/,
    replacement: '{ status: 500 }\n    );\n  }\n});'
  },
  {
    file: 'app/api/teacher-analytics/student-profile/route.ts',
    pattern: /{ status: 500 }\s*\n\s*}\);\s*$/,
    replacement: '{ status: 500 }\n    );\n  }\n});'
  }
];

console.log('🔧 Fixing final syntax errors...\n');

for (const fix of fixes) {
  const filePath = path.join(__dirname, '..', fix.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${fix.file}`);
    continue;
  }
  
  console.log(`📝 Fixing: ${fix.file}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove any "No newline at end of file" text
  content = content.replace(/\d+ No newline at end of file/g, '');
  
  // Apply specific fix
  if (fix.pattern && fix.replacement) {
    content = content.replace(fix.pattern, fix.replacement);
  }
  
  // Ensure file ends properly
  if (!content.trim().endsWith('});')) {
    content = content.trim() + '\n});';
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`  ✅ Fixed`);
}

console.log('\n✨ Done!');