# 📊 Coverage Analysis Reference

## Coverage Scoring Methodology

### Step 1: Categorize All Source Files

Run this to generate a full inventory:

```bash
#!/bin/bash
echo "=== COVERAGE INVENTORY ==="

# Critical path files (weight: 3x)
echo -e "\n--- CRITICAL PATH (3x weight) ---"
echo "API Routes:"
find app/api -name "route.ts" 2>/dev/null | wc -l
echo "Auth files:"
find . -path "*/auth*" -name "*.ts" | grep -v node_modules | grep -v test | wc -l
echo "Payment/Stripe:"
find . -path "*stripe*" -o -path "*payment*" -o -path "*purchase*" | grep -v node_modules | grep "\.ts$" | grep -v test | wc -l
echo "Server Actions:"
find app/ -name "actions.ts" -o -name "actions.tsx" | wc -l

# Important files (weight: 2x)
echo -e "\n--- IMPORTANT (2x weight) ---"
echo "Data access / queries:"
find lib/ -name "*.ts" | grep -v test | grep -v __mocks__ | wc -l
echo "Interactive components:"
grep -rl "onClick\|onSubmit\|onChange\|useState" components/ app/ --include="*.tsx" 2>/dev/null | grep -v test | wc -l
echo "Hooks:"
find . -name "use*.ts" -o -name "use*.tsx" | grep -v node_modules | grep -v test | wc -l

# Standard files (weight: 1x)
echo -e "\n--- STANDARD (1x weight) ---"
echo "Utility functions:"
find lib/ -name "*.ts" | grep -i "util\|helper\|format\|validate" | grep -v test | wc -l
echo "Static components:"
find components/ app/ -name "*.tsx" | grep -v test | wc -l
echo "Types/configs:"
find . -name "*.ts" | grep -i "type\|config\|constant" | grep -v node_modules | grep -v test | wc -l

# SAM AI packages
echo -e "\n--- SAM AI PACKAGES ---"
for pkg in packages/*/; do
  if [ -d "$pkg/src" ]; then
    src_count=$(find "$pkg/src" -name "*.ts" | grep -v test | wc -l)
    test_count=$(find "$pkg" -name "*.test.*" 2>/dev/null | wc -l)
    echo "$(basename $pkg): $src_count source, $test_count tests"
  fi
done
```

### Step 2: Calculate Coverage Score

```
Coverage Score = (Tested Critical × 3 + Tested Important × 2 + Tested Standard × 1)
                 ÷ (Total Critical × 3 + Total Important × 2 + Total Standard × 1)
                 × 100
```

**Scoring tiers:**

| Score | Grade | Meaning |
|-------|-------|---------|
| 80-100 | 🟢 A | Production-ready coverage |
| 60-79 | 🟡 B | Reasonable but gaps in critical paths |
| 40-59 | 🟠 C | Significant gaps, risky deploys |
| 20-39 | 🔴 D | Most code untested |
| 0-19 | ⛔ F | Essentially no test coverage |

### Step 3: Run Jest Coverage (if possible)

```bash
# Quick coverage run (unit tests only, faster)
NODE_OPTIONS='--max-old-space-size=8192' npx jest --config jest.config.working.js --coverage --coverageReporters="text-summary" --no-cache 2>/dev/null

# If that fails or is too slow, do a targeted run:
NODE_OPTIONS='--max-old-space-size=4096' npx jest --config jest.config.unit.js --coverage --coverageReporters="text-summary" 2>/dev/null

# Parse existing coverage report if available
if [ -f "coverage/coverage-summary.json" ]; then
  node -pe "
    const c = require('./coverage/coverage-summary.json').total;
    console.log('Lines:', c.lines.pct + '%');
    console.log('Branches:', c.branches.pct + '%');
    console.log('Functions:', c.functions.pct + '%');
    console.log('Statements:', c.statements.pct + '%');
  "
fi
```

### Step 4: Generate Gap Report

**Report format:**

```markdown
# 📊 Test Coverage Report — [Project Name]
**Generated:** YYYY-MM-DD
**Overall Score:** XX/100 (Grade)

## Coverage Summary

| Category | Source Files | Tested | Coverage | Weighted |
|----------|-------------|--------|----------|----------|
| 🔴 Critical (API/Auth/Payments) | X | Y | Z% | 3x |
| 🟠 Important (Components/Hooks) | X | Y | Z% | 2x |
| 🟢 Standard (Utils/Types) | X | Y | Z% | 1x |
| 📦 SAM AI Packages | X | Y | Z% | 2x |
| **Total** | **X** | **Y** | **Z%** | |

## Jest Coverage (if available)
| Metric | Percentage | Target |
|--------|-----------|--------|
| Lines | X% | 80% |
| Branches | X% | 70% |
| Functions | X% | 80% |
| Statements | X% | 80% |

## 🔴 Critical Gaps (Fix First)
These untested files are in the critical path and should get tests immediately.

| # | File | Type | Risk | Effort |
|---|------|------|------|--------|
| 1 | `app/api/courses/route.ts` | API Route | Data mutation | M |
| 2 | `app/api/stripe/webhook/route.ts` | Webhook | Payment integrity | L |
| ... | | | | |

## 🟠 High Priority Gaps
| # | File | Type | Risk | Effort |
|---|------|------|------|--------|

## 🟡 Medium Priority Gaps
| # | File | Type | Risk | Effort |

## Test Health Metrics
- **Skipped tests:** X
- **Snapshot-only tests:** X (low confidence)
- **Tests without assertions:** X
- **Average test file size:** X lines

## Recommended Test Plan
### Week 1: Critical Path
1. [ ] API route tests for /api/courses/*
2. [ ] Auth flow tests (login, register, role check)
3. [ ] Stripe webhook verification test

### Week 2: Core Components
4. [ ] Course creation form tests
5. [ ] Chapter editor tests
6. [ ] Navigation/auth guard tests

### Week 3: Data Layer
7. [ ] Prisma query helper tests
8. [ ] Cache invalidation tests
9. [ ] SAM AI core package tests

### Week 4: E2E
10. [ ] Student enrollment flow (Playwright)
11. [ ] Course completion flow (Playwright)
12. [ ] Payment flow (Playwright)
```

## Effort Estimation Guide

| Size | Meaning | Typical Time |
|------|---------|-------------|
| **S** | Pure function, 2-5 test cases, no mocking | 15-30 min |
| **M** | Component or API route, needs mocking, 5-10 cases | 30-60 min |
| **L** | Complex flow, multiple mocks, auth + DB + external API | 1-2 hours |
| **XL** | E2E flow, multi-page, setup/teardown heavy | 2-4 hours |
