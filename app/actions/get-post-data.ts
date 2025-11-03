import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export const getPostData = async (postId: string, userId?: string) => {
  try {

    const post = await db.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        // PostReaction: { // Commented out - PostReaction relation does not exist in schema
        //   select: {
        //     id: true,
        //     type: true,
        //     userId: true,
        //   },
        // },
        comments: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            reactions: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            replies: {
              include: {
                User: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
                Reaction: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
                other_Reply: {
                  include: {
                    User: {
                      select: {
                        id: true,
                        name: true,
                        image: true,
                      },
                    },
                    Reaction: true,
                    other_Reply: {
                      include: {
                        User: {
                          select: {
                            id: true,
                            name: true,
                            image: true,
                          },
                        },
                        Reaction: true,
                      },
                      orderBy: {
                        createdAt: "asc",
                      },
                    },
                  },
                  orderBy: {
                    createdAt: "asc",
                  },
                },
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        Tag: true,
        PostChapterSection: {
          orderBy: {
            position: "asc",
          },
        },
        PostImageSection: {
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    if (!post) {

      return null;
    }

    // Calculate reaction counts and user's reaction status
    // Note: PostReaction relation removed as it doesn't exist in schema
    const loveCount = 0; // post.PostReaction?.length || 0;
    const hasUserReacted = false; // userId ? post.PostReaction?.some(reaction => reaction.userId === userId) : false;

    // Return post with computed fields
    return {
      ...post,
      _count: {
        reactions: loveCount,
      },
      userReaction: hasUserReacted ? { type: "LOVE" } : null,
    };
  } catch (error: any) {
    logger.error("[GET_POST_DATA]", error);
    return null;
  }
}; 