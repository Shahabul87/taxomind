# Taxomind Platform Audit Fix Plan

**Date:** 2026-02-24
**Overall Health Score:** 52/100 (Target: 80/100)
**Total Findings:** 25+ across 6 domains
**Approach:** Incremental, non-breaking changes. Every fix preserves existing functionality.

---

## Table of Contents

- [Phase 1: Critical Security Fixes (P0)](#phase-1-critical-security-fixes-p0)
- [Phase 2: High Priority Fixes (P1)](#phase-2-high-priority-fixes-p1)
- [Phase 3: Medium Priority Fixes (P2)](#phase-3-medium-priority-fixes-p2)
- [Phase 4: Low Priority Optimizations (P3)](#phase-4-low-priority-optimizations-p3)
- [Safety Protocol](#safety-protocol)
- [Testing Strategy](#testing-strategy)

---

## Safety Protocol

**Before EVERY change:**
1. Run `npm run lint` to confirm clean baseline
2. Run `npm run typecheck:parallel` to confirm no type errors
3. Test the affected page/route manually in dev
4. Commit each phase separately with descriptive messages
5. Push and verify Railway deploy succeeds before next phase

**NEVER:**
- Remove existing auth checks
- Change API response shapes (would break frontend)
- Modify Prisma schema in this plan (schema changes need separate migration plan)
- Remove `'use client'` without verifying no hooks/interactivity used
- Change function signatures of exported functions

---

## Phase 1: Critical Security Fixes (P0)

**Estimated effort:** 2-3 days
**Risk level:** Low (additive changes only -- adding auth/validation, not removing anything)

---

### 1.1 Remove `new Function()` RCE Vector

**File:** `lib/sam/agentic-external-api-tools.ts:466`

**Current (DANGEROUS):**
```typescript
const calculate = new Function(`return ${sanitized}`);
```

**Fix:** Replace with a safe math expression parser. Use `mathjs` or a simple custom evaluator.

```typescript
// Option A: Use mathjs (npm install mathjs)
import { evaluate } from 'mathjs';
const result = evaluate(sanitized); // Safe -- no code execution

// Option B: Simple safe evaluator (no dependency)
function safeEvaluate(expr: string): number {
  // Only allow numbers, operators, parentheses, and decimal points
  const cleaned = expr.replace(/\s/g, '');
  if (!/^[\d+\-*/().%]+$/.test(cleaned)) {
    throw new Error('Invalid expression');
  }
  // Use a simple recursive descent parser instead of Function()
  return Function(`"use strict"; return (${cleaned})`)(); // Still Function but with strict validation
}
```

**Recommended approach:** Option A with `mathjs` is safest. The regex validation in Option B still uses `Function()`.

**Safety:** This only affects the calculator tool in SAM agentic. Test by asking SAM to calculate something.

---

### 1.2 Add Auth to Unprotected Admin Routes (24 routes)

**Pattern:** Add `currentUser()` + role check to each route. These are ADDITIVE changes only.

**Shared auth helper to create first:**

**File:** `lib/middleware/require-admin.ts` (NEW FILE)

```typescript
import { currentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function requireAdmin() {
  const user = await currentUser();
  if (!user?.id) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (user.role !== 'ADMIN') {
    return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { user, error: null };
}

export async function requireAuth() {
  const user = await currentUser();
  if (!user?.id) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { user, error: null };
}
```

**Files to fix (add at top of each handler function):**

```typescript
const { user, error } = await requireAdmin();
if (error) return error;
```

| # | File | Handler(s) |
|---|------|-----------|
| 1 | `app/api/admin/database/performance/route.ts` | GET |
| 2 | `app/api/admin/database/indexes/route.ts` | GET |
| 3 | `app/api/admin/ai-settings/route.ts` | GET, PUT |
| 4 | `app/api/admin/cache/metrics/route.ts` | GET |
| 5 | `app/api/admin/course-creation-slo/route.ts` | GET |
| 6 | `app/api/admin/agentic/tools/[toolId]/route.ts` | GET, PUT, DELETE |
| 7 | `app/api/admin/agentic/tools/permissions/route.ts` | GET, PUT |
| 8 | `app/api/admin/agentic/tools/audit/route.ts` | GET |
| 9 | `app/api/admin/agentic/tools/route.ts` | GET |
| 10 | `app/api/admin/email-queue/route.ts` | GET |
| 11 | `app/api/admin/dashboard/activity/route.ts` | GET |
| 12 | `app/api/admin/dashboard/route.ts` | GET |
| 13 | `app/api/admin/dashboard/stats/route.ts` | GET |
| 14 | `app/api/admin/profile/route.ts` | GET, PUT |
| 15 | `app/api/admin/system-health/route.ts` | GET |
| 16 | `app/api/admin/accounts/[adminId]/route.ts` | GET, PUT, DELETE |
| 17 | `app/api/admin/route.ts` | GET |
| 18 | `app/api/admin/users/[userId]/ai-access/route.ts` | GET, PUT |
| 19 | `app/api/admin/users/[userId]/ai-settings/route.ts` | GET, PUT |
| 20 | `app/api/admin/user-token-usage/route.ts` | GET |
| 21 | `app/api/admin/create/route.ts` | POST |
| 22 | `app/api/admin/ai-usage/route.ts` | GET |
| 23 | `app/api/admin/notifications/route.ts` | GET |
| 24 | `app/api/admin/fix-dashboard-table/route.ts` | POST |

**Safety:** Each route gains auth -- no existing behavior changes for authenticated admins. Unauthenticated requests that previously worked will now get 401/403.

---

### 1.3 Add Auth to Unprotected AI Routes (14 routes -- expensive AI calls)

**Pattern:** Use `requireAuth()` (not `requireAdmin()` -- these are user-facing).

```typescript
const { user, error } = await requireAuth();
if (error) return error;
```

| # | File |
|---|------|
| 1 | `app/api/ai/content-optimizer/route.ts` |
| 2 | `app/api/ai/blueprint-refinement/route.ts` |
| 3 | `app/api/ai/content-curator/route.ts` |
| 4 | `app/api/ai/course-content/route.ts` |
| 5 | `app/api/ai/chapter-content/route.ts` |
| 6 | `app/api/ai/lesson-generator/route.ts` |
| 7 | `app/api/ai/exercise-generator/route.ts` |
| 8 | `app/api/ai/exam-generator/route.ts` |
| 9 | `app/api/ai/section-content/route.ts` |
| 10 | `app/api/ai/chapter-sections/route.ts` |
| 11 | `app/api/ai/advanced-exam-generator/route.ts` |
| 12 | `app/api/ai/unified-generate/route.ts` |
| 13 | `app/api/ai/chapter-generator/route.ts` |
| 14 | `app/api/ai/bulk-chapters/route.ts` |

**Safety:** Only adds auth check. Frontend already sends auth cookies. No breaking change.

---

### 1.4 Secure Cron Routes with CRON_SECRET (12 routes)

**Pattern:** Vercel/Railway cron jobs send a secret header. Validate it.

```typescript
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... existing logic
}
```

| # | File |
|---|------|
| 1 | `app/api/cron/session-notifications/route.ts` |
| 2 | `app/api/cron/sam-mastery-decay/route.ts` |
| 3 | `app/api/cron/sam-proactive/route.ts` |
| 4 | `app/api/cron/session-cleanup/route.ts` |
| 5 | `app/api/cron/practice-review-reminders/route.ts` |
| 6 | `app/api/cron/sam-analytics-rollups/route.ts` |
| 7 | `app/api/cron/task-reminders/route.ts` |
| 8 | `app/api/cron/practice-streaks/route.ts` |
| 9 | `app/api/cron/practice-weekly-goals/route.ts` |
| 10 | `app/api/cron/sam-fairness-audit/route.ts` |
| 11 | `app/api/cron/sam-checkins/route.ts` |

**Also add to `.env.example`:**
```
CRON_SECRET=your-cron-secret-here
```

**Safety:** Cron jobs triggered by Railway/Vercel will need the CRON_SECRET env var set. Set it in Railway dashboard before deploying.

---

### 1.5 Stop Leaking Stack Traces in API Responses (10 routes)

**Pattern:** Remove `stack` from response JSON. Keep it in server logs only.

**Files to fix:**

| # | File | Line | Fix |
|---|------|------|-----|
| 1 | `app/api/admin/users/route.ts` | 628 | Remove `stack` from response |
| 2 | `app/api/dashboard/activities/route.ts` | 240 | Remove `stack` from response |
| 3 | `app/api/sam/enhanced-depth-analysis/route.ts` | 381 | Remove `stack` from response |
| 4 | `app/api/sam/agentic/behavior/track/route.ts` | 231 | Remove `stack` from response |
| 5 | `app/api/teacher/courses/bulk-update/route.ts` | 153 | Remove `stack` from response |
| 6 | `app/api/teacher/courses/bulk-delete/route.ts` | 164 | Remove `stack` from response |
| 7 | `app/api/user/cognitive-growth/[courseId]/route.ts` | 390 | Remove `stack` from response |
| 8 | `app/api/user/cognitive-profile/route.ts` | 365, 678 | Remove `stack` from response |
| 9 | `app/api/analytics/student/route.ts` | 218 | Remove `stack` from response |
| 10 | `app/api/courses/generate-blueprint-stream/route.ts` | 67 | Remove `error.message` from SSE |

**Change pattern for each:**
```typescript
// BEFORE
return NextResponse.json({
  error: error instanceof Error ? error.message : 'Unknown error',
  stack: error instanceof Error ? error.stack : undefined,
}, { status: 500 });

// AFTER
console.error('[RouteNameHere] Error:', error);
return NextResponse.json({
  error: 'Internal server error',
}, { status: 500 });
```

**Safety:** Error responses will be less detailed for clients, but server-side logging retains all info. Frontend error handlers should already handle generic error messages.

---

### 1.6 Fix Wildcard CORS on Non-Public Routes (5 files)

**Files to fix:**

| # | File | Line | Fix |
|---|------|------|-----|
| 1 | `app/api/courses/generate-blueprint-stream/route.ts` | 82 | Replace `'*'` with `process.env.NEXT_PUBLIC_APP_URL` |
| 2 | `app/api/analytics/track/route.ts` | 209 | Replace `'*'` with `process.env.NEXT_PUBLIC_APP_URL` |
| 3 | `app/api/analytics/student/route.ts` | 259 | Remove `|| '*'` fallback |
| 4 | `app/api/production-test/route.ts` | 232, 243 | Replace `'*'` with `process.env.NEXT_PUBLIC_APP_URL` |
| 5 | `app/api/security/csp-report/route.ts` | 300 | CSP report endpoint -- wildcard is acceptable here (browsers need to send reports cross-origin). **No change needed.** |

**Change pattern:**
```typescript
// BEFORE
'Access-Control-Allow-Origin': '*'

// AFTER
'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://taxomind.com'
```

**Safety:** Only restricts CORS. Same-origin requests (which is how the app works) are unaffected.

---

## Phase 2: High Priority Fixes (P1)

**Estimated effort:** 3-5 days
**Risk level:** Low-Medium (mostly additive changes)

---

### 2.1 Add `dangerouslySetInnerHTML` Sanitization (22 files)

**Approach:** Create a shared sanitization utility, then import it in each file.

**File:** `lib/utils/sanitize-html.ts` (NEW FILE)

```typescript
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ADD_TAGS: ['iframe', 'math', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'class', 'style'],
    ALLOW_DATA_ATTR: true,
  });
}

export function createSanitizedMarkup(html: string): { __html: string } {
  return { __html: sanitizeHtml(html) };
}
```

**Dependency:** `npm install isomorphic-dompurify` (if not already installed -- check `package.json` first)

**Files to update (change `dangerouslySetInnerHTML={{ __html: content }}` to `dangerouslySetInnerHTML={createSanitizedMarkup(content)}`):**

| # | File | Line(s) |
|---|------|---------|
| 1 | `app/(course)/courses/[courseId]/learn/_components/interactive-code-viewer.tsx` | 310 |
| 2 | `app/(course)/courses/[courseId]/learn/_components/note-content.tsx` | 67 |
| 3 | `app/blog/[postId]/_components/animated-reading-mode.tsx` | 147, 235 |
| 4 | `app/blog/[postId]/_components/post-card-carousel-model-demo.tsx` | 134, 205 |
| 5 | `app/blog/[postId]/layout.tsx` | 21 |
| 6 | `app/blog/[postId]/page.tsx` | 125 |
| 7 | `app/dashboard/user/messages/_components/search-dialog.tsx` | 327 |
| 8 | `app/dashboard/user/groups/[groupId]/_components/discussions.tsx` | 205 |
| 9 | `app/dashboard/user/groups/[groupId]/_components/discussion-card.tsx` | 59 |
| 10 | `app/(protected)/teacher/courses/[courseId]/_components/what-you-will-learn-form.tsx` | 515 |
| 11 | `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/_explanations/_MathTabComponents/MathExplanationContent.tsx` | 86 |
| 12 | `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/_explanations/components/display-explanations.tsx` | 242 |
| 13 | `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/_explanations/components/explanation-form-fields.tsx` | 621 |
| 14 | `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/code/CodeExplanationDisplay.tsx` | 401, 530 |
| 15 | `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/code/ExplanationTooltip.tsx` | 197, 285 |
| 16 | `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/code/ExplanationPane.tsx` | 246 |
| 17 | `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/math/MathExplanationTooltip.tsx` | 248, 266, 372, 390 |
| 18 | `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/math/MathContentCard.tsx` | 97 |
| 19 | `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/math-equations-list.tsx` | 263 |
| 20 | `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/section-creator-guidelines-form.tsx` | 170 |
| 21 | `components/analytics/tracking-examples.tsx` | 74 |

**DO NOT modify:** JSON-LD structured data in `app/layout.tsx`, `app/courses/page.tsx`, `app/blog/page.tsx` -- these render controlled JSON, not user content.

**Safety:** DOMPurify sanitizes HTML without removing safe content. KaTeX/math tags are allowlisted. Test math rendering, code blocks, and blog content display after change.

---

### 2.2 Add Auth to Content Governance Routes (6 routes)

| # | File | Pattern |
|---|------|---------|
| 1 | `app/api/content-governance/bulk-operations/route.ts` | `requireAuth()` |
| 2 | `app/api/content-governance/workflows/route.ts` | `requireAuth()` |
| 3 | `app/api/content-governance/dashboard/route.ts` | `requireAuth()` |
| 4 | `app/api/content-governance/approvals/[approvalId]/route.ts` | `requireAuth()` |
| 5 | `app/api/content-governance/approvals/route.ts` | `requireAuth()` |
| 6 | `app/api/content-governance/analytics/route.ts` | `requireAuth()` |

---

### 2.3 Add Auth to Remaining High-Risk Routes

| # | File | Auth Type | Reason |
|---|------|-----------|--------|
| 1 | `app/api/sam/ai-tutor/chat/route.ts` | `requireAuth()` | AI chat -- expensive |
| 2 | `app/api/sam/unified/stream/route.ts` | `requireAuth()` | AI streaming |
| 3 | `app/api/sam/unified/route.ts` | `requireAuth()` | AI unified |
| 4 | `app/api/sam/enhanced-universal-assistant/route.ts` | `requireAuth()` | AI assistant |
| 5 | `app/api/sam/calibration/route.ts` | `requireAuth()` | SAM calibration |
| 6 | `app/api/sections/generate-content/route.ts` | `requireAuth()` | Content generation |
| 7 | `app/api/sections/analyze-content/route.ts` | `requireAuth()` | Content analysis |
| 8 | `app/api/sections/[sectionId]/complete/route.ts` | `requireAuth()` | Progress tracking |
| 9 | `app/api/sections/[sectionId]/complete-item/route.ts` | `requireAuth()` | Progress tracking |
| 10 | `app/api/learning-analytics/personal/route.ts` | `requireAuth()` | User analytics |
| 11 | `app/api/learning-analytics/export/route.ts` | `requireAuth()` | Data export |
| 12 | `app/api/knowledge-graph/route.ts` | `requireAuth()` | Knowledge data |
| 13 | `app/api/job-market-mapping/route.ts` | `requireAuth()` | AI analysis |
| 14 | `app/api/spaced-repetition/route.ts` | `requireAuth()` | Learning data |
| 15 | `app/api/cognitive-load/route.ts` | `requireAuth()` | AI analysis |
| 16 | `app/api/adaptive-content/route.ts` | `requireAuth()` | AI content |
| 17 | `app/api/microlearning/route.ts` | `requireAuth()` | AI content |
| 18 | `app/api/prerequisite-tracking/route.ts` | `requireAuth()` | Learning data |
| 19 | `app/api/content/versions/route.ts` | `requireAuth()` | Content versioning |
| 20 | `app/api/content/versions/[versionId]/content/route.ts` | `requireAuth()` | Content versioning |
| 21 | `app/api/content/versions/[versionId]/route.ts` | `requireAuth()` | Content versioning |
| 22 | `app/api/content/rollback/route.ts` | `requireAuth()` | Content rollback |

**Intentionally LEFT without auth (public endpoints):**
- `app/api/health/*` -- health checks must be public
- `app/api/healthz/route.ts` -- health check
- `app/api/monitoring/health/route.ts` -- monitoring
- `app/api/webhook/route.ts` -- Stripe webhook (uses signature verification)
- `app/api/subscription/webhook/route.ts` -- Stripe webhook (uses signature verification)
- `app/api/register/route.ts` -- User registration
- `app/api/auth/*` -- Auth endpoints
- `app/api/courses/public/route.ts` -- Public course listing
- `app/api/public/*` -- Public endpoints
- `app/api/posts/public/route.ts` -- Public posts
- `app/api/newsletter/subscribe/route.ts` -- Newsletter
- `app/api/analytics/web-vitals/route.ts` -- Client-side analytics
- `app/api/analytics/events/route.ts` -- Client-side analytics
- `app/api/analytics/page-load/route.ts` -- Client-side analytics
- `app/api/search/route.ts` -- Public search
- `app/api/docs/route.ts` -- API docs (public)
- `app/api/sitemap.ts` -- SEO

---

### 2.4 Add try-catch to Unprotected API Routes (29 routes)

**Pattern:** Wrap existing handler logic in try-catch.

```typescript
export async function GET(req: NextRequest) {
  try {
    // ... existing logic ...
  } catch (error) {
    console.error('[RouteName] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Files:**

| # | File |
|---|------|
| 1 | `app/api/emotion-detection/route.ts` |
| 2 | `app/api/sections/[sectionId]/complete/route.ts` |
| 3 | `app/api/sections/[sectionId]/complete-item/route.ts` |
| 4 | `app/api/spaced-repetition/route.ts` |
| 5 | `app/api/posts/[postId]/reactions/route.ts` |
| 6 | `app/api/auth/debug/route.ts` |
| 7 | `app/api/knowledge-graph/route.ts` |
| 8 | `app/api/job-market-mapping/route.ts` |
| 9 | `app/api/content-governance/bulk-operations/route.ts` |
| 10 | `app/api/content-governance/workflows/route.ts` |
| 11 | `app/api/content-governance/dashboard/route.ts` |
| 12 | `app/api/content-governance/approvals/[approvalId]/route.ts` |
| 13 | `app/api/content-governance/approvals/route.ts` |
| 14 | `app/api/content-governance/analytics/route.ts` |
| 15 | `app/api/docs/route.ts` |
| 16 | `app/api/prerequisite-tracking/route.ts` |
| 17 | `app/api/deployment-test/route.ts` |
| 18 | `app/api/error-management/metrics/route.ts` |
| 19 | `app/api/error-management/alerts/[alertId]/acknowledge/route.ts` |
| 20 | `app/api/error-management/alerts/route.ts` |
| 21 | `app/api/error-management/errors/route.ts` |
| 22 | `app/api/courses/[courseId]/progress/route.ts` |
| 23 | `app/api/external-integrations/route.ts` |
| 24 | `app/api/ml/training/route.ts` |
| 25 | `app/api/ml/predictions/route.ts` |
| 26 | `app/api/healthz/route.ts` |
| 27 | `app/api/minimal-test/route.ts` |
| 28 | `app/api/microlearning/route.ts` |
| 29 | `app/api/cognitive-load/route.ts` (if not already covered) |

**Safety:** Only adds error handling. No behavior change for successful requests.

---

### 2.5 Remove `force-dynamic` from Root Layout

**File:** `app/layout.tsx:11`

**Current:**
```typescript
export const dynamic = 'force-dynamic';
```

**Fix:** Remove this line entirely. Let each page control its own rendering strategy.

**Safety:** This is the highest-impact performance fix. After removing:
- Pages with `export const dynamic = 'force-dynamic'` will continue to be dynamic
- Pages without any config will default to automatic (Next.js decides based on usage)
- Test key pages: homepage (should use `revalidate = 300`), blog (should use `revalidate = 3600`), course pages, dashboard pages

**Testing required:**
- Homepage loads correctly
- Blog posts load correctly
- Dashboard loads correctly
- Course pages load correctly
- Auth redirects still work

---

### 2.6 Dynamic Import Heavy Libraries

**Pattern:** Wrap heavy component imports with `next/dynamic`.

#### 2.6.1 recharts (31 files)

**Approach:** Create a dynamic wrapper for each chart component. Do NOT dynamically import recharts directly (it has named exports). Instead, wrap the COMPONENT that uses recharts.

**Example for each file:**

For files in `components/sam/analytics/`:
```typescript
// In the PARENT component that imports the chart
import dynamic from 'next/dynamic';

const MasteryProgressChart = dynamic(
  () => import('@/components/sam/analytics/mastery-progress-chart'),
  { ssr: false, loading: () => <div className="h-64 animate-pulse bg-muted rounded" /> }
);
```

**Files where the PARENT should use dynamic import:**

| # | Component File (make exportable) | Parent Should Dynamic Import |
|---|----------------------------------|------------------------------|
| 1 | `components/sam/analytics/mastery-progress-chart.tsx` | Parent page/component |
| 2 | `components/sam/analytics/weekly-trends-chart.tsx` | Parent page/component |
| 3 | `components/sam/analytics/skill-trajectory-chart.tsx` | Parent page/component |
| 4 | `components/sam/analytics/efficiency-dashboard.tsx` | Parent page/component |
| 5 | `components/sam/analytics/level-progression-chart.tsx` | Parent page/component |
| 6 | `components/sam/analytics/retention-curve-chart.tsx` | Parent page/component |
| 7 | `components/sam/analytics/recommendation-insights-widget.tsx` | Parent page/component |
| 8 | `components/sam/student-dashboard/blooms-progress-chart.tsx` | Parent page/component |
| 9 | `components/sam/student-dashboard/cognitive-performance-metrics.tsx` | Parent page/component |
| 10 | `components/ui/analytics-widgets.tsx` | Parent page/component |
| 11 | `components/video/video-analytics-dashboard.tsx` | Parent page/component |
| 12 | `components/analytics/unified-analytics-dashboard.tsx` | Parent page/component |
| 13 | `components/analytics/real-time-dashboard.tsx` | Parent page/component |
| 14 | `components/analytics/enhanced-analytics-dashboard.tsx` | Parent page/component |
| 15 | `components/charts/client-charts.tsx` | Parent page/component |
| 16 | `components/skill-roadmap/SkillDimensionRadar.tsx` | Parent page/component |
| 17 | `components/audit-logging/audit-dashboard.tsx` | Parent page/component |
| 18 | `components/approval-workflows/workflow-dashboard.tsx` | Parent page/component |
| 19 | `components/analytics/tabs/JobMarketTab.tsx` | Parent page/component |

**For page-level recharts usage** (these import recharts directly in a page component):
| # | File | Fix |
|---|------|-----|
| 1 | `app/(dashboard)/job-market-mapping/page.tsx` | Extract chart section into separate component, dynamic import it |
| 2 | `app/(protected)/teacher/posts/all-posts/_components/enhanced-analytics.tsx` | Dynamic import from parent |
| 3 | `app/(protected)/teacher/depth-analyzer/_components/sections/BloomsTaxonomyChart.tsx` | Dynamic import from parent |
| 4 | `app/(protected)/teacher/depth-analyzer/_components/sections/AnalysisHero.tsx` | Dynamic import from parent |
| 5 | `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/cognitive-progression-visualizer.tsx` | Dynamic import from parent |
| 6 | `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/cognitive-analytics-dashboard.tsx` | Dynamic import from parent |
| 7 | `app/(protected)/teacher/courses/[courseId]/_components/depth-analyzer/components/EvidenceTracker.tsx` | Dynamic import from parent |
| 8 | `app/(protected)/teacher/courses/[courseId]/_components/depth-analyzer/components/MultiFrameworkRadar.tsx` | Dynamic import from parent |
| 9 | `app/(protected)/teacher/courses/_components/revenue-chart.tsx` | Dynamic import from parent |
| 10 | `app/(protected)/teacher/courses/_components/category-breakdown-chart.tsx` | Dynamic import from parent |
| 11 | `app/(protected)/teacher/courses/_components/course-drill-down.tsx` | Dynamic import from parent |
| 12 | `app/(protected)/content-governance/dashboard/_components/approval-analytics.tsx` | Dynamic import from parent |

#### 2.6.2 Other Heavy Libraries

| # | File | Library | Fix |
|---|------|---------|-----|
| 1 | `app/(course)/courses/[courseId]/learn/[chapterId]/sections/[sectionId]/_components/completion-certificate.tsx:53-54` | `html2canvas` + `jspdf` | Dynamic import inside the export function: `const html2canvas = (await import('html2canvas')).default;` |
| 2 | `app/(course)/courses/[courseId]/success/page.tsx:38` | `react-confetti` | `const ReactConfetti = dynamic(() => import('react-confetti'), { ssr: false })` |
| 3 | `app/subscription/success/_components/success-client.tsx:6` | `canvas-confetti` | Dynamic import inside useEffect: `const confetti = (await import('canvas-confetti')).default;` |
| 4 | `app/(course)/courses/[courseId]/learn/_components/video-player.tsx:18-19` | `react-youtube` | `const YouTube = dynamic(() => import('react-youtube').then(m => m.default), { ssr: false })` |
| 5 | `app/(course)/courses/[courseId]/learn/[chapterId]/sections/[sectionId]/_components/section-youtube-player.tsx:4` | `react-youtube` | Same pattern |
| 6 | `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/math/KaTeXRenderer.tsx:4` | `katex` | Dynamic import inside component: `const katex = (await import('katex')).default;` |

#### 2.6.3 TipTap (4 files, ~200KB)

| # | File | Fix |
|---|------|-----|
| 1 | `components/tiptap/editor.tsx` | Dynamic import from parent components |
| 2 | `components/tiptap/content-viewer.tsx` | Dynamic import from parent components |
| 3 | `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/_explanations/components/explanation-form-fields.tsx` | Dynamic import editor |
| 4 | `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/_explanations/_CodeTabComponents/CodeExplanationEditor.tsx` | Dynamic import editor |

#### 2.6.4 react-syntax-highlighter (5 files still static)

| # | File | Fix |
|---|------|-----|
| 1 | `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/_explanations/components/display-explanations.tsx` | Add dynamic import |
| 2 | `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/_explanations/_CodeTabComponents/CodeExplanationContent.tsx` | Add dynamic import |
| 3 | `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/_explanations/_CodeTabComponents/CodeBlockTabs.tsx` | Add dynamic import |
| 4 | `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/code/CodeExplanationDisplay.tsx` | Add dynamic import |
| 5 | `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/section/[sectionId]/_components/code/UnifiedCodeView.tsx` | Add dynamic import |

**Safety:** Dynamic imports only delay loading, not remove functionality. Always include a loading skeleton. Test that each component renders correctly after the change.

---

### 2.7 Fix SSR Crash in share-calendar-dialog.tsx

**File:** `app/calendar/_components/share-calendar-dialog.tsx:25`

**Current:**
```typescript
const shareUrl = `${window.location.origin}/calendar/shared/${userId}`;
```

**Fix:**
```typescript
const [shareUrl, setShareUrl] = useState('');

useEffect(() => {
  setShareUrl(`${window.location.origin}/calendar/shared/${userId}`);
}, [userId]);
```

**Safety:** Only changes when the URL string is constructed. UI behavior identical.

---

## Phase 3: Medium Priority Fixes (P2)

**Estimated effort:** 5-7 days
**Risk level:** Medium (requires careful testing of query performance)

---

### 3.1 Add `take` Limits to Critical `findMany` Queries

**Priority order:** Focus on user-facing routes first, then background/analytics routes.

**Pattern:**
```typescript
// BEFORE
const items = await db.model.findMany({ where: { userId } });

// AFTER
const items = await db.model.findMany({ where: { userId }, take: 100 });
```

**Tier 1 -- User-facing routes (fix first):**

| # | File | Line(s) | Model | Suggested `take` |
|---|------|---------|-------|-------------------|
| 1 | `app/api/enrollments/my-courses/route.ts` | 14 | enrollment | 50 |
| 2 | `app/api/posts/public/route.ts` | 11 | post | 20 |
| 3 | `app/api/posts/[postId]/comments/route.ts` | 232 | comment | 50 |
| 4 | `app/api/posts/[postId]/comments/[commentId]/replies/route.ts` | 230 | reply | 30 |
| 5 | `app/api/messages/route.ts` | 32 | message | 50 |
| 6 | `app/api/messages/search/route.ts` | 109 | message | 30 |
| 7 | `app/api/messages/courses/route.ts` | 21, 66 | course | 50 |
| 8 | `app/api/tasks/route.ts` | 16 | task | 100 |
| 9 | `app/api/minds/route.ts` | 51 | mind | 50 |
| 10 | `app/api/calendar/route.ts` | 162, 207 | calendarEvent | 100 |
| 11 | `app/api/calendar/events/route.ts` | 40 | calendarEvent | 100 |
| 12 | `app/api/calendar/search/route.ts` | 20 | calendarEvent | 30 |
| 13 | `app/api/sections/[sectionId]/discussions/route.ts` | 139 | discussion | 50 |
| 14 | `app/api/sections/[sectionId]/bookmarks/route.ts` | 105 | videoBookmark | 50 |
| 15 | `app/api/settings/sessions/route.ts` | 18 | activeSession | 20 |
| 16 | `app/api/cat/item/route.ts` | 80 | cATItem | 50 |
| 17 | `app/sitemap.ts` | 41 | course | 1000 |

**Tier 2 -- Server actions (fix second):**

| # | File | Line(s) | Suggested `take` |
|---|------|---------|-------------------|
| 1 | `app/actions/get-profile-data.ts` | 57, 66, 82, 98, 110, 122 | 50 each |
| 2 | `app/actions/get-smart-dashboard-data.ts` | 75, 187, 213 | 100 each |
| 3 | `app/actions/get-activity-data.ts` | 60 | 100 |
| 4 | `app/actions/social-media-actions.ts` | 380, 408, 416 | 20 each |
| 5 | `app/actions/calendar-actions.ts` | 77, 261 | 100 each |
| 6 | `app/actions/get-similar-posts.ts` | 10 | 10 |

**Tier 3 -- Analytics/teacher routes:**

| # | File | Line(s) | Suggested `take` |
|---|------|---------|-------------------|
| 1 | `app/api/teacher-analytics/courses-dashboard/route.ts` | 27, 171, 265, 298 | 100 |
| 2 | `app/api/teacher-analytics/course-overview/route.ts` | 267, 301, 319, 334 | 200 |
| 3 | `app/api/teacher-analytics/student-profile/route.ts` | 198, 246 | 100 |
| 4 | `app/api/learning-analytics/personal/route.ts` | 144 | 100 |
| 5 | `app/api/learning-analytics/export/route.ts` | 71, 88, 116 | 500 |
| 6 | `app/api/sam/personalization/route.ts` | 185-305 | 100 each |
| 7 | `app/api/sam/unified-analytics/route.ts` | 334-371 | 200 each |
| 8 | `app/api/sam/learning-analytics/generate/route.ts` | 344-414 | 200 each |

**Tier 4 -- lib/ directory (fix last):**

| # | File | Fix |
|---|------|-----|
| 1 | `lib/content-governance.ts` | Add `take: 100` to all 8 queries |
| 2 | `lib/collaborative-editing/*.ts` | Add `take: 100` to all ~15 queries |
| 3 | `lib/adaptive-content/adaptive-content-service.ts` | Add `take: 100` to all 4 queries |
| 4 | `lib/predictive-analytics.ts` | Add `take: 200` to all 3 queries |

**Note:** Do NOT add `take` to queries that are filtered to a single user's enrollments/courses where the result set is naturally bounded (e.g., a user's 10 enrolled courses). Use judgment -- if the `where` clause restricts to user-scoped data AND the table won't have thousands of rows per user, `take` is optional.

**Safety:** Adding `take` limits may silently truncate results. For any query where ALL results are needed (e.g., analytics aggregation, export), add pagination support instead of a hard limit, or use a high `take` value (500-1000).

---

### 3.2 Add `select` to High-Traffic Queries

**Pattern:** Only fetch columns used in the response.

**Top priority files (most traffic):**

| # | File | Current | Fix |
|---|------|---------|-----|
| 1 | `app/api/enrollments/my-courses/route.ts` | Full enrollment + course | Add `select: { id, course: { select: { id, title, imageUrl, description } } }` |
| 2 | `app/api/posts/public/route.ts` | Full post model | Add `select: { id, title, description, imageUrl, createdAt, author: { select: { name, image } } }` |
| 3 | `app/api/messages/route.ts` | Full message model | Add `select: { id, content, createdAt, sender: { select: { name, image } } }` |
| 4 | `app/api/teacher-analytics/courses-dashboard/route.ts` | Full course model | Add `select` with only dashboard-relevant fields |

**Safety:** Only reduces data returned. The response shape may change if frontend uses fields that are no longer returned. Check frontend code for each route before applying `select`.

---

### 3.3 Fix N+1 Queries

**Pattern:** Replace loop-based queries with `include` or `Promise.all`.

| # | File | Lines | Fix |
|---|------|-------|-----|
| 1 | `app/(course)/courses/[courseId]/questions/[questionId]/page.tsx` | 43 | Use `include: { votes: true }` on answer query instead of separate findMany |
| 2 | `app/dashboard/user/groups/my-groups/page.tsx` | 54 | Use `include: { discussions: { take: 5 } }` on group query |
| 3 | `app/api/calendar/learning-sync/route.ts` | 341, 574 | Batch the `findFirst` calls using `findMany` with all IDs, then map results |
| 4 | `app/api/posts/[postId]/postchapters/reorder/route.ts` | 42 | Use `updateMany` or `$transaction` with all updates batched |
| 5 | `app/api/calendar/sync/route.ts` | 47 | Batch upserts into a transaction |

**Safety:** N+1 fixes change query patterns. Test with real data to ensure results are identical.

---

### 3.4 Add Missing `loading.tsx` Files (Top 15 routes)

**Create a simple loading skeleton for each:**

```typescript
// loading.tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
```

**Priority routes (create loading.tsx in these directories):**

| # | Route | Type |
|---|-------|------|
| 1 | `app/dashboard/admin/courses/` | Admin table |
| 2 | `app/dashboard/admin/users/` | Admin table |
| 3 | `app/dashboard/user/profile/` | User profile |
| 4 | `app/(protected)/teacher/courses/` | Course list |
| 5 | `app/(protected)/teacher/courses/[courseId]/` | Course detail |
| 6 | `app/(protected)/teacher/courses/[courseId]/analytics/` | Analytics |
| 7 | `app/(protected)/settings/` | Settings form |
| 8 | `app/courses/` | Course browse |
| 9 | `app/(course)/courses/[courseId]/checkout/` | Checkout |
| 10 | `app/dashboard/user/groups/my-groups/` | Group list |
| 11 | `app/(protected)/teacher/posts/all-posts/` | Post list |
| 12 | `app/(protected)/teacher/depth-analyzer/` | Analyzer |
| 13 | `app/(protected)/search/` | Search results |
| 14 | `app/(protected)/content-governance/dashboard/` | Dashboard |
| 15 | `app/dashboard/admin/dashboard/` | Admin dashboard |

**Safety:** Adding `loading.tsx` only improves UX. No behavior change. The skeleton shows while the page data loads.

---

### 3.5 Guard `error.message` in API Responses (~70 routes)

**Create a shared error response utility:**

**File:** `lib/utils/api-error.ts` (NEW FILE)

```typescript
export function safeErrorMessage(error: unknown): string {
  if (process.env.NODE_ENV === 'development') {
    return error instanceof Error ? error.message : String(error);
  }
  return 'Internal server error';
}

export function createErrorResponse(error: unknown, status = 500) {
  console.error('[API Error]:', error);
  return NextResponse.json(
    { error: safeErrorMessage(error) },
    { status }
  );
}
```

Then gradually replace `error: error instanceof Error ? error.message : 'Unknown error'` with `error: safeErrorMessage(error)` across all API routes.

**This is a large-scale change -- do it incrementally by domain:**
1. First: admin routes
2. Second: AI/SAM routes
3. Third: user-facing routes
4. Fourth: analytics routes

---

### 3.6 Add `server-only` to Critical Server Modules

| # | File | Fix |
|---|------|-----|
| 1 | `lib/db.ts` | Add `import 'server-only';` at top |
| 2 | `lib/stripe.ts` | Add `import 'server-only';` at top |
| 3 | `lib/auth.ts` | Add `import 'server-only';` at top |
| 4 | `lib/redis.ts` | Add `import 'server-only';` at top |

**Safety:** If any client component accidentally imports these, it will get a build error (which is the desired behavior -- it prevents secret leakage). Check that no client components import these before adding.

---

### 3.7 Fix Memory Leaks (Event Listeners / Intervals)

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `components/learner/level-up-celebration.tsx:77` | `setInterval` without cleanup | Store interval ID in ref, clear in useEffect return |
| 2 | `components/analytics/enhanced-analytics-dashboard.tsx:373` | `setInterval` without cleanup | Store interval ID, clear on unmount |
| 3 | `components/dashboard/smart-sidebar.tsx:102` | `setInterval(fetchUnreadCount, 30000)` | Store ID, clear on unmount |
| 4 | `components/analytics/AdminAnalyticsDashboard.tsx:31` | `setInterval(fetchSystemData, 30000)` | Store ID, clear on unmount |
| 5 | `components/auth/admin-login-background.tsx:134` | `addEventListener("resize")` | Add `removeEventListener` in useEffect cleanup |
| 6 | `components/service-worker-manager.tsx:60,84-85` | Multiple `addEventListener` calls | Add corresponding `removeEventListener` in cleanup |

**Pattern:**
```typescript
useEffect(() => {
  const intervalId = setInterval(callback, delay);
  return () => clearInterval(intervalId); // CLEANUP
}, []);
```

---

## Phase 4: Low Priority Optimizations (P3)

**Estimated effort:** 3-4 days
**Risk level:** Low

---

### 4.1 Add Missing Indexes to Prisma Schema

**IMPORTANT:** Schema changes require `npx prisma migrate dev`. Test locally first. These are additive-only (adding indexes never breaks existing data).

**File:** `prisma/domains/03-learning.prisma`

```prisma
model Course {
  // ... existing fields ...
  @@index([userId])
  @@index([categoryId])
  @@index([isPublished])
  @@index([createdAt])
}

model Enrollment {
  // ... existing fields ...
  @@index([userId])
  @@index([courseId])
  @@unique([userId, courseId])
}

model Purchase {
  // ... existing fields ...
  @@index([userId])
  @@index([courseId])
  @@unique([userId, courseId])
}

model Chapter {
  // ... existing fields ...
  @@index([courseId])
  @@index([position])
}

model Section {
  // ... existing fields ...
  @@index([chapterId])
}
```

**File:** `prisma/domains/06-analytics.prisma`

```prisma
model Activity {
  @@index([userId])
  @@index([createdAt])
}

model user_progress {
  @@index([userId])
  @@index([chapterId])
}
```

**File:** `prisma/domains/07-social.prisma`

```prisma
model Message {
  @@index([senderId])
  @@index([receiverId])
  @@index([conversationId])
}

model CalendarEvent {
  @@index([userId])
  @@index([startTime])
}
```

**File:** `prisma/domains/08-ai.prisma`

```prisma
model SAMConversation {
  @@index([userId])
  @@index([courseId])
}

model SAMInteraction {
  @@index([userId])
  @@index([createdAt])
}
```

**Safety:** Adding indexes is a non-destructive operation. It will lock the table briefly during creation. For tables with millions of rows, create indexes during low-traffic hours. Run `npx prisma migrate dev --create-only --name add_indexes` to generate the migration without applying, review it, then apply.

---

### 4.2 Add `optimizePackageImports` for Missing Packages

**File:** `next.config.js` (update the `optimizeImports` array)

```javascript
const optimizeImports = [
  // EXISTING
  'lucide-react',
  '@radix-ui/react-*',
  'date-fns',
  'lodash',
  '@tiptap/react',
  '@tiptap/starter-kit',
  'react-hook-form',
  'zod',
  'recharts',
  '@headlessui/react',
  'react-hot-toast',
  // ADD THESE
  'react-syntax-highlighter',
  'react-youtube',
  'canvas-confetti',
  'react-confetti',
  'katex',
  'framer-motion',
  '@tiptap/extension-*',
];
```

**Safety:** This only improves tree-shaking. No behavior change.

---

### 4.3 Replace `export * from` in Barrel Files

**File:** `components/sam/practice-dashboard/index.ts`

```typescript
// BEFORE
export * from './types';

// AFTER
export type { PracticeProblem, PracticeSession, PracticeStats } from './types';
// Only export the specific types that are actually used externally
```

**Safety:** Check all imports from this module first. Only export what is actually imported elsewhere.

---

### 4.4 Fix Full Lodash Imports

| # | File | Line | Current | Fix |
|---|------|------|---------|-----|
| 1 | `app/(course)/courses/[courseId]/learn/[chapterId]/sections/[sectionId]/_components/learning-analytics-tracker.tsx` | 6 | `import { debounce } from "lodash"` | `import debounce from 'lodash/debounce'` |
| 2 | `app/(course)/courses/[courseId]/_components/course-info-card.tsx` | 16 | `import { throttle } from 'lodash'` | `import throttle from 'lodash/throttle'` |
| 3 | `app/(course)/courses/[courseId]/_components/course-info-card-professional.tsx` | 37 | `import { throttle } from 'lodash'` | `import throttle from 'lodash/throttle'` |

**Safety:** Functionally identical. The specific import path avoids pulling in the entire lodash bundle even when `optimizePackageImports` misses something.

---

### 4.5 Convert CommonJS `require()` to ESM in Client-Side Code

| # | File | Line(s) | Fix |
|---|------|---------|-----|
| 1 | `components/tiptap/content-viewer.tsx` | 19, 25, 31, 37 | Convert `require('@tiptap/extension-*')` to `import` |
| 2 | `components/tiptap/editor.tsx` | 44, 50, 56, 62 | Convert `require('@tiptap/extension-*')` to `import` |

**Note:** If these are conditional requires (inside try-catch), convert to dynamic `import()` instead:
```typescript
// BEFORE
try { const ext = require('@tiptap/extension-foo'); } catch {}

// AFTER
let ext;
try { ext = await import('@tiptap/extension-foo'); } catch {}
```

**Safety:** The `require()` calls in `lib/` files for `crypto`, `fs`, `path`, `perf_hooks` are server-only and should NOT be changed (they are Node.js built-ins).

---

### 4.6 Consolidate Redis Connections

**Current state:** 3 different Redis libraries (`ioredis`, `@upstash/redis`, `redis`) with 18+ independent instances.

**Approach:** This is a large refactor. For now, document the pattern and plan for a future dedicated PR.

**Immediate fix:** Create a centralized Redis factory:

**File:** `lib/redis/factory.ts` (NEW FILE)

```typescript
import { Redis as UpstashRedis } from '@upstash/redis';

let _upstashClient: UpstashRedis | null = null;

export function getUpstashRedis(): UpstashRedis {
  if (!_upstashClient) {
    _upstashClient = new UpstashRedis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _upstashClient;
}
```

Then gradually migrate files to use `getUpstashRedis()` instead of `new Redis({...})`.

**This is a SEPARATE PR -- too large for this audit fix plan.**

---

## Testing Strategy

### Phase 1 Testing
- [ ] Try accessing each admin route without auth (should get 401/403)
- [ ] Try accessing each admin route WITH admin auth (should work normally)
- [ ] Try accessing AI routes without auth (should get 401)
- [ ] Try accessing AI routes WITH user auth (should work normally)
- [ ] Verify SAM calculator still works without `new Function()`
- [ ] Check that no API routes return stack traces
- [ ] Check CORS headers on blueprint stream endpoint

### Phase 2 Testing
- [ ] Verify all blog post content renders correctly (DOMPurify)
- [ ] Verify math/KaTeX content renders correctly
- [ ] Verify code syntax highlighting still works
- [ ] Test course success page confetti animation
- [ ] Test certificate generation (html2canvas + jsPDF)
- [ ] Test video player (react-youtube)
- [ ] Verify share calendar dialog doesn't crash on SSR
- [ ] Test all dynamically imported components load correctly

### Phase 3 Testing
- [ ] Run `npm run build` to verify no build errors
- [ ] Check that list/search queries still return expected results (with `take` limits)
- [ ] Verify loading skeletons appear on slow connections
- [ ] Test admin dashboard, user dashboard, teacher dashboard
- [ ] Run `npm run lint` and `npm run typecheck:parallel`

### Phase 4 Testing
- [ ] Run `npx prisma migrate dev` locally to verify index migrations
- [ ] Check build times before/after `optimizePackageImports` changes
- [ ] Verify TipTap editor and content viewer still render correctly

---

## Execution Order

```
Week 1: Phase 1 (Critical Security)
  Day 1: Fix 1.1 (new Function), 1.5 (stack traces), 1.6 (CORS)
  Day 2: Fix 1.2 (admin auth), 1.3 (AI auth)
  Day 3: Fix 1.4 (cron auth) + testing + deploy

Week 2: Phase 2 (High Priority)
  Day 1: Fix 2.1 (XSS sanitization)
  Day 2: Fix 2.2-2.3 (remaining auth), 2.4 (try-catch)
  Day 3: Fix 2.5 (force-dynamic), 2.7 (SSR crash)
  Day 4-5: Fix 2.6 (dynamic imports) + testing + deploy

Week 3: Phase 3 (Medium Priority)
  Day 1-2: Fix 3.1 (take limits)
  Day 2-3: Fix 3.4 (loading.tsx), 3.5 (error messages)
  Day 3-4: Fix 3.2 (select), 3.3 (N+1), 3.6-3.7 (misc)
  Day 5: Testing + deploy

Week 4: Phase 4 (Low Priority)
  Day 1: Fix 4.1 (indexes) - create migration, test locally
  Day 2: Fix 4.2-4.5 (bundle optimizations)
  Day 3: Testing + deploy
```

---

## Expected Score Improvement

| Domain | Current | After Phase 1 | After Phase 2 | After Phase 3 | After Phase 4 |
|--------|---------|---------------|---------------|---------------|---------------|
| Security | 30/100 | 70/100 | 85/100 | 90/100 | 90/100 |
| Performance | 45/100 | 45/100 | 65/100 | 80/100 | 85/100 |
| Bundle | 40/100 | 40/100 | 70/100 | 70/100 | 80/100 |
| Database | 35/100 | 35/100 | 35/100 | 65/100 | 80/100 |
| React | 65/100 | 65/100 | 70/100 | 75/100 | 80/100 |
| API | 50/100 | 70/100 | 80/100 | 85/100 | 85/100 |
| **Overall** | **52/100** | **58/100** | **70/100** | **78/100** | **83/100** |
