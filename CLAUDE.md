# CLAUDE.md - Database Query Patterns and Development Guidelines

## Database Query Patterns

### ✅ CORRECT: Use These Database Query Patterns

```typescript
// Use the actual model names from the current schema
const courses = await db.course.findMany({
  include: {
    category: true,
    user: {
      select: {
        id: true,
        name: true,
        image: true,
      },
    },
    Purchase: userId ? {
      where: { userId },
      select: {
        createdAt: true,
      },
    } : false,
    _count: {
      select: {
        Purchase: true,
        reviews: true,
        chapters: true,
      },
    },
    reviews: {
      select: {
        rating: true,
      },
    },
  },
});
```

### ❌ AVOID: These Patterns Cause Errors

```typescript
// DON'T use non-existent models
const courses = await db.course.findMany({
  include: {
    enrollments: true, // ❌ UserCourseEnrollment doesn't exist in current DB
    _count: {
      select: {
        enrollments: true, // ❌ This will cause "table does not exist" error
      },
    },
  },
});
```

## Current Database Model Relations

### Course Model Relations
- `Purchase[]` - Course purchases (use this instead of enrollments)
- `Enrollment[]` - Course enrollments
- `reviews` - Course reviews
- `chapters` - Course chapters
- `category` - Course category
- `user` - Course creator

### User Model Relations
- `courses` - Created courses
- `Purchase[]` - Purchased courses
- `Enrollment[]` - Enrolled courses
- `courseReviews` - Course reviews

## Error Prevention Rules

1. **Always check the current schema** before writing queries
2. **Use `db.course.findMany()` patterns** not complex query optimizer calls
3. **Include only existing relations** in your queries
4. **Test queries with simple includes first** before adding complex relations

## Common Error Patterns to Avoid

### 1. Non-existent Table References
```typescript
// ❌ This causes "Table does not exist" errors
include: {
  enrollments: true, // UserCourseEnrollment table doesn't exist
}

// ✅ Use this instead
include: {
  Purchase: true, // Purchase table exists
  Enrollment: true, // Enrollment table exists
}
```

### 2. Incorrect Relation Names
```typescript
// ❌ Wrong relation name
_count: {
  select: {
    enrollments: true, // Should be Purchase or Enrollment
  },
}

// ✅ Correct relation names
_count: {
  select: {
    Purchase: true,
    Enrollment: true,
    reviews: true,
    chapters: true,
  },
}
```

### 3. Complex Query Optimizer Usage
```typescript
// ❌ Avoid complex query optimizers that reference non-existent tables
const { courses } = await CourseQueryOptimizer.getCoursesWithFilters(params);

// ✅ Use simple, direct queries
const courses = await db.course.findMany({
  where: conditions,
  include: simpleIncludes,
});
```

## Development Workflow

1. **Before adding new database queries:**
   - Check the current schema in `prisma/schema.prisma`
   - Verify table exists in database with `npx prisma db pull`
   - Test simple queries first

2. **When schema conflicts occur:**
   - Use `npx prisma db pull` to sync with actual database
   - Update queries to match actual schema
   - Avoid `npx prisma db push --force-reset` in production

3. **For API routes:**
   - Use direct `db.model.findMany()` calls
   - Keep includes simple and verified
   - Test with actual database data

## Quick Fix for Course Queries

```typescript
// Simple, reliable course fetching
export async function getCoursesForPages() {
  return await db.course.findMany({
    where: {
      isPublished: true,
    },
    include: {
      category: true,
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      _count: {
        select: {
          chapters: true,
          Purchase: true,
          reviews: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}
```

## Schema Verification Commands

```bash
# Check current database schema
npx prisma db pull

# Generate Prisma client after schema changes
npx prisma generate

# Check what tables exist (use only when needed)
npx prisma studio
```

## Notes for Future Development

- Always use simple, direct Prisma queries over complex abstractions
- Verify relation names match the actual schema
- Test database queries in isolation before integrating
- Keep this file updated when schema changes

---

## Local Development Setup

### Environment Configuration
- **Local Development**: Uses `.env` file with `NODE_ENV=development`
- **Production**: Uses `.env.production` or Railway environment variables
- **Database Port**: Local PostgreSQL runs on port **5433** to avoid conflicts

### Quick Start Commands
```bash
# Start local development environment
npm run dev:docker:start    # Start PostgreSQL container
npm run dev                 # Start Next.js server

# Database management
npm run dev:setup          # Reset and seed database
npm run dev:db:seed        # Seed with test data
npm run dev:db:studio      # Open Prisma Studio

# Container management
npm run dev:docker:stop    # Stop container
npm run dev:docker:reset   # Recreate container
```

### Local Database Configuration
```bash
# Local connection string (port 5433)
DATABASE_URL="postgresql://postgres:dev_password_123@localhost:5433/taxomind_dev"

# Test users available
teacher@dev.local / password123
student@dev.local / password123
admin@dev.local / password123
```

### Development vs Production Safety
```typescript
// The codebase includes safety checks to prevent production data loss
// lib/db-environment.ts ensures destructive operations only run in development
if (process.env.NODE_ENV === 'development') {
  // Safe to run destructive operations
} else {
  throw new Error('Destructive operations not allowed in production!');
}
```

### Testing Commands to Run After Changes
```bash
# After making changes, always test:
npm run lint               # Check code style
npm run build             # Verify build succeeds
npx prisma generate       # Update Prisma client
```

### Email Testing in Development
- Emails are logged to console in development mode
- Check terminal output for email preview
- No real emails are sent when `NODE_ENV=development`

### Important Files for Development
- `LOCAL_DEVELOPMENT_GUIDE.md` - Complete local setup guide
- `scripts/dev-seed.ts` - Development database seeding
- `lib/db-environment.ts` - Environment safety utilities

---
*Last updated: July 2025*
*Current schema: Purchase-based enrollment system*
*Local development setup: Docker PostgreSQL on port 5433*