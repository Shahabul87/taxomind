# Taxomind-Original Database Setup Guide

This guide helps you set up a separate database for the "taxomind-original" project, keeping it isolated from other taxomind databases you may have.

## 📋 Prerequisites

1. **Docker Desktop** must be running
2. **PostgreSQL container** running on port 5433 (your existing setup)
3. **Node.js** and **npm** installed

## 🚀 Quick Setup (Automated)

### Option 1: Using npm script (Recommended)

```bash
# Ensure Docker is running, then run:
npm run dev:setup:original
```

This will automatically:
- ✅ Create `taxomind_original` database
- ✅ Push Prisma schema
- ✅ Generate Prisma client
- ✅ Seed with test data
- ✅ Create admin metadata

### Option 2: Using the script directly

```bash
# Ensure Docker is running, then run:
bash scripts/setup-taxomind-original.sh
```

## 📝 Manual Setup (Step-by-Step)

If you prefer manual control or the automated script fails:

### Step 1: Start Docker

Make sure Docker Desktop is running. You can verify with:

```bash
docker ps | grep postgres
```

If your PostgreSQL container is not running:

```bash
# Check available containers
docker ps -a | grep postgres

# Start your PostgreSQL container (adjust name if different)
docker start taxomind-dev-db
# OR
docker run --name taxomind-dev-db \
  -e POSTGRES_PASSWORD=dev_password_123 \
  -e POSTGRES_DB=taxomind_dev \
  -p 5433:5432 \
  -d postgres:15
```

### Step 2: Create Database

```bash
bash scripts/create-taxomind-original-db.sh
```

### Step 3: Push Schema

```bash
npx prisma db push --skip-generate
npx prisma generate
```

### Step 4: Seed Data

```bash
# Seed main data
npx tsx scripts/dev-seed.ts

# Seed admin metadata (Phase 3)
npx tsx scripts/seed-admin-metadata.ts
```

## ✅ Verification

After setup, verify everything is working:

### 1. Check Database Connection

```bash
npx prisma studio
```

This should open Prisma Studio at http://localhost:5555 showing your `taxomind_original` database.

### 2. List Databases

```bash
PGPASSWORD=dev_password_123 psql -h localhost -p 5433 -U postgres -c "\l" | grep taxomind
```

You should see both:
- `taxomind_dev` (your other app)
- `taxomind_original` (this project)

### 3. Start Dev Server

```bash
npm run dev
```

Visit http://localhost:3000 to see the application running.

## 🔐 Test Accounts

After seeding, you'll have these accounts:

### Admin Account (Phase 3 Enhanced)
- **Email:** admin@taxomind.com
- **Password:** password123
- **Login URL:** http://localhost:3000/admin/auth/login
- **Features:** Enhanced audit logging, session metrics, MFA enforcement

### Regular User Account
- **Email:** user@taxomind.com
- **Password:** password123
- **Login URL:** http://localhost:3000/auth/login

## 📊 Database Configuration

Your `.env.local` has been updated to:

```env
DATABASE_URL="postgresql://postgres:dev_password_123@localhost:5433/taxomind_original"
```

## 🔧 Useful Commands

### Database Management

```bash
# Open Prisma Studio
npm run dev:db:studio

# Reset and reseed database
npm run dev:setup:original

# View database schema
npx prisma db pull

# Create a migration
npx prisma migrate dev --name describe_changes
```

### Docker Management

```bash
# Check container status
docker ps | grep postgres

# View container logs
docker logs taxomind-dev-db

# Stop container
docker stop taxomind-dev-db

# Start container
docker start taxomind-dev-db

# Remove container (WARNING: deletes data)
docker stop taxomind-dev-db
docker rm taxomind-dev-db
```

## 🔍 Troubleshooting

### Database Connection Issues

**Error:** `Can't reach database server at localhost:5433`

**Solutions:**
1. Check if Docker is running: `docker ps`
2. Check if PostgreSQL container is running: `docker ps | grep postgres`
3. Start container: `docker start taxomind-dev-db`
4. Check port 5433 is not in use: `lsof -i:5433`

### Database Already Exists

If `taxomind_original` already exists and you want to recreate it:

```bash
# Drop the database
PGPASSWORD=dev_password_123 psql -h localhost -p 5433 -U postgres -c "DROP DATABASE IF EXISTS taxomind_original;"

# Run setup again
npm run dev:setup:original
```

### Schema Out of Sync

If you get Prisma schema errors:

```bash
# Reset schema
npx prisma db push --force-reset

# Regenerate client
npx prisma generate

# Reseed
npx tsx scripts/dev-seed.ts
npx tsx scripts/seed-admin-metadata.ts
```

## 📚 Phase 3 Features

This setup includes Phase 3: Admin/User Database Separation features:

### New Database Tables

1. **AdminMetadata** - Enhanced admin security settings
   - Session timeout (4 hours)
   - MFA enforcement
   - Password policies
   - IP whitelisting
   - Audit log retention

2. **AdminAuditLog** - Comprehensive admin action logging
   - All admin actions tracked
   - Request/response metadata
   - IP addresses and user agents
   - Success/failure tracking
   - Before/after values

3. **AdminSessionMetrics** - Admin session analytics
   - Session duration tracking
   - Activity monitoring
   - Security scoring
   - Suspicious behavior detection
   - Device fingerprinting

### Testing Phase 3 Features

1. **Admin Login:**
   ```
   http://localhost:3000/admin/auth/login
   Email: admin@taxomind.com
   Password: password123
   ```

2. **Check Audit Logs:**
   ```bash
   npx prisma studio
   # Navigate to AdminAuditLog table
   ```

3. **Check Session Metrics:**
   ```bash
   npx prisma studio
   # Navigate to AdminSessionMetrics table
   ```

## 🔄 Switching Between Databases

If you need to switch between your databases:

### Use taxomind_original (this project)
```bash
# In .env.local:
DATABASE_URL="postgresql://postgres:dev_password_123@localhost:5433/taxomind_original"
```

### Use taxomind_dev (other project)
```bash
# In .env.local:
DATABASE_URL="postgresql://postgres:dev_password_123@localhost:5433/taxomind_dev"
```

After changing, run:
```bash
npx prisma generate
npm run dev
```

## 📞 Support

If you encounter issues:

1. Check this guide's Troubleshooting section
2. Verify Docker is running
3. Check PostgreSQL container logs: `docker logs taxomind-dev-db`
4. Ensure port 5433 is accessible: `telnet localhost 5433`

---

**Last Updated:** January 2025
**Database:** taxomind_original
**Project:** Taxomind - Phase 3: Admin/User Authentication Separation
