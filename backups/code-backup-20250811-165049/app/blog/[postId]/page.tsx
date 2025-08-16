import { redirect } from "next/navigation";
import { currentUser } from '@/lib/auth'
import { Footer } from "@/app/(homepage)/footer";
import { transformPostChapters } from "./_components/transform-post-chapter";
import ReadingModes from "./_components/reading-mode";
import { FeaturedImage } from "./_components/featured-image";
import { Metadata } from "next";
import PostHeaderDetails from "./_components/post-header-details";
import { getPostData } from "@/app/actions/get-post-data";
import SimilarPosts from "./_components/similar-posts";
import { CommentSection } from "./_components/comment-system";

// Is the app running in development mode?
const isDev = process.env.NODE_ENV === 'development';

const PostIdPage = async (props: {params: Promise<{ postId: string; }>}) => {
  const params = await props.params;
  const user = await currentUser();
  const post = await getPostData(params.postId);

  if (!post) {
    return redirect("/");
  }

  const content = transformPostChapters(post.postchapter);
  const formattedDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <div className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
        <div className="w-full max-w-[2000px] mx-auto">
          <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 mx-auto">
            <div className="mx-auto w-full lg:px-4 lg:py-8">
              {/* Combined Header and Metadata */}
              <PostHeaderDetails
                title={post.title}
                category={post.category}
                authorName={post.user?.name}
                createdAt={post.createdAt}
                updatedAt={post.updatedAt}
              />

              <div className="h-px w-full bg-gray-200 dark:bg-gradient-to-r dark:from-blue-500/50 dark:via-purple-500/50 dark:to-blue-500/50 mb-8" />

              {/* Featured Image with Toggle */}
              {post.imageUrl && (
                <div className="mb-8">
                  <FeaturedImage imageUrl={post.imageUrl} title={post.title} />
                </div>
              )}

              {/* Reading Modes */}
              <div className="mb-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl lg:p-6 border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm">
                <ReadingModes post={post} />
              </div>

              {/* Similar Posts Section */}
              <SimilarPosts 
                postId={params.postId}
                category={post.category} 
                useDummyData={true}
              />

              {/* Comments Section */}
              <div className="mt-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm">
                <CommentSection 
                  postId={params.postId} 
                  initialComments={post.comments as unknown as any[]}
                />
              </div>
            </div>

            <Footer />
          </div>
        </div>
      </div>
    </>
  );
};

export default PostIdPage;

export async function generateMetadata(props: { params: Promise<{ postId: string }> }): Promise<Metadata> {
  const params = await props.params;
  const post = await getPostData(params.postId);

  return {
    title: post?.title || "Blog Post",
    description: post?.description || "No description available"
  };
}
