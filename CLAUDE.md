# CLAUDE.md

**Taxomind** - Enterprise LMS with Next.js 15, AI-powered learning, and role-based access control.

## 🚨 CRITICAL RULES

### Code Quality
- **NEVER** use `any` or `unknown` without type guards
- **ALWAYS** validate input with Zod schemas
- **ALWAYS** run post-generation checks: `npx tsc --noEmit && npm run lint`
- **NEVER** commit with TypeScript/ESLint errors

### Workflow
1. **Pre-generation**: Check `npx tsc --noEmit` and verify Prisma schema
2. **Generation**: Use explicit types, follow existing patterns
3. **Post-generation**: Fix ALL errors, check HTML entities (`&apos;`, `&quot;`)
4. **Cleanup**: Run Prettier, refactor if needed

## Essential Commands

```bash
# Development
npm run dev                    # Start dev server (PostgreSQL port 5433)
npm run build && npm run lint  # Production build check
npm test                       # Run tests

# Database
npm run dev:docker:start       # Start PostgreSQL container
npm run dev:db:studio         # Open Prisma Studio
npx prisma generate           # Update Prisma client
```

## Architecture Quick Reference

### Structure
```
app/
├── (auth)/      # Authentication
├── (course)/    # Learning interface
├── (dashboard)/ # Role-based dashboards
└── api/        # 100+ API endpoints
```

### Key Patterns
- **Auth**: NextAuth.js v5, roles: ADMIN, USER
- **Database**: Prisma + PostgreSQL, see `prisma/schema.prisma`
- **Components**: Radix UI + Tailwind CSS
- **AI**: OpenAI + Anthropic for content generation

## Critical TypeScript Patterns

### ✅ CORRECT: Prisma Relations
```typescript
// Relations use EXACT model names (capitalized)
const user = await db.user.findUnique({
  include: {
    Enrollment: true,  // ✅ Capital E
    Course: true,      // ✅ Capital C
  },
});
```

### ❌ AVOID: Common Mistakes
```typescript
// ❌ Wrong relation names
include: {
  enrollment: true,  // Should be Enrollment
  courses: true,     // Check schema for exact name
}
```

### API Response Standard
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
}

// ALWAYS validate input
const validatedData = Schema.parse(body);
```

## React Best Practices

### ✅ CORRECT Patterns
```typescript
// 1. Complete dependencies
useEffect(() => {
  fetchData(courseId, userId);
}, [courseId, userId]); // Include ALL used variables

// 2. Next.js Image (not <img>)
import Image from 'next/image';
<Image src={url} alt="desc" width={40} height={40} />

// 3. HTML entities
<span>User&apos;s Profile</span>
```

### ❌ AVOID
```typescript
useEffect(() => {
  fetchData(courseId);
}, []); // ❌ Missing dependencies

<img src={url} /> // ❌ Use Next.js Image

<span>User's Profile</span> // ❌ Use &apos;
```

## Error Handling & Fallbacks

### Critical Rules
- **NEVER** use null assertions (`!`) on optional values
- **ALWAYS** provide fallbacks for images and external resources
- **ALWAYS** handle loading/error states in components

### ✅ CORRECT: Image Handling
```typescript
// CourseCard with proper fallbacks
<Image
  src={imageUrl || '/placeholder.svg'}
  alt={title}
  onError={(e) => {
    e.currentTarget.src = '/placeholder.svg';
  }}
/>

// Safe null handling
const displayImage = imageUrl ?? '/default-course.jpg';
```

### ❌ AVOID: Unsafe Patterns
```typescript
// ❌ Null assertion - crashes if null
imageUrl={item.imageUrl!}

// ❌ No error handling
<Image src={imageUrl} alt="course" />

// ❌ No fallback UI
{isLoading && <div>Loading...</div>}
```

### Component Checklist
- ✅ Default values for all optional props
- ✅ Image onError handlers or fallback URLs
- ✅ Loading states for async operations
- ✅ Error boundaries for critical sections
- ✅ Null coalescing (`??`) instead of assertions (`!`)

## Prisma Field Safety (Railway Deployments)

### Golden Rule
**New fields MUST be optional or have defaults**

```prisma
// ✅ SAFE
model User {
  id    String @id @default(cuid())
  phone String?              // Optional
  bio   String @default("")  // Default value
}

// ❌ BREAKS RAILWAY BUILD
model User {
  id    String @id
  phone String  // ERROR: Existing rows have no value
}
```

### Safe Defaults Reference
| Type | Safe Pattern |
|------|-------------|
| String | `String?` or `@default("")` |
| Int | `Int?` or `@default(0)` |
| Boolean | `@default(false)` |
| DateTime | `@default(now())` |
| String[] | `@default([])` |

## Testing Patterns

### Common Test Patterns
```typescript
// 1. Mock Prisma
jest.mock('@/lib/db', () => ({
  db: {
    user: { findUnique: jest.fn() },
  },
}));

// 2. Mock Auth
jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

// 3. React Testing
import { render, screen } from '@testing-library/react';
// Use data-testid attributes
```

### Test Commands
```bash
npm test [file] -- --verbose
npm run test:coverage
npx prisma studio  # Verify schema
```

## Quick Checklists

### Pre-Commit
```bash
npx tsc --noEmit  # TypeScript check
npm run lint      # ESLint check
npm test          # Test suite
```

### API Endpoint Security
- ✅ Zod validation
- ✅ Authentication check
- ✅ Authorization check
- ✅ Error messages don't leak internals
- ✅ Rate limiting

### React Hook Rules
- ✅ Include ALL dependencies in useEffect/useCallback
- ✅ Use HTML entities (`&apos;`, `&quot;`)
- ✅ Use Next.js Image component
- ✅ Run `npm run lint` before commit

## Important Files

- `prisma/schema.prisma` - Database models
- `middleware.ts` - Route protection
- `routes.ts` - Route configuration
- `auth.ts` - NextAuth config
- `lib/db.ts` - Database singleton

## Icons (Lucide React)

```typescript
// ✅ CORRECT names
import { BarChart3, Shield, Brain } from 'lucide-react';

// ❌ WRONG names
ChartBar  // Use BarChart3
```

---

**Quick Reference**: See `/Users/CLAUDE.md` for full enterprise standards. Always verify schema before database queries.

*Last updated: January 2025*
*Stack: Next.js 15 + Prisma + PostgreSQL + NextAuth.js v5*
