import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export const getPostData = async (postId: string) => {
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

    return post;
  } catch (error: any) {
    logger.error("[GET_POST_DATA]", error);
    return null;
  }
}; 