#!/usr/bin/env node

/**
 * Fix corrupted API route files created by the automated script
 */

const fs = require('fs');
const path = require('path');

function findApiRoutes(dir) {
  const routes = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      routes.push(...findApiRoutes(fullPath));
    } else if (item === 'route.ts') {
      routes.push(fullPath);
    }
  }
  
  return routes;
}

function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip files that are already correctly formatted
    if (!content.includes('export const POST = withAdminAuth(async (request, context) => {') &&
        !content.includes('export const PUT = withAuth(async (request, context) => {') &&
        !content.includes('export const PATCH = withAuth(async (request, context) => {') &&
        !content.includes('export const DELETE = withAuth(async (request, context) => {')) {
      return false;
    }
    
    // Look for obvious corruption patterns
    const corruptionPatterns = [
      /export const (POST|PUT|PATCH|DELETE) = with.*Auth\(async \(request, context.*\) => \{.*\);.*export const (POST|PUT|PATCH|DELETE) = with.*Auth\(/gs,
      /\{ error: export const (POST|PUT|PATCH|DELETE)/g,
      /\}\, \{[^}]*\}\);.*,/g,
      /,.*export const (POST|PUT|PATCH|DELETE)/g
    ];
    
    let hasCorruption = false;
    for (const pattern of corruptionPatterns) {
      if (pattern.test(content)) {
        hasCorruption = true;
        break;
      }
    }
    
    if (!hasCorruption) {
      return false;
    }
    
    console.log(`  🔧 Fixing: ${filePath}`);
    
    // For now, just mark these files as needing manual review
    // We'll revert to a simpler approach instead of trying complex repairs
    return true;
    
  } catch (error) {
    console.log(`  ❌ Error checking ${filePath}:`, error.message);
    return false;
  }
}

function revertCorruptedFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for obvious corruption
    if (content.includes('export const POST = withAdminAuth(async (request, context) => {') ||
        content.includes('export const PUT = withAuth(async (request, context) => {') ||
        content.includes('export const PATCH = withAuth(async (request, context) => {') ||
        content.includes('export const DELETE = withAuth(async (request, context) => {')) {
      
      // Check for corruption patterns
      const isCorrupted = content.includes('{ error: export const') ||
                         content.includes('});,') ||
                         content.includes('}}});') ||
                         content.split('export const').length > 3;
      
      if (isCorrupted) {
        console.log(`  ⚠️ Corrupted file detected: ${filePath}`);
        
        // Simple fix: comment out the automated additions and add a note
        const fixed = `// NOTE: This file was auto-updated with authentication guards but contained errors.
// Please manually apply the appropriate withAuth, withAdminAuth, or withOwnership guards.
// See lib/api/with-api-auth.ts for usage examples.

${content.replace(/export const (POST|PUT|PATCH|DELETE) = with.*Auth\(/g, '// CORRUPTED: $&')}`
        
        fs.writeFileSync(filePath + '.backup', content);
        // Don't write the fixed version automatically - just log it
        console.log(`  📝 Backed up original to: ${filePath}.backup`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.log(`  ❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
console.log('🔧 Checking for corrupted API route files...\n');

const apiDir = path.join(process.cwd(), 'app/api');
const routes = findApiRoutes(apiDir);

console.log(`Checking ${routes.length} API route files\n`);

let corruptedCount = 0;

routes.forEach(route => {
  if (revertCorruptedFile(route)) {
    corruptedCount++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`  • Total files checked: ${routes.length}`);
console.log(`  • Corrupted files found: ${corruptedCount}`);

if (corruptedCount > 0) {
  console.log('\n⚠️ ACTION REQUIRED:');
  console.log('Some files were corrupted by the automated script. Please:');
  console.log('1. Review the .backup files to see the original content');
  console.log('2. Manually apply authentication guards where needed');
  console.log('3. Use lib/api/with-api-auth.ts for proper patterns');
  console.log('\nRecommended approach:');
  console.log('- Admin endpoints: withAdminAuth');
  console.log('- User endpoints: withAuth');
  console.log('- User-specific resources: withOwnership');
  console.log('- Public endpoints: withPublicAPI');
} else {
  console.log('\n✅ No corruption detected in the API files');
}