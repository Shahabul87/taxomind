"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { logger } from '@/lib/logger';

export async function getAdminDashboardData() {
  try {
    const session = await auth();
    
    // Check if user is authenticated and is an admin
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      throw new Error("Unauthorized: Admin access required");
    }

    // Fetch total users count
    const totalUsers = await db.user.count();
    
    // Fetch users registered in the last 30 days (monthly growth)
    const lastMonthUsers = await db.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Fetch users registered in the last 7 days (weekly growth)
    const lastWeekUsers = await db.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Get users verification statistics
    const verifiedUsers = await db.user.count({
      where: {
        emailVerified: {
          not: null
        }
      }
    });

    // Get user authentication methods distribution
    const oauthUsers = await db.account.groupBy({
      by: ['provider'],
      _count: {
        provider: true
      }
    });

    // Get latest 10 users for the admin table
    const recentUsers = await db.user.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        emailVerified: true
      }
    });

    // Get user growth over time (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Simplify the user growth query to avoid type errors
    const usersByMonth = await db.user.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      select: {
        id: true,
        createdAt: true
      }
    }).catch(() => {
      return [];
    });

    // Process the results to group by month and year
    const userGrowth = usersByMonth.reduce((acc, user) => {
      const date = new Date(user.createdAt);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const key = `${year}-${month}`;
      
      if (!acc[key]) {
        acc[key] = { month, year, count: 0 };
      }
      acc[key].count++;
      return acc;
    }, {} as Record<string, { month: number; year: number; count: number }>);

    // Convert to array for easier consumption in frontend
    const userGrowthArray = Object.values(userGrowth).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    // Get additional statistics about your application
    // Customize these based on your actual database schema
    const additionalStats = {
      totalCourses: await db.course?.count().catch(() => 0) || 0,
      totalGroups: await db.group?.count().catch(() => 0) || 0,
      totalResources: await db.groupResource?.count().catch(() => 0) || 0,
      totalMessages: await db.message?.count().catch(() => 0) || 0,
    };

    return {
      usersStats: {
        totalUsers,
        lastMonthUsers,
        lastWeekUsers,
        verifiedUsers,
        unverifiedUsers: totalUsers - verifiedUsers,
        monthlyGrowthRate: totalUsers > 0 ? (lastMonthUsers / totalUsers) * 100 : 0,
        weeklyGrowthRate: totalUsers > 0 ? (lastWeekUsers / totalUsers) * 100 : 0,
        verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0,
      },
      authProviders: oauthUsers,
      userGrowth: userGrowthArray,
      recentUsers,
      additionalStats
    };
  } catch (error) {
    logger.error("[ADMIN_DASHBOARD_ACTION_ERROR]", error);
    throw error;
  }
}

export async function admin() {
  const session = await auth();

  if (session?.user?.role !== UserRole.ADMIN) {
    return {
      error: "Forbidden: Admin access required"
    }
  }

  return {
    success: "Allowed Server Action!"
  }
}