import MyPostCard from "@/app/blog/blog-card";

interface Post {
  id: string;
  createdAt: string | Date;
  userId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  updatedAt: Date;
  published: boolean;
  category: string | null;
  comments?: any[];
}

interface FeaturedBlogPostsProps {
  posts: Post[];
}

export const FeaturedBlogPostsSection = ({ posts }: FeaturedBlogPostsProps) => {
  return (
    <div className="px-4 py-16 mx-auto sm:max-w-xl md:max-w-full lg:max-w-screen-xl md:px-24 lg:px-8 lg:py-20">
      <div className="max-w-xl mb-10 md:mx-auto sm:text-center lg:max-w-2xl md:mb-12">
        <div className="relative">
          <h2 className="max-w-lg mb-6 font-sans text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl md:mx-auto">
            <span className="relative inline-block">
              <span className="relative bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Featured Blog Posts
              </span>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600/40 to-blue-600/40 transform -skew-x-12" />
            </span>
          </h2>
          <p className="text-base text-slate-600 dark:text-gray-300 md:text-lg font-medium">
            Read our latest blog posts and stay up to date with the latest trends
          </p>
        </div>
      </div>
      <div className="grid gap-5 mb-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <MyPostCard 
            key={post.id}
            post={post as any}
          />
        ))}
      </div>
    </div>
  );
}; 
