import EnterpriseCreatePost from "./enterprise-create-post";
import { CreatePostErrorBoundary } from "./_components/error-boundary";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SmartHeader } from "@/components/dashboard/smart-header";
import { SmartSidebar } from "@/components/dashboard/smart-sidebar";

/**
 * Blog Creation Page
 * Enterprise-grade post creation with error boundaries
 */
const BlogCreationPage = async () => {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <SmartHeader user={user} />
      <div className="flex">
        <SmartSidebar user={user} />
        <main className="flex-1 pt-16 pl-[72px] transition-all duration-300">
          <CreatePostErrorBoundary>
            <EnterpriseCreatePost />
          </CreatePostErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default BlogCreationPage;
