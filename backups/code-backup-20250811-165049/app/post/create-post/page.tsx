import { CreateNewBlogPage } from "./create-blog";
import { cn } from "@/lib/utils";

const BlogCreationPage = () => {
  return (
    <div className="flex justify-center items-center py-10">
      <div className={cn(
        "min-h-[calc(100vh-8rem)]",
        "w-full max-w-6xl mx-auto",
        "bg-white/5 dark:bg-gray-900/5",
        "border border-gray-100/10 dark:border-gray-800/10",
        "backdrop-blur-sm rounded-xl overflow-hidden",
        "shadow-xl"
      )}>
        <CreateNewBlogPage />
      </div>
    </div>
  );
};

export default BlogCreationPage;