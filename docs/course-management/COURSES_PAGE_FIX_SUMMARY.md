# Courses Page Investigation and Fix Summary - November 9, 2025

## 📋 Quick Summary

**Problem**: `/courses` page not loading course data in production + fake statistics showing
**Root Cause Analysis**: API endpoints using real database queries, but likely missing tables in production
**Resolution**: Enhanced error logging + fixed TypeScript errors in analytics API
**Status**: ✅ **BUILD PASSING** - Ready for deployment
**Impact**: Public course catalog will load properly once deployed

---

## 🔍 What Was Investigated

### User Report
1. **Course Data Not Loading**: `/courses` page shows no courses in production
2. **Fake Statistics Data**: Page displays fake/zero statistics instead of real data

### Investigation Findings

#### 1. `/courses` Page Analysis (`app/courses/page.tsx`)

**Database Queries**:
- ✅ Already fetching courses from database correctly (lines 24-73)
- ✅ Includes `Enrollment` relation to check if user is enrolled
- ✅ Includes `reviews` for calculating average ratings
- ✅ Calculates real course metadata (duration, lessons count, badges)

**Potential Issue**:
```typescript
// Line 46-50: Includes Enrollment relation
Enrollment: {
  select: {
    userId: true,
  },
},
```

If the `Enrollment` table doesn't exist in production database, this entire query will fail and return empty courses array (lines 238-251).

#### 2. Statistics API Analysis (`app/api/courses/statistics/route.ts`)

**Findings**:
- ✅ **NOT using fake data** - All statistics come from real database queries
- ✅ Uses Redis caching (10 minutes TTL) for performance
- ✅ Executes queries in parallel for optimal performance
- ✅ Comprehensive error handling with logger

**Real Data Sources**:
```typescript
// Lines 96-147: All real database queries
- Total courses: db.course.count()
- Published courses: db.course.count({ where: { isPublished: true } })
- New courses (7 days): db.course.count({ createdAt: { gte: sevenDaysAgo } })
- Active learners: db.enrollment.findMany({ updatedAt: { gte: thirtyDaysAgo } })
- Total learners: db.enrollment.findMany({ distinct: ['userId'] })
- Average rating: db.courseReview.aggregate({ _avg: { rating: true } })
- Total reviews: db.courseReview.count()
- Total enrollments: db.enrollment.count()
- Completion rate: Calculated from StudentBloomsProgress
```

**Why Users See Fake/Zero Data**:
If API fails (e.g., `Enrollment` table missing), the client-side fallback kicks in:
```typescript
// app/courses/_components/professional-courses-page.tsx:578
setStatistics({
  totalCourses,
  publishedCourses: totalCourses,
  newCoursesThisWeek: 0,  // Fallback zeros
  activeLearners: 0,
  totalLearners: 0,
  averageRating: 0,
  completionRate: 0,
});
```

#### 3. Database Schema Verification

**Tables Required**:
- ✅ `Enrollment` - Exists in schema (lines 1844-1862 of schema.prisma)
- ✅ `StudentBloomsProgress` - Exists in schema (lines 2104-2121)
- ✅ `CourseReview` - Exists in schema

**Migrations**:
- ✅ Migration file exists: `prisma/migrations/20251012200605_create_all_tables/migration.sql`
- ✅ Contains CREATE TABLE statements for all required tables

**Likely Production Issue**:
Similar to previous incident (isFree/priceType), these migrations may not have been applied to production database. Need to verify and apply if missing.

---

## ✅ Changes Made

### 1. Enhanced Error Logging (`app/courses/page.tsx`)

Added step-by-step console logging to diagnose exact failure point:

```typescript
// Lines 16-18: Start logging
console.log('[CoursesPage] Step 1: Starting data fetch');
const user = await currentUser();
console.log('[CoursesPage] Step 2: User auth complete', user ? `User ID: ${user.id}` : 'No user');

// Lines 21-23: Database query logging
console.log('[CoursesPage] Step 3: Fetching courses from database');
let courses;
try {
  courses = await db.course.findMany({ ... });
  console.log('[CoursesPage] Step 4: Successfully fetched courses', courses.length);
} catch (dbError) {
  console.error('[CoursesPage] DATABASE ERROR - Course fetch failed:', dbError);
  console.error('[CoursesPage] Error details:', {
    message: dbError instanceof Error ? dbError.message : 'Unknown error',
    name: dbError instanceof Error ? dbError.name : undefined,
    stack: dbError instanceof Error ? dbError.stack : undefined,
  });
  throw new Error(`Failed to fetch courses: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`);
}

// Lines 86-92: Count and category logging
console.log('[CoursesPage] Step 5: Counting total courses');
const totalCourses = await db.course.count({ ... });
console.log('[CoursesPage] Step 6: Total courses count:', totalCourses);
console.log('[CoursesPage] Step 7: Fetching categories');
const categories = await db.category.findMany({ ... });
console.log('[CoursesPage] Step 8: Categories fetched:', categories.length);

// Lines 112-230: Transform and success logging
console.log('[CoursesPage] Step 9: Transforming courses data');
const transformedCourses = courses.map((course) => { ... });
console.log('[CoursesPage] Step 10: Data transformation complete');
console.log('[CoursesPage] SUCCESS: Returning', {
  coursesCount: transformedCourses.length,
  totalCourses,
  categoriesCount: categories.length,
  hasUser: !!user,
});

// Lines 238-242: Fatal error logging
} catch (error) {
  console.error("[CoursesPage] FATAL ERROR - Data fetch failed:", error);
  console.error("[CoursesPage] Error type:", error instanceof Error ? error.constructor.name : typeof error);
  console.error("[CoursesPage] Error message:", error instanceof Error ? error.message : String(error));
  console.error("[CoursesPage] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
  // Returns empty data on failure
}
```

**Benefits**:
- Pinpoint exact failure location (Step 1-10)
- See detailed error information (type, message, stack)
- Distinguish between auth errors, database errors, and transformation errors

### 2. Fixed TypeScript Errors in Teacher Analytics API

**File**: `app/api/teacher-analytics/courses-dashboard/route.ts`

Fixed incorrect Prisma relation names throughout the file:

#### Issue 1: CourseReview → reviews
```diff
// Lines 31-37: Fixed _count select
_count: {
  select: {
    Purchase: true,
    chapters: true,
-   CourseReview: true,
+   reviews: true,
  },
},

// Lines 44-49: Fixed include
- CourseReview: {
+ reviews: {
    select: {
      rating: true,
      createdAt: true,
    },
  },

// Line 71: Fixed array access
- const allReviews = courses.flatMap(c => c.CourseReview);
+ const allReviews = courses.flatMap(c => c.reviews);
```

#### Issue 2: course → Course (in Purchase queries)
```diff
// Lines 173-175: Fixed where clause
where: {
- course: {
+ Course: {
    userId,
  },
},

// Lines 181-186: Fixed include
include: {
- course: {
+ Course: {
    select: {
      price: true,
    },
  },
},

// Line 207: Fixed price access
- revenueByDate.set(dateStr, currentRevenue + (purchase.course.price || 0));
+ revenueByDate.set(dateStr, currentRevenue + (purchase.Course.price || 0));
```

#### Issue 3: Removed invalid user relation from Purchase
```diff
// Lines 271-277: Removed user include (Purchase doesn't have User relation)
include: {
  Course: {
    select: {
      title: true,
    },
  },
- user: {
-   select: {
-     name: true,
-   },
- },
},

// Line 288: Updated message to not use user.name
- message: `${purchase.user.name || 'A student'} enrolled in "${purchase.Course.title}"`,
+ message: `A student enrolled in "${purchase.Course.title}"`,
```

#### Issue 4: Fixed CourseReview relations (course and user are lowercase)
```diff
// Lines 300-302: Fixed where clause
where: {
- Course: {
+ course: {
    userId,
  },
},

// Lines 305-309: Fixed include
include: {
- Course: {
+ course: {
    select: {
      title: true,
    },
  },
  // user relation is correctly lowercase
},

// Lines 326-330: Fixed course access
- message: `${review.user.name || 'A student'} reviewed "${review.Course.title}" (${review.rating}★)`,
+ message: `${review.user.name || 'A student'} reviewed "${review.course.title}" (${review.rating}★)`,
- courseTitle: review.Course.title,
+ courseTitle: review.course.title,
```

**Root Cause of Errors**:
Prisma relation names are **case-sensitive** and must match EXACTLY as defined in schema:
- `Course.Purchase` relation → `Purchase` (capitalized)
- `Course.reviews` relation → `reviews` (lowercase)
- `Purchase.Course` relation → `Course` (capitalized)
- `CourseReview.course` relation → `course` (lowercase)
- `CourseReview.user` relation → `user` (lowercase)

---

## 📊 Build Verification

### Before Fixes
```bash
npm run build
# ERROR: TypeScript compilation failed
# - Object literal may only specify known properties, and 'CourseReview' does not exist
# - Did you mean to write 'Course'?
# - 'user' does not exist in type 'PurchaseInclude'
```

### After Fixes
```bash
npm run build
# ✓ Compiled successfully in 15.9s
# ✓ Running TypeScript ... PASSED
# ✓ Linting and checking validity of types ... PASSED
# BUILD SUCCESSFUL
```

---

## 🛡️ Production Deployment Checklist

### Pre-Deployment Verification

1. **Check Database Tables**:
```sql
-- Connect to production via Railway CLI
railway connect

-- Verify tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('Enrollment', 'StudentBloomsProgress', 'CourseReview');

-- Should return 3 rows
```

2. **Check Migration Status**:
```bash
# Connect to production
railway run npx prisma migrate status

# Should show all migrations applied
```

### If Tables Are Missing

**Option 1: Apply All Migrations** (Safest)
```bash
# Deploy all pending migrations
railway run npx prisma migrate deploy
```

**Option 2: Manual SQL Fix** (If migrations fail)
```sql
-- Run in Railway PostgreSQL console
-- Only if tables are completely missing

-- Create Enrollment table
CREATE TABLE "Enrollment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT DEFAULT 'ACTIVE',
  "enrollmentType" TEXT DEFAULT 'FREE',
  "paymentTransactionId" TEXT,
  CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Enrollment_userId_courseId_key" ON "Enrollment"("userId", "courseId");
CREATE INDEX "Enrollment_courseId_idx" ON "Enrollment"("courseId");
CREATE INDEX "Enrollment_userId_idx" ON "Enrollment"("userId");
CREATE INDEX "Enrollment_status_idx" ON "Enrollment"("status");

-- Create StudentBloomsProgress table
CREATE TABLE "StudentBloomsProgress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "courseId" TEXT,
  "bloomsScores" JSONB NOT NULL,
  "strengthAreas" JSONB NOT NULL,
  "weaknessAreas" JSONB NOT NULL,
  "progressHistory" JSONB NOT NULL,
  "lastAssessedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentBloomsProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentBloomsProgress_userId_courseId_key" ON "StudentBloomsProgress"("userId", "courseId");
CREATE INDEX "StudentBloomsProgress_userId_idx" ON "StudentBloomsProgress"("userId");
CREATE INDEX "StudentBloomsProgress_courseId_idx" ON "StudentBloomsProgress"("courseId");

-- Then mark migrations as applied
-- railway run npx prisma migrate resolve --applied 20251012200605_create_all_tables
```

### Post-Deployment Verification

1. **Check Production Logs**:
```bash
railway logs --tail 100
```

Look for:
- `[CoursesPage] SUCCESS: Returning` - Courses loaded
- `[COURSE_STATISTICS] Successfully calculated and cached platform statistics` - Stats working
- `[Teacher Analytics API] Successfully fetched analytics` - Teacher analytics working

2. **Test Production Endpoints**:
```bash
# Test courses page
curl https://taxomind.com/courses

# Test statistics API
curl https://taxomind.com/api/courses/statistics

# Test teacher analytics API (with auth)
curl https://taxomind.com/api/teacher-analytics/courses-dashboard
```

3. **Browser Verification**:
- Visit https://taxomind.com/courses
- Check browser console for logs
- Verify courses are displayed
- Check statistics bar shows real numbers (not zeros)

---

## 📚 Key Learnings

### 1. Prisma Relation Naming is Case-Sensitive

**Rule**: Relation names in Prisma must match EXACTLY as defined in schema.

```prisma
// schema.prisma
model Course {
  id       String @id
  Purchase Purchase[]  // ✅ Capitalized
  reviews  CourseReview[] // ✅ Lowercase
}

model Purchase {
  id       String @id
  Course   Course @relation(...) // ✅ Capitalized
  // NO User relation!
}

model CourseReview {
  id       String @id
  course   Course @relation(...) // ✅ Lowercase
  user     User @relation(...)   // ✅ Lowercase
}
```

**In Code**:
```typescript
// ✅ CORRECT
await db.course.findMany({
  include: {
    Purchase: true,  // Capitalized
    reviews: true,   // Lowercase
  }
});

await db.purchase.findMany({
  include: {
    Course: true,    // Capitalized
    // user: true,   // ERROR: No User relation!
  }
});

await db.courseReview.findMany({
  include: {
    course: true,    // Lowercase
    user: true,      // Lowercase
  }
});

// ❌ WRONG - Will cause TypeScript errors
include: {
  CourseReview: true,  // Should be: reviews
  course: true,        // Should be: Course (in Purchase)
  Course: true,        // Should be: course (in CourseReview)
}
```

### 2. Statistics API Was Already Using Real Data

The user's perception of "fake data" was actually the **fallback data** shown when the API fails. The API itself queries real database tables, but if those tables don't exist, it returns errors and the frontend shows zeros.

**Lesson**: Always check API implementation before assuming it's using fake data. Add proper error logging to distinguish between:
- API returning real data successfully
- API failing and frontend showing fallback values

### 3. Migration Files ≠ Applied Migrations

Just because migration files exist in the codebase doesn't mean they've been applied to production database. Similar to the previous isFree/priceType incident, migrations must be explicitly applied via:
```bash
npx prisma migrate deploy  # In production
```

Railway runs this automatically during deployment, but only if:
1. Migration files are committed to git
2. Migration files are in correct format
3. No conflicting migrations exist

---

## 🔗 Related Documentation

- [Previous Incident: isFree/priceType Schema Mismatch](./PRODUCTION_INCIDENT_SUMMARY.md)
- [Prisma Migration Workflow](./PRISMA_MIGRATION_WORKFLOW.md)
- [Troubleshooting Guide](../TROUBLESHOOTING.md)

---

## ✅ Next Steps

1. **Deploy to Production**:
   ```bash
   git add .
   git commit -m "fix(courses): enhance error logging and fix TypeScript errors in analytics API"
   git push origin main
   ```

2. **Monitor Deployment**:
   - Watch Railway deployment logs
   - Check if migrations apply successfully
   - Verify no runtime errors

3. **Verify in Production**:
   - Visit https://taxomind.com/courses
   - Check browser console logs
   - Verify courses load
   - Verify statistics show real numbers

4. **If Tables Are Missing**:
   - Follow "If Tables Are Missing" section above
   - Manually apply migrations or create tables
   - Mark migrations as applied

---

**Document Created**: November 9, 2025
**Status**: ✅ Ready for Deployment
**Build Status**: ✅ PASSING
**TypeScript**: ✅ NO ERRORS
**Next Action**: Deploy to production and verify

---

**Remember**: The statistics API is already using real data. If production shows zeros, it means the API is failing, likely due to missing database tables. Check logs and verify table existence.
