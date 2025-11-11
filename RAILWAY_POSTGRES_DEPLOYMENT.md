# Railway PostgreSQL Deployment Guide

**Date:** January 11, 2025
**Project:** Taxomind LMS
**Platform:** Railway

---

## 🎯 Overview

This guide covers how to deploy, redeploy, and manage PostgreSQL databases on Railway for the Taxomind project.

---

## 📋 Table of Contents

1. [Understanding Railway Database Services](#understanding-railway-database-services)
2. [Method 1: Redeploy Existing Database](#method-1-redeploy-existing-database)
3. [Method 2: Create New Database Service](#method-2-create-new-database-service)
4. [Method 3: Using Railway CLI](#method-3-using-railway-cli)
5. [Environment Variables Setup](#environment-variables-setup)
6. [Database Connection Testing](#database-connection-testing)
7. [Prisma Migrations](#prisma-migrations)
8. [Troubleshooting](#troubleshooting)
9. [Data Migration (Old to New)](#data-migration-old-to-new)

---

## 🗄️ Understanding Railway Database Services

### Railway Database Characteristics

- **Private Networking:** `postgres.railway.internal:5432` (only available at runtime)
- **Public URL:** `postgres-production.up.railway.app` (available always, but slower)
- **Automatic Backups:** Configured per plan
- **Persistent Volumes:** Data persists across deployments
- **Isolated Services:** Each database is a separate Railway service

### Important Concepts

1. **Service vs Database:**
   - Service = Container running PostgreSQL
   - Database = Schema/data inside PostgreSQL

2. **Redeploying:**
   - **Redeploy Service:** Restarts container, keeps data
   - **Delete + Create:** Destroys all data, fresh start

3. **Environment Variables:**
   - `DATABASE_URL` - Full connection string
   - `DATABASE_PRIVATE_URL` - Internal network URL (runtime only)
   - `DATABASE_PUBLIC_URL` - External URL (always available)

---

## 🔄 Method 1: Redeploy Existing Database (Recommended)

**Use this when:** Your database service exists but needs to be restarted.

### Via Railway Dashboard (Web UI)

1. **Navigate to Your Project**
   ```
   https://railway.app/dashboard
   → Select your project "taxomind"
   ```

2. **Find PostgreSQL Service**
   ```
   → Click on the PostgreSQL service tile
   → You should see something like "postgres" or "PostgreSQL"
   ```

3. **Redeploy the Database**
   ```
   → Click "Deployments" tab
   → Find the latest deployment
   → Click the three dots (⋮) menu
   → Select "Redeploy"
   ```

4. **Wait for Deployment**
   ```
   → Watch the logs until you see:
   ✅ "PostgreSQL init process complete; ready for start up"
   ✅ "database system is ready to accept connections"
   ```

### Via Railway CLI

```bash
# 1. Install Railway CLI (if not installed)
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Link to your project
railway link

# 4. List services
railway status

# 5. Redeploy PostgreSQL service
railway service
# Select "postgres" (or your database service name)
railway up --service postgres
```

---

## 🆕 Method 2: Create New Database Service

**Use this when:** You need a fresh database or your current one is corrupted.

⚠️ **WARNING:** This will create a NEW database. Old data will NOT be transferred automatically.

### Via Railway Dashboard

1. **Go to Your Project**
   ```
   https://railway.app/dashboard
   → Select "taxomind" project
   ```

2. **Add New Service**
   ```
   → Click "+ New" button
   → Select "Database"
   → Choose "PostgreSQL"
   ```

3. **Configure Database**
   ```
   Name: taxomind-postgres (or any name)
   Region: Same as your app (e.g., us-west1)
   → Click "Add PostgreSQL"
   ```

4. **Wait for Provisioning**
   ```
   → Railway automatically provisions the database
   → Wait for status: "Active"
   → Takes 1-3 minutes
   ```

5. **Get Connection Details**
   ```
   → Click on the new PostgreSQL service
   → Go to "Variables" tab
   → Copy the connection strings
   ```

### Via Railway CLI

```bash
# 1. Navigate to project directory
cd /Users/mdshahabulalam/myprojects/taxomind/taxomind

# 2. Link to Railway project
railway link

# 3. Add new PostgreSQL service
railway add

# Select "PostgreSQL" from the list

# 4. Get database URL
railway variables
# Look for DATABASE_URL, DATABASE_PRIVATE_URL, DATABASE_PUBLIC_URL
```

---

## 💻 Method 3: Using Railway CLI (Advanced)

### Installation

```bash
# Install Railway CLI
npm install -g @railway/cli

# Or with Homebrew (macOS)
brew install railway

# Or download from
# https://docs.railway.app/develop/cli#installation
```

### Basic Commands

```bash
# 1. Login
railway login

# 2. Link project (run in project directory)
cd /Users/mdshahabulalam/myprojects/taxomind/taxomind
railway link
# Select your project from the list

# 3. Check status
railway status

# 4. View services
railway service
# Shows all services (app, postgres, etc.)

# 5. View variables
railway variables
# Shows all environment variables

# 6. Connect to PostgreSQL
railway run psql $DATABASE_URL
# Opens PostgreSQL interactive terminal

# 7. View logs
railway logs
# Shows recent logs for selected service

# 8. Redeploy
railway up
```

### Database Management Commands

```bash
# Connect to database
railway run psql $DATABASE_URL

# Inside psql:
\l                    # List databases
\dt                   # List tables
\d "TableName"        # Describe table schema
\q                    # Quit

# Run SQL file
railway run psql $DATABASE_URL < backup.sql

# Create backup
railway run pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Check database size
railway run psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size('railway'));"
```

---

## 🔧 Environment Variables Setup

### Required Variables for Your App

Railway automatically sets these for the database service:

```bash
# Automatically created by Railway
DATABASE_URL=postgresql://postgres:password@postgres.railway.internal:5432/railway
DATABASE_PRIVATE_URL=postgresql://postgres:password@postgres.railway.internal:5432/railway
DATABASE_PUBLIC_URL=postgresql://postgres:password@postgres-production.up.railway.app:5432/railway

# Additional Prisma variables (if needed)
POSTGRES_PRISMA_URL=${{DATABASE_PRIVATE_URL}}?pgbouncer=true&connect_timeout=15
POSTGRES_URL_NON_POOLING=${{DATABASE_PRIVATE_URL}}
```

### Link Database to Your App Service

1. **Via Dashboard:**
   ```
   → Go to your app service
   → Click "Variables" tab
   → Click "New Variable"
   → Select "Reference" type
   → Choose: postgres.DATABASE_URL
   → Name it: DATABASE_URL
   → Save
   ```

2. **Via CLI:**
   ```bash
   railway service
   # Select your app service

   railway variables --set DATABASE_URL='${{postgres.DATABASE_URL}}'
   ```

3. **Verify Variables:**
   ```bash
   railway variables
   # Should show DATABASE_URL with actual connection string
   ```

---

## ✅ Database Connection Testing

### Test 1: Via Railway CLI

```bash
# Test connection
railway run psql $DATABASE_URL -c "SELECT version();"

# Expected output:
# PostgreSQL 16.x on x86_64-pc-linux-gnu, compiled by gcc...
```

### Test 2: Via Node.js Script

Create `scripts/test-db-connection.js`:

```javascript
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');

    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('📊 PostgreSQL version:', result[0].version);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
```

Run it:

```bash
# Locally (with Railway variables)
railway run node scripts/test-db-connection.js

# Or set DATABASE_URL temporarily
DATABASE_URL="your-railway-postgres-url" node scripts/test-db-connection.js
```

### Test 3: Via Prisma Studio

```bash
# Open Prisma Studio with Railway database
railway run npx prisma studio

# Opens at http://localhost:5555
# You can browse tables and data
```

### Test 4: Via curl (Health Check)

After deployment:

```bash
# Test your app's health endpoint
curl https://your-app.railway.app/api/health

# Should return:
# {"status":"ok","database":"connected"}
```

---

## 🔄 Prisma Migrations

### Running Migrations on Railway

#### Option 1: Automatic (Recommended)

Your `railway.json` is already configured:

```json
{
  "deploy": {
    "startCommand": "sh -c 'node scripts/fix-failed-migrations.js && npx prisma migrate deploy && npm run start'"
  }
}
```

Migrations run automatically when your app starts.

#### Option 2: Manual via CLI

```bash
# 1. Link to Railway
railway link

# 2. Run migrations
railway run npx prisma migrate deploy

# 3. Check migration status
railway run npx prisma migrate status

# 4. View migration history
railway run npx prisma migrate status
```

#### Option 3: Via Railway Shell

```bash
# Open shell in Railway environment
railway shell

# Inside shell:
npx prisma migrate deploy
npx prisma migrate status
exit
```

### Common Migration Commands

```bash
# Check pending migrations
railway run npx prisma migrate status

# Apply migrations
railway run npx prisma migrate deploy

# Generate Prisma client
railway run npx prisma generate

# Reset database (⚠️ DELETES ALL DATA)
railway run npx prisma migrate reset --force

# Create new migration (development only)
npx prisma migrate dev --name description_of_change
```

---

## 🐛 Troubleshooting

### Issue 1: "Can't reach database server"

**Error:**
```
Can't reach database server at `postgres.railway.internal:5432`
```

**Causes & Solutions:**

1. **Using private URL during build:**
   ```
   ❌ Problem: DATABASE_PRIVATE_URL used in build phase
   ✅ Solution: Use DATABASE_PUBLIC_URL for build, or skip DB access during build
   ```

2. **Database not running:**
   ```bash
   # Check database status
   railway status

   # If stopped, redeploy
   railway up --service postgres
   ```

3. **Wrong environment variable:**
   ```bash
   # Check what's set
   railway variables

   # Should see DATABASE_URL with correct format:
   # postgresql://user:pass@host:5432/dbname
   ```

### Issue 2: "Connection timeout"

**Causes:**

1. Database service is starting (wait 30-60 seconds)
2. Wrong port (should be 5432)
3. SSL/TLS issues

**Solutions:**

```bash
# 1. Check database logs
railway logs --service postgres

# 2. Test with increased timeout
railway run psql $DATABASE_URL?connect_timeout=30

# 3. Add to your DATABASE_URL:
postgresql://...?connect_timeout=30&sslmode=require
```

### Issue 3: "Password authentication failed"

**Causes:**

1. Wrong credentials
2. Using old connection string
3. Database was reset

**Solutions:**

```bash
# 1. Get fresh connection string
railway variables

# 2. Update your local .env
# Copy DATABASE_URL from Railway

# 3. Verify connection
railway run psql $DATABASE_URL -c "SELECT 1;"
```

### Issue 4: "Database does not exist"

**Causes:**

1. Database name mismatch
2. Fresh database with no migrations

**Solutions:**

```bash
# 1. Check database name
railway run psql $DATABASE_URL -c "\l"

# 2. Run migrations
railway run npx prisma migrate deploy

# 3. Or create database manually
railway run psql $DATABASE_URL -c "CREATE DATABASE railway;"
```

### Issue 5: Migration errors

**Error:**
```
Migration `xxx` failed to apply
```

**Solutions:**

```bash
# 1. Check migration status
railway run npx prisma migrate status

# 2. Mark failed migration as resolved
railway run npx prisma migrate resolve --applied "migration_name"

# 3. Or mark as rolled back
railway run npx prisma migrate resolve --rolled-back "migration_name"

# 4. Try applying again
railway run npx prisma migrate deploy

# 5. Last resort: Reset database (⚠️ DELETES DATA)
railway run npx prisma migrate reset --force
```

---

## 📦 Data Migration (Old to New Database)

If you're creating a NEW database and need to migrate data:

### Step 1: Backup Old Database

```bash
# 1. Get old database URL
OLD_DB_URL="postgresql://old-connection-string"

# 2. Create backup
pg_dump "$OLD_DB_URL" > backup_$(date +%Y%m%d_%H%M%S).sql

# Or via Railway CLI (if old DB is on Railway)
railway service
# Select old postgres service
railway run pg_dump $DATABASE_URL > old_db_backup.sql
```

### Step 2: Create New Database

Follow [Method 2: Create New Database Service](#method-2-create-new-database-service)

### Step 3: Restore to New Database

```bash
# 1. Get new database URL from Railway
railway variables
# Copy the new DATABASE_URL

# 2. Restore backup
NEW_DB_URL="postgresql://new-connection-string"
psql "$NEW_DB_URL" < old_db_backup.sql

# Or via Railway CLI
railway service
# Select NEW postgres service
railway run psql $DATABASE_URL < old_db_backup.sql
```

### Step 4: Verify Migration

```bash
# 1. Check table count
railway run psql $DATABASE_URL -c "\dt"

# 2. Check row counts
railway run psql $DATABASE_URL -c "
  SELECT
    schemaname,
    tablename,
    n_live_tup as row_count
  FROM pg_stat_user_tables
  ORDER BY n_live_tup DESC;
"

# 3. Test with Prisma Studio
railway run npx prisma studio
```

### Step 5: Update App to Use New Database

```bash
# 1. Update app service variables
railway service
# Select your app service

railway variables --set DATABASE_URL='${{new-postgres.DATABASE_URL}}'

# 2. Redeploy app
railway up
```

---

## 🚀 Quick Start Checklist

### For Fresh Deployment:

- [ ] Install Railway CLI: `npm install -g @railway/cli`
- [ ] Login: `railway login`
- [ ] Link project: `railway link`
- [ ] Create PostgreSQL: `railway add` → Select PostgreSQL
- [ ] Get DATABASE_URL: `railway variables`
- [ ] Add to app service: Link DATABASE_URL variable
- [ ] Run migrations: `railway run npx prisma migrate deploy`
- [ ] Deploy app: `railway up`
- [ ] Test connection: `railway run psql $DATABASE_URL -c "SELECT 1;"`
- [ ] Check health: `curl https://your-app.railway.app/api/health`

### For Redeployment:

- [ ] Link project: `railway link`
- [ ] Check status: `railway status`
- [ ] Select database: `railway service` → postgres
- [ ] Redeploy: `railway up`
- [ ] Check logs: `railway logs`
- [ ] Verify connection: Test health endpoint

---

## 📊 Database Health Monitoring

### Check Database Status

```bash
# 1. Service status
railway status

# 2. Database connections
railway run psql $DATABASE_URL -c "
  SELECT
    count(*) as total_connections,
    state,
    usename
  FROM pg_stat_activity
  GROUP BY state, usename;
"

# 3. Database size
railway run psql $DATABASE_URL -c "
  SELECT
    pg_size_pretty(pg_database_size('railway')) as size;
"

# 4. Table sizes
railway run psql $DATABASE_URL -c "
  SELECT
    schemaname || '.' || tablename as table,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  LIMIT 10;
"
```

---

## 🔗 Useful Railway Commands Reference

```bash
# Authentication
railway login                    # Login to Railway
railway logout                   # Logout

# Project Management
railway link                     # Link to existing project
railway unlink                   # Unlink from project
railway status                   # Show project status
railway list                     # List all projects

# Service Management
railway service                  # Select/switch service
railway add                      # Add new service
railway up                       # Deploy service
railway down                     # Stop service

# Variables
railway variables                # List all variables
railway variables --set KEY=VAL  # Set variable
railway variables --unset KEY    # Remove variable

# Execution
railway run [command]            # Run command with Railway env
railway shell                    # Open shell in Railway env

# Logs & Monitoring
railway logs                     # View logs
railway logs --follow            # Follow logs (real-time)

# Database Specific
railway connect postgres         # Connect to PostgreSQL
railway run psql $DATABASE_URL   # Open psql terminal
```

---

## 📚 Additional Resources

- [Railway PostgreSQL Documentation](https://docs.railway.app/databases/postgresql)
- [Railway CLI Documentation](https://docs.railway.app/develop/cli)
- [Prisma Railway Deployment Guide](https://www.prisma.io/docs/orm/prisma-client/deployment/traditional/deploy-to-railway)
- [Railway Private Networking](https://docs.railway.app/reference/private-networking)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)

---

## 🆘 Getting Help

If you encounter issues:

1. **Check Railway Status**: https://status.railway.app/
2. **Railway Discord**: https://discord.gg/railway
3. **Railway Help Station**: https://help.railway.app/
4. **Project Logs**: `railway logs` for detailed error messages

---

**Last Updated:** January 11, 2025
**Tested With:** Railway v3, PostgreSQL 16, Prisma 6.18.0
