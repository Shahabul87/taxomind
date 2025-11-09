import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const SectionLoadingSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f8fb] via-[#f4f6f9] to-[#f7f8fb] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
      {/* Ambient blur effects - matching login page */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/12 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/12 rounded-full blur-3xl" />

      <div className="relative z-10">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            {/* Breadcrumbs skeleton */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20" />
              <span className="text-gray-400">/</span>
              <Skeleton className="h-4 w-32" />
              <span className="text-gray-400">/</span>
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
        <div className="h-1 bg-slate-200/70 dark:bg-slate-700/70">
          <Skeleton className="h-full w-1/3" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Main Content Column */}
          <div className="xl:col-span-8 space-y-6">
            {/* Section Header Card */}
            <Card className="overflow-hidden bg-white/80 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
              <CardHeader className="p-6 bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-900/50 dark:to-slate-800/50">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <Skeleton className="h-8 w-16 mx-auto mb-2" />
                    <Skeleton className="h-4 w-20 mx-auto" />
                  </div>
                  <div className="text-center">
                    <Skeleton className="h-8 w-16 mx-auto mb-2" />
                    <Skeleton className="h-4 w-20 mx-auto" />
                  </div>
                  <div className="text-center">
                    <Skeleton className="h-8 w-16 mx-auto mb-2" />
                    <Skeleton className="h-4 w-20 mx-auto" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video Player Skeleton */}
            <Card className="bg-white/80 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
              <CardContent className="p-0">
                <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                  <Skeleton className="w-full h-full" />
                </div>
              </CardContent>
            </Card>

            {/* Content Tabs Skeleton */}
            <Card className="bg-white/80 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
              <CardHeader>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-10 w-24" />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <Skeleton className="h-32 w-full mt-4" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="xl:col-span-4 space-y-4">
            {/* Progress Card */}
            <Card className="bg-white/80 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardContent>
            </Card>

            {/* Chapter Navigation */}
            <Card className="bg-white/80 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resources Card */}
            <Card className="bg-white/80 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};