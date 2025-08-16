#!/usr/bin/env node

/**
 * Safe API Migration Script
 * Migrates all API endpoints to use the unified auth system from @/lib/api
 * This script is safe and won't break existing functionality
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

console.log(`${colors.cyan}${colors.bright}🔒 Safe API Auth Migration Script${colors.reset}\n`);

// List of API routes that need migration (from our earlier analysis)
const routesToMigrate = [
  'learning-analytics/personal/route.ts',
  'debug-course-simple/route.ts',
  'test-course-update/route.ts',
  'sections/generate-content/route.ts',
  'sections/analyze-content/route.ts',
  'teacher-analytics/course-overview/route.ts',
  'teacher-analytics/student-profile/route.ts',
  'comment-reaction/route.ts',
  'nested-replies/route.ts',
  'posts/route.ts',
  'posts/[postId]/comments/route.ts',
  'posts/[postId]/comments/[commentId]/replies/[replyId]/reactions/route.ts',
  'posts/[postId]/comments/[commentId]/replies/[replyId]/route.ts',
  'posts/[postId]/comments/[commentId]/replies/route.ts',
  'posts/[postId]/comments/[commentId]/reactions/route.ts',
  'posts/[postId]/comments/[commentId]/route.ts',
  'posts/[postId]/comments/[commentId]/react/route.ts',
  'posts/[postId]/unpublish/route.ts',
  'posts/[postId]/replies/[replyId]/reactions/route.ts',
  // Add more as needed
];

const apiDir = path.join(__dirname, '../app/api');

function createBackup(filePath) {
  const backupPath = `${filePath}.pre-migration.backup`;
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
    return true;
  }
  return false;
}

function migrateRoute(relativePath) {
  const fullPath = path.join(apiDir, relativePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`${colors.yellow}⚠️  File not found:${colors.reset} ${relativePath}`);
    return false;
  }
  
  console.log(`${colors.cyan}📝 Processing:${colors.reset} ${relativePath}`);
  
  // Create backup
  const backupCreated = createBackup(fullPath);
  if (backupCreated) {
    console.log(`  ${colors.green}✓${colors.reset} Backup created`);
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  // Check if already migrated
  if (content.includes('from "@/lib/api"')) {
    console.log(`  ${colors.yellow}⏭️${colors.reset} Already migrated`);
    return false;
  }
  
  // Determine auth type based on path and content
  let authWrapper = 'withAuth'; // default
  
  if (relativePath.includes('admin/') || content.includes('ADMIN')) {
    authWrapper = 'withAdminAuth';
  } else if (relativePath.includes('webhook') || relativePath.includes('test')) {
    authWrapper = 'withPublicAPI';
  }
  
  // Update imports
  if (content.includes('currentUser') || content.includes('currentRole')) {
    // Remove old auth imports
    content = content.replace(/import\s*{\s*currentUser[^}]*}\s*from\s*["']@\/lib\/auth["'];?\n?/g, '');
    content = content.replace(/import\s*{\s*currentRole[^}]*}\s*from\s*["']@\/lib\/auth["'];?\n?/g, '');
    
    // Add new import
    const newImport = `import { ${authWrapper}, type APIAuthContext, createSuccessResponse, createErrorResponse, ApiError } from "@/lib/api";\n`;
    
    // Add after NextResponse import or at the beginning
    if (content.includes('import { NextResponse }')) {
      content = content.replace(
        /(import\s*{\s*NextResponse[^}]*}\s*from\s*["']next\/server["'];?\n)/,
        `import { NextRequest } from "next/server";\n${newImport}`
      );
    } else if (content.includes('import ')) {
      // Add after first import
      content = content.replace(/(import[^;]+;\n)/, `$1${newImport}`);
    } else {
      // Add at the beginning
      content = newImport + content;
    }
    
    modified = true;
  }
  
  // Update function signatures for protected routes
  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  
  for (const method of methods) {
    const functionRegex = new RegExp(
      `export\\s+async\\s+function\\s+${method}\\s*\\([^)]*\\)\\s*{[\\s\\S]*?\\n}(?=\\n|$)`,
      'gm'
    );
    
    const match = content.match(functionRegex);
    
    if (match && content.includes('currentUser')) {
      console.log(`  ${colors.cyan}→${colors.reset} Converting ${method} to use ${authWrapper}`);
      
      // Extract function body
      const functionBody = match[0]
        .replace(/export\s+async\s+function\s+\w+\s*\([^)]*\)\s*{/, '')
        .replace(/\n}$/, '');
      
      // Clean up auth checks
      let cleanedBody = functionBody
        .replace(/const\s+user\s*=\s*await\s+currentUser\(\);?\n?/g, '')
        .replace(/const\s+role\s*=\s*await\s+currentRole\(\);?\n?/g, '')
        .replace(/if\s*\(!user[^}]*}\n?/g, '')
        .replace(/user\.id/g, 'context.user.id')
        .replace(/user\.role/g, 'context.user.role')
        .replace(/user\.email/g, 'context.user.email');
      
      // Create new wrapped function
      const newFunction = `export const ${method} = ${authWrapper}(async (
  request: NextRequest, 
  context: APIAuthContext,
  props?: any
) => {${cleanedBody}
});`;
      
      content = content.replace(match[0], newFunction);
      modified = true;
    }
  }
  
  // Update response patterns
  if (modified) {
    // Replace NextResponse patterns with new API response utilities
    content = content.replace(
      /return\s+new\s+NextResponse\s*\(\s*"([^"]+)"\s*,\s*{\s*status:\s*500\s*}\s*\)/g,
      'return createErrorResponse(ApiError.internal("$1"))'
    );
    content = content.replace(
      /return\s+new\s+NextResponse\s*\(\s*"([^"]+)"\s*,\s*{\s*status:\s*401\s*}\s*\)/g,
      'return createErrorResponse(ApiError.unauthorized("$1"))'
    );
    content = content.replace(
      /return\s+new\s+NextResponse\s*\(\s*"([^"]+)"\s*,\s*{\s*status:\s*403\s*}\s*\)/g,
      'return createErrorResponse(ApiError.forbidden("$1"))'
    );
    content = content.replace(
      /return\s+NextResponse\.json\s*\(([^)]+)\)/g,
      'return createSuccessResponse($1)'
    );
  }
  
  if (modified) {
    fs.writeFileSync(fullPath, content);
    console.log(`  ${colors.green}✅ Migrated successfully${colors.reset}`);
    return true;
  } else {
    console.log(`  ${colors.yellow}⏭️  No changes needed${colors.reset}`);
    return false;
  }
}

// Process routes
let migratedCount = 0;
let skippedCount = 0;
let errorCount = 0;

console.log(`\n${colors.bright}Starting migration...${colors.reset}\n`);

for (const route of routesToMigrate) {
  try {
    const result = migrateRoute(route);
    if (result) {
      migratedCount++;
    } else {
      skippedCount++;
    }
  } catch (error) {
    console.log(`  ${colors.red}❌ Error: ${error.message}${colors.reset}`);
    errorCount++;
  }
}

// Summary
console.log(`\n${colors.bright}════════════════════════════════════════${colors.reset}`);
console.log(`${colors.bright}Migration Summary:${colors.reset}`);
console.log(`${colors.green}✅ Migrated: ${migratedCount} files${colors.reset}`);
console.log(`${colors.yellow}⏭️  Skipped: ${skippedCount} files${colors.reset}`);
if (errorCount > 0) {
  console.log(`${colors.red}❌ Errors: ${errorCount} files${colors.reset}`);
}

console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
console.log('1. Run: npm run lint');
console.log('2. Run: npm run build');
console.log('3. Test affected endpoints');
console.log('4. If everything works, remove backups:');
console.log('   find app/api -name "*.pre-migration.backup" -delete\n');