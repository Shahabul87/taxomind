# CLAUDE.md

**Taxomind** - Enterprise LMS with Next.js 15, AI-powered learning, and role-based access control.

---

## 🔥 THE GOLDEN RULES (Never Lose Data)

**⚠️ READ THIS FIRST - These rules prevent production failures and data loss**

### ✅ Rule #1: New Fields = Optional or Default

**The Problem**: Adding required fields to existing database tables causes Railway builds to fail because existing rows have no data for the new field.

```prisma
// ✅ SAFE - Will deploy successfully
model User {
  id    String   @id @default(cuid())
  email String   @unique
  bio   String?              // Optional - existing users can have NULL
  views Int      @default(0) // Has default - existing users get 0
}

// ❌ UNSAFE - WILL CRASH RAILWAY BUILD!
model User {
  id    String   @id @default(cuid())
  email String   @unique
  bio   String  // ERROR: Existing users have no bio data!
}
```

**Safe Field Patterns:**
| Type | Safe Pattern | Example |
|------|-------------|---------|
| String | `String?` or `@default("")` | `bio String?` |
| Int | `Int?` or `@default(0)` | `views Int @default(0)` |
| Boolean | `@default(false)` | `isActive Boolean @default(false)` |
| DateTime | `@default(now())` | `joinedAt DateTime @default(now())` |
| String[] | `@default([])` | `tags String[] @default([])` |
| Relations | Always safe | `posts Post[]` |

### ✅ Rule #2: Test Locally → Push → Auto-Deploy

**Railway automatically deploys when you push - make sure it works locally first!**

```bash
# Your simple workflow:
npx prisma migrate dev --name add_user_bio
git add prisma/ && git commit -m "feat: add bio field" && git push

# Railway automatically:
# ✅ Validates migration
# ✅ Applies it safely
# ✅ Starts app with new schema
```

**Never run on Railway:**
- ❌ `npx prisma migrate reset` (deletes all data)
- ❌ `npx prisma db push --accept-data-loss` (can delete data)
- ❌ Manual SQL commands that drop tables

### ✅ Rule #3: Breaking Changes = Two Phases

**Renaming fields or changing types? Do it in 2 steps to avoid data loss:**

```prisma
# Phase 1: Add new field (keep old one)
model User {
  age_old Int?        # Keep existing data
  age_new String?     # Add new field
}
# Push → Backfill data → Test → Verify

# Phase 2: Remove old field (after data migration)
model User {
  age_new String?     # Now safe to remove age_old
}
# Push again
```

**Why 2 phases?**
- Railway deploys instantly when you push
- If you rename directly, existing data is lost
- Two phases = zero downtime + zero data loss

---

## 📖 MANDATORY: Read /read-first Command

**Before starting ANY task**, you MUST read the `/read-first` command file:

```bash
# Read this file FIRST before any coding task:
.claude/commands/read-first.md
```

This command contains:
- ✅ Port 3000 management protocol
- ✅ Enterprise standards review checklist
- ✅ User permission requirements
- ✅ File organization rules
- ✅ Testing and validation steps
- ✅ Git workflow with approval process

**Key requirement**: The `/read-first` command MUST be executed at the start of every development session to ensure you follow all enterprise standards and avoid common pitfalls.

---

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

# TypeScript Type Checking (Memory-Optimized)
npm run typecheck:parallel         # Incremental check (fast, low memory)
npm run typecheck:parallel:force   # Full rebuild
npm run typecheck:parallel:watch   # Watch mode
npm run typecheck:parallel:clean   # Clear cache
```

## 🧠 TypeScript Memory Optimization

**IMPORTANT**: This codebase uses industry-standard TypeScript project references to handle memory constraints.

**📚 Full Documentation**: `codebase-memory/build-optimization/TYPESCRIPT_MEMORY_SOLUTION.md`

### Quick Reference

| Task | Command | Memory |
|------|---------|--------|
| Daily development | `npm run dev` | Low |
| Type check changes | `npm run typecheck:parallel` | ~500MB |
| Production build | `npm run build` | ~4GB |
| Full type check | `npm run typecheck:parallel:force` | ~2GB |

### ❌ NEVER Run
```bash
npx tsc --noEmit  # Will OOM on full project (8GB+)
```

### ✅ ALWAYS Use
```bash
npm run typecheck:parallel  # Incremental, cached, low memory
npm run lint                # Catches most type issues via ESLint
```

### Why This Works
- 16 packages compile independently with caching
- Only changed packages rebuild
- `.tsbuildinfo` files cache results
- Editor provides real-time feedback

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

### 🚨 NEVER Disable ESLint react-hooks Rules

**FORBIDDEN: `// eslint-disable-next-line react-hooks/exhaustive-deps`**

The exhaustive-deps rule prevents stale closures and bugs. Fix the root cause instead.

### ✅ CORRECT: Use useRef for Stable Callbacks
```typescript
import { useState, useEffect, useCallback, useRef } from 'react';

// Problem: offset in deps causes callback to change → infinite loops
// Solution: Store mutable values in refs

const offsetRef = useRef(0);

// Callback is stable - only depends on immutable values
const fetchData = useCallback(async (reset = true) => {
  const currentOffset = reset ? 0 : offsetRef.current;
  const data = await fetch(`/api?offset=${currentOffset}`);
  offsetRef.current = currentOffset + limit;
}, [limit]); // Stable deps

// Use refs to access latest state in stable callbacks
const isLoadingRef = useRef(isLoading);
isLoadingRef.current = isLoading;

const loadMore = useCallback(async () => {
  if (isLoadingRef.current) return;
  await fetchData(false);
}, [fetchData]); // Stable - no ESLint warnings

// Effect includes the stable callback - no lint disable needed
useEffect(() => {
  fetchData(true);
}, [fetchData]);
```

### When to Use useRef vs useState
| Use Case | Solution |
|----------|----------|
| Value triggers UI re-render | `useState` |
| Value for callback, no re-render needed | `useRef` |
| Pagination offset, cursor | `useRef` |
| Loading state for UI + callbacks | `useState` + `useRef` |
| Array types in deps (unstable) | `useRef` |

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

// eslint-disable-next-line react-hooks/exhaustive-deps  // ❌ NEVER

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

## SAM Agentic AI Mentor Development

### 🔴 MANDATORY: Architecture Reference

**Before writing ANY SAM-related code, you MUST read:**
```
codebase-memory/architecture/SAM_AGENTIC_ARCHITECTURE.md
```

This file contains:
- Complete system architecture diagram
- TaxomindContext usage patterns (SINGLE ENTRY POINT for all stores)
- Store categories and their purposes
- API routes structure
- Code integration guidelines
- Common patterns with examples
- File reference map

### 🚨 SAM Integration Rules

#### Rule 1: ALWAYS Use TaxomindContext for Store Access
```typescript
// ✅ CORRECT - Use TaxomindContext
import { getTaxomindContext, getStore, getGoalStores } from '@/lib/sam/taxomind-context';
const goalStore = getStore('goal');
const { goal, subGoal, plan } = getGoalStores();

// ❌ WRONG - Never create stores directly
import { createPrismaGoalStore } from '@/lib/sam/stores';
const goalStore = createPrismaGoalStore(); // FORBIDDEN!
```

#### Rule 2: Import Types from @sam-ai/agentic
```typescript
// ✅ CORRECT
import { type Goal, type GoalStatus, type Plan } from '@sam-ai/agentic';

// ❌ WRONG - Don't import types from stores directly in API routes
```

#### Rule 3: Use Package Factories for Business Logic
```typescript
// ✅ CORRECT - Use package factories with context stores
import { createBehaviorMonitor } from '@sam-ai/agentic';
import { getProactiveStores } from '@/lib/sam/taxomind-context';

const stores = getProactiveStores();
const monitor = createBehaviorMonitor({
  eventStore: stores.behaviorEvent,
  patternStore: stores.pattern,
  interventionStore: stores.intervention,
});
```

### SAM Packages (11 Total)

| Package | Purpose |
|---------|---------|
| `@sam-ai/agentic` | Goal planning, tool execution, proactive interventions, memory |
| `@sam-ai/core` | Orchestrator, StateMachine, AI Adapters |
| `@sam-ai/educational` | 40+ specialized educational engines |
| `@sam-ai/memory` | MasteryTracker, SpacedRepetition, Pathways |
| `@sam-ai/pedagogy` | Bloom's Taxonomy, Scaffolding, ZPD |
| `@sam-ai/safety` | Bias detection, Fairness, Accessibility |
| `@sam-ai/quality` | 6 Quality Gates |
| `@sam-ai/react` | 11+ Hooks, Provider |
| `@sam-ai/api` | Route Handlers, Middleware |
| `@sam-ai/adapter-prisma` | Database Integration |
| `@sam-ai/adapter-taxomind` | Taxomind-specific adapters |

### Key Integration Files

| File | Purpose |
|------|---------|
| `lib/sam/taxomind-context.ts` | **SINGLE ENTRY POINT** - All store access |
| `lib/sam/index.ts` | Main SAM exports |
| `lib/sam/agentic-bridge.ts` | Main integration bridge |
| `lib/sam/agentic-tooling.ts` | Tool registry integration |
| `lib/sam/agentic-memory.ts` | Memory system integration |
| `lib/sam/stores/` | Prisma store adapters |

### Store Access Quick Reference

```typescript
// Full context
const { stores } = getTaxomindContext();

// Specific store
const toolStore = getStore('tool');

// Store groups
const { goal, subGoal, plan } = getGoalStores();
const { behaviorEvent, pattern, intervention, checkIn } = getProactiveStores();
const { vector, knowledgeGraph, sessionContext } = getMemoryStores();
const { skill, learningPath, courseGraph } = getLearningPathStores();
```

### Quick Links
- **Architecture Doc**: `codebase-memory/architecture/SAM_AGENTIC_ARCHITECTURE.md`
- Master Plan: `SAM_AGENTIC_AI_MENTOR_MASTER_PLAN.md`
- Prisma Schema: `prisma/domains/17-sam-agentic.prisma`
- Existing Plans: `docs/features/sam-ai-system/improvement-plan/`

---

**Quick Reference**: See `/Users/CLAUDE.md` for full enterprise standards. Always verify schema before database queries.

*Last updated: January 2025*
*Stack: Next.js 15 + Prisma + PostgreSQL + NextAuth.js v5*
