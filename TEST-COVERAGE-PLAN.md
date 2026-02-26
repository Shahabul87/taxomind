# Taxomind Test Coverage Analysis & Plan

**Generated**: 2026-02-25
**Current State**: 488 test files, ~9,557 test cases

---

## Executive Summary

| Category | Source Files | Test Files | Coverage % | Gap |
|----------|-------------|------------|------------|-----|
| **API Routes** | 812 | 94 | **11.6%** | 718 routes untested |
| **Components** | 1,856 (app+components) | 34 | **1.8%** | ~1,822 untested |
| **Hooks** | 84 | 23 | **27.4%** | 61 untested |
| **Lib/Utilities** | 860 | 78 | **9.1%** | ~782 untested |
| **Actions** | 33 | 24 | **72.7%** | 9 untested |
| **Packages (@sam-ai)** | ~350+ | 128 | **~36.6%** | ~222 untested |
| **Integration** | - | 6 | - | Need more |
| **E2E** | - | 9 | - | Need more |
| **TOTAL** | **~3,995** | **488** | **~12.2%** | **~3,507** |

---

## PHASE 1: CRITICAL PRIORITY (Security, Auth, Payments)

### 1.1 Untested Actions (9 files)

| # | Source File | Test File to Create | Priority |
|---|-----------|-------------------|----------|
| 1 | `actions/admin-role-management.ts` | `__tests__/actions/admin-role-management.test.ts` | HIGH |
| 2 | `actions/admin/login.ts` | `__tests__/actions/admin/login.test.ts` | HIGH |
| 3 | `actions/admin/logout.ts` | `__tests__/actions/admin/logout.test.ts` | HIGH |
| 4 | `actions/admin/reset.ts` | `__tests__/actions/admin/reset.test.ts` | HIGH |
| 5 | `actions/get-homepage-content.ts` | `__tests__/actions/get-homepage-content.test.ts` | MEDIUM |
| 6 | `actions/mfa-totp.ts` | `__tests__/actions/mfa-totp.test.ts` | HIGH |
| 7 | `actions/register-teacher.ts` | `__tests__/actions/register-teacher.test.ts` | HIGH |
| 8 | `actions/register.ts` | `__tests__/actions/register.test.ts` | HIGH |
| 9 | `actions/resend-verification.ts` | `__tests__/actions/resend-verification.test.ts` | MEDIUM |
| 10 | `actions/settings.ts` | `__tests__/actions/settings.test.ts` | MEDIUM |

### 1.2 Critical Lib Files Missing Tests

| # | Source File | Test File to Create | Priority |
|---|-----------|-------------------|----------|
| 1 | `lib/tokens.ts` | `__tests__/lib/tokens.test.ts` | HIGH |
| 2 | `lib/auth-dynamic.ts` | `__tests__/lib/auth-dynamic.test.ts` | HIGH |
| 3 | `lib/auth-error-handler.ts` | `__tests__/lib/auth-error-handler.test.ts` | HIGH |
| 4 | `lib/auth-rate-limit-middleware.ts` | `__tests__/lib/auth-rate-limit-middleware.test.ts` | HIGH |
| 5 | `lib/api-security.ts` | `__tests__/lib/api-security.test.ts` | HIGH |
| 6 | `lib/api-protection.ts` | `__tests__/lib/api-protection.test.ts` | HIGH |
| 7 | `lib/with-api-auth.ts` | `__tests__/lib/with-api-auth.test.ts` | HIGH |
| 8 | `lib/password-security.ts` | `__tests__/lib/password-security.test.ts` | HIGH |
| 9 | `lib/passwordUtils.ts` | `__tests__/lib/passwordUtils.test.ts` | HIGH |
| 10 | `lib/session-fingerprint.ts` | `__tests__/lib/session-fingerprint.test.ts` | HIGH |

### 1.3 Critical API Routes (Auth, Payments, User Data)

| # | API Route | Test File to Create | Priority |
|---|----------|-------------------|----------|
| 1 | `app/api/register/route.ts` | `__tests__/api/register.test.ts` | HIGH |
| 2 | `app/api/profile/route.ts` | `__tests__/api/profile.test.ts` | HIGH |
| 3 | `app/api/profile/image/route.ts` | `__tests__/api/profile/image.test.ts` | HIGH |
| 4 | `app/api/settings/delete-account/route.ts` | `__tests__/api/settings/delete-account.test.ts` | HIGH |
| 5 | `app/api/settings/export-data/route.ts` | `__tests__/api/settings/export-data.test.ts` | HIGH |
| 6 | `app/api/settings/preferences/route.ts` | `__tests__/api/settings/preferences.test.ts` | HIGH |
| 7 | `app/api/settings/sessions/route.ts` | `__tests__/api/settings/sessions.test.ts` | HIGH |
| 8 | `app/api/settings/ai-preferences/route.ts` | `__tests__/api/settings/ai-preferences.test.ts` | MEDIUM |
| 9 | `app/api/settings/ai-providers/route.ts` | `__tests__/api/settings/ai-providers.test.ts` | MEDIUM |
| 10 | `app/api/settings/upload-avatar/route.ts` | `__tests__/api/settings/upload-avatar.test.ts` | MEDIUM |
| 11 | `app/api/security/alerts/route.ts` | `__tests__/api/security/alerts.test.ts` | HIGH |
| 12 | `app/api/security/csp-report/route.ts` | `__tests__/api/security/csp-report.test.ts` | HIGH |
| 13 | `app/api/compliance/gdpr/route.ts` | `__tests__/api/compliance/gdpr.test.ts` | HIGH |
| 14 | `app/api/compliance/soc2/report/route.ts` | `__tests__/api/compliance/soc2-report.test.ts` | HIGH |
| 15 | `app/api/upload/route.ts` | `__tests__/api/upload.test.ts` | HIGH |

**Phase 1 Total: ~35 test files**

---

## PHASE 2: CORE BUSINESS LOGIC (Courses, Enrollment, Content)

### 2.1 Course Management API Routes

| # | API Route | Test File to Create |
|---|----------|-------------------|
| 1 | `app/api/courses/route.ts` | `__tests__/api/courses/index.test.ts` |
| 2 | `app/api/courses/[courseId]/route.ts` | `__tests__/api/courses/courseId.test.ts` |
| 3 | `app/api/courses/[courseId]/chapters/route.ts` | `__tests__/api/courses/chapters.test.ts` |
| 4 | `app/api/courses/[courseId]/chapters/[chapterId]/route.ts` | `__tests__/api/courses/chapter-detail.test.ts` |
| 5 | `app/api/courses/[courseId]/chapters/[chapterId]/sections/route.ts` | `__tests__/api/courses/sections.test.ts` |
| 6 | `app/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/route.ts` | `__tests__/api/courses/section-detail.test.ts` |
| 7 | `app/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/exams/route.ts` | `__tests__/api/courses/section-exams.test.ts` |
| 8 | `app/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/videos/route.ts` | `__tests__/api/courses/section-videos.test.ts` |
| 9 | `app/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/code-blocks/route.ts` | `__tests__/api/courses/code-blocks.test.ts` |
| 10 | `app/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/code-explanations/route.ts` | `__tests__/api/courses/code-explanations.test.ts` |
| 11 | `app/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/math-equations/route.ts` | `__tests__/api/courses/math-equations.test.ts` |
| 12 | `app/api/courses/[courseId]/publish/route.ts` | `__tests__/api/courses/publish.test.ts` |
| 13 | `app/api/courses/[courseId]/unpublish/route.ts` | `__tests__/api/courses/unpublish.test.ts` |
| 14 | `app/api/courses/[courseId]/checkout/route.ts` | `__tests__/api/courses/checkout.test.ts` |
| 15 | `app/api/courses/[courseId]/enrollment/route.ts` | `__tests__/api/courses/enrollment.test.ts` |
| 16 | `app/api/courses/[courseId]/reviews/route.ts` | `__tests__/api/courses/reviews.test.ts` |
| 17 | `app/api/courses/[courseId]/questions/route.ts` | `__tests__/api/courses/questions.test.ts` |
| 18 | `app/api/courses/[courseId]/attachments/route.ts` | `__tests__/api/courses/attachments.test.ts` |
| 19 | `app/api/courses/[courseId]/image/route.ts` | `__tests__/api/courses/image.test.ts` |
| 20 | `app/api/courses/[courseId]/syllabus/route.ts` | `__tests__/api/courses/syllabus.test.ts` |
| 21 | `app/api/courses/search/route.ts` | `__tests__/api/courses/search.test.ts` |
| 22 | `app/api/courses/public/route.ts` | `__tests__/api/courses/public.test.ts` |
| 23 | `app/api/courses/generate-blueprint/route.ts` | `__tests__/api/courses/generate-blueprint.test.ts` |
| 24 | `app/api/courses/category-benchmarks/route.ts` | `__tests__/api/courses/category-benchmarks.test.ts` |
| 25 | `app/api/categories/route.ts` | `__tests__/api/categories.test.ts` |

### 2.2 Exam & Assessment Routes

| # | API Route | Test File to Create |
|---|----------|-------------------|
| 1 | `app/api/exams/generate/route.ts` | `__tests__/api/exams/generate.test.ts` |
| 2 | `app/api/exams/evaluate/route.ts` | `__tests__/api/exams/evaluate.test.ts` |
| 3 | `app/api/exams/attempts/route.ts` | `__tests__/api/exams/attempts.test.ts` |
| 4 | `app/api/exams/grading-queue/route.ts` | `__tests__/api/exams/grading-queue.test.ts` |
| 5 | `app/api/exams/results/[attemptId]/route.ts` | `__tests__/api/exams/results.test.ts` |
| 6 | `app/api/self-assessment/exams/route.ts` | `__tests__/api/self-assessment/exams.test.ts` |
| 7 | `app/api/self-assessment/exams/[examId]/attempts/route.ts` | `__tests__/api/self-assessment/attempts.test.ts` |

### 2.3 Post/Blog Routes

| # | API Route | Test File to Create |
|---|----------|-------------------|
| 1 | `app/api/posts/route.ts` | `__tests__/api/posts/index.test.ts` |
| 2 | `app/api/posts/[postId]/route.ts` | `__tests__/api/posts/detail.test.ts` |
| 3 | `app/api/posts/[postId]/comments/route.ts` | `__tests__/api/posts/comments.test.ts` |
| 4 | `app/api/posts/[postId]/reactions/route.ts` | `__tests__/api/posts/reactions.test.ts` |
| 5 | `app/api/posts/[postId]/postchapters/route.ts` | `__tests__/api/posts/postchapters.test.ts` |
| 6 | `app/api/posts/public/route.ts` | `__tests__/api/posts/public.test.ts` |

### 2.4 Core Lib Files

| # | Source File | Test File to Create |
|---|-----------|-------------------|
| 1 | `lib/validations/` (all files) | `__tests__/lib/validations.test.ts` |
| 2 | `lib/schemas/` (all files) | `__tests__/lib/schemas.test.ts` |
| 3 | `lib/email-templates.ts` | `__tests__/lib/email-templates.test.ts` |
| 4 | `lib/email-queue.ts` | `__tests__/lib/email-queue.test.ts` |
| 5 | `lib/rate-limit.ts` | `__tests__/lib/rate-limit.test.ts` |
| 6 | `lib/rate-limiter.ts` | `__tests__/lib/rate-limiter.test.ts` |
| 7 | `lib/cloudinary-utils.ts` | `__tests__/lib/cloudinary-utils.test.ts` |
| 8 | `lib/notification-service.ts` | `__tests__/lib/notification-service.test.ts` |
| 9 | `lib/db-pooled.ts` | `__tests__/lib/db-pooled.test.ts` |
| 10 | `lib/distributed-lock.ts` | `__tests__/lib/distributed-lock.test.ts` |

**Phase 2 Total: ~48 test files**

---

## PHASE 3: DASHBOARD & USER-FACING FEATURES

### 3.1 Dashboard API Routes

| # | API Route | Test File to Create |
|---|----------|-------------------|
| 1 | `app/api/dashboard/todos/route.ts` | `__tests__/api/dashboard/todos.test.ts` |
| 2 | `app/api/dashboard/study-plans/route.ts` | `__tests__/api/dashboard/study-plans.test.ts` |
| 3 | `app/api/dashboard/goals/route.ts` | `__tests__/api/dashboard/goals.test.ts` |
| 4 | `app/api/dashboard/sessions/route.ts` | `__tests__/api/dashboard/sessions.test.ts` |
| 5 | `app/api/dashboard/notifications/route.ts` | `__tests__/api/dashboard/notifications.test.ts` |
| 6 | `app/api/dashboard/streak/route.ts` | `__tests__/api/dashboard/streak.test.ts` |
| 7 | `app/api/dashboard/heatmap/route.ts` | `__tests__/api/dashboard/heatmap.test.ts` |
| 8 | `app/api/dashboard/daily/route.ts` | `__tests__/api/dashboard/daily.test.ts` |
| 9 | `app/api/dashboard/preferences/route.ts` | `__tests__/api/dashboard/preferences.test.ts` |
| 10 | `app/api/dashboard/reminders/route.ts` | `__tests__/api/dashboard/reminders.test.ts` |
| 11 | `app/api/dashboard/activities/route.ts` | `__tests__/api/dashboard/activities.test.ts` |
| 12 | `app/api/dashboard/notes/route.ts` | `__tests__/api/dashboard/notes.test.ts` |
| 13 | `app/api/dashboard/gantt/route.ts` | `__tests__/api/dashboard/gantt.test.ts` |
| 14 | `app/api/dashboard/learning-notifications/route.ts` | `__tests__/api/dashboard/learning-notifications.test.ts` |

### 3.2 Gamification & Engagement Routes

| # | API Route | Test File to Create |
|---|----------|-------------------|
| 1 | `app/api/gamification/route.ts` | `__tests__/api/gamification/index.test.ts` |
| 2 | `app/api/gamification/achievements/route.ts` | `__tests__/api/gamification/achievements.test.ts` |
| 3 | `app/api/gamification/leaderboard/route.ts` | `__tests__/api/gamification/leaderboard.test.ts` |
| 4 | `app/api/gamification/xp/route.ts` | `__tests__/api/gamification/xp.test.ts` |
| 5 | `app/api/badges/check/route.ts` | `__tests__/api/badges/check.test.ts` |
| 6 | `app/api/badges/user/route.ts` | `__tests__/api/badges/user.test.ts` |

### 3.3 Untested Hooks (61 hooks)

| # | Hook File | Test File to Create | Priority |
|---|----------|-------------------|----------|
| 1 | `hooks/use-admin.ts` | `__tests__/hooks/use-admin.test.ts` | HIGH |
| 2 | `hooks/use-advanced-analytics.ts` | `__tests__/hooks/use-advanced-analytics.test.ts` | MEDIUM |
| 3 | `hooks/use-ai-analytics-insights.ts` | `__tests__/hooks/use-ai-analytics-insights.test.ts` | MEDIUM |
| 4 | `hooks/use-ai-course-integration.ts` | `__tests__/hooks/use-ai-course-integration.test.ts` | MEDIUM |
| 5 | `hooks/use-activities.ts` | `__tests__/hooks/use-activities.test.ts` | MEDIUM |
| 6 | `hooks/use-calendar-sync.ts` | `__tests__/hooks/use-calendar-sync.test.ts` | LOW |
| 7 | `hooks/use-click-tracking.ts` | `__tests__/hooks/use-click-tracking.test.ts` | LOW |
| 8 | `hooks/use-collaborative-editing.ts` | `__tests__/hooks/use-collaborative-editing.test.ts` | MEDIUM |
| 9 | `hooks/use-content-versioning.ts` | `__tests__/hooks/use-content-versioning.test.ts` | MEDIUM |
| 10 | `hooks/use-course-analytics.ts` | `__tests__/hooks/use-course-analytics.test.ts` | MEDIUM |
| 11 | `hooks/use-daily-agenda.ts` | `__tests__/hooks/use-daily-agenda.test.ts` | LOW |
| 12 | `hooks/use-dashboard-analytics.ts` | `__tests__/hooks/use-dashboard-analytics.test.ts` | MEDIUM |
| 13 | `hooks/use-dynamic-import.ts` | `__tests__/hooks/use-dynamic-import.test.ts` | LOW |
| 14 | `hooks/use-emotion-detection.ts` | `__tests__/hooks/use-emotion-detection.test.ts` | LOW |
| 15 | `hooks/use-enrolled-course-analytics.ts` | `__tests__/hooks/use-enrolled-course-analytics.test.ts` | MEDIUM |
| 16 | `hooks/use-form-tracking.ts` | `__tests__/hooks/use-form-tracking.test.ts` | LOW |
| 17 | `hooks/use-gantt-timeline.ts` | `__tests__/hooks/use-gantt-timeline.test.ts` | LOW |
| 18 | `hooks/use-guided-tour.ts` | `__tests__/hooks/use-guided-tour.test.ts` | LOW |
| 19 | `hooks/use-intelligent-onboarding.ts` | `__tests__/hooks/use-intelligent-onboarding.test.ts` | LOW |
| 20 | `hooks/use-layout-dimensions.ts` | `__tests__/hooks/use-layout-dimensions.test.ts` | LOW |
| 21 | `hooks/use-learning-activities.ts` | `__tests__/hooks/use-learning-activities.test.ts` | MEDIUM |
| 22 | `hooks/use-learning-journey.ts` | `__tests__/hooks/use-learning-journey.test.ts` | MEDIUM |
| 23 | `hooks/use-learning-notifications.ts` | `__tests__/hooks/use-learning-notifications.test.ts` | MEDIUM |
| 24 | `hooks/use-learning-style.ts` | `__tests__/hooks/use-learning-style.test.ts` | MEDIUM |
| 25 | `hooks/use-notification-preferences.ts` | `__tests__/hooks/use-notification-preferences.test.ts` | MEDIUM |
| 26 | `hooks/use-practice-dashboard.ts` | `__tests__/hooks/use-practice-dashboard.test.ts` | MEDIUM |
| 27 | `hooks/use-practice-reviews.ts` | `__tests__/hooks/use-practice-reviews.test.ts` | MEDIUM |
| 28 | `hooks/use-practice-session.ts` | `__tests__/hooks/use-practice-session.test.ts` | MEDIUM |
| 29 | `hooks/use-practice-timer.ts` | `__tests__/hooks/use-practice-timer.test.ts` | LOW |
| 30 | `hooks/use-predictive-analytics.ts` | `__tests__/hooks/use-predictive-analytics.test.ts` | LOW |
| 31 | `hooks/use-preset-application.ts` | `__tests__/hooks/use-preset-application.test.ts` | LOW |
| 32 | `hooks/use-progressive-course-creation.ts` | `__tests__/hooks/use-progressive-course-creation.test.ts` | MEDIUM |
| 33 | `hooks/use-progressive-disclosure.ts` | `__tests__/hooks/use-progressive-disclosure.test.ts` | LOW |
| 34 | `hooks/use-reading-analytics.ts` | `__tests__/hooks/use-reading-analytics.test.ts` | LOW |
| 35 | `hooks/use-reading-preferences.ts` | `__tests__/hooks/use-reading-preferences.test.ts` | LOW |
| 36 | `hooks/use-real-time-analytics.ts` | `__tests__/hooks/use-real-time-analytics.test.ts` | LOW |
| 37 | `hooks/use-realtime-messages.ts` | `__tests__/hooks/use-realtime-messages.test.ts` | MEDIUM |
| 38 | `hooks/use-safe-toast.ts` | `__tests__/hooks/use-safe-toast.test.ts` | LOW |
| 39 | `hooks/use-sam-agentic-analytics.tsx` | `__tests__/hooks/use-sam-agentic-analytics.test.ts` | MEDIUM |
| 40 | `hooks/use-sam-form-sync.ts` | `__tests__/hooks/use-sam-form-sync.test.ts` | MEDIUM |
| 41 | `hooks/use-sam-intelligent-sync.ts` | `__tests__/hooks/use-sam-intelligent-sync.test.ts` | MEDIUM |
| 42 | `hooks/use-sam-realtime.ts` | `__tests__/hooks/use-sam-realtime.test.ts` | MEDIUM |
| 43 | `hooks/use-sam-unified-analytics.ts` | `__tests__/hooks/use-sam-unified-analytics.test.ts` | MEDIUM |
| 44 | `hooks/use-scroll-spy.ts` | `__tests__/hooks/use-scroll-spy.test.ts` | LOW |
| 45 | `hooks/use-scroll-tracking.ts` | `__tests__/hooks/use-scroll-tracking.test.ts` | LOW |
| 46 | `hooks/use-session-fingerprint.ts` | `__tests__/hooks/use-session-fingerprint.test.ts` | MEDIUM |
| 47 | `hooks/use-skill-build-track.ts` | `__tests__/hooks/use-skill-build-track.test.ts` | MEDIUM |
| 48 | `hooks/use-skill-roadmap-journey.ts` | `__tests__/hooks/use-skill-roadmap-journey.test.ts` | MEDIUM |
| 49 | `hooks/use-smart-validation.ts` | `__tests__/hooks/use-smart-validation.test.ts` | MEDIUM |
| 50 | `hooks/use-socket.ts` | `__tests__/hooks/use-socket.test.ts` | MEDIUM |
| 51 | `hooks/use-stable-analytics.ts` | `__tests__/hooks/use-stable-analytics.test.ts` | LOW |
| 52 | `hooks/use-tutoring-orchestration.tsx` | `__tests__/hooks/use-tutoring-orchestration.test.ts` | HIGH |
| 53 | `hooks/use-typing-indicator.ts` | `__tests__/hooks/use-typing-indicator.test.ts` | LOW |
| 54 | `hooks/use-video-tracking.ts` | `__tests__/hooks/use-video-tracking.test.ts` | LOW |
| 55 | `hooks/use-weekly-timeline.ts` | `__tests__/hooks/use-weekly-timeline.test.ts` | LOW |
| 56 | `hooks/useScrollDirection.ts` | `__tests__/hooks/useScrollDirection.test.ts` | LOW |
| 57 | `hooks/useSidebarState.ts` | `__tests__/hooks/useSidebarState.test.ts` | LOW |
| 58 | `hooks/useSwipeGesture.ts` | `__tests__/hooks/useSwipeGesture.test.ts` | LOW |
| 59 | `hooks/useViewportHeight.ts` | `__tests__/hooks/useViewportHeight.test.ts` | LOW |
| 60 | `hooks/dashboard/` (remaining) | `__tests__/hooks/dashboard/*.test.ts` | MEDIUM |
| 61 | `hooks/sam/` (remaining) | `__tests__/hooks/sam/*.test.ts` | MEDIUM |

**Phase 3 Total: ~81 test files**

---

## PHASE 4: SAM AI SYSTEM (Agentic, Tutor, Practice)

### 4.1 SAM Agentic Routes (Untested)

| # | API Route | Test File to Create |
|---|----------|-------------------|
| 1 | `app/api/sam/agentic/goals/route.ts` | `__tests__/api/sam/agentic/goals.test.ts` |
| 2 | `app/api/sam/agentic/goals/[goalId]/route.ts` | `__tests__/api/sam/agentic/goals-detail.test.ts` |
| 3 | `app/api/sam/agentic/goals/[goalId]/decompose/route.ts` | `__tests__/api/sam/agentic/goals-decompose.test.ts` |
| 4 | `app/api/sam/agentic/plans/route.ts` | `__tests__/api/sam/agentic/plans.test.ts` |
| 5 | `app/api/sam/agentic/plans/[planId]/route.ts` | `__tests__/api/sam/agentic/plans-detail.test.ts` |
| 6 | `app/api/sam/agentic/plans/[planId]/start/route.ts` | `__tests__/api/sam/agentic/plans-start.test.ts` |
| 7 | `app/api/sam/agentic/plans/[planId]/pause/route.ts` | `__tests__/api/sam/agentic/plans-pause.test.ts` |
| 8 | `app/api/sam/agentic/plans/[planId]/resume/route.ts` | `__tests__/api/sam/agentic/plans-resume.test.ts` |
| 9 | `app/api/sam/agentic/skills/route.ts` | `__tests__/api/sam/agentic/skills.test.ts` |
| 10 | `app/api/sam/agentic/tools/route.ts` | `__tests__/api/sam/agentic/tools.test.ts` |
| 11 | `app/api/sam/agentic/tools/executions/route.ts` | `__tests__/api/sam/agentic/tools-executions.test.ts` |
| 12 | `app/api/sam/agentic/tools/confirmations/route.ts` | `__tests__/api/sam/agentic/tools-confirmations.test.ts` |
| 13 | `app/api/sam/agentic/checkins/route.ts` | `__tests__/api/sam/agentic/checkins.test.ts` |
| 14 | `app/api/sam/agentic/memory/store/route.ts` | `__tests__/api/sam/agentic/memory-store.test.ts` |
| 15 | `app/api/sam/agentic/memory/search/route.ts` | `__tests__/api/sam/agentic/memory-search.test.ts` |
| 16 | `app/api/sam/agentic/journey/route.ts` | `__tests__/api/sam/agentic/journey.test.ts` |
| 17 | `app/api/sam/agentic/recommendations/route.ts` | `__tests__/api/sam/agentic/recommendations.test.ts` |
| 18 | `app/api/sam/agentic/analytics/events/route.ts` | `__tests__/api/sam/agentic/analytics-events.test.ts` |
| 19 | `app/api/sam/agentic/analytics/progress/route.ts` | `__tests__/api/sam/agentic/analytics-progress.test.ts` |
| 20 | `app/api/sam/agentic/analytics/predictions/route.ts` | `__tests__/api/sam/agentic/analytics-predictions.test.ts` |
| 21 | `app/api/sam/agentic/behavior/route.ts` | `__tests__/api/sam/agentic/behavior.test.ts` |
| 22 | `app/api/sam/agentic/behavior/track/route.ts` | `__tests__/api/sam/agentic/behavior-track.test.ts` |
| 23 | `app/api/sam/agentic/collaboration/route.ts` | `__tests__/api/sam/agentic/collaboration.test.ts` |
| 24 | `app/api/sam/agentic/self-critique/route.ts` | `__tests__/api/sam/agentic/self-critique.test.ts` |

### 4.2 SAM AI Tutor Routes

| # | API Route | Test File to Create |
|---|----------|-------------------|
| 1 | `app/api/sam/ai-tutor/chat/route.ts` | `__tests__/api/sam/ai-tutor/chat.test.ts` |
| 2 | `app/api/sam/ai-tutor/socratic/route.ts` | `__tests__/api/sam/ai-tutor/socratic.test.ts` |
| 3 | `app/api/sam/ai-tutor/practice-problems/route.ts` | `__tests__/api/sam/ai-tutor/practice-problems.test.ts` |
| 4 | `app/api/sam/ai-tutor/content-analysis/route.ts` | `__tests__/api/sam/ai-tutor/content-analysis.test.ts` |
| 5 | `app/api/sam/ai-tutor/detect-learning-style/route.ts` | `__tests__/api/sam/ai-tutor/detect-learning-style.test.ts` |
| 6 | `app/api/sam/ai-tutor/achievements/route.ts` | `__tests__/api/sam/ai-tutor/achievements.test.ts` |
| 7 | `app/api/sam/ai-tutor/challenges/route.ts` | `__tests__/api/sam/ai-tutor/challenges.test.ts` |
| 8 | `app/api/sam/ai-tutor/leaderboard/route.ts` | `__tests__/api/sam/ai-tutor/leaderboard.test.ts` |
| 9 | `app/api/sam/ai-tutor/motivation-engine/route.ts` | `__tests__/api/sam/ai-tutor/motivation-engine.test.ts` |
| 10 | `app/api/sam/ai-tutor/student-insights/route.ts` | `__tests__/api/sam/ai-tutor/student-insights.test.ts` |

### 4.3 SAM Practice Routes

| # | API Route | Test File to Create |
|---|----------|-------------------|
| 1 | `app/api/sam/practice/sessions/route.ts` | `__tests__/api/sam/practice/sessions.test.ts` |
| 2 | `app/api/sam/practice/reviews/route.ts` | `__tests__/api/sam/practice/reviews.test.ts` |
| 3 | `app/api/sam/practice/goals/route.ts` | `__tests__/api/sam/practice/goals.test.ts` |
| 4 | `app/api/sam/practice/challenges/route.ts` | `__tests__/api/sam/practice/challenges.test.ts` |
| 5 | `app/api/sam/practice/leaderboard/route.ts` | `__tests__/api/sam/practice/leaderboard.test.ts` |
| 6 | `app/api/sam/practice/mastery/route.ts` | `__tests__/api/sam/practice/mastery.test.ts` |
| 7 | `app/api/sam/practice/heatmap/route.ts` | `__tests__/api/sam/practice/heatmap.test.ts` |
| 8 | `app/api/sam/practice/recommendations/route.ts` | `__tests__/api/sam/practice/recommendations.test.ts` |
| 9 | `app/api/sam/practice/milestones/route.ts` | `__tests__/api/sam/practice/milestones.test.ts` |
| 10 | `app/api/sam/practice/trends/route.ts` | `__tests__/api/sam/practice/trends.test.ts` |

### 4.4 SAM Core Feature Routes

| # | API Route | Test File to Create |
|---|----------|-------------------|
| 1 | `app/api/sam/course-creation/orchestrate/route.ts` | `__tests__/api/sam/course-creation/orchestrate.test.ts` |
| 2 | `app/api/sam/course-creation/blueprint/route.ts` | `__tests__/api/sam/course-creation/blueprint.test.ts` |
| 3 | `app/api/sam/conversation/route.ts` | `__tests__/api/sam/conversation.test.ts` |
| 4 | `app/api/sam/unified/route.ts` | `__tests__/api/sam/unified.test.ts` |
| 5 | `app/api/sam/unified/stream/route.ts` | `__tests__/api/sam/unified-stream.test.ts` |
| 6 | `app/api/sam/feedback/route.ts` | `__tests__/api/sam/feedback.test.ts` |
| 7 | `app/api/sam/knowledge-graph-engine/route.ts` | `__tests__/api/sam/knowledge-graph-engine.test.ts` |
| 8 | `app/api/sam/skill-roadmap/route.ts` | `__tests__/api/sam/skill-roadmap.test.ts` |
| 9 | `app/api/sam/skill-roadmap/generate/route.ts` | `__tests__/api/sam/skill-roadmap-generate.test.ts` |
| 10 | `app/api/sam/socratic/start/route.ts` | `__tests__/api/sam/socratic-start.test.ts` |
| 11 | `app/api/sam/microlearning/route.ts` | `__tests__/api/sam/microlearning.test.ts` |
| 12 | `app/api/sam/metacognition/route.ts` | `__tests__/api/sam/metacognition.test.ts` |
| 13 | `app/api/sam/sessions/route.ts` | `__tests__/api/sam/sessions.test.ts` |

**Phase 4 Total: ~67 test files**

---

## PHASE 5: ANALYTICS, MONITORING & ENTERPRISE

### 5.1 Analytics Routes

| # | API Route | Test File to Create |
|---|----------|-------------------|
| 1 | `app/api/analytics/route.ts` | `__tests__/api/analytics/index.test.ts` |
| 2 | `app/api/analytics/dashboard/route.ts` | `__tests__/api/analytics/dashboard.test.ts` |
| 3 | `app/api/analytics/enhanced/route.ts` | `__tests__/api/analytics/enhanced.test.ts` |
| 4 | `app/api/analytics/enterprise/route.ts` | `__tests__/api/analytics/enterprise.test.ts` |
| 5 | `app/api/analytics/learning/route.ts` | `__tests__/api/analytics/learning.test.ts` |
| 6 | `app/api/analytics/track/route.ts` | `__tests__/api/analytics/track.test.ts` |
| 7 | `app/api/analytics/unified/route.ts` | `__tests__/api/analytics/unified.test.ts` |
| 8 | `app/api/analytics/events/route.ts` | `__tests__/api/analytics/events.test.ts` |
| 9 | `app/api/analytics/batch/route.ts` | `__tests__/api/analytics/batch.test.ts` |
| 10 | `app/api/analytics/real-time/metrics/route.ts` | `__tests__/api/analytics/realtime-metrics.test.ts` |

### 5.2 Enterprise Routes

| # | API Route | Test File to Create |
|---|----------|-------------------|
| 1 | `app/api/enterprise/analytics/route.ts` | `__tests__/api/enterprise/analytics.test.ts` |
| 2 | `app/api/enterprise/audit/route.ts` | `__tests__/api/enterprise/audit.test.ts` |
| 3 | `app/api/enterprise/security/route.ts` | `__tests__/api/enterprise/security.test.ts` |
| 4 | `app/api/enterprise/organizations/route.ts` | `__tests__/api/enterprise/organizations.test.ts` |

### 5.3 Monitoring & Health Routes

| # | API Route | Test File to Create |
|---|----------|-------------------|
| 1 | `app/api/monitoring/health/route.ts` | `__tests__/api/monitoring/health.test.ts` |
| 2 | `app/api/monitoring/metrics/route.ts` | `__tests__/api/monitoring/metrics.test.ts` |
| 3 | `app/api/monitoring/alerts/route.ts` | `__tests__/api/monitoring/alerts.test.ts` |
| 4 | `app/api/monitoring/incidents/route.ts` | `__tests__/api/monitoring/incidents.test.ts` |
| 5 | `app/api/monitoring/dashboards/route.ts` | `__tests__/api/monitoring/dashboards.test.ts` |
| 6 | `app/api/error-management/errors/route.ts` | `__tests__/api/error-management/errors.test.ts` |
| 7 | `app/api/error-management/alerts/route.ts` | `__tests__/api/error-management/alerts.test.ts` |
| 8 | `app/api/error-management/metrics/route.ts` | `__tests__/api/error-management/metrics.test.ts` |

### 5.4 Critical Lib Utilities

| # | Source File | Test File to Create |
|---|-----------|-------------------|
| 1 | `lib/analytics/` | `__tests__/lib/analytics/index.test.ts` |
| 2 | `lib/cache/` | `__tests__/lib/cache/index.test.ts` |
| 3 | `lib/monitoring/` | `__tests__/lib/monitoring/index.test.ts` |
| 4 | `lib/error-handling/` | `__tests__/lib/error-handling.test.ts` |
| 5 | `lib/resilience/` | `__tests__/lib/resilience.test.ts` |
| 6 | `lib/queue/` | `__tests__/lib/queue.test.ts` |
| 7 | `lib/logger.ts` | `__tests__/lib/logger.test.ts` |
| 8 | `lib/telemetry.ts` | `__tests__/lib/telemetry.test.ts` |
| 9 | `lib/sentry.ts` | `__tests__/lib/sentry.test.ts` |
| 10 | `lib/env-validation.ts` | `__tests__/lib/env-validation.test.ts` |

**Phase 5 Total: ~32 test files**

---

## PHASE 6: COMPONENTS (Highest Volume)

### 6.1 Auth Components (Priority: HIGH)

| # | Component | Test File to Create |
|---|----------|-------------------|
| 1 | `components/auth/` (remaining untested) | `__tests__/components/auth/*.test.tsx` |

### 6.2 Course Components (Priority: HIGH)

| # | Component Directory | Test File to Create |
|---|----------|-------------------|
| 1 | `components/course/` | `__tests__/components/course/*.test.tsx` |
| 2 | `components/course-creation/` | `__tests__/components/course-creation/*.test.tsx` |
| 3 | `components/courses/` | `__tests__/components/courses/*.test.tsx` |
| 4 | `components/sections/` | `__tests__/components/sections/*.test.tsx` |

### 6.3 Dashboard Components (Priority: HIGH)

| # | Component Directory | Test File to Create |
|---|----------|-------------------|
| 1 | `components/dashboard/` | `__tests__/components/dashboard/*.test.tsx` |
| 2 | `components/learner/` | `__tests__/components/learner/*.test.tsx` |
| 3 | `components/learning/` | `__tests__/components/learning/*.test.tsx` |

### 6.4 SAM Components (Priority: MEDIUM)

| # | Component Directory | Test File to Create |
|---|----------|-------------------|
| 1 | `components/sam/` (remaining) | `__tests__/components/sam/*.test.tsx` |
| 2 | `components/practice/` | `__tests__/components/practice/*.test.tsx` |
| 3 | `components/skill-roadmap/` | `__tests__/components/skill-roadmap/*.test.tsx` |
| 4 | `components/goals/` | `__tests__/components/goals/*.test.tsx` |

### 6.5 Admin Components (Priority: MEDIUM)

| # | Component Directory | Test File to Create |
|---|----------|-------------------|
| 1 | `components/admin/` | `__tests__/components/admin/*.test.tsx` |
| 2 | `components/teacher/` | `__tests__/components/teacher/*.test.tsx` |

### 6.6 Shared/UI Components (Priority: LOW)

| # | Component Directory | Test File to Create |
|---|----------|-------------------|
| 1 | `components/ui/` (remaining) | `__tests__/components/ui/*.test.tsx` |
| 2 | `components/shared/` | `__tests__/components/shared/*.test.tsx` |
| 3 | `components/modals/` | `__tests__/components/modals/*.test.tsx` |
| 4 | `components/editor.tsx` | `__tests__/components/editor.test.tsx` |
| 5 | `components/notifications/` | `__tests__/components/notifications/*.test.tsx` |
| 6 | `components/billing/` | `__tests__/components/billing/*.test.tsx` |
| 7 | `components/subscription/` (remaining) | `__tests__/components/subscription/*.test.tsx` |
| 8 | `components/gamification/` | `__tests__/components/gamification/*.test.tsx` |

**Phase 6 Total: ~100+ test files (estimate based on component count)**

---

## PHASE 7: REMAINING API ROUTES

### 7.1 Communication Routes

| # | API Route | Test File to Create |
|---|----------|-------------------|
| 1 | `app/api/messages/route.ts` | `__tests__/api/messages/index.test.ts` |
| 2 | `app/api/messages/search/route.ts` | `__tests__/api/messages/search.test.ts` |
| 3 | `app/api/messages/unread/count/route.ts` | `__tests__/api/messages/unread-count.test.ts` |
| 4 | `app/api/notifications/route.ts` | `__tests__/api/notifications.test.ts` |
| 5 | `app/api/newsletter/subscribe/route.ts` | `__tests__/api/newsletter/subscribe.test.ts` |

### 7.2 Calendar & Scheduling Routes

| # | API Route | Test File to Create |
|---|----------|-------------------|
| 1 | `app/api/calendar/route.ts` | `__tests__/api/calendar/index.test.ts` |
| 2 | `app/api/calendar/events/route.ts` | `__tests__/api/calendar/events.test.ts` |
| 3 | `app/api/calendar/sync/route.ts` | `__tests__/api/calendar/sync.test.ts` |
| 4 | `app/api/calendar/settings/route.ts` | `__tests__/api/calendar/settings.test.ts` |

### 7.3 Groups & Social Routes

| # | API Route | Test File to Create |
|---|----------|-------------------|
| 1 | `app/api/groups/route.ts` | `__tests__/api/groups/index.test.ts` |
| 2 | `app/api/groups/[groupId]/discussions/route.ts` | `__tests__/api/groups/discussions.test.ts` |
| 3 | `app/api/groups/[groupId]/events/route.ts` | `__tests__/api/groups/events.test.ts` |
| 4 | `app/api/groups/[groupId]/resources/route.ts` | `__tests__/api/groups/resources.test.ts` |

### 7.4 Content Governance Routes

| # | API Route | Test File to Create |
|---|----------|-------------------|
| 1 | `app/api/content-governance/workflows/route.ts` | `__tests__/api/content-governance/workflows.test.ts` |
| 2 | `app/api/content-governance/approvals/route.ts` | `__tests__/api/content-governance/approvals.test.ts` |
| 3 | `app/api/content-governance/dashboard/route.ts` | `__tests__/api/content-governance/dashboard.test.ts` |
| 4 | `app/api/content/versions/route.ts` | `__tests__/api/content/versions.test.ts` |

### 7.5 Templates, Ideas, Tasks Routes

| # | API Route | Test File to Create |
|---|----------|-------------------|
| 1 | `app/api/templates/route.ts` | `__tests__/api/templates/index.test.ts` |
| 2 | `app/api/ideas/route.ts` | `__tests__/api/ideas/index.test.ts` |
| 3 | `app/api/tasks/route.ts` | `__tests__/api/tasks.test.ts` |
| 4 | `app/api/search/route.ts` | `__tests__/api/search.test.ts` |

### 7.6 Teacher Analytics Routes

| # | API Route | Test File to Create |
|---|----------|-------------------|
| 1 | `app/api/teacher-analytics/course-overview/route.ts` | `__tests__/api/teacher-analytics/course-overview.test.ts` |
| 2 | `app/api/teacher-analytics/courses-dashboard/route.ts` | `__tests__/api/teacher-analytics/courses-dashboard.test.ts` |
| 3 | `app/api/teacher-analytics/student-profile/route.ts` | `__tests__/api/teacher-analytics/student-profile.test.ts` |
| 4 | `app/api/teacher/courses/route.ts` | `__tests__/api/teacher/courses.test.ts` |
| 5 | `app/api/creator-analytics/dashboard/route.ts` | `__tests__/api/creator-analytics/dashboard.test.ts` |

### 7.7 Cron Job Routes

| # | API Route | Test File to Create |
|---|----------|-------------------|
| 1 | `app/api/cron/session-cleanup/route.ts` | `__tests__/api/cron/session-cleanup.test.ts` |
| 2 | `app/api/cron/session-notifications/route.ts` | `__tests__/api/cron/session-notifications.test.ts` |
| 3 | `app/api/cron/task-reminders/route.ts` | `__tests__/api/cron/task-reminders.test.ts` |
| 4 | `app/api/cron/sam-proactive/route.ts` | `__tests__/api/cron/sam-proactive.test.ts` |
| 5 | `app/api/cron/sam-mastery-decay/route.ts` | `__tests__/api/cron/sam-mastery-decay.test.ts` |
| 6 | `app/api/cron/practice-streaks/route.ts` | `__tests__/api/cron/practice-streaks.test.ts` |
| 7 | `app/api/cron/practice-review-reminders/route.ts` | `__tests__/api/cron/practice-review-reminders.test.ts` |

**Phase 7 Total: ~35 test files**

---

## PHASE 8: INTEGRATION & E2E TESTS

### 8.1 Integration Tests Needed

| # | Test File to Create | What it Tests |
|---|-------------------|---------------|
| 1 | `__tests__/integration/auth-flow.test.ts` | Full registration -> login -> session flow |
| 2 | `__tests__/integration/course-lifecycle.test.ts` | Create -> publish -> enroll -> progress -> certificate |
| 3 | `__tests__/integration/payment-flow.test.ts` | Checkout -> Stripe webhook -> enrollment activation |
| 4 | `__tests__/integration/sam-goal-planning.test.ts` | Goal creation -> decomposition -> plan -> execution |
| 5 | `__tests__/integration/exam-lifecycle.test.ts` | Generate exam -> attempt -> submit -> grade -> analytics |
| 6 | `__tests__/integration/admin-user-management.test.ts` | Create user -> assign roles -> update -> deactivate |
| 7 | `__tests__/integration/content-versioning.test.ts` | Create content -> version -> rollback -> publish |
| 8 | `__tests__/integration/practice-system.test.ts` | Start session -> answer -> review -> mastery tracking |

### 8.2 E2E Tests Needed

| # | Test File to Create | What it Tests |
|---|-------------------|---------------|
| 1 | `e2e/tests/course-management.spec.ts` | Teacher creates/edits/publishes course |
| 2 | `e2e/tests/student-enrollment.spec.ts` | Student browses, enrolls, starts learning |
| 3 | `e2e/tests/exam-taking.spec.ts` | Student takes exam end-to-end |
| 4 | `e2e/tests/dashboard-navigation.spec.ts` | Dashboard widgets, navigation, data display |
| 5 | `e2e/tests/admin-panel.spec.ts` | Admin manages users, settings, reports |
| 6 | `e2e/tests/sam-chat.spec.ts` | User interacts with SAM AI tutor |
| 7 | `e2e/tests/practice-session.spec.ts` | Full practice session workflow |
| 8 | `e2e/tests/subscription-flow.spec.ts` | Free -> Premium upgrade flow |

**Phase 8 Total: ~16 test files**

---

## SUMMARY BY PHASE

| Phase | Focus Area | New Test Files | Priority |
|-------|-----------|---------------|----------|
| **Phase 1** | Security, Auth, Payments | ~35 | CRITICAL |
| **Phase 2** | Core Business Logic | ~48 | HIGH |
| **Phase 3** | Dashboard & User Features | ~81 | HIGH |
| **Phase 4** | SAM AI System | ~67 | MEDIUM-HIGH |
| **Phase 5** | Analytics & Enterprise | ~32 | MEDIUM |
| **Phase 6** | Components | ~100+ | MEDIUM |
| **Phase 7** | Remaining API Routes | ~35 | MEDIUM-LOW |
| **Phase 8** | Integration & E2E | ~16 | HIGH |
| **TOTAL** | | **~414+** | |

---

## TARGET COVERAGE GOALS

| Milestone | Test Files | Est. Coverage | Timeline |
|-----------|-----------|---------------|----------|
| **Current** | 488 | ~12% | Now |
| **Phase 1 done** | 523 | ~18% | Priority 1 |
| **Phase 1+2 done** | 571 | ~28% | Priority 2 |
| **Phase 1-4 done** | 719 | ~45% | Priority 3 |
| **All phases done** | 902+ | ~65-70% | Full plan |

---

## NOTES

- **Test Framework**: Use Vitest for all new tests (aligned with packages)
- **Mocking**: Use `vi.mock()` for Prisma, auth, and external services
- **Each test file** should cover: happy path, error cases, auth/authz, input validation, edge cases
- **Minimum 5-10 test cases** per API route test file
- **Component tests** should use React Testing Library with `@testing-library/react`
- **Prioritize** files that handle user data, payments, and authentication first
