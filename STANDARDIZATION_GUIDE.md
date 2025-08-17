# Code Standardization Migration Guide

## Overview
This guide helps developers migrate existing code to follow the new enterprise standards established in Phase 2 of the code quality improvement plan.

## What's New

### 1. Enhanced ESLint Configuration
- **Strict TypeScript rules** - No more `any` types allowed
- **Security scanning** - Detects potential security issues
- **Code complexity checks** - Prevents overly complex functions
- **Import ordering** - Automatic organization of imports
- **Naming conventions** - Enforced consistent naming

### 2. Centralized Error Handling
- **AppError class** - Standardized error objects
- **Error codes** - Consistent error identification
- **Error handler middleware** - Automatic error formatting

### 3. Standardized API Responses
- **Consistent response format** - All APIs return same structure
- **Pagination utilities** - Reusable pagination logic
- **Validation schemas** - Zod-based input validation

## Migration Steps

### Step 1: Update Your API Endpoints

#### Before (Old Pattern):
```typescript
export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const courses = await db.course.findMany();
    return NextResponse.json(courses);
    
  } catch (error) {
    console.log("Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

#### After (New Pattern):
```typescript
import { withErrorHandler } from '@/lib/errors';
import { successResponse } from '@/lib/api/response';
import { validatedHandler } from '@/lib/api/validation';

export const GET = withErrorHandler(
  async (request: Request) => {
    const user = await currentUser();
    if (!user) {
      throw AppErrors.unauthorized();
    }
    
    const courses = await db.course.findMany();
    return successResponse(courses);
  },
  'GET /api/courses'
);
```

### Step 2: Replace Console.log with Logger

#### Before:
```typescript
console.log("User logged in:", userId);
console.error("Failed to fetch data:", error);
```

#### After:
```typescript
import { logger } from '@/lib/logger';

logger.info('User logged in', { userId });
logger.error('Failed to fetch data', error);
```

### Step 3: Add Type Safety

#### Before:
```typescript
function processData(data: any): any {
  return data.map((item: any) => item.value);
}
```

#### After:
```typescript
interface DataItem {
  id: string;
  value: number;
}

function processData(data: DataItem[]): number[] {
  return data.map((item) => item.value);
}
```

### Step 4: Use Validation Schemas

#### Before:
```typescript
export async function POST(request: Request) {
  const body = await request.json();
  
  if (!body.title || !body.description) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  
  // Process...
}
```

#### After:
```typescript
import { z } from 'zod';
import { validateBody } from '@/lib/api/validation';

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
});

export const POST = withErrorHandler(
  async (request: Request) => {
    const body = await validateBody(request, createSchema);
    // Body is now type-safe and validated
    // Process...
  }
);
```

### Step 5: Standardize Error Responses

#### Before:
```typescript
// Inconsistent error formats
return NextResponse.json({ error: "Not found" }, { status: 404 });
return NextResponse.json({ message: "Invalid input" }, { status: 400 });
return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
```

#### After:
```typescript
// Consistent error throwing
throw AppErrors.notFound('Course', courseId);
throw AppErrors.validation('Invalid input', { field: 'email' });
throw AppErrors.internal('Database connection failed');
```

## Running Linting and Fixes

### Check for Issues:
```bash
npm run lint
```

### Auto-fix What's Possible:
```bash
npx eslint . --fix
```

### Check TypeScript Errors:
```bash
npx tsc --noEmit
```

## Common Patterns

### 1. Paginated Endpoints
```typescript
import { getPaginationParams, paginatedResponse } from '@/lib/api/response';

export const GET = withErrorHandler(
  async (request: Request) => {
    const url = new URL(request.url);
    const pagination = getPaginationParams(url.searchParams);
    
    const [items, total] = await Promise.all([
      db.course.findMany({
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      db.course.count(),
    ]);
    
    return paginatedResponse(items, {
      page: pagination.page,
      limit: pagination.limit,
      total,
    });
  }
);
```

### 2. Protected Routes
```typescript
export const POST = withErrorHandler(
  async (request: Request) => {
    const user = await currentUser();
    if (!user) {
      throw AppErrors.unauthorized();
    }
    
    if (user.role !== 'ADMIN') {
      throw AppErrors.forbidden('Admin access required');
    }
    
    // Admin-only logic...
  }
);
```

### 3. Database Operations with Error Handling
```typescript
import { Prisma } from '@prisma/client';

try {
  const result = await db.course.create({ data });
  return createdResponse(result);
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw AppErrors.conflict('Course with this title already exists');
    }
  }
  throw error; // Re-throw for global handler
}
```

## Benefits of Migration

1. **Type Safety**: Catch errors at compile time
2. **Consistency**: Same patterns across all APIs
3. **Better Error Messages**: Clear, actionable error responses
4. **Easier Debugging**: Structured logging with context
5. **Security**: Automatic security checks via ESLint
6. **Maintainability**: Easier to understand and modify code
7. **Performance**: Early validation prevents unnecessary processing

## Gradual Migration Strategy

You don't need to migrate everything at once:

1. **Start with new code** - Apply standards to all new development
2. **Migrate during fixes** - When fixing bugs, update to new patterns
3. **Critical paths first** - Prioritize high-traffic endpoints
4. **Team coordination** - Assign specific modules to team members

## Need Help?

- Check the example refactored endpoint: `/app/api/courses/[courseId]/route.refactored.ts`
- Review utility files in `/lib/errors/` and `/lib/api/`
- Run `npm run lint` to identify issues automatically

## Checklist for Each File

When migrating a file, ensure:

- [ ] No `console.log` statements (use `logger`)
- [ ] No `any` types (define proper interfaces)
- [ ] Uses `withErrorHandler` wrapper
- [ ] Uses `AppErrors` for error throwing
- [ ] Uses validation schemas for input
- [ ] Returns standardized responses
- [ ] Includes proper TypeScript return types
- [ ] Follows naming conventions
- [ ] Imports are organized
- [ ] No unused imports or variables

---

*Last Updated: January 2025*
*Phase 2: Standardization Complete*