import { db } from "@/lib/db";

export const getUserData = async (userId: string) => {
  try {
    const userData = await db.user.findUnique({
      where: { id: userId },
      include: {
        accounts: true,
        courses: true,
        twoFactorConfirmation: true,
        Post: {
          include: {
            comments: true,
            Reply: true,
            User: true,
            PostChapterSection: true,
            PostImageSection: true
          }
        },
        Comment: {
          include: {
            replies: true
          }
        },
        Video: true,
        Blog: true,
        Article: true,
        Note: true,
        FavoriteVideo: true,
        FavoriteAudio: true,
        FavoriteArticle: true,
        FavoriteBlog: true,
        FavoriteImage: true,
        UserSubscription: true
      }
    });

    return userData;
  } catch (error) {
    console.error("[GET_USER_DATA_ERROR]", error);
    return null;
  }
}; 