# Database Issues Runbook

## Overview
This runbook provides step-by-step procedures for diagnosing and resolving database-related issues in the Taxomind application.

## Quick Reference
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Local Port**: 5433 (Docker)
- **Connection**: Singleton pattern in `lib/db.ts`
- **Schema**: `prisma/schema.prisma`

## Common Issues and Resolutions

### 1. Database Connection Failures

#### Symptoms
- Error: "P1001: Can't reach database server"
- Application fails to start
- API endpoints return 500 errors
- Prisma commands fail

#### Quick Diagnostics
```bash
# Check if PostgreSQL is running (local)
npm run dev:docker:status

# Test database connection
npx prisma db pull

# Check connection string
echo $DATABASE_URL

# Verify PostgreSQL container (local)
docker ps | grep postgres

# Test direct connection
psql $DATABASE_URL -c "SELECT 1"
```

#### Resolution Steps

1. **Verify Environment Variables**
```bash
# Check .env file
cat .env | grep DATABASE_URL

# Validate environment
npm run validate:env

# Expected format
# DATABASE_URL="postgresql://user:password@localhost:5433/taxomind?schema=public"
```

2. **Restart Database (Local Development)**
```bash
# Stop and restart PostgreSQL container
npm run dev:docker:stop
npm run dev:docker:start

# If issues persist, reset container
npm run dev:docker:reset
```

3. **Restart Database (Production)**
```bash
# Check database status (AWS RDS)
aws rds describe-db-instances --db-instance-identifier taxomind-prod

# Restart if needed (requires approval)
aws rds reboot-db-instance --db-instance-identifier taxomind-prod
```

4. **Check Network Connectivity**
```bash
# Test network connection
nc -zv database-host 5432

# Check DNS resolution
nslookup database-host

# Verify security groups (AWS)
aws ec2 describe-security-groups --group-ids sg-xxxxx
```

5. **Regenerate Prisma Client**
```bash
npx prisma generate
npm run build
```

### 2. Slow Query Performance

#### Symptoms
- API response times > 3 seconds
- Database CPU usage > 80%
- Timeout errors in logs
- Slow page loads

#### Quick Diagnostics
```bash
# Open Prisma Studio to inspect data
npx prisma studio

# Check slow query logs (production)
aws rds download-db-log-file-portion \
  --db-instance-identifier taxomind-prod \
  --log-file-name error/postgresql.log

# Monitor active queries
psql $DATABASE_URL -c "
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';"
```

#### Resolution Steps

1. **Identify Slow Queries**
```sql
-- Find long-running queries
SELECT 
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '1 minute'
ORDER BY duration DESC;
```

2. **Kill Blocking Queries**
```sql
-- Terminate specific query
SELECT pg_terminate_backend(pid_number);

-- Kill all queries from specific user
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE usename = 'app_user' 
  AND pid <> pg_backend_pid();
```

3. **Optimize Common Slow Queries**
```typescript
// Before: N+1 query problem
const courses = await db.course.findMany();
for (const course of courses) {
  const enrollment = await db.enrollment.findMany({
    where: { courseId: course.id }
  });
}

// After: Use includes
const courses = await db.course.findMany({
  include: {
    Enrollment: true,
    user: {
      select: { id: true, name: true, image: true }
    },
    _count: {
      select: { chapters: true, Enrollment: true }
    }
  }
});
```

4. **Add Database Indexes**
```prisma
// In schema.prisma, add indexes for frequently queried fields
model Course {
  @@index([userId])
  @@index([categoryId])
  @@index([isPublished, createdAt])
}
```

5. **Apply Index Migration**
```bash
npx prisma migrate dev --name add_performance_indexes
npx prisma migrate deploy # Production
```

### 3. Migration Failures

#### Symptoms
- Error: "P3005: The database schema is not empty"
- Migration pending status
- Schema drift detected
- Deployment failures

#### Quick Diagnostics
```bash
# Check migration status
npx prisma migrate status

# Compare schema with database
npx prisma db pull --force
diff prisma/schema.prisma prisma/schema.prisma.bak

# List migrations
ls prisma/migrations/
```

#### Resolution Steps

1. **Resolve Pending Migrations**
```bash
# Mark migration as applied (careful!)
npx prisma migrate resolve --applied "20240101_migration_name"

# Or roll back
npx prisma migrate resolve --rolled-back "20240101_migration_name"
```

2. **Fix Schema Drift**
```bash
# Backup current schema
cp prisma/schema.prisma prisma/schema.backup.prisma

# Pull actual database schema
npx prisma db pull

# Create migration from drift
npx prisma migrate dev --name fix_schema_drift

# Deploy to production
npx prisma migrate deploy
```

3. **Emergency Rollback**
```bash
# Create down migration
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.previous.prisma \
  --script > rollback.sql

# Apply rollback
psql $DATABASE_URL < rollback.sql
```

### 4. Connection Pool Exhaustion

#### Symptoms
- "Too many connections" errors
- Intermittent connection failures
- Application hangs

#### Quick Diagnostics
```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Check by application
SELECT application_name, count(*) 
FROM pg_stat_activity 
GROUP BY application_name;

-- Check max connections
SHOW max_connections;
```

#### Resolution Steps

1. **Immediate Relief**
```sql
-- Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND query_start < NOW() - INTERVAL '10 minutes';
```

2. **Fix Connection Pooling**
```typescript
// In lib/db.ts - ensure singleton pattern
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

3. **Adjust Pool Settings**
```bash
# Update connection string
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10"
```

## Prevention Measures

1. **Regular Maintenance**
```bash
# Weekly vacuum
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# Monthly reindex
psql $DATABASE_URL -c "REINDEX DATABASE taxomind;"
```

2. **Monitoring Setup**
```bash
# Set up slow query logging
ALTER DATABASE taxomind SET log_min_duration_statement = 1000;

# Enable query stats
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

3. **Backup Strategy**
```bash
# Daily automated backups
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Test restore procedure monthly
createdb taxomind_test
psql taxomind_test < backup_20240101.sql
```

## Escalation Procedures

### Level 1: Development Team
- Slow queries < 5 seconds
- Connection issues in development
- Minor migration issues

### Level 2: DevOps Team
- Production connection failures
- Performance degradation > 30%
- Migration failures in production

### Level 3: Database Administrator
- Data corruption
- Complete database failure
- Security breaches

## Monitoring Dashboards

- **Grafana**: http://monitoring.taxomind.com/database
- **Prisma Studio**: `npx prisma studio`
- **AWS RDS Console**: https://console.aws.amazon.com/rds/
- **Application Logs**: `/var/log/taxomind/database.log`

## Related Commands Reference

```bash
# Development
npm run dev:docker:start    # Start PostgreSQL container
npm run dev:docker:stop     # Stop container
npm run dev:docker:reset    # Reset container
npm run dev:setup          # Reset and seed database
npm run dev:db:seed        # Seed with test data
npm run dev:db:studio      # Open Prisma Studio

# Database Management
npx prisma generate        # Generate Prisma client
npx prisma db push        # Push schema changes (dev)
npx prisma migrate dev    # Create migration
npx prisma migrate deploy # Deploy migrations
npx prisma migrate status # Check migration status
npx prisma db pull        # Pull schema from database

# Validation
npm run validate:env      # Validate environment
npm run enterprise:health # System health check
```

## Emergency Contacts

- **On-Call DBA**: +1-xxx-xxx-xxxx
- **DevOps Lead**: devops@taxomind.com
- **Escalation Hotline**: +1-xxx-xxx-xxxx

---
*Last Updated: January 2025*
*Version: 1.0*
*Next Review: February 2025*