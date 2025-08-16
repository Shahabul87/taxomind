import { Subscription } from "@prisma/client";

export type ActivityStatus = "completed" | "in-progress" | "not-started" | "overdue" | "cancelled";
export type ActivityType = "idea" | "mind" | "script" | "subscription" | "billing" | "plan";
export type ActivityPriority = "low" | "medium" | "high" | "critical";

export interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  type: ActivityType;
  status: ActivityStatus;
  priority: ActivityPriority;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedDate?: Date;
  progress: number; // 0-100
  userId: string;
  parentId?: string; // For sub-tasks
  tags?: string[];
  metadata?: Record<string, any>; // Type-specific additional data
}

// For grouping activities by date
export interface DailyActivities {
  date: Date;
  activities: ActivityItem[];
  completedCount: number;
  totalCount: number;
}

// For API request/response
export interface ActivityResponse {
  activities: ActivityItem[];
  total: number;
  completedCount: number;
  overdueCount: number;
}

export interface ActivityFilterOptions {
  types?: ActivityType[];
  status?: ActivityStatus[];
  priority?: ActivityPriority[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchTerm?: string;
}

export interface ActivityDashboardProps {
  userId: string;
  initialActivities?: ActivityItem[];
} 