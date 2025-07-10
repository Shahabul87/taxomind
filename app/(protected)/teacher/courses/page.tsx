import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CoursesDashboard } from "./_components/courses-dashboard";
import { CoursesSkeleton } from "./_components/courses-skeleton";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

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
          purchases: true,
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
  const totalEnrollments = courses.reduce((sum, course) => sum + (course._count?.purchases || 0), 0);
  const totalRevenue = courses.reduce((sum, course) => {
    const enrollments = course._count?.purchases || 0;
    const price = course.price || 0;
    return sum + (enrollments * price);
  }, 0);

  return (
    <div className={cn(
      "min-h-screen",
      "bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800",
      "transition-colors duration-300"
    )}>
      <div className={cn(
        "container mx-auto",
        "px-4 sm:px-6 lg:px-8",
        "py-6 sm:py-8 lg:py-12",
        "max-w-[2000px]"
      )}>
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
    </div>
  );
};

export default CoursesPage;