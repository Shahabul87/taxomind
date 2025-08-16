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
        profileLinks: true,
        courses: {
          include: {
            category: true
          }
        },
        ideas: true,
        posts: true,
        favoriteVideos: true,
        favoriteAudios: true, 
        favoriteBlogs: true,
        favoriteArticles: true,
        subscriptions: true
      }
    });
    
    if (!userData) {
      return new NextResponse("User not found", { status: 404 });
    }
    
    return NextResponse.json(userData);
  } catch (error) {
    logger.error("[USER_PROFILE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 