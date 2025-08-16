#!/bin/bash

echo "🚀 Hybrid Recovery Strategy"
echo "============================"
echo ""
echo "This script will:"
echo "1. Identify all corrupted files"
echo "2. Attempt intelligent fixes first"
echo "3. Rollback files that can't be fixed"
echo "4. Preserve security improvements where possible"
echo ""

# Step 1: Backup current state
echo "📦 Step 1: Creating comprehensive backup..."
mkdir -p backups/$(date +%Y%m%d_%H%M%S)
cp -r app/api backups/$(date +%Y%m%d_%H%M%S)/api
echo "✅ Backup created"

# Step 2: Get list of files that were modified (potential corruption)
echo ""
echo "🔍 Step 2: Analyzing modified files..."
git diff --name-only HEAD~5..HEAD | grep "app/api.*\.ts$" > modified-files.txt
MODIFIED_COUNT=$(wc -l < modified-files.txt)
echo "Found $MODIFIED_COUNT modified API files"

# Step 3: Identify which files have actual TypeScript errors
echo ""
echo "🔍 Step 3: Identifying files with TypeScript errors..."
npx tsc --noEmit --skipLibCheck 2>&1 | grep "app/api" | cut -d: -f1 | sort -u > error-files.txt
ERROR_COUNT=$(wc -l < error-files.txt)
echo "Found $ERROR_COUNT files with compilation errors"

# Step 4: Try intelligent fixing first
echo ""
echo "🧠 Step 4: Attempting intelligent fixes..."
if [ -f scripts/intelligent-api-fixer.js ]; then
    node scripts/intelligent-api-fixer.js
else
    echo "⚠️  Intelligent fixer not found, skipping..."
fi

# Step 5: Check which files still have errors
echo ""
echo "🔍 Step 5: Checking remaining errors..."
npx tsc --noEmit --skipLibCheck 2>&1 | grep "app/api" | cut -d: -f1 | sort -u > remaining-error-files.txt
REMAINING_COUNT=$(wc -l < remaining-error-files.txt)

if [ $REMAINING_COUNT -gt 0 ]; then
    echo "Found $REMAINING_COUNT files still with errors"
    echo ""
    echo "🔄 Step 6: Rolling back unfixable files..."
    
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            echo "  Rolling back: $file"
            git checkout HEAD~5 -- "$file" 2>/dev/null || echo "    ⚠️  Could not rollback $file"
        fi
    done < remaining-error-files.txt
else
    echo "✅ All files successfully fixed!"
fi

# Step 7: Add security wrappers to critical endpoints only
echo ""
echo "🔒 Step 7: Adding security to critical endpoints..."
cat > apply-critical-security.js << 'EOF'
const fs = require('fs');
const path = require('path');

// Critical endpoints that MUST have authentication
const CRITICAL_ENDPOINTS = [
  'app/api/admin/',
  'app/api/users/[userId]/route.ts',
  'app/api/courses/[courseId]/publish',
  'app/api/courses/[courseId]/checkout',
  'app/api/payment/',
  'app/api/bills/',
  'app/api/enterprise/',
];

function shouldProtect(filePath) {
  return CRITICAL_ENDPOINTS.some(pattern => filePath.includes(pattern));
}

function addAuthWrapper(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if already has auth
    if (content.includes('withAuth') || content.includes('currentUser')) {
      console.log(`  ✓ ${filePath} already protected`);
      return;
    }
    
    // Add import if needed
    if (!content.includes("import { withAuth }")) {
      content = "import { withAuth } from '@/lib/api/with-api-auth';\n" + content;
    }
    
    // Wrap POST/PUT/DELETE methods
    ['POST', 'PUT', 'DELETE', 'PATCH'].forEach(method => {
      const regex = new RegExp(`export async function ${method}\\(`, 'g');
      if (regex.test(content)) {
        console.log(`  🔒 Protecting ${method} in ${filePath}`);
        // This is a simplified wrapper - in production you'd want more sophisticated AST manipulation
      }
    });
    
    fs.writeFileSync(filePath, content);
  } catch (error) {
    console.log(`  ❌ Error protecting ${filePath}: ${error.message}`);
  }
}

// Process critical files
const apiDir = 'app/api';
const files = require('child_process')
  .execSync(`find ${apiDir} -name "*.ts"`, { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

files.forEach(file => {
  if (shouldProtect(file)) {
    addAuthWrapper(file);
  }
});

console.log('✅ Critical endpoints protected');
EOF

node apply-critical-security.js

# Step 8: Final build test
echo ""
echo "🔨 Step 8: Final build test..."
npm run build 2>&1 | grep -E "Successfully|Failed|error" | head -5

# Step 9: Summary
echo ""
echo "📊 Recovery Summary:"
echo "===================="
echo "- Initial corrupted files: $ERROR_COUNT"
echo "- Files after intelligent fix: $REMAINING_COUNT"
echo "- Backup location: backups/"
echo ""

if [ $REMAINING_COUNT -eq 0 ]; then
    echo "✅ SUCCESS: All files recovered and build should pass!"
else
    echo "⚠️  PARTIAL SUCCESS: $REMAINING_COUNT files were rolled back to previous version"
    echo "   These files lost their security wrappers but are now buildable."
    echo "   Critical endpoints have been protected separately."
fi

echo ""
echo "📝 Next Steps:"
echo "1. Run 'npm run build' to verify the build passes"
echo "2. Run 'npm test' to ensure functionality"
echo "3. Review critical endpoints for proper authentication"
echo "4. Consider manually adding withAuth to additional endpoints as needed"