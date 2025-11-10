import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MyPostsDashboard } from "./_components/my-posts-dashboard";
import { PostsPageLayout } from "./_components/posts-page-layout";
import { db } from "@/lib/db";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Posts | Taxomind Teacher Dashboard",
  description: "Manage your blog posts and track their performance",
};

// Define type for Post with views field
interface Post {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  published?: boolean | null;
  views: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  user: any;
  comments: any[];
}

const TeacherAllPostsPage = async () => {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/");
  }

  // Check if user has appropriate role
  if (user.role !== "USER" && user.role !== "ADMIN") {
    return redirect("/");
  }

  // Debug: Log user ID
  console.log('[TeacherAllPostsPage] Fetching posts for user:', user.id);

  // TEMPORARY: Fetch all posts (remove userId filter for testing)
  // TODO: Change back to filter by userId in production
  const postsData = await db.post.findMany({
    where: {
      // userId: user.id // COMMENTED OUT to show all posts for testing
    },
    include: {
      User: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        }
      },
      comments: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Debug: Log fetched posts
  console.log('[TeacherAllPostsPage] Fetched posts count:', postsData.length);
  if (postsData.length > 0) {
    console.log('[TeacherAllPostsPage] First post:', {
      id: postsData[0].id,
      title: postsData[0].title,
      userId: postsData[0].userId,
      published: postsData[0].published,
    });
  }

  // Serialize posts to avoid Decimal field issues
  const posts = postsData.map(post => ({
    ...post,
    user: post.User,
    User: undefined, // Remove the User field as we've copied it to lowercase 'user'
  }));

  // Get post stats
  const publishedCount = posts.filter(post => post.published).length;
  const draftCount = posts.filter(post => !post.published).length;

  // Calculate total views
  const totalViews = posts.reduce((sum, post) => sum + post.views, 0);

  // Calculate comments
  const totalComments = posts.reduce((sum, post) => sum + post.comments.length, 0);

  // Get categories
  const categories = Array.from(new Set(posts.map(post => post.category))).filter(Boolean);

  // Serialize user object to convert Decimal fields to numbers for client component
  const serializedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
  };

  return (
    <PostsPageLayout user={user}>
      <div className="min-h-full bg-gradient-to-b from-gray-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 w-full">
        <MyPostsDashboard
          posts={posts}
          categories={categories as string[]}
          stats={{
            published: publishedCount,
            drafts: draftCount,
            views: totalViews,
            likes: 0, // We need to add a likes relation to the Post model
            comments: totalComments
          }}
          user={serializedUser}
        />
      </div>
    </PostsPageLayout>
  );
};

export default TeacherAllPostsPage;