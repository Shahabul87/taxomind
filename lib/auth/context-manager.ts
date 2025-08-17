/**
 * Context Manager for User Capabilities
 * 
 * This module manages context switching between different user capabilities,
 * similar to how Google users can switch between different contexts
 * (YouTube Studio, Google Classroom, etc.)
 */

import { db } from "@/lib/db";
import { UserCapability, getUserCapabilities, hasCapability } from "./capabilities";
import { cache } from "react";

/**
 * User context state - represents the current active context
 */
export interface UserContext {
  userId: string;
  activeCapability: UserCapability;
  capabilities: UserCapability[];
  metadata?: Record<string, any>;
}

/**
 * Context preference stored in database or session
 */
export interface ContextPreference {
  userId: string;
  defaultContext: UserCapability;
  lastActiveContext: UserCapability;
  contextHistory: Array<{
    capability: UserCapability;
    activatedAt: Date;
  }>;
}

/**
 * Get the current active context for a user
 * This determines which dashboard/interface they see
 */
export const getCurrentContext = cache(async (
  userId: string,
  requestedContext?: UserCapability
): Promise<UserContext | null> => {
  try {
    const userCapabilities = await getUserCapabilities(userId);
    
    if (!userCapabilities.length) {
      return null;
    }

    const activeCapabilities = userCapabilities
      .filter(c => c.isActive)
      .map(c => c.capability);

    // Determine the active capability
    let activeCapability: UserCapability;

    if (requestedContext && activeCapabilities.includes(requestedContext)) {
      // Use requested context if user has the capability
      activeCapability = requestedContext;
    } else {
      // Get user's last active context from preferences
      const preference = await getContextPreference(userId);
      
      if (preference && activeCapabilities.includes(preference.lastActiveContext)) {
        activeCapability = preference.lastActiveContext;
      } else {
        // Default priority: Teacher > Affiliate > Student
        if (activeCapabilities.includes(UserCapability.TEACHER)) {
          activeCapability = UserCapability.TEACHER;
        } else if (activeCapabilities.includes(UserCapability.AFFILIATE)) {
          activeCapability = UserCapability.AFFILIATE;
        } else {
          activeCapability = UserCapability.STUDENT;
        }
      }
    }

    return {
      userId,
      activeCapability,
      capabilities: activeCapabilities,
    };
  } catch (error) {
    console.error("Error getting current context:", error);
    return null;
  }
});

/**
 * Switch user context to a different capability
 */
export async function switchContext(
  userId: string,
  newContext: UserCapability
): Promise<{ success: boolean; error?: string; context?: UserContext }> {
  try {
    // Check if user has the capability
    const hasRequiredCapability = await hasCapability(userId, newContext);
    
    if (!hasRequiredCapability) {
      return { 
        success: false, 
        error: `You don't have ${newContext.toLowerCase()} capability` 
      };
    }

    // Update context preference
    await updateContextPreference(userId, newContext);

    // Get the new context
    const context = await getCurrentContext(userId, newContext);
    
    if (!context) {
      return { success: false, error: "Failed to switch context" };
    }

    // Log context switch
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        userId,
        entityType: "CONTEXT",
        entityId: userId,
        context: {
          previousContext: context.activeCapability,
          newContext,
          switchedAt: new Date().toISOString(),
        },
      },
    });

    return { success: true, context };
  } catch (error) {
    console.error("Error switching context:", error);
    return { success: false, error: "Failed to switch context" };
  }
}

/**
 * Get user's context preference
 */
async function getContextPreference(userId: string): Promise<ContextPreference | null> {
  try {
    // In a real implementation, this would fetch from a UserPreference table
    // For now, we'll return a default preference
    const capabilities = await getUserCapabilities(userId);
    const activeCapabilities = capabilities
      .filter(c => c.isActive)
      .map(c => c.capability);

    if (!activeCapabilities.length) {
      return null;
    }

    // Default preference based on available capabilities
    const defaultContext = activeCapabilities.includes(UserCapability.TEACHER)
      ? UserCapability.TEACHER
      : activeCapabilities.includes(UserCapability.AFFILIATE)
      ? UserCapability.AFFILIATE
      : UserCapability.STUDENT;

    return {
      userId,
      defaultContext,
      lastActiveContext: defaultContext,
      contextHistory: [{
        capability: defaultContext,
        activatedAt: new Date(),
      }],
    };
  } catch (error) {
    console.error("Error getting context preference:", error);
    return null;
  }
}

/**
 * Update user's context preference
 */
async function updateContextPreference(
  userId: string,
  newContext: UserCapability
): Promise<void> {
  try {
    // In a real implementation, this would update a UserPreference table
    // For now, we'll just log the change
    console.log(`Context preference updated for user ${userId}: ${newContext}`);
    
    // You could store this in session, cookies, or database
    // Example: await db.userPreference.upsert({ ... })
  } catch (error) {
    console.error("Error updating context preference:", error);
  }
}

/**
 * Get context-specific dashboard data
 */
export async function getContextDashboardData(
  userId: string,
  context: UserCapability
): Promise<any> {
  try {
    switch (context) {
      case UserCapability.STUDENT:
        return getStudentDashboardData(userId);
      case UserCapability.TEACHER:
        return getTeacherDashboardData(userId);
      case UserCapability.AFFILIATE:
        return getAffiliateDashboardData(userId);
      default:
        return getStudentDashboardData(userId);
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return null;
  }
}

/**
 * Get student-specific dashboard data
 */
async function getStudentDashboardData(userId: string) {
  const [enrollments, progress, achievements] = await Promise.all([
    db.enrollment.count({ where: { userId } }),
    db.user_progress.findMany({
      where: { userId },
      take: 5,
      orderBy: { updatedAt: "desc" },
    }),
    db.userBadge.count({ where: { userId } }),
  ]);

  return {
    enrollments,
    recentProgress: progress,
    achievements,
  };
}

/**
 * Get teacher-specific dashboard data
 */
async function getTeacherDashboardData(userId: string) {
  const [courses, students, purchases] = await Promise.all([
    db.course.count({ where: { userId } }),
    db.enrollment.count({
      where: { Course: { userId } },
    }),
    db.purchase.count({
      where: { Course: { userId } },
    }),
  ]);

  return {
    totalCourses: courses,
    totalStudents: students,
    totalPurchases: purchases,
  };
}

/**
 * Get affiliate-specific dashboard data
 */
async function getAffiliateDashboardData(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      affiliateCode: true,
      affiliateEarnings: true,
    },
  });

  // Get referral stats (simplified - would need proper referral tracking)
  const referrals = await db.user.count({
    where: {
      // This would need a proper referral tracking field
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
  });

  return {
    affiliateCode: user?.affiliateCode,
    totalEarnings: user?.affiliateEarnings || 0,
    referrals,
  };
}

/**
 * Get available context switches for a user
 */
export async function getAvailableContextSwitches(
  userId: string,
  currentContext: UserCapability
): Promise<Array<{
  capability: UserCapability;
  label: string;
  icon: string;
  isActive: boolean;
}>> {
  const capabilities = await getUserCapabilities(userId);
  const activeCapabilities = capabilities
    .filter(c => c.isActive)
    .map(c => c.capability);

  const contextSwitches = [];

  // Add student context if not current
  if (currentContext !== UserCapability.STUDENT) {
    contextSwitches.push({
      capability: UserCapability.STUDENT,
      label: "Switch to Student",
      icon: "GraduationCap",
      isActive: true,
    });
  }

  // Add teacher context if available and not current
  if (
    activeCapabilities.includes(UserCapability.TEACHER) &&
    currentContext !== UserCapability.TEACHER
  ) {
    contextSwitches.push({
      capability: UserCapability.TEACHER,
      label: "Switch to Instructor",
      icon: "BookOpen",
      isActive: true,
    });
  }

  // Add affiliate context if available and not current
  if (
    activeCapabilities.includes(UserCapability.AFFILIATE) &&
    currentContext !== UserCapability.AFFILIATE
  ) {
    contextSwitches.push({
      capability: UserCapability.AFFILIATE,
      label: "Switch to Affiliate",
      icon: "DollarSign",
      isActive: true,
    });
  }

  return contextSwitches;
}

/**
 * Check if a feature is available in the current context
 */
export function isFeatureAvailableInContext(
  feature: string,
  context: UserCapability
): boolean {
  const contextFeatures: Record<UserCapability, string[]> = {
    [UserCapability.STUDENT]: [
      "course_enrollment",
      "progress_tracking",
      "certificates",
      "discussions",
      "quizzes",
    ],
    [UserCapability.TEACHER]: [
      "course_creation",
      "student_management",
      "analytics",
      "content_editing",
      "grading",
    ],
    [UserCapability.AFFILIATE]: [
      "referral_links",
      "commission_tracking",
      "promotional_materials",
      "earnings_dashboard",
    ],
    [UserCapability.CONTENT_CREATOR]: [
      "blog_creation",
      "article_publishing",
      "media_upload",
    ],
    [UserCapability.MODERATOR]: [
      "content_moderation",
      "user_reports",
      "flag_review",
    ],
    [UserCapability.REVIEWER]: [
      "course_reviews",
      "rating_system",
      "feedback_management",
    ],
  };

  return contextFeatures[context]?.includes(feature) || false;
}