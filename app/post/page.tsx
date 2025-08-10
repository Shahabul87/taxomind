import { getPostsForHomepage } from "@/actions/get-all-posts";
import PostCard from "./_components/post-card";
import { logger } from '@/lib/logger';

interface SearchPageProps {
  searchParams: Promise<{
    title?: string;
    category?: string;
  }>;
}

const PostsPage = async ({ searchParams }: SearchPageProps) => {
  const searchParamsData = await searchParams;
  // Fetch posts for the homepage
  const posts = (await getPostsForHomepage()) || [];

  // Ensure posts are valid
  if (!Array.isArray(posts)) {
    logger.error("Invalid post data:", posts);
    return <div>Error loading posts. Invalid data received.</div>;
  }

  return (
    <div className="mt-20">
      {posts.length === 0 ? (
        <div className="text-center text-gray-500 text-lg">
          No posts available. Please check back later.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PostsPage;