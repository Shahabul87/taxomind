import { redirect } from "next/navigation";
import { currentUser } from '@/lib/auth'
import { Footer } from "@/app/(homepage)/footer";
import ReadingModes from "./_components/reading-mode";
import { FeaturedImage } from "./_components/featured-image";
import { Metadata } from "next";
import EnterprisePostHeader from "./_components/enterprise-post-header";
import { getPostData } from "@/app/actions/get-post-data";
import YouMayLikeSection from "./_components/you-may-like-section";
import FacebookCommentSection from "./_components/facebook-comment-section";

// Is the app running in development mode?
const isDev = process.env.NODE_ENV === 'development';

const PostIdPage = async (props: {params: Promise<{ postId: string; }>}) => {
  const params = await props.params;
  const user = await currentUser();
  const post = await getPostData(params.postId);

  if (!post) {
    return redirect("/");
  }

  // Calculate reading time based on post chapters
  const calculateReadingTime = (postchapters: any[]) => {
    if (!postchapters || postchapters.length === 0) return 5;
    const wordsPerMinute = 200;
    const totalWords = postchapters.reduce((acc, chapter) => {
      const description = chapter.description || '';
      const words = description.split(/\s+/).length;
      return acc + words;
    }, 0);
    return Math.max(1, Math.ceil(totalWords / wordsPerMinute));
  };

  const readingTime = calculateReadingTime(post.PostChapterSection || []);

  return (
    <>
      {/* Article JSON-LD for SEO */}
      {post && (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Article',
              headline: post.title,
              description: post.description || undefined,
              image: post.imageUrl || undefined,
              datePublished: post.createdAt?.toISOString?.() || new Date(post.createdAt).toISOString(),
              dateModified: post.updatedAt?.toISOString?.() || new Date(post.updatedAt).toISOString(),
              author: post.User?.name ? { '@type': 'Person', name: post.User.name } : undefined,
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': `/blog/${params.postId}`,
              },
            }),
          }}
        />
      )}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
        <div className="w-full max-w-7xl mx-auto">
          <div className="w-full px-4 sm:px-6 lg:px-8 mx-auto">
            <div className="mx-auto w-full py-8 lg:py-12">
              {/* Enterprise Header */}
              <EnterprisePostHeader
                title={post.title}
                description={post.description}
                category={post.category}
                authorName={post.User?.name}
                authorImage={undefined}
                authorRole="Content Creator"
                createdAt={post.createdAt}
                updatedAt={post.updatedAt}
                readingTime={readingTime}
                viewCount={1234}
                likeCount={89}
                commentCount={post.comments?.length || 0}
                shareCount={45}
                tags={post.category ? [post.category] : []}
                difficulty="Intermediate"
                language="English"
                isVerified={true}
                isFeatured={false}
                isPremium={false}
              />

              <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent my-12" />

              {/* Featured Image with Toggle */}
              {post.imageUrl && (
                <div className="mb-8">
                  <FeaturedImage imageUrl={post.imageUrl} title={post.title} />
                </div>
              )}

              {/* Reading Modes */}
              <div className="mb-12">
                <ReadingModes post={post} />
              </div>

              {/* You May Like Section */}
              <YouMayLikeSection
                postId={params.postId}
                category={post.category}
                useDummyData={true}
              />

              {/* Comments Section */}
              <div className="mt-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
                <FacebookCommentSection
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

  const title = post?.title || 'Blog Post';
  const description = post?.description || 'Article';
  const images = post?.imageUrl ? [{ url: post.imageUrl, alt: post.title }] : [];
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images as any,
    },
  };
}
