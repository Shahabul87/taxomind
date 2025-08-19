/**
 * React Query Setup and Client-Side Caching
 * Phase 3.3: Advanced client-side caching with React Query
 * Part of Enterprise Code Quality Plan Phase 3
 */

'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
// import { logger } from '@/lib/logger'; // Logger module not found, using console.log instead

// Query client configuration
const queryClientConfig = {
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache time of 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Retry delay increases exponentially
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Don't refetch on mount if data exists
      refetchOnMount: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Retry delay for mutations
      retryDelay: 1000,
    },
  },
};

// Create query client with enhanced error handling
function createQueryClient() {
  return new QueryClient(queryClientConfig);
}

// Browser-safe query client
let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return createQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = createQueryClient();
    return browserQueryClient;
  }
}

/**
 * React Query Provider Component
 */
interface ReactQueryProviderProps {
  children: React.ReactNode;
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}

/**
 * Custom hooks for common data fetching patterns
 */

// API fetch function with error handling
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Hook for fetching courses with caching
 */
export function useCourses(filters?: {
  categoryId?: string;
  title?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['courses', filters],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (filters?.categoryId) searchParams.set('categoryId', filters.categoryId);
      if (filters?.title) searchParams.set('title', filters.title);
      if (filters?.page) searchParams.set('page', filters.page.toString());
      if (filters?.limit) searchParams.set('limit', filters.limit.toString());
      
      return fetchAPI(`/api/courses?${searchParams}`);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Hook for fetching single course with caching
 */
export function useCourse(courseId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: () => fetchAPI(`/api/courses/${courseId}`),
    enabled: enabled && !!courseId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook for fetching user's enrolled courses
 */
export function useUserCourses(userId: string) {
  return useQuery({
    queryKey: ['userCourses', userId],
    queryFn: () => fetchAPI(`/api/users/${userId}/courses`),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for fetching user progress
 */
export function useUserProgress(userId: string, courseId?: string) {
  return useQuery({
    queryKey: ['userProgress', userId, courseId],
    queryFn: () => {
      const endpoint = courseId 
        ? `/api/users/${userId}/progress/${courseId}`
        : `/api/users/${userId}/progress`;
      return fetchAPI(endpoint);
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching analytics data
 */
export function useAnalytics(
  type: 'user' | 'course' | 'global',
  id?: string,
  timeRange?: { start: string; end: string }
) {
  return useQuery({
    queryKey: ['analytics', type, id, timeRange],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (timeRange) {
        searchParams.set('start', timeRange.start);
        searchParams.set('end', timeRange.end);
      }
      
      const endpoint = id 
        ? `/api/analytics/${type}/${id}?${searchParams}`
        : `/api/analytics/${type}?${searchParams}`;
      
      return fetchAPI(endpoint);
    },
    enabled: !!type,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for fetching categories
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchAPI('/api/categories'),
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
  });
}

/**
 * Hook for infinite scroll course loading
 */
export function useInfiniteCourses(filters?: {
  categoryId?: string;
  title?: string;
}) {
  // For now, using regular useQuery instead of infinite query
  return useQuery({
    queryKey: ['infiniteCourses', filters],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      searchParams.set('page', '1');
      searchParams.set('limit', '20');
      if (filters?.categoryId) searchParams.set('categoryId', filters.categoryId);
      if (filters?.title) searchParams.set('title', filters.title);
      
      return fetchAPI(`/api/courses?${searchParams}`);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Mutation hooks for data modifications
 */

/**
 * Hook for enrolling in a course
 */
export function useEnrollInCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, userId }: { courseId: string; userId: string }) =>
      fetchAPI(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),
    onSuccess: (data: any, variables: { courseId: string; userId: string }) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['userCourses', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['userProgress', variables.userId] });
    },
    onError: (error: any) => {
      console.error("Failed to enroll in course:", error);
    },
  });
}

/**
 * Hook for updating user progress
 */
export function useUpdateProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      userId, 
      courseId, 
      chapterId, 
      progress 
    }: { 
      userId: string; 
      courseId: string; 
      chapterId: string; 
      progress: number;
    }) =>
      fetchAPI(`/api/users/${userId}/progress`, {
        method: 'PUT',
        body: JSON.stringify({ courseId, chapterId, progress }),
      }),
    onSuccess: (data: any, variables: { userId: string; courseId: string; chapterId: string; progress: number }) => {
      // Update cache immediately for better UX
      queryClient.setQueryData(
        ['userProgress', variables.userId, variables.courseId],
        (oldData: any) => {
          if (!oldData) return data;
          return { ...oldData, ...data };
        }
      );
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['userProgress', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['userCourses', variables.userId] });
    },
  });
}

/**
 * Hook for creating a new course
 */
export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseData: any) =>
      fetchAPI('/api/courses', {
        method: 'POST',
        body: JSON.stringify(courseData),
      }),
    onSuccess: () => {
      // Invalidate courses list
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['infiniteCourses'] });
    },
  });
}

/**
 * Cache invalidation utilities
 */
export function useCacheInvalidation() {
  const queryClient = useQueryClient();

  return {
    // Invalidate all course-related queries
    invalidateCourses: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['infiniteCourses'] });
    },

    // Invalidate specific course
    invalidateCourse: (courseId: string) => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },

    // Invalidate user-specific data
    invalidateUserData: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: ['userCourses', userId] });
      queryClient.invalidateQueries({ queryKey: ['userProgress', userId] });
    },

    // Invalidate analytics
    invalidateAnalytics: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },

    // Force refresh specific query
    refetchQuery: (queryKey: any[]) => {
      queryClient.refetchQueries({ queryKey });
    },

    // Optimistically update cache
    updateQueryData: <T,>(queryKey: any[], updater: (oldData: T | undefined) => T) => {
      queryClient.setQueryData(queryKey, updater);
    },
  };
}

/**
 * Prefetching utilities
 */
export function usePrefetching() {
  const queryClient = useQueryClient();

  return {
    // Prefetch course details
    prefetchCourse: (courseId: string) => {
      queryClient.prefetchQuery({
        queryKey: ['course', courseId],
        queryFn: () => fetchAPI(`/api/courses/${courseId}`),
        staleTime: 15 * 60 * 1000,
      });
    },

    // Prefetch user courses
    prefetchUserCourses: (userId: string) => {
      queryClient.prefetchQuery({
        queryKey: ['userCourses', userId],
        queryFn: () => fetchAPI(`/api/users/${userId}/courses`),
        staleTime: 5 * 60 * 1000,
      });
    },

    // Prefetch categories
    prefetchCategories: () => {
      queryClient.prefetchQuery({
        queryKey: ['categories'],
        queryFn: () => fetchAPI('/api/categories'),
        staleTime: 60 * 60 * 1000,
      });
    },
  };
}

/**
 * Background sync for offline support
 */
export function useBackgroundSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      console.info('Connection restored, refetching queries');
      queryClient.refetchQueries();
    };

    const handleFocus = () => {
      // Refetch important queries when user returns to tab
      queryClient.refetchQueries({
        queryKey: ['userProgress'],
        type: 'active',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('focus', handleFocus);
    };
  }, [queryClient]);
}

/**
 * Performance monitoring for React Query
 */
export class ReactQueryPerformanceMonitor {
  private static queryMetrics: Map<string, number[]> = new Map();

  static trackQuery(queryKey: string, duration: number): void {
    if (!this.queryMetrics.has(queryKey)) {
      this.queryMetrics.set(queryKey, []);
    }
    
    const metrics = this.queryMetrics.get(queryKey)!;
    metrics.push(duration);
    
    // Keep only last 50 measurements
    if (metrics.length > 50) {
      metrics.splice(0, metrics.length - 50);
    }
  }

  static getMetrics(): Record<string, {
    averageTime: number;
    totalQueries: number;
    lastQueryTime: number;
  }> {
    const result: Record<string, any> = {};
    
    this.queryMetrics.forEach((times, queryKey) => {
      result[queryKey] = {
        averageTime: times.reduce((a, b) => a + b, 0) / times.length,
        totalQueries: times.length,
        lastQueryTime: times[times.length - 1] || 0,
      };
    });
    
    return result;
  }

  static clearMetrics(): void {
    this.queryMetrics.clear();
  }
}

export { getQueryClient };
export type { ReactQueryProviderProps };