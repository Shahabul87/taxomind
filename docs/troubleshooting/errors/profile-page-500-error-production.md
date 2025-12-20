# Profile Page 500 Error and Blank Page in Production

## 🔴 Problem Description

### Symptoms
- **Development**: Profile page worked perfectly with full UI (header, sidebar, navigation, user data)
- **Production**: Profile page showed completely blank page with only "No profile data available" text
- **Console Error**: `GET /api/user/profile 500 (Internal Server Error)`
- **No Layout**: Missing header, sidebar, navigation - only fallback error message visible

### Impact
- Users unable to view their profile page in production
- Complete page failure instead of graceful degradation
- Poor user experience with no context or navigation

---

## 🔍 Root Causes

### 1. **Layout Wrapper Conditional Rendering**
**File**: `app/profile/_components/ProfilePageLayout.tsx`

**Problem**:
```tsx
if (!session?.user) {
  return <>{children}</>; // ❌ Returns children WITHOUT layout wrapper
}

return (
  <MobileLayout user={user} ...>
    {children}
  </MobileLayout>
);
```

**Issue**: When the session wasn't loaded or had issues in production, the component returned only the children without the `MobileLayout` wrapper, resulting in no header, sidebar, or navigation.

### 2. **API Cascading Failures**
**File**: `app/api/user/profile/route.ts`

**Problem**: Single query fetching user data with ALL relations:
```typescript
user = await db.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    name: true,
    // ... basic fields
    Enrollment: { /* complex nested query */ },
    certifications: { /* relation query */ },
    profileLinks: { /* relation query */ },
  },
});
```

**Issues**:
- If ANY relation failed (missing table, schema mismatch), the ENTIRE query failed
- Threw error causing 500 response
- No graceful degradation - all or nothing approach
- Production database missing optional tables: `learning_metrics`, `study_streaks`, `user_achievements`, `user_progress`, `profileLinks`

### 3. **Insufficient Error Logging**
**File**: `app/profile/page.tsx`

**Problem**:
- Generic error messages without details
- No API response logging
- Difficult to debug production issues

---

## ✅ Solutions Implemented

### Fix 1: Always Render Layout Wrapper
**File**: `app/profile/_components/ProfilePageLayout.tsx`

**Changes**:
```tsx
export function ProfilePageLayout({ children }: ProfilePageLayoutProps) {
  const { data: session, status } = useSession();

  // ✅ Always render the layout wrapper, even during loading or if no session
  // This ensures the header, sidebar, and navigation are always visible
  const user = session?.user as (User & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  }) | undefined;

  return (
    <MobileLayout
      user={user}
      showHeader={true}
      showSidebar={true}
      showBottomBar={true}
      enableGestures={true}
      contentClassName="bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700"
    >
      {children}
    </MobileLayout>
  );
}
```

**Result**: Layout now renders regardless of session status.

---

### Fix 2: Enhanced Error Logging
**File**: `app/profile/page.tsx`

**Changes**:
```typescript
useEffect(() => {
  const fetchProfile = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/user/profile');

      console.log('[Profile] API Response Status:', response.status);

      const result = await response.json();
      console.log('[Profile] API Response:', result);

      if (!response.ok) {
        const errorMsg = result.error?.message || `API returned ${response.status}`;
        console.error('[Profile] API Error:', {
          status: response.status,
          error: result.error,
          details: result.error?.details
        });
        toast.error(errorMsg);
        return;
      }

      if (result.success && result.data) {
        setProfile(result.data);
      } else {
        console.error('[Profile] Invalid response format:', result);
        toast.error(result.error?.message || 'Failed to load profile data');
      }
    } catch (error) {
      console.error('[Profile] Fetch error:', error);
      toast.error(`Failed to load profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (session?.user) {
    fetchProfile();
  }
}, [session]);
```

**Improved Fallback UI**:
```typescript
if (!profile) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Unable to Load Profile
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          We encountered an issue loading your profile data. Please check the browser console for details.
        </p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
        >
          Retry
        </Button>
      </div>
    </div>
  );
}
```

**Result**: Detailed error logging and better user feedback.

---

### Fix 3: Separate Independent Queries with Fallbacks
**File**: `app/api/user/profile/route.ts`

**Strategy**: Fetch data in independent queries, each with try-catch fallback.

#### 3a. Basic User Data (Always Works)
```typescript
// ✅ Fetch basic user data without relations
let user;
try {
  user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phone: true,
      bio: true,
      location: true,
      role: true,
      createdAt: true,
    },
  });
} catch (error) {
  logger.error('[PROFILE_GET] Failed to fetch basic user data:', error);
  throw new Error(`Database query failed: ${error.message}`);
}
```

#### 3b. Enrollments (Optional with Fallback)
```typescript
let enrolledCourses: Array<{...}> = [];

try {
  enrolledCourses = await db.enrollment.findMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
    include: {
      Course: {
        include: {
          user: { select: { name: true } },
          chapters: {
            where: { isPublished: true },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
} catch (error) {
  logger.warn('[PROFILE_GET] Failed to fetch enrollments (table may not exist):', error);
  // Continue with empty array
}
```

#### 3c. Certifications (Optional with Fallback)
```typescript
let certifications: Array<{...}> = [];

try {
  certifications = await db.certification.findMany({
    where: {
      userId,
      isRevoked: false,
    },
    select: {
      id: true,
      issuedAt: true,
      courseId: true,
    },
  });
} catch (error) {
  logger.warn('[PROFILE_GET] Failed to fetch certifications (table may not exist):', error);
  // Continue with empty array
}
```

#### 3d. Profile Links (Optional with Fallback)
```typescript
let profileLinks: Array<{ platform: string; url: string }> = [];

try {
  profileLinks = await db.profileLink.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      platform: true,
      url: true,
    },
  });
} catch (error) {
  logger.warn('[PROFILE_GET] Failed to fetch profile links (table may not exist):', error);
  // Continue with empty array
}
```

#### 3e. All Other Optional Tables
Similar try-catch patterns for:
- `learning_metrics` → fallback: `totalLearningHours = 0`
- `study_streaks` → fallback: `currentStreak = 0, longestStreak = 0`
- `user_achievements` → fallback: `achievements = []`
- `user_progress` → fallback: `recentActivity = []`

**Result**: Each query is independent. If one fails, others still work.

---

## 📊 Architecture Comparison

### Before (Monolithic Query)
```
User Query (ALL or NOTHING)
├─ Basic Fields
├─ Enrollment (nested)
│  └─ Course
│     ├─ User
│     └─ Chapters
├─ Certifications
└─ ProfileLinks

❌ If ANY relation fails → Entire query fails → 500 error
```

### After (Independent Queries)
```
1. User Query (basic fields only) ← ALWAYS WORKS
2. Enrollments Query ← Falls back to []
3. Certifications Query ← Falls back to []
4. ProfileLinks Query ← Falls back to []
5. Learning Metrics Query ← Falls back to 0
6. Study Streaks Query ← Falls back to 0
7. Achievements Query ← Falls back to []
8. User Progress Query ← Falls back to []

✅ Each query independent → Graceful degradation → Shows available data
```

---

## 🚀 Deployment & Results

### Commits
1. **Commit 1**: `2359cf1` - Layout fix and initial API improvements
2. **Commit 2**: `0a93285` - Complete API refactor with independent queries

### Files Modified
- `app/profile/_components/ProfilePageLayout.tsx` (8 insertions, 9 deletions)
- `app/profile/page.tsx` (30 insertions, 11 deletions)
- `app/api/user/profile/route.ts` (132 insertions, 59 deletions)

### Build Status
✅ Production build passed (exit code 0)
✅ ESLint passed (0 errors, 2 pre-existing warnings)
✅ All tests passed

### Production Results
**Before**:
- ❌ Blank page with "No profile data available"
- ❌ No header, sidebar, or navigation
- ❌ 500 Internal Server Error
- ❌ No user data visible

**After**:
- ✅ Full page layout renders (header, sidebar, navigation)
- ✅ Basic user info displays (name, email, bio, location)
- ✅ Course enrollments show (if Enrollment table exists)
- ✅ Certificates display (if Certification table exists)
- ✅ Graceful zero values for missing optional data
- ✅ 200 OK response
- ✅ Enhanced error logging for debugging

---

## 🎯 Key Takeaways

### Best Practices Applied

1. **Separation of Concerns**
   - Basic data separate from optional data
   - Each data source independent and isolated

2. **Graceful Degradation**
   - Page works with minimal data
   - Progressive enhancement as more data available
   - Never block on optional features

3. **Defensive Programming**
   - Try-catch for every external dependency
   - Meaningful fallback values
   - Detailed error logging

4. **User Experience**
   - Always show layout and navigation
   - Provide retry mechanisms
   - Clear error messages for debugging

### Production Resilience

The profile page now:
- ✅ Works without optional database tables
- ✅ Handles schema mismatches gracefully
- ✅ Provides clear debugging information
- ✅ Maintains full UX even with partial data
- ✅ Self-heals as database tables are added

### Migration Path

When ready to enable full features:
```bash
# Run migrations to create missing tables
npx prisma migrate deploy
```

Once migrations run:
- All optional features auto-populate
- No code changes needed
- Seamless upgrade path

---

## 📝 Notes for Future

### Database Tables (Optional)
These tables are defined in schema but may not exist in production:
- `learning_metrics`
- `study_streaks`
- `user_achievements`
- `user_progress`
- `profileLinks`

**Current Status**: API handles their absence gracefully.

### Error Monitoring
All warnings logged with prefix:
- `[PROFILE_GET] Failed to fetch [table_name] (table may not exist)`

Monitor Railway logs for these warnings to know which tables need migration.

### Testing Checklist
- [ ] Profile page loads in production ✅
- [ ] Layout (header/sidebar) renders ✅
- [ ] Basic user info displays ✅
- [ ] Enrollments show (if table exists) ✅
- [ ] Certifications show (if table exists) ✅
- [ ] Zero values for missing metrics ✅
- [ ] No 500 errors ✅
- [ ] Error logging works ✅

---

## 🔗 Related Issues

- Production profile page blank: RESOLVED ✅
- 500 Internal Server Error: RESOLVED ✅
- Missing database tables: HANDLED ✅
- Layout not rendering: RESOLVED ✅

**Status**: All issues resolved. Profile page fully functional in production.

**Date Resolved**: January 2025
**Resolved By**: Claude Code AI Assistant
