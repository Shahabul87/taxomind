import { ActivityItem, ActivityStatus, ActivityType, DailyActivities } from "./types";

/**
 * Format a date to a user-friendly string
 */
export const formatDate = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dateObj = new Date(date);
  
  // Check if it's today, yesterday, or tomorrow
  if (isSameDay(dateObj, today)) {
    return 'Today';
  } else if (isSameDay(dateObj, yesterday)) {
    return 'Yesterday';
  } else if (isSameDay(dateObj, tomorrow)) {
    return 'Tomorrow';
  }
  
  // Format for other dates
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format a time to a user-friendly string
 */
export const formatTime = (date: Date): string => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Check if two dates are the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/**
 * Group activities by date
 */
export const groupActivitiesByDate = (activities: ActivityItem[]): DailyActivities[] => {
  const grouped: Map<string, ActivityItem[]> = new Map();
  
  activities.forEach(activity => {
    const dateToUse = activity.dueDate || activity.createdAt;
    const dateString = new Date(dateToUse).toDateString();
    
    if (!grouped.has(dateString)) {
      grouped.set(dateString, []);
    }
    
    grouped.get(dateString)?.push(activity);
  });
  
  // Convert map to array and sort by date (most recent first)
  return Array.from(grouped.entries())
    .map(([dateString, activities]) => {
      const completedCount = activities.filter(a => a.status === 'completed').length;
      
      return {
        date: new Date(dateString),
        activities: activities.sort((a, b) => {
          // Sort by priority (high to low) and then by due date (soonest first)
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          const aPriority = priorityOrder[a.priority];
          const bPriority = priorityOrder[b.priority];
          
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          
          const aDate = a.dueDate || a.createdAt;
          const bDate = b.dueDate || b.createdAt;
          return new Date(aDate).getTime() - new Date(bDate).getTime();
        }),
        completedCount,
        totalCount: activities.length
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());
};

/**
 * Get appropriate color classes for activity status
 */
export const getStatusColors = (status: ActivityStatus): { bg: string, text: string, border: string } => {
  switch (status) {
    case 'completed':
      return { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' };
    case 'in-progress':
      return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' };
    case 'not-started':
      return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' };
    case 'overdue':
      return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' };
    case 'cancelled':
      return { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' };
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' };
  }
};

/**
 * Get appropriate color classes for activity priority
 */
export const getPriorityColors = (priority: string): { bg: string, text: string } => {
  switch (priority) {
    case 'critical':
      return { bg: 'bg-red-600', text: 'text-white' };
    case 'high':
      return { bg: 'bg-orange-500', text: 'text-white' };
    case 'medium':
      return { bg: 'bg-yellow-500', text: 'text-slate-900' };
    case 'low':
      return { bg: 'bg-blue-500', text: 'text-white' };
    default:
      return { bg: 'bg-slate-500', text: 'text-white' };
  }
};

/**
 * Get appropriate icon name for activity type
 */
export const getActivityIcon = (type: ActivityType): string => {
  switch (type) {
    case 'idea':
      return 'Lightbulb';
    case 'mind':
      return 'Brain';
    case 'script':
      return 'FilePen';
    case 'subscription':
      return 'BadgeCheck';
    case 'billing':
      return 'DollarSign';
    case 'plan':
      return 'Calendar';
    default:
      return 'Activity';
  }
};

/**
 * Check if an activity is overdue
 */
export const isActivityOverdue = (activity: ActivityItem): boolean => {
  if (!activity.dueDate || activity.status === 'completed' || activity.status === 'cancelled') {
    return false;
  }
  
  return new Date(activity.dueDate) < new Date();
}; 