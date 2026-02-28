# Test Coverage Roadmap (4 Weeks)

Generated: 2026-02-27

## Baseline

- Coverage (fresh run):
  - Statements: 12.27% (139,029 / 1,132,882)
  - Lines: 12.27%
  - Functions: 36.09%
  - Branches: 63.71%
- Test execution:
  - Suites: 1,163 passed / 1,165 total
  - Tests: 11,263 passed / 11,284 total
- Quality audit:
  - Test files scanned: 1,165
  - Files with no `test()`/`it()`: 434
  - Forwarding-only test files: 434

## What This Means

1. Coverage is not low because tests are absent only.
2. A large portion of test files are forwarding stubs (imports only), so they pass but do not exercise their intended route/module.
3. The fastest path to 20% is not adding more forwarding files; it is converting high-impact stubs into real assertions against route handlers/services.

## 4-Week Target

- End of Week 4 target: >= 20% statements.
- Required delta from baseline: +87,548 covered statements.
- Primary focus: `app/api` + `actions` + `lib` (highest ROI, lowest UI flake).

## Week 1 - Stop False Positives + Secure Critical Paths

### Deliverables

- Convert forwarding-only tests in critical auth/user/security/cron areas into real tests.
- Close remaining Phase 1 gaps.
- Ensure each converted file directly imports and executes the target route/action.

### Exact test files to implement/replace

1. `__tests__/actions/admin/login.test.ts`
2. `__tests__/actions/admin/logout.test.ts`
3. `__tests__/actions/admin/reset.test.ts`
4. `__tests__/lib/passwordUtils.test.ts`
5. `__tests__/api/user/profile.test.ts`
6. `__tests__/api/user/cognitive-profile.test.ts`
7. `__tests__/api/user/exam-analytics.test.ts`
8. `__tests__/api/user/activities.test.ts`
9. `__tests__/api/user/cognitive-growth/[courseId].test.ts`
10. `__tests__/api/security/alerts/[alertId].test.ts`
11. `__tests__/api/compliance/soc2/report.test.ts`
12. `__tests__/api/cron/task-reminders.test.ts`
13. `__tests__/api/cron/session-cleanup.test.ts`
14. `__tests__/api/cron/practice-streaks.test.ts`
15. `__tests__/api/cron/practice-leaderboard.test.ts`
16. `__tests__/api/cron/sam-analytics-rollups.test.ts`
17. `__tests__/api/cron/sam-fairness-audit.test.ts`
18. `__tests__/api/cron/practice-review-reminders.test.ts`
19. `__tests__/api/cron/sam-mastery-decay.test.ts`
20. `__tests__/api/cron/sam-memory-lifecycle.test.ts`
21. `__tests__/api/cron/session-notifications.test.ts`
22. `__tests__/api/cron/sam-proactive.test.ts`
23. `__tests__/api/cron/sam-checkins.test.ts`

### Exit criteria

- `npm run test:quality` reports <= 350 forwarding files.
- Converted files each include at least 1 assertion on response status/payload.
- No net increase in skipped tests.

## Week 2 - High-Impact SAM/API Coverage

### Deliverables

- Replace zero-coverage SAM/API forwarding tests with route-level tests that hit major branches.
- Prioritize highest uncovered statement files.

### Exact test files to implement/replace

1. `__tests__/api/sam/financial-intelligence.test.ts`
2. `__tests__/api/sam/unified-analytics.test.ts`
3. `__tests__/api/sam/content-scoring.test.ts`
4. `__tests__/api/sam/ai-tutor/visual-processor.test.ts`
5. `__tests__/api/sam/enhanced-depth-analysis.test.ts`
6. `__tests__/api/teacher/depth-analysis-v2/analyze.test.ts`
7. `__tests__/api/sections/generate-content.test.ts`
8. `__tests__/api/sam/knowledge-graph.test.ts`
9. `__tests__/api/sam/analytics/course-overview.test.ts`
10. `__tests__/api/sam/ai-tutor/content-companion.test.ts`
11. `__tests__/api/sam/ai-tutor/content-analysis.test.ts`
12. `__tests__/api/sam/learning-analytics/generate.test.ts`
13. `__tests__/api/sam/certification-pathways.test.ts`
14. `__tests__/api/sam/peer-learning.test.ts`
15. `__tests__/api/sam/exam-builder/generate.test.ts`
16. `__tests__/api/sam/course-creation/orchestrate.test.ts`
17. `__tests__/api/sam/mentor/diagnostic.test.ts`
18. `__tests__/api/sam/practice/sessions/[sessionId]/end.test.ts`
19. `__tests__/api/sam/enterprise-intelligence.test.ts`
20. `__tests__/api/sam/integrated-analysis.test.ts`

### Exit criteria

- `app/api` statements >= 38%.
- `npm run test:quality` reports <= 250 forwarding files.

## Week 3 - Core Lib + Hooks Expansion

### Deliverables

- Add tests for high-impact untested library modules.
- Close major Phase 3 hook gaps.

### Exact test files to add

1. `__tests__/lib/microlearning/content-segmenter.test.ts`
2. `__tests__/lib/cross-course-benchmarking.test.ts`
3. `__tests__/lib/sam/depth-analysis-v2/ai-analyzer.test.ts`
4. `__tests__/lib/emotion-detection/emotion-detector.test.ts`
5. `__tests__/lib/db/db-monitoring.test.ts`
6. `__tests__/lib/question-bank-system.test.ts`
7. `__tests__/lib/queue/queue-manager.test.ts`
8. `__tests__/lib/cognitive-load/load-analyzer.test.ts`
9. `__tests__/lib/sam/multi-agent-coordinator.test.ts`
10. `__tests__/lib/microlearning/microlearning-service.test.ts`
11. `__tests__/hooks/use-admin.test.ts`
12. `__tests__/hooks/use-advanced-analytics.test.ts`
13. `__tests__/hooks/use-ai-course-integration.test.ts`
14. `__tests__/hooks/use-activities.test.ts`
15. `__tests__/hooks/use-calendar-sync.test.ts`
16. `__tests__/hooks/use-collaborative-editing.test.ts`
17. `__tests__/hooks/use-content-versioning.test.ts`
18. `__tests__/hooks/use-course-analytics.test.ts`
19. `__tests__/hooks/use-dashboard-analytics.test.ts`
20. `__tests__/hooks/use-learning-journey.test.ts`
21. `__tests__/hooks/use-learning-notifications.test.ts`
22. `__tests__/hooks/use-notification-preferences.test.ts`
23. `__tests__/hooks/use-practice-dashboard.test.ts`
24. `__tests__/hooks/use-practice-reviews.test.ts`
25. `__tests__/hooks/use-practice-session.test.ts`
26. `__tests__/hooks/use-sam-agentic-analytics.test.ts`
27. `__tests__/hooks/use-sam-form-sync.test.ts`
28. `__tests__/hooks/use-sam-intelligent-sync.test.ts`
29. `__tests__/hooks/use-sam-realtime.test.ts`
30. `__tests__/hooks/use-socket.test.ts`

### Exit criteria

- `lib` statements >= 22%.
- Hook test file count increases from 23 to >= 40.

## Week 4 - Components + Integration Hardening

### Deliverables

- Build component tests for currently high-uncovered UI modules.
- Add missing named integration flows from the coverage plan.
- Reduce forwarding files to near-zero in core domains.

### Exact test files to add

1. `__tests__/components/sam/KnowledgeGraphBrowser.test.tsx`
2. `__tests__/components/sam/chat/ChatWindow.test.tsx`
3. `__tests__/components/dashboard/smart/skill-build-tracker.test.tsx`
4. `__tests__/components/analytics/tabs/JobMarketTab.test.tsx`
5. `__tests__/components/sam/certification/CertificationTracker.test.tsx`
6. `__tests__/components/analytics/enhanced-analytics-dashboard.test.tsx`
7. `__tests__/components/billing/financial-intelligence-dashboard.test.tsx`
8. `__tests__/components/layout/CoursesNavbarResizable.test.tsx`
9. `__tests__/integration/auth-flow.test.ts`
10. `__tests__/integration/course-lifecycle.test.ts`
11. `__tests__/integration/payment-flow.test.ts`
12. `__tests__/integration/sam-goal-planning.test.ts`
13. `__tests__/integration/exam-lifecycle.test.ts`
14. `__tests__/integration/admin-user-management.test.ts`
15. `__tests__/integration/content-versioning.test.ts`
16. `__tests__/integration/practice-system.test.ts`
17. `__tests__/api/messages/index.test.ts`
18. `__tests__/api/messages/unread-count.test.ts`
19. `__tests__/api/calendar/index.test.ts`
20. `__tests__/api/groups/index.test.ts`
21. `__tests__/api/groups/discussions.test.ts`
22. `__tests__/api/groups/events.test.ts`
23. `__tests__/api/groups/resources.test.ts`
24. `__tests__/api/templates/index.test.ts`
25. `__tests__/api/ideas/index.test.ts`

### Exit criteria

- Global statements >= 20%.
- `npm run test:quality` reports <= 50 forwarding files.
- Component test file count increases from 34 to >= 50.

## Tracking Commands

1. `npm run test:quality`
2. `npm run test:coverage -- --coverageReporters=text-summary --coverageReporters=json-summary --silent`
3. `node scripts/test-coverage-tracker.js`

## Notes

- Keep forwarding aliases only where intentionally de-duplicating path variants; otherwise replace with real assertions.
- Prefer route-handler direct tests (import `GET/POST` from `app/api/**/route.ts`) over indirect imports to avoid coverage blind spots.
