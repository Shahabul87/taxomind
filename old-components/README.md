# Old Components Archive

This directory contains deprecated/unused components that have been replaced or are no longer needed in the active codebase.

## Dashboard Components

### Moved on: 2025-11-09

The following dashboard components were moved here during refactoring to align with the actual authentication structure:

1. **UnifiedDashboard.tsx** - Replaced by refactored SimpleDashboard with conditional sections
2. **UnifiedDashboard.bak.tsx** - Backup file, no longer needed
3. **AdminDashboard.tsx** - Unused component (admin has separate simple dashboard at `/dashboard/admin/page.tsx`)

## Current Dashboard Architecture

The new simplified structure:

```
User (role=USER)
├─ isTeacher: false, isAffiliate: false → Learning dashboard only + "Become Instructor" CTA
├─ isTeacher: true → Tabbed view with Learning + Teaching sections
├─ isAffiliate: true → Tabbed view with Learning + Affiliate sections
└─ isTeacher: true + isAffiliate: true → Tabbed view with all three sections

Admin (role=ADMIN)
└─ Completely separate dashboard at /dashboard/admin
```

## Why These Were Removed

**Problem**: The old components treated `isTeacher` and `isAffiliate` as separate user roles, when they're actually optional capability flags on the `USER` role.

**Solution**: Refactored `SimpleDashboard` to use a unified approach:
- Everyone gets the learning dashboard
- Additional sections conditionally appear based on capabilities
- Cleaner code with less duplication
- Better alignment with actual auth structure (ADMIN vs USER)

## Can These Be Deleted?

Yes, after verifying:
1. No tests depend on these specific components
2. No production code imports them
3. The new dashboard works correctly for all user types

## Restoration

If needed, these components can be restored from this directory or from git history.
