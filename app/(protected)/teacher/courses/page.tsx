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

  const courses = await db.course.findMany({
    where: {
      userId: user?.id || '',
    },
    include: {
      category: {
        select: {
          name: true
        }
      },
      _count: {
        select: {
          Purchase: true,
          chapters: true
        }
      }
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Enhanced course stats
  const publishedCount = courses.filter(course => course.isPublished).length;
  const draftCount = courses.length - publishedCount;
  const totalEnrollments = courses.reduce((sum, course) => sum + (course._count?.Purchase || 0), 0);
  const totalRevenue = courses.reduce((sum, course) => {
    const enrollments = course._count?.Purchase || 0;
    const price = course.price || 0;
    return sum + (enrollments * price);
  }, 0);

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
