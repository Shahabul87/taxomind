#!/bin/bash

# Fix Railway Migration Script
# This script resolves the failed 'enhance_code_explanation' migration

echo "🚀 Railway Migration Fix Script"
echo "================================"
echo ""
echo "⚠️  IMPORTANT: You need to set your Railway DATABASE_URL"
echo ""
echo "Steps:"
echo "1. Go to Railway Dashboard → Your Project → PostgreSQL"
echo "2. Copy the DATABASE_URL connection string"
echo "3. Run this command:"
echo ""
echo "   export RAILWAY_DATABASE_URL='your-railway-database-url-here'"
echo "   ./fix-railway-migration.sh run"
echo ""

if [ "$1" == "run" ]; then
    if [ -z "$RAILWAY_DATABASE_URL" ]; then
        echo "❌ Error: RAILWAY_DATABASE_URL not set"
        echo "Please set it using: export RAILWAY_DATABASE_URL='your-url'"
        exit 1
    fi

    echo "🔧 Connecting to Railway database..."

    # Try to mark migration as applied
    DATABASE_URL="$RAILWAY_DATABASE_URL" npx prisma migrate resolve --applied enhance_code_explanation

    if [ $? -eq 0 ]; then
        echo "✅ Migration resolved successfully!"
        echo ""
        echo "🚀 Now redeploy your Railway application"
    else
        echo "⚠️  Migration not found locally. Trying alternative method..."
        echo ""
        echo "Run this SQL directly in Railway Query tab:"
        echo ""
        echo "DELETE FROM _prisma_migrations WHERE migration_name LIKE '%enhance_code_explanation%';"
        echo ""
    fi
else
    echo "To execute the fix, run: ./fix-railway-migration.sh run"
fi
