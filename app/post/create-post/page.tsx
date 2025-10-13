import EnterpriseCreatePost from "./enterprise-create-post";
import { CreatePostErrorBoundary } from "./_components/error-boundary";
import { cn } from "@/lib/utils";

/**
 * Blog Creation Page
 * Enterprise-grade post creation with error boundaries
 */
const BlogCreationPage = () => {
  return (
    <CreatePostErrorBoundary>
      <div className="flex justify-center items-center py-10">
        <div className={cn(
          "min-h-[calc(100vh-8rem)]",
          "w-full"
        )}>
          <EnterpriseCreatePost />
        </div>
      </div>
    </CreatePostErrorBoundary>
  );
};

export default BlogCreationPage;
