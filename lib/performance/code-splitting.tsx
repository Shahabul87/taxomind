/**
 * Code Splitting and Lazy Loading Utilities
 * Phase 3.2: Advanced code splitting strategies for performance
 * Part of Enterprise Code Quality Plan Phase 3
 */

import { lazy, Suspense, ComponentType, ReactNode, useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';

// Loading states for different component types
const LoadingComponents = {
  // Skeleton for dashboard components
  Dashboard: () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  ),

  // Skeleton for course content
  CourseContent: () => (
    <div className="space-y-4">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-64 w-full" />
    </div>
  ),

  // Skeleton for forms
  Form: () => (
    <div className="space-y-4 max-w-md">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-1/3" />
    </div>
  ),

  // Skeleton for analytics
  Analytics: () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  ),

  // Skeleton for editors
  Editor: () => (
    <div className="space-y-4">
      <div className="flex space-x-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-8" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  ),

  // Default loading component
  Default: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  ),
};

interface LazyComponentConfig {
  fallback?: keyof typeof LoadingComponents;
  retryCount?: number;
  retryDelay?: number;
  preload?: boolean;
  criticalResource?: boolean;
}

/**
 * Enhanced lazy loading with error boundaries and retry logic
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T } | any>,
  config: LazyComponentConfig = {}
): ComponentType<React.ComponentProps<T>> {
  const {
    fallback = 'Default',
    retryCount = 3,
    retryDelay = 1000,
    preload = false,
    criticalResource = false,
  } = config;

  // Create lazy component with retry logic
  const LazyComponent = lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      let attempts = 0;

      const attemptImport = async () => {
        try {
          const module = await importFn();
          // Handle both default exports and module exports
          const resolvedModule = 'default' in module ? module : { default: module };
          resolve(resolvedModule);
        } catch (error) {
          attempts++;
          
          if (attempts >= retryCount) {
            logger.error(`Failed to load component after ${retryCount} attempts:`, error as Error);
            reject(error);
            return;
          }

          logger.warn(`Component import failed, retrying (${attempts}/${retryCount})...`);
          setTimeout(attemptImport, retryDelay * attempts);
        }
      };

      attemptImport();
    });
  });

  // Preload if requested
  if (preload) {
    // Preload on idle or immediately for critical resources
    if (criticalResource) {
      importFn().catch(console.error);
    } else if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        importFn().catch(console.error);
      });
    }
  }

  // Return wrapped component with suspense
  return function WrappedLazyComponent(props: React.ComponentProps<T>) {
    const LoadingComponent = LoadingComponents[fallback];

    return (
      <Suspense fallback={<LoadingComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Route-based code splitting
 */
export const LazyRoutes = {
  // Dashboard routes
  Dashboard: createLazyComponent(
    () => import('@/app/dashboard/page'),
    { fallback: 'Dashboard', preload: true, criticalResource: true }
  ),

  // Course routes
  // CourseOverview: createLazyComponent(
  //   () => import('@/app/courses/[courseId]/page'),
  //   { fallback: 'CourseContent', preload: true }
  // ),

  // CourseLearning: createLazyComponent(
  //   () => import('@/app/courses/[courseId]/chapters/[chapterId]/page'),
  //   { fallback: 'CourseContent' }
  // ),

  // Analytics routes
  Analytics: createLazyComponent(
    () => import('@/components/analytics/enhanced-analytics-dashboard'),
    { fallback: 'Analytics' }
  ),

  TeacherAnalytics: createLazyComponent(
    () => import('@/components/analytics/ImprovedUnifiedAnalytics'),
    { fallback: 'Analytics' }
  ),

  // Profile routes
  Profile: createLazyComponent(
    () => import('@/app/dashboard/user/page'),
    { fallback: 'Form' }
  ),

  // Admin routes
  AdminDashboard: createLazyComponent(
    () => import('@/components/admin/enterprise-intelligence-dashboard'),
    { fallback: 'Dashboard' }
  ),
};

/**
 * Component-based code splitting
 */
export const LazyComponents = {
  // Heavy editor components
  TipTapEditor: createLazyComponent(
    () => import('@/components/tiptap/editor'),
    { fallback: 'Editor', preload: false }
  ),

  SAMEngine: createLazyComponent(
    () => import('@/components/sam/sam-engine-powered-chat'),
    { fallback: 'Default', preload: false }
  ),

  // Analytics components
  RealtimeDashboard: createLazyComponent(
    () => import('@/components/analytics/real-time-dashboard'),
    { fallback: 'Analytics' }
  ),

  FinancialDashboard: createLazyComponent(
    () => import('@/components/billing/financial-intelligence-dashboard'),
    { fallback: 'Analytics' }
  ),

  // Video components
  VideoPlayer: createLazyComponent(
    () => import('@/components/video/tracked-video-player'),
    { fallback: 'Default' }
  ),

  // Course creation components
  CourseCreator: createLazyComponent(
    () => import('@/components/course-creation/course-structure-preview'),
    { fallback: 'Form' }
  ),

  // Collaborative components
  CollaborativeEditor: createLazyComponent(
    () => import('@/components/collaborative-editing/collaborative-editor'),
    { fallback: 'Editor' }
  ),
};

/**
 * Feature-based code splitting with progressive loading
 */
export const LazyFeatures = {
  // SAM AI features (heavy ML components)
  SAMFeatures: createLazyComponent(
    () => import('@/components/sam/student-dashboard'),
    { fallback: 'Default', retryCount: 5 }
  ),

  // Mobile responsive components
  MobileSystem: createLazyComponent(
    () => import('@/components/mobile/enhanced-mobile-system'),
    { fallback: 'Default' }
  ),

  // Advanced analytics
  EnterpriseAnalytics: createLazyComponent(
    () => import('@/components/admin/enterprise-intelligence-dashboard'),
    { fallback: 'Analytics', retryCount: 5 }
  ),
};

/**
 * Hook for conditional loading based on user capabilities
 */
export function useConditionalLoading(
  userRole: string,
  userCapabilities: string[]
) {
  const [loadedComponents, setLoadedComponents] = useState<Set<string>>(new Set());

  useEffect(() => {
    const componentsToLoad: string[] = [];

    // Load based on user role
    if (userRole === 'ADMIN') {
      componentsToLoad.push('AdminDashboard', 'EnterpriseAnalytics');
    }

    if (userRole === 'TEACHER' || userCapabilities.includes('TEACHER')) {
      componentsToLoad.push('CourseCreator', 'TeacherAnalytics');
    }

    // Load mobile components on mobile devices
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      componentsToLoad.push('MobileSystem');
    }

    // Preload components asynchronously
    componentsToLoad.forEach(async (componentName) => {
      if (!loadedComponents.has(componentName)) {
        try {
          // This would trigger the lazy loading
          logger.info(`Preloading component: ${componentName}`);
          setLoadedComponents(prev => new Set([...prev, componentName]));
        } catch (error) {
          logger.error(`Failed to preload component ${componentName}:`, error as Error);
        }
      }
    });
  }, [userRole, userCapabilities, loadedComponents]);

  return { loadedComponents };
}

/**
 * Progressive enhancement for critical features
 */
export function useProgressiveEnhancement() {
  const [enhanced, setEnhanced] = useState(false);

  useEffect(() => {
    // Enable enhancements after initial render
    const timer = setTimeout(() => {
      setEnhanced(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return enhanced;
}

/**
 * Intersection Observer for lazy loading on scroll
 */
export function useLazyLoadOnScroll(
  ref: React.RefObject<HTMLElement>,
  importFn: () => Promise<any>,
  options?: IntersectionObserverInit
) {
  const [loaded, setLoaded] = useState(false);
  const [Component, setComponent] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (!ref.current || loaded) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting) {
          try {
            const module = await importFn();
            setComponent(() => module.default);
            setLoaded(true);
            observer.disconnect();
          } catch (error) {
            logger.error('Error loading component on scroll:', error as Error);
          }
        }
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, importFn, loaded, options]);

  return { Component, loaded };
}

/**
 * Bundle size monitoring utility
 */
export function logBundleSize(componentName: string, startTime: number) {
  if (process.env.NODE_ENV === 'development') {
    const loadTime = performance.now() - startTime;
    logger.info(`[Code Splitting] ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
  }
}

/**
 * Preload strategy based on user interaction patterns
 */
export class PreloadStrategy {
  private static preloadedModules = new Set<string>();
  private static interactionCount = new Map<string, number>();

  static trackInteraction(route: string) {
    const count = this.interactionCount.get(route) || 0;
    this.interactionCount.set(route, count + 1);

    // Preload after 3 interactions
    if (count >= 2 && !this.preloadedModules.has(route)) {
      this.preloadRoute(route);
    }
  }

  static async preloadRoute(route: string) {
    if (this.preloadedModules.has(route)) return;

    try {
      // Map routes to their respective lazy components
      const routeMap: Record<string, () => Promise<any>> = {
        '/dashboard': () => import('@/app/dashboard/page'),
        '/analytics': () => import('@/components/analytics/enhanced-analytics-dashboard'),
        // '/courses': () => import('@/app/courses/[courseId]/page'), // Module doesn't exist
        '/profile': () => import('@/app/dashboard/user/page'),
      };

      const importFn = routeMap[route];
      if (importFn) {
        await importFn();
        this.preloadedModules.add(route);
        logger.info(`[Preload] Successfully preloaded ${route}`);
      }
    } catch (error) {
      logger.error(`[Preload] Failed to preload ${route}:`, error as Error);
    }
  }

  static getStats() {
    return {
      preloadedModules: Array.from(this.preloadedModules),
      interactionCounts: Object.fromEntries(this.interactionCount),
    };
  }
}

export type { LazyComponentConfig };