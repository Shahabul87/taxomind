"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { logger } from '@/lib/logger';

export async function getProfileData() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  try {

    // Get basic user data first
    const userData = await db.user.findUnique({
      where: {
        id: session.user.id
      },
      include: {
        Post: true,
        FavoriteVideo: true,
        FavoriteAudio: true, 
        FavoriteBlog: true,
        FavoriteArticle: true,
        courses: {
          include: {
            category: true,
            chapters: {
              include: {
                sections: true
              }
            }
          }
        }
      }
    });

    if (!userData) {

      return null;
    }

    // Try to add enhanced data if tables exist, but don't fail if they don't
    let enhancedData = {
      socialMediaAccounts: [] as any[],
      contentCollections: [] as any[],
      contentItems: [] as any[],
      userSubscriptions: [] as any[],
      goals: [] as any[],
      userAnalytics: [] as any[]
    };

    try {
      const socialAccounts = await db.socialMediaAccount.findMany({
        where: { userId: session.user.id },
        take: 50,
      });
      enhancedData.socialMediaAccounts = socialAccounts;
    } catch (error: any) {
      logger.warn("[GET_PROFILE_DATA] Social media accounts not available:", error);
    }

    try {
      const contentCollections = await db.contentCollection.findMany({
        where: { userId: session.user.id },
        include: {
          ContentItem: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 50,
          }
        },
        take: 50,
      });
      enhancedData.contentCollections = contentCollections;
    } catch (error: any) {
      logger.warn("[GET_PROFILE_DATA] Content collections not available:", error);
    }

    try {
      const contentItems = await db.contentItem.findMany({
        where: {
          userId: session.user.id,
          collectionId: null
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20
      });
      enhancedData.contentItems = contentItems;
    } catch (error: any) {
      logger.warn("[GET_PROFILE_DATA] Content items not available:", error);
    }

    try {
      const userSubscriptions = await db.userSubscription.findMany({
        where: {
          userId: session.user.id,
          isActive: true
        },
        take: 50,
      });
      enhancedData.userSubscriptions = userSubscriptions;
    } catch (error: any) {
      logger.warn("[GET_PROFILE_DATA] User subscriptions not available:", error);
    }

    try {
      const goals = await db.goal.findMany({
        where: { userId: session.user.id },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50,
      });
      enhancedData.goals = goals;
    } catch (error: any) {
      logger.warn("[GET_PROFILE_DATA] Goals not available:", error);
    }

    try {
      const userAnalytics = await db.userAnalytics.findMany({
        where: { userId: session.user.id },
        orderBy: {
          recordedAt: 'desc'
        },
        take: 50
      });
      enhancedData.userAnalytics = userAnalytics;
    } catch (error: any) {
      logger.warn("[GET_PROFILE_DATA] User analytics not available:", error);
    }

    return { ...userData, ...enhancedData };

  } catch (error: any) {
    logger.error("[GET_PROFILE_DATA] Error fetching profile data:", error);
    return null;
  }
} 