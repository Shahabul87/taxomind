"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const SectionLoadingSkeleton = () => {
  return (
    <div className={cn(
      "min-h-[100dvh] w-full overflow-x-hidden",
      "bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100",
      "dark:from-gray-900 dark:via-gray-900 dark:to-gray-800"
    )}>
      {/* Header Skeleton */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
        <div className="w-full sm:container sm:mx-auto px-0 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Breadcrumb Skeleton */}
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-28" />
            </div>

            {/* Actions Skeleton */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </div>

        {/* Progress Bar Skeleton */}
        <Skeleton className="h-1 w-full" />
      </div>

      {/* Main Content */}
      <div className="w-full sm:container sm:mx-auto px-0 sm:px-4 py-8">
        {/* Page Header Card Skeleton */}
        <Card className="border-0 shadow-xl mb-8">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <div>
                  <Skeleton className="h-8 w-64 mb-2" />
                  <Skeleton className="h-4 w-96" />
                </div>
              </div>

              <div className="flex flex-col items-end gap-4">
                <div className="text-right">
                  <Skeleton className="h-10 w-16 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-10 w-40" />
              </div>
            </div>

            {/* Metrics Skeleton */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-1">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Skeleton className="h-4 w-4 mb-1" />
                    <Skeleton className="h-6 w-8 mb-1" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="xl:col-span-1 space-y-6">
            {/* Configuration Card Skeleton */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
                <Skeleton className="h-px w-full" />
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
            </Card>

            {/* AI Assistant Card Skeleton */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div>
                    <Skeleton className="h-5 w-36 mb-1" />
                    <Skeleton className="h-4 w-52" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="p-4 rounded-lg border">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-5 w-5 mt-0.5" />
                        <div className="flex-1">
                          <Skeleton className="h-5 w-32 mb-1" />
                          <Skeleton className="h-4 w-full mb-3" />
                          <div className="flex gap-2">
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-8 w-24" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="xl:col-span-2 space-y-6">
            {/* Video Card Skeleton */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div>
                    <Skeleton className="h-5 w-28 mb-1" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full rounded-lg" />
                <div className="mt-4 flex gap-2">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </CardContent>
            </Card>

            {/* Interactive Content Card Skeleton */}
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div>
                    <Skeleton className="h-5 w-48 mb-1" />
                    <Skeleton className="h-4 w-72" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Tabs Skeleton */}
                <div className="w-full">
                  <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-10 flex-1" />
                    ))}
                  </div>
                  <div className="mt-8">
                    <Skeleton className="h-96 w-full rounded-lg" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Inline Loading Component for Section Updates
export const InlineLoadingState = ({ message = "Updating..." }: { message?: string }) => {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="flex items-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 dark:border-gray-100" />
        <span className="text-sm text-gray-600 dark:text-gray-400">{message}</span>
      </div>
    </div>
  );
};

// Content Block Loading Skeleton
export const ContentBlockSkeleton = () => {
  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-20" />
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
};

// Tab Content Loading Skeleton
export const TabContentSkeleton = () => {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <ContentBlockSkeleton key={i} />
      ))}
    </div>
  );
};
