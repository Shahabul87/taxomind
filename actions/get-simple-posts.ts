import { db } from "@/lib/db";

export type SimplePost = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  published: boolean | null;
  category: string | null;
  createdAt: string;
  updatedAt: Date;
  userId: string;
  views: number;
  comments: Array<{ id: string }>;
  user?: {
    name: string | null;
  };
};

export const getSimplePostsForBlog = async (): Promise<SimplePost[]> => {
  try {
    console.log("🚀 [SIMPLE_POSTS] Fetching posts directly from database...");
    
    const posts = await db.post.findMany({
      where: {
        published: true,
        isArchived: false,
      },
      include: {
        User: {
          select: {
            name: true,
          },
        },
        comments: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`✅ [SIMPLE_POSTS] Found ${posts.length} posts in database`);

    // Transform to match expected format
    const transformedPosts: SimplePost[] = posts.map(post => ({
      id: post.id,
      title: post.title,
      description: post.description,
      imageUrl: post.imageUrl,
      published: post.published,
      category: post.category,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt,
      userId: post.userId,
      views: post.views,
      comments: post.comments,
      user: {
        name: post.User?.name || null,
      },
    }));

    console.log(`✅ [SIMPLE_POSTS] Returning ${transformedPosts.length} transformed posts`);
    return transformedPosts;
    
  } catch (error) {
    console.error("💥 [SIMPLE_POSTS] Error fetching posts:", error);
    return [];
  }
};