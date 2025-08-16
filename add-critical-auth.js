#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔒 Adding authentication to critical endpoints...\n');

// Critical patterns that need authentication
const CRITICAL_PATTERNS = [
  /app\/api\/admin\//,
  /app\/api\/users\/\[userId\]\//,
  /app\/api\/courses\/\[courseId\]\/(publish|unpublish|checkout|enroll)/,
  /app\/api\/bills\//,
  /app\/api\/enterprise\//,
  /app\/api\/(delete|comment).*route\.ts$/,
];

// Read the withAuth wrapper code
const WITH_AUTH_IMPORT = "import { withAuth } from '@/lib/api/with-api-auth';";

function shouldProtect(filePath) {
  return CRITICAL_PATTERNS.some(pattern => pattern.test(filePath));
}

function addAuthCheck(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already has authentication
    if (content.includes('withAuth') || 
        content.includes('currentUser') || 
        content.includes('auth()')) {
      console.log(`  ✓ ${filePath} - already protected`);
      return;
    }
    
    // Add import if needed
    if (!content.includes(WITH_AUTH_IMPORT)) {
      // Find the last import statement
      const lastImportMatch = content.match(/^import.*$/m);
      if (lastImportMatch) {
        const lastImportIndex = content.lastIndexOf(lastImportMatch[0]);
        content = content.slice(0, lastImportIndex + lastImportMatch[0].length) + 
                  '\n' + WITH_AUTH_IMPORT + 
                  content.slice(lastImportIndex + lastImportMatch[0].length);
      } else {
        content = WITH_AUTH_IMPORT + '\n\n' + content;
      }
    }
    
    // Add auth check at the beginning of each handler
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    let modified = false;
    
    methods.forEach(method => {
      const regex = new RegExp(`export async function ${method}\\s*\\([^)]*\\)\\s*{`, 'g');
      if (regex.test(content)) {
        // Add auth check after the opening brace
        content = content.replace(regex, (match) => {
          modified = true;
          return match + `
  // Authentication check
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
`;
        });
      }
    });
    
    if (modified) {
      // Add auth import if needed
      if (!content.includes("import { auth }")) {
        content = "import { auth } from '@/auth';\n" + content;
      }
      
      fs.writeFileSync(filePath, content);
      console.log(`  🔒 ${filePath} - protected`);
    } else {
      console.log(`  ⏭️  ${filePath} - no handlers found`);
    }
    
  } catch (error) {
    console.log(`  ❌ ${filePath} - error: ${error.message}`);
  }
}

// Find all API route files
const { execSync } = require('child_process');
const files = execSync('find app/api -name "*.ts" -type f', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

// Process critical files
let protectedCount = 0;
files.forEach(file => {
  if (shouldProtect(file)) {
    addAuthCheck(file);
    protectedCount++;
  }
});

console.log(`\n✅ Processed ${protectedCount} critical endpoint files`);
console.log('📝 Note: Review each protected endpoint to ensure proper authorization logic');
