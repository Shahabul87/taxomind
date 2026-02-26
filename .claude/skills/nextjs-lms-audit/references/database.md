# 🗄️ Database & Prisma Audit Reference

## What to Check

### 1. N+1 Query Detection
```bash
# Find Prisma queries inside loops (N+1 pattern)
grep -rn "\.map(\|\.forEach(\|for.*of\|for.*in" app/ lib/ --include="*.ts" --include="*.tsx" -A 5 | grep "prisma\.\|db\." | head -20

# Find sequential awaits that could be parallel
grep -rn "await.*prisma\|await.*db\." app/ lib/ --include="*.ts" -A 1 | grep -B 1 "await.*prisma\|await.*db\." | head -20

# Check for missing includes (causes lazy loading / extra queries)
grep -rn "prisma\.\(findMany\|findUnique\|findFirst\)" app/ lib/ --include="*.ts" | grep -v "include\|select" | head -15
```

**Bad Pattern:**
```ts
const courses = await db.course.findMany()
for (const course of courses) {
  const chapters = await db.chapter.findMany({ where: { courseId: course.id } }) // N+1!
}
```

**Good Pattern:**
```ts
const courses = await db.course.findMany({
  include: { chapters: true }
})
```

### 2. Select vs Include Optimization
```bash
# Find queries returning full models when only specific fields needed
grep -rn "findMany\|findUnique\|findFirst" app/ lib/ --include="*.ts" | grep -v "select:" | head -20

# Check for over-fetching with deep includes
grep -rn "include:" app/ lib/ --include="*.ts" -A 10 | grep -c "include:" | head -10

# Find patterns fetching all fields for list views
grep -rn "findMany" app/ lib/ --include="*.ts" -A 5 | grep -v "select\|take\|skip" | head -15
```

**Optimization:**
```ts
// BAD: Fetches all 20 columns for a card list
const courses = await db.course.findMany()

// GOOD: Fetches only what the UI needs
const courses = await db.course.findMany({
  select: {
    id: true,
    title: true,
    imageUrl: true,
    price: true,
    _count: { select: { chapters: true } }
  }
})
```

### 3. Pagination & Limits
```bash
# Find queries without limits (fetching entire tables)
grep -rn "findMany" app/ lib/ --include="*.ts" | grep -v "take\|cursor\|limit\|skip" | head -20

# Check for cursor-based vs offset pagination
grep -rn "skip.*take\|cursor:" app/ lib/ --include="*.ts" | head -10
```

### 4. Index Coverage
```bash
# Examine schema for indexes
cat prisma/schema.prisma 2>/dev/null | grep -A 2 "@@index\|@@unique\|@unique" | head -30

# If using split schemas, check all
find prisma/ -name "*.prisma" -exec grep -l "@@index\|@@unique" {} \; 2>/dev/null

# Find WHERE clauses that might need indexes
grep -rn "where:" app/ lib/ --include="*.ts" -A 3 | grep -oP '\w+:' | sort | uniq -c | sort -rn | head -20
# Frequently queried fields should have indexes
```

**Common missing indexes for LMS:**
- `Chapter.courseId` (fetch chapters by course)
- `UserProgress.userId + chapterId` (compound)
- `Purchase.userId + courseId` (compound)
- `Course.categoryId` (filter by category)
- `Course.isPublished` (filter published courses)

### 5. Connection Pooling
```bash
# Check Prisma client instantiation (singleton pattern)
grep -rn "new PrismaClient\|PrismaClient(" lib/ --include="*.ts" | head -10

# Check for connection URL configuration
grep -n "connection_limit\|pool_timeout\|pgbouncer\|connection_pool" prisma/schema.prisma 2>/dev/null
grep -n "DATABASE_URL" .env.example 2>/dev/null

# Check for global prisma instance (prevent connection exhaustion in dev)
grep -rn "globalThis.*prisma\|global.*prisma" lib/ --include="*.ts" | head -5
```

**Required pattern:**
```ts
// lib/db.ts
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const db = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

### 6. Transaction Patterns
```bash
# Find transaction usage
grep -rn "\$transaction\|transaction(" app/ lib/ --include="*.ts" | head -15

# Find operations that SHOULD be transactional (multi-write without transaction)
grep -rn "\.create\|\.update\|\.delete" app/ lib/ --include="*.ts" -A 3 | grep -B 1 "\.create\|\.update\|\.delete" | head -20

# Check transaction timeout configuration
grep -rn "timeout\|maxWait" lib/ --include="*.ts" | grep -i "transaction\|prisma" | head -5
```

### 7. Migration Health
```bash
# Check migration status
npx prisma migrate status 2>/dev/null || echo "Cannot check - need DATABASE_URL"

# Count migrations
ls prisma/migrations/ 2>/dev/null | wc -l

# Check for failed migrations
find prisma/migrations -name "migration_lock.toml" -exec cat {} \; 2>/dev/null

# Check schema merge script
cat scripts/merge-schema.ts 2>/dev/null | head -30
```

### 8. Query Performance Patterns
```bash
# Find COUNT queries (expensive on large tables)
grep -rn "\.count(\|_count" app/ lib/ --include="*.ts" | head -10

# Find aggregate queries
grep -rn "\.aggregate\|\.groupBy\|_sum\|_avg\|_min\|_max" app/ lib/ --include="*.ts" | head -10

# Find LIKE/contains queries (can be slow without full-text index)
grep -rn "contains:\|startsWith:\|endsWith:\|search:" app/ lib/ --include="*.ts" | head -10

# Check for Prisma query logging (should be off in production)
grep -rn "log:.*query\|PrismaClient.*log" lib/ --include="*.ts" | head -5
```

### 9. Redis Usage Patterns
```bash
# Check Redis connection management
grep -rn "new Redis\|createClient\|ioredis\|Upstash" lib/ --include="*.ts" | head -10

# Check for Redis key patterns (should have namespaces)
grep -rn "redis.get\|redis.set\|redis.del\|cache.get\|cache.set" app/ lib/ --include="*.ts" | head -15

# Check TTL on cached items
grep -rn "ex:\|EX\|ttl\|expire\|setex\|SETEX" app/ lib/ --include="*.ts" | head -10

# Check for cache invalidation patterns
grep -rn "redis.del\|cache.delete\|invalidate\|revalidate" app/ lib/ --include="*.ts" | head -10
```

### 10. pgvector Usage (if applicable)
```bash
# Check for vector operations
grep -rn "vector\|embedding\|similarity\|cosine" prisma/ lib/ --include="*.prisma" --include="*.ts" | head -10

# Check vector index
grep -rn "@@index.*vector\|ivfflat\|hnsw" prisma/ --include="*.prisma" | head -5
```

## Scoring

| Check | Weight | Score Criteria |
|-------|--------|---------------|
| No N+1 Queries | 25% | 0 loop-based queries = full marks |
| Select Optimization | 15% | >50% queries use select = full marks |
| Pagination | 15% | All list queries have take/cursor |
| Index Coverage | 15% | All WHERE fields indexed |
| Connection Pooling | 10% | Singleton pattern + pool config |
| Transactions | 10% | Multi-writes use $transaction |
| Redis Caching | 10% | TTL set, invalidation exists |
