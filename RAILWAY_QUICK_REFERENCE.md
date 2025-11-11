# Railway Quick Reference Card

**Project:** Taxomind LMS | **Platform:** Railway | **Database:** PostgreSQL

---

## 🚀 Essential Commands

### Setup & Authentication

```bash
# Install CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Check status
railway status
```

### Database Management

```bash
# View all variables
railway variables

# Test database connection
railway run node scripts/test-railway-db.js

# Connect to PostgreSQL
railway run psql $DATABASE_URL

# Run migrations
railway run npx prisma migrate deploy

# Check migration status
railway run npx prisma migrate status

# Open Prisma Studio
railway run npx prisma studio
```

### Deployment

```bash
# Deploy app
railway up

# Deploy specific service
railway up --service app

# View logs
railway logs

# Follow logs (real-time)
railway logs --follow

# Redeploy
railway service
# Select service, then:
railway up
```

---

## 🗄️ PostgreSQL Operations

### Connection

```bash
# Quick connection test
railway run psql $DATABASE_URL -c "SELECT 1;"

# Interactive psql
railway run psql $DATABASE_URL

# Check version
railway run psql $DATABASE_URL -c "SELECT version();"
```

### Inside psql Terminal

```sql
\l                    -- List databases
\c database_name      -- Connect to database
\dt                   -- List tables
\d "TableName"        -- Describe table
\du                   -- List users
\q                    -- Quit
```

### Backup & Restore

```bash
# Create backup
railway run pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore backup
railway run psql $DATABASE_URL < backup.sql

# Backup specific table
railway run pg_dump $DATABASE_URL -t "TableName" > table_backup.sql
```

### Database Stats

```bash
# Database size
railway run psql $DATABASE_URL -c "
  SELECT pg_size_pretty(pg_database_size(current_database()));
"

# Table sizes
railway run psql $DATABASE_URL -c "
  SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size('public.'||tablename))
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size('public.'||tablename) DESC;
"

# Connection count
railway run psql $DATABASE_URL -c "
  SELECT count(*), state FROM pg_stat_activity
  GROUP BY state;
"
```

---

## 🔧 Prisma Commands

### Migrations

```bash
# Apply migrations (production)
railway run npx prisma migrate deploy

# Check status
railway run npx prisma migrate status

# Generate client
railway run npx prisma generate

# Reset database (⚠️ DELETES ALL DATA)
railway run npx prisma migrate reset --force

# Mark migration as resolved
railway run npx prisma migrate resolve --applied "migration_name"
```

### Database Operations

```bash
# Sync schema without migration
railway run npx prisma db push

# Pull schema from database
railway run npx prisma db pull

# Validate schema
railway run npx prisma validate

# Format schema
railway run npx prisma format
```

### Development

```bash
# Create new migration (local only)
npx prisma migrate dev --name description

# Reset dev database
npx prisma migrate reset

# Seed database
railway run npx prisma db seed
```

---

## 🚨 Troubleshooting

### Can't Connect to Database

```bash
# 1. Check service status
railway status

# 2. Check logs
railway logs --service postgres

# 3. Verify DATABASE_URL
railway variables | grep DATABASE

# 4. Test connection
railway run psql $DATABASE_URL -c "SELECT 1;"

# 5. Restart database
railway service
# Select postgres
railway up
```

### Migration Failures

```bash
# 1. Check status
railway run npx prisma migrate status

# 2. View failed migrations
railway run psql $DATABASE_URL -c "
  SELECT * FROM _prisma_migrations
  WHERE success = false;
"

# 3. Mark as resolved
railway run npx prisma migrate resolve --applied "migration_name"

# 4. Try again
railway run npx prisma migrate deploy
```

### Slow Queries

```bash
# Enable query logging (temporary)
railway run psql $DATABASE_URL -c "
  ALTER DATABASE railway SET log_statement = 'all';
"

# Check slow queries
railway run psql $DATABASE_URL -c "
  SELECT query, calls, total_time, mean_time
  FROM pg_stat_statements
  ORDER BY mean_time DESC
  LIMIT 10;
"
```

---

## 📊 Environment Variables

### Required Variables

```bash
DATABASE_URL               # Full connection string
DATABASE_PRIVATE_URL       # Internal network (runtime only)
DATABASE_PUBLIC_URL        # External URL (always available)
```

### Set Variables

```bash
# Set variable
railway variables --set KEY=value

# Reference another service's variable
railway variables --set DATABASE_URL='${{postgres.DATABASE_URL}}'

# Remove variable
railway variables --unset KEY
```

---

## 🔄 Redeploy Database

### Soft Restart (Keeps Data)

```bash
railway service
# Select postgres
railway up
```

### Hard Reset (⚠️ Deletes Data)

```bash
# 1. Backup first!
railway run pg_dump $DATABASE_URL > backup.sql

# 2. Delete service
# Go to Railway dashboard → Delete postgres service

# 3. Create new service
railway add
# Select PostgreSQL

# 4. Restore backup
railway run psql $DATABASE_URL < backup.sql
```

---

## 📱 Railway Dashboard

**Access:** https://railway.app/dashboard

### Key Sections

- **Services:** View all project services
- **Variables:** Manage environment variables
- **Deployments:** View deployment history
- **Metrics:** Monitor resource usage
- **Settings:** Project configuration

### Quick Actions

- Redeploy: Service → Deployments → ⋮ → Redeploy
- View logs: Service → Logs tab
- Edit variables: Service → Variables tab
- Restart service: Service → Settings → Restart

---

## 🧪 Testing

### Health Checks

```bash
# Local health check
curl http://localhost:3000/api/health

# Production health check
curl https://your-app.railway.app/api/health

# Should return:
# {"status":"ok","database":"connected"}
```

### Database Connection Test

```bash
# Run test script
railway run node scripts/test-railway-db.js

# Or manually
railway run node -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  prisma.\$connect()
    .then(() => console.log('✅ Connected'))
    .catch(e => console.error('❌', e.message));
"
```

---

## 📦 Common Workflows

### New Database Setup

```bash
1. railway login
2. railway link
3. railway add  # Select PostgreSQL
4. railway variables  # Verify DATABASE_URL
5. railway run npx prisma migrate deploy
6. railway run node scripts/test-railway-db.js
```

### Deploy Code Changes

```bash
1. git add .
2. git commit -m "your message"
3. git push origin main
# Railway auto-deploys (if connected to GitHub)
# Or manually:
4. railway up
```

### Fix Failed Migrations

```bash
1. railway run npx prisma migrate status
2. railway run npx prisma migrate resolve --applied "migration_name"
3. railway run npx prisma migrate deploy
```

### Restore from Backup

```bash
1. railway run pg_dump $DATABASE_URL > backup.sql  # Create backup
2. # Make changes
3. railway run psql $DATABASE_URL < backup.sql    # Restore if needed
```

---

## 🆘 Emergency Contacts

- **Railway Status:** https://status.railway.app
- **Railway Discord:** https://discord.gg/railway
- **Railway Docs:** https://docs.railway.app
- **Railway Help:** https://help.railway.app

---

## 📝 Important Files

```
RAILWAY_POSTGRES_DEPLOYMENT.md   # Full deployment guide
RAILWAY_FIXES_APPLIED.md         # Recent fixes
RAILWAY_BUILD_ERRORS.md          # Error explanations
railway.json                     # Railway configuration
Dockerfile.railway               # Build configuration
scripts/test-railway-db.js       # Connection test script
scripts/railway-db-setup.sh      # Setup automation
```

---

**Tip:** Bookmark this file for quick reference!

**Last Updated:** January 11, 2025
