# ADR-0002: Choose Prisma with PostgreSQL for Database Layer

## Status
Accepted

## Context
The Taxomind LMS requires a robust database solution that can handle:
- Complex relational data models (users, courses, chapters, sections, enrollments, purchases)
- High concurrent read/write operations for thousands of users
- ACID compliance for financial transactions and enrollment management
- Full-text search capabilities for course content
- JSON data types for flexible content storage
- Scalability for future growth
- Type-safe database queries integrated with TypeScript

We needed an ORM that would:
- Provide type safety and auto-completion
- Support database migrations and schema versioning
- Offer good developer experience
- Handle complex relations efficiently
- Support multiple database providers if needed in future

## Decision
We will use Prisma as our ORM with PostgreSQL as the database engine.

## Consequences

### Positive
- **Type Safety**: Prisma generates TypeScript types from schema, ensuring compile-time safety
- **Developer Experience**: Excellent auto-completion, intuitive API, and Prisma Studio for visual data management
- **Migration System**: Robust migration system with rollback capabilities
- **Performance**: Efficient query engine with automatic query optimization
- **PostgreSQL Features**: Access to advanced features like JSONB, full-text search, and complex indexes
- **Relation Handling**: Elegant API for complex relations and nested queries
- **Database Agnostic**: Can switch databases with minimal code changes
- **Introspection**: Can generate schema from existing databases
- **Connection Pooling**: Built-in connection management and pooling
- **Raw SQL Support**: Can execute raw SQL when needed for complex queries

### Negative
- **Learning Curve**: Different from traditional ORMs, requires learning Prisma-specific patterns
- **Query Limitations**: Some complex queries may require raw SQL
- **Bundle Size**: Prisma Client adds to application bundle size
- **Generation Step**: Requires running `prisma generate` after schema changes
- **N+1 Problem**: Can still occur if not careful with relation loading
- **Migration Complexity**: Complex migrations may require manual intervention

## Alternatives Considered

### 1. TypeORM
- **Pros**: More traditional ORM patterns, decorators-based, supports Active Record pattern
- **Cons**: Less type safety, more verbose, decorator syntax can be problematic
- **Reason for rejection**: Prisma offers better TypeScript integration and DX

### 2. Drizzle ORM
- **Pros**: Lightweight, SQL-like syntax, good performance
- **Cons**: Less mature, smaller community, fewer features
- **Reason for rejection**: Prisma has more robust tooling and enterprise features

### 3. Raw SQL with pg driver
- **Pros**: Maximum control, best performance, no abstraction overhead
- **Cons**: No type safety, manual query building, prone to SQL injection if not careful
- **Reason for rejection**: Too much boilerplate, higher maintenance burden

### 4. MongoDB with Mongoose
- **Pros**: Flexible schema, good for unstructured data
- **Cons**: Not ideal for relational data, lacks ACID guarantees at scale
- **Reason for rejection**: LMS requires strong relational data modeling

### 5. Supabase (PostgreSQL + instant APIs)
- **Pros**: Instant REST APIs, real-time subscriptions, built-in auth
- **Cons**: Vendor lock-in, less control over API design
- **Reason for rejection**: Need more control over business logic and API design

## Implementation Notes

### Schema Design Principles
```prisma
// Example of key models and relations
model User {
  id          String       @id @default(cuid())
  email       String       @unique
  role        Role         @default(USER)
  courses     Course[]     // Authored courses
  Enrollment  Enrollment[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  @@index([email])
  @@index([role])
}

model Course {
  id          String       @id @default(uuid())
  title       String
  user        User         @relation(fields: [userId], references: [id])
  userId      String
  chapters    Chapter[]
  Purchase    Purchase[]
  Enrollment  Enrollment[]
  
  @@index([userId])
  @@index([isPublished, categoryId])
}
```

### Connection Management
```typescript
// Singleton pattern for database connection
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

### Query Patterns
1. **Use `include` for eager loading** to avoid N+1 queries
2. **Use `select` for partial queries** to reduce data transfer
3. **Implement pagination** using cursor-based or offset pagination
4. **Use transactions** for operations requiring atomicity
5. **Create database indexes** for frequently queried fields

### Migration Strategy
```bash
# Development workflow
npx prisma migrate dev --name migration_name

# Production deployment
npx prisma migrate deploy

# Generate client after schema changes
npx prisma generate
```

### Performance Optimizations
- Enable query logging in development for optimization
- Use `findFirst` instead of `findMany` when expecting single result
- Implement connection pooling with appropriate pool size
- Use raw SQL for complex aggregations and reports
- Create composite indexes for multi-column queries

### Local Development Setup
```bash
# Docker PostgreSQL on port 5433 to avoid conflicts
npm run dev:docker:start
npm run dev:setup  # Reset and seed database
npm run dev:db:studio  # Visual database browser
```

## Monitoring and Maintenance
- Regular `VACUUM` and `ANALYZE` for PostgreSQL optimization
- Monitor slow queries using pg_stat_statements
- Implement database backup strategy
- Set up replication for high availability
- Use read replicas for scaling read operations

## References
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

## Date
2024-01-16

## Authors
- Taxomind Architecture Team