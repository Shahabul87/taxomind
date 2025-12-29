"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for the dashboard hero section
 */
export function DashboardHeroSkeleton() {
  return (
    <div
      className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      role="status"
      aria-label="Loading course information"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            {/* Breadcrumb skeleton */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16 bg-slate-700" />
              <Skeleton className="h-4 w-4 bg-slate-700" />
              <Skeleton className="h-4 w-24 bg-slate-700" />
            </div>

            {/* Title skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-10 w-3/4 bg-slate-700" />
              <Skeleton className="h-10 w-1/2 bg-slate-700" />
            </div>

            {/* Description skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full bg-slate-700" />
              <Skeleton className="h-4 w-5/6 bg-slate-700" />
              <Skeleton className="h-4 w-4/6 bg-slate-700" />
            </div>

            {/* Stats skeleton */}
            <div className="flex items-center gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full bg-slate-700" />
                  <Skeleton className="h-4 w-16 bg-slate-700" />
                </div>
              ))}
            </div>

            {/* Button skeleton */}
            <Skeleton className="h-12 w-48 rounded-lg bg-slate-700" />
          </div>

          {/* Right Content - Progress Circle */}
          <div className="flex justify-center lg:justify-end">
            <Skeleton className="h-64 w-64 rounded-full bg-slate-700" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading course hero section...</span>
    </div>
  );
}

/**
 * Loading skeleton for the quick actions row
 */
export function QuickActionsSkeleton() {
  return (
    <section
      className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
      role="status"
      aria-label="Loading quick actions"
    >
      {[1, 2, 3].map((i) => (
        <Card key={i} className="bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50 shadow-xl h-full">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
      <span className="sr-only">Loading quick actions...</span>
    </section>
  );
}

/**
 * Loading skeleton for the tab navigation
 */
export function TabNavigationSkeleton() {
  return (
    <nav
      className="mb-8"
      role="status"
      aria-label="Loading navigation"
    >
      <div className="flex flex-wrap gap-2 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700/50">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-32 rounded-lg" />
        ))}
      </div>
      <span className="sr-only">Loading navigation tabs...</span>
    </nav>
  );
}

/**
 * Loading skeleton for progress analytics
 */
export function ProgressAnalyticsSkeleton() {
  return (
    <section
      className="space-y-6"
      role="status"
      aria-label="Loading progress analytics"
    >
      <Card className="bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>

          {/* Progress Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>

          {/* Chapter Progress List */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-36 mb-4" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <span className="sr-only">Loading progress analytics...</span>
    </section>
  );
}

/**
 * Loading skeleton for achievements panel
 */
export function AchievementsPanelSkeleton() {
  return (
    <section
      className="space-y-6"
      role="status"
      aria-label="Loading achievements"
    >
      <Card className="bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20 rounded-lg" />
              <Skeleton className="h-9 w-20 rounded-lg" />
            </div>
          </div>

          {/* Achievement Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex flex-col items-center text-center space-y-3">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <span className="sr-only">Loading achievements...</span>
    </section>
  );
}

/**
 * Loading skeleton for course content navigation
 */
export function CourseContentSkeleton() {
  return (
    <section
      className="space-y-6"
      role="status"
      aria-label="Loading course content"
    >
      {/* Filter tabs skeleton */}
      <div className="flex gap-1 p-1 bg-white/80 dark:bg-slate-800/80 rounded-lg w-fit">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-md" />
        ))}
      </div>

      {/* Chapter cards skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((chapterIndex) => (
          <Card key={chapterIndex} className="bg-white/80 dark:bg-slate-800/80 border-slate-200/50 dark:border-slate-700/50">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-6 w-48" />
                  </div>
                  <Skeleton className="h-4 w-full max-w-md mb-3 ml-11" />
                  <div className="flex items-center gap-4 ml-11">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-2 w-32 rounded-full" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                </div>
                <Skeleton className="h-5 w-5 rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <span className="sr-only">Loading course content...</span>
    </section>
  );
}

/**
 * Loading skeleton for the smart sidebar
 */
export function SmartSidebarSkeleton() {
  return (
    <aside
      className="space-y-4"
      role="status"
      aria-label="Loading sidebar"
    >
      {/* Timer Card */}
      <Card className="bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-12 w-full rounded-lg mb-3" />
          <div className="flex justify-center gap-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </CardContent>
      </Card>

      {/* Quick Navigation */}
      <Card className="bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        <CardContent className="p-4">
          <Skeleton className="h-5 w-36 mb-4" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bookmarks */}
      <Card className="bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        <CardContent className="p-4">
          <Skeleton className="h-5 w-24 mb-4" />
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
      <span className="sr-only">Loading sidebar...</span>
    </aside>
  );
}

/**
 * Loading skeleton for the learning path
 */
export function LearningPathSkeleton() {
  return (
    <section
      className="space-y-6"
      role="status"
      aria-label="Loading learning path"
    >
      <Card className="bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>

          {/* Path visualization */}
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  {i < 4 && <Skeleton className="h-16 w-0.5 mt-2" />}
                </div>
                <div className="flex-1 pb-6">
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-full max-w-sm mb-2" />
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <span className="sr-only">Loading learning path...</span>
    </section>
  );
}

/**
 * Loading skeleton for streak tracker
 */
export function StreakTrackerSkeleton() {
  return (
    <Card
      className="bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50 shadow-xl"
      role="status"
      aria-label="Loading streak tracker"
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>

        {/* Streak display */}
        <div className="flex items-center justify-center py-6">
          <Skeleton className="h-20 w-20 rounded-full" />
        </div>

        {/* Week days */}
        <div className="flex justify-between px-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-3 w-6" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
      <span className="sr-only">Loading streak tracker...</span>
    </Card>
  );
}

/**
 * Loading skeleton for smart predictions
 */
export function SmartPredictionsSkeleton() {
  return (
    <Card
      className="bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50 shadow-xl"
      role="status"
      aria-label="Loading predictions"
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>

        {/* Prediction items */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <span className="sr-only">Loading predictions...</span>
    </Card>
  );
}

/**
 * Full page loading skeleton for the enterprise learning dashboard
 */
export function EnterpriseDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <DashboardHeroSkeleton />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 -mt-8 relative z-20">
        <QuickActionsSkeleton />
        <TabNavigationSkeleton />

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <main className="xl:col-span-3">
            <div className="space-y-8">
              <ProgressAnalyticsSkeleton />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SmartPredictionsSkeleton />
                <StreakTrackerSkeleton />
              </div>
            </div>
          </main>

          <aside className="xl:col-span-1 hidden xl:block">
            <div className="sticky top-24">
              <SmartSidebarSkeleton />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
