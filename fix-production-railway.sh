#!/bin/bash
set -e

echo "======================================"
echo "Railway Production Database Fix Script"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Login to Railway
echo -e "${YELLOW}Step 1: Login to Railway${NC}"
echo "Running: railway login"
railway login

echo ""
echo -e "${YELLOW}Step 2: Select your project${NC}"
echo "Running: railway link"
railway link

echo ""
echo -e "${YELLOW}Step 3: Connecting to production database...${NC}"
echo ""

# Create the SQL fix script
cat > /tmp/railway-fix.sql << 'EOF'
-- Fix Production Database Schema Mismatch
-- Add missing isFree and priceType columns

-- Add isFree column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'Course'
        AND column_name = 'isFree'
    ) THEN
        ALTER TABLE "Course" ADD COLUMN "isFree" BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added isFree column to Course table';
    ELSE
        RAISE NOTICE 'isFree column already exists';
    END IF;
END $$;

-- Add priceType column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'Course'
        AND column_name = 'priceType'
    ) THEN
        ALTER TABLE "Course" ADD COLUMN "priceType" TEXT DEFAULT 'ONE_TIME';
        RAISE NOTICE 'Added priceType column to Course table';
    ELSE
        RAISE NOTICE 'priceType column already exists';
    END IF;
END $$;

-- Verify the columns
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Course'
  AND column_name IN ('isFree', 'priceType')
ORDER BY column_name;

SELECT '✅ Database schema updated successfully!' AS status;
EOF

echo -e "${YELLOW}SQL script created at: /tmp/railway-fix.sql${NC}"
echo ""
echo -e "${YELLOW}Step 4: Getting database connection URL...${NC}"

# Get the database URL and run the SQL
DB_URL=$(railway variables get DATABASE_URL 2>/dev/null)

if [ -z "$DB_URL" ]; then
    echo -e "${RED}❌ Could not get DATABASE_URL${NC}"
    echo "Please run manually:"
    echo "  railway variables get DATABASE_URL"
    exit 1
fi

echo -e "${GREEN}✅ Got database URL${NC}"
echo ""
echo -e "${YELLOW}Step 5: Running SQL fix...${NC}"

# Run the SQL using psql
if command -v psql &> /dev/null; then
    echo "Using psql to run the fix..."
    psql "$DB_URL" -f /tmp/railway-fix.sql
    echo ""
    echo -e "${GREEN}✅ Database fix completed!${NC}"
else
    echo -e "${YELLOW}psql not found. Alternative method:${NC}"
    echo "Run this command manually:"
    echo ""
    echo "railway connect"
    echo ""
    echo "Then paste this SQL:"
    cat /tmp/railway-fix.sql
fi

echo ""
echo -e "${GREEN}======================================"
echo "✅ Fix Complete!"
echo "======================================${NC}"
echo ""
echo "Next steps:"
echo "1. Visit: https://taxomind.com/teacher/courses"
echo "2. The page should now load successfully"
echo ""
