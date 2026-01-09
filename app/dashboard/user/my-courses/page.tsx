import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getUserCreatedCourses, getUserEnrolledCourses } from '@/actions/get-user-courses';
import { Suspense } from 'react';
import { MyCoursesDashboardEnterprise } from './_components/my-courses-dashboard-enterprise';
import { MyCoursesLoading } from './_components/my-courses-loading';
import { MyCoursesError } from './_components/my-courses-error';
import { logger } from '@/lib/logger';
import { PageWithMobileLayout } from '@/components/layouts/PageWithMobileLayout';

export const dynamic = 'force-dynamic';

async function MyCoursesContent() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  try {
    // Fetch both types of courses simultaneously with error handling
    const [enrolledCoursesData, createdCoursesData] = await Promise.allSettled([
      getUserEnrolledCourses(),
      getUserCreatedCourses(),
    ]);

    // Extract data with safe fallbacks
    const enrolledData =
      enrolledCoursesData.status === 'fulfilled'
        ? enrolledCoursesData.value
        : { courses: [], error: 'Failed to load enrolled courses' };

    const createdData =
      createdCoursesData.status === 'fulfilled'
        ? createdCoursesData.value
        : { courses: [], error: 'Failed to load created courses' };

    return (
      <MyCoursesDashboardEnterprise
        enrolledCourses={enrolledData.courses || []}
        createdCourses={createdData.courses || []}
        enrolledCoursesError={enrolledData.error}
        createdCoursesError={createdData.error}
        user={session.user}
      />
    );
  } catch (error: any) {
    logger.error('[MY_COURSES_PAGE_ERROR]', error);
    return <MyCoursesError error="Failed to load courses. Please try again later." />;
  }
}

const MyCoursesPage = async () => {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  return (
    <PageWithMobileLayout
      showHeader={true}
      showSidebar={true}
      showBottomBar={true}
      enableGestures={true}
      contentClassName="bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700"
    >
      <div className="min-h-screen w-full px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 py-6">
        <Suspense fallback={<MyCoursesLoading />}>
          <MyCoursesContent />
        </Suspense>
      </div>
    </PageWithMobileLayout>
  );
};

export default MyCoursesPage;
