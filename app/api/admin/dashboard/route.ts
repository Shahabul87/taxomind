import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminAuth } from "@/auth.admin";
import { AdminRole } from "@/types/admin-role";
import { logger } from '@/lib/logger';

// Mark this route as dynamic to prevent static generation attempts
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await adminAuth();

    // Check if user is authenticated and is an admin
    if (!session || !session.user || (session.user.role !== AdminRole.ADMIN && session.user.role !== AdminRole.SUPERADMIN)) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Fetch total users count
    const totalUsers = await db.user.count();
    
    // Fetch users registered in the last 7 days
    const lastWeekUsers = await db.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Fetch verified vs unverified users
    const verifiedUsers = await db.user.count({
      where: {
        emailVerified: {
          not: null
        }
      }
    });

    // Get user type distribution (teachers vs regular users)
    const usersByType = await db.user.groupBy({
      by: ['isTeacher'],
      _count: {
        isTeacher: true
      }
    });

    // Get authentication methods (OAuth vs Credentials)
    const oauthAccounts = await db.account.count();
    const credentialUsers = totalUsers - oauthAccounts;

    // Get latest 5 users
    const recentUsers = await db.user.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        email: true,
        isTeacher: true,
        createdAt: true,
        emailVerified: true
      }
    });

    // Fetch additional data relevant to your app
    // For example, if you have courses or content
    const totalCourses = await db.course?.count() || 0;
    const totalGroups = await db.group?.count() || 0;
    const totalResources = await db.groupResource?.count() || 0;

    return NextResponse.json({
      stats: {
        totalUsers,
        lastWeekUsers,
        verifiedUsers,
        unverifiedUsers: totalUsers - verifiedUsers,
        usersByType,
        oauthAccounts,
        credentialUsers,
        totalCourses,
        totalGroups,
        totalResources
      },
      recentUsers
    });
  } catch (error) {
    logger.error("[ADMIN_DASHBOARD_API_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 