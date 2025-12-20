# Code Standards - SAM AI Tutor

## Purpose
This document defines the mandatory coding standards for the SAM AI Tutor project. All code must adhere to these standards to ensure consistency, maintainability, and quality across the 18-month transformation.

---

## TypeScript Standards

### Type Safety - ZERO TOLERANCE POLICY

#### Rule 1: NEVER Use `any` Type
```typescript
// ❌ FORBIDDEN - Violates enterprise security standards
function processData(data: any): any {
  return data.map((item: any) => item.value);
}

// ✅ CORRECT - Explicit types
interface DataItem {
  id: string;
  value: number;
  label: string;
}

function processData(data: DataItem[]): number[] {
  return data.map((item) => item.value);
}
```

**Rationale**: `any` defeats TypeScript's purpose and introduces runtime errors that should be caught at compile time.

#### Rule 2: Explicit Return Types for All Functions
```typescript
// ❌ WRONG - Implicit return type
async function getCourse(id: string) {
  const course = await db.course.findUnique({ where: { id } });
  return course;
}

// ✅ CORRECT - Explicit return type
async function getCourse(id: string): Promise<Course | null> {
  const course = await db.course.findUnique({ where: { id } });
  return course;
}
```

**Rationale**: Explicit return types catch errors early and serve as documentation.

#### Rule 3: Strict Null Checks
```typescript
// Enable in tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noImplicitReturns": true
  }
}

// ❌ WRONG - Potential null reference
function getUserName(user: User): string {
  return user.name.toUpperCase(); // Crash if name is null!
}

// ✅ CORRECT - Null-safe
function getUserName(user: User): string {
  return user.name?.toUpperCase() ?? 'Anonymous';
}
```

#### Rule 4: Use Type Guards for `unknown`
```typescript
// ❌ WRONG - Using unknown without guard
function parseData(data: unknown): string {
  return data.toString(); // Unsafe!
}

// ✅ CORRECT - Type guard
function isValidData(data: unknown): data is { value: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'value' in data &&
    typeof (data as any).value === 'string'
  );
}

function parseData(data: unknown): string {
  if (isValidData(data)) {
    return data.value;
  }
  throw new Error('Invalid data format');
}
```

### Interface and Type Definitions

#### Rule 5: Use Interfaces for Object Shapes
```typescript
// ✅ CORRECT - Interface for objects
interface StudentMemory {
  userId: string;
  knowledgeGraph: KnowledgeGraph;
  learningStyle: LearningStyle;
  emotionalState: EmotionalState;
}

// ✅ CORRECT - Type for unions, intersections, primitives
type EngineResult = SuccessResult | ErrorResult;
type ConceptId = string;
type MasteryLevel = number; // 0.0 - 1.0
```

#### Rule 6: Use Generics for Reusable Code
```typescript
// ✅ CORRECT - Generic API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Usage
async function getCourse(id: string): Promise<ApiResponse<Course>> {
  // Implementation
}

async function getUser(id: string): Promise<ApiResponse<User>> {
  // Implementation
}
```

---

## React 19 Standards

### Component Patterns

#### Rule 7: Use Functional Components Only
```typescript
// ❌ WRONG - Class components (outdated)
class CourseCard extends React.Component {
  render() {
    return <div>{this.props.course.title}</div>;
  }
}

// ✅ CORRECT - Functional component with TypeScript
interface CourseCardProps {
  course: Course;
  onEnroll: (courseId: string) => void;
}

export const CourseCard = ({ course, onEnroll }: CourseCardProps) => {
  return (
    <div onClick={() => onEnroll(course.id)}>
      <h3>{course.title}</h3>
    </div>
  );
};
```

#### Rule 8: Props Interface Co-located with Component
```typescript
// ✅ CORRECT - Props defined immediately before component
interface SAMChatPanelProps {
  userId: string;
  courseId?: string;
  initialMessage?: string;
  onClose: () => void;
}

export const SAMChatPanel = ({
  userId,
  courseId,
  initialMessage,
  onClose,
}: SAMChatPanelProps) => {
  // Component implementation
};
```

### Hooks Best Practices

#### Rule 9: Complete Dependency Arrays
```typescript
// ❌ WRONG - Missing dependencies (causes stale closures)
useEffect(() => {
  fetchUserData(userId);
}, []); // Missing userId dependency!

// ✅ CORRECT - All dependencies included
useEffect(() => {
  fetchUserData(userId);
}, [userId]);

// ✅ CORRECT - useCallback with all dependencies
const handleSubmit = useCallback(
  async (formData: FormData) => {
    if (isLoading) return;
    await submitForm(formData, userId);
  },
  [isLoading, userId] // Both dependencies included
);
```

**ESLint Rule**: `react-hooks/exhaustive-deps` must have ZERO warnings.

#### Rule 10: Move Functions Inside useEffect When Possible
```typescript
// ❌ LESS OPTIMAL - Extra useCallback
const fetchData = useCallback(async () => {
  const data = await getData(userId);
  setData(data);
}, [userId]);

useEffect(() => {
  fetchData();
}, [fetchData]);

// ✅ BETTER - Function inside useEffect
useEffect(() => {
  const fetchData = async () => {
    const data = await getData(userId);
    setData(data);
  };
  fetchData();
}, [userId]); // Simpler dependency array
```

#### Rule 11: useMemo for Expensive Computations Only
```typescript
// ❌ WRONG - Unnecessary memoization
const userName = useMemo(() => user.name.toUpperCase(), [user.name]);

// ✅ CORRECT - Only for expensive operations
const sortedCourses = useMemo(() => {
  return courses
    .filter((c) => c.isPublished)
    .sort((a, b) => calculateRelevance(b) - calculateRelevance(a));
}, [courses]);
```

### Server Components vs Client Components

#### Rule 12: Prefer Server Components
```typescript
// ✅ CORRECT - Server Component (default in Next.js 15)
// app/courses/page.tsx
import { getCourses } from '@/actions/get-courses';

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div>
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}

// ✅ CORRECT - Client Component only when needed
// components/course-enrollment-button.tsx
'use client';

import { useState } from 'react';

export const EnrollmentButton = ({ courseId }: { courseId: string }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleEnroll = async () => {
    setIsLoading(true);
    await enrollInCourse(courseId);
    setIsLoading(false);
  };

  return <button onClick={handleEnroll}>Enroll</button>;
};
```

**When to use 'use client'**:
- Interactive components (onClick, onChange, etc.)
- Components using hooks (useState, useEffect, useContext)
- Components using browser APIs (localStorage, window, etc.)

---

## Next.js 15 Standards

### Rule 13: Use Server Actions for Mutations
```typescript
// ✅ CORRECT - Server Action
// actions/enroll-course.ts
'use server';

import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function enrollCourse(courseId: string) {
  const user = await currentUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await db.enrollment.create({
      data: {
        userId: user.id,
        courseId,
      },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Enrollment failed' };
  }
}

// ✅ CORRECT - Client component using Server Action
'use client';

import { enrollCourse } from '@/actions/enroll-course';

export const EnrollButton = ({ courseId }: { courseId: string }) => {
  const handleEnroll = async () => {
    const result = await enrollCourse(courseId);
    if (result.success) {
      toast.success('Enrolled successfully!');
    } else {
      toast.error(result.error);
    }
  };

  return <button onClick={handleEnroll}>Enroll</button>;
};
```

### Rule 14: Use Next.js Image Component
```typescript
// ❌ WRONG - Regular img tag
<img src={course.imageUrl} alt={course.title} />

// ✅ CORRECT - Next.js Image component
import Image from 'next/image';

<Image
  src={course.imageUrl}
  alt={course.title}
  width={400}
  height={300}
  className="rounded-lg"
/>

// ✅ CORRECT - Responsive with fill
<div className="relative w-full h-48">
  <Image
    src={course.imageUrl}
    alt={course.title}
    fill
    className="object-cover rounded-lg"
  />
</div>
```

### Rule 15: Use Loading and Error Boundaries
```typescript
// ✅ CORRECT - loading.tsx
// app/courses/loading.tsx
export default function CoursesLoading() {
  return <CoursesPageSkeleton />;
}

// ✅ CORRECT - error.tsx
// app/courses/error.tsx
'use client';

export default function CoursesError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

---

## Database and Prisma Standards

### Rule 16: Always Use Prisma Client Singleton
```typescript
// ❌ WRONG - Creating new PrismaClient instance
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ✅ CORRECT - Use singleton from lib/db.ts
import { db } from '@/lib/db';

export async function getCourse(id: string) {
  return db.course.findUnique({ where: { id } });
}
```

### Rule 17: Use Prisma Type-Safe Queries
```typescript
// ✅ CORRECT - Type-safe Prisma query
const courses = await db.course.findMany({
  where: {
    isPublished: true,
    categoryId: { in: categoryIds },
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
        Enrollment: true,
      },
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
});

// TypeScript knows the exact shape:
// courses[0].category.name ✅
// courses[0].user.name ✅
// courses[0]._count.chapters ✅
```

### Rule 18: Always Check Prisma Schema Before Writing Queries
```bash
# Before writing any query:
cat prisma/schema.prisma | grep -A 10 "model Course"

# Verify:
# - Field names (is it 'userId' or 'authorId'?)
# - Relations (is it 'Enrollment' or 'enrollments'?)
# - Field types (is price a Float or Decimal?)
```

```typescript
// ❌ WRONG - Using non-existent field
await db.course.findMany({
  include: {
    enrollments: true, // ERROR: Field doesn't exist (it's 'Enrollment')
  },
});

// ✅ CORRECT - Check schema first, use correct relation name
await db.course.findMany({
  include: {
    Enrollment: true, // Correct capitalization from schema
  },
});
```

### Rule 19: Use Transactions for Multi-Step Operations
```typescript
// ✅ CORRECT - Atomic transaction
export async function enrollWithPayment(
  userId: string,
  courseId: string,
  paymentIntentId: string
) {
  return db.$transaction(async (tx) => {
    // Step 1: Create purchase record
    const purchase = await tx.purchase.create({
      data: {
        userId,
        courseId,
        paymentIntentId,
        amount: course.price,
      },
    });

    // Step 2: Create enrollment
    const enrollment = await tx.enrollment.create({
      data: {
        userId,
        courseId,
        purchaseId: purchase.id,
      },
    });

    // Step 3: Update course enrollment count
    await tx.course.update({
      where: { id: courseId },
      data: {
        enrollmentCount: { increment: 1 },
      },
    });

    return { purchase, enrollment };
  });
  // If ANY step fails, ALL steps roll back ✅
}
```

---

## Error Handling Standards

### Rule 20: Consistent Error Response Format
```typescript
// ✅ CORRECT - Standard error response
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Example usage
export async function createCourse(data: CourseInput): Promise<ApiResponse<Course>> {
  try {
    const course = await db.course.create({ data });
    return { success: true, data: course };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create course',
          details: { prismaCode: error.code },
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    };
  }
}
```

### Rule 21: Never Expose Internal Errors to Users
```typescript
// ❌ WRONG - Leaking internal details
catch (error) {
  return { error: error.message }; // Might expose database schema, file paths, etc.
}

// ✅ CORRECT - Safe error message
catch (error) {
  console.error('Course creation failed:', error); // Log internally
  return {
    success: false,
    error: {
      code: 'COURSE_CREATION_FAILED',
      message: 'Unable to create course. Please try again.',
    },
  };
}
```

### Rule 22: Log Errors with Context
```typescript
// ✅ CORRECT - Comprehensive error logging
import { logger } from '@/lib/logger';

try {
  const result = await complexOperation(userId, courseId);
} catch (error) {
  logger.error('Complex operation failed', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    context: {
      userId,
      courseId,
      timestamp: new Date().toISOString(),
      operation: 'complexOperation',
    },
  });

  throw error; // Re-throw after logging
}
```

---

## Testing Standards

### Rule 23: Write Tests for Every New Function
```typescript
// Implementation
// lib/sam/utils/mastery-calculator.ts
export function calculateMastery(
  correctAnswers: number,
  totalQuestions: number
): number {
  if (totalQuestions === 0) return 0;
  return correctAnswers / totalQuestions;
}

// Test
// __tests__/unit/sam/utils/mastery-calculator.test.ts
import { calculateMastery } from '@/lib/sam/utils/mastery-calculator';

describe('calculateMastery', () => {
  it('should return correct mastery for valid inputs', () => {
    expect(calculateMastery(8, 10)).toBe(0.8);
    expect(calculateMastery(10, 10)).toBe(1.0);
    expect(calculateMastery(0, 10)).toBe(0.0);
  });

  it('should handle edge case of zero questions', () => {
    expect(calculateMastery(0, 0)).toBe(0);
  });
});
```

### Rule 24: Test Coverage Thresholds
```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

### Rule 25: Use Descriptive Test Names
```typescript
// ❌ WRONG - Vague test names
it('works correctly', () => { /* ... */ });
it('handles errors', () => { /* ... */ });

// ✅ CORRECT - Specific test names
it('should return 0.8 mastery when 8 out of 10 answers are correct', () => {
  expect(calculateMastery(8, 10)).toBe(0.8);
});

it('should throw ValidationError when userId is empty string', async () => {
  await expect(getUser('')).rejects.toThrow(ValidationError);
});
```

---

## SAM Engine Standards

### Rule 26: All Engines Extend SAMBaseEngine
```typescript
// ✅ CORRECT - Engine structure
import { SAMBaseEngine, EngineInput, EngineOutput } from '@/lib/sam/core/SAMBaseEngine';

export class MathTutorEngine extends SAMBaseEngine {
  constructor() {
    super({
      name: 'Math Tutor',
      version: '1.0.0',
      capabilities: ['algebra', 'calculus', 'geometry'],
    });
  }

  async execute(input: EngineInput): Promise<EngineOutput> {
    // 1. Check cache
    const cacheKey = this.getCacheKey(input);
    const cached = await this.getCached(cacheKey);
    if (cached) return cached;

    try {
      // 2. Execute logic
      const result = await this.processQuery(input);

      // 3. Cache result
      await this.setCached(cacheKey, result, 3600);

      return result;
    } catch (error) {
      // 4. Log error
      this.logError(error as Error, { input });

      return {
        success: false,
        error: {
          code: 'MATH_TUTOR_ERROR',
          message: 'Failed to process math query',
        },
      };
    }
  }

  private getCacheKey(input: EngineInput): string {
    return `math:${input.userId}:${input.query}`;
  }

  private async processQuery(input: EngineInput): Promise<EngineOutput> {
    // Engine-specific implementation
  }
}
```

### Rule 27: Engine Response Format
```typescript
// ✅ CORRECT - Consistent engine output
interface EngineOutput {
  success: boolean;
  data?: {
    response: string;
    metadata?: {
      topic?: string;
      difficulty?: number;
      relatedConcepts?: string[];
    };
  };
  error?: {
    code: string;
    message: string;
  };
}
```

---

## Security Standards

### Rule 28: Input Validation with Zod
```typescript
// ✅ CORRECT - Validate all inputs
import { z } from 'zod';

const CreateCourseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  categoryId: z.string().uuid(),
  price: z.number().min(0).max(999999),
  imageUrl: z.string().url().optional(),
});

export async function createCourse(input: unknown) {
  // Validate before processing
  const validatedData = CreateCourseSchema.parse(input);

  const course = await db.course.create({
    data: validatedData,
  });

  return { success: true, data: course };
}
```

### Rule 29: Sanitize User Content
```typescript
// ✅ CORRECT - Sanitize HTML content
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'title'],
  });
}

// Usage
const userContent = sanitizeHtml(input.description);
await db.course.update({
  where: { id },
  data: { description: userContent },
});
```

### Rule 30: Rate Limiting for API Routes
```typescript
// ✅ CORRECT - Rate limiting with Upstash
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
});

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // Process request
}
```

---

## Performance Standards

### Rule 31: Lazy Load Heavy Components
```typescript
// ✅ CORRECT - Lazy load heavy components
import { lazy, Suspense } from 'react';

const RichTextEditor = lazy(() => import('@/components/rich-text-editor'));

export const CourseForm = () => {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <RichTextEditor />
    </Suspense>
  );
};
```

### Rule 32: Use React.memo for Expensive Renders
```typescript
// ✅ CORRECT - Memoize expensive components
import { memo } from 'react';

interface CourseCardProps {
  course: Course;
  onEnroll: (id: string) => void;
}

export const CourseCard = memo(({ course, onEnroll }: CourseCardProps) => {
  return (
    <div>
      <h3>{course.title}</h3>
      <button onClick={() => onEnroll(course.id)}>Enroll</button>
    </div>
  );
});

CourseCard.displayName = 'CourseCard';
```

---

## Code Review Checklist

Before submitting a pull request, verify:

- [ ] `npm run lint` passes with ZERO errors
- [ ] `npx tsc --noEmit` passes with ZERO errors
- [ ] `npm run test` passes with all tests green
- [ ] `npm run build` succeeds
- [ ] Code coverage ≥ 70% for new code
- [ ] All functions have explicit return types
- [ ] No `any` or unguarded `unknown` types
- [ ] All React hooks have complete dependency arrays
- [ ] Images use Next.js `Image` component
- [ ] Prisma queries verified against schema
- [ ] Error handling follows standard format
- [ ] Security: Input validation with Zod
- [ ] Security: User content sanitized
- [ ] Performance: Heavy components lazy loaded
- [ ] Tests written for all new functions

---

## Enforcement

These standards are **MANDATORY**. Code that violates these standards will be rejected in code review.

**Automated Enforcement**:
- Pre-commit hooks run `lint` and `tsc`
- CI/CD pipeline runs full test suite
- Pull requests require approval from 2 reviewers
- Coverage drops below 70% will block merge

**Manual Enforcement**:
- Code reviewers check for adherence
- Weekly team review of standards violations
- Quarterly standards update based on learnings
