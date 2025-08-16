#!/usr/bin/env node

/**
 * Script to migrate all API routes to use the unified auth system
 * This will update imports and function signatures across all API routes
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

console.log(`${colors.cyan}${colors.bright}🔄 Starting API Auth Migration...${colors.reset}\n`);

// Find all route.ts files in the app/api directory
const apiDir = path.join(__dirname, '../app/api');
const routeFiles = glob.sync('**/route.ts', { 
  cwd: apiDir,
  ignore: ['**/route.ts.bak', '**/route.ts.backup', '**/route.ts.prefixed.bak']
});

console.log(`Found ${colors.yellow}${routeFiles.length}${colors.reset} API route files\n`);

let migratedCount = 0;
let skippedCount = 0;
let errorCount = 0;

// Patterns to detect old auth patterns
const oldAuthPatterns = [
  /import.*from\s+["']@\/lib\/api-protection["']/g,
  /import.*from\s+["']@\/lib\/api-security["']/g,
  /const\s+user\s*=\s*await\s+currentUser\(\)/g,
  /const\s+role\s*=\s*await\s+currentRole\(\)/g,
];

// Check if file already uses new auth system
function usesNewAuthSystem(content) {
  return content.includes('from "@/lib/api"') || 
         content.includes('from "@/lib/api/with-api-auth"');
}

// Check if file needs migration
function needsMigration(content) {
  // Skip if already using new system
  if (usesNewAuthSystem(content)) return false;
  
  // Check for old patterns
  for (const pattern of oldAuthPatterns) {
    if (pattern.test(content)) return true;
  }
  
  // Check for manual auth checks
  if (content.includes('currentUser()') || content.includes('currentRole()')) {
    return true;
  }
  
  return false;
}

// Determine which auth wrapper to use based on content
function determineAuthWrapper(content, filePath) {
  // Check if it's an admin route
  if (filePath.includes('/admin/') || content.includes('role === "ADMIN"')) {
    return 'withAdminAuth';
  }
  
  // Check if it's a public route (webhook, test endpoints)
  if (filePath.includes('/webhook') || 
      filePath.includes('/test') || 
      filePath.includes('/health') ||
      filePath.includes('/metrics')) {
    return 'withPublicAPI';
  }
  
  // Default to withAuth for authenticated routes
  return 'withAuth';
}

// Migrate a single file
function migrateFile(filePath) {
  const fullPath = path.join(apiDir, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Skip if doesn't need migration
  if (!needsMigration(content)) {
    console.log(`${colors.yellow}⏭️  Skipping${colors.reset} ${filePath} (already migrated or no auth)`);
    skippedCount++;
    return;
  }
  
  console.log(`${colors.cyan}📝 Migrating${colors.reset} ${filePath}`);
  
  try {
    // Backup original file
    fs.writeFileSync(`${fullPath}.backup`, content);
    
    // Remove old imports
    content = content.replace(/import.*from\s+["']@\/lib\/api-protection["'];?\n?/g, '');
    content = content.replace(/import.*from\s+["']@\/lib\/api-security["'];?\n?/g, '');
    
    // Determine auth wrapper
    const authWrapper = determineAuthWrapper(content, filePath);
    
    // Add new import
    const hasOtherImports = content.includes('import ');
    const importStatement = `import { ${authWrapper}, type APIAuthContext } from "@/lib/api";\n`;
    
    if (hasOtherImports) {
      // Add after NextResponse import or at the beginning
      if (content.includes('import { NextResponse }')) {
        content = content.replace(
          /(import\s+{\s*NextResponse[^}]*}\s+from\s+["']next\/server["'];?\n)/,
          `$1${importStatement}`
        );
      } else {
        content = importStatement + content;
      }
    } else {
      content = importStatement + '\n' + content;
    }
    
    // Update function signatures for each HTTP method
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    
    for (const method of methods) {
      // Pattern for old style: export async function METHOD(req: Request, ...)
      const oldPattern = new RegExp(
        `export\\s+async\\s+function\\s+${method}\\s*\\([^)]+\\)\\s*{`,
        'g'
      );
      
      if (oldPattern.test(content)) {
        // Extract the function body
        const functionMatch = content.match(
          new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\([^)]+\\)\\s*{([\\s\\S]*?)\\n}`, 'm')
        );
        
        if (functionMatch) {
          let functionBody = functionMatch[1];
          
          // Remove manual auth checks
          functionBody = functionBody.replace(/const\s+user\s*=\s*await\s+currentUser\(\);?\n?/g, '');
          functionBody = functionBody.replace(/const\s+role\s*=\s*await\s+currentRole\(\);?\n?/g, '');
          
          // Update user references to use context
          functionBody = functionBody.replace(/if\s*\(!user\)/g, 'if (!context.user)');
          functionBody = functionBody.replace(/user\.id/g, 'context.user.id');
          functionBody = functionBody.replace(/user\.role/g, 'context.user.role');
          
          // Create new function with wrapper
          const newFunction = `export const ${method} = ${authWrapper}(async (request: NextRequest, context: APIAuthContext) => {${functionBody}
});`;
          
          // Replace old function with new
          content = content.replace(functionMatch[0], newFunction);
        }
      }
    }
    
    // Write updated content
    fs.writeFileSync(fullPath, content);
    
    console.log(`${colors.green}✅ Migrated${colors.reset} ${filePath}`);
    migratedCount++;
    
  } catch (error) {
    console.log(`${colors.red}❌ Error migrating${colors.reset} ${filePath}: ${error.message}`);
    errorCount++;
    
    // Restore from backup if migration failed
    if (fs.existsSync(`${fullPath}.backup`)) {
      fs.copyFileSync(`${fullPath}.backup`, fullPath);
    }
  }
}

// Process all files
console.log(`${colors.bright}Processing API routes...${colors.reset}\n`);

for (const file of routeFiles) {
  migrateFile(file);
}

// Summary
console.log(`\n${colors.bright}Migration Summary:${colors.reset}`);
console.log(`${colors.green}✅ Migrated: ${migratedCount} files${colors.reset}`);
console.log(`${colors.yellow}⏭️  Skipped: ${skippedCount} files${colors.reset}`);
if (errorCount > 0) {
  console.log(`${colors.red}❌ Errors: ${errorCount} files${colors.reset}`);
}

console.log(`\n${colors.cyan}💡 Next steps:${colors.reset}`);
console.log('1. Run "npm run lint" to check for any issues');
console.log('2. Run "npm run build" to verify the build');
console.log('3. Test your API endpoints to ensure they work correctly');
console.log('4. Remove backup files with: find app/api -name "*.backup" -delete');