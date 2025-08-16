import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { CourseCreatorDashboard } from "./_components/course-creator-dashboard";

const CreatorAnalyticsPage = async () => {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-purple-900/20 dark:to-pink-900/20">
      <div className="container mx-auto px-6 py-8">
        <CourseCreatorDashboard creatorId={user.id} />
      </div>
    </div>
  );
};

export default CreatorAnalyticsPage;