# ADR-0008: Adopt TypeScript in Strict Mode

## Status
Accepted

## Context
The Taxomind LMS is a large-scale enterprise application with:
- 100+ API endpoints
- 50+ database models
- Complex business logic for learning management
- Multiple developer teams contributing code
- Need for long-term maintainability
- Requirements for high code quality and reliability

We need a type system that:
- Catches errors at compile time rather than runtime
- Provides excellent IDE support with auto-completion
- Documents code through types
- Enables safe refactoring
- Enforces coding standards
- Integrates with our React/Next.js stack
- Works seamlessly with Prisma for database types

## Decision
We will use TypeScript in strict mode with comprehensive type coverage and no implicit any types allowed.

## Consequences

### Positive
- **Type Safety**: Catch type-related bugs at compile time
- **Developer Experience**: Excellent IDE support with IntelliSense
- **Self-Documenting**: Types serve as inline documentation
- **Refactoring Confidence**: Safe refactoring with compiler verification
- **Team Scalability**: Easier onboarding and code understanding
- **API Contracts**: Clear interfaces between components
- **Prisma Integration**: Auto-generated types from database schema
- **Error Reduction**: Studies show 15% reduction in bugs
- **Code Quality**: Enforces better coding practices
- **Ecosystem Support**: Most libraries have TypeScript definitions

### Negative
- **Learning Curve**: Developers need TypeScript knowledge
- **Development Speed**: Initially slower development
- **Build Time**: TypeScript compilation adds build time
- **Complexity**: Type gymnastics can become complex
- **Third-Party Types**: Some libraries lack good type definitions
- **Maintenance**: Types need updating alongside code changes
- **Verbosity**: More code to write with type annotations

## Alternatives Considered

### 1. JavaScript with JSDoc
- **Pros**: No compilation step, optional typing, familiar syntax
- **Cons**: Weaker type checking, poor IDE support, not enforced
- **Reason for rejection**: Insufficient type safety for enterprise application

### 2. Flow
- **Pros**: Similar to TypeScript, gradual typing
- **Cons**: Smaller ecosystem, less tooling, Facebook-centric
- **Reason for rejection**: TypeScript has won the ecosystem battle

### 3. ReScript/ReasonML
- **Pros**: Sound type system, functional programming
- **Cons**: Different syntax, small ecosystem, steep learning curve
- **Reason for rejection**: Too different from JavaScript ecosystem

### 4. TypeScript with Loose Settings
- **Pros**: Easier migration, faster development
- **Cons**: Misses many type errors, false sense of security
- **Reason for rejection**: Defeats purpose of using TypeScript

## Implementation Notes

### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    // Type Checking - Strict Mode
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    
    // Additional Checks
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": true,
    
    // Module Resolution
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    
    // Emit
    "jsx": "preserve",
    "incremental": true,
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    
    // Path Mapping
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["components/*"],
      "@/lib/*": ["lib/*"],
      "@/hooks/*": ["hooks/*"],
      "@/types/*": ["types/*"],
      "@/actions/*": ["actions/*"]
    },
    
    // Next.js
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    ".next",
    "out",
    "public"
  ]
}
```

### Type Definition Patterns

#### 1. API Response Types
```typescript
// types/api.ts
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type ApiError = {
  code: string
  message: string
  details?: Record<string, any>
}
```

#### 2. Database Model Types
```typescript
// types/models.ts
import { User, Course, Enrollment, Purchase } from '@prisma/client'

// Extended types with relations
export type UserWithCourses = User & {
  courses: Course[]
  Enrollment: Enrollment[]
}

export type CourseWithDetails = Course & {
  user: User
  chapters: ChapterWithSections[]
  _count: {
    Enrollment: number
    Purchase: number
    reviews: number
  }
  averageRating?: number
}

// Input types for mutations
export type CreateCourseInput = Pick<Course, 'title' | 'description'> & {
  categoryId?: string
  price?: number
}

export type UpdateCourseInput = Partial<CreateCourseInput>
```

#### 3. React Component Props
```typescript
// components/CourseCard.tsx
interface CourseCardProps {
  course: CourseWithDetails
  userId?: string
  onEnroll?: (courseId: string) => Promise<void>
  variant?: 'default' | 'compact' | 'featured'
  className?: string
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  userId,
  onEnroll,
  variant = 'default',
  className,
}) => {
  // Implementation
}
```

#### 4. Hook Types
```typescript
// hooks/use-courses.ts
interface UseCoursesOptions {
  userId?: string
  categoryId?: string
  search?: string
  page?: number
  pageSize?: number
}

interface UseCoursesReturn {
  courses: CourseWithDetails[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  hasMore: boolean
  loadMore: () => Promise<void>
}

export function useCourses(options: UseCoursesOptions = {}): UseCoursesReturn {
  // Implementation
}
```

#### 5. Utility Types
```typescript
// types/utilities.ts

// Make all properties optional recursively
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Pick only methods from a type
export type Methods<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K]
}

// Await type for async functions
export type Awaited<T> = T extends Promise<infer U> ? U : T

// Extract array element type
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never

// Nullable type
export type Nullable<T> = T | null | undefined

// Type guards
export function isNotNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}
```

#### 6. Form Types with Zod
```typescript
// lib/validations/course.ts
import { z } from 'zod'

export const courseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().min(10).max(1000),
  categoryId: z.string().uuid().optional(),
  price: z.number().min(0).max(10000).optional(),
  isPublished: z.boolean().default(false),
})

export type CourseFormData = z.infer<typeof courseSchema>

// Form validation hook
export function useCourseForm() {
  return useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      isPublished: false,
    },
  })
}
```

#### 7. NextAuth Type Augmentation
```typescript
// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from 'next-auth'
import { Role } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
      isTwoFactorEnabled: boolean
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: Role
    isTwoFactorEnabled: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    isTwoFactorEnabled: boolean
  }
}
```

#### 8. Environment Variables
```typescript
// types/env.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Database
      DATABASE_URL: string
      DATABASE_URL_UNPOOLED: string
      
      // Auth
      NEXTAUTH_URL: string
      NEXTAUTH_SECRET: string
      
      // OAuth
      GOOGLE_CLIENT_ID: string
      GOOGLE_CLIENT_SECRET: string
      GITHUB_ID: string
      GITHUB_SECRET: string
      
      // Redis
      UPSTASH_REDIS_REST_URL: string
      UPSTASH_REDIS_REST_TOKEN: string
      
      // AI
      OPENAI_API_KEY: string
      ANTHROPIC_API_KEY: string
      
      // Storage
      CLOUDINARY_URL: string
      
      // Environment
      NODE_ENV: 'development' | 'production' | 'test'
      VERCEL_ENV?: 'production' | 'preview' | 'development'
    }
  }
}

export {}
```

### Type Safety Patterns

#### 1. Discriminated Unions
```typescript
type LoadingState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: any }
  | { status: 'error'; error: Error }

function handleState(state: LoadingState) {
  switch (state.status) {
    case 'idle':
      return 'Ready to load'
    case 'loading':
      return 'Loading...'
    case 'success':
      return state.data // TypeScript knows data exists here
    case 'error':
      return state.error.message // TypeScript knows error exists here
  }
}
```

#### 2. Type Predicates
```typescript
function isError(result: any): result is Error {
  return result instanceof Error
}

function isApiResponse<T>(obj: any): obj is ApiResponse<T> {
  return (
    typeof obj === 'object' &&
    'success' in obj &&
    typeof obj.success === 'boolean'
  )
}
```

#### 3. Const Assertions
```typescript
const PERMISSIONS = {
  COURSE_CREATE: 'course:create',
  COURSE_READ: 'course:read',
  COURSE_UPDATE: 'course:update',
  COURSE_DELETE: 'course:delete',
} as const

type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]
// Type: 'course:create' | 'course:read' | 'course:update' | 'course:delete'
```

### ESLint TypeScript Rules
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
  },
}
```

## Migration Strategy
1. Enable strict mode incrementally using `strictNullChecks` first
2. Fix existing type errors file by file
3. Add `// @ts-expect-error` for temporary suppressions
4. Gradually remove all `any` types
5. Add types to all function parameters and returns
6. Document complex types with JSDoc comments

## Best Practices
1. **Prefer interfaces over types** for object shapes
2. **Use enums sparingly**, prefer const assertions
3. **Avoid type assertions**, use type guards instead
4. **Export types separately** from implementations
5. **Use generic constraints** to limit type parameters
6. **Leverage utility types** from TypeScript and libraries
7. **Type function parameters**, not just returns
8. **Use unknown instead of any** when type is truly unknown

## References
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Effective TypeScript](https://effectivetypescript.com/)
- [Type Challenges](https://github.com/type-challenges/type-challenges)

## Date
2024-01-22

## Authors
- Taxomind Architecture Team