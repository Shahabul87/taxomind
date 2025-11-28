import EnterpriseCreatePost from "./enterprise-create-post";
import { CreatePostErrorBoundary } from "./_components/error-boundary";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

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
    <div className="w-full px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 py-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <CreatePostErrorBoundary>
        <EnterpriseCreatePost />
      </CreatePostErrorBoundary>
    </div>
  );
};

export default BlogCreationPage;
