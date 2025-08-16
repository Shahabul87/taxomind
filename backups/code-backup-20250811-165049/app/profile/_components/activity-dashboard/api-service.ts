import { ActivityFilterOptions, ActivityItem, ActivityResponse, ActivityStatus, ActivityType } from "./types";
import { logger } from '@/lib/logger';

/**
 * Fetches activities for a user based on filter options
 */
export const fetchActivities = async (
  userId: string, 
  filters?: ActivityFilterOptions
): Promise<ActivityResponse> => {
  try {
    const searchParams = new URLSearchParams();
    
    if (filters?.types?.length) {
      searchParams.append('types', filters.types.join(','));
    }
    
    if (filters?.status?.length) {
      searchParams.append('status', filters.status.join(','));
    }
    
    if (filters?.priority?.length) {
      searchParams.append('priority', filters.priority.join(','));
    }
    
    if (filters?.dateRange) {
      searchParams.append('startDate', filters.dateRange.start.toISOString());
      searchParams.append('endDate', filters.dateRange.end.toISOString());
    }
    
    if (filters?.searchTerm) {
      searchParams.append('search', filters.searchTerm);
    }
    
    const response = await fetch(`/api/activities/user/${userId}?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }
    
    return await response.json();
  } catch (error) {
    logger.error('Error fetching activities:', error);
    throw error;
  }
};

/**
 * Creates a new activity
 */
export const createActivity = async (activity: Omit<ActivityItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ActivityItem> => {
  try {
    const response = await fetch('/api/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activity),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create activity');
    }
    
    return await response.json();
  } catch (error) {
    logger.error('Error creating activity:', error);
    throw error;
  }
};

/**
 * Updates an existing activity
 */
export const updateActivity = async (id: string, activity: Partial<ActivityItem>): Promise<ActivityItem> => {
  try {
    const response = await fetch(`/api/activities/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activity),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update activity');
    }
    
    return await response.json();
  } catch (error) {
    logger.error('Error updating activity:', error);
    throw error;
  }
};

/**
 * Deletes an activity
 */
export const deleteActivity = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`/api/activities/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete activity');
    }
  } catch (error) {
    logger.error('Error deleting activity:', error);
    throw error;
  }
};

/**
 * Updates activity status
 */
export const updateActivityStatus = async (id: string, status: ActivityStatus): Promise<ActivityItem> => {
  return updateActivity(id, { status });
};

/**
 * Sets activity progress
 */
export const updateActivityProgress = async (id: string, progress: number): Promise<ActivityItem> => {
  return updateActivity(id, { progress });
};

/**
 * Mark activity as complete
 */
export const completeActivity = async (id: string): Promise<ActivityItem> => {
  return updateActivity(id, { 
    status: 'completed', 
    progress: 100,
    completedDate: new Date()
  });
}; 