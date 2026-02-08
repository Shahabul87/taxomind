/**
 * Loading Skeleton for Edit Post Page
 * Matches the violet/indigo design system
 */
export default function EditPostLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Back and Title */}
            <div className="flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="hidden sm:block">
                <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded mt-1 animate-pulse" />
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
              <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar Skeleton */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          </div>
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Left Column - Form Cards */}
          <div className="space-y-6">
            {/* Title Card Skeleton */}
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-500/10 animate-pulse" />
                  <div>
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded mt-1 animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              </div>
            </div>

            {/* Category Card Skeleton */}
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 animate-pulse" />
                  <div>
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded mt-1 animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="h-8 w-32 bg-emerald-500/10 rounded-full animate-pulse" />
              </div>
            </div>

            {/* Description Card Skeleton */}
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 animate-pulse" />
                  <div>
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded mt-1 animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-2">
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-4 w-4/6 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              </div>
            </div>

            {/* Image Card Skeleton */}
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-500/10 animate-pulse" />
                  <div>
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded mt-1 animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="aspect-video rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Progress Card Skeleton */}
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5">
                <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-4 animate-pulse" />
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Chapters Card Skeleton */}
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-12 bg-slate-100 dark:bg-slate-800/50 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              </div>

              {/* Tips Card Skeleton */}
              <div className="bg-violet-500/5 dark:bg-violet-500/10 border border-violet-500/20 rounded-xl p-5">
                <div className="h-4 w-16 bg-violet-500/20 rounded mb-3 animate-pulse" />
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-3 w-full bg-violet-500/10 rounded animate-pulse"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
