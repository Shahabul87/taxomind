import { redirect } from "next/navigation";
import { currentUser } from '@/lib/auth'
import { Metadata } from "next";
import { getPostData } from "@/app/actions/get-post-data";
import dynamic from 'next/dynamic';

// Lazy load heavy components
const HomeFooter = dynamic(() => import("@/app/(homepage)/HomeFooter").then(mod => ({ default: mod.HomeFooter })), {
  loading: () => <div className="h-96 bg-slate-900" />
});

const ReadingModes = dynamic(() => import("./_components/reading-mode"), {
  loading: () => <div className="h-64 bg-white/80 dark:bg-slate-800/80 rounded-xl animate-pulse" />
});

const YouMayLikeSection = dynamic(() => import("./_components/you-may-like-section"), {
  loading: () => <div className="h-96 bg-white/80 dark:bg-slate-800/80 rounded-xl animate-pulse" />
});

const CommentSection = dynamic(() => import("./_components/facebook-comment-section"), {
  loading: () => <div className="h-96 bg-white/80 dark:bg-slate-800/80 rounded-xl animate-pulse" />
});

// Keep these for above-the-fold content
import { FeaturedImage } from "./_components/featured-image";
import EnterprisePostHeader from "./_components/enterprise-post-header";

// Editorial components - lazy loaded
const ReadingProgressBar = dynamic(() => import("./_components/reading-progress-bar"));
const FloatingShare = dynamic(() => import("./_components/floating-share"));

// Is the app running in development mode?
const isDev = process.env.NODE_ENV === 'development';

// Type definitions for comment replies matching Prisma query result
interface CommentUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface CommentReply {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  commentId: string;
  parentReplyId?: string | null;
  depth?: number;
  User?: CommentUser;
  other_Reply?: CommentReply[];
}

// Comment interface matching facebook-comment-section expectations
interface TransformedComment {
  id: string;
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  userId: string;
  postId: string;
  parentId: string | null;
  depth: number;
  User?: CommentUser;
  replies?: TransformedComment[];
}

// Transform database replies to match Comment interface
const transformReplies = (replies: CommentReply[], postId: string): TransformedComment[] => {
  if (!replies || !Array.isArray(replies)) return [];

  return replies.map(reply => ({
    id: reply.id,
    content: reply.content,
    createdAt: reply.createdAt,
    updatedAt: reply.updatedAt,
    userId: reply.userId,
    postId: postId,
    parentId: reply.parentReplyId || null,
    depth: reply.depth || 1,
    User: reply.User,
    replies: reply.other_Reply ? transformReplies(reply.other_Reply, postId) : []
  }));
};

const PostIdPage = async (props: {params: Promise<{ postId: string; }>}) => {
  const params = await props.params;
  const user = await currentUser();
  const post = await getPostData(params.postId, user?.id);

  if (!post) {
    return redirect("/");
  }

  // Calculate reading time based on post chapters
  interface PostChapter {
    description?: string | null;
  }

  const calculateReadingTime = (postchapters: PostChapter[]) => {
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
      {/* Preconnect to external image CDN for faster LCP */}
      <link rel="preconnect" href="https://lh3.googleusercontent.com" />
      <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />

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
      {/* Reading Progress Bar */}
      <ReadingProgressBar />

      {/* Floating Share */}
      <FloatingShare
        title={post.title}
        description={post.description}
      />

      {/* Main Content - Editorial Style */}
      <div className="min-h-screen bg-blog-bg dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
        <div className="w-full max-w-7xl mx-auto">
          <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 mx-auto">
            <div className="mx-auto w-full py-3 sm:py-4 md:py-6 lg:py-10">
              {/* Enterprise Header - Editorial */}
              <EnterprisePostHeader
                postId={params.postId}
                title={post.title}
                description={post.description}
                category={post.category}
                authorName={post.User?.name}
                authorImage={undefined}
                authorRole="Content Creator"
                createdAt={post.createdAt}
                updatedAt={post.updatedAt}
                readingTime={readingTime}
                viewCount={post.views || 0}
                likeCount={post._count?.reactions || 0}
                commentCount={post.comments?.length || 0}
                hasUserReacted={!!post.userReaction}
                tags={post.category ? [post.category] : []}
                difficulty="Intermediate"
                language="English"
                isVerified={true}
                isFeatured={false}
                isPremium={false}
              />

              {/* Editorial Divider */}
              <div className="blog-divider my-6 sm:my-8 md:my-12" />

              {/* Featured Image with Toggle */}
              {post.imageUrl && (
                <div className="mb-6 sm:mb-8">
                  <FeaturedImage imageUrl={post.imageUrl} title={post.title} />
                </div>
              )}

              {/* Reading Modes */}
              <div className="mb-6 sm:mb-8 md:mb-12">
                <ReadingModes post={post} />
              </div>

              {/* You May Like Section */}
              <YouMayLikeSection
                postId={params.postId}
                category={post.category}
                useDummyData={true}
              />

              {/* Comments Section - Editorial */}
              <div className="mt-4 sm:mt-6 md:mt-8 bg-blog-surface/90 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl p-3 sm:p-4 md:p-5 lg:p-6 border border-blog-border dark:border-slate-700/50 shadow-lg blog-content-reveal blog-delay-7">
                <CommentSection
                  postId={params.postId}
                  initialComments={(post.comments || []).map(comment => ({
                    id: comment.id,
                    content: comment.content,
                    createdAt: comment.createdAt,
                    updatedAt: comment.updatedAt,
                    userId: comment.userId,
                    postId: comment.postId,
                    parentId: null,
                    depth: 0,
                    User: comment.User,
                    replies: transformReplies(comment.replies || [], comment.postId)
                  }))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <HomeFooter />
    </>
  );
};

export default PostIdPage;

export async function generateMetadata(props: { params: Promise<{ postId: string }> }): Promise<Metadata> {
  const params = await props.params;
  const post = await getPostData(params.postId);

  if (!post) {
    return {
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.',
    };
  }

  const title = `${post.title} | Taxomind Blog`;
  const description = post.description || `Read ${post.title} on Taxomind - Your source for insightful articles and tutorials.`;
  const images = post.imageUrl ? [{ url: post.imageUrl, alt: post.title, width: 1200, height: 630 }] : [];
  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://taxomind.com'}/blog/${params.postId}`;
  const publishedTime = post.createdAt?.toISOString?.() || new Date(post.createdAt).toISOString();
  const modifiedTime = post.updatedAt?.toISOString?.() || new Date(post.updatedAt).toISOString();

  return {
    title,
    description,
    keywords: post.category ? [post.category, 'blog', 'article', 'tutorial'] : ['blog', 'article'],
    authors: post.User?.name ? [{ name: post.User.name }] : undefined,
    creator: post.User?.name || 'Taxomind',
    publisher: 'Taxomind',
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      url,
      images,
      siteName: 'Taxomind',
      publishedTime,
      modifiedTime,
      authors: post.User?.name ? [post.User.name] : undefined,
      tags: post.category ? [post.category] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: images.map(img => img.url),
      creator: '@taxomind',
    },
    robots: {
      index: post.published !== false,
      follow: true,
      googleBot: {
        index: post.published !== false,
        follow: true,
      },
    },
    other: post.imageUrl ? {
      'preload-image': post.imageUrl,
    } : undefined,
  };
}
