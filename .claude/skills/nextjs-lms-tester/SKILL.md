---
name: nextjs-lms-tester
description: >
  Comprehensive test coverage analysis, test generation, and test quality auditing skill for
  Next.js LMS platforms (specifically Taxomind). Use this skill whenever the user mentions
  "test coverage", "write tests", "generate tests", "missing tests", "coverage report",
  "unit tests", "integration tests", "e2e tests", "testing gaps", "test quality", "untested code",
  "improve coverage", "test audit", "what needs tests", "coverage percentage", "test plan",
  or any variation of analyzing, generating, or improving tests. Also trigger when the user says
  "is this component tested", "test this function", "test my API route", "mock this", "test setup",
  "jest config", "playwright setup", "check my tests", or asks about testing best practices for
  their Next.js app. Stack-aware for: Jest, React Testing Library, Playwright, MSW, Supertest,
  Next.js App Router, Prisma, NextAuth, Stripe, Socket.io, and SAM AI monorepo packages.
---

# Next.js LMS Test Coverage Skill

## Overview

This skill performs **three core jobs**:

1. **Analyze** → Map existing test coverage, find gaps, score quality
2. **Generate** → Write missing tests following best practices
3. **Audit** → Review existing tests for quality, anti-patterns, flakiness

## Quick Decision Tree

```
User says "coverage" / "what's tested" / "gaps"  → Run COVERAGE ANALYSIS (Step 1-3)
User says "write tests for X" / "test this"       → Run TEST GENERATION (Step 4)
User says "check my tests" / "test quality"        → Run TEST AUDIT (Step 5)
User says "full test audit" / "test everything"    → Run ALL steps
```

---

## Stack Context

### Testing Infrastructure (from package.json)
- **Jest** — Primary test runner with multiple configs:
  - `jest.config.working.js` — Main config
  - `jest.config.unit.js` — Unit tests only
  - `jest.config.integration.js` — Integration tests only
- **React Testing Library** — `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- **Playwright** — E2E testing (`@playwright/test`)
- **MSW** (Mock Service Worker) — API mocking in tests
- **Supertest** — HTTP assertion for API route testing
- **Puppeteer** — Browser automation (secondary to Playwright)
- **jest-environment-jsdom** — Browser environment for component tests
- **jest-environment-node** — Node environment for API/server tests

### Key Test Scripts
```bash
npm test                    # Jest with working config
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:coverage       # Jest with coverage report
npm run test:ci             # CI-safe with memory limits
npm run test:memory-safe    # Memory-safe runner
```

### What Needs Testing (Priority Order)
1. **API Routes** (`app/api/`) — Auth, data mutations, Stripe webhooks
2. **Server Actions** (`actions/` or `app/**/actions.ts`) — Form submissions, data operations
3. **React Components** — Interactive UI, forms, conditional rendering
4. **Utility Functions** (`lib/`) — Data transforms, validation, helpers
5. **Prisma Queries** (`lib/db/` or data access layers) — Query logic with mocked Prisma
6. **Auth Flows** — Login, registration, role-based access
7. **SAM AI Packages** (`packages/`) — Core AI pipeline logic
8. **E2E Flows** — Critical user journeys (enroll, learn, complete)

---

## Step 1: Discover Test Landscape

```bash
# 1a. Find all existing test files
echo "=== TEST FILES ==="
find . -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" | grep -v node_modules | sort

echo -e "\n=== TEST COUNT BY DIRECTORY ==="
find . -name "*.test.*" -o -name "*.spec.*" | grep -v node_modules | sed 's|/[^/]*$||' | sort | uniq -c | sort -rn | head -20

echo -e "\n=== TEST INFRASTRUCTURE ==="
ls jest.config.* 2>/dev/null
ls playwright.config.* 2>/dev/null
ls __tests__/ 2>/dev/null
ls **/__tests__/ 2>/dev/null
find . -name "setup*.ts" -path "*test*" | grep -v node_modules | head -10
find . -name "jest.setup*" | grep -v node_modules
```

## Step 2: Map Coverage Gaps

```bash
# 2a. Find all source files that SHOULD have tests
echo "=== API ROUTES (need integration tests) ==="
find app/api -name "route.ts" | sort | while read route; do
  test_exists=$(find . -name "*.test.*" | grep -v node_modules | xargs grep -l "$(basename $(dirname $route))" 2>/dev/null | head -1)
  if [ -z "$test_exists" ]; then
    echo "❌ UNTESTED: $route"
  else
    echo "✅ TESTED:   $route → $test_exists"
  fi
done

echo -e "\n=== COMPONENTS (need unit tests) ==="
find app/ components/ -name "*.tsx" | grep -v "layout\|loading\|error\|not-found\|test\|spec" | while read comp; do
  basename=$(basename "$comp" .tsx)
  test_exists=$(find . \( -name "${basename}.test.*" -o -name "${basename}.spec.*" \) | grep -v node_modules | head -1)
  if [ -z "$test_exists" ]; then
    echo "❌ $comp"
  fi
done 2>/dev/null | head -40

echo -e "\n=== LIB/UTILS (need unit tests) ==="
find lib/ -name "*.ts" | grep -v "test\|spec\|__" | while read util; do
  basename=$(basename "$util" .ts)
  test_exists=$(find . \( -name "${basename}.test.*" -o -name "${basename}.spec.*" \) | grep -v node_modules | head -1)
  if [ -z "$test_exists" ]; then
    echo "❌ $util"
  fi
done 2>/dev/null | head -30
```

## Step 3: Generate Coverage Report

Read `references/coverage-analysis.md` for the full scoring methodology and report format.

**Output:** A Markdown report with:
- Coverage score (0-100) across unit / integration / e2e
- Prioritized list of files needing tests (critical path first)
- Estimated effort for each gap (S/M/L)

---

## Step 4: Generate Tests

When the user asks to write tests for a specific file or feature, read the appropriate reference:

| What to test | Reference file |
|---|---|
| React components (UI, forms, interactions) | `references/component-tests.md` |
| API routes (GET, POST, auth, webhooks) | `references/api-tests.md` |
| Utility functions, hooks, Prisma queries | `references/unit-tests.md` |
| E2E user flows (Playwright) | `references/e2e-tests.md` |

### Test Generation Protocol

1. **Read the source file** — Understand inputs, outputs, side effects, branches
2. **Read the reference** — Get the template and patterns for this test type
3. **Identify test cases** — Happy path, edge cases, error states, boundary conditions
4. **Write the test** — Follow the project's existing conventions
5. **Validate** — Run the test if possible, check imports resolve

### Naming Convention
```
__tests__/                          # Centralized test directory
  components/
    course-card.test.tsx            # Component tests
  api/
    courses.test.ts                 # API route tests
  lib/
    utils.test.ts                   # Utility tests
  
# OR co-located:
components/
  course-card/
    course-card.tsx
    course-card.test.tsx            # Co-located test
```

Follow whichever pattern the project already uses. Check with:
```bash
# Detect test organization pattern
if [ -d "__tests__" ]; then
  echo "Pattern: Centralized (__tests__/ directory)"
else
  echo "Pattern: Co-located (tests next to source)"
fi
```

---

## Step 5: Test Quality Audit

Read `references/test-quality.md` for the full audit checklist.

Quick checks:
```bash
# Find tests with no assertions
grep -rn "it(\|test(" __tests__/ --include="*.test.*" -A 20 | grep -B 5 "^--$" | grep -v "expect\|assert\|should\|toHave\|toBe" | head -10

# Find skipped tests
grep -rn "it.skip\|test.skip\|xit\|xtest\|xdescribe\|describe.skip" __tests__/ --include="*.test.*" | head -10

# Find tests with hardcoded timeouts (flaky indicator)
grep -rn "setTimeout\|waitFor.*timeout\|jest.setTimeout" __tests__/ --include="*.test.*" | head -10

# Find tests without proper cleanup
grep -rn "afterEach\|afterAll\|cleanup" __tests__/ --include="*.test.*" | head -10

# Find snapshot tests (often low-value)
grep -rn "toMatchSnapshot\|toMatchInlineSnapshot" __tests__/ --include="*.test.*" | head -10
```

---

## Critical Rules

1. **Never mock what you don't own** — Mock Prisma, not your own data access layer
2. **Test behavior, not implementation** — Don't test internal state, test what the user sees
3. **Each test should fail for exactly one reason** — One assertion focus per test
4. **Use MSW for API mocking** — Don't mock fetch directly
5. **Server components need special handling** — Can't render with RTL directly, test via integration
6. **Prisma mocking** — Use `jest.mock('@prisma/client')` or a shared mock from `__mocks__/`
7. **NextAuth mocking** — Mock `getServerSession` and `auth()` for protected routes
8. **Respect memory limits** — Tests run with `--max-old-space-size=8192`, keep test data small
