import { enterpriseDataAPI } from "@/lib/data-fetching/enterprise-data-api";

type PostForHomepage = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  published: boolean;
  category: string | null;
  createdAt: string;
  comments: any[];
  userId: string;
  updatedAt: Date;
  user?: {
    name: string | null;
  };
  views?: number;
};

export const getPostsForHomepage = async (): Promise<PostForHomepage[]> => {
  console.log("🚀 [GET_POSTS] Starting to fetch posts for homepage using Enterprise API...");
  
  try {
    // Use the enterprise API for safe data fetching
    const result = await enterpriseDataAPI.fetchPosts(
      { published: true, isArchived: false },
      { page: 1, pageSize: 20 }
    );

    if (!result.success) {
      console.error("💥 [GET_POSTS] Enterprise API returned error:", result.error);
      return [];
    }

    const posts = result.data || [];
    console.log(`✅ [GET_POSTS] Successfully fetched ${posts.length} posts via Enterprise API`);
    
    // Format posts for homepage
    const formattedPosts: PostForHomepage[] = posts.map(post => ({
      id: post.id,
      title: post.title || 'Untitled Post',
      description: post.description || 'No description available',
      imageUrl: post.imageUrl || null,
      published: post.published,
      category: post.category || null,
      createdAt: typeof post.createdAt === 'string' ? post.createdAt : post.createdAt.toISOString(),
      updatedAt: post.updatedAt,
      userId: post.authorId,
      comments: [], // Will be populated separately if needed
      user: { name: null }, // Will be populated separately if needed
      views: post.views || 0,
    }));

    console.log(`✅ [GET_POSTS] Returning ${formattedPosts.length} formatted posts`);
    return formattedPosts;
    
  } catch (error) {
    console.error("💥 [GET_POSTS] CRITICAL ERROR fetching posts:");
    console.error("Error details:", error);
    console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
    // Return empty array instead of throwing to prevent crashes
    return [];
  }
};

export const getPostsByCategory = async (category: string): Promise<PostForHomepage[]> => {
  try {
    console.log(`[GET_POSTS_BY_CATEGORY] Fetching posts for category: ${category} using Enterprise API`);
    
    // Use the enterprise API for safe data fetching
    const result = await enterpriseDataAPI.fetchPosts(
      { published: true, isArchived: false, category },
      { page: 1, pageSize: 50 }
    );

    if (!result.success) {
      console.error("[GET_POSTS_BY_CATEGORY] Enterprise API returned error:", result.error);
      return [];
    }

    const posts = result.data || [];
    console.log(`[GET_POSTS_BY_CATEGORY] Found ${posts.length} posts`);

    // Format posts for homepage
    const formattedPosts: PostForHomepage[] = posts.map(post => ({
      id: post.id,
      title: post.title || 'Untitled Post',
      description: post.description || 'No description available',
      imageUrl: post.imageUrl || null,
      published: post.published,
      category: post.category || null,
      createdAt: typeof post.createdAt === 'string' ? post.createdAt : post.createdAt.toISOString(),
      updatedAt: post.updatedAt,
      userId: post.authorId,
      comments: [], // Will be populated separately if needed
      user: { name: null }, // Will be populated separately if needed
      views: post.views || 0,
    }));

    return formattedPosts;
  } catch (error) {
    console.error("[GET_POSTS_BY_CATEGORY] Error:", error);
    return [];
  }
};

