import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CoursesDashboard } from "./_components/courses-dashboard";
import { CoursesSkeleton } from "./_components/courses-skeleton";
import { cn } from "@/lib/utils";
import { Suspense } from "react";
import { DynamicPageWrapper } from "./_components/dynamic-page-wrapper";

const CoursesPage = async () => {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/");
  }

  // Fetch full list for table (keeps current UX); can switch to server-driven later
  const coursesData = await db.course.findMany({
    where: { userId: user.id },
    include: {
      category: { select: { name: true } },
      _count: { select: { Purchase: true, chapters: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Serialize data to fix Server Component rendering in production
  // Convert Date objects to ISO strings for proper serialization
  const courses = coursesData.map((course) => ({
    ...course,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
  }));

  // Stats based on fetched list
  const publishedCount = courses.filter(c => c.isPublished).length;
  const draftCount = courses.length - publishedCount;
  const totalEnrollments = courses.reduce((sum, c) => sum + (c._count?.Purchase || 0), 0);
  const totalRevenue = courses.reduce((sum, c) => sum + ((c._count?.Purchase || 0) * (c.price || 0)), 0);

  return (
    <DynamicPageWrapper>
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
    </DynamicPageWrapper>
  );
};

export default CoursesPage;
