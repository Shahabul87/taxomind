/**
 * Analytics Skeleton Loading Component
 *
 * Provides a skeleton screen for analytics dashboard while data is loading.
 * Improves perceived performance by showing content structure immediately.
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AnalyticsSkeletonProps {
  /** Display variant - 'dashboard' or 'fullpage' */
  variant?: 'dashboard' | 'fullpage';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Skeleton shimmer animation component
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200 dark:bg-slate-700', className)}
      {...props}
    />
  );
}

/**
 * Analytics Dashboard Skeleton
 *
 * Shows a placeholder layout while analytics data loads.
 * Matches the actual dashboard structure for a seamless transition.
 *
 * @component
 * @example
 * ```tsx
 * {loading ? (
 *   <AnalyticsSkeleton variant="fullpage" />
 * ) : (
 *   <AnalyticsDashboard data={data} />
 * )}
 * ```
 */
export function AnalyticsSkeleton({ variant = 'dashboard', className }: AnalyticsSkeletonProps) {
  const isFullpage = variant === 'fullpage';

  return (
    <div
      className={cn(
        'space-y-6',
        isFullpage ? 'min-h-screen p-6' : 'p-4',
        className
      )}
      role="status"
      aria-label="Loading analytics data"
    >
      {/* Header skeleton */}
      {isFullpage && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      )}

      {/* Tab navigation skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-10 w-24 flex-shrink-0" />
        ))}
      </div>

      {/* Summary cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Chart 1 */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-3/4" />
                  </div>
                  <Skeleton className="h-6 w-12" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chart 2 */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Large chart skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-80 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>

      {/* Table skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Table header */}
            <div className="flex gap-4 pb-2 border-b">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
            {/* Table rows */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Screen reader announcement */}
      <span className="sr-only">Loading analytics dashboard, please wait...</span>
    </div>
  );
}

/**
 * Compact skeleton for embedded analytics widgets
 */
export function AnalyticsWidgetSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className} role="status" aria-label="Loading analytics widget">
      <CardHeader>
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
      <span className="sr-only">Loading widget data...</span>
    </Card>
  );
}
