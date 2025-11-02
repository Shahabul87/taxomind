#!/bin/bash

# Quick validation script for small changes
# Uses minimal memory by only checking changed/new files

set -e

echo "🚀 Quick Check - Validating recent changes..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get list of changed TypeScript/JavaScript files
CHANGED_FILES=$(git diff --name-only --diff-filter=ACMR HEAD | grep -E '\.(ts|tsx|js|jsx)$' || echo "")

if [ -z "$CHANGED_FILES" ]; then
  echo -e "${YELLOW}ℹ️  No TypeScript/JavaScript files changed${NC}"
  echo -e "${GREEN}✅ Nothing to check!${NC}"
  exit 0
fi

echo -e "${BLUE}📝 Changed files:${NC}"
echo "$CHANGED_FILES" | sed 's/^/   - /'
echo ""

# Check specific files with ESLint
echo -e "${BLUE}🔍 Running ESLint on changed files...${NC}"
NODE_OPTIONS='--max-old-space-size=4096' npx eslint $CHANGED_FILES --cache --cache-location .next/cache/eslint/ || {
  echo -e "${RED}❌ ESLint found errors${NC}"
  exit 1
}
echo -e "${GREEN}✅ ESLint passed${NC}"
echo ""

# For TypeScript files, use tsc on specific files
TS_FILES=$(echo "$CHANGED_FILES" | grep -E '\.(ts|tsx)$' || echo "")

if [ -n "$TS_FILES" ]; then
  echo -e "${BLUE}🔍 Type checking changed TypeScript files...${NC}"

  # Create temporary tsconfig for incremental checking
  cat > .tsconfig.temp.json << EOF
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo.temp"
  },
  "include": [
    $(echo "$TS_FILES" | sed 's/^/"/' | sed 's/$/"/' | paste -sd ',' -)
  ]
}
EOF

  NODE_OPTIONS='--max-old-space-size=4096' npx tsc --project .tsconfig.temp.json || {
    echo -e "${RED}❌ TypeScript check failed${NC}"
    rm -f .tsconfig.temp.json .tsbuildinfo.temp
    exit 1
  }

  rm -f .tsconfig.temp.json .tsbuildinfo.temp
  echo -e "${GREEN}✅ TypeScript check passed${NC}"
else
  echo -e "${YELLOW}ℹ️  No TypeScript files to check${NC}"
fi

echo ""
echo -e "${GREEN}🎉 All checks passed!${NC}"
