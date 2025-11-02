import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserCreatedCourses, getUserEnrolledCourses } from "@/actions/get-user-courses";
import { Suspense } from "react";
import { MyCoursesDashboard } from "./_components/my-courses-dashboard";
import { MyCoursesLoading } from "./_components/my-courses-loading";
import { MyCoursesError } from "./_components/my-courses-error";
import { logger } from '@/lib/logger';
import { DashboardLayout } from "@/app/dashboard/_components/DashboardLayout";

export const dynamic = "force-dynamic";

async function MyCoursesContent() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  try {
    // Fetch both types of courses simultaneously with error handling
    const [enrolledCoursesData, createdCoursesData] = await Promise.allSettled([
      getUserEnrolledCourses(),
      getUserCreatedCourses(),
    ]);

    // Extract data with safe fallbacks
    const enrolledData = enrolledCoursesData.status === 'fulfilled' 
      ? enrolledCoursesData.value 
      : { courses: [], error: "Failed to load enrolled courses" };
    
    const createdData = createdCoursesData.status === 'fulfilled' 
      ? createdCoursesData.value 
      : { courses: [], error: "Failed to load created courses" };

    return (
      <MyCoursesDashboard 
        enrolledCourses={enrolledData.courses || []}
        createdCourses={createdData.courses || []}
        enrolledCoursesError={enrolledData.error}
        createdCoursesError={createdData.error}
        user={session.user}
      />
    );
  } catch (error: any) {
    logger.error("[MY_COURSES_PAGE_ERROR]", error);
    return (
      <MyCoursesError 
        error="Failed to load courses. Please try again later."
      />
    );
  }
}

const MyCoursesPage = async () => {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <DashboardLayout user={session.user}>
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/10">
        <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <Suspense fallback={<MyCoursesLoading />}>
            <MyCoursesContent />
          </Suspense>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyCoursesPage; 
