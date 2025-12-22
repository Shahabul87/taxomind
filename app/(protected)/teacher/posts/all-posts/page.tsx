import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EnhancedDashboard } from "./_components/enhanced-dashboard";
import { PostsPageLayout } from "./_components/posts-page-layout";
import { db } from "@/lib/db";
import { Metadata } from "next";
import type { Post, PostComment, PostUser } from "./_components/types";

export const metadata: Metadata = {
  title: "My Content Hub | Taxomind Teacher Dashboard",
  description: "Manage your blog posts and track their performance with enterprise analytics",
};

const TeacherAllPostsPage = async () => {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/");
  }

  // Fetch user's posts with relations
  const postsData = await db.post.findMany({
    where: {
      userId: user.id,
      isArchived: false,
    },
    include: {
      User: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          isTeacher: true,
        }
      },
      comments: {
        select: {
          id: true,
          userId: true,
          postId: true,
          content: true,
          createdAt: true,
          updatedAt: true,
        }
      },
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Serialize posts with proper typing
  const posts: Post[] = postsData.map(post => ({
    id: post.id,
    title: post.title,
    description: post.description || null,
    imageUrl: post.imageUrl || null,
    published: post.published,
    category: post.category || null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    userId: post.userId,
    views: post.views,
    body: post.body,
    isArchived: post.isArchived,
    comments: post.comments.map(comment => ({
      id: comment.id,
      userId: comment.userId,
      postId: comment.postId,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    })),
    user: {
      id: post.User.id,
      name: post.User.name,
      email: post.User.email,
      image: post.User.image,
      isTeacher: post.User.isTeacher ?? false,
    },
    likes: [], // TODO: Add likes relation to Post model when implemented
  }));

  // Calculate stats
  const publishedCount = posts.filter(post => post.published).length;
  const draftCount = posts.filter(post => !post.published).length;
  const totalViews = posts.reduce((sum, post) => sum + post.views, 0);
  const totalComments = posts.reduce((sum, post) => sum + post.comments.length, 0);
  const totalLikes = posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);

  // Get unique categories
  const categories = Array.from(
    new Set(posts.map(post => post.category).filter((c): c is string => c !== null))
  );

  // Serialize user for client component
  const serializedUser = {
    id: user.id,
    name: user.name ?? null,
    email: user.email ?? null,
    image: user.image ?? null,
    role: user.role,
  };

  return (
    <PostsPageLayout user={user}>
      <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-violet-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/20 w-full">
        <EnhancedDashboard
          posts={posts}
          categories={categories}
          stats={{
            published: publishedCount,
            drafts: draftCount,
            views: totalViews,
            likes: totalLikes,
            comments: totalComments,
          }}
          user={serializedUser}
        />
      </div>
    </PostsPageLayout>
  );
};

export default TeacherAllPostsPage;