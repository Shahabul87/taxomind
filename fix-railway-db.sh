#!/bin/bash

# Railway Database Fix Script
# Removes orphaned 'enhance_code_explanation' migration

echo "🔧 Railway Database Migration Fix"
echo "=================================="
echo ""

if [ -z "$1" ]; then
    echo "❌ Error: DATABASE_URL required"
    echo ""
    echo "Usage:"
    echo "  ./fix-railway-db.sh 'postgresql://postgres:PASSWORD@shuttle.proxy.rlwy.net:36930/railway'"
    echo ""
    echo "Get DATABASE_URL from:"
    echo "  1. Railway Dashboard → Your Project"
    echo "  2. Click PostgreSQL service"
    echo "  3. Variables tab → DATABASE_URL"
    echo ""
    exit 1
fi

DATABASE_URL="$1"

echo "📊 Checking for failed migration..."
echo ""

# Check if migration exists
psql "$DATABASE_URL" -c "SELECT migration_name, started_at, finished_at FROM _prisma_migrations WHERE migration_name LIKE '%enhance_code_explanation%';" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "⚠️  psql command not found. Installing via Homebrew..."
    brew install postgresql
    echo ""
fi

echo ""
echo "🗑️  Removing orphaned migration..."

# Delete the failed migration
psql "$DATABASE_URL" -c "DELETE FROM _prisma_migrations WHERE migration_name LIKE '%enhance_code_explanation%';"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration removed successfully!"
    echo ""
    echo "📊 Current migrations:"
    psql "$DATABASE_URL" -c "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at DESC LIMIT 5;"
    echo ""
    echo "🚀 Next steps:"
    echo "  1. Redeploy your Railway application"
    echo "  2. Check build logs to confirm success"
else
    echo ""
    echo "❌ Failed to remove migration"
    echo "Please try manual SQL execution in Railway dashboard"
fi
