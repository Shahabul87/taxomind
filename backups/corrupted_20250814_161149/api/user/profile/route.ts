import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const userId = session.user.id;
    
    const userData = await db.user.findUnique({
      where: {
        id: userId
      },
      include: {
        courses: {
          include: {
            category: true
          }
        },
        Post: true,
        FavoriteVideo: true,
        FavoriteAudio: true, 
        FavoriteBlog: true,
        FavoriteArticle: true,
        UserSubscription: true
      }
    });
    
    if (!userData) {
      return new NextResponse("User not found", { status: 404 });
    }
    
    return NextResponse.json(userData);
  } catch (error: any) {
    logger.error("[USER_PROFILE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 