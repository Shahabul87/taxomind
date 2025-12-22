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
    <CreatePostErrorBoundary>
      <EnterpriseCreatePost />
    </CreatePostErrorBoundary>
  );
};

export default BlogCreationPage;
