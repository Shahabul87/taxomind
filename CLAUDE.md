# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Taxomind** is an intelligent learning management system (LMS) built with Next.js 15, featuring AI-powered adaptive learning, real-time analytics, and enterprise-grade security. The platform supports multiple learning paths with role-based access control for students, teachers, and administrators.

IMPORTANT: Always check build errors, lint error, unescaped entities errors, terminal errors after generating code

## Essential Development Commands

### Core Development
```bash
# Start development server (uses local PostgreSQL on port 5433)
npm run dev

# Production build and type checking
npm run build
npm run lint
npx prisma generate

# Testing
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
npm run test:ci          # CI mode
```

### Local Development Environment
```bash
# Database setup (uses Docker PostgreSQL on port 5433)
npm run dev:docker:start    # Start local PostgreSQL container
npm run dev:setup          # Reset and seed database
npm run dev:db:seed        # Seed with test data only
npm run dev:db:studio      # Open Prisma Studio

# Container management
npm run dev:docker:stop    # Stop container
npm run dev:docker:reset   # Recreate container
```

### Enterprise Commands
```bash
# Enterprise-grade validation and deployment
npm run enterprise:validate                # Validate development setup
npm run enterprise:deploy:staging          # Deploy to staging
npm run enterprise:deploy:production       # Deploy to production
npm run enterprise:health                  # System health check
npm run enterprise:audit                   # View audit logs
```

## Architecture Overview

### Next.js 15 App Router Structure
```
app/
├── (auth)/           # Authentication pages
├── (course)/         # Course learning interface
├── (dashboard)/      # Role-based dashboards
├── (homepage)/       # Public homepage
├── (protected)/      # Protected routes with role guards
└── api/             # API routes with comprehensive endpoints
```

### Key Architectural Patterns

#### 1. Role-Based Access Control
- **Middleware**: `middleware.ts` handles route protection and role-based redirects
- **User Roles**: `ADMIN`, `USER` (defined in Prisma schema)
- **Route Protection**: Uses `routes.ts` for public, protected, and admin routes
- **Authentication**: NextAuth.js v5 with multi-provider support

#### 2. Database Architecture
- **ORM**: Prisma with PostgreSQL
- **Connection**: Singleton pattern in `lib/db.ts`
- **Models**: Comprehensive schema with 50+ models for learning management
- **Relations**: Complex relationships between User, Course, Chapter, Section, Purchase, Enrollment

#### 3. AI Integration
- **Content Generation**: AI-powered course and chapter creation
- **Adaptive Learning**: Personalized question generation and difficulty adjustment
- **Analytics**: Real-time learning analytics and progress tracking
- **Libraries**: OpenAI SDK, Anthropic SDK for content generation

#### 4. Component Architecture
- **UI Components**: Radix UI primitives with Tailwind CSS
- **Reusable Components**: Extensive component library in `components/`
- **Server Components**: Leverage Next.js 15 Server Components for performance
- **Client Components**: Marked with 'use client' directive where needed

#### 5. Next.js Image Optimization - CRITICAL RULE

### ✅ CORRECT: Always Use Next.js Image Component
```typescript
// ALWAYS use Next.js Image component for better performance and SEO
import Image from 'next/image';

// For user avatars, profile pictures, etc.
<Image
  src={user.image}
  alt={user.name || "User"}
  width={40}
  height={40}
  className="w-full h-full object-cover rounded-full"
/>

// For responsive images with fill
<div className="relative w-full h-48">
  <Image
    src="/course-thumbnail.jpg"
    alt="Course thumbnail"
    fill
    className="object-cover"
  />
</div>
```

### ❌ AVOID: Regular img Tags
```typescript
// ❌ NEVER use regular img tags - causes ESLint warnings and performance issues
<img src={user.image} alt={user.name} className="w-10 h-10" />
```

### 📋 Image Component Best Practices
1. **Always provide width and height**: Required for layout stability
2. **Use descriptive alt text**: Essential for accessibility and SEO
3. **Use fill for responsive containers**: When dimensions are unknown
4. **Import Image from next/image**: `import Image from 'next/image'`
5. **Combine with Tailwind classes**: For responsive styling
6. **Handle loading states**: Use `loading="lazy"` for below-the-fold images

## Database Query Patterns

### ✅ CORRECT: Current Database Relations
```typescript
// Use these actual model relations from the schema
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
    } : false,
    Enrollment: true,
    reviews: {
      select: {
        rating: true,
      },
    },
    _count: {
      select: {
        Purchase: true,
        Enrollment: true,
        reviews: true,
        chapters: true,
      },
    },
  },
});
```

### ❌ AVOID: Common Database Errors
```typescript
// DON'T use non-existent relations
const courses = await db.course.findMany({
  include: {
    enrollments: true, // ❌ Use 'Enrollment' instead
    userCourseEnrollments: true, // ❌ Table doesn't exist
  },
});
```

## Prisma Relation Naming Conventions - CRITICAL

### ⚠️ IMPORTANT: Prisma Relations Use Exact Model Names
Prisma relation fields use the **exact model name** as defined in the schema, which are typically capitalized. This is a common source of TypeScript errors.

### ✅ CORRECT: Use Capitalized Model Names in Relations
```typescript
// When including relations, use the EXACT model name from schema
const user = await db.user.findUnique({
  include: {
    Enrollment: true,        // ✅ Correct - matches model name
    Course: true,           // ✅ Correct - matches model name
    Purchase: true,         // ✅ Correct - matches model name
  },
});

// When accessing nested relations
const enrollment = await db.enrollment.findFirst({
  include: {
    Course: {              // ✅ Correct - capital 'C' for Course model
      include: {
        user: true,        // ✅ Correct - lowercase 'user' as defined in Course model
      },
    },
    User: true,            // ✅ Correct - capital 'U' for User model
  },
});
```

### ❌ AVOID: Using Lowercase for Model Relations
```typescript
// These will cause TypeScript errors
const user = await db.user.findUnique({
  include: {
    enrollment: true,      // ❌ Wrong - should be 'Enrollment'
    course: true,         // ❌ Wrong - should be 'Course' if it exists
    purchase: true,       // ❌ Wrong - should be 'Purchase'
  },
});

// Accessing relations incorrectly
enrollment.course         // ❌ Wrong - should be enrollment.Course
enrollment.user          // ❌ Wrong - should be enrollment.User
```

### 📋 Quick Reference for Common Relations
Based on our schema:
- **User** model has: `Enrollment`, `courses` (authored), NOT direct `Purchase`
- **Enrollment** model has: `Course`, `User`
- **Purchase** model has: `Course` (no User relation defined in Purchase)
- **Course** model has: `user` (author), `Purchase`, `Enrollment`, `chapters`

### 🔍 How to Verify Relation Names
1. Check `prisma/schema.prisma` for the exact relation field names
2. Look for the model definition and its relations
3. Use `npx prisma studio` to visually explore relations
4. Run `npx prisma generate` after schema changes to update TypeScript types

## Key Technical Decisions

### 1. Environment Safety
- **Local Development**: Port 5433 PostgreSQL to avoid conflicts
- **Environment Isolation**: `lib/db-environment.ts` prevents production data access from development
- **Safety Guards**: Destructive operations only allowed in development mode

### 2. Authentication Flow
- **NextAuth.js v5**: Latest version with enhanced security
- **Multi-Provider**: Google, GitHub, credentials-based authentication
- **Session Management**: JWT strategy with secure session handling
- **Role-Based Redirects**: Automatic redirect to appropriate dashboard based on user role

### 3. API Route Structure
- **Comprehensive API**: 100+ API endpoints under `app/api/`
- **Route Groups**: Organized by feature (analytics, courses, auth, etc.)
- **Middleware Protection**: API routes skip middleware for performance
- **Type Safety**: Full TypeScript integration with Prisma types

### 4. Testing Strategy
- **Jest Configuration**: Comprehensive test setup with coverage thresholds
- **Test Types**: Unit, integration, and e2e testing support
- **Coverage**: 70% minimum threshold for branches, functions, lines, statements
- **Path Mapping**: Matches application path aliases

## Lucide React Icon Import Best Practices

### ✅ CORRECT Icon Names
When importing icons from lucide-react, ensure you use the correct icon names:
```typescript
// ✅ Correct icon names
import { 
  BarChart3,    // NOT ChartBar
  Shield,       // Available icon
  X,            // Available icon
  Brain,        // Available icon
  // ... other icons
} from 'lucide-react';
```

### ❌ Common Icon Name Mistakes
```typescript
// ❌ These icon names don't exist in lucide-react
ChartBar     // Use BarChart3 instead
ChartLine    // Use LineChart instead
BarGraph     // Use BarChart3 instead
```

### 📋 Icon Import Checklist
1. **Always verify icon names**: Check lucide.dev for the exact icon name
2. **Import all used icons**: Ensure every icon used in JSX is imported
3. **Use consistent naming**: Follow the exact casing from lucide-react
4. **Group imports**: Keep all lucide-react imports together

### Example of Complete Icon Import
```typescript
import { 
  Activity, 
  ArrowRight,
  BarChart3,     // For bar charts
  Brain,         // For AI/intelligence features
  CheckCircle2,  // For success states
  Shield,        // For security/protection
  X,             // For close/cancel actions
  Zap            // For quick actions
} from 'lucide-react';
```

## Common Development Patterns

### 1. Server Actions
```typescript
// actions/get-courses.ts pattern
export const getCourses = async (params: GetCoursesParams) => {
  try {
    const courses = await db.course.findMany({
      where: conditions,
      include: standardIncludes,
    });
    return { success: true, data: courses };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### 2. Component Patterns
```typescript
// Standard component pattern with proper typing
interface ComponentProps {
  courseId: string;
  userId?: string;
}

export const CourseComponent = ({ courseId, userId }: ComponentProps) => {
  // Implementation
};
```

### 3. Error Handling
```typescript
// Consistent error handling pattern
try {
  const result = await someOperation();
  return { success: true, data: result };
} catch (error) {
  console.error('Operation failed:', error);
  return { success: false, error: 'Operation failed' };
}
```

## React Hook and ESLint Best Practices

### 1. React Hook Dependencies - CRITICAL RULES

#### ✅ CORRECT: useEffect with Complete Dependencies
```typescript
// ALWAYS include ALL dependencies that are used inside the hook
useEffect(() => {
  const fetchData = async () => {
    if (courseId && userId) {
      const data = await getCourse(courseId, userId);
      setData(data);
    }
  };
  fetchData();
}, [courseId, userId]); // Include ALL variables used inside useEffect
```

#### ✅ CORRECT: useCallback with Complete Dependencies
```typescript
// ALWAYS include ALL dependencies for useCallback
const handleSubmit = useCallback(async () => {
  if (formData.title && formData.description && !isLoading) {
    await submitForm(formData);
  }
}, [formData.title, formData.description, formData, isLoading]); // Include ALL variables used inside callback
```

#### ❌ AVOID: Missing Dependencies
```typescript
// ❌ NEVER do this - missing dependencies cause stale closures
useEffect(() => {
  fetchData(courseId, userId);
}, []); // Missing courseId and userId dependencies

// ❌ NEVER do this - missing function dependencies
const handleClick = useCallback(() => {
  processData(formData);
}, []); // Missing formData dependency
```

### 2. Function Dependencies in useEffect

#### ✅ CORRECT: Wrap Functions in useCallback
```typescript
// When a function is used as a dependency, wrap it in useCallback
const fetchUserData = useCallback(async () => {
  if (!userId || isLoading) return;
  
  try {
    const userData = await getUserById(userId);
    setUserData(userData);
  } catch (error) {
    console.error('Error fetching user:', error);
  }
}, [userId, isLoading]); // Include all dependencies used inside the function

// Then use it in useEffect
useEffect(() => {
  fetchUserData();
}, [fetchUserData]); // Include the wrapped function as dependency
```

#### ✅ CORRECT: Alternative - Move Function Inside useEffect
```typescript
// Alternative: Move the function inside useEffect to avoid dependency issues
useEffect(() => {
  const fetchUserData = async () => {
    if (!userId || isLoading) return;
    
    try {
      const userData = await getUserById(userId);
      setUserData(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };
  
  fetchUserData();
}, [userId, isLoading]); // Only include primitive dependencies
```

### 3. HTML Entity Escaping

#### ✅ CORRECT: Use HTML Entities for Apostrophes
```typescript
// ALWAYS use &apos; for apostrophes in JSX
<span>SAM&apos;s AI Assistant</span>
<p>User&apos;s Profile Settings</p>
<div>Don&apos;t forget to save</div>
```

#### ❌ AVOID: Unescaped Apostrophes
```typescript
// ❌ NEVER use raw apostrophes in JSX
<span>SAM's AI Assistant</span>     // ESLint error
<p>User's Profile Settings</p>      // ESLint error
<div>Don't forget to save</div>     // ESLint error
```

### 4. State Dependencies Pattern

#### ✅ CORRECT: Include State Variables in Dependencies
```typescript
// When using state variables in hooks, include them in dependencies
const [isGenerating, setIsGenerating] = useState(false);
const [formData, setFormData] = useState(initialData);

const generateContent = useCallback(async () => {
  if (isGenerating || !formData.title) return; // Using state variables
  
  setIsGenerating(true);
  try {
    const content = await generateAIContent(formData);
    setContent(content);
  } finally {
    setIsGenerating(false);
  }
}, [isGenerating, formData.title, formData]); // Include ALL state variables used
```

### 5. Complex Object Dependencies

#### ✅ CORRECT: Handle Complex Object Dependencies
```typescript
// When using complex objects, include specific properties
const formData = {
  courseTitle: '',
  courseOverview: '',
  courseCategory: '',
  targetAudience: '',
  // ... other properties
};

const validateForm = useCallback(() => {
  if (formData.courseTitle && formData.courseOverview) {
    return true;
  }
  return false;
}, [
  formData.courseTitle,     // Include specific properties
  formData.courseOverview,
  formData.courseCategory,
  formData.targetAudience,
  formData                  // Include the entire object as backup
]);
```

### 6. Timeout and Cleanup Dependencies

#### ✅ CORRECT: Include Cleanup Functions in Dependencies
```typescript
// When using timeouts or intervals, include cleanup dependencies
useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (searchQuery && searchQuery.length > 2 && !isSearching) {
      performSearch(searchQuery);
    }
  }, 500);

  return () => clearTimeout(timeoutId);
}, [searchQuery, isSearching, performSearch]); // Include ALL dependencies used
```

### 7. Mandatory ESLint Rules to Follow

#### A. React Hooks Rules
- `react-hooks/exhaustive-deps`: ALWAYS include all dependencies
- `react-hooks/rules-of-hooks`: Use hooks only at the top level

#### B. JSX Rules
- `react/no-unescaped-entities`: Use HTML entities for special characters
- `react/jsx-key`: Provide unique keys for list items

#### C. Next.js Optimization Rules
- `@next/next/no-img-element`: ALWAYS use Next.js Image component instead of `<img>`
- `@next/next/no-page-custom-font`: Use Next.js font optimization
- `@next/next/no-css-tags`: Use Next.js built-in CSS support

#### D. Example of Complete Hook Pattern
```typescript
// COMPLETE EXAMPLE: All best practices combined
const MyComponent = ({ courseId, userId }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // ✅ Proper useCallback with all dependencies
  const fetchCourseData = useCallback(async () => {
    if (!courseId || !userId || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const courseData = await getCourseData(courseId, userId);
      setData(courseData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, userId, isLoading]); // All dependencies included

  // ✅ Proper useEffect with function dependency
  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]); // Include the wrapped function

  // ✅ Proper timeout cleanup
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (data && !isLoading) {
        console.log('Data loaded successfully');
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [data, isLoading]); // All dependencies included

  return (
    <div>
      {/* ✅ Proper HTML entity usage */}
      <h1>User&apos;s Course: {data?.title}</h1>
      <p>Course Creator&apos;s Dashboard</p>
    </div>
  );
};
```

### 8. Quick Reference Checklist

Before writing any component with hooks:

1. **✅ useEffect Dependencies**: Include ALL variables used inside the effect
2. **✅ useCallback Dependencies**: Include ALL variables used inside the callback
3. **✅ Function Dependencies**: Wrap functions in useCallback if used as dependencies
4. **✅ State Dependencies**: Include state variables used in conditions
5. **✅ Object Dependencies**: Include specific object properties used
6. **✅ HTML Entities**: Use `&apos;` for apostrophes, `&quot;` for quotes
7. **✅ Cleanup Functions**: Include cleanup dependencies in useEffect
8. **✅ Next.js Image Component**: Use `Image` from `next/image` instead of `<img>` tags
9. **✅ Always Run**: `npm run lint` before committing to catch issues early

### 9. Common Pitfalls to Avoid

#### ❌ NEVER Do These:
```typescript
// ❌ Empty dependency array when variables are used
useEffect(() => {
  doSomething(prop1, prop2);
}, []); // Should include [prop1, prop2]

// ❌ Missing function dependencies
const callback = useCallback(() => {
  handleData(formData);
}, []); // Should include [formData]

// ❌ Unescaped apostrophes
<span>User's Profile</span> // Should be User&apos;s Profile

// ❌ Missing state dependencies
const handler = useCallback(() => {
  if (isLoading) return; // Using isLoading but not in dependencies
  processData();
}, [processData]); // Should include [isLoading, processData]

// ❌ Using regular img tags instead of Next.js Image component
<img src={user.avatar} alt="User avatar" className="w-10 h-10" />
// Should be: 
import Image from 'next/image';
<Image src={user.avatar} alt="User avatar" width={40} height={40} className="w-10 h-10" />
```

This comprehensive guide ensures all React Hook and ESLint issues are prevented during development.

## Schema Verification Commands

```bash
# Essential database commands
npx prisma db pull        # Sync with actual database
npx prisma generate       # Update Prisma client
npx prisma studio         # Visual database browser
npx prisma migrate dev    # Apply migrations in development
```

## Enterprise Features

### 1. Analytics System
- **Real-time Analytics**: Live user engagement tracking
- **Learning Analytics**: Course progress and performance metrics
- **Predictive Analytics**: AI-powered learning outcome predictions
- **Role-based Dashboards**: Different analytics views for different user types

### 2. Content Management
- **AI Content Generation**: Automated course and chapter creation
- **Version Control**: Content versioning and approval workflows
- **Template System**: Reusable content templates
- **Media Management**: Cloudinary integration for asset management

### 3. Security Features
- **Audit Logging**: Comprehensive activity tracking
- **Rate Limiting**: API protection with Upstash Redis
- **Data Protection**: GDPR-compliant data handling
- **Enterprise SSO**: Support for enterprise authentication providers
- **EnterpriseDB**: Enhanced database layer with audit trails and safety checks
- **Strict Environment Mode**: Production data protection with `STRICT_ENV_MODE=true`

## Development Workflow

### 1. Before Making Changes
- Check current database schema in `prisma/schema.prisma`
- Verify environment variables are set correctly
- Ensure local development database is running

### 2. Making Database Changes
- Use direct Prisma queries, avoid complex query optimizers
- Test queries in Prisma Studio before implementing
- Always include proper error handling
- **For Critical Operations**: Use EnterpriseDB for user management, financial records, and deletions:
  ```typescript
  import { getEnterpriseDB } from '@/lib/db-migration';
  
  const enterpriseDb = getEnterpriseDB({
    userContext: { id: user.id, role: user.role },
    auditEnabled: true
  });
  
  // Operations are audited and protected
  await enterpriseDb.user.delete({ where: { id } });
  ```

### 3. After Making Changes
```bash
npm run lint              # Check code style - MANDATORY before committing
npm run validate:env      # Validate environment configuration
npm run build            # Verify build succeeds (includes env validation)
npm run test             # Run test suite
npx prisma generate      # Update Prisma client if schema changed
```

**CRITICAL**: Always run `npm run lint` after making any React component changes to catch:
- Missing useEffect/useCallback dependencies
- Unescaped HTML entities
- Regular `<img>` tags instead of Next.js `Image` component
- Other ESLint rule violations

## Important Files and Locations

### Configuration Files
- `next.config.js` - Next.js configuration with image optimization
- `tailwind.config.js` - Tailwind CSS configuration
- `prisma/schema.prisma` - Database schema
- `auth.ts` - Authentication configuration
- `middleware.ts` - Route protection and role-based access

### Key Directories
- `app/api/` - API routes (100+ endpoints)
- `components/` - Reusable UI components
- `lib/` - Utility functions and configurations
- `actions/` - Server actions for data fetching
- `hooks/` - Custom React hooks

### Development Files
- `scripts/dev-seed.ts` - Development database seeding
- `lib/db-environment.ts` - Environment safety utilities
- `ENTERPRISE_GUIDE.md` - Enterprise deployment guide
- `DEPLOYMENT.md` - Environment-specific deployment instructions

## Notes for Future Development

- Always use simple, direct Prisma queries over complex abstractions
- Verify relation names match the actual schema before using them
- Test database queries in isolation before integrating into components
- Use the enterprise-grade safety features for production deployments
- Follow the established patterns for authentication and authorization
- Keep the CLAUDE.md file updated when making significant architectural changes
- **Critical Operations**: Always use EnterpriseDB for operations involving:
  - User deletions or role changes
  - Financial records (bills, payments, purchases)
  - Course/content deletions
  - Any operation that needs audit trails
- **Environment Safety**: Production and staging have `STRICT_ENV_MODE=true` enabled
- **Build Validation**: All builds now include automatic environment validation

---

*Last updated: January 2025*
*Architecture: Next.js 15 + Prisma + PostgreSQL + NextAuth.js v5*
*Database: Purchase/Enrollment-based system with enterprise safety features*
*Local Development: Docker PostgreSQL on port 5433 with complete environment isolation*
*ESLint: Comprehensive React Hook and HTML entity validation enabled*