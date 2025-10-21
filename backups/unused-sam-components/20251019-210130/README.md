# Unused SAM Integration Components - Backup

**Date:** October 19, 2025
**Reason:** Replaced with global SAM assistant (redesigned floating button)

## Files Moved to Backup

1. **sam-integration-example.tsx** (8.1 KB)
   - Original course page SAM integration
   - Replaced by: Global SAM + SimpleCourseContext

2. **chapter-sam-integration.tsx** (9.9 KB)
   - Original chapter page SAM integration
   - Replaced by: Global SAM assistant

3. **course-page-sam-integration.tsx** (7.4 KB)
   - Alternative course page SAM implementation
   - Replaced by: Global SAM + SimpleCourseContext

4. **intelligent-sam-integration.tsx** (3.9 KB)
   - Alternative intelligent SAM implementation
   - Replaced by: Global SAM assistant

5. **sam-form-integration-example.tsx** (6.4 KB)
   - Form-specific SAM integration example
   - Replaced by: useSAMFormSync hook + Global SAM

## Why These Were Removed

### Problem:
- Multiple duplicate SAM assistant instances on the same page
- Inconsistent UI/UX across different pages
- Confusing for users (multiple chat buttons)
- Higher memory usage and potential performance issues

### Solution:
- Single global SAM assistant (floating button, bottom-right)
- Consistent across ALL pages
- Context awareness via SimpleCourseContext and form sync hooks
- Cleaner codebase, better UX

## New Architecture

```
Global SAM Assistant (Redesigned)
├── Floating button (bottom-right corner)
├── Available on all pages
├── Context-aware via:
│   ├── SimpleCourseContext (course data)
│   ├── useSAMFormSync (form data)
│   └── Page-specific context injection
└── Single, consistent UI
```

## Migration Path

If you need to restore these components:

1. Copy the desired file from this backup folder
2. Move it back to its original location:
   - Course components: `app/(protected)/teacher/courses/[courseId]/_components/`
   - Chapter components: `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/_components/`
3. Re-import in the respective page components
4. Note: This will create duplicate SAM instances (not recommended)

## Related Changes

- Removed imports from:
  - `app/(protected)/teacher/courses/[courseId]/page.tsx`
  - `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/_components/enterprise-chapter-page-client.tsx`
  - `app/(protected)/teacher/courses/[courseId]/chapters/[chapterId]/_components/chapter-page-client.tsx`

## Total Savings

- **Code removed:** ~35.7 KB
- **Duplicate components:** 5 → 0
- **SAM instances per page:** 2-3 → 1
- **User confusion:** Eliminated

---

**Note:** These files are kept as backup for reference. The global SAM assistant provides superior functionality with better UX.
