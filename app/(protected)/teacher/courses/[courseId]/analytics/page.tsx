import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { EnterpriseAnalyticsDashboard } from "./_components/enterprise-analytics-dashboard";

interface AnalyticsPageProps {
  params: Promise<{
    courseId: string;
  }>;
}

const AnalyticsPage = async ({
  params
}: AnalyticsPageProps) => {
  const { courseId } = await params;
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/auth/login");
  }

  // Verify the course exists and user owns it
  const course = await db.course.findUnique({
    where: {
      id: courseId,
      userId: user.id,
    },
    select: {
      id: true,
      title: true,
      description: true,
    }
  });

  if (!course) {
    return redirect("/teacher/courses");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-6 py-8">
        <EnterpriseAnalyticsDashboard 
          courseId={courseId}
          courseName={course.title}
          userId={user.id}
        />
      </div>
    </div>
  );
};

export default AnalyticsPage;