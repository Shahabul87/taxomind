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
*Last updated: July 2025*
*Current schema: Purchase-based enrollment system*