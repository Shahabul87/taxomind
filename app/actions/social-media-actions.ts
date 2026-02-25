"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { SocialPlatform, ContentType, SubscriptionCategory, BillingCycle, GoalCategory } from "@prisma/client";
import { logger } from '@/lib/logger';

// Social Media Account Management
export async function connectSocialMediaAccount(data: {
  platform: SocialPlatform;
  username: string;
  displayName?: string;
  profileUrl?: string;
  profileImageUrl?: string;
  followerCount?: number;
  followingCount?: number;
  postsCount?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  try {
    const account = await db.socialMediaAccount.create({
      data: {
        id: `${data.platform}_${data.username}_${Date.now()}`,
        platform: data.platform,
        platformUserId: `${data.username}_${Date.now()}`, // Temporary ID
        username: data.username,
        displayName: data.displayName,
        profileUrl: data.profileUrl,
        profileImageUrl: data.profileImageUrl,
        followerCount: data.followerCount || 0,
        followingCount: data.followingCount || 0,
        postsCount: data.postsCount || 0,
        userId: session.user.id,
        lastSyncAt: new Date(),
        updatedAt: new Date()
      }
    });

    revalidatePath("/profile");
    return { success: true, data: account };
  } catch (error: any) {
    logger.error("Error connecting social media account:", error);
    return { success: false, error: "Failed to connect account" };
  }
}

export async function updateSocialMediaStats(accountId: string, stats: {
  followerCount?: number;
  followingCount?: number;
  postsCount?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  try {
    await db.socialMediaAccount.update({
      where: {
        id: accountId,
        userId: session.user.id
      },
      data: {
        ...stats,
        lastSyncAt: new Date()
      }
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error: any) {
    logger.error("Error updating social media stats:", error);
    return { success: false, error: "Failed to update stats" };
  }
}

export async function disconnectSocialMediaAccount(accountId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  try {
    await db.socialMediaAccount.delete({
      where: {
        id: accountId,
        userId: session.user.id
      }
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error: any) {
    logger.error("Error disconnecting social media account:", error);
    return { success: false, error: "Failed to disconnect account" };
  }
}

// Content Management
export async function createContentCollection(data: {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isPublic?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  try {
    const collection = await db.contentCollection.create({
      data: {
        id: `collection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        userId: session.user.id,
        updatedAt: new Date()
      }
    });

    revalidatePath("/profile");
    return { success: true, data: collection };
  } catch (error: any) {
    logger.error("Error creating content collection:", error);
    return { success: false, error: "Failed to create collection" };
  }
}

export async function addContentItem(data: {
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  platform?: string;
  contentType: ContentType;
  author?: string;
  duration?: number;
  publishedAt?: Date;
  tags?: string[];
  collectionId?: string;
  rating?: number;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  try {
    const contentItem = await db.contentItem.create({
      data: {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        userId: session.user.id,
        tags: data.tags || [],
        updatedAt: new Date()
      }
    });

    revalidatePath("/profile");
    return { success: true, data: contentItem };
  } catch (error: any) {
    logger.error("Error adding content item:", error);
    return { success: false, error: "Failed to add content item" };
  }
}

export async function updateContentItem(itemId: string, data: {
  title?: string;
  description?: string;
  rating?: number;
  notes?: string;
  isFavorite?: boolean;
  watchProgress?: number;
  collectionId?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  try {
    const contentItem = await db.contentItem.update({
      where: {
        id: itemId,
        userId: session.user.id
      },
      data: {
        ...data,
        watchedAt: data.watchProgress ? new Date() : undefined
      }
    });

    revalidatePath("/profile");
    return { success: true, data: contentItem };
  } catch (error: any) {
    logger.error("Error updating content item:", error);
    return { success: false, error: "Failed to update content item" };
  }
}

// Subscription Management
export async function addSubscription(data: {
  serviceName: string;
  planName?: string;
  cost: number;
  currency?: string;
  billingCycle: BillingCycle;
  startDate: Date;
  nextBillingDate: Date;
  endDate?: Date;
  paymentMethod?: string;
  usageLimit?: number;
  serviceId?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  try {
    const subscription = await db.userSubscription.create({
      data: {
        id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        userId: session.user.id,
        currency: data.currency || "USD",
        updatedAt: new Date()
      }
    });

    revalidatePath("/profile");
    return { success: true, data: subscription };
  } catch (error: any) {
    logger.error("Error adding subscription:", error);
    return { success: false, error: "Failed to add subscription" };
  }
}

export async function updateSubscription(subscriptionId: string, data: {
  cost?: number;
  nextBillingDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  autoRenew?: boolean;
  currentUsage?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  try {
    const subscription = await db.userSubscription.update({
      where: {
        id: subscriptionId,
        userId: session.user.id
      },
      data
    });

    revalidatePath("/profile");
    return { success: true, data: subscription };
  } catch (error: any) {
    logger.error("Error updating subscription:", error);
    return { success: false, error: "Failed to update subscription" };
  }
}

// Goals Management
export async function createGoal(data: {
  title: string;
  description?: string;
  category: GoalCategory;
  targetValue?: number;
  unit?: string;
  startDate: Date;
  targetDate: Date;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  try {
    const goal = await db.goal.create({
      data: {
        id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        userId: session.user.id,
        updatedAt: new Date()
      }
    });

    revalidatePath("/profile");
    return { success: true, data: goal };
  } catch (error: any) {
    logger.error("Error creating goal:", error);
    return { success: false, error: "Failed to create goal" };
  }
}

export async function updateGoalProgress(goalId: string, currentValue: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  try {
    const goal = await db.goal.update({
      where: {
        id: goalId,
        userId: session.user.id
      },
      data: {
        currentValue
      }
    });

    revalidatePath("/profile");
    return { success: true, data: goal };
  } catch (error: any) {
    logger.error("Error updating goal progress:", error);
    return { success: false, error: "Failed to update goal progress" };
  }
}

// Analytics
export async function recordAnalytics(data: {
  analyticsType: string;
  value: number;
  metadata?: any;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  try {
    await db.userAnalytics.create({
      data: {
        id: `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        analyticsType: data.analyticsType as any,
        value: data.value,
        metadata: data.metadata,
        userId: session.user.id,
        recordedAt: new Date()
      }
    });

    return { success: true };
  } catch (error: any) {
    logger.error("Error recording analytics:", error);
    return { success: false, error: "Failed to record analytics" };
  }
}

// Dashboard Data
export async function getDashboardData() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  try {
    const [
      socialAccounts,
      contentStats,
      subscriptionStats,
      goalStats,
      recentActivity
    ] = await Promise.all([
      // Social media accounts with latest metrics
      db.socialMediaAccount.findMany({
        where: { userId: session.user.id },
        include: {
          SocialMetric: {
            orderBy: { recordedAt: 'desc' },
            take: 1
          }
        },
        take: 20,
      }),
      
      // Content statistics
      db.contentItem.groupBy({
        by: ['contentType'],
        where: { userId: session.user.id },
        _count: true
      }),
      
      // Subscription statistics
      db.userSubscription.aggregate({
        where: { 
          userId: session.user.id,
          isActive: true
        },
        _sum: { cost: true },
        _count: true
      }),
      
      // Goal statistics
      db.goal.findMany({
        where: { userId: session.user.id },
        include: {
          Milestone: true
        },
        take: 20,
      }),
      
      // Recent analytics
      db.userAnalytics.findMany({
        where: { userId: session.user.id },
        orderBy: { recordedAt: 'desc' },
        take: 10
      })
    ]);

    return {
      socialAccounts,
      contentStats,
      subscriptionStats,
      goalStats,
      recentActivity
    };
  } catch (error: any) {
    logger.error("Error fetching dashboard data:", error);
    throw error;
  }
} 