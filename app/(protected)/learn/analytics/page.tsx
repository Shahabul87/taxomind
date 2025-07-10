import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { PersonalLearningDashboard } from "./_components/personal-learning-dashboard";

const PersonalAnalyticsPage = async () => {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-6 py-8">
        <PersonalLearningDashboard userId={user.id} />
      </div>
    </div>
  );
};

export default PersonalAnalyticsPage;