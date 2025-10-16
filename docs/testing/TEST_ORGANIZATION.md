# 🧪 Test Organization Guide

**Last Updated**: 2025-01-12
**Total Test Files**: 111 files
**Test Framework**: Jest + React Testing Library

---

## 📊 Test Structure Overview

```
taxomind/
├── __tests__/                      # Main test directory (107 files)
│   ├── unit/                       # Unit tests
│   │   ├── actions/                # Server action tests
│   │   └── lib/                    # Library function tests
│   ├── integration/                # Integration tests
│   │   ├── auth/                   # Auth flow tests
│   │   └── api/                    # API endpoint tests
│   ├── components/                 # Component tests
│   │   ├── ui/                     # UI component tests
│   │   └── auth/                   # Auth component tests
│   ├── hooks/                      # Custom hook tests
│   ├── actions/                    # Server action tests
│   ├── api/                        # API route tests
│   └── lib/                        # Library tests
│
└── app/                            # Co-located component tests (4 files)
    └── (protected)/teacher/courses/.../exam-creator/__tests__/
```

---

## 📁 Test Directory Breakdown

### 1. Unit Tests (`__tests__/unit/`)

**Purpose**: Test individual functions and modules in isolation

#### Actions Tests (`__tests__/unit/actions/`)
- `get-courses.test.ts` - Course fetching logic

#### Library Tests (`__tests__/unit/lib/`)
- **Database** (`lib/database/`)
  - `connection-pool.test.ts`
  - `query-performance-monitor.test.ts`
  - `query-result-cache.test.ts`

- **SAM/AI**
  - `sam-blooms-engine.test.ts`

- **Cache** (`lib/cache/`)
  - `redis-cache.test.ts`

- **Auth** (`lib/auth/`)
  - `saml-provider.test.ts`

- **Performance** (`lib/performance/`)
  - `react-optimizations.test.tsx`

- **Utilities**
  - `encryption.test.ts`

---

### 2. Integration Tests (`__tests__/integration/`)

**Purpose**: Test interactions between multiple components/modules

#### Auth Integration (`integration/auth/`)
- `auth-flow.test.ts` - End-to-end auth flow

#### API Integration (`integration/api/`)
- **SAM API** (`api/sam/blooms-analysis/`)
  - `route.test.ts` - Blooms analysis API

- **Enterprise API** (`api/enterprise/compliance/`)
  - `route.test.ts` - Compliance API

- **Course API** (`api/courses/[courseId]/`)
  - `route.test.ts` - Dynamic course routes

- **General API**
  - `critical-endpoints.test.ts`
  - `performance-optimized.test.ts`

---

### 3. Component Tests (`__tests__/components/`)

**Purpose**: Test React components

#### UI Components (`components/ui/`)
- `button.test.tsx`
- `progress.test.tsx`
- `badge.test.tsx`

#### Auth Components (`components/auth/`)
- `login-form.test.tsx`

#### General Components
- `course-card.test.tsx`
- `icon-badge.test.tsx`
- `icon-badge-simple.test.tsx`
- `simple-button.test.tsx`

---

### 4. Hook Tests (`__tests__/hooks/`)

**Purpose**: Test custom React hooks

- `use-current-user.test.ts`
- `use-current-role.test.ts`
- `use-debounce.test.ts`
- `use-admin.test.ts`

---

### 5. Server Action Tests (`__tests__/actions/`)

**Purpose**: Test Next.js server actions

- `auth.test.ts`
- `login.test.ts`
- `logout.test.ts`
- `register.test.ts`
- `new-password.test.ts`
- `reset.test.ts`
- `admin.test.ts`
- `get-courses.test.ts`
- `get-courses-optimized.test.ts`
- `get-dashboard-courses.test.ts`
- `get-all-search-courses.test.ts`
- `get-all-posts.test.ts`
- `get-simple-posts.test.ts`
- `get-user-posts.test.ts`

---

### 6. API Route Tests (`__tests__/api/`)

**Purpose**: Test Next.js API routes

- Various API endpoint tests
- Route handler tests
- API authentication tests

---

### 7. Schema Tests (`__tests__/schemas/`)

**Purpose**: Test validation schemas (Zod)

- `index.test.ts` - Schema validation tests

---

### 8. Utility Tests

#### Simple Utilities (`__tests__/simple/`)
- `utils.test.ts` - Simple utility functions

#### General Utilities (`__tests__/utils/`)
- `simple-utils.test.ts` - Utility function tests

---

### 9. Middleware Tests (`__tests__/`)

**Root Level Tests**:
- `middleware.test.ts` - Next.js middleware tests
- `simple.test.ts` - Simple smoke tests

---

### 10. Co-Located Component Tests

**Location**: `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/exam-creator/__tests__/`

**Files**:
- `ExamList.test.tsx`
- `ExamForm.test.tsx`
- `QuestionItem.test.tsx`
- `exam-reducer.test.ts`

**Purpose**: Tests specific to the exam creator component, co-located for easy maintenance

---

## 🎯 Test Organization Principles

### 1. Test Location Strategy

We follow a **hybrid approach**:

#### **Central Test Directory** (`__tests__/`)
✅ **Use for**:
- Shared utilities and helpers
- Cross-cutting concerns
- Integration tests
- General component tests

#### **Co-located Tests** (Next to components)
✅ **Use for**:
- Component-specific tests
- Complex feature modules
- Tests that are tightly coupled to implementation

### 2. Naming Conventions

- **Test files**: `*.test.ts` or `*.test.tsx`
- **Spec files**: `*.spec.ts` or `*.spec.tsx` (rarely used)
- **Test directories**: `__tests__/` (double underscore)

### 3. Test Categories

#### Unit Tests
- Fast, isolated tests
- No external dependencies
- Mock all dependencies

#### Integration Tests
- Test multiple modules together
- May use real database (with fixtures)
- Test API endpoints

#### E2E Tests (Playwright)
- Full user flows
- Real browser testing
- Located in separate E2E directory

---

## 📋 Jest Configuration Files

### Active Configurations (Root)
- `jest.config.js` - Default configuration
- `jest.config.ci.js` - CI-specific config (optimized)
- `jest.config.working.js` - Current working config (recommended)
- `jest.setup.js` - Test setup file

### Obsolete Configurations (Archived in `backups/_cleanup/`)
- `jest.config.all.js` ❌
- `jest.config.final.js` ❌
- `jest.config.integration.js` ❌
- `jest.config.memory-optimized.js` ❌
- `jest.config.optimized.js` ❌
- `jest.config.unit.js` ❌

**Note**: Use `jest.config.working.js` for development:
```bash
npm test -- --config jest.config.working.js
```

---

## 🚀 Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
# Run unit tests
npm test __tests__/unit/

# Run integration tests
npm test __tests__/integration/

# Run component tests
npm test __tests__/components/

# Run specific test file
npm test __tests__/actions/auth.test.ts
```

### Run Tests by Pattern
```bash
# Run all auth-related tests
npm test -- auth

# Run all course-related tests
npm test -- course

# Run tests with coverage
npm run test:coverage
```

### CI Mode
```bash
# Run in CI mode (optimized for CI/CD)
npm run test:ci
```

---

## 📝 Writing New Tests

### Test File Template

```typescript
/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', () => {
    // Test implementation
  });
});
```

### Where to Place New Tests

#### For New Components
**Option 1 - Co-located** (Recommended for complex features):
```
app/features/my-feature/
├── MyComponent.tsx
└── __tests__/
    └── MyComponent.test.tsx
```

**Option 2 - Central** (For shared components):
```
__tests__/components/
└── my-component.test.tsx
```

#### For New Actions
```
__tests__/actions/
└── my-action.test.ts
```

#### For New API Routes
```
__tests__/api/
└── my-route.test.ts
```

#### For New Hooks
```
__tests__/hooks/
└── use-my-hook.test.ts
```

---

## 🔧 Test Utilities & Helpers

### Test Utilities Location
- `__tests__/utils/` - Shared test utilities
- `__tests__/temp/` - Temporary test helpers (to be cleaned)
- `__tests__/types/` - TypeScript types for tests

### Common Test Patterns

#### Mocking API Calls
```typescript
jest.mock('@/lib/api', () => ({
  fetchData: jest.fn().mockResolvedValue({ data: 'mock' })
}));
```

#### Mocking NextAuth
```typescript
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: mockSession, status: 'authenticated' })
}));
```

#### Testing Server Components
```typescript
import { createMockRouter } from '__tests__/utils/mock-router';

// Use mock router for server components
```

---

## 📊 Test Coverage

### Coverage Thresholds
```json
{
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 70,
      "lines": 70,
      "statements": 70
    }
  }
}
```

### View Coverage Report
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

---

## 🎯 Best Practices

### 1. Test Naming
✅ **Good**: `should render user profile when authenticated`
❌ **Bad**: `test 1`

### 2. Test Independence
- Each test should be independent
- Don't rely on test execution order
- Clean up after each test

### 3. Mock External Dependencies
- Mock API calls
- Mock database queries
- Mock authentication

### 4. Use Descriptive Assertions
✅ **Good**: `expect(button).toHaveAttribute('disabled')`
❌ **Bad**: `expect(button.disabled).toBe(true)`

### 5. Test User Behavior, Not Implementation
✅ **Good**: Test what users see and do
❌ **Bad**: Test internal state changes

---

## 🔗 Related Documentation

- [Jest Configuration](../../jest.config.working.js)
- [Testing Library Docs](https://testing-library.com/)
- [Jest Documentation](https://jestjs.io/)
- [Test Results](./FINAL_TEST_STATUS.md)

---

## 📞 Need Help?

- **Test failing?** Check `docs/testing/FINAL_TEST_STATUS.md`
- **Need to add tests?** Follow the templates above
- **Coverage issues?** Run `npm run test:coverage` to identify gaps

---

**Maintained by**: Taxomind Development Team
**Test Framework**: Jest + React Testing Library + Playwright
**Status**: ✅ 111 test files organized
