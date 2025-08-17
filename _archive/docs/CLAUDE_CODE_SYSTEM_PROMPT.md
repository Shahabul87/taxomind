# Claude Code System Prompt for Taxomind LMS

## Project Overview

You are working on **Taxomind**, an intelligent learning management system (LMS) built with Next.js 15, featuring AI-powered adaptive learning, real-time analytics, and enterprise-grade security. The platform supports multiple learning paths with role-based access control for students, teachers, and administrators.

## Critical Rules and Guidelines

### 1. ALWAYS Check Before Generating Code
- **Run lint after generating code**: `npm run lint`
- **Check for build errors**: `npm run build`
- **Verify TypeScript**: `npx tsc --noEmit`
- **Check for unescaped entities in JSX**
- **Monitor terminal for errors after code generation**

### 2. Technology Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5.8.3
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS with Radix UI
- **AI Integration**: OpenAI & Anthropic SDKs
- **Testing**: Jest + React Testing Library

### 3. Code Generation Best Practices

#### A. Next.js Image Component - MANDATORY
```typescript
// ✅ ALWAYS use Next.js Image component
import Image from 'next/image';

<Image
  src={user.image}
  alt={user.name || "User"}
  width={40}
  height={40}
  className="w-full h-full object-cover"
/>

// ❌ NEVER use regular img tags
<img src={user.image} alt={user.name} /> // This causes ESLint errors
```

#### B. React Hooks Dependencies - CRITICAL
```typescript
// ✅ ALWAYS include ALL dependencies
useEffect(() => {
  fetchData(courseId, userId);
}, [courseId, userId, fetchData]); // Include ALL variables used

// ❌ NEVER omit dependencies
useEffect(() => {
  fetchData(courseId, userId);
}, []); // Missing dependencies causes stale closures
```

#### C. HTML Entity Escaping
```typescript
// ✅ ALWAYS use HTML entities for apostrophes
<span>User&apos;s Profile</span>
<span>Don&apos;t forget</span>

// ❌ NEVER use raw apostrophes
<span>User's Profile</span> // ESLint error
```

#### D. Lucide React Icons
```typescript
// ✅ Correct icon names
import { 
  BarChart3,    // NOT ChartBar
  Shield,       // Available icon
  X,            // Available icon
  Brain,        // Available icon
} from 'lucide-react';

// ❌ These don't exist
ChartBar     // Use BarChart3 instead
ChartLine    // Use LineChart instead
```

### 4. Database Patterns

#### A. Correct Prisma Relations
```typescript
// ✅ Use actual model names from schema
const courses = await db.course.findMany({
  include: {
    category: true,
    Purchase: true,      // Capital P
    Enrollment: true,    // Capital E
    reviews: true,
    _count: {
      select: {
        chapters: true,
      },
    },
  },
});

// ❌ Don't use non-existent relations
enrollments: true,  // Should be 'Enrollment'
purchases: true,    // Should be 'Purchase'
```

#### B. User Roles
```typescript
enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}
// Note: No TEACHER role - teachers are USER role with courses
```

### 5. File Structure Patterns

#### A. Server vs Client Components
```typescript
// Server Component (default)
import { db } from '@/lib/db';

export default async function Page() {
  const data = await db.course.findMany();
  return <div>{/* ... */}</div>;
}

// Client Component (when needed)
'use client';

import { useState } from 'react';

export default function Interactive() {
  const [state, setState] = useState();
  return <div>{/* ... */}</div>;
}
```

#### B. Server Actions
```typescript
'use server';

import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function serverAction(data: FormData) {
  const user = await currentUser();
  if (!user) return { error: 'Unauthorized' };
  
  // Action logic
  return { success: true };
}
```

### 6. Environment and Security

#### A. Environment Variables
```bash
# Development uses port 5433 for PostgreSQL
DATABASE_URL="postgresql://user:pass@localhost:5433/taxomind_dev"

# Never expose sensitive keys to client
OPENAI_API_KEY="sk-..."  # Server-only
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Client-safe
```

#### B. Authentication Pattern
```typescript
import { currentUser } from '@/lib/auth';

export async function protectedAction() {
  const user = await currentUser();
  
  if (!user || !user.id) {
    return { error: 'Unauthorized' };
  }
  
  if (user.role !== 'ADMIN') {
    return { error: 'Admin access required' };
  }
  
  // Protected logic
}
```

### 7. Testing Requirements

#### A. Test File Structure
```typescript
// __tests__/actions/example.test.ts
import { action } from '@/actions/example';
import { prismaMock } from '../utils/test-db';

describe('Example Action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should handle success case', async () => {
    // Test implementation
  });
});
```

#### B. Mock Database Setup
```typescript
// All Prisma models must be mocked
export const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  course: { /* ... */ },
  verificationToken: { /* ... */ },
  // Include ALL models used in tests
};
```

### 8. Build and Deployment

#### A. Essential Commands
```bash
# Development
npm run dev              # Start dev server

# Build & Deploy
npm run build            # Production build
npm run lint             # Check code style
npm run test             # Run tests

# Database
npx prisma generate      # Generate Prisma client
npx prisma db push       # Sync schema with database
npx prisma studio        # Visual database browser
```

#### B. Build Optimization
```bash
# Memory optimization for large builds
NODE_OPTIONS='--max-old-space-size=8192' npm run build

# Quick build (bypasses type checking)
npm run build:ignore-errors
```

### 9. Common Pitfalls to Avoid

#### ❌ NEVER Do These:
1. Use regular `<img>` tags instead of Next.js `<Image>`
2. Omit useEffect/useCallback dependencies
3. Use raw apostrophes in JSX (use `&apos;`)
4. Create TEACHER role (use USER role)
5. Use non-existent Prisma relations
6. Mix server and client code incorrectly
7. Expose sensitive API keys to client
8. Forget to run `npm run lint` after changes
9. Use wrong Lucide icon names
10. Create files without being asked

### 10. Error Resolution Workflow

When encountering errors:

1. **TypeScript Errors**
   ```bash
   npx tsc --noEmit | head -50  # Check first 50 errors
   ```

2. **ESLint Errors**
   ```bash
   npm run lint
   npm run lint:fix  # Auto-fix when possible
   ```

3. **Build Errors**
   ```bash
   npm run build
   # If memory issues:
   NODE_OPTIONS='--max-old-space-size=8192' npm run build
   ```

4. **Test Errors**
   ```bash
   npm test
   # Check specific test:
   npm test -- example.test.ts
   ```

### 11. AI Integration Patterns

#### A. OpenAI Integration
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateContent(prompt: string) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI error:', error);
    return null;
  }
}
```

#### B. Error Handling Pattern
```typescript
export async function safeOperation() {
  try {
    const result = await riskyOperation();
    return { success: true, data: result };
  } catch (error) {
    console.error('Operation failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
```

### 12. Performance Optimization

#### A. Database Queries
```typescript
// ✅ Efficient: Select only needed fields
const courses = await db.course.findMany({
  select: {
    id: true,
    title: true,
    price: true,
  },
});

// ❌ Inefficient: Fetching everything
const courses = await db.course.findMany({
  include: {
    chapters: {
      include: {
        sections: {
          include: {
            videos: true,
            // Deep nesting
          },
        },
      },
    },
  },
});
```

#### B. Component Optimization
```typescript
// Use React.memo for expensive components
export const ExpensiveComponent = React.memo(({ data }) => {
  // Component logic
});

// Use useMemo for expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Use useCallback for stable function references
const stableCallback = useCallback(() => {
  doSomething(value);
}, [value]);
```

### 13. Accessibility Requirements

```typescript
// ✅ Always include accessibility attributes
<button
  onClick={handleClick}
  aria-label="Close dialog"
  aria-pressed={isPressed}
>
  <X className="h-4 w-4" />
</button>

<Image
  src={course.image}
  alt={`${course.title} course thumbnail`}  // Descriptive alt text
  width={400}
  height={300}
/>

// ✅ Use semantic HTML
<nav aria-label="Main navigation">
<main>
<article>
<section>
```

### 14. Git Commit Guidelines

When creating commits:
```bash
# Clear, concise commit messages
git commit -m "fix: resolve TypeScript errors in test files"
git commit -m "feat: add AI-powered course recommendations"
git commit -m "refactor: optimize database queries for performance"
git commit -m "docs: update API documentation"

# Format: type: description
# Types: feat, fix, refactor, docs, test, perf, style, chore
```

### 15. Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup database (Docker on port 5433)
npm run dev:docker:start
npm run dev:setup

# 3. Generate Prisma client
npx prisma generate

# 4. Start development server
npm run dev

# 5. Open Prisma Studio (optional)
npx prisma studio
```

## Quick Reference Checklist

Before submitting any code changes:

- [ ] ✅ Used Next.js `<Image>` component (not `<img>`)
- [ ] ✅ Included all useEffect/useCallback dependencies
- [ ] ✅ Escaped apostrophes with `&apos;`
- [ ] ✅ Used correct Prisma model names (Purchase, Enrollment)
- [ ] ✅ Ran `npm run lint`
- [ ] ✅ Checked for TypeScript errors
- [ ] ✅ Added proper error handling
- [ ] ✅ Included accessibility attributes
- [ ] ✅ Used semantic HTML
- [ ] ✅ Followed security best practices
- [ ] ✅ Optimized database queries
- [ ] ✅ Added proper TypeScript types
- [ ] ✅ Separated server and client code correctly
- [ ] ✅ Used environment variables properly
- [ ] ✅ Added loading and error states

## Important Notes

1. **Always prefer editing existing files over creating new ones**
2. **Never create documentation files unless explicitly requested**
3. **Run lint and build checks after making changes**
4. **Use the established patterns in the codebase**
5. **Follow the security and authentication patterns**
6. **Test your changes before marking tasks complete**
7. **Use TypeScript strictly - avoid `any` types**
8. **Keep components small and focused**
9. **Use server components by default, client only when needed**
10. **Optimize for performance and accessibility**

---

*This system prompt ensures consistent, high-quality code generation for the Taxomind LMS project.*
*Last Updated: January 2025*
*Framework: Next.js 15 + TypeScript + Prisma + PostgreSQL*