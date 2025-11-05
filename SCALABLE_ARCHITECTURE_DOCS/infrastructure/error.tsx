'use client';

/**
 * Error Boundary for Course Page
 *
 * Catches and displays errors in a user-friendly way
 */

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function CourseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Course page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-4">
            Oops! Something went wrong
          </h1>

          {/* Description */}
          <p className="text-center text-slate-600 dark:text-slate-300 mb-8">
            We encountered an error while loading this course. This could be a temporary issue.
          </p>

          {/* Error details (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-8 p-4 bg-slate-100 dark:bg-slate-900 rounded-lg">
              <p className="text-sm font-mono text-red-600 dark:text-red-400 break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <RefreshCcw className="w-5 h-5" />
              Try Again
            </button>

            <Link
              href="/courses"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200"
            >
              <Home className="w-5 h-5" />
              Back to Courses
            </Link>
          </div>

          {/* Help text */}
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
            If this problem persists, please{' '}
            <Link
              href="/support"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              contact support
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
