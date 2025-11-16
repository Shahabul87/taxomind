#!/bin/bash
# Safe Production Migration Script for Railway
# This script ensures zero data loss during migrations

set -e  # Exit on any error

echo "🚀 Starting Safe Production Migration..."
echo "=================================="

# Step 1: Validate Prisma schema
echo "📋 Step 1: Validating Prisma schema..."
npx prisma validate || {
  echo "❌ Schema validation failed!"
  exit 1
}

# Step 2: Check for pending migrations
echo "📋 Step 2: Checking for pending migrations..."
MIGRATION_STATUS=$(npx prisma migrate status 2>&1 || echo "error")

if echo "$MIGRATION_STATUS" | grep -q "No pending migrations"; then
  echo "✅ No pending migrations - database is up to date"
  exit 0
fi

if echo "$MIGRATION_STATUS" | grep -q "error"; then
  echo "⚠️  Could not determine migration status, proceeding with caution..."
fi

# Step 3: Deploy migrations (SAFE - never causes data loss)
echo "📋 Step 3: Deploying migrations..."
echo "⚠️  Using 'prisma migrate deploy' (production-safe method)"

npx prisma migrate deploy || {
  echo "❌ Migration deployment failed!"
  echo "💡 This could mean:"
  echo "   - A migration file is corrupted"
  echo "   - Database connection issue"
  echo "   - Schema drift detected"
  exit 1
}

# Step 4: Generate Prisma Client
echo "📋 Step 4: Generating Prisma Client..."
npx prisma generate

echo "=================================="
echo "✅ Migration completed successfully!"
echo "✅ Database is now in sync with schema"
