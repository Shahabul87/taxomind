# Taxomind Comprehensive Test Coverage Plan

**Generated**: March 4, 2026
**Current Line Coverage**: 13.11% (148,545 / 1,132,882)
**Current Test Files**: 1,341
**Target**: 50%+ line coverage across critical paths

---

## Current State Summary

| Metric | Current | Target |
|--------|---------|--------|
| Line Coverage | 13.11% | 50%+ |
| Function Coverage | 36.76% | 70%+ |
| Branch Coverage | 63.67% | 80%+ |
| Test Files | 1,341 | ~1,600+ |
| Files at 0% | 2,607 | <500 |

### What's Already Well-Tested

| Area | Status | Test Lines |
|------|--------|-----------|
| Auth Actions (login, register, reset, etc.) | 8/8 files | 2,235 |
| Auth API Routes (MFA, SSO, sessions) | 23/23 routes | 4,319 |
| Middleware (security, rate-limit, logging) | 6/6 files | 3,131 |
| Security Libs (api-security, password, rate-limit) | 4/4 files | 2,929 |
| SAM Stores (all 10 Prisma stores) | 10/10 files | 3,746 |
| SAM AI Core (enterprise-client, ai-provider) | All critical | 5,850 |
| SAM Course Creation pipeline | Complete | 3,564 |
| SAM API Routes | 293 test files | 9,218 |
| Payment API Routes | 10/10 routes | 1,966 |
| AI API Routes | 15/15 routes | 2,983 |

---

## Phase 1: P0 Critical Infrastructure (Week 1)

**Goal**: Protect against production failures in auth, database, and payments.

### 1.1 Auth Config (Currently: 0 tests)

These are the root auth configuration files — all auth flows depend on them.

| # | Source File | Lines | Test to Create | Effort |
|---|-----------|-------|---------------|--------|
| 1 | `auth.ts` | 286 | `__tests__/auth/auth.test.ts` | M |
| 2 | `auth.config.ts` | 97 | `__tests__/auth/auth-config.test.ts` | S |
| 3 | `auth.admin.ts` | 343 | `__tests__/auth/auth-admin.test.ts` | M |
| 4 | `auth.config.admin.ts` | 131 | `__tests__/auth/auth-config-admin.test.ts` | S |
| 5 | `routes.ts` | 236 | `__tests__/auth/routes.test.ts` | M |
| 6 | `lib/auth.ts` | 90 | `__tests__/lib/auth.test.ts` | S |

**What to test**:
- JWT encoding/decoding callbacks
- Session serialization/deserialization
- Auth handler configuration (providers, callbacks)
- Admin vs User auth separation (CRITICAL enterprise rule)
- Route classification (public, auth, protected, admin)
- Edge runtime compatibility

### 1.2 RBAC / Permissions (Currently: 0 tests)

| # | Source File | Lines | Test to Create | Effort |
|---|-----------|-------|---------------|--------|
| 7 | `lib/permissions.ts` | 412 | `__tests__/lib/permissions.test.ts` | M |
| 8 | `lib/role-management.ts` | 74 | `__tests__/lib/role-management.test.ts` | S |
| 9 | `lib/auth/permissions.ts` | 32 | `__tests__/lib/auth/permissions.test.ts` | S |
| 10 | `lib/auth/auth-context.ts` | ~100 | `__tests__/lib/auth/auth-context.test.ts` | S |

**What to test**:
- Permission checks by role (ADMIN, USER, TEACHER)
- Role hierarchy and inheritance
- Permission guard functions
- Auth context creation and validation

### 1.3 Database Core (Currently: 5 major files untested)

| # | Source File | Lines | Test to Create | Effort |
|---|-----------|-------|---------------|--------|
| 11 | `lib/db/db-monitoring.ts` | 1,478 | `__tests__/lib/db/db-monitoring.test.ts` | L |
| 12 | `lib/db/db-replicas.ts` | 1,130 | `__tests__/lib/db/db-replicas.test.ts` | L |
| 13 | `lib/db/query-optimizer.ts` | 963 | `__tests__/lib/db/query-optimizer.test.ts` | L |
| 14 | `lib/database/query-optimizer.ts` | 810 | `__tests__/lib/database/query-optimizer.test.ts` | M |
| 15 | `lib/database/query-performance.ts` | 560 | `__tests__/lib/database/query-performance.test.ts` | M |
| 16 | `lib/db-environment.ts` | 119 | `__tests__/lib/db-environment.test.ts` | S |

**What to test**:
- DB monitoring: health checks, metric collection, alerting thresholds
- Read replicas: routing logic, failover, connection management
- Query optimizer: query plan analysis, index suggestions, slow query detection
- Environment config: connection string parsing, pool settings

### 1.4 Cache Layer (Currently: 1/8 files tested)

| # | Source File | Lines | Test to Create | Effort |
|---|-----------|-------|---------------|--------|
| 17 | `lib/cache/api-cache-middleware.ts` | 512 | `__tests__/lib/cache/api-cache-middleware.test.ts` | M |
| 18 | `lib/cache/cache-invalidation-strategy.ts` | 632 | `__tests__/lib/cache/cache-invalidation-strategy.test.ts` | M |
| 19 | `lib/cache/browser-cache-headers.ts` | 502 | `__tests__/lib/cache/browser-cache-headers.test.ts` | M |
| 20 | `lib/cache/section-cache.ts` | 343 | `__tests__/lib/cache/section-cache.test.ts` | S |
| 21 | `lib/cache/simple-cache.ts` | 127 | `__tests__/lib/cache/simple-cache.test.ts` | S |

**What to test**:
- Cache middleware: hit/miss logic, TTL, key generation
- Invalidation: cascade invalidation, tag-based clearing
- Browser headers: Cache-Control, ETag generation
- Section cache: course section caching, stale-while-revalidate

### 1.5 Payment Infrastructure (Currently: 0 tests)

| # | Source File | Lines | Test to Create | Effort |
|---|-----------|-------|---------------|--------|
| 22 | `lib/payment/fraud-detection.ts` | 450 | `__tests__/lib/payment/fraud-detection.test.ts` | M |
| 23 | `lib/payment/rate-limit.ts` | 321 | `__tests__/lib/payment/rate-limit.test.ts` | M |

**What to test**:
- Fraud detection: velocity checks, amount thresholds, card fingerprinting
- Payment rate limiting: per-user limits, IP-based throttling

**Phase 1 Total: 23 test files | ~4,500 lines of tests estimated**

---

## Phase 2: Core Business Logic (Weeks 2-3)

**Goal**: Cover SAM AI utilities, critical hooks, server actions, and key API routes.

### 2.1 SAM AI Utilities (Currently: partial/missing)

| # | Source File | Lines | Test to Create | Effort |
|---|-----------|-------|---------------|--------|
| 24 | `lib/sam/providers/ai-registry.ts` | 195 | `__tests__/lib/sam/providers/ai-registry.test.ts` | M |
| 25 | `lib/sam/integration-adapters.ts` | 98 | `__tests__/lib/sam/integration-adapters.test.ts` | S |
| 26 | `lib/sam/utils/error-handler.ts` | 530 | `__tests__/lib/sam/utils/error-handler.test.ts` | M |
| 27 | `lib/sam/middleware/rate-limiter.ts` | 724 | `__tests__/lib/sam/middleware/rate-limiter.test.ts` | M |
| 28 | `lib/adapters/sam-config-factory.ts` | 213 | `__tests__/lib/adapters/sam-config-factory.test.ts` | M |
| 29 | `lib/sam/feature-flags.ts` | ~150 | `__tests__/lib/sam/feature-flags.test.ts` | S |

**What to test**:
- AI registry: provider lookup, capability matching, model availability
- Error handler: circuit breaker open/close/half-open, retry backoff
- Rate limiter: token bucket algorithm, tier-based limits, reset logic
- Config factory: SAMConfig creation, preference resolution

### 2.2 Untested Server Actions

| # | Source File | Lines | Test to Create | Effort |
|---|-----------|-------|---------------|--------|
| 30 | `actions/get-all-courses-optimized.ts` | 361 | `__tests__/actions/get-all-courses-optimized.test.ts` | M |
| 31 | `actions/get-all-posts-optimized.ts` | 328 | `__tests__/actions/get-all-posts-optimized.test.ts` | M |
| 32 | `actions/get-user-courses.ts` | 334 | `__tests__/actions/get-user-courses-full.test.ts` | M |
| 33 | `actions/get-user-posts.ts` | 259 | `__tests__/actions/get-user-posts-full.test.ts` | M |
| 34 | `actions/admin-secure.ts` (expand) | 456 | Expand existing test (158 -> 400+) | M |
| 35 | `app/actions/get-smart-dashboard-data.ts` | ~200 | `__tests__/actions/get-smart-dashboard-data.test.ts` | M |
| 36 | `app/actions/calendar-actions.ts` | ~150 | `__tests__/actions/calendar-actions.test.ts` | S |
| 37 | `app/actions/get-post-data.ts` | ~100 | `__tests__/actions/get-post-data.test.ts` | S |
| 38 | `app/actions/social-media-actions.ts` | ~150 | `__tests__/actions/social-media-actions.test.ts` | S |

### 2.3 Critical Hooks (51 untested)

Top-priority hooks to test first:

| # | Hook File | Test to Create | Effort |
|---|----------|---------------|--------|
| 39 | `hooks/use-sam-sequential-creation.ts` | `__tests__/hooks/use-sam-sequential-creation.test.ts` | L |
| 40 | `hooks/use-practice-session.ts` | `__tests__/hooks/use-practice-session.test.ts` | M |
| 41 | `hooks/use-practice-dashboard.ts` | `__tests__/hooks/use-practice-dashboard.test.ts` | M |
| 42 | `hooks/use-learning-journey.ts` | `__tests__/hooks/use-learning-journey.test.ts` | M |
| 43 | `hooks/use-predictive-analytics.ts` | `__tests__/hooks/use-predictive-analytics.test.ts` | M |
| 44 | `hooks/use-realtime-messages.ts` | `__tests__/hooks/use-realtime-messages.test.ts` | M |
| 45 | `hooks/use-emotion-detection.ts` | `__tests__/hooks/use-emotion-detection.test.ts` | S |
| 46 | `hooks/use-daily-agenda.ts` | `__tests__/hooks/use-daily-agenda.test.ts` | S |
| 47 | `hooks/use-course-analytics.ts` | `__tests__/hooks/use-course-analytics.test.ts` | S |
| 48 | `hooks/use-skill-roadmap-journey.ts` | `__tests__/hooks/use-skill-roadmap-journey.test.ts` | S |
| 49 | `hooks/use-safe-toast.ts` | `__tests__/hooks/use-safe-toast.test.ts` | S |
| 50 | `hooks/use-video-tracking.ts` | `__tests__/hooks/use-video-tracking.test.ts` | S |

### 2.4 Other Critical Lib Files

| # | Source File | Lines | Test to Create | Effort |
|---|-----------|-------|---------------|--------|
| 51 | `lib/stripe.ts` (expand) | 87 | Expand `__tests__/lib/stripe-utils.test.ts` | S |
| 52 | `lib/env-validation.ts` | ~100 | `__tests__/lib/env-validation.test.ts` | S |
| 53 | `lib/certificate/generator.ts` | ~200 | `__tests__/lib/certificate/generator.test.ts` | M |
| 54 | `lib/certificate/service.ts` | ~150 | `__tests__/lib/certificate/service.test.ts` | S |
| 55 | `lib/spaced-repetition/spaced-repetition-service.ts` | ~200 | `__tests__/lib/spaced-repetition/service.test.ts` | M |
| 56 | `lib/error-handling/api-error-handler.ts` | ~150 | `__tests__/lib/error-handling/api-error-handler.test.ts` | S |
| 57 | `lib/error-handling/error-logger.ts` | ~100 | `__tests__/lib/error-handling/error-logger.test.ts` | S |

**Phase 2 Total: ~34 test files | ~8,000 lines of tests estimated**

---

## Phase 3: Component & UI Tests (Weeks 3-4)

**Goal**: Cover critical interactive components that users directly interact with.

### 3.1 SAM AI Components (66 untested — top 15 priority)

| # | Component | Test to Create | Effort |
|---|----------|---------------|--------|
| 58 | `components/sam/SAMAssistant.tsx` | `__tests__/components/sam/SAMAssistant.test.tsx` | L |
| 59 | `components/sam/chat/ChatWindow.tsx` | `__tests__/components/sam/chat/ChatWindow.test.tsx` | L |
| 60 | `components/sam/goal-planner.tsx` | `__tests__/components/sam/goal-planner.test.tsx` | M |
| 61 | `components/sam/sequential-creation-modal.tsx` | `__tests__/components/sam/sequential-creation-modal.test.tsx` | M |
| 62 | `components/sam/KnowledgeGraphBrowser.tsx` | `__tests__/components/sam/KnowledgeGraphBrowser.test.tsx` | M |
| 63 | `components/sam/BloomsMasteryLoop.tsx` | `__tests__/components/sam/BloomsMasteryLoop.test.tsx` | M |
| 64 | `components/sam/QualityScoreDashboard.tsx` | `__tests__/components/sam/QualityScoreDashboard.test.tsx` | M |
| 65 | `components/sam/progress-dashboard.tsx` | `__tests__/components/sam/progress-dashboard.test.tsx` | S |
| 66 | `components/sam/PredictiveInsights.tsx` | `__tests__/components/sam/PredictiveInsights.test.tsx` | S |
| 67 | `components/sam/SpacedRepetitionCalendar.tsx` | `__tests__/components/sam/SpacedRepetitionCalendar.test.tsx` | S |
| 68 | `components/sam/CognitiveLoadMonitor.tsx` | `__tests__/components/sam/CognitiveLoadMonitor.test.tsx` | S |
| 69 | `components/sam/AchievementBadges.tsx` | `__tests__/components/sam/AchievementBadges.test.tsx` | S |
| 70 | `components/sam/offline-indicator.tsx` | `__tests__/components/sam/offline-indicator.test.tsx` | S |
| 71 | `components/sam/sam-error-boundary.tsx` | `__tests__/components/sam/sam-error-boundary.test.tsx` | S |
| 72 | `components/sam/ToolApprovalDialog.tsx` | `__tests__/components/sam/ToolApprovalDialog.test.tsx` | S |

### 3.2 Analytics Components (18 untested — all priority)

| # | Component | Test to Create | Effort |
|---|----------|---------------|--------|
| 73 | `components/analytics/ImprovedUnifiedAnalytics.tsx` | `__tests__/components/analytics/ImprovedUnifiedAnalytics.test.tsx` | M |
| 74 | `components/analytics/BloomsTaxonomyMap.tsx` | `__tests__/components/analytics/BloomsTaxonomyMap.test.tsx` | M |
| 75 | `components/analytics/CognitiveAnalytics.tsx` | `__tests__/components/analytics/CognitiveAnalytics.test.tsx` | M |
| 76 | `components/analytics/SAMInsightsDashboard.tsx` | `__tests__/components/analytics/SAMInsightsDashboard.test.tsx` | M |
| 77 | `components/analytics/TeacherAnalyticsDashboard.tsx` | `__tests__/components/analytics/TeacherAnalyticsDashboard.test.tsx` | M |
| 78 | `components/analytics/personal-learning-progress.tsx` | `__tests__/components/analytics/personal-learning-progress.test.tsx` | S |
| 79 | `components/analytics/ai-insights-panel.tsx` | `__tests__/components/analytics/ai-insights-panel.test.tsx` | S |
| 80 | `components/analytics/StrengthWeaknessAnalysis.tsx` | `__tests__/components/analytics/StrengthWeaknessAnalysis.test.tsx` | S |

### 3.3 Dashboard Components (17 untested — top 8)

| # | Component | Test to Create | Effort |
|---|----------|---------------|--------|
| 81 | `components/dashboard/shell.tsx` | `__tests__/components/dashboard/shell.test.tsx` | M |
| 82 | `components/dashboard/smart-sidebar-client.tsx` | `__tests__/components/dashboard/smart-sidebar-client.test.tsx` | M |
| 83 | `components/dashboard/dashboard-header.tsx` | `__tests__/components/dashboard/dashboard-header.test.tsx` | S |
| 84 | `components/dashboard/overview-cards.tsx` | `__tests__/components/dashboard/overview-cards.test.tsx` | S |
| 85 | `components/dashboard/performance-stats.tsx` | `__tests__/components/dashboard/performance-stats.test.tsx` | S |
| 86 | `components/dashboard/enrolled-courses.tsx` | `__tests__/components/dashboard/enrolled-courses.test.tsx` | S |
| 87 | `components/dashboard/quick-links.tsx` | `__tests__/components/dashboard/quick-links.test.tsx` | S |
| 88 | `components/dashboard/user-profile-summary.tsx` | `__tests__/components/dashboard/user-profile-summary.test.tsx` | S |

### 3.4 Auth Components (22 untested — top 8)

| # | Component | Test to Create | Effort |
|---|----------|---------------|--------|
| 89 | `components/auth/new-password-form.tsx` | `__tests__/components/auth/new-password-form.test.tsx` | M |
| 90 | `components/auth/new-verification-form.tsx` | `__tests__/components/auth/new-verification-form.test.tsx` | M |
| 91 | `components/auth/admin-login-form.tsx` | `__tests__/components/auth/admin-login-form.test.tsx` | M |
| 92 | `components/auth/admin-guard.tsx` | `__tests__/components/auth/admin-guard.test.tsx` | S |
| 93 | `components/auth/permission-guard.tsx` | `__tests__/components/auth/permission-guard.test.tsx` | S |
| 94 | `components/auth/enhanced-logout-button.tsx` | `__tests__/components/auth/enhanced-logout-button.test.tsx` | S |
| 95 | `components/auth/password-strength-meter.tsx` | `__tests__/components/auth/password-strength-meter.test.tsx` | S |
| 96 | `components/auth/card-wrapper.tsx` | `__tests__/components/auth/card-wrapper.test.tsx` | S |

**Phase 3 Total: ~39 test files | ~8,000 lines of tests estimated**

---

## Phase 4: SAM Packages & E2E (Weeks 4-5)

### 4.1 SAM Package Tests (272 source files, 128 test files)

Focus on packages with lowest test-to-source ratio:

| Package | Source Files | Existing Tests | Gap | Priority |
|---------|-------------|---------------|-----|----------|
| `@sam-ai/educational` | ~80 | 30 | 50 | HIGH |
| `@sam-ai/agentic` | ~60 | 27 | 33 | HIGH |
| `@sam-ai/memory` | ~30 | 6 | 24 | MEDIUM |
| `@sam-ai/safety` | ~20 | 4 | 16 | MEDIUM |
| `@sam-ai/core` | ~30 | 4 | 26 | MEDIUM |
| `@sam-ai/pedagogy` | ~20 | 4 | 16 | MEDIUM |
| `@sam-ai/api` | ~20 | 6 | 14 | LOW |
| `@sam-ai/react` | ~30 | 13 | 17 | LOW |
| `@sam-ai/quality` | ~15 | 6 | 9 | LOW |
| `@sam-ai/adapter-prisma` | ~15 | 5 | 10 | LOW |
| `@sam-ai/realtime` | ~10 | 3 | 7 | LOW |

**Target**: Add 30-40 package tests covering the top educational and agentic engines.

### 4.2 E2E Test Expansion (Currently: 8 specs, 54 cases)

| # | E2E Test to Create | Coverage | Effort |
|---|-------------------|----------|--------|
| 97 | `e2e/payment-flow.spec.ts` | Stripe checkout, subscription management | L |
| 98 | `e2e/sam-tutoring.spec.ts` | SAM chat, goal setting, study plans | L |
| 99 | `e2e/admin-dashboard.spec.ts` | Admin CRUD, user management, settings | M |
| 100 | `e2e/course-learning-complete.spec.ts` | Full course completion journey | M |
| 101 | `e2e/blog-reading.spec.ts` | Blog browse, search, read | S |
| 102 | `e2e/certificate-generation.spec.ts` | Course completion and certificate | S |

**Phase 4 Total: ~36 test files | ~6,000 lines of tests estimated**

---

## Phase 5: Remaining Coverage & Maintenance (Ongoing)

### 5.1 Remaining Lib Files

| Area | Files Untested | Priority |
|------|---------------|----------|
| `lib/sam/prompt-registry/` | ~10 profiles | LOW |
| `lib/sam/depth-analysis-v2/` | 3-4 files | MEDIUM |
| `lib/microlearning/` | 3 files | LOW |
| `lib/emotion-detection/` | 3 files | LOW |
| `lib/websocket/` | 1-2 files | LOW |
| `lib/resilience/` | 1-2 files | MEDIUM |

### 5.2 Remaining UI Components

| Area | Untested | Priority |
|------|----------|----------|
| `components/ui/` (design system) | 62 files | LOW (test on-demand) |
| `app/**/_components/` (page-level) | 800+ files | LOW (test critical paths) |

### 5.3 Test Quality Improvements

- Add mutation testing for P0 files (validate test effectiveness)
- Add snapshot tests for complex UI components
- Set up coverage thresholds in CI (fail if coverage drops below 25%)
- Add test performance monitoring (identify slow tests)

---

## Execution Summary

| Phase | Focus | Test Files | Est. Lines | Timeline |
|-------|-------|-----------|-----------|----------|
| **Phase 1** | P0 Infrastructure | 23 | 4,500 | Week 1 |
| **Phase 2** | Core Business Logic | 34 | 8,000 | Weeks 2-3 |
| **Phase 3** | Components & UI | 39 | 8,000 | Weeks 3-4 |
| **Phase 4** | Packages & E2E | 36 | 6,000 | Weeks 4-5 |
| **Phase 5** | Maintenance | Ongoing | Ongoing | Continuous |
| **TOTAL** | | **~132 files** | **~26,500 lines** | **5 weeks** |

### Expected Coverage After Each Phase

| Phase | Est. Line Coverage | Est. Function Coverage |
|-------|-------------------|----------------------|
| Current | 13.1% | 36.8% |
| After Phase 1 | ~20% | ~45% |
| After Phase 2 | ~30% | ~55% |
| After Phase 3 | ~40% | ~62% |
| After Phase 4 | ~50% | ~70% |

---

## Test File Naming & Location Conventions

```
__tests__/
  actions/         # Server action tests
  api/             # API route tests (mirror app/api/ structure)
  auth/            # Core auth config tests
  components/      # Component tests (mirror components/ structure)
  hooks/           # Hook tests
  integration/     # Cross-module integration tests
  lib/             # Library/utility tests (mirror lib/ structure)
  middleware.test.ts
  schemas/
  unit/
```

**Naming**: `{source-file-name}.test.ts` or `{source-file-name}.test.tsx`

## Test Templates

### API Route Test

```typescript
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/{route}/route';

jest.mock('@/lib/db', () => ({
  db: { model: { findMany: jest.fn(), create: jest.fn() } },
}));
jest.mock('@/lib/auth', () => ({ currentUser: jest.fn() }));

describe('API /api/{route}', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    const { currentUser } = require('@/lib/auth');
    currentUser.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/{route}');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns data for authenticated user', async () => { /* ... */ });
  it('validates input with Zod', async () => { /* ... */ });
  it('handles database errors gracefully', async () => { /* ... */ });
});
```

### Component Test

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from '@/components/path/ComponentName';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/test',
}));

describe('ComponentName', () => {
  it('renders with default props', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<ComponentName onAction={jest.fn()} />);
    await user.click(screen.getByRole('button'));
    // assert
  });

  it('shows loading state', () => { /* ... */ });
  it('shows error state', () => { /* ... */ });
  it('renders with empty data', () => { /* ... */ });
});
```

### Hook Test

```typescript
import { renderHook, act } from '@testing-library/react';
import { useHookName } from '@/hooks/use-hook-name';

describe('useHookName', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useHookName());
    expect(result.current.value).toBe(initialValue);
  });

  it('updates state on action', async () => {
    const { result } = renderHook(() => useHookName());
    await act(async () => { result.current.doAction(); });
    expect(result.current.value).toBe(updatedValue);
  });
});
```

---

## CI Integration

Add to `package.json` scripts:
```json
{
  "test:coverage:check": "jest --coverage --coverageThreshold='{\"global\":{\"lines\":25,\"functions\":40}}'",
  "test:phase1": "jest --testPathPattern='__tests__/(auth|lib/(db|cache|payment|permissions|role|auth))'",
  "test:phase2": "jest --testPathPattern='__tests__/(actions|hooks|lib/(sam|adapters|certificate|error))'",
  "test:phase3": "jest --testPathPattern='__tests__/components/(sam|analytics|dashboard|auth)'"
}
```

---

*This plan was generated from a full codebase audit on March 4, 2026.*
*Total source files analyzed: 3,228 | Total test files found: 1,341*
