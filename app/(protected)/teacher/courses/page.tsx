import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CoursesDashboard } from "./_components/courses-dashboard";
import { CoursesSkeleton } from "./_components/courses-skeleton";
import { cn } from "@/lib/utils";
import { Suspense } from "react";
import { SerializedCourseWithRelations } from "@/types/course";
import { PageWithMobileLayout } from "@/components/layouts/PageWithMobileLayout";

// Force dynamic rendering - this page MUST NOT be statically generated
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CoursesPage = async () => {
  try {
    // Step 1: Get current user
    const user = await currentUser();

    if (!user?.id) {
      console.log('[CoursesPage] No user ID, redirecting to home');
      return redirect("/");
    }

    console.log('[CoursesPage] User authenticated:', user.id);

    // Step 2: Fetch courses with proper error handling
    let coursesData;
    try {
      coursesData = await db.course.findMany({
        where: { userId: user.id },
        include: {
          category: { select: { name: true } },
          _count: { select: { Purchase: true, chapters: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      console.log('[CoursesPage] Fetched courses:', coursesData.length);
    } catch (dbError) {
      console.error('[CoursesPage] Database query failed:', dbError);
      throw new Error(`Database query failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
    }

    // Step 3: Serialize data with validation and explicit typing
    let courses: SerializedCourseWithRelations[];
    try {
      courses = coursesData.map((course): SerializedCourseWithRelations => {
        // Validate Date fields exist before calling toISOString()
        if (!course.createdAt || !course.updatedAt) {
          console.error('[CoursesPage] Missing date fields for course:', course.id);
          throw new Error(`Course ${course.id} has missing date fields`);
        }

        return {
          ...course,
          createdAt: course.createdAt.toISOString(),
          updatedAt: course.updatedAt.toISOString(),
          dealEndDate: course.dealEndDate ? course.dealEndDate.toISOString() : null,
        };
      });
      console.log('[CoursesPage] Serialized courses successfully');
    } catch (serializeError) {
      console.error('[CoursesPage] Serialization failed:', serializeError);
      throw new Error(`Course serialization failed: ${serializeError instanceof Error ? serializeError.message : 'Unknown error'}`);
    }

    // Step 4: Calculate stats
    const publishedCount = courses.filter(c => c.isPublished).length;
    const draftCount = courses.length - publishedCount;
    const totalEnrollments = courses.reduce((sum, c) => sum + (c._count?.Purchase || 0), 0);
    const totalRevenue = courses.reduce((sum, c) => sum + ((c._count?.Purchase || 0) * (c.price || 0)), 0);

    console.log('[CoursesPage] Stats calculated - Total:', courses.length, 'Published:', publishedCount);

    return (
    <PageWithMobileLayout
      showHeader={false}
      showSidebar={true}
      showBottomBar={true}
      enableGestures={true}
      contentClassName={cn(
        "bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40",
        "dark:from-slate-900 dark:via-slate-800 dark:to-slate-700"
      )}
    >
      <div className="min-h-screen w-full px-2 sm:px-3 md:px-4 lg:px-6 pt-0 sm:pt-2 md:pt-4 lg:pt-6 pb-4 sm:pb-6 md:pb-8 lg:pb-12 max-w-7xl mx-auto">
        <Suspense fallback={<CoursesSkeleton />}>
          <CoursesDashboard
            courses={courses}
            stats={{
              total: courses.length,
              published: publishedCount,
              draft: draftCount,
              totalEnrollments,
              totalRevenue
            }}
          />
        </Suspense>
      </div>
    </PageWithMobileLayout>
  );
  } catch (error) {
    // Log the full error for debugging
    console.error('[CoursesPage] Fatal error:', error);
    console.error('[CoursesPage] Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // In production, this will show a generic error page
    // The logs will help identify the root cause
    throw error;
  }
};

export default CoursesPage;
