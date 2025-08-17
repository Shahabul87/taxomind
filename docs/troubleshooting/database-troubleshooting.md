# Database Troubleshooting Guide

## Prisma and PostgreSQL Specific Issues

This guide helps you diagnose and resolve database-related issues in Taxomind, including Prisma ORM problems, PostgreSQL connection issues, and migration failures.

## Table of Contents
- [Connection Issues](#connection-issues)
- [Prisma Client Errors](#prisma-client-errors)
- [Migration Problems](#migration-problems)
- [Query Performance Issues](#query-performance-issues)
- [Relation and Model Errors](#relation-and-model-errors)
- [Transaction Failures](#transaction-failures)
- [Database Locks and Deadlocks](#database-locks-and-deadlocks)
- [Development vs Production Issues](#development-vs-production-issues)

---

## Connection Issues

### Error: "Can't reach database server"

**Symptoms:**
```
Error: P1001: Can't reach database server at `localhost:5433`
Please make sure your database server is running at `localhost:5433`.
```

**Solutions:**

1. **Start local PostgreSQL (Development):**
```bash
# Using Docker
npm run dev:docker:start

# Verify container is running
docker ps | grep postgres

# Check logs
docker logs taxomind-postgres
```

2. **Verify connection string:**
```bash
# Check .env.local
cat .env.local | grep DATABASE_URL

# Should be:
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/taxomind_dev?schema=public"
```

3. **Test connection directly:**
```bash
# Using psql
psql -h localhost -p 5433 -U postgres -d taxomind_dev

# Using Prisma
npx prisma db pull
```

### Error: "Connection pool timeout"

**Symptoms:**
```
Error: P2024: Timed out fetching a new connection from the connection pool.
```

**Solutions:**

1. **Increase connection pool size:**
```typescript
// lib/db.ts
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
  // Increase connection pool
  connectionLimit: 10, // Default is 2
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

2. **Add connection pool to URL:**
```env
DATABASE_URL="postgresql://user:pass@localhost:5433/db?connection_limit=10&pool_timeout=30"
```

3. **Check for connection leaks:**
```typescript
// ❌ Wrong - Creates new client each time
export async function getData() {
  const prisma = new PrismaClient();
  return await prisma.user.findMany();
}

// ✅ Correct - Use singleton
import { db } from '@/lib/db';

export async function getData() {
  return await db.user.findMany();
}
```

### Error: "SSL connection required"

**Symptoms:**
```
Error: P1002: The database server at `host` requires SSL
```

**Solutions:**

1. **Add SSL to connection string:**
```env
# Production with SSL
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# With self-signed certificate
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require&sslcert=cert.pem"
```

2. **Disable SSL for local development:**
```env
DATABASE_URL="postgresql://user:pass@localhost:5433/db?sslmode=disable"
```

---

## Prisma Client Errors

### Error: "Prisma Client not generated"

**Symptoms:**
```
Error: @prisma/client did not initialize yet. Please run "prisma generate"
```

**Solutions:**

1. **Generate Prisma Client:**
```bash
npx prisma generate
```

2. **Add to build process:**
```json
// package.json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && next build"
  }
}
```

3. **For Docker deployments:**
```dockerfile
# Dockerfile
RUN npx prisma generate
```

### Error: "Invalid prisma.model.operation() invocation"

**Symptoms:**
```
Invalid `prisma.user.findMany()` invocation:
Unknown arg `enrollment` in include.enrollment for type User
```

**Solutions:**

1. **Check exact relation names in schema:**
```prisma
// prisma/schema.prisma
model User {
  id         String       @id
  Enrollment Enrollment[] // Capital 'E'
  courses    Course[]     // lowercase 'c'
}
```

2. **Use correct capitalization:**
```typescript
// ❌ Wrong - lowercase for model relation
const user = await db.user.findUnique({
  include: {
    enrollment: true, // Should be 'Enrollment'
  }
});

// ✅ Correct - matches schema exactly
const user = await db.user.findUnique({
  include: {
    Enrollment: true, // Capital 'E' as in schema
    courses: true,    // lowercase as defined
  }
});
```

3. **Verify with Prisma Studio:**
```bash
npx prisma studio
# Visual interface shows exact relation names
```

### Error: "Unique constraint failed"

**Symptoms:**
```
Error: P2002: Unique constraint failed on the fields: (`email`)
```

**Solutions:**

1. **Check before insert:**
```typescript
// ❌ Wrong - Direct insert
const user = await db.user.create({
  data: { email: 'user@example.com' }
});

// ✅ Correct - Check existence first
const existing = await db.user.findUnique({
  where: { email: 'user@example.com' }
});

if (existing) {
  throw new Error('Email already exists');
}

const user = await db.user.create({
  data: { email: 'user@example.com' }
});

// ✅ Better - Use upsert
const user = await db.user.upsert({
  where: { email: 'user@example.com' },
  update: { name: 'Updated Name' },
  create: { email: 'user@example.com', name: 'New User' }
});
```

---

## Migration Problems

### Error: "Database schema drift detected"

**Symptoms:**
```
Error: P2035: Schema drift detected. Run prisma migrate dev to update
```

**Solutions:**

1. **Development - Apply migrations:**
```bash
npx prisma migrate dev
```

2. **Production - Use deploy command:**
```bash
npx prisma migrate deploy
```

3. **Reset if corrupted (DEVELOPMENT ONLY):**
```bash
# WARNING: This deletes all data!
npx prisma migrate reset
```

### Error: "Migration failed to apply"

**Symptoms:**
```
Error applying migration: column "field" cannot be cast automatically to type "newtype"
```

**Solutions:**

1. **Create manual migration:**
```bash
# Create migration without applying
npx prisma migrate dev --create-only

# Edit the SQL file in prisma/migrations/
# Add custom SQL for type conversion
```

2. **Example custom migration:**
```sql
-- prisma/migrations/xxx_custom/migration.sql
-- Convert string to integer with casting
ALTER TABLE "User" 
ALTER COLUMN "age" TYPE INTEGER 
USING "age"::INTEGER;
```

3. **Apply after editing:**
```bash
npx prisma migrate dev
```

### Error: "Drift between schema and database"

**Solutions:**

1. **Pull current database state:**
```bash
# Backup current schema first
cp prisma/schema.prisma prisma/schema.backup.prisma

# Pull database state
npx prisma db pull

# Compare and merge changes manually
```

2. **Force schema to database (CAREFUL):**
```bash
# This overwrites database schema!
npx prisma db push
```

---

## Query Performance Issues

### Slow Query Detection

**Enable query logging:**
```typescript
// lib/db.ts
export const db = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
});

// Log slow queries
db.$on('query', (e) => {
  if (e.duration > 100) { // Over 100ms
    console.warn(`Slow query (${e.duration}ms):`, e.query);
  }
});
```

### N+1 Query Problems

**Symptoms:** Multiple database queries for related data

**Solutions:**

1. **Use include for relations:**
```typescript
// ❌ Wrong - N+1 queries
const users = await db.user.findMany();
for (const user of users) {
  const posts = await db.post.findMany({
    where: { userId: user.id }
  });
}

// ✅ Correct - Single query with include
const users = await db.user.findMany({
  include: {
    posts: true
  }
});
```

2. **Use select for specific fields:**
```typescript
// ❌ Wrong - Fetching all fields
const users = await db.user.findMany({
  include: {
    posts: true, // Gets all post fields
  }
});

// ✅ Better - Select only needed fields
const users = await db.user.findMany({
  select: {
    id: true,
    name: true,
    posts: {
      select: {
        id: true,
        title: true,
      }
    }
  }
});
```

### Query Optimization

1. **Add database indexes:**
```prisma
// prisma/schema.prisma
model User {
  id    String @id
  email String @unique
  name  String
  
  // Add index for frequently queried fields
  @@index([name])
  @@index([createdAt])
}
```

2. **Use pagination:**
```typescript
// ❌ Wrong - Loading all records
const allUsers = await db.user.findMany();

// ✅ Correct - Paginated query
const users = await db.user.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' }
});
```

3. **Use raw queries for complex operations:**
```typescript
// For complex aggregations
const result = await db.$queryRaw`
  SELECT 
    DATE_TRUNC('day', "createdAt") as date,
    COUNT(*) as count
  FROM "User"
  WHERE "createdAt" > ${startDate}
  GROUP BY date
  ORDER BY date DESC
`;
```

---

## Relation and Model Errors

### Error: "Foreign key constraint failed"

**Symptoms:**
```
Error: P2003: Foreign key constraint failed on the field: `userId`
```

**Solutions:**

1. **Check parent record exists:**
```typescript
// ❌ Wrong - Parent might not exist
await db.post.create({
  data: {
    title: 'Post',
    userId: 'non-existent-id'
  }
});

// ✅ Correct - Verify parent exists
const user = await db.user.findUnique({
  where: { id: userId }
});

if (!user) {
  throw new Error('User not found');
}

await db.post.create({
  data: {
    title: 'Post',
    userId: user.id
  }
});
```

2. **Use connect for relations:**
```typescript
// ✅ Better - Use connect
await db.post.create({
  data: {
    title: 'Post',
    user: {
      connect: { id: userId }
    }
  }
});
```

### Error: "Ambiguous relation"

**Solutions:**

```prisma
// prisma/schema.prisma
model User {
  id            String   @id
  sentMessages  Message[] @relation("sender")
  receivedMessages Message[] @relation("receiver")
}

model Message {
  id         String @id
  senderId   String
  receiverId String
  sender     User   @relation("sender", fields: [senderId], references: [id])
  receiver   User   @relation("receiver", fields: [receiverId], references: [id])
}
```

---

## Transaction Failures

### Error: "Transaction failed"

**Solutions:**

1. **Use interactive transactions:**
```typescript
// ❌ Wrong - No rollback on error
await db.user.update({ where: { id }, data: { credits: { decrement: 10 } } });
await db.purchase.create({ data: { userId: id, amount: 10 } });

// ✅ Correct - Atomic transaction
await db.$transaction(async (tx) => {
  const user = await tx.user.update({
    where: { id },
    data: { credits: { decrement: 10 } }
  });
  
  if (user.credits < 0) {
    throw new Error('Insufficient credits');
  }
  
  await tx.purchase.create({
    data: { userId: id, amount: 10 }
  });
});
```

2. **Set transaction timeout:**
```typescript
await db.$transaction(
  async (tx) => {
    // Long running operations
  },
  {
    maxWait: 5000, // 5 seconds
    timeout: 10000, // 10 seconds
  }
);
```

---

## Database Locks and Deadlocks

### Detecting Locks

```sql
-- Check for locks in PostgreSQL
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  query,
  state,
  wait_event_type,
  wait_event
FROM pg_stat_activity
WHERE state != 'idle'
  AND query NOT ILIKE '%pg_stat_activity%'
ORDER BY query_start;
```

### Resolving Deadlocks

1. **Use consistent operation order:**
```typescript
// ❌ Wrong - Different order can cause deadlock
// Transaction 1
await db.$transaction([
  db.user.update({ where: { id: 'A' }, data }),
  db.user.update({ where: { id: 'B' }, data }),
]);

// Transaction 2
await db.$transaction([
  db.user.update({ where: { id: 'B' }, data }),
  db.user.update({ where: { id: 'A' }, data }),
]);

// ✅ Correct - Same order
// Always sort IDs before operations
const sortedIds = ['A', 'B'].sort();
await db.$transaction(
  sortedIds.map(id => 
    db.user.update({ where: { id }, data })
  )
);
```

---

## Development vs Production Issues

### Different Behavior Between Environments

**Common causes:**

1. **Different PostgreSQL versions:**
```bash
# Check versions
psql --version # Local
# Compare with production version
```

2. **Missing production indexes:**
```bash
# Export production schema
pg_dump --schema-only production_db > prod_schema.sql

# Compare with development
diff dev_schema.sql prod_schema.sql
```

3. **Connection pool differences:**
```typescript
// Use environment-specific settings
const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    connectionLimit: 25,
    pool: {
      min: 5,
      max: 25,
    },
  }),
});
```

### Database Monitoring

**Enable detailed logging:**
```typescript
// lib/db-debug.ts
import { db } from './db';

if (process.env.DEBUG_DB) {
  db.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    
    console.log(`Query ${params.model}.${params.action} took ${after - before}ms`);
    return result;
  });
}
```

**Monitor connection pool:**
```typescript
// Health check endpoint
export async function GET() {
  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`;
    
    // Get pool stats (if available)
    const stats = await db.$metrics?.json();
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      metrics: stats,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
    }, { status: 503 });
  }
}
```

---

## Emergency Database Recovery

### Backup and Restore

**Backup:**
```bash
# Development
pg_dump -h localhost -p 5433 -U postgres taxomind_dev > backup.sql

# Production (example)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

**Restore:**
```bash
# Development
psql -h localhost -p 5433 -U postgres taxomind_dev < backup.sql

# With Prisma
npx prisma db push --skip-generate
```

### Reset Procedures

**Development only:**
```bash
# Complete reset
npm run dev:setup

# Or manually
npx prisma migrate reset
npx prisma db seed
```

---

## Diagnostic Commands

```bash
# Test connection
npx prisma db pull

# Validate schema
npx prisma validate

# Format schema
npx prisma format

# Open studio
npx prisma studio

# Check migration status
npx prisma migrate status

# Generate ERD
npx prisma generate --generator erd
```

---

## When to Escalate

Escalate database issues when:
- Data corruption is suspected
- Performance degradation affects production
- Migration fails in production
- Unexplained data inconsistencies
- Database server crashes

Include in escalation:
- Full error messages
- Recent schema changes
- Query that caused the issue
- Database logs
- Current migration status

---

*Last Updated: January 2025*
*Database Stack: PostgreSQL 15 + Prisma 5.x*