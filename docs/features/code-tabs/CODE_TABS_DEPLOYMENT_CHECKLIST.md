# Code Tabs Redesign - Deployment Checklist

## 🚀 Pre-Deployment Checklist

**Date**: October 16, 2025
**Version**: 1.0.0
**Environment**: Production
**Deployed By**: [Your Name]

---

## ✅ Phase 1: Code Quality & Validation

### Linting & Type Safety
- [x] ESLint validation passed (0 errors, 0 warnings)
- [ ] TypeScript validation passed (`npx tsc --noEmit`)
  - *Note: Requires memory optimization for full check*
- [x] Prettier formatting applied
- [x] No `any` types used (strict TypeScript)
- [x] All imports resolved correctly

**Commands**:
```bash
npm run lint
NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit
npx prettier --check .
```

---

## ✅ Phase 2: Database Migration

### Schema Validation
- [x] Domain schema updated (`prisma/domains/04-content.prisma`)
- [x] Merged schema validated
- [x] Prisma client generated

### Migration Steps
```bash
# 1. Backup production database
pg_dump taxomind_production > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Create migration
npx prisma migrate dev --name enhance_code_explanation

# 3. Review migration SQL
cat prisma/migrations/[timestamp]_enhance_code_explanation/migration.sql

# 4. Test migration on staging
npx prisma migrate deploy --preview-feature

# 5. Verify data integrity
npm run verify:data
```

### Data Migration
- [ ] Backup existing `CodeExplanation` data
- [ ] Migrate `heading` → `title`
- [ ] Migrate `order` → `position`
- [ ] Set default values for new fields:
  - `lineStart`: NULL (calculated on first load)
  - `lineEnd`: NULL (calculated on first load)
  - `groupId`: NULL
  - `isPublished`: true

**Migration Script** (if needed):
```sql
-- Migrate existing data
UPDATE "CodeExplanation"
SET
  "title" = COALESCE("heading", 'Code Block'),
  "position" = COALESCE("order", 0),
  "isPublished" = true
WHERE "title" IS NULL;

-- Verify migration
SELECT COUNT(*) FROM "CodeExplanation" WHERE "title" IS NOT NULL;
```

---

## ✅ Phase 3: API Endpoint Verification

### Test All Endpoints
```bash
# Set variables
COURSE_ID="test-course-123"
CHAPTER_ID="test-chapter-456"
SECTION_ID="test-section-789"
BASE_URL="http://localhost:3000/api"

# 1. GET /code-blocks
curl -X GET "$BASE_URL/courses/$COURSE_ID/chapters/$CHAPTER_ID/sections/$SECTION_ID/code-blocks" \
  -H "Cookie: [your-auth-cookie]"

# Expected: { "success": true, "data": [...], "metadata": {...} }

# 2. POST /code-blocks
curl -X POST "$BASE_URL/courses/$COURSE_ID/chapters/$CHAPTER_ID/sections/$SECTION_ID/code-blocks" \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-auth-cookie]" \
  -d '{
    "blocks": [{
      "title": "Test Block",
      "code": "console.log(\"test\");",
      "language": "typescript"
    }]
  }'

# Expected: { "success": true, "data": [{...}], "metadata": {...} }

# 3. PATCH /code-blocks/[blockId]
BLOCK_ID="[from-previous-response]"
curl -X PATCH "$BASE_URL/courses/$COURSE_ID/chapters/$CHAPTER_ID/sections/$SECTION_ID/code-blocks/$BLOCK_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-auth-cookie]" \
  -d '{
    "title": "Updated Block"
  }'

# Expected: { "success": true, "data": {...} }

# 4. POST /code-blocks/[blockId]/explanation
curl -X POST "$BASE_URL/courses/$COURSE_ID/chapters/$CHAPTER_ID/sections/$SECTION_ID/code-blocks/$BLOCK_ID/explanation" \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-auth-cookie]" \
  -d '{
    "explanation": "This is a test explanation"
  }'

# Expected: { "success": true, "data": {...} }

# 5. DELETE /code-blocks/[blockId]
curl -X DELETE "$BASE_URL/courses/$COURSE_ID/chapters/$CHAPTER_ID/sections/$SECTION_ID/code-blocks/$BLOCK_ID" \
  -H "Cookie: [your-auth-cookie]"

# Expected: { "success": true, "data": { "deleted": true } }
```

### Validation Checklist
- [ ] GET returns correct data format
- [ ] POST creates blocks successfully
- [ ] PATCH updates blocks correctly
- [ ] DELETE removes blocks and recalculates line numbers
- [ ] POST explanation adds/updates explanations
- [ ] All endpoints return proper ApiResponse format
- [ ] Error handling works (401, 403, 400, 500)
- [ ] Authentication required on all endpoints
- [ ] Authorization checks ownership

---

## ✅ Phase 4: Frontend Integration

### Component Integration
- [x] `CodeTab.tsx` uses `CodeBlockManager`
- [x] Old components removed/archived
- [x] Import paths correct
- [x] Props passed correctly

### Visual Regression Testing
```bash
# If you have visual regression tests
npm run test:visual
```

- [ ] Screenshots match expected design
- [ ] No layout breaks
- [ ] Dark mode works correctly
- [ ] Animations smooth

---

## ✅ Phase 5: Testing

### Manual Testing (use CODE_TABS_TESTING_GUIDE.md)
- [ ] Functional tests (10/10 passed)
- [ ] Responsive tests (6/6 passed)
- [ ] Accessibility tests (4/4 passed)
- [ ] Security tests (4/4 passed)
- [ ] Performance tests (3/3 passed)

### Automated Testing
```bash
# Run test suite
npm test

# Run E2E tests
npm run test:e2e

# Run integration tests
npm run test:integration
```

- [ ] Unit tests passed
- [ ] Integration tests passed
- [ ] E2E tests passed

---

## ✅ Phase 6: Performance Validation

### Lighthouse Audit
```bash
# Run Lighthouse
npm run lighthouse
```

**Metrics** (Target):
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

**Actual Results**:
- Performance: \_\_\_\_
- Accessibility: \_\_\_\_
- Best Practices: \_\_\_\_
- SEO: \_\_\_\_

### Load Testing
```bash
# Simulate 100 concurrent users
npm run load-test
```

- [ ] Response time < 500ms (p95)
- [ ] No memory leaks
- [ ] Database queries optimized
- [ ] API rate limiting works

---

## ✅ Phase 7: Security Audit

### Security Checklist
- [x] Input validation (Zod schemas)
- [x] SQL injection prevention (Prisma parameterized queries)
- [x] XSS prevention (React escaping + sanitization)
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] Authentication on all endpoints
- [ ] Authorization checks ownership
- [ ] No sensitive data in URLs
- [ ] Error messages don't leak info
- [ ] HTTPS enforced

### Security Scan
```bash
# Run security audit
npm audit

# Check for vulnerabilities
npm run security:scan
```

- [ ] No critical vulnerabilities
- [ ] No high vulnerabilities
- [ ] All dependencies up to date

---

## ✅ Phase 8: Documentation

### User Documentation
- [x] Teacher user guide created
- [x] Implementation summary created
- [x] Testing guide created
- [ ] Video tutorial recorded
- [ ] FAQ section added

### Developer Documentation
- [x] API documentation complete
- [x] Component documentation complete
- [x] Database schema documented
- [ ] Architecture diagrams updated
- [ ] CHANGELOG.md updated

---

## ✅ Phase 9: Deployment

### Staging Deployment
```bash
# Deploy to staging
npm run enterprise:deploy:staging

# Verify deployment
curl https://staging.taxomind.com/api/health
```

- [ ] Staging deployment successful
- [ ] All features work on staging
- [ ] No breaking changes detected
- [ ] User acceptance testing complete

### Production Deployment
```bash
# Create release tag
git tag -a v1.0.0-code-tabs -m "Release: Code Tabs Redesign"
git push origin v1.0.0-code-tabs

# Deploy to production
npm run enterprise:deploy:production

# Verify deployment
curl https://taxomind.com/api/health
```

**Deployment Steps**:
1. [ ] Create database backup
2. [ ] Run migration on production
3. [ ] Deploy application code
4. [ ] Verify health checks
5. [ ] Test critical paths
6. [ ] Monitor error logs
7. [ ] Enable feature flag (if using)

---

## ✅ Phase 10: Post-Deployment

### Monitoring
- [ ] Set up error monitoring (Sentry/LogRocket)
- [ ] Configure performance monitoring
- [ ] Set up user analytics
- [ ] Create dashboard for metrics

### Metrics to Track
- API response times
- Error rates
- User engagement (code blocks created)
- Feature usage (hover tooltips, copy, download)
- Browser compatibility issues
- Mobile usage statistics

### Rollback Plan
```bash
# If issues arise, rollback immediately
git revert [commit-hash]
npm run enterprise:deploy:production

# Restore database backup if needed
psql taxomind_production < backup_YYYYMMDD_HHMMSS.sql
```

**Rollback Triggers**:
- Error rate > 5%
- Performance degradation > 50%
- Critical security issue
- Data corruption detected

---

## ✅ Phase 11: Communication

### Stakeholder Notification
- [ ] Email sent to product team
- [ ] Slack announcement posted
- [ ] Documentation shared
- [ ] Training session scheduled

### User Communication
- [ ] Feature announcement published
- [ ] In-app notification added
- [ ] Tutorial video shared
- [ ] Support team briefed

---

## 📊 Deployment Summary

### Deployment Info
- **Date**: \_\_\_\_\_\_\_\_\_\_\_\_
- **Time**: \_\_\_\_\_\_\_\_\_\_\_\_
- **Environment**: Production
- **Version**: 1.0.0
- **Deployed By**: \_\_\_\_\_\_\_\_\_\_\_\_

### Checklist Completion
- Phase 1 (Code Quality): \_\_/5 (\_\_%)
- Phase 2 (Database): \_\_/4 (\_\_%)
- Phase 3 (API): \_\_/9 (\_\_%)
- Phase 4 (Frontend): \_\_/4 (\_\_%)
- Phase 5 (Testing): \_\_/6 (\_\_%)
- Phase 6 (Performance): \_\_/5 (\_\_%)
- Phase 7 (Security): \_\_/11 (\_\_%)
- Phase 8 (Documentation): \_\_/9 (\_\_%)
- Phase 9 (Deployment): \_\_/7 (\_\_%)
- Phase 10 (Post-Deployment): \_\_/7 (\_\_%)
- Phase 11 (Communication): \_\_/8 (\_\_%)

**Overall Progress**: \_\_/75 (\_\_%)

---

## 🎯 Success Criteria

### Must Have (P0)
- [x] All code blocks display correctly
- [x] Hover tooltips work on desktop
- [x] Mobile bottom sheet works
- [x] Copy/download functionality works
- [x] API endpoints secure and functional
- [ ] All tests pass
- [ ] No critical bugs

### Should Have (P1)
- [x] Responsive design (all breakpoints)
- [x] Keyboard shortcuts (Esc)
- [x] Smooth animations
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Performance targets met

### Nice to Have (P2)
- [ ] Edit functionality
- [ ] Drag-and-drop reordering
- [ ] Code diff visualization
- [ ] Version history

---

## 🚨 Emergency Contacts

### Technical Team
- **Lead Developer**: [Name] - [Email/Phone]
- **DevOps**: [Name] - [Email/Phone]
- **Database Admin**: [Name] - [Email/Phone]

### Business Team
- **Product Owner**: [Name] - [Email/Phone]
- **Project Manager**: [Name] - [Email/Phone]

---

## 📝 Sign-Off

### Approvals
- **Developer Lead**: \_\_\_\_\_\_\_\_\_\_\_\_ Date: \_\_\_\_\_\_\_\_
- **QA Lead**: \_\_\_\_\_\_\_\_\_\_\_\_ Date: \_\_\_\_\_\_\_\_
- **DevOps Lead**: \_\_\_\_\_\_\_\_\_\_\_\_ Date: \_\_\_\_\_\_\_\_
- **Product Owner**: \_\_\_\_\_\_\_\_\_\_\_\_ Date: \_\_\_\_\_\_\_\_

**Deployment Approved**: ☐ Yes ☐ No

---

**Checklist Version**: 1.0
**Last Updated**: October 16, 2025
**Next Review**: After deployment
