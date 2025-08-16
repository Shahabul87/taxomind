import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MyPostsDashboard } from "./_components/my-posts-dashboard";
import { db } from "@/lib/db";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Posts | BDGenAI",
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

const AllPostsPage = async () => {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/");
  }

  // Fetch all user posts with comments
  const posts = await db.post.findMany({
    where: {
      userId: user.id
    },
    include: {
      user: true,
      comments: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  }) as Post[];

  // Get post stats
  const publishedCount = posts.filter(post => post.published).length;
  const draftCount = posts.filter(post => !post.published).length;
  
  // Calculate total views
  const totalViews = posts.reduce((sum, post) => sum + post.views, 0);
  
  // Calculate comments
  const totalComments = posts.reduce((sum, post) => sum + post.comments.length, 0);
  
  // Get categories
  const categories = Array.from(new Set(posts.map(post => post.category))).filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
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
        user={user}
      />
    </div>
  );
};

export default AllPostsPage;

  