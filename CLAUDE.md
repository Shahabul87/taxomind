# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Taxomind** is an intelligent learning management system (LMS) built with Next.js 15, featuring AI-powered adaptive learning, real-time analytics, and enterprise-grade security. The platform supports multiple learning paths with role-based access control for students, teachers, and administrators.

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
npm run lint              # Check code style
npm run validate:env      # Validate environment configuration
npm run build            # Verify build succeeds (includes env validation)
npm run test             # Run test suite
npx prisma generate      # Update Prisma client if schema changed
```

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