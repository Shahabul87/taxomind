import { db } from "@/lib/db";
import { auth } from "@/auth";
// Define activity types locally since profile folder was removed
type ActivityStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
type ActivityType = 'course' | 'assignment' | 'quiz' | 'project' | 'script' | 'plan' | 'other';
type ActivityPriority = 'low' | 'medium' | 'high' | 'urgent';

interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  type: ActivityType;
  status: ActivityStatus;
  priority?: ActivityPriority;
  dueDate?: Date;
  completedDate?: Date;
  createdAt: Date;
  updatedAt?: Date;
  progress?: number;
  tags?: string[];
  metadata?: Record<string, any>;
  userId?: string;
}
import { logger } from '@/lib/logger';

/**
 * Get real user activities from the database
 */
export const getActivityData = async () => {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return null;
    }
    
    const userId = session.user.id;
    
    // Try to fetch real activities from database
    try {
      const activities = await fetchRealActivities(userId);
      return activities;
    } catch (error: any) {
      logger.warn("Activity table not available, returning empty array:", error);
      return [];
    }
    
  } catch (error: any) {
    logger.error("Error fetching activity data:", error);
    return [];
  }
};

/**
 * Fetch real activities from database
 */
const fetchRealActivities = async (userId: string): Promise<ActivityItem[]> => {
  // Try to fetch from an activities table if it exists
  try {
    const activities = await db.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    
    return activities.map(activity => ({
      id: activity.id,
      title: activity.title,
      description: activity.description || "",
      type: activity.type as ActivityType,
      status: activity.status as ActivityStatus,
      priority: (activity.priority as ActivityPriority) || "medium",
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
      dueDate: activity.dueDate || undefined,
      completedDate: activity.completedDate || undefined,
      progress: activity.progress || 0,
      userId: activity.userId
    }));
  } catch (error: any) {
    // If Activity table doesn't exist, try to get activities from other sources
    const userActivities = await getActivitiesFromUserData(userId);
    return userActivities;
  }
};

/**
 * Get activities from user's existing data (posts, ideas, courses, etc.)
 */
const getActivitiesFromUserData = async (userId: string): Promise<ActivityItem[]> => {
  const activities: ActivityItem[] = [];
  
  try {
    // Get user data
    const userData = await db.user.findUnique({
      where: { id: userId },
      include: {
        Post: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        courses: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
      }
    });

    if (!userData) return [];

    // Convert posts to activities
    userData.Post.forEach(post => {
      activities.push({
        id: `post_${post.id}`,
        title: `Blog Post: ${post.title}`,
        description: post.body ? post.body.substring(0, 100) + "..." : "Blog post content",
        type: "script" as ActivityType,
        status: "completed" as ActivityStatus,
        priority: "medium",
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        completedDate: post.published ? post.createdAt : undefined,
        progress: 100,
        userId
      });
    });

    // Convert courses to activities
    userData.courses.forEach(course => {
      activities.push({
        id: `course_${course.id}`,
        title: `Course: ${course.title}`,
        description: course.description || "Course content",
        type: "plan" as ActivityType,
        status: course.isPublished ? "completed" : "in-progress" as ActivityStatus,
        priority: "high",
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        completedDate: course.isPublished ? course.updatedAt : undefined,
        progress: course.isPublished ? 100 : 60,
        userId
      });
    });

    // Sort by most recent first
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return activities;
    
  } catch (error: any) {
    logger.error("Error getting activities from user data:", error);
    return [];
  }
}; 