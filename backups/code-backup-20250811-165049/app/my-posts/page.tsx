import { redirect } from "next/navigation";
import { auth } from "@/auth";

import { MyPostsDashboard } from "./_components/my-posts-dashboard";
import { 
  getUserPublishedPosts, 
  getUserDraftPosts, 
  getUserPostsAnalytics 
} from "@/actions/get-user-posts";

export const dynamic = "force-dynamic";

const MyPostsPage = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect("/auth/login");
  }

  // Fetch real data from database
  const [publishedPostsData, draftPostsData, analyticsData] = await Promise.all([
    getUserPublishedPosts(),
    getUserDraftPosts(),
    getUserPostsAnalytics()
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 pb-20">
      <MyPostsDashboard 
        publishedPosts={publishedPostsData.posts}
        draftPosts={draftPostsData.posts}
        analytics={analyticsData.analytics}
        publishedPostsError={publishedPostsData.error}
        draftPostsError={draftPostsData.error}
        analyticsError={analyticsData.error}
      />
    </div>
  );
};

export default MyPostsPage; 