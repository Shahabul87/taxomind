#!/bin/bash

# Complete setup script for taxomind-original database
# This script will:
# 1. Create the database
# 2. Push the schema
# 3. Seed with data
# 4. Seed admin metadata

set -e  # Exit on any error

echo "🚀 Setting up taxomind-original database"
echo "=========================================="
echo ""

# Step 1: Create database
echo "Step 1/4: Creating database..."
./scripts/create-taxomind-original-db.sh

if [ $? -ne 0 ]; then
    echo "❌ Failed to create database"
    exit 1
fi

echo ""

# Step 2: Push Prisma schema
echo "Step 2/4: Pushing Prisma schema..."
npx prisma db push --skip-generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to push schema"
    exit 1
fi

echo "✅ Schema pushed successfully"
echo ""

# Step 3: Generate Prisma Client
echo "Step 3/4: Generating Prisma Client..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma Client"
    exit 1
fi

echo "✅ Prisma Client generated"
echo ""

# Step 4: Seed database with dev data
echo "Step 4/4: Seeding database..."
npx tsx scripts/dev-seed.ts

if [ $? -ne 0 ]; then
    echo "❌ Failed to seed database"
    exit 1
fi

echo "✅ Database seeded successfully"
echo ""

# Step 5: Seed admin metadata
echo "Step 5/5: Seeding admin metadata..."
npx tsx scripts/seed-admin-metadata.ts

if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Failed to seed admin metadata (this is optional)"
else
    echo "✅ Admin metadata seeded successfully"
fi

echo ""
echo "=========================================="
echo "✅ Setup complete!"
echo ""
echo "📊 Database: taxomind_original"
echo "🔗 Connection: postgresql://postgres:***@localhost:5433/taxomind_original"
echo ""
echo "Test accounts created:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "👤 Admin:"
echo "   Email: admin@taxomind.com"
echo "   Password: password123"
echo ""
echo "👤 Regular User:"
echo "   Email: user@taxomind.com"
echo "   Password: password123"
echo ""
echo "🌐 Admin Login URL:"
echo "   http://localhost:3000/admin/auth/login"
echo ""
echo "🌐 User Login URL:"
echo "   http://localhost:3000/auth/login"
echo ""
echo "Next steps:"
echo "1. Start the dev server: npm run dev"
echo "2. Open: http://localhost:3000"
echo ""
