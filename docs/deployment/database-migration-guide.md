# Database Migration and Deployment Guide

## Overview

This guide covers database deployment strategies, migration procedures, and best practices for managing PostgreSQL databases with Prisma ORM in production environments.

## Database Architecture

### Production Database Setup
```
┌─────────────────────────────────────────────────────────┐
│                   Primary Database                       │
│          PostgreSQL 15 (Write/Read) - Port 5432         │
│            With Prisma ORM v6.13.0                      │
└─────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                            │
┌───────▼────────┐                       ┌──────────▼────────┐
│   Read Replica │                       │   Read Replica    │
│  (Region 1)    │                       │   (Region 2)      │
└────────────────┘                       └───────────────────┘
        │                                            │
┌───────▼────────┐                       ┌──────────▼────────┐
│   PgBouncer    │                       │    PgBouncer      │
│ (Connection    │                       │  (Connection      │
│   Pooling)     │                       │    Pooling)       │
└────────────────┘                       └───────────────────┘
```

## Prisma Schema Management

### Schema Versioning Strategy
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions", "views", "fullTextSearch"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // Connection pooling URL
}

// Note: The Taxomind schema includes 50+ models including:
// - User, Course, Chapter, Section (core learning)
// - Purchase, Enrollment (commerce)
// - Activity, Progress (tracking)
// - AuditLog (enterprise features)

// Schema version tracking
model SchemaVersion {
  id        String   @id @default(cuid())
  version   String   @unique
  appliedAt DateTime @default(now())
  checksum  String
  
  @@index([appliedAt])
}
```

### Migration File Structure
```
prisma/
├── schema.prisma          # Main schema definition
├── migrations/            # Prisma migrations
│   ├── 20250101000000_initial_schema/
│   │   └── migration.sql
│   ├── 20250102000000_add_user_roles/
│   │   └── migration.sql
│   ├── 20250103000000_add_performance_indexes/
│   │   └── migration.sql
│   └── migration_lock.toml
├── seed.ts               # Main seed script
└── scripts/
    ├── dev-seed.ts       # Development seed data
    ├── apply-indexes.ts  # Performance indexes
    └── migrate-safe.ts   # Safe migration script
```

## Migration Strategies

### 1. Zero-Downtime Migrations

#### Expand and Contract Pattern
```sql
-- Step 1: Expand - Add new column (backward compatible)
ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP;

-- Step 2: Migrate data
UPDATE users SET email_verified_at = NOW() WHERE email_verified = true;

-- Step 3: Contract - Remove old column (in next release)
ALTER TABLE users DROP COLUMN email_verified;
```

#### Blue-Green Database Migration
```bash
#!/bin/bash
# blue-green-migration.sh

# 1. Create green database
createdb -h $DB_HOST -U $DB_USER taxomind_green

# 2. Copy schema and data
pg_dump -h $DB_HOST -U $DB_USER taxomind_blue | \
  psql -h $DB_HOST -U $DB_USER taxomind_green

# 3. Apply migrations to green
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@$DB_HOST/taxomind_green" \
  npx prisma migrate deploy

# 4. Test green database
npm run test:db:green

# 5. Switch application to green
kubectl set env deployment/taxomind DATABASE_URL=$GREEN_DB_URL

# 6. Monitor for issues
sleep 300

# 7. If successful, green becomes new blue
psql -h $DB_HOST -U $DB_USER -c "ALTER DATABASE taxomind_blue RENAME TO taxomind_old;"
psql -h $DB_HOST -U $DB_USER -c "ALTER DATABASE taxomind_green RENAME TO taxomind_blue;"
```

### 2. Safe Migration Practices

#### Pre-Migration Validation
```typescript
// scripts/validate-migration.ts
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

async function validateMigration() {
  try {
    // 1. Check pending migrations
    const { stdout: status } = await execAsync('npx prisma migrate status');
    console.log('Migration Status:', status);
    
    // 2. Validate schema
    await execAsync('npx prisma validate');
    
    // 3. Check for breaking changes
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `;
    
    // 4. Estimate migration impact
    const rowCounts = await Promise.all(
      tables.map(async (table) => {
        const count = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*) FROM ${table.tablename}`
        );
        return { table: table.tablename, count: count[0].count };
      })
    );
    
    console.log('Table sizes:', rowCounts);
    
    // 5. Check for locks
    const locks = await prisma.$queryRaw`
      SELECT * FROM pg_locks WHERE granted = false
    `;
    
    if (locks.length > 0) {
      throw new Error('Database has pending locks');
    }
    
    return true;
  } catch (error) {
    console.error('Validation failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

validateMigration();
```

#### Migration Testing
```typescript
// scripts/test-migration.ts
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

async function testMigration() {
  const testDb = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL,
      },
    },
  });
  
  try {
    // 1. Apply migration to test database
    await exec('npx prisma migrate deploy');
    
    // 2. Run data integrity tests
    const users = await testDb.user.findMany();
    console.log(`Found ${users.length} users after migration`);
    
    // 3. Test new schema changes
    const newUser = await testDb.user.create({
      data: {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        // Test new fields added by migration
      },
    });
    
    // 4. Verify relationships
    const courses = await testDb.course.findMany({
      include: {
        user: true,
        chapters: true,
      },
    });
    
    console.log('Migration test completed successfully');
  } catch (error) {
    console.error('Migration test failed:', error);
    throw error;
  } finally {
    await testDb.$disconnect();
  }
}
```

### 3. Complex Migration Scenarios

#### Large Table Migrations
```sql
-- Batch update for large tables
DO $$
DECLARE
  batch_size INTEGER := 10000;
  offset_val INTEGER := 0;
  total_rows INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_rows FROM large_table;
  
  WHILE offset_val < total_rows LOOP
    UPDATE large_table
    SET new_column = calculated_value
    WHERE id IN (
      SELECT id FROM large_table
      ORDER BY id
      LIMIT batch_size
      OFFSET offset_val
    );
    
    COMMIT;
    
    -- Add delay to reduce load
    PERFORM pg_sleep(0.1);
    
    offset_val := offset_val + batch_size;
    
    RAISE NOTICE 'Processed % of % rows', offset_val, total_rows;
  END LOOP;
END $$;
```

#### Index Creation Without Locking
```sql
-- Create index concurrently to avoid locking
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);

-- Verify index is valid
SELECT indexrelid::regclass AS index_name, indisvalid
FROM pg_index
WHERE indexrelid::regclass::text = 'idx_users_email';

-- If invalid, drop and recreate
DROP INDEX CONCURRENTLY IF EXISTS idx_users_email;
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
```

## Prisma Migration Commands

### Development Migrations
```bash
# Create a new migration in development
npx prisma migrate dev --name add_feature_name

# Reset database and apply all migrations (DEVELOPMENT ONLY)
npx prisma migrate reset

# Apply pending migrations in development
npx prisma migrate dev

# Check migration status
npx prisma migrate status

# Generate Prisma Client after schema changes
npx prisma generate
```

### Production Migrations
```bash
# Deploy migrations to production (no schema changes)
npx prisma migrate deploy

# Create migration SQL without applying
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource prisma/schema.prisma \
  --script > migration.sql

# Resolve failed migrations
npx prisma migrate resolve --applied "20250117000000_migration_name"

# View migration history
npx prisma migrate status --schema prisma/schema.prisma
```

### Database Introspection
```bash
# Pull database schema into Prisma schema
npx prisma db pull

# Push schema changes without creating migration (DEVELOPMENT ONLY)
npx prisma db push

# Validate schema without applying
npx prisma validate

# Format schema file
npx prisma format
```

### Taxomind-Specific Migration Scripts
```bash
# Development environment setup
npm run dev:db:reset     # Reset and migrate
npm run dev:db:seed      # Seed with test data
npm run dev:setup        # Complete setup (reset + seed)

# Production migration with enterprise features
NODE_ENV=production npm run enterprise:deploy:production

# Apply performance indexes
npx ts-node scripts/apply-indexes.ts

# Safe migration with validation
npx ts-node scripts/migrate-safe.ts
```

## Migration Deployment Process

### Step 1: Pre-Deployment Backup
```bash
#!/bin/bash
# backup-before-migration.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/migrations"

# Full database backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
  --format=custom \
  --verbose \
  --file="${BACKUP_DIR}/pre_migration_${TIMESTAMP}.dump"

# Schema-only backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
  --schema-only \
  --file="${BACKUP_DIR}/schema_${TIMESTAMP}.sql"

# Verify backup
pg_restore --list "${BACKUP_DIR}/pre_migration_${TIMESTAMP}.dump" > /dev/null
if [ $? -eq 0 ]; then
  echo "Backup verified successfully"
else
  echo "Backup verification failed"
  exit 1
fi
```

### Step 2: Deploy Migration
```bash
#!/bin/bash
# deploy-migration.sh

set -e

echo "Starting migration deployment..."

# 1. Set maintenance mode
kubectl set env deployment/taxomind MAINTENANCE_MODE=true

# 2. Wait for active connections to drain
sleep 30

# 3. Create migration lock
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
  "INSERT INTO migration_locks (id, locked_at) VALUES (1, NOW());"

# 4. Run Prisma migration
npx prisma migrate deploy

# 5. Verify migration
npx prisma migrate status

# 6. Run post-migration scripts
npm run db:post-migrate

# 7. Release migration lock
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
  "DELETE FROM migration_locks WHERE id = 1;"

# 8. Disable maintenance mode
kubectl set env deployment/taxomind MAINTENANCE_MODE=false

echo "Migration deployment completed"
```

### Step 3: Post-Migration Validation
```typescript
// scripts/post-migration-validation.ts
async function validatePostMigration() {
  const checks = [
    {
      name: 'Database connectivity',
      test: async () => {
        await prisma.$connect();
        return true;
      },
    },
    {
      name: 'Schema integrity',
      test: async () => {
        const tables = await prisma.$queryRaw`
          SELECT table_name FROM information_schema.tables
          WHERE table_schema = 'public'
        `;
        return tables.length > 0;
      },
    },
    {
      name: 'Data integrity',
      test: async () => {
        const userCount = await prisma.user.count();
        const courseCount = await prisma.course.count();
        return userCount > 0 && courseCount >= 0;
      },
    },
    {
      name: 'Index verification',
      test: async () => {
        const indexes = await prisma.$queryRaw`
          SELECT indexname FROM pg_indexes
          WHERE schemaname = 'public'
        `;
        return indexes.length > 0;
      },
    },
    {
      name: 'Foreign key constraints',
      test: async () => {
        const constraints = await prisma.$queryRaw`
          SELECT conname FROM pg_constraint
          WHERE contype = 'f'
        `;
        return constraints.length > 0;
      },
    },
  ];
  
  for (const check of checks) {
    try {
      const result = await check.test();
      console.log(`✓ ${check.name}: ${result ? 'PASSED' : 'FAILED'}`);
    } catch (error) {
      console.log(`✗ ${check.name}: ERROR - ${error.message}`);
    }
  }
}
```

## Rollback Procedures

### Automatic Rollback
```bash
#!/bin/bash
# rollback-migration.sh

# 1. Detect migration failure
if [ $? -ne 0 ]; then
  echo "Migration failed, initiating rollback..."
  
  # 2. Restore from backup
  pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME \
    --clean --if-exists \
    "${BACKUP_DIR}/pre_migration_${TIMESTAMP}.dump"
  
  # 3. Reset Prisma migration history
  npx prisma migrate resolve --rolled-back $MIGRATION_NAME
  
  # 4. Notify team
  ./scripts/send-alert.sh "Migration rollback completed"
fi
```

### Manual Rollback Scripts
```sql
-- rollback/20250103_rollback.sql
BEGIN;

-- Reverse migration changes
ALTER TABLE users DROP COLUMN IF EXISTS new_field;
ALTER TABLE courses ADD COLUMN old_field VARCHAR(255);

-- Restore data
UPDATE courses SET old_field = backup_data FROM migration_backup WHERE courses.id = migration_backup.course_id;

-- Drop temporary tables
DROP TABLE IF EXISTS migration_backup;

-- Update migration history
DELETE FROM _prisma_migrations WHERE migration_name = '20250103_add_new_field';

COMMIT;
```

## Database Optimization

### Performance Tuning
```sql
-- Analyze tables after migration
ANALYZE users;
ANALYZE courses;
ANALYZE enrollments;

-- Update statistics
SELECT schemaname, tablename, last_analyze, last_autoanalyze
FROM pg_stat_user_tables
ORDER BY last_analyze DESC;

-- Reindex if needed
REINDEX TABLE CONCURRENTLY users;
REINDEX TABLE CONCURRENTLY courses;

-- Vacuum to reclaim space
VACUUM (VERBOSE, ANALYZE) users;
VACUUM (VERBOSE, ANALYZE) courses;
```

### Connection Pooling Configuration
```typescript
// lib/db-pool.ts
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections
  min: 5,  // Minimum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const prismaWithPool = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=1',
    },
  },
  log: ['error', 'warn'],
});
```

## Monitoring Migrations

### Migration Metrics
```typescript
// lib/migration-metrics.ts
export async function trackMigration(migrationName: string) {
  const startTime = Date.now();
  
  try {
    // Run migration
    await runMigration(migrationName);
    
    const duration = Date.now() - startTime;
    
    // Log metrics
    await prisma.migrationMetrics.create({
      data: {
        name: migrationName,
        duration,
        status: 'SUCCESS',
        executedAt: new Date(),
      },
    });
    
    // Send to monitoring service
    await sendMetrics({
      migration: migrationName,
      duration,
      status: 'success',
    });
  } catch (error) {
    await prisma.migrationMetrics.create({
      data: {
        name: migrationName,
        duration: Date.now() - startTime,
        status: 'FAILED',
        error: error.message,
        executedAt: new Date(),
      },
    });
    
    throw error;
  }
}
```

### Health Checks
```typescript
// api/health/db/route.ts
export async function GET() {
  const checks = {
    connection: false,
    migrations: false,
    performance: false,
  };
  
  try {
    // Check connection
    await prisma.$queryRaw`SELECT 1`;
    checks.connection = true;
    
    // Check migrations are up to date
    const pendingMigrations = await getPendingMigrations();
    checks.migrations = pendingMigrations.length === 0;
    
    // Check query performance
    const start = Date.now();
    await prisma.user.findFirst();
    const queryTime = Date.now() - start;
    checks.performance = queryTime < 100;
    
    return Response.json({
      status: 'healthy',
      checks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      checks,
      error: error.message,
    }, { status: 503 });
  }
}
```

## Seed Data Management

### Environment-Specific Seeds
```typescript
// prisma/seeds/index.ts
import { PrismaClient } from '@prisma/client';
import { seedDevelopment } from './development';
import { seedStaging } from './staging';
import { seedProduction } from './production';

const prisma = new PrismaClient();

async function main() {
  const environment = process.env.NODE_ENV || 'development';
  
  console.log(`Seeding database for ${environment} environment...`);
  
  switch (environment) {
    case 'development':
      await seedDevelopment(prisma);
      break;
    case 'staging':
      await seedStaging(prisma);
      break;
    case 'production':
      await seedProduction(prisma);
      break;
    default:
      console.log('Unknown environment');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Safe Production Seeding
```typescript
// prisma/seeds/production.ts
export async function seedProduction(prisma: PrismaClient) {
  // Only seed essential data in production
  const essentialData = [
    {
      model: 'Role',
      data: [
        { name: 'USER', description: 'Standard user' },
        { name: 'ADMIN', description: 'Administrator' },
      ],
    },
    {
      model: 'Category',
      data: [
        { name: 'Technology', slug: 'technology' },
        { name: 'Business', slug: 'business' },
      ],
    },
  ];
  
  for (const { model, data } of essentialData) {
    for (const item of data) {
      await prisma[model].upsert({
        where: { name: item.name },
        update: {},
        create: item,
      });
    }
  }
  
  console.log('Production seed completed');
}
```

## Best Practices

### 1. Migration Guidelines
- Always test migrations on a staging environment first
- Keep migrations small and focused
- Use transactions for data migrations
- Avoid nullable constraints on existing columns with data
- Document migration purpose and impact

### 2. Safety Measures
- Take backups before any migration
- Use connection pooling in production
- Implement migration locks to prevent concurrent migrations
- Monitor database performance during migrations
- Have a tested rollback plan

### 3. Performance Considerations
- Create indexes concurrently
- Batch large data updates
- Vacuum and analyze after major changes
- Monitor slow queries
- Use read replicas for heavy read operations

### 4. Documentation
- Document all schema changes
- Maintain a migration changelog
- Include rollback instructions
- Document any manual steps required

---

*Last Updated: January 2025*
*Version: 1.0.0*
*Database: PostgreSQL 15 with Prisma ORM*