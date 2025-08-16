#!/bin/bash

echo "🔄 Git-based Restoration of API Files"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Create backup of current state
echo -e "${YELLOW}📦 Step 1: Creating backup of current corrupted state...${NC}"
BACKUP_DIR="backups/corrupted_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r app/api "$BACKUP_DIR/api"
echo -e "${GREEN}✅ Backup created at: $BACKUP_DIR${NC}"

# Step 2: Get list of all modified API files
echo ""
echo -e "${YELLOW}🔍 Step 2: Identifying modified API files...${NC}"
git status --short | grep "app/api" | awk '{print $2}' > modified-api-files.txt
TOTAL_FILES=$(wc -l < modified-api-files.txt)
echo -e "Found ${RED}$TOTAL_FILES${NC} modified API files"

# Step 3: Check which files have TypeScript errors
echo ""
echo -e "${YELLOW}🔍 Step 3: Checking for TypeScript errors...${NC}"
npx tsc --noEmit --skipLibCheck 2>&1 | grep "app/api" | cut -d: -f1 | sort -u > error-api-files.txt
ERROR_FILES=$(wc -l < error-api-files.txt)
echo -e "Found ${RED}$ERROR_FILES${NC} files with compilation errors"

# Step 4: Restore all modified API files from git
echo ""
echo -e "${YELLOW}🔄 Step 4: Restoring API files from last known good commit...${NC}"
echo "This will restore all modified API files to their state before corruption."
echo ""
read -p "Do you want to proceed? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Counter for progress
    RESTORED=0
    FAILED=0
    
    # Restore each modified API file
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            # Try to restore from git
            if git checkout HEAD -- "$file" 2>/dev/null; then
                echo -e "${GREEN}✅${NC} Restored: $file"
                ((RESTORED++))
            else
                echo -e "${RED}❌${NC} Failed to restore: $file"
                ((FAILED++))
            fi
        fi
    done < modified-api-files.txt
    
    echo ""
    echo -e "${GREEN}=== Restoration Complete ===${NC}"
    echo "Files restored: $RESTORED"
    echo "Files failed: $FAILED"
else
    echo "Restoration cancelled."
    exit 1
fi

# Step 5: Save list of critical endpoints that need protection
echo ""
echo -e "${YELLOW}📝 Step 5: Creating list of critical endpoints for manual protection...${NC}"
cat > critical-endpoints.txt << 'EOF'
# Critical endpoints that MUST have authentication
app/api/admin/**/*.ts
app/api/users/[userId]/*.ts
app/api/courses/[courseId]/publish/route.ts
app/api/courses/[courseId]/unpublish/route.ts
app/api/courses/[courseId]/checkout/route.ts
app/api/courses/[courseId]/enroll/route.ts
app/api/bills/**/*.ts
app/api/enterprise/**/*.ts
app/api/users/*/image/route.ts
app/api/users/*/profile-links/*.ts
app/api/delete-nested-reply/route.ts
app/api/comment-delete/route.ts
EOF

echo -e "${GREEN}✅ Critical endpoints list saved to: critical-endpoints.txt${NC}"

# Step 6: Verify the restoration
echo ""
echo -e "${YELLOW}🔨 Step 6: Verifying TypeScript compilation...${NC}"
ERROR_COUNT=$(npx tsc --noEmit --skipLibCheck 2>&1 | grep -c "error TS" || true)

if [ "$ERROR_COUNT" -eq "0" ]; then
    echo -e "${GREEN}✅ SUCCESS! No TypeScript errors found!${NC}"
else
    echo -e "${YELLOW}⚠️  Still $ERROR_COUNT TypeScript errors remaining${NC}"
    echo "These might be from non-API files or pre-existing issues."
fi

# Step 7: Create a script to selectively add auth to critical endpoints
echo ""
echo -e "${YELLOW}📜 Step 7: Creating script to add auth to critical endpoints...${NC}"
cat > add-critical-auth.js << 'EOF'
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
EOF

chmod +x add-critical-auth.js
echo -e "${GREEN}✅ Auth addition script created: add-critical-auth.js${NC}"

# Step 8: Summary
echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}🎉 Restoration Process Complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo "📊 Summary:"
echo "  - Total modified files: $TOTAL_FILES"
echo "  - Files with errors: $ERROR_FILES"
echo "  - Files restored: $RESTORED"
echo "  - Backup location: $BACKUP_DIR"
echo ""
echo "📝 Next Steps:"
echo "  1. Run 'npm run build' to verify the build passes"
echo "  2. Run 'node add-critical-auth.js' to add auth to critical endpoints"
echo "  3. Review critical-endpoints.txt for additional endpoints to protect"
echo "  4. Test the application functionality"
echo ""
echo "💡 The security improvements (middleware, auth guards, MFA, etc.) are still in place."
echo "   Only the corrupted API files were restored."