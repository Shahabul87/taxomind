/**
 * Blog Loading Skeletons
 * Provides visual feedback during data loading
 */

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton for Blog Card
 * Matches the structure of MyPostCard
 */
export function BlogCardSkeleton() {
  return (
    <Card className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50 h-full flex flex-col">
      {/* Image Skeleton */}
      <div className="relative h-40 sm:h-44 w-full bg-slate-100 dark:bg-slate-700">
        <Skeleton className="w-full h-full" />

        {/* Category Badge Skeleton */}
        <div className="absolute top-2 left-2">
          <Skeleton className="h-6 w-20 rounded-lg" />
        </div>

        {/* Reading Time Badge Skeleton */}
        <div className="absolute top-2 right-2">
          <Skeleton className="h-6 w-16 rounded-lg" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 p-3 space-y-3">
        {/* Date */}
        <Skeleton className="h-3 w-24" />

        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-12 flex-1 rounded-lg" />
          <Skeleton className="h-12 flex-1 rounded-lg" />
        </div>
      </div>
    </Card>
  );
}

/**
 * Skeleton for Hero Section
 */
export function HeroSkeleton() {
  return (
    <div className="relative min-h-[85vh] flex flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="relative z-10 flex-1 flex items-center">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Skeleton className="h-12 w-32 mx-auto" />
            <Skeleton className="h-16 w-full mx-auto" />
            <Skeleton className="h-6 w-3/4 mx-auto" />

            <div className="flex justify-center gap-4 pt-4">
              <Skeleton className="h-12 w-40" />
              <Skeleton className="h-12 w-40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for Sidebar
 */
export function SidebarSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-32" />
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} className="p-4">
          <div className="flex gap-3">
            <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/**
 * Full Blog Page Loading State
 */
export function BlogPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <HeroSkeleton />

      <div className="container mx-auto px-4 py-12">
        {/* Filter Bar Skeleton */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-12 flex-1" />
            <Skeleton className="h-12 w-32" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-24" />
            ))}
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <BlogCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
