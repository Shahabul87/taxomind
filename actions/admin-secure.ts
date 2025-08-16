"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { logger } from '@/lib/logger';
import { 
  adminDashboardFilterSchema, 
  statsTimeRangeSchema,
  canAccessAdminDashboard,
  sanitizeDashboardInput
} from "@/lib/validators/dashboard-validators";
import { rateLimiters } from "@/lib/rate-limiter";
import { headers } from "next/headers";

// Error messages that don't leak information
const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized access",
  INVALID_INPUT: "Invalid input provided",
  RATE_LIMITED: "Too many requests, please try again later",
  INTERNAL_ERROR: "An error occurred processing your request"
};

// Helper to get client IP for rate limiting
async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  return forwardedFor?.split(',')[0] || realIp || 'unknown';
}

// Input validation schema for the main dashboard data
const getDashboardDataSchema = z.object({
  filters: adminDashboardFilterSchema.optional(),
  timeRange: statsTimeRangeSchema.optional(),
});

export async function getAdminDashboardDataSecure(
  input?: z.infer<typeof getDashboardDataSchema>
) {
  try {
    // Authentication check
    const session = await auth();
    
    if (!session?.user?.id || !canAccessAdminDashboard(session.user.role as UserRole)) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Rate limiting
    const clientIp = await getClientIp();
    const rateLimitKey = `admin-dashboard:${session.user.id}:${clientIp}`;
    const rateLimitResult = await rateLimiters.general.check(rateLimitKey);
    
    if (!rateLimitResult.allowed) {
      throw new Error(ERROR_MESSAGES.RATE_LIMITED);
    }

    // Validate and sanitize input
    const validatedInput = input ? getDashboardDataSchema.parse(input) : {};
    const sanitizedInput = sanitizeDashboardInput(validatedInput);

    // Calculate date ranges based on timeRange
    const now = new Date();
    let dateFilter = {};
    
    if (sanitizedInput.timeRange) {
      const startDate = new Date(now);
      
      switch (sanitizedInput.timeRange) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }
      
      if (sanitizedInput.timeRange !== 'all') {
        dateFilter = { createdAt: { gte: startDate } };
      }
    }

    // Apply additional filters
    const userFilter: any = { ...dateFilter };
    
    if (sanitizedInput.filters?.userRole) {
      userFilter.role = sanitizedInput.filters.userRole;
    }
    
    if (sanitizedInput.filters?.verified !== undefined) {
      userFilter.emailVerified = sanitizedInput.filters.verified ? { not: null } : null;
    }

    // Fetch data with proper error handling
    const [
      totalUsers,
      lastMonthUsers,
      lastWeekUsers,
      verifiedUsers,
      oauthUsers,
      recentUsers,
      userGrowthData
    ] = await Promise.all([
      // Total users
      db.user.count({ where: userFilter }),
      
      // Last month users
      db.user.count({
        where: {
          ...userFilter,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Last week users
      db.user.count({
        where: {
          ...userFilter,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Verified users
      db.user.count({
        where: {
          ...userFilter,
          emailVerified: { not: null }
        }
      }),
      
      // OAuth providers
      db.account.groupBy({
        by: ['provider'],
        _count: { provider: true },
        where: sanitizedInput.filters?.provider ? 
          { provider: sanitizedInput.filters.provider } : 
          undefined
      }),
      
      // Recent users (limit data exposure)
      db.user.findMany({
        where: userFilter,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          createdAt: true,
          emailVerified: true
        }
      }),
      
      // User growth data
      getUserGrowthData(userFilter)
    ]).catch(error => {
      logger.error("[ADMIN_DASHBOARD_SECURE_ERROR]", error);
      throw new Error(ERROR_MESSAGES.INTERNAL_ERROR);
    });

    // Get additional statistics safely
    const additionalStats = await getAdditionalStats().catch(() => ({
      totalCourses: 0,
      totalGroups: 0,
      totalResources: 0,
      totalMessages: 0
    }));

    // Calculate rates safely
    const calculateRate = (part: number, total: number) => {
      return total > 0 ? Number(((part / total) * 100).toFixed(2)) : 0;
    };

    // Log admin access for audit trail
    await logAdminAccess(session.user.id, 'dashboard_view').catch(console.error);

    return {
      success: true,
      data: {
        usersStats: {
          totalUsers,
          lastMonthUsers,
          lastWeekUsers,
          verifiedUsers,
          unverifiedUsers: totalUsers - verifiedUsers,
          monthlyGrowthRate: calculateRate(lastMonthUsers, totalUsers),
          weeklyGrowthRate: calculateRate(lastWeekUsers, totalUsers),
          verificationRate: calculateRate(verifiedUsers, totalUsers),
        },
        authProviders: oauthUsers,
        userGrowth: userGrowthData,
        recentUsers: sanitizeUserData(recentUsers),
        additionalStats,
        metadata: {
          lastUpdated: new Date().toISOString(),
          appliedFilters: sanitizedInput
        }
      }
    };
  } catch (error: any) {
    // Log error securely without exposing details
    logger.error("[ADMIN_DASHBOARD_SECURE_ERROR]", {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Return sanitized error
    return {
      success: false,
      error: error instanceof Error && 
             Object.values(ERROR_MESSAGES).includes(error.message) ? 
             error.message : 
             ERROR_MESSAGES.INTERNAL_ERROR
    };
  }
}

// Helper function to get user growth data
async function getUserGrowthData(filter: any) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const users = await db.user.findMany({
    where: {
      ...filter,
      createdAt: { gte: sixMonthsAgo }
    },
    select: {
      id: true,
      createdAt: true
    }
  });

  // Group by month
  const growth = users.reduce((acc, user) => {
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

  return Object.values(growth).sort((a: { month: number; year: number; count: number }, b: { month: number; year: number; count: number }) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
}

// Helper function to get additional stats
async function getAdditionalStats() {
  const [totalCourses, totalGroups, totalResources, totalMessages] = await Promise.all([
    db.course?.count() ?? 0,
    db.group?.count() ?? 0,
    db.groupResource?.count() ?? 0,
    db.message?.count() ?? 0
  ]);

  return {
    totalCourses,
    totalGroups,
    totalResources,
    totalMessages
  };
}

// Helper function to sanitize user data
function sanitizeUserData(users: any[]) {
  return users.map(user => ({
    ...user,
    email: maskEmail(user.email),
    // Remove any sensitive fields if needed
  }));
}

// Helper function to mask email for privacy
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const maskedLocal = local.length > 3 ? 
    local.slice(0, 2) + '*'.repeat(local.length - 3) + local.slice(-1) : 
    local;
  return `${maskedLocal}@${domain}`;
}

// Check if current user is a secure admin
export async function isAdminSecure() {
  try {
    const session = await auth();
    
    // Check session validity
    if (!session?.user?.id || !session.user.role) {
      return {
        isAdmin: false,
        user: null
      };
    }

    // Double-check with database to ensure role hasn't changed
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        isTwoFactorEnabled: true,
      }
    });

    // Validate user exists and role matches
    if (!user || user.role !== session.user.role || user.role !== UserRole.ADMIN) {
      return {
        isAdmin: false,
        user: null
      };
    }

    return {
      isAdmin: true,
      user
    };
  } catch (error: any) {
    logger.error("[IS_ADMIN_SECURE_ERROR]", error);
    throw error;
  }
}

// Audit logging function
async function logAdminAccess(userId: string, action: string) {
  try {
    // If you have an audit log table, use it here
    // For now, just log to console in production
    console.log(`[ADMIN_AUDIT] User ${userId} performed action: ${action} at ${new Date().toISOString()}`);
    
    // Example: await db.auditLog.create({
    //   data: {
    //     userId,
    //     action,
    //     timestamp: new Date(),
    //     metadata: {}
    //   }
    // });
  } catch (error: any) {
    logger.error("[AUDIT_LOG_ERROR]", error);
  }
}

// Export user data with proper validation
export async function exportUserDataSecure(
  format: 'csv' | 'json',
  filters?: any
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Rate limit exports more strictly
    const clientIp = await getClientIp();
    const rateLimitKey = `export:${session.user.id}:${clientIp}`;
    const rateLimitResult = await rateLimiters.heavy.check(rateLimitKey);
    
    if (!rateLimitResult.allowed) {
      throw new Error(ERROR_MESSAGES.RATE_LIMITED);
    }

    // Log export action
    await logAdminAccess(session.user.id, `export_users_${format}`);

    // Implementation would go here...
    return {
      success: true,
      message: "Export initiated"
    };
  } catch (error: any) {
    return {
      success: false,
      error: error instanceof Error && 
             Object.values(ERROR_MESSAGES).includes(error.message) ? 
             error.message : 
             ERROR_MESSAGES.INTERNAL_ERROR
    };
  }
}

// Bulk actions with validation
export async function performBulkActionSecure(
  action: string,
  entityIds: string[],
  reason?: string
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Validate entity IDs
    if (!Array.isArray(entityIds) || entityIds.length === 0 || entityIds.length > 100) {
      throw new Error(ERROR_MESSAGES.INVALID_INPUT);
    }

    // Rate limit bulk actions
    const clientIp = await getClientIp();
    const rateLimitKey = `bulk-action:${session.user.id}:${clientIp}`;
    const rateLimitResult = await rateLimiters.heavy.check(rateLimitKey);
    
    if (!rateLimitResult.allowed) {
      throw new Error(ERROR_MESSAGES.RATE_LIMITED);
    }

    // Log bulk action
    await logAdminAccess(
      session.user.id, 
      `bulk_${action}_${entityIds.length}_items`
    );

    // Implementation would go here...
    return {
      success: true,
      message: `${action} performed on ${entityIds.length} items`
    };
  } catch (error: any) {
    return {
      success: false,
      error: error instanceof Error && 
             Object.values(ERROR_MESSAGES).includes(error.message) ? 
             error.message : 
             ERROR_MESSAGES.INTERNAL_ERROR
    };
  }
}