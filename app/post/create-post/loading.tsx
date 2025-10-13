import { Loader2, Sparkles } from "lucide-react";

/**
 * Loading Component for Create Post Page
 * Shows while page is loading or authenticating
 */
export default function CreatePostLoading() {
  return (
    <div className="flex justify-center items-center py-10">
      <div className="min-h-[calc(100vh-8rem)] w-full max-w-6xl mx-auto bg-white/5 dark:bg-gray-900/5 border border-gray-100/10 dark:border-gray-800/10 backdrop-blur-sm rounded-xl overflow-hidden shadow-xl">
        {/* Header Skeleton */}
        <div className="px-6 md:px-10 pt-8 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-lg animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-6 w-24 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full animate-pulse" />
        </div>

        {/* Timeline Steps Skeleton */}
        <div className="flex items-center justify-center px-6 md:px-10 py-6">
          <div className="w-full max-w-md">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full animate-pulse" />
                  <div className="h-3 w-16 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="px-6 md:px-10 py-6">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-100/80 dark:border-gray-800/80 rounded-2xl shadow-xl overflow-hidden mx-auto w-full max-w-3xl">
            <div className="p-6 md:p-8 space-y-6">
              {/* Title Section */}
              <div className="space-y-3">
                <div className="h-6 w-48 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded animate-pulse" />
                <div className="h-4 w-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded animate-pulse" />
              </div>

              {/* Input Field */}
              <div className="h-14 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-xl animate-pulse" />

              {/* Categories Section */}
              <div className="space-y-3">
                <div className="h-5 w-32 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded animate-pulse" />
                <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-xl animate-pulse" />
              </div>

              {/* Button */}
              <div className="h-12 w-full md:w-48 md:ml-auto bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-xl animate-pulse" />
            </div>
          </div>

          {/* Inspiration Cards Skeleton */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 mx-auto w-full max-w-3xl">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-100/80 dark:border-gray-700/80 rounded-xl space-y-3"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-full animate-pulse" />
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded animate-pulse" />
                  <div className="h-3 w-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading Indicator */}
        <div className="flex items-center justify-center py-8 gap-3">
          <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Loading create post form...
          </span>
          <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
