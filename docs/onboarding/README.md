# Developer Onboarding Guide

Welcome to the Taxomind engineering team! This guide will help you get up and running with our Next.js 15-based intelligent learning management system.

## 🚀 Quick Start (30 minutes)

### Prerequisites
- **Node.js 20+** and npm
- **Docker** (for local PostgreSQL)
- **Git** and GitHub access
- **Code Editor** (VS Code recommended)

### 1. Repository Setup
```bash
# Clone the repository
git clone https://github.com/your-org/taxomind.git
cd taxomind

# Install dependencies
npm ci

# Copy environment file
cp .env.example .env.local
```

### 2. Database Setup
```bash
# Start PostgreSQL in Docker (port 5433)
npm run dev:docker:start

# If container doesn't exist, create it
npm run dev:docker:reset

# Initialize database with schema and seed data
npm run dev:setup
```

### 3. Environment Configuration
Edit `.env.local` with your settings:
```bash
# Required for development
DATABASE_URL="postgresql://postgres:dev_password_123@localhost:5433/taxomind_dev"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional for full features
GOOGLE_CLIENT_ID="your-google-oauth-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-secret"
UPSTASH_REDIS_REST_URL="your-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
```

### 4. Start Development
```bash
# Validate environment
npm run validate:env

# Start development server
npm run dev

# Open http://localhost:3000
```

## 📚 Architecture Overview

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5 with MFA support
- **Styling**: Tailwind CSS with Radix UI components
- **State Management**: Zustand + React Query
- **Cache**: Redis/Upstash for performance
- **AI Integration**: OpenAI + Anthropic SDKs

### Project Structure
```
taxomind/
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Role-based dashboards
│   ├── api/               # 100+ API endpoints
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
├── lib/                   # Utilities and configurations
├── actions/               # Server actions
├── hooks/                 # Custom React hooks
├── prisma/               # Database schema and migrations
├── docs/                 # Documentation
└── __tests__/            # Test suites
```

### Key Concepts

#### 1. Role-Based Access Control (RBAC)
```typescript
// User roles: ADMIN, USER
// Middleware handles route protection
// Check user role in components:
const { data: session } = useSession();
if (session?.user?.role === 'ADMIN') {
  // Admin-only content
}
```

#### 2. Database Relations
```typescript
// Use EXACT model names for relations
const course = await db.course.findUnique({
  include: {
    Purchase: true,    // Capital 'P'
    Enrollment: true,  // Capital 'E'
    user: true,        // Lowercase as defined in schema
  },
});
```

#### 3. React Hook Dependencies
```typescript
// ALWAYS include ALL dependencies
useEffect(() => {
  fetchData(userId, courseId);
}, [userId, courseId]); // Include both variables
```

## 🛠️ Development Workflow

### Daily Development
```bash
# Start your day
npm run dev:docker:start  # Start database
npm run dev              # Start application

# Before coding
git pull origin main     # Get latest changes
npm run validate:env     # Check environment

# While coding
npm run lint            # Check code style (REQUIRED)
npm run typecheck       # Check TypeScript

# Before committing
npm run lint            # MANDATORY - fixes React hooks, HTML entities
npm run build           # Verify build succeeds
npm run test:unit       # Run relevant tests
```

### Code Style Requirements

#### ✅ Always Do
```typescript
// 1. Use Next.js Image component
import Image from 'next/image';
<Image src={user.avatar} alt="User" width={40} height={40} />

// 2. Include all hook dependencies
useEffect(() => {
  processData(data, isLoading);
}, [data, isLoading]); // Include ALL variables used

// 3. Use HTML entities
<span>User&apos;s Profile</span>

// 4. Use exact Prisma relation names
include: { Enrollment: true, Purchase: true }
```

#### ❌ Never Do
```typescript
// 1. Regular img tags
<img src={avatar} alt="User" /> // Use Image component instead

// 2. Missing hook dependencies
useEffect(() => {
  processData(data, isLoading);
}, []); // Missing dependencies

// 3. Unescaped apostrophes
<span>User's Profile</span> // Use &apos; instead

// 4. Wrong relation names
include: { enrollment: true } // Should be Enrollment
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
npm run lint              # REQUIRED before commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
# Create PR on GitHub
```

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run e2e

# Performance tests
npm run test:performance

# All tests
npm run test:all
```

### Writing Tests
```typescript
// Example unit test
import { render, screen } from '@testing-library/react';
import { CourseCard } from '@/components/course-card';

describe('CourseCard', () => {
  it('should display course title', () => {
    render(<CourseCard title="Test Course" />);
    expect(screen.getByText('Test Course')).toBeInTheDocument();
  });
});
```

## 🔐 Security & Authentication

### Authentication System
- **NextAuth.js v5** with multiple providers
- **MFA/TOTP** required for admin users
- **Session management** with JWT + database sessions
- **Role-based access control** (RBAC)

### Security Best Practices
```typescript
// 1. Always validate inputs
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

// 2. Use server actions for mutations
'use server';
export async function createCourse(data: CourseData) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  // Process data...
}

// 3. Implement proper error handling
try {
  const result = await apiCall();
  return { success: true, data: result };
} catch (error) {
  return { success: false, error: 'Operation failed' };
}
```

## 📊 Database & API

### Prisma Workflow
```bash
# Schema changes
npx prisma db push        # Push schema to database
npx prisma generate       # Update Prisma client
npx prisma studio         # Visual database browser

# Migrations (production)
npx prisma migrate dev    # Create migration
npx prisma migrate deploy # Deploy to production
```

### API Development
```typescript
// API route example (app/api/courses/route.ts)
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const courses = await db.course.findMany({
      include: { Purchase: true, Enrollment: true },
    });

    return Response.json({ courses });
  } catch (error) {
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

## 🎨 UI/UX Development

### Component Library
- **Radix UI** primitives for accessibility
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Custom components** in `/components`

### Creating Components
```typescript
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export function StatusCard({ status, message }: StatusCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        {status === 'success' ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
        )}
        <span className="text-sm">{message}</span>
      </div>
    </Card>
  );
}
```

## 🚨 Common Gotchas

### 1. Environment Safety
```bash
# Development uses port 5433 (not 5432)
# STRICT_ENV_MODE prevents production data access
# Always validate environment: npm run validate:env
```

### 2. React Hooks
```typescript
// Missing dependencies cause stale closures
useEffect(() => {
  if (userId && isActive) {
    fetchUserData(userId);
  }
}, [userId, isActive]); // Include ALL variables used
```

### 3. Prisma Relations
```typescript
// Relation names are case-sensitive
const user = await db.user.findUnique({
  include: {
    Enrollment: true,  // ✅ Correct
    enrollment: true,  // ❌ Wrong
  },
});
```

### 4. Build Failures
```bash
# Always run before committing
npm run lint      # Fixes React hooks, HTML entities
npm run typecheck # Catches TypeScript errors
npm run build     # Verifies complete build
```

## 📖 Essential Documentation

### Must-Read Documents
1. **[CLAUDE.md](../CLAUDE.md)** - Complete project guide
2. **[Architecture ADRs](../architecture/adrs/)** - Technical decisions
3. **[API Documentation](../api/)** - API reference with Swagger
4. **[Deployment Guides](../deployment/)** - Environment setup
5. **[Troubleshooting](../troubleshooting/)** - Common issues

### Quick Reference
- **API Docs**: http://localhost:3000/api/docs
- **Database Studio**: `npm run dev:db:studio`
- **Storybook**: `npm run storybook` (if available)
- **Bundle Analyzer**: `npm run bundle:analyze`

## 🤝 Team & Support

### Getting Help
1. **Check Documentation**: Start with this guide and CLAUDE.md
2. **Search Issues**: Check GitHub issues for similar problems
3. **Ask Team**: Use team Slack channels
4. **Create Issue**: Include error messages and reproduction steps

### Code Review Process
1. Create feature branch from `main`
2. Run `npm run lint` before committing
3. Push and create Pull Request
4. Request review from team members
5. Address feedback and merge

### Team Contacts
- **Technical Lead**: [Name] - Architecture questions
- **DevOps**: [Name] - Deployment and infrastructure
- **Product**: [Name] - Feature requirements
- **Design**: [Name] - UI/UX guidelines

## 🎯 Learning Path

### Week 1: Foundation
- [ ] Complete this onboarding guide
- [ ] Set up local development environment
- [ ] Read CLAUDE.md completely
- [ ] Explore database schema in Prisma Studio
- [ ] Run all test suites

### Week 2: Codebase Exploration
- [ ] Review architecture ADRs
- [ ] Understand authentication flow
- [ ] Explore API endpoints
- [ ] Review component library
- [ ] Make first small contribution

### Week 3: Feature Development
- [ ] Pick up first feature ticket
- [ ] Implement with tests
- [ ] Follow code review process
- [ ] Deploy to staging
- [ ] Monitor production metrics

### Week 4: Mastery
- [ ] Contribute to documentation
- [ ] Help with code reviews
- [ ] Optimize performance
- [ ] Suggest improvements
- [ ] Mentor next new hire

## 🔧 Tools & Extensions

### VS Code Extensions
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### Development Tools
- **Database**: Prisma Studio, TablePlus, pgAdmin
- **API Testing**: Postman, Insomnia, Thunder Client
- **Git**: GitHub Desktop, GitKraken, or command line
- **Design**: Figma (for design specs)

---

## ✅ Onboarding Checklist

- [ ] Repository cloned and dependencies installed
- [ ] Local database running and seeded
- [ ] Environment variables configured
- [ ] Development server running successfully
- [ ] Tests passing locally
- [ ] First commit made with proper linting
- [ ] Documentation read and understood
- [ ] Team introductions completed
- [ ] Development tools installed and configured
- [ ] Ready to contribute! 🎉

**Welcome to the team! Start with a small contribution and gradually take on larger features. Don't hesitate to ask questions—we're here to help you succeed!**

---

**Next Steps**: 
1. Read [CLAUDE.md](../CLAUDE.md) for complete project details
2. Explore [API Documentation](http://localhost:3000/api/docs)
3. Check [Troubleshooting Guide](../troubleshooting/) for common issues