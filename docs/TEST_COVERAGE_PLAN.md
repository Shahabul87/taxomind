# Taxomind Test Coverage Analysis & Development Plan

**Date**: 2026-02-25
**Current State**: 484 test files, 5,105 tests passing (344/346 suites pass)

---

## Executive Summary

| Metric | Current | Target (Phase 1) | Target (Final) |
|--------|---------|-------------------|-----------------|
| **Statements** | 7.84% | 30% | 60% |
| **Branches** | 57.28% | 70% | 85% |
| **Functions** | 27% | 50% | 70% |
| **Lines** | 7.84% | 30% | 60% |
| **Test Files** | 484 | ~650 | ~900 |
| **Total Tests** | 5,105 | ~7,500 | ~12,000 |

> **Note**: Statement/Line coverage is low (7.84%) because the project has **1.13M lines of source** across all collected files (including generated/dist). The 5,105 tests are concentrated on critical paths but miss broad coverage.

---

## Current Coverage Scorecard

### By Category

| Category | Source Files | Test Files | Coverage | Grade |
|----------|-------------|------------|----------|-------|
| **Critical Lib (auth, db, AI)** | 12 | 11 | 92% | A |
| **API Routes** | 812 | 94 | 11.6% | F |
| **Components** | 1,851 | 34 | 1.8% | F |
| **Hooks** | 92 | 23 | 25% | D |
| **Actions** | 61 | 24 | 39% | D+ |
| **Middleware/Security** | 7 | 5 | 71% | B |
| **E2E Tests** | - | 10 | - | D |
| **Admin Routes** | 35 | 24 | 69% | C+ |
| **Stripe/Payment** | ~15 | 16 | ~100% | A |
| **Auth/Session** | ~30 | 240+ | ~100% | A |

### SAM Packages

| Package | Source | Tests | Ratio | Grade |
|---------|--------|-------|-------|-------|
| `@sam-ai/quality` | 8 | 6 | 75% | B |
| `@sam-ai/sam-engine` | 5 | 4 | 80% | A |
| `@sam-ai/realtime` | 5 | 3 | 60% | C |
| `@sam-ai/pedagogy` | 7 | 4 | 57% | C |
| `@sam-ai/external-knowledge` | 7 | 3 | 42% | D+ |
| `@sam-ai/vanilla` | 5 | 2 | 40% | D+ |
| `@sam-ai/adapter-prisma` | 14 | 5 | 35% | D |
| `@sam-ai/core` | 27 | 9 | 33% | D |
| `@sam-ai/react` | 39 | 13 | 33% | D |
| `@sam-ai/agentic` | 86 | 28 | 32% | D |
| `@sam-ai/educational` | 118 | 30 | 25% | D- |
| `@sam-ai/adapter-taxomind` | 9 | 2 | 22% | F |
| `@sam-ai/integration` | 19 | 3 | 15% | F |

### Test Quality Indicators

| Indicator | Count | Status |
|-----------|-------|--------|
| Skipped tests | 18 | Acceptable |
| TODO/FIXME in tests | 5 | Good |
| Snapshot tests | 0 | Good (none = no brittle tests) |
| Hardcoded timeouts | 21 | Needs review |
| Proper cleanup (afterEach/All) | 28 | Low - needs improvement |
| Mock usage | 532 | Heavy - verify not over-mocking |
| Failing suites | 1 | Fix: `comprehensive-benchmarks.test.ts` |

---

## Development Plan - 5 Phases

### Phase 1: Critical Path Coverage (Weeks 1-2)
**Goal**: Cover revenue-critical and security-critical paths | **~50 test files**

| Priority | Area | Files to Write | Effort | Impact |
|----------|------|---------------|--------|--------|
| P0 | Fix failing test suite | 1 fix | S | Unblocks CI |
| P0 | Middleware (`middleware.ts`) | 1 | M | Security gate |
| P0 | Course enrollment API routes | 5 | M | Revenue path |
| P0 | Course CRUD API routes (publish/unpublish) | 8 | L | Core functionality |
| P0 | Webhook handlers (Stripe, auth) | 3 | M | Payment reliability |
| P1 | Admin security routes (untested 11/35) | 6 | M | Admin security |
| P1 | Content governance APIs | 4 | M | Content integrity |
| P1 | User actions (settings, profile) | 5 | S | User management |
| P1 | GDPR compliance route | 1 | S | Legal compliance |
| P1 | Security monitoring middleware | 2 | S | Observability |

**Estimated effort**: ~80-100 hours
**Coverage impact**: Statements ~15%, Functions ~35%

---

### Phase 2: API Route Coverage (Weeks 3-5)
**Goal**: Cover 50%+ of API routes | **~100 test files**

| Priority | Area | Files to Write | Effort |
|----------|------|---------------|--------|
| P1 | Course chapter/section routes | 15 | L |
| P1 | AI/SAM API routes (analysis, chat) | 12 | L |
| P1 | Analytics routes (batch, video, web-vitals) | 8 | M |
| P1 | Blog/Post API routes | 6 | M |
| P2 | Calendar/scheduling routes | 5 | M |
| P2 | Collaboration routes | 4 | M |
| P2 | Content versioning routes | 4 | M |
| P2 | Course generation (blueprint, chapter) | 6 | L |
| P2 | Comment/reaction routes | 5 | S |
| P2 | Practice/assessment routes | 8 | M |
| P2 | Remaining admin routes | 5 | M |
| P2 | Cron job routes | 3 | S |

**Estimated effort**: ~150-200 hours
**Coverage impact**: Statements ~25%, Functions ~45%

---

### Phase 3: Component & Hook Coverage (Weeks 6-8)
**Goal**: Cover critical UI components and all hooks | **~120 test files**

| Priority | Area | Files to Write | Effort |
|----------|------|---------------|--------|
| P1 | SAM chat components (19 files) | 10 | L |
| P1 | Auth components (27 files) | 8 | M |
| P1 | Dashboard components | 10 | M |
| P1 | Course learning interface | 12 | L |
| P2 | UI components (75 files - top 20) | 10 | M |
| P2 | Analytics components (22 files) | 6 | M |
| P2 | Practice components (17 files) | 5 | M |
| P2 | Teacher course management | 10 | L |
| P1 | Untested hooks (69 remaining) | 35 | L |
| P2 | Calendar components | 5 | M |
| P2 | Blog components | 5 | M |

**Estimated effort**: ~200-250 hours
**Coverage impact**: Statements ~35%, Functions ~55%

---

### Phase 4: SAM Package Deep Coverage (Weeks 9-11)
**Goal**: All SAM packages at 60%+ | **~80 test files**

| Package | Current | Gap | Files Needed | Effort |
|---------|---------|-----|-------------|--------|
| `@sam-ai/educational` | 25% | 35% | 20 | L |
| `@sam-ai/agentic` | 32% | 28% | 15 | L |
| `@sam-ai/core` | 33% | 27% | 10 | M |
| `@sam-ai/react` | 33% | 27% | 12 | M |
| `@sam-ai/integration` | 15% | 45% | 8 | M |
| `@sam-ai/adapter-taxomind` | 22% | 38% | 4 | S |
| `@sam-ai/adapter-prisma` | 35% | 25% | 4 | S |
| `@sam-ai/memory` | Low | 50% | 5 | M |
| `@sam-ai/safety` | Low | 50% | 5 | M |

**Estimated effort**: ~150-180 hours
**Coverage impact**: Statements ~45%, Functions ~60%

---

### Phase 5: E2E & Integration Hardening (Weeks 12-14)
**Goal**: Critical user journeys covered end-to-end | **~30 test files**

| Priority | E2E Test | Effort |
|----------|----------|--------|
| P0 | Full enrollment-to-completion flow | L |
| P0 | Stripe checkout + webhook flow | L |
| P0 | Admin course management flow | M |
| P1 | SAM AI tutor conversation flow | L |
| P1 | Student dashboard analytics flow | M |
| P1 | Certificate generation flow | M |
| P1 | User settings & profile flow | S |
| P2 | Blog publish & comment flow | M |
| P2 | Calendar & scheduling flow | M |
| P2 | Content governance approval flow | M |
| P2 | Practice & assessment flow | M |
| P2 | Group learning flow | M |
| P2 | Visual regression expansion | M |

**Plus quality improvements**:
- Fix 18 skipped tests
- Review 21 hardcoded timeouts
- Add proper cleanup to all test suites (only 28 currently)
- Add `afterEach(cleanup)` to all component tests

**Estimated effort**: ~120-150 hours
**Coverage impact**: Statements ~55-60%, Functions ~65-70%

---

## Summary Table

| Phase | Weeks | Test Files | Tests Added | Effort (hrs) | Coverage Target |
|-------|-------|-----------|-------------|-------------|-----------------|
| 1. Critical Path | 1-2 | ~50 | ~600 | 80-100 | 15% stmt |
| 2. API Routes | 3-5 | ~100 | ~1,500 | 150-200 | 25% stmt |
| 3. Components & Hooks | 6-8 | ~120 | ~1,800 | 200-250 | 35% stmt |
| 4. SAM Packages | 9-11 | ~80 | ~1,200 | 150-180 | 45% stmt |
| 5. E2E & Hardening | 12-14 | ~30 | ~400 | 120-150 | 55-60% stmt |
| **TOTAL** | **14 weeks** | **~380** | **~5,500** | **700-880** | **60% stmt** |

---

## Immediate Actions (This Week)

1. **Fix** the failing `comprehensive-benchmarks.test.ts` (timeout issue line 154)
2. **Write** `middleware.ts` integration tests (security gate for entire app)
3. **Write** `lib/sam/agentic-memory.ts` unit tests (only untested critical lib file)
4. **Write** `lib/middleware/logging-middleware.ts` tests
5. **Write** `lib/middleware/security-monitoring.ts` tests
6. **Review** 21 hardcoded timeouts in existing tests for flakiness risk

---

## Coverage Exclusions (Recommended)

Add to `jest.config.working.js` to get accurate coverage numbers:

```js
coveragePathIgnorePatterns: [
  '/node_modules/',
  '/dist/',
  '/.next/',
  '/coverage/',
  '/prisma/generated/',
  '/__tests__/',
  '/e2e/',
]
```

This will reduce the denominator from 1.13M lines to the actual application source, giving a more meaningful coverage percentage.

---

*Generated by Taxomind LMS Test Coverage Skill*
