#!/bin/bash

# Create taxomind-original database in existing Docker PostgreSQL container
# This script creates a separate database for this project

echo "🔧 Creating taxomind-original database..."
echo "=========================================="
echo ""

# PostgreSQL credentials (matching your Docker setup)
PGPASSWORD="dev_password_123"
PGUSER="postgres"
PGHOST="localhost"
PGPORT="5433"
NEW_DB_NAME="taxomind_original"

# Check if PostgreSQL is running
echo "Checking PostgreSQL connection..."
PGPASSWORD=$PGPASSWORD psql -h $PGHOST -p $PGPORT -U $PGUSER -d postgres -c "SELECT version();" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Cannot connect to PostgreSQL at $PGHOST:$PGPORT"
    echo ""
    echo "Please ensure:"
    echo "1. Docker Desktop is running"
    echo "2. PostgreSQL container is running on port 5433"
    echo "3. Run: docker ps | grep postgres"
    echo ""
    exit 1
fi

echo "✅ Connected to PostgreSQL"
echo ""

# Check if database already exists
DB_EXISTS=$(PGPASSWORD=$PGPASSWORD psql -h $PGHOST -p $PGPORT -U $PGUSER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$NEW_DB_NAME'")

if [ "$DB_EXISTS" = "1" ]; then
    echo "⚠️  Database '$NEW_DB_NAME' already exists"
    echo ""
    read -p "Do you want to drop and recreate it? (yes/no): " confirm

    if [ "$confirm" = "yes" ]; then
        echo "Dropping existing database..."
        PGPASSWORD=$PGPASSWORD psql -h $PGHOST -p $PGPORT -U $PGUSER -d postgres -c "DROP DATABASE IF EXISTS $NEW_DB_NAME;"
        echo "✅ Dropped existing database"
    else
        echo "Keeping existing database"
        exit 0
    fi
fi

# Create the new database
echo "Creating database '$NEW_DB_NAME'..."
PGPASSWORD=$PGPASSWORD psql -h $PGHOST -p $PGPORT -U $PGUSER -d postgres -c "CREATE DATABASE $NEW_DB_NAME;"

if [ $? -eq 0 ]; then
    echo "✅ Database '$NEW_DB_NAME' created successfully"
else
    echo "❌ Failed to create database"
    exit 1
fi

# List all databases
echo ""
echo "Current databases:"
PGPASSWORD=$PGPASSWORD psql -h $PGHOST -p $PGPORT -U $PGUSER -d postgres -c "\l" | grep taxomind

echo ""
echo "=========================================="
echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Update DATABASE_URL in .env.local"
echo "2. Run: npx prisma db push"
echo "3. Run: npx tsx scripts/dev-seed.ts"
echo "4. Run: npx tsx scripts/seed-admin-metadata.ts"
echo ""
