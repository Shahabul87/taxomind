import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export async function PATCH(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const values = await req.json();

    const updateData: any = {};
    
    if (values.name !== undefined) updateData.name = values.name;
    if (values.image !== undefined) updateData.image = values.image;
    if (values.phone !== undefined) updateData.phone = values.phone;

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        createdAt: true
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    logger.error("[PROFILE_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET() {
  try {

    const session = await auth();

    if (!session?.user?.id) {

      return new NextResponse("Unauthorized", { status: 401 });
    }

    // First, try to get basic user data
    const userData = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        createdAt: true
      }
    });

    if (!userData) {

      return new NextResponse("User not found", { status: 404 });
    }

    // Try to get counts safely
    let stats = {
      followers: 0,
      following: 0,
      likes: 0,
      posts: 0,
      comments: 0,
      subscriptions: 0,
      monthlySpending: 0,
      content: 0,
      ideas: 0,
      courses: 0
    };

    try {
      const counts = await db.user.findUnique({
        where: { id: session.user.id },
        select: {
          _count: {
            select: {
              Post: true,
              Comment: true,
              Reply: true,
              reactions: true,
              Video: true,
              Blog: true,
              Article: true,
              Idea_Idea_userIdToUser: true,
              courses: true
            }
          }
        }
      });

      if (counts) {
        stats = {
          followers: 0, // Will be calculated from social media accounts later
          following: 0, // Will be calculated from social media accounts later
          likes: counts._count.reactions,
          posts: counts._count.Post,
          comments: counts._count.Comment,
          subscriptions: 0, // Will be calculated from user subscriptions later
          monthlySpending: 0, // Will be calculated from user subscriptions later
          content: counts._count.Video + counts._count.Blog + counts._count.Article,
          ideas: counts._count.Idea_Idea_userIdToUser || 0,
          courses: counts._count.courses
        };
      }
    } catch (countError) {
      logger.warn("[PROFILE_GET] Error calculating counts, using defaults:", countError);
    }

    // Try to get social media accounts safely
    let socialMediaAccounts: any[] = [];
    try {
      socialMediaAccounts = await db.socialMediaAccount.findMany({
        where: { userId: session.user.id },
        select: {
          id: true,
          platform: true,
          username: true,
          displayName: true,
          followerCount: true,
          followingCount: true,
          postsCount: true,
          isActive: true,
          lastSyncAt: true
        }
      });

      // Update follower/following counts from social media
      const totalFollowers = socialMediaAccounts.reduce((total, account) => {
        return total + (account.followerCount || 0);
      }, 0);

      const totalFollowing = socialMediaAccounts.reduce((total, account) => {
        return total + (account.followingCount || 0);
      }, 0);

      stats.followers = totalFollowers;
      stats.following = totalFollowing;

    } catch (socialError) {
      logger.warn("[PROFILE_GET] Error fetching social media accounts:", socialError);
    }

    // Try to get subscriptions safely
    let userSubscriptions: any[] = [];
    try {
      userSubscriptions = await db.userSubscription.findMany({
        where: { 
          userId: session.user.id,
          isActive: true
        },
        select: {
          id: true,
          serviceName: true,
          cost: true,
          currency: true,
          billingCycle: true,
          nextBillingDate: true
        }
      });

      // Calculate monthly spending
      const monthlySpending = userSubscriptions.reduce((total, sub) => {
        if (sub.billingCycle === 'MONTHLY') {
          return total + sub.cost;
        } else if (sub.billingCycle === 'YEARLY') {
          return total + (sub.cost / 12);
        }
        return total;
      }, 0);

      stats.subscriptions = userSubscriptions.length;
      stats.monthlySpending = monthlySpending;

    } catch (subscriptionError) {
      logger.warn("[PROFILE_GET] Error fetching subscriptions:", subscriptionError);
    }

    // Try to get profile links safely
    let profileLinks: any[] = [];
    try {
      profileLinks = await db.profileLink.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' }
      });
    } catch (profileLinksError) {
      logger.warn("[PROFILE_GET] Error fetching profile links:", profileLinksError);
    }

    const enhancedUserData = {
      ...userData,
      stats,
      socialMediaAccounts,
      userSubscriptions,
      profileLinks
    };

    return NextResponse.json(enhancedUserData);

  } catch (error: any) {
    logger.error("[PROFILE_GET] Unexpected error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 