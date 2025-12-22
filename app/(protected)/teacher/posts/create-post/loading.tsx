/**
 * Loading Skeleton for Create Post Page
 * Matches the enterprise layout structure for seamless transitions
 */
export default function CreatePostLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28">
        {/* Header Skeleton */}
        <div className="mb-8">
          {/* Back Link */}
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded mb-6 animate-pulse" />

          {/* Title Section */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              <div className="h-5 w-80 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>

        {/* Progress Section Skeleton */}
        <div className="mb-8">
          <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                </div>
              </div>
              <div className="text-right space-y-1.5">
                <div className="h-7 w-12 bg-slate-200 dark:bg-slate-800 rounded ml-auto animate-pulse" />
                <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded ml-auto animate-pulse" />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />

            {/* Auto-save Indicator */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Main Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
          {/* Sidebar Skeleton */}
          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-6">
              {/* Steps Card */}
              <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5">
                <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded mb-4 animate-pulse" />
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips Card */}
              <div className="bg-amber-50/50 dark:bg-amber-950/10 rounded-2xl border border-amber-200/30 dark:border-amber-800/20 p-5">
                <div className="h-4 w-20 bg-amber-200/50 dark:bg-amber-800/30 rounded mb-3 animate-pulse" />
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-3 w-full bg-amber-200/50 dark:bg-amber-800/30 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Form Area Skeleton */}
          <main className="space-y-6">
            {/* Form Card */}
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
              {/* Card Header */}
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-5 w-36 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 space-y-8">
                {/* Title Field */}
                <div className="space-y-3">
                  <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                  <div className="flex justify-between">
                    <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  </div>
                </div>

                {/* Categories Field */}
                <div className="space-y-3">
                  <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="h-3 w-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                  <div className="flex gap-2">
                    <div className="h-10 flex-1 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                    <div className="h-10 w-12 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                  </div>
                </div>

                {/* Submit Area */}
                <div className="pt-4 flex justify-between items-center">
                  <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="h-11 w-40 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>

            {/* Coming Soon Card */}
            <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-8">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-14 h-14 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
                <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-6 w-28 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Sticky Footer Skeleton */}
      <div className="fixed bottom-0 inset-x-0 z-50">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                <div className="hidden sm:block space-y-1.5">
                  <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg hidden sm:block animate-pulse" />
                <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
