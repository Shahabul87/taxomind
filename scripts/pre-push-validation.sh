#!/bin/bash

# Pre-Push Validation Script
# Catches build errors BEFORE pushing to Railway
# Saves time and Railway build minutes

set -e  # Exit on any error

echo "🚀 Pre-Push Validation - Railway Build Simulation"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if any checks failed
CHECKS_FAILED=0

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        CHECKS_FAILED=1
    fi
}

# 1. Check for TypeScript errors (use tsc with project references)
echo "📝 Step 1/5: Checking TypeScript compilation..."
if NODE_OPTIONS='--max-old-space-size=2048' npx tsc --noEmit --skipLibCheck 2>&1 | head -100; then
    print_status 0 "TypeScript check passed"
else
    print_status 1 "TypeScript errors found"
    echo ""
    echo -e "${YELLOW}💡 Tip: Run 'npx tsc --noEmit' to see full error details${NC}"
fi

echo ""

# 2. Check for ESLint errors
echo "🔍 Step 2/5: Running ESLint..."
if npm run lint 2>&1 | grep -q "✔ No ESLint warnings or errors"; then
    print_status 0 "ESLint passed"
else
    print_status 1 "ESLint errors found"
    echo ""
    echo -e "${YELLOW}💡 Tip: Run 'npm run lint:fix' to auto-fix issues${NC}"
fi

echo ""

# 3. Check for missing imports
echo "🔗 Step 3/5: Checking for broken imports..."
MISSING_IMPORTS=0

# Check for common broken import patterns
if grep -r "@/app/lib/rate-limit" --include="*.ts" --include="*.tsx" app/ 2>/dev/null; then
    echo -e "${RED}Found imports from deleted @/app/lib/rate-limit${NC}"
    MISSING_IMPORTS=1
fi

if grep -r "from ['\"]@/lib/" --include="*.ts" --include="*.tsx" app/ | grep -v "rate-limit\|api\|db\|auth\|logger" | head -5; then
    echo -e "${YELLOW}Warning: Found potentially non-standard lib imports${NC}"
fi

if [ $MISSING_IMPORTS -eq 0 ]; then
    print_status 0 "No broken imports found"
else
    print_status 1 "Broken imports detected"
fi

echo ""

# 4. Check Prisma schema validity
echo "🗄️  Step 4/5: Validating Prisma schema..."
if npx prisma validate 2>&1 | grep -q "The schema is valid"; then
    print_status 0 "Prisma schema valid"
else
    print_status 1 "Prisma schema has issues"
fi

echo ""

# 5. Simulate Next.js build (quick check)
echo "🏗️  Step 5/5: Quick Next.js build validation..."
echo -e "${YELLOW}Note: Skipping full build to save time. Use --full for complete build.${NC}"

if [ "$1" == "--full" ]; then
    echo "Running full Next.js build..."
    if NODE_OPTIONS='--max-old-space-size=8192' npm run build:fast 2>&1 | tail -50; then
        print_status 0 "Full Next.js build passed"
    else
        print_status 1 "Next.js build failed"
    fi
else
    # Quick validation: just check for syntax errors in key files
    if node -e "require('./next.config.js')" 2>/dev/null; then
        print_status 0 "Next.js config valid"
    else
        print_status 1 "Next.js config has errors"
    fi
fi

echo ""
echo "=================================================="

# Final result
if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Safe to push to Railway.${NC}"
    echo ""
    echo "🚀 Ready to deploy:"
    echo "   git push origin main"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Fix errors before pushing.${NC}"
    echo ""
    echo "🔧 Common fixes:"
    echo "   • TypeScript: npx tsc --noEmit"
    echo "   • ESLint: npm run lint:fix"
    echo "   • Imports: grep -r '@/app/lib' app/"
    echo ""
    echo "💡 To see full build validation:"
    echo "   ./scripts/pre-push-validation.sh --full"
    exit 1
fi
