import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const SectionLoadingSkeleton = () => {
  return (
    <div className="min-h-screen bg-[hsl(var(--learning-surface))]">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            {/* Breadcrumbs skeleton */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20" />
              <span className="text-slate-400">/</span>
              <Skeleton className="h-4 w-32" />
              <span className="text-slate-400">/</span>
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
        </div>
        {/* Thin progress bar */}
        <div className="h-0.5 bg-slate-100 dark:bg-slate-800">
          <Skeleton className="h-full w-1/3" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 sm:px-6 py-6 lg:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Main Content Column */}
          <div className="xl:col-span-8 space-y-6">
            {/* Section Hero Skeleton */}
            <div className="pt-2 pb-6 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>

            {/* Video Player Skeleton */}
            <div className="rounded-xl overflow-hidden shadow-md">
              <div className="aspect-video w-full bg-slate-900">
                <Skeleton className="w-full h-full rounded-none" />
              </div>
            </div>

            {/* Navigation Row */}
            <div className="py-4 border-y border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-28 rounded-md" />
                <Skeleton className="h-9 w-36 rounded-md" />
                <Skeleton className="h-9 w-28 rounded-md" />
              </div>
            </div>

            {/* Content Tabs Skeleton */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-4">
                <Skeleton className="h-5 w-40 mb-1" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                {/* Tab buttons */}
                <div className="flex flex-wrap gap-1 mb-6 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-8 w-24 rounded-md" />
                  ))}
                </div>
                {/* Tab content placeholder */}
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 rounded-lg" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="xl:col-span-4 space-y-4">
            {/* Progress Card */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-8 w-16 rounded-md" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div>
                  <div className="flex justify-between mb-2">
                    <Skeleton className="h-3 w-14" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                  <Skeleton className="h-3 w-28 mt-1.5" />
                </div>
                <div className="flex gap-3 pt-2">
                  <Skeleton className="h-16 flex-1 rounded-md" />
                  <Skeleton className="h-16 flex-1 rounded-md" />
                </div>
              </CardContent>
            </Card>

            {/* Chapter Navigation */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-3 w-40 mt-1" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-3 space-y-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-md">
                      <Skeleton className="h-4 w-4 rounded-full flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-10 mt-0.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Links Card */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-3">
                <Skeleton className="h-8 w-full rounded-md" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
