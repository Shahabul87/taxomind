import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { CourseCreatorDashboard } from "./_components/course-creator-dashboard";
import { PageWithMobileLayout } from "@/components/layouts/PageWithMobileLayout";

const CreatorAnalyticsPage = async () => {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/auth/login");
  }

  return (
    <PageWithMobileLayout
      showHeader={true}
      showSidebar={true}
      showBottomBar={true}
      enableGestures={true}
      contentClassName="bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900/20 dark:to-pink-900/20"
    >
      <div className="min-h-screen w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-7xl mx-auto">
        <CourseCreatorDashboard creatorId={user.id} />
      </div>
    </PageWithMobileLayout>
  );
};

export default CreatorAnalyticsPage;