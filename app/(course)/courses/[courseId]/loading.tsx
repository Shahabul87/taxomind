/**
 * Course Page Loading State
 *
 * Displays while the course page is being streamed from the server.
 * Provides instant feedback to users with skeleton screens.
 */

export default function CourseLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      {/* Hero Skeleton */}
      <div className="relative">
        <div className="h-96 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 w-full space-y-4">
            <div className="h-12 bg-white/30 dark:bg-slate-900/30 rounded-lg animate-pulse w-3/4" />
            <div className="h-6 bg-white/20 dark:bg-slate-900/20 rounded-lg animate-pulse w-1/2" />
            <div className="h-4 bg-white/20 dark:bg-slate-900/20 rounded-lg animate-pulse w-2/3" />
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="relative z-30 -mt-16 sm:-mt-20 md:-mt-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Tab Headers */}
            <div className="border-b border-slate-200 dark:border-slate-700 p-4">
              <div className="flex gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-8 space-y-4">
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-full" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-5/6" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-4/5" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-32 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Courses Skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-64 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg"
            >
              <div className="h-48 bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-full" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
